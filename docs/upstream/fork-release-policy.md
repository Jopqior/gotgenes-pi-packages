# Fork synchronization release policy

`@jopqior/pi-subagents` versions advance through merges of `upstream/main`, so the Conventional Commit classification of an integration merge cannot decide the fork's independent release level.
A broad `feat!:` integration message describes upstream's release, not the fork's independent version.
Fork release levels derive from verified correspondence evidence instead.
This policy owns release evidence and version derivation; the [synchronization guide](synchronization-guide.md) owns integration constraints and lifecycle exceptions.
The [generated correspondence view](pi-subagents-release-correspondence.md) records each published fork version's verified direct upstream baseline.

## Evidence authority and validity

The authoritative record is `scripts/release/pi-subagents/sync-state.json`, committed to Git.
It stores the upstream release incorporated by each published fork release and the selected upstream release and reviewed fork contribution for each sync merge.
The sync recorder (`--record-fork-sync`) writes reviewed merge evidence; release preparation writes the released row and regenerated view together.
Resolve conflicting evidence in the state file only after review and exact operator approval of the correction, then regenerate and check the view.
Evidence correction approval is separate from this machine-owned record.

The decision and recorder entry points are `scripts/release/fork-sync.mjs` and `scripts/release/record-fork-sync.mjs`.
State and release registry require schema version 2, with `forkContribution` in each sync record and the supported `fork-sync` evidence route.
Stale evidence paths and formats are rejected rather than silently translated.
Backfill review artifacts also require schema version 2: generate a new preview and obtain fresh approval before applying any historical Release-note edits.
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
```

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
When a fork release is selected, preparation commits its verified correspondence, decorated CHANGELOG section, and regenerated [table](pi-subagents-release-correspondence.md) together with the manifest.
An original package gets no upstream correspondence block; publishing only a sibling leaves the fork state and table untouched.
Publishing checks the complete tagged set before the first npm call.
GitHub Release creation checks the same tagged artifacts and takes each body from that tag's exact CHANGELOG section, not from a new git-cliff render; reruns leave existing Release bodies unchanged.
After publication, the next window anchors at the recorded fork tag and upstream release, so prediction works offline from committed evidence and local Git objects alone.
Offline prediction revalidates the baseline and every window sync's release manifest, checks their incorporated tips for unreleased package changes, and verifies that successive upstream tips form a continuous ancestry chain.
It also rejects malformed git-cliff context entries or commit IDs rather than silently discarding fork changes.
Recording evidence does not exempt it from these read-time checks.

## Historical GitHub Release notes

Backfill is a separate, approval-gated notes-only operation, not part of sync or release preparation.
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
