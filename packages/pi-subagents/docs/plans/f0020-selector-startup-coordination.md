---
issue: 20
issue_title: "Reduce selector startup coordination with upstream lifecycle changes"
---

# Cohesive initial spawn selection

## Release Recommendation

**Release:** ship independently

Phase 23 assigns this delivery `Release: independent`; presentation work in [#21] is neither a hard dependency nor a release batch.
This is a behavior-preserving `refactor:`/`test:` delivery, not a breaking change or an automatic publication request.
Obtain separate approval for the fork destination and npm scope before publishing.

## Problem Statement

Preserving selection during an upstream lifecycle update currently requires coordinating provider invocation, validation, cancellation, tool acknowledgement, and terminal settlement inside `Subagent`, as well as reviewing construction and manager teardown.
Moving those statements into a helper alone would leave the same reconciliation obligations.
The delivery must remove identifiable obligations while preserving the actual startup and tool-return boundaries.

## Goals

- Give initial selection a cohesive owner, separate from ordinary execution state and from the root/subtree lease.
- Remove selection-result settlement from individual initial-run terminal funnels by composing their existing observer notification inside the record.
- Preserve admission-before-selection, authenticated validation, selected model/thinking authority, failure without fallback, and resume without reselection.
- Preserve synchronous service spawn, non-blocking no-provider queued acknowledgements, and background tool return after confirmation without awaiting workspace, session, or task completion.
- Preserve queued/active cancellation, ignored-abort providers, late registration, service-only disposal, initialization-time inheritance, descendant registration restrictions, and late-session disposal before binding.
- Deliver behavior tests and reproducible before/after reconciliation evidence with explicit remaining integration obligations.
- Make no observable behavior, output, public API, or default changes; classify implementation commits as non-breaking refactors.

## Non-Goals

- Presentation formulas, tags, widget redesign, or foreground rendering changes belong to [#21].
- Completing the overall maintenance objective or closing [#19]; it remains the delivered-outcome assessment tracker.
- Moving admission, workspace orchestration, session construction, or general shutdown policy into a new coordinator.
- Removing the initialization-time construction carrier, changing its symbols, or relocating the factory's final cancellation check into an asynchronous IO wrapper.
- Adding a public hook framework, event channel, package boundary, registry of startup objects, timeout, fallback choice, or whole-host integration harness.
- General inherited-code cleanup, splitting large test files, or consolidating unrelated fixtures.
- Fetching a newer upstream baseline or claiming a measured future conflict rate or maintenance-time reduction.

## Background

The issue is open and its author matches the authenticated operator, `Jopqior`.
The related open issues are [#19] and [#21]; neither is an implemented prerequisite.
The fork open-PR sweep returned no PRs, and the open-issue selection search found only these maintenance issues.
The newest local triage, `docs/triage/2026-09-18-backlog.md`, contains no selector entry for this fork delivery.
There was no `f0020-` retro; the unprefixed fallback is an unrelated inherited permission-system issue and supplies no decisions for this plan.

Comparison references, resolved from local Git objects:

- Fixed upstream: `edb35ee28535aac4e12431e47e440f6933911834`.
- Recorded fork inventory: `746a4ae812a574d0496cb46c125a32961a608cf1`.
- Planning implementation baseline: `213513eb3f38157ddde17b069815f4701ee7ecf7`.

The initial required `git pull --ff-only` reported already up to date.
No subsequent fetch was performed.
The direct diff between the recorded inventory and planning baseline is empty for `packages/pi-subagents/src` and `test`; newer planning documents are not newer runtime behavior.
Fork requirements override inherited cherry-pick-only guidance: future synchronization uses `scripts/upstream-sync.sh`, but this investigation keeps the upstream object fixed.

Current ownership:

- `Subagent.prepareSession()` opens the selection gate after admission, validates the provider answer, applies the pair, and settles the tool milestone before downstream work.
- `waitForSpawnSelection()` owns startup-only cancellation listeners and the no-provider acknowledgement decision.
- `stopQueued()`, `failRun()`, and `stopRunForCancelledSelection()` independently settle the same outcome after notifying the observer.
- `SubagentManager.dispose()` cancels unfinished selection before clearing the limiter and record map.
- `SubagentState` carries pending-selection activity despite not owning the selection protocol.
- `selection-catalogue.ts` already owns authenticated availability and thinking validation; it is not duplicated by this design.
- `selection-scope.ts` and `spawn-selection.ts` already own construction inheritance and lease authority.
- `index.ts` captures inheritance during extension initialization and unconditionally wraps the complete factory call.
- `create-subagent-session.ts` rechecks cancellation before SDK creation and disposes a late-created session before binding.

The README's existing spawning/provider scope permits this internal refactor.
It does not add model-scope enforcement or move the companion's interactive chooser into core.

## Design Overview

### Confirmed direction and evidence limits

The operator selected a dedicated selection-state owner plus settlement through the existing initial-run terminal notification.
A provider-only extraction was rejected as insufficient coordination relief; manager-wide startup ownership was not selected because it adds record association, cancellation, and cleanup seams without demonstrated benefit.
The plan does not promise elimination of every fork hook.

Planning executed existing tests against the implementation baseline, not a new implementation or an interactive incident reproduction.
Measured results: the targeted lifecycle/construction/tool/catalogue run passed 7 files and 379 tests; the full core suite passed 84 files and 1956 tests; the companion suite passed 9 files and 68 tests.
The real-loader tests execute production construction wrapping but stub SDK session creation; the real-tool boundary suite executes the tool, manager, and record but holds a stub factory and task.
These are layered proofs, not full SDK-host end-to-end coverage.

The construction counterexample in [the issue-19 retro](../retro/f0019-upstream-integration-maintenance.md) used the real factory and existing stub IO with a synthetic deterministic cancellation schedule.
It showed a handoff gap when both inline checks move to an asynchronous IO wrapper.
This plan keeps both production checks; it does not promote that prior probe into a fresh host measurement.

### Selection owner and narrow inputs

Add `src/lifecycle/initial-spawn-selection.ts` with the internal `InitialSpawnSelection` implementation and a narrow structural `InitialSelection` interface consumed by `Subagent`.
Construct the implementation in `SubagentManager.create()` and inject it through a required `SubagentInit.selection` field.
Do not construct a concrete selection implementation inside `Subagent`, add an optional production fallback, or pass the whole execution bag to the new owner.

The owner receives only the spawn identity, authenticated catalogue reader, and optional selection source.
The identity reads exactly `agentId`, `agentType`, and `description`; it is not a `Subagent` or a parent snapshot.
The selection source reads exactly `activeSelectionProvider()` and `closureSignal`, excluding registration, construction, retention, and root identity.
The catalogue reads exactly optional `getAvailable()`; narrow the existing catalogue functions' registry parameter to `Pick<ModelRegistry, "getAvailable">` rather than manufacturing unused `find`/`getAll` dependencies.
Keep missing availability an error and keep supported-thinking feature detection unchanged.

Illustrative internal shapes:

```typescript
type SpawnSelectionOutcome =
  | { kind: "not-required" }
  | { kind: "selected" }
  | { kind: "stopped" }
  | { kind: "failed"; error: string };

type SelectionSource = Pick<
  SelectionScopeHandle,
  "activeSelectionProvider" | "closureSignal"
>;

type InitialRunTerminal = {
  stopped: boolean;
  error: string | undefined;
};

interface SelectionPermit {
  readonly pair: ValidatedSpawnSelection;
  readonly signal: AbortSignal;
  assertLive(): void;
}

interface InitialSelection {
  readonly awaitingSelection: boolean;
  readonly selectedPair: ValidatedSpawnSelection | undefined;
  begin(runSignal: AbortSignal): Promise<SelectionPermit> | undefined;
  wait(signal: AbortSignal | undefined, cancelStartup: () => void): Promise<SpawnSelectionOutcome>;
  cancelUnfinished(cancelStartup: () => void): boolean;
  finished(terminal: InitialRunTerminal): void;
}
```

These are internal contracts, not additions to package exports or the service declaration bundle.
Keep the outcome vocabulary and record getters stable for existing consumers.
Test fixtures use the structural interface for passive seeded records; runnable lifecycle fixtures inject the real implementation.
Do not add production seed fields merely to support passive UI fixtures.

### Own both the attempt and the acknowledgement

The owner holds pending activity, the selected pair, provider cancellation racing, the one-shot outcome, its settlement flag, and startup listener detachers.
Set and clear pending activity around provider invocation and validation; retain the confirmed pair across task completion and resume.
Detach startup listeners synchronously at settlement and never reset the outcome on resume.
Do not merge these into a single `done` flag: a queued no-provider acknowledgement can already be settled while a late-registered provider is actively selecting at admission.

| Situation                                       | Required handling                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No provider at wait entry and no gate in flight | Resolve `not-required` immediately, without admission or resource work                                   |
| No provider at admitted `begin()`               | Settle `not-required` synchronously and return `undefined`                                               |
| Provider registered while a record is queued    | Consult it at admission, not at record construction                                                      |
| Valid answer                                    | Validate, recheck cancellation, store pair, clear pending, detach listeners, settle `selected`           |
| Undefined answer or cancelled gate              | Throw the existing cancellation marker; record owns stopped-state cleanup and terminal notification      |
| Provider/catalogue/validation failure           | Record owns error formatting and terminal cleanup; terminal notification supplies the recorded error     |
| Queued stop                                     | Terminal notification settles `stopped` without invoking the provider                                    |
| Late provider after an earlier `not-required`   | Run selection normally; disposal can cancel its active attempt without rewriting the old acknowledgement |
| Confirmed startup or admitted ordinary task     | `cancelUnfinished()` is a no-op; preserve existing task-disposal policy                                  |
| Resume                                          | Reuse the session and selection facts; never call `begin()` or reset the milestone                       |

Preserve the current distinction between a closed scope observed by a waiter and the ordinary admitted no-provider path.
Do not silently tighten revoked-scope classification or change which layer denies construction.

The extracted provider flow remains a consumer of the catalogue, not its replacement:

```typescript
const choices = readSelectionChoices(registry);
const answer = await raceProviderCancellation(provider.select({ ...identity, availableModels: choices }, signal), signal);
if (answer === undefined) throw new SelectionCancelledError();
const pair = await validateSpawnSelection(answer, choices, registry);
```

Recheck liveness before applying that pair.
Keep the cancellation race and late-rejection drain private beside their sole caller.
Retain the existing cross-module cancellation marker rather than inventing a second error protocol.

### Keep orchestration and necessary timing hooks in the record

The record still starts after admission, remints its run controller, prepares its workspace, assembles factory parameters, and owns all execution-state mutations.
Its cancellation callback keeps the queued-versus-running dispatch; the selection owner neither queries nor mutates a full record.
Both waiting and disposal delegate to the same owner through record methods that retain their current signatures.

```typescript
const attempt = this.selection.begin(this.abortController.signal);
const permit = attempt ? await attempt : undefined;
const cwd = awaitWorkspaceOnlyWhenConfigured(); // preserve the existing conditional await
permit?.assertLive();
return this.execution.createSubagentSession(buildExistingParams(cwd, permit));
```

This is interaction pseudocode, not a request to extract workspace or parameter-building helpers.
Keep the existing parameter literal in `prepareSession()`; use the permit's pair for `model`/`thinkingLevel` and its signal for `selectionSignal` only when present.
Do not copy ordinary factory configuration into the new module or spread `undefined` overrides over ordinary resolution.
No-provider/no-workspace creation must still call the factory in the same turn as `spawn()`.
The selected milestone precedes downstream waits, but does not promise workspace work starts after the parent continuation.

### Compose existing terminal notifications, not a new event system

At record construction, compose the existing optional execution observer into a record-owned execution view without mutating the caller's input object.
Override only `onRunFinished`; retain every other callback and its arguments.
The wrapper first calls the original observer, then passes `{ stopped: agent.status === "stopped", error: agent.error }` to the selection owner.
It also exists when no external observer was supplied.

The owner's terminal mapping gives a recorded error precedence over stopped status, using `error !== undefined`, not truthiness.
`markError()` stores the formatted error even if status stays `stopped`; an empty error string is still a failure.
Successful terminal facts require no new settlement: ordinary and selected startup already settled before resource work.
Previously settled outcomes remain immutable.

Leave `this.execution.observer?.onRunFinished?.(this)` at the existing terminal sites and remove their separate selection-settlement statements.
This is what allows an upstream-shaped terminal method that retains that notification to work without a fork-specific settlement line.
Keep cancellation cleanup in the record; do not combine it with resume failure cleanup, which has different observer and lifetime semantics.

Do not compose through `AgentSpawnConfig.observer`: the manager currently forwards initial completion to its manager observer, not to that option's `onRunFinished`.
Keep that manager forwarding unchanged.
Preserve original observer-before-settlement ordering and exception propagation; do not add a `finally` or swallow a previously escaping observer error.
On a directly constructed record whose failure observer throws, the run promise rejects and selection settlement is skipped; characterize the pending selection promise through its retained listeners rather than awaiting it forever.
The production manager observer catches its external observer's exception, so that path continues to settle selection normally.
Resume notifications do not invoke this adapter.

### Design-review findings

| Check                 | Evidence and decision                                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency width      | Full `SubagentExecution`, `ParentSnapshot`, and `SelectionScopeHandle` contain unrelated execution/construction capabilities; inject the narrow selection interface and pass only identity, availability, and live provider source to its implementation |
| Law of Demeter        | Tool already asks manager to wait, manager asks record; keep those calls and do not expose the owner's internals to either consumer                                                                                                                      |
| Output arguments      | Owner returns a permit and owns its own mutable fields; it never writes a `SubagentState` or caller-owned execution bag                                                                                                                                  |
| Scattered state/reset | Move the outcome, pending activity, pair, and listener lifecycle together; keep acknowledgement and active attempt distinct                                                                                                                              |
| Parameter relay       | Stop relaying `selectionScope` through `SubagentExecution`; manager constructs the owner directly from its retained scope                                                                                                                                |
| Repeated decisions    | Provider requirement and unfinished-attempt rules move into the owner; queued/running cancellation remains record policy, and lease-state checks stay with lease authority                                                                               |
| Mock depth            | Use a structural `InitialSelection` fixture for passive records, not concrete-class casts; real runnable fixtures retain the real owner                                                                                                                  |
| Cohesion              | The new object owns mutable selection state and transitions, removing the record's outcome deferred, settlement flag, detacher set, and selected-pair storage rather than merely splitting procedures                                                    |

### Maintenance evidence and acceptance boundary

The following are expected effects, not measured savings.
Record actual after-results in `docs/architecture/selector-startup-maintenance.md` before declaring the implementation complete.

| Upstream-change scenario                                                                           | Before                                                                       | Expected after                                                                                   | Obligation that remains                                                                                            |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Replace/rework `failRun()` while retaining state update and existing initial terminal notification | Restore the fork's extra outcome settlement after the upstream body          | Accept the upstream-shaped method without adding selection settlement                            | Notification must still follow error recording and cleanup; adapter semantics need review if that contract changes |
| Replace/rework `stopQueued()` with the same terminal notification                                  | Restore queued selection settlement separately                               | Existing notification reaches the owner without a selection-specific line in the terminal method | Notification and never-admitted status semantics remain load-bearing                                               |
| Update ordinary `SubagentState` activity or reset logic                                            | Carry the unrelated selection activity field/mutators through reconciliation | State file can match the fixed upstream implementation; selection activity has a separate owner  | Preserve record getters and presentation behavior                                                                  |
| Add/change ordinary session parameters                                                             | Review a long mixed selection/workspace/factory method                       | Ordinary parameter construction stays in one place; selection contributes only pair and signal   | Placement after selection and liveness checks remains a semantic review point                                      |

Use actual fixed-upstream `failRun()` and `stopQueued()` method bodies as replay inputs, not invented future bug reports.
For each, record the literal transplanted diff and focused test command on the planning baseline and delivered implementation.
The baseline should lose its selection settlement pin when the upstream body replaces the fork body; the delivered implementation should retain that pin without an extra terminal-method edit.
These are synthetic reconciliation trials using real upstream source, not evidence of a future merge-conflict rate.
Back up and restore working files around every trial; do not retain an intentionally broken variant.
Record the implementation commit SHA from Git, test outcomes, and any unexpected adaptation rather than authoring a predicted success as a result.

Also verify the final `subagent-state.ts` tree diff against the fixed upstream object is empty.
Report source concentration by responsibility and remaining hooks, with any line counts generated from commands and used only as supporting inventory.
The new owner must not accumulate workspace/session construction, rendering, or scope registration duties.
If the delivered changes cannot demonstrate the notification-path benefit and reduced state-file reconciliation, return to [#19] instead of widening the scope or accepting relocation-only success.

Remaining hooks are explicit: manager constructs the owner; record calls `begin()` after admission and delegates wait/disposal; record composes initial terminal notification; record checks the permit after workspace work; factory preserves inline checks; index wraps construction and captures inheritance; shutdown closes scope before teardown; tools await the existing milestone.
No new SDK method or dependency floor is introduced.
Loader initialization timing, cross-module carrier/marker identity, authenticated availability, supported-thinking capability, and session-disposal/binding order remain host compatibility obligations.

## Module-Level Changes

Paths are relative to `packages/pi-subagents/` unless marked repository-root.

| File                                                                                                  | Change                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lifecycle/initial-spawn-selection.ts`                                                            | Add owner, narrow interface, outcome type, permit, and private race/listener implementation                                                                                                                                                                       |
| `src/lifecycle/subagent.ts`                                                                           | Inject owner; delegate pending/pair/wait/disposal; compose initial completion observer; replace inline gate with conditional owner call; retain workspace/factory ordering and cancellation cleanup; remove superseded private selection methods and race helpers |
| `src/lifecycle/subagent-manager.ts`                                                                   | Construct owner from resolved identity, snapshot availability, and retained scope; stop passing scope through execution; update outcome import; retain synchronous create/spawn and disposal ordering                                                             |
| `src/lifecycle/subagent-state.ts`                                                                     | Remove only the fork pending-selection field/getter/mutators, restoring fixed-upstream content                                                                                                                                                                    |
| `src/session/selection-catalogue.ts`                                                                  | Narrow registry parameter types to the availability capability, including its private revalidation helper; no validation-policy change                                                                                                                            |
| `src/tools/agent-tool.ts`, `src/tools/background-spawner.ts`                                          | Update outcome type imports only; keep wait calls, signal forwarding, messages, and rendering intact                                                                                                                                                              |
| `test/lifecycle/initial-spawn-selection.test.ts`                                                      | Add direct attempt/acknowledgement, cancellation, validation integration, and listener-lifecycle tests                                                                                                                                                            |
| `test/lifecycle/subagent.test.ts`                                                                     | Add terminal-order/stopped-error characterization; adapt local constructors and runnable fixtures; retain orchestration and real-owner selection tests                                                                                                            |
| `test/lifecycle/subagent-manager.test.ts`                                                             | Preserve and strengthen owner-construction/terminal-adapter wiring pins; retain service-only, queued, late-registration, and disposal cases                                                                                                                       |
| `test/lifecycle/subagent-state.test.ts`                                                               | Remove the relocated selection-activity test only after owner/record coverage replaces it                                                                                                                                                                         |
| `test/helpers/make-subagent.ts`, `test/helpers/make-subagent.test.ts`                                 | Inject selection fixtures; preserve passive pending/pair seed behavior without production seed fields                                                                                                                                                             |
| `test/helpers/make-initial-selection.ts`, `test/helpers/make-initial-selection.test.ts`               | Add a narrow typed passive fixture if needed by the existing constructor helpers; reject accidental use as a runnable implementation rather than silently faking selection                                                                                        |
| `test/service/service-adapter.test.ts`                                                                | Update the direct constructor; preserve public-snapshot exclusion assertions                                                                                                                                                                                      |
| `test/helpers/make-deps.ts`, `test/tools/agent-tool.test.ts`, `test/tools/background-spawner.test.ts` | Update outcome imports atomically with removal of its old export; preserve exact result assertions                                                                                                                                                                |
| `test/session/selection-catalogue.test.ts`                                                            | Pin acceptance of a minimal availability-only registry; retain unavailable/getAll-no-fallback tests                                                                                                                                                               |
| `test/lifecycle/create-subagent-session.test.ts`                                                      | Add a deterministic handoff cancellation characterization while keeping real factory execution and stub session IO                                                                                                                                                |
| `test/tools/spawn-selection-boundary.test.ts`                                                         | Retain real tool/manager/record coverage; add any missing assertion needed to discriminate relocated settlement, not a mocked startup owner                                                                                                                       |
| `docs/architecture/selector-startup-maintenance.md`                                                   | Record source-derived replay inputs, before/after results, remaining hooks, compatibility limits, and abstraction upkeep                                                                                                                                          |
| `docs/architecture/architecture.md`                                                                   | Update domain ownership, module tree, class/sequence diagrams, and startup prose; mark Phase 23 issue-20 heading and Mermaid node complete with a measured `Landed:` note only after acceptance                                                                   |
| Repository-root `.pi/skills/package-pi-subagents/SKILL.md`                                            | Update selection ownership and module listing, re-deriving any affected counts; keep behavior requirements                                                                                                                                                        |
| Repository-root `docs/upstream-sync.md`                                                               | Add the delivered startup reconciliation rule and residual checks; preserve historical merge records and issue-21 display instructions                                                                                                                            |

The new fixture files are conditional on reuse across the existing constructor helpers, not authorization for a general fixture framework.
The exact constructor sweep found production construction in the manager and direct test construction in `subagent.test.ts`, `make-subagent.ts`, and `service-adapter.test.ts`; migrate all in the same required-field commit.
The removed outcome export has importers in the record, manager, both named tool modules, and the named test/helper files; update them together rather than retaining a speculative re-export.
Removing selection mutators also affects the shared passive fixture and the state test.
Remove `openSelectionGate`, `obtainSelection`, `applySelectedPair`, `assertSelectionLive`, `isSpawnSelectionRequired`, startup listener/settlement helpers, and provider race/drain helpers from the record when their replacements are wired and exact caller searches confirm they are unused.
Keep the record's queued/running cancellation dispatch.

### Predicted unchanged files in the affected surface

- `src/index.ts`, `src/runtime.ts`, `src/handlers/lifecycle.ts`, `src/lifecycle/create-subagent-session.ts`, `src/lifecycle/selection-scope.ts`, and `src/lifecycle/spawn-selection.ts`: necessary construction/closure hooks stay at their verified positions; tests re-exercise them.
- `src/service/service.ts`, `src/service/service-adapter.ts`, and package manifests: no public contract, snapshot, export-map, or version change.
- `src/tools/foreground-runner.ts`, `src/tools/spawn-config.ts`, and `src/ui/*`: existing record getters and presentation contract stay stable; issue-21 work is not bundled.
- `README.md` and `docs/configuration.md`: user behavior remains accurate; review, but do not rewrite historical behavior notes as if this were a new timing change.
- `test/lifecycle/construction-inheritance.test.ts`, `test/lifecycle/nested-selection.test.ts`, `test/handlers/lifecycle.test.ts`, runtime/composition tests, and presentation tests: keep their real layers and existing assertions; fixture changes should not require weakening them.
- `packages/pi-subagents-model-selector/`: no source or test edits; run its suite as a compatibility check, noting it is not by itself a packed-new-core compatibility test.

If one of these predictions fails, document why and keep changes within the accepted behavior-preserving scope.

## Test Impact Analysis

Direct owner tests make listener cleanup, immutable acknowledgement identity, and late-registration state transitions practical without building an execution session or triggering unrelated turn-loop behavior.
They do not replace the tests proving those transitions are wired into the record, manager, tool, or construction factory.
Catalogue validation remains tested at its existing layer; owner tests need representative delegation/error cases, not a second complete validation matrix.
The state-only pending-activity test becomes redundant after ownership moves and is removed in the integration commit.
Keep existing record gate, manager disposal/admission, public-snapshot, real-tool return, real-loader inheritance, and nested-scope tests.
Do not bulk-delete high-level tests merely because new lower-level tests pass.

Use explicit deferred phase-entry gates, recorded callback order, exact outcomes, and synchronous signal/listener observations.
Do not use elapsed sleeps as evidence that something cannot settle.
Mutation-check characterization tests that are already green on the baseline.
For async negative cases, retain a bounded failure timeout and always release test-owned gates in cleanup.

## Invariants at risk

| Constituency and invariant                                                                                                              | Existing test opened during planning; added pin if needed                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Background parent: next sequential tool cannot proceed before confirmed selection, but can proceed while workspace/factory/task is held | `test/tools/spawn-selection-boundary.test.ts`, `sequential parent continuation`, `queued admission boundary`, and `downstream workspace boundary`                        |
| Ordinary callers: same-turn factory call and queued acknowledgement without a provider                                                  | `subagent.test.ts`, `keeps the ordinary timing when the scope holds no provider`; real-tool no-provider queued case                                                      |
| Service callers: synchronous ID and no disposal-induced abort of confirmed or ordinary work without a waiter                            | `subagent-manager.test.ts`, `returns the id synchronously while the selection is pending` and parameterized `preserves running-task disposal without a selection waiter` |
| Late-registration callers: active selection can be cancelled despite a prior `not-required` acknowledgement                             | `subagent-manager.test.ts`, `cancels an admitted late-registered selection after a no-provider acknowledgement`                                                          |
| Cancelled callers: ignored abort cannot hold the selection wait or concurrency slot; late answers do not create a child                 | `subagent.test.ts`, `startup selection waiting`; `nested-selection.test.ts`, `aborting the active selection releases the slot so the queued run can ask`                 |
| Task owners: tool signal detaches at confirmation; scope/run cancellation still protects construction                                   | Real-tool `startup signal detachment`; record workspace recheck; factory gated-run tests                                                                                 |
| Descendants: initialization inheritance even without provider, inherited registration, sibling/root isolation                           | `construction-inheritance.test.ts`, unconditional production wrapper and child-loaded chooser cases; `nested-selection.test.ts`, child-handle closure case               |
| Construction: late-created session disposed before binding or session-created publication                                               | `create-subagent-session.test.ts`, `disposes a session that creation returned after the signal aborted`; add handoff schedule pin                                        |
| Shutdown: scope closure precedes unpublish, notification teardown, abort, and manager disposal                                          | `test/handlers/lifecycle.test.ts`, `calls cleanup in correct order`; this pins handler ordering with mocks, not SDK delivery                                             |
| Resumed children: same session/pair, no new chooser; initial outcome retained                                                           | `nested-selection.test.ts`, resume case; record `keeps the settled outcome across a resume`                                                                              |
| Lifecycle observers: terminal notification precedes selection detachment; stopped error remains failed acknowledgement                  | Add record characterization before changing the terminal path, including empty error string and throwing observer                                                        |
| Public consumers and presentation: no live selection fields in snapshots; pending hides provisional values                              | `test/service/service-adapter.test.ts`, `withholds pending-selection activity`; retain real-tool foreground progress and existing display/widget tests                   |

The admission/progress wiring preserved by fork issue 18 and the tool-return contract introduced by fork issue 17 remain acceptance constraints, not opportunities for another behavior change.
No quantitative latency or token-budget improvement is claimed.

## TDD Order

Each step leaves the tree green and commits separately.
Run package typecheck alongside runtime tests; Vitest does not typecheck fixture changes.

1. **Characterize terminal ordering and construction cancellation before changing ownership.**
   Add record tests for observer-before-startup-detachment on queued stop, selection cancellation, and failure; include `failRun()` after stopped state and an empty recorded error string.
   Characterize both exception paths: a directly supplied throwing record observer rejects the run promise and leaves selection unsettled/listeners attached, while the manager's existing catch permits normal failed-selection settlement.
   Assert the distinction between the whole-run and selection promises; the record's always-resolves comment is not the actual exception contract.
   Add the factory handoff test using existing `createFactorySession`/IO helpers: hold SDK creation, introduce an asynchronous IO handoff, abort before the factory continuation, and assert disposal without binding.
   These are baseline pins, not expected failing features: demonstrate Red with mutations, restore, then verify Green.
   Killing mutations: move settlement before the observer in each tested terminal funnel (ordering class); make `failRun()` settle `stopped` instead of `failed` (stopped-error class); treat empty error as absent (empty-error class once the mapping exists); swallow the observer exception (exception class); remove the final `selectionSignal` check before binding (factory class).
   Run focused record/factory tests and package check.
   Commit: `test(pi-subagents): pin initial selection terminal boundaries`.

2. **Prepare the existing terminal notification as the single settlement entry.**
   Compose the record's initial-run observer while selection state still lives in the record, forward the original callback first, and centralize terminal projection with error precedence.
   Remove per-funnel selection-settlement calls; preserve the upstream `onRunFinished` call sites and manager forwarding unchanged.
   Leave resume and successful-startup settlement untouched.
   This adapts the assessor's notification-centralization recommendation to the approved design: do not introduce explicit selection-outcome arguments into every terminal method or a new manager adapter.
   Add a no-external-observer pin and preserve callback arguments for unrelated observer methods.
   Build that pin with an execution object that truly omits `observer`: the existing `createRunnableAgent()` uses `overrides?.observer ?? {}`, which would mask this case.
   Keep a real selection owner in this pin after step 4, not a passive double.
   Killing mutations: delete the composed callback's settlement call (queued-stop and failed-selection classes); omit composition when the original observer is undefined (no-observer class); classify only by `status === "error"` (stopped-error class); use truthiness of `error` (empty-error class); reverse callback/settlement order (ordering class).
   Verify record, manager, real-tool boundary, nested-selection tests and package check before and after the commit.
   Commit: `refactor(pi-subagents): centralize initial selection terminal settlement`.

3. **Build the complete narrow selection owner alongside the existing implementation.**
   Narrow the catalogue registry types and add the internal owner/interface/permit without switching record consumers yet.
   Implement the entire field lifecycle in this step: set/read/clear pending activity, retain pair, create/settle the one-shot outcome, attach/detach listeners, and keep late admission independent of earlier acknowledgement.
   Add unit tests for same-turn no-provider return, live-provider lookup at admission, cancellation before invocation/during selection/after answer, validation failures, late answer/rejection drain, queued cancellation callback, confirmation detachment, terminal precedence, immutable outcome, and unfinished-disposal decisions.
   Tests first fail against missing behavior; also mutation-check tests added after their paths are already green.
   Killing mutations by class: return `Promise.resolve(undefined)` instead of synchronous `undefined` on the no-provider branch; cache the provider in the constructor instead of `begin()`; remove the abort race; remove the post-validation liveness check; replace validation with the unvalidated answer; omit listener detachment; make `cancelUnfinished()` return false whenever the acknowledgement is settled; overwrite an already-settled outcome; remove the terminal error-precedence branch.
   The corresponding tests must respectively kill timing, late-registration, ignored-abort, answer/abort race, invalid-answer, listener, late-disposal, one-shot, and stopped-error regressions.
   An availability-only registry test demonstrates the narrowed type with package check; existing getAll-without-availability tests remain the fail-closed runtime pin.
   Run owner/catalogue tests and package check.
   Commit: `refactor(pi-subagents): encapsulate initial spawn selection state`.

4. **Wire ownership and remove the duplicate implementation atomically.**
   Construct and inject the real owner in manager creation; update every direct record constructor and the passive/runnable test helpers in the same commit.
   Remove `SubagentExecution.selectionScope` and `SubagentInit.selectedPair`, move outcome imports, and delegate record getters/wait/disposal to the owner.
   Replace inline selection with the conditional `begin()` await, preserve selected overrides and the factory signal, and retain synchronous liveness checking after workspace preparation.
   Remove record-owned selection fields/private helpers and the state-owned pending field/mutators; remove only the displaced state test.
   Keep the new owner unaware of workspace/session/manager orchestration.
   Update ownership documentation and module listings so this commit does not leave stale implementation guidance.
   Killing mutations: delete the new observer-to-owner `finished()` call (relocated terminal-settlement pin); replace the conditional await with unconditional `await` (same-turn factory pin); omit injected scope (manager/provider pin); ignore `permit.pair` (override pin); omit `selectionSignal` (factory propagation pin); remove the post-workspace permit check (workspace revocation pin); make record cancellation call only `abort()` (queued-stop pin); return constant false/undefined from pending/pair getters (presentation and snapshot-fixture pins).
   Test passive fixture methods against the interface and prove runnable fixtures use the real owner, not a no-op double.
   Run the complete core suite, companion suite, package check/lint, and public-type verification; run package check again after committing the shared-interface migration.
   Commit: `refactor(pi-subagents): delegate startup selection to its lifecycle owner`.

5. **Verify actual reconciliation benefit and finish delivery evidence.**
   Replay fixed-upstream `failRun()` and `stopQueued()` bodies against the recorded baseline and delivered implementation using backed-up disposable variants.
   Run the queued-stop/failed-selection tests under both variants, record results and literal diffs, then restore all trial files.
   Verify the state file matches the fixed upstream tree and inspect the remaining hooks for accidental duplication or relocated policy.
   Re-run full repository check/lint/tests and the companion compatibility suite after restoration; do not reuse test results from a modified trial tree.
   Add the maintenance evidence document, update the current startup-sync guidance, and mark the architecture issue-20 step/node with `✅` and its factual `Landed:` note only if the acceptance evidence succeeds.
   Tests added while closing a discovered coverage gap need an explicit killing mutation for their own class; do not treat a type-error failure or source-count assertion as behavioral Red.
   Commit: `docs(pi-subagents): record startup reconciliation evidence`.
   Dispatch the fresh-context pre-completion reviewer through the normal `/tdd-plan` gate before handoff.
   If the replay benefit fails, stop and return to [#19]; do not mark the step landed or substitute report-only completion.

## Risks and Mitigations

- **Selection concentrated in another oversized orchestrator:** keep only selection attempt/acknowledgement state in the owner; reuse catalogue and lease modules, and forbid workspace/session/rendering responsibilities.
- **Observer composition changes observable ordering:** characterize callback, listener-detachment, recorded-error, and exception behavior before centralizing; keep initial and resumed notifications separate.
- **Acknowledgement confused with attempt completion:** retain the late-registration/no-provider acknowledgement regression at owner, manager, and real-tool boundaries where relevant.
- **Additional async boundaries alter ordinary startup:** use a synchronous no-provider branch and keep its factory-call assertion before awaiting anything.
- **Factory signal checks appear redundant:** retain their exact production placement and add the synthetic handoff characterization; no wrapper-only replacement is planned.
- **Mocks conceal missing wiring:** keep real record/manager/tool and real-loader suites; new narrow fixture doubles are limited to passive presentation records.
- **Upstream changes notification semantics rather than its implementation:** the adapter is a remaining compatibility seam; record this limit instead of claiming all terminal rewrites become mechanical.
- **Companion tests use a published-core dependency surface:** supplement them with core's real-provider contract and construction tests; do not claim those suite results establish every host/version combination.
- **Public type leakage:** keep new types out of service exports and verify the public declaration consumer after wiring, even though the intended public contract is unchanged.

## Open Questions

- No operator design choice remains open for this plan.
- Exact after-trial results and remaining reconciliation work are implementation acceptance evidence, not facts available at planning time.
- No new speculative follow-up is filed; presentation and overall outcome assessment already have [#21] and [#19].

[#19]: https://github.com/Jopqior/gotgenes-pi-packages/issues/19
[#21]: https://github.com/Jopqior/gotgenes-pi-packages/issues/21
