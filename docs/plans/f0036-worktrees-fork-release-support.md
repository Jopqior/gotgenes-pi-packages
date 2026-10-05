---
issue: 36
issue_title: "Support worktrees fork release evidence and upstream synchronization"
---

# Support independent worktrees fork release evidence

## Release Recommendation

**Release:** ship independently

This is repository-scoped tooling and synchronization guidance, not a package roadmap or release-batch step.
The implementation stays outside package release scopes and does not itself cut or authorize an npm release.
Land this support before [#37] uses the worktrees registration and first-publication path.

## Problem Statement

The repository can release the registered `@jopqior/pi-subagents` fork and the original model-selector companion, but its fork composition boundaries support only `pi-subagents`.
Renaming worktrees and adding a registry row would still leave prediction, recording, preparation, correspondence rendering, and publication without a verified worktrees route.
Worktrees directly incorporates `@gotgenes/pi-subagents-worktrees`, not the core package, and needs an independently verified baseline and version line.
Its first release also has no previous fork tag, which the existing prediction and exact CHANGELOG-section reader require.

## Goals

- Support exactly the existing core and worktrees fork directories through the shared `fork-sync` evidence mechanism, without a plugin framework.
- Give worktrees its own configuration, schema-2 state, correspondence document, release window, and reviewed sync contributions.
- Preserve existing core defaults, state format, version algebra, correspondence text, and original-package release behavior.
- Provide an artifact-only first-release generator with an explicit operator-selected version, verified incorporated upstream source, and consistent candidate artifacts.
- Use **`0.1.0` as the operator-selected initial worktrees fork version**.
  This is a deliberate first-release choice, not a predicted next version or a copy of upstream's version.
- Keep missing or inconsistent selected-fork evidence a nonzero error, and prevent a selected release from advancing or rewriting another package's evidence.
- Preserve the existing pinned-target issue lifecycle, genuine two-parent integration, immutable history, fork-targeted effects, and no-upstream-tag-import rule.
- Document preservation of the eventual fork worktrees identity, published fork-core dependency, configuration, and workspace-provider compatibility during future integration.
- Classify this as an additive, non-breaking tooling change: existing default commands, serialized contracts, tagged-section formats, package runtime APIs, and normal core/original results remain supported.
  No default or documented timing/output guarantee is replaced.

## Non-Goals

- Rename or modify `packages/pi-subagents-worktrees/`, migrate its imports/dependencies, update its installation documentation or package skill, register its migrated manifest, or apply real first-release artifacts: [#37] owns those changes.
- Add worktrees to the real release registry while its manifest still identifies `@gotgenes/pi-subagents-worktrees`.
- Publish, dispatch a release, configure Trusted Publishing, push, create a real worktrees tag or Release, perform synchronization, or record real worktrees release/sync rows in this issue.
- Infer worktrees provenance from core correspondence, a compatible dependency version, a manifest alone, or the newest advertised upstream tag.
- Change SemVer combination rules, package-scope exclusions, merge review classification, transport selection, or the ordinary issue prompts.
- Rewrite historical CHANGELOG entries, tags, npm artifacts, authentic Release bodies, inherited plans/retros, or existing core evidence.
- Extend historical notes-only backfill to worktrees now: it has no existing fork Releases to backfill.
  Preserve the existing core-specific backfill and its approval protocol rather than add speculative functionality.
- Introduce an unrestricted fork registry, arbitrary evidence-path configuration, a bulk recorder with one shared review level, or a new synchronization ledger/reviewer.

## Background

The issue author and authenticated GitHub user are both `Jopqior`; its explicit `scope:repo` label matches the changes.
Issue [#24] is completed and established strict registration, verified correspondence, exact tagged notes, generated views, and separately approved historical backfill.
Issue [#37] is open and depends on this support for migration/registration/publication; neither issue grants publication approval.
The fork's open-issue symbol searches found this issue and [#37], and the open-PR sweep returned no PRs.
The newest triage is `docs/triage/2026-10-02-backlog.md`, an inherited upstream inventory with no fork issue-36 entry.
No matching fork or inherited issue-36 plan/retro exists at the root or package plan/retro locations.
No worktrees architecture roadmap exists, so no release batch or roadmap completion mark applies.
The worktrees README's workspace/recovery Non-Goals do not conflict with repository release support.

### Current responsibility trace

| Surface                                                            | Current behavior                                                                                  | Required extension                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pi-subagents/config.mjs`                                          | Frozen core directory/state/view paths                                                            | Keep its export and add a separate worktrees configuration                                     |
| `fork-sync.mjs`, `record-fork-sync.mjs`                            | Always compose the core target                                                                    | Select an explicitly supported directory, retaining the core default                           |
| `fork-sync/decision.mjs`, `state.mjs`, `evidence.mjs`, `cliff.mjs` | Already receive explicit package directories and paths                                            | Reuse the algorithms, not duplicate them                                                       |
| `fork-sync/record.mjs`                                             | Selects a contained stable release, then validates prior tip, tail, review paths and idempotence  | Extract the returned release-selection result for bootstrap reuse without changing check order |
| `release-correspondence.mjs`                                       | Registry accepts only the core evidence route; exact sections require a previous fork compare tag | Accept the second fixed route and one strict first-release heading                             |
| `release-artifacts.mjs`                                            | Loads one core state globally, projects one fork, rejects a second pending fork                   | Project and validate each selected fork independently                                          |
| `correspondence-table.mjs`                                         | Resolves only the core directory/state/view                                                       | Resolve one selected target, with unchanged core default                                       |
| `lib.sh`, `prepare-release.sh`                                     | Fork decision and state/view persistence branch on the core name                                  | Consume the fixed selector's result and persist selected per-package artifacts                 |
| `upstream-sync.sh`                                                 | Records core evidence and displays core release status                                            | Select one package for recording or status inspection, not for the repository merge            |
| Publication shell scripts                                          | Preflight the complete tagged set, then publish/create Releases                                   | Keep their effects unchanged; the shared preflight resolves each tag's own state               |

AGENTS.md requires plans/retros in the fork namespace, explicit fork GitHub mutations, explicit push destinations, separate publication approval, and no imports of upstream tags.
Editing these mechanisms is not actual integration work; this session did not fetch or merge upstream.

## Design Overview

### Evidence verified during planning

Planning used the actual working checkout at `405b7675aa859f5186388bf03f61e4abc48013fd`, local Git objects, upstream `ls-remote` results, npm metadata, and the repository's real evidence functions.
It did not construct a synthetic diagnosis or execute release/recorder mutations against the real repository.
The future regression fixtures are synthetic local histories for boundary tests, not claims that a real worktrees fork has already released.

Measured source facts:

- `git ls-remote --tags upstream 'pi-subagents-worktrees-v*'` identifies upstream `0.3.3` with peeled commit `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
- That commit's manifest identifies `@gotgenes/pi-subagents-worktrees` and version `0.3.3`.
- The existing integration merge is `877efb38d5ea8723391160e8c3d6d9597c40b1e5`, with second parent `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`, also the locally incorporated `upstream/main` tip.
- The release is an ancestor of that tip, and the tip is an ancestor of planning HEAD.
- `packageCommitsBetween` returns an empty array for that release-to-tip worktrees scope.
  `verifyPublishedCorrespondence` and `verifyPublishedTail` also succeed against real HEAD as an ancestry probe, without creating a tag or release row.
- `git diff upstream/main HEAD -- packages/pi-subagents-worktrees` is empty, and the package-scoped upstream-to-HEAD log has no entries.
- There are no local worktrees release tags; npm metadata reports upstream `0.3.3`, while the intended fork identity query returns 404.
  The 404 is a registry observation, not publication permission or an enduring claim that the name is available.

These facts establish a feasible independent source baseline, not first-publication approval.
Re-resolve the merge, selected contained release, actual manifest identity, and empty upstream tail when [#37] prepares its candidate; do not blindly reuse a planning-time OID after another integration.
Keep any future synchronization issue's exact pinned upstream target in its own ordinary plan.

### Fixed target selection and authorization

Add `scripts/release/fork-sync-targets.mjs`, importing the preserved core configuration and a new worktrees configuration.
Expose a resolver returning a frozen target or `null` for a non-supported directory, plus a requiring resolver for fork-only entry points.
Its small CLI prints the resolved target as JSON or `null`, allowing shell composition to consume the decision instead of repeating a package-name list.
Unknown/path-traversal targets must be rejected by requiring callers before effects.
The resolver's `null` is not an authorization decision: release registration still rejects unregistered packages and unsupported fork routes.

```typescript
// Internal script contracts, not an npm API.
type ForkSyncTarget = Readonly<{
  directory: string;
  statePath: string;
  correspondencePath: string;
}>;
// Fixed supported worktrees target:
// directory: "pi-subagents-worktrees"
// statePath: "scripts/release/pi-subagents-worktrees/sync-state.json"
// correspondencePath: "docs/upstream/pi-subagents-worktrees-release-correspondence.md"
```

Keep npm identities and direct upstream identities authoritative in `release-packages.json`, not duplicated in the path selector.
The worktrees state starts as `{ schemaVersion: 2, releases: [], syncs: [] }`; an empty container is not release evidence.
Its correspondence document starts as an explicitly unreleased scaffold with one managed marker pair and no invented row.
Keep the actual registry unchanged in this issue.
A fixture may register the migrated identity to exercise the route; the real old manifest must continue to fail an attempted fork-name registration.

Add `--package <directory>` to decision, recorder and table CLIs, defaulting to `pi-subagents`.
Retain the existing decision `--state` option for its current explicit-path callers; directory selection still governs tag/scope validation.
Shell callers supply the package explicitly.
Keep `next-version.sh`'s untagged-package refusal; bootstrap is a different command, never a fallback that invents a first version.
An inherited or stray local tag without its own verified fork row still fails closed, rather than becoming a valid baseline or being deleted automatically.

```typescript
const target = requireForkSyncTarget(directory);
const decision = decideForkRelease({ repo, currentTag, cliffArgs,
  statePath: path.join(repo, target.statePath), packageDirectory: target.directory });
const provenance = resolvePendingCorrespondence({ repo, tag, registry, decision });
```

### Returned upstream evidence, not a rewritten recorder

Extract the recorder's merge resolution, genuine two-parent checks, merge-to-HEAD containment, upstream-parent containment in local `upstream/main`, stable remote-tag parsing, contained-release selection, and manifest-version validation into `fork-sync/upstream-release.mjs`.
Return a value instead of mutating a caller's bag.
Do not move the tail or previous-tip checks into this selector: the recorder currently checks release/version, then previous-tip continuity, then unreleased tail.
The preparatory tests must preserve that diagnostic precedence.

```typescript
type IncorporatedUpstreamRelease = {
  merge: string;
  forkParent: string;
  upstreamTip: string;
  upstream: { version: string; commit: string };
};
```

```typescript
const incorporated = selectIncorporatedUpstreamRelease(repo, directory, merge);
requireAncestor(repo, previousTip, incorporated.upstreamTip, continuityDiagnostic);
const unreleased = packageCommitsBetween(repo, incorporated.upstream.commit,
  incorporated.upstreamTip, directory);
```

The selector uses only repo, directory and merge inputs; it receives no registry, publication callbacks, or package runtime objects.
It validates upstream version, not npm identity; artifact composition must separately verify the selected release manifest against the registered direct upstream name.
Keep recorder-owned state mutation, prior-release anchoring, reviewed resolution paths, idempotence, and conflicting-record refusal in `record.mjs`.
First release must not bypass these recorder guards by pretending to have a published anchor.

The import graph stays acyclic: target configurations are leaves; the target resolver imports configurations/values; upstream selection imports evidence/values; recorder and first-release evidence compose shared checks.
Shared evidence/selection/state modules do not import the root artifact renderer, registry or target configuration.
The root bootstrap CLI composes evidence and artifact operations, not the reverse.
Before introducing same-directory edges, inspect these imports again rather than rely on same-zone static-analysis permission.

### Independent preparation and publication

At the artifact boundary, resolve registration and the supported target per selected fork.
Read/project a state only for the fork being processed, cache it by directory within that operation, and keep original-package provenance free of a fork row.
Keep whole-registry manifest identity validation and whole-selected-set preflight before tracked writes or external effects.
Do not suppress a selected package's evidence failure, and do not interpret it as quiet output.

Use package-namespaced temporary outputs such as `state-<directory>.json` and `correspondence-<directory>.md`.
For preparation, append only that package's release record and regenerate only its own document.
Support selecting both forks and the original companion in one ordinary release commit without the current single-pending-fork restriction or output collisions.
The shell persists only files returned for the selected fork targets.
A malformed later selected package must leave all manifests, CHANGELOGs, evidence, views, HEAD and tag mappings unchanged.

For publication, derive the state path from each exact tag's registered directory and retain all existing ancestry, manifest identity/version, tail, exact-section, dirty-checkout and critical-byte checks.
GitHub Release bodies still come from each tag's exact decorated CHANGELOG section.
Do not add a second rendering pass or change publication destinations, existing-Release rerun semantics or approval requirements.
The table renderer accepts an optional directory with the current core default; selected state/tag prefixes must agree.
The table CLI refuses unregistered worktrees before [#37], even though its supported path exists.

### First-release artifact route

Add `prepare-first-fork-release.mjs` as a separate artifact-only CLI.
Its planned inputs are `--repo`, `--package`, `--version`, `--merge`, `--notes` and `--output`; no default first version, publish flag, automatic apply mode or release dispatch.
For worktrees, [#37] supplies the chosen `0.1.0` and a reviewed first-release summary file describing its actual migration.
Use that bounded summary instead of rendering every inherited commit or pretending an upstream tag is a previous fork tag.
Generate the heading, source correspondence, manifest version, state and table automatically.

The CLI requires a clean primary checkout on `main`, the actual migrated registered fork manifest, an empty selected state, no existing selected-package release tags, an explicit stable version and completed incorporated merge.
Verify supported upstream remote identity before the release lookup, snapshot local tag-name/object mappings around it on success or failure, and never fetch, import, restore, retarget or delete tags.
Reuse the contained-release selector; require release-to-tip-to-HEAD ancestry, the selected direct upstream npm identity/version, and an empty package-scope upstream tail.
Do not change the target because a newer remote tag exists or a required object is missing.
Reject existing tags, existing state rows, invalid notes/duplicate managed sections, unsupported identities, inconsistent manifests, incomplete merges and stale/missing source objects rather than infer recovery.

Use `fork-sync/first-release.mjs` for first-release evidence checks and the returned pending correspondence decision.
It is an evidence function, not a generic plugin or a publisher; the root CLI handles filesystem composition.
Reuse `prepareArtifacts` for section decoration and projected state/view validation.
Only after preflight, write a fresh output directory outside the checkout; refuse an existing output directory rather than mix candidates.
Generate candidate files at their eventual repository-relative paths, plus a review manifest containing source HEAD, selected merge, tag/version, resolved upstream evidence and the exact application file list.
No tracked checkout write, Git commit, tag, push, npm call or GitHub mutation is allowed.

The generated candidate set contains the selected package manifest and prepended CHANGELOG, its independent state and correspondence view.
Preserve the old manifest's unrelated fields and all existing CHANGELOG bytes outside the insertion seam, including inherited upstream headings and release-please-era disclosure.
The first state row uses the existing schema-2 release shape, with `forkTag`, verified `upstream`, and `upstreamTip`; no fake historical sync/release is added.
The candidate's state is only a projection until [#37] reviews and applies it with the manifest/CHANGELOG/view.
A root artifact review manifest is a transient handoff, not a new persistent synchronization ledger.

Use a strict first-release heading:

```markdown
## [0.1.0](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/pi-subagents-worktrees-v0.1.0) (<generated UTC date>)
```

Extend `findReleaseSection` to accept this exact fork-owned release-tag form alongside the existing compare form.
Keep exact directory/version/tag matching, fence-aware boundaries, duplicate-heading rejection, CRLF preservation, and rejection of upstream/wrong-repository/version-only headings.
Do not add a synthetic previous tag or modify global `cliff.toml` output for existing packages.
This is an internal format extension for a new first artifact, not a rewrite of older first-release exceptions.

Issue [#37] must review the candidate and its source HEAD, run its packing/compatibility checks, and apply/commit the exact candidate set before approved first publication.
The eventual tag must point at the artifact commit, and publication/Release creation must validate that tagged checkout through the same complete artifact preflight.
First npm publication remains the operator-approved manual bootstrap without Trusted Publishing provenance; Trusted Publisher setup and subsequent dispatch belong to that separate handoff.
Do not dispatch the ordinary prepare job for an untagged first release.
If candidate HEAD or contents change before application/publication, regenerate or stop for review rather than silently reuse a stale candidate.

### Synchronization preservation and design review

The synchronization guide must include worktrees in its fork-intersection review, including automatically merged adaptations.
Preserve the eventual `@jopqior/pi-subagents-worktrees` identity and fork repository metadata, published `@jopqior/pi-subagents` imports/dependency wiring, core-first initialization, shared workspace-provider service contract, `subagents-worktrees.json`, `worktreeAgents`, preparation/disposal, rescue and recovery behavior.
The current filenames and config behavior were checked in worktrees `src/config.ts` and `src/index.ts`; [#37] owns changing their npm imports and documenting missing-module versus uninitialized-service behavior.
Future relevant integration checks should reuse [#37]'s packed loading/provider checks once they exist, not invent a new universal acceptance harness here.

Add package selection for recorder and fetch status only: `--record-fork-sync ... --package <directory>` selects one state and one explicit review level/rationale; `--fetch --package <directory>` selects the status query.
Keep the core default; repository `--merge --expected-upstream` does not accept package selection.
For a synchronization affecting both maintained forks after bootstrap, classify and record each independently; one unchanged package can have level `none` without copying the other's review.
Before worktrees bootstrap, follow the policy's first-release evidence path rather than manufacture an anchor to make its recorder run.
No ordinary prompt, review range, finding-disposition rule or merge topology changes.

| Checklist               | Evidence and decision                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency width / ISP  | The target has only directory/state/view paths; low-level consumers continue receiving the scalars they actually read; the returned upstream evidence contains the facts recorder/bootstrap consume |
| Law of Demeter          | Composition selects a target once and invokes domain operations; no reach-through to a runtime service or nested dependency bag                                                                     |
| Output arguments        | Selection returns evidence; recorder owns its read state and artifacts own separate cloned projections                                                                                              |
| Scattered resets        | No new mutable runtime lifecycle or reset protocol                                                                                                                                                  |
| Parameter relay         | Keep directory/path selection at entry boundaries; do not add registry/target bags to Git or SemVer helpers                                                                                         |
| Repeated discriminators | A fixed selector owns the supported-package decision; shell callers consume its product rather than duplicate core/worktrees comparisons                                                            |
| Test mock depth         | Real disposable Git histories, local bare remotes and explicit fake publication effects; no deep mocks of the evidence layer                                                                        |
| Missing abstraction     | The returned incorporated-release value enables a real second consumer; no procedural split merely to reduce complexity, generic provider interface or factory framework                            |

## Module-Level Changes

- Add `scripts/release/pi-subagents-worktrees/config.mjs`, its empty `sync-state.json`, and `docs/upstream/pi-subagents-worktrees-release-correspondence.md` as an unreleased scaffold.
- Add `scripts/release/fork-sync-targets.mjs` and focused target tests; retain `pi-subagents/config.mjs:forkSyncTarget` so existing imports and core historical backfill remain valid.
- Update `fork-sync.mjs`, `record-fork-sync.mjs` and `lib.sh` for selected-directory composition, preserved default/explicit-state contracts, and shared shell routing.
- Extract release-selection helpers from `fork-sync/record.mjs` into new `fork-sync/upstream-release.mjs`; remove their old private definitions once their sole callers move.
  Keep prior-state, continuity, tail, review-path, idempotence and state-write logic in the recorder.
- Update `scripts/upstream-sync.sh` parser/help/status-query/recorder arguments and completion hints, preserving offline pinned merge, preconditions and no-tag protection.
- Update `release-correspondence.mjs` supported-route validation and first-heading recognition; keep existing provenance rendering and exact source links.
- Update `release-artifacts.mjs` selected-state resolution and per-directory projections; update `prepare-release.sh` decision and persistence paths in the same step.
- Update `correspondence-table.mjs` selected-directory renderer/CLI and package-specific document paths.
- Add `fork-sync/first-release.mjs`, `prepare-first-fork-release.mjs`, and `test/release/first-fork-release.test.mjs` for first-release process/evidence tests.
- Add `test/release/fork-sync-targets.test.mjs` and `upstream-release.test.mjs` for the supported composition boundary and returned source-selection value.
- Extend `test/release/helpers/release-artifacts.mjs` with an optional selected registration and unchanged core default; add a focused fixture contract test.
- Extend the record-query fault-injection pattern in `test/upstream-sync/helpers/upstream-network.mjs`, retaining its current core default and existing network lifecycle.
- Add a bounded `test/release/helpers/multi-fork-scenario.mjs` and `multi-fork-release.test.mjs` for independent histories, combined selection, missing-selected-evidence and unselected-byte controls; keep existing fixture families separate.
- Update `fork-sync-shared.test.mjs`, `fork-sync-cli.test.mjs`, `fork-sync.test.mjs`, `release-correspondence.test.mjs`, `release-correspondence-views.test.mjs`, `correspondence-table.test.mjs`, `fork-sync-preparation.test.mjs`, and `release-publication.test.mjs` where their new target/reader/copy-list contracts change.
- Update `test/upstream-sync/record-fork-sync.test.mjs`, `merge.test.mjs` and `workflow-contract.test.mjs` for selected queries, early option rejection, independent evidence writes, tag drift and worktrees policy/navigation.
- Update `docs/upstream/synchronization-guide.md`, `fork-release-policy.md`, the root README's release navigation, and `.pi/skills/releasing/SKILL.md`.
  Load `writing-for-agents` before editing the skill during implementation.
  Sweep each edited guide/skill for repeated single-fork descriptions, including both first-release and release-dispatch guidance.

Predicted unchanged, with verification obligations:

- The real `release-packages.json`, core `sync-state.json` and core correspondence view: support is not registration, and no real release is selected here; compare bytes after implementation.
- `next-version.sh`, `verify-cliff-parity.sh`, `publish-released.sh`, `create-github-releases.sh`, `cliff.toml`, and `.github/workflows/release.yml`: they consume stable prediction/artifact entry contracts; run their actual callers in fixtures.
- `backfill-release-notes.mjs`, `release-backfill.test.mjs`, and authentic saved Release fixtures: the historical core-only path and approval schema remain unchanged; run their suites against the retained config export.
- `fork-sync/decision.mjs`, `state.mjs`, `evidence.mjs`, `values.mjs`, and `cliff.mjs`: they already accept narrow selected-directory inputs; extend callers/tests rather than rewrite release algebra.
- `fork-sync-migration.test.mjs`, `fork-sync-history.test.mjs`, and `release-correspondence-history.test.mjs`: existing paths/exports/schema and historical claims remain valid; run them to falsify that prediction.
- `helpers/fork-sync-scenario.mjs` and `helpers/git-repository.mjs`: existing single-core decision histories and nested script copying suffice; do not turn them into a universal scenario factory.
- All package source/manifests/README/skills/settings/lockfile and ordinary lifecycle prompts: their runtime and migration changes belong to [#37], not this repository support issue.

Re-sweep scripts, root tests and active skills/docs for target-path assumptions and relative/JSDoc imports before implementation commits.
New transitive imports must be added to preparation/publication fixture copy lists in the same commit that introduces them.
There are no removed public exports, module moves in package architecture docs, Mermaid control-flow changes or roadmap marks to update.

## Test Impact Analysis

The evidence extraction enables focused tests of contained stable-release selection independently of state writing and of the first-release gate without a fabricated published anchor.
Existing recorder, history, preparation, publication, table, corpus and backfill tests remain necessary because they exercise different boundaries; none is removed merely because a lower-level test exists.
Keep the large existing integration files on their current defaults, adding focused groups rather than rewriting their fixtures wholesale.
The optional published-artifact fixture parameterization is accepted because it reuses the same lifecycle for single-package correspondence/table controls.
The fault-injection parameterization is accepted because the current wrapper triggers record drift only for `pi-subagents-v*`; a worktrees test without that change would be vacuous.

### Measured planning baseline

| Command / surface                                                | Measured result                                                           | Required verification                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm exec vitest run test/release test/upstream-sync`           | All 22 files and 401 tests passed                                         | Existing cases plus new route/bootstrap/isolation cases pass            |
| `./scripts/release/next-version.sh pi-subagents`                 | Exit zero, empty stdout, current tag `pi-subagents-v5.0.0`                | Same result at unchanged package history                                |
| `./scripts/release/next-version.sh pi-subagents-model-selector`  | Exit zero, empty stdout, current tag `pi-subagents-model-selector-v3.0.0` | Same result at unchanged package history                                |
| `./scripts/release/next-version.sh pi-subagents-worktrees`       | Nonzero, untagged-package diagnostic                                      | Still refuses until the separately reviewed first tag exists            |
| `node scripts/release/correspondence-table.mjs --check`          | Exit zero, empty stdout                                                   | Default core view still checks without requiring worktrees registration |
| Decision, recorder, table, artifacts, backfill and sync `--help` | Executed successfully; current flags/defaults inspected                   | Old invocations remain valid and new selection/bootstrap help is tested |
| Real worktrees release-to-tip tail                               | Empty array from the production scope enumerator                          | Selected baseline is independently revalidated, not borrowed from core  |

Planning did not mutate/remove a mechanism or claim a quantitative speed/complexity improvement.
There is no output from the not-yet-existing bootstrap command to claim as measured.
Implementation must execute every new documented command in controlled fixtures; real-checkout checks remain help, default core table checking and read-only prediction.
The real selected-worktrees table command must fail before registration; that is an expected authorization gate, not a reason to populate the registry here.

### New boundary matrix

- Targets: core default, explicit core, explicit worktrees, original/non-supported resolver result, requiring rejection, missing/duplicate/malformed `--package`, wrong tag prefix and cross-package state.
- Source selection: annotated/lightweight tags, newer uncontained release, prerelease exclusion, missing objects, manifest mismatch, wrong direct upstream identity, invalid merge topology and uncontained merge.
- Preparation: core only, worktrees only, both forks, original only, both plus original, and a blocked later selected fork.
  Compare entire unselected state/view/manifest/CHANGELOG bytes and complete tag-name/object mappings, not counts alone.
- Publication: first-tag and subsequent worktrees artifacts, exact notes, dirty package rejection, later-package failure before any fake npm/GitHub effect, explicit fork repository and npm registry.
- First artifacts: actual untagged history, required hand-selected version, old-manifest/unregistered refusal, unrelated fork evidence unchanged, preserved inherited changelog suffix, candidate source-head metadata, fresh external output, and zero commit/tag/push/publication effects.
- Reader: exact first tag URL and existing compare URL, wrong repository/package/version, duplicates, CRLF, unclosed fences, tilde and four-backtick fences, and real current/tagged CHANGELOG corpus.
- Recorder: selected query/state only, independent review inputs, repeated recording, conflicting recording, drift during release query and failure handling.

## Invariants at risk

These are existing release and synchronization protections, not new performance promises.
The named tests were opened during planning and drive real evidence/process boundaries rather than mock the layer being changed.

| Constituency / invariant                                                                                                  | Pin to retain or add                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork maintainer: upstream integration messages do not dictate a fake fork major                                           | `fork-sync-history.test.mjs`: historical counterfactual remains `pi-subagents-v1.0.3`; `fork-sync.test.mjs`: distance/max and reviewed contribution cases |
| Evidence consumer: invalid manifests, discontinuous tips, unrecorded merges and unreleased scope fail closed              | Existing `fork-sync.test.mjs` groups; new worktrees/first-release selected-evidence rejection cases                                                       |
| Recorder operator: version validation precedes continuity, which precedes tail validation                                 | New characterization in `fork-sync-shared.test.mjs`, retained through extraction                                                                          |
| Offline prediction user: no network-capable prediction operations                                                         | Existing offline wrapper case in `fork-sync.test.mjs`, extended to the worktrees route                                                                    |
| Sibling maintainer: selection cannot advance another release/evidence window                                              | Existing `fork-sync-preparation.test.mjs` sibling/blocked cases plus new multi-fork byte-equality and combined-selection cases                            |
| npm/GitHub consumer: exact tagged artifacts and complete preflight precede effects                                        | `release-publication.test.mjs`; first-worktrees-tag round trip with fake effects                                                                          |
| Historical consumer: existing evidence, rationale strings, CHANGELOG suffixes and restoration disclosure remain immutable | `fork-sync-migration.test.mjs`, `release-correspondence-history.test.mjs`, `release-backfill.test.mjs`; first-generator full inherited-suffix comparison  |
| Synchronization operator: pinned two-parent merge, no automatic refresh, no imported/retargeted/deleted upstream tags     | `merge.test.mjs`, `record-fork-sync.test.mjs`; worktrees-specific query/fault-injection controls                                                          |
| Documentation reader: generated tables own only their marker region                                                       | Existing `correspondence-table.test.mjs` byte/idempotence tests, applied to selected worktrees documents                                                  |
| Fork operator: registration/integration is not publication approval; no extra sync workflow                               | `workflow-contract.test.mjs` existing ownership/safety cases plus worktrees handoff assertions                                                            |

The unselected state/view baseline is byte identity, not merely equivalent parsed values.
The first-release generator's no-effects baseline is unchanged HEAD, index/worktree, remote refs and full local tag mapping; assert all after normal success and input/evidence failure.
For fault-injected external tag drift, assert detection and leave the altered refs untouched; no-effects does not mean automatic tag rollback.
New tests must exercise missing evidence or an actually different selected directory rather than an equal-valued core/worktrees fixture that would hide cross-routing.

## TDD Order

Each numbered step is a separate red or characterization → green → verify → commit cycle, keeping existing tests green at its checkpoint.
No third-party design mechanism was adopted; no additional co-author trailer is required.

1. **Prepare the two focused fixture seams.**
   Add tests for a selected-registration `createReleaseArtifacts` fixture and default-core identity/tag/state preservation.
   Parameterize only that fixture's manifest identities, directory and tag prefix, retaining existing default callers.
   Add an explicit record-query fault-injection pattern to the network wrapper, with core default unchanged and a worktrees-query control proving it actually fires.
   Do not combine decision-window, tagged-artifact, multi-fork or network factories.
   Killing mutations: hardcode `FORK.directory` inside the selected fixture to kill the worktrees contract; restore the wrapper trigger's literal `pi-subagents-v*` to kill the worktrees injected-drift control.
   Verify the new fixture tests and existing correspondence/table/backfill/record suites.
   Commit: `test(release): prepare selected-fork regression fixtures (#36)`.

2. **Add fixed targets and independent offline routing.**
   Red: target-resolver/CLI tests distinguish worktrees from core, reject requiring unknown targets and mismatched state/tag prefixes, and prove untagged prediction still refuses.
   Add synthetic registered-worktrees correspondence tests and an old-working-manifest mismatch test without changing the real registry.
   Green: add worktrees path configuration/empty state/view scaffold and fixed resolver; extend decision CLI, `lib.sh` and registry route validation.
   Default core configuration export and existing state/registry schemas stay intact.
   Update transitive script-copy lists immediately, including the new resolver and worktrees configuration.
   Killing mutations: return the core target for worktrees to kill target/state-routing cases; restore `entry.directory !== forkSyncTarget.directory` to kill the supported worktrees registration case; bypass the working-manifest identity check to kill old-manifest rejection; route worktrees to generic `bumped_version` to kill a recorded-upstream-distance decision with a broad integration message.
   Verify focused targets/CLI/correspondence tests, existing shared-entry cases, both unchanged real predictors and default table check.
   Commit: `feat(release): support independent worktrees fork prediction (#36)`.

3. **Pin recorder boundaries before extraction.**
   Characterize direct-recorder rejection of a non-two-parent commit and a genuine merge not contained in HEAD, asserting the specific topology/containment diagnostic and unchanged state bytes rather than generic failure.
   Add a valid-release case with both invalid prior-tip continuity and an unreleased tail; the continuity diagnostic must win.
   Use the existing direct recorder test group rather than rewrite the large network suite.
   These tests may start green because they pin current behavior; prove their probes through mutation.
   Killing mutations: delete the parents-length guard for the topology case; delete the merge-to-HEAD guard for the uncontained-merge case; move tail rejection ahead of continuity for the precedence case.
   Verify `fork-sync-shared.test.mjs` and the existing recorder suite.
   Commit: `test(release): pin recorder evidence validation boundaries (#36)`.

4. **Extract the returned incorporated-release selection.**
   Red: focused tests select the highest contained stable release with annotated/lightweight controls, exclude newer uncontained and prerelease candidates, and reject version/object/topology defects.
   Green: move selector bodies into `upstream-release.mjs`, return the incorporated evidence value and wire the existing recorder to it without moving its prior-tip/tail/review/state-write checks.
   Remove old private selection functions after confirming their sole callers moved.
   Killing mutations: choose the highest advertised release without containment to kill the newer-uncontained case; ignore peeled annotated OIDs to kill the annotated control; remove manifest-version verification to kill the contradictory manifest case; accept prereleases to kill the stable-only case.
   Re-read moved code against code-design and check the import graph.
   Verify source-selection, recorder characterization, all existing recorder/decision tests and historical release tests.
   Commit: `refactor(release): share verified incorporated release selection (#36)`.

5. **Select recording and inspection without changing integration.**
   Red: recorder CLI and sync-script tests select worktrees query/state, preserve core evidence bytes, require separate review inputs, and reject invalid/orphan/merge-mode selectors before remote/config writes.
   Test selected-query tag drift on success and failure using the prepared injection seam, not a core-only trigger.
   Green: add `--package` to recorder and `upstream-sync.sh` record/fetch-status modes, default core unchanged; forward the selected target and update help/completion hints.
   Keep merge repository-level/offline and existing transport/precondition/tag safeguards.
   Killing mutations: omit the forwarded `--package` at the new recorder call site to kill worktrees recording; query `pi-subagents-v*` for every status/record request to kill query assertions; remove the tag comparison at recording completion to kill injected drift; allow `--package` with `--merge` to kill early mode rejection.
   Verify `record-fork-sync.test.mjs`, `merge.test.mjs`, CLI/default tests, and real help only.
   Commit: `feat(sync): record worktrees correspondence independently (#36)`.

6. **Prepare and validate independently selected fork artifacts.**
   Red: add a genuine two-fork local history with different upstream/fork versions and test core-only, worktrees-only, combined and original selections.
   Assert per-directory state/view writes, unchanged unselected bytes and no tracked/ref/effect changes on a blocked later selection.
   Add selected table-renderer/CLI cases and exact first-heading recognition alongside existing compare/fence/corpus cases.
   Green: update artifact selected-state resolution, per-directory outputs, table selection, strict first-heading reader, and preparation decision/persistence wiring together.
   Update producer/consumer fixture paths and copy lists in this commit; originals receive no invented provenance.
   Killing mutations: use core state for every tag to kill different-baseline worktrees assertions; keep the single `pending` guard to kill combined selection; persist every supported target instead of selected targets to kill unselected-byte controls; omit the selected state/view from `git add` to kill committed-artifact assertions; remove first-heading recognition to kill first-section reads; accept any version-only heading to kill strict reader rejection.
   Verify the full release/sync suites, including publication's complete-preflight and backfill invariants.
   Commit: `feat(release): prepare consistent independently selected fork artifacts (#36)`.

7. **Generate reviewed first-release candidates without release effects.**
   Red: new first-release evidence/process tests start with a real local untagged fork history, empty worktrees state and migrated registered manifest.
   Cover explicit-version requirement, verified merge/source/tail/identity, candidate metadata and file set, strict first heading, full inherited CHANGELOG suffix and unselected bytes.
   Exercise unregistered/old manifest, existing records/tags, malformed notes, dirty checkout, missing objects, wrong upstream identity and non-fresh/inside-checkout output rejection.
   Green: add the evidence-only first-release decision and root artifact generator; reuse selected artifact projection and correspondence checks, writing only a fresh external candidate directory.
   The version argument must be used exactly; no fallback to manifest/upstream/git-cliff inference.
   In fixtures, apply the candidate, commit/tag it locally, then drive publication preflight and fake npm/GitHub effects and subsequent prediction from that exact tag.
   The real repository remains unregistered/untagged for worktrees.
   Killing mutations by class: default a missing version to `0.1.0` to kill required-input rejection; skip upstream-name verification to kill wrong-source-identity rejection; skip tail verification to kill unreleased-tail rejection; overwrite state/view for the core target to kill unselected-byte checks; write the candidate manifest into the checkout to kill no-effects assertions; replace the inherited suffix with a rerender to kill byte preservation; omit the first state row from the candidate to kill tagged preflight/prediction round trip; return the upstream version as the fork version to kill explicit-version assertions.
   Verify first-release/multi-fork/reader/publication tests and the complete release/sync suites.
   Commit: `feat(release): stage verified first worktrees fork artifacts (#36)`.

8. **Document the guarded handoff and verify the final boundary.**
   Add worktrees synchronization preservation, selected recorder/status commands, independent state/view lifecycle, and the first-generator/application/publication separation to the owning guides.
   Update release navigation and the releasing skill, without adding sync-only branches to ordinary prompts or changing package installation docs.
   Red: extend `workflow-contract.test.mjs` with bounded owner/navigation/worktrees-preservation checks; these test instructions, not actual agent compliance.
   Killing mutation: delete the worktrees preservation instruction from the guide to kill that contract; remove the explicit separate-publication-approval instruction from the first-release policy section to kill its gate assertion.
   Dry-run new help and documented commands in fixtures; confirm real worktrees remains blocked at registration/first-tag gates and the existing predictors/table remain unchanged.
   Verify Markdown lint and root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code`.
   Load the pre-completion and delegation skills and dispatch the normal fresh-context pre-completion reviewer over the final implementation and issue acceptance criteria.
   Record the generator interface, candidate file paths, empty real worktrees state, actual baseline checks and [#37] next action in the ordinary implementation retro.
   Commit: `docs(release): document worktrees fork evidence and first-release handoff (#36)`.

## Risks and Mitigations

- A second name can accidentally authorize an upstream-scope publish: keep support, real-manifest registration and publication approval separate, with old-manifest/unregistered negative controls.
- An upstream core version can look plausible as a worktrees baseline: use different real/synthetic package manifests and independent selected state in correspondence and round-trip tests.
- A first release can fabricate a previous tag or expose all inherited history as fork changes: use the exact first-tag heading and reviewed bounded summary, preserving inherited sections without regenerating them.
- Shared selection can change recorder failure order: characterize topology/containment and continuity-before-tail before extraction, then retain recorder-owned checks.
- A shared artifact filename can overwrite another fork: namespace temporary outputs and verify combined selected commits plus unselected byte identity.
- New imports can break copied process fixtures: add transitive resolver/config files in the same commit, retaining script-relative resolution.
- A worktrees drift test can stay green without executing its fault injection: explicitly target its actual `ls-remote` pattern and assert the changed tag mapping/error.
- A candidate can become stale before first publication: record source HEAD and exact application set, verify the applied/tagged checkout, and regenerate/review on drift.
- Missing historical objects must not justify importing tags or weakening validation: keep nonzero failures and require explicit safe inspection/recovery.
- Future automatically merged identity/dependency changes can regress worktrees without conflicts: include its fork/core/config/provider intersections in the existing targeted sync review and reuse the applicable [#37] compatibility checks.
- Unrelated inherited failures or new baseline changes do not authorize scope expansion: report the actual failed gate and obtain an operator decision before repairs.

## Open Questions

No operator design choice remains open: initial version `0.1.0` and artifact-only generation were explicitly selected during planning.
Issue [#37] must settle its verified fork-core dependency floor, actual migration summary, packed loading/provider checks and approved publication/Trusted Publisher procedure using this route.
The implementation must finalize and test the generator's exact help/application instructions before that handoff; it must not invent release evidence or perform publication here.
No additional concrete deferred work was identified, so no new follow-up issue is filed.

[#24]: https://github.com/Jopqior/gotgenes-pi-packages/issues/24
[#37]: https://github.com/Jopqior/gotgenes-pi-packages/issues/37
