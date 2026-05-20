// M1 orchestration: load images → analyze each with VisionClient → write <name>-observations.json.
// Sequential (parallelism = 1) for M1 to maximize prompt-cache reuse and minimize rate-limit noise.
// Parallelism + clustering arrive in M2.

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadImages } from './image-loader.js';
import { VisionClient, DEFAULT_MODEL } from './vision-client.js';

/**
 * @typedef {Object} CrawlOptions
 * @property {string}   input         path / dir / glob
 * @property {string}   outDir        directory for outputs (created if absent)
 * @property {string}   name          file prefix for outputs
 * @property {string}   [model]       default 'claude-sonnet-4-6'
 * @property {string}   [apiKey]      overrides ANTHROPIC_API_KEY env
 * @property {number}   [maxImages]   safety cap; default 30 for M1
 * @property {(evt:object)=>void} [onProgress]  optional per-image callback for spinner/logging
 */

/** @param {CrawlOptions} opts */
export async function crawlMoodboard(opts) {
  const {
    input,
    outDir,
    name,
    model = DEFAULT_MODEL,
    apiKey,
    maxImages = 30,
    onProgress = () => {},
  } = opts;

  if (!name)   throw new Error('crawlMoodboard: `name` is required.');
  if (!outDir) throw new Error('crawlMoodboard: `outDir` is required.');
  if (!input)  throw new Error('crawlMoodboard: `input` is required.');

  // 1. Load images.
  onProgress({ stage: 'load', input });
  const images = await loadImages(input, { maxImages });
  onProgress({ stage: 'load_done', count: images.length });

  // 2. Analyze each image with the vision client.
  const client = new VisionClient({ apiKey, model });

  const observations = [];
  const errors = [];
  const cacheStats = { creation: 0, read: 0, perImage: [] };
  const startedAt = new Date();

  for (let i = 0; i < images.length; i++) {
    const meta = images[i];
    onProgress({ stage: 'analyze_start', index: i, total: images.length, id: meta.id, filename: meta.filename });
    try {
      const { observation, raw, attempts, cacheUsage } = await client.analyzeImage(meta);
      observations.push({ ...observation, _meta: { ...raw, attempts } });
      cacheStats.creation += cacheUsage.cache_creation_input_tokens;
      cacheStats.read     += cacheUsage.cache_read_input_tokens;
      cacheStats.perImage.push({ id: meta.id, ...cacheUsage });
      onProgress({ stage: 'analyze_done', index: i, total: images.length, id: meta.id, attempts, cacheUsage });
    } catch (e) {
      errors.push({ id: meta.id, filename: meta.filename, message: e.message, kind: e.kind ?? 'unknown' });
      onProgress({ stage: 'analyze_error', index: i, total: images.length, id: meta.id, error: e.message });
    }
  }

  // 3. Write <name>-observations.json.
  const absOutDir = resolve(outDir);
  await mkdir(absOutDir, { recursive: true });
  const outPath = join(absOutDir, `${name}-observations.json`);

  const finishedAt = new Date();

  const payload = {
    _schemaVersion: 'image-observation.schema.json/v1',
    _stage: 'M1',
    _run: {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt - startedAt,
      model,
      input,
      name,
      imageCount: images.length,
      successCount: observations.length,
      errorCount: errors.length,
      cacheStats,
    },
    sources: images.map((m) => ({
      id: m.id,
      path: m.path,
      filename: m.filename,
      width: m.width,
      height: m.height,
      mimeType: m.mimeType,
      sha256: m.sha256,
      byteLength: m.byteLength,
    })),
    observations,
    errors,
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  onProgress({ stage: 'write_done', outPath, successCount: observations.length, errorCount: errors.length });

  return { outPath, payload };
}
