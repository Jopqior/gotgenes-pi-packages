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

## Stage: Implementation — TDD (2026-10-06T17:40:45Z)

### Session summary

Completed all four plan steps through separate step owners: three mutation/characterization cycles, followed by independent fork evidence and ordinary fresh-context review.
The integration adopts the approved hard turn ceiling, fresh resume budget, minimum finite limit, `wrapUpTurns`, public `turnBudget`, removed terminal `steered`/old result flags, transcript navigation, fullscreen viewer/widget changes, Pi 1.0 tool floors and permission behavior.
Fork identities/history, admission-owned selection and confirmation/cancellation, synchronous service spawn, nested ownership, pending-safe model presentation, no resume selection, and worktrees configuration/provider/rescue/recovery remain intact.
No new runtime Red was measured against the old fork: new assertions characterized the already merged behavior, with class-specific killing mutations providing the discriminating Red evidence.
Step 4 authored no runtime/test change and required no additional current-contract documentation rewrite after crosschecking the plan's module targets and architecture.

### Integration and evidence checkpoints

- Actual integration merge: `0b865f9b2f34413d6a09684560f66f5978fffd76`.
  Its exactly two parents are first-parent review `RANGE_BASE` `49a8e68407f404869e84e460b061738faf4e06e0` and pinned target `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`; common base is `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`.
- Step 2 commit: `985fb7ddb510b36db0abec551d60707f18b2c95e`, pinning twelve initial/resumed workspace outcome cases, disposal ownership and once-only addenda.
  Step 3 commit: `e4957bb958ad2b1a96321d3a67d0f23d98c37ba8`, extending the actual installed packed public-type consumer with budget/selection imports and removed-field/status probes while retaining steering-event/spawn-limit use.
- Core evidence commit: `22339797f7771a1e8fe85bcd93ea3360a6b6538d`.
  Independently reviewed merge contribution is `none`: actual resolutions preserve fork selection/presentation/service/history contracts while adapting target-owned behavior; postmerge core changes strengthen tests/probes only.
  The recorded direct upstream release is 23.2.0 at `6879774308ba8056859fa42284da71763fe1fe78`, so the upstream baseline distance from 22.0.0 is major independently of the fork resolution level.
- Worktrees evidence commit: `c3738f43de7326a799126c970f4a3546e937b20a`.
  Its separately reviewed contribution is `none`: the whole worktrees package has no first-parent range diff, and the published-core loading/provider/configuration/rescue/recovery contracts remain its existing implementation.
  Direct upstream stays 0.3.3 at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, giving no upstream version contribution.
- Both successful policy-owned recorder invocations used distinct reviewed rationales, verified contained stable release manifests and empty package-scope upstream tails, and preserved local tag mappings.
  Both selected correspondence views were regenerated and checked; their bytes remained unchanged because pending sync evidence does not add a published fork release row.
  No row was fabricated, target moved or history repaired.
- At reviewed HEAD `c3738f43de7326a799126c970f4a3546e937b20a`, the offline core prediction printed `pi-subagents-v6.0.0`; worktrees reported nothing to release at `pi-subagents-worktrees-v0.1.0`.
  These are measured checkpoint predictions, not manifest edits, release dispatch or publication approval.
- Actual remerge diff, automatic selector/lifecycle/service/presentation/persistence/workflow intersections and every postmerge contribution were read.
  The complete incoming inventory contains 214 paths; the first-parent-to-reviewed-HEAD changed list contains 217 paths.
  These inventories establish the path surface, not a comprehensive inherited upstream audit.
- Original 22 tag name/object mappings, exact saved core/worktrees CHANGELOG bytes, whole selector/worktrees directories and core manifest remain unchanged from the first parent.
  Primary-checkout identity, `main`, no unmerged entries/pending operation, input ancestry and committed merge/evidence reachability were checked against actual Git state.

### Checks and measured test delta

The completed integration ran frozen install, root check/lint/test, dead-code, actual packed public-types verification, both full packed companion compatibility matrices, both correspondence-table checks, offline predictions and working/range diff checks.
Each completed command captured exit 0; lint reported no fixes and dead-code no issues.
Selector retained historical core rows 1.0.0/1.0.1/1.0.2/2.0.0 plus the actual local tarball candidate; worktrees retained floor/published/candidate real provider lifecycle and missing/inactive/reversed-order controls.
Both actual candidates used installed Pi 1.0.0 pins, not workspace-only imports or the registry-published core substituted for the local candidate.
Worktrees packed cases exercised clean disposal, dirty rescue-byte preservation and shutdown/re-registration; core lifecycle doubles establish disposal timing, not those Git byte guarantees.

Counts below were parsed from the parent's raw preintegration log `/tmp/pi-bash-0aded482d5274e63.log` and the completed step-4 `final-root-test.log`, not copied as acceptance from prior handoffs.

| Suite                                         | Baseline files/tests | Final files/tests | Test delta |
| --------------------------------------------- | -------------------- | ----------------- | ---------- |
| Core                                          | 91 / 2165            | 93 / 2282         | +117       |
| Permission system                             | 177 / 5370           | 180 / 5634        | +264       |
| GitHub tools                                  | 7 / 93               | 8 / 119           | +26        |
| Colgrep                                       | 9 / 116              | 9 / 119           | +3         |
| Selector                                      | 10 / 133             | 10 / 133          | 0          |
| Worktrees                                     | 8 / 74               | 8 / 74            | 0          |
| Repository scripts                            | 43 / 995             | 43 / 995          | 0          |
| Aggregate, including other unchanged packages | 386 / 9580           | 392 / 9990        | +410       |

The other package suites have zero delta.
The six-file planning selection/service baseline was 92 tests before integration; it was not the full repository baseline or proof of the completed target.
User-observable feat/fix subjects were previewed from the actual first-parent range, including budgets/resume, viewer/persistence, permission spellings/forwarding/modifiers/reporting, Pi 1.0 tool floors/error flags and the unresolved-SHA issue-close guard.
Incoming upstream issue numbers were not treated as fork close targets.

### Mutation evidence and limits

- Step 1 applied six prescribed mutation classes plus a seventh synthetic pre-loop budget mutation.
  All exited 1, killing respectively 3, 1, 1, 2, 2, 3 and 6 named tests for pending budget fabrication, initial/resume callbacks, background acknowledgement timing, model-producer precedence, minimum advisory and pre-loop record/widget absence.
  The restored targeted run passed 7 files / 201 tests before full core/root checks.
- Step 2's five independent workspace mutations killed respectively 1, 1, 1, 4 and 6 named cases: initial warned hold, resumed warned hold, resumed exhausted disposal, exhausted classification and no-question teardown.
  The expanded lifecycle file characterized 237 passing tests; full core reached 2282, with the existing worktrees suite unchanged at 74.
- Step 3's five public-contract mutations produced compiler exit 2 for removed budget/provider exports, separately reintroduced record counters and reintroduced terminal `steered`.
  Positive imports produced TS2459 and the corresponding negative directives produced TS2578 when made unused.
  The initial provider-export source mutation exited 1 at Rollup, so it was not claimed as consumer discrimination.
- Every mutation was restored from separately saved green byte copies with successful exact-byte comparisons.
  No mutation remains in the committed or final candidate tree, and no new mutation was performed in step 4.
  Raw per-class commands, patches, logs, exits and restoration evidence remain under `/tmp/f0038-step1`, `/tmp/f0038-step2` and `/tmp/f0038-step3`.
  These bounded automated tests do not claim live model execution or a new quantitative renderer-performance guarantee.

### Deviations and observations

- The parent implementation session ran the startup pull before loading the guide; the guide's ordering was loaded before later integration operations, and implementation owners ran no startup pull/fetch.
- Step 1 compared the planning source HEAD with the actual premerge first parent after integration rather than before it.
  The actual diff contained only the fork plan/planning retro, with no intervening runtime or constraint change.
- Step 1's transient conflict/type/fixture issues were resolved inside the atomic merge; the root CHANGELOG corpus failure came from resolved-but-unstaged three-stage index entries and passed after staging the resolved conflicts, without release-tooling repair.
  The initial failed root log was overwritten on rerun; its diagnostic survives in the implementation transcript rather than a separate retained raw file.
- Step 3 isolated the provider-export consumer mutation at the completed real tarball boundary using an external pnpm shim and edited packed declaration.
  The unchanged verifier actually installed that modified tarball and produced the discriminating compiler failure; final verification and both matrices used ordinary pnpm without the shim or mutation.
- The operator explicitly approved separate core and worktrees evidence commits instead of the planned combined commit because the unchanged wrapper requires a clean tracked tree before each recorder invocation.
  Each package's machine state/view pair was staged together; only state bytes changed, and no temporary evidence swapping was used.
- Step 4's first combined gate call hit an outer 120-second tool timeout during root tests with no captured test exit.
  It was classified as infrastructure interruption, retained as `interrupted-root-test.log`, and the identical full test command ran separately with a 600-second outer timeout and captured exit 0.
  No source repair, suite reduction or threshold configuration change was authorized or performed.
- No materially new compatibility decision, unrelated inherited repair campaign, speculative follow-up, push, GitHub mutation/close, tag change, release dispatch or publication occurred.

### Independent review and next action

Pre-completion reviewer: PASS.
The one fresh-context reviewer explicitly reviewed `49a8e68407f404869e84e460b061738faf4e06e0..c3738f43de7326a799126c970f4a3546e937b20a`, regenerated both inventories, distinguished inventory from selected deep review, and cited actual resolutions, automatic intersections and all four postmerge contributions.
It independently reran root check/lint/test/dead-code with exit 0, checked both evidence records/views and offline predictions, protected topology/history, applicable decision-surface questions and modified architecture Mermaid rendering.
The full report has explicit `Overall: PASS`, no WARN/FAIL findings, and guide-owned finding disposition.
Unrelated inherited historical wording remains outside synchronization repair scope, not a persistent shipping warning; no concrete optional live/model/TUI gap was identified and no waiver is needed.
This PASS covers the reviewed HEAD; only these stage notes are committed afterward.

The final raw logs/statuses, inventories/diffs, full reviewer report and transcript paths are preserved in `/tmp/f0038-step4/HANDOFF.md` and its adjacent evidence files.
Restart Pi before `/ship 38` invokes changed GitHub tools or prompt templates; ship from the root primary checkout using the same resolved merge-first-parent `RANGE_BASE` and verify committed evidence/topology again.
Do not run the incoming-history co-shipped closure scan or dispatch publication without separate operator approval.
Shipping and the separate final retrospective remain subsequent stages; neither was executed here.

## Stage: Ship (2026-10-07T01:43:51Z)

### Session summary

Shipped from the clean primary checkout on `main` in the trunk lane, preserving the genuine two-parent integration merge `0b865f9b2f34413d6a09684560f66f5978fffd76` and its fixed upstream second parent.
Verified both committed sync evidence records, independent review PASS and the documentation-only postreview delta before pushing.
The operator approved the exact closing comment and independently authorized only `@jopqior/pi-subagents` publication to npmjs.org with fork tags and GitHub Release creation.
Closed fork issue #38 and released core 6.0.0; the separate final retrospective remains `/retro 38` at the root on `main`.

### Observations

- Startup fast-forward pull succeeded; the measured 174 unpushed commits included incoming upstream history, not additional fork close targets.
  Used actual merge-first-parent `RANGE_BASE` `49a8e68407f404869e84e460b061738faf4e06e0`, overriding the generic plan-parent anchor and incoming-history co-shipped scan.
- Root lint and dead-code passed on the exact pre-push tree.
  Pushed `ee9b0fa25ef95e2030c39bdf0ac7a50c17be13dd` to verified fork `origin/main`; CI run 37557766525 succeeded before issue closure or release.
- Registered changed candidates contained only `pi-subagents`; the offline prediction and its approved-SHA recheck both succeeded with `pi-subagents-v6.0.0`.
  Changed `pi-colgrep`, `pi-github-tools` and `pi-permission-system` directories are unregistered and were not publication-eligible; neither unchanged companion was dispatched.
- The approved closing comment credits `@gotgenes`, describes the breaking budget/workspace/host/path-rule changes and cites the actual reachable integration merge.
  Only fork #38 was closed; no explicit additional fork issue or PR close target was found, and inherited upstream issue references were not scanned as fork targets.
- Dispatched release run 37558383686 once for `pi-subagents`, guarded by the approved pushed SHA.
  Its prepare, publish and github-release jobs succeeded; release commit `b4f2dadd93ad2e2eb63b16b8dc8fe72802d17e5e` has the approved SHA as its parent and only the selected package's four release artifacts changed.
- Verified `pi-subagents-v6.0.0` peels to that release commit, its manifest is `@jopqior/pi-subagents` 6.0.0, and the exact GitHub Release exists in `Jopqior/gotgenes-pi-packages`.
  Its correspondence records direct upstream 23.2.0 at the pinned target; both generated views pass their checks after the final fast-forward pull.
- No worktree teardown was needed in the trunk lane, no release retry or npm polling was performed, and no optional live/TUI waiver or phase-close action was required.
  These Ship notes are a separate documentation-only checkpoint after the verified release; their push and CI are the remaining handoff verification.
