# Fork synchronization release policy

Maintained core and worktrees forks incorporate their own direct upstream packages through merges of `upstream/main`, so the Conventional Commit classification of an integration merge cannot decide either fork's independent release level.
A broad `feat!:` integration message describes upstream's release, not the fork's independent version.
Fork release levels derive from verified correspondence evidence instead.
This policy owns release evidence and version derivation; the [synchronization guide](synchronization-guide.md) owns integration constraints and lifecycle exceptions.
The generated [core correspondence view](pi-subagents-release-correspondence.md) and [worktrees correspondence view](pi-subagents-worktrees-release-correspondence.md) record each package's own verified direct upstream baseline.
Tooling supports both fixed directories; worktrees is registered under its migrated `@jopqior/pi-subagents-worktrees` identity, with the guarded first-release handoff owned by [issue #37](https://github.com/Jopqior/gotgenes-pi-packages/issues/37).

## Evidence authority and validity

Each package has an independent authoritative record committed to Git:

| Selected directory       | State                                                    | Generated view                                                   |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `pi-subagents` (default) | `scripts/release/pi-subagents/sync-state.json`           | `docs/upstream/pi-subagents-release-correspondence.md`           |
| `pi-subagents-worktrees` | `scripts/release/pi-subagents-worktrees/sync-state.json` | `docs/upstream/pi-subagents-worktrees-release-correspondence.md` |

Each record stores that package's incorporated upstream releases and separately reviewed sync contributions; a core release, compatible dependency or manifest alone is not worktrees provenance.
The sync recorder (`--record-fork-sync`) writes reviewed merge evidence; release preparation writes the released row and regenerated view together for only that selected package's state and view.
An empty schema-2 state and empty managed scaffold establish no release evidence; the table renderer owns only bytes inside its marker pair.
Resolve conflicting evidence in the state file only after review and exact operator approval of the correction, then regenerate and check the view.
Evidence correction approval is separate from this machine-owned record.

The decision and recorder entry points are `scripts/release/fork-sync.mjs` and `scripts/release/record-fork-sync.mjs`.
State and release registry require schema version 2, with `forkContribution` in each sync record and the supported `fork-sync` evidence route.
Stale evidence paths and formats are rejected rather than silently translated.
Core historical backfill review artifacts also require schema version 2: generate a new preview and obtain fresh approval before applying any historical Release-note edits.
Published tags, historical CHANGELOGs, npm artifacts, and authentic Release bodies remain unchanged.

## Mapping rule

The upstream contribution is the SemVer distance between the upstream release incorporated at the last fork release and the one incorporated now, compared once across the whole unreleased window.

| Upstream baseline to incorporated target         | Upstream contribution |
| ------------------------------------------------ | --------------------- |
| Equal stable version, no unreleased package work | none                  |
| Higher patch within the same major and minor     | patch                 |
| Higher minor within the same major               | minor                 |
| Higher major                                     | major                 |

Deferred syncs collapse: several incorporated patch releases still mean one fork patch, never a sum.
The fork contribution is what git-cliff derives from the window's commits with verified upstream-owned commits and the sync merges removed, combined with each recorded merge's reviewed fork level; the highest level wins.
Sibling-only and root-configuration commits do not contribute.

## Blocking cases

Prediction and release preparation fail closed (nonzero exit with a diagnostic, never the silent no-release path) when the evidence is missing or inconsistent:

- the current fork release tag has no recorded upstream correspondence;
- a package-affecting merge in the unreleased window has no reviewed sync record;
- a recorded sync is not a genuine two-parent merge whose upstream parent contains the recorded upstream release;
- a recorded sync incorporates an upstream version behind the already-incorporated one;
- a baseline or window sync's recorded upstream version contradicts its release manifest, or that manifest is missing;
- a sync's upstream parent does not descend from the previously incorporated upstream tip, starting with the current fork release's recorded tip;
- upstream history between a recorded release and its incorporated tip contains unreleased package changes (source, tests, shipped docs, or metadata; both recording and offline prediction refuse these even when git-cliff would skip the commit type);
- a recorded object is missing locally, as in a shallow or partial clone.

There is deliberately no override flag.
Record the evidence through the sync script, or resolve a conflicting state entry by hand after review; prediction stays blocked until the record is sound.

## Recording a completed sync

For a completed, reviewed integration, run the recorder only through the sync script:

```bash
./scripts/upstream-sync.sh --record-fork-sync <merge> \
    --fork-level <none|patch|minor|major> --rationale "<what the resolution did>"
./scripts/upstream-sync.sh --record-fork-sync <merge> --package pi-subagents-worktrees \
    --fork-level <none|patch|minor|major> --rationale "<worktrees resolution review>"
```

Omitting `--package` selects core; `--package pi-subagents` is explicit core selection.
After both forks have published anchors, classify and record each package independently with its own explicit level and rationale, including `none` for an unchanged fork rather than copying the other's contribution.
Before worktrees bootstrap, use the first-release handoff below; do not invent a published release row to make the recorder run.

It selects the highest stable upstream release whose peeled commit is contained in the merge's upstream parent (not the newest advertised tag) and verifies the release manifest agrees with the tag.
It validates the supplied review and completed merge, refuses unresolved merges, unreleased package changes, and missing objects, and never pushes or creates local tag refs.
Recording does not implicitly refresh `upstream/main`; missing local inputs require explicit fetch and inspection, never an automatic recovery fetch.
Recording still performs online release lookup, surrounded by the script's tag-name/object comparison on success or failure.
On failure or tag drift, inspect possible evidence writes and actual state before proceeding; do not automatically roll back evidence or restore/delete tags.
Re-running with the same review is idempotent; a conflicting record is an error.
Release prediction requires the reviewed state update committed to Git.

The `--fork-level` review classifies what the conflict resolution itself did to the fork package:

- `none` records that resolutions kept fork identity without changing the fork contract.
- `patch`, `minor`, or `major` record the resolution's own effect.
- Retaining fork identity or resolving a mechanical conflict does not imply `major`; a resolution that genuinely breaks the fork contract is `major`.
- A non-`none` level must be justified by package files whose merge result differs from both parents; those paths are recorded with the level.

## Release correspondence lifecycle

`scripts/release/prepare-release.sh` resolves and validates every selected package's registration and the fork correspondence in its all-packages preflight, before any write; the fork decision must agree with the predicted tag.
The registry at `scripts/release/release-packages.json` classifies actual directory/npm identities as `fork` or `original`; an unregistered package or unsupported fork evidence blocks preparation, publication, and Release creation.
Workspace discovery and read-only version prediction remain independent of registration, and registration never authorizes publication.
When fork releases are selected, preparation commits each package's verified correspondence, decorated CHANGELOG section, and regenerated table together with its manifest.
Both forks and original siblings can be selected in one ordinary release commit after their first releases; each fork retains its own window and temporary state/view outputs.
An original package gets no upstream correspondence block; unselected fork manifests, CHANGELOGs, states and views remain untouched.
Check one registered view with `node scripts/release/correspondence-table.mjs --check --package pi-subagents-worktrees`; omit `--package` for core.
The selected worktrees table command intentionally refuses before registration.
Publishing checks the complete tagged set before the first npm call.
GitHub Release creation checks the same tagged artifacts and takes each body from that tag's exact CHANGELOG section, not from a new git-cliff render; reruns leave existing Release bodies unchanged.
After publication, the next window anchors at the recorded fork tag and upstream release, so prediction works offline from committed evidence and local Git objects alone.
Offline prediction revalidates the baseline and every window sync's release manifest, checks their incorporated tips for unreleased package changes, and verifies that successive upstream tips form a continuous ancestry chain.
It also rejects malformed git-cliff context entries or commit IDs rather than silently discarding fork changes.
Recording evidence does not exempt it from these read-time checks.

## First fork release handoff

Generation, application and publication are separate operations.
Issue #37 owns actual worktrees identity/import/dependency migration, registration, compatibility/packing checks and first-artifact application; repository support alone grants none of these release effects.
Use `0.1.0` as the operator-selected first version for worktrees, not a prediction or a copy of upstream's version.
Obtain explicit separate operator approval of the npm scope and release destination before first publication; registration, integration and artifact review do not authorize publication.
Do not dispatch ordinary release preparation for an untagged first release; `next-version.sh` deliberately refuses without a first fork tag.

After migration and registration are committed in a clean primary checkout on `main`, prepare a reviewed bounded UTF-8 summary (at most 65536 bytes) of actual fork changes, without top-level/release headings, managed correspondence sections or unclosed fences.
Use an external notes file and a fresh external output directory with an existing parent:

```bash
node scripts/release/prepare-first-fork-release.mjs \
    --repo "$PWD" --package pi-subagents-worktrees --version 0.1.0 \
    --merge <completed-incorporated-merge> --notes /tmp/worktrees-first-summary.md \
    --output /tmp/worktrees-first-candidate
```

All six inputs are required; the generator has no apply, publish or dispatch mode and no default version.
It requires an actual registered fork manifest, empty selected schema-2 state, no selected release tags and a completed contained two-parent merge.
It validates supported upstream remote identity, the highest contained stable direct worktrees release, direct upstream npm identity/version, release-to-tip-to-HEAD ancestry and an empty package-scope upstream tail.
It queries upstream tags without fetching, importing or modifying refs, comparing complete local tag mappings on success or failure; missing objects, inconsistent evidence or drift stop the handoff, without tag recovery.
It writes only external candidates, retaining inherited CHANGELOG bytes outside the insertion seam and generating a strict fork-owned first-tag heading plus verified correspondence instead of rerendering inherited history.
The candidate files are:

- `packages/pi-subagents-worktrees/package.json`
- `packages/pi-subagents-worktrees/CHANGELOG.md`
- `scripts/release/pi-subagents-worktrees/sync-state.json`
- `docs/upstream/pi-subagents-worktrees-release-correspondence.md`
- `first-fork-release.json` (transient review handoff, not a persistent ledger)

Review `first-fork-release.json`: its `sourceHead`, completed `merge`, selected version/tag, incorporated upstream evidence and exact `applicationFiles`, plus all candidate contents and the unchanged unselected core evidence.
Verify `sourceHead` still equals the current HEAD before copying and that the source checkout and reviewed candidate bytes have not changed; otherwise regenerate in a new external directory or stop for review.
Apply only the four `applicationFiles` at their repository-relative paths, rerun the issue's packing/compatibility and root checks, and commit them together; retain the review manifest externally, not as a new tracked ledger.
If contents change before application or publication, regenerate or stop for review rather than silently reusing a stale candidate.
After separately approved tagging, the exact tag must point at the artifact commit checked out for publication.
Preflight the complete proposed tagged set through the same artifact validator before any npm/GitHub effects (the output directory must already exist):

```bash
node scripts/release/release-artifacts.mjs published "$PWD" <existing-temp-dir> pi-subagents-worktrees-v0.1.0
```

The operator-approved bootstrap is a manual first npm publish without `--provenance`, not `publish-released.sh` (which uses Trusted Publishing provenance).
After successful preflight and explicit approval, the operator uses `pnpm --filter @jopqior/pi-subagents-worktrees publish --access public --no-git-checks --registry=https://registry.npmjs.org/` from that tagged checkout; OTP interaction belongs in the operator's terminal.
Any approved GitHub Release creation must use the same tagged preflight and exact CHANGELOG notes, with `--repo Jopqior/gotgenes-pi-packages`.
Only after first publication and npmjs.org Trusted Publisher setup for this fork's `release.yml` do subsequent releases use ordinary approved dispatch.
Never reuse a core upstream correspondence row, create a fake previous fork compare tag or import upstream tags to bootstrap worktrees.

## Historical GitHub Release notes

Core backfill is a separate, approval-gated notes-only operation, not part of sync or release preparation.
Worktrees has no historical fork Releases to backfill; its first-release generator is not a historical backfill route.
The default preview requires explicit fork release tags and creates a review JSON file without editing GitHub:

```bash
node scripts/release/backfill-release-notes.mjs --output /tmp/release-notes-review.json pi-subagents-v1.0.1
```

Review each captured Release body and proposed appended block alongside tag OID, registered identity, and historical evidence; preserve any `Source-history restoration` disclosure verbatim.
A missing GitHub Release is reported but not created.
Only after the operator approves those exact remote edits, use `node scripts/release/backfill-release-notes.mjs --apply /tmp/release-notes-review.json`.
Apply rechecks the entire batch against live Releases and committed evidence before editing notes, reads back each edit, and skips completed identical entries on a resumed run.
Another editor may race the final read; coordinate the edit window and retain before/after snapshots.
Backfill never rewrites historical CHANGELOG sections, old npm tarballs, tags, or Release metadata.
