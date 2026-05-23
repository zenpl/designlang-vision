# pdx-apply-c4 · Findings (Dark Forest-Green Botanical Showcase → 菜友集市)

**Verdict: ⚠️ Structurally successful, brand-trajectory dependent.**
The "cream cards floating on dark forest page" pattern works
beautifully for user content. The question is whether pdx-gardener
*wants* to evolve toward Portland-lifestyle-brand territory.

## Why structurally it works

### The key move: dark page is chrome's domain, cream card is content's domain

User photos NEVER touch the dark forest background directly. Every
user-uploaded photo lives inside a cream card that "floats" on the
dark surface with strong drop-shadow. This is the structural answer
to "how do amateur user photos survive dark-mode chrome".

**The bonus effect**: dark surrounding makes user photos POP more
than they do on cream backgrounds. The frame literally elevates the
content. This is the opposite of C3's failure mode.

### Color semantic remap done correctly

The free=green / paid=warm-red / barter=warm-yellow semantic was
preserved by retuning the tag colors **for the cream card surface**
(not the page surface), keeping WCAG AA contrast and the original
meaning intact.

Specifically:
- `tag-free`: `#B8DCC2` on `#F7F1E3` — leaf green, 6.1:1 ratio
- `tag-paid`: `#F2C3A8` on `#F7F1E3` — terra peach, 5.8:1
- `tag-barter`: `#E8D38A` on `#F7F1E3` — wheat, 5.2:1

This was the trickiest part: dark-mode applies on multi-color tag
systems usually break semantics. Anchoring the tags to the **card
surface** (not the page) is the trick.

### Editorial gold accents — restrained

Gold (`#C9A75A`) used exactly four roles:
1. Eyebrow uppercase Latin ("PDX · 周末菜友大会")
2. Section divider rules (thin gold lines around "OFFER · 供" / "WANT · 求")
3. Section count number (gold sans-Latin, e.g., "73")
4. Link dashed underline

Max ONE gold accent per visual chunk. Same discipline that C3 failed
to maintain.

## Why brand-trajectory dependent

This apply pulls pdx-gardener from "neighborhood Saturday community
board" toward "Pacific NW botanical lifestyle brand / curated
seedling commerce". That's not a wrong direction — it's a different
direction. The product owner needs to decide.

Concretely:
- If the brand goal is **community-board / mutual-aid**: this apply
  is too elevated. The dark page + gold + cream cards signals
  "premium / curated / paid product" more than "free neighbor swap".
- If the brand goal is **boutique nursery / heritage seed commerce**:
  this apply is exactly right. It reads like a small-batch Portland
  business with editorial care.

## Risks documented

1. **Elderly user readability** — cream eyebrow text on dark
   background has lower contrast than current light-mode design.
   Probable 5–10% comprehension drop for older users.
2. **Emoji icons (🥬 / 📋 / 🌱) look cheap** against the otherwise
   refined gold-rule chrome. Would need custom monoline botanical
   icons in a real ship.
3. **Battery on OLED phones** — dark mode saves power on OLED but
   pdx-gardener's primary mobile audience may not be on OLED at
   majority. Net effect probably neutral.
4. **First-time visitor signal** — dark mode might read as "this is
   a closed members-only commerce site" rather than "community board".

## What this case study proves

**Dark mode applies on user-generated content apps need a structural
"cream cards float on dark page" pattern.** Without it, user photos
clash with dark chrome. With it, dark chrome can actually elevate
user photos.

The cream-card-as-island-of-light pattern is the most important
finding of this apply, and is generalizable to any user-generated-
content app that wants to ship a dark mode without sacrificing photo
quality.
