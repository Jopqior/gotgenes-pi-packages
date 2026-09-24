---
issue: 21
issue_title: "Reduce selector presentation reconciliation with upstream UI changes"
---

# Retro: #21 — Reduce selector presentation reconciliation with upstream UI changes

## Stage: Planning (2026-09-24T15:46:06Z)

### Session summary

Committed the implementation plan at `packages/pi-subagents/docs/plans/f0021-selector-presentation-reconciliation.md` as `d255fb5a7791f7424c16c1e8ef6696e0b6fa921c` on `main`.
The operator selected a single ordinary presentation producer driven by raw pending/selected facts, preserving behavior rather than retaining a formatted-string overlay.
No production implementation, push, release, or issue mutation occurred; the next entry point is `/tdd-plan`.

### Observations

- The required initial `git pull --ff-only` reported already up to date; no later fetch occurred.
  Fixed upstream remains `edb35ee28535aac4e12431e47e440f6933911834`, inventory snapshot remains `746a4ae812a574d0496cb46c125a32961a608cf1`, and this session's implementation baseline was `fbd15ece7b0ec6091ff2259ef40f149e0131559a`.
  Fork issue 20 is shipped and closed; its initial-selection owner supplies the private facts this plan consumes without lifecycle changes.
- The approved producer stays in `src/tools/spawn-config.ts`, owns the sole model-name formula and ordinary tag/detail construction, and supplies a bound `detailFor` method to the runners.
  Keep the initial `detailBase` for resume/no-provider behavior, and keep the runner snapshot's parent ID for selected-model comparison rather than assuming it equals the initial resolution input.
  The current fork's empty-model-ID formatting differs from the fixed upstream truthiness check; preserve it explicitly.
- The operator declined the narrower tag-only alternative by choosing the unified producer.
  The plan removes tag-string interpretation and cross-file formula transfer, but an incoming inline upstream presentation change still needs adaptation into the local common producer.
  Activity wording is already shared today; consolidating pending precedence must not be sold as a newly shared wording mechanism.
- A disposable synthetic probe called real config resolution and the current overlay, partially mocking only the mode-label producer.
  With `twin`, ordinary and selected output both place the mode first; with `mirror`, ordinary remains mode-first while selected becomes thinking-first.
  Both characterization cases passed in one deterministic run per arm, demonstrating the existing reconciliation obligation rather than a delivered fix.
  The probe was removed, and the working tree was clean before writing the plan.
- Measured baseline checks passed: focused core run, 8 files and 188 tests; full core run, 86 files and 1984 tests; companion run, 9 files and 68 tests.
  Plan Markdown lint and commit hooks passed.
  No refactor, delivered before/after trial, full repository typecheck/lint, or interactive SDK-host acceptance was performed during planning.
- Tidy First recommended a test-only preparation: migrate selection runner cases from mutations of formatted tags to real resolved inputs before changing the producer.
  Real config adds genuine mode/background tags that the generic fixture intentionally omits; retain generic fixture defaults and give it only a no-op detail method, not a copied formatter.
  Delete old exported helpers and migrate all consumers/direct tests atomically when introducing the required method.
- An independent plan review caught a weak killing-mutation description: modifying only a `twin` branch cannot kill a `mirror` test.
  The plan now specifies the old algorithm's non-`twin` fallback as well, so the predicted order difference is real.
- Delivery evidence must include exact synthetic patches, fixture inputs, expected outputs, commands, exit statuses, and test output inside the repository for review.
  The model-formula trial includes a correctly repaired pre-change control and discloses the local-block adaptation that remains.
  Fork issue 19 stays open for overall maintenance assessment; no speculative follow-up was filed.

#### Deferred tidyings

- `src/tools/foreground-runner.ts` and `src/tools/background-spawner.ts`: a shared runner/lifecycle framework would enlarge the timing surface rather than prepare this presentation change.
- `src/ui/display.ts` and `src/tools/spawn-config.ts`: a generic tag parser, presentation discriminator framework, or separate cross-file presentation module would preserve the wrong coupling or add unnecessary abstraction.
- `src/ui/agent-widget.ts`: its existing private pending projection already suffices; timer/observer rewiring is outside this delivery.
- `test/tools/spawn-selection-boundary.test.ts`, `test/service/service-adapter.test.ts`, and `test/tools/agent-tool.test.ts`: broad harness or test-tree cleanup would disturb the integration evidence without making this change easier.

## Stage: Implementation — TDD (2026-09-24T16:34:40Z)

### Session summary

Completed all four planned steps as separate commits, using a fresh implementation subagent for each step at the operator's request: characterization, the bound common presentation producer, centralized pending activity, and reconciliation evidence.
Ordinary, pending, and confirmed details now share raw-input formatting in `spawn-config.ts`, while selection timing, public snapshots, and initial/fallback behavior remain unchanged.
The core suite increased from a measured 1984 to 1988 tests across 86 files, a net increase of four after migrating the old display tests; the parent independently reran the final core suite.

### Observations

- Initial `git pull --ff-only` reported already up to date, and the clean baseline passed root `check`, `lint`, `test`, and `fallow dead-code` before implementation.
  No subsequent fetch, push, release, or issue mutation occurred.
- Each code step exercised the plan's killing mutations and restored production sources before committing.
  The required `detailFor` interface migration initially failed because the method did not exist; separate mutations then exercised raw pending/selected substitution, snapshot-parent comparison, captured mode facts, non-`twin` ordering, each runner emission site, and fixture identity.
- Step 3 also strengthened `test/ui/transcript-content.test.ts`, which the module table predicted would remain unchanged, to pin ordinary activity and the absence of pending text.
  This was a test-only scope deviation; transcript production code and its two-argument formatter call were unchanged.
- Synthetic before/after trials and their literal fixtures, patches, expected/observed outputs, commands, exit statuses, and fixed source refs are preserved in `docs/architecture/selector-presentation-maintenance.md`.
  The initial isolated-tree invocation was blocked by pnpm's external `node_modules` link check before tests ran; invoking the installed Vitest executable completed the trials without changing dependencies.
  The evidence includes the correctly repaired pre-change model helper and explicitly retains the incoming-block adaptation obligation and empty-model-ID semantic difference.
- Final root `check`, `lint`, `test`, and `fallow dead-code` passed, as did recursive package tests, companion tests, and edited-document Markdown checks.
  Lockfiles were unchanged, and both issue-21 architecture completion markers were present.
  The commit subjects are `test:`, `refactor:`, and `docs:`; no feature/fix changelog entry or release claim was introduced.
- Pre-completion reviewer: WARN, with no blocking findings, scoped through `a3fefe83ab420e83ea529a79acf562590ea04460`.
  The fresh reviewer independently ran all four deterministic gates, inspected the synthetic evidence against source, and rendered the architecture diagrams; it did not rerun the diagnostic patches.
  Reviewer warnings: `test/tools/spawn-config.test.ts` resets its module-level `vi.fn()` in `afterEach` rather than the testing skill's required `beforeEach` convention.
  No isolation failure was observed; the non-blocking warning remains for the operator's ship decision.
- Local tests use stub sessions rather than an interactive SDK host, and no live-host acceptance is claimed.
  Issue 19 remains the overall maintenance assessment; the next workflow step on `main` is `/ship 21`.

## Stage: Implementation — Review follow-up (2026-09-24T16:41:16Z)

### Session summary

After assessing the non-blocking warning, the operator approved aligning the mock reset with the testing convention.
Committed `test(pi-subagents): reset presentation mock before each test`, changing only the hook import and registration from `afterEach` to `beforeEach`.
No production behavior or test count changed.

### Observations

- The parent ran the affected `spawn-config.test.ts` suite: 33 tests passed, followed by successful root typecheck and lint.
- A fresh delta-scoped reviewer reran root `check`, `lint`, `test`, and `fallow dead-code`; all passed.
  Pre-completion reviewer: PASS, with the previous sole WARN resolved and no new findings.
  This supersedes the pending warning recorded in the earlier implementation entry.
- No push or release occurred; the next step remains `/ship 21`.

## Stage: Ship (2026-09-24T16:44:51Z)

### Session summary

Prepared trunk-lane delivery on root `main` after reading the plan and both implementation review entries.
The final implementation review is PASS; issue 19 remains open for the overall maintenance assessment.

### Observations

- Origin resolves to `Jopqior/gotgenes-pi-packages`; fetch and fast-forward-only pull succeeded, with nine implementation/planning commits ahead of `origin/main` before this stage note.
- Root `pnpm run lint` and `pnpm fallow dead-code` passed before this documentation-only stage entry.
- The plan recommends independent delivery, but the read-only release derivation reports nothing to release for `pi-subagents` at `pi-subagents-v4.0.0`.
  No release dispatch is needed; the internal refactors batch into a future releasable change.
- No adopted PR or additional co-shipped issue was identified in the plan, retro, commit subjects, or changed paths.
- Push, exact-SHA CI verification, and issue closure are pending at this entry's commit; the ship session reports their actual results separately.
  No worktree teardown applies in the trunk lane.

## Stage: Final Retrospective (2026-09-24T16:54:33Z)

### Session summary

Reviewed the planning, implementation, review-follow-up, and ship transcripts, plus the separate subagent transcripts for design assessment, implementation, and review.
The presentation delivery is on `main`, fork issue 21 is closed, and no package release was due; fork issue 19 remains open for the combined maintenance assessment.
This retrospective records workflow friction without reopening the shipped implementation.

### Observations

#### What went well

- The synthetic mode-label rename exposed a concrete maintenance obligation rather than relying on a smaller diff as evidence.
  The delivered trials in `packages/pi-subagents/docs/architecture/selector-presentation-maintenance.md` also retained the correctly repaired old model helper as a control, distinguishing simpler adaptation from a false claim of eliminating duplicate formulas.
- Fresh plan review caught a mutation that changed only the `twin` branch and therefore could not distinguish the `mirror` fixture.
  Correcting the full fallback before implementation prevented a misleading test-quality requirement from reaching the TDD steps.
- After the operator clarified delegation granularity, each implementation step ran in a fresh child and ended at its own commit boundary.
  The parent checked the tree between steps, and independent review remained separate from implementation.

#### What caused friction (agent side)

- `wrong-abstraction` — the initial implementation dispatch bundled the whole plan instead of the operator's preferred one-step-per-child execution.
  The operator redirected it before the recorded step-specific execution began; the transcript does not establish that the initial dispatch ran any child turns.
  Impact: an avoidable user intervention and replacement dispatch, with no demonstrated code rework.
- `missing-context` — the planning summary introduced `mirror` without immediately explaining that it was an arbitrary synthetic replacement for `twin`, not a product feature.
  The operator asked what the label meant after the plan was committed.
  Impact: one clarification exchange; no design or code change was needed.
- `instruction-violation` — self-identified by the independent reviewer: `test/tools/spawn-config.test.ts` reset its module-level mock in `afterEach` despite the loaded testing skill requiring `beforeEach`.
  The parent initially left this as a non-blocking WARN; the operator then requested an assessment and approved the fix.
  Impact: the follow-up `test(pi-subagents): reset presentation mock before each test` commit, another review, and updated stage notes; no isolation failure was observed.
- `other` — the isolated trial's first invocation hit pnpm's external `node_modules` link restriction before tests ran.
  The child changed the runner to invoke the installed Vitest executable and reran successfully.
  Impact: one failed invocation and a runner edit, without dependency or production changes.
- `missing-context` — the parent guessed a temporary log glob that did not exist, searched `/tmp/`, and then reran the core suite to obtain its own result.
  Impact: unnecessary artifact lookup before an otherwise legitimate independent verification; child handoff paths would have removed the lookup.
- `other` — ship read back the close comment and issued a PATCH after `issue_close`.
  The current GitHub comment is correctly formatted and the issue is closed; the compact transcript omits the initial tool-result body, so this review does not assign a root cause to the repair.
  Impact: an additional readback and remote edit.

#### What caused friction (user side)

- Stating the one-step-per-child preference at implementation entry would avoid the initial delegation mismatch; the operator's immediate redirect nevertheless kept it from becoming implementation rework.
- The WARN follow-up required mechanical oversight from the operator rather than a new product decision.
  The parent could have presented the small fix's cost and recommendation with the initial warning instead of waiting for a separate assessment request.
- Asking what `mirror` meant was useful feedback on the explanation, not missing requirements from the operator.
  Future summaries can introduce it as an arbitrary test-only label without adding another standing rule.

### Diagnostic details

- Model attribution comes from inline assistant labels in unfiltered transcript reads, not agent definitions.
  The design alternative assessment, Tidy First assessment, plan review, initial pre-completion review, and delta review ran on `openai-codex/gpt-6-astra`.
  The characterization, common producer, activity consolidation, and reconciliation-evidence steps each ran on `openai-codex/gpt-6-sol`.
  The mock-hook warning and mutation correction do not establish a model-capability mismatch; no comparative cost or quality measurement supports a routing change.
- No reviewed friction sequence warrants a rabbit-hole escalation finding.
  The isolated-runner error was followed immediately by an edit and a successful rerun, rather than repeated attempts with the same failing invocation.
- The verification sequence was incremental, not end-only: characterization mutations preceded its commit; the shared-interface step included post-commit root typecheck; activity changes had focused/full tests; the evidence step and both reviewers ran repository gates.
  The remaining feedback gap was deciding how to handle an already identified, inexpensive convention fix, not absence of verification.
- Existing `.pi/skills/testing/SKILL.md` already specifies `beforeEach`, `.pi/skills/clarification-gates/SKILL.md` already requires defining unfamiliar terms, and the planning/TDD prompts already require discriminating mutations.
  Duplicating those instructions in `AGENTS.md` would fail its admission test; this review proposes no new rule for those incidents.

### Follow-up

Both implementation steps in Phase 23 are marked complete in `packages/pi-subagents/docs/architecture/architecture.md`.
The next workflow is `/finish-phase pi-subagents`, including the combined evidence assessment for still-open fork issue 19; child completion alone does not authorize closing that parent.
Only after that disposition should `/plan-improvements pi-subagents` begin another round.

### Changes made

1. Appended this cross-session retrospective to `packages/pi-subagents/docs/retro/f0021-selector-presentation-reconciliation.md`, including transcript-based friction, model attribution, verification timing, and the phase-close handoff.
2. The operator approved notes-only delivery; no changes were made to `AGENTS.md`, `.pi/prompts/`, skills, production code, tests, or `CHANGELOG.md`.
