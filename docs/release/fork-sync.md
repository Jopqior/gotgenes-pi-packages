# Fork synchronization release policy

`@jopqior/pi-subagents` versions advance through merges of `upstream/main`, so the Conventional Commit classification of an integration merge cannot decide the fork's independent release level.
A broad `feat!:` integration message describes upstream's release, not the fork's independent version.
Fork release levels derive from verified correspondence evidence instead.
For fetching, merging, conflict resolution, and the sync log, follow the [upstream sync procedure](../upstream-sync.md).
The [generated correspondence view](pi-subagents-correspondence.md) records each published fork version's verified direct upstream baseline.

## Evidence and tooling migration

The authoritative record is `scripts/release/pi-subagents/sync-state.json`, committed to Git.
It stores the upstream release incorporated by each published fork release and the selected upstream release and reviewed fork contribution for each sync merge.
The sync recorder (`--record-fork-sync`) writes reviewed merge evidence; release preparation writes the released row and regenerated view together.
Resolve conflicting evidence in the state file only after review, then regenerate and check the view.

The decision and recorder entry points are `scripts/release/fork-sync.mjs` and `scripts/release/record-fork-sync.mjs`; the sync script accepts `--record-fork-sync` instead of the removed `--record-core-sync` flag.
The committed state moved to `scripts/release/pi-subagents/sync-state.json` with schema version 2 and `forkContribution` in each sync record.
The release registry uses schema version 2 and the `fork-sync` evidence route.
Old paths and formats are rejected rather than silently translated.
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

Run the recorder only through the sync script, after conflict resolution and `git merge --continue`:

```bash
./scripts/upstream-sync.sh --record-fork-sync <merge> \
    --fork-level <none|patch|minor|major> --rationale "<what the resolution did>"
```

It selects the highest stable upstream release whose peeled commit is contained in the merge's upstream parent (not the newest advertised tag) and verifies the release manifest agrees with the tag.
It refuses an unreviewed or unresolved merge, unreleased package changes, and missing objects, and it never pushes or creates local tag refs.
Re-running with the same review is idempotent; a conflicting record is an error.
Commit the state update before the next release prediction.

The `--fork-level` review classifies what the conflict resolution itself did to the fork package:

- `none` records that resolutions kept fork identity without changing the fork contract.
- `patch`, `minor`, or `major` record the resolution's own effect.
- Retaining fork identity or resolving a mechanical conflict does not imply `major`; a resolution that genuinely breaks the fork contract is `major`.
- A non-`none` level must be justified by package files whose merge result differs from both parents; those paths are recorded with the level.

## Release correspondence lifecycle

`scripts/release/prepare-release.sh` resolves and validates every selected package's registration and the fork correspondence in its all-packages preflight, before any write; the fork decision must agree with the predicted tag.
The registry at `scripts/release/release-packages.json` classifies actual directory/npm identities as `fork` or `original`; an unregistered package or unsupported fork evidence blocks preparation, publication, and Release creation.
Workspace discovery and read-only version prediction remain independent of registration, and registration never authorizes publication.
When a fork release is selected, preparation commits its verified correspondence, decorated CHANGELOG section, and regenerated [table](pi-subagents-correspondence.md) together with the manifest.
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
