---
issue: 40
issue_title: "refactor(repo): simplify fork-sync scripts, release integration, and tests"
---

# Simplify fork synchronization and release-source display

## Release Recommendation

**Release:** ship independently

This repository-scoped issue is not a package roadmap or release-batch member.
The two package README updates are independently releasable documentation changes, not permission to publish either package.
Keep their `docs:` commit separate from the breaking root-tooling commits so ordinary path classification does not assign a package major bump for maintainer-link updates.
All integration, tagging, release dispatch and npm publication still require their existing separate approvals.

## Problem Statement

Synchronization currently spans an executable Markdown fence, a Bash entry point, a fork-specific version algorithm, package ledgers, generated tables and historical release utilities.
Its tests preserve those layers, duplicate input matrices and even validate the fixture machinery itself.
Renaming directories or splitting large files would leave the unnecessary responsibilities intact.
Keep issue entry, safe repository integration and accurate release-source display; remove the fork-specific release policy and its maintenance machinery.

## Goals

- Organize the live feature under `scripts/fork-sync/`, `test/fork-sync/` and `docs/fork-sync/`, with `/fork-sync` as its issue-only prompt.
- Preserve exact-target issue lookup and creation safety, repository-level no-tag fetch, and offline genuine two-parent integration of an approved commit.
- Apply the existing ordinary path-scoped Conventional Commit/git-cliff policy to every package, while retaining the verified release-range lower bound.
- Derive source display from actual incorporated ancestry and upstream stable tags, independently of version calculation.
- Show both the contained stable release and the actual incorporated upstream commit; label an unreleased package tail without rejecting it.
- Stop source failures before tracked release-file writes, commits or tags, and reuse the prepared tagged text in downstream jobs.
- Remove obsolete scenarios and fixtures, preserving focused executable coverage for distinct risks.
- Treat command/path removals, removed arguments, changed version defaults and the new source-block shape as breaking repository-tooling changes.
  Use `fix(repo)!:` with the concrete footer in step 5; the namespace cutover also has an explicit breaking footer in step 6.
- Leave extension runtime APIs, package identities, approved publication destinations and existing published artifacts unchanged.

## Non-Goals

- No actual upstream integration, release dispatch, first publication, tag movement, npm mutation or GitHub Release edit occurs while implementing this tooling issue.
- No compatibility wrappers, old ledger readers, historical release replay, missing-evidence backfill or first-version inference.
- No package-specific semantic contribution overrides, commit trailers or local release-decision inputs passed to CI.
  A shared breaking commit can cause the same semantic bump class in several path-matching packages; the ordinary monorepo policy deliberately keeps that limitation.
- No runtime changes for the open selector request [#26](https://github.com/Jopqior/gotgenes-pi-packages/issues/26).
- No cleanup of generic tag-selection loops, new retry framework, extension lifecycle changes or unrelated package registration.
- Do not rename the actual `upstream` remote, `upstream/main`, upstream repository names or the pinned `Upstream target:` issue-body identity.
- Preserve historical plans, retros, handoffs, history-restoration records and tagged CHANGELOG/GitHub Release/npm artifacts.
  Their old feature names describe history, not live entry points.
- Do not repair the existing first-tag CHANGELOG gaps discovered in the scanner corpus; those are historical artifacts outside the requested current/future release route.

## Background

At planning baseline `13ca04a1896a571930c506c3468b2392e1a3c8cf`, #40 is open, authored by the authenticated operator and labeled `scope:repo`.
No earlier `f0040-*` plan or retro exists.
The fork has no open PRs; the open sibling issue is #26, which does not change these scripts.
The newest triage, `docs/triage/2026-10-02-backlog.md`, is inherited upstream context and supplies no fork #40 disposition.

Already-landed constraints matter more than the earlier decompositions:

- [#11](https://github.com/Jopqior/gotgenes-pi-packages/issues/11) established the explicit latest-tag range to prevent a path-excluded tag commit from disappearing from git-cliff's release boundary.
- [#24](https://github.com/Jopqior/gotgenes-pi-packages/issues/24) established accurate source display and exact tagged notes, not a permanent requirement for an independent table or ledger.
- [#29](https://github.com/Jopqior/gotgenes-pi-packages/issues/29) organized the older policy; its plan/retro explain why the shared policy and package configuration were separated.
  This issue deliberately removes that policy rather than simply renaming its modules.
- [#36](https://github.com/Jopqior/gotgenes-pi-packages/issues/36) and [#37](https://github.com/Jopqior/gotgenes-pi-packages/issues/37) landed separate core/worktrees identities and publication safeguards.
  Worktrees is now published; npm queries confirmed core `6.0.0` and worktrees `0.1.0` during planning.
- [#39](https://github.com/Jopqior/gotgenes-pi-packages/issues/39) established question-directed intake, independently reproducible incoming/integration inventories and plan-mediated reviewer handoffs.
  Renaming the synchronization guide must preserve those contracts, not reintroduce an ad hoc synchronization lifecycle.

`next-version.sh` and `verify-cliff-parity.sh` already converge on `lib.sh:next_tag`.
`prepare-release.sh` derives the entire selection before tracked writes; `release-artifacts.mjs` currently also projects ledgers and tables.
`publish-released.sh` and `create-github-releases.sh` validate the entire tagged selection before external effects, and GitHub notes come from the tagged CHANGELOG rather than a new git-cliff render.
`.pi/prompts/ship.md` has an executable registry import which must migrate with the release consumers.

AGENTS constraints remain load-bearing: explicit fork GitHub targets, approved publication identities, no imported upstream tags, root/primary-checkout integration, English committed artifacts and no fabricated version/issue/SHA values.
This is tooling work, not synchronization; the issue grants no integration or publication authorization.

## Design Overview

### Responsibility boundaries and operator decision

Use three cohesive synchronization modules, not a forwarding-helper hierarchy:

- `scripts/fork-sync/issue.mjs`: `gh` identity/target queries, complete pagination, exact issue matching, validated creation and ambiguous-result recovery.
  The prompt retains human drafting and stage handoff, but contains no executable program fence.
- `scripts/fork-sync/sync.sh`: repository-level fetch and approved offline merge only.
  Keep the current CLI style: `--fetch`, `--merge --expected-upstream <full OID>`, `--upstream-protocol <ssh|https>` and effect-free help.
- `scripts/fork-sync/source.mjs`: online source resolution, source-block rendering and offline verification of the new tagged source block.
  It knows upstream package identity, not fork release levels, the registry layout or historical ledgers.

Keep generic identity and tagged-section handling in `scripts/release/release-metadata.mjs`, replacing `release-correspondence.mjs`.
The generic artifact orchestrator imports metadata and source; neither imports it or each other.
No source CLI, service registry, compatibility facade or persistent source cache is needed.
For manual first-publication review, the guide can call the exported resolver and renderer from a short Node invocation without generating a version or a candidate artifact bundle.

The operator approved automatic temporary-repository source preflight during release preparation.
Normal execution is in CI; an explicitly allowed local preparation runs the same preflight.
Offline prediction does not query source information, and original-package preparation does not contact upstream.
Downstream publication uses already-prepared tagged claims and local objects, without asking upstream to select a source again.

### Issue entry and repository operations

Extract the fence into JavaScript because its non-Git responsibility is GitHub querying, JSON matching and issue creation.
Keep `ENTRY_MODE`, `TARGET` and `ISSUE_BODY_FILE` as data inputs, the existing lookup JSON, and the successful creation URL plus `/plan-issue N` output.
Validate the mode and target; match complete body lines, normalize CRLF, exclude PRs and require successful complete pagination.
Reuse open or closed matches without reopening; report multiple matches without choosing.
Create mode rechecks all states immediately before its single explicitly fork-targeted mutation.
A failed or malformed creation response triggers only a read-only recovery lookup and a nonzero stop, never an automatic retry.
The remaining non-atomic concurrent-creator race is documented rather than “solved” with a lock.
These cases are covered in step 1.

Remove the sync recorder, contribution arguments, package selector and fetch-time tag query.
Fetch still configures/verifies the canonical remote, uses the explicit no-tag main refspec, reports the target OID and repository ahead/behind, and preserves the complete local tag ref/object mapping even on failure.
Merge still checks fork origin, `main`, primary checkout, clean tracked/index state, no merge/rebase in progress, exact locally available approved OID, containment, divergence and common ancestry before `--no-ff`.
Keep unsupported-object-format and malformed-OID rejection, including the current repository-aware SHA length check.
Already-contained input is a no-op; fast-forward-only/unrelated input and inspection errors remain refusals.
Conflict recovery leaves Git's unresolved state for operator review; successful integration verifies both expected parents and never pushes.
Replace recorder instructions with normal implementation/review handoffs without rolling back refs or claiming that a failed merge succeeded.
These cases are covered in steps 5 and 6.

### Ledger-free source resolution

The source resolver receives only fields it uses:

```ts
type UpstreamPackage = {
  name: string; // manifest identity
  repository: string; // trusted upstream URL and fixed links
  directory: string; // manifest and package path scope
};
type UpstreamSource = {
  upstreamPackage: string;
  upstreamVersion: string; // highest contained stable release
  releaseCommit: string;
  incorporatedCommit: string;
  unreleasedPackageChanges: boolean;
};
```

`resolveUpstreamSource({repo, at, upstream})` reads the fork graph at an explicit preparation commit and returns this value or throws.
No decision/tag/version field crosses this interface.
All upstream input fields are used; registry-only `directory`, fork `name`, `kind` and old `evidence` fields are not threaded into the resolver.

For each resolution, create a temporary bare shared clone of the full local fork repository with `--no-tags`.
Fetch `https://github.com/<registered repository>.git` main into a temporary private ref with `--no-tags --no-write-fetch-head`.
Query remote stable package tags with `ls-remote --tags`; peel annotated tags using their advertised `^{}` records and also support lightweight tags.
Do not create/configure a live fork remote, update fork refs or import upstream tag refs.
Clean the temporary repository in a `finally` block on success and failure; temporary Git metadata is not a synchronization ledger.
Do not add persistent caching or a new dependency-injection framework to avoid a bounded repeated query for a multi-package release.

Walk the fork's first-parent merge history at `at`.
Select the latest genuine two-parent merge whose second parent belongs to the verified upstream-main history and whose first parent does not.
This excludes inherited upstream merges and ordinary fork feature merges; verify ordering against earlier eligible upstream parents rather than silently selecting a regressive or incomparable integration.
Reject missing/shallow/partial evidence, ambiguous upstream-carrying topology or no eligible integration instead of guessing from a message, dependency range or today's advertised package version.
An ancestry command's exit 1 means “not contained”; inspection failure is an error, not a negative candidate.
Cover selection, multiple integrations, irrelevant feature merges, invalid topology and acquisition failures in step 2.

Choose the numerically highest stable tag contained in the selected second parent, not the newest remote tag.
Validate the manifest at that commit against both registered upstream name and tag version.
A GitHub Release object is neither queried nor required.
Prereleases/malformed versions and uncontained branch releases are not candidates; corrupt required manifest/object evidence fails rather than falling back to an older claim.
The incorporated commit must be present in fork ancestry, and the stable commit must be contained in it.
These cases are covered in step 2.

### Package-tail semantics and source text

Inspect commits in `releaseCommit..incorporatedCommit`, including merge-only path changes, rather than merely comparing endpoint trees.
Apply the package release scope: exclude its CHANGELOG and `docs/{plans,retro,architecture,decisions,assets}`, but include code, tests, manifest and shipped documentation.
Use lossless NUL-delimited path output.
This sees incorporated package changes that an endpoint diff would miss after a later revert, without labeling another package's changes as this package's unreleased tail.
It does not introduce a release level or behavioral-equivalence claim.
Tail positive/negative, merge-only, reverted, excluded-doc and non-ASCII path cases are covered in step 2.

Keep the existing managed `upstream-correspondence` marker pair for the new source block, but describe the contained stable release and actual incorporated commit separately.
Retain fixed links for the stable release commit and add a fixed link for the incorporated commit.
Emit a clear “includes unreleased changes to this package” line only when the scoped tail is nonempty.
No source block is emitted for an original package.
Do not add a second persisted JSON evidence file or a new versioned ledger format.
Old tagged blocks are left untouched and are not given a historical compatibility parser by this change.
The canonical new block for the measured current core source is:

````markdown
<!-- upstream-correspondence:start -->
### Upstream correspondence

Direct upstream package: `@gotgenes/pi-subagents`

Contained stable upstream release: `23.2.0`

Stable release source: [fixed upstream release commit](https://github.com/gotgenes/pi-packages/blob/6879774308ba8056859fa42284da71763fe1fe78/packages/pi-subagents)

Incorporated source: [fixed incorporated upstream commit](https://github.com/gotgenes/pi-packages/blob/8d373ceab20c5236b08d8d6c032fd515b9fa8dc4/packages/pi-subagents)

This records incorporated source provenance, not behavioral equivalence or the identity of historical npm artifacts.
<!-- upstream-correspondence:end -->
````

For a positive scoped tail, insert the standalone paragraph `Includes unreleased changes to this package.` before the disclaimer; for an empty tail, omit it.
Use the same shape for each registered fork with its own values, and validate/render the complete block rather than independently formatting it in several consumers.
Step 2 covers rendered claims; step 5 covers their tagged round trip.

### Generic release preparation and publication

Simplify registration to explicit `directory`, npm `name`, `kind` and, for forks, `upstream`.
Remove the duplicate `evidence` selector and the separate package-target configuration registry.
Use a direct new internal registry schema version without accepting the old format through a compatibility branch; change all readers/fixtures together in step 5.
Registration remains required for publication and checked against manifests; discovering a workspace or matching an inherited tag never authorizes publication.
The design-review checklist found no reason for a wider dependency bag or service abstraction: each upstream input field is consumed, outputs are returned values, temporary cleanup is module-owned, and intermediaries do not relay a derived release level.
The existing preflight/effect boundary remains the shared downstream decision point; each caller does not independently invent source claims.

`next_tag` always builds `cliff_args` and calls `bumped_version`.
Keep the explicit latest-tag lower bound and all current path exclusions, breaking-commit protection and visible/skipped Conventional Commit types.
Keep refusal when a first release tag does not exist and the distinction between empty successful prediction and failed derivation.
CI recomputes from its expected checkout; no local decision is serialized or passed as a workflow input.
Step 5 covers prediction and merge-history regressions.

The artifact call site remains a short composition of owned results:

```ts
const registration = requireReleasePackage(registry, item.directory);
const source = registration.kind === "fork"
  ? resolveUpstreamSource({repo, at: head, upstream: registration.upstream}) : null;
const section = composeReleaseSection(rawSection, source);
validatePreparedSection(section, item.tag, registration);
```

The extracted source module talks directly to its upstream boundary, not through a release-policy intermediary:

```ts
const evidence = acquireTemporaryUpstream(repo, upstream.repository);
try {
  const tip = incorporatedParent(evidence, at);
  return sourceAt(evidence, upstream, tip);
} finally { evidence.dispose(); }
```

These are interaction sketches, not instructions to create forwarding functions for every line.
Helpers return values and own their temporary resources; no output-argument mutation or wide dependency bag is required.
`source.mjs` has no import edge to metadata, and metadata has no edge back to source or artifacts.
Planning-time `pnpm --silent fallow guard scripts/release/release-artifacts.mjs` reported scripts outside architecture zones as unrestricted; there is no cross-zone exception to introduce.

Derive every selected version, resolve every required source, validate headings and compose each complete new section before any tracked file changes.
Temporary rendering can occur during preflight, but failing a later package must leave all manifests, CHANGELOGs, HEAD and tags unchanged.
Compose canonical section bytes once, including their boundary newline; splice those bytes without a second render or trailing-byte rewrite.
The old insertion helper trims/extends text today, so exact new-section reuse needs an executable test rather than an assumption.
Preserve all older section bytes and handle a missing CHANGELOG using the already-preflighted header and section.
These cases are covered in step 5.

Published validation binds the exact tag at checkout HEAD, registered manifest name/version, clean package contents and critical manifest/CHANGELOG bytes.
Read the new source block from the exact tagged section; validate its identities, fixed-link paths, local commit/manifest ancestry, integration-parent claim and scoped tail label.
Do not reselect stable tags from a moving remote after preparation.
Original packages must have no source markers, and a missing/conflicting new fork block fails before any member is published.
Both downstream jobs use the exact tagged section bytes; existing GitHub Releases are never overwritten, and conflicting managed blocks stop the whole creation selection.
Step 5 covers these contracts with fake external effects.

### Planning evidence and limits

The probes used existing fork tags, genuine merge parents, current manifests and actual `git ls-remote` output, not a hand-built imitation of the diagnosis.
They ran once per deterministic condition with git-cliff `2.14.1` and no stochastic service or result cache.
No root repository integration, tag import or publication was performed.

Measured source reconstruction at real fork snapshots:

| Fork snapshot                | Incorporated upstream parent               | Contained direct stable release | Package tail |
| ---------------------------- | ------------------------------------------ | ------------------------------- | ------------ |
| core `v1.0.0`                | `045213317de608c04a7b6052b2b843e3a0f2176f` | core `21.7.0`                   | absent       |
| core `v4.0.7`                | `4dd378ca97a35e380ed946cd5ce0bcb9050ced5a` | core `21.7.7`                   | absent       |
| core `v5.0.0`                | `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032` | core `22.0.0`                   | absent       |
| core `v6.0.0` / current HEAD | `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4` | core `23.2.0`                   | absent       |
| worktrees `v0.1.0`           | `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032` | worktrees `0.3.3`               | absent       |
| current worktrees source     | `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4` | worktrees `0.3.3`               | absent       |

The core stable source commit is `6879774308ba8056859fa42284da71763fe1fe78`; worktrees is `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
A fork-only bare clone initially lacked the advertised upstream-main object `d5aadf724fca7e6fb5124bc677c0ff7b41136add`.
An explicit no-tag temporary fetch supplied that object and reproduced the same contained-source selections, without creating upstream tag refs.
A separate `--bare --shared --no-tags` clone and private-ref fetch also resolved current HEAD correctly and retained an empty temporary tag namespace.
This validates the proposed acquisition shape for CI's `fetch-depth: 0` fork checkout; it does not claim the new production resolver already exists.

For positive package tails, the input was real upstream commit `802717db69260a45e050fd73155932cac9f8c29f`, immediately before the core `23.2.0` release commit.
The measured contained core release was `23.1.1`, with a core package tail; worktrees remained `0.3.3` without a worktrees tail.
Later upstream commit `5bd1dd954c72c5c7497fe879b890cb0db89ce2c9` likewise had a core tail after `23.4.0` and no worktrees tail.
These are real object/range measurements for counterfactual incorporated tips, not evidence that either tip has been integrated into this fork.
Merge-only/revert failures and new resolver killing mutations remain synthetic executable cases to implement in step 2.

Measured ordinary git-cliff results in disposable checkouts at the actual pre-release commits, with future fork tags removed only in those checkouts:

| Current tag and real preparation HEAD                      | Bounded prediction | Unbounded prediction | Rendered bounded/unbounded entries |
| ---------------------------------------------------------- | ------------------ | -------------------- | ---------------------------------- |
| core `v4.0.7` → `4b67beb37d4551631e526b94f052b7c6e5bea64c` | `v5.0.0`           | `v5.0.0`             | measured 21 / 21; same IDs         |
| core `v5.0.0` → `ee9b0fa25ef95e2030c39bdf0ac7a50c17be13dd` | `v6.0.0`           | `v6.0.0`             | measured 20 / 20; same IDs         |
| core `v1.0.0` → `4aaa73cba4adea0f0b5080a6a04bc57fc5b88e72` | `v1.0.1`           | incorrect `v2.0.0`   | measured 3 / 3; same IDs           |

The lower bound is load-bearing for version prediction, not a fork ledger rule.
Actual `--unreleased --tag` rendering was range-correct in these samples, so keep its current invocation rather than inventing another renderer fix.
A first probe made against the present checkout with later tags still available produced misleading historical predictions; those results were discarded in favor of the isolated checkouts.
Current core/worktrees predictions both succeed with empty stdout, and ordinary bounded git-cliff also returns their current tags.

## Module-Level Changes

### Executable and configuration disposition

| Existing surface                                                                                           | Disposition and target                                                                             | Reason                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `.pi/prompts/upstream-sync.md`                                                                             | Extract program, then rename to `.pi/prompts/fork-sync.md`                                         | Prompt owns workflow/drafting, script owns execution; no alias                                                      |
| `scripts/upstream-sync.sh`                                                                                 | Narrow, then move to `scripts/fork-sync/sync.sh`                                                   | Retain fetch/merge safeguards; delete recorder, selector and package-report query                                   |
| `scripts/release/record-fork-sync.mjs`, `fork-sync.mjs`, `fork-sync-targets.mjs`                           | Delete in step 5                                                                                   | No recorder, fork decision CLI or duplicate target registry remains                                                 |
| `scripts/release/fork-sync/`                                                                               | Replace retained source responsibilities with `scripts/fork-sync/source.mjs`; delete old directory | Decision, state, contribution and recording mechanisms disappear; do not relocate them wholesale                    |
| `scripts/release/pi-subagents/`, `scripts/release/pi-subagents-worktrees/`                                 | Delete configurations and `sync-state.json` files                                                  | Explicit package/upstream identities stay in the single release registry                                            |
| `scripts/release/release-correspondence.mjs`                                                               | Replace with `release-metadata.mjs`                                                                | Keep registry/identity/section contracts, remove pending/published ledger resolvers                                 |
| `scripts/release/release-artifacts.mjs`                                                                    | Rewrite preparation/publication boundary                                                           | Resolve and decorate source, no projected states or table artifacts                                                 |
| `scripts/release/lib.sh`                                                                                   | Remove `fork_sync_cli` and fork dispatch from `next_tag`                                           | One ordinary bounded git-cliff prediction path                                                                      |
| `scripts/release/prepare-release.sh`                                                                       | Remove fork decision/spec fields and state/table application; pin preflighted section bytes        | No maintained evidence writes or recomputation drift                                                                |
| `scripts/release/publish-released.sh`, `create-github-releases.sh`                                         | Migrate artifact validation; keep selected-tag and effect boundaries                               | Tagged claims and exact text replace ledger checks                                                                  |
| `scripts/release/correspondence-table.mjs`, `backfill-release-notes.mjs`, `prepare-first-fork-release.mjs` | Delete in step 5                                                                                   | Their responsibilities are explicitly removed                                                                       |
| `scripts/release/release-packages.json`                                                                    | New direct internal schema without `evidence`                                                      | Retain explicit original/fork classification and publication identity                                               |
| `.pi/prompts/ship.md:release-candidates`                                                                   | Migrate metadata import in step 5                                                                  | Executable consumer outside the normal static import graph                                                          |
| `.github/workflows/release.yml`                                                                            | Remove redundant git-cliff installation from GitHub-notes job only                                 | Notes use the tagged section; preparation still installs git-cliff and all jobs keep full history/exact release SHA |

`next-version.sh`, `verify-cliff-parity.sh`, `cliff.toml`, root package scripts and `.github/workflows/ci.yml` are predicted unchanged.
That prediction rests on preserving their `next_tag` contract, existing version mapping and Vitest `test/**/*.test.mjs` discovery, not on omitting them from verification.
No runtime package manifest, lockfile, settings, `src/`, architecture module tree or roadmap step changes are planned.

### Current documentation disposition

- Move `docs/upstream/synchronization-guide.md` to `docs/fork-sync/synchronization-guide.md` after removing recorder/package-report prescriptions.
  Preserve its standard lifecycle ownership, fork conflict-review surfaces, inventory commands, #39 handoff requirements, no-tag/primary-checkout safeguards and separate approval gates.
- Replace `docs/upstream/fork-release-policy.md` with `docs/fork-sync/release-source-guide.md`.
  Explain ordinary versioning separately from source reconstruction, temporary acquisition, unreleased tails, failure timing, exact tagged text and concise manual first-publication guidance.
- Delete both `docs/upstream/*-release-correspondence.md` tables without rewriting any historical release.
- Update the live links and descriptions in `AGENTS.md`, root `README.md`, `.pi/skills/releasing/SKILL.md`, and the renamed prompt.
  Sweep each edited file for repeated statements of the old workflow, not only its first paragraph.
- Update `packages/pi-subagents/README.md` release provenance and `/upstream-sync` sections, and `packages/pi-subagents-worktrees/README.md` first-publication section.
  Remove generator/application-bundle instructions; retain package identities, approval requirements and Trusted Publisher setup.
- Check all `.pi/skills/`, `.pi/prompts/`, `.pi/agents/`, current package docs and root current docs for removed mechanism names, paths and heading anchors.
  Planning-time package-skill searches found no package-skill implementation prose requiring a synchronization rename; the releasing skill does require policy changes.
  Historical-only matches stay historical.

### Target tests and fixtures

- Add `test/fork-sync/issue-entry.test.mjs`, `source.test.mjs`, `source-tail.test.mjs` and `release.test.mjs` for retained interfaces.
- Consolidate retained sync operations into `test/fork-sync/fetch.test.mjs`, `merge.test.mjs` and `safety.test.mjs`, with a trimmed `helpers/upstream-network.mjs`.
  Separate files by risk/operation, not by a mechanical line budget.
- Add minimal independent-upstream source history under `test/fork-sync/helpers/source-repository.mjs`.
  The upstream branch must never descend from fork adaptations; transport interception maps only the registered GitHub upstream URL to a local bare repository.
- Add `test/release/release-section.test.mjs` for the exact-section contract isolated by Tidy First, and a small `metadata.test.mjs` for registry/identity controls.
- Keep ordinary non-sync version/prediction cases in `test/release/bumped-version.test.mjs`; move its upstream-merge range cases into `test/fork-sync/release.test.mjs` without duplicating them.
- Preserve the generic `test/release/helpers/git-repository.mjs` capabilities needed by retained callers.
  Delete `test/release/git-repository.test.mjs`'s fixture-self assertions; actual script-copy completeness is exercised by retained entry-point and preparation processes instead.
- Replace `workflow-contract.test.mjs` with a small `test/fork-sync/workflow.test.mjs` for valid live resources and executable `/ship` registry behavior, not policy sentence equality.
- Update `test/worktrees/package-contract.test.mjs`'s exact registry assertion in the schema-switch commit.
- Delete the old policy/state/CLI/migration/history/recorder/table/backfill/first-candidate suites after salvaging the exact retained scenarios below.
  Delete their old `fork-sync-scenario`, `multi-fork-scenario`, `release-artifacts` and `first-fork-scenario` helpers and dedicated JSON fixtures once their importing consumers migrate.
  In `test/release/`, this means deleting `fork-sync.test.mjs`, `fork-sync-{cliff,cli,migration,shared,history,state,values,targets,preparation,scenario}.test.mjs`, `release-artifacts-fixture.test.mjs`, `release-correspondence-history.test.mjs`, `correspondence-table.test.mjs`, `release-backfill.test.mjs` and `first-fork-release.test.mjs`.
  After their retained cases migrate, also remove `upstream-release.test.mjs`, `release-correspondence.test.mjs`, `release-correspondence-views.test.mjs`, `release-publication.test.mjs`, `multi-fork-release.test.mjs` and `worktrees-prediction.test.mjs` rather than keep duplicate suites.
  Remove all old `test/upstream-sync/` files after the retained groups migrate, including recorder and network-helper self tests.
  Delete `test/release/fixtures/pi-subagents-v1.0.1-release.json` and `pi-subagents-sync-state-v1.json` as removed-tool fixtures, not as edits to published artifacts.

## Test Impact Analysis

The scenario inventory, not the old file layout, determines preservation:

| Scenario family and existing examples                                                                                                                                         | Disposition                                                                        | Retained test surface                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `issue-entry`: later-page exact match, closed reuse, CRLF, PR exclusion, near-SHA mismatch, incomplete pagination                                                             | Keep executable behavior                                                           | Direct issue-script process; no fence extraction                              |
| `issue-entry`: final closed-match recheck, fork/scope/body targeting, malformed/failed creation and failed recovery                                                           | Keep distinct mutation risks                                                       | Same script, fake `gh`, effect log and actual body bytes                      |
| `merge`: help, malformed/conflicting modes, remote URL/protocol guards                                                                                                        | Consolidate equivalent spellings; keep distinct effects                            | Sync CLI processes                                                            |
| `merge`: explicit refspec/no-tags, existing tag add/delete/retarget drift including fetch failure                                                                             | Keep                                                                               | Local Git network and before/after ref-object mappings                        |
| `merge`: branch/primary-checkout/origin/dirty/index/in-progress state; exact local OID, containment/divergence/common ancestor                                                | Keep each distinct safety refusal                                                  | Merge/safety CLI cases, zero forbidden effects                                |
| `merge`: conflicts versus failure without unmerged entries, expected two parents, already-contained no-op, no push                                                            | Keep                                                                               | Real local merge processes; topology is evidence, not a standalone Git lesson |
| Package fetch selector, latest package reporting, contribution arguments and recorder idempotence/continuity                                                                  | Delete                                                                             | Removed public behavior                                                       |
| Fork-level/manifest-level/commit-level aggregation, unchanged-major-lines, state migration/review records and ledger schema matrices                                          | Delete                                                                             | No version policy or compatibility readers                                    |
| `bumped-version`: out-of-scope tag, annotated tag, old/new upstream breaking ancestry, predictor/parity failure propagation                                                   | Keep focused invocation regressions; avoid re-testing every git-cliff commit class | Ordinary release tests plus sync-history cases                                |
| `upstream-release`: highest contained stable versus advertised newer, annotated/lightweight tags, manifest mismatch                                                           | Rewrite                                                                            | Source resolver, independent graph and actual local remote tags               |
| Ledger validators rejecting an unreleased package tail                                                                                                                        | Delete rejection; replace with precise positive/negative display cases             | Source/tail output and tagged round trip                                      |
| `release-publication`: selected-set preflight, missing CHANGELOG, older bytes, mixed original/forks, dirty checkout, tag identity, exact notes and existing Release conflicts | Rewrite without state/table assumptions                                            | Real preparation/publish/create scripts; external effects intercepted         |
| `multi-fork-release`: own identities/source and no changes to unselected package                                                                                              | Keep, remove per-fork-level expectations                                           | Combined-selection release cases                                              |
| Section scanner: exact compare/first-tag heading, wrong repo/package/version, duplicate heading, CRLF, four-backtick/tilde/unclosed fences                                    | Keep; isolate from ledger fixtures                                                 | Direct strings and small tagged Git round trip                                |
| Real historical scanner corpus                                                                                                                                                | Keep scanner checks and established failures only                                  | No historical provenance replay                                               |
| Tables, historical Release backfill, candidate generation/application and their fixture self-contracts                                                                        | Delete wholesale                                                                   | No replacement utility or fixture framework                                   |
| Guide/prompt exact policy sentences, module-export migration assertions, helper-only fault-injection tests                                                                    | Delete                                                                             | Keep resource existence/import wiring and meaningful executable effects only  |

New source tests can now ask which upstream source is contained, and whether a package tail is visible, without building a synchronization ledger or selecting a release level.
Those tests replace redundant evidence/recorder/decision matrices rather than add another layer over them.
Process tests must remain for pagination, single-mutation recovery, Git CLI safeguards, all-selected atomicity and actual downstream effect ordering; module mocks cannot pin those boundaries.

Planning baseline verification:

- `pnpm run test:scripts -- test/release/bumped-version.test.mjs` actually ran the whole root script suite because of argument forwarding: measured 43 files / 995 tests passed.
  Do not misreport that invocation as a focused test run.
- The unambiguous focused command `pnpm exec vitest run test/release/bumped-version.test.mjs` passed its measured 12 tests.
- The existing exact-section scanner was run against every current registered tagged CHANGELOG sample: measured 23 tag attempts, with the two existing first-tag failures (core missing an exact fork section; selector missing a tagged CHANGELOG).
  Current-file scans also retain those first-tag gaps; neither requires historical repair.
- The existing `/ship` candidate fence was dry-run at `RANGE_BASE=HEAD`, producing `{"registered":[],"unregistered":[]}`.
  `release-artifacts --help`, sync help and current core/worktrees offline predictions were also exercised without mutation.
- New entry paths and source-block parsing do not exist yet and were not presented as executed production behavior.
  Re-run their concrete cases and mutations during their TDD steps, including all real scanner samples and repository-standard four-backtick fences.

Use roughly 400 lines as the agreed script/test/helper review trigger, not a target to game with an oversized shared builder.
The predicted test reduction is qualitative: the explicitly named obsolete scenario families disappear; no invented final test count or coverage percentage is a goal.

## Invariants at risk

| Existing constraint and constituency                                                                                       | Current evidence                                                                                                  | New pin                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| #11: operators get only post-tag semantic changes, including tags on excluded commits                                      | Opened `bumped-version.test.mjs`; real first-tag probe measured patch versus false major                          | Step 5 predictor and merge-history regressions                                                                                          |
| #24: release readers get source claims, not behavioral-equivalence or dependency-derived claims                            | Current core/worktrees tagged sections and registered direct upstream identities                                  | Steps 2/5 own-package source links and exact tagged block                                                                               |
| #24: npm/GitHub consumers receive the same exact tagged notes, with old release text preserved                             | Opened publication/section tests; current splice normalizes boundaries, so raw prepared-byte reuse is not assumed | Steps 3/5 full section/old-suffix byte equality                                                                                         |
| #36/#37: worktrees has its own identity/source; selector is original; unselected packages are untouched                    | Registry, worktrees package-contract assertion and old multi-fork callers opened                                  | Steps 4/5 separate identities, mixed selection and unselected file bytes                                                                |
| #27/#30: maintainer can integrate only an approved local divergent OID on primary main; no upstream tags or automatic push | Opened sync script and merge process tests                                                                        | Steps 5/6 process safeguards and exact parent verification                                                                              |
| #39: reviewers have reproducible incoming/integration inventories and a numbered plan-mediated handoff                     | Read current guide and #39 retro/close discussion                                                                 | Step 6 preserves guide structure and verifies its retained commands; independent completion review checks semantics, not prose equality |

The tests under old state-specific helpers do not prove the new upstream membership predicate: their “upstream” branches can inherit fork commits.
The new fixture's ancestry shape is exercised through source resolution, not certified by another helper-self test.
No cache/latency or prompt-token invariant is claimed for this repository tooling change.

## TDD Order

Each step leaves the root script suite green and ends in a separate commit.
New lower-level modules coexist briefly with old consumers; no compatibility re-export or mass rewrite of a large test file is planned.
During the coordinated switch, every importer/copy-list/test of a removed export is migrated or deleted in the same commit.
No intermediate commit is a release/publication authorization.

1. **Extract executable issue entry without changing the current command.**
   Red: change the existing process harness to invoke `scripts/fork-sync/issue.mjs` directly, retaining the exact lookup/create/recovery cases above; add invalid mode and successful-empty recovery cases.
   Green: move the actual fence behavior into JavaScript, then make the still-named `upstream-sync.md` prompt call it using quoted environment data and its unchanged English drafting/stop responsibilities.
   Verify: run the direct issue tests and root script suite; no real GitHub mutation is part of verification.
   Killing mutations: drop `--paginate` (later-page case); use substring matching (near-match case); omit PR exclusion (PR case); run creation before the final lookup (closed recheck); retry the mutation after failed/malformed output (single-create cases); skip repository/body validation (wrong-target cases).
   Commit: `refactor(fork-sync): move issue entry execution out of the prompt (#40)`.

2. **Add ledger-free source resolution and tail display alongside the old route.**
   Red: add source/source-tail tests with a real independent upstream/fork graph and a local bare upstream transport, without old state/helper APIs.
   Cover stable containment versus newer advertised tags, multiple integrations, irrelevant fork merges, invalid/ambiguous topology, manifest identity/version, annotated/lightweight tags, no GitHub Release query, missing history and network failures.
   Cover package-only tail, unrelated/excluded paths, merge-only changes, a change followed by revert, lossless paths, rendering both fixed links and no original-package block.
   Cover the entire temporary resource lifecycle: created for resolution, read during selection, disposed on both outcomes; live fork refs/config/tags and tracked bytes stay unchanged.
   Green: implement `source.mjs` and its narrow value interface, including offline new-block validation; nothing in generic version calculation imports it.
   Verify: source process/module cases, real planning snapshot selections and the root script suite; use fake transport only at the external boundary.
   Killing mutations: choose the newest remote tag unconditionally (containment); use the earliest eligible merge (multiple integrations); remove first-parent exclusion (fork/inherited merge cases); accept ancestry exit 128 as false (inspection failure); skip manifest name/version validation (mismatch cases); replace scoped commit inspection with endpoint diff (reverted-change case); omit merge-diff paths (merge-only case); treat any repository change as a package tail (unrelated cases); fetch into the live repo or drop `--no-tags` (namespace cases); omit temporary cleanup (success/error lifecycle cases); render the release commit as the incorporated link (tip-link case).
   Commit: `refactor(fork-sync): add ledger-free upstream source resolution (#40)`.

3. **Tidy First: isolate exact section contracts from ledger fixtures.**
   Red/characterization: lift the existing scanner assertions from `release-correspondence-views.test.mjs` and the strict-heading subset of `multi-fork-release.test.mjs` into `test/release/release-section.test.mjs` without adding coverage claims.
   Green: use direct strings for scanning and only the generic scratch Git helper for tagged round trips; retain old provenance assertions at their old layer until step 5 deletes them.
   This accepted preparatory commit removes fixture friction before the metadata migration; it does not redesign deleted helpers.
   Verify: both old remaining suites and the new scanner suite, real tagged corpus with its established first-tag exceptions, and the root script suite.
   Killing mutations: match version without repository/package/compare-target validation (wrong-heading cases); remove fence tracking (four-backtick/tilde cases); trim the returned slice (CRLF/trailing-byte case); take the first match without duplicate detection (ambiguity case); accept an unclosed fence (unclosed-fence case).
   Commit: `test(release): isolate exact tagged section contracts from ledger fixtures (#40)`.

4. **Introduce generic metadata independently of the old policy.**
   Red: retarget the isolated section tests to `release-metadata.mjs` and add small registry/manifest cases for the new internal schema, explicit original/fork classification, duplicates, malformed/traversal paths, missing registration and wrong npm identity.
   Green: move the exact scanner/identity responsibilities into metadata; define the simplified registry shape in new fixtures without changing the live registry yet.
   Do not retain ledger resolvers or import package-specific configuration into this module.
   Verify: section and metadata suites plus all still-live old consumers; inspect import directions before committing.
   Killing mutations: infer an unregistered package from the workspace (registration case); skip name/version equality (identity cases); accept a traversal directory (path case); allow duplicate identities (duplicate case); bypass exact section matching (scanner cases from step 3).
   Commit: `refactor(release): separate package identity and tagged section metadata (#40)`.

5. **Switch release consumers to ordinary versioning and source-only preflight; remove the obsolete lifecycle atomically.**
   Red: add/port retained preparation/publication scenarios into `test/fork-sync/release.test.mjs`, using the independent source graph; update ordinary parity fixtures and the exact worktrees registry assertion in the same cycle.
   Exercise both forks plus original, source-tail output, later-package failure with unchanged tracked bytes/HEAD/tags, missing CHANGELOG, immutable old sections, full prepared-section reuse, tag-at-HEAD/name/version/dirty/assume-unchanged guards, no source reselection downstream, explicit publication targets and existing/conflicting GitHub Releases.
   Keep old-versus-new upstream range regressions, annotated/out-of-scope tags, current-tag no-op, no-first-tag refusal and prediction-error propagation.
   Green: switch `next_tag`, preparation, artifacts, downstream jobs and `/ship` import; switch the live registry and all consuming exact assertions to the new schema.
   Remove decision fields from temporary specs, state/table projections/writes and redundant GitHub-notes git-cliff installation.
   Narrow the current sync script to fetch/merge and remove record/package-report parsing and recovery messages, with its process tests updated in this commit.
   Delete obsolete policy/state/recorder/config/table/backfill/first-generator code, scenarios and dedicated fixtures; remove every importing old consumer rather than leaving dormant compatibility code.
   Update current release guidance and live claims immediately, still at existing guide paths until step 6 moves them.
   Verify: root script suite, `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm --silent fallow dead-code`; re-run real git-cliff planning samples against the actual implementation rather than reusing probe results.
   Killing mutations: route a fork through the old contribution policy or source-derived bump (ordinary-policy cases); remove the explicit prediction range (excluded-tag/old-break cases); delete the source-resolution call at its new preflight site (new fork-source case); start manifest writes before the whole preflight (late-failure snapshot); splice raw undecorated or freshly rendered text (prepared/tagged equality); normalize the old suffix (history bytes); emit core provenance for worktrees (own identity/source); query upstream again during published validation (offline transport case); skip clean/byte checks (dirty/index-suppressed cases); publish before validating the full tagged set (effect log); overwrite an existing Release or ignore a conflicting block (rerun/conflict cases).
   Commit: `fix(repo)!: use ordinary release versioning with verified upstream source notes (#40)`.
   Footer: `BREAKING CHANGE: Fork releases now use ordinary path-scoped Conventional Commits. Synchronization recording, package fetch selectors, contribution overrides, state/config directories, correspondence tables, historical backfill and first-release candidate tooling are removed. New releases require source preflight and the new tagged source block; historical artifacts are unchanged.`

6. **Cut over the live namespace and consolidate retained synchronization scenarios.**
   Red: point sync CLI tests at `scripts/fork-sync/sync.sh`, and add structural checks for the new prompt/guides/imports and absence of the old executable entry points.
   Move only retained scenario groups to fetch/merge/safety/workflow tests; remove recorder-only wrapper controls and all prose-exact policy assertions.
   Green: move the narrowed script and prompt, finalize both current guides under `docs/fork-sync/`, remove old tables/directory leftovers, and update root current links and anchor references.
   Keep this breaking commit outside `packages/`; the packaged README refresh is its own `docs:` cycle in step 7.
   Preserve genuine upstream names and the pinned issue target line; use a fresh Pi session for the first `/fork-sync` invocation rather than relying on in-process prompt registration.
   Verify: root script suite and Markdown link checks after clearing the rumdl cache for moved files; execute the preserved guide inventory commands read-only at the known #38 merge/target and inspect their outputs.
   `/fork-sync` creation verification uses the fake `gh` boundary, not a real issue filing; `/ship` candidate verification remains read-only.
   Killing mutations: point the renamed prompt back to the deleted script (resource/wiring case); delete the actual `--no-ff` merge call at its new site (topology case); bypass primary-checkout/origin/state guards (distinct safety cases); use the unpinned tracking tip instead of the approved OID (exact-target case); add a package tag query to fetch (recorded forbidden invocation); push at the end (no-push effect log); omit the final tag-map check on fetch failure (tag-drift failure cases).
   Commit: `fix(repo)!: expose only the simplified fork-sync entry points (#40)`.
   Footer: `BREAKING CHANGE: Use /fork-sync and scripts/fork-sync/sync.sh instead of /upstream-sync and scripts/upstream-sync.sh. Current synchronization and source guidance lives in docs/fork-sync; no compatibility aliases are provided.`

7. **Refresh packaged maintainer documentation without a package-breaking signal.**
   Verify the two README surfaces against the new live guides: core release provenance and `/fork-sync`, and worktrees first-publication/approval guidance.
   Remove generator, application-bundle and historical-table prescriptions; do not alter runtime installation, commands, dependencies or existing CHANGELOG sections.
   This is documentation-only, so verify links and current executable examples rather than add prose-exact Vitest assertions.
   Run Markdown checks and the package-contract/root script suite, then confirm only the intended README paths are staged.
   Commit: `docs: refresh fork package release and synchronization guidance (#40)`.

8. **Complete the independent quality gate and implementation handoff.**
   Re-run the complete deterministic gates, check retained scenario dispositions against tests actually present, inspect script/test/helper files crossing the review trigger and verify no dead callers or stale current policy remain.
   Load `pre-completion` and dispatch the fresh-context reviewer with the issue, this plan, actual implementation range and real source/CI evidence locations.
   Require verification of source acquisition, own-package tails, section-byte reuse and all-selected failure-before-write/effect behavior; do not supply a universal coverage claim as a premise.
   Record implementation stage notes and any measured deviation in the issue retro; do not dispatch a release or start `/ship` automatically.
   No new test or code mutation is assigned to this workflow-only step.
   Commit: `docs(retro): add implementation stage notes for issue #40`.

## Risks and Mitigations

- **False upstream fixtures:** the old single-fork helpers branch from fork HEAD and can make the first parent appear upstream.
  New source tests build genuinely separated histories; the tidy assessment's structural finding is a design correction, not a fixture compatibility requirement.
- **Remote availability or rewritten history:** temporary upstream acquisition can fail or show that an incorporated tip is no longer contained.
  Fail before tracked release writes, report the evidence error and require an operator decision; do not substitute cached ledgers or newest advertised tags.
- **Ambiguous topology:** commit messages cannot establish upstream ownership.
  Use verified branch ancestry and eligible first-parent topology, rejecting unsupported ambiguity rather than giving a stale source claim.
- **Lost package-tail evidence:** endpoint diffs miss incorporated changes later reverted; ordinary non-merge logs miss merge-only paths.
  Pin both classes and lossless package filtering, alongside unrelated-package controls.
- **Historical format pressure:** old tagged blocks and first-tag gaps may tempt a compatibility parser/backfill.
  Preserve their bytes, keep scanner exceptions explicit and restrict the new publication validation contract to new prepared releases.
- **Large deletion hides callers:** executable prompt imports and exact registry fixtures are outside a simple production-source grep.
  Migrate `/ship`, fixture copy lists and `test/worktrees/package-contract.test.mjs` in the same step that removes their old surfaces.
- **Text normalization loses approved output:** current insertion appends separator bytes.
  Compose once and assert the complete tagged section equals the prepared section, while the complete old section suffix remains byte-identical.
- **Refactoring instead of simplification:** new helpers could recreate the old framework under cleaner names.
  Review scenario deletion, the minimal source interface and the roughly-400-line trigger; rejected tidyings are not implementation tasks.
- **Breaking behavior misclassified as cleanup:** ordinary classification and removed commands can change operator-visible results on upgrade without edits.
  Both cutovers use scoped `!` headers and concrete migration footers; extension runtime APIs remain unchanged.

## Open Questions

No material operator decision remains open: temporary-repository preflight is approved, and preserving the explicit version-range lower bound follows the issue's stated range-safety requirement.
Implementation may refine private function names or cohesive test grouping when actual files warrant it, without changing interfaces or resurrecting removed responsibilities.
Return a genuinely new source/safety trade-off to the operator before affected edits.
No concrete follow-up issue was identified, so none is filed speculatively.
