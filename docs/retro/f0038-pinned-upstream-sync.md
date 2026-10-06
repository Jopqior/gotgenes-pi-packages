---
issue: 38
issue_title: "Sync gotgenes/pi-packages@8d373ceab20c5236b08d8d6c032fd515b9fa8dc4"
---

# Retro: #38 — Sync gotgenes/pi-packages@8d373ceab20c5236b08d8d6c032fd515b9fa8dc4

## Stage: Planning (2026-10-06T16:16:32Z)

### Session summary

Read the fixed-target issue, synchronization/release constraints, incoming inventory and relevant fork intersections; confirmed compatibility decisions with the operator.
Committed `docs/plans/f0038-pinned-upstream-sync.md` as `17e5ae5fea819fbd094bb5d576427111b82e9e19`, with atomic merge adaptations, regression/mutation cycles, packed verification, separate fork evidence and ordinary independent review.
No actual merge, implementation, recorder invocation, release or publication occurred; the next stage is `/tdd-plan`.

### Observations

- Startup `git pull --ff-only` reported already up to date; the primary checkout was clean on `main` without pending Git operations.
  The issue author and authenticated CLI user were both `Jopqior`; scope is repository-wide, and no previous issue-38 plan/retro was found.
- Immutable planning inputs: source HEAD `485107a02f9ffa099b49eaf143fe35165eeea1b2`, common base `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`, target `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`.
  The explicit safe fetch preserved the measured local tag count of 22.
- The measured incoming inventory contains 214 files and is embedded in the plan, checked for exact ordered equality against real `git diff --name-status` output.
  Git-only `merge-tree` preview reported 10 conflicts and tree `630d600ff33e64040a70f2cb3a5d5dd1371b43ee`; this is not a merge or runtime result.
  Resolve the actual pre-merge first parent again after these documentation commits.
- Operator direction: accept the target's hard ceiling, fresh resume budget, minimum-limit notice, `wrapUpTurns`, `turnBudget`, removed terminal `steered`/old flags, Pi 1.0 tool floors and permission behavior, without a compatibility layer.
  Preserve fork identity, initial-selection ownership/confirmation/cancellation/admission, pending-safe model presentation, no resume reselection and companion configuration/service/rescue contracts.
- A second explicit decision accepted target workspace outcomes: warned initial completion with a question disposes; warned resumed completion with a question retains; exhaustion disposes and reports `aborted` in both paths.
  Do not unify these guards during conflict resolution or mistake unchanged worktrees paths for unchanged core disposal timing.
- Selection confirmation and budget startup are separate milestones.
  Background acknowledgement must not wait for the first budget, and pending workspace/factory holds must not fabricate progress from configuration or old initial counters.
  Loop doubles must invoke `onTurnBudget` to pin the real record-state callback wiring.
- Source inspection corrected test-list assumptions: renderer coverage is `test/widget-renderer.test.ts`, and `test/runtime.test.ts`/`test/helpers/make-deps.ts` contain no retired `graceTurns` fixtures.
  Fork-only flags/string-result gates and TUI `mode` doubles must migrate in the same merge commit as type removal.
- Planning baseline: the six selected core selection/service files passed 92 tests on the source HEAD; selected budget-policy import zones passed `fallow guard` inspection.
  The baseline does not verify the target runtime, completed integration, packed candidate or planned mutations.
- Both contained stable upstream releases have empty package-scope release-to-target tails: core 23.2.0 at `6879774308ba8056859fa42284da71763fe1fe78`, worktrees 0.3.3 at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
  Record actual merge contributions separately for both registered forks; do not infer them from the breaking merge subject or copy the core rationale to worktrees.
- Preserve guide-owned complete inventory versus targeted deep review; unchanged inherited code/history is not an additional audit assignment.
  No optional live/TUI omission is a waiver gate; required failures and materially new adaptation questions still stop for operator direction.
  Open fork issue #26 remains deferred, and no speculative follow-up was filed.
- The incoming Issue-prefix rule removal is paired with the real MD018 magiclink fix; its upstream retro attributes the damage to `rumdl fmt`, not CommonMark.
  Historical converted headings stay outside this synchronization's repair scope.
- Plan Markdown lint, invisible-character/Unicode checks, inventory comparison and commit hooks passed.
  No push, GitHub mutation or publication authorization was requested; restart Pi before shipping invokes source-changed GitHub tools/prompts.

#### Deferred tidyings

- `src/lifecycle/subagent.ts`: no extra selection/budget coordinator or legacy bridge; existing owners separate their lifetimes.
- `test/lifecycle/subagent.test.ts` and held-phase tool tests: no broad harness/test-tree rewrite for mechanical fixture migration.
- `src/tools/helpers.ts`/`spawn-config.ts`: no additional model-presentation abstraction beyond the shared `detailFor` producer.
- `src/lifecycle/turn-limits.ts` and incoming `turn-loop-result` fixture: do not replay target implementation as preparatory commits before the genuine merge.

The Tidy First assessor recommended no preparatory commits; these rejected changes are not obligations for this issue.
