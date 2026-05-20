# M1 Acceptance Test — Three-Style Discrimination

**Goal**: prove that M1's per-image observation is specific enough to distinguish three deliberately-different moodboard styles. If all three collapse into "green soft UI with rounded cards", M1 has failed even if the code runs.

This is the hard product test for M1. Code-level tests (`tests/vision/*.test.js`) prove the schema, retry, and prompt-caching wiring; this test proves the **prompt itself** does its job.

## Prerequisites

- `ANTHROPIC_API_KEY` exported in env (or pass `--api-key`)
- Three local images (one per style below). Pinterest / Dribbble / Are.na exports work.

## Setup

```bash
cd ~/.openclaw/designlang-vision
mkdir -p samples/acceptance-m1
# place exactly 3 images in samples/acceptance-m1/:
#   01_photographic_plant_ecommerce.jpg   — clean studio photo of a plant in a product layout
#   02_dark_forest_diorama_card.jpg       — atmospheric dark UI card with glowing translucent panel + foreground plants breaking the boundary
#   03_pastel_clay_travel_dashboard.jpg   — 3D clay objects (planes, suitcases, foliage) on a pastel rounded dashboard
```

Numbering matters for deterministic id assignment (`img_01` / `img_02` / `img_03`).

## Run

```bash
node bin/design-extract.js moodboard ./samples/acceptance-m1 \
  -o ./out/acceptance-m1 \
  -n m1
```

Expected output:
```
out/acceptance-m1/m1-observations.json
```

For a richer (and slower) baseline if Sonnet 4.6 seems thin, escalate the model:
```bash
node bin/design-extract.js moodboard ./samples/acceptance-m1 \
  -o ./out/acceptance-m1-opus \
  -n m1-opus \
  --model claude-opus-4-7
```

## Pass criteria

Open `m1-observations.json` and inspect the three observations.

### ✅ Pass — what we want to see

For each image, look at:
1. **`globalStyle.styleLabels`** — specific labels, *different across the three*. e.g.
   - img_01: `["photographic", "studio-product", "editorial-commerce"]`
   - img_02: `["dark-diorama", "frosted-glass", "botanical-overlay"]`
   - img_03: `["3d-clay", "pastel-dashboard", "isometric-travel"]`
2. **`materials`** — different surfaces named:
   - img_01: photographic leaves on neutral background
   - img_02: frosted glass panel, soft cast shadow, foreground plant cutouts
   - img_03: matte clay surfaces, soft contact shadows on rounded objects
3. **`depth.layers`** — different stack structures:
   - img_01: minimal layering, mostly flat
   - img_02: bg → main panel → foreground breaks boundary
   - img_03: dashboard surface → 3D objects sitting on top
4. **`lighting`** — different lighting languages:
   - img_01: studio diffuse
   - img_02: warm-glow + soft cast + AO
   - img_03: soft top-front with contact shadows
5. **`antiPatterns`** — each entry should make the image *not* like the others:
   - img_02's anti-pattern should mention "flat dashboard without contact shadow"
   - img_03's anti-pattern should mention something like "flat illustration without 3D contact shadow / matte material"

### ❌ Fail — what means M1 isn't there yet

- All three styleLabels are some mix of `["organic", "soft", "natural", "modern"]`
- `materials` is empty / one entry / generic "rounded surface"
- `depth.layers` is the same shape (or null) across all three
- `lighting.shadowType` is the same for all three
- The three observations could be swapped and you couldn't tell which is which

If M1 fails:
1. First try `--model claude-opus-4-7` and re-run. Sonnet 4.6 may be undershooting on this specific extraction task.
2. If Opus 4.7 also fails: the prompt in `src/vision/prompts/image-analysis.js` needs another pass. The `# Hard discrimination requirement` section is where the surgery happens.
3. If neither helps and we're spending another round: the schema may be too permissive — tighten enums and add more `required` fields to push the model toward specificity.

## Cost expectations

For 3 images, sonnet-4-6 default:
- ~3000 input tokens (system + tool schema) + ~1500 per image for vision
- ~1500 output tokens total
- Run cost: ~$0.04
- First image pays cache write (1.25×); images 2 and 3 pay cache read (0.1×)

For opus-4-7:
- ~4× the sonnet cost
- Run cost: ~$0.16

## Recording results

After running, jot what you saw in this doc under a new `## Run log` section (date, model, pass/fail, notable observation excerpts). Future M2/M3 regressions are easiest to spot against a recorded M1 baseline.

---

## Run log

### 2026-05-19 — first live run — `claude-haiku-4-5` — PASS

**Setup:** OAuth access token (`sk-ant-oat01-*`) supplied by user. Three images placed by user at `tests/assets/{1,2,3}.jpeg`.

**Why haiku (not sonnet/opus):** the supplied token was rate-limited (429 with empty error body) on `claude-sonnet-4-6` and `claude-opus-4-7`, but accepted on `claude-haiku-4-5`. Likely Claude.ai-tier session token rather than full API-billing key. Future runs that want sonnet/opus discrimination need a `sk-ant-api*` key.

**Result:** 3/3 ok, all observations clearly discriminable.

| | img_01 | img_02 | img_03 |
|---|---|---|---|
| **styleLabels** | botanical-3d-diorama, soft-clay-render, editorial-product-showcase, layered-scene-composition | editorial-commerce-app, botanical-frame, warm-paper-aesthetic, vintage-cafe-branding | botanical-ecommerce, editorial-lifestyle, product-card-grid, soft-shadow-photography |
| **realismLevel** | semi-realistic-3d | screenshot | photographic |
| **imageryStyle.primary** | 3D-clay-render with embedded UI mockups | UI screenshot with botanical illustrations | photographic product + lifestyle photography |
| **materials** (first 3) | matte-clay-3d-surface, soft-cast-shadow-on-gradient-ground, botanical-paper-cutout-overlay | warm paper with aged patina, matte sage-green header bars, botanical line-art | ceramic plant pots, white/cream card stock, photographic foliage |
| **composition.edgeBehavior** | foreground plants cross container boundaries | strictly contained within phone bezels | strictly contained |
| **depth.layers** | 5 (plants breaking boundary) | 4 (flat) | 3 (no boundary breaking) |
| **antiPatterns first** | "flat green soft-UI dashboard with no botanical elements and no boundary-breaking" | "Glossy or translucent glass panels — this style is warm paper and matte" | "Flat green soft-UI dashboard with no photographic elements" |
| **confidence** | 0.92 | 0.92 | 0.92 |

**Acceptance verdict:** the disqualifier ("all three collapse into green soft UI") is explicitly *refused* by the model — img_01's #1 anti-pattern is literally that exact phrase. img_03's anti-pattern names "Dark forest diorama" as a thing to avoid, demonstrating cross-image distinguishability awareness.

**Caveats:**
- All three observations land at confidence 0.92, which is suspiciously flat — likely haiku self-overestimating. Sonnet/Opus runs are needed to baseline calibration.
- We did not run with sonnet-4-6 or opus-4-7 due to the token's rate limits; the architecture-doc default of sonnet-4-6 is still un-verified end-to-end.
- 0 cache reads observed on the 3-image run because each image is a fresh request and the prompt prefix is byte-stable but apparently below the 4096-token min on haiku-4-5 (haiku threshold is higher than sonnet's 2048). Sonnet/Opus runs should show caching kick in on image 2+.

**Full output:** `out/m1-haiku/m1-haiku-observations.json` (gitignored).
