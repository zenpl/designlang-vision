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

- It is a single Markdown document. ≤ 200 lines.
- It starts with a \`# Build in the "<styleThesis>" style\` title.
- It contains, in order:

  1. **Style identity** — one paragraph. Name the thesis, the clusters, and what the moodboard is for.
  2. **Cluster mix** — table or short list. Each cluster: name, weight, sourceIds, dnaSummary. Tells the receiving agent that this is a multi-style system, not a single look.
  3. **Universal MUST and MUST-NOT** — pulled from consensus.implementationRules where supportSourceIds count is high (≥ 70% of sources). State each as one bold imperative line, no paragraph fluff.
  4. **Cluster-bound rules** — for each cluster, list the implementationHints / localClaims that apply ONLY to that cluster (e.g. "Diorama: overflow:visible on cards"). Say plainly when a rule for one cluster contradicts another.
  5. **Tokens to use** — small grouped lists: colors, borderRadius, shadow. Quote real hex / rgba values from \`design.tokens\`. Use the synthesizer's token names verbatim — those names are part of the contract.
  6. **CSS recipes to call** — list each \`design.recipes\` entry by its class name (slug rule: \`.vrec-<key-slugified>\`). Group by cluster. For each, one line: "use \`.vrec-foo\` for X".
  7. **Anti-patterns** — short list of what would BREAK the style. Pull from cluster localClaims that say "wrong" or "do not", and from common failure modes (e.g. averaging all clusters into one bland "soft green" aesthetic).
  8. **How to choose a cluster for a new screen** — 3–5 sentences. When the new screen is a marketing splash, lean into Cluster X; when it's a dashboard, lean into Cluster Y. Etc. Use the moodboard's actual clusters.

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
    maxTokens: 4096,
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
