---
issue: 5
issue_title: "fork 文档编号改用 f 前缀，规避与上游 plans/retros 编号冲突"
---

# Retro: #5 — fork 文档编号改用 f 前缀，规避与上游 plans/retros 编号冲突

## Stage: Planning (2026-09-12T08:22:33Z)

### Session summary

Planned fork issue 5 as a repo-level `/build-plan` change.
The plan is already `docs/plans/f0005-fork-plan-retro-prefix.md` so implementation does not rename it.
Tidy-First and design-review were skipped (no `src/`/`test/` files, no shared TypeScript wiring).

### Observations

- Measured `/build-plan 5` today resolves to `packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md`.
  Lookup must short-circuit on `fNNNN-` rather than union with unprefixed `NNNN-`, or the inherited `0005` stays in the result set beside `f0005`.
- `scripts/issue-context.sh 1` already cats inherited package `0001` plans beside the fork plan; short-circuit after rename is a deliberate narrowing.
- `/ship` plan location stays frontmatter `^issue: $1$` and already collides for issue 1 with inherited `packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md`.
  Out of scope.
- Next session must invoke `/build-plan docs/plans/f0005-fork-plan-retro-prefix.md` (path form) because in-process prompts still glob `NNNN-`.
- Land this issue before planning [#2] so that `/plan-issue` does not emit `0002-`.

## Stage: Implementation — Build (2026-09-12T08:49:50Z)

### Session summary

Executed both `TDD Order` steps of the `/build-plan` plan: applied the canonical `fNNNN-` create/lookup rule across 13 prose files plus `scripts/issue-context.sh` (short-circuit `f${PADDED}` loops before the padded fallback), then `git mv`-renamed the two fork `0001` files to `f0001-` and cleared `.rumdl_cache`.
All three dry-runs in the plan's Test Impact Analysis verified passing (issue 5 short-circuits to `f0005` only; issue 1 post-rename short-circuits to `f0001` only; `0890` still resolves via fallback).

### Observations

- Deviation (fixed in the step-1 commit body): `scripts/issue-context.sh`'s display loops already exited 2 under this machine's bash 5.3.9 — `printf` parses a format string starting with `---` as options.
  Fixed with `printf --` in both display loops; verified pre-existing by stashing the change and reproducing exit 2 on the original script.
- Deviation: dropped `plan-issue.md`'s now-moot "ignore `docs/plans/archive/` when resolving conflicts" sentence — with issue-number-keyed `fNNNN` names no numbering conflicts remain, and the reviewer confirmed `docs/plans/archive/` does not exist in this repo.
- Killing mutation: applied by replacing both `f${PADDED}` glob headers with padded ones (a scripted multi-line `perl` substitution half-applied and corrupted the retro loop — restored from a `cp` backup and redone with `Edit`); without the `f` loops, `issue-context.sh 1` stops printing `f0001` and regresses to the inherited union.
- Pre-completion reviewer: WARN (no blocking findings).
  WARN finding: the `/ship` `^issue: $1$` frontmatter grep returns two plans for issue 5 (fork `f0005` plus inherited github-tools `0005`) — a residual the plan declared out of scope but never filed.
  Filed as [#6]; `roadmap-fit` exited at its step 1 (repo-level issue, no open package phase).
- Reviewer also corrected the mutation form: deleting the loop-header lines alone orphans their bodies under `set -u`; the valid form neutralizes the globs — conclusion unchanged.

[#6]: https://github.com/Jopqior/gotgenes-pi-packages/issues/6
[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
