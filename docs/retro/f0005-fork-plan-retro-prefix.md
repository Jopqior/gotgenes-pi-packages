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

## Stage: Final Retrospective (2026-09-12T09:17:48Z)

### Session summary

Landed the `fNNNN-` create/lookup rule on trunk (`084218aa`, `0ef83b71`), closed issue 5, and filed the `/ship` frontmatter collision as [#6].
Four sessions (plan on `xai/grok-4.6`, build/ship on `zai-coding-cn/glm-5.3`, retro on `xai/grok-4.6`) plus a `anthropic/claude-sonnet-5` pre-completion review.
No package release: the range touched no `packages/` paths.

### Observations

#### What went well

- Planning dogfooded the new name: the plan is `docs/plans/f0005-fork-plan-retro-prefix.md`, so implementation did not rename it, and `/build-plan` was invoked by path to dodge the still-stale in-process `NNNN-` glob.
- The `printf '---'` exit-2 on bash 5.3.9 was proven pre-existing by stashing the step-1 script and reproducing on the original, rather than assumed to be the new `f${PADDED}` loops.
- Short-circuit vs union was measured at planning time (`/build-plan 5` → github-tools `0005`); the build dry-runs pinned the same three cases.
- Reviewer WARN on the unfiled `/ship` residual became [#6] in the same session, with `roadmap-fit` correctly exiting at step 1.

#### What caused friction (agent side)

- `instruction-violation` — the killing mutation used a multi-line `perl -0pi` substitution on `scripts/issue-context.sh` despite the `AGENTS.md` perl-block trap (Refs gotgenes/pi-packages#525).
  Self-identified after the retro loop was half-rewritten; restored from a `cp` backup and redone with `Edit`.
  Impact: about five extra tool calls; no leftover corruption.
- `wrong-abstraction` — this retro located `f0005-*` with the find tool (whole-path fuzzy match), which returned nothing, then `ls` of every `packages/*/docs/{plans,retro}/` dumped hundreds of inherited files.
  The retro prompt already says to glob `docs/plans/fNNNN-*`; a shell glob would have hit in one call.
  Self-identified.
  Impact: one wasted truncated listing and a delayed locate; no rework.
- `other` — `/ship` received a plan path as `$1` (`@docs/plans/f0005-fork-plan-retro-prefix.md`).
  The template interpolated it into `git branch --list "issue-$1-*"` and `gh issue view $1`.
  The ship agent recovered by reading frontmatter `issue: 5` before those commands ran.
  Impact: added friction but no rework.
  The integer collision itself is already [#6]; path-form handling is adjacent and unfiled.

#### What caused friction (user side)

- The operator had to request Chinese replies in all four sessions (`用中文回答我` / `本 session 用中文回答`).
  Nothing in `AGENTS.md` records that preference, so every fresh session starts in English.
- The build summary said both `/ship 5` and “hand-pick `docs/plans/f0005-fork-plan-retro-prefix.md` because grep returns two plans,” so passing the path into `/ship` was a reasonable reading of mixed guidance.

### Diagnostic details

- **Model-performance correlation** — Planning (`xai/grok-4.6`) ran the glob census and wrote the plan under the new name; appropriate.
  Build and ship (`zai-coding-cn/glm-5.3`) were mechanical wording plus a script edit; glm recovered from the perl trap and from the path-as-`$1` ship argument.
  Pre-completion (`anthropic/claude-sonnet-5`) produced the WARN that became [#6]; judgment-heavy work on a capable model, no mismatch.
  Retro (`xai/grok-4.6`).
- **Unused-tool detection** — the retro locate used find instead of a shell glob (`ls docs/plans/f0005-* docs/retro/f0005-*`).
  No subagent would have helped; the right tool was `bash`.
- **Feedback-loop gap analysis** — lint ran after step 1, after the rename, and as the pre-push gate; rumdl ran on the renamed files in the same commit as `git mv`.
  Incremental; nothing to flag.

### Changes made

1. `AGENTS.md` fork-scope: reply to the operator in Chinese; keep committed artifacts in English unless asked otherwise.
2. Appended this Final Retrospective stage to `docs/retro/f0005-fork-plan-retro-prefix.md`.

[#6]: https://github.com/Jopqior/gotgenes-pi-packages/issues/6
[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
