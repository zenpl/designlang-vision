# pdx-apply-c2 · Findings (Neumorphic Soft-Extrusion → 菜友集市)

**Verdict: ⚠️ Works only with surgical discipline.** Pure full-screen
neumorphic would fail; this apply succeeds by limiting neumorphic
treatment to specific elements (CTAs, count badges, thumb wells) and
keeping cards/body text flat-and-warm.

## Why it (mostly) works

| Dimension | Why C2 fits *partially* |
|---|---|
| **Tactile feel** | Soft pressed/raised shadow conveys "calm modern" — appropriate for a calm, low-friction community board. |
| **Thumb-well treatment** | The inset shadow framing each 80×80 photo well is the **standout move** — user photos sit "embedded in the surface" like a soft tray. This is the design moment worth keeping. |
| **CTA hierarchy via shadow** | Filled-dark primary CTA + neumorphic-raised secondary creates clean two-level hierarchy without color saturation. |

## Why it doesn't fully work

| Dimension | Where C2 loses |
|---|---|
| **Brand warmth** | Neumorphic reads "Apple Health for plants" / "iOS design system". Cooler than the original. Loses some neighborhood warmth — drifts toward clinical. |
| **Pure neumorphic on dark fills** | Filled-dark primary CTA had to *break* the neumorphic vocabulary (use single-elevated shadow instead) because the light-side shadow disappears on a dark fill. This inconsistency is unavoidable but is a real visual seam. |
| **Affordance for secondary action** | The "我想获得" raised pill (pure neumorphic) has lower "this is clickable" affordance than C1's chunky 3D-extrusion button. Needs visible :active press-state to compensate. |

## The "surgical not total" rule

Pure neumorphic UI has documented accessibility issues:
- Low contrast (everything is variations of one background color)
- "What's clickable?" problem (raised vs flat is ambiguous)
- Inset-thumb-well + flat-card hybrid is the survival pattern

Specifically in this apply, neumorphic styling lands ONLY on:
1. Primary/secondary CTAs (raised pills)
2. Count badges (raised pills)
3. "查看全部" link as a small raised chip
4. Card thumb wells (inset shadow holding the photo)
5. Bottom view-all bar (raised pill)

Everything else — card bodies, body text, section titles, hero text —
stays flat with whisper-soft shadow so body text remains legible.

## What this case study proves

**Neumorphic is a partial-application material, not a total-application
material.** Same as how you wouldn't paint an entire room in chalkboard
finish (only one accent wall), neumorphic UI works as accent for
*specific affordances* (CTAs, controls, wells) rather than as the
foundation language of an entire screen.

For pdx-gardener specifically: the thumb-well treatment is worth
adopting standalone (low risk, high payoff). Full-CTA neumorphic
is a trade-off — gains modern calm, loses neighborhood warmth.
