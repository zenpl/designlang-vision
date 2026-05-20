// Heuristic clustering for moodboard images, producing a STARTING POINT for synthesis,
// not the final clustering. Synthesis (LLM) takes these as a hint and decides the final
// cluster structure — see architecture.md §5.2 for the rationale.
//
// Signals fused:
//   - styleLabels: Jaccard similarity on the set of labels
//   - materials:   Jaccard similarity on the set of material labels
//   - palette:     LAB-space distance between dominant color sets (Earth-mover-ish, fast)
//
// We deliberately keep this simple. A perfectly clustered heuristic that overrides the LLM
// would defeat the purpose of asking the LLM to read the actual observations.

const STYLE_W    = 0.4;
const MATERIAL_W = 0.4;
const PALETTE_W  = 0.2;

const HIGH_SIM = 0.55; // threshold to start in the same cluster; tuned for 3–20 image boards

// ── Color helpers (sRGB → LAB) ────────────────────────────────────────────────
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToLab(rgb) {
  if (!rgb) return null;
  const [r, g, b] = rgb.map(srgbToLinear);
  // D65 → XYZ
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labDistance(a, b) {
  if (!a || !b) return Infinity;
  const dl = a[0] - b[0], da = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + dz * dz);
}

/** Min distance from each LAB color in A to the closest in B, averaged. */
function paletteAsymmetricDistance(labsA, labsB) {
  if (!labsA.length || !labsB.length) return 100;
  let sum = 0;
  for (const a of labsA) {
    let best = Infinity;
    for (const b of labsB) {
      const d = labDistance(a, b);
      if (d < best) best = d;
    }
    sum += best;
  }
  return sum / labsA.length;
}

function paletteSimilarity(palA, palB) {
  // palette distance roughly 0..100. Convert to similarity 0..1.
  const labsA = (palA || []).map(hexToRgb).map(rgbToLab).filter(Boolean);
  const labsB = (palB || []).map(hexToRgb).map(rgbToLab).filter(Boolean);
  if (!labsA.length || !labsB.length) return 0;
  const d = (paletteAsymmetricDistance(labsA, labsB) + paletteAsymmetricDistance(labsB, labsA)) / 2;
  // tuned: LAB distance of 0 → similarity 1, 60+ → similarity ~0
  return Math.max(0, 1 - d / 60);
}

// ── Set helpers ───────────────────────────────────────────────────────────────
function jaccard(a, b) {
  const sa = new Set((a || []).map((x) => String(x).toLowerCase()));
  const sb = new Set((b || []).map((x) => String(x).toLowerCase()));
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ── Per-observation feature view ──────────────────────────────────────────────
function featuresOf(observation) {
  return {
    id:         observation.source?.id ?? '?',
    styleLabels: observation.globalStyle?.styleLabels ?? [],
    materials:   (observation.materials ?? []).map((m) => m.label).filter(Boolean),
    dominant:    observation.palette?.dominant ?? [],
  };
}

export function pairSimilarity(obsA, obsB) {
  const a = featuresOf(obsA), b = featuresOf(obsB);
  const sStyle    = jaccard(a.styleLabels, b.styleLabels);
  const sMaterial = jaccard(a.materials,   b.materials);
  const sPalette  = paletteSimilarity(a.dominant, b.dominant);
  return STYLE_W * sStyle + MATERIAL_W * sMaterial + PALETTE_W * sPalette;
}

// ── Greedy single-link clustering ─────────────────────────────────────────────
// O(N²) is fine here — we cap at 30 images per moodboard. Builds an adjacency
// graph at the HIGH_SIM threshold and computes connected components.

/**
 * Cluster observations using the heuristic. Returns proposed clusters as:
 *   { name: 'Heuristic cluster N (M images)', sourceIds: [...], weight: M/N }
 *
 * "name" here is a placeholder; the synthesis LLM is expected to rename
 * each cluster with a specific thesis (e.g. "Pastel Clay Botanical Dashboard").
 * That's why we don't try too hard at naming.
 */
export function clusterObservations(observations, { threshold = HIGH_SIM } = {}) {
  const n = observations.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{
      name: 'Heuristic cluster 1 (1 image)',
      sourceIds: [observations[0].source.id],
      weight: 1.0,
    }];
  }

  // adjacency by threshold
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (x, y) => { const rx = find(x), ry = find(y); if (rx !== ry) parent[rx] = ry; };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (pairSimilarity(observations[i], observations[j]) >= threshold) {
        union(i, j);
      }
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }

  // Sort clusters by descending size, then by smallest member index for stability
  const sortedGroups = [...groups.values()]
    .map((indices) => ({ indices, lead: Math.min(...indices) }))
    .sort((a, b) => (b.indices.length - a.indices.length) || (a.lead - b.lead));

  return sortedGroups.map((g, idx) => ({
    name: `Heuristic cluster ${idx + 1} (${g.indices.length} image${g.indices.length === 1 ? '' : 's'})`,
    sourceIds: g.indices.map((i) => observations[i].source.id),
    weight: g.indices.length / n,
  }));
}

/** Convenience: full similarity matrix as flat list of {from,to,sim} pairs. Useful for debugging clustering decisions. */
export function pairwiseMatrix(observations) {
  const out = [];
  for (let i = 0; i < observations.length; i++) {
    for (let j = i + 1; j < observations.length; j++) {
      out.push({
        from: observations[i].source.id,
        to:   observations[j].source.id,
        sim:  pairSimilarity(observations[i], observations[j]),
      });
    }
  }
  return out;
}
