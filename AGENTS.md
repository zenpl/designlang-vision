# designlang-vision — Agent Instructions

This repo is a **fork** of [`Manavarya09/design-extract`](https://github.com/Manavarya09/design-extract) (npm: `designlang`) intended to replace the Playwright DOM/CSS extraction path with a **screenshot → vision-LLM → DTCG-tokens** path.

## Fork topology

- **upstream** (read-only): `https://github.com/Manavarya09/design-extract`
  - Push is disabled (`git remote -v` shows `NO_PUSH_TO_UPSTREAM_FORK_ONLY` on the push URL — never re-enable)
- **origin**: not set yet (no fork on a GitHub account / org has been created)
- **fork-base tag**: marks the upstream commit this fork started from (`v12.14.0` @ `2c50abc`)

Useful commands:
```bash
git diff fork-base..HEAD                 # what this fork has changed vs upstream snapshot
git fetch upstream                       # pull upstream updates
git merge upstream/main                  # merge upstream into current branch
git log fork-base..upstream/main         # what's new upstream since we forked
```

## Status

- ✅ Cloned upstream @ v12.14.0
- ✅ `package.json` renamed `designlang` → `designlang-vision`, version `0.1.0-fork.12.14.0`, bin renamed
- ✅ README banner notes fork status; original README preserved below banner
- ✅ GitHub fork at `zenpl/designlang-vision`, parent = `Manavarya09/design-extract`, `origin` wired
- ✅ Smoke test: `node bin/design-extract.js --help` works
- ✅ **Vision architecture ratified — see [`docs/vision/architecture.md`](docs/vision/architecture.md)**
  - Decisions locked: command = `moodboard`; provider = Anthropic Claude; MVP cut into M1/M2/M3
- ✅ **M1 verified — per-image `ImageObservation` extraction works on real images**
  - CLI: `node bin/design-extract.js moodboard <path-or-glob> -o <dir> -n <name>` (default model `claude-sonnet-4-6`; `--model claude-opus-4-7` to escalate; `--model claude-haiku-4-5` for cost)
  - Source files: `src/vision/image-loader.js`, `vision-client.js`, `prompts/image-analysis.js`, `schemas/image-observation.schema.json`, `schemas/validate.js`, `crawl-moodboard.js`
  - 26/26 unit tests pass (schema validation / image loader / vision client with mocked SDK / auth-token routing)
  - **Live acceptance** on 3 distinct-style moodboard images (`tests/assets/{1,2,3}.jpeg`, gitignored):
    - haiku-4-5: 3/3 ok, ~$0.005 — passes discrimination test, but empty `implementationHints` and no prompt cache hit
    - **sonnet-4-6**: 3/3 ok, ~$0.10 — adopted as **default**; rich method-level hints, prompt cache verified (6672 read / 3336 write)
    - opus-4-7: 3/3 ok with 1 repair retry triggered (production-validates the retry pipeline), ~$0.40–0.50 — value-level CSS hints with concrete numerics; opus's anti-pattern for img_03 spontaneously references "a different moodboard" (does M2 cluster reasoning inside M1). **Recommended for M3 emission.** Sonnet sufficient for M2.
    - Full comparison + cost table in `docs/vision/m1-acceptance.md` Run log
- ⏳ M2 (cluster + synthesis) — not started

## Don't do without checking with the user

- Don't rewrite or delete upstream files just because the vision path doesn't need them — keep them as fallback / reference until the vision pipeline proves it can replace them
- Don't push to `upstream` (the URL is intentionally bogus)
- Don't set `origin` to a random GitHub URL without the user's instruction — they own where this lives
- Don't `npm install --save` new deps without first checking if upstream already has one that does what you need

## Vision pipeline — where to look

The single source of truth for the vision pipeline is **[`docs/vision/architecture.md`](docs/vision/architecture.md)**. It covers:

- Why a Vision Adapter, not a flag on the existing crawler
- Data flow and core schemas (`ImageObservation`, `MoodboardDesign`)
- Cluster-before-consensus principle
- 4 vision-specific extractors
- Reuse vs new emitters (which upstream files we adapt, which we replace)
- M1 / M2 / M3 deliverables and stop conditions
- Out-of-scope list and open questions

**Don't re-litigate that doc in chat.** If you find something it got wrong, edit the doc + commit, don't carry the disagreement in working memory.

## License

MIT, inherited from upstream. Credit Manav Arya Singh (@masyv) in any redistribution.
