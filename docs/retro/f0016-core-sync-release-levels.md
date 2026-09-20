---
issue: 16
issue_title: "Derive fork core sync releases from upstream version changes"
---

# Retro: #16 — Derive fork core sync releases from upstream version changes

## Stage: Planning (2026-09-19T16:02:42Z)

### Session summary

Committed `docs/plans/f0016-core-sync-release-levels.md` as `docs: plan upstream-derived core sync releases (#16)` on `issue-16-core-sync-release-plan` after a successful fast-forward-only pull reported the checkout current.
The plan covers verified upstream correspondence, separate fork-core classification, one shared offline predictor, release-time state persistence, and real-Git regression tests.
No implementation, upstream synchronization, push, tag rewrite, or publication was performed.

### Observations

- The operator confirmed repository-level scope and chose to block release when upstream evidence is unreliable or includes unreleased core changes, with no upstream-level override.
  Reviewed fork-core conflict-resolution contributions remain separately classified; they are not an override for missing upstream evidence.
- The issue author matches the authenticated fork operator.
  Fork issues 11 and 13 are implemented prerequisites; issue 14 provides the real regression history, and the open selector-policy issue 15 stays separate.
  The newest triage is inherited upstream context, and inherited unprefixed issue-16 retros describe unrelated package work.
- The actual issue-14 merge was reproduced in a shared-object scratch clone with no imported tags and only its historical fork baseline tag restored locally.
  Its real `next-version.sh` returned `pi-subagents-v2.0.0`; current main returned nothing pending at published `2.0.0`.
  Upstream tag OIDs, manifests, ancestry, published GitHub Release status, and the absence of in-scope core commits after the selected upstream release were checked independently.
- A first direct historical-range probe in the current checkout picked up later tag metadata and returned `3.0.0`.
  The isolated clone corrected the experiment; preserve historical refs as well as history in the regression fixture.
- With git-cliff `2.14.1`, `--skip-commit` alone did not lower the historical bump.
  Filtering the exported context and invoking `--from-context --bumped-version` produced the expected patch; empty context retained the baseline version.
  This validates the context adapter, not a blanket merge-ignoring policy.
- The fresh-context Tidy-First assessment recommended reusable release fixtures and a shared prediction entry point; both became preparatory steps.
  Its NUL-printing proposal for shell scope arguments was replaced with direct argument-array forwarding, avoiding a second scoping representation.
  Existing generic test assertions stay unchanged while setup is extracted.
- `pnpm run test:scripts -- test/release/bumped-version.test.mjs` actually ran the entire root suite: 10 files and 160 tests passed.
  Use `pnpm exec vitest run <paths>` for targeted runs; root Vitest configuration is `vitest.config.mjs`, not `vitest.config.ts`.
- The change is classified as breaking release-tool behavior because defaults and refusal conditions change, not as a core runtime API break.
  All planned implementation paths are outside package release scope; shipping this tooling alone authorizes no npm release.
- Plan lint and commit hooks passed.
  The next stage is `/tdd-plan`; run no second Tidy-First assessment.

#### Deferred tidyings

- `test/release/bumped-version.test.mjs` and `test/upstream-sync/merge.test.mjs`: do not unify single-repository release fixtures with remote-rewriting network fixtures; their boundaries differ.
- `scripts/release/next-version.sh` and `verify-cliff-parity.sh`: a wholesale Node rewrite adds migration work without improving the accepted shared policy entry.
- `scripts/release/prepare-release.sh`: extracting phase scaffolding or changelog insertion is unrelated to the additive preflight/state work.
- `scripts/release/lib.sh`: a general per-package policy registry is speculative while only fork core needs the exception.
- `scripts/upstream-sync.sh`: optional extraction of tag-display formatting or usage parsing is not needed before adding the recording mode.
- `docs/upstream-sync.md`: generating historical Markdown tables from state would add a separate documentation mechanism; keep automated state authoritative and verify overlapping historical rows.

## Stage: Implementation — TDD (2026-09-20T05:28:14Z)

### Session summary

Completed all seven planned steps in separate commits, from `test: share release repository fixtures (#16)` through `docs: explain verified upstream core release classification (#16)`.
Core release prediction now combines verified upstream version advancement with fork-owned changes, completed syncs can record reviewed provenance, and release preparation persists correspondence with its artifacts.
The root suite increased from 160 to 230 passing tests; package suites, type checks, root lint, and dead-code checks passed, and the independent pre-completion review returned WARN with no blocking findings.

### Observations

- The operator stopped the first implementation agent after step 5; a fresh agent completed steps 6–7 without redoing the committed work.
  The implementation report in `/tmp/issue16-implementation-report.md` is supplemental session evidence, not a tracked operating contract.
- The real-history regression isolates both objects and refs, restores only the historical fork baseline, and verifies the counterfactual patch without rewriting published history.
  The current core and model-selector predictors still report nothing pending.
- Upstream ownership uses the difference between the sync merge's first and second parents, rather than treating every ancestor of the upstream parent as newly imported.
  Recorded integrations require the upstream side to be the second parent, matching the sync script's topology and rejecting inverted provenance.
- The preparation tests exercise actual release commits and tags against disposable local bare remotes, including correspondence read-back, sibling-only isolation, and mixed-selection failure before writes.
  No actual repository tag, changelog, remote publication, or GitHub state was changed.
- Mutation deviation: deleting the added core evidence preflight did not kill the blocked mixed-selection case because the existing predictor call independently validates the same evidence.
  A supplemental mutation that silently discards a failed prediction killed that case; omitting the added preflight instead killed the state-persistence and subsequent-window cases.
  The parity failure pin similarly needed a success-looking tag, rather than empty output, because empty output already fails parity.
- Root lint initially exhausted the default Node heap during the baseline.
  It passed with `NODE_OPTIONS=--max-old-space-size=8192`, also used for final checks and independent review; no repository memory setting was changed.
- Pre-completion reviewer: WARN.
  The reviewer noted that the existing `AGENTS.md` predictor summary mentions tag-or-empty output without mentioning nonzero blocked-evidence exits; the releasing skill and sync handbook document those errors.
  It also could not render the unchanged README Mermaid diagrams because Chromium lacked a usable sandbox; this change edits only README prose.
- All planned implementation steps are complete; no package architecture or roadmap changes were needed.
  Next is `/sync-worktree 16` followed by `/ship 16` at the root, subject to the operator's disposition of the review warnings and normal landing checks.
  No publication is authorized by this repository-tooling change.

## Stage: Quality Revision Planning (2026-09-20T06:28:49Z)

### Session summary

Revised `docs/plans/f0016-core-sync-release-levels.md` for a measured quality revision: four offline evidence-contract violations (loose cliff-context parsing, no offline manifest verification, no offline unreleased-tail check, no offline sync-chain continuity check) documented with probe provenance and measured outputs, a module-ownership design for the fixes, and a new nine-commit revision `## TDD Order`.
The original seven steps are preserved verbatim under `## Original TDD Order (completed; historical)`; the plan's `## Revision Status` records that shipping is paused and the prior WARN is not a current readiness verdict.
Only the plan and this retro were edited; no production code, test, package manifest, tag, or CI change was made.
The parent session reviewed the probe logs and corrected the draft's scratch-copy claim and mutation predictions before preparing the documentation commit.
The previous next-step guidance (`/sync-worktree 16` then `/ship 16`) is suspended pending operator confirmation of the revision.

### Observations

- The diagnostic probes' provenance is recorded in the plan: real issue-14 objects with scratch-forged state for the manifest probe; synthetic scratch graphs for the cliff-tamper, tail, and discontinuity probes; the cliff tampering is a PATH adapter, not an observed vendor regression; one deterministic trial per case with bracketing controls.
  Probe viability does not implement or prove the fixes, and unverified review-path semantic checks are recorded as limits, not established defects.
- The diagnostic draft's HEAD string was malformed and was not copied; the plan's probe provenance uses the object resolved by `git rev-parse` at `docs(retro): add TDD stage notes for issue #16`.
- The tidy assessment was accepted in full and folded into the revision order: an instance-owned core-sync scenario helper, an independent sync network fixture with the recording tests moved to their own file, production module extraction leaving a thin decision-plus-CLI and a recorder that keeps network and write, a pure schema test against a temporary directory rather than a Git repository, and independent CLI and preparation test files.
- Module-ownership decisions are documented in the plan rather than left to the implementing session: the pure module is `core-sync-values.mjs` because the algebra throws the shared error class; `CoreSyncError` lives on that leaf; the OID predicate is owned by `state` and consumed by the cliff parser without a duplicated regex; `state` never imports `evidence`; the `cliff_args` helper stays the only scoping authority and `isCoreScopePath` the only Node path predicate.
- A scratch-copy coupling was verified in source before planning around it: `copyReleaseScripts` copies only named files and the preparation fixture runs scratch copies as processes, so the extraction commit must copy the new transitive `.mjs` modules in the same commit.
- Killing-mutation phrasing from the draft was corrected: a mutation restores the unsafe behavior and must make the new rejecting tests RED; the plan states this per equivalence class with named failing tests for each fix.
- Fix B's fixture updates land in the same commit as the fix, with deliberate failure classes preserved by valid fixture construction — a manifest-consistent forged baseline keeps the regression class, and a manifest-consistent substituted commit keeps the containment class — rather than relaxed assertions.
- Commits in this entry are named by subject, not SHA; the original seven implementation commits are likewise named by subject in the plan's historical order.

#### Deferred tidyings

- Byte-identical incidental child-process diagnostics after adapter sharing: not promised; keep separate adapters until a targeted fix.
- Preparation-path semantic claims the probes did not measure: not established defects; no scope added.
- Double-prediction optimization, CI version pins, package changes, state-schema changes, and LOC targets: excluded by the revision's scope note.

A fresh read-only plan review initially returned FAIL for a manual release fixture omitted from the manifest migration, test imports not explicitly migrated with module extraction, and mutations blocked by the new parser before reaching the intended filter.
The plan now names the manual merge-resolution fixture, moves imports in the extraction commit, and pairs each parser/filter mutation with its input class; delta re-review returned PASS for those corrections.
This is a plan-review result, not implementation approval or a replacement for the future pre-completion review.

The TDD phase status is pending approval: implementation of the revision `## TDD Order` starts only after the operator confirms it.

## Stage: Implementation — TDD (2026-09-20T12:19:21Z)

### Session summary

The operator approved the quality revision, and all nine revision steps completed, with the production extraction split into two commits as permitted by the plan.
Four correctness cycles added strict git-cliff context validation and offline manifest, unreleased-tail, and sync-chain checks; two further operator-approved TDD fixes closed blockers found by fresh review.
The root suite increased from 230 to 264 passing tests, and the full workspace tests, type checks, root lint, and dead-code gate passed.

### Observations

- The initial implementation agent completed steps 1–5 before the operator stopped it.
  A replacement was stopped for a model problem without leaving changes; a fresh agent completed steps 6–8.
  The parent completed documentation, verification, review coordination, and these stage notes.
- The scenario and network fixtures remain separate, and preparation copies include all four new transitive production modules.
  Manifest fixture changes landed with the manifest fix, including the manual breaking-merge construction and independent regression/containment failures.
  Equal-version fixture releases use an empty bump commit when their inherited manifest already matches.
- The prescribed malformed-context, manifest, tail, and continuity mutations were exercised by input class and restored before commits.
  The first agent's supplemental implementation log stopped after step 3; its session transcript contains step 5 mutation calls and reported outcomes rather than a complete durable raw-output log.
  Subsequent independent review and full test runs verified the resulting tree without treating that incomplete log as a coverage premise.
- Fresh pre-completion review initially returned FAIL despite green deterministic gates: quoted Git path output could hide non-ASCII or escaped core paths, and default Git log output omitted merge-only changes in a baseline tail.
  The operator approved fixing both blockers, resulting in `fix: enumerate core paths losslessly in sync evidence (#16)` and `fix: account for merge changes in core tail enumeration (#16)`.
  Those are the scope additions beyond the revision order.
- The blocker fixes use NUL-delimited Git paths and first-parent merge diffs, with real-Git synthetic rejection tests and excluded-docs controls.
  A window merge-only trial hit the existing unrecorded-merge guard before the tail check, so the dedicated tail regression targets the baseline span before the fork tag, where that guard cannot protect it.
  An initial guard mutation crashed because it omitted an import; the corrected mutation restored the old acceptance path and was rerun.
- The current real-repository predictor still exits successfully with empty stdout, and the isolated historical control still predicts `pi-subagents-v1.0.3`.
  The parent reran the root suite after the delta review and measured 264 passing tests; lockfiles remain unchanged.
  Root lint used the previously measured `NODE_OPTIONS=--max-old-space-size=8192` workaround without changing repository configuration.
- Pre-completion reviewer: WARN.
  Delta review independently reran all required gates and found both blocking gaps resolved.
  Reviewer warnings retained outside the approved blocker fixes: `NONE_CONTRIBUTION` in the scenario helper shares a mutable object and `paths` array across instances; numeric SemVer comparison uses `Number` without rejecting fields beyond the safe integer range.
- The releasing skill already points to the handbook's blocking rules and did not imply that recording exempts evidence from offline checks, so it was left unchanged.
  No package runtime, manifest, architecture, roadmap, published tag, or changelog changed; no GitHub mutation, push, synchronization merge, or publication was performed.
  Next is `/sync-worktree 16` in the peer session, then `/ship 16` at the root, with the remaining warnings visible for the operator's disposition.

## Stage: Implementation — TDD (2026-09-20T12:46:38Z)

### Session summary

The operator approved resolving both remaining review warnings before shipping.
Two additional TDD cycles committed `test: give each recorded sync its own none contribution (#16)` and `fix: bound core sync SemVer arithmetic to safe integers (#16)`.
The root suite increased from 264 to 270 passing tests, and fresh delta pre-completion review returned PASS with no remaining warnings.

### Observations

- Each default sync contribution now owns its object and `paths` array; mutation tests cover isolation within one scenario and across separate scenarios.
- The stable-version parser rejects unsafe numeric segments, and all three increment branches reject overflow while preserving valid boundary values and unchanged `none` results.
  The operator approved rejection rather than a BigInt redesign.
  The invalid mapping test was corrected to expect the producer's existing comparison diagnostic, because comparison rejects the input before mapping's later validation branch.
- Killing mutations restored shared defaults, disabled unsafe-number rejection, disabled increment checks, and moved the accepted boundary inward; assigned tests failed and restored tests passed before commits.
  A formatting-only hook rejection was resolved by staging its formatting changes and retrying.
- Pre-completion reviewer: PASS.
  The reviewer independently ran the full workspace tests, type checks, root lint with the existing heap workaround, and dead-code gate; earlier path and merge regressions remained green.
  The parent reran the root suite and measured 270 passing tests, a cumulative increase from the revision baseline of 230.
- These two operator-approved fixes extend the revision order and supersede the prior entry's retained WARN disposition.
  No package changes, GitHub mutations, pushes, or publication occurred.
  Next remains `/sync-worktree 16`, followed by `/ship 16` at the root.

## Stage: Sync (worktree) (2026-09-20T12:51:20Z)

### Session summary

Root lint passed with `NODE_OPTIONS=--max-old-space-size=4096` after the default heap exhausted memory; `pnpm fallow dead-code` passed with no findings.
This repository-tooling change authorizes no package publication; landing and the final `/retro 16` remain the root session's responsibility.

**Peer session transcript:** `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/2026-09-20T12-48-20-208Z_01a0bedc-3eef-732d-a73a-22834b7cec7f.jsonl` — read with `read_session_file` for message-level verification.

### Observations

- The issue branch is checked out in the root checkout rather than a separate registered worktree; the branch-name gate passed, and this sync does not check out or modify `main`.
- The planning-stage commit citation now uses its subject so a rebase cannot leave a stale SHA.
- This entry is a sync breadcrumb only; run `/ship 16` from the root on `main`, then the final `/retro 16`.

## Stage: Ship (2026-09-20T12:57:12Z)

### Session summary

Fast-forwarded `issue-16-core-sync-release-plan` onto root `main` after fetching and pulling successfully with zero unpushed root commits.
Root lint passed with `NODE_OPTIONS=--max-old-space-size=8192`, and the dead-code gate reported no findings on the landed tree.
Push and CI verification remain pending at this breadcrumb commit; issue closure follows successful CI.

### Observations

- The complete landing range touches no package paths, so version prediction and release dispatch are skipped; no npm publication is authorized or needed.
- The plan and retro identify no adopted PR or co-shipped issue to close; issue 15 remains separate.
- Only the root checkout is registered as a worktree, matching the peer's sync note.
  After successful CI, remove only the merged issue branch rather than trying to remove the root checkout.
- The final interactive retrospective remains `/retro 16` at the root on `main`.
