# Validation findings — Cluster 3 editorial commerce grid (M3.1 output)

Date: 2026-05-22 (follow-on to cluster1-hero/ and cluster2-mobile/).
M3.1 outputs used: `out/m31-10img-sonnet/m31-{tailwind.config.js, recipes.css, prompts/implementation.md, prompts/asset-generation.md}`.
Constraint: built only from implementation.md + asset-generation.md.

Third cluster validated. Pattern across all three (C1 marketing splash, C2 mobile dashboard, C3 commerce grid) continues to hold — material languages cleanly separated, no averaging failure.

---

## ✅ What worked from M3.1 output (cluster-3-specific)

- **`.vrec-editorialproductcard`** drops in cleanly: off-white bg, 12px radius, near-invisible `editorial-minimal` shadow. On the off-white #FAFAF8 page, cards have just-barely-visible separation — exactly the "near-invisible borders" §4 specified.
- **`.vrec-botanicaloverflow` reused from C1** for the top-overflowing plant cutouts. Cross-cluster: recipe ships with the necessary `position: absolute + drop-shadow filter`; only the explicit positioning differs per cluster (C3 uses `top:-24px; left:50%`).
- **Cluster-bound color token rules were directly actionable**: implementation.md §4 says "deep forest-green #1A3D2B or #4A7C59 for primary CTAs". I copied #1A3D2B verbatim onto the Add-to-cart button. No invention required.
- **Asset prompt produced cleaner catalog photography than C2**. The "no color cast" + "catalog product photography style" lines worked — the snake plant, monstera, and pothos all have bright neutral foliage, not the C2 muted-cool tone. Three image-gen prompts in the SAME run produced three materially-distinct outputs.

---

## Finding #C3-1 — No pill CTA recipe for Cluster 3 (I had to invent inline styles)

- **Severity**: minor
- **Gap**: implementation.md §4 says "full-width forest-green pill CTA at card bottom" but `m31-recipes.css` ships only `.vrec-editorialproductcard` for this cluster. No `.vrec-editorialcta`, `.vrec-editorialpillbutton`, or equivalent.
- **What I invented**: inline `style="background:#1A3D2B; color:#FAFAF8;"` + Tailwind `rounded-full py-3 text-center font-medium` utilities on an `<a>` tag.
- **Prompt edit**: M2 synthesis prompt should bias toward producing one button recipe per cluster when the layout sketch calls for one. The current 10-image moodboard's M2 output emitted `clayPillButton` (C1), `parchmentCTA` (C5) but skipped C3 and C4 button recipes. A subtle prompt addition: "for each cluster, if the layout sketch references a button/CTA, emit a button-tagged recipe under design.recipes — e.g. \`editorialPillCTA\` for C3, \`darkStudioCTA\` for C4". Then M3.1's recipes-css.js button-selector-specificity fix (#6) auto-bumps it.

## Finding #C3-2 — Card bg vs page bg are too close in default token mapping

- **Severity**: nit
- **Gap**: tokens.color['off-white'] = '#FAFAF8' AND tokens.surface['clay-card'] = '#FAFAF8' (also off-white). When I set the page body to off-white AND the recipe's card background is off-white, the cards are *nearly* invisible — only the editorial-minimal shadow distinguishes them. Beautiful editorial restraint, but on lower-contrast monitors the shadow may not register.
- **What I invented**: kept #FAFAF8 for both. Acceptable.
- **Prompt edit**: M2 synthesizer could be nudged to pick subtly different shades when "page bg" and "card bg" share the same token name. Or implementation.md §4 should note: "for Cluster 3, accept that the card-to-page contrast is intentionally minimal — relying on shadow alone is part of the editorial aesthetic. If you need more separation, switch the page to `warm-cream #F5F0E8` and keep cards at #FAFAF8."

## Finding #C3-3 — Plant cutouts have inconsistent bottom alignment with card top

- **Severity**: minor
- **Gap**: `top:-24px; left:50%; transform: translateX(-50%)` positions each plant so 24px peeks above the card top. But each generated image's plant is at a different vertical position within its 1024×1024 frame (snake plant centered, monstera centered, pothos top-anchored). The result: pothos's pot sits higher than snake plant's pot, breaking row alignment.
- **What I invented**: used the same overflow positioning but accepted the visual unevenness. In production you'd either: (a) post-process the PNGs to normalize the "bottom of pot" position, or (b) generate the assets with a "bottom-anchored at 75% from top of frame" instruction added to the asset prompt.
- **Prompt edit**: asset-generation.md Cluster 3 template should add: "Subject bottom-anchored — pot/stem base sits at ~80% from frame top, leaving room for plant to extend upward. This ensures consistent baseline alignment when multiple assets sit in a product grid."

---

## Cross-cluster pattern: all three clusters scaled the same primitives differently

| | Cluster 1 (Diorama) | Cluster 2 (Neumorphic) | Cluster 3 (Editorial) |
|---|---|---|---|
| Background | #F0E6DC warm-beige | #E8E8E8 neutral-grey | #FAFAF8 off-white |
| Card surface | #FAFAF8 clay-card matte | #E8E8E8 (same as body) | #FAFAF8 (same as body) |
| Card-from-bg signal | shadow `clay-card` 0 12px 40px | dual neumorphic shadow pair | shadow `editorial-minimal` 0 1px 4px |
| Asset material | matte 3D clay | photo cutout, cool monochrome | photo cutout, catalog clean |
| CTA | `.vrec-claypillbutton` sage-green pill | raised disc button | (no recipe) green-darkest pill |
| Boundary breaking | mandatory, multi-prop | one photo per card | one photo per card |
| Typography | sans, light/regular | sans, mid-weight | mixed serif/sans hierarchy |

No leakage observed. C3's plant cutouts look distinctly catalog-photographic (not clay, not desaturated-cool). C3's CTAs are forest-green pills (not sage-green like C1's clay pillbuttons).

This is empirical evidence the cluster-before-consensus discipline traveled through M1 → M2 → M3.1 → image-gen prompt → rendered output without averaging.

**Output:** `out/m31-10img-sonnet/m31-assets/cluster3-editorial/{snake-plant, monstera-ceramic, pothos-trailing}.png` (gitignored); validation files in `validation/cluster3-commerce/`.
