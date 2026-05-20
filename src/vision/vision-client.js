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
import { assertImageObservation, formatValidationErrors, validateImageObservation } from './schemas/validate.js';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 4096;

export class VisionClient {
  constructor({ apiKey, model = DEFAULT_MODEL, maxTokens = DEFAULT_MAX_TOKENS, anthropicClient = null } = {}) {
    if (!anthropicClient && !apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set. Pass --api-key or export ANTHROPIC_API_KEY.');
    }
    this.client = anthropicClient ?? new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = model;
    this.maxTokens = maxTokens;
  }

  /** Build the cacheable system + tools prefix. Byte-stable across calls within a run. */
  _stableRequest() {
    return {
      model: this.model,
      max_tokens: this.maxTokens,
      // Light temperature: we want stable structured output, not creative spread.
      temperature: 0.2,
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
    let toolBlock = extractToolUseBlock(resp);
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
    toolBlock = extractToolUseBlock(resp);
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
}

// ── helpers ──────────────────────────────────────────────────────────────────

function extractToolUseBlock(resp) {
  if (!resp?.content) return null;
  for (const block of resp.content) {
    if (block.type === 'tool_use' && block.name === RECORD_OBSERVATION_TOOL.name) return block;
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
