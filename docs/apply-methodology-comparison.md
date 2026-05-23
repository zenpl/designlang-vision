# Five-Way Comparison — Applying 5 Moodboard Clusters to pdx-gardener

Companion document to [`apply-methodology.md`](./apply-methodology.md).

This document compares the 5 case studies side-by-side, surfacing
patterns that only become visible across the full set.

## The five applies at a glance

|  | Cluster | Strategy | Result | One-liner |
|---|---|---|---|---|
| **Before** | (none — original) | — | baseline | Sans bold H1 + warm cream cards + emoji thumbs + green pill CTAs |
| **C1** | Matte Clay 3D Botanical Diorama | Full | ✅ | Polymer-clay decoration in 3 places; warm cream preserved; pillowy shadow |
| **C2** | Neumorphic Soft-Extrusion | Surgical | ⚠️ | Inset thumb wells + raised CTA pills; cards stay flat for legibility |
| **C3** | Editorial Botanical Commerce | Full (attempted) | ❌ | Display serif H1 + italic festival + photo-overflow → bait-and-switch |
| **C4** | Dark Forest-Green Showcase | Structural | ⚠️ | Cream cards float on dark page; gold accents; semantic remap working |
| **C5** | Artisanal Flat Parchment Café | Full | ✅ | Parchment paper + dashed olive borders + 思源宋体 restraint |

Reference screenshots (full-page):
- `validation/pdx-apply-c5/screenshot-before.png` — original pdx-gardener
- `validation/pdx-apply-c1/screenshot-after-c1.png`
- `validation/pdx-apply-c2/screenshot-after-c2.png`
- `validation/pdx-apply-c3/screenshot-after-c3.png`
- `validation/pdx-apply-c4/screenshot-after-c4.png`
- `validation/pdx-apply-c5/screenshot-after.png`

---

## Comparison axis 1 — Distance from brand promise

How far does the apply pull the brand from "neighborhood community
board" toward something else?

```
neighborhood ───┬───────┬─────────────┬────────────── luxury
 community      │       │             │                catalog
   board        │       │             │
                │       │             │
   before •────C1•────C5•──────C2•──────C4 (struct)──C3 (fail)
                 ↑       ↑          ↑       ↑              ↑
                 +clay   +parchment +calm   +Pacific NW    +Saveur
                 (kept   (kept      (drift  (lookbook      (chrome
                 craft)  warmth)    cooler) commerce)      lookbook)
```

- **C1 / C5 stay closest to before** — same emotional register, just
  refined. The product still feels like itself.
- **C2 cools the brand** by ~5%. Apple-Health-ification. Not
  catastrophic, but the warmth that defines pdx-gardener is reduced.
- **C4 pulls hard** but structurally protects user content via the
  cream-island pattern. Reads as a brand evolution, not a failed
  redesign.
- **C3 pulls too hard and the protection mechanism doesn't activate**
  (light-mode editorial + user content on the same surface = clash).

---

## Comparison axis 2 — How does each handle amateur user photos?

The single biggest stress test: pdx-gardener users upload muddy
backyard hand-held phone photos. Each apply handled this differently:

| Apply | Photo treatment | Verdict |
|---|---|---|
| Before | 80×80 thumb in warm cream cell on warm cream card | ✅ Photos integrate naturally with the background |
| **C1** | Same 80×80 in cream cell + soft inset highlight | ✅ Photos look "set into" warm surface; slight elevation |
| **C2** | 80×80 in deeper-cream inset well (soft tray) | ✅ Inset shadow frames photos like a wallet sleeve; surprisingly elegant on amateur photos |
| **C3** | One featured card has photo overflow above (-24px) | ❌ Magnifies the gap between amateur photo and editorial chrome |
| **C4** | 80×80 in cream card floating on dark page | ✅ Dark surrounding makes photos POP more than on cream backgrounds — best photo presentation of all 5 |
| C5 | Same 80×80 in cream cell with paper-grain texture nearby | ✅ Photo + parchment + cluster art coexist in same craft register |

**Key insight**: Two diametrically opposite approaches both succeed at
photo presentation — C1's "photo as warm-embedded content" and C4's
"photo as floating island". The middle ground (C2 inset well) also
works. **The failure (C3) is the one that tries to elevate the photo
itself via signature moves (photo-overflow).**

The rule that emerges: *photos thrive when chrome creates either
embedding or contrast, but suffer when chrome tries to act on the
photo itself.*

---

## Comparison axis 3 — Typography ladder

How aggressively does each apply re-typographically the H1?

| Apply | H1 face + weight + size | H1 register signal |
|---|---|---|
| Before | PingFang/Source Han Bold 28px | Modern neighborhood |
| C1 | Same PingFang Bold 28px (unchanged!) | Modern neighborhood — preserved |
| C2 | PingFang Bold 26px | Modern neighborhood (slightly more refined) |
| **C3** | **LXGW 新晋宋 Bold 44px** | **古籍 / heritage — wrong** |
| C4 | PingFang Bold 28px + gold underline | Modern with editorial restraint |
| C5 | 思源宋体 Regular 30px | Library / contemplative |

**C1, C2, C4 all preserved or barely-touched the H1.** This is the
right move. The original H1 wasn't broken.

**C3 was the only apply that radically re-typographied H1**, and it
was the only apply that failed. Correlation worth noting.

Lesson: **typography is the most sensitive lever in an apply.** Touch
it with care or not at all. Aggressive re-typography is the highest-
risk move in any apply, with the highest brand-register impact.

---

## Comparison axis 4 — Editorial accent budget

Count of italic / all-caps-tracked / gold / drop-cap / overflow
signature moves per screen:

| Apply | Italic events | All-caps events | Gold rules | Overflow | Total accents |
|---|---|---|---|---|---|
| Before | 0 | 0 | 0 | 0 | 0 |
| C1 | 0 | 0 | 0 | 0 | 0 (chrome-decoration replaces accent) |
| C2 | 0 | 0 | 0 | 0 | 0 |
| **C3** | **6** | **3** (OFFER · / WANT · / 's-c-circle) | **0** (used italic instead) | **1** (featured card photo) | **10** |
| C4 | 0 | 3 (PDX eyebrow, OFFER · 供, WANT · 求) | 4 (rule, underline, count, link) | 0 | 7 |
| C5 | 0 | 0 | 0 (used dashed olive instead) | 0 | 0 |

**Three observations:**

1. **The two ✅ applies (C1, C5) use ZERO editorial accents.** They
   substitute with chrome-decoration (clay icons) or surface texture
   (parchment grain). Decoration ≠ accent.
2. **C3 ran 10 accent events on one screen.** That's why it reads as
   over-orchestrated.
3. **C4 ran 7 accent events** — closer to C3 in raw count — but it
   succeeded structurally because each accent was a different *type*
   (3 all-caps + 4 gold) and they each appeared at most ~2 times.

The budget rule that emerges: **max 2 events of any one accent type
per screen.** C3 violated this with 6 italics; C4 honored it with
max 2 all-caps and ~2 gold-per-section.

---

## Comparison axis 5 — AI-asset usage role

Where did AI-generated assets show up in each apply?

| Apply | AI assets used? | Slot | Role |
|---|---|---|---|
| Before | No | — | — |
| **C1** | Yes (3 unique, reused) | Hero + section heads + empty-state thumbs | ✅ Chrome decoration only |
| C2 | No (only emoji + real photos) | — | — |
| **C3** | No (after mid-task redirect — see below) | — | (would have been wrong if shipped) |
| C4 | No | — | — |
| C5 | Yes (watercolor botanical accents) | Section ornament, hero | ✅ Chrome decoration only |

**The mid-task user redirect (2026-05-17): "我觉得可以从数据库里面取
一些真数据来做demo"** stopped me from generating fake plant photos
to populate cards. That redirect is preserved in the methodology as
the canonical rule: **AI assets in chrome decoration slots only,
never replacing user content**.

The applies that used AI assets (C1, C5) both succeeded. The applies
that didn't use AI assets at all (C2, C4) also succeeded structurally.
**The failure case (C3) didn't use AI assets either.** This rules
out "AI asset usage" as a failure variable — the failure was
typography + signature-move + accent-budget, not the asset choice.

---

## Comparison axis 6 — Original-UX invariant preservation

UX invariants that must NOT be touched (per AGENTS.md +
apply-methodology §I.4):

| Invariant | Before | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|---|
| Flex-row 80×80 thumb cards | ✓ | ✓ | ✓ | ✓ (except 1 featured) | ✓ | ✓ |
| Touch targets ≥44×44 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Section ordering (供 → 求 → view-all) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Color semantics preserved | ✓ | ✓ | ✓ | ✓ | ✓ (remapped to dark) | ✓ |
| State visibility (empty / loading) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| User content untouched | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**All 5 applies preserved layout / UX invariants.** This is the
methodology working — the failures (C3) and successes (C1/C5) are
*both* surface-only changes. The failure mode in C3 is chrome
incoherence, not UX breakage.

This is reassuring: the framework "apply ≠ redesign" was respected
consistently. If we had broken layout invariants, the failures
would be much harder to attribute to chrome choices.

---

## Comparison axis 7 — "Would the product owner ship this?"

Without their input, my read:

| Apply | Would ship? | Why / why not |
|---|---|---|
| C1 | Likely yes | Highest brand-fit; minor risk (clay-pot tonal warmth); cheap to land |
| C2 | Maybe partial — ship the thumb-well treatment, skip the rest | The inset thumb-well is a near-pure win; full neumorphic CTA loses brand warmth |
| C3 | No | Brand mismatch; would need to pivot the whole product to ship |
| C4 | Conditional — only if owner wants to elevate to lookbook/boutique direction | Major brand decision before this lands |
| C5 | Likely yes | Gentle, restrained, preserves brand; ships easily |

---

## Patterns visible only at the 5-cluster level

### Pattern P1: Distance ≤1 + Strategy A → highest success rate
C1 (D=1, A) and C5 (D=1, A) are both ✅. C3 (D=3, A) is ❌.
Strategy A (full chrome apply) demands Distance ≤1.

### Pattern P2: Distance ≥2 demands Strategy C
C4 (D=3, C-structural) is ⚠️ but works. C3 (D=3, A-full) is ❌.
Same distance, different strategies → opposite outcomes.

### Pattern P3: Strategy B always partial-wins, partial-loses
C2 (D=1, B-surgical) is ⚠️. Surgical strategies inherently leave
visible mixing seams (some elements neumorphic, some not).
This isn't a bug — it's the cost of surgical application.

### Pattern P4: Typography is the highest-variance lever
The 5 applies range in editorial-accent budget from 0 (C1, C2, C5)
to 10 (C3). The two applies with zero accent budget both succeeded;
the one with the highest accent budget failed.

### Pattern P5: User-photo treatment makes or breaks
Each apply's success can be predicted by asking: "what does the
chrome do with amateur user photos?" Embed (C1) ✅, frame (C2) ✅,
elevate via signature (C3) ❌, isolate-as-island (C4) ✅,
integrate-into-texture (C5) ✅.

### Pattern P6: "Chrome warmth preservation" predicts emotional fit
Applies that kept warm cream surfaces (C1, C5, C4 — within cards)
succeeded emotionally. Applies that removed warmth (C3 → pure white;
C2 → cooler beige) drifted brand-cooler.

---

## When to use which cluster (decision aid)

**For pdx-gardener specifically:**

| Brand goal | Recommended apply |
|---|---|
| Stay community-board, refine quality | C1 (polymer clay) or C5 (parchment) |
| Add modern calm without losing warmth | Steal C2's thumb-well treatment only |
| Move toward boutique nursery / Portland lifestyle brand | C4 (with full structural cream-island) |
| Move toward heritage seed catalog / curated commerce | C3 (only if product purpose changes) |

**For other community apps applying this methodology:**

| If your product is... | Likely best clusters |
|---|---|
| Mutual-aid / volunteer / community | C1, C5 (craft register matches mission) |
| Co-op / collective commerce | C1 surface + C2 controls |
| Small-batch / boutique commerce | C3 or C4 with structural separation |
| Heritage / archive / library | C3 serif-restrained or C5 parchment |
| Luxury / curated catalog | C4 with custom assets |

---

*Last updated: 2026-05-23. Add new axes as new applies are
performed. The 5-way analysis becomes a 6-way / 7-way / N-way as
the case study library grows.*
