// M1 + M2 orchestration:
//   M1: load images → analyze each with VisionClient → write <name>-observations.json
//   M2: cluster observations heuristically → synthesize MoodboardDesign → write <name>-moodboard-analysis.json
//
// M2 runs by default when ≥2 observations succeed. Skip with { m1Only: true }.
// To skip M1 entirely and only synthesize from a prior observations.json,
// pass { observationsFile: '<path>' }.
//
// Sequential per-image (parallelism = 1) for M1 to maximize prompt-cache reuse.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadImages } from './image-loader.js';
import { VisionClient, DEFAULT_MODEL } from './vision-client.js';
import { clusterObservations, pairwiseMatrix } from './cluster.js';

/**
 * @typedef {Object} CrawlOptions
 * @property {string}   input         path / dir / glob
 * @property {string}   outDir        directory for outputs (created if absent)
 * @property {string}   name          file prefix for outputs
 * @property {string}   [model]       default 'claude-sonnet-4-6'
 * @property {string}   [apiKey]      overrides ANTHROPIC_API_KEY env (standard API key)
 * @property {string}   [authToken]   overrides ANTHROPIC_AUTH_TOKEN env (OAuth/agent token, sk-ant-oat*)
 * @property {number}   [maxImages]   safety cap; default 30 for M1
 * @property {boolean}  [m1Only]      skip M2 synthesis; just emit observations.json
 * @property {string}   [observationsFile] skip M1; load observations from this file and only run M2
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
    authToken,
    maxImages = 30,
    m1Only = false,
    observationsFile = null,
    onProgress = () => {},
  } = opts;

  if (!name)   throw new Error('crawlMoodboard: `name` is required.');
  if (!outDir) throw new Error('crawlMoodboard: `outDir` is required.');
  if (!input && !observationsFile) throw new Error('crawlMoodboard: `input` or `observationsFile` is required.');

  const absOutDir = resolve(outDir);
  await mkdir(absOutDir, { recursive: true });
  const m1OutPath = join(absOutDir, `${name}-observations.json`);
  const m2OutPath = join(absOutDir, `${name}-moodboard-analysis.json`);

  // The vision client lazy-builds only when an API call is actually needed,
  // so an --observations-file run on a prior file doesn't require credentials
  // for stages it isn't going to invoke.
  let clientLazy = null;
  const getClient = () => (clientLazy ??= new VisionClient({ apiKey, authToken, model }));

  // ──────────────────────────────────────────────────────────────────────────
  // Stage M1 — either run live vision or load from prior observations.json
  // ──────────────────────────────────────────────────────────────────────────
  let m1Payload;
  if (observationsFile) {
    onProgress({ stage: 'load_observations', file: observationsFile });
    m1Payload = JSON.parse(await readFile(resolve(observationsFile), 'utf-8'));
    if (!Array.isArray(m1Payload?.observations)) {
      throw new Error(`crawlMoodboard: ${observationsFile} does not contain an .observations[] array.`);
    }
    onProgress({ stage: 'load_observations_done', count: m1Payload.observations.length });
  } else {
    m1Payload = await runM1({
      input, name, model, maxImages,
      onProgress, getClient,
      m1OutPath,
    });
  }

  const observations = m1Payload.observations ?? [];

  // ──────────────────────────────────────────────────────────────────────────
  // Stage M2 — heuristic cluster + LLM synthesis, unless suppressed
  // ──────────────────────────────────────────────────────────────────────────
  let m2Payload = null;
  if (!m1Only && observations.length >= 2) {
    m2Payload = await runM2({
      observations, name, model,
      onProgress, getClient,
    });
    await writeFile(m2OutPath, JSON.stringify(m2Payload, null, 2), 'utf-8');
    onProgress({ stage: 'm2_write_done', outPath: m2OutPath });
  } else if (m1Only) {
    onProgress({ stage: 'm2_skipped', reason: 'm1Only flag set' });
  } else {
    onProgress({ stage: 'm2_skipped', reason: `only ${observations.length} successful observations (<2)` });
  }

  return {
    outPath: m2Payload ? m2OutPath : m1OutPath,
    m1OutPath,
    m2OutPath: m2Payload ? m2OutPath : null,
    payload: m1Payload,   // back-compat: callers reading .payload._run still work
    m1: m1Payload,
    m2: m2Payload,
  };
}

// ── stage runners ──────────────────────────────────────────────────────────────

async function runM1({ input, name, model, maxImages, onProgress, getClient, m1OutPath }) {
  // 1. Load images.
  onProgress({ stage: 'load', input });
  const images = await loadImages(input, { maxImages });
  onProgress({ stage: 'load_done', count: images.length });

  // 2. Analyze each image with the vision client.
  const client = getClient();

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

  const finishedAt = new Date();

  const m1Payload = {
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

  await writeFile(m1OutPath, JSON.stringify(m1Payload, null, 2), 'utf-8');
  onProgress({ stage: 'write_done', outPath: m1OutPath, successCount: observations.length, errorCount: errors.length });

  return m1Payload;
}

async function runM2({ observations, name, model, onProgress, getClient }) {
  onProgress({ stage: 'm2_cluster_start', count: observations.length });
  const proposedClusters = clusterObservations(observations);
  const similarityMatrix = pairwiseMatrix(observations);
  onProgress({ stage: 'm2_cluster_done', clusters: proposedClusters.length });

  onProgress({ stage: 'm2_synth_start', clusters: proposedClusters.length });
  const startedAt = new Date();
  const client = getClient();
  const { design, raw, attempts, cacheUsage } = await client.synthesizeMoodboard({
    observations, proposedClusters, name,
  });
  const finishedAt = new Date();
  onProgress({ stage: 'm2_synth_done', attempts, cacheUsage, durationMs: finishedAt - startedAt });

  return {
    _schemaVersion: 'moodboard-design.schema.json/v1',
    _stage: 'M2',
    _run: {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt - startedAt,
      model,
      name,
      observationCount: observations.length,
      attempts,
      cacheUsage,
      raw: { model: raw.model, id: raw.id, stop_reason: raw.stop_reason, usage: raw.usage },
    },
    heuristic: {
      proposedClusters,
      similarityMatrix,
    },
    design,
  };
}

