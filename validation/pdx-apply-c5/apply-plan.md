# Applying Cluster 5 (Artisanal Flat Parchment Café UI) to 种子集市 (pdx-gardener)

Date: 2026-05-22.
Source moodboard: `out/m12-10img-sonnet/m12-sonnet-moodboard-analysis.json` (Cluster 5).
Target codebase: `~/.openclaw/pdx-gardener/frontend/index.html` (~2400-line single-file SPA + FastAPI backend).
Scope: this is a methodology document + before/after demo, **not a production patch**. The actual rollout decision belongs to the project owner.

---

## 0. Diagnosis: 种子集市 is already ~60% Cluster 5 in spirit

Before any apply, recognize what's already aligned. Reading `index.html:24-80` (CSS variables) and `VISUAL_DESIGN_BRIEF_STEP2.md`:

| pdx-gardener current | Cluster 5 spec | aligned? |
|---|---|---|
| `--bg-page: #F5F0EB` (warm parchment) | `parchment-base: #F5F0E6` | ✅ effectively identical |
| `--bg-card: #FDFAF7` (warm white card) | "white or parchment content area" | ✅ |
| `--primary: #2D6A4F` (forest green) | "flat matte olive `#3D5A2E`" | ⚠ close shade, different hue |
| `--primary-deep: #1B4332` | "deep olive" | ✅ |
| `warm-utilitarian` 邻里换菜便条本 | "artisanal café, hand-painted, printed paper" | ✅ same tonal family |
| Mobile-only WeChat WebView | "mobile-only column 360–420px" | ✅ |
| 中老年 user, balanced density | "calm, low density" | ✅ |
| Soft shadow on cards (`--shadow-1`) | "zero shadows on UI chrome" | ❌ **divergent** |
| Pill buttons `--radius-pill: 9999px` | "border-radius: 8px on CTAs" | ❌ **divergent** |
| PingFang sans only | "humanist serif or soft rounded sans headings" | ❌ **divergent on headings** |
| Emoji icons (🌱🌾🌿) | "watercolor SVG botanical illustrations + vintage stamp seals" | ⚠ emoji is a stand-in for the same intent |
| No paper-grain texture | "optional 6px radial-dot paper-grain at low contrast" | ❌ trivial to add |
| No stamp/seal motif | "vintage stamp/seal logo as cluster-identifying primitive" | ❌ would add identity |

**Net**: the page-and-card palette, density, and emotional tone are already Cluster-5-correct. The gap is in **decorative motifs, typography, and shadow→border substitution**.

---

## 1. Answers to the three constraints

### Constraint A — "已有 UX 已经是优化过的，不要动"

Touch nothing that's UX-encoded. Per the VISUAL_DESIGN_BRIEF_STEP2.md's `must_be_co_visible` / `primary_action_reach` / `required_states`, the locked surfaces are:

- ❌ Don't change: layout grids, touch target sizes (≥44×44), tabbar position + safe-area-inset, card flex structure (80×80 thumbnail + flex:1 text), section ordering, color SEMANTICS (free=green, paid=danger, barter=warn), state visibility (loading/empty/error/partial/success/claimed_out).
- ✅ Safe to change: token VALUES (specific hex), shadow→border swap, border-radius values, decorative SVG motifs added INSIDE existing surfaces, typography font-family, paper-grain texture overlays.

The litmus: if a change would alter where the user's eye lands, how they tap, or what they understand from a glance — don't. If it just changes how it FEELS at that landing — apply.

### Constraint B — 中文 typography (italic doesn't translate)

Cluster 5's typography spec is built around **italic Cormorant Garamond serif**. For Chinese:

| Cluster 5 Latin role | 中文等价 | 为什么 |
|---|---|---|
| Italic Cormorant Garamond display (editorial title) | **思源宋体（Source Han Serif SC）SemiBold + letter-spacing 0.04em** | 中文 italic 是机器斜体（CSS `font-style: italic` 强制倾斜字形），**绝对不要用**。思源宋体本身就有 letterpress / 编辑级权威感，加宽字距代替 italic 的 "强调" 节奏。 |
| Italic Cormorant for short accent phrase ("'Laurentii'") | **楷体（KaiTi / STKaiti / 楷体-简）small caps style** | 中文里 "手写艺人" 感的对应是楷书，不是斜体。仅用于装饰性短语（如 stamp seal 里 "种子集市 · 始于 2026"），不用于正文。 |
| Geometric sans body | **PingFang SC**（已是现状） | 不动 |
| Tabular figures (prices, dates) | Inter / system mono for digits, surrounded by PingFang for Chinese | 数字仍用 Latin geometric for tabular alignment |
| Letter-spacing `0.18em` on uppercase Latin | Chinese 不适用 0.18em（字距会断），改用 `0.04–0.08em` | 中文方块字本身已是 monospaced-ish，过宽字距破坏阅读节奏 |

**实操规则**：
- 永远不要 `font-style: italic` 渲染中文。如果必须强调，用字重 + 字距 + 楷体替代。
- 思源宋体只用在 H1 / H2 / 编辑性标题；正文仍 PingFang。
- 楷体是 "稀有装饰品" — 限于 stamp seal、loyalty card decorative phrase、签名行。

### Constraint C — 用户图怎么办

Cluster 5 的视觉资产是 watercolor 手绘 botanical illustration。pdx-gardener 的图是用户上传的种子包装、菜苗照片、户外园艺照。**这两类资产不应该被同一种处理覆盖。**

**核心策略：chrome vs content 分离。**

| 表面类型 | 处理 |
|---|---|
| **Chrome**（导航、按钮、标题、空态、徽章、loyalty 装饰、stamp/seal、分割线、装饰 SVG） | **完全 Cluster 5 化** — 用 watercolor 风格 SVG、parchment 表面、no-shadow 边框、思源宋体 |
| **Content container**（用户照片所在的卡片外框 + 标签 + 文字标注） | **应用 Cluster 5 token** — parchment 卡片背景、thin olive border 替代 shadow、Cluster 5 字体 — 但**容器内的用户图不动** |
| **User photo itself**（80×80 缩略图、详情大图、AI 提取的种子包装照） | **完全不动** — 不加 sepia、不加 mix-blend-mode、不裁成 stamp 圆形、不加 watercolor 滤镜。用户上传时的色彩 / 内容 / 框比是**事实**，不是风格 |

**例外可考虑**（需用户同意）：
- 用户图周围**外置 SVG 装饰**（如卡片角上的小水彩 sprig），不覆盖图本身
- 用户图占位框（图还没加载 / empty state）可以放小 watercolor placeholder（明确视觉上和真实照片有别）
- 用户上传 photo placeholder background（图加载时的灰底）可以换成 parchment 色

**绝对不做**：
- ❌ 给所有用户图加 sepia filter
- ❌ 把用户图自动裁成圆形 stamp 样式
- ❌ 把用户图替换成 AI 生成的水彩等价

---

## 2. Minimum-touch token patch（建议）

These are CSS variable overrides that can be applied as a **single overlay stylesheet** loaded AFTER `index.html`'s existing `<style>` block, without modifying any structural code:

```css
/* cluster5-overlay.css — applies Cluster 5 visual language to pdx-gardener
 * Load AFTER the existing index.html <style> block. Only redefines tokens
 * and adds decorative pseudo-elements. Does NOT change layout, sizes,
 * or interactive behavior. */

:root {
  /* Page surface: Cluster 5 wants parchment #F5F0E6; current is #F5F0EB.
   * Move 1pt warmer to match exactly. */
  --bg-page: #F5F0E6;

  /* Card background: keep current warm-white — already Cluster 5-correct. */
  /* --bg-card: #FDFAF7;  (unchanged) */

  /* Primary: Cluster 5 olive #3D5A2E vs current forest #2D6A4F.
   * Olive is more printed-ink, less SaaS. Subtle shift. */
  --primary: #3D5A2E;
  --primary-deep: #2A3F20;

  /* Cluster 5: no shadows on UI chrome — replace with 1px olive border.
   * Cluster 5 rule: 'thin 1px olive borders on cream rather than drop shadows'. */
  --shadow-1: 0 0 0 transparent;
  --card-border: 1px solid rgba(61, 90, 46, 0.18);

  /* Cluster 5 CTA: border-radius 8px not pill 9999.
   * NOTE: keep --radius-pill for places where the existing site uses pill
   * shape for non-CTA elements (count-badge etc). Only override --radius-btn. */
  --radius-btn: 8px;

  /* Typography: add a serif headline family (Chinese: 思源宋体). */
  --font-display: "Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, ui-serif, serif;
  --font-script: "STKaiti", "KaiTi", "楷体", "Source Han Serif SC", serif;
  /* --font-body stays PingFang SC via the existing html,body rule */
}

/* Cards: shadow → border substitution */
.market-list .card,
.exchange-card,
.want-card,
.seed-batch-card,
.photo-first-card {
  box-shadow: none !important;
  border: var(--card-border);
  background: var(--bg-card);
}

/* Optional paper-grain dot pattern over parchment surfaces */
.home-hero-title,
.home-section-head h2 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* CTA: solid olive, no shadow, 8px radius */
button, .btn, .btn-block, .photo-first-btn {
  box-shadow: none !important;
  border-radius: var(--radius-btn) !important;
}

/* Stamp/seal motif: drop in next to H1 hero as a decorative element.
 * Implemented as inline SVG in HTML, not via CSS — see after.html demo. */

/* Subtle paper-grain on the page background. 6px dot pattern, low contrast. */
body {
  background-color: var(--bg-page);
  background-image: radial-gradient(rgba(61, 90, 46, 0.05) 0.5px, transparent 0.5px);
  background-size: 8px 8px;
}
```

That's the WHOLE minimum-touch overlay. **~30 lines, zero JS, zero HTML change.** Drop it in as a separate `<link>` tag and the site visually shifts toward Cluster 5 without breaking any UX.

If the project owner wants to go further, the next-tier additions (not in the minimum patch):
- Inline SVG stamp/seal in the home hero — adds Cluster 5 identity decoration
- Replace 🌱 emoji in H1 with a small watercolor sprig SVG
- Add 1-2 watercolor corner decorations to "供 / 求" section heads
- Replace the loading spinner with a SVG botanical stroke-dasharray animation

These need light HTML edits and probably 1–2 generated assets, but still no UX change.

---

## 3. What this looks like — see `before.html` vs `after.html`

The demo files in this directory recreate the 首页 hero structure exactly (H1 + sub + 2 CTAs + 供/求 section heads + market cards with 80×80 thumbnails). `before.html` uses the current pdx-gardener CSS verbatim; `after.html` loads the minimum-touch overlay above plus one stamp/seal SVG.

Open both, then open both screenshots in `screenshot-before.png` / `screenshot-after.png`.

The visual delta:
- Cards: soft shadow → thin olive border on cream
- Page bg: slightly warmer parchment + barely-visible 8px dot grain
- H1 "菜友集市": PingFang sans → 思源宋体 SemiBold
- CTAs: pill 9999 → 8px radius, solid olive instead of forest-green
- Hero: small watercolor wreath + tiny stamp seal "种子集市 · 始于 2024" inline below the subtitle
- User photo thumbnails (the placeholder 80×80 squares): **unchanged** — just the surrounding card chrome shifts

---

## 4. Recommended rollout

If the project owner decides to apply Cluster 5:

1. **Phase 1: overlay-only, no HTML change** — ship `cluster5-overlay.css` as a feature-flag-able stylesheet (`?style=c5` query param toggle, or env-based for staging). Get user feedback on tone before committing.
2. **Phase 2: decorative HTML additions** — once Phase 1 is liked, add the stamp/seal SVG to the hero, the corner sprigs to section heads, and 2–3 watercolor empty-state illustrations (loyalty card / "no requests yet" / "search no results"). These are additive — no UX changes.
3. **Phase 3 (optional)**: integrate Cluster 5 into the offer-form / want-form decorative elements (small watercolor sprig in the photo-first card header, etc.).

Do NOT do all three at once. Do NOT touch tabbar, card row layout, button sizes, or interaction behavior in any phase.

---

## 5. What I'm NOT recommending

- ❌ Replacing user photos with watercolor versions
- ❌ Adding sepia / mix-blend filters to user photos
- ❌ Removing shadows globally and accepting that flat surfaces have no visual separation — keep the 1px olive border swap so cards still read as distinct surfaces
- ❌ Italic-rendering Chinese text (the synthesized slant is awful)
- ❌ Changing the tabbar to a parchment-style bar with watercolor icons — tabbar is high-touch UX; visually changing it risks confusion for 中老年 users who've trained on the current look
- ❌ Changing primary action button color in a way that breaks the green=safe / red=danger / yellow=warn semantic system the users have already learned
