---
issue: 38
issue_title: "Sync gotgenes/pi-packages@8d373ceab20c5236b08d8d6c032fd515b9fa8dc4"
---

# Pinned upstream synchronization with fork contract preservation

## Release Recommendation

**Release:** ship independently

This repository-scoped synchronization is not a roadmap batch member; land and close it through the ordinary issue lifecycle.
This marker recommends independent landing, not release dispatch or publication.
The core's incorporated upstream baseline advances from the published 22.0.0 correspondence to the verified 23.2.0 release, so the policy's upstream contribution is major.
Worktrees remains on the verified upstream 0.3.3 release; an unchanged worktrees package has no upstream version contribution.
Classify each merge's actual fork contribution independently after resolution; preserving identity and selection contracts alone does not make that contribution major.
Do not copy upstream versions into either fork manifest, predict an unreleased fork version, or publish any package without separate operator approval of the scope and destination.

## Problem Statement

Integrate the issue's exact upstream commit into this fork while retaining its selector and worktrees contracts.
The target changes public turn-budget shapes, execution limits, resume, persisted transcript navigation, widget rendering, permission behavior, and host requirements.
Textual conflict resolution alone cannot preserve the fork: several selection, service, lifecycle, and presentation intersections merge automatically.
The [synchronization guide](../upstream/synchronization-guide.md) governs review depth, validation, finding disposition, and merge topology throughout the standard stages.

## Goals

- Incorporate the pinned repository-wide target with a genuine two-parent merge on the root checkout's `main`.
- Adopt the target's breaking turn-budget behavior: hard ceiling, fresh resume budget, minimum finite limit, `wrapUpTurns`, `turnBudget` records/events, and removal of terminal `steered`.
  The operator explicitly approved these observable behavior/default/output changes without an old-field or old-semantics compatibility layer.
- Preserve admission before selection, explicit confirmation/cancellation, background tool release at confirmation, synchronous service ID return, nested selection ownership, pending-safe model presentation, and no selection on resume.
- Adopt the target's workspace outcome rules, including the initial/resumed warned-question distinction explicitly approved during planning; preserve provider configuration, disposal implementation, rescue branches, and recovery.
- Incorporate the incoming colgrep/GitHub-tool Pi 1.0 requirements and permission-system behavior without an unrelated inherited-defect repair campaign.
- Preserve fork npm identities, repository metadata, published-core imports, required companion peers, package scopes, tags, and immutable fork CHANGELOG history.
- Commit policy-owned evidence for both registered forks and complete ordinary independent review before `/ship`.

## Non-Goals

- No implementation, merge, recorder invocation, release, or publication in the planning session.
- No substituted upstream tip, rebase/squash synchronization, feature-worktree lane, imported upstream tags, or rewritten fork history.
- No selector configuration-source/provenance feature from open fork [#26]; retain its existing selection request and ordinary no-selector precedence.
- No compatibility aliases for removed counters/status/result flags, translation of `graceTurns` into extra turns, persisted-entry backfill, or restoration of executable agents from transcript summaries.
- No new selection/budget coordinator, package split, universal acceptance harness, live model/judge rehearsal, or default human TUI check.
- No unification of the target's initial/resume workspace guards, modification of the worktrees rescue protocol, or companion dependency-floor bump merely because core changes its own record fields.
- No historical plan/retro/phase repair, including upstream `gotgenes/pi-packages` issue 1036's converted Markdown headings; the incoming MD018 fix addresses formatter behavior, not historical prose repair.
- No automatic repair, reproduction, issue filing, or unresolved ship warning for unrelated inherited defects when required checks pass.
  A required inherited check failure still stops completion and returns to the operator.

## Background

The issue is open, labeled `scope:repo`, and authored by the authenticated operator `Jopqior`.
The initial fast-forward-only pull reported already up to date; no earlier `f0038-*` plan/retro or inherited fallback was found.
The sibling issue sweep found [#26], and the open PR sweep found no entries.
The latest triage (`docs/triage/2026-10-02-backlog.md`) describes inherited upstream backlog, not a fork ranking for this issue.
Completed fork [#34] supplies the prior merge/evidence pattern, [#35] narrows review to fork preservation, and [#37] supplies published worktrees identity and packed compatibility checks.

Core separates lifecycle execution, `InitialSpawnSelection`, observation, public service snapshots, and presentation.
The background tool waits for the selection owner's one-shot outcome; the public service returns an ID independently of admission and task completion.
The shared `presentation.detailFor(record)` already owns model/thinking facts; metrics helpers must not overwrite them.
The worktrees companion registers a workspace provider and uses the core's published settings loader; it does not need the old public turn counters.
Its existing provider tests exercise real temporary Git repositories, while core lifecycle tests establish when that provider is called.

Fork constraints override inherited process text: English committed artifacts, fork-number filenames, explicit fork-targeted GitHub mutations, explicit remote/branch before pushing, no incoming-history fork-issue closure scan, and separate publication approval.
No generic workflow rewrite is authorized beyond integrating the target's incoming edits and retaining these existing fork restrictions.

## Design Overview

Upstream target: gotgenes/pi-packages@8d373ceab20c5236b08d8d6c032fd515b9fa8dc4

### Immutable inputs and evidence limits

| Input                      | Planning evidence                                    |
| -------------------------- | ---------------------------------------------------- |
| Fork source HEAD           | `485107a02f9ffa099b49eaf143fe35165eeea1b2`           |
| Common base                | `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`           |
| Pinned upstream target     | `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`           |
| Divergence                 | Measured: 372 fork commits / 166 upstream commits    |
| Incoming files             | Measured: 214; complete name/status inventory below  |
| Text conflicts             | Measured Git preview: 10 files                       |
| Preview tree               | `630d600ff33e64040a70f2cb3a5d5dd1371b43ee`           |
| Upstream core release      | 23.2.0 at `6879774308ba8056859fa42284da71763fe1fe78` |
| Upstream worktrees release | 0.3.3 at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`  |

Both release commits are contained in the pinned target and have no unreleased package-scope release-to-target tail, checked through the real repository evidence helpers.
This establishes planning feasibility, not a completed recorder result.
The explicit safe fetch left the measured local tag count at 22.
The `git merge-tree --write-tree` exit of 1 represented preview conflicts; it did not modify the checkout/index or execute integration.
Preview conflicts are `.pi/prompts/plan-issue.md` plus core `CHANGELOG.md`, `README.md`, `docs/architecture/architecture.md`, `package.json`, `src/tools/foreground-runner.ts`, `src/tools/helpers.ts`, `test/helpers/make-subagent.ts`, `test/lifecycle/subagent-manager.test.ts`, and `test/tools/get-result-tool.test.ts`.
Re-resolve the actual pre-merge HEAD and common base during implementation: planning/retro commits will advance the first parent, so the source HEAD above is not the eventual review base.
If code or relevant constraints change after planning, reconcile the delta before merging rather than treating this preview as authoritative.

Reproduce the complete inventory from its immutable inputs with:

```bash
git diff --name-status 9087a8dfa6edbfa1808fe3deab46ac3e17a7c032 8d373ceab20c5236b08d8d6c032fd515b9fa8dc4
```

| Incoming area          | Measured inventory                 | Contract significance                                                                                                            |
| ---------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.pi/`                 | 12 modified                        | Shared prompts/skills intersect fork numbering, credit, push, and selector context                                               |
| Root                   | 2 modified                         | MD018 magiclink configuration and lockfile                                                                                       |
| Root `docs/`           | 2 added                            | Inherited Pi 1.0 plan/retro, not fork issue artifacts                                                                            |
| `pi-colgrep`           | 4 modified                         | Pi 1.0 peer floor and tool `isError`                                                                                             |
| `pi-github-tools`      | 2 added / 6 modified               | Pi 1.0 floor, failed tool flags, unresolved-SHA issue-close guard                                                                |
| `pi-permission-system` | 19 added / 78 modified / 2 deleted | Bash command/path spellings, shared sync parser, modifier verdict inheritance, forwarded ask floor/units, policy issue reporting |
| `pi-subagents`         | 16 added / 71 modified             | Budgets, records/events, resume, persisted navigation, fullscreen viewer and mode-adaptive widget                                |

There are no incoming selector or worktrees paths; both remain compatibility consumers, not excluded from verification.
Inventory every incoming path, but deep-review only the intersections below, conflict adaptations, the remerge diff, and post-merge contributions.
Do not turn permission-system's large inherited inventory or historical docs into a separate comprehensive audit.

### Accepted budget contract

Use the target's types and policy in `src/lifecycle/turn-limits.ts`, not a new module or duplicate counter:

```typescript
export type TurnBudgetPhase = "within" | "warned" | "exhausted";
export interface TurnBudget {
  maxTurns?: number;
  used: number;
  phase: TurnBudgetPhase;
}
// Public snapshot: turnBudget?: TurnBudget; no turnCount/maxTurns fields.
// Internal initial and resumed result: { responseText: string; turnBudget: TurnBudget }.
```

A finite limit is a ceiling rather than a soft limit plus grace; `wrapUpTurns` warns within that ceiling.
Source-verified constants are a minimum finite limit of 2 and default warning reserve of 2; `0`/omitted limits remain unlimited.
The retired setting is detected for a warning and stripped, not mapped to the new setting or saved back.
The actual tracker reports an unlimited budget object with no `maxTurns`; do not copy the target comment's narrower claim that budgets exist only for finite runs.
Successful turns spend budget, failed turns do not; a final answer on the ceiling is not exhaustion, but a continuing tool turn or a subsequent forced turn is stopped.
Warnings are phase facts, not a status reconstructed from equal counts.
Each resume starts a fresh tracker using the initial run's resolved limits without creating another child or invoking the selector.
These target-owned boundaries are exercised by incoming `turn-limits.test.ts` and `subagent-session.test.ts` in step 1.

`SubagentRecord` drops `turnCount`/`maxTurns` and copies optional `turnBudget` by value.
Terminal `steered` and old loop-result/completion flags disappear; warned natural completion is `completed`, exhausted completion is `aborted`, and explicit caller cancellation remains `stopped`.
Keep the separate `steer_subagent` operation and `subagents:steered` event: removing the terminal status does not remove steering.
Events, tools, notifications, settings UI, fixtures, and current public-contract docs migrate together in step 1; packaged public types are pinned in step 3.

### Selection and presentation integration

Retain admission → initial selection → workspace preparation → liveness assertion → session factory → turn loop.
The selection outcome releases the background tool at confirmation, including while workspace or factory awaits remain held.
Budget absence during those holds must not postpone acknowledgement or manufacture an initial turn/configuration-derived budget.
Attach the record's live-budget callback only when the loop starts; resumed callbacks update the same record with a fresh run budget.
Keep observer-before-`selection.finished()` ordering and the one-shot initial outcome across resume.
Step 1 extends the existing real-tool/manager held-phase tests to pin these intersections.

Preserve `onStarted` in the foreground runner, `detailFor(record)` in all tool carriers, widget pending activity, and model/thinking suppression while selection is pending.
Use real `turnBudget` for progress and `formatTurnBudget` for rendering; do not restore target's direct `record.model` overwrite in `buildDetails` or old `?? 1` counter fallbacks.
Keep the shared producer rather than computing model names separately in foreground/background/resume branches.
The target's minimum-limit advisory composes with fork resolution/presentation without altering selector authority or ordinary no-selector locks.
Step 1 covers pending, confirmed, live-switched and resumed presentation plus minimum-limit resolution.

The existing call pattern remains shallow:

```typescript
const details = presentation.detailFor(record);
const progress = buildDetails(details, record);
const outcome = await record.waitForSpawnSelection(signal);
// Budget reporting updates record-owned state; it does not settle selection.
```

### Workspace outcomes

The operator separately approved this source-verified target distinction, rather than assuming all normal question completions retain a workspace:

| Run and budget phase            | Pending question | Target disposal/status         |
| ------------------------------- | ---------------- | ------------------------------ |
| Initial, `within`               | Present          | Hold workspace; `completed`    |
| Initial, `warned`               | Present          | Dispose workspace; `completed` |
| Resume, `within` or `warned`    | Present          | Hold workspace; `completed`    |
| Initial or resume, `exhausted`  | Either           | Dispose workspace; `aborted`   |
| Non-exhausted initial or resume | Absent           | Dispose workspace; `completed` |

Keep each path's own guard rather than extracting a supposedly identical completion helper.
Disposal remains bracket-owned and once-only; worktrees' own implementation preserves dirty bytes on its rescue branch and returns its existing result addendum.
Step 2 adds discriminating core tests for this matrix; existing real-Git and packed-provider checks verify rescue/recovery behavior, not the core's budget calculation.

### Persistence, viewer, and host changes

Accept incoming persisted summaries as transcript navigation only.
The writer and tolerant allowlist reader must agree; navigation keeps manager-held records first and appends eligible disk snapshots without recreating manager records, selection ownership, workspace state, or resume capability.
The target skips older entries missing `toolUses` and no longer accepts terminal `steered`; no migration/backfill is added.
Incoming parser round-trip/filtering and navigation/viewer tests cover this in step 1; inspect automatically merged runtime/entry wiring so the fork scope remains session-owned.

Accept the target's fullscreen viewer and one-shot mode-adaptive widget timer while keeping pending-safe model presentation.
Update every affected TUI double with the required `mode`, including the fork-only observed-selection fixture, in the merge commit.
The incoming widget tests cover mode switching and timer cleanup; this plan makes no new renderer-performance claim.
Adopt the real target manifests' Pi 1.0 floor for colgrep/GitHub tools and their incoming regressions; do not invent a lower supported host.

### Structural design review

| Checklist               | Checked seam and finding                                                                                                                  | Disposition                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Dependency width        | AST-measured: foreground manager 1 member, foreground params 3, target initial loop options 5, resume options 2, budget 3, turn outcome 2 | Existing narrow collaborators fit; no new dependency bag or selection parameter relay |
| Law of Demeter          | Foreground reads record getters; shared `detailFor` owns model facts; manager delegates selection wait                                    | Keep these facades rather than reaching into selection internals/session metadata     |
| Output arguments        | New callback calls record-owned `state.setTurnBudget`; snapshot conversion explicitly copies                                              | Retain state ownership and by-value projection                                        |
| Scattered resets        | Target tracker owns each run; state reset/resume owns current-run state                                                                   | No duplicated turn counters or ad-hoc renderer resets                                 |
| Parameter relay         | Initial/resume loop options carry only budget reporter and execution inputs; initial selection remains independent                        | Keep callback at the lifecycle boundary, not through tool/selector configuration      |
| Repeated discriminators | Shared `wrappedUpAtTurnLimit` handles caveat classification; initial/resume workspace guards intentionally differ                         | Share classification, not semantically different teardown scopes                      |
| Test mock depth         | Real selection/manager/tool tests stop at controlled session/factory/TUI doubles; passive-record tests only pin projections               | Preserve both integration and projection coverage; invoke callbacks in loop doubles   |
| Missing abstraction     | Existing selection owner, tracker, workspace bracket and presentation producer cover distinct lifetimes                                   | No preparatory extraction warranted                                                   |

Planning `fallow guard` checks permitted the budget-policy/presentation import zones for foreground, helpers, spawn-config, service, widget-renderer, settings and outcome-delivery.
Incoming new persistence wiring is retained from the target, not replaced with custom reverse-search or intermediary access.
No sync-authored module movement or extra same-directory dependency is planned; final dead-code/cycle checks remain required.
The Tidy First assessor recommended no preparatory commits and rejected replaying upstream implementation, a legacy bridge, coordinator extraction, and broad test/harness reorganization.
Mechanical fixture adaptation must land atomically with removed types rather than as a later repair step.

## Module-Level Changes

The complete incoming name/status list below is the file-by-file inherited change surface; adopt non-intersecting target changes without rewriting them.
The following tables specify fork-owned adaptation and deep-review touch points, including automatically merged files.
All core-relative paths below are under `packages/pi-subagents/`.

| File(s)                                                                                                                                                               | Adaptation/review                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                                                                                                                                        | Keep `@jopqior/pi-subagents`, published 5.0.0 manifest version, fork metadata, existing exports/files and Pi 1.0 peers; incorporate only relevant incoming metadata |
| `CHANGELOG.md`                                                                                                                                                        | Resolve to exact pre-merge fork bytes; upstream release evidence belongs in correspondence, not a hand-spliced historical CHANGELOG                                 |
| `README.md`, `docs/configuration.md`, `docs/architecture/architecture.md`                                                                                             | Integrate new budgets/viewer/settings and current module/event descriptions; retain fork selector, scope, lineage, issue/release and provider guidance              |
| `docs/decisions/0005-subagent-record-admission-policy.md`                                                                                                             | Adopt budget replacement under by-value producer-only policy; retain fork pending-selection exclusions                                                              |
| `src/lifecycle/subagent.ts`                                                                                                                                           | Retain preparation/selection/observer ownership; adopt initial/resume callback, new result and outcome guards                                                       |
| `src/lifecycle/subagent-session.ts`, `subagent-state.ts`, `turn-limits.ts`, `child-lifecycle.ts`                                                                      | Adopt tracker, fresh resume budget, owned state and completion payload; remove old flags/counter/status together                                                    |
| `src/service/service.ts`, `service-adapter.ts`                                                                                                                        | Retain selector types/registration and shared service identity; adopt exported budget types, removed fields and copied snapshots                                    |
| `src/tools/foreground-runner.ts`, `helpers.ts`                                                                                                                        | Resolve explicit conflicts while retaining coordinated presentation and live-record hooks; replace counter metrics/caveat inputs                                    |
| `src/tools/spawn-config.ts`, `agent-tool.ts`, `get-result-tool.ts`                                                                                                    | Preserve selector boundary/resume and shared producer; compose minimum advisory and target outcome vocabulary                                                       |
| `src/tools/get-result-report.ts`, `get-result-renderer.ts`, `result-renderer.ts`                                                                                      | Adopt budget/status rendering with no alternate legacy output                                                                                                       |
| `src/observation/notification.ts`, `outcome-delivery.ts`, `renderer.ts`, `record-observer.ts`, `subagent-events-observer.ts`                                          | Adopt payload/metric/caveat changes without losing fork model facts, listener cleanup or delivery claims                                                            |
| `src/ui/agent-widget.ts`, `widget-renderer.ts`, `display.ts`                                                                                                          | Combine budget and mode-adaptive timer with pending activity/model masking                                                                                          |
| `src/settings.ts`, `runtime.ts`, `index.ts`, `src/ui/subagents-settings.ts`                                                                                           | Adopt setting retirement/new reserve, persistence and entry wiring while retaining factory-time selector scope and teardown                                         |
| New `src/persisted-record.ts`; `src/ui/session-navigation.ts`, `session-navigator.ts`                                                                                 | Adopt allowlist reader/writer, transcript navigation and fullscreen viewer without executable restoration                                                           |
| `test/helpers/make-subagent.ts`, `make-subagent.test.ts`, `mock-session.ts`; incoming `turn-loop-result.ts`/`.test.ts`                                                | Preserve selector-specific options; migrate state counters and both loop stubs; retain execution `maxTurns`                                                         |
| `test/lifecycle/subagent.test.ts`, `subagent-manager.test.ts`, `subagent-session.test.ts`, `subagent-state.test.ts`, `child-lifecycle.test.ts`, `turn-limits.test.ts` | Merge old assertion/fixture updates with type removal; retain fork real-owner cancellation and manager cases; extend live-budget/workspace pins                     |
| `test/tools/spawn-selection-boundary.test.ts`                                                                                                                         | Replace local flags-based `TaskResult`/`taskDone` with the new loop-result fixture without dropping held-phase boundaries                                           |
| `test/tools/observed-selection.test.ts`                                                                                                                               | Replace string resume gate with `TurnLoopResult`, add TUI `mode`, and retain no-reselection/live-pair assertions                                                    |
| `test/tools/foreground-runner.test.ts`, `helpers.test.ts`, `spawn-config.test.ts`, `agent-tool.test.ts`, `get-result-tool.test.ts`                                    | Reconcile fork assertions, budget projection, minimum advisory and incoming conflicts in the same merge                                                             |
| `test/service/service-adapter.test.ts`, `test/ui/agent-widget.test.ts`, `test/widget-renderer.test.ts`                                                                | Keep projection allowlist/by-value and pending-rendering assertions alongside incoming budget/mode fixtures                                                         |
| `scripts/verify-public-types.sh`                                                                                                                                      | Extend existing packed consumer to cover budget/selection exports and removed fields/status while preserving workspace/settings probes                              |

Other incoming tests/docs in the inventory migrate with their target sources in step 1, not in a delayed fixture-only checkpoint.
The removed-symbol sweep covered core `src/`/`test/`, the whole core docs tree, package skills, and both companions' source/tests.
Classify `maxTurns` references: spawn options/configuration still use it, only old record/progress fields disappear.
Similarly, retained `subagents:steered` event references are not stale terminal-state references.
Keep historical plans/retros unchanged; refresh current prose/module trees/state diagrams and changed protocol examples, not their historical explanations.
The selector maintenance docs contain valid invocation `maxTurns` examples, not old snapshot counters; no update is predicted there.

| Repository/companion file(s)                                                                                               | Adaptation/review                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.pi/prompts/plan-issue.md`                                                                                                | Resolve fork filename/scope constraints while adopting upstream edge-case/import checks and reuse of an existing retro                                       |
| `.pi/prompts/pr-review.md`                                                                                                 | Retain incoming push/commit-header guidance, but require verified fork repository and explicit remote/branch rather than inheriting a bare `git push` recipe |
| `.pi/prompts/ship.md`, `sync-worktree.md`, `tdd-plan.md`                                                                   | Incorporate incoming refinements while preserving fork issue namespace, sync-guide precedence and separately approved publication                            |
| `.pi/skills/code-design/SKILL.md`, `testing/SKILL.md`, `markdown-conventions/SKILL.md`, `package-pi-subagents/SKILL.md`    | Preserve fork-specific identity/contracts and adopt target conventions; do not copy old budget claims into refreshed package context                         |
| `.rumdl.toml`, `pnpm-lock.yaml`                                                                                            | Adopt target MD018 magiclink fix and reconcile lockfile against retained fork manifests without weakening existing pins/registry dependencies                |
| Other incoming package skills, original-package sources/tests/manifests/CHANGELOGs                                         | Adopt the inventory's target changes; only deepen review if an actual fork dependency or adaptation requires it                                              |
| `scripts/release/pi-subagents/sync-state.json`, `docs/upstream/pi-subagents-release-correspondence.md`                     | Recorder-owned core merge evidence and regenerated view                                                                                                      |
| `scripts/release/pi-subagents-worktrees/sync-state.json`, `docs/upstream/pi-subagents-worktrees-release-correspondence.md` | Separately reviewed worktrees evidence and view, even with unchanged package sources                                                                         |

The removed Issue-prefix convention was introduced by `f274ea8003e23c3ad37516422d052f7c815da638` for a believed heading hazard.
Upstream `732706052b4bdf0eb96128de4069cb516e9752f9`'s actual retro distinguishes CommonMark from `rumdl fmt`'s damaging MD018 fix and pairs removal with `[MD018] magiclink = true`.
Adopt that matched config/skill change; do not revive the rule to address unrelated historical converted headings.

Predicted unchanged: selector package source/manifest/README and its compatibility verifier; it consumes selection registration, not removed counters.
Predicted unchanged: worktrees source/manifest/README/CHANGELOG and compatibility verifier; retain required core peer `>=1.0.0` and registry development range `^5.0.0`, core-first loading, `subagents-worktrees.json`, `worktreeAgents`, rescue and recovery.
Predicted unchanged: core `test/runtime.test.ts` and `test/helpers/make-deps.ts`/`.test.ts`; inspected fixtures contain no retired `graceTurns` values, unlike the initial exploration assumption.
Keep `test/lifecycle/initial-spawn-selection.test.ts`, `nested-selection.test.ts`, `construction-inheritance.test.ts` and `create-subagent-session.test.ts` as invariant coverage; only adapt a fixture in step 1 if the final types actually require it.
The guide/policy, release algorithms, `AGENTS.md`, and protected tags are not edit targets.
A new contract mismatch or materially new compatibility decision returns to the operator before affected edits.

## Test Impact Analysis

This is integration, not a new extraction seam.
The target already provides tracker/session/parser/widget tests; retain them rather than duplicate their implementation or claim they are a live-provider reproduction.
Fork additions pin the interaction between independently tested budget and selector/workspace owners.
No existing real-boundary test becomes redundant with a lower-level tracker test.
Use targeted nested concern groups, controlled promises and real state owners; migrate individual fixtures in large files without whole-file rewrites.
Budget-reporting stubs must invoke `onTurnBudget`; returning a budget alone does not test the callback wiring.

Opened test surfaces and limits:

- Selection boundary and observed-selection: real tool, manager, runtime/record and selection coordination; controlled provider/workspace/factory/session gates, not a live child.
- Initial/nested selection: real owners and service/runtime/manager; fake catalogue/provider or child factory.
- Construction inheritance: real SDK loader and core extension construction, local observer/chooser fixtures and injected session IO; no provider network.
- Subagent lifecycle: real record/state/selection and workspace bracket; stub sessions/factories/provider outcomes.
- Service adapter: real projection/adapter with passive records or session doubles; not installed package resolution.
- Target tracker/parser: pure policy/reader/writer; target session tests drive synthetic SDK events through the real wrapper.
- Foreground/widget/spawn-config: real runner/producer/renderer with controlled manager/timer/theme/TUI/catalogue doubles.
- Existing worktrees packed-verifier unit tests: synthetic verifier result fixtures; their green result alone does not establish actual loader/provider acceptance.

Planning baseline on the source HEAD, before any integration:

```bash
pnpm --filter @jopqior/pi-subagents exec vitest run test/tools/spawn-selection-boundary.test.ts test/tools/observed-selection.test.ts test/lifecycle/initial-spawn-selection.test.ts test/lifecycle/nested-selection.test.ts test/lifecycle/construction-inheritance.test.ts test/service/service-adapter.test.ts
```

Measured result: 6 files and 92 tests passed.
No target runtime, completed merge, packed candidate, killing mutation, or full integration gate was executed during planning.
The source preview and baseline do not prove future adaptation correctness.

Required completed-integration commands use existing real scripts:

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run lint
pnpm run test
pnpm fallow dead-code
pnpm --filter @jopqior/pi-subagents run verify:public-types
pnpm --filter @jopqior/pi-subagents-model-selector run verify:core-compatibility
pnpm --filter @jopqior/pi-subagents-worktrees run verify:core-compatibility
node scripts/release/correspondence-table.mjs --check
node scripts/release/correspondence-table.mjs --check --package pi-subagents-worktrees
git diff --check
```

Packed checks are applicable because the public budget types, lifecycle/workspace outcomes and host-facing widget/loading surfaces change.
Keep historical selector core rows and the actual locally packed candidate with explicit Pi 1.0 pins; keep worktrees' positive/negative load order and real provider/rescue cases.
Run them during implementation, not by replacing them with a new ad-hoc universal harness.
Use explicit npmjs.org registry arguments wherever registry inspection is needed; no publish operation is part of these checks.
Additional human/live/temporary verification requires a concrete unanswered adaptation question, its evidence limit, the smallest proposed check, and operator agreement.

## Invariants at risk

| Constituency/invariant                                                                                     | Pin                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Parent agent: tool acknowledgement waits for confirmation but not workspace/factory/task/budget            | Retained held-phase cases in `spawn-selection-boundary.test.ts`; step 1 budget/acknowledgement intersection |
| Operator: cancel/revoke/admission errors never create a child or apply a late choice                       | `initial-spawn-selection.test.ts`, boundary tests and real-owner cases in `subagent.test.ts`                |
| Nested sessions: spawning catalogue and factory-time inherited lease stay authoritative                    | `nested-selection.test.ts`, `construction-inheritance.test.ts`, `create-subagent-session.test.ts`           |
| Service consumers: spawn returns an ID synchronously and passive snapshots expose no selection machinery   | `service-adapter.test.ts`, nested-selection tests; step 3 packed compile probes                             |
| Parent/UI: pending model is hidden, confirmed/live model is honest, resume neither reselects nor recreates | `observed-selection.test.ts`, foreground/helpers/widget cases; step 1 callback and pending-budget cases     |
| Public readers: budgets/usage are by value; removed fields/status are absent                               | Incoming adapter tests retained in step 1; packaged positive/negative probes in step 3                      |
| Worktree users: approved question/budget retention rules, once-only teardown and rescue addendum           | Step 2 lifecycle matrix plus existing real-Git worktrees suite and packed provider checks                   |
| Runtime users: stopped outcome wins over later natural completion and budget exhaustion                    | Retained state/lifecycle tests, including migrated completion results, in step 1                            |
| Navigating users: reload supplies transcript snapshots, not executable/selector restoration                | Incoming persisted-record/navigation tests and automatic runtime/entry-wiring review in step 1              |
| Fork maintainer: genuine target second parent, identities/history/tags, independent committed evidence     | Actual topology/remerge/byte checks in steps 1/4; recorder and existing root synchronization/release tests  |

The old counter-starts-at-one, terminal-`steered`, unlimited-resume and grace semantics are deliberately superseded, not invariants to preserve.
No new quantitative performance, token-budget or latency guarantee is claimed.

## TDD Order

1. **Integrate the pinned target and all breaking-type adaptations atomically.**
   Preconditions: re-read the synchronization guide before startup pull/fetch; verify primary checkout `main`, clean tracked state, no unmerged entries and no pending operation.
   Capture the actual pre-merge OID, common base, local tag name/object mapping and exact fork CHANGELOG bytes; stop on failed prerequisites or startup pull.
   Begin only with `./scripts/upstream-sync.sh --merge --expected-upstream 8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`, never a package-scoped merge or automatic refresh.
   This planned merge's expected conflicts are resolved inside the same uninterrupted step; never hand off a pending merge as a completed checkpoint.
   Red: extend `spawn-selection-boundary.test.ts`, `observed-selection.test.ts`, foreground/helpers/widget tests and `spawn-config.test.ts` for budget absence while selection/workspace/factory holds, confirmation before first budget, live initial/resume callback projection, no resume selection, pending model hiding and minimum-limit advisory.
   Use complete new loop-result fixtures; distinguish type breakage from behavioral reds and mutation-prove characterization assertions that already pass.
   Green: combine incoming sources/tests with all fork adaptations in Module-Level Changes, including every removed-field/result/status consumer and fork-only fixture before committing.
   Preserve selection types/registration, observer ordering, `onStarted`, shared `detailFor`, no-provider fast path and worktrees metadata; adopt persistence/settings/widget changes without extra mechanisms.
   Resolve the 10 preview conflicts and inspect automatically merged semantic intersections; retain exact core/worktrees CHANGELOG history.
   Verify the full core suite and root `pnpm run check`/`lint`/`test` plus dead-code after shared fixture/type migration; first perform a frozen-lockfile install, and stop on any failed gate rather than widening repair scope.
   Run root typecheck again immediately after the interface-changing merge commit.
   Killing mutations by class: substitute a configuration-derived `{ used: 1, phase: "within" }` budget in foreground pending progress (kills pending-budget cases); delete the initial `onTurnBudget` callback supplied by `Subagent` (kills live initial projection); delete the resume callback (kills resumed projection); replace background selection waiting with whole-run waiting (kills confirmation-with-held-workspace/factory cases); restore direct record-model overwrite in `buildDetails` (kills pending model hiding); skip the below-minimum advisory branch (kills notice while effective limit remains normalized).
   Restore exact saved green bytes after each mutation; do not use `git checkout HEAD --` against an uncommitted merge.
   Preserve all upstream commit authors through the genuine merge.
   Suggested merge subject: `feat(pi-subagents)!: adopt pinned upstream turn budgets (#38)`.
   Record a `BREAKING CHANGE:` footer covering hard ceiling/fresh resume, `graceTurns` retirement, minimum finite limit, removed counters/status/result flags, and the separately approved workspace distinction; do not label steering itself removed.
   Accepted budget mechanism authorship is verified from the incoming source commits; use final-paragraph `Co-authored-by: Chris Lasher <chris.lasher@gmail.com>` for the fork adaptation commit, separated from `Refs #38` and verified with `git interpret-trailers --parse`.
   Verify exactly two parents with the pinned second parent, then inspect `git show --remerge-diff <actual-merge>` and record the actual OID, not the preview tree.

2. **Pin budget-dependent workspace lifetime at the core boundary.**
   Red/characterization: add a nested initial/resume outcome group in `test/lifecycle/subagent.test.ts` using the existing real record/workspace bracket and loop-result/provider doubles.
   Cover every row of the Design Overview matrix, including warned initial question disposal, warned resumed question retention, exhausted initial/resumed question disposal, ordinary question hold, no-question disposal, once-only teardown and the existing result addendum.
   Retain terminal-stop and existing failure/rescue cases rather than equating `aborted` with explicit cancellation.
   Green: the approved target guards should already satisfy these pins; repair only an integration-caused deviation, and stop for operator direction if the result contradicts the target or approved contract.
   Verify focused lifecycle tests, the full core suite/typecheck and the existing worktrees suite; do not claim these doubles test Git rescue byte preservation.
   Killing mutations: delete `!wrappedUpAtTurnLimit(...)` from initial `holdForResume` (kills warned-initial-question disposal); add that exclusion to resumed question retention (kills warned-resume hold); remove the `!exhausted` condition in resumed retention (kills exhausted-resume disposal); make exhausted completion select `completed` (kills exhausted status/outcome rows); remove workspace disposal from the no-question path (kills no-question teardown/addendum rows).
   Commit: `test(pi-subagents): pin budget-driven workspace lifetime (#38)`.

3. **Pin the packaged public budget and retained companion surface.**
   Red/characterization: extend the existing consumer generated by `scripts/verify-public-types.sh` with imports/use of `TurnBudget`, `TurnBudgetPhase`, `SubagentRecord`, and the fork's selection/provider types.
   Include `@ts-expect-error` probes for `record.turnCount`, `record.maxTurns` and terminal `"steered"`; keep positive spawn `maxTurns` and explicit `SUBAGENT_EVENTS.STEERED` use so the test distinguishes removed record/status fields from retained operations.
   Keep workspace collaborator and settings-subpath probes, declaration self-containment and actual packed installation.
   Green: the merged public surface should already compile; strengthen the script's checks without adding aliases or speculative companion APIs.
   Verify `verify:public-types`, both existing packed compatibility matrices, and package/root typechecks; retain historical rows and actual candidate resolution, not workspace-only imports.
   Killing mutations: stop re-exporting `TurnBudget` (kills positive budget import); stop re-exporting `SpawnSelectionProvider` (kills retained fork import); reintroduce `turnCount` or `maxTurns` on public snapshots (each makes its negative probe's directive unused); reintroduce terminal `steered` (kills its negative probe while steering-event use stays valid).
   Commit: `test(pi-subagents): verify packed budget and selection contracts (#38)`.

4. **Record independent fork evidence and complete ordinary review.**
   No new runtime red/green cycle or preparatory refactor.
   Review the actual merge resolutions and every post-merge contribution; classify core and worktrees separately under the fork release policy.
   Expected merge resolution levels are `none` if actual edits only preserve fork contracts while adapting target behavior; that prediction is not permission to pre-author evidence or reuse one package's rationale.
   Record through `./scripts/upstream-sync.sh --record-fork-sync <actual-merge> --fork-level <reviewed-level> --rationale "<actual core resolution review>"` and the separate worktrees invocation with `--package pi-subagents-worktrees`.
   Require both stable release anchors, empty package-scope upstream tails and unchanged tag mappings; on recorder failure inspect any writes and stop, without moving the target, fabricating rows or weakening the policy.
   Check both generated views and offline predictions with `./scripts/release/next-version.sh pi-subagents` and `./scripts/release/next-version.sh pi-subagents-worktrees`; these do not release anything.
   Commit machine-owned state/views with `docs: record reviewed upstream sync evidence (#38)`.
   Run the required completed-integration commands and protected-history/topology checks against the final tree, recording actual outputs rather than copying the planning baseline.
   Dispatch the ordinary fresh-context pre-completion reviewer with the plan, issue, guide, exact target/common base, actual merge/remerge diff, complete incoming inventory and named intersections.
   Explicitly override default tag/plan-parent ranges: review from the actual merge's first parent through HEAD, including all follow-ups and committed evidence.
   Require the report to state its actual range, inventory-versus-depth scope, results and finding disposition; keep generic deterministic checks without an additional comprehensive upstream audit.
   Correct in-scope findings normally; return materially new choices or named extra-verification gaps to the operator before affected edits/checks.
   Commit implementation-stage notes containing actual target/merge/evidence OIDs, contributions, checks and review result with `docs(retro): add implementation stage notes for issue #38`.
   Handoff to `/ship 38` from the root checkout; shipping uses the same merge-first-parent `RANGE_BASE`, verifies evidence/topology, closes only explicit fork targets, and does not dispatch publication without separate approval.
   Restart Pi before shipping uses changed GitHub tools or prompts, because this session's registered implementations remain stale after source integration.

## Risks and Mitigations

- **Automatic merge appears safe but changes selector timing/presentation:** deep-review semantic intersections and keep real held-phase tests; conflict count is not a safety claim.
- **Fixture signatures produce hollow reds or broken intermediate commits:** migrate all consumers atomically with removal, run full-suite/typechecks, and mutation-prove behavioral pins.
- **A budget is fabricated before child execution:** only real loop callbacks populate it; never use configured limit or old initial-count fallback as observed progress.
- **Terminal-state removal accidentally removes steering:** classify status versus operation/event separately and keep positive packed event/spawn probes.
- **Worktrees is omitted because its paths do not change:** pin core disposal timing separately from the companion's real-Git and packed-provider checks.
- **Public consumer passes with workspace privileges:** use the existing installed tarball probe and retained historical/candidate loader matrices.
- **Merge history or release classification is inferred from a broad `feat!` message:** verify topology and record each fork's actual contribution under the policy; target release delta remains distinct.
- **Incoming workflow defaults weaken fork boundaries:** inspect shared prompts/skills even without conflicts, retain explicit fork numbering/repository/remote/publication constraints, and apply on-disk instructions after edits.
- **Verification grows into upstream repair or optional-check waiver:** use guide-owned provenance/disposition; required failures stop, passing unrelated inherited defects and unneeded live checks do not become ship gates.
- **A new tip or stale session contaminates execution:** keep the fixed target, resolve actual first-parent inputs, and restart before calling changed in-process tools.

## Open Questions

No compatibility decision blocks implementation after the operator's target-contract and workspace-outcome selections.
Actual merge/evidence OIDs and reviewed per-fork contribution levels are execution results, not unresolved design choices or guessed numbers.
If required checks expose a new adaptation question, stop and obtain operator direction under the guide.
No concrete new follow-up issue is required; [#26] already owns the deferred selector feature.

## Complete incoming name/status inventory

This is the measured common-base-to-target output, not the eventual merge-first-parent changed-file list.
`A`, `M` and `D` mean added, modified and deleted; historical artifacts remain inventoried rather than assigned independent deep review.

```text
M .pi/prompts/plan-issue.md
M .pi/prompts/pr-review.md
M .pi/prompts/ship.md
M .pi/prompts/sync-worktree.md
M .pi/prompts/tdd-plan.md
M .pi/skills/code-design/SKILL.md
M .pi/skills/markdown-conventions/SKILL.md
M .pi/skills/package-pi-colgrep/SKILL.md
M .pi/skills/package-pi-github-tools/SKILL.md
M .pi/skills/package-pi-permission-system/SKILL.md
M .pi/skills/package-pi-subagents/SKILL.md
M .pi/skills/testing/SKILL.md
M .rumdl.toml
A docs/plans/1003-require-pi-1-0-for-tool-error-flag.md
A docs/retro/1003-require-pi-1-0-for-tool-error-flag.md
M packages/pi-colgrep/CHANGELOG.md
M packages/pi-colgrep/package.json
M packages/pi-colgrep/src/tools/colgrep.ts
M packages/pi-colgrep/test/tools/colgrep.test.ts
M packages/pi-github-tools/CHANGELOG.md
M packages/pi-github-tools/README.md
A packages/pi-github-tools/docs/retro/0948-issue-close-unresolvable-sha-guard.md
M packages/pi-github-tools/package.json
M packages/pi-github-tools/src/lib/issue.ts
M packages/pi-github-tools/src/tools/issue-close.ts
M packages/pi-github-tools/test/lib/issue.test.ts
A packages/pi-github-tools/test/tools/issue-close.test.ts
M packages/pi-permission-system/CHANGELOG.md
M packages/pi-permission-system/docs/architecture/architecture.md
M packages/pi-permission-system/docs/configuration.md
M packages/pi-permission-system/docs/cross-extension-api.md
M packages/pi-permission-system/docs/decisions/0009-bash-path-projection-completeness-contract.md
M packages/pi-permission-system/docs/decisions/0013-permission-policy-model.md
A packages/pi-permission-system/docs/plans/0910-bash-argument-spellings.md
A packages/pi-permission-system/docs/plans/0953-policy-issue-mid-session-warning.md
A packages/pi-permission-system/docs/plans/0963-execution-modifiers-inherit-the-verdict.md
A packages/pi-permission-system/docs/plans/0981-bash-command-spellings.md
A packages/pi-permission-system/docs/plans/1029-forwarded-ask-keeps-its-floor.md
A packages/pi-permission-system/docs/plans/1030-forwarded-ask-carries-every-unit.md
A packages/pi-permission-system/docs/retro/0910-absolute-path-bash-rule-relative-spelling.md
A packages/pi-permission-system/docs/retro/0910-bash-argument-spellings.md
A packages/pi-permission-system/docs/retro/0953-policy-issue-mid-session-warning.md
A packages/pi-permission-system/docs/retro/0963-execution-modifiers-inherit-the-verdict.md
A packages/pi-permission-system/docs/retro/0981-bash-command-spellings.md
A packages/pi-permission-system/docs/retro/1029-forwarded-ask-keeps-its-floor.md
A packages/pi-permission-system/docs/retro/1030-forwarded-ask-carries-every-unit.md
M packages/pi-permission-system/docs/subagent-integration.md
M packages/pi-permission-system/package.json
M packages/pi-permission-system/scripts/measure-wrapper-transparency.mjs
M packages/pi-permission-system/src/access-intent/access-intent.ts
M packages/pi-permission-system/src/access-intent/bash/bash-path-resolver.ts
M packages/pi-permission-system/src/access-intent/bash/command-enumeration.ts
M packages/pi-permission-system/src/access-intent/bash/node-text.ts
M packages/pi-permission-system/src/access-intent/bash/program.ts
M packages/pi-permission-system/src/access-intent/bash/shell-variable-expansion.ts
D packages/pi-permission-system/src/access-intent/bash/sync-commands.ts
M packages/pi-permission-system/src/access-intent/bash/token-collection.ts
M packages/pi-permission-system/src/access-intent/bash/wrapper-analysis.ts
M packages/pi-permission-system/src/access-intent/input-normalizer.ts
M packages/pi-permission-system/src/authority/forwarded-request-server.ts
M packages/pi-permission-system/src/authority/forwarding-io.ts
M packages/pi-permission-system/src/authority/permission-forwarding.ts
M packages/pi-permission-system/src/config/config-store.ts
A packages/pi-permission-system/src/config/policy-issue-reporter.ts
M packages/pi-permission-system/src/config/policy-loader.ts
M packages/pi-permission-system/src/handlers/before-agent-start.ts
M packages/pi-permission-system/src/handlers/gates/bash-command.ts
M packages/pi-permission-system/src/handlers/gates/tool.ts
M packages/pi-permission-system/src/handlers/lifecycle.ts
M packages/pi-permission-system/src/index.ts
M packages/pi-permission-system/src/logging/command-redaction.ts
M packages/pi-permission-system/src/path/expand-home.ts
M packages/pi-permission-system/src/policy/permission-manager.ts
M packages/pi-permission-system/src/policy/permission-resolver.ts
A packages/pi-permission-system/src/policy/serving-policy.ts
M packages/pi-permission-system/src/policy/wildcard-matcher.ts
M packages/pi-permission-system/src/presentation/dialog-renderer.ts
M packages/pi-permission-system/src/presentation/forwarded-ask-payload.ts
M packages/pi-permission-system/src/presentation/path-ask-payload.ts
M packages/pi-permission-system/src/presentation/prompt-payload.ts
M packages/pi-permission-system/src/presentation/review-log-renderer.ts
M packages/pi-permission-system/src/presentation/skill-ask-payload.ts
M packages/pi-permission-system/src/presentation/tool-ask-payload.ts
M packages/pi-permission-system/src/service/bash-advisory-check.ts
M packages/pi-permission-system/src/service/permissions-service.ts
M packages/pi-permission-system/src/types.ts
A packages/pi-permission-system/test/access-intent/bash/bash-path-resolver.test.ts
M packages/pi-permission-system/test/access-intent/bash/program-external-accesses.test.ts
A packages/pi-permission-system/test/access-intent/bash/program-parse-sync.test.ts
M packages/pi-permission-system/test/access-intent/bash/program.test.ts
M packages/pi-permission-system/test/access-intent/bash/shell-variable-expansion.test.ts
D packages/pi-permission-system/test/access-intent/bash/sync-commands.test.ts
M packages/pi-permission-system/test/access-intent/bash/token-collection.test.ts
M packages/pi-permission-system/test/access-intent/bash/wrapper-analysis.test.ts
M packages/pi-permission-system/test/access-intent/input-normalizer.test.ts
M packages/pi-permission-system/test/authority/approval-escalator.test.ts
M packages/pi-permission-system/test/authority/forwarded-request-server.test.ts
M packages/pi-permission-system/test/authority/forwarding-io.test.ts
M packages/pi-permission-system/test/composition-root.test.ts
A packages/pi-permission-system/test/config/policy-issue-reporter.test.ts
M packages/pi-permission-system/test/config/policy-loader.test.ts
M packages/pi-permission-system/test/handlers/before-agent-start.test.ts
M packages/pi-permission-system/test/handlers/gates/bash-command-metamorphic.test.ts
M packages/pi-permission-system/test/handlers/gates/bash-command.test.ts
M packages/pi-permission-system/test/handlers/gates/tool-call-gate-pipeline.test.ts
M packages/pi-permission-system/test/handlers/gates/tool.test.ts
M packages/pi-permission-system/test/handlers/lifecycle.test.ts
M packages/pi-permission-system/test/helpers/gate-fixtures.ts
M packages/pi-permission-system/test/helpers/handler-fixtures.ts
M packages/pi-permission-system/test/helpers/manager-harness.ts
M packages/pi-permission-system/test/helpers/prompt-details-fixtures.ts
M packages/pi-permission-system/test/helpers/session-fixtures.ts
M packages/pi-permission-system/test/logging/command-redaction.test.ts
M packages/pi-permission-system/test/policy/permission-manager-fail-closed.test.ts
M packages/pi-permission-system/test/policy/permission-manager-unified.test.ts
M packages/pi-permission-system/test/policy/permission-resolver.test.ts
A packages/pi-permission-system/test/policy/serving-policy.test.ts
M packages/pi-permission-system/test/presentation/dialog-renderer.test.ts
M packages/pi-permission-system/test/presentation/path-ask-payload.test.ts
M packages/pi-permission-system/test/presentation/prompt-notification.test.ts
M packages/pi-permission-system/test/presentation/review-log-renderer.test.ts
M packages/pi-permission-system/test/presentation/skill-ask-payload.test.ts
M packages/pi-permission-system/test/presentation/tool-ask-payload.test.ts
M packages/pi-permission-system/test/service/bash-advisory-check.test.ts
M packages/pi-permission-system/test/service/permission-ui-prompt.test.ts
M packages/pi-permission-system/test/service/permissions-service.test.ts
M packages/pi-subagents/CHANGELOG.md
M packages/pi-subagents/README.md
M packages/pi-subagents/docs/architecture/architecture.md
M packages/pi-subagents/docs/architecture/client-server-opportunities.md
M packages/pi-subagents/docs/comparison-with-upstream.md
M packages/pi-subagents/docs/configuration.md
M packages/pi-subagents/docs/decisions/0005-subagent-record-admission-policy.md
M packages/pi-subagents/docs/decisions/0007-transcript-viewer-is-not-an-overlay.md
A packages/pi-subagents/docs/decisions/0012-fullscreen-viewer-is-an-overlay.md
A packages/pi-subagents/docs/plans/1021-turn-budget-outcome-vocabulary.md
A packages/pi-subagents/docs/plans/1022-turn-budget-ceiling.md
A packages/pi-subagents/docs/plans/1032-fullscreen-viewer-paging.md
A packages/pi-subagents/docs/plans/1034-sessions-survive-reload.md
A packages/pi-subagents/docs/plans/1035-mode-adaptive-widget-cadence.md
A packages/pi-subagents/docs/retro/1021-turn-budget-outcome-vocabulary.md
A packages/pi-subagents/docs/retro/1022-turn-budget-ceiling.md
A packages/pi-subagents/docs/retro/1032-fullscreen-viewer-paging.md
A packages/pi-subagents/docs/retro/1034-sessions-survive-reload.md
A packages/pi-subagents/docs/retro/1035-measure-widget-render-cost-spinner-cadence.md
A packages/pi-subagents/docs/retro/1035-mode-adaptive-widget-cadence.md
M packages/pi-subagents/package.json
M packages/pi-subagents/src/index.ts
M packages/pi-subagents/src/lifecycle/child-lifecycle.ts
M packages/pi-subagents/src/lifecycle/subagent-session.ts
M packages/pi-subagents/src/lifecycle/subagent-state.ts
M packages/pi-subagents/src/lifecycle/subagent.ts
M packages/pi-subagents/src/lifecycle/turn-limits.ts
M packages/pi-subagents/src/observation/notification.ts
M packages/pi-subagents/src/observation/outcome-delivery.ts
M packages/pi-subagents/src/observation/record-observer.ts
M packages/pi-subagents/src/observation/renderer.ts
M packages/pi-subagents/src/observation/subagent-events-observer.ts
A packages/pi-subagents/src/persisted-record.ts
M packages/pi-subagents/src/runtime.ts
M packages/pi-subagents/src/service/service-adapter.ts
M packages/pi-subagents/src/service/service.ts
M packages/pi-subagents/src/settings.ts
M packages/pi-subagents/src/tools/agent-tool.ts
M packages/pi-subagents/src/tools/foreground-runner.ts
M packages/pi-subagents/src/tools/get-result-renderer.ts
M packages/pi-subagents/src/tools/get-result-report.ts
M packages/pi-subagents/src/tools/get-result-tool.ts
M packages/pi-subagents/src/tools/helpers.ts
M packages/pi-subagents/src/tools/result-renderer.ts
M packages/pi-subagents/src/tools/spawn-config.ts
M packages/pi-subagents/src/ui/agent-widget.ts
M packages/pi-subagents/src/ui/display.ts
M packages/pi-subagents/src/ui/session-navigation.ts
M packages/pi-subagents/src/ui/session-navigator.ts
M packages/pi-subagents/src/ui/subagents-settings.ts
M packages/pi-subagents/src/ui/widget-renderer.ts
M packages/pi-subagents/test/config/custom-agents.test.ts
M packages/pi-subagents/test/helpers/make-subagent.test.ts
M packages/pi-subagents/test/helpers/make-subagent.ts
M packages/pi-subagents/test/helpers/manager-stubs.test.ts
M packages/pi-subagents/test/helpers/mock-session.ts
M packages/pi-subagents/test/helpers/transcript-fixtures.ts
A packages/pi-subagents/test/helpers/turn-loop-result.test.ts
A packages/pi-subagents/test/helpers/turn-loop-result.ts
M packages/pi-subagents/test/lifecycle/child-lifecycle.test.ts
M packages/pi-subagents/test/lifecycle/subagent-manager.test.ts
M packages/pi-subagents/test/lifecycle/subagent-session.test.ts
M packages/pi-subagents/test/lifecycle/subagent-state.test.ts
M packages/pi-subagents/test/lifecycle/subagent.test.ts
M packages/pi-subagents/test/lifecycle/turn-limits.test.ts
M packages/pi-subagents/test/observation/notification.test.ts
M packages/pi-subagents/test/observation/outcome-delivery.test.ts
M packages/pi-subagents/test/observation/record-observer.test.ts
M packages/pi-subagents/test/observation/renderer.test.ts
M packages/pi-subagents/test/observation/subagent-events-observer.test.ts
A packages/pi-subagents/test/persisted-record.test.ts
M packages/pi-subagents/test/service/service-adapter.test.ts
M packages/pi-subagents/test/settings.test.ts
M packages/pi-subagents/test/tools/agent-tool.test.ts
M packages/pi-subagents/test/tools/foreground-runner.test.ts
M packages/pi-subagents/test/tools/get-result-renderer.test.ts
M packages/pi-subagents/test/tools/get-result-report.test.ts
M packages/pi-subagents/test/tools/get-result-tool.test.ts
M packages/pi-subagents/test/tools/helpers.test.ts
M packages/pi-subagents/test/tools/result-renderer.test.ts
M packages/pi-subagents/test/tools/spawn-config.test.ts
M packages/pi-subagents/test/ui/agent-widget.test.ts
M packages/pi-subagents/test/ui/session-navigation.test.ts
M packages/pi-subagents/test/ui/session-navigator.test.ts
M packages/pi-subagents/test/ui/subagents-settings.test.ts
M packages/pi-subagents/test/ui/widget-viewport.test.ts
M packages/pi-subagents/test/widget-renderer.test.ts
M pnpm-lock.yaml
```

[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#34]: https://github.com/Jopqior/gotgenes-pi-packages/issues/34
[#35]: https://github.com/Jopqior/gotgenes-pi-packages/issues/35
[#37]: https://github.com/Jopqior/gotgenes-pi-packages/issues/37
