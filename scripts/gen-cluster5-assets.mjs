// Cluster 5 (Artisanal Flat Parchment Café UI) demo assets via gpt-image-1.
// Flat 2D watercolor botanical illustrations — opposite of every other cluster:
// no 3D, no shadow, no photographic realism.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Flat 2D watercolor illustration of a ${obj}, isolated subject. Hand-painted botanical illustration style: visible watercolor wash edges, soft paper grain texture, warm parchment undertone (#F5F0E6, #E8E0D0). Palette restricted to: muted sage green #5A8A6A, warm cream #F5F0E8, warm beige #F0E6DC, olive green #3D5A2E. No shading beyond watercolor wet-edge blooms. Zero cast shadow, zero 3D depth, zero specular highlight. Object centered, upright, contained within canvas — no boundary overflow. No shadow baked into canvas. DO NOT add 3D clay render style, neumorphic dual-shadow, photographic realism, dark forest-green studio backdrop, glossy or specular surfaces, or any vector/flat-fill illustration style (must read as hand-painted watercolor).`;

const ASSETS = [
  {
    name: 'coffee-plant-berries',
    obj:  'a sprig of coffee plant with red berries and a few green leaves, hand-painted watercolor botanical illustration',
  },
  {
    name: 'botanical-wreath',
    obj:  'a small circular botanical wreath of mixed culinary herbs (rosemary, thyme, sage) hand-painted in soft watercolor',
  },
];

const OUT_DIR = 'out/m31-10img-sonnet/m31-assets/cluster5-parchment';
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
