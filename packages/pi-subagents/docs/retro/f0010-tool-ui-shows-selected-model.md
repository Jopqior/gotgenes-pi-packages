---
issue: 10
issue_title: "subagent tool UI shows the call's model, not the one spawn selection chose"
---

# Retro: #10 — subagent tool UI shows the call's model, not the one spawn selection chose

## Stage: Planning (2026-09-13T14:27:08Z)

### Session summary

Planned the tool-card freeze as a `pi-subagents`-only `fix:`: stamp the selected pair on `Subagent` after the gate, overlay `detailBase` at the three runner emit sites, and extract `formatSpawnModelName` so the display rule has one home.
Dual `pkg:` labels are observational; `@jopqior/pi-subagents-model-selector` does not change.
Committed `docs/plans/f0010-tool-ui-shows-selected-model.md`.

### Observations

- The pair that runs is a local `selected` in `prepareSession`; `execution.model` is never overwritten, and `SubagentRecord` does not carry it (ADR 0005).
- Overlay is a no-op unless `awaitingSelection` or `selectedPair` is set, so no-provider presentation and `createResolvedSpawnConfig` fixtures (`execution.model: undefined`) stay intact.
- Test seam is `SubagentInit.selectedPair` (construct-complete), not a post-construction write, matching design principle 8.
- Field/getter cannot share the name `selectedPair`; the plan uses `_selectedPair` plus a getter.
- Skipped `ask_user`: operator-authored issue, expected behavior is the spec, ADR 0005 declines a public-snapshot widening.
- Operator chose one short-name function (`formatSpawnModelName`) over duplicating the ternary in the overlay.
  Squash-sync follow-through is the `spawn-config.ts` conflict plus a `docs/upstream-sync.md` recipe: copy upstream's new formula into that function, do not inline it back.
- Operator declined a `tags` option on `createResolvedSpawnConfig`; runner tests assign `detailBase.tags` in the test body.

#### Deferred tidyings

- `src/ui/display.ts` — `detailBase.tags` stays a string list; a keyed tag vocabulary would dissolve thinking-tag matching but reshapes the widget, renderer, and every tag pin.
- `src/tools/spawn-config.ts` — only the Claude-strip ternary moves; the rest of `resolveSpawnConfig` is untouched.
- `test/lifecycle/subagent.test.ts` — gated-selection `start` / `resolve` / `await promise` idiom stays inlined; no `settleGatedRun` helper.
- `src/ui/display.ts` — `"twin"` mode-label literal stays in `getPromptModeLabel`; overlay matches a leading `"twin"` by string.
- `test/helpers/make-spawn-config.ts` — no `tags` option; runner tests assign `detailBase.tags` in the test body.

## Stage: Implementation — TDD (2026-09-13T15:31:49Z)

### Session summary

Six TDD cycles landed: extract `formatSpawnModelName`, overlay helper, stamp `selectedPair` on `Subagent`, wire the foreground card, strip pending model from background launch details, then docs.
`pi-subagents` tests went 1855 → 1872 (+17).
Pre-completion reviewer: WARN (non-blocking).

### Observations

- Commit types follow AGENTS.md rather than the plan's `feat:` labels: unwired extract/overlay/stamp are `refactor:`; the two runner wirings are `fix:` (the issue is a display bug).
- Background `fix:` subject was reworded after the changelog preview from overlay-mechanism to the pending-strip symptom.
- Cancellation and no-provider `selectedPair` pins were added onto existing gate tests rather than new siblings; they stayed green during Red as absence pins.
- `thinkingTag` / `isThinkingTag` stayed unexported; overlay and `buildInvocationTags` are the only callers.
- Pre-completion reviewer: WARN.
  All deterministic checks passed.
  Non-blocking: `thinkingTag` and `isThinkingTag` do not share a prefix constant; `SpawnDetailBase` is not folded into `spawn-config.ts` / `helpers.ts`; Mermaid was not machine-validated (`mmdc` Chromium sandbox).
- Round 2 (2026-09-13T15:39:56Z): `THINKING_TAG_PREFIX` and exported `SpawnDetailBase` landed in `b2282ded`; reviewer Overall: PASS.

## Stage: Final Retrospective (2026-09-13T15:55:24Z)

### Session summary

Issue #10 shipped on trunk as a `pi-subagents`-only `fix:`: after spawn selection chooses a pair, the foreground tool card names that pair, and pending selection no longer claims the call's model.
Planning committed a DRY extract, then the operator spent four turns tightening squash-sync coupling before the plan was revised (`d0ce4601`).
Ship closed the issue after green CI and skipped the release: `next-version.sh` printed `pi-subagents-v2.0.0` because git-cliff re-counted breaking commits already in `pi-subagents-v1.0.0`.

### Observations

#### What went well

- Overlay is a render-time projection; `SubagentRecord` stayed closed under ADR 0005.
- TDD ran killing mutations from `/tmp` copies, not `git checkout`, and the changelog preview rewrote the background `fix:` subject from overlay-mechanism to the pending-strip symptom.
- Ship refused the fake major instead of dispatching `release.yml`.

#### What caused friction (agent side)

- `premature-convergence` — `/plan-issue` committed a tidy-first extract of `formatSpawnModelName` from `spawn-config.ts` without mapping which production files already carried a fork patch.
  `spawn-config.ts` had none (`git log refs/sync/upstream-main..HEAD --` empty).
  Impact: four operator turns after the plan commit, then `d0ce4601` / `d89e2514` to keep one short-name rule and add the squash-sync recipe.
- `instruction-violation` (self-identified) — TDD copied `pnpm --filter @gotgenes/pi-subagents` from `.pi/prompts/tdd-plan.md`; this package's `package.json` `name` is `@jopqior/pi-subagents`.
  Impact: one failed vitest command, then the correct filter.
- `other` — git-cliff's unreleased window still contains `51bbd743` and `01bc18fd`, both ancestors of `pi-subagents-v1.0.0`, so `next-version.sh` printed `pi-subagents-v2.0.0` for two `fix:` commits.
  Impact: release correctly skipped; about ten diagnostic commands after the script printed the tag.

#### What caused friction (user side)

- The squash-sync coupling constraint arrived after the plan commit, not in the issue body or at the Decide gate.
- Dual `pkg:` labels (`pi-subagents` and `pi-subagents-model-selector`) suggested a cross-package plan; only the core changed.

### Diagnostic details

- **Model-performance correlation** — Planning, TDD, and Ship parent sessions ran `xai/grok-4.6`.
  `tidy-first-assessor` and both `pre-completion-reviewer` rounds ran `deepseek/deepseek-flash`.
  Flash still produced the extract recommendation and the two non-blocking WARNs that round 2 landed; no quality miss this issue.
- **Unused-tool detection** — Planning skipped `ask_user` because the issue was operator-authored and the behavior was unambiguous.
  The skipped gate was the coupling map, not the bug shape; `ask_user` after listing upstream-clean files would have caught it before `63baed14`.

### Changes made

1. `.pi/prompts/plan-issue.md` — Decide now maps production files against `refs/sync/upstream-main` and gates an upstream-clean edit even when the issue's behavior is unambiguous.
2. `.pi/prompts/tdd-plan.md` — per-file vitest uses `pnpm -C packages/<pkg>` instead of `--filter @gotgenes/<pkg>`.
3. `.pi/prompts/ship.md` — a major from `next-version.sh` with no `!:` in the plan range is stop-and-ask.
