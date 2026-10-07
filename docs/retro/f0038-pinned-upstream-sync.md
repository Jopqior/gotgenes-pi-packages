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

## Stage: Final Retrospective (2026-10-07T02:09:53Z)

### Session summary

Reviewed the issue-entry, planning, implementation, step-owner, independent-review and shipping transcripts alongside their committed handoffs.
The fixed-target two-parent integration and separately authorized core release are complete; this retrospective records recurring context-ordering failures, recorder sequencing, diagnostic preservation and the late shipping CI recovery.
No runtime change, new synchronization, evidence correction or publication is part of this stage.

### Observations

#### What went well

- The semantic-intersection review found that selection confirmation precedes budget startup and that unchanged worktrees sources still consume changed core disposal timing.
  Those findings produced separate operator-approved workspace semantics and discriminating lifecycle/selection pins, rather than a conflict-marker-only integration or an unnecessary coordinator extraction.
- Step 3 distinguished a failed build from a failed public consumer: removing the provider export stopped at `Rollup`, so the worker mutated the actual packed declaration and demonstrated the installed consumer's compiler failure separately.
  The final candidate and both companion matrices used the restored ordinary package flow, without retaining the temporary shim.
- The operator's step-per-subagent direction produced bounded sequential ownership with inspectable raw handoffs; the parent supplied the sole independent reviewer when the step-4 worker lacked the dispatch tool.
  The reviewer used the actual merge-first-parent range and separated incoming inventory from deep review, preserving the synchronization scope without an unrelated upstream repair campaign.

#### What caused friction (agent side)

- `instruction-violation`: both planning and implementation ran startup `git pull --ff-only` before reading `docs/upstream/synchronization-guide.md`, despite the existing `AGENTS.md` prerequisite.
  Implementation self-identified the ordering error immediately after loading the guide; the planning occurrence was identified from its transcript during this retrospective, not by an operator correction.
  Impact: added friction but no rework; both pulls reported already up to date, and later integration operations used the guide.
  Shipping loaded the guide and checked prerequisites before startup synchronization, so the earlier failure did not recur there.
- `instruction-violation` (self-identified in the implementation handoff): step 1 compared the planning source with the actual premerge first parent after integration rather than before the merge as the plan required.
  Impact: assurance arrived late; the checked delta contained only the plan/planning retro, with no runtime or constraint change and no resulting repair.
- `missing-context`: planning read the release-evidence modules but failed to apply `scripts/upstream-sync.sh`'s per-invocation clean-tree precondition to the proposed combined two-package evidence commit.
  Step 4 caught the incompatibility before invoking either recorder; the parent checked the wrapper and obtained approval for sequential package commits.
  Impact: an avoidable operator decision and worker pause, replacing one planned evidence commit with `docs: record reviewed core upstream sync evidence (#38)` and `docs: record reviewed worktrees upstream sync evidence (#38)`.
  Neither a weaker gate nor temporary evidence swapping was used.
- `rabbit-hole`: after the root correspondence-corpus failure, step 1 made seven inspection calls, including three reads of `test/release/release-correspondence-views.test.mjs`, before the eighth call staged resolved conflicts and reran the checks.
  The failure depended on unresolved three-stage index entries, not on a release-tooling defect.
  Impact: extra diagnostic reads and a full-root rerun; overwriting `precommit-test.log` also removed the separate raw failure artifact, leaving the transcript as its diagnostic witness.
- `other`: step 4 placed install, check, lint, root tests and dead-code inside one outer 120-second tool budget; the call was interrupted during tests without a captured test exit.
  Impact: a worker handoff/resume and a complete test rerun with a 600-second outer budget, without changing source, assertions or suite scope.
  It preserved `interrupted-root-test.log` before rerunning, improving on step 1's overwritten failure log.
- `missing-context`: the parent planner, planning explorer and step-2 worker guessed nonexistent local `colgrep` skill paths instead of using the advertised `packages/pi-colgrep/skills/colgrep/SKILL.md` location.
  The assessor also guessed the renderer test under `test/ui/` before locating `test/widget-renderer.test.ts`.
  Impact: failed reads and corrected paths, but no code rework; the existing skill catalogue and `find` tool already supplied the needed lookup.
- `other`: the first implementation-stage note misattributed the implementation parent's startup pull to planning; parent review corrected it before shipping.
  Impact: one unpushed documentation amend and a handoff OID update, producing final notes commit `ee9b0fa25ef95e2030c39bdf0ac7a50c17be13dd`.
  The correction was made by the parent agent, not the operator; the planning transcript independently shows its own ordering failure, but that was not what the implementation note was describing.
- `other`: after successful implementation CI and publication, the Ship-note commit `0a11ae2b870774a7089a99e7d5946958e1cf8817` initially failed CI while a first-release fixture ran `git clone --bare`, before its identity assertion.
  Impact: the operator requested recovery; the exact local case and full repository-script suite passed, and failed jobs were rerun once on the same commit.
  The verified run `37558671955` is now `success`, attempt 2; no code change, assertion relaxation or second release dispatch occurred.
  The failure did not reproduce and its root cause remains unconfirmed; a passing rerun is not proof of a particular Git maintenance or filesystem hypothesis.
- `other`: `.pi/skills/testing/SKILL.md` prohibits raw-log redirection, while `.pi/prompts/tdd-plan.md` expressly permits it with retained command status and the Git workflow skill documents status-preserving redirection.
  Impact: conflicting guidance, not a demonstrated masked test exit; this implementation retained command statuses and used raw logs for mutations, handoffs and independent review.

#### What caused friction (user side)

- The operator introduced step-per-subagent ownership after the green baseline, before implementation began.
  Stating that preference with the initial implementation command would simplify orchestration setup; no completed step had to be redone.
- The recorder batching decision was mechanical oversight the agent could have avoided by checking the wrapper during planning.
  Budget/workspace compatibility and independent publication authorization were genuine operator decisions and should remain explicit gates.
- Requesting action after the late CI failure was sufficient; no earlier user-supplied context would have established its unconfirmed cause.

### Diagnostic details

#### Model-performance correlation

Type-unfiltered transcript turns identify `openai-codex/gpt-6.1-sol` for the entry point, planning, implementation parent, shipping and every located child transcript below.
The observed model is taken from turn labels, not agent definitions or current environment variables.

| Located child           | Task                                                                     | Observed model             |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------- |
| Planning explorer       | Budget/selection/workspace semantic intersections and fixture boundaries | `openai-codex/gpt-6.1-sol` |
| Tidy First assessor     | Judge preparatory refactors and scope exclusions                         | `openai-codex/gpt-6.1-sol` |
| Step 1 owner            | Atomic merge, adaptations and budget/selection mutation cycles           | `openai-codex/gpt-6.1-sol` |
| Step 2 owner            | Workspace outcome characterization and five mutation classes             | `openai-codex/gpt-6.1-sol` |
| Step 3 owner            | Installed public-type consumer and companion matrices                    | `openai-codex/gpt-6.1-sol` |
| Step 4 owner            | Separate release evidence, gates and review handoff                      | `openai-codex/gpt-6.1-sol` |
| Pre-completion reviewer | Independent first-parent-range review and fresh deterministic checks     | `openai-codex/gpt-6.1-sol` |

The planning parent shows two `Explore` dispatch calls, but only one corresponding explorer transcript was located beside the assessor transcript; the other call's runtime model/task completion is not attributed.
Worker resumes reused their existing step-owner transcripts rather than establishing additional fresh review identities.
No reasoning-weak model or purely mechanical dedicated dispatch was observed, and this single-model run cannot establish a causal model-performance comparison.

#### Escalation-delay tracking and unused tools

The corpus/index episode exceeded the five-call escalation threshold: seven inspections preceded the resolving staging/rerun call.
A direct `git ls-files -u` inspection was available through `bash`; the worker should have checked that state first, or used `ask_parent` after five calls instead of continuing to reread the same test.
For the recorder planning gap, the needed surface was the wrapper's `check_merge_preconditions`, not another architecture agent or a policy change.
The guessed skill/test paths similarly needed the available catalogue/`find`, not broader research.

#### Feedback-loop gap analysis

Verification was incremental: the parent established root check/lint/test/dead-code baseline; step 1 ran targeted/core checks and repeated typechecks during fixture adaptation; step 2 checked characterization before mutations; step 3 verified the packed consumer before its mutations and both matrices afterward.
Step 4 and the independent reviewer then ran completed-tree gates, followed by shipping lint/dead-code, CI and release-artifact verification.
The actionable gaps were validating the root corpus before staging resolved conflicts, sharing one insufficient outer timeout across several gates, and overwriting an earlier failed log, not deferring all verification until the end.

#### Context growth and high-occupancy resume

The operator identified a missing diagnostic in the initial retrospective: planning, the step-4 evidence/review-handoff worker and the independent reviewer each compacted once.
The initial model-correlation analysis named the executed models but did not account for the common context-capacity cost.
The following measurements walk each persisted session's active entry chain up to its first compaction, count returned tool-result text characters and read calls, and retain the actual `tokensBefore` record.
Character counts describe returned text, not file bytes, token estimates or billed token totals.

| Session              | Precompaction `read` calls | Returned tool-result characters | `read` result characters | Recorded `tokensBefore` |
| -------------------- | -------------------------- | ------------------------------- | ------------------------ | ----------------------- |
| Planning             | 77                         | 976263                          | 875931                   | 256190                  |
| Step 4 worker        | 51                         | 880947                          | 727042                   | 255726                  |
| Independent reviewer | 84                         | 1012018                         | 890471                   | 257076                  |

The first provider-reported input counts were 22726, 11628 and 15194 respectively; the last requests before compaction reported 237495, 254549 and 252042.
These input counts sum the recorded input/cache-read/cache-write components and exclude output; they are distinct from Pi's projected compaction estimate, which can include trailing tool results.
The small starting inputs and large returned tool text identify accumulated ingestion, rather than a huge startup payload, as the dominant measured growth source.
No new LLM replay or before/after optimization trial was run; the proposed improvements below have not been performance-validated.

- `wrong-abstraction`: bounded synchronization review was treated as broad material ingestion rather than a contract-guided reading plan.
  Planning loaded the entire inherited triage (46703 returned characters), multiple historical plans and long package skills; step 4 paged through `intersections.diff` (162270 returned characters) and also read corresponding source.
  The reviewer loaded complete plan/workflow/remerge/core-docs surfaces and then source/tests, carrying overlapping representations of the same changes.
  Multiple reads of a path can be legitimate pagination, so the measurements do not label every repeat as redundant.
  Impact: each named session reached a recorded compaction; independently correct scope selection did not bound the amount of text entering its context.
- `other`: saving raw logs did not prevent their contents from being returned to the model.
  Step 4's interrupted combined gate call returned 40850 characters, the full root-test rerun returned 39006, and the all-process inspection returned 29827.
  Impact: diagnostic output consumed context even though full raw files already existed; the earlier approved logging adjustment preserves evidence/status but does not itself limit log reinjection.
- `wrong-abstraction`: the step-4 worker combined local review, separate recorders, completed-tree gates, independent-review handoff, report consumption, stage notes and final handoff in one continuing session.
  At `2026-10-06T17:25:35.369Z`, the parent received `contextPercent: 89.04595588235294` and `compactionCount: 0`; at `2026-10-06T17:40:29.254Z`, it resumed that same worker for stage notes.
  Eight further assistant responses preceded compaction at `2026-10-06T17:44:02.323Z`; provider input grew from 242120 before that resume to 254549 on the last precompaction request.
  Impact: an avoidable high-occupancy continuation crossed the compaction boundary even though the remaining work was documentation/handoff, not another semantic review.
  Resume retains the existing child session; the fresh turn budget does not reset its conversation context.
  This is a scheduling error, not a violation of a previously adopted percentage gate, and no correctness regression is attributed to compaction without evidence.

Future improvement candidates, not implemented or filed in this follow-up:

1. Keep complete inventory and required deep-review coverage, but use contract-specific source/diff sections instead of loading every representation in full.
   Required full skill loading is unchanged; splitting long skills into task-triggered reference branches needs separate planning rather than silently skipping their contents.
2. Preserve complete raw gate logs while returning status, narrowly derived measurements and log paths on success; inspect the relevant diagnostic sections on failure.
3. Trial an 80-percent dispatch checkpoint: prepare a bounded handoff rather than automatically resuming a high-occupancy worker for a new stage.
   This is a proposed threshold, not an empirically established optimum or a new runtime prohibition; at the observed 89-percent boundary, the parent or a fresh documentation worker could have owned the remaining notes.
4. Retain the sole independent reviewer and its required checks, but give it a contract-grouped reading plan and raw evidence pointers without making implementation summaries proof of PASS.
   Saved notes support a fresh handoff but do not remove already-ingested history from a continuing session.

Increasing the model window, lowering thinking or compacting earlier does not address the measured ingestion volume.
The operator approved recording this diagnosis only; no dispatch protocol, reviewer definition, compaction configuration or runtime mechanism changed.

### Proposed adjustments

- Clarify per-package recorder commit sequencing in `docs/upstream/fork-release-policy.md`, which already owns recorder semantics; keep the existing clean-tree mechanism unchanged.
- Replace the testing skill's blanket redirect prohibition with its established status-preserving alternative and distinct rerun log paths, removing the stale suite-size rationale.
- Do not duplicate startup guide precedence in `AGENTS.md` or every prompt: the rule already exists, and shipping followed it correctly.
- Do not add automatic clone retries, claim a Git maintenance root cause, expand optional live checks, introduce another reviewer, or turn this independent sync into a phase-close task.

### Durable transcript sources

All paths below are under `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/`.

- Entry point: `2026-10-06T15-51-40-745Z_01a111e9-d9c9-7244-ac03-503162dd6971.jsonl`.
- Planning: `2026-10-06T15-54-16-967Z_01a111ec-3c07-7244-ac03-503352fafe42.jsonl`.
  Its `tasks/` contains explorer `2026-10-06T15-56-43-037Z_01a111ee-769d-7244-ac03-5036c9f3e970.jsonl` and assessor `2026-10-06T16-00-56-266Z_01a111f2-53ca-7244-ac03-503b3a5206ee.jsonl`.
- Implementation: `2026-10-06T16-19-14-199Z_01a11203-1497-74aa-8bc9-5317dfb5ff69.jsonl`.
  Its `tasks/` contains step 1 `2026-10-06T16-25-03-735Z_01a11208-69f7-74aa-8bc9-531b58686f12.jsonl`, step 2 `2026-10-06T16-50-21-127Z_01a1121f-9147-74aa-8bc9-531e3ccdd9b7.jsonl`, step 3 `2026-10-06T16-57-57-978Z_01a11226-89da-74aa-8bc9-53222d854cde.jsonl`, step 4 `2026-10-06T17-09-22-114Z_01a11230-fa42-74aa-8bc9-53264b4fe1ee.jsonl`, and reviewer `2026-10-06T17-26-14-627Z_01a11240-6d63-74aa-8bc9-532a342b06ab.jsonl`.
- Shipping and CI recovery: `2026-10-07T01-31-38-741Z_01a113fc-d375-7571-a0a4-0ac58fc16cb1.jsonl`.

### Next-work disposition

Issue #38 is an independently shipped repository synchronization, not a final improvement-phase step; neither phase close nor another pinned target follows automatically.
The latest triage, `docs/triage/2026-10-02-backlog.md`, ranks inherited `gotgenes/pi-packages` work, not this fork's tracker.
The fork open-issue query returned only #26, which this plan explicitly deferred; this retrospective does not promote it or reinterpret upstream issue numbers as fork candidates.
No approved roadmap/triage successor is available to recommend.

### Changes made

1. `docs/retro/f0038-pinned-upstream-sync.md`: appended this cross-session retrospective, diagnostic details, durable transcript sources, late CI recovery and next-work disposition without changing prior stages.
2. `docs/upstream/fork-release-policy.md`: added the operator-approved per-invocation clean-tree requirement and sequential per-package evidence commit recipe; recorder behavior and release authorization remain unchanged.
3. `.pi/skills/testing/SKILL.md`: replaced the blanket redirect prohibition and stale suite-size rationale with the operator-approved status-preserving logging reference, distinct rerun paths and targeted failure output.
4. `docs/retro/f0038-pinned-upstream-sync.md`: added the operator-requested, measured context-growth diagnosis, confirmed the 89-percent step-4 resume and recorded unimplemented improvement candidates; no new issue or behavioral adjustment was authorized.
