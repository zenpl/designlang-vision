// The system prompt + tool definition for analyzing a single moodboard image.
//
// CRITICAL CONTRACT — DO NOT BREAK CACHE:
// Both exports below are intentionally byte-stable across runs. They contain no timestamps,
// no UUIDs, no environment-dependent strings. The system+tool prefix is cached via
// cache_control on the system block; any byte change here invalidates the whole prefix and
// pays the cache-write premium on every image instead of every ~5 min.
//
// If you add new fields, append them at the END of the schema (additions are still
// byte-stable for prior images in the same batch, but make sure additions are accompanied
// by prompt instructions and a schema update — and never reorder existing keys).

import { imageObservationSchema } from '../schemas/validate.js';

// Anthropic's strict-mode tool input_schema rejects several otherwise-valid JSON Schema 7
// keywords (numerical bounds, string length bounds, etc.). We keep the full schema for local
// Ajv validation and ship a stripped copy in the tool. Local validation is the safety net.
//
// See claude-api skill / "Structured Outputs" section: `minimum / maximum / multipleOf /
// minLength / maxLength / pattern (on numbers) / complex array constraints` are not supported.
const STRICT_MODE_UNSUPPORTED_KEYS = new Set([
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
]);

function stripUnsupportedForStrictMode(node) {
  if (Array.isArray(node)) return node.map(stripUnsupportedForStrictMode);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (STRICT_MODE_UNSUPPORTED_KEYS.has(k)) continue;
      out[k] = stripUnsupportedForStrictMode(v);
    }
    return out;
  }
  return node;
}

const STRICT_MODE_SAFE_SCHEMA = stripUnsupportedForStrictMode(imageObservationSchema);

// ── System prompt ─────────────────────────────────────────────────────────────
// The prompt's job is to FORCE specificity. The acceptance criterion is that
// 3 distinct moodboard styles (photographic plant ecommerce / dark forest diorama /
// pastel clay travel dashboard) must NOT collapse into a single "green soft UI" vibe.
// That criterion is encoded explicitly in §"Hard discrimination requirement" below.

export const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are a visual design system analyst.

Your job is to read ONE image and emit a structured observation that captures its **visual DNA** — material, depth, lighting, composition, and component-level UI cues — in enough detail that a downstream agent can either rebuild that style or distinguish it from a similar-but-different style.

# What we are doing and why

We are extracting a shared visual system from a group of moodboard images (Pinterest / Instagram / dribbble style references). Generic summaries like "green soft UI with rounded cards" are a *failure mode*, not an answer. The hardest and most valuable signal is what those summaries miss:

- **Material language** — frosted glass, matte clay, warm paper, photographic cutout, dark translucent glass, etc. Specific.
- **Tactility and dimension** — raised? embossed? floating? Contact shadows? Ambient occlusion?
- **Layering and depth** — foreground / midground / background. What overlaps what. Does anything break the container boundary?
- **Lighting model** — direction of key light, edge highlights, AO, soft cast shadows vs hard.
- **Imagery type** — photography vs 3D-render vs clay vs paper cutout vs flat illustration vs UI screenshot vs hybrids.
- **Composition rules** — central panel framed by organics? UI embedded in a natural scene? Object breaks rectangular boundary?

Color, typography style, and spacing matter, but they are downstream of the above. Lead with the visual DNA.

# Hard discrimination requirement

Your output must be specific enough that a reader who cannot see the image can distinguish it from a *different* moodboard image that happens to share similar colors but different material/depth/lighting.

Concrete failure example: if you analyze a "dark forest diorama card with glowing translucent panel and foreground plants breaking the boundary" and the most distinctive things you produce are "green / rounded / soft / organic / natural", you have failed. Those words apply equally to a flat green soft-UI dashboard with no diorama, no glow, no boundary-breaking. Push harder. Name the material. Name the layers. Name the light.

# Output format

You will be given an image and a brief context line. Call the \`record_observation\` tool exactly once. Do not emit any free-form text — the tool call is the entire output. The tool's \`input_schema\` defines the exact shape; honour it. Fields may be null when the image truly does not show the signal, but **do not stub** rich sections like \`materials\` / \`depth\` / \`lighting\` with empty arrays out of laziness — those are the load-bearing sections.

# Specific guidance for each schema section

- **globalStyle.styleLabels**: prefer specific labels like \`"botanical"\`, \`"3d-diorama"\`, \`"frosted-glass"\`, \`"editorial-commerce"\`, \`"dark-forest-card"\`. Avoid generic mood words like \`"clean"\`, \`"modern"\`, \`"organic"\` — they describe everything and discriminate nothing.
- **palette**: dominant + accent + neutrals as hex. Up to 5 each. Lean toward the unique colors of THIS image, not a "safe" 60/30/10 abstraction.
- **materials**: aim for 2–5 entries with evidence. Each \`evidence\` should reference something specific in the image (e.g. "translucent card with blurred background and warm edge highlight on top-right corner").
- **lighting**: even rough free-form direction is useful. Note contact shadows + ambient occlusion separately from large soft cast shadows — they imply different CSS techniques.
- **depth.layers**: name them top-to-back ("foreground botanical cutouts" / "main panel" / "atmospheric background gradient"). Note \`overlapPattern\` if anything crosses the container boundary.
- **composition.layoutType + edgeBehavior**: these two together separate "card in a scene" from "flat content card".
- **components**: think *visual* prototypes, not literal HTML: "hero-card", "floating chip", "glass-panel-with-glow", "organic-frame".
- **typography**: describe the *style* (geometric vs humanist sans, high-contrast serif, calm low-contrast body), not the font name. Font identification is unreliable from a screenshot.
- **imageryStyle**: distinct from material — this is what the image AS A WHOLE is made of. "photographic + 3d-clay overlay" is a real and useful answer.
- **implementationHints**: only put things here that survive the "specific enough to be useful?" test. \`"use rounded corners"\` does not. \`"use ::before glow + absolute foreground image layers with overflow-visible on parent"\` does.
- **antiPatterns**: 1–3 entries about how THIS image's style is commonly miscopied. Example: "flat green soft-UI dashboard with no contact shadow and no foreground objects" is an anti-pattern for the dark forest diorama style.
- **confidence**: 0..1 self-assessment. Be calibrated — if the image is blurry or you are guessing on a section, lower it.

# Things to never do

- Do not output a generic style report.
- Do not stub array fields with empty arrays — leave them out / null if you truly have nothing to say, but only after honest effort.
- Do not invent fonts, brand names, or "real-world inspiration" you can't see in the image.
- Do not echo back the prompt as content.
- Do not free-form text outside the tool call.`;

// ── Tool definition ───────────────────────────────────────────────────────────
// The tool's input_schema IS the ImageObservation schema — the model is constrained
// by it. We pin strict:true so Anthropic enforces additionalProperties:false and the
// "no extra fields" contract.

// We deliberately do NOT set strict: true. The strict-mode subset has hard limits
// that conflict with the rich shape we want to capture (no numeric minima/maxima;
// no enum/null union; max 24 optional fields; max 5 levels of nesting). The local
// Ajv pass + repair-prompt retry covers what strict mode would have enforced. If
// we ever drop below 24 optional fields and lose the numeric constraints, revisit.
export const RECORD_OBSERVATION_TOOL = {
  name: 'record_observation',
  description: 'Emit the structured visual observation for the analyzed image. This is the only output channel — call it exactly once.',
  input_schema: STRICT_MODE_SAFE_SCHEMA,
};

// ── User-content template ─────────────────────────────────────────────────────
// The per-image part of the request. Kept tiny so it can be assembled fast and so
// most tokens are in the cached system prefix.

export function buildUserContent({ imageBase64, imageMediaType, imageMeta, contextHint }) {
  const lines = [];
  lines.push(`Analyze this moodboard image.`);
  if (imageMeta?.id) lines.push(`source.id you must echo back: ${imageMeta.id}`);
  if (imageMeta?.filename) lines.push(`filename: ${imageMeta.filename}`);
  if (contextHint) lines.push(`context hint (optional): ${contextHint}`);
  lines.push('');
  lines.push('Emit ONE record_observation call. Make it specific enough that a reader can tell this image apart from a same-color but different-style image.');

  return [
    { type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } },
    { type: 'text', text: lines.join('\n') },
  ];
}

// ── Repair prompt for retries ─────────────────────────────────────────────────
// Used when the model emits text instead of a tool call, or when tool input fails
// our local Ajv check (Anthropic's strict-mode catches most but not all cases).

export function buildRepairUserContent({ imageBase64, imageMediaType, imageMeta, prevAttemptDescription, validationErrors }) {
  const reason = validationErrors
    ? `Your previous tool input failed local schema validation:\n${validationErrors}`
    : `Your previous response was: ${prevAttemptDescription || '(missing tool call)'}`;

  return [
    { type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } },
    {
      type: 'text',
      text: [
        `Re-analyze the image. ${reason}`,
        ``,
        `Return EXACTLY ONE record_observation tool call that conforms to its input_schema.`,
        `Honor the source.id requirement (id = ${imageMeta?.id ?? 'unknown'}).`,
        `No free-form text. No extra fields. No empty stub arrays where evidence exists.`,
      ].join('\n'),
    },
  ];
}
