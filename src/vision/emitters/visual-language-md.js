// LLM emitter: MoodboardDesign → narrative markdown describing the design system.
//
// Section order (locked — Style Thesis first, tokens later):
//   1. Style Thesis
//   2. Source Cluster Map
//   3. Shared Visual DNA
//   4. Material System
//   5. Depth & Layering
//   6. Lighting & Shadow Model
//   7. Composition Patterns
//   8. Component Translation
//   9. Tokens (colors / radius / shadow / typography)
//   10. Recipes (cluster-scoped)
//   11. Anti-patterns

const SYSTEM_PROMPT = `You are a visual design system writer. You produce narrative markdown that explains a moodboard's design language to a developer or designer who will implement it. The reader has the structured \`MoodboardDesign\` JSON but wants a readable digest.

# Section order (DO NOT change)

1. **Style Thesis** — one sentence describing the moodboard as a whole. Use \`design.styleThesis\` verbatim or expand minimally.
2. **Source Cluster Map** — bullet list of clusters with their name, weight%, source ids, and a one-line dnaSummary.
3. **Shared Visual DNA** — 3–6 sentences. What ALL clusters share (drawn from consensus claims with high support count). NOT a list of bullets — prose.
4. **Material System** — table or rich list. For each consensus.materials entry: label, evidence, supportSourceIds count, confidence. Note where the consensus splits per cluster (e.g. "matte across all; specifically clay in cluster X, parchment in cluster Y").
5. **Depth & Layering** — explain consensus.depth claims, plus per-cluster differences (some clusters use overflow breaking, others strict-contain).
6. **Lighting & Shadow Model** — consensus.lighting claims. Note that some clusters have flat lighting and others directional.
7. **Composition Patterns** — consensus components + how each cluster lays things out.
8. **Component Translation** — for each major UI element (card, button, hero, navigation), say what cluster's variant should be used in what context.
9. **Tokens** — small organized blocks (color / borderRadius / shadow / typography). Don't restate every value; show the structure and the most-used named tokens.
10. **Recipes** — group CSS recipes by cluster. Reference them by their .vrec-* class name (slug of recipe key, e.g. \`recipes.clayCard\` → \`.vrec-claycard\`).
11. **Anti-patterns** — what NOT to do, explicitly. Pull from any anti-pattern hints in cluster localClaims, and from common failure modes the prose should warn against (e.g. "do not collapse the three clusters into one 'modern soft green' aesthetic — they have different material languages").

# Voice & format

- Markdown only. Use \`#\` for the title, \`##\` for each numbered section.
- Specific, not vibey. Name material types, not adjectives.
- Quote concrete values (hex, rgba) when relevant.
- Reference cluster names verbatim from the JSON — they're already specific.
- Keep total length around 400–800 lines. Long enough to be useful, short enough to read.
- DO NOT output anything that isn't part of the markdown document. No commentary, no "Here's the report:", no closing notes. The first line must be the \`#\` title.`;

const SLUG = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * @param {VisionClient} visionClient
 * @param {object} design — MoodboardDesign
 * @param {object} opts
 * @returns {Promise<{ text:string, cacheUsage:object, raw:object }>}
 */
export async function emitVisualLanguageMd(visionClient, design, _opts = {}) {
  const userPrompt = buildUserPrompt(design);
  const result = await visionClient.generateMarkdown({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 8192,
  });
  return result;
}

function buildUserPrompt(design) {
  const trimmed = trimDesignForPrompt(design);
  return [
    `Produce the visual-language.md document for the moodboard below.`,
    ``,
    `Follow the 11-section order in the system prompt exactly. The first line must be the \`#\` title.`,
    ``,
    `Use these slug rules for cross-references:`,
    `- Recipe ${'`'}<key>${'`'} → CSS class ${'`'}.vrec-${SLUG('<key>')}${'`'}`,
    `- Cluster name slug for @layer recipes-cluster-<slug>`,
    ``,
    `MoodboardDesign JSON:`,
    '```json',
    JSON.stringify(trimmed, null, 2),
    '```',
  ].join('\n');
}

// Drop noisy metadata fields from the design before sending — keeps the prompt
// focused on the design content rather than usage telemetry / etc.
function trimDesignForPrompt(design) {
  const d = { ...design };
  return d;
}
