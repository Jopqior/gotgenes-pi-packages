---
issue: 30
issue_title: "refactor(repo): move upstream synchronization into the standard issue workflow"
---

# Retro: #30 — Move upstream synchronization into the standard issue workflow

## Stage: Planning (2026-10-01T15:43:47Z)

### Session summary

Read the issue, installed synchronization and release mechanisms, standard lifecycle prompts, existing tests, and historical workflow rationale, then committed `docs/plans/f0030-standard-upstream-workflow.md`.
The operator confirmed repository scope, root/main trunk integration, and explicit fetch/merge/record operations.
No implementation, real upstream fetch/merge, remote configuration, issue creation, push, or publication occurred.

### Observations

- `git pull --ff-only` reported the checkout current; the issue author and authenticated user both resolve to `Jopqior`.
  No prior issue-30 retro was found, and the fork open-PR sweep returned none.
- The plan retires the dedicated execution workflow and `docs/sync/`, not the genuine two-parent merge or release evidence contract.
  The recorder still queries upstream releases after its implicit main fetch is removed; it must not be described as offline.
- Existing `/ship` assumes a package can be inferred from the plan path and scans incoming commit issue references.
  The minimal integration adds registered-candidate discovery for repository scope and limits synchronization close targets to verified fork work, preserving the ordinary feature-worktree route.
- A fresh-context Tidy-First assessor recommended explicit fetched-input preparation in the existing Git test fixture before requiring merge targets.
  Accepted as the first test-only step; this keeps invalid-remote and dirty-state assertions from passing merely because a new argument is absent.
- The tag injector currently fires after fetch only, and recording ends with `exec node`.
  The behavior-change step must move recording tag probes and comparison to its remaining online operation together; changing fetch assertions alone would leave dead tests.
- The only discovered live relative link into the deleted tree is in `docs/plans/f0028-sync-approval-policy.md`.
  Replace its destination with a Git-addressed historical document, keeping historical decisions and other code-span path mentions intact.
- Measured baseline: `pnpm exec vitest run test/upstream-sync test/release` passed 20 files and 334 tests; correspondence checking passed, and both registered package predictors reported no pending release.
  The future package README correction remains a separate nonbreaking documentation commit and may affect its release prediction.
- Read-only GitHub query and exact-line paginated lookup were exercised without issue creation.
  Positive and failure-path entry-point cases are planned synthetic contract tests, not a replay of the abandoned synchronization.
- An initial registry inspection guessed a nonexistent module path and failed; the corrected call used the actual `readReleasePackages(file, repo)` export from `scripts/release/release-correspondence.mjs` and validated both identities.
- Plan lint and commit hooks passed.
  The next stage is `/tdd-plan`; changed prompt behavior must be smoke-tested in a fresh Pi session rather than the session that rewrites it.

#### Deferred tidyings

- `scripts/upstream-sync.sh`: a whole-script decomposition or generic URL/GitHub orchestration layer would expand the change without preparing the agreed operation split.
- `test/upstream-sync/helpers/upstream-network.mjs`: an old/new CLI compatibility wrapper would hide the production act; keep explicit calls and local preparation instead.
- `test/upstream-sync/merge.test.mjs`: a complete file reorganization is unnecessary; migrate existing concern groups without a large rewrite.
- `scripts/release/fork-sync/record.mjs` and `scripts/release/fork-sync/evidence.mjs`: algorithm refactoring and shared diagnostic infrastructure are unrelated to the required recovery wording changes.
