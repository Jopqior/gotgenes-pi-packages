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
