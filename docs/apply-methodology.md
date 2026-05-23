# Cluster Apply Methodology — Operations Handbook

> Synthesized from 5 case studies of applying Moodboard clusters to
> the existing pdx-gardener (菜友集市) production app, May 2026.

This handbook turns the empirical results of the 5 case studies into
a reusable methodology. It is intentionally opinionated, not
encyclopedic — when the methodology says "don't", that's a hard rule
with a documented failure case behind it.

---

## TL;DR (the one-page version)

1. **A cluster apply is NOT a redesign.** It is a chrome-language
   transplant onto a product whose UX is already optimized. Touch
   chrome (typography, surface, shadow, decoration), don't touch
   UX (layout, IA, touch targets, behavior, color semantics).
2. **The chrome-content register gap is the single most important
   variable.** Most apply failures come from chrome promising one
   register and content delivering another.
3. **Apply at most a 1-notch elevation.** 2+ notches reads as
   inauthentic regardless of execution quality.
4. **Cluster signature moves are tuned for the cluster's source
   asset quality.** Applying them on lower-quality content
   amplifies the gap.
5. **AI-generated assets get a chrome-decoration role, never a
   user-content-replacement role.** They sit in hero / section /
   empty-state slots, never inside card thumbs replacing real
   user uploads.
6. **Editorial accents are scarce.** Budget 1–2 per visual chunk,
   max 4 per screen. Anything more is inflation.

---

## Part I — Diagnosis (before any code)

### Step 1. Identify the brand-promise register

Write ONE sentence that captures what the product promises to feel
like. Use everyday emotional vocabulary, not design jargon.

| Product | Brand-promise register |
|---|---|
| pdx-gardener (菜友集市) | "邻里换菜便条本" — Saturday community bulletin board, mutual-aid, low-friction |
| Heritage seed library | Library of botanical heritage, contemplative |
| Boutique nursery | Curated small-batch commerce, considered |
| Apple Health | Calm modern personal data, premium-iOS |
| Aesop online | Luxury apothecary, gallery |

If you can't fill this in a sentence, **stop**. Get the product
owner to commit to a register before you touch chrome.

### Step 2. Identify the content-quality register

What does the actual user-generated content look like?

| Content register | Examples |
|---|---|
| **Amateur smartphone** | Phone photos, mixed lighting, hand-held, sometimes blurry, sometimes muddy plants |
| **Polished phone** | Phone photos but styled, good lighting, sometimes cropped |
| **Semi-professional** | DSLR or styled phone, consistent lighting, intentional composition |
| **Catalog studio** | Pure studio cutouts, consistent across all content |

pdx-gardener content register: **Amateur smartphone** (real hands
holding spinach in backyards).

### Step 3. Calculate elevation distance

Use this rough register scale:

```
       0 ─── 1 ─── 2 ─── 3 ─── 4 ─── 5
   community  craft  refined  curated  editorial  luxury
   board                       commerce  magazine  catalog
```

Place chrome register and content register on this scale.

- **Distance 0**: chrome perfectly matches content. Boring, no
  identity lift. Probably not worth a redesign.
- **Distance 1**: chrome one notch above content. **Optimal apply
  range.** Reads as "we cared a little extra". Aspirational
  without being inauthentic.
- **Distance 2**: high risk. Sometimes works (Cluster 4 on
  pdx-gardener) if you structure chrome-content separation
  carefully. Usually fails.
- **Distance 3+**: hard fail. Chrome promises an experience the
  content cannot deliver.

For pdx-gardener (content register 1, "amateur smartphone"):
- C1 (polymer clay, register 2) → distance 1 → ✅ optimal
- C2 (neumorphic, register 2) → distance 1 → ⚠️ marginal (clinical drift)
- C5 (parchment watercolor, register 2) → distance 1 → ✅ works
- C4 (dark forest showcase, register 4) → distance 3 → ⚠️ works only via cream-island structural trick
- C3 (editorial commerce, register 4) → distance 3 → ❌ fails

### Step 4. Identify UX-locked invariants

Before touching anything, enumerate what is OFF-LIMITS:

- **Layout structure**: grid, flex direction, card composition
- **Touch targets**: ≥44×44 (iOS) / ≥48×48 (Material) preserved
- **Information architecture**: section ordering, navigation
- **Color semantics**: if free=green, free stays green-tinted in any apply
- **State visibility**: loading, error, empty states still legible
- **Interaction behavior**: nothing about *how* things work changes
- **User-uploaded content**: photos, names, free-text — never modified
- **Accessibility**: contrast ratios, focus rings, semantic HTML
- **Performance budgets**: don't drop a 2MB AI asset on every card

Write these out explicitly before you start. **If your apply
breaks any of them, you've crossed from "apply" into "redesign".**

### Step 5. Pick the apply strategy

Three options:

#### Strategy A — Full chrome apply
Apply the cluster's full vocabulary to all chrome elements.
- Use when: Distance ≤ 1, cluster's vocabulary is internally
  consistent across hero/CTA/card/section.
- Risk: highest commitment, but if Distance ≤ 1 the risk is low.
- Examples: C1 on pdx-gardener.

#### Strategy B — Surgical apply
Apply the cluster only on specific elements (CTAs only, or
thumb-wells only, or count-badges only).
- Use when: cluster has known accessibility risks (neumorphic),
  OR cluster's signature is wrong-handed for the content type.
- Risk: looks unconfident if too few elements are touched;
  inconsistent if too many disparate elements are touched.
- Examples: C2 on pdx-gardener (CTAs + thumb wells only).

#### Strategy C — Structural separation (cream-island)
Restructure surfaces so chrome and content live on different
planes. Most useful for dark-mode applies where photos would
clash with dark chrome.
- Use when: Distance ≥ 2 AND content quality < cluster source
  asset quality, AND the product owner has committed to the
  register elevation.
- Risk: more re-engineering than apply normally requires.
- Examples: C4 on pdx-gardener (dark page + cream floating cards).

---

## Part II — Execution Checklist

Run through this in order:

### Pre-flight (before opening any file)

- [ ] Brand-promise register written in one sentence
- [ ] Content-quality register identified
- [ ] Elevation distance computed
- [ ] Strategy chosen (A / B / C)
- [ ] UX-locked invariants enumerated
- [ ] Real user content sampled (pull from production DB if possible
      — see §V "Real data is non-negotiable")

### Typography

- [ ] **Chinese H1**: choose face by brand-register, NOT by visual sophistication
  - Community / casual / contemporary → sans-bold (PingFang, Source Han Sans)
  - Literary / contemplative → serif-regular (思源宋体)
  - Heritage / 古籍 → serif-bold (LXGW 新晋宋, only when register is literally heritage)
- [ ] **Latin secondary text**: budget italic carefully. Max 2 italic events per screen.
- [ ] **Owner names / user names**: plain sans, body weight. Decorative
      typography on names = exoticization. Never.
- [ ] **Display sizes**: original H1 was probably already correct;
      pushing to 44px+ rarely improves anything if H1 wasn't broken.

### Color & surface

- [ ] Preserve color semantics (free/paid/barter/status) — remap
      shades, never reassign hue family.
- [ ] On dark-mode applies, anchor tag colors to **card surface**
      (cream/light cards), not page surface.
- [ ] Preserve surface warmth unless explicitly going clinical.
      Pure-white cards lose warmth that warm-cream provides.

### Decoration & accent

- [ ] Editorial accents (italic, all-caps tracking, gold rules,
      drop-cap, large display, photo-overflow) budgeted:
      1–2 per visual chunk, max 4 per screen.
- [ ] Each signature move appears AT MOST once per screen
      (one drop-cap, one photo-overflow, etc).
- [ ] AI-generated assets only in chrome-decoration slots:
      hero accent, section icon, empty-state placeholder.
      **Never in card thumbs replacing real user uploads.**

### Layout invariants check

- [ ] No layout grid changes
- [ ] Touch targets ≥44×44
- [ ] Section ordering unchanged
- [ ] State visibility (loading/empty/error) preserved

### Render & review

- [ ] Render with REAL production data (or near-real sample)
- [ ] Screenshot at production viewport width (typically 414px iPhone)
- [ ] Compare side-by-side with "before" screenshot
- [ ] Ask: "would a first-time visitor experience this as
      *the same product*, just better?" If no, you've redesigned,
      not applied.

---

## Part III — Anti-patterns (with case study refs)

### AP-1. Italic festival
> *Symptom*: italic Latin in 5+ places on one screen.
> *Effect*: italic stops acting as accent, becomes base noise.
> *Fix*: budget 1–2 italic events per screen.
> *Ref*: [pdx-apply-c3 finding §4](../validation/pdx-apply-c3/findings.md)

### AP-2. Chinese display-serif-Bold trap
> *Symptom*: choosing LXGW 新晋宋 Bold (or similar heritage display)
> as H1 for non-heritage brand.
> *Effect*: brand reads as 古籍 / 老字号, not the intended modern/casual.
> *Fix*: H1 face is chosen by brand register, not by editorial taste.
> *Ref*: [pdx-apply-c3 finding §2](../validation/pdx-apply-c3/findings.md)

### AP-3. Signature move on wrong content quality
> *Symptom*: applying a cluster's signature visual (e.g. photo-overflow,
> drop-cap, gold rule) on content whose quality is lower than the
> cluster's source assets were.
> *Effect*: signature move *amplifies* the chrome-content gap rather
> than disguising it.
> *Fix*: cluster signature moves are tuned for the cluster's source
> asset quality. If user content is lower-quality, either upgrade the
> content collection (not always feasible) or skip the signature
> move (usually correct).
> *Ref*: [pdx-apply-c3 finding §3](../validation/pdx-apply-c3/findings.md)

### AP-4. Decorative type on user-generated names
> *Symptom*: rendering "老王 / Fanding / 乐乐" in 楷体 / italic / display
> for editorial flourish.
> *Effect*: exoticizes neighbors as aesthetic objects; reads patronizing.
> *Fix*: default user-name treatment is body sans, same weight as metadata.
> *Ref*: [pdx-apply-c3 finding §5](../validation/pdx-apply-c3/findings.md)

### AP-5. AI-gen replacing user content
> *Symptom*: generating AI-styled "perfect" plant photos to replace
> real user-uploaded amateur photos for "consistency".
> *Effect*: bait-and-switch — chrome promises curated product, content
> can't deliver. Also: erases the actual product's purpose (user-generated).
> *Fix*: AI-gen assets only in chrome decoration slots (hero / section
> icons / empty-state). User content NEVER replaced.
> *Ref*: [pdx-apply-c1 finding](../validation/pdx-apply-c1/findings.md);
> user redirect mid-task on 2026-05-17: "我觉得可以从数据库里面取一些真数据来做demo"

### AP-6. Surface warmth removed for cleanliness
> *Symptom*: card background goes from warm cream (`#FDFAF7`) to pure
> white (`#FFFFFF`) for "catalog cleanliness".
> *Effect*: clinical-cold. The warmth was the brand's main emotional cue.
> *Fix*: preserve warmth unless register elevation demands clinical
> (luxury catalog only).
> *Ref*: [pdx-apply-c3 finding §6](../validation/pdx-apply-c3/findings.md)

### AP-7. Pure neumorphic full-screen
> *Symptom*: full-screen neumorphic — cards, body, controls all in
> pillowy raised/inset shadows.
> *Effect*: "what's clickable" problem; low contrast; accessibility fail.
> *Fix*: neumorphic is a surgical accent material. Apply only to
> specific affordances (CTAs, counts, thumb wells), keep cards/body flat.
> *Ref*: [pdx-apply-c2 finding](../validation/pdx-apply-c2/findings.md)

### AP-8. Color semantic break in dark mode
> *Symptom*: dark mode apply repaints free=green tag as "darker accent",
> paid=red as "muted accent" — semantic distinction lost.
> *Effect*: users can't visually distinguish free/paid/barter at a glance.
> *Fix*: dark mode applies on multi-color tag systems must anchor tag
> colors to the **card surface** (cream/light cards floating on dark
> page), not the page itself.
> *Ref*: [pdx-apply-c4 finding "Color semantic remap"](../validation/pdx-apply-c4/findings.md)

---

## Part IV — Materials Library

Reusable patterns extracted from the 5 case studies, organized
by signature type. Each entry includes provenance and copy-paste-able
CSS sketch.

### A. Card surfaces

#### A1. Warm-cream pillowy card (Cluster 1, polymer clay diorama)
Best for: neighborhood / craft / community-board brands.
```css
.card {
  background: #FDFAF6;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(60, 45, 25, 0.08),
              0 1px 3px  rgba(60, 45, 25, 0.05);
}
```

#### A2. Flat-cream card with inset thumb-well (Cluster 2, neumorphic surgical)
Best for: when you want neumorphic depth on photos without sacrificing card body readability.
```css
.card { background: #F4F0E6; border-radius: 14px; box-shadow: 0 1px 2px rgba(120, 105, 75, 0.08); }
.card-thumb {
  background: #DCD8CC;
  box-shadow: inset -3px -3px 6px rgba(255, 255, 255, 0.60),
              inset  3px  3px 6px rgba(160, 145, 110, 0.22);
}
```

#### A3. Cream-island card floating on dark page (Cluster 4, dark forest)
Best for: dark-mode apps that need to preserve amateur user photo quality.
```css
.card {
  background: #F7F1E3;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28),
              0 1px 2px  rgba(0, 0, 0, 0.30);
}
/* User photos live inside this card, NEVER touching dark page directly */
```

#### A4. Parchment paper-grain card with dashed border (Cluster 5)
Best for: artisanal / heritage / hand-crafted brands. (See pdx-apply-c5/)

### B. CTA button vocabularies

#### B1. Chunky 3D-extrusion CTA (Cluster 1)
```css
.btn-cta {
  background: #1A3D2B; color: #FAF6EE;
  box-shadow: 0 3px 0 rgba(26, 61, 43, 0.16),
              0 6px 14px rgba(26, 61, 43, 0.18),
              inset 0 1px 0 rgba(255,255,255,0.55);
  transition: transform 120ms ease;
}
.btn-cta:active { transform: translateY(2px); }
```

#### B2. Neumorphic raised pill (Cluster 2)
```css
.btn-cta {
  background: #E8E4D9; color: #1A3D2B;
  box-shadow: -4px -4px 10px rgba(255, 255, 255, 0.85),
               4px  4px 10px rgba(160, 145, 110, 0.30);
}
.btn-cta:active {
  box-shadow: inset -2px -2px 4px rgba(255, 255, 255, 0.55),
              inset  3px  3px 6px rgba(120, 105, 75, 0.28);
}
```

#### B3. Cream-filled on dark / gold-ghost (Cluster 4)
Primary: cream fill on dark bg. Secondary: gold-outline ghost.
```css
.btn-cta-primary {
  background: #F4EBD4; color: #163326;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.20);
}
.btn-cta-secondary {
  background: transparent; color: #F4EBD4;
  border: 1px solid #9F8240;
}
```

### C. Count-badge vocabularies

#### C1. Soft pill on warm bg (Cluster 1)
```css
.count { background: #D8F3DC; color: #1A3D2B; padding: 3px 8px; border-radius: 9999px; }
```

#### C2. Neumorphic raised pill (Cluster 2)
```css
.count {
  background: #E8E4D9; color: #1A3D2B; padding: 5px 12px; border-radius: 9999px;
  box-shadow: -2px -2px 5px rgba(255,255,255,0.80), 2px 2px 5px rgba(160,145,110,0.25);
}
```

#### C3. Gold Latin numeral (Cluster 4)
```css
.count { font-family: Inter, sans-serif; color: #C9A75A; font-weight: 500; letter-spacing: 0.05em; }
```

### D. Section-head treatments

#### D1. Friendly icon-prefixed title (Cluster 1)
Small clay/illustrated icon (24–28px) to the LEFT of the title.

#### D2. Gold rule + uppercase Latin eyebrow (Cluster 4)
```html
<div class="section-eyebrow"><span>OFFER · 供</span></div>
<!-- ::before and ::after pseudo-elements with thin gold lines extending left/right -->
```
Use sparingly — max 2 per screen.

### E. Empty-state thumb treatments

| Style | Strategy |
|---|---|
| Generic emoji (current pdx-gardener) | Universal fallback, low effort, looks placeholder-y |
| Cluster decoration asset (C1) | Replace emoji with clay-frond / clay-pot / clay-leaf rotation |
| Subtle inset emoji (C2) | Emoji in a soft inset-shadow well — adds depth without replacement |
| Botanical monoline icon (C4) | Single-color line illustration on cream — needs custom icon design |

### F. Typography stacks

#### F1. Community / neighborhood (used in C1, C2)
```css
--font: "PingFang SC", "Source Han Sans SC", "Noto Sans SC", -apple-system, sans-serif;
```

#### F2. Editorial heritage (use sparingly — see AP-2)
```css
--font-display: "LXGW XinJin Song", "Source Han Serif SC", serif;
/* ONLY for brands that are literally heritage/library/literary */
```

#### F3. Latin editorial accent (max 1–2 events per screen — see AP-1)
```css
--font-latin-accent: "Fraunces", "Cormorant Garamond", serif;
/* Use italic via the font's italic axis, NOT CSS font-style:italic on Chinese */
```

### G. Botanical decoration assets

Reusable AI-generated PNG assets, generated via gpt-image-1 with
`background: transparent`. See `validation/cluster1-hero/public/assets/`.

| Asset | File | Best use |
|---|---|---|
| Polymer clay terracotta pot | `clay-pot.png` (1.4 MB, 1024×1024) | Hero accent, section decoration |
| Polymer clay fern frond | `clay-frond.png` (1.8 MB) | Empty-state thumb, section decoration |
| Polymer clay monstera leaf | `clay-leaf.png` (1.9 MB) | Section head icon |

> **File-size note**: 1.4–1.9MB per asset is HEAVY. In a real ship,
> these would be optimized to ≤200KB each (resize to 256×256 + AVIF
> or webp). The validation demos keep them at original size for
> visual fidelity in screenshots.

### H. Real production data fetching

Pattern: pull from production API endpoints into a snapshot.json,
hot-link real media thumbnails from the production CDN.

```bash
# pdx-gardener public endpoints (no auth)
curl 'https://pdxgardener.com/api/market' > market-snapshot.json
curl 'https://pdxgardener.com/api/wants'  > wants-snapshot.json
# Thumbnails:
# https://pdxgardener.com/api/media/{photo_id}/thumb  (480px cached)
```

Save snapshots in each apply directory so the demo is reproducible
even if production data drifts.

---

## Part V — Real data is non-negotiable

Apply demos that use generated placeholder content are **strictly
inferior** to demos that use real production data. This is not a
stylistic preference — it's the methodology.

Why:
- AI-generated placeholder photos all have consistent quality, which
  hides chrome-content mismatch. Real content surfaces it.
- Real Chinese product names like "Cherokee purple tomato · 大黑番茄苗"
  reveal bilingual typographic challenges that placeholders can't.
- Real user names ("Fanding / 乐乐 / 李大草") reveal owner-name
  treatment problems that fake names ("User 1, User 2") can't.
- Real photo quality variance (some hand-held muddy, some staged)
  is the actual stress test.

If the project has a public API, use it. If it has a database snapshot,
use it. If it has neither, hand-pick 10 real examples from screenshots
of the production app and reconstruct them in the demo.

**The mid-task user redirect on 2026-05-17 ("我觉得可以从数据库里面取
一些真数据来做demo") is the canonical rule.** Memorize it.

---

## Part VI — Five case studies, side-by-side reference

See [comparison.md](./apply-methodology-comparison.md) for the full
5-way side-by-side analysis. Quick reference table:

| Cluster | Strategy | Distance | Result | Best for |
|---|---|---|---|---|
| C1 polymer clay | Full | 1 | ✅ Best | Neighborhood, community board, craft |
| C2 neumorphic | Surgical | 1 | ⚠️ OK | When you want depth on photos without losing card readability |
| C3 editorial | Full (attempted) | 3 | ❌ Failed | Heritage seed catalog, luxury commerce — NOT community apps |
| C4 dark forest | Structural | 3 | ⚠️ OK | Curated boutique, lookbook brands, dark-mode-by-policy apps |
| C5 parchment watercolor | Full | 1 | ✅ Works | Artisanal, hand-crafted, gentle elevation |

---

## Appendix — Glossary

- **Cluster**: a coherent visual language extracted from the
  Moodboard pipeline. Each cluster has its own palette, typography,
  surface treatment, and signature moves.
- **Apply**: the act of overlaying a cluster's chrome onto a
  product whose UX is already established.
- **Chrome**: the surrounding visual layer — typography, surfaces,
  shadows, dividers, decorative elements. Not the content.
- **Content**: user-generated material — photos, product names,
  user names, free-text fields. Untouchable.
- **Signature move**: a cluster's most identifiable single visual
  trick (e.g. photo-overflow on cards for C3, dual pillowy shadow
  for C1, gold uppercase eyebrow for C4).
- **Register**: the emotional / cultural / class signal the chrome
  sends. Distance is measured on the register scale (§I.3).
- **Elevation**: deliberately moving the chrome up the register
  scale beyond the content register. Optimal range: 1 notch.
- **Inflation**: using a scarce visual accent (italic, gold, drop-cap)
  too many times until it stops functioning as accent.

---

*This handbook is living. Each new apply case study should
add a finding to its own directory and update this handbook's
materials library and anti-pattern list.*
