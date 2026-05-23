// pdx-gardener Cluster 3 apply — Chinese-vegetable cutouts.
// Reuses asset-generation.md §Cluster 3 prompt template (catalog photography)
// with Chinese-veggie {object} fills matching the actual market-card data.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Studio photograph cutout of a ${obj}, isolated subject. Clean catalog product photography style. Soft diffuse natural window light from upper-left, very minimal drop shadow (near-invisible, rgba(0,0,0,0.06)). Colors true-to-life, muted saturation. White or off-white (#FAFAF8) implied background tone — no color cast. Subject bottom-anchored — base of pot or stem base sits at ~80% from frame top, leaving room for foliage to extend upward. Clean silhouette edge suitable for compositing on a white card. No shadow baked into canvas. Accent colors if present: deep forest-green #1A3D2B or #4A7C59 foliage tones only. DO NOT add 3D clay render style, matte polymer clay texture, neumorphic dual-shadow, dark studio backdrop, parchment or watercolor treatment, or any illustrated/vector style.`;

const ASSETS = [
  { name: 'chili-seedling',   obj: 'young chili pepper seedling (朝天椒苗) with 4-6 small green leaves and a thin upright stem, planted in a small terracotta nursery pot, photographic catalog style' },
  { name: 'tomato-seedling',  obj: 'young cherry tomato seedling with 3 pairs of small serrated green leaves, planted in a black plastic nursery cup, photographic catalog style' },
  { name: 'mint-cutting',     obj: 'small apple mint plant cutting with about 6 fresh green leaves, planted in a simple white ceramic pot, photographic catalog style' },
];

const OUT_DIR = 'validation/pdx-apply-c3/assets';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set.'); process.exit(1); }

mkdirSync(OUT_DIR, { recursive: true });

async function generate(asset) {
  const start = Date.now();
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: PROMPT_TEMPLATE(asset.obj),
      size: '1024x1024',
      n: 1,
      background: 'transparent',
      output_format: 'png',
    }),
  });
  if (!r.ok) {
    console.error(`✗ ${asset.name} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) { console.error(`✗ ${asset.name}: no b64_json`); return; }
  const buf = Buffer.from(b64, 'base64');
  const out = join(OUT_DIR, `${asset.name}.png`);
  writeFileSync(out, buf);
  console.log(`✓ ${asset.name} → ${out} (${(buf.length / 1024).toFixed(0)} KB, ${((Date.now() - start) / 1000).toFixed(1)}s)`);
}

for (const a of ASSETS) await generate(a);
console.log('all done');
