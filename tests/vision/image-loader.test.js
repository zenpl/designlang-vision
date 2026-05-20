// Image loader tests using tiny PNG/JPEG fixtures written to a tmp dir.
// No real images on disk — just the minimal byte sequences.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadImages, isSupportedImage, resolveImagePaths } from '../../src/vision/image-loader.js';

// Smallest valid PNG: 1x1 transparent pixel
const TINY_PNG = Buffer.from(
  '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489' +
  '0000000D49444154789C626001000000050001A5F645400000000049454E44AE426082',
  'hex',
);

// Smallest valid JPEG: 1x1
const TINY_JPEG = Buffer.from(
  'FFD8FFE000104A46494600010100000100010000FFDB004300080606070605080707070909' +
  '080A0C140D0C0B0B0C1912130F141D1A1F1E1D1A1C1C20242E2720222C231C1C2837292C30' +
  '31343434271F3D4138323C2E333432FFDB0043010909090C0B0C180D0D1832211C2132323232' +
  '32323232323232323232323232323232323232323232323232323232323232323232323232' +
  '3232323232323232323232323232FFC00011080001000103012200021101031101FFC4001F' +
  '0000010501010101010100000000000000000102030405060708090A0BFFC400B510000201' +
  '0303020403050504040000017D01020300041105122131410613516107227114328191A108' +
  '23423B1C11552D1F02433627282090A161718191A25262728292A3435363738393A434445' +
  '464748494A535455565758595A636465666768696A737475767778797A8384858687888' +
  '98A92939495969798999AA2A3A4A5A6A7A8A9AAB2B3B4B5B6B7B8B9BAC2C3C4C5C6C7C8C9' +
  'CACBCDD2D3D4D5D6D7D8D9DAE1E2E3E4E5E6E7E8E9EAF1F2F3F4F5F6F7F8F9FAFFDA000C03' +
  '010002110311003F00FBD3FFD9',
  'hex',
);

let TMP_ROOT;

async function setupFixtures() {
  TMP_ROOT = await mkdtempIn(tmpdir(), 'designlang-vision-img-');
  await writeFile(join(TMP_ROOT, 'a.png'),  TINY_PNG);
  await writeFile(join(TMP_ROOT, 'b.jpg'),  TINY_JPEG);
  await writeFile(join(TMP_ROOT, 'c.JPEG'), TINY_JPEG); // case-insensitive extension
  await writeFile(join(TMP_ROOT, 'readme.txt'), 'not an image');
  return TMP_ROOT;
}

async function mkdtempIn(parent, prefix) {
  // Avoid mkdtemp's randomness in test output; use a deterministic-ish name.
  const dir = join(parent, `${prefix}${process.pid}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

after(async () => {
  if (TMP_ROOT) await rm(TMP_ROOT, { recursive: true, force: true });
});

test('isSupportedImage classifies by extension', () => {
  assert.equal(isSupportedImage('/x/y.png'),  true);
  assert.equal(isSupportedImage('/x/y.jpg'),  true);
  assert.equal(isSupportedImage('/x/y.JPEG'), true);
  assert.equal(isSupportedImage('/x/y.webp'), true);
  assert.equal(isSupportedImage('/x/y.txt'),  false);
  assert.equal(isSupportedImage('/x/y'),      false);
});

test('resolveImagePaths returns sorted supported files from a directory', async () => {
  const dir = await setupFixtures();
  const paths = await resolveImagePaths(dir);
  assert.equal(paths.length, 3, `expected 3, got ${paths.length}: ${paths.join(', ')}`);
  const filenames = paths.map((p) => p.split('/').pop());
  assert.deepEqual(filenames, ['a.png', 'b.jpg', 'c.JPEG']); // alpha-sorted, txt excluded
});

test('loadImages assigns deterministic ids and reads dimensions', async () => {
  const dir = await setupFixtures();
  const images = await loadImages(dir);
  assert.equal(images.length, 3);
  assert.deepEqual(images.map((i) => i.id), ['img_01', 'img_02', 'img_03']);
  // a.png is the 1x1 png
  const png = images.find((i) => i.filename === 'a.png');
  assert.equal(png.width, 1);
  assert.equal(png.height, 1);
  assert.equal(png.mimeType, 'image/png');
  assert.match(png.sha256, /^[0-9a-f]{64}$/);
  assert.ok(png.base64.length > 0);
});

test('loadImages enforces --max-images', async () => {
  const dir = await setupFixtures();
  await assert.rejects(
    () => loadImages(dir, { maxImages: 1 }),
    /exceeds --max-images=1/,
  );
});

test('loadImages on empty input throws clearly', async () => {
  const empty = await mkdtempIn(tmpdir(), 'designlang-vision-empty-');
  try {
    await assert.rejects(() => loadImages(empty), /No supported images found/);
  } finally {
    await rm(empty, { recursive: true, force: true });
  }
});
