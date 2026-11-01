---
issue: 46
issue_title: "Sync gotgenes/pi-packages@52854c12d590142e61a4f6a6947be9084035300d"
---

# Integrate the pinned upstream patch series

## Release Recommendation

**Release:** ship independently

This `scope:repo` synchronization is not a package roadmap or release-batch member.
Integration does not authorize publication; release selection, destination and npm identities require separate approval.

## Problem Statement

The fork needs to incorporate the issue's fixed upstream target while retaining its package identities, spawn-selection behavior and worktrees compatibility.
The incoming series includes queued-duration reporting, persisted navigation labels, removal of unsupported prompt-renderer branches, permission configuration changes and repository workflow improvements.
A moving upstream tip, a squash, or copying upstream files over fork customizations would not satisfy the issue.

## Goals

- Land a genuine two-parent merge on the root checkout's `main`, with the exact pinned target as second parent.
- Adopt incoming upstream behavior and tests, preserving the existing fork selection and workspace contracts.
- Preserve fork package identities, versions, exports, peers and existing published CHANGELOG bytes.
- Resolve instruction/documentation intersections semantically, including automatically merged paths.
- Complete required validation, separate source-feasibility checks for both registered forks and independent review over the actual integration range.
- Record incoming behavior changes without inventing an additional fork breaking change or adding `!`/`BREAKING CHANGE:` to the synchronization commit.

## Non-Goals

- No publication, release dispatch, manual version bump, upstream tag import or replacement of historical release artifacts.
- No new selection behavior, lifecycle rewire, workspace policy, public service API or host dependency floor.
- No new tests merely to adopt upstream behavior or duplicate the existing pending-selection coverage.
- No fresh upstream defect audit, unrelated cleanup, universal consumer matrix or mandatory live Pi/TUI/model check.
- Do not implement fork [#26], which remains a separate selector configuration feature.
- Do not restore the retired worktrees packed compatibility matrix merely because the historical close comment for fork [#37] mentions it.
- No new follow-up issue was identified during planning.

## Background

The issue is open, was authored by the authenticated operator and explicitly selects repository scope.
There are no open fork PRs; the only other open fork issue found is [#26].
The newest backlog triage, `docs/triage/2026-10-18-backlog.md`, is inherited upstream context and has no entry for this fork synchronization.
No prior `f0046-*` plan or retro exists, and the unprefixed retro fallback found no matching file.
Fork [#37] is completed; current worktrees maintainer instructions, rather than its historical acceptance harness, govern verification.

Planning inspected these resolved refs:

| Input              | OID                                        |
| ------------------ | ------------------------------------------ |
| Fork planning HEAD | `2f636f44a5c34d1f6e5f22370d0cc685d623c387` |
| Common base        | `41405de895fb53f802df89f8978456cd1dae397e` |
| Pinned target      | `52854c12d590142e61a4f6a6947be9084035300d` |

The checkout is the primary checkout: absolute Git directory and common directory are identical, branch is `main`, and index/worktree, unmerged entries and operation-state checks were clean.
The startup pull reported `Already up to date.` but ran before the synchronization skill was loaded; subsequent inspection/fetch used the synchronization prerequisites.
This ordering miss is recorded for continuity, not permission to repeat it.

`./scripts/fork-sync/sync.sh --fetch` obtained the pinned target without changing the tag count.
The complete incoming inventory contains 71 paths and the path-intersection candidate list contains 17 paths, measured with `wc -l`.
A real-history `git merge-tree --write-tree` preview reported nine conflicting paths; it did not modify the index/worktree or create an actual integration commit.

AGENTS.md requires explicit fork GitHub targets, fork-prefixed lifecycle files, pnpm-only tooling and no upstream tag imports.
The current shell lacks a `pnpm` shim; `corepack pnpm --version` reports the repository's required `11.25.0`.
Use `corepack pnpm` for direct commands, or disposable Corepack shims for scripts that invoke `pnpm` internally; do not edit repository scripts or global configuration to repair this session environment.

## Design Overview

Upstream target: gotgenes/pi-packages@52854c12d590142e61a4f6a6947be9084035300d

Keep this target even if `upstream/main` advances.
The operator approved adopting upstream behavior, the visible-briefing `ask_user` guard and the concrete template improvements, while retaining existing fork contracts.
The operator also rejected treating adoption itself as a new fork breaking change and requested reuse of existing selector presentation tests.

### Core integration and unchanged fork contracts

Adopt upstream core `25.0.1` through `25.0.5` without replacing the fork manifest's current version with the upstream version.
Queued-duration formatting and pending-selection presentation are different concerns: the former labels waiting for a concurrency slot; the latter describes an admitted run waiting for the operator.
Keep both in the shared display and result-tool modules.

| Contract                                               | Current fork versus target                                           | Required result                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Initial selection                                      | Only the fork has the chooser gate before workspace/session creation | Keep existing selection code; no new lifecycle design                                |
| Cancellation at the chooser                            | Only the fork can cancel this additional stage                       | Preserve stopping without workspace/session creation                                 |
| Cancellation during asynchronous workspace preparation | Fork selection permission is checked again before session creation   | Preserve the existing check and cleanup path                                         |
| Pending presentation                                   | Fork has private pending wording while public status stays `running` | Keep wording, precedence and provisional-model suppression                           |
| Worktrees integration                                  | Fork uses `@jopqior/pi-subagents` and fork metadata                  | Preserve identity, dependency/imports, core-first registration and provider contract |
| Worktrees behavior                                     | No incoming worktrees change in this range                           | Preserve configuration, preparation/disposal, rescue/recovery and shutdown behavior  |

Incoming changes do not modify `subagent.ts`, `initial-spawn-selection.ts`, `workspace-bracket.ts` or the public service implementation.
These are preservation checks, not evidence of an upstream cancellation conflict.
The production intersections in `display.ts` and `get-result-tool.ts` merged automatically in the preview and still require review.

Upstream adds a narrow formatter input:

```typescript
interface RunTiming {
  readonly status: SubagentStatus;
  readonly startedAt: number;
  readonly completedAt: number | undefined;
  readonly stoppedWhileQueued: boolean;
}
```

`formatRunDuration` reads each field: queued/stopped-before-admission runs show queue time; completed runs freeze their duration; ordinary running runs retain running duration.
Reuse upstream tests for these cases in step 1.
The type follows ISP; do not pass a new dependency bag or add a timing adapter.
The new `ui/display.ts` type-only dependency on lifecycle status is permitted by the existing Fallow zone policy, checked during planning.
The same-directory navigation-to-display dependency already exists; display does not import navigation.

The persisted record gains `stoppedWhileQueued` together with its writer, allowlist reader and navigation fixtures.
Keep the incoming reader's default `false` for older records and rejection of malformed non-boolean values; incoming persistence/navigation tests cover these in step 1.
Do not add the field to the selector service or introduce a new mutable lifecycle field: the current run already owns this fact.

Adopt removal of pre-0.86 prompt-renderer branches within the existing Pi `>=1.0.0` floor, including the incoming tests and comments.
Keep the supported section-shaped and unanchored fallback behavior; do not resurrect removed legacy fixtures or change prompt inheritance policy.
The incoming plan for `gotgenes/pi-packages#1017` supplies the historical removal rationale, not a new fork roadmap obligation.

### Permission and instruction intake

Permission-system and model-judge have no fork-side package diff from the common base.
Adopt their incoming source, tests, schemas, manifests and documentation as units, including bounded configuration arrays, the Zod lockfile update and the model-judge project-trust gate.
The installed Pi `1.0.0` extension types expose `isProjectTrusted()`; no new host floor is planned.
Record these upstream-origin behavior changes without independently redesigning or republishing these packages.

For repository instructions:

- `plan-issue.md`: adopt checking test comments when documented mechanisms change.
- `ship.md`: adopt inspecting whether the completed issue finishes a roadmap phase; retain fork plan lookup, repository targeting and synchronization range exceptions.
- `tdd-plan.md`: adopt safe batching of killing mutations; retain operation-state startup checks and fork plan lookup.
- `sync-worktree.md`: retain `fNNNN-*` lifecycle naming and adopt `echo "$PI_SESSION_FILE"` instead of directory scanning.
  Both changes occupy one text-conflict block but do not conflict semantically.
- `testing/SKILL.md`: retain the existing fork rule allowing complete log redirection with exit-status preservation; merge useful timeout diagnosis guidance without reinstating upstream's conflicting blanket prohibition on redirection.
  Do not change the root output-capture work or introduce quieting mechanisms.
- Adopt `.pi/extensions/ask-user-text-first.ts` as supplied.
  It checks for nonempty visible assistant text before `ask_user`, not the adequacy of that text; no fork-authored guard or new test harness is planned.

The new `echo "$PI_SESSION_FILE"` command was dry-run and returned this session's existing JSONL path.
Template/skill edits require a fresh session before relying on reloaded command or extension behavior.

### Complete inventories and selected review depth

Regenerate the incoming inventory and candidate intersections from durable refs, not a copied path count:

```bash
TARGET=52854c12d590142e61a4f6a6947be9084035300d
FORK=2f636f44a5c34d1f6e5f22370d0cc685d623c387
COMMON=$(git merge-base "$FORK" "$TARGET")
git diff --name-status "$COMMON" "$TARGET" > /tmp/f0046-incoming-paths.txt
git diff --name-only "$COMMON" "$FORK" > /tmp/f0046-fork-paths.txt
LC_ALL=C comm -12 \
  <(git diff --name-only "$COMMON" "$TARGET" | LC_ALL=C sort) \
  <(LC_ALL=C sort /tmp/f0046-fork-paths.txt) > /tmp/f0046-intersections.txt
```

These commands were run during planning.
At implementation startup, also compare the actual pre-merge fork HEAD with the target; expand intersections if intervening fork commits change them.
After the actual merge exists, generate the separate integration inventory from its first parent to reviewed HEAD as specified in step 4.
Account for every path in each inventory, including unselected paths.

| Group                                                               | Review depth and reason                                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Core manifest/CHANGELOG and instruction conflicts                   | Deep: fork identity, immutable history and workflow decisions                                                    |
| Core timing/report/persistence/navigation source and tests          | Deep at fork intersections and affected contracts, including automatic merges                                    |
| Selection lifecycle, service, loading and presentation entry points | Contract review around the changes; verify preservation with existing suites, not a fresh lifecycle audit        |
| Selector/worktrees packages and registration seams                  | Contract review even when unchanged; preserve identities, loading order, provider/config/disposal behavior       |
| Permission packages and dependency changes                          | Inventory and adopt incoming units; inspect further for failed gates or a concrete fork compatibility dependency |
| Incoming historical plans/retros, archived Phase 23 and snapshots   | Inventory and retain upstream provenance; no fresh line-by-line historical audit                                 |
| Post-merge adaptations and handoff changes                          | Deep review of every actual contribution through reviewed HEAD                                                   |

### Source feasibility, independently per fork

Planning ran the actual source resolver separately for core and worktrees at planning HEAD.
Both resolved the prior incorporated target successfully; this does not prove the unperformed integration is complete.
Read-only remote tag listing plus local ancestry and manifest checks found these stable anchors contained in the pinned target:

| Registered fork          | Contained upstream stable anchor                     | Target-side tail expectation                                                                      |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pi-subagents`           | `25.0.5`, `a4dd5f7611a2d7687a50899e99be7bd727ddc2b0` | Present: the later phase-archive commit also changes release-relevant `docs/fallow-snapshot.json` |
| `pi-subagents-worktrees` | `0.3.3`, `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`  | Absent: no scoped change after the stable anchor                                                  |

The tail is display information, not a reason to change the target or block completion.
At the completed integration, use the actual resolver for each fork again; do not hand-author correspondence blocks from these predictions.
Both forks already have fork tags, so no first-release bootstrap is planned.
Missing tags, contradictory ancestry or failed evidence resolution stop the affected path.
Selector is an original registered package and has no upstream-source claim.

## Module-Level Changes

Paths below describe expected integration work, not changes made during planning.
The reproducible incoming inventory supplies individual upstream-only filenames without embedding its full listing here.

| Files                                                                                               | Expected work                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/package.json`                                                                | Resolve version conflict by retaining fork name/current version, metadata, exports, package files and peers                                                                            |
| `packages/pi-subagents/CHANGELOG.md`                                                                | Preserve exact pre-merge fork bytes; do not splice incoming upstream releases into published fork history                                                                              |
| Core `src/ui/display.ts`, `src/tools/get-result-tool.ts`                                            | Adopt timing helper/callers while retaining private selection wording and model suppression                                                                                            |
| Core `src/persisted-record.ts`, `src/ui/session-navigation.ts`                                      | Adopt timing field, serialization/parser compatibility and live/snapshot queue labels                                                                                                  |
| Core `src/session/prompts.ts`, `src/session/project-context.ts`, `src/lifecycle/parent-snapshot.ts` | Adopt legacy-renderer removal and aligned comments                                                                                                                                     |
| Core incoming tests and `test/helpers/make-agent-config{,.test}.ts`                                 | Adopt upstream scenarios/fixture extraction; resolve display imports with both `describeActivity` and `formatRunDuration`, manager imports with both `makeModel` and `makeAgentConfig` |
| Core `test/helpers/make-navigable.ts`, persistence/navigation tests and fixtures                    | Keep required timing fields and exact expected serialized shapes aligned in the same merge                                                                                             |
| Core `docs/configuration.md`, `docs/architecture/architecture.md`, package skill                    | Combine current upstream behavior/layout and archived Phase 23 with fork identity/selection sections; do not restore a stale active roadmap                                            |
| Core incoming architecture history and `docs/fallow-snapshot.json`                                  | Retain historical upstream provenance; do not present upstream measurements as fresh fork measurements                                                                                 |
| Permission-system/model-judge incoming source/tests/schema/docs/manifests/CHANGELOGs                | Adopt the target's units without fork-authored behavior or local runtime-config edits                                                                                                  |
| `.pi/extensions/ask-user-text-first.ts`, incoming prompts and skills                                | Adopt guard and workflow improvements with instruction resolutions described above                                                                                                     |
| `pnpm-lock.yaml`                                                                                    | Resolve consistently with the final manifests and incoming Zod update; retain fork development dependencies, without opportunistic upgrades                                            |
| Incoming upstream plans/retros                                                                      | Retain as inherited artifacts; qualify new upstream references in fork-authored prose                                                                                                  |
| Core `subagent.ts`, selection modules, `workspace-bracket.ts`, service/runtime/public-type verifier | Predicted unchanged: timing consumes existing run facts and does not change service/lifecycle ownership                                                                                |
| Core README and unchanged widget/report presentation modules/tests                                  | Predicted unchanged: no command/feature rename or new selection semantics; existing assertions remain applicable                                                                       |
| `packages/pi-subagents-model-selector/**`                                                           | Predicted unchanged: chooser registration/API and host requirements are unchanged                                                                                                      |
| `packages/pi-subagents-worktrees/**`, workspace settings and release registry/scripts               | Predicted unchanged: no incoming worktrees/release-tooling change or new package registration                                                                                          |
| `docs/retro/f0046-pinned-upstream-sync.md`                                                          | Record implementation OIDs, actual adaptations, source results, checks and review handoff                                                                                              |

Planning searched `formatDuration` and removed prompt-shape helpers across source/tests, architecture prose and the package skill.
All duration consumers must migrate in the merge that makes the old formatter private; do not leave type-broken intermediate commits.
Recheck final removed symbols and mechanism prose, including test comments, against the resolved tree.
Adopt incoming roadmap completion/archive notes rather than adding a fork #46 checkmark to an unrelated upstream roadmap.
Recompute any current fork metric table being rewritten with its documented command; keep archived upstream measurements historical and do not guess post-merge counts.

## Test Impact Analysis

This is integration, not a new extraction project.
The Tidy First assessor recommended no preparatory commits: upstream already supplies the timing abstraction and fixture extraction, and existing run objects provide the timing field.
No existing fork test becomes redundant solely because these upstream tests arrive; preserve selection scenarios rather than rewriting large test files.
No additional test work is approved.

Existing pending-selection coverage was opened and inspected:

| Existing test                           | What it pins                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `test/display.test.ts`                  | `describeActivity` chooses pending selection before active tools/response text           |
| `test/widget-renderer.test.ts`          | Real running-line renderer emits the pending-selection wording                           |
| `test/ui/agent-widget.test.ts`          | Same widget callback changes from pending wording to ordinary activity                   |
| `test/tools/observed-selection.test.ts` | Real result tool/widget presentation hides provisional models and shows pending activity |
| `test/tools/get-result-report.test.ts`  | Pending-selection timeout advice differs from ordinary stalled-run advice                |
| `test/tools/get-result-tool.test.ts`    | Real result-tool report/details and waiting/collection behavior remain exercised         |

These tests use real formatters/renderers/tools at the relevant layer; fake sessions/managers do not establish installed extension loading.
The planning baseline command below passed six files and 209 tests at the recorded fork HEAD; it is not a merged-tree result:

```bash
corepack pnpm --filter @jopqior/pi-subagents exec vitest run \
  test/display.test.ts test/widget-renderer.test.ts test/ui/agent-widget.test.ts \
  test/tools/get-result-report.test.ts test/tools/get-result-tool.test.ts \
  test/tools/observed-selection.test.ts
```

Reuse incoming duration, persisted-record and navigation tests for their new cases and old-record compatibility.
Reuse incoming permission-loader/schema/extension tests for adopted behavior.
Do not add killing-mutation work for adopted tests; this plan authors no new test scenarios.
If a functional fork adaptation reveals a concrete existing-test gap, obtain operator approval before planning or adding tests.

## Invariants at risk

| Constituency and invariant                                                                                                                                   | Existing test/verification                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Operator waiting at chooser: pending activity wins; provisional model is hidden                                                                              | Display/widget/observed-selection tests above                                                        |
| Operator collecting background work: pending selection receives selection advice, ordinary work retains its advice                                           | `test/tools/get-result-report.test.ts`, real result-tool tests                                       |
| Fork spawn callers: selection admission/cancellation and resume boundaries remain unchanged                                                                  | `test/lifecycle/initial-spawn-selection.test.ts`, manager and existing service suites                |
| External consumers: fork accessor/selection/workspace exports and private snapshot boundaries remain compatible                                              | Existing `verify:public-types` packaged consumer command; service tests alone do not prove packaging |
| Worktrees users: fork imports, core-first registration, `subagents-worktrees.json`, `worktreeAgents`, preparation/disposal and rescue/recovery remain intact | Worktrees behavior suite and current source/README contract review                                   |
| Published fork users: existing core CHANGELOG content remains byte-identical                                                                                 | Compare merge first-parent blob with resolved file, not merely an absence of conflict markers        |
| Future release/ship sessions: source claims follow genuine ancestry and the pinned integration                                                               | Separate resolver checks and first-parent-to-HEAD independent review                                 |

The timing change adds no numeric budget, cache or prefix guarantee.
The prompt cleanup removes unsupported renderer branches rather than changing the supported prompt contract; reuse the incoming supported-shape tests.
Do not turn the incoming historical health snapshot into an invariant or target for this fork.

## TDD Order

Synchronization scope overrides ordinary test-first expansion: adopt upstream/existing tests, resolve conflicts and verify without inventing new red tests.
Execute this code-touching plan with `/tdd-plan`; no preparatory refactoring or new test cycle is authorized merely by adoption.

1. **Integrate the fixed target as one atomic merge.**
   Load `fork-sync` and its synchronization/assessment references before startup Git operations; confirm primary `main`, clean state and no pending operation, then perform ordinary fast-forward-only startup.
   Regenerate incoming/intersection inputs and stop if intervening changes require a materially new compatibility choice.
   Run `./scripts/fork-sync/sync.sh --merge --expected-upstream 52854c12d590142e61a4f6a6947be9084035300d` without refreshing the approved target.
   Resolve `package.json` before any worker or pnpm tool; retain fork manifest/CHANGELOG policy and resolve all nine forecast conflict paths, plus any newly encountered conflicts.
   Preserve both sets of test imports, the new persistence reader/fixtures, archived upstream phase notes and fork instruction constraints.
   Install from the reconciled lockfile with frozen-lockfile verification; if regeneration is necessary, limit it to the resolved manifest/incoming dependency changes and inspect its diff.
   Run affected core timing/persistence/prompt/manager/selection tests and affected permission tests; also rerun the six-file pending-presentation command above.
   Inspect staged source, automatic fork merges and documentation, then commit the genuine merge with suggested subject `chore: sync pinned upstream target (#46)`.
   Do not use squash, rebase, fast-forward landing or an additional breaking trailer.

2. **Review resolutions and validate the completed integration.**
   Resolve the actual merge and inspect `git show --remerge-diff <merge>` plus first-parent-to-merge diffs for automatic customizations.
   Run `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` on the completed tree; preserve complete diagnostics and exit status.
   Run core `verify:public-types` because the timing/persistence/navigation types change, and the existing selector/worktrees behavior suites and typechecks from their current maintainer instructions.
   These are existing checks, not authorization for a new packed-consumer matrix or cross-extension harness.
   Gate failures stop completion, including inherited failures; report provenance and obtain the operator's next action rather than silently repairing upstream behavior or weakening tests.
   Correct demonstrated resolution regressions in scope, using existing tests; any new functional choice/test gap returns to the operator first.
   No empty validation commit is needed; if a reviewed correction is necessary, commit it separately with an outcome-specific message and no invented breaking declaration.

3. **Check source feasibility and commit the implementation handoff.**
   Load release-source guidance and run the actual resolver separately for `pi-subagents` and `pi-subagents-worktrees` at completed integration HEAD, using the registry identities.
   Record the incorporated commit, contained stable anchor and tail result for each; the incorporated commit must be the pinned target.
   Reuse the read-only resolver invocation below; no source ledger, CHANGELOG rewrite or release action is required.
   Record actual merge OID, reviewed resolutions/automatic intersections, source results, validation commands/results and evidence locations in the ordinary retro.
   Update this plan only for actual deviations, preserving the fixed target and approved boundaries.
   Commit handoff documentation before independent review; suggested subject `docs(retro): record integration handoff for issue #46`.

   ```bash
   node --input-type=module -e '
   import {execFileSync} from "node:child_process";
   import {readReleasePackages, requireReleasePackage} from "./scripts/release/release-metadata.mjs";
   import {resolveUpstreamSource} from "./scripts/fork-sync/source.mjs";
   const repo = process.cwd();
   const at = execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim();
   const registry = readReleasePackages("scripts/release/release-packages.json", repo);
   for (const directory of ["pi-subagents", "pi-subagents-worktrees"]) {
     const registration = requireReleasePackage(registry, directory);
     console.log(JSON.stringify({directory, at,
       source: resolveUpstreamSource({repo, at, upstream: registration.upstream})}));
   }
   '
   ```

   This invocation was dry-run during planning and resolved both prior source claims successfully.
   A tail mismatch with the planning prediction requires explanation from actual scoped changes, not a new integration target.

4. **Hand off exact refs and inventories to independent review.**
   This is the final numbered implementation step, not a tag-based or feature-worktree handoff.
   Locate the actual merge using `git log --first-parent --merges --format='%H %P' HEAD`, selecting the merge whose second parent equals the pinned target; verify exactly two parents.
   Resolve `MERGE` to that commit, `FIRST=$(git rev-parse "$MERGE^1")`, `TARGET=$(git rev-parse "$MERGE^2")`, `TIP=$(git rev-parse HEAD)` and `COMMON=$(git merge-base "$FIRST" "$TARGET")`.
   Verify the merge is reachable from `TIP`; resolve these OIDs only once the actual commits exist, never from the planning preview tree.
   Generate both full inventories:

   ```bash
   git diff --name-status "$COMMON" "$TARGET" > /tmp/f0046-incoming-paths.txt
   git diff --name-status "$FIRST" "$TIP" > /tmp/f0046-integration-paths.txt
   ```

   Explicitly override the reviewer's default release-tag/plan-parent range with `FIRST..TIP`.
   Supply both range OIDs, actual merge, pinned target, common base, this full plan, `fork-sync` with the actual synchronization review task, inventory-generation inputs and selected contract intersections/reasons.
   Group entry points by identity/history, timing/report/persistence, selector lifecycle/presentation/loading, worktrees service/config/disposal, instruction resolutions and source evidence.
   Include actual handoff updates and critical warnings, not a copied diagnosis or predicted verdict.
   Require the reviewer to regenerate and check both complete inventories independently, retain normal deterministic gates and apply synchronization scope rather than commissioning a fresh upstream audit.
   Accept review only when its report states actual range, inventory coverage/deep-review scope, check results and provenance-aware finding dispositions.
   In-scope failures require correction and normal follow-up review; do not add another reviewer merely to repeat the incoming inventory.
   At later `/ship`, use the actual merge first parent as `RANGE_BASE` for the existing candidate command/closing summary, including post-merge contributions.
   Close only this fork issue and explicitly verified fork close targets; skip the incoming-history co-shipped issue scan.
   Shipping remains a separate stage and cannot manufacture a merge, source claim or publication authorization.

## Risks and Mitigations

- Automatic merges can silently lose fork presentation: inspect final source and rerun the already discriminating selection tests rather than adding duplicates.
- Taking one side of import conflicts can drop valid scenarios: keep both fork and incoming imports and run whole affected files.
- Upstream roadmap archival can overwrite fork current-state prose: adopt the archive without restoring obsolete active steps, retaining fork-specific contracts in current documentation.
- Lockfile/manifest conflict resolution can replace fork identities or dependencies: resolve manifests first, inspect lockfile changes and require installation/type/public-consumer checks.
- A current successful source resolver still describes the previous integration: rerun per fork after the genuine pinned merge, and require its actual ancestry in review.
- Upstream instructions can erase fork operational constraints: preserve fork lookup/startup/range rules and the existing safe logging policy while taking the incoming improvements.
- Inherited defects can expand synchronization indefinitely: required failures stop; confirmed unrelated inherited defects with passing required gates stay outside scope without automatic repair, issue filing or ship warning.
- Human/live checks can become an unbounded acceptance project: omit them unless a named adaptation uncertainty remains, then obtain approval for the smallest useful check.

## Open Questions

No unresolved compatibility choice blocks this plan.
Unexpected contract changes, failed required checks or a concrete adaptation/test gap return to the operator before affected work.
No concrete new follow-up is deferred by this plan.

[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#37]: https://github.com/Jopqior/gotgenes-pi-packages/issues/37
