# pdx-apply-c1 · Findings (Matte Clay 3D Botanical Diorama → 菜友集市)

**Verdict: ✅ Most successful of the 5 applies.** Closest spiritual match
to pdx-gardener's existing direction; elevates without re-branding.

## Why it works

| Dimension | Why C1 fits |
|---|---|
| **Brand-promise distance** | Closest. Both pdx-gardener and Cluster 1 already live in "warm-cream-paper + soft-shadow + neighborhood-craft" territory. The apply is a 20% refinement, not a 100% pivot. |
| **AI-asset role** | Polymer-clay assets get a **clear, decoration-only role**: hero accent (1×), section-head icons (2×), empty-state thumb substitute (when user has no photo). They never compete with user photos for the same role. |
| **Chrome vs content** | Chrome is *itself* craft-feel — polymer clay reads as "handmade", which matches "amateur phone photo from a backyard garden". No tonal mismatch. |
| **Typography** | Friendly sans (PingFang/Source Han Sans bold, 28px), not display serif. Stays in the neighborhood-modern register. |
| **Owner names** | Plain sans 13px — respectful, not exoticized. |

## What we added (the 20%)

- Clay terracotta pot icon (56×56) next to H1
- Clay leaf icon (28×28) in section heads — `transform: scaleX(-1)` on the second one to vary
- Clay frond (64×64, rotated for variety) inside empty-state thumb wells, **replacing** generic emoji placeholders
- Slightly more pillowy dual shadow on cards (`0 4px 14px + 0 1px 3px` vs original `0 2px 8px + 0 1px 2px`)
- Chunky 3D-extrusion shadow on primary CTA (`box-shadow: 0 3px 0 + 0 6px 14px`) — gives the press-down affordance
- Inset highlight on thumb (`inset 0 1px 0 rgba(255,255,255,0.55)`) — subtle but lets the photo feel "set into" the warm surface

## What we kept untouched

- Warm cream page background (kept the original spirit)
- Warm cream card background (no clinical white)
- 80×80 thumb size, flex-row card layout
- Color semantics (free=green, paid=warm-red, barter=warm-yellow)
- Section ordering, touch targets, link affordances

## Risk notes

- Clay terracotta pot has slight tonal warmth that competes with the cream palette — could optionally desaturate the pot 5–10% to land it cleaner
- Three polymer-clay decorations across one screen is the upper limit — more would start to feel like a Pixar movie set, less Saturday-market
- Empty-state clay frond is delightful as a surprise but loses the surprise if every empty card is a clay decoration — at scale, vary the assets (frond / leaf / pot / seedling)

## What this case study proves

**The "chrome-vs-content separation" hypothesis succeeds when chrome
register ≈ content register.** Polymer clay (craft, tactile, slightly
imperfect) sits at the same emotional register as amateur user
phone-photos (real, slightly imperfect). They don't fight — they
reinforce each other.

This is the key contrast with [pdx-apply-c3](../pdx-apply-c3/) failure
where editorial-magazine chrome (curated, premium, polished) fought
amateur user content.
