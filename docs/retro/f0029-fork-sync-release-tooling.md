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
