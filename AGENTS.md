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

## Status (as of fork setup)

- ✅ Cloned upstream @ v12.14.0
- ✅ `package.json` renamed `designlang` → `designlang-vision`, version `0.1.0-fork.12.14.0`, bin renamed
- ✅ README banner notes fork status; original README preserved below banner
- ✅ Smoke test: `node bin/design-extract.js --help` works, version reports `0.1.0-fork.12.14.0`
- ⏳ Vision pipeline: TBD (scope deferred — ask user before deciding)

## Don't do without checking with the user

- Don't rewrite or delete upstream files just because the vision path doesn't need them — keep them as fallback / reference until the vision pipeline proves it can replace them
- Don't push to `upstream` (the URL is intentionally bogus)
- Don't set `origin` to a random GitHub URL without the user's instruction — they own where this lives
- Don't `npm install --save` new deps without first checking if upstream already has one that does what you need

## Vision pipeline placeholder

When the vision work starts, target structure:
```
src/
  extractors/
    dom/        # upstream's Playwright path, kept as-is
    vision/     # NEW — screenshot → VLM → DTCG tokens
  io/
    screenshot.js  # NEW — capture inputs (URL screenshot / local image / PDF page)
docs/
  vision/       # NEW — VLM prompt design, calibration notes, evals
```

Don't create those dirs preemptively — wait for scope decision.

## License

MIT, inherited from upstream. Credit Manav Arya Singh (@masyv) in any redistribution.
