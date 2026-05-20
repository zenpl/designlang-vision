// M3 emission orchestration. Walks a MoodboardDesign through the 5 emitters
// and writes the files. Template emitters run synchronously; LLM emitters run
// in parallel (independent inputs, both go to same model).

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { emitTokensJSONString } from './tokens-json.js';
import { emitTailwindConfig }    from './tailwind-config.js';
import { emitRecipesCss }        from './recipes-css.js';
import { emitVisualLanguageMd }  from './visual-language-md.js';
import { emitImplementationPromptMd } from './implementation-prompt-md.js';

/**
 * Emit the 5 M3 files from a MoodboardDesign.
 *
 * @param {object} args
 * @param {object} args.design       — MoodboardDesign
 * @param {string} args.outDir       — output directory (created if absent)
 * @param {string} args.name         — file prefix
 * @param {VisionClient} args.visionClient — required for the 2 LLM emitters
 * @param {(evt:object)=>void} [args.onProgress]
 * @returns {Promise<{outputs:{[name]:string}, cacheUsage:object, durationMs:number}>}
 */
export async function emitFromDesign({ design, outDir, name, visionClient, onProgress = () => {} }) {
  if (!design)     throw new Error('emitFromDesign: design is required.');
  if (!outDir)     throw new Error('emitFromDesign: outDir is required.');
  if (!name)       throw new Error('emitFromDesign: name is required.');

  const absOut = resolve(outDir);
  await mkdir(absOut, { recursive: true });
  await mkdir(join(absOut, `${name}-prompts`), { recursive: true });

  const startedAt = Date.now();
  const outputs = {};
  const cacheUsage = { creation: 0, read: 0 };

  // ── Template emitters: synchronous, deterministic, free ──────────────────
  onProgress({ stage: 'm3_template_start' });

  const tokensPath = join(absOut, `${name}-design-tokens.json`);
  await writeFile(tokensPath, emitTokensJSONString(design), 'utf-8');
  outputs['design-tokens.json'] = tokensPath;

  const tailwindPath = join(absOut, `${name}-tailwind.config.js`);
  await writeFile(tailwindPath, emitTailwindConfig(design), 'utf-8');
  outputs['tailwind.config.js'] = tailwindPath;

  const recipesPath = join(absOut, `${name}-recipes.css`);
  await writeFile(recipesPath, emitRecipesCss(design), 'utf-8');
  outputs['recipes.css'] = recipesPath;

  onProgress({ stage: 'm3_template_done', files: ['design-tokens.json', 'tailwind.config.js', 'recipes.css'] });

  // ── LLM emitters: parallel ────────────────────────────────────────────────
  if (!visionClient) {
    throw new Error('emitFromDesign: visionClient required for LLM emitters (visual-language.md, implementation prompt). Pass --m3-templates-only to skip.');
  }

  onProgress({ stage: 'm3_llm_start' });

  // Sequential, not parallel: easier to attribute failures, avoids concurrent rate
  // limit pressure on Anthropic, and lets the 2nd call pick up the cached system
  // prompt from the 1st (different prompt, but both Markdown — see note below).
  // The cache prefix isn't shared between the two emitters because they use
  // different system prompts; running sequential is only an attribution win.
  const visualResult = await withRetryOnConnError(() => emitVisualLanguageMd(visionClient, design));
  const promptResult = await withRetryOnConnError(() => emitImplementationPromptMd(visionClient, design));

  const visualPath = join(absOut, `${name}-visual-language.md`);
  await writeFile(visualPath, ensureTrailingNewline(visualResult.text), 'utf-8');
  outputs['visual-language.md'] = visualPath;

  const promptPath = join(absOut, `${name}-prompts`, 'implementation.md');
  await writeFile(promptPath, ensureTrailingNewline(promptResult.text), 'utf-8');
  outputs['prompts/implementation.md'] = promptPath;

  cacheUsage.creation += visualResult.cacheUsage.cache_creation_input_tokens + promptResult.cacheUsage.cache_creation_input_tokens;
  cacheUsage.read     += visualResult.cacheUsage.cache_read_input_tokens     + promptResult.cacheUsage.cache_read_input_tokens;

  onProgress({
    stage: 'm3_llm_done',
    files: ['visual-language.md', 'prompts/implementation.md'],
    cacheUsage,
    visual: { rawId: visualResult.raw.id, model: visualResult.raw.model },
    prompt: { rawId: promptResult.raw.id, model: promptResult.raw.model },
  });

  return {
    outputs,
    cacheUsage,
    durationMs: Date.now() - startedAt,
  };
}

function ensureTrailingNewline(s) {
  return /\n$/.test(s) ? s : s + '\n';
}

// Anthropic's SDK retries 429/5xx automatically but not always APIConnectionError.
// One manual retry on connection-class errors covers the brief network glitches we
// were seeing on M3 LLM emitter calls.
async function withRetryOnConnError(fn) {
  try {
    return await fn();
  } catch (e) {
    const msg = String(e?.message ?? '');
    const isConn = /Connection error|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
    if (!isConn) throw e;
    await new Promise((r) => setTimeout(r, 2000));
    return fn();
  }
}
