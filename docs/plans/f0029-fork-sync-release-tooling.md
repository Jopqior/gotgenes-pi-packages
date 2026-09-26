---
issue: 29
issue_title: "Remove ambiguous core naming and organize fork release tooling by responsibility"
---

# Organize fork synchronization release tooling by responsibility

## Release Recommendation

**Release:** ship independently

This is repository tooling, not a package roadmap or release-batch step.
All changes stay outside package release scopes; landing them does not itself require npm publication.
Publication still requires separately approved packages, npm scope, and destination.

## Problem Statement

The release mechanism calls `pi-subagents` “core” throughout filenames, schema fields, command flags, diagnostics, tests, and documentation.
Its current single-package wiring obscures reusable fork-release algorithms and couples generated release documentation to the synchronization handbook that [#27] must delete.
Moving the same misleading names into a directory would not solve either responsibility problem.

## Goals

- Put shared fork synchronization release algorithms in `scripts/release/fork-sync/`, with package identity configuration and committed evidence under `scripts/release/pi-subagents/`.
- Remove ambiguous `core` terminology from this mechanism's active interfaces, implementation, configuration, and operating documentation.
- Preserve release decisions, strict provenance validation, registration restrictions, and publication safeguards.
- Migrate committed evidence without changing historical correspondence or rewriting published artifacts.
- Move release-owned guidance and the generated correspondence view into `docs/release/`, updating generators, consumers, and tests together.
- Explicitly classify the CLI, state-format, evidence-route, and backfill-review migration as **breaking repository-tooling behavior**, using `feat!:` and a `BREAKING CHANGE:` footer for the cutover.
  No npm package API or release-level algorithm changes.

## Non-Goals

- Support or register another fork package, introduce a plugin registry, add package-selection arguments, or duplicate algorithms per package.
- Change release scope exclusions, version algebra, reviewed contribution semantics, Git topology requirements, transport behavior, or authorization policy.
- Run synchronization, push, publish, backfill remote Release notes, retag anything, or alter historical CHANGELOG sections.
- Rename unrelated `core` usages, including Git's `core.quotePath`, selector compatibility terminology, or extension runtime concepts.
- Rewrite historical plans, retros, source snapshots, or operator review quotations to make a global word search empty.
- Delete the remaining synchronization handbook, migrate its sync log, implement SSH/HTTPS changes, or activate the unified workflow: [#27] owns these.
- Reopen [#28]'s reviewed rules or treat its historical deliberation record as active workflow authority.

## Background

The issue author matches the authenticated operator, and its `scope:repo` label matches the actual changes.
The operator approved `organization=fork_sync` and `docs_coordination=migrate_here`: shared algorithms plus package configuration/evidence, and release-material migration here before handbook deletion in [#27].
No package source or package documentation needs editing, so no package skill or package-roadmap release batch applies.

The open related issues are [#27] and [#28]; no open PR was returned by the fork PR sweep.
The latest triage, `docs/triage/2026-09-18-backlog.md`, describes inherited upstream work, not this fork issue.
No matching fork issue-29 plan or retro existed; the inherited package permission-event-channel records are unrelated.

The first `core-sync` introduction found with `git log -S` belongs to [#16].
Its plan and retro explain the preserved constraint: a broad integration commit message must not dictate an independently versioned fork's release.
Issue [#24] subsequently added publication correspondence and backfill protections.
Neither rationale depends on the word “core” or on subagent runtime behavior.

### Verified responsibility trace

| Surface                     | Current implementation and callers                                                                                                                                        | Classification                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Evidence recording          | `upstream-sync.sh` invokes `record-core-sync.mjs`; `recordSync` selects a contained stable upstream release, checks ancestry and tails, records the reviewed contribution | Shared algorithm; upstream remote setup and the currently selected package are composition-boundary policy |
| Evidence validation         | `core-sync-evidence.mjs` validates manifests, ancestor chains, raw path diffs, and published tails for decision, recorder, and correspondence consumers                   | Shared algorithm with package path input; no extension runtime dependency                                  |
| Release-level calculation   | `core-sync.mjs:decideCoreRelease` combines upstream SemVer distance, filtered git-cliff commits, and merge review levels; `lib.sh:next_tag` and preparation call it       | Shared algorithm; `pi-subagents` dispatch is current deployment wiring                                     |
| Value and state handling    | `core-sync-values.mjs` is a leaf; `core-sync-state.mjs` combines strict schema validation with package constants                                                          | Shared algebra/schema plus misplaced identity configuration                                                |
| Publication artifacts       | `release-artifacts.mjs`, `release-correspondence.mjs`, and preparation validate the complete selected set, persist evidence, and decorate exact sections                  | General release responsibilities, with one supported fork evidence route                                   |
| Correspondence view         | `correspondence-table.mjs` resolves published records or one verified pending record and replaces a marked region                                                         | Shared rendering algorithm plus single-package target and document location                                |
| Historical note maintenance | `backfill-release-notes.mjs` snapshots, revalidates, applies notes only, and reads back                                                                                   | General maintenance algorithm; hardcoded fork identity and evidence route are registration constraints     |
| Publication callers         | `release.yml` runs prepare, then publish at its returned SHA, then GitHub Release creation; both publishing scripts preflight before effects                              | Repository publication safeguards, not package-specific algorithms                                         |

The only package-specific material identified is identity, paths, the selected evidence route, and the existing evidence itself.
Keep the one-supported-fork restriction explicit at the boundary; moving algorithms does not authorize general registration or publication.

Repository constraints still apply: no upstream tag imports, synchronization through its script, explicit fork GitHub targeting, explicit push destination, immutable published history, and independent publication approval.

## Design Overview

### Layout and dependency direction

```text
scripts/release/
  fork-sync.mjs                    # Existing decision CLI parsing/composition
  record-fork-sync.mjs             # Existing recorder CLI parsing/composition
  fork-sync/
    decision.mjs                  # Offline release decision
    record.mjs                    # Online evidence recording
    evidence.mjs                  # Local Git and provenance checks
    state.mjs                     # Strict state reader/validator
    values.mjs                    # SemVer, release levels, ForkSyncError
    cliff.mjs                     # git-cliff context adapter
  pi-subagents/
    config.mjs                    # Sole supported target and artifact locations
    sync-state.json               # Migrated committed evidence
  release-packages.json            # Existing explicit publication registry
  release-correspondence.mjs       # Existing provenance/artifact boundary
  release-artifacts.mjs            # Existing all-selected artifact preflight
  correspondence-table.mjs         # Existing generated-view entry
  backfill-release-notes.mjs       # Existing separately approved maintenance
```

Keep the root shell entry points and their cwd behavior.
The root Node CLIs compose the selected package configuration with shared algorithms; shared algorithm modules must not import `pi-subagents/config.mjs` or the higher-level artifact modules.
Moving CLI parsing out of the decision/recorder files creates a real IO/configuration boundary, not a collection of arbitrary procedure fragments.

The configuration is a small immutable value containing the directory identity and repository-relative state/correspondence paths.
Keep npm/upstream identities authoritative in the existing registry; do not duplicate them in another policy table.
The current supported fork uses the same package directory upstream and downstream; supporting differing layouts is not added here.
Derive tag prefixes and manifest paths from the directory rather than pass both a directory and its derived prefix through every layer.

Shared calls receive only what they read: a `packageDirectory` string for scope/tag operations, explicit `statePath` for reading/writing evidence, and the existing decision inputs.
Git process helpers and SemVer algebra do not acquire a package parameter.
Do not thread an entire release registry or configuration object through low-level helpers.
Drop the redundant `currentVersion` input to the moved cliff adapter when it can derive that value from its checked current tag and directory.

```typescript
// Interaction sketch, not a new public npm API.
const statePath = path.join(repo, target.statePath);
const decision = decideForkRelease({ repo, currentTag, cliffArgs, statePath,
  packageDirectory: target.directory });
const provenance = resolvePendingCorrespondence({ repo, tag, registry, decision });
```

```typescript
// Within the shared decision: explicit inputs, returned values, no output bag.
const state = readForkSyncState(statePath, packageDirectory);
verifyPublishedCorrespondence(repo, release, peeled, packageDirectory);
const forkLevel = forkLevelFromWindow({ repo, cliffArgs, range, currentTag,
  upstreamOwned, packageDirectory });
```

Keep the import graph acyclic: `values` is a leaf; `state` imports values; evidence imports values; cliff imports values and the existing OID predicate from state; decision and recorder compose those modules.
Neither state nor evidence imports decision, correspondence, or a package configuration.
Root artifact modules may import shared checks and the target configuration, never the reverse.
Review moved bodies against `code-design`, not merely their filenames.

### Naming and strict migration

| Existing active name                                                    | Replacement                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core-sync-*.mjs`                                                       | Responsibility filenames inside `fork-sync/`                            |
| `core-sync.mjs`, `record-core-sync.mjs`                                 | Root `fork-sync.mjs`, `record-fork-sync.mjs` CLI entry points           |
| `core-sync-state.json`                                                  | `pi-subagents/sync-state.json`                                          |
| `CoreSyncError`, `CoreSyncState`, `CoreSyncRecord`, `CoreReleaseRecord` | `ForkSyncError`, `ForkSyncState`, `ForkSyncRecord`, `ForkReleaseRecord` |
| `ForkCoreContribution`, `forkCore`                                      | `ForkContribution`, `forkContribution`                                  |
| `decideCoreRelease`, `readCoreSyncState`, `validateCoreSyncState`       | `decideForkRelease`, `readForkSyncState`, `validateForkSyncState`       |
| `isCoreScopePath`, `changedCoreFiles`, `coreCommitsBetween`             | `isPackageScopePath`, `changedPackageFiles`, `packageCommitsBetween`    |
| `verifyPublishedCoreCorrespondence`, `verifyPublishedCoreTail`          | `verifyPublishedCorrespondence`, `verifyPublishedTail`                  |
| `CORE_PACKAGE`, `CORE_TAG_PREFIX`                                       | Configured directory and locally derived tag prefix                     |
| `core_sync_cli`, `core_decision`, `core_next`                           | `fork_sync_cli`, `fork_decision`, `fork_next`                           |
| `--record-core-sync`                                                    | `--record-fork-sync`                                                    |
| Registry/review evidence route `core-sync`                              | `fork-sync`                                                             |

Other local variables, test helper names, comments, temporary-directory prefixes, and operator diagnostics follow the same responsibility vocabulary.
Do not rename raw historical rationale text, authentic saved Release bodies, or the Git configuration key `core.quotePath`.
Legacy spellings may appear only in explicit migration/rejection tests, immutable historical fixtures, and clearly historical records.
No production compatibility aliases remain after cutover.

The evidence format becomes schema version 2 because `forkCore` is renamed.
The existing registry schema also becomes version 2 for the changed accepted evidence-route vocabulary, and the independently versioned backfill review becomes version 2 so an old preview cannot silently carry approval across the migration.
Strict readers reject version 1 or mixed old/new fields with a migration or re-preview diagnostic; do not strip unknown fields, silently normalize, or downgrade validation.

```typescript
type ForkContribution = {
  level: "none" | "patch" | "minor" | "major";
  rationale: string;
  paths: string[];
};
type ForkSyncRecord = {
  merge: string;
  upstream: { version: string; commit: string };
  forkContribution: ForkContribution;
};
type ForkSyncState = {
  schemaVersion: 2;
  releases: { forkTag: string; upstream: { version: string; commit: string };
    upstreamTip: string }[];
  syncs: ForkSyncRecord[];
};
```

The committed migration changes only the schema discriminator, field spelling, and file location.
Preserve every release/sync record, array order, OID, version, level, path, and rationale byte content.
Capture the pre-cutover JSON from Git as a historical test fixture, then compare the complete transformed value, not selected old releases only.
Reconcile any evidence appended after planning rather than overwrite it with this session's inventory.
No permanent migration executable is needed for this single committed document; retain the old representation only as explicitly historical test input.

`readReview` keeps structural validation and exact identity checks against the sole supported configured/registered fork; removing literal constants must not accept arbitrary new targets.
Old review artifacts require a fresh preview and fresh approval, with no remote mutation in this issue.
Normal workflow retries at an old release commit still run that commit's old scripts; do not retrofit old tags or claim the new CLI can transparently operate on every historical checkout.

### Documentation migration and issue sequencing

Create `docs/release/fork-sync.md` for the current mechanism, CLI migration, blocking semantics, publication correspondence lifecycle, and separately approved backfill procedure.
Create `docs/release/pi-subagents-correspondence.md` for the generated marked table and its provenance/non-equivalence explanation.
Move the existing marked region rather than maintain two generated copies.
The table remains derived from verified evidence; generation does not authorize changing that evidence.

Switch `correspondence-table.mjs`, `release-artifacts.mjs`, preparation's copy/staging paths, and their fixtures to the new document together.
Use a neutral temporary artifact name such as `correspondence.md` rather than `upstream-sync.md`.
Keep the generator command interface unchanged.
Replace the handbook's release-mechanism, correspondence, and historical-backfill sections with concise links; keep its unrelated sync procedure/log until [#27].
Update the README and releasing skill without duplicating the detailed mechanism again.

This explicitly moves the release-material migration work identified in [#28]'s handoff into this issue, with operator approval.
Issue [#27] depends on these final names and destinations before its deletion/activation acceptance check; this issue does not depend on that workflow being implemented first.
Issue [#28]'s deliberation is complete but its final acceptance remains pending the actual [#27] workflow.
Do not modify its historical quotations to look current.

### Design-review checklist

| Check                         | Observed evidence and decision                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependency width / projection | Existing decision and cliff input objects expose explicit values; directory-derived prefix/version should not become redundant new inputs; package configuration stays at composition boundaries |
| Law of Demeter                | Shared algorithms consume scalar paths/tags and returned state; do not reach through a registry to find runtime collaborators                                                                    |
| Output arguments              | Recorder appends to the state it reads and owns; artifact preparation clones projected state; preserve that distinction rather than merge their write lifecycles                                 |
| Scattered resets              | No new mutable lifecycle or reset protocol is introduced                                                                                                                                         |
| Parameter relay               | Only path/tag-sensitive checks gain a directory input; process helpers and pure value functions do not relay it                                                                                  |
| Repeated discriminators       | Existing one-fork dispatch in shell, registry, renderer, and backfill is configuration, not four algorithms; centralize identity values while preserving each boundary's validation burden       |
| Test mock depth               | Relevant integration tests use disposable Git repositories and process boundaries; preserve those rather than replace them with deep mocks                                                       |
| Missing abstractions          | A package configuration value and shared algorithms suffice; no new service interface, factory graph, or general multi-package framework is justified                                            |

## Module-Level Changes

- Move `core-sync-values.mjs`, `core-sync-state.mjs`, `core-sync-evidence.mjs`, and `core-sync-cliff.mjs` to the shared responsibility paths above, updating their exports, JSDoc imports, inputs, and diagnostics.
- Split `core-sync.mjs` and `record-core-sync.mjs` into shared decision/record implementations plus the renamed root CLI composition boundaries; remove old entry points at cutover.
- Add `scripts/release/pi-subagents/config.mjs`; migrate `core-sync-state.json` to its new package-owned path.
- Update `scripts/release/lib.sh` and `prepare-release.sh`: renamed CLI resolver/locals, unchanged package routing and tag-or-current normalization, new state/document persistence destinations.
- Update `scripts/upstream-sync.sh`: parser/help/diagnostics and recorder path only; preserve fetch, preconditions, no-tag safeguards, and current remote behavior for [#27] to address.
- Update `release-packages.json` and `release-correspondence.mjs`: versioned route rename, centralized identity inputs, preserved exact supported-target restriction, shared validation imports.
- Update `release-artifacts.mjs`: state loading/validation, projected writes, correspondence location, and imports; preserve all-selected preflight and immutable tagged-section behavior.
- Update `correspondence-table.mjs`: configured target/state/view paths and shared imports; preserve exact region replacement and row generation.
- Update `backfill-release-notes.mjs`: configured state/identity use, renamed route and error, strict review version 2, old-preview refusal; no new side effects.
- Rename `test/release/core-sync*.test.mjs` to `fork-sync*.test.mjs`, and `helpers/core-sync-scenario.mjs` to `helpers/fork-sync-scenario.mjs`; migrate helper/export names and fixtures mechanically without redesigning whole test files.
- Rename `test/upstream-sync/record-core-sync.test.mjs` to `record-fork-sync.test.mjs`; update `helpers/upstream-network.mjs` schema/path/command fixtures and copy lists.
- Update `test/release/helpers/git-repository.mjs:copyReleaseScripts`, adding `test/release/git-repository.test.mjs` for nested-copy behavior.
- Update `test/release/helpers/release-artifacts.mjs`, `release-correspondence.test.mjs`, `release-correspondence-history.test.mjs`, `correspondence-table.test.mjs`, `release-backfill.test.mjs`, and `release-publication.test.mjs` for new imports/contracts/paths.
- Add focused migration tests and a clearly historical pre-cutover evidence fixture under `test/release/fixtures/`; retain `pi-subagents-v1.0.1-release.json` verbatim because it is authentic published evidence.
- Add the release-owned documents above; update `docs/upstream-sync.md`, `README.md`, and `.pi/skills/releasing/SKILL.md` to remove active mechanism terminology and duplicate release content.
  Load `writing-for-agents` before editing the skill during implementation.
- Predicted unchanged: `next-version.sh`, `verify-cliff-parity.sh`, `publish-released.sh`, `create-github-releases.sh`, and `.github/workflows/release.yml` use stable root entry contracts rather than moved filenames; run their callers/tests to verify this prediction.
- Predicted unchanged: `test/release/bumped-version.test.mjs`, `release-correspondence-views.test.mjs`, and `test/upstream-sync/merge.test.mjs` exercise generic behavior or unchanged handbook conflict diagnostics; recheck their copied dependencies and run them.
- Predicted unchanged: package skills, package architecture docs, and `AGENTS.md` refer to synchronization procedure, not renamed release APIs; [#27] owns their eventual handbook-link replacement.
  Package source, manifests, CHANGELOGs, selector compatibility script, and lifecycle test references to other `core` concepts are outside this rename.

Before removing exports, repeat the full caller search across scripts, all root tests, `.pi/skills/`, README, workflow configuration, and documentation; include relative imports, JSDoc imports, shell variable names, and fixture script-copy arrays.
Historical plans/reviews are search results to classify, not active consumers to rewrite.
No package module move or roadmap completion mark is involved.

## Test Impact Analysis

The shared layer enables direct tests with an explicit package directory and state path, without installing package configuration inside the algorithm.
Use a synthetic alternate directory only as a unit-level parameterization control; it is not another registered or supported fork.
No existing real-Git decision, recorder, publication, or history tests become redundant: they pin different IO/ancestry/effect boundaries.
Keep their assertion strength and failure classes, changing only interface-dependent spellings and fixture construction.

Add focused tests for nested script copies, strict migration, absence of active legacy aliases, explicit package scope, and successful record-to-decision-to-preparation round trips using the new schema.
Existing `toEqual` registry/state expectations and manually built merge records must migrate with the corresponding producer/reader change.
A source-only import sweep cannot find all fixture literals or process-invoked paths.

### Measured planning baseline

Baseline checkout: `3b4b961c75ffa26b8553ff713226b10598563ccf`.
These are executed observations, not predicted gains or a new bug reproduction.

| Command/surface                                                 | Measured result                                                                              | Required post-change result                                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm exec vitest run test/release test/upstream-sync`          | 17 files, 229 tests passed                                                                   | Existing behavioral cases remain green plus new migration/parameterization cases               |
| `./scripts/release/next-version.sh pi-subagents`                | Exit 0, empty stdout; stderr says nothing to release at `pi-subagents-v4.0.3`                | Same decision at unchanged package history                                                     |
| `./scripts/release/next-version.sh pi-subagents-model-selector` | Exit 0, empty stdout; stderr says nothing to release at `pi-subagents-model-selector-v2.0.0` | Same decision at unchanged package history                                                     |
| `node scripts/release/correspondence-table.mjs --check`         | Exit 0, empty stdout                                                                         | Same contract against the new document                                                         |
| State inventory                                                 | Schema version 1, 9 release records, 2 sync records                                          | Schema version 2, same records after field translation; incorporate later legitimate additions |
| Existing decision, recorder, sync, and backfill `--help`        | All exited 0; confirmed actual flags and current paths                                       | Renamed decision/record entry points and sync flag; other flag meanings unchanged              |

Run only help/read-only checks in the real checkout during verification.
Exercise recorder, preparation, and publication effects in disposable local repositories with fake npm/GitHub effects, as the current suite does.
Do not run a real sync or backfill preview merely to verify documentation examples.

## Invariants at risk

These are the implemented protections from [#16] and [#24], not an active package phase.
The listed test files were opened during planning; their real process boundaries were checked rather than inferred from filenames.

| Constituency / invariant                                                                                                       | Existing pin to retain                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork maintainer: an integration message cannot create a fake major                                                             | `core-sync-history.test.mjs`, “derives the historical counterfactual patch instead of the accidental major”; keep the isolated real-history result `pi-subagents-v1.0.3`                           |
| Fork maintainer: one upstream distance, maximum contribution, no accumulation                                                  | `core-sync.test.mjs`, window derivation cases including deferred syncs and reviewed breaking resolutions                                                                                           |
| Release consumers: forged manifests, discontinuous ancestry, unrecorded merges and unreleased tails fail closed                | `core-sync.test.mjs`, evidence failures, sync chain continuity, and unreleased upstream tails groups                                                                                               |
| Non-ASCII path owners: raw path and merge-only changes remain visible                                                          | `core-sync.test.mjs`, lossless path enumeration and baseline merge-only tail controls                                                                                                              |
| Offline prediction users: no network-capable Git operation                                                                     | `core-sync.test.mjs`, offline prediction wrapper case                                                                                                                                              |
| Repository maintainer: recording never imports tags, selects contained releases, requires review inputs, preserves idempotence | `record-core-sync.test.mjs`, tag-ref equality, contained-release, review-input and repeated-record cases                                                                                           |
| Sibling maintainers: blocked selected fork changes nothing; sibling-only release leaves state/view untouched                   | `core-sync-preparation.test.mjs` and `release-publication.test.mjs`, mixed-selection and sibling cases                                                                                             |
| npm/GitHub users: exact tagged notes, complete preflight, dirty checkout refusal, explicit targets                             | `release-publication.test.mjs`, mixed prepared artifact and dirty/invalid later package cases                                                                                                      |
| Historical consumers: original records and authentic Release disclosure survive                                                | `release-correspondence-history.test.mjs` and `release-backfill.test.mjs`, historical record and source-history disclosure cases; extend the migration assertion to the whole pre-cutover document |
| Documentation consumers: generator owns only the marked region                                                                 | `correspondence-table.test.mjs`, exact byte replacement/idempotence and committed real-evidence checks                                                                                             |

For tag isolation retain full ref-name/object-ID equality, not merely a count.
For state migration compare complete parsed records and raw rationale strings, and for published fixtures/changelog tails retain byte comparisons.
No latency or token-budget improvement is claimed.

## TDD Order

Each step ends with verification and its own commit; no implementation starts in this planning session.
No third-party mechanism was adopted, so no additional co-author trailer is required.

1. **Prepare nested fixture copies.**
   Red: add a helper test copying a nested file from a disposable source tree into a scratch checkout and assert destination bytes.
   Give `createScratchReleaseRepository` an optional release-script source directory for that test, defaulting to the current real directory; the production tree has no nested release file yet at this checkpoint.
   Green: create each destination parent in `copyReleaseScripts`, preserving the default real-source behavior, root-file copying, and executable bytes.
   This accepted Tidy-First preparation removes the known fixture failure before production files move.
   Killing mutation: remove the per-file parent `mkdirSync`; the nested-copy test must fail while the root-file control remains green.
   Verify the helper test and existing release/record suites.
   Commit: `test(release): support nested script fixture paths (#29)`.

2. **Introduce the shared algorithms alongside current wiring.**
   Add the shared value/state/evidence/cliff/decision/record modules and package configuration without removing the old exports or switching root callers yet.
   Port bodies rather than rewrite their control flow; preserve diagnostics' failure precedence apart from terminology.
   Red: direct explicit-directory tests must distinguish the selected package from the old hardcoded directory; new-schema tests exercise valid state, old schema, mixed fields, and unknown fields.
   Green: return the same decisions and failures from the shared modules with narrow explicit inputs and schema version 2.
   Keep existing large integration files on their old imports for this additive checkpoint; any small bridge belongs only to this transition and must disappear in step 3.
   Killing mutations: hardcode the scope prefix to `packages/pi-subagents/` to kill the alternate-directory control; return the higher upstream version as a tag instead of incrementing the fork version to kill independent-version tests; accept schema version 1 to kill the old-schema rejection; remove unknown-field rejection to kill the mixed-field case.
   Verify focused new tests and all existing release/upstream-sync tests; inspect the import graph for reverse edges before committing.
   Commit: `refactor(release): isolate fork synchronization algorithms (#29)`.

3. **Cut over every active producer and consumer atomically.**
   Red: pin the new CLI help/flag contract, schema/registry/review versions, migrated full evidence equality, obsolete-entry refusal, and new recorder-to-reader/preparation round trip.
   Capture the actual pre-cutover evidence from Git for the historical fixture before renaming it.
   Green: migrate the committed state, registry, all root CLI and shell wiring, artifact/correspondence/backfill consumers, all affected imports/copy lists, and fixture literals in the same commit; remove old production files/exports and transitional bridges.
   Rename test files/helpers mechanically; do not rewrite their test architecture while switching interfaces.
   Update active README, releasing skill, and handbook spellings in this commit so none instructs a removed command; the handbook still owns the generated region until step 4.
   Keep the supported-target restriction and independent original-package behavior unchanged.
   Bump backfill review schema independently and require re-preview/reapproval rather than translating an old approval artifact.
   Killing mutations by class: restore the old sync flag in the parser to kill the new command round trip; serialize `forkCore` instead of `forkContribution` to kill the recorder/reader round trip; drop one migrated record or alter its rationale to kill full evidence equality; accept review version 1 to kill obsolete-preview refusal; bypass supported-fork validation to kill an unsupported-target rejection control.
   Verify `pnpm exec vitest run test/release test/upstream-sync`, both real read-only predictors, and table `--check`; confirm published tag refs and historical artifact fixtures are unchanged.
   Commit: `feat(release)!: replace ambiguous core release interfaces (#29)`.
   Footer: `BREAKING CHANGE: Release tooling now uses --record-fork-sync and the fork-sync entry points. Evidence is stored at scripts/release/pi-subagents/sync-state.json with schema version 2 and forkContribution; the registry evidence route is fork-sync. Legacy paths and formats are rejected. Regenerate and reapprove historical Release-note previews before applying them.`

4. **Move release-owned documentation and its generated artifact together.**
   Red: run table checking and selected-fork preparation in a fixture with the new correspondence document and no `docs/upstream-sync.md`; assert the new path is committed and no old handbook is created.
   Retain original-only state/view isolation and malformed-region rejection cases at the new path.
   Green: create the release guide and correspondence view, move the marked region, switch generator/artifact/temp/staging paths, update fixtures and release links, and replace handbook release sections with pointers.
   Keep the remaining handbook sync procedure/log and conflict diagnostics for [#27].
   Killing mutations: restore the old document read path to kill the handbook-absent positive case; omit the new view from `git add` to kill the committed-artifact assertion; change the `provenance.kind === "fork"` projection guard in `prepareArtifacts` to accept originals too, killing the original-only success/isolation case.
   Verify release/upstream-sync suites, generator `--check`, help examples, read-only predictions, Markdown lint, and repository link checks after clearing the rumdl cache for moved documents.
   Commit: `docs(release): separate release guidance from synchronization workflow (#29)`.

5. **Verify the final boundary and hand off to issue 27.**
   Re-run `pnpm run check`, `pnpm run lint`, `pnpm run test`, and the repository's pre-completion review gates.
   Search active script/CLI/config/docs surfaces for the old filename/symbol/field vocabulary and classify every remaining hit as historical, a negative migration fixture, or unrelated.
   Verify no shared algorithm imports package configuration, no obsolete aliases remain, no second fork was registered, and all new files are accounted for in fixture copies.
   Compare the committed evidence translation and published fixture/tag invariants again after all prior steps.
   No new behavior or tests are required for this verification step; commit only necessary final handoff/documentation corrections as `docs: record fork sync tooling migration handoff (#29)`.
   Record the final paths and remaining handbook deletion consumers for [#27], and run the normal fresh-context pre-completion review before recommending ship.

The assessor's optional contribution-validator extraction is not planned: it would add a helper for one caller without materially shrinking the mechanical schema migration.
The single-repository and remote-network fixtures retain separate lifecycles.

## Risks and Mitigations

- A move can silently run scratch copies of old scripts: test nested copying, enumerate transitive files, and preserve script-relative implementation resolution.
- A renamed serialized field can disappear at a strict reader: migrate producers/readers/fixtures atomically and exercise the actual round trip.
- Generic code can accidentally broaden publication authority: parameterize algorithms but retain the explicit configured target and registry checks, with rejection controls.
- A global replacement can corrupt history: preserve raw rationale and published fixtures; classify historical records instead of rewriting them.
- New imports can cycle through correspondence/state: enforce the leaf-to-composition graph during the additive step and final review.
- An old review may look approved after a route rename: version the review separately and fail before any live edit; require new preview and approval.
- Handbook deletion can leave release preparation broken: test release operations without that file before [#27] deletes it.
- Parallel progress on [#27] can collide on scripts/docs: re-read its plan/status before implementation and stop for approval if agreed ownership or behavior has changed.
- Broken unrelated baseline checks must not justify transport, lint, or policy changes under this rename; report and seek approval rather than absorb repairs.

## Open Questions

No operator design choice remains open for this plan.
Issue [#27] must consume the settled new paths and complete remaining handbook cleanup and workflow activation; [#28]'s final integration review follows that activation.
If new evidence or parallel changes invalidate this division of work, reopen that specific decision before editing rather than silently expand scope.
No speculative follow-up issue is needed.

[#16]: https://github.com/Jopqior/gotgenes-pi-packages/issues/16
[#24]: https://github.com/Jopqior/gotgenes-pi-packages/issues/24
[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#28]: https://github.com/Jopqior/gotgenes-pi-packages/issues/28
