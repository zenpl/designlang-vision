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

### 2026-05-19 — same images, `claude-sonnet-4-6` — PASS (and noticeably better)

**Setup:** Same 3 images, switched `.env.local` to a standard `sk-ant-api03-*` billing key (the prior OAuth token didn't have inference quota beyond haiku).

**Result:** 3/3 ok. **Sonnet is materially richer than haiku on this task** — adopt it as the default going forward.

**Where sonnet beats haiku:**

| Dimension | haiku-4-5 | sonnet-4-6 |
|---|---|---|
| `implementationHints` per image | ~0 (left empty on most images) | **5–6 concrete CSS-level hints** (e.g. "overflow: visible on card parent", "mix-blend-mode: multiply for botanical overlays", "Plant images sized ~130% of card width") — M3 can consume these directly |
| img_03 boundary-breaking | "strictly contained" ❌ missed | "plant cutouts extend above the top edge of their card containers" ✓ caught |
| img_03 hero overlay material | not identified | "frosted/translucent hero banner overlay" as a distinct material |
| img_03 `palette.temperature` | `warm-muted` ❌ (wrong) | `cool` ✓ (the white/grey card aesthetic) |
| img_02 food icons | "soft, slightly stylized food photography" (fuzzy) | "flat illustrated food icons, not photography" (definite classification) |
| confidence calibration | 0.92 / 0.92 / 0.92 (flat → over-confident) | 0.88 / 0.92 / 0.93 (img_01 the most complex scored lowest — sensible) |
| anti-pattern sharpness | "flat green soft-UI with no botanical elements" | "Flat green soft-UI with no 3D clay objects and no botanical overflow — **same palette but completely loses the diorama depth and tactility**" (with the differentiating qualifier) |
| prompt cache hits | 0 read / 0 write (below haiku's ~4096 cache minimum) | **6672 read / 3336 write** — second and third images served from cache at ~10× discount |
| latency (3 images, sequential) | ~30 s total | ~125 s total |
| approximate cost (3 images) | ~$0.005 | ~$0.10 |

**Verdict:** the `claude-sonnet-4-6` baseline confirms the architecture-doc default. M1 prompt design works as intended, **and** sonnet's extra capacity for `implementationHints` is what bridges into M3's `recipes.css` and `tailwind.config.js` emitters cleanly. Without that bridge, M3 would degenerate into generic boilerplate.

**Caveats / nits:**
- The `_meta.usage` block in the JSON has the full per-image `input_tokens`, `output_tokens`, `cache_*_input_tokens` — useful baseline for token budgeting in M2/M3.
- Opus 4.7 not tested. Sonnet is sufficient for M1+, and Opus is mostly worth it for hard discrimination cases (e.g. if M2 clusters produce a confused thesis); revisit then.
- One pure pattern observation: sonnet correctly inferred that img_02's "flat olive-green nav bar" + matte parchment surface is a **deliberately flat** aesthetic — not flat-as-failure. That nuance matters for the M3 emitter not to over-add shadows.

**Output:** `out/m1-sonnet/m1-sonnet-observations.json` (gitignored).

### 2026-05-19 — same images, `claude-opus-4-7` — PASS (and meaningfully deeper)

**Setup:** Same 3 images, same `sk-ant-api03-*` key. First attempt 400'd on every image because vision-client.js set `temperature: 0.2` and Opus 4.7 removed sampling parameters entirely (see `shared/model-migration.md` → Migrating to Opus 4.7). Fixed: vision-client now omits `temperature` when model starts with `claude-opus-4-7`. Re-run succeeded.

**Result:** 3/3 ok. img_01 took 2 attempts (the repair flow triggered for real — first attempt's tool input had a schema issue; the repair prompt succeeded on attempt 2). **This is the first real-world validation of the repair retry pipeline.**

**Where opus beats sonnet:**

| Dimension | sonnet-4-6 | opus-4-7 |
|---|---|---|
| `implementationHints` granularity | Method-level ("use `mix-blend-mode: multiply` for botanical overlays") | **Value-level** ("two shadow layers per card: tight contact `0 2px 4px rgba` + broad ambient `0 30px 60px rgba`"; "Pastel UI surfaces want 1–2% inner top highlight + 3–4% bottom inner shade"). These are CSS recipe lines that M3 can ship verbatim. |
| Material `confidence` | One overall number | **Per-material confidence** — img_01 returns airplane=0.9, plastic-card=0.85, frosted-panel=0.6. The 0.6 on the smaller frosted panel is honest, not noise. |
| Cross-image awareness | Within-image only | **img_03 anti-pattern reads literally: "Letting plants break the card boundary (diorama style) — here everything is strictly contained; boundary-breaking belongs to a different moodboard."** Opus is already doing M2-stage cluster reasoning inside per-image observations. |
| `realismLevel` precision | Binary-ish (`semi-realistic-3d` / `screenshot` / `photographic`) | Adds `mixed` for img_02 (screenshot + ink-watercolor illustrations) and img_03 (cards + lifestyle photography), which matches what the images actually are. |
| Confidence calibration | 0.88 / 0.92 / 0.93 | 0.82 / 0.82 / 0.86 — more conservative because opus sees more nuance. Sensible. |
| Repair retry validation | Never triggered | img_01 attempts=2. Repair prompt with prior-failure context succeeded. **Production-tested.** |
| Prompt cache write tokens (first image) | 3336 | **1120** — opus encodes the same prompt prefix into fewer tokens |
| Prompt cache read tokens (across 3 images) | 6672 | **13935** — opus caches more aggressively, second and third images and the img_01 repair attempt all served from cache |
| Latency (3 images, sequential) | ~125 s | ~184 s |
| Approximate cost (3 images) | ~$0.10 | **~$0.40–0.50** |

**Verdict:**
- **Default model for M1 stays `claude-sonnet-4-6`** — cost/quality balance is right, observations are usable for clustering.
- **For M3 emission (recipes.css, tailwind.config.js, prompts/implementation.md), `claude-opus-4-7` is worth the ~4–5× cost.** Opus's per-image value-level hints (specific shadow rgba values, percent inner highlights, exact pill-button vs solid behavior) are what makes the difference between "shipped CSS recipes" and "generic boilerplate". M3 should likely default to opus.
- **For M2 (cluster + synthesis), sonnet is sufficient.** The synthesis call summarizes existing observations rather than reading images afresh; opus's image-level depth is wasted there.
- **The `mixed` realismLevel value** is a useful schema extension that came from opus's vocabulary — the schema already allows it (`enum`), so no change needed.

**Caveats:**
- `palette.saturation` returned `null` for img_01 on opus (sonnet filled it). Tiny gap, not load-bearing.
- The first 400-temperature failure is a reminder that the `claude-api` skill's "sampling parameters removed on Opus 4.7" is a real and silent breaking change — keep an eye on future opus releases.

**Output:** `out/m1-opus/m1-opus-observations.json` (gitignored).

### 2026-05-20 — 10-image moodboard, M1 + M2 full pipeline, sonnet-4-6 — PASS (and revealed cluster-over-heuristic)

**Setup:** User expanded `tests/assets/` to 10 images (`1..10.jpeg`). Ran the full pipeline:
```
node bin/design-extract.js moodboard ./tests/assets -o ./out/m12-10img-sonnet -n m12-sonnet --model claude-sonnet-4-6
```
10/10 M1 ok, M2 synthesized in 106.8 s, 0 errors.

**Result: LLM merged heuristic's 10 singletons → 5 real clusters.**

This is the first real cluster-over-heuristic test (the 3-image fixture didn't stress it — all images were maximally distinct and the heuristic correctly proposed 3). On this 10-image board:

- **Heuristic max pairwise similarity was 0.226** — well below the 0.55 cluster threshold. The heuristic therefore proposed 10 singleton clusters, doing nothing useful on its own.
- **LLM synthesis then merged into 5 named clusters** based on the actual observation content, not the heuristic structure:

| Cluster | Weight | Source ids |
|---|---|---|
| Matte Clay 3D Botanical Diorama UI | 0.35 | img_01, img_02, img_05, img_07 |
| Neumorphic Soft-Extrusion Mobile UI | 0.20 | img_08, img_09 |
| Editorial Botanical Commerce (Light Background) | 0.15 | img_04, img_08 |
| Dark Forest-Green Botanical Product Showcase | 0.20 | img_06, img_10 |
| Artisanal Flat Parchment Café UI | 0.10 | img_03 |

**Notable: `img_08` is in TWO clusters.** The model judged it carries both Neumorphic and Editorial-Commerce features and labeled both. The schema permits this (no across-cluster uniqueness constraint on sourceIds; weights still sum to 1.0). This is honest annotation of a boundary-straddling image — better than forcing it into one bucket arbitrarily.

**Consensus claims show the discipline working** — 14 claims across 6 sections, with support counts ranging from 6/10 to 10/10:

| Section | Claim (truncated) | Support count | Confidence |
|---|---|---|---|
| materials | "Matte opaque surfaces — no frosted glass, no backdrop-filter blur" | 9/10 | 0.96 |
| materials | "Botanical elements are the universal decorative material" | **10/10** | 0.98 |
| lighting | "Upper-left soft diffuse key light dominant for 3D-rendered clusters" | 7/10 | 0.91 |
| depth | "Boundary-breaking overflow recurring depth signature" | 8/10 | 0.90 |
| depth | "Soft diffuse cast shadows (not hard drop shadows)" | 8/10 | 0.88 |
| palette | "Desaturated sage/forest green dominant brand hue" | 9/10 | 0.95 |
| palette | "Low-to-medium saturation throughout" | 7/10 | 0.88 |
| palette | "White or near-white universal neutral surface" | 8/10 | 0.92 |
| components | "Pill/stadium-shaped buttons" | 8/10 | 0.89 |
| components | "Rounded rectangle cards (12–24px radius)" | 9/10 | 0.93 |
| components | "Geometric sans-serif body/label typeface" | 9/10 | 0.87 |
| implementationRules | "overflow:visible on cards" | 7/10 | 0.93 |
| implementationRules | "Never apply frosted glass / backdrop-filter blur" | 8/10 | 0.97 |
| implementationRules | "Absolutely-positioned PNG/SVG botanical cutouts" | 6/10 | 0.85 |

Only ONE claim is 10/10 universal ("botanical elements"). All others have partial support, properly recorded. This is the schema discipline biting in the right way — claims rooted in clusters don't get falsely elevated to "universal".

**Confidence:** overall 0.87; per-cluster [0.91, 0.94, 0.88, 0.88, 0.93]. The boundary-straddling clusters (Editorial Commerce, Dark-Forest at 0.88) correctly scored lower than the materially-clean Neumorphic one (0.94).

**Cost & latency:**
- M1 sonnet (10 imgs): cache write 3336 on img 1, 30024 read across imgs 2–10 (cache hitting consistently). ~$0.20 estimated.
- M2 sonnet (1 synthesis call): cache write 2306, 0 read (first synthesis). Latency 106.8 s. ~$0.10 estimated.
- Total: ~$0.30.

**Follow-ups (M2 polish, low priority):**
- The heuristic threshold (0.55) is too strict for real moodboards. Even visually-related images share <0.25 of styleLabels/materials Jaccard. Either drop the threshold to ~0.20, or recognize that the heuristic is mostly the similarity matrix (diagnostic), not the clusterer. Current behavior (LLM does all the clustering work) is acceptable; the heuristic still produces a useful pairwise matrix for inspection.
- Consider whether `clusters[].sourceIds` should be disjoint by default and overlap should require an explicit field. Current schema permits overlap and the model used it usefully on img_08, so this may be a feature not a bug. Revisit when more boards land.

**Output:** `out/m12-10img-sonnet/m12-sonnet-{observations,moodboard-analysis}.json` (gitignored).

### 2026-05-20 — M3 emission, 10-image moodboard, sonnet-4-6 — PASS

**Setup:** Ran `moodboard --design ./out/m12-10img-sonnet/m12-sonnet-moodboard-analysis.json` to emit M3 from the prior M2 output (saves the M1+M2 cost of re-running).

**Note on stability:** The first two attempts both 400'd with "Connection error" on the LLM emitter Promise.all. Looking at the failure pattern (both LLM calls in parallel; both fail) it was either Anthropic transient outage or concurrent rate pressure. Fixed in two ways:
1. **Sequential LLM calls** instead of `Promise.all` — easier failure attribution; avoids concurrent rate pressure.
2. **`withRetryOnConnError`** wrapper — one manual retry with 2 s backoff on connection-class errors, since the Anthropic SDK's built-in retry doesn't always catch APIConnectionError reliably. Third attempt succeeded.

**Result:** 5/5 files produced; total emission time 322.7 s (including the retry on the first LLM call). M3 cache write 7882 tokens (one-time), 0 reads (each emitter has its own system prompt, no cross-emitter cache sharing). Approximate M3 cost: ~$0.10 on sonnet.

**Output files (`out/m3-10img-sonnet/`, gitignored):**

| File | Size | Notes |
|---|---|---|
| `m3-sonnet-design-tokens.json` | 4.5 KB | DTCG-style; valid JSON; 15 color tokens + 5 surface + 5 borderRadius + 7 shadow + 5 typography; merged color + surface under one DTCG group. |
| `m3-sonnet-tailwind.config.js` | 2.7 KB | Valid CommonJS module; `theme.extend.{colors, borderRadius, boxShadow}` populated; drop-shadow filter tokens correctly emitted as comments (not boxShadow keys). Loadable via `require()` in CJS context. |
| `m3-sonnet-recipes.css` | 5.9 KB | 5 cluster `@layer` blocks + 1 consensus block + 1 'other' block. 12 `.vrec-*` recipe classes. Cluster references parsed correctly from synthesizer descriptions ("Clusters 1, 2" puts the recipe in both 1 and 2's layers). |
| `m3-sonnet-visual-language.md` | 22.7 KB / 357 lines | 11 sections in correct order (Style Thesis → Cluster Map → Visual DNA → Material → Depth → Lighting → Composition → Components → Tokens → Recipes → Anti-patterns). Anti-pattern §11 first item: "Do not collapse the five clusters into one aesthetic" — the failure-mode discipline is in the output. |
| `m3-sonnet-prompts/implementation.md` | 12.4 KB / 164 lines (within ≤200 budget) | 8 sections. Section 4 includes explicit `**Contradicts Cluster N:**` callouts per cluster — cross-cluster contradictions ARE part of the prompt, not derived. Section 7 §7 anti-pattern: "Averaging all clusters into one bland 'soft sage green' aesthetic — each cluster has a distinct depth mechanism; flattening them into a single muted-green flat style erases the dimensional identity." Section 8 maps screen-type to cluster: marketing splash → Cluster 1, mobile dashboard → Cluster 2, e-commerce → Cluster 3, premium feature → Cluster 4, loyalty/onboarding → Cluster 5. |

**Total pipeline cost on this 10-image moodboard:** M1 ~$0.20 + M2 ~$0.10 + M3 ~$0.10 ≈ $0.40. Total wall-clock: ~50 s (M1) + 107 s (M2) + 323 s (M3) ≈ 8 minutes for the full pipeline.

**M3 verdict: passing on every acceptance criterion**:
- ✅ All 5 files produced
- ✅ tokens.json valid; tailwind.config.js loads via `require()`; recipes.css has cluster-scoped `@layer` blocks
- ✅ visual-language.md follows the locked 11-section order; Style Thesis is the first section, tokens are §9 (not §1)
- ✅ Anti-pattern in BOTH visual-language.md and implementation prompt explicitly names "averaging clusters into one aesthetic" as the failure mode
- ✅ implementation.md ≤200 lines; uses concrete token names + recipe class names verbatim
- ✅ Cluster-bound rules in the prompt include cross-cluster contradiction callouts

**Output:** `out/m3-10img-sonnet/m3-sonnet-{design-tokens.json, tailwind.config.js, recipes.css, visual-language.md, prompts/implementation.md}` (all gitignored).
