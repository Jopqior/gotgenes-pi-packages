---
issue: 17
issue_title: "Block subagent tool return until model selection completes"
---

# Hold the subagent tool through spawn selection

## Release Recommendation

**Release:** ship independently

There is no fork-issue entry or release batch for this change in the current architecture document, and no open improvement-phase heading.
Only `@jopqior/pi-subagents` production code changes; the selector's existing provider contract is sufficient.
The timing change is breaking under this repository's classification and requires a breaking commit footer.
Publishing remains a separate, explicitly approved operation.

## Problem Statement

The operator starts a background subagent, leaves its model/thinking form unanswered, and then sees the parent's `ask_user` dialog replace the form.
The background tool has already returned, leaving the child awaiting a choice the operator can no longer make through that form.
The startup interaction must finish before the spawning tool returns, without making a background invocation wait for the child's task.

## Goals

- Hold a new background tool invocation through concurrency admission and required model/thinking selection.
- Release it after a validated choice, before workspace preparation, session construction, or the task needs to finish.
- Preserve foreground whole-run waiting and the synchronous public `SubagentsService.spawn()` contract.
- Settle cancelled, interrupted, failed, and disposed selection waits without starting an unconfirmed child.
- Preserve the no-provider background path, including an immediate queued acknowledgement.
- Preserve selected-model/thinking presentation and existing public task statuses.
- Treat the change to the documented immediate-return contract as **breaking**, even though it fixes a bug and requires no configuration edit.

## Non-Goals

- Moving selection before admission, bypassing the concurrency limiter, or adding selection timeouts or automatic choices.
- Changing `pi-ask`, implementing a central UI queue, or synchronizing independently running sessions.
- Serializing tools that the SDK deliberately executes in a parallel batch.
- Changing service return types, publishing a new event, or exposing the selection latch on `SubagentRecord`.
- Re-asking on resume, changing model authority, changing workspace behavior, or refactoring the general result-delivery protocol.
- Fixing foreground pending-selection progress observation; that distinct wiring defect is tracked by [#18].

## Background

The issue is open and was authored by the authenticated operator, `Jopqior`.
Its body names no prerequisite issues.
The fork's open-issue and open-PR sweep found no other open issue or PR before the follow-up was filed.
The newest triage, `docs/triage/2026-09-18-backlog.md`, is inherited upstream context and contains no entry for this fork issue.
No matching fork or inherited issue-17 plan/retro exists in the applicable plans/retro directories.

Relevant current paths:

- `AgentTool.execute()` routes a new background invocation to `spawnBackground()` without forwarding the tool signal.
- `spawnBackground()` calls synchronous `manager.spawn()` and immediately renders a launch result, including an awaiting-selection branch.
- `SubagentManager.create()` constructs the record, then schedules background work through `ConcurrencyLimiter`; foreground work bypasses it.
- `Subagent.prepareSession()` opens selection only after admission, awaits and validates the provider, then prepares the workspace and creates the child.
- `Subagent.promise` means the whole run, not selection completion; awaiting it would incorrectly turn a background tool into a foreground one.
- `stopQueued()` does not enter `run()`, and `ConcurrencyLimiter.clear()` settles scheduled promises without invoking their thunks.
- `SubagentManager.dispose()` currently clears the limiter and map without stopping queued records or cancelling a pending provider; an independent selection latch must not depend on a scheduled thunk eventually running.
- The companion's `ModelSelector.select()` already returns a promise, and its `SelectionQueue` cancels its own requests; neither owns the parent's tool-return boundary.

Scope fits the core's existing ownership of spawning and concurrency.
Keep the dependency direction inward: core code must not import the companion or know about `ask_user`.
There is no `package-pi-subagents-model-selector` skill in this checkout; its README and named source files were inspected instead.
All implementation commands run from the repository root using `pnpm -C packages/pi-subagents ...`.

## Design Overview

### Evidence and operator decision

This plan verifies the issue's supplied source trace; it does not claim an independently reproduced interactive dialog replacement.
The existing targeted suite passed at planning time: measured **6 files and 358 tests**, against `f837f3f6b3bb32d5f4ab8fe4395fac43df7e82a3`.
Those tests do not currently pin the real tool-return boundary.

The operator explicitly chose to retain **admission before selection** rather than selecting before queueing.
Consequently a provider-enabled background tool waits for its queue slot as well as the choice.
An occupied slot drains from the independently running task's promise, not from the spawning tool's return; the tool wait must not acquire a slot or join the limiter itself.
Each extension instance constructs its own manager and limiter in `src/index.ts`, so a descendant is not automatically competing for its ancestor's slot.
These facts avoid an intrinsic limiter/tool cycle, not every application-level dependency cycle.
A running sibling that requires further parent tool activity can still block queue admission while the parent waits; cancellation is the escape, and this accepted trade-off must be documented.
No timeout or deadlock detector is introduced.

### Record-owned initial selection outcome

Add an internal, one-shot selection outcome to `Subagent`, separate from public status and the whole-run promise.
Use a discriminated value rather than making callers reconstruct success from `awaitingSelection === false`.
The absence of that activity can mean queued, cancelled, failed, or successfully selected.

```typescript
type SpawnSelectionOutcome =
  | { kind: "not-required" }
  | { kind: "selected" }
  | { kind: "stopped" }
  | { kind: "failed"; error: string };

// Internal lifecycle API, not exported through service/service.ts.
waitForSpawnSelection(signal?: AbortSignal): Promise<SpawnSelectionOutcome>;
```

The outcome owns only selection success/failure, not task completion or session readiness.
The selected pair stays on the existing `selectedPair` property.
Create the deferred at record construction, resolve once, and never reset it for resume.
Store settlement/cleanup together on the owning record; do not pass resolver callbacks through `AgentSpawnConfig`, observers, and session construction.

Required transitions:

| Situation                                               | Outcome and timing                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| No provider and no selection already required/in flight | `not-required`; do not wait for admission or session creation                                                                               |
| Active provider, still queued                           | Pending until admission and selection, or cancellation                                                                                      |
| Provider returns a valid pair                           | Check cancellation, apply pair, clear pending activity, detach startup-only listeners, then resolve `selected` before workspace preparation |
| Provider cancels or selection signal closes             | Existing stopped terminal funnel, then `stopped`                                                                                            |
| Catalogue/validation/provider failure                   | Existing error terminal funnel, then `failed` with the recorded error                                                                       |
| Queued run stopped before admission                     | `stopQueued()` settles the outcome immediately without running a provider                                                                   |
| Manager disposed with a selection wait outstanding      | Stop that initial startup, settle it, then discard scheduled work and records                                                               |

Resolve the outcome at the transition that owns it, not by polling and not in a tool-side timer.
Do not resolve success in `finally`: failure and cancellation also clear activity.
Read the settled outcome before consulting the current provider so revocation cannot rewrite a completed selection.
Once a tool has established that selection is required, a later missing provider is not permission to bypass it.
A closed child handle must also be distinguished from a never-configured root even if its root provider is still active.
Keep that requirement and its closure listener alive across queue admission.
If no provider exists when the tool enters its startup wait, it retains the existing non-blocking behavior; registering a provider later cannot retroactively hold a returned tool, although admission still consults the live scope as before.

### Cancellation and teardown

Race the in-flight provider result against the gate's combined cancellation signal inside the lifecycle owner.
A provider that ignores abort must not keep the tool, foreground run, or concurrency slot waiting indefinitely.
Observe the provider promise's later rejection and ignore its late result; the losing branch must not apply a pair, prepare a workspace, create a child, or terminate the record again.
Check cancellation before invoking a provider with an already-aborted signal and again before applying its result.
Retain the existing checks after workspace preparation and during factory work.

The tool signal is a **startup-only** cancellation lever for background invocations.
Attach it while admission/selection is outstanding and remove it synchronously at selection settlement, not after workspace preparation or after the tool's next continuation.
Do not pass it as background `AgentSpawnConfig.signal`, which would bind the entire background task to a later parent interrupt.
Cancellation dispatches to `stopQueued()` for a queued record and `abort()` for an admitted one; the existing `abort()` alone cannot stop a queued record.
Scope closure must also settle a queued selection wait before a slot opens.
Listeners must be removed on success, cancellation, failure, and disposal, including pre-aborted signal handling.

Limit manager-disposal changes to unfinished startup selection; do not redesign running-session shutdown or abort policy.
Before `dispose()` loses record reachability, ask each record to cancel any outstanding initial selection/selection wait.
A selected background task remains governed by existing interruption policy.
The whole-run promise, terminal observer, and selection outcome must each settle once on the active-selection path.
A queued cancellation must not emit again when its scheduled thunk later no-ops.

### Tool integration and presentation

Add a narrow internal manager operation `waitForSpawnSelection(id, signal?)` that delegates to the record and rejects an unknown ID explicitly.
It is not a new service method and adds no fields to public snapshots.
The background consumer follows this pattern:

```typescript
const id = manager.spawn(snapshot, type, prompt, options);
const selection = await manager.waitForSpawnSelection(id, signal);
const record = manager.getRecord(id);
return renderLaunchOrSelectionFailure(id, selection, record);
```

The tool does not traverse the scope/provider or mutate lifecycle state.
`AgentTool.execute()` forwards its signal only to the background startup operation.
`spawnBackground()` becomes asynchronous, but its no-provider path still returns without waiting for the child or its queue slot.
The existing tool entry point is already asynchronous.

For selected runs, render the selected pair through `overlaySpawnPresentation` and say that selection is confirmed and background startup can proceed.
Do not claim the session or output file already exists: a slow workspace/factory must not hold the result.
Keep ordinary no-provider launch/queue wording unchanged.
Remove the final successful result that says selection is still pending.
For stopped/failed selection, return the ID and accurate startup outcome, not a background success or a promise that the child is running.
Keep background completion notification/result collection as its existing carrier; the startup acknowledgement must not claim or consume a successful task's eventual outcome.
Use existing result-rendering conventions for failure details rather than adding new statuses or result schemas.
Do not expose the caller's proposed model as a confirmed choice on a cancelled/failed selection result.

Foreground still calls `spawnAndWait()` and waits for the entire run.
It benefits from prompt cancellation settlement but does not adopt the background early-return boundary.

### Coverage boundary

The guarantee applies to a sequential parent continuation: `await subagent(...)`, then `ask_user(...)` cannot reach the second operation while selection is pending.
The installed `@earendil-works/pi-agent-core` **0.84.4** implementation of `executeToolCalls` chooses sequential execution only when configured or when a tool declares sequential mode; otherwise it executes a batch in parallel.
Therefore this plan does not promise mutual exclusion for already-parallel tool calls, descendant-initiated selection against an independently running root, other extensions' dialogs, or direct synchronous service callers.
No SDK execution-mode change is planned.

### Structural review

| Check                     | Decision                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Dependency width / ISP    | Add one ID-and-signal manager operation; no options bag growth or new domain-object parameter                     |
| Law of Demeter            | Tool tells manager to wait; manager delegates to the record; only record reads selection scope                    |
| Output arguments / resets | Deferred and listener cleanup are private record state; resume does not reset initial selection                   |
| Parameter relay           | Existing tool signal crosses the background boundary to its owner; no callback chain through session construction |
| Repeated decisions        | Selection outcome is decided once by lifecycle; formatter only exhaustively renders it                            |
| Test mock depth           | Update the shared manager fixture, but integration tests instantiate the real manager and record                  |
| Abstraction size          | No generic scheduler, global UI broker, or separate helper module is required                                     |

Tidy-First found no required preparatory refactor.
The optional formatting extraction is not accepted as a separate step: relocating the existing statements does not supply the lifecycle abstraction this change needs.
Keep any small private rendering helper local if the behavior step needs one.

## Module-Level Changes

All paths below are under `packages/pi-subagents/` unless stated otherwise.

- `src/lifecycle/subagent.ts`: initial outcome type/deferred, internal waiting/cancellation behavior, provider-abort race, transition-owned settlement, late-result protection, and queued-stop settlement.
- `src/lifecycle/subagent-manager.ts`: internal ID-based wait delegation and outstanding-selection disposal before clearing the queue/map.
- `src/tools/background-spawner.ts`: async selection boundary, startup signal, honest selected/stopped/failed rendering, and removal of final pending-selection success wording.
- `src/tools/agent-tool.ts`: narrow manager interface addition, signal forwarding, and replacement of the unconditional “Returns agent ID immediately” parameter description with the conditional selection-wait contract.
- `test/lifecycle/subagent.test.ts`: focused outcome/cancellation cases within existing lifecycle groups; strengthen current abort/revoke tests to settle before resolving the provider.
- `test/lifecycle/subagent-manager.test.ts`: manager wait/disposal/queue coverage while retaining synchronous-ID and admission-order tests.
- `test/lifecycle/nested-selection.test.ts`: assert cancellation releases an active slot before the provider returns; queued cancellation and root/child closure isolation.
- `test/tools/background-spawner.test.ts`: await async results in the behavior step; replace pending-result expectations with held-selection assertions and selected/failure output cases.
- `test/tools/agent-tool.test.ts`: signal wiring, conditional description, and async background routing assertions.
- `test/helpers/make-deps.ts`: add a typed default for the new manager method without changing the shared completed-record default.
- `test/helpers/make-deps.test.ts`: keep structural compatibility assertions for the extended manager slice.
- New `test/tools/spawn-selection-boundary.test.ts`: real `AgentTool` → manager → record integration with separate deferred admission, selection, workspace/factory, and task boundaries.
- `README.md`: document tool versus service return timing, admission wait, cancellation, dependency-wait trade-off, and sequential/cross-session coverage boundary.
- `docs/architecture/architecture.md`: update the `subagent.ts` and background-spawner layout descriptions, internal class methods, and execution-flow diagram to distinguish synchronous ID return, selection completion, and task completion.
  No roadmap completion mark applies because this is not a roadmap step.
- Repository `.pi/skills/package-pi-subagents/SKILL.md`: update the spawn-selection paragraph with the tool boundary while preserving service, lease, and public-record constraints.

Predicted unchanged, with explicit checks:

- `src/service/service.ts`, `src/service/service-adapter.ts`, and public declaration shape: no service method/signature or snapshot field changes.
- `src/lifecycle/concurrency-limiter.ts`: existing FIFO admission and task-driven drain remain sufficient; the waiting tool never schedules another thunk.
- `src/lifecycle/spawn-selection.ts` and `selection-scope.ts`: existing closure signals suffice; do not change provider ownership or registration authority.
- `src/lifecycle/subagent-state.ts`: no public status or result-consumption redesign; initial selection synchronization stays on `Subagent`.
- `src/tools/foreground-runner.ts` and its tests: whole-run semantics remain; the independent progress-observer fix belongs to [#18].
- `src/index.ts`: the real manager structurally satisfies the expanded tool interface; no new constructor dependency is needed.
- `test/helpers/make-subagent.ts`: new private fields initialize in the real constructor, not as required fixture inputs.
- Companion source/tests/manifest/README: its promise, cancellation queue, and admission-order documentation remain valid; the new tool-return documentation lives in the core README.
  Its generic “pending selection” limitation does not promise an immediate final tool result.

## Test Impact Analysis

This is a lifecycle boundary change, not an extraction.
The new internal wait gives tests a direct selection milestone instead of conflating selection with full task completion.
No existing layer's tests become redundant: selection validation, scope inheritance, FIFO admission, foreground rendering, public service snapshots, and result delivery cover different contracts.

The shared tool fixture currently returns a completed record from `getRecord()` even in background launch tests.
Do not globally turn it into a running record; use explicit running/queued fixtures in the affected background cases and keep foreground/resume fixtures intact.
Update all direct `spawnBackground()` result reads in the same commit as its async conversion.

Use `Promise.withResolvers` and explicit phase-entry signals, not elapsed sleeps, to prove a wait remains pending.
A bounded test timeout is only a failure bound, not the pending-state assertion.
The sequential regression's second operation can be an `ask_user` spy: that proves ordering at the real tool boundary, not actual TUI replacement.
Also run the original operator scenario manually in a fresh interactive session before implementation handoff and record what was actually observed.
Do not mistake the running session's stale extension code for the new implementation.

## Invariants at risk

| Constituency / invariant                                   | Existing test or required additional pin                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Service consumers receive an ID synchronously              | `subagent-manager.test.ts`: “returns the id synchronously while the selection is pending”; retain service-adapter coverage               |
| Queued work selects only after admission                   | `subagent-manager.test.ts`: “holds a queued record's selection until the limiter admits it”                                              |
| Core-only users retain same-turn factory invocation        | `subagent.test.ts`: “keeps the ordinary timing when the scope holds no provider”; manager admission-timing group                         |
| Operators never launch unconfirmed work                    | Existing selection-gate cancellation/validation tests; add cancellation without provider cooperation and late-result assertions          |
| Independent roots/children retain lease isolation          | `nested-selection.test.ts` root-revocation and queued/active-abort groups; assert wait settlement as well as factory calls               |
| Background callers do not wait for task completion         | New real-manager boundary tests with workspace, factory, and turn-loop promises held independently                                       |
| Returned background work is not tied to the startup signal | New test aborts the original tool signal after selection while child work remains active                                                 |
| Foreground callers receive the final outcome               | New real-manager foreground case holds through selection and task completion; existing foreground renderer tests remain                  |
| Operators see the selected pair, not argument guesses      | Existing foreground selected-pair tests and new background selected-pair assertions; pending progress wiring separately tracked by [#18] |
| Lifecycle subscribers get one terminal transition          | New queued/active cancellation tests count terminal observer calls before and after a late provider result                               |

The named lifecycle/foreground test sections were opened during planning.
In particular the existing foreground pending-progress tests mock the missing manager callback; they are not evidence for the real observation invariant.

## TDD Order

1. **Introduce a passive initial-selection outcome on the lifecycle owner.**
   Red: add record tests that observe selected/not-required/stopped/failed outcomes independently of the whole-run promise, including a held workspace/factory and queued `stopQueued()`.
   Green: add the record-owned one-shot state and transition settlement without changing tool return timing, admission order, or provider cancellation behavior yet.
   Keep the first step observational: do not introduce abort races or disposal policy changes until the behavior step.
   Verify: run lifecycle suites and package typecheck; preserve existing same-turn no-provider assertions.
   Killing mutations: move successful settlement after `createSubagentSession` for the early-boundary class; omit settlement from `stopQueued()` for queued stops; resolve `selected` from the failure funnel for outcome classification; reset the outcome on resume for one-shot semantics.
   Commit: `refactor(pi-subagents): expose internal spawn selection completion (#17)`.

2. **Hold the tool through selection and make startup cancellation settle.**
   Red: add background and lifecycle tests for pending selection, selected early return, queued waiting/cancellation, scope closure while queued, pre-aborted tool signal, non-cooperating provider abort/rejection, disposal, and signal detachment on confirmation.
   Strengthen existing lifecycle/nested tests so they assert settlement or slot release before returning the provider's late result.
   Green: implement the internal manager delegation, temporary signal/closure listeners, provider cancellation race, targeted disposal cleanup, background async wait and result classification, and tool signal forwarding.
   Update `AgentToolManager`, `BackgroundManagerDeps`, the shared typed manager fixture, and all async background call sites in this same cycle.
   Update the agent-facing immediate-return description here so the behavior commit has an accurate contract.
   Verify: package tests and typecheck, especially fixture structural tests and foreground whole-run cancellation.
   Killing mutations by class: remove the background `await manager.waitForSpawnSelection(...)` for pending-selection tests; await `record.promise` instead for early-release tests; drop startup signal forwarding for tool-interrupt tests; omit the closure listener while queued for revocation tests; remove the cancellation arm of the provider race for uncooperative-provider tests; apply the selected pair before the cancellation check for late-result tests; retain the startup listener after `selected` for post-confirmation interrupt tests; omit selection cancellation from manager disposal for teardown tests.
   Commit: `feat(pi-subagents)!: wait for model selection before returning background spawns (#17)`.
   Footer: `BREAKING CHANGE: With a spawn-selection provider, background subagent tools now wait for concurrency admission and model/thinking selection before returning. They still return before the background task completes. Public service spawn remains synchronous; without a provider, background tools remain non-blocking.`

3. **Pin the real tool boundary and sequential continuation.**
   Red/characterization: add the focused real-manager integration test without mocking `spawn`, the record, or the selection wait.
   Hold the provider, run the actual background `AgentTool.execute()`, and prove a following `ask_user` spy cannot run; confirm selection and prove that continuation runs while child work remains held.
   Exercise the queued variant, no-provider queued return, foreground whole-run wait, cancellation/failure, and startup signal detachment through this same production chain.
   Most positive cases should already pass after step 2; explicitly apply the killing mutations rather than calling already-green assertions a Red cycle.
   Killing mutations: remove the background selection await for sequential-continuation tests; move selection settlement after workspace/factory/run completion for each held downstream boundary; make the no-provider wait await admission for the ordinary queued case; replace foreground `await record.promise` with the selection wait for the foreground completion case.
   Green: restore mutations; fix only discrepancies in the selected design, not the separate progress-observer defect.
   Verify: run the new file, full core suite, package typecheck, and unchanged companion suite.
   Commit: `test(pi-subagents): pin sequential parent selection boundaries (#17)`.

4. **Document the contract and verify the original scenario.**
   Update the README, architecture layout/class/sequence descriptions, and package skill listed above.
   Load `mermaid` and `writing-for-agents` before the diagram and skill edits.
   Run the original background-then-`ask_user` scenario in a fresh session with local core and selector: leave selection pending, verify the parent has no result yet, confirm it, and verify the parent continues before the child finishes.
   Also verify cancelling the chooser returns control without child creation.
   Record the manual outcome and environment in implementation retro notes; do not claim unperformed interactive verification.
   Verify package checks plus repository checks required by the pre-completion gate, and lint the changed markdown.
   Commit: `docs(pi-subagents): explain startup selection waiting and limits (#17)`.

Implementation verification commands:

```bash
pnpm -C packages/pi-subagents run check
pnpm -C packages/pi-subagents run test
pnpm -C packages/pi-subagents run lint
pnpm -C packages/pi-subagents run verify:public-types
pnpm -C packages/pi-subagents-model-selector run test
```

Run package typechecking immediately after any shared-interface step.
The public-types check guards the predicted unchanged service boundary rather than authorizing an API expansion.
Finish `/tdd-plan` with the fresh-context pre-completion reviewer; do not publish from the implementation stage.

## Risks and Mitigations

- **Parent dependency waits under full concurrency:** retaining admission order can hold the parent behind a task that needs it; document this accepted trade-off and prove queued interruption needs neither a free slot nor a provider response.
- **Signal lifetime leak:** a background task must not inherit the startup-only tool signal; detach at the lifecycle selection transition, and test an interrupt immediately after confirmation with downstream work held.
- **Premature success:** clearing activity is not evidence of confirmation; resolve a typed outcome only after validation and liveness checks.
- **Abandoned providers:** race cancellation, observe late rejection, and keep side effects outside the losing promise branch.
- **Dropped queued latch:** settle queued stop/closure/disposal before record removal; limiter-promise settlement alone is insufficient.
- **Misleading presentation:** selected means approved startup, not a constructed session; preserve the selected-pair overlay and avoid advertising background success for cancelled selection.
- **Overclaiming UI protection:** real sequential ordering is covered; parallel SDK batches and cross-session dialogs remain outside this mechanism.
- **Stale live code during verification:** restart Pi for the interactive acceptance check because this session's extension modules do not reload themselves after edits.

## Open Questions

No implementation-direction question remains open.
The operator selected admission-first waiting and accepted its queue-wait trade-off.
Foreground progress observation is separately actionable as [#18], not a prerequisite to this tool-return fix.
The manual UI reproduction remains an implementation verification obligation, not a planning-time measured result.

[#18]: https://github.com/Jopqior/gotgenes-pi-packages/issues/18
