---
issue: 24
issue_title: "Include verified upstream correspondence in every fork package release"
---

# Verified upstream correspondence in fork releases

## Release Recommendation

**Release:** ship independently

This is repository release tooling, not a package roadmap step or release-batch member.
The tooling lands independently; the `pi-subagents` README change needs a later explicitly approved publication to reach npm readers.
Neither this plan nor classification registration authorizes a release dispatch, npm publication, or historical GitHub Release edit.

## Problem Statement

A user reading a fork release cannot tell which direct upstream release it incorporates, even though release preparation already validates and records that evidence.
Both CHANGELOG preparation and GitHub Release creation render git-cliff changes without exposing the correspondence.
The explanatory table in `docs/upstream-sync.md` is maintained separately and has fallen behind the state file.
Original companion packages must not acquire invented upstream versions merely because they depend on a fork.

## Goals

- Identify the direct upstream package, incorporated release version, and immutable source reference in every new fork release's packaged CHANGELOG and GitHub Release notes.
- Reuse verified evidence and the existing version decision; missing or contradictory fork correspondence fails before publication.
- Register packages explicitly by actual directory and npm identity, using `fork` and `original` classifications.
  Reject unregistered packages at mutating release entry points, without restricting generic read-only prediction.
- Treat that new rejection policy and release-output contract as a **breaking release-tooling change**, with `feat!:` and a migration footer.
  Extension runtime APIs and the existing core version algorithm do not change.
- Generate the correspondence table directly from authoritative evidence; humans do not maintain version rows.
- Prepare safe, idempotent, preview-first backfill of existing fork GitHub Releases, with remote application separately approved.
- Preserve historical notes, restored-history disclosures, tags, and already-published npm artifacts.

## Non-Goals

- Change the upstream/fork level calculation, state schema, reviewed sync recording semantics, or git-cliff commit classification established by [#16].
- Change extension runtime code, selector compatibility requirements, or the public service API.
- Use `core` and `selector` as provenance classifications.
  Those words describe package roles; `fork` and `original` describe provenance.
- Authorize inherited `@gotgenes/*` packages for publication, add another fork package, or implement a general evidence-adapter/plugin framework.
- Rewrite historical CHANGELOG sections or npm artifacts, recreate missing GitHub Releases, move tags, restore old Git history, or update upstream repositories.
- Refresh npm's README without publishing a new version.
- Reopen the completed identity work in [#23] or the history restoration in [#13].
- Promise new follow-up work outside this issue; no speculative follow-up issue is required.

## Background

The operator authored the issue and confirmed repository-level scope, explicit registration with unknown-package rejection, tool-written correspondence rows, and preview-before-approval historical backfill.
The plan therefore lives under root `docs/plans/`, despite the package README touch point.
There is no prior fork issue-24 plan or retro, no related open fork issue beyond this issue, and no open fork PR at planning time.
The latest imported triage, `docs/triage/2026-09-18-backlog.md`, concerns the upstream tracker rather than this fork issue.
The `pi-subagents` architecture has no issue-24 roadmap entry or batch.
Its README and architecture scope tables constrain runtime capability, not release provenance; this change does not collide with those boundaries.

Existing owners and readers:

- `core-sync-state.json` records released correspondence and reviewed integrations.
  `record-core-sync.mjs`, through `scripts/upstream-sync.sh`, writes sync evidence; `prepare-release.sh` appends release evidence.
- `decideCoreRelease` in `core-sync.mjs` verifies the current baseline and subsequent sync window, then returns the version decision and upstream evidence.
- `core-sync-evidence.mjs` owns local-Git evidence and the core path-scope predicate.
- `prepare-release.sh` derives all requested versions before repository writes, but currently renders each CHANGELOG after writing its manifest.
  Its missing-CHANGELOG branch regenerates content and discards the supplied section.
- `publish-released.sh` discovers tags at HEAD and invokes pnpm; it has no provenance-artifact preflight.
- `create-github-releases.sh` renders with git-cliff `--latest` rather than reading the tagged CHANGELOG.
- `release.yml` checks out the exact preparation commit with full history in downstream jobs.
- `packages/pi-subagents/package.json` already includes `CHANGELOG.md`; README is also shipped.
- `packages/pi-subagents-model-selector/README.md` already explains independently maintained core peer compatibility.
  Its peer dependency is not an upstream baseline.

Repository constraints remain binding: explicit fork GitHub targeting, no upstream tag imports, synchronization only through the sync script, pnpm tooling, and separate approval of publication destinations.
The inherited changelog's upstream issue links and historical text must not be rewritten as part of this issue.

## Design Overview

### Observed evidence and planning checks

Planning inspected real repository files, local Git objects, npm metadata, and GitHub Releases; no release mutation was performed.
The missing provenance was observed in the live `pi-subagents-v4.0.0` and `pi-subagents-v4.0.1` Release bodies, not inferred from a synthetic fixture.
The triggering path is an explicit release dispatch: preparation validates correspondence but sends only git-cliff output into CHANGELOG, then the final job independently renders another change list.

Measured at planning checkout `deeed1106d0087ebec1c46b4de71418135a86389`:

| Surface                                           | Measured result                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm exec vitest run test/release`               | 9 passing files, 108 passing tests                                        |
| `next-version.sh pi-subagents`                    | Exit 0, empty stdout, nothing pending at `4.0.1`                          |
| `next-version.sh pi-subagents-model-selector`     | Exit 0, empty stdout, nothing pending at `2.0.0`                          |
| Git-cliff                                         | `2.14.1`                                                                  |
| Pack of the real `@jopqior/pi-subagents` checkout | Contains `package/README.md` and `package/CHANGELOG.md`                   |
| Published npm core versions                       | `1.0.0`, `1.0.1`, `1.0.2`, `2.0.0`, `3.0.0`, `4.0.0`, `4.0.1`             |
| GitHub Release inventory                          | Existing core Releases begin at `1.0.1`; `1.0.0` has a tag but no Release |

The older correspondence was investigated separately from today's state.
`git ls-remote` resolved the upstream release without importing tags; production evidence helpers verified its manifest, release-to-tip ancestry, tip-to-each-fork-tag ancestry, and empty in-scope tails.
The first integration's second parent resolves to the recorded old tip, and the first-parent interval from fork `1.0.0` to `1.0.2` contains no further merge.

| Fork tags                                                                                  | Verified upstream version | Upstream release commit                    | Incorporated upstream tip                  |
| ------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------ | ------------------------------------------ |
| `pi-subagents-v1.0.0`, `pi-subagents-v1.0.1`, `pi-subagents-v1.0.2`                        | `21.7.0`                  | `b3b6159399f541fd0623f65818557dd3e707a34f` | `045213317de608c04a7b6052b2b843e3a0f2176f` |
| `pi-subagents-v2.0.0`, `pi-subagents-v3.0.0`, `pi-subagents-v4.0.0`, `pi-subagents-v4.0.1` | `21.7.3`                  | `f918568bbb643a6145898c76c5cc225c63b5b793` | `edb35ee28535aac4e12431e47e440f6933911834` |

These are deterministic read-only checks over real objects, one evaluation per record, without extension interception or a stochastic source.
Future implementation must repeat them before committing historical rows.
They establish incorporated source, not behavioral equivalence or a new npm attestation.
The early tags underwent the documented history restoration; their existing disclosure must survive backfill unchanged.
The old recovery archive is unavailable, as the latest close-thread comment on [#13] and `docs/history-restoration.md` explain.
Do not claim the restored tag is the original npm build identity.

A disposable read-only CHANGELOG scanner tested all current package CHANGELOGs and tagged CHANGELOGs for the two registered packages.
Measured corpus: 10 current files with 581 level-two headings; 11 tagged sections matched the exact fork repository comparison URL and tag.
Exceptions were the manually authored `pi-subagents-v1.0.0` heading and `pi-subagents-model-selector-v0.1.0`, which has no tagged CHANGELOG.
Both remain outside automated historical section replacement.
A separate, explicitly synthetic control verified that triple fences nested inside a four-backtick fence and tilde fences do not expose fake release headings.
The production parser still needs its own tests; this probe establishes the actual input shapes, not an implementation.

### Explicit package classification

Add a strict, versioned registration file at `scripts/release/release-packages.json`.
It contains package identity and evidence routing, never release-by-release upstream version values.
Initially register only the actual published packages:

```typescript
type ReleasePackage =
  | {
      directory: string;
      name: string;
      kind: "original";
    }
  | {
      directory: string;
      name: string;
      kind: "fork";
      upstream: { name: string; repository: string; directory: string };
      evidence: "core-sync";
    };
```

Use `pi-subagents` / `@jopqior/pi-subagents` as `fork`, with direct upstream `@gotgenes/pi-subagents` in `gotgenes/pi-packages`, directory `packages/pi-subagents`.
Use `pi-subagents-model-selector` / `@jopqior/pi-subagents-model-selector` as `original`.
These conceptual types describe `.mjs`/JSON contracts, not exported package APIs.
Strict parsing rejects unknown fields, duplicate directories or npm identities, invalid kinds, path traversal, inconsistent manifests, and unsupported evidence routes.
An original entry cannot carry upstream evidence.
A future fork needs explicitly reviewed registration and a verified evidence implementation before it is publishable; no fallback invents a version or classifies an unknown package as original.

Apply classification to every package selected by preparation and every known package tag selected at HEAD by publication/Release creation.
An unrelated non-package tag may retain the current skip behavior; a recognized workspace package with no registration must fail.
Validate the whole selected set before the first package mutation or network publication.
Do not change `release_packages`, `require_package`, generic prediction, or parity enumeration merely to implement these mutation gates.

### Reuse evidence without invoking version derivation for history

Extract the existing published-baseline checks into `core-sync-evidence.mjs` before adding consumers:

- `verifyPublishedCoreCorrespondence(repo, release, peeled)` owns object presence, release-to-tip and release/tip-to-fork ancestry, and manifest-version verification.
- `verifyPublishedCoreTail(repo, release)` owns the existing baseline-tail check.

Keep calls at their current positions inside `decideCoreRelease`; the second check must not move ahead of window validation.
Keep baseline-tag-to-HEAD ancestry in the decision orchestrator, not the reusable historical validator.
This preserves error precedence as well as acceptance behavior.

`release-correspondence.mjs` resolves one of two contexts, explicitly rather than through a permissive validation bypass:

- Preparation consumes the existing verified decision and requires its `nextTag` to equal the predicted tag.
  A projected release has no tag yet; validate against the existing preparation HEAD and use the decision's upstream fields.
- Published-artifact and backfill readers select a state row by the exact fork tag, peel that tag, and call the shared published checks.
  They never call `decideCoreRelease` against today's HEAD to answer a historical question.

New downstream jobs read the state and package manifest from their exact release commit, not a drifting branch tip.
Backfill uses reviewed current committed evidence to supplement old tags whose trees predate the state file, while verifying against each old tag's objects.
Verify npm identity and fork manifest version at the target, and verify direct upstream manifest identity against registration in addition to the existing version proof.
Keep identity checks in the correspondence adapter so existing version-policy fixtures and semantics do not silently change.

The resolver returns a narrow verified presentation value or an explicit original result:

```typescript
type ReleaseProvenance =
  | { kind: "original" }
  | {
      kind: "fork";
      upstreamPackage: string;
      upstreamVersion: string;
      sourceUrl: string;
    };
```

The renderer reads precisely those fork fields; it does not receive state, filesystem handles, the full decision, or a general dependency bag.
The source URL points to the fixed upstream release commit and package path, not `main` or the newest advertised upstream tag.
The incorporated tip remains validation evidence in the authoritative state, not a competing version declaration.

Consumer interaction sketch:

```typescript
const provenance = resolvePublishedCorrespondence({ repo, tag, registry, state });
const section = readTaggedReleaseSection({ repo, tag, packageDirectory });
assertReleaseProvenance(section, provenance);
return section;
```

Shared evidence interaction sketch:

```typescript
const record = requireRecordedRelease(state, tag);
const peeled = resolveCommit(repo, tag);
verifyPublishedCoreCorrespondence(repo, record, peeled);
verifyPublishedCoreTail(repo, record);
return verifiedPresentation(registration, record.upstream);
```

The exact-tag resolver reads the row's `forkTag`, `upstream`, and `upstreamTip`; its parameter type must not require sync-window review fields.
No caller-owned object is mutated.

### Canonical provenance and exact tagged sections

Use one renderer for new releases and historical additions.
Its compact managed block contains a `### Upstream correspondence` heading, direct upstream package, incorporated version, immutable source link, and an explicit provenance-not-equivalence sentence.
Bound it with unique HTML start/end markers so repeated backfill can recognize its own exact output.
An original package produces no block, no fabricated `N/A` upstream version, and no automatic peer-compatibility claim.

Preparation decorates the already-rendered new version section once.
GitHub creation reads that exact tagged CHANGELOG section, checks the expected block, and uses it as the Release body instead of running git-cliff again.
This eliminates independent note generation and its `--latest` ambiguity, while retaining the existing change list.
Do not use `runGit` for byte-preserving text reads: that helper calls `.trim()`.
Use a raw text Git adapter for CHANGELOG content; only explicitly specified section-separator normalization is allowed for new notes.

The section reader recognizes the exact version heading and the fork repository's comparison URL ending in the exact tag, not the version alone.
Fork and upstream sections already share version numbers in the real file.
Ignore headings inside Markdown fences, including four-backtick and tilde fences; reject missing or ambiguous target sections.
Restrict the parser to this generated release format rather than building a general Markdown parser.
Historical backfill does not parse or reconstruct its existing body from CHANGELOG, so the manual first-release heading and legacy appendix structure do not need a fallback.
If a future generated header no longer matches, fail before publication rather than guessing.

### Preparation, publication, and generated documentation

Extend preparation's preflight to compute all required artifacts in temporary storage before changing tracked files:

1. Resolve all package registrations, predictions, and fork evidence.
2. Render and validate all new sections, including packages without an existing CHANGELOG.
3. Build the projected state and generated correspondence table.
4. Only then write manifests, splice sections, persist state/table, stage, commit, and tag with the existing release sequence.

Temporary files are not release mutations; clean them on success and failure.
Keep the same next-version calculation and existing selected-package semantics.
When a CHANGELOG does not exist, create its normal header plus the supplied decorated section; do not rerender and lose the provenance.
Retain historical sections byte-for-byte rather than regenerating whole changelogs.

Add `correspondence-table.mjs` to render only a marked region under `docs/upstream-sync.md` → `Version correspondence`.
Rows derive from verified released records, with the pending verified decision appended only during preparation.
Sort deterministically by fork SemVer and link to fixed source evidence.
Provide explicit `--write` and `--check` modes; malformed, duplicate, or missing region markers are errors, not append locations.
The surrounding handbook is preserved, and CI/root tests run the check mode against committed evidence.
Existing released rows are verified against their tags; the pending row is not falsely treated as an existing tag.
The persisted state, new CHANGELOG block, and generated table must agree in the release commit.
A sibling-only release leaves the core state and table unchanged.

Before the first pnpm publish, validate the complete tagged set: registration, manifest name/version, exact-tag correspondence, and matching fork CHANGELOG block.
New Release creation performs the same artifact validation before the first `gh release create` call and passes `--repo Jopqior/gotgenes-pi-packages` explicitly.
Use the full-history checkout's exact tags rather than force-refreshing the tag namespace during these jobs.
A normal rerun must not overwrite an existing Release body; conflicting managed provenance is an error, and legacy additions belong to the separate backfill path.
Keep publication pointed explicitly at `https://registry.npmjs.org/`.

The package README gains a relative link to shipped `CHANGELOG.md` and absolute links to the fork's releases/correspondence guide.
Explain that each new release records its own baseline and that historical npm files remain immutable.
No `files` allowlist edit is necessary for `pi-subagents`.

### Historical backfill is a separate, reviewable operation

Add `backfill-release-notes.mjs`, defaulting to read-only preview for explicitly selected existing fork releases.
Inventory the remote releases and local evidence, skip original packages without upstream claims, and report a tag without a Release instead of creating one.
Unknown, contradictory, or unavailable evidence blocks the selected operation; never substitute today's baseline.

The preview captures a strict review artifact containing repository identity, release ID/tag, peeled tag commit, selected evidence, existing body/metadata, and proposed body.
The corresponding reader validates every field; do not persist a contract its reader silently drops.
Build proposed text by preserving the original body verbatim and appending the canonical block with deterministic separators.
An identical existing managed block is a no-op; malformed, duplicate, or conflicting managed blocks fail for review rather than being overwritten.

Explicit apply consumes the reviewed artifact only after operator approval, re-reads all selected releases/tags/evidence, recomputes proposed bodies, and refuses if the snapshot has changed.
Never trust an arbitrary edited `proposedBody` from disk as authorized output.
Preflight the full selection before the first edit, then edit only release notes using `gh release edit <tag> --repo Jopqior/gotgenes-pi-packages --notes-file <file>`.
Do not pass title, tag, target, latest, draft, or prerelease changes.
Read back each edited body; repeated execution is a no-op for completed entries and can resume after partial remote failure.
GitHub edits are not a multi-release transaction: a race after the final read remains possible, so coordinate the operation and retain before/after snapshots.
Do not claim compare-and-swap protection that the CLI does not provide.

The known historical set uses `21.7.0` for fork `1.0.1`/`1.0.2` and `21.7.3` for later existing releases, after revalidation.
Include npm-published `1.0.0` in the authoritative correspondence/table once verified, but do not create its absent GitHub Release.
Preserve `1.0.1`'s `Source-history restoration` section exactly.
Do not change the packaged historical CHANGELOG to pretend the original tarball contained the new text.

### Structural review and Tidy First

| Check                             | Finding and disposition                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency width / ISP            | Presentation consumes a verified small value; exact-tag validation consumes a release record, not the complete decision/window object.                        |
| Law of Demeter / output arguments | Resolvers return evidence values; writers own file/API mutations; no caller bag is modified.                                                                  |
| Scattered resets                  | No new long-lived runtime state; temporary artifacts have one operation-scoped cleanup boundary.                                                              |
| Parameter relay                   | Provenance is resolved at release boundaries, not threaded through version calculation or package runtime layers.                                             |
| Repeated discriminators           | Registry resolution owns `fork`/`original` behavior; shell entry points consume validated artifacts instead of reinterpreting classifications.                |
| Mock depth                        | Keep real Git/local origins, fake only GitHub/npm effect boundaries; use a dedicated artifact fixture rather than redefining existing core decision fixtures. |
| Missing abstraction               | Published evidence validation has a real new exact-tag consumer; the small extraction is warranted, a generic plugin framework is not.                        |

The fresh-context assessor recommended the published-check extraction, accepted as step 1.
Keep its two calls in their existing positions to preserve failure precedence.
Accept a characterization test for conflicting-invalid baseline/window evidence before moving those calls.
Do not globally rewrite `createCoreSyncScenario`: its baseline tag intentionally still has an upstream-version manifest, and `writeManifest` uses `@fixture/<pkg>` names.
Construct consistent fork artifact tags and registry identities in the new publication fixture instead.
The optional broad fixture extraction is not required; share only artifact setup actually consumed by the new tests.

## Module-Level Changes

- `scripts/release/core-sync-evidence.mjs` — extract published correspondence and baseline-tail checks with unchanged diagnostics.
- `scripts/release/core-sync.mjs` — call those checks at the original locations; keep window validation and version arithmetic intact.
- `scripts/release/release-packages.json` — new explicit identity/classification registration; no upstream version rows.
- `scripts/release/release-correspondence.mjs` — new strict registry reader, pending/exact-tag adapters, raw tagged-text reader, canonical block renderer, section matcher, and artifact validation entry points.
  Keep private helpers local; split only if a cohesive independently used owner emerges, not to lower a metric.
- `scripts/release/correspondence-table.mjs` — new deterministic table rendering and marked-region `--check`/`--write` CLI.
- `scripts/release/core-sync-state.json` — add reverified historical `1.0.x` release rows without changing the schema or existing sync records.
- `scripts/release/prepare-release.sh` — all-selected-artifact preflight, decorate once, honor supplied sections without an existing CHANGELOG, and commit projected state/table with release artifacts.
- `scripts/release/publish-released.sh` — all-selected-artifact guard before publishing, no forced tag refresh, explicit npmjs registry.
- `scripts/release/create-github-releases.sh` — exact tagged sections, shared verification, explicit fork target, no forced tag refresh, no regeneration/overwrite of historical bodies.
- `scripts/release/backfill-release-notes.mjs` — new preview/apply boundary, strict snapshot reader/writer, revalidation, idempotent notes-only updates.
- `test/release/core-sync.test.mjs` — error-order characterization beside existing evidence tests.
- `test/release/core-sync-preparation.test.mjs` — update explicit copied-module/config lists in the same commit as new script imports; explicitly register fixture `demo` as original; preserve existing assertions.
- `test/release/helpers/release-artifacts.mjs` — new narrow real-Git artifact fixture with internally consistent upstream/fork identities and tagged manifests, local-only origin, and captured GitHub/npm subprocess effects.
- `test/release/release-correspondence.test.mjs` — strict registration, evidence, renderer, section parsing, corpus and marker cases.
- `test/release/release-correspondence-history.test.mjs` — revalidate actual historical rows and generated table against local real objects.
- `test/release/release-publication.test.mjs` — actual shell entry points, prepared/tagged artifact round trips, all-selected failure preflight, first-CHANGELOG branch, original package, and exact-tag rerun behavior.
- `test/release/release-backfill.test.mjs` — preview/apply, strict review artifact round trip, stale snapshot and evidence refusal, preservation, repeatability, partial failure, and original-package exclusion.
- `docs/upstream-sync.md` — generated correspondence region and current evidence lifecycle; remove instructions to hand-add rows and reconcile every other passage calling the table historical/manual.
- `.pi/skills/releasing/SKILL.md` — explicit registration/onboarding, tagged-note source, generated docs, and approval-gated backfill; revise both the workspace-discovery and first-publication guidance so classification is not bypassed by examples.
  Load `writing-for-agents` before implementation edits to this skill.
- `packages/pi-subagents/README.md` — discoverable shipped CHANGELOG and correspondence links, provenance-versus-equivalence wording, historical immutability.
- `packages/pi-subagents/CHANGELOG.md` — only future release preparation inserts new decorated sections; no implementation-time hand edits or historical rewrite.

Predicted unchanged, with falsifiable reasons:

- `core-sync-state.mjs`, `core-sync-values.mjs`, `core-sync-cliff.mjs`, `record-core-sync.mjs`, `scripts/upstream-sync.sh` — schema, calculation, and sync recording stay intact; historical rows satisfy the existing strict reader.
- `lib.sh`, `next-version.sh`, `verify-cliff-parity.sh`, `cliff.toml` — classification gates do not replace workspace discovery or version prediction.
- `test/release/helpers/core-sync-scenario.mjs` and `git-repository.mjs` — existing scenario semantics and explicit copy API suffice; new artifact setup composes them without globally changing identity/version defaults.
- `core-sync-history.test.mjs`, `core-sync-cli.test.mjs`, `core-sync-state.test.mjs`, `bumped-version.test.mjs` — continue pinning the existing algorithm and renderer behavior; new publication tests replace reliance on `--latest` as the actual Release source without deleting generic git-cliff tests.
- `.github/workflows/release.yml` — already checks out full history at the exact release SHA and calls the guarded scripts; backfill is deliberately not automatic.
- `.github/workflows/ci.yml`, `vitest.config.mjs`, root `package.json` — root discovery already runs `.mjs` script tests; the table check is exercised by that suite.
- `packages/pi-subagents/package.json` — the existing allowlist already ships README and CHANGELOG; no version/metadata change is needed during implementation.
- All selector files — registration distinguishes its original provenance without changing its peer compatibility contract or requiring a companion release.
- Package architecture/roadmaps and package skills — no package modules, runtime flow, or roadmap steps change; no completion marker belongs there.

## Test Impact Analysis

The extracted evidence checks enable exact historical validation without coupling a test to today's unreleased version window.
The new artifact boundary permits focused tests for registration, presentation, and GitHub/npm handoff rather than expanding the decision suite into a publication suite.
No existing decision, history, CLI, state, bounded-walk, or preparation tests become redundant: they test different obligations.
Keep their acts and assertions visible, and do not replace real-process tests with mocked internal validators.

New tests should cover these classes independently:

- Valid fork, original, unknown package, name mismatch, unknown kind/schema/adapter, duplicate registrations, forbidden original upstream fields.
- Exact historical row versus latest row, missing row/object, non-contained release/tip, manifest mismatch, unreleased tail, pending decision/tag mismatch.
- Entire expected provenance block and its absence across all original-package paths, including mixed preparation, publication, GitHub creation, and backfill.
- Duplicate fork/upstream version headings, wrong repository/tag link, missing/ambiguous section, four-backtick/tilde fences, CRLF boundaries, malformed markers, and complete corpus replay.
- Existing/missing CHANGELOG, preserved historical suffix, all-selected preflight, sibling-only unchanged state/table, prepared-to-published round trip, delayed job with a newer unrelated tag present.
- Table byte equality from evidence, deterministic order, missing/duplicate markers, and no edits outside the owned region.
- Historical body preservation including restoration notices, identical reruns, conflicting blocks, stale body/tag/evidence/identity, malformed review files, and partial remote failure followed by safe resume.

Use synthetic disposable repositories for invalid cases, clearly labeled as such.
Use real repository history for the correspondence data checks and real Release bodies captured without modification for preservation fixtures.
Stub `gh` and publishing commands only at external effect boundaries, asserting exact arguments and absence of calls on preflight failure.
No test may reach GitHub mutations or a real registry publish.

Planning verified existing read-only predictions, `gh release edit --help`, real packing, and the current release suite.
Proposed CLIs do not exist yet; during implementation verify their `--help` and exercise every documented example against scratch data or read-only real preview before committing the guidance.
Use `pnpm exec vitest run <paths>` for targeted tests, not argument forwarding that accidentally runs a different suite.

## Invariants at risk

| Constituency / invariant                                                       | Test that pins it                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release operators: unchanged core levels and historical window                 | `core-sync-history.test.mjs`: `derives the historical counterfactual patch instead of the accidental major`; `core-sync.test.mjs`: window derivation and fork-breaking dominance          |
| Evidence reviewers: no weakened manifest, ancestry, tail, or continuity checks | Existing `evidence failures`, `unreleased upstream tails`, `sync chain continuity`, and lossless-path cases in `core-sync.test.mjs`; add failure-order characterization before extraction |
| Offline tooling users: no network needed for prediction                        | `core-sync.test.mjs`: `derives a patch without any network-capable git call succeeding`                                                                                                   |
| Publishers: blocked mixed selection leaves repository unchanged                | `core-sync-preparation.test.mjs`: `fails before any write when a mixed selection has blocked core evidence`; extend to registration/render/table failures and zero publish calls          |
| Original-package maintainers: releases do not rewrite fork evidence            | `core-sync-preparation.test.mjs`: `leaves core state untouched when only a sibling is selected`; new table/notes absence checks                                                           |
| Release readers: detailed changes and old sections survive                     | Existing preparation retained-history assertions; new exact-byte historical suffix and Release-body preservation tests                                                                    |
| Earlier npm users: old artifacts and source-history disclosure remain truthful | New backfill body fixture retaining the actual `Source-history restoration` section; assert no npm/tag-changing subprocess is invoked                                                     |
| Sync operators: fork tag namespace stays isolated                              | Existing history/tag fixtures plus new publication/backfill command assertions; upstream access remains evidence reads, not tag import                                                    |

These existing tests were opened during planning; they run real Git/git-cliff paths rather than mocking the protected policy.
For quantitative preservation, compare complete old body/suffix and tag name/OID snapshots byte-for-byte, not counts or substring presence.
No latency, token, or complexity improvement is claimed.

## TDD Order

Each implementation step is red → green → verify → commit; restore every killing mutation before committing.
Tests initially green are characterization pins and must be challenged by the assigned mutation, not reported as new behavioral reds.
Run the complete release suite after shared changes and the complete root script suite at integration boundaries.

1. **Prepare published-evidence reuse without policy change.**
   Add a characterization case with both an invalid baseline tail and an invalid window, pinning the current window-error precedence.
   Extract the published correspondence and tail checks into `core-sync-evidence.mjs`, retaining both call positions and diagnostics in `decideCoreRelease`.
   This prepares exact-tag consumers without invoking today's version window.
   Killing mutation: move the baseline-tail call ahead of window validation; only the new precedence class must fail.
   Existing evidence guards remain pinned by the existing suite; no new behavior is claimed for their extraction.
   Verify `core-sync.test.mjs`, `core-sync-history.test.mjs`, CLI/preparation tests, then all release tests.
   Commit: `refactor(release): share published correspondence validation (#24)`.

2. **Add strict classification and correspondence resolution alongside existing scripts.**
   Add the registry reader, narrow verified provenance result, pending/exact-tag adapters, and consistent artifact fixture without activating mutation gates yet.
   Red/green cases cover fork/original, unknown entries and schemas, identity mismatches, exact historical selection, pending tag disagreement, and all existing published-evidence failure classes through the new consumer.
   Killing mutations: default an unknown package to original for unknown-registration tests; accept a mismatched npm name for identity tests; select `releases.at(-1)` for historical-selection tests; omit pending-tag equality for prediction-agreement tests; skip each manifest, ancestry, object, or tail validation separately for its corresponding failure class; allow upstream fields on original entries for strict-classification tests.
   Verify fixture positive controls first so a malformed artifact does not make rejection tests vacuously pass.
   Commit: `refactor(release): add explicit package provenance resolution (#24)`.

3. **Register actual packages and add verified historical evidence.**
   First add real-history validation tests that check each existing and proposed row against its own tag, upstream manifest identity/version, ancestry, and in-scope tail.
   Then add the actual `fork`/`original` registrations and reverified `1.0.x` rows to the existing state file.
   Preserve all current rows and sync review records; record evidence in git rather than a second history mapping file.
   Killing mutations: substitute the `21.7.3` record for old `1.0.1` to kill containment/baseline checks; alter an upstream version without changing the source commit to kill manifest binding; misclassify `pi-subagents-model-selector` as fork to kill real classification expectations.
   Verify the historical counterfactual, real no-pending predictions, state tests, and release suite.
   Commit: `build(release): register package provenance and historical baselines (#24)`.

4. **Build canonical notes and generated correspondence views.**
   Add the canonical block renderer, exact fork-tag section reader, and table generator/checker with marked-region ownership.
   Add the markers and tool-generated table in `docs/upstream-sync.md` in this step; do not hand-author the version rows.
   Red/green tests cover exact full output, original no-block output, duplicate upstream versions, fence handling, malformed sections/markers, table order, and preserved surrounding prose.
   Killing mutations: return an empty block for fork rendering; emit a block for original rendering; match by version alone for duplicate upstream-heading tests; treat a fence's inner heading as a release boundary for fence tests; take only the last state row for table-completeness tests; replace the whole document with the generated table for outside-region preservation tests; accept a second marker pair for ambiguity tests.
   Replay the complete real CHANGELOG corpus from planning, keeping the known manual/missing historical exceptions explicit rather than adding an unsafe fallback.
   Verify target tests and root script suite; run table `--write`, then `--check`, and verify a second write has no diff.
   Commit: `feat(release): generate upstream correspondence documentation (#24)`.

5. **Wire provenance through the complete release pipeline.**
   Add all-selected registration/evidence/render preflight to preparation, persist decorated sections/state/table together, and fix the no-existing-CHANGELOG branch.
   Add all-selected artifact preflight to publication and exact tagged-section sourcing to GitHub creation in the same behavior commit.
   Update copied-script/config lists and original fixture registration in `core-sync-preparation.test.mjs` in this commit, not later.
   New tests cover fork-only, original-only, mixed valid selection, blocked later package, render/table failure before writes, matching tag/artifact evidence, missing CHANGELOG, existing Release rerun, and newer tags visible during an older job.
   Killing mutations: delete each new entry-point preflight separately for the corresponding no-side-effect test; move a manifest write before rendering for render-failure snapshots; omit the decorated block for artifact parity; keep the old missing-CHANGELOG rerender for first-CHANGELOG coverage; omit state/table staging for tagged round-trip tests; restore `git-cliff --latest` for delayed-job tests; drop `--repo` or the explicit registry flag for subprocess-target tests.
   Verify the real shell scripts against local-only origins and captured publishing/GitHub commands, then `pnpm run test:scripts` and read-only predictions.
   Commit: `feat(release)!: require verified provenance before fork publication (#24)`.
   Footer: `BREAKING CHANGE: Release preparation and publication now require explicit fork/original package registration and verified fork correspondence in the release artifacts. Register approved package identities and evidence before dispatching; unregistered or inconsistent packages are rejected. Existing version calculation and extension runtime APIs are unchanged.`

6. **Add preview-first historical Release backfill.**
   Implement the strict review-artifact writer/reader and notes-only apply boundary together.
   Keep preview read-only and require explicit apply; revalidate the entire selected batch against current remote bodies, tag OIDs, identity, and committed evidence before the first edit.
   Red/green tests cover original exclusion, missing Release reporting, old-version-specific baseline, exact old-body preservation, restoration disclosure, managed-block no-op/conflict, stale review files, recomputed output, metadata preservation, and resumable partial failure.
   Killing mutations: call edit during preview for read-only tests; use latest evidence for old-release tests; replace the old body with regenerated notes for preservation tests; ignore snapshot equality for stale-body/tag/evidence tests; trust serialized `proposedBody` for edited-review-file tests; append an already-present block for idempotence tests; create missing Releases for missing-release tests; send a title/latest/tag flag for metadata tests.
   Verify round-trip serialization includes every field used by apply, and inspect exact fake `gh` invocations with the real CLI's supported flags.
   Commit: `feat(release): preview verified historical provenance backfills (#24)`.

7. **Document discovery and verify the shipping surface.**
   Update the README and remaining sync/releasing guidance, removing every hand-maintained-table instruction and explaining registration versus release authorization.
   Preserve selector compatibility prose and mark old artifact immutability explicitly.
   Repack `@jopqior/pi-subagents` into a temporary directory; inspect README links and CHANGELOG inclusion, and compare a scratch prepared release's packaged section with captured GitHub notes.
   Rerun all prescribed new CLI examples against scratch data or read-only preview; confirm table `--check` passes from committed evidence.
   This documentation step adds no new behavioral test claim; any newly authored assertion still needs an assigned mutation.
   Run `pnpm run check`, `pnpm run lint`, `pnpm run test`, and the required fresh pre-completion review before recommending `/ship`.
   Commit: `docs: explain fork release provenance and historical backfill (#24)`.

8. **Prepare the actual historical preview and stop for remote approval.**
   With implementation verified and committed, re-inventory existing fork Releases, produce the review artifact/diffs with the new default preview mode, and record its scope and validation results in the implementation retro.
   Do not run apply merely because the tool is ready or because this plan lists the operation.
   Ask for approval of the exact reviewed remote edits; publication requires its own separate approval.
   After approval in the execution/ship session, apply notes-only changes, read them back, and record preservation/no-op verification before claiming historical backfill complete.
   This is an operational acceptance gate, not another code change or a reason to invent a follow-up issue.

## Risks and Mitigations

- A superficially valid baseline can be historically wrong: select by exact fork tag and revalidate source, manifest, tip, and ancestry; never query the latest upstream release during rendering.
- Early restored tags do not re-attest npm artifacts: preserve the existing restoration disclosure and distinguish incorporated source from original build provenance.
- Version-only Markdown matching can select inherited upstream history: bind section identity to the fork comparison URL and exact tag, and fail on ambiguity.
- A missing CHANGELOG currently drops the supplied section: test and replace that real branch, not only the normal insertion path.
- New publication identity checks can break synthetic positive fixtures for unrelated reasons: create valid artifact fixtures without globally changing core decision scenarios.
- A copied script can import a missing module in scratch tests: keep explicit transitive copy lists/config updates with the first consuming commit.
- Generated table/state/pending-tag lifecycles can drift: build one projected release artifact set before writes and verify it again at the tagged boundary.
- Root tooling is not itself an npm release: require a later approved package publication to deliver the README and newly generated CHANGELOG to npm users.
- Backfill may race another editor or fail after partial progress: revalidate immediately before edits, preserve review snapshots, read back results, and make completed identical entries safe no-ops.
- Future forks need different evidence: reject unsupported registration rather than widening today's evidence schema or pretending workspace inheritance grants publication permission.

## Open Questions

No design choice remains open after the operator's confirmations.
Remote backfill application and any npm release remain approval gates, not granted permissions.
If a historical tag fails revalidation or a restored artifact requires a stronger claim than incorporated-source provenance, stop that operation and bring the concrete evidence back to the operator instead of guessing.
No new GitHub issue is required by the settled plan.

[#13]: https://github.com/Jopqior/gotgenes-pi-packages/issues/13
[#16]: https://github.com/Jopqior/gotgenes-pi-packages/issues/16
[#23]: https://github.com/Jopqior/gotgenes-pi-packages/issues/23
