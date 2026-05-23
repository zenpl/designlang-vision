# Validation findings — Cluster 2 mobile screen (M3.1 output)

Date: 2026-05-22 (follow-on to cluster1-hero/findings.md).
M3.1 outputs used: `out/m31-10img-sonnet/m31-{design-tokens.json, tailwind.config.js, recipes.css, prompts/implementation.md, prompts/asset-generation.md}`.
Constraint: built only from `implementation.md` + `asset-generation.md`. Did NOT look at source moodboard images.

The 4 M3.1 fixes from Cluster 1 validation are all live here. This run tests whether the M3.1 prompt + emitter patches generalize to a structurally different cluster (mobile dashboard, not marketing splash; photographic cutouts, not clay 3D).

---

## ✅ What worked from M3.1 output (cluster-2-specific)

- **`.vrec-neumorphiccard` + `.vrec-neumorphicinset`** drop in cleanly. Dual-shadow illusion holds because body + cards share `#E8E8E8`.
- **Button selector specificity bump (M3.1 fix #6) was relevant**: I used `<button class="vrec-neumorphiccard">` for the small raised disc controls (play, mindful, breath, queue-play, bottom nav). All rendered with the neumorphic shadow correctly — Tailwind preflight didn't reset them. Without fix #6 these would have been transparent flat circles.
- **Layout sketch was concrete enough**: implementation.md §4 Cluster 2 sketch specified `border-radius: 20px`, card 320–380×160–220, gap 20px, disc 56×56, peony `top:-28px right:16px width:~100px`. I copied these values almost verbatim; the page rendered usable on first try.
- **asset-generation.md Cluster 2 prompt produced on-brand photographic cutouts** (white peony, dried lavender sprig) — material language explicitly different from Cluster 1's clay 3D. The "DO NOT add 3D clay render" line in the prompt template clearly worked: neither asset looks like sculpted clay.

---

## Finding #C2-1 — Layout sketch doesn't anticipate disc-vs-progress collision

- **Severity**: minor
- **Gap**: §4 Cluster 2 sketch says progress groove is 48px tall + card-width-minus-32px AND raised disc is 56×56 at bottom-right. It does NOT say that the end-of-progress timestamp ("12:00") and the disc both want the bottom-right corner. In my rendered hero the pause disc obscures the right edge of the time label.
- **What I invented**: Put the disc over the time anyway, accepting partial occlusion. A real designer would either (a) move the time inline with the disc, or (b) place the disc below the progress on its own row.
- **Prompt edit**: implementation.md §4 should add to each cluster's layout sketch: "watch for collision between [absolutely-positioned overflow prop] and [bottom-right control], if both are emitted by the same recipe". Or just: "use the layout sketch as starting dimensions, then assume any element with explicit `position: absolute` will conflict with siblings — the sketch is a starting point, not a complete component spec".

## Finding #C2-2 — Card height range is too narrow for "Now Playing" content

- **Severity**: minor
- **Gap**: §4 Cluster 2 says "Cards 320–380px wide, 160–220px tall". My "Now Playing" card has overflowing peony + label + title + subtitle + progress + disc = needs ~220px AND tight padding. 160px would not fit any of that.
- **What I invented**: 220px (top of range). Worked.
- **Prompt edit**: Either expand range to 160–280px OR split into two card sub-types ("compact 160–180px for queue items, full 240–280px for active player"). The current single range conflates very different content densities.

## Finding #C2-3 — Asset prompt produced cooler colors than "naturally saturated"

- **Severity**: nit
- **Gap**: Cluster 2 asset prompt says "Colors naturally saturated but muted — no color grading beyond desaturation toward cool-neutral grey palette". gpt-image-1 interpreted this aggressively: the lavender sprig came out grey-purple, almost monochromatic. Beautiful and on-brand for the neumorphic cluster, but contrary to "naturally saturated".
- **What I invented**: nothing — used the asset as-is, it looks great.
- **Prompt edit**: This is actually a model behavior, not a prompt flaw. The current language pushed it toward the right outcome. Leave it.

## Finding #C2-4 — implementation.md §6 recipe inventory lists `.vrec-neumorphiccard` but not nested usage

- **Severity**: minor
- **Gap**: I used `.vrec-neumorphiccard` simultaneously on the outer card AND the inner raised disc buttons (different sizes, same recipe class). The recipe doesn't break — both layers get dual shadows — but the implementation.md doesn't tell the developer this is the intended way to make small raised discs. I had to figure it out from the dimensions in §4 ("disc buttons 56×56 using neumorphic-raised").
- **Prompt edit**: implementation.md §6 should clarify: "`.vrec-neumorphiccard` is multi-scale — use it on outer panels (180–220px tall, border-radius 20px) AND inner controls (48–56px, border-radius 50%). The shadow pair scales fine; just change `width`/`height`/`border-radius` per element."

---

## Net assessment: M3.1 holds up across clusters

All 4 M3.1 fixes survived the test. The findings here (C2-1 through C2-4) are minor refinements, not blockers. Most importantly:

- **No content was averaged across clusters.** Cluster 2's hero is unmistakably neumorphic + photographic, not "soft sage green" generic.
- **Layout sketches scaled to a structurally different screen** (mobile portrait dashboard vs landscape hero) without further authoring.
- **Asset prompts produced material-distinct cutouts.** Photographic peony ≠ Cluster 1's clay leaf.

Combined with the Cluster 1 baseline, this is empirical evidence the M2 cluster-before-consensus discipline + M3.1 prompt structure preserves cluster-specific identity through the full pipeline.

**Suggested follow-up edits** (defer; not blockers):
- C2-1 (collision warning), C2-2 (height range), C2-4 (multi-scale recipe note) → implementation prompt edits.
- C2-3 → leave as model behavior.

**Output:** `out/m31-10img-sonnet/m31-assets/cluster2-neumorphic/{open-peony, lavender-sprig}.png` (gitignored); validation files in `validation/cluster2-mobile/`.
