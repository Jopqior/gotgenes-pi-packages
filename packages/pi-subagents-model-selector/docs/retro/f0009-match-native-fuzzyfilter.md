---
issue: 9
issue_title: "Spawn chooser: match native /model fuzzyFilter"
---

# Retro: #9 — Spawn chooser: match native /model fuzzyFilter

## Stage: Planning (2026-09-13T13:03:30Z)

### Session summary

Planned fork issue 9 after a clean `git pull --ff-only` on `main`.
The issue is the operator's own follow-on from [#8]'s pre-completion WARN: `filterModels` uses token-substring `includes` instead of pi-tui `fuzzyFilter`.
Committed `packages/pi-subagents-model-selector/docs/plans/f0009-match-native-fuzzyfilter.md`.
Next stage is `/tdd-plan`.

### Observations

- Direction was unambiguous; skipped `ask_user`.
  Author matches the gh CLI user.
  Native `ModelSelectorComponent.filterModels` at `pi-coding-agent@0.84.4` already calls `fuzzyFilter` with the same haystack and `isDefaultSearch` prepend, so those stay.
- Measured both new pins against `dist/fuzzy.js` before writing them: `"clde"` is `[]` today and `[claude-sonnet, claude-haiku]` under `fuzzyFilter`; score order `[haiku, claude-haiku]` is independent of input order.
- `fuzzyFilter<T>(items: T[], …)` wants a mutable array; compiled `fuzzy.js` never writes `items`.
  The plan spreads at the call site rather than widening `filterModels`.
- Dropping haystack `.toLowerCase()` is not a preparatory refactor: `fuzzyMatch` lowercases internally, but removing the call before the swap makes `includes` case-sensitive.
- Tidy-First recommended no preparatory commits.
  `filterModels` is 30 lines and shrinks.

#### Deferred tidyings

- `src/selection-form.ts` — extract the `isDefaultSearch` prepend block (untouched by this swap).
- `src/selection-form.ts` — narrow `modelHaystack(model, input)` to `input.defaultModel` (wide bag; zero effect on the `fuzzyFilter` call).
- `test/helpers/selection-fixtures.ts` — shared fixture for `id: "haiku"` (one caller; inline `makeModel` matches existing one-off style).

## Stage: Implementation — TDD (2026-09-13T13:15:03Z)

### Session summary

One red-green cycle landed `fix(pi-subagents-model-selector): match native /model fuzzyFilter`.
`filterModels` now calls pi-tui `fuzzyFilter` and keeps the `isDefaultSearch` prepend; haystack `.toLowerCase()` dropped because `fuzzyMatch` lowercases internally.
Package tests went 59 to 61 (+2) in `test/selection-form.test.ts`.

### Observations

No deviations from the plan.
Both killing mutations matched the prediction: restoring the `includes` predicate reddened both new tests; reordering hits with `models.filter((model) => filtered.includes(model))` reddened only the score-order test.
Empty-query sort, `haiku` haystack, and `def` default prepend stayed green without edits.
Pre-completion reviewer: PASS.

[#8]: https://github.com/Jopqior/gotgenes-pi-packages/issues/8
