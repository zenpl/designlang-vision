# designlang-vision · docs

## Cluster Apply Methodology (May 2026 release)

Built from 5 case studies on applying Moodboard clusters to the
real production app pdx-gardener (菜友集市). The methodology turns
empirical findings — including one notable failure — into a reusable
framework.

| Document | When to read |
|---|---|
| [apply-methodology.md](./apply-methodology.md) | **Start here.** Operations handbook + materials library. Read top-to-bottom the first time; reference later. |
| [apply-methodology-comparison.md](./apply-methodology-comparison.md) | After the methodology, read this for the 5-way case-study comparison and pattern observations only visible across all 5. |
| [apply-methodology-self-review.md](./apply-methodology-self-review.md) | Honest weaknesses of each apply, including the things I'd change with a second pass. |

## The 5 case studies

| Case | Cluster | Strategy | Result | Validation dir |
|---|---|---|---|---|
| C1 | Matte Clay 3D Botanical Diorama | Full | ✅ | [`validation/pdx-apply-c1/`](../validation/pdx-apply-c1/) |
| C2 | Neumorphic Soft-Extrusion | Surgical | ⚠️ | [`validation/pdx-apply-c2/`](../validation/pdx-apply-c2/) |
| C3 | Editorial Botanical Commerce | Full (failed) | ❌ | [`validation/pdx-apply-c3/`](../validation/pdx-apply-c3/) |
| C4 | Dark Forest-Green Showcase | Structural | ⚠️ | [`validation/pdx-apply-c4/`](../validation/pdx-apply-c4/) |
| C5 | Artisanal Flat Parchment Café | Full | ✅ | [`validation/pdx-apply-c5/`](../validation/pdx-apply-c5/) |

Each case directory contains: `after-c*.html` (working demo with
real production data), `screenshot-after-c*.png`, `findings.md`
(case-specific analysis), and snapshot JSON of the production data
used.

## How to add a new case study

1. Create `validation/pdx-apply-c{N}/` (or `validation/{product}-apply-c{N}/`)
2. Pull real production data into `market-snapshot.json` etc
3. Build `after-c{N}.html` per the methodology checklist (§II of `apply-methodology.md`)
4. Screenshot at 414px viewport, full page
5. Write `findings.md` with verdict + why + risks
6. Update `apply-methodology-comparison.md` to add the new case to the axes tables
7. If the case surfaces a new anti-pattern or material, also update `apply-methodology.md`'s Part III (anti-patterns) and Part IV (materials library)

## How to apply this methodology to a different product

The methodology was derived from one product (pdx-gardener) but is
generalizable. To apply it to, say, a new community app:

1. Run §I "Diagnosis" — identify brand-promise register and content register
2. Compute elevation distance for each of the 5 clusters relative to the new product
3. Pick the cluster with distance ≤ 1 OR the cluster with distance ≥ 2 + an explicit owner decision to elevate
4. Choose strategy A/B/C from §I.5
5. Build the apply following the checklist in §II
6. Cross-reference anti-patterns in §III before shipping
