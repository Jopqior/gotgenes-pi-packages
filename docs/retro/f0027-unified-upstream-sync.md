---
issue: 27
issue_title: "Add a unified upstream-sync workflow and remove redundant artifacts"
---

# Retro: #27 — Add a unified upstream-sync workflow and remove redundant artifacts

## Stage: Planning (2026-09-27T11:12:04Z)

### Session summary

Committed the numbered implementation plan at `docs/plans/f0027-unified-upstream-sync.md` as `a3dbdf2544f305adecb3859b1b93da83b931833c` after the required fast-forward-only pull reported the checkout current.
Read the completed issue-28 rule-review handoff, issue-29 release-tooling handoff, actual sync/release scripts and tests, active consumers, and Pi prompt-template documentation.
The next stage is `/tdd-plan`; no implementation, upstream fetch/merge, remote change, push, publication, or GitHub mutation occurred.

### Observations

- The operator selected `invocation=no_args`, `script_scope=harden_here`, and `baseline_test=include`.
  The workflow will recover from matching execution records, stop on fast-forward-only topology, and include the newly observed migration-test failure as its first preparatory step.
- Issue 28 has finished deliberation but remains open for activation acceptance; its historical review is not an active policy source.
  Issue 29 is closed, and release correspondence/guidance already have release-owned homes, so this plan does not repeat that migration or change release algorithms.
- Measured baseline: the release/upstream-sync suite returned 244 passing tests and one failure; the isolated migration test reproduced the same failure because the live state legitimately gained the published `pi-subagents-v4.0.4` record.
  The plan preserves exact historical entries and permits append-only growth rather than editing evidence or hiding the failure.
- The current HEAD's CI run reports failure, but its logs were not inspected and no CI root cause is claimed.
  The correspondence check passed; both registered package predictors reported no pending release at the planning baseline; read-only registry and GitHub queries confirmed the existing fork publication.
- The Tidy-First assessor recommended the migration-test correction and explicit canonical remotes in the scratch-network fixture.
  The parent read the real fixture: it currently leaves upstream absent and retains a local filesystem origin, which the new complete-identity guard must reject.
- Default script execution is mutating discovery, and recording also fetches; the plan preserves those facts rather than describing either as offline.
  Script protections remain separate from human authorization, with an expected-upstream OID guard preventing a second fetch from silently changing the inspected merge target.
- Cleanup removes obsolete recipes rather than re-archiving them, retains technical selector trials as bounded package evidence, migrates factual sync rows without invented approvals, and deletes the consumed issue-29 handoff.
  A pointer-only handbook stub exists for one intermediate implementation checkpoint, then is deleted with the final package navigation changes.
- Package README changes remain in a separate documentation commit from repository-workflow breaking commits so the latter do not imply package API breakage.
  Publication remains independently approved; this planning session authorizes none.
- A read-only command initially treated `readReleasePackages()` as an array; the corrected command uses its `.packages` field and was rerun successfully before the plan recorded it.
  Markdown lint and plan commit hooks passed.

#### Deferred tidyings

- `test/upstream-sync/helpers/upstream-network.mjs` and release fixtures: cross-fixture consolidation would mix different test lifecycles and is not needed for the targeted guards.
- `scripts/upstream-sync.sh`: a generic URL-validator abstraction would obscure the distinct fixed repository roles; use narrow local checks instead.

## Stage: Implementation — TDD (2026-09-27T13:58:47Z)

### Session summary

Completed all six numbered implementation steps and two review-driven corrections, with nine implementation/documentation commits before this stage note.
The sync script now requires explicit missing-remote transport selection, validates complete repository identities before merge/record effects, protects tag objects, pins freshly fetched merge inputs, and refuses unsafe topology; the unified prompt owns approval-aware synchronization and independently authorized publication, replacing the old handbook.
The measured root script suite grew from 475 tests (one initial failure) to 564 passing tests, a net increase of 89; workspace tests, root type checking, lint and dead-code checks also passed in the final independent review.

### Observations

- The required initial fast-forward-only pull reported the checkout current, and the working tree was clean.
  Type checking, lint and dead-code baseline checks passed; the root test failure reproduced the planned migration-baseline mismatch caused by the legitimate later release record.
  Step 1 retained exact ordered historical prefixes in parsed and raw state without editing committed release evidence.
- The parent completed steps 1–2 and began step 3 before the operator requested a fresh subagent for each subsequent step.
  A new agent completed step 3 from the explicitly handed-off uncommitted tests/script changes and Red log; independent fresh agents then completed steps 4, 5 and 6 sequentially.
  Review corrections likewise used separate agents; no parallel editing of shared files occurred.
- Script steps used isolated real Git networks and deliberate killing mutations, restoring saved green files rather than discarding edits through Git.
  The first step-2 missing-upstream mutation initially failed in the fixture helper; the characterization was tightened to obtain the absent URL and fail its identity assertion explicitly.
  Step 4 additionally checks tag drift after a failed fetch and rejects an expected OID whose length does not match the repository object format.
- The first independent pre-completion review returned FAIL despite green deterministic checks.
  F1 identified that a nonstandard remote fetch mapping could leave cached `upstream/main` stale, while the network wrapper silently supplied the missing mapping.
  The approved correction moved the explicit main-to-tracking-ref mapping into production, removed that behavior from the wrapper, and added real-Git regression tests for discovery, merge, expected-target rejection and recording.
- F2 identified that cached `origin/main` could not prove the live fork destination was unchanged or already held the approved commit.
  Its first correction added live queries but the second review returned FAIL because requiring the original remote baseline forever blocked recovery after the workflow's own approved push or release.
  The operator approved both correction rounds; the final prompt preserves the historical baseline separately from the current stage's expected remote OID, derived only from actual authorization, execution, exact run/tag identities and readback evidence.
- The rejected prompt rewrite remained uncommitted until a fresh reviewer returned **Overall: WARN**, then was committed unchanged as `fix(repo): verify live fork state across sync resumes (#27)`.
  The final review verified initial push, already-pushed no-op, post-push CI resume, release preparation and visibility resume, partial prepare failure, missing evidence and unknown remote movement against the actual workflow and release implementation.
  Manual policy walkthroughs are not runtime authorization-enforcement tests, and no real synchronization or release was used for acceptance.
- Reviewer warning: the existing releasing skill still overstates that a failed prepare leaves no tags and gives overly broad failed-job retry advice; GitHub CLI job reruns can include dependencies.
  The new sync prompt explicitly requires checking partial remote writes and retry scope, stopping if it cannot establish recovery without repeating preparation.
  Updating the generic release owner remains outside these corrections; no follow-up issue was filed or generic ship workflow changed.
- Step 5 encountered one merge-test timeout; its isolated rerun and complete suite rerun passed.
  The final independent review passed `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm fallow dead-code` and `git diff --check`.
  Additional whole-workspace `verify-cliff-parity.sh` exited nonzero because inherited packages lack local fork release tags; the two registered fork packages passed its comparison, and the failure is recorded rather than represented as a passing gate.
- Historical sync rows were migrated without inventing approvals; the handbook and consumed handoff were deleted, with package navigation changes isolated from breaking repository-tooling commits.
  No package runtime, dependency, release state/schema or algorithm changed; lockfile/workspace configuration remained unchanged.
  No actual upstream fetch/merge, remote configuration, push, publication or GitHub mutation occurred, and issues 27 and 28 remain open.
  The next lifecycle action is `/ship 27`; publication still requires its own exact package/scope/destination approval, and the new `/upstream-sync` command needs a fresh Pi session.

## Stage: Ship (2026-09-27T14:14:48Z)

### Session summary

Shipped the trunk implementation after fast-forward-only synchronization, root lint and dead-code checks, and successful CI run 36324565200 for `97fad1fad9d1345e58d324a01a6fe71056940aad`.
The operator approved both exact English close comments and publication of `@jopqior/pi-subagents@4.0.5` to `https://registry.npmjs.org/` with the fork GitHub Release; issues 27 and 28 are closed.
Release run 36324980132 succeeded for that approved SHA and produced `pi-subagents-v4.0.5` at `2a1949aa3852e197052d929cdb23284cc0a0295e`, whose parent matches the approved implementation tip.
GitHub Release readback succeeded, but npm visibility remains pending verification.

### Observations

- The plan recommended independent release; the only package candidate was `pi-subagents`, and the predictor printed `pi-subagents-v4.0.5` both before approval and before dispatch.
  Repository-workflow breaking commits did not cause a package API major release.
- The initial `pnpm view @jopqior/pi-subagents@4.0.5 version dist.integrity --registry=https://registry.npmjs.org/` returned `ERR_PNPM_PACKAGE_NOT_FOUND`.
  Each of four retries after an additional 30-second wait returned the same error, for 120 seconds of explicit waits; the last readback completed at the stage timestamp above.
  The exact release job log reports publication to npmjs.org succeeded; no version or integrity was returned by the local readback, so this is not recorded as verified registry visibility.
  Recheck the same exact identity at the start of `/retro 27`; inspect registry/readback configuration and the existing run before any recovery, and never blindly republish or redispatch.
- No upstream synchronization, third-party PR closure, sibling package release, worktree merge or teardown occurred.
  This repository-scoped issue is not a package roadmap phase tail.
- The implementation review's generic failed-prepare/retry warning remains outside this ship's scope; this successful release required no retry.
  The new `/upstream-sync` command still requires a fresh Pi session for registration.

## Stage: Final Retrospective (2026-09-27T14:24:08Z)

### Session summary

Reviewed the planning, implementation and ship transcripts alongside their stage records, implementation subagent reports and the actual release recovery surfaces.
The unified workflow shipped and issues 27 and 28 are closed; the previously pending npm readback now returns `@jopqior/pi-subagents@4.0.5` with nonempty integrity, and the exact GitHub Release remains visible.
The operator approved correcting the release owner's recovery advice and removing mandatory npm visibility polling after successful publication.
No release code or publication was changed.

### Observations

#### What went well

- Independent review found meaningful defects after all deterministic checks passed: the fixture-supplied fetch mapping and the resumed-workflow baseline invariant.
  Keeping the rejected F2 rewrite uncommitted allowed its correction and another fresh review before `fix(repo): verify live fork state across sync resumes (#27)` landed.
- The new bounded publication-readback procedure encountered its own pending-visibility case during ship.
  The agent retained the exact run and package identity instead of repeating publication; this session's readback completed that handoff without a remote mutation.
  The returned integrity was `sha512-7ChIPXN0W64fJ2ue/t4+U8ZnO1UfA/zuXrp8xForq9WKhKJ2jRFweMTVqN0I5HaCUxcQwkG6LVH6h9hAA3OVqQ==`.
  Successful later visibility does not establish why the earlier queries failed.

#### What caused friction (agent side)

- `missing-context`: the existing wrapper in `test/upstream-sync/helpers/upstream-network.mjs` supplied a refspec that production did not supply.
  Canonical URL preparation and green Git-network tests did not expose that semantic difference; the first reviewer identified it, and `fix(repo): bind sync to freshly fetched upstream main (#27)` moved the explicit mapping into production and added regression cases.
  Impact: an extra corrective implementation commit and review cycle after the planned steps.
- `wrong-abstraction`: the first F2 correction treated the original remote baseline as the required live state for every later stage.
  It stopped unrecorded remote movement but also stopped recovery after the workflow's own authorized push or release.
  Impact: a second FAIL, another operator approval and a rewrite separating immutable historical B from evidence-backed current P or R.
- `missing-context`: at review time, `.pi/skills/releasing/SKILL.md` said a failed `prepare` means nothing was tagged and suggested rerunning a later failed job without checking dependencies.
  This session independently read `scripts/release/prepare-release.sh`: it pushes main and tags before writing workflow outputs, and its push is not atomic.
  The installed `gh run rerun --help` explicitly includes dependencies for both `--job` and `--failed`.
  Impact: the new sync prompt needed a local safety override, while generic callers retained misleading recovery advice; no actual failed-release recovery occurred here.
- `other` (execution preference discovered mid-step): the operator asked for a fresh subagent per step after the parent had started step 3.
  The parent handed over the uncommitted implementation and Red evidence, then used fresh sequential workers for subsequent steps and corrections.
  Impact: a mid-step handoff, without discarded work.
  This was not an instruction violation: the earlier workflow did not require that delegation mode.
- `other` (bounded external readback failure): ship made the initial npm query and four prescribed retries, with 120 seconds of explicit waits, without obtaining a version.
  Impact: publication visibility remained pending across the session boundary; the current exact-identity query succeeded.

#### What caused friction (user side)

- Stating the per-step delegation preference before implementation would avoid a mid-step handoff; the agent can also surface its intended execution mode at the start rather than require mechanical supervision.
  The preference was honored once stated and is not generalized into a permanent default by this retro.
- The operator had to approve two correction rounds because the first repair introduced a recovery regression.
  The opportunity is for the agent to walk authorized success transitions as well as rejection cases before presenting a repair, not to shift technical validation onto the operator.

### Diagnostic details

- Model attribution comes from type-unfiltered transcript turn labels, not agent definitions.
  Planning, implementation orchestration and ship used `openai-codex/gpt-6-astra`.
  The Tidy-First assessor used `openai-codex/gpt-6-sol`; the fresh workers for steps 3, 4, 5 and 6, F1, initial F2 and the corrective F2 rewrite also used `openai-codex/gpt-6-sol`.
  All three independent reviewer reports used `openai-codex/gpt-6-astra`.
  The corrective worker was later resumed on `openai-codex/gpt-6-sol` to commit its reviewed diff unchanged; this mechanical continuation could have stayed with the parent, but no measured cost comparison supports a model-quality claim.
  Both reasoning and implementation workers made useful contributions; the observed failures concern fixture fidelity and state modeling, not an established model mismatch.
- Feedback-loop analysis: baseline checks preceded edits, the parent ran focused Red/Green and killing mutations for the preparatory steps, and workers ran focused suites and root checks before handoff.
  All three reviewers reran deterministic checks; the gap was the scenario set, not verification delayed until the end.
  The initial F2 walkthrough needed the successful B-to-P-to-R resume path alongside third-party movement and missing-evidence cases.
- No observed failure sequence warrants a rabbit-hole escalation finding: review findings went promptly to an operator gate and fresh corrective workers.
  The four ship waits followed the explicit bounded policy; they were not unbounded retries.
  An unused exploration tool is not the missing remedy here: independent review was used and found the defects that green tests missed.

### Proposed adjustment

Replace the release skill's unconditional failed-prepare and failed-job retry advice with live-state verification and a dependency-scope check, preserving its tagged-checkout preflight.
This belongs in `.pi/skills/releasing/SKILL.md`, the shared owner already loaded by release callers, rather than in `AGENTS.md` or another prompt-specific exception.
Do not add another generic real-surface rule, mandate fresh agents for every future plan, increase the visibility retry budget, or redesign release recovery in this documentation-only retro.
After asking where the npm readback requirement originated, the operator approved removing it alongside the recovery correction.
The requirement was introduced by `feat!: require approval for uncovered upstream integration changes (#27)` in the shared release skill and referenced by the sync prompt; it was workflow policy, not a technical prerequisite.
The new completion criterion is a successful approved workflow plus verified release commit, tags and GitHub Releases; npm queries remain for publication-failure investigation or explicit operator requests.
Earlier planning, acceptance and ship records retain their historical requirements and observations.

### Next-work context

The plan places this issue outside a package roadmap, with no successor step.
The latest triage, `docs/triage/2026-09-18-backlog.md`, ranks inherited `gotgenes/pi-packages` work and supplies no fork successor.
A live fork issue query returned only issues 25 and 26 open; neither is ranked by that triage, so no inherited priority or phase-close obligation is transferred to this fork.

### Changes made

1. Appended this cross-session retrospective to `docs/retro/f0027-unified-upstream-sync.md`, including the successful exact-version readback and the operator's revised completion policy.
2. Replaced unsafe failed-run retry advice in `.pi/skills/releasing/SKILL.md` with live-state inspection, explicit retry approval and job/dependency-scope verification.
3. Replaced mandatory npm polling and pending-visibility handoffs in `.pi/skills/releasing/SKILL.md` with workflow, release commit/tag and GitHub Release completion checks.
4. Updated `.pi/prompts/upstream-sync.md` to use those completion checks and removed its mandatory registry-readback record field and delayed-visibility instructions.
   Verification: `pnpm run lint` and `git diff --check` passed; the final diff was inspected for retained push, publication-approval and recovery safeguards.
   No runtime files changed, so runtime tests were not rerun for this retrospective.
