# Build in the "Botanical Dimensional UI: Clay Diorama + Neumorphic + Editorial Commerce" style

## 1. Style Identity

This moodboard defines a five-cluster botanical UI system where green — from light sage to deep forest — is the universal brand hue, and botanical/food/plant elements are the universal decorative material. The clusters span: matte clay 3D diorama panels with aggressive overflow props (35%), neumorphic soft-extrusion mobile surfaces (20%), editorial flat e-commerce on white (15%), dark forest-green studio product showcases (20%), and artisanal flat parchment café UI (10%). The system is built for nature-brand digital products — apps, storefronts, and marketing pages — that need dimensional warmth without glassmorphism.

---

## 2. Cluster Mix

| Cluster | Weight | Source IDs | DNA Summary |
|---|---|---|---|
| Matte Clay 3D Botanical Diorama UI | 35% | img_01, img_02, img_05, img_07 | Matte clay panels; 3D botanical props erupt from card edges; warm pastel palette; depth via cast shadows + occlusion |
| Neumorphic Soft-Extrusion Mobile UI | 20% | img_08, img_09 | Dual soft-shadow pairs on monochromatic grey; no clay; photo cutouts are only overflow element |
| Editorial Botanical Commerce (Light Background) | 15% | img_04, img_08 | Flat white cards; photographic plant cutouts; deep forest-green CTAs; serif/sans hierarchy |
| Dark Forest-Green Botanical Product Showcase | 20% | img_06, img_10 | Flat matte `#1A3D2B` backdrop; 3D/photo botanicals staged against it; gold-cream serif type |
| Artisanal Flat Parchment Café UI | 10% | img_03 | Fully flat 2D; parchment surfaces; watercolor illustrations; zero shadows; strictly contained |

---

## 3. Universal MUST and MUST-NOT

**Use `overflow: visible` on every card container that hosts a boundary-breaking botanical element — clipping destroys the primary depth signature.**

**Never apply `backdrop-filter: blur()` or frosted glass — matte opaque surfaces are the universal material rule across all five clusters.**

**Use a green from the `green-light` → `green-darkest` token range as the primary brand hue on every screen.**

**Use soft diffuse shadows only — never hard-edged drop shadows; all shadow tokens are pre-calibrated for this.**

**Use pill/stadium shapes (`border-radius: 999px`) for all primary interactive buttons and toggles.**

**Use rounded rectangle cards with `border-radius` between `tile-sm` (12px) and `card-lg` (24px) as the universal layout container.**

**Use geometric sans-serif at light–regular weight for all body and label text.**

**Keep saturation low-to-medium throughout — no vivid primaries; all accent colors (`peach-coral`, `gold-accent`) are warm-muted.**

**Position decorative botanical PNG/SVG cutouts with `position: absolute; pointer-events: none` — never as inline flow elements.**

---

## 4. Cluster-Bound Rules

### Matte Clay 3D Botanical Diorama UI (Clusters 1)
- 3D food, botanical, or textile props **must** erupt from or wrap around card boundaries — the overflow break is the primary depth signal, not shadow alone.
- Card surfaces are matte clay or thick paper — **no specular highlight, no gloss, no frosting**.
- Use blob/organic background forms or paper-cutout leaf layers inside card interiors as sculptural backgrounds.
- Lighting is soft diffuse upper-left; use `clay-contact` shadow token (`filter: drop-shadow(0 6px 8px rgba(0,0,0,0.15))`) on 3D prop elements to ground them on the card surface.
- **Contradicts Cluster 2:** Do not use dual neumorphic shadow pairs here — depth comes from cast shadows and occlusion between 3D objects, not CSS shadow pairs.
- **Contradicts Cluster 5:** Overflow and boundary-breaking are mandatory here; Cluster 5 forbids them entirely.

### Neumorphic Soft-Extrusion Mobile UI (Cluster 2)
- Card, button, and body background **must share the exact same base color** — use `surface.neumorphic-base` (`#E8E8E8`) for all three. The illusion collapses if they differ.
- Raised elements use `shadow.neumorphic-raised`; recessed elements (inputs, progress bars) use `shadow.neumorphic-inset`.
- Photographic flower/album cutouts are the **only** permitted boundary-breaking element — no 3D clay renders, no botanical props.
- Accent is a single sage-green or orange; do not introduce warm pastel palette from Cluster 1.
- **Contradicts Cluster 1:** No cast shadows from 3D objects — shadow pairs are the sole depth mechanism.

### Editorial Botanical Commerce — Light Background (Cluster 3)
- Use photographic plant/flower cutouts as the hero visual — not 3D renders.
- White/off-white card surfaces with `shadow.editorial-minimal` only — near-invisible borders.
- Deep forest-green (`green-darkest` `#1A3D2B` or `green-deep` `#4A7C59`) for all primary CTAs on light backgrounds.
- Product images break the top card boundary: `position: absolute; top: -24px; left: 50%; transform: translateX(-50%)`.
- Use semi-opaque white panels over photo backgrounds via `opacity` overlay — **not** `backdrop-filter`.
- Mix humanist serif for editorial headings with geometric sans for UI labels.

### Dark Forest-Green Botanical Product Showcase (Cluster 4)
- Background **must** be flat matte `surface.dark-studio` (`#1A3D2B`) — **no gradient, no texture**. Depth comes entirely from staged objects.
- 3D-rendered or photographic botanicals/food are the primary visual — removing them collapses the design.
- Use `gold-accent` (`#C8A84B`) or warm cream (`warm-cream` `#E8D5B0`) for serif/script headings on dark green.
- Use `red-accent-sparingly` (`#C0392B`) **only** as a category tag — never as button fill or section background.
- Circular icon panels may use `rgba(#1A3D2B, 0.7)` semi-transparent fill — the only permitted translucency instance in the entire moodboard.
- **Contradicts Cluster 5:** This cluster uses dark full-bleed backgrounds; Cluster 5 uses warm parchment light surfaces.

### Artisanal Flat Parchment Café UI (Cluster 5)
- Primary surface is `surface.parchment-base` (`#F5F0E6`) — no clay material, no neumorphic shadow, no 3D render.
- Decorative language is watercolor botanical illustrations and vintage stamp/seal logos — not 3D props.
- **All UI elements are strictly contained within their frames — zero overflow, zero boundary-breaking.**
- CTAs use `parchment` cluster recipe with `background: #3D5A2E` and `box-shadow: none` — adding elevation is an anti-pattern.
- Loyalty/progress widgets use SVG `stroke-dasharray` progress rings with botanical corner decorations.
- **Contradicts Clusters 1, 3, 4:** No overflow permitted here whatsoever.

---

## 5. Tokens to Use

### Colors
- `green-light`: `#88C4A0` — sage fill for Cluster 1 pill buttons, light accents
- `green-mid`: `#5A8A6A` — mid-tone botanical accent
- `green-deep`: `#4A7C59` — Cluster 3 secondary CTA
- `green-forest`: `#2D5A3D` — Cluster 4 product card background
- `green-darkest`: `#1A3D2B` — Cluster 4 studio backdrop, Cluster 3 primary CTA
- `peach-coral`: `#F4A070` — warm accent, Cluster 1 only
- `warm-cream`: `#F5F0E8` — Cluster 1 card background, Cluster 4 body text
- `warm-beige`: `#F0E6DC` — Cluster 1 secondary surface
- `parchment`: `#F5F0E6` — Cluster 5 surface only
- `off-white`: `#FAFAF8` — universal light neutral
- `neutral-grey`: `#E8E8E8` — Cluster 2 neumorphic base (must match card + body)
- `gold-accent`: `#C8A84B` — Cluster 4 headings on dark green
- `red-accent-sparingly`: `#C0392B` — Cluster 4 category tags only
- `orange-cta`: `#FF5722` — single focal-point accent, use sparingly

### Border Radius
- `tile-sm`: `12px` — small stat tiles, editorial product cards
- `card-md`: `16px` — standard cards
- `card-lg`: `24px` — hero panels, clay diorama cards
- `pill`: `999px` — all buttons and toggles universally
- `circle`: `50%` — icon discs, avatar containers

### Shadows
- `clay-card`: `0 12px 40px rgba(0,0,0,0.10)` — Cluster 1 hero panels
- `clay-tile`: `0 4px 12px rgba(0,0,0,0.08)` — Cluster 1 small tiles
- `clay-button`: `0 4px 10px rgba(0,0,0,0.10)` — Cluster 1 pill buttons
- `clay-contact`: `filter: drop-shadow(0 6px 8px rgba(0,0,0,0.15))` — on 3D prop elements only
- `neumorphic-raised`: `-4px -4px 10px #ffffff, 4px 4px 10px rgba(0,0,0,0.12)` — Cluster 2 raised surfaces
- `neumorphic-inset`: `inset 2px 2px 5px rgba(0,0,0,0.10), inset -2px -2px 5px #ffffff` — Cluster 2 recessed fields
- `editorial-minimal`: `0 1px 4px rgba(0,0,0,0.06)` — Cluster 3 flat cards

---

## 6. CSS Recipes to Call

### Cluster 1 — Matte Clay 3D Botanical Diorama UI
- Use `.vrec-claycard` for hero diorama panels that host overflowing 3D botanical props
- Use `.vrec-claytile` for small stat, info, or metric tiles within diorama layouts
- Use `.vrec-claypillbutton` for primary CTA buttons in clay/diorama screens
- Use `.vrec-botanicaloverflow` for any absolutely-positioned PNG/SVG botanical prop that breaks a card boundary (also valid in Clusters 3 and 4)

### Cluster 2 — Neumorphic Soft-Extrusion Mobile UI
- Use `.vrec-neumorphiccard` for raised card panels — ensure body background matches `neutral-grey` exactly
- Use `.vrec-neumorphicinset` for recessed inputs, progress grooves, and slider tracks

### Cluster 3 — Editorial Botanical Commerce (Light Background)
- Use `.vrec-editorialproductcard` for white product cards with photo-cutout top overflow
- Use `.vrec-botanicaloverflow` for the plant image positioned above the card top edge

### Cluster 4 — Dark Forest-Green Botanical Product Showcase
- Use `.vrec-darkstudiosection` for full-bleed dark-green backdrop sections
- Use `.vrec-darkproductcard` for product cards sitting on the dark studio background

### Cluster 5 — Artisanal Flat Parchment Café UI
- Use `.vrec-parchmentcta` for all CTAs — never add `box-shadow` on top of this recipe

---

## 7. Anti-Patterns

- **Applying `backdrop-filter: blur()` or any frosted glass effect** — the single most consistent anti-pattern across all 10 sources.
- **Setting `overflow: hidden` on a card that hosts a botanical overflow element** — silently destroys the entire depth signature.
- **Using the same shadow token across clusters** — `neumorphic-raised` on a clay card or `clay-card` shadow on a neumorphic surface both break the cluster's depth logic.
- **Matching neumorphic card color to anything other than the body background** — the illusion requires exact color identity between card and parent surface.
- **Adding `box-shadow` to `.vrec-parchmentcta`** — Cluster 5 is an anti-elevation design language; elevation is wrong here.
- **Using `red-accent-sparingly` as a button fill or section background** — it is a category-tag-only token.
- **Averaging all clusters into one bland "soft sage green" aesthetic** — each cluster has a distinct depth mechanism; flattening them into a single muted-green flat style erases the dimensional identity.
- **Using vivid/high-saturation primaries** — every color in this system is desaturated; vivid colors break the muted botanical tone.
- **Applying gradients or textures to the `dark-studio` background** — the flat matte `#1A3D2B` is load-bearing; any texture undermines the staged-object depth effect.
- **Using 3D clay props in Cluster 2 or Cluster 5 screens** — clay material language is exclusive to Cluster 1.

---

## 8. How to Choose a Cluster for a New Screen

For a **marketing splash or hero section** promoting a botanical/food/wellness brand, lead with **Cluster 1 (Clay Diorama)** — use `.vrec-claycard` panels with overflowing 3D props to create maximum dimensional impact. For a **mobile app dashboard or music/wellness player screen**, use **Cluster 2 (Neumorphic)** — the soft-extrusion shadow pairs read well at small component scale and on mobile. For a **product listing page or e-commerce catalog**, use **Cluster 3 (Editorial Commerce)** — flat white cards with photographic plant cutouts keep the focus on product photography. For a **premium product feature section or seasonal campaign** that needs drama, use **Cluster 4 (Dark Studio)** — the flat `#1A3D2B` backdrop with staged botanicals creates an editorial, high-end feel. Reserve **Cluster 5 (Parchment Café)** for loyalty screens, onboarding flows, or brand-story pages where artisanal warmth and zero-elevation flatness reinforce a handcrafted identity.
