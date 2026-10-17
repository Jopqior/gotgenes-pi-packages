---
issue: 44
issue_title: "Sync gotgenes/pi-packages@23c08264aa180222e8953a835337ada28534f1b7"
---

# Integrate the pinned upstream target and preserve fork contracts

## Release Recommendation

**Release:** ship independently

This repository-scoped synchronization is not a package roadmap batch member.
Landing does not authorize release dispatch or publication; package selection, fork destinations and npm scope require separate operator approval.

## Problem Statement

Integrate the exact upstream target named in fork issue [#44](https://github.com/Jopqior/gotgenes-pi-packages/issues/44), retaining the fork's selector, worktrees, identities and maintenance workflow.
Upstream advances must not silently change the target.
The incoming run-lifecycle refactor intersects fork-owned selection and presentation behavior, and an automatic lockfile merge does not by itself establish dependency consistency.

## Goals

- Complete a genuine two-parent integration on the primary checkout's `main`, with the pinned target as its second parent.
- Adopt upstream run-owned mode and common initial/resume lifecycle while preserving human selection authority, cancellation, acknowledgement and live presentation.
- Adopt upstream retention of a workspace when a completed, warned run has a pending question; retain cleanup for exhausted, failed and completed-without-question runs.
- Preserve fork package identities, published CHANGELOG sections, service/settings exports, workspace-provider compatibility and core-first loading.
- Retain upstream's existing breaking classification for current-run `SubagentRecord.isBackground`; do not duplicate it on the merge merely to obtain a major bump.
- Preserve the separately authorized selector Pi-floor upgrade already completed during planning, including its own breaking classification.
- Produce reproducible inventory inputs, required validation, separate source feasibility for each fork and an exact-range independent-review handoff.

## Non-Goals

- Do not implement fork [#26](https://github.com/Jopqior/gotgenes-pi-packages/issues/26), which proposes Tool/Agent/Custom selection configuration.
- Do not redesign selection UI, change core/worktrees dependency ranges, unify all packages' host peers or add a new compatibility harness.
- Do not author additional regression/characterization tests or run killing mutations for this synchronization.
  Adopt the pinned upstream tests and preserve existing fork tests, making only necessary interface, fixture and approved-behavior adaptations.
  A concrete failure or coverage gap requires diagnosis and operator agreement before expanding this test scope.
- Do not audit or repair unrelated inherited permission-system behavior merely because it appears in the incoming inventory.
- Do not import upstream tags, rewrite history, squash, rebase an integration worktree, alter existing npm artifacts or overwrite old GitHub Releases.
- Do not enable the optional permission-prompt timer by default.
- Do not release, publish, close upstream issues or scan incoming upstream issue numbers as fork close targets.
- Do not reopen historical architecture records solely to replace obsolete internal observer names.

## Background

### Scope and evidence

The issue is open, authored by the authenticated operator, labeled `scope:repo`, and has no discussion changing its target.
The fork's open-issue sweep found #26; the open-PR sweep was empty.
The newest local triage is inherited upstream context, not a fork #44 diagnosis.
The fallback retro lookup found `packages/pi-permission-system/docs/retro/0044-auto-allow-dev-null.md`; its title/content identify an unrelated upstream issue, so it is not this fork issue's continuity file.
Create root `f0044-` artifacts instead of appending to that inherited record.

The synchronization constraints and assessment in `.pi/skills/fork-sync/` govern this plan, including startup prerequisites, review scope, finding disposition and shipping exceptions.
The initial template pull reported already up to date before those references were loaded; subsequent inspection verified the primary Git/common-directory identity, `main`, a clean tracked tree and no merge/rebase state.
Record that ordering deviation, not a claim that startup followed the prescribed order.

The measured incoming inventory contains 172 paths at the planning common base.
It comprises `.pi/` maintenance guidance/configuration, `AGENTS.md`, workspace/lock changes, and changes under permission-system, permission-model-judge and subagents.
Worktrees and selector have no incoming package-path changes; their contracts still require intersection review.
No complete incoming listing belongs in this plan.

### Operator-authorized change completed during planning

The operator requested a narrow selector dependency upgrade rather than retaining its old Pi dependency graph.
Commit `aad16ee8b82c824dd3a3375bf8a9f2d472fef533` changes only the selector manifest and lockfile:

- Pi AI/coding-agent/TUI peers: `>=0.84.4` to `>=1.0.0`.
- The corresponding development pins: exact `0.84.4` to exact `1.0.0`.
- Selector registry-core range remains `^1.0.0`, resolving to `1.0.2`; worktrees remains on registry core `^5.0.0`.

This support-floor narrowing carries its own `fix(pi-subagents-model-selector)!:` subject and `BREAKING CHANGE:` footer.
Do not repeat this work during implementation or silently broaden it into a core upgrade.
The integration's actual first-parent range will exclude this pre-merge contribution, so retain it as an explicit issue contribution in the handoff and closing summary.
Use ordinary tag-bounded version prediction to account for it, without replacing the mandated integration review base.

## Design Overview

### Pinned refs and reproducible inventories

Upstream target: gotgenes/pi-packages@23c08264aa180222e8953a835337ada28534f1b7

Planning common base: `1810feed6ab2a83fa74f3b242095e0cc03773570`.
The initial inspected fork HEAD was `31e17eb7c93ca16e0fd9b5a7473bfc6d935a1a97`; the authorized dependency checkpoint is the later commit above.
Neither is the future merge's first parent: resolve that when the merge exists.

Regenerate temporary inputs from the following durable commands, substituting the actual pre-merge fork ref for `FORK`:

```bash
TARGET=23c08264aa180222e8953a835337ada28534f1b7
FORK=$(git rev-parse HEAD)
COMMON=$(git merge-base "$FORK" "$TARGET")
git diff --name-status "$COMMON" "$TARGET" > /tmp/f0044-incoming-paths.txt
git diff --name-only "$COMMON" "$FORK" > /tmp/f0044-fork-paths.txt
LC_ALL=C comm -12 \
  <(git diff --name-only "$COMMON" "$TARGET" | LC_ALL=C sort) \
  <(LC_ALL=C sort /tmp/f0044-fork-paths.txt) \
  > /tmp/f0044-intersections.txt
```

The intersection list is a discovery aid, not the review boundary: selection/worktrees contracts can cross unchanged paths.
A planning-only `git merge-tree --write-tree` preview produced conflicts without changing the index/worktree; it is not a completed integration or a runtime reproduction.
Its output is disposable and must be regenerated after relevant commits.

Generate the actual integration inventory only after a real merge and committed adaptations exist:

```bash
BASE=$(git rev-parse "$MERGE^1")
REVIEWED_HEAD=$(git rev-parse HEAD)
COMMON=$(git merge-base "$BASE" "$TARGET")
git diff --name-status "$COMMON" "$TARGET" > /tmp/f0044-incoming-paths.txt
git diff --name-status "$BASE" "$REVIEWED_HEAD" > /tmp/f0044-integration-paths.txt
```

Resolve `MERGE` from the implementation-recorded integration OID, independently verifying it against `git log --first-parent --merges --format='%H %P'` and the exact pinned second parent.
Never substitute a release tag or a guessed plan-parent range.

### Selected deep-review contracts

| Group                            | Entry points and reason                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Selection/lifecycle              | `src/lifecycle/subagent.ts`, `subagent-manager.ts`, incoming `subagent-run.ts`, selection owners/scopes, child-session construction and service adapter; automatic and conflicted changes can bypass or prematurely settle the chooser.                                  |
| Presentation and result delivery | `src/tools/agent-tool.ts`, `foreground-runner.ts`, incoming `progress-stream.ts`, `spawn-config.ts`, `get-result-tool.ts`, `src/ui/agent-widget.ts` and their tests; selected model/thinking and awaiting-selection state must survive extraction and both resume modes. |
| Worktrees                        | Core `workspace.ts`, `workspace-bracket.ts`, worktrees factory/provider/config/recovery code and relevant tests; run finalization changes affect retention/disposal even without incoming worktrees edits.                                                               |
| Identity/loading/public API      | Core/selector/worktrees manifests, public type verification, service/settings exports, registry and workspace/lock graph; preserve fork identities and published dependencies.                                                                                           |
| Workflow/policy                  | Conflicted `AGENTS.md`, ship/TDD prompts, releasing/upstream-watch/package skills and automatic reviewer/testing edits; retain fork targets, scope and release approvals while accepting applicable incoming lessons.                                                    |
| Immutable history/source         | Fork CHANGELOG, actual merge parents, release registry and source resolver; preserve published bytes and separate per-package ancestry claims.                                                                                                                           |

Account for every incoming and actual-integration path.
Permission-system feature/refactoring files, their tests, generated schema/docs and historical upstream plans/retros receive inventory/provenance review and the required gates, not a fresh line-by-line audit.
Judge manifest/Vitest and root dependency changes receive dependency/installation review.
Expand into surrounding source only when an intersection, required-check failure or specific compatibility uncertainty requires it.
All sync-authored changes and post-merge contributions are deep-review scope regardless of their directory.

### Run ownership and selection adaptation

Adopt upstream `SubagentRun` for each initial/resumed run's mode, abort controller, caller-signal detach and observer subscription.
Its lifecycle owns set/read/release together: create a run at initial start or resume, retain it as the current/last run, release handles on terminal/reset/release paths, and do not fall back to the spawn mode after a completed resume.
Queued agents retain their resolved spawn mode before their first run.

Use upstream `onRunStarted(agent, kind)` and `onRunFinished(agent, kind)` rather than retaining parallel initial/resume observer systems.
Preserve fork construction-time composition in `Subagent`: invoke the original terminal observer first, then call `selection.finished(agent.status, agent.error)` only for `kind === "initial"`.
Queued cancellation and failure before session construction still settle the initial selection outcome exactly once.
Resume must never consult or finalize the initial selection owner again.
Retain permit-liveness checks around asynchronous selection/session construction and child inheritance of the root selection lease.
Verification: existing fork selection/terminal-boundary tests retained through step 2 and rerun in step 4.

Keep `resolveBackgroundMode` at the existing manager choke point.
Explicit requests continue to override configuration; default requests continue to defer to it.
Resume chooses its own mode through the existing `startResume` seam: foreground tool resume is foreground, explicit background tool resume and service resume are background.
`SubagentRecord.isBackground` follows the current/last run, including while running and after settlement.
Tests: step 2, plus retained background-mode/service/widget suites.

Upstream commit `7dafb7c2e44340b7deb3d4fca65e400611da0423` already contains `fix(pi-subagents)!:` and its `BREAKING CHANGE:` footer for that public record change.
The genuine merge preserves that attribution and release signal.
Do not add an extra merge breaking marker for the same change.
The workspace retention change also alters upgrade-time behavior; its upstream commit is an ordinary fix, but the same core integration already carries the upstream major-release signal.
Record both changed behaviors in the implementation handoff without manufacturing another breaking merge marker.
A materially new fork behavior change requires a new operator decision and its own classification.

### Shared progress stream without presentation regression

Adopt the incoming helper, but replace its static `detailBase` input with the existing presentation behavior, not a second model/thinking formatter.
The helper reads current records on every tick and delegates display facts to `detailFor`.
Use a narrow structural input, for example:

```ts
type StreamedRecord = Pick<
  Subagent,
  | "toolUses" | "lifetimeUsage" | "turnBudget"
  | "activeTools" | "responseText" | "awaitingSelection"
  | "selectedPair" | "model" | "thinkingLevel"
>;

interface ProgressStreamParams {
  presentation: Pick<SpawnPresentation, "detailFor">;
  getRecord(): StreamedRecord | undefined;
  onUpdate: ((update: AgentToolResult<AgentDetails>) => void) | undefined;
}
```

The first fields feed counters/activity; `awaitingSelection` also selects activity; the final presentation fields are read by the delegated `detailFor` contract.
Do not pass the whole manager/runtime or expose unused lifecycle operations.
This is an internal helper interface, not a package export.

Both foreground consumers use the same interaction:

```ts
const stop = startProgressStream({
  presentation,
  getRecord: () => recordRef,
  onUpdate,
});
try { await runPromise; } finally { stop(); }
```

The helper's dependency interaction remains value-oriented:

```ts
const record = getRecord();
const base = presentation.detailFor(record);
const activity = describeActivity(record?.activeTools ?? new Map(),
  record?.responseText ?? "", record?.awaitingSelection ?? false);
onUpdate?.({ content, details: { ...base, ...liveCounters, activity } });
```

Capture the initial record through `onRunStarted`, before selection/session creation, not only `onSessionCreated`.
For foreground resume, use the record returned by `startResume`; preserve the same presentation for streaming and final result details.
Retain immediate update, spinner cadence, live counters/budget, and idempotent cleanup on success, failure and refusal.
Before selection resolves, omit provisional model/thinking; afterwards show the selected/live pair, not the original proposal.
Tests: step 2.

The helper and callers remain in the tools zone.
The incoming helper imports helpers/spawn-config and display/glyphs; current helpers/spawn-config do not import the new helper, so these planned same-directory edges have no return path.
Do not introduce a new cross-directory dependency or compatibility wrapper.

The design-review checklist keeps the helper at three cohesive inputs, delegates presentation rather than reaching through a manager/runtime, and introduces no output-argument mutation or scattered reset.
The run owns its handles, the selection owner owns initial acknowledgement, and the existing manager owns mode resolution; no intermediate layer merely relays a new derived fact.
The initial/resume body consolidation is upstream's deliberate alignment of their terminal rules, not extraction across still-different lifecycle semantics.
Existing fake-service factory tests retain their documented boundary instead of gaining deeper mocks.

### Workspace outcomes

Use the upstream common initial/resume terminal rules.
Completed runs with a pending question retain the workspace even with a warned budget, permitting resume; exhausted runs dispose as aborted, errors dispose as errors, and completed runs without questions dispose as completed.
Keep result addenda, late workspace notices, rescue and recovery semantics.
The old initial-only warned-disposal assertion must change in the same merge commit, not be retained alongside contradictory upstream tests.
Verification: the existing upstream initial/resume outcome matrix and retained fork workspace/worktrees tests in steps 2 and 4.

### Identities, dependencies and workflow resolutions

Preserve `@jopqior/pi-subagents`, selector and worktrees metadata and current fork versions; do not replace the core manifest with upstream's package identity/version.
Accept upstream judge development pins to Pi `1.0.0` and permission-system `40.3.0`, without changing its peer floors.
Keep selector's already-approved Pi pins and unchanged registry-core range.
Regenerate the final lock after resolutions and verify a frozen install; accept removal of obsolete `0.84.4` dependency entries only once no importer/snapshot requires them.
Do not retain the earlier plan hypothesis that selector must stay on `0.84.4`: the operator explicitly replaced it.
Retain `linkWorkspacePackages: false` and separately published core dependencies.

Resolve the core CHANGELOG conflict by preserving the fork file and all previously published sections byte-for-byte.
Upstream history remains in Git; do not splice upstream release sections into the fork's published changelog or hand-write a new release section.

Merge workflow conflicts by meaning, not whole-file ours/theirs:

- Keep the fork header, Chinese operator responses, `main`, explicit fork repository targeting, `fNNNN` lookup and synchronization/release approval rules.
- Keep fork release retry state inspection and separate retry approval; absorb applicable upstream registry-propagation guidance without reinstating automatic redispatch advice.
- Retain synchronization-specific review/ship exceptions instead of restoring upstream issue-close or tag-derived review ranges.
- Incorporate incoming same-file tool-ordering guidance, package-local `cd` tripwire documentation, mutation restore ordering and serial long-timeout reviewer gates consistently across repeated workflow passages.
- Merge upstream run-lifecycle/progress documentation and existing upstream roadmap completion notes while retaining fork architecture/selector/worktrees sections.
- Re-read changed skills before following them, and restart Pi before exercising any edited in-process behavior that the current session cannot load anew.

### Source feasibility and evidence provenance

Planning inspection used real Git objects, merge-tree preview, remote stable-tag advertisements and manifests, not a synthetic merge or a fabricated release anchor.
The existing resolver was executed separately for both registered fork entries at the pre-integration HEAD; both succeeded against the previous integration.
That proves current resolver access/history feasibility, not source resolution for the future merge.

The numerically highest stable releases observed as contained in the pinned target were core `24.0.0` at `63633e512cdb058d585ff4fe1e5ac428a011f91d` and worktrees `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
Their manifest names/versions matched their direct upstream identities.
Run the production resolver again on the completed integration for each fork; confirm the pinned incorporated commit and independently validate each returned block.
Tail labels are display facts, not blockers or reasons to change the target.
Both fork packages already have local release tags; no untagged first-release handoff is planned.

The selector upgrade probe used an isolated detached copy of the actual repository, changed only the six manifest values and regenerated its lock, then ran check/tests/frozen install against exact Pi `1.0.0`.
It additionally inspected installed compiled custom-UI/context/catalogue mechanisms, without a live model request.
The main checkout subsequently reproduced the selector check, all 123 tests and frozen install with the same narrow diff.
Lifecycle scripts were skipped during those installations; final integration installation must still pass the ordinary install path.
This is not a historical release-span assessment, a future-major guarantee or proof of full registry-core spawn/schema compatibility.

## Module-Level Changes

### Changed or adopted

- `packages/pi-subagents/src/lifecycle/subagent.ts`: reconcile fork selection with upstream run ownership, observer vocabulary and common outcome finalization.
- `packages/pi-subagents/src/lifecycle/subagent-manager.ts`: retain background precedence/selection, adopt kind-aware notifications and per-resume mode.
- Incoming `packages/pi-subagents/src/lifecycle/subagent-run.ts`: adopt upstream run-handle owner without a second extraction; remove absorbed `src/lifecycle/run-listeners.ts` and its old unit suite, retaining the new run-handle tests.
- `packages/pi-subagents/src/lifecycle/subagent-session.ts`, `turn-limits.ts`, `src/session/session-config.ts` and their incoming tests/helpers: adopt the first-run session/turn-limit ownership and related signal handling without dropping fork child-selection/session-construction parameters.
- `packages/pi-subagents/src/observation/composite-subagent-observer.ts`, `subagent-events-observer.ts` and their tests: adopt kind-aware manager observer dispatch while preserving published event channel names; include incoming manager/mock-session helper and widget-viewport fixture migrations.
- `packages/pi-subagents/src/tools/agent-tool.ts`, `foreground-runner.ts` and incoming `progress-stream.ts`: use common streaming with live fork presentation and cleanup.
- `packages/pi-subagents/src/service/service.ts`: retain fork selection types/registration and adopt current-run `isBackground` documentation.
- Automatically merged `src/service/service-adapter.ts`, `src/lifecycle/create-subagent-session.ts`, `src/ui/agent-widget.ts` and their tests: inspect final source against fork contracts; correct only integration regressions.
- `packages/pi-subagents/test/lifecycle/subagent.test.ts`, `subagent-manager.test.ts`, incoming `subagent-run.test.ts`: retain existing fork/upstream selection, cancellation, mode and outcome cases; update removed-observer fixtures in the same merge without adding cases.
- `packages/pi-subagents/test/tools/foreground-runner.test.ts`, `agent-tool.test.ts`, `get-result-tool.test.ts`, incoming `progress-stream.test.ts`, `test/helpers/make-deps.ts` and its test: retain existing cases and migrate only composition fixtures/assertions required by the adapted interface.
- `packages/pi-subagents/package.json`, `README.md`, `docs/architecture/architecture.md`, `.pi/skills/package-pi-subagents/SKILL.md`: reconcile identities, existing module listings/diagrams, current run ownership and selection guarantees.
- `packages/pi-subagents/CHANGELOG.md`: resolve the merge without changing fork published bytes.
- `AGENTS.md`, `.pi/prompts/ship.md`, `.pi/prompts/tdd-plan.md`, `.pi/skills/releasing/SKILL.md`, `.pi/skills/upstream-watch/SKILL.md`: resolve workflow conflicts with fork policy retained.
- Automatically merged `.pi/agents/pre-completion-reviewer.md`, `.pi/skills/testing/SKILL.md`, incoming `.pi/skills/edit-tool/SKILL.md` and `.pi/extensions/pi-permission-system/config.json`: inspect applicable ordering, serial gates and shell-tripwire changes.
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`, judge manifest/Vitest config: reconcile incoming dependency changes with the already-completed selector upgrade and validate final resolution.
- All remaining incoming permission-system source/tests/schema/docs and upstream internal artifacts: adopt the pinned content subject to inventory accounting and required gates, without unrelated repairs.

The removed observer names `onStarted`, `onResumeStarted` and `onResumeFinished` were searched across core source/tests, package skills and architecture docs.
Active hits include both lifecycle modules, foreground runner, corresponding lifecycle/foreground tests and current architecture; update these together.
The absorbed `RunListeners` symbol and old manager-observer names were also searched across source/tests, package skills and architecture docs; active observation/widget callers belong in the same merge.
Historical phase-17/18/21/22 architecture records and old plans/retros also contain names; preserve them as historical descriptions unless current navigation becomes false.
The new helper's direct tests use exact equality, so migrate their fixtures and expectations with the interface change, not after it.

### Predicted unchanged, but verified

- `packages/pi-subagents/src/lifecycle/initial-spawn-selection.ts`, `spawn-selection.ts`, `selection-scope.ts` and `src/tools/spawn-config.ts`: existing owners/presentation remain usable; caller adaptation should suffice.
- `packages/pi-subagents/src/lifecycle/workspace.ts` and `workspace-bracket.ts`: provider API and disposal owner remain unchanged; selection of when to dispose changes in `Subagent`.
- Core exports/settings entry, source registry and resolver: no new public accessor, registry schema or source mechanism is required.
- Selector source/tests/README: the approved manifest-only Pi upgrade required no source change; existing behavior tests stay.
- Selector manifest: already changed during planning; implementation only preserves it.
- Worktrees package source/manifest/config/recovery docs: no incoming edits and no changed provider contract; behavior/type checks must confirm this prediction.
- `test/tools/selection-query.test.ts`, `observed-selection.test.ts`, `test/config/background-mode.test.ts`, selection-scope/nested-selection and workspace-bracket suites: retain these regressions; update only if an actual fixture incompatibility is demonstrated, without weakening their behavioral assertions.

## Test Impact Analysis

Use the tests already present in the pinned upstream target and the fork; do not add a new test layer or repeat upstream's test-first development during synchronization.
Upstream `test/lifecycle/subagent.test.ts` already covers run mode and the initial/resume terminal matrix, including warned-question retention, exhausted/error disposal and ordinary completion.
Upstream `test/lifecycle/subagent-run.test.ts` covers abort signals and release of caller/observer handles.
Upstream `test/tools/progress-stream.test.ts` covers immediate output, fresh records on ticks and stopping; `test/tools/agent-tool.test.ts` covers streaming/cleanup/refusal on resume.

Existing fork `test/lifecycle/subagent.test.ts` already covers queued-stop settlement without an external observer, terminal notification before startup-listener detachment, observer failure before selection settlement, no repeat provider consultation on resume, and preservation of the settled selection outcome across resume.
Retain those behavioral cases rather than adding a spy-based requirement on the internal `selection.finished` call count.
The selection owner's settlement is idempotent, so an extra internal-call assertion is not itself evidence of a missing observable-behavior test.
Retain foreground/agent-tool cases and real-manager `selection-query.test.ts` / `observed-selection.test.ts`; they cover fork chooser/presentation behavior absent from upstream.
Retain run-level outcome/cleanup cases alongside the upstream `SubagentRun` handle tests.
Adapt callback names/arguments, helper inputs and exact-equality fixtures only where the approved integration requires it; do not rewrite the large lifecycle test file or weaken unrelated assertions.
If an existing case fails, establish its cause first; a newly discovered coverage gap is an operator gate, not authorization to add tests automatically.

Baseline measured on the fork before integration:

- Core check, selector check and worktrees check passed.
- Core `verify:public-types` built self-contained declaration bundles and passed its external packaged-consumer typecheck.
- Core suite passed: 95 files / 2323 tests.
- After the authorized selector upgrade: 7 files / 123 tests, selector check and frozen install passed.

These are planning baselines, not final-integration evidence.
Rerun the required gates during implementation/review; do not reuse the numbers as acceptance counts.
Selector/worktrees factory tests mock the core service and therefore establish factory behavior, not real installed loader compatibility.
Use the existing public-types consumer command for the affected core declaration surface; do not claim the mock suites replace it or silently add an optional packed end-to-end matrix.

## Invariants at risk

| Constituency / invariant                                                                                                                                                          | Pinning surface                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator: one root chooser owns new descendants, authenticated catalogue belongs to the spawning session, selected pair overrides proposals/locks without changing root settings. | Real-manager `test/lifecycle/nested-selection.test.ts`, selection owner/scope suites and child-session construction tests; retain after observer migration. |
| Parent caller: selection acknowledgement follows terminal observer delivery, and resume preserves the initial selection outcome without another provider consultation.            | Existing `test/lifecycle/subagent.test.ts` terminal-notification boundary, queued-stop and resume-outcome cases; preserve through step 2.                   |
| Operator/parent: awaiting selection is not reported as execution with a proposed model; query timeout neither aborts nor consumes the run.                                        | Existing `test/tools/selection-query.test.ts`, `observed-selection.test.ts` and foreground cases, plus incoming shared-stream tests.                        |
| Callers: explicit/default background precedence remains centralized; record/widget reflect the chosen resumed run mode.                                                           | Existing `test/config/background-mode.test.ts`, manager/service/widget suites and incoming run-mode cases.                                                  |
| Worktree users: disposal is once-only with notices/rescue preserved; pending-question completion remains resumable.                                                               | Existing `test/lifecycle/workspace-bracket.test.ts`, incoming initial/resume terminal matrix and worktrees behavior suite.                                  |
| Extension consumers: fork identity, required published-core imports, core-first initialization and service/settings declarations remain usable.                                   | Manifests, selector/worktrees factory suites, package checks and `verify:public-types` in steps 2–4; preserve their stated mock boundaries.                 |
| Published-artifact consumers: existing fork CHANGELOG sections remain byte-identical.                                                                                             | Compare the entire core CHANGELOG against the actual merge first parent in step 2; no generated new section is planned.                                     |

Current source and the cited tests were opened during planning.
The deliberately replaced invariants are spawn-fixed `isBackground`, the old initial warned/question workspace-release branch and selector support below Pi `1.0.0`; do not call their old expectations regressions to preserve.
No cache/token-budget/latency improvement is claimed by this synchronization.

## TDD Order

No TDD cycles.
This section retains the lifecycle's step-discovery heading, but the operator-approved execution is integration plus existing-test validation, not newly authored red → green cycles.
Do not add characterization/regression cases, a preparatory test commit or killing mutations to satisfy generic TDD boilerplate.
Necessary adaptations to inherited upstream and existing fork tests remain in scope; required validation and independent review are unchanged.

### 1. Confirm preconditions and existing-test baseline

Re-read synchronization constraints before Git startup operations.
Require primary checkout `main`, clean tracked state, no unmerged entries and no merge/rebase state; stop rather than stashing/rebasing on failure.
Confirm the selector dependency checkpoint is present, then use ordinary fast-forward-only startup and regenerate inventory inputs.
A changed common base or newly overlapping fork contribution requires inspection before continuing; do not substitute a newer upstream target.

Run the existing `test/lifecycle/subagent.test.ts` and relevant selection/presentation suites to establish the current fork baseline before merging.
Use the existing terminal-notification and resume-outcome cases identified in Test Impact Analysis; do not add direct call-count tests or perform mutations.
No preparatory refactoring or test commit is planned.
The assessor's optional characterization was rejected after comparison with the existing behavior coverage.

### 2. Resolve and commit the genuine pinned integration

Record the immediate fork HEAD, then run:

```bash
./scripts/fork-sync/sync.sh --merge \
  --expected-upstream 23c08264aa180222e8953a835337ada28534f1b7
```

Expected conflicts are planned work, not authority to abort/stash/rebase or change target.
Resolve runtime, tests, manifests, CHANGELOG and workflow conflicts under the shared decisions above.
All removed-observer consumer/fixture changes belong in this same merge commit because the new interface otherwise breaks the tree.

Adapt the integration in small groups, validating each against existing tests before completing the merge commit:

1. **Lifecycle:** adapt the fork observer wrapper and manager notifications to run kind.
   Retain fork selection/terminal-boundary/resume-outcome cases and upstream run-mode, cancellation and handle-release cases; mechanically migrate removed callback names/arguments where necessary.
2. **Foreground presentation:** replace static helper presentation with delegated `detailFor` and wire both consumers.
   Run the incoming progress-stream/agent-tool cases and existing fork foreground, observed-selection and selection-query cases; adapt helper inputs and exact-equality fixtures without adding cases.
3. **Workspace outcomes:** retain the existing upstream initial/resume matrix for warned-question retention, exhausted/error disposal and ordinary completion/addenda.
   Reconcile the contradictory old initial-only assertion with the approved upstream behavior in this merge, without adding a parallel matrix.

Run affected files unpiped via `pnpm --filter @jopqior/pi-subagents exec vitest run <test-path>` after each adaptation group and core check before completing the merge.
Diagnose any failure against the pinned upstream and fork contracts before changing assertions or expanding repair scope.
Do not add tests or run mutations; if existing evidence exposes a concrete coverage gap, stop and request operator agreement on the smallest additional verification.
Do not run a mutating edit in parallel with reads/checks of the same file.
Review automatic merges as well as conflicts, including all selection/service/session/widget intersections.
Regenerate the lock from resolved manifests, then run ordinary `pnpm install` followed by `pnpm install --frozen-lockfile`.
Installation failure stops the completion path; do not authorize unrelated repairs or weaken floors/evidence.

Verify no unmerged entries remain, inspect the staged diff, and compare the entire fork core CHANGELOG to the recorded first parent before committing.
Preserve original upstream commits and authors through the merge.
For adopted run/progress design credited in the resolution, use the resolved trailer `Co-authored-by: Chris Lasher <chris.lasher@gmail.com>` as the final trailer paragraph, below `Refs #44`.
Suggested merge subject: `chore: integrate pinned upstream while preserving fork contracts`.
Do not add a duplicate breaking marker for the inherited run-mode commit.
Complete the merge with the explicit message rather than accepting a stale generic message, then verify exactly two parents and exact pinned second parent.

### 3. Review the committed integration and reconcile current documentation

Record the actual merge OID and generate both complete inventories.
Inspect `git show --remerge-diff "$MERGE"` by conflicted path, first-parent-to-merge diffs for automatic customizations, and any merge-to-HEAD changes.
Check every selected contract against final source/tests rather than treating an empty remerge diff as preservation evidence.
Account for unselected paths using the scope rules, without a new exhaustive inherited-source audit.

Confirm current README/architecture module trees, diagrams and package-skill prose describe run ownership, progress, selection, cancellation and approved workspace behavior consistently.
Retain inherited upstream roadmap completion/Landed notes; this fork issue is not a new package roadmap step.
Keep fork-specific roadmap/identity sections and sync/release workflow rules intact.
If a documentation correction remains after the merge, lint it and commit separately as `docs: reconcile fork sync contracts and workflow guidance`.
If existing tests expose a runtime regression, diagnose provenance and correct an in-scope integration regression without weakening the tests; use a behavior-named `fix(pi-subagents): ...` commit.
If correction would require a new test or other additional verification, present the concrete gap and obtain operator agreement before expanding scope.
A materially new compatibility decision returns to the operator before edits.
Do not create speculative follow-ups or repair unrelated inherited findings with passing required gates.

### 4. Validate completed behavior, public consumers and source feasibility

Run relevant package checks/tests for core, selector and worktrees, and core `verify:public-types`.
Root test execution covers incoming permission/judge behavior and root tooling fixtures.
Run the required synchronization gates separately, each with a tool timeout of at least 900 seconds, never concurrently or through an output-filter pipeline:

```bash
pnpm run check
pnpm run lint
pnpm run test
pnpm fallow dead-code
```

Run `./scripts/release/verify-cliff-parity.sh` and the read-only `next-version.sh` predictions for registered core, selector and worktrees.
Implementation-stage operator decision: accept version consistency only for the three packages registered in `scripts/release/release-packages.json`, without changing the checker or adding tags.
The existing parity checker enumerates all package directories and fails on the unregistered inherited packages' absent fork release tags; record that whole-repository result separately, not as a passing gate.
For each registered entry, require the latest local package tag to match its manifest version and require `next_tag` from `scripts/release/lib.sh` to succeed, preserving the checker's existing derivation.
Do not write predicted versions into manifests or dispatch releases.

Use the production source resolver and validator for each `kind: "fork"` registry entry at the completed HEAD:

```js
const source = resolveUpstreamSource({ repo, at: head, upstream: entry.upstream });
const text = renderUpstreamSource({ source, upstream: entry.upstream });
validateUpstreamSource({ repo, at: head, upstream: entry.upstream, text });
```

Load these functions from `scripts/fork-sync/source.mjs` and registry entries from `scripts/release/release-packages.json`.
Require each incorporated commit to equal the pinned target and record each independent stable-release/tail result in the implementation retro.
Do not infer worktrees provenance from core or manufacture an anchor.
These operations use temporary isolated repositories and must not import upstream tags into the fork namespace.

Record actual gate/provenance results, not cached planning results.
Required failures stop completion even if inherited.
Unrelated inherited defects with passing required gates stay outside synchronization scope without automatic repair, issue filing or persistent ship warnings.
Human TUI, live judge/model calls and temporary cross-extension matrices are optional; escalate only a named unresolved compatibility gap with the smallest proposed check and obtain approval before executing it.

### 5. Commit handoff notes and dispatch exact-range independent review

Before dispatch, commit all adaptations and ordinary implementation-stage notes.
Record target, actual merge, source results, deviations and the separately completed selector dependency contribution in `docs/retro/f0044-pinned-upstream-sync.md`.
Suggested notes commit: `docs(retro): add implementation stage notes for issue #44`.
Resolve reviewed HEAD only after these commits exist.

Supply the independent `pre-completion-reviewer` with:

- The actual merge OID, its first parent as review base, the exact reviewed HEAD, pinned target and recomputed common base.
- An explicit override of the default tag/plan-derived review range.
- This full plan, `.pi/skills/fork-sync/SKILL.md` and the actual synchronization-review task.
- Both inventory paths, their exact ref inputs/commands, selected intersections/reasons and the grouped source/diff/test/source-evidence entry points above.
- Actual implementation handoff/deviations and critical warnings, without a predicted verdict or coordinator coverage claim.
- The pre-merge selector dependency commit as an explicit additional contribution to check against its narrow approved scope; it does not replace or widen the actual integration inventory.

Require the reviewer to independently regenerate and account for both complete inventories, inspect the selected contracts and all post-merge changes, run generic deterministic gates, and apply synchronization finding disposition.
The report must state actual range, inventory coverage/deep-review scope, relevant results and finding disposition.
Missing in-scope evidence means review is incomplete; correct and use normal follow-up review rather than commissioning a second comprehensive incoming audit.
Persist the accepted result in ordinary stage notes.

Stop after implementation/review handoff; `/ship #44` remains a separate stage.
Ship must verify the genuine merge, reviewed committed adaptations, source feasibility and clean state; use the actual first parent as `RANGE_BASE`, include the explicit selector contribution in the closing summary, skip incoming-history co-shipped scans, and target only the fork issue.
Publication remains separately approved.

## Risks and Mitigations

- **Automatic merge hides fork loss:** inspect both inventories and unchanged contract entry points; do not equate no conflict with compatibility.
- **Initial selection behavior regresses on resume:** retain existing terminal-boundary, provider-consultation and settled-outcome tests, and inspect the initial-only finalization guard during merge review.
- **Stream extraction regresses chooser feedback:** retain existing real-manager query/observed-selection and foreground cases alongside incoming helper/caller tests; inspect relocated call sites without adding mutation work.
- **Mode or disposal expectations contradict upstream:** retain incoming mode/outcome coverage and reconcile only the explicitly approved old expectations; do not add a duplicate matrix.
- **Lock graph silently loses needed versions:** preserve the approved selector upgrade, regenerate from final manifests and require frozen installation; do not hand-delete snapshots based on upstream assumptions.
- **Package identity or published history overwritten:** resolve core manifest/CHANGELOG explicitly, verify full CHANGELOG equality and retain upstream source correspondence as provenance rather than copied release history.
- **Dependency probe overclaimed:** its evidence covers selector APIs and tests against exact Pi `1.0.0`, not complete old-core spawn/schema integration or arbitrary future majors.
- **Review/ship inherits the wrong range:** record the actual merge, resolve its first parent and tip after commits, and independently regenerate inventories; track the pre-merge selector contribution explicitly.
- **Required inherited failure expands scope:** stop with gate/provenance evidence and ask the operator rather than repairing it by default.

## Open Questions

No unresolved design choice blocks the planned integration.
The operator selected the narrow selector Pi upgrade after upstream breaking-marker verification; it is already committed and tested.
Any materially new compatibility choice, additional concrete verification gap, release selection or publication authorization remains a future explicit gate.
No concrete new follow-up beyond existing fork #26 was identified.
