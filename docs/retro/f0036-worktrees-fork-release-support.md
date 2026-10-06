---
issue: 36
issue_title: "Support worktrees fork release evidence and upstream synchronization"
---

# Retro: #36 — Support worktrees fork release evidence and upstream synchronization

## Stage: Planning (2026-10-05T12:52:16Z)

### Session summary

Committed the repository-scoped implementation plan at `docs/plans/f0036-worktrees-fork-release-support.md` in `6833517f0`.
Verified the independent worktrees upstream baseline against real Git objects and production evidence checks, inspected the release/synchronization consumers, and completed fresh-context exploration and Tidy First assessment.
No implementation, real evidence update, registration, synchronization, push or publication occurred.

### Observations

- The operator chose `0.1.0` as the initial fork version and an artifact-only generator writing a fresh external candidate directory.
  These decisions do not authorize first publication or a release dispatch.
- Support exactly core and worktrees through a fixed selector, retaining the core default and existing schema/config export.
  Keep the actual registry unchanged until issue #37 migrates the real manifest; that issue also owns runtime compatibility, artifact application and publication handoff.
- Real worktrees upstream `0.3.3` resolves to `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, contained in the existing integration's second parent `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`.
  Production ancestry/version/tail checks succeeded; no worktrees-scoped unreleased tail or upstream-to-HEAD fork changes were found by the recorded commands.
  Revalidate the actual incorporated merge/release when preparing issue #37's candidate.
- First release cannot use the current previous-fork compare-heading requirement.
  Plan a strict exact release-tag URL heading, no invented previous tag, and preserve inherited CHANGELOG bytes while generating correspondence/state/view consistently.
- Accept preparatory recorder-boundary tests and returned upstream-selection extraction, preserving release/version → continuity → tail diagnostic order.
  Also accept narrow published-artifact registration and network fault-injection parameterization; the current drift trigger otherwise matches only the core query.
- The baseline `pnpm exec vitest run test/release test/upstream-sync` passed 22 files and 401 tests.
  Core/model-selector prediction remained quiet, the core table check passed, and worktrees prediction correctly refused its missing first tag.
- Historical backfill stays core-specific and unchanged; there are no existing worktrees fork Releases to backfill.
  The final implementation must verify selected-package isolation and run the normal fresh-context pre-completion review before ship.

#### Deferred tidyings

- Keep `test/release/helpers/fork-sync-scenario.mjs`, `release-artifacts.mjs` and `test/upstream-sync/helpers/upstream-network.mjs` as separate lifecycle fixtures rather than a universal factory.
- Do not reorganize the large decision/merge test files, rewrite CLI parsers, add a generic script-copy bundle, expand backfill or extract the entire CHANGELOG fence scanner for this change.

## Stage: Implementation — TDD (2026-10-05T16:58:43Z)

### Session summary

Completed all eight planned TDD/characterization cycles as separate commits, with a fresh implementation subagent for each step and parent inspection at each handoff.
Implemented independently selected worktrees prediction, recording, artifact preparation/publication preflight and an external first-release candidate generator while retaining core defaults and original-package behavior.
Root tests increased from the measured baseline of 677 to 880 (+203); final collection contains 41 files, including 604 release/sync tests.

### Observations

- Startup confirmed clean primary `main`, no pending merge/rebase and an already-up-to-date fast-forward-only pull.
  Starting `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` all passed.
  The same root gates passed after implementation and in independent pre-completion review.
- Each step ran its focused Red or current-behavior characterization, then Green and the planned killing mutations before committing.
  The recorder extraction retained release/version validation before continuity, and continuity before unreleased-tail rejection.
  Green copies were saved separately before mutations and restored before final verification.
- No substantive design deviation occurred.
  Focused `worktrees-prediction.test.mjs`, `multi-fork-release.test.mjs`, `upstream-release.test.mjs` and `first-fork-release.test.mjs` hold the added contracts rather than distributing every assertion across the large existing suites.
  Existing correspondence, table, history, migration and core-only backfill suites remained in the verification set even where their files needed no edit.
  Actual script import paths required target/config copy-list updates but no copied recorder-selector dependency.
- Missing recording review inputs now reject before remote/config effects; an existing dirty-precondition fixture was updated to provide its explicit review.
  Independent fork baselines and full unselected manifest/CHANGELOG/state/view bytes were used to distinguish routing rather than equal-valued evidence.
- Intermediate parallel release/sync runs encountered an existing recorder-case timeout.
  Affected files passed alone and the full release/sync suite passed with one worker; no timeout configuration was changed.
  Final full root tests and the independent review did not reproduce the timeout.
- First CHANGELOG insertion preserves inherited header/disclosure bytes and the historical suffix while keeping first Release notes bounded to the reviewed summary and generated provenance.
  The worktrees scaffold's marker-external unreleased statement was made conditional so a projected released view does not carry a stale claim; the managed region remains empty in the real checkout.
- The implemented interface is `node scripts/release/prepare-first-fork-release.mjs --repo <primary-checkout> --package pi-subagents-worktrees --version <explicit-stable-version> --merge <completed-incorporated-merge> --notes <reviewed-summary-file> --output <fresh-external-directory>`.
  Every input is required; the output parent must exist, and there is no default version or apply/publish/dispatch mode.
  Issue #37 supplies the already selected `0.1.0` after committing its actual migration and registration.
- The external candidate's exact application set is `packages/pi-subagents-worktrees/package.json`, `packages/pi-subagents-worktrees/CHANGELOG.md`, `scripts/release/pi-subagents-worktrees/sync-state.json` and `docs/upstream/pi-subagents-worktrees-release-correspondence.md`.
  Its `first-fork-release.json` records `sourceHead`, selected merge, tag/version, incorporated upstream evidence and `applicationFiles`; retain this transient review manifest externally.
  Issue #37 must revalidate source HEAD and candidate bytes, run its packing/compatibility checks, apply and commit the reviewed set together, and obtain separate scope/destination approval before tagging or publication.
- The actual worktrees state remains schema 2 with empty `releases` and `syncs`; the real registry, all package files, core state/view, ordinary prompts, lockfile/workspace YAML, global cliff configuration and publication workflows/scripts were compared against the starting checkpoint without differences.
  No real first artifacts, release rows, tags, integration, push, npm publication or GitHub mutation occurred.
  Real core/selector prediction stayed quiet; worktrees prediction still refuses its missing first tag and its selected table command refuses missing registration.
- Pre-completion reviewer: PASS, with no warnings or required fixes, for `405b7675aa859f5186388bf03f61e4abc48013fd..b915938a055043b8382d38e88b34ac17b8009b5e`.
  The reviewer independently ran the root gates and re-derived routing, ancestry, exact-heading, no-effects and approval boundaries.
  Next action is `/ship 36` on `main`; shipping repository support does not authorize package publication, and issue #37 remains the migration/first-publication handoff.

## Stage: Ship (2026-10-06T02:06:41Z)

### Session summary

Confirmed the primary checkout on `main` and the trunk lane, read the complete plan and retro, and completed the fast-forward-only origin synchronization.
The pre-push checkpoint had 11 unpushed implementation/planning commits; root `pnpm run lint` and `pnpm fallow dead-code` passed.

### Observations

- The plan recommends independent delivery, but the implementation range changes no package directory and requires no version prediction or release dispatch.
  Package registration, artifact application and first publication remain issue #37's separately approved handoff.
- No additional close target, roadmap phase completion or outstanding manual verification was identified in the issue's plan and stage records.
- Both origin fetch and push URLs resolve exclusively to `Jopqior/gotgenes-pi-packages`, with no effective URL rewrite configured.
  Push, CI verification and the operator-approved close comment follow this committed checkpoint; their results belong to the issue and final ship report.
- The next workflow stage is `/retro 36` at the root on `main`.
