// LLM emitter: MoodboardDesign → one-page pasteable prompt for Cursor / Claude Code.
//
// The reader is another agent (or a developer using one) who will be asked to
// build a screen IN the moodboard's style. The output of this emitter is the
// prompt they paste to their agent. It must:
//
//   1. State the style identity (thesis + the cluster mix)
//   2. State the cluster-bound rules — which CSS recipes apply per cluster
//   3. Spell out specific MUST and MUST-NOT rules (matte vs glassmorphism,
//      overflow:visible for boundary-breaking clusters, etc.)
//   4. Reference token names + recipe class names by exact slug so the agent
//      can use them verbatim
//
// Length budget: ≤ 200 lines markdown. The whole point is "paste-friendly".

const SYSTEM_PROMPT = `You are writing a single Cursor / Claude Code prompt that another agent will paste into a coding session. The prompt's job is to inform that agent how to build screens in a specific moodboard's style.

# Rules of the prompt you're writing

- It is a single Markdown document. ≤ 260 lines (was 200 — the extra budget goes to the new Integration and Layout sections).
- It starts with a \`# Build in the "<styleThesis>" style\` title.
- It contains, in order:

  1. **Style identity** — one paragraph. Name the thesis, the clusters, and what the moodboard is for.
  2. **Cluster mix** — table or short list. Each cluster: name, weight, sourceIds, dnaSummary. Tells the receiving agent that this is a multi-style system, not a single look.
  3. **Universal MUST and MUST-NOT** — pulled from consensus.implementationRules where supportSourceIds count is high (≥ 70% of sources). State each as one bold imperative line, no paragraph fluff.
  4. **Cluster-bound rules** — for each cluster, list the implementationHints / localClaims that apply ONLY to that cluster. Say plainly when a rule for one cluster contradicts another.

     **Each cluster must also include a concrete LAYOUT SKETCH paragraph** — typical card dimensions, where decorative elements go (top-left? bottom-right? side?), recommended grid structure (1-column? 2-column with copy left + visual right?), padding, and how many secondary tiles/objects float inside. Borrow concrete coordinates from \`design.recipes\` when the synthesizer already provided them; otherwise describe the layout in pixel/percentage ranges (e.g. "card 720–900px wide, 480–600px tall, 64px padding, 2-col grid 5:7 ratio"). The layout description should be specific enough that another agent can build a page without seeing the source images. **Do not skip the layout for any cluster** — Cluster 3's existing \`top: -24px; left: 50%\` placement is the template; every cluster deserves equivalent concreteness.

     **Layout sketches must include**:
     - **Responsive breakpoints** when the sketch offers a choice (e.g. "1×4 row on ≥768px, 2×2 grid below"); never leave "1×4 OR 2×2" ambiguous.
     - **Collision warning** if the sketch positions two elements absolutely (e.g. decorative overflow AND a bottom-right CTA disc): name them and say which takes priority. Layout coords are starting dimensions, not complete component specs — flag overlaps a developer will hit.
     - **Surface-texture hint** for the soft / flat clusters (parchment, paper, watercolor): "for visual authenticity at small sizes, optionally overlay a 6px radial-dot paper-grain pattern at rgba(<text-color>, 0.05–0.08) on the parchment surface — the watercolor's own paper texture may be too subtle on small UI elements".

  5. **Tokens to use** — small grouped lists: colors, borderRadius, shadow. Quote real hex / rgba values from \`design.tokens\`. Use the synthesizer's token names verbatim — those names are part of the contract.
  6. **CSS recipes to call** — list each \`design.recipes\` entry by its class name (slug rule: \`.vrec-<key-slugified>\`). Group by cluster. For each entry: one line "use \`.vrec-foo\` for X" **plus a 5-line minimal HTML skeleton** showing the typical structure inside that recipe (what child elements, what tokens, what other recipe classes nest inside). The skeleton is fenced as \`\`\`html\`. Keep skeletons minimal — they are not full components, just the structural seed.
  7. **Anti-patterns** — short list of what would BREAK the style. Pull from cluster localClaims that say "wrong" or "do not", and from common failure modes (e.g. averaging all clusters into one bland "soft green" aesthetic).
  8. **How to choose a cluster for a new screen** — 3–5 sentences. When the new screen is a marketing splash, lean into Cluster X; when it's a dashboard, lean into Cluster Y. Etc. Use the moodboard's actual clusters.
  9. **Integration** — short, per-framework. State how to drop \`recipes.css\` + \`tailwind.config.js\` + \`design-tokens.json\` into a project. Cover at minimum:
     - **Plain HTML**: \`<link rel="stylesheet" href="recipes.css">\` works directly; load tailwind via build or CDN.
     - **Vite + Tailwind**: place \`recipes.css\` in the project's \`public/\` directory (NOT \`@import\` from src CSS — Vite's PostCSS pipeline silently drops the @import). Link from \`index.html\`. tailwind.config.js works as-is once \`content\` glob points at the project source.
     - **Next.js (App Router)**: \`import './recipes.css'\` from \`app/layout.tsx\`. tailwind.config.js drops into project root.
     - State the \`content\` glob explicitly so users on Tailwind v3 see "0 classes generated" only if THEIR source paths differ from the emitted default. The emitted config already includes \`./{src,app,pages,components}/**\` and \`./index.html\`.
  10. **Assets** — one paragraph + a pointer. The moodboard depends on visual assets (3D clay props for Cluster 1, photographic cutouts for Cluster 3, watercolor illustrations for Cluster 5, etc.). Demo assets ship with this output in \`<name>-assets/<cluster-slug>/\` (if generated). For more assets, see the sibling file \`asset-generation.md\` for per-cluster image-gen prompt templates ready to paste into DALL-E, Midjourney, Flux, etc.

# Voice

- Imperative. "Use ...", "Never ...", "Pick from ...". This is a brief, not an essay.
- Specific. Refer to tokens and recipes by their exact names.
- Don't restate the JSON. Reference it by name.
- DO NOT output anything that isn't part of the prompt itself. No "Here is your prompt:", no preamble, no commentary. The first line is the \`#\` title.`;

const SLUG = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export async function emitImplementationPromptMd(visionClient, design, _opts = {}) {
  const userPrompt = buildUserPrompt(design);
  return visionClient.generateMarkdown({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    // 8192 to fit the expanded structure (per-cluster layout sketches + HTML
    // skeletons per recipe + Integration + Assets sections). The original
    // 4096 truncated implementation.md mid-document on the 10-image moodboard.
    maxTokens: 8192,
  });
}

function buildUserPrompt(design) {
  const slugMap = Object.fromEntries(
    Object.keys(design.recipes || {}).map((k) => [k, '.vrec-' + SLUG(k)]),
  );
  return [
    `Produce the pasteable implementation prompt for the moodboard below.`,
    ``,
    `Receipt class-name slugs (use these in section 6):`,
    '```json',
    JSON.stringify(slugMap, null, 2),
    '```',
    ``,
    `MoodboardDesign JSON:`,
    '```json',
    JSON.stringify(design, null, 2),
    '```',
  ].join('\n');
}
