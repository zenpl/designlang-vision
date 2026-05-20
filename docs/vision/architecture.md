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

### 5.4 Extraction (M3)

Four vision-specific extractors operating on `MoodboardDesign`:

1. **`vision-material-language`** — what the surfaces *are* (frosted glass, matte clay, warm paper, …) and the *rules* governing them ("raised objects require contact shadows"). Replaces the upstream `material-language.js` heuristic for vision input.

2. **`vision-depth-language`** — layering, shadow model (cast vs contact vs AO), implementation hints (relative scene, absolute foreground, `overflow-visible` on hero containers).

3. **`vision-composition-language`** — central-object-framed-by-organics, panel-embedded-in-scene, etc. Plus a `layoutTranslation` map ("scene-first hero, not text-first").

4. **`vision-implementation-recipes`** — final translation to actual CSS recipes. Depends on all three above being stable; therefore M3-only.

### 5.5 Emission (M3)

| File | Status | Notes |
|---|---|---|
| `<name>-visual-language.md` | **NEW** | New section order: Style Thesis → Cluster Map → Visual DNA → Material → Depth → Lighting → Composition → Component Translation → Tokens → Recipes → Prompts → Anti-patterns. **Not** the upstream `design-language.md` template. |
| `<name>-design-tokens.json` | **adapter** | Reuse upstream `tokens-json` emitter via an adapter that fills its expected DOM-derived fields (`colors.all`, `typography.families/scale`, `borders.radii`, `shadows.values`, etc.) from `MoodboardDesign.tokens`. |
| `<name>-tailwind.config.js` | **adapter** | Reuse upstream `tailwind.js` emitter via same adapter. |
| `<name>-recipes.css` | **NEW** | CSS for material/depth/lighting that doesn't fit a token table (filters, layered pseudo-elements, mask gradients, etc.). |
| `<name>-prompts/implementation.md` | **NEW** | One-page Cursor/Claude-Code-pasteable spec for "build me a screen in this language". |
| `<name>-moodboard-analysis.json` | **NEW** | Raw `MoodboardDesign` dump. Always emitted (debugging + future re-runs). |

`shadcn-theme`, `figma-variables`, `clone`, `apply`, `mcp` — **not in MVP**. Revisit after MVP proves M3 output quality.

---

## 6. Reuse vs new

### Reused as-is
- `bin/design-extract.js` infrastructure (commander setup, dispatch).
- `tokens-json` emitter (via adapter).
- `tailwind.js` emitter (via adapter).
- `prompt-pack` skeleton (we plug different content into the same harness).

### New
- `src/vision/` (entire subtree).
- `src/extractors/vision-*.js` (4 files, M2/M3).
- `src/emitters/visual-language-md.js`.
- `src/emitters/recipes-css.js`.
- `src/emitters/vision-implementation-prompts.js`.

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

**Goal**: produce the 5 designer-facing files of real usefulness.

Deliverables:
- 4 vision extractors (`vision-material-language`, `vision-depth-language`, `vision-composition-language`, `vision-implementation-recipes`).
- `visual-language.md` emitter (new section order).
- `design-tokens.json` adapter.
- `tailwind.config.js` adapter.
- `recipes.css` emitter.
- `prompts/implementation.md` emitter.
- Test: golden-output comparison against a frozen moodboard.

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
