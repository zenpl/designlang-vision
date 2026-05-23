// LLM emitter: MoodboardDesign → per-cluster image-gen prompt templates
// (DALL-E / Midjourney / Flux / Stable Diffusion).
//
// Why: each cluster has a different MATERIAL identity for its visual assets —
// Cluster 1 wants matte 3D-clay renders, Cluster 3 wants studio photo cutouts,
// Cluster 5 wants watercolor illustrations. A single generic prompt won't
// produce on-brand assets across clusters. This emitter writes a markdown file
// with one prompt template per cluster, each with placeholders the user fills
// in (the {object}) and on-brand constraints baked in (lighting, palette,
// material, background, output format).
//
// The emitter is LLM-driven: it reads the MoodboardDesign and lets sonnet/opus
// write the prompts tuned to the specific moodboard's vocabulary, rather than
// us hand-coding a generic template. The synthesizer already knows what
// material each cluster uses; we ask it to translate that into image-gen
// instructions.

const SYSTEM_PROMPT = `You are writing image-generation prompt templates for a moodboard's visual asset pipeline. Output: a single Markdown document with one prompt template per cluster.

# What the reader will do with this

A developer or agent needs to populate visual assets (3D clay leaves, photographic plant cutouts, watercolor illustrations, etc.) that the moodboard's recipes call for. They will:
1. Copy a template from this document
2. Replace \`{object}\` with the specific thing they need (e.g. "monstera leaf", "ceramic mug", "cinnamon stick")
3. Paste into DALL-E 3, Midjourney, Flux Pro, or Stable Diffusion XL
4. Get an asset matching that cluster's material/style identity

# Per-cluster prompt template structure

For EACH cluster in the moodboard, emit a \`## Cluster N — <name>\` section containing:

1. **Material identity** — one sentence describing the asset language this cluster uses (matte clay 3D / studio photo cutout / watercolor illustration / etc.). Pull from cluster.dnaSummary + cluster.localClaims.
2. **Reusable prompt template** — fenced \`\`\`text block. Includes:
   - "{object}" placeholder
   - the specific material/medium ("matte 3D-clay render of …" or "studio photograph of …")
   - lighting spec from cluster (e.g. "soft diffuse upper-left key light, no specular highlight")
   - color palette: 2–4 specific hex values from \`design.tokens\` that this cluster uses
   - composition: isolated, no background, centered
   - output format constraints: "transparent PNG, square 1024×1024, no shadow baked in (we'll add cast shadow via CSS)"
   - explicit "DO NOT" lines for the material the cluster forbids (e.g. for Cluster 1: "DO NOT add specular highlights, glossy reflections, photorealism, or vector illustration style")
3. **Example fills** — 3–5 example {object} values that fit this cluster (e.g. for Cluster 1: "monstera leaf, terracotta pot with sprout, cinnamon stick, glass jar with grain"). These should be objects that match the cluster's source-image vocabulary, not arbitrary.
4. **Provider-specific tweaks** — 2–3 short bullets noting how to adapt the prompt for DALL-E vs Midjourney vs Flux (e.g. "DALL-E 3: prepend 'A studio product shot of a'; Midjourney: append \`--ar 1:1 --no background\`; Flux Pro: add 'transparent background, isolated subject' since Flux is less reliable with no-bg phrasing").

# Hard requirements

- Every cluster gets a template. Even Cluster 5 if its assets are illustrations (not 3D).
- Use the moodboard's actual color hex values from \`design.tokens\`, not invented colors.
- Use the moodboard's actual lighting language from \`design.consensus.lighting\` + per-cluster overrides.
- "DO NOT" lines must explicitly forbid OTHER clusters' material languages (so a Cluster 1 prompt forbids photographic plant cutouts, and a Cluster 5 prompt forbids 3D clay).
- Output format: always transparent PNG, square, with the cluster's specific dimensions if relevant.
- The whole document is ≤ 250 lines.
- First line: \`# Asset generation prompts for <styleThesis>\`.

# Things to never do

- Don't output a generic catch-all template that ignores cluster differences.
- Don't suggest assets that contradict the moodboard's anti-patterns.
- Don't invent visual elements (Maria-style headshots, animals, etc.) that aren't in the moodboard's vocabulary.
- Don't emit any preamble or commentary outside the Markdown. First line is the \`#\` title.`;

const SLUG = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * @param {VisionClient} visionClient
 * @param {object} design — MoodboardDesign
 * @param {object} [opts]
 * @returns {Promise<{ text: string, raw: object, cacheUsage: object }>}
 */
export async function emitAssetPromptsMd(visionClient, design, _opts = {}) {
  const userPrompt = buildUserPrompt(design);
  return visionClient.generateMarkdown({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 6144,
  });
}

function buildUserPrompt(design) {
  const slugByCluster = Object.fromEntries(
    (design.clusters || []).map((c) => [c.name, SLUG(c.name)]),
  );
  return [
    `Produce the per-cluster image-generation prompt templates for the moodboard below.`,
    ``,
    `Cluster slugs (so prompts can reference asset directories like \`<name>-assets/<slug>/\`):`,
    '```json',
    JSON.stringify(slugByCluster, null, 2),
    '```',
    ``,
    `MoodboardDesign JSON:`,
    '```json',
    JSON.stringify(design, null, 2),
    '```',
  ].join('\n');
}
