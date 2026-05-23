// Generate Cluster 2 (Neumorphic Soft-Extrusion Mobile UI) demo assets
// via OpenAI gpt-image-1, using the prompt template the M3.1 asset emitter
// produced. Outputs transparent PNGs into the moodboard's m31-assets dir.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Studio photograph cutout of a ${obj}, isolated subject. Shot on a seamless white sweep, soft diffuse upper-left key light, no hard shadows, no rim light. Colors naturally saturated but muted — no color grading beyond desaturation toward cool-neutral grey palette (base tone #E8E8E8, #F2F2F4). Object centered, upright or slight 3/4 angle. Clean silhouette edge suitable for compositing over neumorphic surfaces. No shadow baked into canvas. DO NOT add 3D clay render style, matte polymer clay texture, watercolor washes, dark forest-green backgrounds, parchment texture, neumorphic dual-shadow on the object itself, or any illustrated/vector treatment.`;

const ASSETS = [
  {
    name: 'open-peony',
    obj:  'single open white peony flower in full bloom, fresh and dewy, three-quarter view showing petal layers',
  },
  {
    name: 'lavender-sprig',
    obj:  'small dried lavender sprig with a few stems and flower clusters, soft purple-grey tones, slightly faded',
  },
];

const OUT_DIR = 'out/m31-10img-sonnet/m31-assets/cluster2-neumorphic';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('OPENAI_API_KEY not set. Source .env.local first.');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

async function generate(asset) {
  const prompt = PROMPT_TEMPLATE(asset.obj);
  const start = Date.now();
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      n: 1,
      background: 'transparent',
      output_format: 'png',
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    console.error(`✗ ${asset.name} HTTP ${r.status}: ${txt.slice(0, 300)}`);
    return null;
  }

  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`✗ ${asset.name}: no b64_json`, JSON.stringify(j).slice(0, 200));
    return null;
  }

  const buf = Buffer.from(b64, 'base64');
  const out = join(OUT_DIR, `${asset.name}.png`);
  writeFileSync(out, buf);
  console.log(`✓ ${asset.name} → ${out} (${(buf.length / 1024).toFixed(0)} KB, ${((Date.now() - start) / 1000).toFixed(1)}s)`);
  return out;
}

for (const a of ASSETS) {
  await generate(a);
}
console.log('all done');
