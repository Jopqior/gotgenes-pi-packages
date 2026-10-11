---
issue: 43
issue_title: "Sync gotgenes/pi-packages@1810feed6ab2a83fa74f3b242095e0cc03773570"
---

# Retro: #43 — Sync gotgenes/pi-packages@1810feed6ab2a83fa74f3b242095e0cc03773570

## Stage: Planning (2026-10-11T22:07:28+08:00)

### Session summary

Committed the repository-scoped implementation plan in `ee2658cd23a0a2d45f417a6c5eff2f8d83d1fcd8` after the required fast-forward-only pull reported the checkout current.
Inspected the complete incoming inventory, selected fork contract intersections, contained release evidence candidates and a read-only merge preview; no integration, implementation, push or publication occurred.

### Observations

- The pinned target is `1810feed6ab2a83fa74f3b242095e0cc03773570`, with common base `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4` and inspected fork HEAD `47d9cd496b6a48023a9831fd42455cd23540d79b`.
  The plan owns inventory commands and compatibility decisions; actual merge/parents/reviewed HEAD must be resolved during implementation.
- The operator explicitly chose upstream `feat`/`fix` classification without extra breaking markers after asking whether upstream had marked these changes breaking.
  Upstream had not; this is an intentional issue-specific override of the generic planning prompt's broader classification, not a change to that prompt or authorization to publish.
- The operator approved selection-aware progress and timeout advice.
  Reading expanded from the query conflict into activity formatting and the real selection owner because incoming progress omits the fork's private `awaitingSelection` fact; ordinary executing-child advice remains upstream behavior.
- Incoming runnable query tests conflict with the fork's intentional passive selection fixtures.
  Reuse `createRunnableTestSubagent`; do not make the passive owner executable to hide the mismatch.
- Exact importer inspection corrected a proposed touch point: `observation/notification.ts` does not import the renderer.
  The moved renderer imports notification DTOs type-only, so no notification-module adaptation or compatibility wrapper is planned.
- The Tidy-First assessor recommended no preparatory commit: incoming helpers and existing getter/adapter/fixture seams already support the change.
  The current worktrees README/source, rather than historical migration expectations, determined verification scope; the removed packed worktrees suite is not to be revived by default.
- The focused pre-integration baseline passed 95 tests across three files (measured); the target Unicode scanner probe found only widget comments already repaired by incoming changes.
  These are planning observations, not completed-integration gate results.
- Offline core/worktrees version predictions were empty before integration.
  The optional all-package parity command failed on original packages lacking fork tags; it is not a required synchronization gate and does not authorize tag imports or new release anchors.
- No fork #43 prior retro exists; the inherited unprefixed #43 fallback describes an unrelated upstream permission-system issue.
  Fork continuity belongs in this new `f0043-` artifact.
  There is no package-specific selector skill on disk, so its README, entry point and existing compatibility matrix supplied the package context.
- No concrete new follow-up was identified; fork issue #26 remains outside scope.
  Next action is `/tdd-plan` in the primary checkout on `main`, followed by independent review and a separate `/ship #43` session.

#### Deferred tidyings

- No independent cleanup is scheduled: keep the passive selection fixture strict, update moved-module importers directly, and avoid renderer compatibility indirection.

## Stage: Implementation — TDD (2026-10-11T22:41:31+08:00)

### Session summary

Completed the pinned two-parent integration and implementation steps 1–6, including runnable fixture repair, chooser-aware bounded queries, exact refusal snapshots, the packed consumer probe and fork documentation reconciliation.
The root suite increased from 9,566 tests across 373 files to 10,019 tests across 375 files: 453 additional tests, including 41 core, 393 permission-system and 19 repository tests.
The independent pre-completion review remains pending at this checkpoint; no push, release preparation, publication or issue closure occurred.

### Observations

- Actual merge: `cb5c478447a05dc9de463d1d3bf59fe6e46e7c27`; first parent: `3a727fabbba301ac11db7f58b4ab0a7c2ae34158`; second parent/approved target: `1810feed6ab2a83fa74f3b242095e0cc03773570`; common base: `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`.
  Implementation/evidence HEAD before this handoff: `73d3882506dc137b25feffe32dd1bbca4c975e83`.
  The merge is reachable from that HEAD and preserves upstream author ancestry.
- Regenerate complete incoming inventory with `git diff --name-status 8d373ceab20c5236b08d8d6c032fd515b9fa8dc4 1810feed6ab2a83fa74f3b242095e0cc03773570` and actual integration inventory with `git diff --name-status 3a727fabbba301ac11db7f58b4ab0a7c2ae34158 <reviewed-HEAD>`.
  At the implementation/evidence HEAD, these commands produced 129 and 130 entries respectively; the handoff adds this retro file to the actual inventory.
  Inspect conflicts using `git show --remerge-diff cb5c478447a05dc9de463d1d3bf59fe6e46e7c27` and adaptations using `git diff cb5c478447a05dc9de463d1d3bf59fe6e46e7c27 <reviewed-HEAD>`.
- Conflict resolutions retained the fork identity/version, published core CHANGELOG bytes, fork instruction section, namespace lookup, selection ownership, asynchronous launch acknowledgement and model hiding.
  Incoming observer/renderer moves, progress timestamps, optional timeout/refusal fields, permission changes, assets and Unicode safeguards were adopted.
  Automatically merged public/service, runtime entry point, fixture helpers, foreground tool, fallow type-only policy, workspace config and workflow/doc intersections were inspected separately from conflict markers.
- Imported focused tests exposed five failures and five unhandled errors from the incoming bounded-wait fixture using the intentionally passive selection owner.
  `stalledAgent()` now uses `createRunnableTestSubagent`; the passive owner is unchanged.
  Red was observed before the merge checkpoint and repaired in the following adaptation commit.
- The real deferred-provider query regression lives in the additive `test/tools/selection-query.test.ts` rather than enlarging `observed-selection.test.ts`.
  It uses the real manager/selection owner, a supported thinking-capable fixture and deferred child execution; the query expires without aborting selection, creating a session, consuming the outcome or retaining its carrier claim, then ordinary progress/guidance/model labels return after confirmation.
  Existing observed-selection tests separately discriminate both pending model guards.
- Step 2 killing mutations produced 4 claim-release failures, 2 deadline failures, 1 superseded-consumption failure, 6 observer timestamp failures and 1 resume-reset failure.
  Step 3 mutations produced 1 pending-activity failure, 2 forced-generic advice failures, 4 forced-chooser advice failures, 1 dropped-report-flag failure, 1 failure for each model guard and 1 cancellation-signal failure.
  Step 4 produced 5 omitted-refusal failures, 6 failures for each leaked private field, and an external consumer `TS2339` when the public refusal property and its adapter projection were removed together.
  Saved green files were restored and suites rerun before each commit; no mutation remains.
- Root `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` passed after implementation.
  The focused permission suites passed 2,754 tests across 43 files; the scanner suite passed 62 tests; all three moved-module fallow guards were inspected.
  `verify:public-types` passed against the actual packed core, and `verify:core-compatibility` passed its historical rows, packed local candidate and negative/control rows without modifying selector files or its historical development floor.
  All six current core architecture Mermaid blocks rendered with `mmdc`; no live TUI/model check or GitHub preview was requested.
- Core and worktrees source feasibility was independently resolved/rendered at the implementation/evidence HEAD via the release source guide, not release preparation.
  Core selects upstream `@gotgenes/pi-subagents` 23.4.0 at `63476ff869efd8ea339040f496fa734048b89e70`, incorporating the approved target with an unreleased package tail.
  Worktrees selects upstream `@gotgenes/pi-subagents-worktrees` 0.3.3 at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, incorporating the same target without a package tail.
  These are provenance checks, not equivalence or publication approval.
- The core CHANGELOG, selector/worktrees files, release/source machinery, settings, passive selection fixture, notification owner and shared activity formatter have no diff from the actual merge first parent.
  Lockfile/workspace files have no unstaged changes.
  Incoming core/permission features and fixes retain upstream classification without extra breaking markers, as approved.
  Offline prediction is nonempty for core and empty for worktrees; no release version is authored here and the optional all-package cliff parity command was not repeated.
- Three attempted step workers failed before any tool use with a JSON parse error while the tree contained merge-conflicted manifests.
  All conflict resolution and implementation was completed inline; this is not an independent review result or a confirmed subagent root-cause diagnosis.
  The independent reviewer must still start successfully and return an explicit verdict.
- No additional compatibility choice or concrete follow-up arose; fork issue #26 remains outside this synchronization.
  Shipping must use the actual first parent as `RANGE_BASE`, close only verified fork targets, skip upstream-number co-shipped scanning and obtain separate publication approval.
  Start a fresh Pi session before `/ship #43` so tooling and prompts are not stale.
- Before review, the operator accepted the README's selection-query explanation but rejected duplicating the implementation summary in the package skill.
  Removed the added five-line summary without inserting another pointer; retained the skill's directory/module-count corrections and its existing public-snapshot paragraph's private `lastProgressAt` example.
  README behavior documentation and architecture/source ownership remain unchanged.
