# Validation findings — Cluster 5 parchment loyalty card (M3.1 output)

Date: 2026-05-22 (5-of-5 cross-cluster validation complete).
Constraint: built only from M3.1's implementation.md + asset-generation.md.

Cluster 5 is the **strictest discipline** cluster — the opposite of Clusters 1, 3, 4's overflow culture. Every other cluster's permitted-but-restrained feature (shadow, depth, overflow, gloss) is **explicitly forbidden** here. If the pipeline can produce this cluster without leaking C1/C2/C3/C4 affordances in, the cluster-before-consensus discipline is fully validated.

---

## ✅ What worked from M3.1 output (cluster-5-specific)

- **Watercolor assets came out genuinely hand-painted**. The prompt template's "visible watercolor wash edges, soft paper grain texture" + "DO NOT add ... or any vector/flat-fill illustration style (must read as hand-painted watercolor)" produced exactly that. gpt-image-1 didn't default to clean SVG-looking output.
- **`.vrec-parchmentcta` is shipped as a no-shadow, flat olive-green button** — the M2 synthesizer correctly emitted this for Cluster 5 (one of only two cluster-bound CTA recipes shipped, the other being `.vrec-claypillbutton` for C1). The `box-shadow: none` is in the recipe CSS verbatim, so I couldn't accidentally add elevation by reaching for a generic shadow utility.
- **The "zero overflow" rule held through to my implementation**. I didn't add boundary breaks even subconsciously. The recipes.css `.vrec-parchmentcta` doesn't ship with `overflow: visible`, and §4 layout sketch says "strictly contained within device frames" — both signals reinforced strict containment.
- **Loyalty donut SVG stroke-dasharray pattern was specified concretely enough to copy**. §4 sketch says "120×120px, with four botanical SVG corner decorations at ±8px from corners". I built it exactly to spec with `circle r="50" stroke-dasharray="220 314"` for 70% progress. The four corner decorations are mirrored SVG sprigs at the donut's bounding-box corners.
- **Stamp/seal logo at 64×64 is a meaningfully distinct decorative primitive**. No other cluster has anything like a "vintage stamp seal" — it's specific to C5's artisanal/printed identity. The fact that the spec called it out by exact dimensions made it easy to inline as SVG.

---

## Finding #C5-1 — No "parchment card" / "parchment inlay" recipe (had to hand-style)

- **Severity**: minor (same gap pattern as C3-1 and C4-2 — buttons get recipes, surfaces sometimes don't)
- **Gap**: `m31-recipes.css` ships `.vrec-parchmentcta` for the button but no `.vrec-parchmentcard` for the surrounding card surface. The §4 sketch describes "thin 1px olive borders on cream rather than drop shadows" — I had to inline `border: 1px solid rgba(61,90,46,0.18); border-radius: 20px;` myself.
- **What I invented**: that inline border + radius pair. Consistent with the spec but not codified as a token/recipe.
- **Prompt edit**: M2 synthesizer should emit one card-surface recipe per cluster, not only button recipes. e.g. `.vrec-parchmentcard { background: #F5F0E6; border: 1px solid rgba(61,90,46,0.18); border-radius: 20px; box-shadow: none; }`.

## Finding #C5-2 — Asset prompt produced excellent watercolor; no flaws to report

- **Severity**: positive observation
- **Note**: this is the most constrained asset language in the moodboard (forbidding 3D, photo, vector, gloss, dark bg, glass) and the model produced cleanly on-brand outputs both times. The provider-specific tweak "Flux needs 'no digital vector edges' to avoid defaulting to clean SVG-style output" was correct foresight by the synthesizer — gpt-image-1 (analogous DALL-E 3 lineage) handled it fine without the extra phrase, but Flux users would have benefitted.

## Finding #C5-3 — Paper-grain texture suggestion in §4 was implementable but undocumented

- **Severity**: nit
- **Gap**: §4 says watercolor "Top 200–240px: watercolor illustration inlay, edge-to-edge" — the spec doesn't say whether to add a paper-grain texture overlay underneath the illustration or rely on the watercolor's own paper-grain feel. I added a tiny radial-dot pattern at 6px spacing for paper texture; without it the parchment area looked too flat-digital.
- **What I invented**: `background-image: radial-gradient(rgba(61,90,46,0.06) 0.5px, transparent 0.5px); background-size: 6px 6px;` for subtle paper grain.
- **Prompt edit**: §4 Cluster 5 layout sketch should mention "optional subtle 6px paper-grain background dots over the illustration inlay container to reinforce the printed-paper aesthetic when the watercolor's own texture is at low contrast at small sizes".

## Finding #C5-4 — `botanical-wreath` asset at 64×64 (clipped circular) reads as decorative pattern, not as wreath

- **Severity**: minor
- **Gap**: Used the full 1024×1024 watercolor wreath as a circular 64×64 avatar-style mark in the "field notes" card. At that scale, the wreath's individual leaves become a busy texture rather than reading as a discrete wreath shape. The asset is best used at full size, not clipped/scaled.
- **What I invented**: clipped it anyway, accepting the visual fuzz.
- **Prompt edit**: asset-generation.md could note: "small decorative motifs (≤80px in UI) should be generated at lower complexity — e.g. a single sprig rather than a full wreath — and tagged in the filename so a developer knows which assets are 'large feature' vs 'small icon'".

---

## Cross-cluster final summary (5/5 validated)

| | C1 Diorama | C2 Neumorphic | C3 Editorial | C4 Dark Studio | **C5 Parchment** |
|---|---|---|---|---|---|
| Screen type | marketing splash | mobile dashboard | e-commerce grid | premium hero + collection | **mobile loyalty card** |
| Page bg | #F0E6DC warm beige | #E8E8E8 grey | #FAFAF8 off-white | #1A3D2B dark green | **#F5F0E6 parchment** |
| Asset bg | transparent | transparent | transparent | **baked opaque** | transparent |
| Asset language | matte 3D clay | photo cutout (cool) | catalog photo (clean) | semi-realistic 3D/photo (dark) | **watercolor 2D** |
| Depth signal | shadow + overflow + AO | dual neumorphic shadow | editorial-minimal shadow | drop-shadow on staged objects | **NONE (flat 2D)** |
| Translucency | forbidden | forbidden | opacity overlay only | rgba icon panels only | **forbidden** |
| Overflow / boundary-break | mandatory | one cutout only | one cutout only | one big asset only | **forbidden** |
| Primary CTA | `.vrec-claypillbutton` sage pill | raised disc 56×56 | inline forest-green pill (no recipe) | inline forest-green pill (no recipe) | **`.vrec-parchmentcta` flat olive, NO SHADOW** |
| Headline type | sans light | sans mid | italic serif | italic gold serif | **italic serif center-aligned** |
| Accent color rules | sage + peach-coral | one sage or orange | forest-green only | gold-cream + sparing red-tag only | **olive-green only** |
| Cluster recipes shipped | claycard, claytile, claypillbutton, botanicaloverflow | neumorphiccard, neumorphicinset | editorialproductcard, botanicaloverflow | darkstudiosection, darkproductcard, botanicaloverflow | **parchmentcta** |

**Five-of-five empirical proof points**:

1. **Material languages never leaked across clusters**. I never accidentally put a clay prop in a parchment screen, or a photographic plant in a dark studio asset. Each cluster's anti-pattern list in §4 of impl.md acted as an explicit "don't reach for X here" guardrail.

2. **The strictest cluster (C5: zero shadow, zero overflow) and the loosest cluster (C1: mandatory overflow with multiple props) coexist without either leaking into the other**. This is the cluster-before-consensus discipline in its most stress-tested form.

3. **Asset prompts produced material-distinct outputs from a single image-gen model** (gpt-image-1). C1 clay ≠ C2 cool photo ≠ C3 catalog photo ≠ C4 dark-staged ≠ C5 watercolor. No averaging.

4. **One missing-recipe pattern repeated across C3, C4, and C5 around card-surface/CTA recipes**. M2 synthesizer reliably emits one button recipe per cluster only sometimes (C1 ✓, C5 ✓, C2 ✓ via disc, C3 ✗, C4 ✗). Worth a single M3.2 patch.

5. **The most cluster-bound primitive in the moodboard (C4's baked-in-bg assets, C5's stamp/seal logo, C2's neumorphic dual-shadow) all came through accurately**. The pipeline preserved the cluster-bound rules end-to-end from M1 observation → M2 cluster localClaims → M3.1 implementation prompt → asset-generation prompt → rendered output.

The MoodboardDesign concept works.

**Output:** `out/m31-10img-sonnet/m31-assets/cluster5-parchment/{coffee-plant-berries, botanical-wreath}.png` (gitignored); validation files in `validation/cluster5-parchment/`.

---

## Aggregated M3.2 candidate edits (from C1–C5 findings)

Most impactful for next M3 iteration, sorted by impact ÷ effort:

1. **One card-surface recipe per cluster** (closes C3-1, C4-2, C5-1) — M2 synthesizer prompt edit. Currently only buttons sometimes get recipes; surfaces should too.
2. **Asset normalization: bottom-anchored baseline** (closes C3-3) — asset-generation.md per-cluster prompt edit: "subject bottom-anchored at ~80% from frame top" so multi-asset grids align.
3. **Layout sketch: responsive breakpoints** (closes C4-4) — implementation.md should specify breakpoint behavior when sketch offers options ("1×4 or 2×2").
4. **Paper-grain hint** (closes C5-3) — implementation.md §4 Cluster 5 layout sketch addition.
5. **Asset complexity vs scale tag** (closes C5-4) — asset-generation.md per-cluster note about which assets are large-feature vs small-icon-friendly.
6. **Layout-sketch collision warnings** (closes C2-1) — implementation.md generic note: layout coords are starting dimensions, not complete component specs; check for overlaps between absolutely-positioned siblings.

All 6 are prompt edits, no code/schema changes required. M3.2 would be one round of synthesizer + emitter prompt tweaks then re-run.
