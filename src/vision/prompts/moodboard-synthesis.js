// System prompt + tool for the M2 synthesis call: many per-image ImageObservations →
// one MoodboardDesign with clusters[] and consensus.
//
// Same caching-stable contract as image-analysis.js — no timestamps, no UUIDs, byte-stable.

import { moodboardDesignSchema } from '../schemas/validate.js';

const STRICT_MODE_UNSUPPORTED_KEYS = new Set([
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems',
  'minProperties', 'maxProperties',
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

const STRICT_MODE_SAFE_SCHEMA = stripUnsupportedForStrictMode(moodboardDesignSchema);

export const MOODBOARD_SYNTHESIS_SYSTEM_PROMPT = `You are a visual design system synthesizer.

You are given N structured observations of moodboard images (one per image, schema-validated). Your job is to produce ONE \`MoodboardDesign\` that captures the moodboard's shared visual DNA without averaging away its sub-theses.

# The cardinal discipline: cluster before consensus

A moodboard of, say, 12 images often spans 2–3 distinct sub-styles that happen to share a color palette or a mood word. The failure mode you must avoid is **averaging incompatible images into a single bland thesis**. If three images are "dark forest diorama cards" and one is "flat editorial commerce" and another is "pastel clay travel dashboard", the moodboard does NOT have a single consensus material language — it has three.

Therefore:

1. **Identify clusters first.** Group images by what they share with each other AND differentiate from the others — material language, depth language, lighting, composition rules. Cluster names must be SPECIFIC (e.g. "Pastel Clay Botanical Dashboard"), not vibe words ("Modern", "Soft", "Natural").
2. **Then extract consensus.** Only put a claim in \`consensus.*\` if it is supported by ≥2 images and ideally ≥2 clusters. **Every consensus claim MUST carry \`supportSourceIds\` listing the specific observation ids that ground it.** A claim without grounding is a hallucination; the schema rejects it.
3. **If a claim holds only within one cluster, put it in that cluster's \`localClaims\`, not in consensus.** This is the difference between "the moodboard's DNA" and "this corner of the moodboard's DNA".

You will receive a heuristic-proposed clustering as a starting point. The heuristic uses styleLabels Jaccard + material Jaccard + LAB color distance. It is a hint, not a ground truth. You may merge, split, or rename clusters as the observations warrant — but justify the change implicitly through the cluster names and \`dnaSummary\`.

# Section-level guidance

- **styleThesis**: ≤ 80 chars. The phrase that describes the moodboard as a whole. Specific, not generic. "Botanical Dimensional UI with Editorial Commerce overlay" is good. "Soft modern green design" is the failure mode.
- **clusters[]**: between 1 and \`sourceCount\`. Each has a specific name, \`sourceIds\` (subset of the inputs), \`weight\` (sum across clusters = 1.0), and \`dnaSummary\` saying what makes this cluster NOT like the others.
- **clusters[].localClaims**: claims that hold inside this cluster but didn't qualify for consensus. These are the moodboard's sub-style facts.
- **consensus.materials / lighting / depth / palette / components / implementationRules**: each entry is a \`supportedClaim\` with mandatory \`supportSourceIds\` + optional \`supportClusterNames\` + optional \`confidence\`. If a claim only appears in 1 image, do NOT include it in consensus — move it to that cluster's localClaims.
- **tokens**: a draft of design tokens (color, font, spacing) that the moodboard suggests. Free-form object. Be conservative; M3 emitters will refine. Reasonable to leave empty if signal is thin.
- **recipes**: draft CSS recipes for the consensus material / depth / lighting patterns. Free-form object. Same: conservative.
- **confidence**: overall + per-cluster, on [0,1]. Be calibrated. If clusters disagree on material language and you're forcing them under one thesis, overall confidence should drop.

# Hard requirements (the synthesizer will be rejected without these)

- Every entry in \`consensus.*\` has a non-empty \`supportSourceIds\` array referencing real observation ids.
- Every \`clusters[].sourceIds\` entry must be a real observation id from the input.
- \`clusters[].weight\` values sum to (approximately) 1.0.
- Cluster names and the styleThesis are specific labels, not vibe words.

# Things to never do

- Do NOT invent observation ids. If the input has \`img_01, img_02, img_03\`, use only those.
- Do NOT collapse 3 different material languages into "rounded soft surfaces" and put that in consensus.
- Do NOT emit claims you can't ground in \`supportSourceIds\`.
- Do NOT emit free-form text outside the tool call. Call \`record_moodboard_design\` exactly once.
- Do NOT echo the prompt back as content.`;

export const RECORD_MOODBOARD_DESIGN_TOOL = {
  name: 'record_moodboard_design',
  description: 'Emit the final structured MoodboardDesign synthesizing all per-image observations into a clustered design system. Call once.',
  input_schema: STRICT_MODE_SAFE_SCHEMA,
};

/** Builds the user-content for one synthesis call: observations + heuristic clusters as JSON text. */
export function buildSynthesisUserContent({ observations, proposedClusters, name = 'moodboard' }) {
  const trimmedObservations = observations.map(stripMetaFromObservation);
  const payload = {
    moodboardName: name,
    sourceCount: observations.length,
    observations: trimmedObservations,
    heuristicClustersProposed: proposedClusters,
    note: 'Heuristic clusters are a starting point. You may merge, split, or rename them. Final cluster decisions should reflect what the observations actually say, not the heuristic.',
  };

  const text = [
    `Synthesize the following moodboard into a MoodboardDesign.`,
    ``,
    `Source count: ${observations.length}`,
    `Heuristic proposed clusters: ${proposedClusters.length}`,
    ``,
    `Full input (observations + heuristic clusters) below as JSON:`,
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    ``,
    `Call record_moodboard_design exactly once. Honor supportSourceIds on every consensus claim.`,
  ].join('\n');

  return [{ type: 'text', text }];
}

/** Builds the repair-prompt for a retry when the first synthesis failed schema. */
export function buildSynthesisRepairUserContent({ observations, proposedClusters, name, validationErrors, prevAttemptDescription }) {
  const reason = validationErrors
    ? `Your previous tool input failed schema validation:\n${validationErrors}`
    : `Your previous response was: ${prevAttemptDescription || '(no tool call)'}`;

  return [
    {
      type: 'text',
      text: [
        `Re-synthesize. ${reason}`,
        ``,
        `Return EXACTLY ONE record_moodboard_design call. Honor every required field. Every consensus claim needs supportSourceIds. Cluster sourceIds must be ids from the input, not invented.`,
        ``,
        `Original task — moodboard name: ${name}, ${observations.length} observations, ${proposedClusters.length} heuristic clusters. Re-read them and emit a valid MoodboardDesign.`,
      ].join('\n'),
    },
  ];
}

// Drop the bulky _meta block from each observation before serializing — it has model
// metadata we don't want to mix into synthesis context, and it eats tokens.
function stripMetaFromObservation(o) {
  if (!o || typeof o !== 'object') return o;
  const { _meta, ...rest } = o;
  return rest;
}
