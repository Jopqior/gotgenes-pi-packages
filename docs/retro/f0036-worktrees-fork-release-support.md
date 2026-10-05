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
