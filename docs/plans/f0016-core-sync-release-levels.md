---
issue: 16
issue_title: "Derive fork core sync releases from upstream version changes"
---

# Derive core sync releases from verified upstream versions

## Release Recommendation

**Release:** ship independently

This is repository tooling, not a package roadmap step or release-batch member.
All planned edits are outside package release scopes, so landing this work alone requires no npm publication.
A later core release still requires explicit operator approval of its destination and package list.

## Problem Statement

The integration in [#14] incorporated upstream core releases within `21.7.x`, but its repository-wide `feat!:` merge message made the fork core advance from `1.0.2` to `2.0.0`.
Path filtering admitted the merge because it changed core files; the message also described unrelated sibling and project-configuration changes.
The sync script itself defaults to `chore: merge upstream/main`, not a breaking message.
Changing that default or ignoring every merge would not implement the requested policy.

## Goals

- Compare the upstream core release incorporated at the last fork core release with the release incorporated now, and apply one corresponding increment to the independent fork version.
- Classify fork-owned core changes separately and take the higher level, including genuine breaking changes introduced during conflict resolution.
- Preserve the explicit last-release boundary, offline prediction, tag isolation, and independently named release packages.
- Make prediction, parity checking, and release preparation consume the same policy and verified correspondence.
- Fail closed on missing correspondence, ambiguous provenance, or unreleased upstream core changes; the operator explicitly chose no upstream-level override.
- Treat changed release-tool defaults and newly rejected inputs as a breaking tooling contract, using `feat!:` for the wiring commit and a migration footer.
  This is not a core runtime API change and does not itself cut a package major.

## Non-Goals

- Rewrite published `2.0.0`, earlier versions, tags, npm artifacts, or Git history.
- Copy upstream absolute version numbers into fork manifests.
- Change runtime code, package dependency metadata, or sibling package release policies.
  Selector independence belongs to the already-open [#15], which is not a prerequisite.
- Replace git-cliff, globally discard merge commits, introduce a general package-policy registry, or automatically publish siblings.
- Repair the existing full-workspace parity failures for never-published packages.
- Revisit upstream backlog or roadmap priorities imported into this fork.

## Background

The operator authored the issue and confirmed repository-level scope and strict blocking for insufficient evidence.
The plan therefore belongs under root `docs/plans/`, with root Vitest tests under `test/`.

- `scripts/release/lib.sh` owns package path exclusions, tag lookup, and `bumped_version(tag)`.
- `next-version.sh` and `verify-cliff-parity.sh` each currently call `cliff_args` followed by `bumped_version`.
- `prepare-release.sh` calls `next-version.sh` for every named package before writing manifests, then pins changelog rendering with `--tag`.
- `create-github-releases.sh` renders already-tagged releases; it does not choose a version.
- `scripts/upstream-sync.sh` fetches with `--no-tags`, queries tag names with `ls-remote`, and performs genuine merges.
  Its newest-tag display is not proof that that tag is contained in a particular sync.
- `docs/upstream-sync.md` records published correspondence and actual merge SHAs, but its table currently omits intermediate fork releases.
- [#11] supplied the bounded version walk; [#13] restored native merge ancestry and added merge-boundary tests.
  Both are implemented and must remain effective.

The fork tracker has [#15] as the related open issue and no open PRs at planning time.
The newest triage, `docs/triage/2026-09-18-backlog.md`, concerns upstream issues and contains no fork issue-16 disposition.
No fork issue-16 retro existed; inherited `0016-` matches describe unrelated historical package work.
The relevant prior-session decisions are in `docs/retro/f0014-upstream-compatibility-sync.md`.

Applicable repository constraints include no upstream tag imports, synchronization only through `scripts/upstream-sync.sh`, explicit fork GitHub targeting, independent fork versions, and no publication without approval.
The existing dispatched/offline release architecture remains in force; this plan adds a core-specific derivation policy rather than changing publication ownership.

## Design Overview

### Evidence and reproduction

The reproduction used real repository objects, not a reconstructed commit graph.
An isolated `git clone --shared --no-checkout --no-tags` of the fork was checked out at the actual integration commit, and only the historical fork baseline tag was recreated in that scratch repository.
No refs in the working repository were changed.

| Evidence                                  | Measured value                                                     |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Planning checkout                         | `7c79bd630bfa7d742131fde05f561e7098281a5d`                         |
| Historical fork baseline, peeled          | `788f64093ce023e12ac491355563004f1610142f` (`pi-subagents-v1.0.2`) |
| Actual sync merge                         | `0408aa5ff9d9811d98df17dde436e7fd45a5a3ad`                         |
| Its upstream parent                       | `edb35ee28535aac4e12431e47e440f6933911834`                         |
| Upstream release baseline, peeled         | `b3b6159399f541fd0623f65818557dd3e707a34f` (`21.7.0`)              |
| Upstream release target, peeled           | `f918568bbb643a6145898c76c5cc225c63b5b793` (`21.7.3`)              |
| Current fork release, peeled              | `57f8b3f121762cd90650af462b871418a3babfff` (`2.0.0`)               |
| Historical `next-version.sh pi-subagents` | `pi-subagents-v2.0.0`                                              |
| Current `next-version.sh pi-subagents`    | Empty stdout; nothing to release at `2.0.0`                        |
| Local tools                               | git-cliff `2.14.1`; Git `2.53.0`                                   |

Upstream release SHAs were obtained with `git ls-remote --tags upstream 'pi-subagents-v21.7.*'`, without fetching tags.
The corresponding manifests contain `21.7.0` and `21.7.3`, both tags have non-draft/non-prerelease GitHub Releases, and ancestry checks confirm containment.
The core release-scope history between the target release and the merged upstream tip is empty; only excluded internal documentation changed there.
The historical `1.0.2` baseline retains the previously recorded `21.7.0` correspondence: its first-parent history after `1.0.0` contains no further upstream merge.

The trigger is the release predictor evaluating the bounded post-tag window after the integration merge changes core paths.
The actual git-cliff JSON context contains upstream fixes and the breaking integration merge.
A direct range probe in today's repository incorrectly used the later `2.0.0` tag as context and printed `3.0.0`; that is why the regression must isolate historical refs as well as commits.
In the isolated history, `--skip-commit <merge>` still printed `2.0.0` with the installed git-cliff.
Removing the merge from its exported JSON context and using `--from-context --bumped-version` printed `1.0.3`; an empty context printed `1.0.2`.
These are deterministic single-run mechanism probes, with no stochastic source or extension interception.
Filtering the merge was only an experimental control, not the proposed production policy.

### One offline policy entry point

Add `next_tag(pkg, currentTag)` in `lib.sh`, first as a behavior-preserving wrapper around the existing scope/bump calls.
Then give it the only core-policy dispatch: `pi-subagents` uses the new policy; other packages keep the bounded git-cliff path.
Both prediction and parity call this helper.
Preparation continues to obtain tags through `next-version.sh`.

Pass existing `CLIFF_ARGS` to the Node CLI as an argument array, rather than duplicating exclusions or adding a second shell-glob parser.
The library receives an explicit repository path; only the CLI boundary obtains CWD.
Resolve the executable relative to `lib.sh`, not the scratch repository's script layout.

```bash
next_tag() { # <package> <current-tag>; sketch of the final dispatch
  cliff_args "$1"
  # Core: node <resolved-core-sync-cli> --repo "$PWD" --current "$2" -- "${CLIFF_ARGS[@]}"
  # Other packages: bumped_version "$2"
}
```

The new module owns evidence validation and history partitioning, returns a decision, and does not mutate caller-owned objects.
It shells out to real Git/git-cliff at the boundary; its SemVer comparison and level combination are pure functions.

```typescript
type ReleaseLevel = "none" | "patch" | "minor" | "major";
type UpstreamRelease = { version: string; commit: string };
type CoreReleaseDecision = {
  currentTag: string;
  nextTag: string;
  upstream: UpstreamRelease;
  upstreamTip: string;
  upstreamLevel: ReleaseLevel;
  forkLevel: ReleaseLevel;
};
```

These are conceptual contracts for `.mjs` implementations, not a new published TypeScript API.
The version comparator reads only two version strings; the combiner reads only two levels.
The evidence validator consumes the provenance record; renderers need only the decided tag and explanatory fields, not a general dependency bag.

### Recorded evidence, not a local cache

Add a schema-versioned `scripts/release/core-sync-state.json` committed to Git.
It contains published fork correspondence and reviewed sync records.
Use strict readers: reject unknown schema versions, duplicate conflicting entries, invalid SemVer, malformed OIDs, absent objects, non-ancestor baselines, and inconsistent manifest versions.
Do not infer correspondence from the fork's overwritten `package.json` version.

```typescript
type CoreSyncState = {
  schemaVersion: 1;
  releases: {
    forkTag: string;
    upstream: UpstreamRelease;
    upstreamTip: string;
  }[];
  syncs: {
    merge: string;
    upstream: UpstreamRelease;
    forkCore: { level: ReleaseLevel; rationale: string; paths: string[] };
  }[];
};
```

The merge object supplies its parents; do not store redundant parent fields.
The exact merge OID binds the review to its committed resolutions.
A fork contribution of `none` is an explicit review conclusion, never a missing-field default.
`paths` must be actual changed core paths for non-none contributions; the rationale describes the fork-specific effect rather than unrelated sibling changes.
A manually entered upstream bump level is deliberately absent.

Bootstrap the current published `2.0.0` correspondence from the verified table, release tag, and actual upstream parent.
Do not backfill invented unpublished versions or reclassify the old release.
Historical fixture data separately records the verified `1.0.2` baseline for reproducing the old window.
Later release commits append their decided fork tag and upstream correspondence in the same commit as manifests and changelogs, without a self-referential release SHA.
Validate that tag and its recorded upstream ancestors when reading it after publication.

Keep the handbook's historical tables, but declare the JSON record authoritative for automated derivation and check agreement for overlapping published rows.
Do not build a Markdown table parser or a generic docs generator.

### Recording a completed sync

Extend `upstream-sync.sh` with an explicit `--record-core-sync <merge>` mode, backed by `scripts/release/record-core-sync.mjs`.
It accepts a reviewed fork-core level and rationale, not an upstream-level override.
Keep the existing fetch/status and `--merge` behavior intact, including leaving conflicts in progress.
Do not automatically certify unresolved or unreviewed merges.
After normal conflict resolution and `git merge --continue`, the operator records evidence and commits the resulting state update before release prediction.

The recorder:

1. Applies the existing upstream identity and no-tag safeguards, and uses `ls-remote` to resolve release tags without creating local tag refs.
2. Resolves the named genuine two-parent merge and selects the highest stable upstream core release contained in its upstream parent, not the newest advertised tag globally.
3. Checks the release manifest version, previous incorporated tip ancestry, and all in-scope upstream commits after the selected release.
   Unreleased source, tests, shipped docs, or metadata changes block recording even if their Conventional Commit type is normally hidden.
   Internal-doc-only changes remain allowed under the existing exclusion policy.
4. Presents the merge's core diff and records the reviewed fork contribution, including conflict-resolution edits that cannot be inferred from upstream version numbers.
5. Writes a deterministic record only after validation succeeds; repeating the same record is idempotent, while conflicting evidence is an error.

Recording may query upstream; prediction and release preparation never do.
If required objects are missing, instruct the operator to use the normal sync script, not an ad-hoc tag fetch.
A shallow or ambiguous checkout cannot silently degrade to a guessed release.

### Derivation and ownership

Start at the peeled current fork release tag and require it to be an ancestor of HEAD.
Use its recorded upstream correspondence and process subsequent reviewed sync merges in ancestry order.
Reject an unrecorded core-affecting integration rather than treating its broad message as a trustworthy upstream release level.
Normal fork feature work follows the repository's linear landing workflow; an unexpected core-affecting merge must be reviewed before release, not silently excluded.
This restriction is part of the tooling migration.

Within the explicit `<fork-release-sha>..HEAD` window:

- Identify upstream-owned commits by their verified upstream ancestry, not author names or subject prefixes.
- Keep fork-owned core commits in the bounded git-cliff context, preserving hidden-type breaking commits and existing visible/hidden type rules.
- Remove only verified upstream-owned contributions from the fork-only bump calculation.
- Replace only a reviewed sync merge's repository-wide classification with its recorded fork-core contribution.
  A merge containing an actual fork breaking core change contributes `major`; retaining fork identity or resolving a mechanical conflict does not imply `major` by itself.
- Feed the filtered context to git-cliff with the current fork tag explicitly anchored as its previous release.
  Empty retained commits mean no fork increment, not a default patch.

The JSON-context experiment verifies the adapter mechanism; production tests must pin its metadata and error handling, not assume any arbitrary JSON shape is accepted.
Do not recreate all Conventional Commit rules in JavaScript.
Convert git-cliff's derived fork result to a level, combine it with the upstream level and the reviewed merge contribution, then increment the independent fork version once.

| Upstream baseline to target                              | Upstream contribution |
| -------------------------------------------------------- | --------------------- |
| Equal stable version, no unreleased core history         | none                  |
| Higher patch within the same major/minor                 | patch                 |
| Higher minor within the same major                       | minor                 |
| Higher major                                             | major                 |
| Regression, prerelease, missing or inconsistent evidence | error                 |

Across several deferred syncs, compare the last published fork correspondence with the final verified target; do not sum patch releases.
Validate each intermediate sync's ancestry and provenance, and aggregate fork-only contributions across the whole unreleased window.
Sibling-only and root-config commits do not independently contribute to the core level.
No target version advancement and no fork core contribution produces empty predictor stdout.
All evidence errors produce nonzero exit status and useful stderr, never the no-release success path.

### Publication and notes

Keep preparation's all-packages preflight ahead of every write.
Resolve and validate the core correspondence during that phase; a blocked core must leave sibling manifests, tags, state, and changelogs unchanged.
When core is actually selected and releasable, append its correspondence in phase 2 and stage the JSON with the existing release artifacts.
Publishing only a sibling must not alter core state.

Retain detailed upstream entries in changelogs and GitHub Release notes: the fork-only filtered context is for level calculation, not for erasing release history.
The already-decided `--tag` remains authoritative for rendering.
An integration message may still describe breaking sibling behavior; document that its repository-wide marker no longer decides core's upstream contribution.

### Structural review and Tidy First

The design-review checklist found a duplicated decision-entry sequence in prediction and parity, and a shell-owned path policy that a Node implementation must not copy.
The shared helper resolves the first; passing the existing argument array resolves the second without a new output-argument contract.
There is no shared mutable reset lifecycle or new multi-layer dependency bag.
The recorder owns writes; the offline classifier returns values.

The fresh-context assessor recommended a release scratch-repository helper and a shared `next_tag` entry point; both are accepted as preparatory commits.
Its proposed NUL-printing `cliff_args` interface is unnecessary with direct array forwarding, so no new printing mode is planned.
The existing generic test assertions remain unchanged while their setup moves mechanically.
Do not unify the release scratch fixture with the sync suite's remote-rewriting fixture: they test different boundaries.

## Module-Level Changes

- `test/release/helpers/git-repository.mjs` — new instance-owned scratch Git helper extracted from `bumped-version.test.mjs`; support package names and real process invocation without a shared global repository.
- `test/release/bumped-version.test.mjs` — migrate setup to that helper, preserving its generic `demo` package expectations and bounded-walk tests.
- `scripts/release/lib.sh` — add shared `next_tag`, retain `bumped_version`, forward the existing scoping argument array, and centralize core dispatch.
- `scripts/release/next-version.sh` — use the shared decision entry, preserve tag-or-empty stdout and error propagation, update explanatory comments.
- `scripts/release/verify-cliff-parity.sh` — use the same entry and diagnostics; replace its unsafe bare tag-fetch usage example with fork-safe guidance.
  Preserve its existing treatment of untagged packages.
- `scripts/release/core-sync.mjs` — new strict state reader, offline ancestry/context adapter, pure level functions, and decision CLI.
- `scripts/release/record-core-sync.mjs` — new online evidence recorder called only through the sync script, with a narrow interface and no pushes.
- `scripts/release/core-sync-state.json` — verified current bootstrap correspondence and future audited sync/release records.
- `scripts/upstream-sync.sh` — add the explicit recording mode and post-merge guidance without changing merge topology, conflict handling, or default message.
- `scripts/release/prepare-release.sh` — preflight core evidence and append correspondence with the selected core's release artifacts.
- `test/release/core-sync.test.mjs` — pure mapping, schema validation, real-Git synthetic ownership/window scenarios, shared entry-point parity, and isolated preparation tests.
- `test/release/core-sync-history.test.mjs` — actual issue-14 objects and historical refs regression; missing required objects are a clear failure, not a skipped pass.
- `test/upstream-sync/merge.test.mjs` — add recording-mode tests using the existing local remote wrapper; preserve existing merge/status tests.
- `docs/upstream-sync.md` — mapping rule, authoritative evidence, blocking cases, reviewed fork-resolution contribution, recording procedure, and release correspondence lifecycle.
- `.pi/skills/releasing/SKILL.md` — explain the core exception to direct git-cliff derivation and strict errors, with unchanged explicit-dispatch rules.
- `README.md` — extend the existing sync-guide pointer with a concise core release-policy summary.

Predicted unchanged, with falsifiable reasons:

- `cliff.toml` — the same Conventional Commit policy still classifies fork-owned commits and all other packages; no global parser changes are needed.
- `scripts/release/create-github-releases.sh` and `publish-released.sh` — consume already-created tags rather than derive levels; rendering tests must confirm their existing behavior remains suitable.
- `.github/workflows/release.yml` — already checks out full history and invokes preparation; GitHub-hosted runners provide Node, which must be checked in workflow verification before relying on the new CLI.
- `.github/workflows/ci.yml`, `vitest.config.mjs`, and root `package.json` — the root suite already discovers `.mjs` tests and CI installs git-cliff.
- `.pi/prompts/ship.md` — already invokes the predictor and stops on nonzero status; it need not duplicate the new algorithm.
- `docs/decisions/0002-git-cliff-release-automation.md` — retains the historical accepted decision; current fork-specific operating rules live in the sync/releasing guides rather than rewriting that record.
- Every `packages/` path and package skill — no runtime, manifest, package roadmap, or architecture module layout changes.

## Test Impact Analysis

The new boundary enables independent tests of upstream release evidence, level mapping, provenance partitioning, and blocked publication without running a release workflow.
No existing tests become redundant: generic `demo` tests exercise the unchanged default policy, and sync tests exercise real remote/merge safeguards.
Their fixture setup may be shared within the release suite, but assertions remain at their original layer.

Use two distinct evidence classes:

- The real-history regression clones local fork objects without tags, checks out the historical merge, restores only the baseline fork tag, and invokes current policy code against that repository.
  Copy only the required current release implementation/config and verified fixture correspondence, never replace the actual history with synthetic commits.
- Generated temporary Git graphs cover combinations absent from that historical window: minor/major spans, several syncs before release, fork breaking fixes, hidden types, sibling changes, stale records, and unreleased upstream changes.
  Label these synthetic scenario fixtures, not additional reproductions.

Required cases also include annotated/lightweight upstream tags, advertised but uncontained newer tags, duplicate or regressive records, absent objects, docs-only upstream tails, empty windows, and independent sibling publication.
Core runtime/tests/shipped docs are in scope for the unreleased guard even when git-cliff would skip their commit types.
Test retained fork changes both before and after syncs, and breaking core edits performed in a merge resolution.

Planning verification ran `pnpm run test:scripts -- test/release/bumped-version.test.mjs`; the runner actually executed the entire root suite and reported 10 passing files and 160 passing tests.
Use `pnpm exec vitest run <paths>` for targeted execution during implementation, then `pnpm run test:scripts` for the complete root suite.
The new recording commands do not exist yet; verify their `--help` and execute their documented workflow against local fixture remotes before committing guidance.
Existing read-only `./scripts/release/next-version.sh pi-subagents` was dry-run and reported nothing pending.

## Invariants at risk

| Constituency and invariant                                             | Existing or planned pin                                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Release operators: pre-tag upstream breaks never re-enter a window     | Existing `bumped_version across an upstream merge boundary` tests, plus equivalent core-policy cases     |
| Fork users: real fork-owned breaks still force major                   | New fork `feat!:` and `refactor!:` cases, including reviewed merge-resolution changes                    |
| Other packages: generic upstream breaks retain existing classification | Existing `demo` test `bumps major for a genuinely new upstream breaking commit merged after the tag`     |
| Sync operators: real merge parents and untouched tag namespace         | Existing `--merge` and tag-isolation tests in `merge.test.mjs`, extended to recording mode               |
| Automation: empty result differs from failure                          | New CLI assertions on exact stdout, stderr, and exit status for none versus blocked                      |
| Publishers: all validation precedes writes                             | New preparation test snapshots tracked files, index, refs, and state on a failed multi-package preflight |
| Release readers: detailed post-tag history remains visible             | Existing rendering tests plus new core-window rendering assertions with the decided tag                  |
| Offline users and CI: no network during prediction                     | Run predictor with network-command stubs that fail, using only committed evidence and local objects      |

The existing test files were opened, not inferred from names; their Git/git-cliff invocations are real processes rather than mocked classifiers.
The quantitative safety invariant is byte-identical local tag refs across recording, asserted with names and object IDs before/after, not merely equal tag counts.
No latency or token-budget improvement is claimed.

## TDD Order

1. **Prepare scratch-repository reuse.**
   Move release-suite Git setup and process helpers into an instance-owned fixture, parameterizing the package only where needed.
   Keep each test's act and assertion visible and preserve all current expectations.
   Verify the full existing release test file before and after; this is a mechanical refactor with no new test claim.
   Commit: `test: share release repository fixtures (#16)`.

2. **Unify the decision entry without changing policy.**
   Add `next_tag(pkg, currentTag)` and migrate prediction/parity together.
   Add process-level parity pins for a patch, an empty window, and a failing tool invocation.
   Killing mutations: return the current tag unconditionally to kill the patch pin; return a patch tag for an empty window to kill the no-release pin; replace a failing subprocess status with success to kill the failure pin.
   Verify existing bounded-walk tests and both real fork-package predictions.
   Commit: `refactor: share release tag prediction between entry points (#16)`.

3. **Build the offline evidence and level mechanism alongside the old policy.**
   Add strict record parsing, version comparison, bounded history partitioning, and git-cliff context adaptation without activating the core branch yet.
   Red/green tests cover equal/patch/minor/major transitions, skipped upstream releases, cumulative syncs, fork fixes/features/breaks, hidden-type breaks, explicit none, and every validation failure described above.
   Killing mutations: map minor or major advancement to patch for each corresponding class; return patch on equal versions for the none class; sum patch deltas for the multi-release class; remove the fork-level maximum for fork-dominant cases; retain the broad sync merge for the sibling-breaking case; remove the lower range bound for pre-tag-history cases; bypass the unreleased-history check for hidden-type upstream changes; return a default level on missing evidence for blocked-input cases.
   Keep each mutation paired with its named equivalence class; use separate tests for malformed schema, ancestry, and unavailable objects.
   Verify targeted tests and root suite.
   Commit: `refactor: add verified core release decision policy (#16)`.

4. **Record verified sync provenance through the sync script.**
   Add the explicit recording mode, online tag resolution, immutable merge review binding, and deterministic state writer.
   Red/green tests cover containment rather than global newest tag, annotated/lightweight tags, idempotent recording, conflict-in-progress refusal, unreleased-core refusal, missing evidence, and explicit fork-resolution levels.
   Killing mutations: select the globally highest tag to kill the uncontained-tag case; use the annotated tag object instead of its peeled commit to kill annotated-tag validation; permit a missing fork review to kill review-required cases; write before validation to kill unchanged-on-error snapshots; add `--tags` to the fetch to kill the invocation/tag-isolation guard; drop the new mode's recorder call to kill producer-to-reader round trips.
   Keep the entire existing sync suite green in this same step.
   Commit: `feat: record verified core sync release evidence (#16)`.

5. **Seed real correspondence and activate the core policy.**
   Verify the current published correspondence again, then add its state row and the historical regression fixture.
   Red: current code at the real historical merge predicts `2.0.0`; the policy test expects the historical counterfactual `1.0.3`, without changing any real tag.
   Green: wire the single core branch through `next_tag`, using the exact argument array and strict nonzero errors.
   Keep the current published `2.0.0` checkout at no pending release, and prove fork-owned breaking changes still dominate an upstream patch.
   Killing mutations: route core back to `bumped_version` to kill the historical regression; ignore fork-only contributions to kill the fork-major case; read today's later tags in the historical fixture to kill its anchored-baseline assertion; suppress the policy error to kill missing-record CLI tests.
   Verify root suite, type checks, lint, and offline prediction for both fork packages.
   Commit: `feat!: derive core sync releases from verified upstream versions (#16)`.
   Include `BREAKING CHANGE: Core release prediction now requires verified sync correspondence and an explicit review of fork core merge contributions; unresolved evidence blocks release instead of using the integration commit type. Record completed syncs through scripts/upstream-sync.sh before dispatching a core release.`

6. **Persist correspondence with actual releases.**
   Extend preparation's complete preflight and phase-2 state update together; include the new field's reader/writer round trip in tests.
   Cover selected core, selected sibling only, mixed selection with blocked core, and a second core release with no new sync.
   Exercise preparation in a disposable repository with local-only remotes and process adapters preventing any real publication or GitHub mutation.
   Killing mutations: remove core evidence preflight to kill the all-or-nothing failure case; omit staging the state file to kill the released-tag round trip; append state for sibling-only preparation to kill its unchanged-core assertion; retain the old upstream correspondence to kill the next-window case.
   Assert manifests, actual created tag, prediction, and state agree; verify the rendered section still contains relevant upstream/fork entries and no pre-baseline entries.
   Commit: `fix: persist core correspondence with release artifacts (#16)`.

7. **Document and verify the operating contract.**
   Update the sync handbook, releasing skill, and README together, including no override, conflict completion, reviewed fork contributions, offline prediction, and explicit publication scope.
   Dry-run all new command examples against the real-Git fixtures and verify `--help`; re-run current read-only prediction and lint the edited docs.
   No new code test claims in this documentation step; recording/publication behavior is pinned in steps 4–6.
   Run `pnpm run check`, `pnpm run lint`, `pnpm run test`, and the required pre-completion review before handing off to `/ship`.
   Commit: `docs: explain verified upstream core release classification (#16)`.

## Risks and Mitigations

- Provenance review cannot mechanically determine whether a conflict resolution is a semantic fork API break.
  Bind an explicit level and rationale to the exact merge OID; missing review blocks release, and tests include a genuine fork breaking resolution rather than assuming every sync is upstream-only.
- A direct git-cliff range can retain later tag metadata, as the initial planning probe demonstrated.
  Anchor the context to the selected fork tag and isolate refs in the historical fixture.
- Tag names alone do not prove release containment or a released target tree.
  Verify peeled commits, manifests, ancestry, and the complete in-scope history after the release; fail on prereleases or unreleased changes.
- Two representations of correspondence could drift.
  Make JSON authoritative for tools, retain Markdown as historical explanation, and verify overlapping rows when bootstrapping or updating guidance.
- Evidence collection adds an explicit post-merge step.
  The sync script prints the next action; missing records fail before publishing rather than allowing an accidental major.
- git-cliff context shape can change with the CI-installed version.
  Real-process adapter tests fail loudly; do not silently discard unknown structure or fork breaking commits.
- Historical regression depends on real objects being available.
  CI already checks out full history; local shallow clones must fail with an actionable diagnostic, not replace the reproduction with a synthetic approximation.
- Upstream syncs may overwrite fork release-tool changes.
  The handbook names the policy/state paths as protected fork integration surfaces and the regression runs in the root suite.

## Open Questions

No operator decision remains open.
No new follow-up issue is required: selector compatibility is already tracked in [#15], and speculative release-framework/general test-fixture work is excluded rather than promised.
If implementation reveals a materially different state model or requires an upstream-level override, stop and return to the decision gate instead of weakening the selected fail-closed policy.

[#11]: https://github.com/Jopqior/gotgenes-pi-packages/issues/11
[#13]: https://github.com/Jopqior/gotgenes-pi-packages/issues/13
[#14]: https://github.com/Jopqior/gotgenes-pi-packages/issues/14
[#15]: https://github.com/Jopqior/gotgenes-pi-packages/issues/15
