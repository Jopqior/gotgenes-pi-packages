# Initial selection startup reconciliation

This is a fixed-source reconciliation trial for [#20], not a prediction of future conflicts or maintenance time.
The upstream input is `edb35ee28535aac4e12431e47e440f6933911834`, the planning implementation is `213513eb3f38157ddde17b069815f4701ee7ecf7`, and the delivered implementation tested here is `935cdd578b7b1af4da4beceb4707244d74264cb3` (all resolved with `git rev-parse`).
The upstream method bodies came verbatim from `packages/pi-subagents/src/lifecycle/subagent.ts` at that fixed upstream commit; no invented replacement logic was used.

## Replay method and result

For each method and implementation, replace only that method body with the fixed-upstream body, leaving its enclosing comment intact.
Run the focused test command on the unchanged control and the transplanted variant separately:

```bash
pnpm --filter @jopqior/pi-subagents exec vitest run test/lifecycle/subagent.test.ts -t 'settles the initial selection outcome as stopped|resolves failed with the recorded error when validation rejects the pair' --testTimeout=1500
```

For the planning baseline, the trial also restores that commit's `subagent-state.ts`, `subagent.test.ts`, `make-subagent.ts`, and `make-deps.ts` so the old record and its test fixtures execute together.
All five touched working files were backed up under `/tmp/pi-subagents-issue20-replay/` and restored byte-for-byte in a `finally` block; the local, disposable artifacts include `baseline-{stopQueued,failRun}.diff`, `{baseline,delivered}-{stopQueued,failRun}-{control,transplant}.log`, `command.txt`, and the root/companion gate logs.
The working tree was clean after restoration.

| Implementation           | Replacement    | Control                       | Transplant                                 | Focused result                                                                              |
| ------------------------ | -------------- | ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Planning baseline        | `stopQueued()` | exit 0, 2 passed, 206 skipped | exit 1, 1 passed, 1 timed out, 206 skipped | The queued-outcome test at line 482 timed out at the explicit 1500 ms bound.                |
| Planning baseline        | `failRun()`    | exit 0, 2 passed, 206 skipped | exit 1, 1 passed, 1 timed out, 206 skipped | The invalid-pair failure-outcome test at line 2542 timed out at the explicit 1500 ms bound. |
| Delivered implementation | `stopQueued()` | exit 0, 2 passed, 214 skipped | exit 0, 2 passed, 214 skipped              | The body already matches upstream; no selection-specific repair.                            |
| Delivered implementation | `failRun()`    | exit 0, 2 passed, 214 skipped | exit 0, 2 passed, 214 skipped              | The body already matches upstream; no selection-specific repair.                            |

These are the literal zero-context transplanted diffs against the planning baseline (one method at a time); the full-context diffs are in the local `.diff` files above:

```diff
--- baseline/subagent.ts
+++ baseline/subagent.ts+upstream-stopQueued
@@ -857 +856,0 @@
-		this.settleSelectionOutcome({ kind: "stopped" });
```

```diff
--- baseline/subagent.ts
+++ baseline/subagent.ts+upstream-failRun
@@ -962,2 +961,0 @@
-		// markError above recorded the formatted message this outcome reports.
-		this.settleSelectionOutcome({ kind: "failed", error: this.error ?? "" });
```

Both corresponding delivered-implementation diffs are empty: `stopQueued()` and `failRun()` already contain the exact fixed-upstream method bodies.
The tests pass there because the record composes `onRunFinished` at construction: it calls the original observer first and then hands the recorded status/error to `InitialSpawnSelection.finished()`.
This removes the separate terminal-method settlement obligation; it does not remove the requirement that an incoming terminal method record the error/stop and notify after cleanup.
`git diff --exit-code edb35ee28535aac4e12431e47e440f6933911834:packages/pi-subagents/src/lifecycle/subagent-state.ts 935cdd578b7b1af4da4beceb4707244d74264cb3:packages/pi-subagents/src/lifecycle/subagent-state.ts` produced no diff.
Ordinary lifecycle state therefore needs no pending-selector field reconciliation against this fixed upstream tree.

## Changed responsibilities and remaining integration

The delivered owner is limited to the provider attempt, authenticated catalogue validation, pending activity, retained pair, abort race, startup listener lifetime, and one-shot acknowledgement.
It does not construct a session or workspace, register a scope, or render output.
`SubagentManager.create()` still supplies spawn identity, snapshot availability, and its retained scope; the record still begins selection after admission, delegates wait/disposal, composes the terminal observer, checks the permit after workspace preparation, and passes only pair/signal into its existing factory parameter literal.
The tool's sequential boundary still waits on the manager's selection milestone, while service `spawn()` remains synchronous and the no-provider queued acknowledgement remains non-blocking.

`index.ts` still captures the inherited scope during extension initialization and wraps the whole factory call in `constructChild()`.
The shutdown handler still closes the scope before unpublishing or disposing the manager.
`create-subagent-session.ts` still checks `selectionSignal` before SDK creation and disposes a session returned after cancellation before binding extensions.
`selection-catalogue.ts` retains authenticated availability and thinking validation, now accepting only the required registry capability.
Loader initialization timing, cross-module scope/marker identity, SDK factory checks, error-recording-before-notification order, and late-created-session disposal remain host/upstream compatibility obligations.
An upstream rewrite that removes or reorders terminal notification still requires semantic review; the successful body transplant does not prove arbitrary future rewrites merge automatically.
The owner and its observer adapter are new abstraction upkeep, even though the two tested terminal methods and ordinary state file no longer require selection-specific patches.

The plan's module-level inventory was checked against `git diff --name-only 213513eb3f38157ddde17b069815f4701ee7ecf7 HEAD -- packages/pi-subagents/src packages/pi-subagents/test` and the file diffs:

| Planned surface                                                                                                      | Delivered files or deviation                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Production owner, record, manager, state, catalogue, and two tool modules                                            | Exactly those seven production paths changed; no other production module changed.                           |
| Owner/record/manager/state/catalogue/factory/tool tests and listed helper fixtures                                   | Changed as planned; the state-only pending-selection test was removed after owner/record coverage.          |
| `test/tools/spawn-selection-boundary.test.ts`                                                                        | Unchanged, still exercised in the complete core suite.                                                      |
| `test/observation/notification.test.ts`                                                                              | Additional runnable fixture switched from `createTestSubagent()` to `createRunnableTestSubagent()`.         |
| `test/tools/agent-tool.test.ts`                                                                                      | Additional runnable resume fixture switched to the real owner, alongside the planned outcome import update. |
| `test/tools/get-result-tool.test.ts`                                                                                 | Additional runnable wait/carrier fixtures switched to the real owner.                                       |
| Predicted unchanged construction, shutdown, public service, runtime, UI, README, configuration, and companion source | No changes; reviewed README and configuration claims remained accurate.                                     |
| Package manifests and `pnpm-lock.yaml`                                                                               | No changes.                                                                                                 |

The three additional runnable fixtures inject a real owner rather than weakening their assertions; `test/service/service-adapter.test.ts` uses the planned passive owner fixture for its direct constructor.

After trial restoration, `pnpm run check`, `pnpm run lint`, `pnpm -r run test`, `pnpm --filter @jopqior/pi-subagents-model-selector run test`, and `pnpm fallow dead-code` all exited 0.
The root test run included core 86 files/1984 tests and companion 9 files/68 tests; the separate companion run passed 9 files/68 tests.
Fallow reported no dead-code issues; root lint reported no warning markers.
These are layered local tests, not an interactive host replay or a packed-new-core compatibility test for the companion.
The README's spawn/provider timing and `docs/configuration.md`'s later-authority claims were reviewed against the unchanged tool and catalogue boundaries and needed no edits.

[#20]: https://github.com/Jopqior/gotgenes-pi-packages/issues/20
