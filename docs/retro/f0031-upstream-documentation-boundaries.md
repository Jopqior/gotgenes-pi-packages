---
issue: 31
issue_title: "refactor(repo): consolidate upstream documentation and decouple generic workflows"
---

# Retro: #31 — Consolidate upstream documentation and decouple generic workflows

## Stage: Planning (2026-10-03T00:08:13Z)

### Session summary

Restarted planning from the replacement issue specification and the restart decisions in `docs/retro/f0030-standard-upstream-workflow.md`, not the discarded issue-31 artifacts.
Committed `docs/plans/f0031-upstream-documentation-boundaries.md` with numbered migration, workflow-boundary, package-navigation, and final verification steps.
No implementation, real upstream fetch/integration, release dispatch, publication, or GitHub mutation was performed.

### Observations

- Startup `git pull --ff-only` reported already current; the working tree was clean, the branch was `main`, and `gh repo view` resolved to the fork.
  Issue #31 is open and operator-authored; prerequisite #30 is closed and implemented.
- The operator selected `docs/upstream/synchronization-guide.md`, `fork-release-policy.md`, and `pi-subagents-release-correspondence.md`, with distinct synchronization, release-policy, and generated-view ownership.
  The operator also selected only an `AGENTS.md` conditional loader before actual synchronization Git operations, including startup fetch/pull, without ordinary-task classification or per-prompt loading branches.
- The generated-document default-path move is classified as breaking repository tooling, while the package README correction is a separate nonbreaking documentation commit.
  Runtime APIs, CLI flags, schemas, evidence, version derivation, and separate publication authorization remain unchanged.
- The general operation-state guards, repository-scope/root-test support, registered-candidate discovery, publication safeguards, and synchronization branches arrived together in issue #30.
  Targeted edits are required; a whole-file rollback would remove accepted general improvements.
- Read the default range logic in the pre-completion skill and reviewer as well as synchronization shipping branches.
  The dedicated guide must explicitly require the merge-first-parent integration range and a reviewer dispatch overriding default tag/plan ranges, plus incoming and remerge inspection; merely deleting branches would not preserve review scope.
- Planning baseline: `pnpm exec vitest run test/upstream-sync test/release --maxWorkers=2` passed 22 files and 383 tests.
  Correspondence checking passed, script help confirmed the retained CLI, and absolute Git/common-directory paths matched the root checkout.
  Structural documentation checks and executed snippet tests are not evidence of live agent compliance; the implementation plan calls for a bounded fresh-session read-only walkthrough with that limitation recorded.
- The correspondence CLI and artifact builder already read `forkSyncTarget.correspondencePath`; shell preparation separately copies and stages the document.
  The path move must update both readers and writer/staging paths with fixtures in one commit, including existing workflow-contract reads before their later contract rewrite.
- Keep strict schema/migration regression tests while removing completed internal rename narration.
  Keep `docs/history-restoration.md`: external old clones and immutable-artifact disclosure remain a distinct concern, not verified obsolete synchronization instructions.
- Fresh-context Tidy-First assessment recommended no preparatory commits.
  Its optional same-file test regrouping was declined because executable blocks can remain intact during the bounded contract update.
- An initial skill read guessed the wrong colgrep skill path and failed; the advertised package skill path was then loaded.
  No new rule is needed for this already-documented path-discovery failure.
- No concrete follow-up issue was identified; the open TypeBox dependency PR does not overlap this task.
  Next stage is `/tdd-plan`, with no actual upstream integration or publication authorized.

#### Deferred tidyings

- `scripts/release/prepare-release.sh`: a shared cross-language correspondence-path abstraction would broaden a copy/stage path update without simplifying this migration.
- `test/release/`: consolidating existing scenario/scaffold frameworks is unrelated to moving their document fixtures.
- `test/upstream-sync/workflow-contract.test.mjs`: a general document parser, classifier, or orchestration harness is unnecessary for bounded navigation checks and retained executable fences.
- `scripts/release/fork-sync/`: algorithm and unchanged-module cleanup does not prepare the documentation-boundary change.
