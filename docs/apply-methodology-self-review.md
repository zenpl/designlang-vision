# Self-Review — Five pdx-gardener Apply Case Studies

Honest weaknesses, things I'd change on a second pass, and gaps
the case studies don't yet cover.

## Apply-specific weaknesses

### C1 (polymer clay) — best of the 5, but not perfect
- **Clay terracotta pot** at hero is ~10–15% warmer/oranger than the
  cream palette around it. Would desaturate next pass.
- **Three polymer-clay decorations on one screen** is the upper limit.
  At scale (more sections, settings page, profile page), this becomes
  Pixar-set territory. Need a discipline rule: max 3 clay decorations
  per screen.
- **Empty-state clay frond** is delightful AS A SURPRISE — first
  appearance feels charming. Risk: if every empty card is a clay
  decoration, the surprise dies. Need a rotation library (frond /
  leaf / pot / seedling / cluster) so users don't see the same asset
  3 times on one scroll.
- **Polymer-clay assets are 1.4–1.9 MB each at original resolution.**
  Did not optimize in the demo. Production ship would need 256×256
  + AVIF/webp (≤200KB each).

### C2 (neumorphic surgical) — partial-win, partial-loss
- **The thumb-well inset treatment is the best move of the entire apply** — would
  isolate this as a standalone improvement to pdx-gardener regardless
  of the rest of C2.
- The **primary CTA still feels disconnected** from the neumorphic
  surroundings because filled-dark on neumorphic-light is a known
  visual seam. No clean fix without breaking primary-CTA contrast
  requirements.
- The **brand mark 🌿 in a neumorphic well** looks placeholder-cheap.
  Should be a custom monoline botanical icon (a few line strokes), not
  an emoji.
- "Cherokee purple tomato · 大黑番茄苗" wraps awkwardly with "苗"
  alone on line 2. This is real-content reality — Chinese-English
  bilingual product names will sometimes wrap badly. Need a content
  guideline (or a non-breaking-space behavior) to handle the
  trailing 苗/根/籽 character.

### C3 (editorial) — failed, but the failure is documented
- I built a too-aggressive C3 first (per user's "字体可以更激进一些"
  prompt). A moderate C3 first would have shown the clash sooner
  with less wasted effort. **Lesson: when user asks for "aggressive"
  in a context where the underlying fit is questionable, do a
  moderate version first and check the fit.**
- The C3 demo is preserved at `after-c3.html` as the counter-example.
  Do not delete — it's the reference for the anti-patterns section.

### C4 (dark forest) — works, but with brand-trajectory risk
- I haven't tested **elderly user contrast comprehension** on real
  hardware. The cream-on-dark eyebrow text may have a 5–10%
  comprehension drop. Would need user testing before shipping.
- The **gold (#C9A75A)** is borderline too saturated against the
  forest green. A more muted gold (#A89460) might land cleaner.
  Worth A/B testing.
- I did NOT generate dark-mode variants of the emoji empty states.
  The 🥬 / 📋 / 🌱 in dark mode against cream cards is awkward —
  cards are cream so the emoji color is okay, but the emoji style
  itself reads more "iOS native" than "Aesop apothecary". Needs
  custom monoline icons.
- The "OFFER · 供 / WANT · 求" eyebrow treatment is borrowed from
  C3 (where it was over-used). Here it's restrained to 2 instances.
  Still — is this gazette-uppercase treatment too cute? Marginal call.

### C5 (parchment) — from prior session, generally accepted as ✅
- Did this apply receive a recent re-review? No — I'm taking it as
  the prior verdict ("works") on faith. Should re-screenshot and
  re-review now that the methodology framework exists.
- Specifically: with the methodology lens now formal, does C5 use
  the right number of editorial accents? Did it preserve color
  semantics? Re-review pending.

## Methodology-level weaknesses

### Coverage gap: only one product tested
The methodology is derived from 5 applies to ONE product
(pdx-gardener). Patterns observed (e.g. "Distance ≤ 1 + Strategy A
→ ✅") may not generalize to:
- B2B SaaS dashboards (chrome budget is different)
- Brand-heavy marketing sites (whole pages are chrome)
- Game UIs (interactive state changes happen too fast for editorial accents)
- Accessibility-first apps (neumorphic immediately disqualified)

**Next step**: apply the methodology to a second product (different
domain) and see which rules hold vs which break.

### Coverage gap: only static screenshots, no interaction tested
All 5 demos are static HTML, not interactive. The methodology
doesn't yet address:
- Press / hover / focus state design within each cluster's
  vocabulary
- Loading skeleton design in each cluster
- Modal / sheet / drawer styling in each cluster
- Form field treatment per cluster (the moodboard didn't have form
  examples)

### Coverage gap: only Chinese-Latin bilingual content tested
The case studies all have pdx-gardener's specific bilingual character
(Chinese + English). The methodology rules about typography
(especially AP-2 "Chinese display-serif-Bold trap") may not transfer
to:
- Right-to-left languages (Arabic, Hebrew)
- Other CJK contexts (Japanese, Korean — different cultural register
  for serif weights)
- Multi-script applications (Cyrillic + Latin, etc.)

### Coverage gap: no animation guidance
None of the applies addressed motion design. Cluster recipes only
specify static visuals. A live product needs transition specifications.

### Coverage gap: no production-readiness checklist
The methodology checks aesthetic correctness but doesn't address:
- Build size impact (clay PNGs are huge)
- Web font loading strategy (LXGW fonts via jsDelivr have ~200ms
  FOIT risk)
- Server-rendered fallback (SSR with cluster-specific chrome)
- A/B test framework integration

## What I'd do with one more day on this

1. **Generate optimized AI assets** — re-export the 3 clay assets at
   256×256 webp/AVIF and verify they still look acceptable
2. **Build a "C2-thumb-well-only" surgical demo** — extract just the
   thumb-well treatment as a minimal-risk improvement
3. **Apply the methodology to a second product** — find a different
   community app and run C1 + C5 on it. Validate the rules
4. **Test C4 with monoline icons** instead of emoji empty states
5. **Re-screenshot C5 with current methodology lens** and write its
   findings.md (currently only has apply-plan.md)
6. **User-test all 5 with 2–3 real pdx-gardener users** and have them
   rank: which feels most like pdx-gardener? which most polished?
   which would they NOT use?

## What I deliberately chose NOT to do

- I did not modify pdx-gardener's production code. All applies are
  analytical artifacts in `validation/`. The methodology explicitly
  documents this as a hard rule (apply ≠ ship).
- I did not push to pdx-gardener's repository. These artifacts are
  only in `designlang-vision`.
- I did not generate fake plant photos to standardize content quality
  (per user mid-task redirect — see methodology §V "Real data is
  non-negotiable").
