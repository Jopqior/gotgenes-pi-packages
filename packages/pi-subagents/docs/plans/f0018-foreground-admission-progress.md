---
issue: 18
issue_title: "Forward per-spawn admission observation to foreground selection progress"
---

# Forward foreground admission progress

## Release Recommendation

**Release:** ship independently

The architecture document contains no roadmap entry or release batch for this fork issue.
Only `@jopqior/pi-subagents` changes.
Under this workflow's strict classification, correcting observable streaming output on upgrade is breaking; the implementation commit must carry `!` and a `BREAKING CHANGE:` footer.
This recommendation does not authorize publishing.

## Problem Statement

A foreground invocation can remain in model/thinking selection without showing that activity in its tool card.
Its streamed details can continue presenting the caller's requested model/thinking rather than withholding the unresolved choice.
The runner already handles pending selection, but the real manager drops its admission observer callback.
Existing runner tests invoke that callback from a mock and therefore cannot detect the missing production connection.

## Goals

- Forward the per-spawn `onStarted` callback at actual admission, before child session creation.
- Show pending-selection activity and suppress unresolved caller model/thinking in subsequent foreground streaming updates.
- Prove the behavior through the real tool, manager, and record, without manually invoking admission callbacks.
- Preserve manager lifecycle notifications, session-created forwarding, foreground whole-run waiting, outcome consumption, and spinner cleanup.
- Classify the changed observable progress output as **breaking**, even though no configuration migration or public type change is needed.

## Non-Goals

- Reworking [#17]'s already-landed background selection boundary, cancellation protocol, or admission ordering.
- Altering the initial synchronous placeholder update emitted before `spawnAndWait()` is called.
- Adding immediate push updates, changing spinner cadence, or moving selection state onto public snapshots.
- Changing selector UI, service contracts, model authority, callback exception policy, or resume behavior.
- General observer fan-out refactoring or forwarding every optional lifecycle hook merely for symmetry.
- Opening an improvement phase or undertaking unrelated test-harness cleanup.

## Background

The issue is open and its author matches the authenticated operator, `Jopqior`.
The proposed narrow repair is unambiguous; no product-direction decision is needed.
The related fork issue [#17] is closed, and its closing comment explicitly leaves foreground progress to this issue.
Its real-manager tool-boundary test harness is already present and can be reused.
The fork open-issue sweep, including searches for `onStarted` and `selection`, found no other open issue, and the open-PR sweep returned none.
The newest backlog triage, `docs/triage/2026-09-18-backlog.md`, is inherited upstream context and has no entry for this fork issue.
No `f0018-*` plan or retro exists; the fallback `0018-*` retro concerns the unrelated upstream permission-system tool-call-limit removal, not prior work on this issue.

Verified source path:

1. `AgentTool.execute()` sends foreground execution to `runForeground()` with `onUpdate`.
2. `runForeground()` emits its initial placeholder, then calls `SubagentManager.spawnAndWait()` with `onStarted` and `onSessionCreated` callbacks that retain the live record.
3. `SubagentManager.create()` installs `buildObserver(options)` on the new record and starts a foreground record immediately.
4. `Subagent.run()` marks the record running and calls `onStarted` before `prepareSession()`.
5. `prepareSession()` marks selection pending, awaits the provider, validates and applies its pair, clears pending activity, and only then reaches workspace/session creation.
6. The runner's interval reads the retained record and calls `overlaySpawnPresentation()` to remove unresolved model/thinking or render the selected pair.

Currently `buildObserver().onStarted` calls only the manager observer.
It does forward `onSessionCreated`, but that signal cannot arrive while selection is held.
The defect is triggered by a registered provider leaving its selection promise pending long enough for a foreground progress update; it is not a session-creation failure.

The README's scope explicitly includes defects in core-owned surfaces.
This repair needs no dependency or companion-package changes and no new SDK mechanism.
Respect the fork's package identity and run package scripts from the repository root with `pnpm -C packages/pi-subagents`.

## Design Overview

### Evidence boundary

This is verification of the issue's supplied source diagnosis, not an interactive reproduction or a synthetic reproduction presented as live evidence.
At baseline `993d01cab49d8045d279962d8e39b4decc723f95`, the targeted test command below passed: measured **3 files and 138 tests**.
Those green tests do not prove the missing forwarding path works.
The implementation must first establish Red through that real path.

### Minimal forwarding repair

In `SubagentManager.buildObserver()`, retain the manager callback at its current position and invoke the existing per-spawn callback afterward:

```typescript
onStarted: (agent) => {
  this.observer?.onSubagentStarted(agent);
  options.observer?.onStarted?.(agent);
},
```

Do not add a new observer interface, event, state field, callback wrapper, or selection wait.
Keep existing exception propagation; this change does not promise isolated delivery when an observer throws.
Keep `onSessionCreated` unchanged.
The same manager composition serves foreground and background spawns, so admission tests must verify that queued records do not receive the callback until they actually start.

`onStarted` does not mean selection is already pending at the instant of the callback.
It provides the live record, whose state becomes pending in the subsequent `prepareSession()` call.
The existing interval then reads that current state.
After confirmation, the same reference exposes `selectedPair` before session construction finishes.
No callback or new snapshot is needed at either selection transition.

### Structural review and Tidy First

| Check                                | Evidence and disposition                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Dependency width and parameter relay | No interface grows; the existing per-spawn observer is already available in `buildObserver()` and consumed by the runner.      |
| Law of Demeter                       | The manager calls its supplied observer directly; no new collaborator traversal is introduced.                                 |
| Output arguments and resets          | The runner already owns its record reference; no new external mutation or reset lifecycle is added.                            |
| Repeated discriminators              | No selection conditional is added; the existing record state and presentation overlay remain authoritative.                    |
| Test mock depth                      | Existing mocked runner tests bypass the defective connection; the real-manager boundary harness supplies the missing coverage. |
| Missing abstraction                  | No new abstraction is warranted for forwarding the existing callback.                                                          |

The fresh-context Tidy-First assessment recommended no preparatory commits.
Its optional manager-test setup move is unnecessary if new admission tests live in a sibling describe block with their own manager ownership and disposal.
Do not overwrite the manager created by the existing forwarding group's `beforeEach`, which would leak its sweep interval.
Keep the integration harness's real timers and held phase gates rather than converting the file to fake timers.

## Module-Level Changes

- `src/lifecycle/subagent-manager.ts`: forward `options.observer?.onStarted?.(agent)` after the existing manager notification.
- `test/lifecycle/subagent-manager.test.ts`: add a focused admission-observation group using existing factory helpers; pin record identity, one delivery to each observer, foreground admission, and queued-background admission timing.
- `test/tools/spawn-selection-boundary.test.ts`: extend its real foreground boundary scenario to collect streamed details through a typed `onUpdate` spy and verify pending, selected-before-session, and completed phases.
- `src/tools/foreground-runner.ts`, `src/lifecycle/subagent.ts`, `src/ui/display.ts`, and `src/tools/agent-tool.ts`: predicted unchanged because the callbacks, live state, presentation branches, and tool routing already exist.
- `test/tools/foreground-runner.test.ts` and `test/helpers/manager-stubs.ts`: predicted unchanged; retain unit rendering tests and use existing configurable factory stubs.
- `README.md`, `docs/architecture/architecture.md`, and `.pi/skills/package-pi-subagents/SKILL.md`: predicted unchanged; no module layout, public status, service boundary, or documented selection/whole-run ordering changes.
  The architecture's selection sequence and its foreground whole-run note remain valid.

No export is added, removed, or renamed, and no public declaration bundle changes.
There is no roadmap step to mark landed.

## Test Impact Analysis

This is wiring repair, not an extraction.
It enables no new pure unit-test seam; the required addition is cross-layer coverage that deliberately keeps `AgentTool`, `SubagentManager`, and `Subagent` real while controlling the selection provider and session/task boundaries.
Keep the mock-based pending activity and presentation tests in `foreground-runner.test.ts`: they isolate the runner's rendering responsibility but are not evidence for manager forwarding.
Keep existing `onSessionCreated`, manager lifecycle, background selection, cancellation, and no-provider tests.
No existing test should require changed expectations.

For the integrated regression, supply a valid caller model different from the parent and an explicit caller thinking level, then select a different valid pair from the harness catalogue.
Retain an unrelated presentation tag such as `inherit context` to prove pending masking removes only unresolved model/thinking.
Use the existing held provider as the phase boundary and `settleBound` only to await a positive streamed update.
Once the provider has entered, assert every captured pending-phase update after the initial placeholder has pending activity, absent `modelName`, and the exact remaining tags.
Require at least one such update so filtering cannot false-green.
Keep the session factory unreached while selection is held.
After confirmation, keep its factory gate unresolved and await an update with the selected pair, then release the factory and hold the task.
Only releasing the task may complete the foreground tool.
After return, assert consumption and verify that another bounded spinner interval produces no further updates.
Use held gates, not elapsed-time guesses, as proof of non-completion.

Planning baseline command, to rerun during implementation:

```bash
pnpm -C packages/pi-subagents exec vitest run test/lifecycle/subagent-manager.test.ts test/tools/foreground-runner.test.ts test/tools/spawn-selection-boundary.test.ts
```

## Invariants at risk

- **Foreground callers receive the entire run, not merely confirmation.**
  The existing real `foreground whole-run boundary` test holds selection, factory, and task separately; extend rather than replace this proof with mock calls.
- **Background callers continue after confirmation without awaiting child work.**
  The existing real `sequential parent continuation` and `downstream workspace boundary` tests in `spawn-selection-boundary.test.ts` pin [#17]'s contract.
- **No-provider queued tools remain non-blocking.**
  The real `returns a no-provider spawn immediately while it is still queued` test in that file pins this constituency.
- **Lifecycle observers continue receiving manager notifications.**
  The existing `fires onSubagentCreated before onSubagentStarted for background agents` test in `subagent-manager.test.ts` remains, with new admission fan-out assertions alongside it.
- **Foreground delivery consumes the outcome and releases its spinner.**
  Existing runner unit tests pin consumption and error-path cleanup; the extended real-path regression adds successful completion and cleanup after a pending selection.

The named tests were opened during planning.
There is no quantitative performance or cache-prefix claim in this change.

## TDD Order

1. **Red → Green → Verify → Commit: restore real foreground admission progress.**
   Add manager admission tests in a separately owned describe group and extend the real foreground tool-boundary test as described above.
   Demonstrate Red for missing per-spawn callback delivery and missing pending updates before editing production code.
   Add the callback forwarding line without changing manager notification order or exception handling.
   Keep characterization assertions that already pass, but mutation-check their distinct invariants.
   Killing mutations and their expected victims:
   - Delete `options.observer?.onStarted?.(agent)` from `buildObserver()`: manager callback-delivery tests and the real pending-progress regression must fail.
   - Delete `this.observer?.onSubagentStarted(agent)`: the manager fan-out assertions must fail.
   - Invoke `options.observer?.onStarted?.(record)` from `create()` before queue scheduling: the queued admission test must fail before a slot opens, and duplicate-delivery checks must fail once admitted.
   - Replace the pending branch of `overlaySpawnPresentation()` with `return base`: the real pending details assertions must fail while activity can remain correct.
   - Remove the selected-pair branch of `overlaySpawnPresentation()`: the selected-before-session assertions must fail.
   - Delete `await record.promise` from `spawnAndWait()`: the real whole-run boundary assertions must fail.
   - Delete `record.markConsumed()` in `runForeground()`: the completion consumption assertion must fail.
   - Delete the success-path `clearInterval(spinnerInterval)` in `runForeground()`: the post-return no-update assertion must fail.
   Restore every mutation before verification and commit.
   Run the targeted command, then `pnpm -C packages/pi-subagents run check`, `pnpm -C packages/pi-subagents run test`, and `pnpm -C packages/pi-subagents run lint`.
   Suggested commit: `feat(pi-subagents)!: show pending foreground model selection (#18)`.
   Footer: `BREAKING CHANGE: Foreground progress updates after admission now identify pending model/thinking selection and omit unresolved caller model/thinking details until confirmation. No configuration migration is required; task completion and public service contracts are unchanged.`

After implementation, run the normal fresh-context pre-completion review before recommending `/ship`.
The implementing session should not repeat the Tidy-First assessment.

## Risks and Mitigations

- A mock manager can falsely validate this fix: the integration test must never invoke `onStarted` itself or stub `spawnAndWait()`.
- The initial placeholder precedes record creation: begin pending-phase assertions after the provider enters and exclude only that pre-spawn update.
- `onStarted` precedes `markAwaitingSelection()`: retain the live record, not a copied snapshot or a captured boolean.
- Timer waits can hide sequencing errors: use held phase gates for negative claims and bounded positive waits only for emitted progress.
- New manager setup can leak timers: give the new describe group its own construction and disposal; drain held tasks and providers through the existing integration cleanup.
- Broadening observer policy would enlarge the fix: preserve ordering and propagation, and do not catch, reorder, or fan out unrelated hooks.
- An interactive tool card is not exercised by these tests: they verify the actual streaming payload chain, not terminal rendering or cross-extension dialog arbitration.

## Open Questions

None block implementation.
No concrete follow-up work was identified for filing.
The release destination still requires explicit operator approval at release time.

[#17]: https://github.com/Jopqior/gotgenes-pi-packages/issues/17
