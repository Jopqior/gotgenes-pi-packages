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

## Stage: Ship (2026-10-02T12:35:57Z)

### Session summary

Shipped the implementation through the root/main trunk lane and closed issue #30 after exact-commit CI succeeded.
The operator approved the exact closing comment and publication of only `@jopqior/pi-subagents` to npmjs.org with its corresponding fork GitHub Release.
This checkpoint precedes release dispatch; release completion is not claimed here.

### Observations

- The on-disk ship template was read as authoritative; this issue is the workflow refactor, not an upstream-target integration.
- Fast-forward-only synchronization succeeded with seven unpushed implementation/planning commits; root lint and dead-code checks passed before pushing.
  Origin fetch/push URLs both identified the fork and no URL rewrite configuration was found.
- CI run `37006948349` succeeded for the pushed implementation checkpoint.
  The implementation range contained only issue-30 work; no adopted PR or co-shipped issue required closure.
- Registered candidate discovery returned only `pi-subagents`, with no unregistered directories.
  Its read-only predictor succeeded with `pi-subagents-v4.0.6`; this remains a prediction until the approved release completes.
  Dispatch must recheck the prediction and pin the reviewed main tip.
- The implementation's nonblocking startup-order warning and unperformed fresh-session command smoke test remain recorded above; this ship performed no actual upstream synchronization.
- No worktree teardown or roadmap phase closure applies.
  After release verification, the next interactive stage is `/retro 30` at root/main.

## Stage: Final Retrospective (2026-10-02T12:56:01Z)

### Session summary

Reviewed the planning, implementation, and ship transcripts, their stage notes, and the subagent transcripts for the workflow refactor.
The ship transcript continues beyond its committed checkpoint: CI and release verification completed, `@jopqior/pi-subagents@4.0.6` shipped, and issue #30 closed; this retrospective rechecked the closed issue and the fork GitHub Release.
The operator approved notes only, with no workflow edits, new issue, or actual upstream integration.

### Observations

#### What went well

- The preparatory commit `test(repo): prepare fetched upstream inputs explicitly (#30)` separated valid fixture setup from the breaking CLI change.
  The assessor identified how missing mandatory targets could mask existing precondition failures, and the implementation retained visible production calls and targeted mutation checks instead of introducing a compatibility wrapper.
- After the delegation correction, each implementation step used a fresh agent, while the parent inspected commit boundaries and a separate reviewer checked the completed result.
  This provided useful handoffs without rebuilding the retired approval ledger.
- Executing the real prompt snippets gave the issue-entry tests a concrete surface to exercise, including invocation-log checks for forbidden integration commands.
  The implementation and reviewer explicitly distinguished that evidence from live agent compliance rather than claiming that text tests enforced the whole workflow.

#### What caused friction (agent side)

- `premature-convergence`: implementation initially attempted to delegate the whole plan to one agent; the operator requested a fresh agent for each step.
  Impact: an abandoned dispatch and an extra operator intervention, but the parent reported that the original delegation performed no work and no code needed reverting.
  This was a newly clarified execution preference, not evidence of violating an earlier per-step instruction.
- `missing-context`: planning guessed `.pi/skills/colgrep/SKILL.md` and a nonexistent `scripts/release/release-packages.mjs` instead of resolving the advertised skill location and actual export first.
  Impact: failed reads/import and recovery calls; the registry error was resolved by `grep`, reading `release-correspondence.mjs`, and retrying the actual signature.
  Existing path-discovery guidance already covers this; no additional rule is warranted.
- `other` (validation contention): step 3 launched type checking, lint, the focused suite, and release prediction concurrently; an unchanged HTTPS recorder test timed out.
  Impact: an isolated test-file rerun and a reduced-worker focused rerun were needed, without changing timeout thresholds or implementation.
  Contention is consistent with the observations, not a separately proven root cause.
- `other` (incomplete ordering follow-through): the planning assessor highlighted startup pulls occurring before plan-specific checks; the completed execution prompts still check synchronization root/main and tracked cleanliness after startup synchronization.
  Impact: the final reviewer retained a nonblocking warning, and shipping did not resolve it or establish explicit acceptance of dirty-startup HEAD movement.
  The merge/rebase startup guard addressed only part of the broader ordering concern.

#### What caused friction (user side)

- The operator had to redirect delegation granularity after the initial dispatch.
  Stating a per-step fresh-context preference at implementation kickoff would avoid that interruption; the agent can also expose its intended delegation boundary before launching a whole-plan task.
  The correction was early enough to prevent implementation rework.
- Scope, landing topology, and publication decisions were strategic approvals rather than mechanical supervision.
  No additional user-side friction is supported by the inspected transcripts.

### Diagnostic details

- Model attribution comes from type-unfiltered transcript turns, not agent definitions.
  Planning, implementation coordination, ship, and the independent reviewer used `openai-codex/gpt-6-astra` in the inspected turns.
  The planning Explore agent, Tidy-First assessor, and each of the five implementation-step agents used `openai-codex/gpt-6.1-sol` in their inspected transcript turns.
  No child transcript was found for the abandoned whole-plan dispatch, so its execution model is not inferred.
- The substantive implementation and review tasks justified reasoning-capable models; the documentation-only fourth step also used `openai-codex/gpt-6.1-sol` and is a candidate for a cheaper model on comparable future work.
  No cost or comparative-quality measurement was collected, so this is not a recommendation to change configured defaults.
- No inspected failure sequence showed more than five consecutive tool calls stuck on the same error.
  After the parallel timeout, the agent inspected the failure, notified the parent, and changed to an isolated rerun; it did not repeatedly rerun the same overloaded arrangement.
- Available discovery tools could have avoided the guessed module path and skill location.
  Explore and `colgrep` were actually used elsewhere in planning, so the gap was local tool selection, not an unavailable capability or a need for another agent type.
- Verification was incremental: focused suites and mutation checks accompanied implementation steps, documentation changes received lint and focused tests, and the final verifier and reviewer ran the full gates independently.
  The remaining feedback gap is semantic: a fresh-session `/upstream-sync` smoke test remains unperformed, and successful CI or publication does not close that gap.

### Remaining work and next-action boundary

The startup-cleanliness ordering warning remains unresolved.
A fresh-session `/upstream-sync` smoke test remains unperformed.
Neither release success nor snippet tests establish live workflow compliance.
Any startup-order behavior change should be scoped and tested separately rather than hidden in a retrospective documentation commit.

The plan declares this repository change independent of package roadmap phases and names no successor.
The newest triage, `docs/triage/2026-09-18-backlog.md`, ranks work in `gotgenes/pi-packages`, not this fork, so its issue numbers and severities do not select a fork successor.
A live fork query returned open issues #25 and #26, but neither has a successor rank established by this plan or triage; no ranked next issue or phase-close command is inferred.

### Changes made

1. Appended this cross-session synthesis, model attribution, unresolved warnings, and release-completion context to `docs/retro/f0030-standard-upstream-workflow.md`, preserving all prior stage entries.
2. Recorded the operator's notes-only decision; no changes were made to `AGENTS.md`, prompts, skills, runtime code, tests, release evidence, or changelogs.
