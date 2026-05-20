// Image loader for the moodboard pipeline.
// Accepts a single file, directory, or glob; returns deterministically-ordered
// ImageMeta records (id, path, filename, ext, mimeType, width/height, base64).
//
// Scope (M1): jpg/jpeg/png/webp from local filesystem only. No URLs, no PDFs, no Figma exports.

import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, extname, basename, join } from 'node:path';
import { glob } from 'node:fs/promises';
import imageSize from 'image-size';

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MIME_BY_EXT = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
};

export function isSupportedImage(path) {
  return SUPPORTED_EXTS.has(extname(path).toLowerCase());
}

/**
 * Resolve a user-supplied input (file / dir / glob) into a sorted list of absolute paths.
 * Sort is alphabetical ascending — gives deterministic id assignment across runs.
 */
export async function resolveImagePaths(input) {
  const absInput = resolve(input);
  let candidates;

  // Try as plain path first (file or directory)
  let statErr = null;
  try {
    const st = await stat(absInput);
    if (st.isFile()) {
      candidates = [absInput];
    } else if (st.isDirectory()) {
      const entries = await readdir(absInput);
      candidates = entries.map((e) => join(absInput, e));
    } else {
      candidates = [];
    }
  } catch (e) {
    statErr = e;
    candidates = null;
  }

  // Fall back to glob if stat failed (or returned nothing useful)
  if (!candidates || candidates.length === 0) {
    candidates = [];
    try {
      for await (const entry of glob(input, { cwd: process.cwd() })) {
        candidates.push(resolve(entry));
      }
    } catch (globErr) {
      // If even glob failed AND we never had a real path, throw the original stat error
      if (statErr && candidates.length === 0) throw statErr;
      throw globErr;
    }
  }

  const filtered = candidates.filter(isSupportedImage);
  filtered.sort((a, b) => a.localeCompare(b));
  return filtered;
}

/** Assign stable ids based on sorted position. */
function makeId(index) {
  return `img_${String(index + 1).padStart(2, '0')}`;
}

/**
 * Read a single image into an ImageMeta record (incl. base64 payload).
 * Throws on unsupported extension or unreadable file.
 */
export async function loadImage(path, index) {
  const ext = extname(path).toLowerCase();
  if (!MIME_BY_EXT[ext]) {
    throw new Error(`Unsupported image type "${ext}" for ${path}. Supported: ${[...SUPPORTED_EXTS].join(', ')}.`);
  }

  const buf = await readFile(path);

  // Dimensions are best-effort — failure is non-fatal (model still sees the image).
  let dim = null;
  try {
    dim = imageSize(buf);
  } catch {
    dim = null;
  }

  const sha256 = createHash('sha256').update(buf).digest('hex');

  return {
    id: makeId(index),
    path,
    filename: basename(path),
    ext,
    mimeType: MIME_BY_EXT[ext],
    width:  dim?.width  ?? null,
    height: dim?.height ?? null,
    sha256,
    base64: buf.toString('base64'),
    byteLength: buf.length,
  };
}

/** Resolve + load. Convenience entry point used by crawl-moodboard. */
export async function loadImages(input, { maxImages = 50 } = {}) {
  const paths = await resolveImagePaths(input);
  if (paths.length === 0) {
    throw new Error(`No supported images found at ${input}. Supported extensions: ${[...SUPPORTED_EXTS].join(', ')}.`);
  }
  if (paths.length > maxImages) {
    throw new Error(
      `${paths.length} images matched, exceeds --max-images=${maxImages}. ` +
      `Narrow the input or raise the cap. (M1 prefers ≤30 per run.)`,
    );
  }
  const out = [];
  for (let i = 0; i < paths.length; i++) {
    out.push(await loadImage(paths[i], i));
  }
  return out;
}
