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

---

## Multi-page expansion (2026-05-23)

After the home apply, the C2 chrome was extended to 4 more pages —
Login, Item detail, Post offer form, My profile — to test how the
neumorphic vocabulary travels across different page types
(`pages/login.html`, `pages/item-detail.html`, `pages/post-offer.html`,
`pages/profile.html`).

The 4 pages use a shared `_shared.css` token sheet with one key change
from the original home apply: **typography stack swapped to Cluster 5's
font combo per user preference (2026-05-23)**.

### The C5 font swap finding

Original home (`after-c2.html`) used PingFang sans for everything,
which gave the page a clean-but-cool "Apple Health for plants" feel —
documented as the partial-loss in the original findings.

New multi-page applies use:
- `--font-display: Source Han Serif SC` at **Regular weight** (NOT Bold —
  AP-2 trap avoided) for H1, page titles, stat numbers, quantity values
- `--font-script: STKaiti` for **single accent moments only** (tagline,
  intro line, italic section divider)
- `--font-body: PingFang SC` for body text and (per AP-4) all
  user-generated names

**Effect**: the serif-Regular display + 楷体 single-accent shifted the
brand register from "iOS calm modern" back toward "contemplative
neighbor". The neumorphic depth controls (which on their own read
clinical) are now anchored by humanist typography. **Net result is
warmer than the original C2 home page.**

### Page-by-page neumorphic showcase

| Page | Neumorphic moments | Why this page benefits |
|---|---|---|
| Login | Brand mark raised circle · username inset · 4-cell PIN wells · raised secondary CTA · pressed primary CTA | Minimal screen — 5 distinct neumorphic surfaces visible at once, makes for a clean material demo |
| Item detail | Hero photo in deep inset well (polaroid-behind-glass) · owner avatar inset · 3-depth quantity stepper (inset outer + raised buttons + serif value) | Most photo-forward page; deep inset on hero is the page keynote |
| Post offer form | Inset photo slots × 3 · inset text + textarea · raised radio pills inside inset track · neumorphic stepper · sticky-bottom raised submit | **Forms are the canonical neumorphic context** — each control encodes affordance via depth: inset = "write here", raised = "press here" |
| Profile | Avatar in deep 80×80 inset well · 3 raised stat cells · tab toggle (inset track + raised active pill) · filter chips · per-card action row with raised pill buttons | Hierarchy/dashboard test — neumorphic conveys hierarchy without color saturation |

### Cross-page rules that held up

1. **Cards stay flat** on every page that has cards (item detail owner
   card is the one raised exception — it acts as a single CTA chip,
   not a content card).
2. **One STKaiti accent per page**, max — login tagline / item-detail
   subtitle / form intro line / profile tagline. Four pages × one
   accent each = no inflation.
3. **All user names** (Fanding, 乐乐, 李大草) render in plain PingFang
   sans — AP-4 respected even though STKaiti is in the stack.
4. **All page H1s in Source Han Serif Regular**, not Bold. The
   restraint preserves the contemplative-not-古籍 register.

### What was deliberately not done

- **Did NOT retrofit the home page (`after-c2.html`)** with C5 fonts.
  Kept the original (PingFang-only) so the comparison "what does the
  font swap actually change?" is visible across the same chrome.
  If user prefers, this is a one-edit follow-up.
