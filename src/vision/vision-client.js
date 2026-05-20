// Thin Anthropic SDK wrapper for moodboard image analysis.
//
// Responsibilities:
// - One image, one tool-forced Anthropic call.
// - Prompt caching on system + tool prefix (5-min ephemeral TTL).
// - Retry-once on missing-tool-call / failed-schema with a repair prompt.
// - Return parsed observation + raw model metadata (usage, model id, etc.).
//
// Non-responsibilities (intentionally):
// - No clustering, no synthesis, no emission of any output file. crawl-moodboard.js does those.
// - No provider abstraction. We hold the M1 path single-provider on purpose — see
//   docs/vision/architecture.md §8.

import Anthropic from '@anthropic-ai/sdk';
import {
  IMAGE_ANALYSIS_SYSTEM_PROMPT,
  RECORD_OBSERVATION_TOOL,
  buildUserContent,
  buildRepairUserContent,
} from './prompts/image-analysis.js';
import {
  MOODBOARD_SYNTHESIS_SYSTEM_PROMPT,
  RECORD_MOODBOARD_DESIGN_TOOL,
  buildSynthesisUserContent,
  buildSynthesisRepairUserContent,
} from './prompts/moodboard-synthesis.js';
import {
  assertImageObservation,
  assertMoodboardDesign,
  formatValidationErrors,
  validateImageObservation,
  validateMoodboardDesign,
} from './schemas/validate.js';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 4096;
const SYNTHESIS_MAX_TOKENS = 8192; // synthesis output is larger — schema is richer

export class VisionClient {
  constructor({ apiKey, authToken, model = DEFAULT_MODEL, maxTokens = DEFAULT_MAX_TOKENS, anthropicClient = null } = {}) {
    if (!anthropicClient) {
      // Resolution order:
      //   1) explicit authToken arg / ANTHROPIC_AUTH_TOKEN env  → Bearer auth (OAuth access tokens, agent tokens)
      //   2) explicit apiKey arg / ANTHROPIC_API_KEY env, **but** if the value starts with `sk-ant-oat` it's actually
      //      an OAuth access token even though it was passed via the API_KEY slot → switch to Bearer auth.
      //   3) explicit apiKey arg / ANTHROPIC_API_KEY env → x-api-key auth (standard API keys)
      const explicitAuth = authToken ?? process.env.ANTHROPIC_AUTH_TOKEN;
      const explicitApi  = apiKey    ?? process.env.ANTHROPIC_API_KEY;

      let useToken = explicitAuth ?? null;
      let useApi   = explicitApi  ?? null;

      if (!useToken && useApi && /^sk-ant-oat/.test(useApi)) {
        useToken = useApi;
        useApi = null;
      }

      if (!useToken && !useApi) {
        throw new Error('No Anthropic credential found. Set ANTHROPIC_API_KEY (standard key) or ANTHROPIC_AUTH_TOKEN (OAuth/agent token).');
      }

      this.client = new Anthropic({ apiKey: useApi, authToken: useToken });
    } else {
      this.client = anthropicClient;
    }
    this.model = model;
    this.maxTokens = maxTokens;
  }

  /** Build the cacheable system + tools prefix. Byte-stable across calls within a run. */
  _stableRequest() {
    const req = {
      model: this.model,
      max_tokens: this.maxTokens,
      tools: [RECORD_OBSERVATION_TOOL],
      // Force the model to call our tool — never free text.
      tool_choice: { type: 'tool', name: RECORD_OBSERVATION_TOOL.name },
      // Place cache breakpoint on the last system block. Renders tools+system as one cache entry.
      system: [
        {
          type: 'text',
          text: IMAGE_ANALYSIS_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
    };

    // Sampling parameters are removed on Opus 4.7+ and return 400. Sonnet 4.6 / Haiku 4.5
    // still accept them. We use a low non-zero temperature for stable structured output;
    // omit it on opus-4-7. See claude-api skill / model-migration.md → Migrating to Opus 4.7.
    if (!/^claude-opus-4-7/.test(this.model)) {
      req.temperature = 0.2;
    }

    return req;
  }

  /**
   * Analyze one image. Returns { observation, raw, attempts, cacheUsage }.
   * Throws only if both initial + repair attempts fail.
   */
  async analyzeImage(imageMeta, { contextHint = null } = {}) {
    const stable = this._stableRequest();

    // ── Attempt 1 ──────────────────────────────────────────────────────────
    const firstReq = {
      ...stable,
      messages: [
        {
          role: 'user',
          content: buildUserContent({
            imageBase64: imageMeta.base64,
            imageMediaType: imageMeta.mimeType,
            imageMeta,
            contextHint,
          }),
        },
      ],
    };

    let resp = await this.client.messages.create(firstReq);
    let toolBlock = extractToolUseBlock(resp, RECORD_OBSERVATION_TOOL.name);
    let validationErrorsText = null;

    if (toolBlock) {
      const candidate = withSourceFromMeta(toolBlock.input, imageMeta);
      if (validateImageObservation(candidate)) {
        return packResult(candidate, resp, 1);
      }
      validationErrorsText = formatValidationErrors(validateImageObservation.errors);
    }

    // ── Attempt 2 — repair ─────────────────────────────────────────────────
    const repairReq = {
      ...stable,
      messages: [
        {
          role: 'user',
          content: buildRepairUserContent({
            imageBase64: imageMeta.base64,
            imageMediaType: imageMeta.mimeType,
            imageMeta,
            prevAttemptDescription: toolBlock
              ? `tool call with invalid input fields`
              : describeNonToolResponse(resp),
            validationErrors: validationErrorsText,
          }),
        },
      ],
    };

    resp = await this.client.messages.create(repairReq);
    toolBlock = extractToolUseBlock(resp, RECORD_OBSERVATION_TOOL.name);
    if (!toolBlock) {
      const err = new Error(`Model did not call record_observation after repair attempt (image ${imageMeta.id}).`);
      err.kind = 'no_tool_call';
      err.rawResponse = resp;
      throw err;
    }
    const candidate = withSourceFromMeta(toolBlock.input, imageMeta);
    assertImageObservation(candidate); // throws on second-attempt schema failure
    return packResult(candidate, resp, 2);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // M2: synthesize a MoodboardDesign across N observations.
  //
  // Same shape as analyzeImage: tool-forced JSON, repair-on-failure retry,
  // prompt caching on the (different) M2 system prompt + tool definition.
  // Note that the cache prefix is DIFFERENT from M1 — caches don't share.
  //
  // Input is text only (no images). Cost scales with observation count, not pixels.
  // ────────────────────────────────────────────────────────────────────────────
  _stableSynthesisRequest() {
    const req = {
      model: this.model,
      max_tokens: SYNTHESIS_MAX_TOKENS,
      tools: [RECORD_MOODBOARD_DESIGN_TOOL],
      tool_choice: { type: 'tool', name: RECORD_MOODBOARD_DESIGN_TOOL.name },
      system: [
        {
          type: 'text',
          text: MOODBOARD_SYNTHESIS_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
    };
    if (!/^claude-opus-4-7/.test(this.model)) {
      req.temperature = 0.2;
    }
    return req;
  }

  /**
   * Synthesize a MoodboardDesign across the given observations and heuristic clusters.
   * Returns { design, raw, attempts, cacheUsage }.
   */
  // ────────────────────────────────────────────────────────────────────────────
  // M3 helper: produce free-form markdown from a (cacheable) system prompt and a
  // (varying) user prompt. No tool-use, no schema — for emitters whose output IS
  // markdown text. Caches the system prompt so successive M3 emitters within one
  // run hit the same prefix.
  //
  // Returns { text, raw, cacheUsage }.
  // ────────────────────────────────────────────────────────────────────────────
  async generateMarkdown({ systemPrompt, userPrompt, maxTokens = 8192 }) {
    const req = {
      model: this.model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        { role: 'user', content: [{ type: 'text', text: userPrompt }] },
      ],
    };
    if (!/^claude-opus-4-7/.test(this.model)) {
      req.temperature = 0.4; // a touch more creative for narrative output
    }
    const resp = await this.client.messages.create(req);
    const text = (resp?.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return {
      text,
      raw: {
        model: resp?.model ?? null,
        id: resp?.id ?? null,
        stop_reason: resp?.stop_reason ?? null,
        usage: resp?.usage ?? null,
      },
      cacheUsage: {
        cache_creation_input_tokens: resp?.usage?.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens:     resp?.usage?.cache_read_input_tokens     ?? 0,
      },
    };
  }

  async synthesizeMoodboard({ observations, proposedClusters, name = 'moodboard' }) {
    if (!Array.isArray(observations) || observations.length === 0) {
      throw new Error('synthesizeMoodboard: observations[] must be non-empty.');
    }

    const stable = this._stableSynthesisRequest();

    // ── Attempt 1 ──────────────────────────────────────────────────────────
    const firstReq = {
      ...stable,
      messages: [
        {
          role: 'user',
          content: buildSynthesisUserContent({ observations, proposedClusters, name }),
        },
      ],
    };

    let resp = await this.client.messages.create(firstReq);
    let toolBlock = extractToolUseBlock(resp, RECORD_MOODBOARD_DESIGN_TOOL.name);
    let validationErrorsText = null;

    if (toolBlock) {
      const candidate = toolBlock.input;
      if (validateMoodboardDesign(candidate)) {
        return packSynthesisResult(candidate, resp, 1);
      }
      validationErrorsText = formatValidationErrors(validateMoodboardDesign.errors);
    }

    // ── Attempt 2 — repair ─────────────────────────────────────────────────
    const repairReq = {
      ...stable,
      messages: [
        {
          role: 'user',
          content: buildSynthesisRepairUserContent({
            observations,
            proposedClusters,
            name,
            prevAttemptDescription: toolBlock
              ? `tool call with invalid input fields`
              : describeNonToolResponse(resp),
            validationErrors: validationErrorsText,
          }),
        },
      ],
    };

    resp = await this.client.messages.create(repairReq);
    toolBlock = extractToolUseBlock(resp, RECORD_MOODBOARD_DESIGN_TOOL.name);
    if (!toolBlock) {
      const err = new Error(`Model did not call record_moodboard_design after repair attempt.`);
      err.kind = 'no_tool_call';
      err.rawResponse = resp;
      throw err;
    }
    assertMoodboardDesign(toolBlock.input);
    return packSynthesisResult(toolBlock.input, resp, 2);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function extractToolUseBlock(resp, expectedToolName) {
  if (!resp?.content) return null;
  for (const block of resp.content) {
    if (block.type === 'tool_use' && block.name === expectedToolName) return block;
  }
  return null;
}

function describeNonToolResponse(resp) {
  const textBlock = resp?.content?.find?.((b) => b.type === 'text');
  if (textBlock?.text) return `text response: ${textBlock.text.slice(0, 200)}...`;
  return `(stop_reason=${resp?.stop_reason ?? 'unknown'} with no tool_use)`;
}

/** Ensure source.id / source.path / source.filename / source.width / source.height
 *  are filled from the loader metadata, in case the model only echoed source.id. */
function withSourceFromMeta(modelInput, meta) {
  const merged = { ...modelInput };
  const src = { ...(merged.source ?? {}) };
  src.id        = meta.id;
  src.path      = meta.path     ?? src.path     ?? null;
  src.filename  = meta.filename ?? src.filename ?? null;
  src.width     = meta.width    ?? src.width    ?? null;
  src.height    = meta.height   ?? src.height   ?? null;
  src.sha256    = meta.sha256   ?? src.sha256   ?? null;
  merged.source = src;
  return merged;
}

function packResult(observation, rawResponse, attempts) {
  return {
    observation,
    raw: {
      model: rawResponse?.model ?? null,
      id: rawResponse?.id ?? null,
      stop_reason: rawResponse?.stop_reason ?? null,
      usage: rawResponse?.usage ?? null,
    },
    attempts,
    cacheUsage: {
      cache_creation_input_tokens: rawResponse?.usage?.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens:     rawResponse?.usage?.cache_read_input_tokens     ?? 0,
    },
  };
}

function packSynthesisResult(design, rawResponse, attempts) {
  return {
    design,
    raw: {
      model: rawResponse?.model ?? null,
      id: rawResponse?.id ?? null,
      stop_reason: rawResponse?.stop_reason ?? null,
      usage: rawResponse?.usage ?? null,
    },
    attempts,
    cacheUsage: {
      cache_creation_input_tokens: rawResponse?.usage?.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens:     rawResponse?.usage?.cache_read_input_tokens     ?? 0,
    },
  };
}
