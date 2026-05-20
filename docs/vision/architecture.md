# Vision Adapter — Architecture

**Status**: design ratified, M1 not yet started.
**Last updated**: 2026-05-19.

---

## 1. Why this fork exists

Upstream `designlang` reads a **live website** via Playwright and pulls computed CSS / DOM facts into design-system outputs (DTCG tokens, Tailwind config, shadcn theme, component anatomy, prompt pack, etc.).

This fork keeps the **outputs** philosophy but swaps the **input source**:

```text
upstream :  URL  → Playwright crawler → DOM/CSS facts → extractors → outputs
this fork:  IMGS → vision crawler     → visual facts  → extractors → outputs
```

The fork is **not** "add an image flag to the existing crawler". The two pipelines look at different evidence and infer different things; collapsing them would dilute both. They sit side-by-side under `src/`.

---

## 2. Naming

New entry command:

```bash
designlang-vision moodboard <path-or-glob> [options]
```

`moodboard` (not `image`, not `vision`) because the realistic input is **a folder of related images** — single-image extraction is a degenerate case, not the main case.

---

## 3. Data flow

```
   images (folder|glob|list)
        │
        ▼
   image-loader.js  ──── normalize: jpg/jpeg/png/webp, EXIF strip, base64
        │
        ▼  (per image, parallel-limited)
   vision-client.analyzeImage(image, schema=ImageObservation)
        │
        ▼
   ImageObservation[]   ◄── M1 stops here, dumps to <name>-observations.json
        │
        ▼
   cluster() — group into visual subfamilies (NOT averaged)
        │
        ▼
   vision-client.synthesizeMoodboard(observations, clusters, schema=MoodboardDesign)
        │
        ▼
   MoodboardDesign      ◄── M2 stops here, dumps to <name>-moodboard-analysis.json
        │
        ▼
   vision-extractors run over MoodboardDesign:
     - vision-material-language
     - vision-depth-language
     - vision-composition-language
     - vision-implementation-recipes   (M3 only)
        │
        ▼
   emitters:
     - visual-language.md       (NEW — Style Thesis first, tokens later)
     - design-tokens.json       (reuses upstream tokens-json emitter via adapter)
     - tailwind.config.js       (reuses upstream tailwind emitter via adapter)
     - recipes.css              (NEW — material/depth/lighting recipes)
     - prompts/implementation.md (NEW — single page that another agent can use)
                                ◄── M3 ships these
```

**Principle: cluster before consensus.** Averaging 12 images that span 3 sub-theses collapses the whole report to "green + rounded + soft". Clusters are first-class in the schema; consensus is computed *over* clusters, weighted, and labeled with source support.

---

## 4. Core data structures

### 4.1 `ImageObservation` (per image)

```jsonc
{
  "source": {
    "id": "img_01",
    "path": "./moodboard/forest-card.jpg",
    "width": 736, "height": 1104,
    "sha256": "…"
  },
  "globalStyle": {
    "styleLabels": ["botanical", "soft-ui", "3d-diorama"],
    "mood": ["calm", "premium", "organic"],
    "visualDensity": "low" | "medium" | "high",
    "realismLevel": "flat-illustration" | "semi-realistic-3d" | "photographic" | "screenshot"
  },
  "palette": {
    "dominant": ["#1E3A2F", "#DCEAD7"],
    "accent":   ["#7BC89E"],
    "neutrals": ["#F7F1E8"],
    "temperature": "warm-muted" | "cool" | "neutral" | "warm",
    "saturation": "low" | "low-to-medium" | "medium" | "high"
  },
  "materials": [
    {"label": "frosted glass panel", "evidence": "…", "confidence": 0.86}
  ],
  "lighting": {
    "keyLightDirection": "upper-left" | "upper-right" | "top" | "ambient" | null,
    "shadowType": "soft-cast" | "contact" | "ambient-occlusion" | "hard" | "none",
    "edgeHighlights": "subtle warm rim" | "none" | …,
    "ambientOcclusion": "visible" | "subtle" | "absent"
  },
  "depth": {
    "layers": ["atmospheric background", "main panel", "foreground botanical"],
    "overlapPattern": "plants break the card boundary" | …,
    "depthCues": ["blur", "scale", "occlusion", "cast shadow"]
  },
  "composition": {
    "layoutType": "central object panel" | …,
    "safeArea": "center content, decorative edges",
    "edgeBehavior": "foreground crosses container boundaries" | "strictly contained"
  },
  "components": [
    {
      "role": "hero-card",
      "shape": "large rounded rectangle",
      "surface": "matte/glass hybrid",
      "shadow": "diffuse drop + contact",
      "implementationHint": "relative container with ::before glow and absolute foreground layers"
    }
  ],
  "typography": {
    "headingStyle": "geometric sans, soft, low-contrast",
    "bodyStyle":    "small, calm, low contrast",
    "letterSpacing": "slightly expanded labels"
  },
  "antiPatterns": [
    "flat green cards without object shadows"
  ],
  "_meta": {
    "model": "claude-…",
    "promptVersion": "image-analysis@1",
    "latencyMs": 2840,
    "tokens": {"input": 1500, "output": 800}
  }
}
```

Notes:
- All fields **may be null** except `source` and `_meta`. Vision model not seeing a field is normal; we never fail the whole image because `lighting.keyLightDirection` is missing.
- `antiPatterns` is **observation-scoped**: "this kind of imagery is often miscopied as …". It is NOT "what other images in the moodboard prevent" — that's a synthesis-stage concept.

### 4.2 `MoodboardDesign` (across images)

```jsonc
{
  "styleThesis": "Botanical Dimensional UI",
  "sourceCount": 12,
  "clusters": [
    {
      "name": "Pastel Clay Botanical Dashboard",
      "sourceIds": ["img_01", "img_05", "img_06"],
      "weight": 0.45,
      "dnaSummary": "…"
    },
    {"name": "Editorial Plant Commerce", "sourceIds": ["img_03"],            "weight": 0.25, "dnaSummary": "…"},
    {"name": "Dark Forest Diorama Card",  "sourceIds": ["img_04"],            "weight": 0.30, "dnaSummary": "…"}
  ],
  "consensus": {
    "materials": [
      {"label": "frosted glass panel",
       "supportSourceIds": ["img_01", "img_04", "img_07"],
       "supportClusterIds": [0, 2],
       "confidence": 0.84}
    ],
    "lighting":   { … },
    "depth":      { … },
    "palette":    { … },
    "components": [ … ],
    "implementationRules": [ … ]
  },
  "tokens":    { /* token candidates with source attribution */ },
  "recipes":   { /* CSS recipe candidates */ },
  "confidence": {
    "overall": 0.78,
    "perCluster": [0.85, 0.72, 0.81]
  }
}
```

**`supportSourceIds` is mandatory** for every consensus claim. Without it, the report drifts into ungrounded vibes. With it, every claim is traceable to specific images.

---

## 5. Pipeline stages

### 5.1 Per-image analysis (M1)

- One vision call per image (parallelism: max 4 in flight).
- Output validated against `ImageObservation` JSON schema.
- On invalid JSON: one retry with a **repair prompt** (`"Your previous output was [X]. The error was [Y]. Return corrected JSON only."`).
- On second failure: log + skip image, do **not** abort whole run.

### 5.2 Clustering (M2)

- Heuristic + LLM hybrid:
  - **Heuristic**: cosine similarity over `styleLabels`, `materials.label`, dominant palette LAB distance.
  - **LLM**: if heuristic produces low-confidence clusters, ask synthesis model to propose clusters with rationale.
- Output: `clusters[]` with explicit `sourceIds` and weights summing to 1.0.

### 5.3 Synthesis (M2)

- One synthesis call. Input: all `ImageObservation`s + proposed clusters. Output: `MoodboardDesign`.
- Schema-forced. Same retry policy.
- **Critical constraint in prompt**: "Do not produce consensus claims that lack `supportSourceIds`. If <2 images support a claim, mark it as cluster-local, not consensus."

### 5.4 Emission (M3) — revised after seeing M2 output

**Architecture change vs the original plan** (recorded so future agents understand why this section is different from earlier mentions):

The original plan had **two M3 sub-stages**: (a) four vision-specific *extractors* (`vision-material-language`, `vision-depth-language`, `vision-composition-language`, `vision-implementation-recipes`) that distill `MoodboardDesign` into more-structured intermediate shapes; (b) emitters that consume those intermediates. After running M2 on real moodboards and inspecting the sonnet output, the extractor layer became unnecessary scaffolding — the M2 synthesis already produces cluster-mapped materials, consensus claims with `supportSourceIds`, draft tokens with concrete hex values, and `implementationRules` containing concrete rgba shadow values. The extractor layer would have done what the synthesis pass already does, only worse (further away from the original images).

The original plan also had `design-tokens.json` and `tailwind.config.js` "reusing the upstream emitter via adapter". The upstream emitter is shaped for DOM-extracted `colors.all` / `typography.families` / `borders.radii` / `shadows.values` — our cluster-aware shape doesn't fit cleanly, and writing the adapter is roughly equivalent to writing a fresh emitter. We chose fresh, with output that's DTCG-compatible at the byte level so downstream tools that read DTCG see something equivalent to what the upstream produces.

**The revised M3 has only emitters, no extractors.** Five emitters, mixed template/LLM:

| File | Source | Mode | Notes |
|---|---|---|---|
| `<name>-design-tokens.json` | `MoodboardDesign` | **Template** | DTCG-style nested groups: `{color, borderRadius, shadow, typography, ...}`. Walks `design.tokens` + `design.consensus.palette/components`. Deterministic, no API call. |
| `<name>-tailwind.config.js` | `MoodboardDesign` | **Template** | `theme.extend.{colors, borderRadius, boxShadow, fontFamily}`. Same source as the json. Output is `module.exports = {...}` valid Node CommonJS. |
| `<name>-recipes.css` | `MoodboardDesign` | **Template** | CSS file with `@layer recipes-consensus { ... }` + per-cluster `@layer recipes-cluster-<slug> { ... }`. Walks `design.consensus.implementationRules` + `design.recipes` + `clusters[].localClaims`. Cluster-scoped intentionally — so a 5-cluster moodboard doesn't get its recipes flattened. |
| `<name>-visual-language.md` | `MoodboardDesign` | **LLM** | Narrative markdown, section order: Style Thesis → Cluster Map → Visual DNA → Material → Depth → Lighting → Composition → Components → Tokens → Recipes → Anti-patterns. Force-tool-use is not used — the output is markdown, asked from the model directly with the design as JSON context. |
| `<name>-prompts/implementation.md` | `MoodboardDesign` | **LLM** | One-page, Cursor/Claude-Code-pasteable. Calls out cluster-bound rules (`overflow:visible` for the Diorama cluster, `mix-blend-mode: multiply` for the Parchment cluster, etc.) so a downstream agent knows which subset of rules to apply. |
| `<name>-moodboard-analysis.json` | (already emitted by M2) | — | The raw `MoodboardDesign`. M3 reads this; M3 doesn't overwrite it. |

`shadcn-theme`, `figma-variables`, `clone`, `apply`, `mcp` — **not in MVP**. Revisit after M3 output quality is validated.

---

## 6. Reuse vs new

### Reused as-is
- `bin/design-extract.js` infrastructure (commander setup, dispatch).

### New
- `src/vision/` (entire subtree).
- `src/vision/emitters/` — 5 files (3 template, 2 LLM) + an index `emitFromDesign(design, opts)`.

### Dropped from original plan (after M2 evidence)
- The 4 vision extractors (`vision-material-language`, etc.) — M2 synthesis output is rich enough that an extra distillation layer was redundant.
- Upstream `tokens-json` / `tailwind` emitter adapters — our shape doesn't map cleanly; fresh emitters with DTCG-compatible output are simpler.

### Untouched (kept for future / reference / DOM-fallback)
- `src/crawler.js`, `src/extractors/material-language.js`, `src/extractors/imagery-style.js`, etc.
- Upstream's own `moodboard` if any (none at fork-base v12.14.0).

---

## 7. MVP slicing

### M1 — minimum observable

**Goal**: prove vision model produces usable structured observations on real moodboard images.

Deliverables:
- `designlang-vision moodboard <glob>` command.
- `src/vision/image-loader.js`.
- `src/vision/vision-client.js` (Anthropic Claude only; other providers stubbed but not wired).
- `src/vision/prompts/image-analysis.js`.
- `src/vision/schemas/image-observation.schema.json` + validator.
- Output: `<name>-observations.json` only.
- Test: schema validation against 2 fixture observations (saved real model outputs).

Not in M1: clustering, synthesis, emitters, MoodboardDesign.

### M2 — synthesis

**Goal**: prove cluster-before-consensus actually preserves sub-thesis instead of averaging.

Deliverables:
- `src/vision/cluster.js` (heuristic + optional LLM proposal).
- `src/vision/prompts/moodboard-synthesis.js`.
- `src/vision/schemas/moodboard-design.schema.json` + validator.
- Output adds: `<name>-moodboard-analysis.json`.
- Test: a hand-crafted moodboard with 2 deliberately incompatible clusters must produce ≥2 clusters in output, not be averaged.

Not in M2: extractors, emitters beyond JSON.

### M3 — emission

**Goal**: produce the 5 designer-facing files of real usefulness, directly from `MoodboardDesign` (no extractor scaffolding — see §5.4 for the rationale).

Deliverables (5 emitters, all under `src/vision/emitters/`):
- **Template** (no LLM call):
  - `tokens-json.js`         → `<name>-design-tokens.json`
  - `tailwind-config.js`     → `<name>-tailwind.config.js`
  - `recipes-css.js`         → `<name>-recipes.css` (cluster-scoped `@layer` blocks)
- **LLM** (one call each):
  - `visual-language-md.js`         → `<name>-visual-language.md`
  - `implementation-prompt-md.js`   → `<name>-prompts/implementation.md`
- An `index.js` exporting `emitFromDesign(design, { outDir, name, model, ... })` that runs all 5 in parallel where safe.
- `crawl-moodboard.js` runs `runM3` after `runM2` by default; `--m2-only` skips M3; `--design <file>` runs M3-only on a prior MoodboardDesign.
- Tests: deterministic golden-output for the 3 template emitters; mocked-SDK tests for the 2 LLM emitters; live run on the 10-image fixture.

Cost on sonnet for the 10-image fixture: ~$0.10 (2 LLM calls). Total M1+M2+M3: ~$0.40.

---

## 8. Provider — first cut

MVP uses **Anthropic Claude** (defaulting to `claude-sonnet-4-6` for cost; `claude-opus-4-7` opt-in via `--model`).

- Force-JSON via tool-use: define a `record_observation` tool whose `input_schema` is `ImageObservation`; require model to call it.
- Image input: `image` content blocks with `source.type: "base64"`.
- Retry on tool-call failure with repair prompt.

`vision-client.js` exposes a provider-shaped interface (`analyzeImage`, `synthesizeMoodboard`) so Gemini/OpenAI can be added later without ripping callers. **But** don't write the Gemini code yet — abstraction without two implementations grows along the wrong joints.

---

## 9. Out of scope (MVP)

- URL inputs to `moodboard` command (no auto-download from Pinterest / IG).
- PDF / Figma export ingestion.
- Video / GIF input.
- Figma variables, shadcn theme, clone-to-Next.js, MCP server, Storybook output.
- Multi-platform tokens (iOS / Android / Flutter).
- Drift bot / CI integration.
- HTML fallback toggle (the URL path is left as-is in code, but `moodboard` doesn't share input plumbing).

---

## 10. Open questions (deferred)

1. **Color extraction primary path**: LLM-stated palette vs. a pixel-side k-means as ground truth + LLM as semantic labeler. Defer until M1 lets us see how reliable LLM palettes are on real input.
2. **Anti-pattern voice**: per-image "this is often miscopied as …" vs. moodboard-level "do NOT do these things". Currently scoped per-image; revisit after M2.
3. **Token naming**: upstream uses primitive + semantic + composite layers. Moodboard input gives us *semantic* tokens easily but *primitives* are harder to back-derive. May need a `--token-layers semantic-only` flag in M3.
4. **Confidence as gating signal**: if `MoodboardDesign.confidence.overall < 0.6`, do we refuse to emit Tailwind/recipes? Or always emit + warn? Defer to M3 ergonomics.

---

## 11. Glossary (for both humans and future agents)

| Term | Meaning |
|---|---|
| **observation** | Output of analyzing ONE image. Type: `ImageObservation`. |
| **cluster** | A subgroup of images sharing visual DNA. Has `sourceIds` and a `weight`. |
| **consensus** | Claims that hold *across clusters*, weighted by cluster weight. Has `supportSourceIds`. |
| **DNA** | The non-obvious, hard-to-name visual identity (material, depth, lighting, framing). The thing that "calling it green soft-UI" misses. |
| **adapter** | Code that maps `MoodboardDesign.tokens` into the shape an upstream emitter expects. |
| **recipe** | CSS that implements a visual rule that doesn't reduce to a token (e.g. layered pseudo-elements + filters + masks). |
