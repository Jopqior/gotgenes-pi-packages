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

## Stage: Final Retrospective (2026-09-13T13:51:02Z)

### Session summary

Shipped fork issue 9 on trunk as `@jopqior/pi-subagents-model-selector` 1.0.1 (`pi-subagents-model-selector-v1.0.1`).
`filterModels` now calls pi-tui `fuzzyFilter`; package tests went 59 to 61.
Four parent sessions ran on `xai/grok-4.6` (plan, TDD, ship, this retro).
This closes the [#8] pre-completion WARN on the matcher.

### Observations

#### What went well

- [#8] WARN → filed issue 9 → measured pins → one red-green cycle → reviewer PASS is the residual loop working on this companion.
- Planning probed `dist/fuzzy.js` at `0.84.4` and predicted both killing mutations; TDD matched them exactly (restore `includes` reddens both new tests; `models.filter((model) => filtered.includes(model))` reddens only score order).
- Issue 8's `ship.md` `git-cliff` stop rule paid off: `next-version.sh` printed `pi-subagents-model-selector-v1.0.1` and ship did not hunt PATH.

#### What caused friction (agent side)

- `other` — planning ran five consecutive `fuzzyFilter` probes (turns 15–19) to find a production-haystack pair whose score order differed from insertion order.
  The fifth probe (`id: "haiku"` vs `claude-haiku`) is the pin that shipped.
  Impact: added planning time, no rework.
- `missing-context` — planning loaded `.pi/skills/package-pi-subagents/SKILL.md` after finding no `package-pi-subagents-model-selector` skill.
  TDD noted the gap and skipped.
  Impact: extra context in planning; no design error.
  Root `README.md` already lists this package under the no-dedicated-skill note.

#### What caused friction (user side)

- Untracked `.pi/extensions/pi-permission-system/` is still in the working tree (issues 4, 8, and this one left it untouched).
- The [#8] `canSubmit` / renderer residual stayed a Non-Goal here; no follow-up was filed.

### Diagnostic details

- **Model-performance correlation** — Plan, TDD, ship, and this retro ran on `xai/grok-4.6`.
  Parent transcripts do not inline subagent models; `.pi/agents/tidy-first-assessor.md` and `.pi/agents/pre-completion-reviewer.md` request `anthropic/claude-sonnet-5`.
  Tidy-First recommended no preparatory commits; pre-completion returned PASS.
  No quality mismatch.
- **Escalation-delay tracking** — the five `fuzzyFilter` probes were different fixtures, not the same error.
  No sequence longer than five tool calls on one failing approach.
- **Feedback-loop gap analysis** — TDD ran `check` / root `lint` / `test` / `fallow dead-code` at baseline, after the step, and at the end.
  Ship re-ran root `lint` and `fallow` before push.
  Incremental; nothing to flag.

### Changes made

1. Appended this Final Retrospective stage to `packages/pi-subagents-model-selector/docs/retro/f0009-match-native-fuzzyfilter.md`.
   No `AGENTS.md` or prompt edits.

[#8]: https://github.com/Jopqior/gotgenes-pi-packages/issues/8
