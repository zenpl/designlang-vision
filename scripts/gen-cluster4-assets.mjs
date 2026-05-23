// Cluster 4 (Dark Forest-Green Botanical Product Showcase) demo assets
// via OpenAI gpt-image-1. Unlike C1/C2/C3, these are BAKED-IN dark green
// background (NOT transparent) — the studio backdrop IS the asset.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Semi-realistic 3D render (or studio photograph) of a ${obj}, staged against a flat matte dark forest-green background (#1A3D2B), no gradient, no texture on background. Lighting: soft diffuse upper-left key light, warm fill from lower-right, soft penumbra cast shadow on background surface. Object has natural material realism (subsurface scattering on leaves permitted). Warm gold-cream (#C8A84B, #E8D5B0) highlights or accents if present in object. Object centered, slight upward break from lower edge as if erupting from frame. Flat matte dark-green background (#1A3D2B) baked in — NOT transparent. Shadow baked onto background surface. DO NOT use transparent background, clay matte polymer texture, neumorphic dual-shadow, parchment or watercolor treatment, flat vector illustration, white or light-grey backgrounds, or glossy/specular product-shot style.`;

const ASSETS = [
  {
    name: 'tropical-plant-roots',
    obj:  'lush tropical philodendron with broad leaves and visible aerial roots, large statement size, semi-realistic 3D-rendered',
  },
  {
    name: 'pampas-vase',
    obj:  'tall ceramic vase in warm cream tone holding dried pampas grass with soft beige plumes, elegant editorial composition',
  },
];

const OUT_DIR = 'out/m31-10img-sonnet/m31-assets/cluster4-darkstudio';
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
      // NB: no `background: transparent` here — Cluster 4 explicitly bakes the
      // dark-green backdrop into the image. This is the only cluster that does.
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
