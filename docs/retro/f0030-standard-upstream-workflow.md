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

## Stage: Implementation — TDD (2026-10-02T12:24:12Z)

### Session summary

Completed all five planned steps with a fresh implementation subagent for each step and a separate fresh-context pre-completion reviewer.
The test preparation, explicit fetch/pinned merge/record split, issue-only entry point and standard lifecycle handoffs, and separate package navigation update are committed; final verification required no implementation fixups.
Measured full-suite totals increased from 8296 tests in 359 files to 8345 tests in 361 files (+49), and the final focused upstream/release run passed 383 tests in 22 files.

### Observations

- Step 1 committed `test(repo): prepare fetched upstream inputs explicitly (#30)` and preserved the explicit production call sites.
  The implementing agent reported that wrong tracking-ref preparation, merging `HEAD` instead of the supplied target, and omitted `--no-tags` each killed the intended helper or topology test.
- Step 2 committed `feat(repo)!: separate upstream fetch, pinned merge, and recording (#30)` with the breaking CLI footer.
  The implementing agent reported discrimination for all seven planned mutation groups: no-argument fetching, tip substitution, merge/record network calls, removed ancestry and primary-checkout guards, skipped tag comparison, and ignored recorder status.
  Merge remains offline and pinned to the exact local approved commit; recording retains online release lookup without an implicit main fetch.
- Step 3 committed `feat(repo)!: route upstream synchronization through issues (#30)` with the breaking entry-point footer, removed `docs/sync/`, and repaired only the historical link in `docs/plans/f0028-sync-approval-policy.md`.
  The implementing agent reported expected reds for the planned exact-match, all-state/pagination, PR, CRLF, query-failure, dedupe, destination, stop-boundary, and workflow-text mutation classes, plus operation-state, candidate-classification, SHA and multiple-match probes.
  Its stop-boundary probe ignored the injected integration command's exit status so the invocation log, rather than a subprocess crash, discriminated.
  All implementing agents reported restoring their mutations before committing; their mutation results are attributed reports, not independent step-5 reruns.
- Step 4 committed `docs(pi-subagents): describe issue-based upstream integration (#30)` separately from the breaking repository-tooling commits.
  No package runtime, public API, module tree, diagram flow or roadmap completion marker changed.
- Step 5 independently ran root `pnpm run test`, `pnpm run check`, `pnpm run lint`, and `pnpm fallow dead-code` sequentially; every gate passed without fixups.
  The focused `pnpm exec vitest run test/upstream-sync test/release --maxWorkers=2` passed, including all four unchanged release-migration tests.
  Correspondence checking, `bash -n`, script help, range/worktree `git diff --check`, and cold-cache root Markdown checking also passed.
- Full-suite totals were recalculated from the baseline and final command logs; the implementing agents reported step deltas of +1, +16 and +32, consistent with the measured +49 total.
  A parallel step-3 validation run transiently timed out an unchanged existing five-second HTTPS fixture; its isolated rerun and reduced-worker focused rerun passed without increasing thresholds.
  Final sequential full-suite verification and the reviewer's independent sequential checks did not reproduce that timeout.
- Cross-checked the Module-Level Changes table against actual changed files.
  Release state, the entire generated correspondence document, schemas, registration, manifests, changelogs, lockfile/workspace configuration, release algorithms, package runtime/tests and historical plan/retro decisions have no unintended diff; the recorder modules changed only explicit-fetch recovery wording, and the historical plan changed only its link.
  Changelog preview contains only the two intended user-visible breaking repository workflow subjects.
- Read-only release prediction now returns a nonempty fork-package prediction after the README change and a successful empty selector prediction.
  This is not publication approval; `/ship` must recheck the actual registered candidate and obtain separate approval of its package identity, scope and destination.
- Pre-completion reviewer: WARN, with no blockers, scoped to the completed implementation before this stage-notes commit.
  The reviewer independently passed all four deterministic gates and verified the issue acceptance criteria, executable snippets, isolated Git tests, documentation, Mermaid rendering and decision surface.
  Manual handoff reading covered dirty/unresolved startup, clean checkpoint resume, advanced or rewritten upstream history, missing review/evidence, unregistered candidates, prediction errors versus no release, declined publication, failed CI, partial release preparation and colliding upstream issue numbers.
- Reviewer warnings: the execution templates check merge/rebase state before startup pull, but synchronization root/main and tracked-cleanliness checks occur after plan lookup.
  Nonconflicting dirty files can therefore permit a fast-forward HEAD movement before the later stop; this remains an unresolved nonblocking warning, not an operator-accepted behavior.
  A real `/upstream-sync` smoke test in a fresh Pi session remains unperformed; snippet/static tests do not prove agent semantic compliance, and lifecycle prose is not runtime enforcement.
- The final exact-target issue recheck remains non-atomic across concurrent independent creators, as documented in the plan.
  No actual upstream synchronization, real GitHub mutation, remote reconfiguration, push, release dispatch, publication or release-state write occurred.
  No substantive deviation, implementation fixup or new follow-up issue was introduced; stage-note commit naming follows the current `/tdd-plan` template rather than the plan's older suggested wording.
  The next handoff is `/ship 30`, with the unresolved reviewer warnings and fresh-session smoke-test limitation retained for the operator.
