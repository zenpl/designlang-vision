// Template emitter: MoodboardDesign → DTCG-style design tokens JSON.
//
// DTCG (Design Tokens Community Group) shape: nested groups with leaf nodes that
// have {value, type}. We accept that the MoodboardDesign's tokens come in flat
// {name: value} maps and group them by type — that's the natural ingestion path
// for downstream tools (Style Dictionary, Tokens Studio, etc.).
//
// No LLM call. Deterministic. The "intelligence" is in the design's token names
// (sonnet already chose semantic names like "surface-parchment" and "green-forest").

const TYPE_BY_GROUP = {
  color:        'color',
  surface:      'color',
  borderRadius: 'dimension',
  shadow:       'shadow',
  typography:   'typography',
};

/**
 * Emit DTCG tokens JSON. Returns the object (caller writes to disk).
 *
 * Group ordering (deterministic for reproducible diffs):
 *   1. _meta (style thesis + cluster summary)
 *   2. color (merged from tokens.color + tokens.surface)
 *   3. borderRadius
 *   4. shadow
 *   5. typography
 *
 * @param {object} design   — MoodboardDesign
 * @param {object} [opts]
 * @returns {object}
 */
export function emitTokensJSON(design, _opts = {}) {
  const tokens = design.tokens || {};
  const out = {
    _meta: {
      styleThesis: design.styleThesis,
      sourceCount: design.sourceCount,
      clusterCount: (design.clusters || []).length,
      clusters: (design.clusters || []).map((c) => ({
        name: c.name,
        weight: c.weight,
        sourceIds: c.sourceIds,
      })),
      generatedBy: 'designlang-vision M3 tokens-json emitter',
    },
  };

  // Merge color + surface under one DTCG group, prefix surface ids with `surface.`
  const colorGroup = {};
  for (const [name, value] of Object.entries(tokens.color || {})) {
    colorGroup[name] = { $value: value, $type: 'color' };
  }
  if (tokens.surface && Object.keys(tokens.surface).length) {
    colorGroup.surface = {};
    for (const [name, value] of Object.entries(tokens.surface)) {
      colorGroup.surface[name] = { $value: value, $type: 'color' };
    }
  }
  if (Object.keys(colorGroup).length) out.color = colorGroup;

  if (tokens.borderRadius && Object.keys(tokens.borderRadius).length) {
    out.borderRadius = {};
    for (const [name, value] of Object.entries(tokens.borderRadius)) {
      out.borderRadius[name] = { $value: value, $type: 'dimension' };
    }
  }

  if (tokens.shadow && Object.keys(tokens.shadow).length) {
    out.shadow = {};
    for (const [name, value] of Object.entries(tokens.shadow)) {
      // shadow values come either as full box-shadow strings or filter:drop-shadow
      // wrappers. Keep them as raw $value strings — DTCG allows that.
      out.shadow[name] = { $value: value, $type: 'shadow' };
    }
  }

  if (tokens.typography && Object.keys(tokens.typography).length) {
    out.typography = {};
    for (const [name, value] of Object.entries(tokens.typography)) {
      out.typography[name] = { $value: value, $type: 'typography' };
    }
  }

  // Pass through any other groups the synthesizer emitted that we don't know about,
  // so emitters don't silently lose model output.
  for (const [group, body] of Object.entries(tokens)) {
    if (TYPE_BY_GROUP[group]) continue; // already handled
    if (!body || typeof body !== 'object') continue;
    out[group] = body;
  }

  return out;
}

/** Convenience: stringify with stable key order + 2-space indent. */
export function emitTokensJSONString(design, opts) {
  return JSON.stringify(emitTokensJSON(design, opts), null, 2) + '\n';
}
