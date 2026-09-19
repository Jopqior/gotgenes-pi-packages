# History restoration

This repository's git history was restored to the original upstream merge graph ([#13]).
This supersedes [#7]; later independent work was replayed on top of the original ancestry.
The five release tags were moved to corresponding replayed commits, retaining both historical package directory trees byte-for-byte at each tag.
GitHub-generated source archives follow the relocated tags and may differ in repository tooling outside those package directories.

## What changed and what did not

- Commit identities across the restored range changed.
  Every replayed commit has a new SHA, so links that name an old fork commit SHA — in issues, reviews, local clones, or caches — may keep resolving as external evidence or cease resolving.
  GitHub Actions runs, registry attestations, and third-party caches are external evidence that this restoration does not erase.
- Already-published npm artifacts retain their original bytes and integrity values.
  Where provenance was published, it still attests the original build, not the restored SHA; moving a tag does not re-attest an artifact.
- New releases are cut from the restored graph once dispatched.
  Until a release actually runs, no new version exists.

## Migrating an existing clone

An old clone's `main` and tags point into the discarded graph.
Keep that clone as a recovery copy, including its local branches, stashes, and untracked files.
Start with a fresh sibling clone:

```bash
git clone https://github.com/Jopqior/gotgenes-pi-packages ../gotgenes-pi-packages-restored
```

Reapply reviewed local changes in the new clone and copy any needed untracked files.
Do not import the old branch/tag namespace or copy its `.git` directory into the new clone.
Avoid hard resets or forced ref updates as a shortcut for preserving local work.

## Evidence

The external recovery archive `issue-13-20260918T150901Z` was deleted with operator approval on 2026-09-19, after migration, publication verification, and the final retrospective.
Its frozen input inventory, commit mapping ledger, bundles, and detailed verification records are no longer available from that archive.
The committed plan and retrospective retain the migration summary; earlier statements that the external archive was retained describe its status at that time.
This cleanup does not affect the restored repository or published npm artifacts.
This document records the migration's user-visible consequences only; it is not an implementation manual, and the restoration procedure is not repeated here.

[#7]: https://github.com/Jopqior/gotgenes-pi-packages/issues/7
[#13]: https://github.com/Jopqior/gotgenes-pi-packages/issues/13
