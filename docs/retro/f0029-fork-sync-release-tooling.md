---
issue: 29
issue_title: "Remove ambiguous core naming and organize fork release tooling by responsibility"
---

# Retro: #29 — Remove ambiguous core naming and organize fork release tooling by responsibility

## Stage: Planning (2026-09-26T16:39:21Z)

### Session summary

Committed the repository-level implementation plan at `docs/plans/f0029-fork-sync-release-tooling.md` in `5e20fad40` after the required fast-forward-only pull reported the checkout current.
Traced evidence recording, strict validation, release calculation, state persistence, correspondence generation, publication callers, and historical note maintenance against their actual implementations.
No implementation, synchronization, push, publication, tag modification, or GitHub mutation occurred.

### Observations

- The operator selected `organization=fork_sync`: shared algorithms under `scripts/release/fork-sync/`, with package configuration and evidence under `scripts/release/pi-subagents/`.
  The inspected algorithms do not depend on subagent runtime behavior; current package literals and registration restrictions are configuration and boundary policy, not a reason to duplicate algorithms.
- The operator selected `docs_coordination=migrate_here`: this issue migrates release guidance, generated correspondence, and their consumers to `docs/release/`; issue 27 deletes the remaining handbook and owns synchronization workflow activation.
  Issue 28's reviewed dispositions remain historical decision evidence, not an active policy source or permission to change unrelated safeguards.
- The briefing explicitly classified CLI/schema/route migration as breaking repository tooling, not a package API or version-calculation change.
  The plan preserves all historical record values and requires regenerating and reapproving old backfill previews rather than inheriting approval across format changes.
- The Tidy-First assessment recommended preparing nested destination support in `test/release/helpers/git-repository.mjs:copyReleaseScripts`.
  The parent verified its current root-only directory creation and added a disposable-source test seam because no nested production release file exists before the move.
  An optional one-caller contribution-validator extraction was not accepted.
- Measured baseline: `pnpm exec vitest run test/release test/upstream-sync` passed 17 files and 229 tests; both registered package predictors exited successfully with no release pending; the generated correspondence check passed.
  The state inventory contained 9 release records and 2 sync records; implementation must re-read it to retain any later additions.
- The plan sequences additive shared modules before an atomic producer/reader/schema/caller cutover, then moves the generated document with all its consumers.
  Existing real-history, remote-network, publication-effect, and byte-preservation tests remain necessary despite new lower-level tests.
- A final plan pass corrected a proposed sibling-isolation mutation: merely rewriting identical bytes would not discriminate, so the specified mutation instead wrongly projects an original package as a fork.
- Scope stays repository-only and publication-free; existing package handbook links remain for issue 27, and historical plans, reviews, rationale strings, and authentic published fixtures are not global rename targets.
  Plan Markdown lint and commit hooks passed.

#### Deferred tidyings

- `test/release/helpers/core-sync-scenario.mjs` and `test/upstream-sync/helpers/upstream-network.mjs`: fixture consolidation would mix single-repository and remote-network lifecycles and is unnecessary for this move.
- `scripts/release/release-correspondence.mjs`: generalizing the supported-fork registry would expand product scope rather than prepare the naming migration.

## Stage: Implementation — TDD (2026-09-27T09:22:41Z)

### Session summary

Completed all five plan steps using a fresh subagent for each step, as requested by the operator: four Red/Green/mutation cycles followed by final verification and handoff.
Shared fork synchronization algorithms, strict version-2 interfaces and evidence, release-owned documentation, and the issue-27 handoff are committed; root tests increased from 459 to 475, with release/upstream-sync tests increasing from 229 to 245.
The final incremental pre-completion reviewer returned PASS after approved corrections to active test terminology and configuration consumption; check, lint, full tests, and dead-code gates passed serially.

### Observations

- Every behavior step ran its planned killing mutations and restored the green files before committing.
  An initial scope mutation had a syntax error rather than a discriminating failure; the step agent corrected it and reran the mutation against the intended behavior.
- The evidence migration preserves the complete pre-cutover document after field translation, including raw rationale content; the historical version-1 fixture and authentic Release fixture were independently verified against Git.
  No tag changes, historical CHANGELOG edits, package version changes, push, synchronization, backfill, or publication were performed.
- A necessary deviation from the predicted unchanged package documentation was the release-table link in `packages/pi-subagents/README.md`, which otherwise pointed at the removed handbook anchor.
  Its separate sync-procedure link remains for issue 27; the README change is inside package release scope, and read-only prediction reports a pending fork patch while the selector has no pending release.
  Publication requires separate approval and was not authorized here.
- Final handoff is recorded in `docs/sync/f0029-to-f0027-handoff.md`, including final paths and remaining handbook-deletion consumers.
  The synchronization procedure, conflict guidance, and log remain owned by issue 27.
- The first pre-completion review returned FAIL for active test variables, titles, and comments still using the old terminology, plus WARN for two Node consumers hardcoding the correspondence path instead of reading configuration.
  The operator approved both corrections; a separate repair agent prepared them, and a fresh reviewer inspected the uncommitted delta before it was committed as `refactor(release): finish fork terminology and path configuration (#29)`.
  Final verdict: PASS, with no remaining findings in the incremental review.
- Parallel full-suite verification during the cutover hit a timeout; serial reruns passed, and subsequent final gates were run serially.
  Broad terminology scans must include prose and camel-case identifiers, not only old module filenames and exported symbols.
- No implementation steps remain; the next workflow is `/ship 29`, with any package publication still subject to explicit approval.
