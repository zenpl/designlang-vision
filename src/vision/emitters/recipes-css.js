// Template emitter: MoodboardDesign → recipes.css.
//
// Output strategy:
//   @layer recipes-consensus  — global rules holding across clusters (consensus.implementationRules)
//   @layer recipes-cluster-<slug>  — per-cluster recipes (from design.recipes whose description references a cluster)
//   @layer recipes-other      — recipes that don't tag themselves to a cluster
//
// Why @layer cascade: a developer importing this CSS picks the layers they want
// (e.g. `@layer recipes-cluster-clayDiorama` for a single cluster scope) without
// the rest stomping their app.
//
// The recipes themselves come from the synthesizer in {description, css, note?}
// shape. We don't parse the css — it's emitted verbatim under a generated
// .vrec-* class name derived from the recipe key.

export function emitRecipesCss(design, _opts = {}) {
  const consensus = design.consensus || {};
  const recipes   = design.recipes || {};
  const clusters  = design.clusters || [];

  // Build slug + lookup of cluster ids by their short name (for "Cluster 1", "Cluster 2" hints)
  const clusterSlugs = clusters.map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    // Synthesis sometimes mentions "Cluster 1" / "Cluster 3" by 1-based index in recipe descriptions
    index1: clusters.indexOf(c) + 1,
  }));

  // Group recipes by which cluster their description references (if any).
  // The synthesizer typically writes "— Cluster N (Diorama UI)" or "— Clusters 1, 3, 4".
  const byCluster = new Map();      // slug → [{key, body}]
  const ambient   = [];             // recipes without cluster tag → 'other' layer
  for (const [key, body] of Object.entries(recipes)) {
    const desc = (body?.description ?? '');
    const matchedSlugs = clusterSlugs
      .filter((c) => referenceMatch(desc, c))
      .map((c) => c.slug);
    if (matchedSlugs.length === 0) {
      ambient.push({ key, body });
    } else {
      for (const slug of matchedSlugs) {
        if (!byCluster.has(slug)) byCluster.set(slug, []);
        byCluster.get(slug).push({ key, body });
      }
    }
  }

  let css = `/* designlang-vision recipes.css
 * styleThesis: ${design.styleThesis ?? '(unset)'}
 * sourceCount: ${design.sourceCount ?? '?'}
 * clusters: ${clusters.map((c) => c.name).join(' / ')}
 *
 * @layer recipes-consensus  — rules that hold across all clusters
 * @layer recipes-cluster-*  — cluster-scoped rules; import only the slugs you need
 * @layer recipes-other      — recipes the synthesizer did not tag to a cluster
 */

@layer recipes-consensus, ${clusterSlugs.map((c) => 'recipes-cluster-' + c.slug).join(', ')}, recipes-other;

`;

  // ── consensus.implementationRules → recipes-consensus layer ────────────────
  const consensusRules = consensus.implementationRules || [];
  if (consensusRules.length > 0) {
    css += `@layer recipes-consensus {\n`;
    for (const rule of consensusRules) {
      const supportTag = (rule.supportSourceIds && rule.supportSourceIds.length)
        ? `${rule.supportSourceIds.length}/${design.sourceCount} imgs`
        : '';
      const conf = (rule.confidence != null) ? `conf ${rule.confidence.toFixed(2)}` : '';
      const meta = [supportTag, conf].filter(Boolean).join(' · ');
      css += `  /* ${escapeForCss(rule.label)}\n`;
      if (rule.evidence) css += `   * ${escapeForCss(rule.evidence)}\n`;
      if (meta)          css += `   * ${meta}\n`;
      css += `   */\n`;
    }
    css += `}\n\n`;
  }

  // ── per-cluster layers ────────────────────────────────────────────────────
  for (const cluster of clusterSlugs) {
    const items = byCluster.get(cluster.slug) || [];
    if (items.length === 0) continue;
    css += `@layer recipes-cluster-${cluster.slug} {\n`;
    css += `  /* ${escapeForCss(cluster.name)} */\n`;
    for (const { key, body } of items) {
      css += renderRecipe(key, body, '  ');
    }
    css += `}\n\n`;
  }

  // ── 'other' layer for un-tagged recipes ───────────────────────────────────
  if (ambient.length > 0) {
    css += `@layer recipes-other {\n`;
    for (const { key, body } of ambient) {
      css += renderRecipe(key, body, '  ');
    }
    css += `}\n`;
  }

  return css;
}

// ── helpers ────────────────────────────────────────────────────────────────

// Recipes whose key suggests an interactive button need extra selector specificity
// so Tailwind preflight's `button { background-color: transparent; padding: 0; ... }`
// doesn't beat them via cascade-layer placement. Triple-selector covers anchor +
// native button + ARIA button — see validation/findings.md #6.
const BUTTON_KEY_PATTERN = /(button|btn|cta|pillbtn|pill-?button)/i;

function renderRecipe(key, body, indent) {
  if (!body || typeof body !== 'object') return '';
  let s = `${indent}/* ${escapeForCss(body.description || key)}`;
  if (body.note) s += ` — ${escapeForCss(body.note)}`;
  s += ` */\n`;
  const slug = slugify(key);
  const className = '.vrec-' + slug;
  const isButton = BUTTON_KEY_PATTERN.test(key) || BUTTON_KEY_PATTERN.test(body.description || '');
  // Use a more specific selector list for buttons so element-selector resets
  // (Tailwind preflight's `button { ... }`) don't override us via cascade layers.
  const selector = isButton
    ? `${className}, button${className}, a${className}, [role="button"]${className}`
    : className;
  const css = body.css || '';
  const declarations = css
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);
  if (declarations.length === 0) {
    s += `${indent}${selector} { /* (no css emitted by synthesizer) */ }\n\n`;
    return s;
  }
  s += `${indent}${selector} {\n`;
  for (const d of declarations) {
    s += `${indent}  ${d};\n`;
  }
  s += `${indent}}\n\n`;
  return s;
}

function slugify(s) {
  // NFD-decompose then strip combining marks so 'Café' becomes 'cafe', not 'caf'.
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-') || 'unnamed';
}

function referenceMatch(desc, cluster) {
  if (!desc) return false;
  const d = String(desc).toLowerCase();
  if (d.includes(cluster.name.toLowerCase())) return true;
  // Synthesizer-style references: "Cluster 1", "Clusters 1, 3, 4".
  // Pull the numeric list that follows the word "cluster(s)" and check membership.
  // We match comma/space-separated digits + optional 'and' between them.
  const m = d.match(/\bcluster[s]?\s+([\d,\s]+(?:and\s*\d+\s*)*)/);
  if (m) {
    const nums = m[1].split(/[^\d]+/).filter(Boolean).map((n) => parseInt(n, 10));
    if (nums.includes(cluster.index1)) return true;
  }
  return false;
}

function escapeForCss(s) {
  return String(s).replace(/\*\//g, '*∕');
}
