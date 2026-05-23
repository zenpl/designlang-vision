// Generate Cluster 1 (Matte Clay 3D Botanical Diorama UI) demo assets
// via OpenAI gpt-image-1, using the prompt template the M3.1 asset emitter
// produced. Outputs transparent PNGs into the moodboard's m31-assets dir.
//
// Usage:
//   set -a && source .env.local && set +a
//   node scripts/gen-cluster1-assets.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROMPT_TEMPLATE = (obj) => `Matte 3D-clay render of a ${obj}, isolated subject, sculpted from unglazed polymer clay — completely matte, zero specular highlight, zero gloss, zero subsurface scattering. Palette restricted to: sage green #88C4A0, peach-coral #F4A070, warm cream #F5F0E8, warm beige #F0E6DC. Lighting: soft diffuse upper-left key light, no specular highlight, no rim light. Contact shadow directly beneath object only, very soft penumbra. Object centered, slight 3/4 top-down angle revealing clay thickness. No shadow baked into canvas — contact shadow only at object base. DO NOT add specular highlights, glossy reflections, subsurface scattering, photorealistic textures, watercolor washes, flat vector illustration style, neumorphic dual-shadow, or dark backgrounds.`;

const ASSETS = [
  {
    name: 'monstera-leaf',
    obj:  'single monstera leaf with characteristic perforations, sage green clay with subtle cream highlight along the central spine, slight curl at the tip, stem visible at the bottom',
  },
  {
    name: 'terracotta-pot',
    obj:  'small terracotta-coral clay flowerpot with one tender sage-green sprout poking out the top, simple round vase shape',
  },
  {
    name: 'fern-frond',
    obj:  'paper-cutout style layered fern frond, multiple sage and cream layered leaflets along a central stem, viewed from slightly above',
  },
];

const OUT_DIR = 'out/m31-10img-sonnet/m31-assets/cluster1-clay-diorama';
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
    console.error(`✗ ${asset.name}: no b64_json in response`, JSON.stringify(j).slice(0, 200));
    return null;
  }

  const buf = Buffer.from(b64, 'base64');
  const out = join(OUT_DIR, `${asset.name}.png`);
  writeFileSync(out, buf);
  const ms = Date.now() - start;
  console.log(`✓ ${asset.name} → ${out} (${(buf.length / 1024).toFixed(0)} KB, ${(ms / 1000).toFixed(1)}s)`);
  return out;
}

for (const a of ASSETS) {
  await generate(a);
}
console.log('all done');
