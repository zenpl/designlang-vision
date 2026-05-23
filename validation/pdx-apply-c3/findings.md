# pdx-apply-c3 · Findings (Editorial Botanical Commerce → 菜友集市)

**Verdict: ❌ Failed. The most instructive failure of the 5 applies.**

User feedback (verbatim): "cluster 3 的结果不好。你分析一下"

This case study is preserved BECAUSE it failed, not despite the
failure. The failure mode here is the most generalizable lesson in
the apply-methodology handbook.

## Failure mode taxonomy

### 1. Tonal mismatch with brand promise (root cause)

pdx-gardener's brand promise is **"邻里换菜便条本"** — neighborly,
low-friction, mutual-aid. Cluster 3's vocabulary is **magazine-catalog
editorial commerce** — curated, premium, Saveur/Kinfolk.

These two registers do not coexist in a single product. The user
expects one experience from the chrome (Saveur lookbook) and gets
another from the content (老王 backyard 菠菜). The mismatch reads as
bait-and-switch.

**Rule extracted**: *Before applying a cluster, ask "what register
does the chrome promise?" and "what register does the actual user
content deliver?" If the answers differ by more than one notch, the
apply will read as inauthentic regardless of execution quality.*

### 2. Chinese display serif on Bold weight reads "古籍/heritage" not "neighborhood"

Choosing LXGW 新晋宋 Bold at 44px display reads as **古籍展览 / 老字号
heritage brand**. The original sans Bold H1 was actually MORE
on-brand for "Portland Saturday community board".

**Rule extracted**: *For Chinese H1, choose font weight + face based
on the brand's emotional register first, "editorial sophistication"
second. Sans-bold for neighborhood/modern; serif-regular for
literary/contemplative; serif-bold for heritage/古籍. Default to sans
if the brand is "community / casual / contemporary".*

### 3. Cluster 3's signature move (photo-overflow) is wrong-handed for amateur photos

C3's signature is "photo overflows top of card -24px". This works in
the cluster's home context where photos are *styled botanical product
shots* (think a styled cherry tomato on a linen napkin). When the
photo is a hand-held shaky phone shot of muddy spinach, having it
overflow above the card just **emphasizes** how un-magazine-y the
photo actually is.

**Rule extracted**: *A cluster's signature visual moves are tuned for
the asset quality the cluster was sampled from. Applying a signature
move on lower-quality content amplifies the gap rather than
covering it.*

### 4. Italic festival (italic in 6 places on one screen)

I used italic Fraunces in: count-badge, "查看全部", "OFFER · / WANT ·"
dividers, hero secondary line, product-title Latin portions, wants
sub-headers — **six italic events on one mobile screen**.

When everything is italic, nothing is emphasized. Magazine designers
use italic SPARINGLY (1–2 per spread). This was italic *inflation* —
italic stopped acting as accent and became base noise.

**Rule extracted**: *Editorial accents (italic, all-caps with
tracking, gold rules, drop-cap, large display) are scarce resources.
Budget: at most 2 per visual area, 4 per screen. Anything beyond
that is inflation.*

### 5. Owner names in 楷体 → exoticization

Rendering "老王 / 林姐 / 张老师 / Fanding / 乐乐 / 庆琼" in LXGW
WenKai 楷体 turns user identity into typographic flourish. **It
exoticizes neighbors as aesthetic objects.** They're not Tang dynasty
poets — they're neighbors with extra zucchini. Sans 14px would have
respected them more.

**Rule extracted**: *Decorative typography on user-generated names is
patronizing unless the brand context is literally literary/cultural
heritage. Default user-name treatment is body sans, same weight as
metadata.*

### 6. Pure-white cards stripped warmth

I switched cards from cream `#FDFAF7` to pure white `#FFFFFF` to
match C3's catalog-clean aesthetic. This read as **catalog-clinical**
and lost the "we're at a Saturday market" feeling that warm cream
delivers.

**Rule extracted**: *Surface warmth is often the brand's main
emotional cue. Removing warmth (cream → white) costs more than the
visual cleanliness gains. Preserve unless the new register
specifically benefits from clinical cleanliness (luxury catalog).*

### 7. The "chrome-vs-content separation" hypothesis has a precondition

In the C5 apply, "chrome high-end, content untouched" worked.
In the C3 apply, it failed.

The precondition: **chrome register must not be more than one notch
above content register**. C5 (parchment watercolor) is one notch
above amateur phone photos — gentle elevation, no clash. C3
(editorial magazine) is three notches above — Big Clash.

**Rule extracted**: *Chrome-content separation is not free. It works
within a 1-notch elevation. It fails at 2+ notches because the
audience reads the gap as inauthentic, not aspirational.*

## What was kept (rare hits)

The C3 apply was not 100% wrong. These specific moves are worth
preserving for *other* contexts (just not pdx-gardener):

- Mixed bilingual title rendering: italic Fraunces on Latin portion +
  PingFang on Chinese portion — looks right *in luxury commerce*
  contexts (a Portland heritage seed brand, not a community board)
- Gold/italic count-badge in editorial-magazine context — appropriate
  for a curated publication, not for a free community swap

## Salvage

Demo preserved at `validation/pdx-apply-c3/after-c3.html` as the
counter-example reference. Do not delete.
