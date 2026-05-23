# Validation findings — Cluster 4 dark studio premium hero (M3.1 output)

Date: 2026-05-22 (follow-on to cluster1-hero/, cluster2-mobile/, cluster3-commerce/).
Constraint: built only from M3.1's implementation.md + asset-generation.md.

Fourth cluster validated. The pattern continues: M3.1 outputs preserve cluster-specific material/depth/lighting identity end-to-end through the pipeline.

---

## ✅ What worked from M3.1 output (cluster-4-specific)

- **Baked-in dark-green background on the assets** — Cluster 4 is the only cluster where the synthesizer correctly chose **opaque PNG** (not transparent). The asset prompt template explicitly says "background #1A3D2B baked in — NOT transparent". gpt-image-1 honored this and the resulting tropical plant / pampas vase have their own dark backdrops that merge seamlessly with the page section. This is a meaningful design choice: the dark backdrop IS part of the asset's identity, not a CSS layer.
- **The "only permitted translucency" rule survived M2 → M3.1 → my implementation**. The 4 circular icon panels use `rgba(45,90,61,0.7)` per implementation.md §4. This is the single exception to the "all surfaces are matte" universal rule across the moodboard, and the prompt's clarity about WHERE translucency is allowed (only on these specific icon panels) kept me from inventing more.
- **`red-accent-sparingly` (#C0392B) is correctly used only as category tag**. impl.md §4 says "never button fill or background". My "new" / "last 3" badges are the only places it appears. Without this guidance I might have used it for sale CTAs or alerts.
- **Gold-accent + dark-green palette is unmistakable**. Cross-cluster: this is the ONLY cluster using gold-cream as a primary text color. C1 uses sage greens on warm beige, C2 uses neutral grey, C3 uses forest-green on off-white. The visual identity is preserved.
- **Both `.vrec-darkstudiosection` and `.vrec-darkproductcard` recipes drop in cleanly** — the section is full-bleed via `width: 100%`, cards stand out from section bg by the subtle #2D5A3D vs #1A3D2B difference.

---

## Finding #C4-1 — Asset prompts split into transparent vs baked-bg cleanly

- **Severity**: positive observation, not a gap
- **Note**: Across 4 clusters, the synthesizer correctly grouped:
  - **Transparent PNG** (alpha cutouts): C1 clay props, C2 photo cutouts, C3 catalog plants
  - **Baked-in background**: C4 dark-studio scenes
  - **(Pending)**: C5 watercolor illustrations will probably be transparent again
  This is a non-trivial inference — the synthesizer recognized that C4 is the only cluster whose backdrop IS the design element, not the page CSS. Worth highlighting in the architecture doc as a M2-synthesis quality marker.

## Finding #C4-2 — No pill CTA recipe for Cluster 4 (same as C3-1)

- **Severity**: minor (cross-cluster pattern, same issue as Cluster 3)
- **Gap**: implementation.md §4 says "pill CTA in green-forest or white outline" but `m31-recipes.css` ships no `.vrec-darkstudiocta` or button recipe for C4.
- **What I invented**: inline `style="background:#2D5A3D; color:#E8D5B0; border: 1px solid #C8A84B;" rounded-full`. Gold border is my call (the spec said "green-forest or white outline" but I added gold to anchor the editorial tone).
- **Prompt edit**: see C3-1 — M2 synthesizer should emit one button recipe per cluster whose layout sketch references a CTA. Currently C3 and C4 both skip.

## Finding #C4-3 — `.vrec-darkproductcard` works great for asset-backed cards, falls flat for empty placeholders

- **Severity**: minor
- **Gap**: The recipe has `background: #2D5A3D` + `border-radius: 16px`. When the card displays an asset PNG (with its own baked-in #1A3D2B bg), the recipe's #2D5A3D shows around the asset as a frame. When the card has no asset (just text / icon placeholders), the #2D5A3D fills entire card and looks flat-monotonic. I had to manually add an inner `<div style="background:#1A3D2B">` for the image area of placeholder cards to get visual variety.
- **What I invented**: nested dark-bg block inside the card to mimic the asset's baked backdrop.
- **Prompt edit**: implementation.md §6 could note: "`.vrec-darkproductcard` expects an asset image that fills the top portion; for empty/placeholder cards, manually add a #1A3D2B inner block for visual rhythm consistent with asset-backed cards."

## Finding #C4-4 — Icon panel layout: "2×2 OR 1×4" forced a layout decision

- **Severity**: nit
- **Gap**: §4 layout sketch says "Circular icon panels arranged in a 2×2 or 1×4 strip". On desktop with 4 features I went 1×4 (horizontal strip). On narrower viewports 2×2 might fit better, but mobile resp wasn't tested.
- **What I invented**: 1×4 across all viewports.
- **Prompt edit**: be specific: "1×4 on ≥768px, 2×2 below". Or leave the choice but include both responsive breakpoints in the sketch.

---

## Cross-cluster pattern (4 clusters now)

| | C1 Diorama | C2 Neumorphic | C3 Editorial | **C4 Dark Studio** |
|---|---|---|---|---|
| Asset bg | transparent | transparent | transparent | **baked #1A3D2B (opaque)** |
| Page bg | #F0E6DC warm | #E8E8E8 grey | #FAFAF8 white | **#1A3D2B dark green** |
| Translucency permitted? | no | no | no (opacity overlay yes, blur no) | **yes — only on icon panels rgba(45,90,61,0.7)** |
| Headline typography | sans light | sans mid | serif | **italic serif gold** |
| Accent color | sage-green pill | sage-green icon | forest-green CTA | **gold #C8A84B + sparing red #C0392B for tags** |
| Asset positioning | multi-prop overflow | one cutout top-right | one cutout top-center | **one big asset right edge with frame extension** |

**Crucial cross-cluster observation**: the synthesizer / M2 / M3.1 pipeline correctly identified that C4 needed the OPPOSITE asset handling from C1/C2/C3 (baked bg vs transparent), without me having to look at the source images. This is non-trivial design reasoning, and it shows up in both the asset-generation.md template AND the recipes.css `vrec-darkstudiosection { overflow:visible }` recipe pattern.

The system continues to hold across structurally very different cluster aesthetics.

**Output:** `out/m31-10img-sonnet/m31-assets/cluster4-darkstudio/{tropical-plant-roots, pampas-vase}.png` (gitignored); validation files in `validation/cluster4-studio/`.
