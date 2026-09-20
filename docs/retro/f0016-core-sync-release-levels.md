---
issue: 16
issue_title: "Derive fork core sync releases from upstream version changes"
---

# Retro: #16 — Derive fork core sync releases from upstream version changes

## Stage: Planning (2026-09-19T16:02:42Z)

### Session summary

Committed `docs/plans/f0016-core-sync-release-levels.md` as `9c68173e0e3c643ab09e6581184f08605a96df6f` on `issue-16-core-sync-release-plan` after a successful fast-forward-only pull reported the checkout current.
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
