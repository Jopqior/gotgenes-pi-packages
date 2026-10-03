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

## Stage: Implementation — TDD (2026-10-03T00:49:27Z)

### Session summary

Completed two TDD cycles for the atomic release-document path migration and synchronization-guidance consolidation, followed by the separate package README navigation commit and final validation.
The generated correspondence region remained byte-identical at 2581 bytes; the full suite remained at 8345 passing tests (delta zero), including 383 tests in the focused upstream/release suite.
Pre-completion reviewer: PASS for `16f7ff33c15409e3c91c971a7e6e29dc04a9eec3..2ed193510e8537388563c8d943c1f7d16d0ac36b`.

### Observations

- Startup found no pending merge/rebase, `main` was already current after `git pull --ff-only`, and the tracked working tree was clean.
  Both baseline and final root check, lint, test, and dead-code gates passed.
  Final checks also covered the focused suite, correspondence regeneration check, shell syntax, cold-cache Markdown links, and `git diff --check`.
- Step 1 Red produced 14 failures and 24 passes in the targeted files; Green and the restored focused suite passed.
  Restoring the old configuration path killed three target/CLI tests; restoring the old shell copy destination failed preparation; omitting the table from staging failed the clean-tree assertion.
  Each mutation used a separately saved Green copy and was restored before committing.
- Step 2 Red produced four failures and seven passes.
  Removing the conditional guide link, removing startup fetch/pull timing, and reinserting a pinned-target branch each produced one failure and ten passes.
  These mutations establish bounded structural predicates, not agent compliance; existing executable operation-state, candidate, and issue-entry snippets remained byte-identical.
- All Module-Level Changes entries were touched.
  Active old-path references remain only in assertions that the former generated output does not exist; historical plan/retro code-span paths were left intact.
  Algorithms, schemas, state, published changelogs, package runtime, and the generic reviewer were unchanged.
  No package architecture or roadmap update was needed for the README-only package change.
- Manual guide review covered dirty startup, linked worktrees, unfinished operations, advancing upstream tips, automatically merged customizations, missing evidence, and colliding incoming issue numbers.
  The guide retains stop conditions, the approved target, full review surfaces, and verified fork-only closure without putting classification into ordinary prompts.
- Fresh-process rehearsal used two separate `pi --approve --offline --tools read,grep,find,ls --no-session --mode json` invocations from the root with normal discovered resources.
  Each received a read-only hypothetical startup scenario and stopped before shell commands, Git mutation, or issue creation.
  The ordinary task read `.pi/prompts/tdd-plan.md` and the shell-traps skill, did not load the synchronization guide, and proposed operation-state inspection before ordinary branch synchronization.
  The synchronization-resume task read the same template and the new guide, then proposed primary-checkout/main, tracked cleanliness, unmerged-entry, and pending-operation checks before any fetch/pull.
  Both exited successfully; each scenario was observed once, without repeated trials or cache controls, so this is a bounded walkthrough rather than a reliability result or evidence that actual Git prerequisites passed.
- Both rehearsal processes warned about the unchanged TypeBox dependency placement in `packages/pi-subagents/package.json`.
  The planning context already identifies fork PR #33 for that separate work; it was not added to this implementation's scope.
  The reviewer could not read external temporary logs under its scope rules, so the parent supplied both complete tool-call lists, final outputs, and stderr through a message before the final PASS.
- No substantive plan deviation was needed.
  A long conditional-loader sentence was split to avoid a Markdown link-check false positive.
  The path move retains the approved breaking repository-tooling classification, while the package link correction is a separate documentation commit.
  No actual upstream integration, GitHub mutation, push, or publication occurred.
  Next action: `/ship 31`, preferably in a fresh Pi session so the changed templates and guidance are loaded; publication remains separately approval-gated.

## Stage: Ship (2026-10-03T01:00:24Z)

### Session summary

Shipped through the trunk lane from the root checkout on `main`.
Pushed the implementation, verified CI, closed fork issue #31 with operator-approved wording, and released `@jopqior/pi-subagents` 4.0.7 to npmjs.org after separate explicit approval.

### Observations

- No issue-31 feature branch or pending merge/rebase was present; the startup fast-forward pull was current with six local commits ahead.
  Root lint and dead-code checks passed before pushing.
- Implementation CI run 37083933855 succeeded for `bb62c2238cf9267f3c0c3c32a48e2c8a430a91d4`.
  The plan-parent implementation range contained no co-shipped issue or adopted PR close target; PR #33 remains unrelated.
- Registered-candidate discovery returned only `pi-subagents`, with no unregistered changed package.
  Both version predictions succeeded with `pi-subagents-v4.0.7`; the package history since its previous release contained only this issue's README provenance-link correction.
- The operator approved the exact close comment and separately approved only `@jopqior/pi-subagents` for npmjs.org.
  Release run 37084285015 succeeded, including preparation, publication, and GitHub Release creation.
  The verified tag resolves to `1ac3ac362b2367a8db7df268a049f29f005275b1`, whose parent is the approved implementation SHA; the tagged manifest names the approved package and version.
  The release commit changed only its manifest, changelog, correspondence table, and release evidence; the exact GitHub Release tag was verified before pulling the release commit.
- No worktree teardown or roadmap phase close applies to this repository-scoped trunk change.
  No upstream synchronization was performed, and no npm registry polling was needed after the successful release.
  Next action: `/retro 31` from the root checkout on `main`.
