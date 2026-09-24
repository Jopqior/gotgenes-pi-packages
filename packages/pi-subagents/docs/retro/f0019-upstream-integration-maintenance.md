---
issue: 19
issue_title: Reduce upstream integration maintenance for pi-subagents while retaining selector capabilities
---

# Investigation: upstream integration maintenance

## Stage: Improvement Planning (2026-09-24T08:31:52Z)

### Status and scope

Investigation checkpoint, not an implementation plan or an approved roadmap.
The maintenance objective remains open; passing existing tests and writing this report do not complete it.
No production changes, fetch, merge, GitHub mutations, release, or publication occurred during this investigation.
The generic improvement workflow's pull step was skipped to honor the issue's fixed, no-fetch baseline.

Retain selector behavior unless the operator explicitly approves a change.
Do not select a refactoring mechanism, package boundary, task count, or implementation sequence from this inventory alone.
Concrete implementation design belongs in subsequent `/plan-issue` sessions.

### Reproducible baseline

The recorded fork snapshot and the current implementation are identical: `746a4ae812a574d0496cb46c125a32961a608cf1`.
The fixed upstream baseline and local `upstream/main` both resolve to `edb35ee28535aac4e12431e47e440f6933911834`.
The working tree was clean before investigation.
These are local Git objects, not a claim about the current remote upstream.

```bash
git rev-parse HEAD upstream/main
git diff --stat edb35ee28535aac4e12431e47e440f6933911834 746a4ae812a574d0496cb46c125a32961a608cf1 -- packages/pi-subagents/
git diff --name-status edb35ee28535aac4e12431e47e440f6933911834 746a4ae812a574d0496cb46c125a32961a608cf1 -- packages/pi-subagents/
git diff edb35ee28535aac4e12431e47e440f6933911834 746a4ae812a574d0496cb46c125a32961a608cf1 -- packages/pi-subagents/
```

Measured direct-tree inventory, independently reproduced from `git diff --numstat`:

| Area                | Changed files | Added lines | Removed lines |
| ------------------- | ------------- | ----------- | ------------- |
| Runtime source      | 21            | 1214        | 75            |
| Tests and helpers   | 22            | 3969        | 48            |
| Other package files | 13            | 1591        | 64            |
| Total               | 56            | 6774        | 187           |

These are inventory values, not success metrics.
The runtime-source category includes a comment-only package-identity change in `src/layered-settings.ts`; not every changed source file carries a selector integration obligation.
New selection modules, modifications to upstream-owned execution paths, public API additions, presentation changes, and package identity have different review costs.

### Cause hypothesis and findings

The initial hypothesis was that selector maintenance is dominated by temporal coupling to core startup, cancellation, and tool return rather than chooser UI complexity.
Source inspection supports that as an integration-review problem, not proof that a particular extraction would improve it.
The architecture's named concepts of lifecycle state, result delivery, and generative hooks explain the interaction: selection injects a pair before child creation, while the spawning tool observes an earlier milestone than task completion.

#### Integration obligations

Paths below are relative to `packages/pi-subagents/` unless otherwise stated.
The rows describe review surfaces, not proposed tasks.

| Incoming upstream change                                   | Fork behavior that must survive                                                                                                                                                                                                   | Source anchors                                                                                                                                                              | Existing verification and residual obligation                                                                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admission, initial run, terminal funnels, manager disposal | Select after admission and before workspace/session effects; resolve the initial milestone without waiting for task completion; release unfinished selection even if the provider ignores abort; preserve confirmed-task disposal | `src/lifecycle/subagent.ts`: `prepareSession`, `waitForSpawnSelection`, `cancelInitialSelection`, terminal methods; `src/lifecycle/subagent-manager.ts`: `spawn`, `dispose` | `test/lifecycle/subagent.test.ts` selection blocks and manager selection/disposal cases; distinguish completed startup from whether a tool observed it, including late registration                           |
| Resource loading, factory placement, runtime construction  | Every child captures its own inherited handle during factory initialization, even without a configured provider; children cannot replace the root provider                                                                        | `src/index.ts`: scope capture and factory wrapper; `src/lifecycle/selection-scope.ts`; `src/lifecycle/spawn-selection.ts`; `src/runtime.ts`                                 | `test/lifecycle/construction-inheritance.test.ts` exercises the real resource loader and production wrapper, but stubs SDK session creation; `nested-selection.test.ts` checks descendant behavior separately |
| Shutdown and asynchronous session creation                 | Close root/subtree authority before teardown; recheck gated cancellation around SDK creation; dispose a session returned after cancellation before binding                                                                        | `src/handlers/lifecycle.ts`: `handleSessionShutdown`; `src/lifecycle/create-subagent-session.ts`: `selectionSignal` checks                                                  | `test/handlers/lifecycle.test.ts` and `test/lifecycle/create-subagent-session.test.ts` gated-run cases; real-loader inheritance and cancellation proofs are layered rather than one full host scenario        |
| Tool execution, service API, run observers                 | Background tool waits for selection only; foreground waits for the whole run; service `spawn()` remains synchronous; no-provider queued acknowledgement remains non-blocking; admission progress reaches foreground               | `src/tools/background-spawner.ts`; `src/tools/foreground-runner.ts`; `src/tools/agent-tool.ts`; manager `buildObserver`; `src/service/service-adapter.ts`                   | `test/tools/spawn-selection-boundary.test.ts` uses real tool/manager/records with held factory/task/workspace gates; manager tests pin observer delivery; the harness is not a real SDK tool loop             |
| Model resolution and authenticated catalogue               | Ordinary resolution happens first; selected model/thinking override those fields only; validate against spawning-session availability and supported thinking; failure never silently inherits a pair                              | `src/session/selection-catalogue.ts`; `subagent.ts`: `obtainSelection`, `prepareSession`; `src/service/service.ts`                                                          | Catalogue tests and selected-pair factory assertions; upstream model/thinking vocabulary changes still require compatibility review                                                                           |
| Tool cards, widget activity, presentation tags             | Pending choice hides provisional model/thinking; confirmed choice supplies display values; public status stays `running`, private activity stays out of public snapshots                                                          | `src/ui/display.ts`; foreground/background runners; `src/ui/agent-widget.ts`; `src/ui/widget-renderer.ts`; service snapshot mapping                                         | Display/widget tests and foreground real-path boundary assertions; upstream display formula changes must also reach the fork overlay                                                                          |

The companion already owns the interactive form and FIFO chooser queue separately from core execution.
Inspection of `packages/pi-subagents-model-selector/src/index.ts`, `model-selector.ts`, and `selection-queue.ts` confirmed initialization-time service capture, inherited-registration no-op, TUI-only attachment, and cancellation-aware queueing.
Its README additionally records scoped/all catalogue behavior, explicit submission, no remembered default or retry, and resume without reselection; these remain preservation requirements, not candidates for removal.
No package-specific selector skill exists in `.pi/skills/`; the core package skill and selector source/README supplied this investigation's context.

#### Historical evidence, not predicted conflict counts

```bash
git show --remerge-diff 2d8cea699b08afa0f6a2c06eeb1507a52d699636 -- packages/pi-subagents/src/
git show --remerge-diff 0408aa5ff9d9811d98df17dde436e7fd45a5a3ad -- packages/pi-subagents/src/lifecycle/subagent.ts packages/pi-subagents/src/index.ts
git show b6599e30f9dce3f60d445043f232219eb40e47f5 -- packages/pi-subagents/src/lifecycle/subagent.ts
```

The first merge's source remerge diff shows import unions in manager/service/adapter and a background-return hunk combining fork launch wording with upstream typed details.
The second command reports no remerge-resolution diff for the two named startup files; that is not evidence that their combined semantics needed no review.
The existing `docs/upstream-sync.md` already asks maintainers to review auto-merged paths, preserve construction wrapping alongside incoming project-context behavior, and preserve fresh abort controllers alongside selection cancellation.
Its display-formula instruction is a concrete example of a semantic obligation surviving a clean textual merge.

Fork issue 17's later correction `b6599e30f9dce3f60d445043f232219eb40e47f5` settles the no-provider milestone from preparation itself rather than relying on a tool waiter.
Its retro records a service-only disposal regression caught in review; this is evidence of reasoning difficulty within fork development, not an upstream-merge regression.
Fork issue 18's source and real-path tests now forward admission to the foreground observer, illustrating why independently plausible mocks do not establish that the production callbacks connect.
Neither history establishes an average maintenance time or a future conflict rate.

#### Test evidence and limits

A read-only craftsmanship scout examined the selector-related blocks in the large lifecycle tests and the construction/nested/tool-boundary suites.
The planning session independently inspected the reported real-loader fixture, held factory/task harness, gated-run factory tests, manager selection block, and the initial gate tests.
The fallow flags on the large manager and subagent `describe` callbacks are not giant individual tests; they are nested behavior suites.
Do not propose splitting them solely from the reported callback size.

Existing tests provide substantial layered protection.
In the inspected fixtures, real-loader tests stub SDK session creation, while real-tool/manager tests stub the session factory and turn loop.
Those fixtures do not by themselves prove a combined real-loader, real-session, tool-waiting shutdown scenario.
This is a bounded evidence limitation, not a repository-wide claim that no other test covers it, nor an instruction to build a universal end-to-end harness.
Any additional verification must justify the host boundary it covers against fixture complexity and brittleness.

#### Supporting measurements

Executed on the unchanged implementation snapshot:

| Command                                                                             | Observed result                                           |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm -C packages/pi-subagents run test`                                            | 84 files, 1956 tests passed                               |
| `pnpm -C packages/pi-subagents-model-selector run test`                             | 9 files, 68 tests passed                                  |
| `pnpm fallow health --score --hotspots --targets --workspace @jopqior/pi-subagents` | 78/B; average cyclomatic 1.3; p90 2; maintainability 91.0 |
| `pnpm fallow dead-code --workspace @jopqior/pi-subagents`                           | No issues                                                 |
| `pnpm fallow dupes --workspace @jopqior/pi-subagents`                               | No code duplication; default test exclusions apply        |

Fallow reports `src/lifecycle/subagent.ts` as an accelerating churn hotspot (42.7, 59 commits), compared with the inherited architecture table's older 39.9/52 baseline.
That supports examining the execution path but does not establish an integration-cost reduction target.
The repeated-discriminator sweep found stopped-state checks, content-type checks, object guards, and revoked-lease checks; the lease checks inspected are inside the owning scope class, not evidence requiring a cross-module dispatch redesign.
No full repository lint/check, published-core compatibility matrix, interactive acceptance, or new mutation experiment was run in this investigation.

### Scope reconciliation

The fork open-issue sweep returned only this issue; the open-PR sweep returned none.
The inherited Phase 22 roadmap is archived, so no previous-phase archival gate blocks planning; the next phase number would be 23 if a phase is approved.
No phase has been opened by this checkpoint.
The inherited history's running-child observability candidates (`gotgenes/pi-packages` issues 912, 947, and 755) and cancellation candidate 949 are context, not fork obligations or automatically approved scope.
The archived metrics report no missed targets.

Fork retros defer keyed presentation tags, generic fixture consolidation, whole-lifecycle reorganization, and broader observer restructuring.
Those are not adopted merely because this investigation touches nearby code.
Stale architecture wording such as the claim that there is exactly one provider seam is an identified documentation mismatch; reconciliation should describe the actual selector contract rather than importing the inherited general-cleanup agenda.

### Decision status

The operator approved pursuing both lower lifecycle reasoning burden and inspectable verification, then clarified the primary maintenance goal and challenged the proposed single-issue organization.
The confirmed decisions and handoff below supersede the initial proposal to put only issue 19 on the roadmap.
No roadmap composition or new issue filing has been approved.

## Stage: Planning handoff (2026-09-24T08:46:35Z)

### Confirmed operator intent

The primary objective is to make incorporation of future upstream `main` updates mostly mechanical, minimizing places that require model or human judgment to reconcile fork behavior.
Reducing intrusion into upstream-owned files is a desired means toward that objective, not a forbidden metric or a preselected extraction mechanism.
The operator's large-file concern specifically means too much code for fork-added functionality concentrated in a single file, whether that file is new or inherited.
It does not authorize reducing, deleting, or generally refactoring the original upstream code merely to shrink a file.
Assess the concentration and cohesion of our added functionality, not total file size as an independent cleanup target.
Lower lifecycle reasoning burden remains important alongside merge mechanics: the operator explicitly confirmed that startup, cancellation, and return-timing obligations also deserve attention.
Verification must demonstrate the delivered improvement and retained behavior rather than substitute for changing the maintenance burden.

A smaller diff or fewer touched files is not sufficient evidence on its own.
For example, restoring an upstream-owned file to a form that future updates can accept unchanged may remove a real reconciliation obligation; moving the same coupling into an adapter that still changes in lockstep may not.
Do not reduce this scope to a checklist/documentation-only effort without another operator decision.
No particular runtime mechanism, package boundary, file-size threshold, or number of work items is selected.

### Issue organization decision

Treat issue 19 as the overall maintenance objective and final assessment, not a mandate for one large implementation plan or atomic delivery.
The initial recommendation to adopt only issue 19 and defer splitting until `/plan-issue 19` was challenged by the operator and is superseded.
Continue investigation to identify bounded, separately verifiable deliverables and present a decomposition before roadmap approval.
Do not preassign a task count or split mechanically by file or extraction.
Each eventual delivery issue should describe its maintenance problem, desired outcome, and acceptance conditions, leaving concrete design to its own `/plan-issue`.
Behavior preservation and evidence of maintenance benefit belong with each deliverable, not in a later testing issue that permits unverified runtime changes to land first.
The operator approved continuing on this basis, but has not approved specific child issues or a roadmap.

### Next-session work

1. Read fork issue 19 and this entire checkpoint before resuming the scoped `/plan-improvements pi-subagents` workflow.
   Do not run the generic template's pull/fetch step; retain upstream `edb35ee28535aac4e12431e47e440f6933911834` and inventory snapshot `746a4ae812a574d0496cb46c125a32961a608cf1`.
   Compare a newer local HEAD separately if the fork advances.
2. Continue the investigation with the clarified objective: identify which upstream-owned paths could cease needing fork-specific reconciliation, which integration points are essential, and where fork additions enlarge or entangle existing files.
   Inspect actual before/after possibilities and historical integration scenarios sufficiently to support outcome grouping, without committing to implementation mechanics.
   The lifecycle/test obligation table above is a starting point, not a predetermined work breakdown.
3. Present candidate deliverable boundaries, dependencies, trade-offs, and inspectable maintenance outcomes to the operator.
   Distinguish mechanical merge work from semantic review, test/host compatibility obligations, and the upkeep of any added abstraction.
   Seek confirmation before filing child issues or writing a roadmap; no approval from the earlier single-issue gate should be inferred.
4. If a phase is approved, Phase 22 is already archived and the next number is 23.
   Use the phase workflow's roadmap and phase retro, keeping this issue-level checkpoint as the bridge and issue 19 as the overall acceptance tracker.
   File approved work items in the fork only, then hand each to its own `/plan-issue` session.
5. Keep issue 19 open until actual delivered maintenance outcomes are assessed or the operator explicitly defers/stops.
   A report, green tests, or completed child issues alone does not establish the overall objective.

An eventual before/after assessment should name upstream-change scenarios, judgments formerly needed, how the delivered result removes or simplifies them, the evidence preserving behavior, and obligations that remain or move elsewhere.
No maintenance-duration benchmark, future conflict rate, or percentage of mechanical work has been measured; do not invent a numerical improvement promise.
Future synchronization is the product goal, not authorization to fetch during this fixed-baseline investigation.

### Artifact and verification state

The session ends with only this new Markdown file in the working tree.
It is intentionally uncommitted: the workflow requires operator confirmation before the planning commit, and none has been obtained.
No production code, roadmap, issue, branch, or release was created or changed.
The package test and static-analysis measurements earlier in this file apply to the unchanged implementation snapshot; they are not fresh-host end-to-end acceptance.
The investigation used a read-only craftsmanship scout, and the parent spot-verified its cited fixtures; no universal coverage claim should be inferred.

## Stage: Delivery-boundary investigation (2026-09-24T08:55:11Z)

### Baseline and operator decisions

Re-read fork issue 19 and the complete checkpoint before continuing.
Local HEAD remains `746a4ae812a574d0496cb46c125a32961a608cf1`; local `upstream/main` remains `edb35ee28535aac4e12431e47e440f6933911834`.
The only working-tree artifact before and after the disposable probe is this untracked retro.
No fetch, production edit, roadmap, child issue, commit, push, or release occurred.
The fork's open-issue sweep again returned only issue 19; its open-PR sweep returned none.

The session presented three candidate outcomes, not approved implementation mechanisms:

- A: reduce coordination between initial selection, lifecycle termination, and the spawning tool's return boundary.
- B: reduce selector-specific intrusion into child construction and inheritance.
- C: reduce repeated reconciliation between ordinary upstream presentation and selector-specific presentation.

The operator first chose to retain all three candidates while investigating B's independent benefit.
After the counterexample below, the operator chose to fold B's construction/inheritance preservation requirements into A's acceptance scope and continue refining A/C.
This is approval of the investigation direction, not authorization to file issues or write a roadmap.
Issue 19 remains the overall maintenance objective and final assessment.

### Source and history findings

The session inspected the fixed-baseline diffs for `src/index.ts`, runtime, lifecycle handlers, manager, record/state, session factory, tools, and UI, and read the construction carrier, lease implementation, session-factory IO contracts, composition wiring, service adapter, and relevant factory/inheritance tests.
The startup-specific additions concentrated in `src/lifecycle/subagent.ts` include provider invocation, catalogue validation, cancellation racing, selected-pair state, initial-outcome settlement, and startup waiter detachment.
These are fork-added responsibilities to evaluate for cohesion; inherited file size is not a cleanup target.
The background tool's return boundary and startup cancellation consume the same initial outcome, so separating them into independently designed deliveries risks splitting one contract across issues.

The construction carrier and lease already have dedicated modules.
The root captures a scope at initialization, wraps the complete factory call, and closes authority before teardown.
Moving those existing call sites behind another facade does not, by itself, remove an integration obligation.
The factory's `SessionFactoryIO.createSession` is a real pre-existing injected boundary, but its presence alone does not establish that moving cancellation checks there preserves behavior.

For presentation, `src/tools/spawn-config.ts` delegates a formerly inline upstream model-name formula to `formatSpawnModelName` in `src/ui/display.ts`.
The selector overlay also calls that helper and rewrites thinking tags; foreground progress and the background widget separately project pending activity.
The conflict handbook explicitly requires an incoming upstream formula change to be transferred to the fork helper.
This is a concrete reconciliation obligation, not an inferred benefit from reducing diff lines.
A presentation delivery must assess this obligation and avoid merely copying an upstream renderer or formula into another maintained implementation.

Historical inspection used `git show --remerge-diff` on `2d8cea699b08afa0f6a2c06eeb1507a52d699636` and `0408aa5ff9d9811d98df17dde436e7fd45a5a3ad` for `packages/pi-subagents/src/`.
The first reports import unions and the background-return combination of fork launch wording with upstream typed details.
The second reports no source remerge-resolution diff; the handbook nevertheless records construction-wrapper and fresh-abort-controller preservation requirements.
Mechanical conflict handling and semantic compatibility review remain distinct assessment dimensions.

### Construction-boundary counterexample

A disposable Vitest probe exercised the actual current `createSubagentSession`, using the existing `STUB_SNAPSHOT`, `createFactorySession`, `createSubagentSessionIO`, and `createSubagentSessionDeps` helpers.
The probe did not execute a real SDK session or loader; its cancellation schedule was synthetic and deterministic.
It is feasibility evidence against a naive relocation, not a discovered production regression or proof that all isolation designs fail.

The proposed relocation wrapped the injected `io.createSession` with signal checks before calling the underlying creation promise and after awaiting its result, disposing the result on cancellation.
For that arm only, the probe omitted the factory's `selectionSignal`, disabling its inline checks without changing production source.
The control passed `selectionSignal` directly to the unchanged factory with an unwrapped IO promise.
A third arm retained the factory check as well as the wrapper.

Reproduction sequence:

1. Create an abort controller, a deferred session-creation result, and a deferred notification that IO creation has started.
2. Record `controller.signal.aborted` whenever the existing stub session's `bindExtensions` runs.
3. Start the real factory using each arm's IO and signal arrangement.
   The direct IO resolves the started notification and returns the creation promise; the wrapper resolves the notification and awaits that same promise before its post-creation check.
4. Await the started notification, then register `creationPromise.then(() => controller.abort())`.
   This registers cancellation after the current direct factory continuation or wrapped IO continuation, respectively.
5. Resolve creation with the stub session and await factory settlement.

Measured results from the disposable probe:

| Arm                                       | Signal observed at binding | Factory outcome       | Disposal assertion |
| ----------------------------------------- | -------------------------- | --------------------- | ------------------ |
| Current inline factory checks             | `false`                    | Returned              | Not asserted       |
| Checks relocated entirely into IO wrapper | `true`                     | Returned              | Not asserted       |
| IO wrapper plus final factory check       | No binding                 | Rejected as cancelled | Exactly once       |

The wrapper adds an asynchronous handoff between its last check and the factory continuation.
Cancellation can occur during that handoff, so relocating both checks does not preserve the current check-before-binding boundary.
The retained factory check discriminates the case and prevents binding.
This falsifies the cheapest candidate for restoring the entire factory to upstream unchanged; it does not select a replacement mechanism.

Command executed: `pnpm -C packages/pi-subagents exec vitest run test/lifecycle/selection-boundary-spike.test.ts --reporter=verbose`.
Observed result: one file and three characterization cases passed, one deterministic execution per arm.
Passing means the probe observed the stated difference, not that the relocation passed acceptance.
The temporary test file was removed after the run; the production source and existing tests were untouched.
No full-suite, typecheck, lint, interactive acceptance, or SDK-host verification was performed in this stage.

### Refined delivery direction and remaining gate

A should own the initial selection/lifecycle/tool-return coordination problem, with construction inheritance and cancellation preservation included in its acceptance scope.
It must not become a mandate to rewrite the entire construction subsystem or eliminate every fork hook.
A final inline cancellation check may remain when its placement is essential; the benefit must come from removing or simplifying identifiable coordination elsewhere.
Do not split the tool return boundary into a later issue that leaves startup changes unverified.

C remains a separate candidate for presentation reconciliation, using the existing pending/selected facts rather than requiring a new lifecycle model first.
A/C share call sites in foreground/background tools, so possible independent acceptance is not a promise of conflict-free parallel implementation.
The suggested working sequence is A then C, subject to final operator confirmation; a hard dependency or release batch has not been established.
Concrete mechanism, package boundary, and release classification remain for each eventual issue's planning.

Each delivery must name the upstream-change scenarios it improves, compare the judgments required before and after, preserve its affected selector behavior, and state residual or relocated obligations and abstraction upkeep.
A smaller diff or a new helper alone is insufficient.
The next discussion should tighten A/C's problem statements and acceptance conditions, then explicitly obtain approval for roadmap composition and child-issue filing.
No approval to file or open Phase 23 had been given at this investigation checkpoint.

## Stage: Roadmap approval and filing (2026-09-24T09:00:03Z)

### Confirmed composition

After reviewing the tightened A/C scopes and acceptance criteria, the operator explicitly approved creating the fork child issues and writing the Phase 23 roadmap.
This supersedes the earlier pending-filing gate, not the no-fetch or behavior-preservation constraints.
No commit, push, or release was authorized.

Created and verified fork issue 20, `Reduce selector startup coordination with upstream lifecycle changes`, and fork issue 21, `Reduce selector presentation reconciliation with upstream UI changes`.
Both are linked as GitHub sub-issues of fork issue 19.
The recommended working sequence is issue 20 then issue 21, with independent acceptance and no established hard dependency or joint release batch.
Construction/inheritance requirements are part of issue 20; no standalone construction-isolation issue was filed.
Issue 19 remains the overall acceptance tracker and stays open.

### Handoff

The approved composition is written in `packages/pi-subagents/docs/architecture/architecture.md` under Phase 23, with stage notes in [the phase retro](phase-23-upstream-integration-maintenance.md).
The files remain uncommitted for operator review.
Next obtain commit authorization, then start `/plan-issue #20`; use `/plan-issue #21` after inspecting the startup delivery.
Each plan must establish concrete implementation and verification rather than treating the roadmap's outcome as proven feasibility.

Fallow was rerun on the unchanged implementation after probe removal: health 78/B, maintainability 91.0, average/p90 complexity 1.3/2, no dead-code issues, and no production duplication.
No additional production implementation or runtime acceptance was performed.

## Stage: Local planning commit authorization (2026-09-24T09:04:01Z)

The operator authorized committing the roadmap and both planning retros locally after the artifact checks passed.
No push, release, or production implementation is authorized by this confirmation.
The planning branch is `issue-19-upstream-integration-maintenance`, created from local `main` without fetching.
Next use `/plan-issue #20`, followed by `/plan-issue #21`; pushing or landing the planning branch is a separate decision.
The phase retro records the successful structural/Markdown checks and the remaining GitHub/vivify preview limitation.

## Stage: Main landing authorization (2026-09-24T09:06:30Z)

The operator clarified that these planning documents can be committed and pushed directly to fork `main`; the extra planning branch and local-only gate were unnecessary.
The planning commit was fast-forwarded onto local `main`, and pushing to the verified fork `origin/main` is authorized.
This supersedes the earlier local-only handoff; it does not authorize fetching, production implementation, or package publication.
Continue with `/plan-issue #20`, then `/plan-issue #21`, retaining the fixed upstream baseline and keeping issue 19 open for overall acceptance.
