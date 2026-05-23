# Validation findings — Cluster 1 Hero (M3 output)

Date: 2026-05-22.
Source moodboard: `out/m12-10img-sonnet/m12-sonnet-moodboard-analysis.json` (10 images).
M3 outputs used: `m3-sonnet-{tailwind.config.js, recipes.css, design-tokens.json}` + `m3-sonnet-prompts/implementation.md`.
Constraint: I built only from `implementation.md`. I did NOT look at the source images or the MoodboardDesign JSON while writing code.

Each finding has:
- **Severity**: blocker / major / minor / nit
- **Gap**: what implementation.md (or sibling M3 file) didn't cover
- **What I invented** to keep building
- **Prompt edit suggested** for next M3 iteration

---

## ✅ What worked from M3 output (positive findings — keep these)

- **`.vrec-claycard`** applied cleanly: matte off-white background (#FAFAF8), 24px radius, soft drop shadow. Visually distinguishable from cream body. The recipe ships with `overflow: visible` already set, so child props erupt without further CSS.
- **`.vrec-claytile`** ships ready-to-use: white bg, 12px radius, dual shadow (outer + inset). Both stat tiles ("12 species" / "14k growers") work as-is with just a `<div class="vrec-claytile">`.
- **`.vrec-claypillbutton`** has all the right shape + color when applied to a non-`<button>` element.
- **Tailwind color tokens** are accessible via utilities (`text-green-deep`, `text-green-darkest`, `bg-warm-beige` for body). Naming is semantic enough that I didn't need to look up hex values.
- **`.vrec-botanicaloverflow`** correctly positions absolute + drop-shadow filter for any SVG/PNG element I want to erupt from the card boundary.
- **The cluster contradiction callouts** in implementation.md §4 ("Contradicts Cluster 2: No cast shadows from 3D objects" etc.) directly told me what NOT to mix in — useful negative space.

---

## Finding #1 — `tailwind.config.js` has no `content` array (BLOCKER for Tailwind v3 users)

- **Severity**: blocker
- **Gap**: M3's `tailwind-config.js` emitter produces a config with only `theme.extend.*`. Tailwind v3 silently emits nothing without `content: [...]`. A developer importing this config gets an empty stylesheet and has to guess they need to add `content`.
- **What I invented**: a sibling `tailwind.config.local.cjs` wrapping the vendored M3 config and adding `content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx}']`.
- **Prompt edit**: `src/vision/emitters/tailwind-config.js` should emit a `content: ['./**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}']` default with a comment "adjust to your project structure". OR emit Tailwind v4 syntax (`@theme` block in CSS) which doesn't need `content`.

---

## Finding #2 — No layout specification for Cluster 1 hero

- **Severity**: major
- **Gap**: implementation.md §4 says "3D props must erupt from / wrap around card boundaries" and "use sculptural backgrounds" — qualitative. §8 says "use `.vrec-claycard` panels with overflowing 3D props" — also qualitative. **There is no concrete layout spec**: how many panels? Is the hero a single card or a grid? Where do the props live (top? side? both? corner?)? What's the typical headline-CTA-asset structure?
- **What I invented**: A single full-width card with 2-column grid (copy left, visuals right), 2 stat tiles in the visual column, monstera leaf erupting top-right, clay pot erupting bottom-right, sculptural blob bg behind heading. Whether this matches the moodboard's actual Cluster 1 layout is unknown until I cross-check against source images.
- **Prompt edit**: For each cluster, implementation.md should include a **concrete layout sketch** drawn from the cluster's source observations. E.g. for Cluster 1: "Card is typically 720–900px wide, ≥480px tall. Props appear in the top-right or bottom-right quadrant 60–80% of the time. Hero usually has 2-column split: text left, visual cluster right with 1–3 stat tiles + 1–2 erupting props." Without this, a developer building from the prompt invents layout from scratch.
- **Reference**: Cluster 3 actually DOES get a concrete layout rule (`position: absolute; top: -24px; left: 50%; transform: translateX(-50%)`). Cluster 1 deserves the same.

---

## Finding #3 — No asset sourcing guidance for 3D props

- **Severity**: major
- **Gap**: Cluster 1's "matte clay 3D props" are the core depth signal. implementation.md tells me to use them but doesn't say where to get them. A real developer reaching for "matte clay food / botanical / textile props" has to: (a) commission 3D renders, (b) buy stock, (c) source from a library. None of these are flagged.
- **What I invented**: Inline SVG monstera + pot. The pot looks plausibly clay-like. The monstera looks more like a heart with two eyes — clearly NOT a matte clay 3D render. The validation hero captures the SHAPE of Cluster 1 but not the MATERIAL.
- **Prompt edit**: implementation.md should add a sub-section "Asset sourcing notes" that lists:
  - "These recipes expect PNG/SVG cutouts at `<your-asset-path>/cluster-1/{plant, food, object}-*.png`"
  - "If you don't have 3D-clay rendered assets, use placeholder rectangles + commission later — DO NOT substitute with photographic plants (that's Cluster 3 material), DO NOT use flat illustrations (that's Cluster 5)"
  - Optionally suggest free/paid sources (Pixabay 3D, Spline, Blender Market) but be careful not to endorse anything that could lapse.

---

## Finding #4 — Typography token doesn't map to a font stack

- **Severity**: minor
- **Gap**: tokens.typography has `'heading-clay': 'geometric sans-serif, light–regular weight, wide tracking, low contrast'`. This is a style description, not a CSS `font-family` value. tailwind.config.js correctly emits this as a comment (not a fontFamily key) — so the developer sees the guidance but has no token to actually use.
- **What I invented**: I let it fall back to the system sans (`ui-sans-serif, system-ui, ...`) and added Tailwind utilities like `font-light tracking-tight`. Looks OK but isn't anchored to a chosen typeface.
- **Prompt edit**: Either (a) the synthesizer should propose ONE concrete font stack per typography style ("`heading-clay`: `'Inter', 'Mona Sans', system-ui, sans-serif` — geometric sans, light–regular weight"), so it's directly usable. OR (b) the tailwind emitter should emit a `theme.extend.fontFamily.heading-clay: ['system-ui', 'sans-serif']` as a sensible default with a comment "swap for your chosen font". Currently the developer is left to pick blindly.

---

## Finding #5 — `@import './recipes.css'` is silently dropped by Vite + PostCSS

- **Severity**: major (for users on Vite); minor (for users on plain HTML or webpack)
- **Gap**: A natural way to load recipes.css alongside Tailwind is to `@import` it from the entry CSS. Vite's PostCSS pipeline doesn't inline this; the styles vanished with no error.
- **What I invented**: load `recipes.css` via a separate `<link rel="stylesheet">` in HTML. But Vite then served the CSS as a JS module with HMR wrapping → browser parsed it as broken CSS. **Required fix**: move recipes.css into `public/` so Vite serves it verbatim.
- **Prompt edit**: implementation.md should have a small "Integration" section per common framework:
  - **Vite + Tailwind**: place `recipes.css` in `public/` and link via `<link rel="stylesheet" href="/recipes.css">`. Or use `?inline` import.
  - **Next.js / app router**: import `recipes.css` from `app/layout.tsx`.
  - **Plain HTML**: `<link rel="stylesheet" href="recipes.css">` works directly.
- This is the single biggest "drop-in friction" gap I hit.

---

## Finding #6 — Tailwind preflight + cascade layer order beats recipe styles on `<button>`

- **Severity**: major
- **Gap**: When I applied `.vrec-claypillbutton` to a `<button>` element, several declarations didn't take effect (bg → transparent, color → black, padding → 0). Tailwind preflight resets `button { background-color: transparent; padding: 0; color: inherit; }` in `@layer base`. The recipe is in `@layer recipes-cluster-...`. By cascade layer rules the recipe should win, but the way Vite + PostCSS emit Tailwind's directives may put preflight outside the layer system (unlayered → wins over all layered rules).
- **What I invented**: Used `<a>` instead of `<button>` (preflight doesn't reset anchor bg/color/padding).
- **Prompt edit**: Two ways to fix at the emitter:
  1. **`recipes-css.js` emits each clay button rule with element-specific specificity**: write `button.vrec-claypillbutton, a.vrec-claypillbutton, [role="button"].vrec-claypillbutton { ... }`. This bumps the specificity past `button` element selectors and works regardless of cascade layer placement.
  2. **Add `appearance: none; -webkit-appearance: none;`** plus explicit `background-color`, `padding`, `color`, `border`, `font` in every interactive recipe so they're not inheriting from Tailwind preflight resets. More verbose but defensive.
  
  I'd ship (1) — it's a one-line emitter change.

---

## Finding #7 — `box-shadow` shorthand resets `inset` parts when combined with Tailwind shadow utilities

- **Severity**: nit
- **Gap**: didn't actually hit this, but it's the next gotcha — if a developer uses Tailwind's `shadow-md` on a `.vrec-claycard` for whatever reason, the Tailwind shadow utility's `box-shadow` overrides the recipe's. recipes are by-class-name only; Tailwind has higher specificity-per-property when both target the same element.
- **What I invented**: didn't combine. The recipe alone was sufficient.
- **Prompt edit**: implementation.md should add a "Don't combine recipes with Tailwind shadow/bg utilities on the same element — recipes are the source of truth" note.

---

## Finding #8 — implementation.md §6 lists recipes but doesn't show usage examples

- **Severity**: minor
- **Gap**: §6 says "Use `.vrec-claycard` for hero diorama panels" — useful as inventory, but no minimal HTML example shows what's inside a claycard (typically). For a recipe, "use it for X" leaves the structure (padding? grid? typography hierarchy?) entirely undefined.
- **What I invented**: 2-column grid, 64px padding, headline + subtitle + button + tile arrangement.
- **Prompt edit**: each recipe in §6 should have a 5-line skeleton HTML snippet:
  ```
  ### .vrec-claycard
  Use for: hero diorama panels with overflowing 3D props.
  Skeleton:
    <article class="vrec-claycard p-12 grid md:grid-cols-2 gap-8">
      <div><h1>...</h1><p>...</p><a class="vrec-claypillbutton">...</a></div>
      <div><img class="vrec-botanicaloverflow" .../></div>
    </article>
  ```
  This is `implementation-prompt-md.js` enrichment, not a new file.

---

## Net assessment: M3 prompt + outputs are **80% there**

Once the 4 blockers/majors above are addressed (content array, layout sketches per cluster, asset sourcing notes, framework integration notes), the M3 output should be a developer-droppable design system. Right now it's "designer-readable with a few hours of footwork".

**Priority order for next M3 iteration** (in order of impact ÷ effort):
1. Finding #1 (tailwind content array) — 1-line emitter change, blocker for Vite users.
2. Finding #6 (button selector specificity in recipes-css) — 1-line emitter change, removes the worst gotcha.
3. Finding #5 (framework integration notes in implementation.md prompt) — prompt edit, eliminates the @import vs public/ confusion.
4. Finding #2 (concrete layout sketches per cluster in implementation.md) — prompt edit, biggest qualitative gap.
5. Finding #3 (asset sourcing notes) — prompt edit.
6. Finding #4 (font stack mapping) — synthesizer prompt edit (M2), since tokens.typography comes from M2 not M3.
7. Finding #8 (skeleton HTML per recipe) — prompt edit.

Findings #4 and #6 touch the M2 synthesizer prompt, not just M3 emitters. Worth folding into the next M2 iteration if we re-run synthesis.
