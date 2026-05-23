// Cluster 3 (Editorial Botanical Commerce, Light Background) demo assets
// via OpenAI gpt-image-1. Photographic plant cutouts in clean catalog
// style — suitable for compositing over white/off-white product cards.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Studio photograph cutout of a ${obj}, isolated subject. Clean catalog product photography style. Soft diffuse natural window light from upper-left, very minimal drop shadow (near-invisible, rgba(0,0,0,0.06)). Colors true-to-life, muted saturation. White or off-white (#FAFAF8) implied background tone — no color cast. Object centered, slight upward tilt so top of object would overflow a card boundary when composited. No shadow baked into canvas. Accent colors if present: deep forest-green #1A3D2B or #4A7C59 foliage tones only. DO NOT add 3D clay render style, matte polymer clay texture, neumorphic dual-shadow, dark studio backdrop, parchment or watercolor treatment, or any illustrated/vector style.`;

const ASSETS = [
  { name: 'snake-plant',         obj: 'snake plant (sansevieria) with tall upright variegated leaves in a small minimal white ceramic pot' },
  { name: 'monstera-ceramic',    obj: 'small monstera deliciosa with two glossy split leaves in a clean white round ceramic pot' },
  { name: 'pothos-trailing',     obj: 'trailing golden pothos cutting in a small clear glass propagation vessel, leaves cascading downward' },
];

const OUT_DIR = 'out/m31-10img-sonnet/m31-assets/cluster3-editorial';
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
