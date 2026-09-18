---
issue: 13
issue_title: "Fully undo #7 and restore merge-based upstream history"
---

# Restore the original upstream merge history

## Release Recommendation

**Release:** ship independently

This is fork-wide restoration, not a package-roadmap step or release batch.
The operator explicitly selected repairing the repository and GitHub Releases, followed by new releases of both `@jopqior/pi-subagents` and `@jopqior/pi-subagents-model-selector` on npmjs.org.
Do not publish under `@gotgenes`, republish an existing version, or infer a new version number in advance.
The package README migration notices below make both packages legitimately releasable through the existing workflow; repository-only history work would not do so.
Remote history migration requires a separate, concrete old/new-ref approval after rehearsal, before release dispatch.
Ordinary `/ship` must not attempt to fast-forward or force-push this migration.

## Problem Statement

Issue [#7] replaced the original upstream ancestry with an orphan import and replaced the real upstream merge with a single-parent aggregate.
The operator reversed that decision and requires the original commits and topology, not a bridge merge or a content-only revert.
Later releases now anchor the replacement history, so restoring only `main` would leave the unwanted graph reachable through published tags.
All modifications introduced by that decision, including later documentation and workflow dependencies, need explicit dispositions while unrelated work survives.

## Goals

- Restore original pre-change commit identities and the real two-parent merge, then replay all subsequent unrelated work.
- Remove the unwanted import and aggregate nodes from every intended retained branch and tag, locally and remotely.
- Restore normal three-way upstream merges, preserving upstream tag isolation, the disabled upstream push URL, and existing dirty-tree/branch/merge/rebase guards.
- Remove the dedicated [#7] plan and retro, its mechanism, and dependent operational or historical descriptions from the current tree.
- Preserve independent publishing, spawn-selection, chooser, display, and bounded-version fixes.
- Repair editable release references and publish fresh npm versions from the restored history, without misrepresenting immutable older artifacts.
- Treat the repository CLI and published Git-ref migration as **breaking**: use `feat!:` and an explicit `BREAKING CHANGE:` footer for restoring the CLI.
  Package runtime APIs, defaults, and configuration do not change; the repository-only breaking commit must not create a package major bump.
- Keep independently recoverable backups outside the restored repository and require rehearsal, review, and concrete approval before remote mutations.

## Non-Goals

- No bridge merge, graft, replace-ref, orphan replacement root, upstream squash, or wholesale reset that loses later work.
- No import of upstream tags, upstream push, upstream PR, package-scope rename, or change to runtime registry keys.
- No newer upstream integration during restoration: freeze the already-integrated upstream commit; test future merges in fixtures instead.
- No npm unpublish, deprecation, same-version overwrite, or claim that old provenance now attests the restored SHA.
- No implementation of [#12]'s general deferred-release sweep; this plan explicitly names its own release pair.
- No general shell framework, history-rewriting product, broad test-fixture extraction, or rewriting inherited upstream historical records merely because their issue numbers resemble fork numbers.
- Do not erase GitHub Actions runs, registry attestations, third-party clones/caches, or promise server garbage collection.
  Such evidence can outlive branch/tag replacement.

## Background

### Verified recovery points

Planning baseline: `a76152015e4d6946e37ece9717888dcc1b008aa1` on both local and remote `main`.
The planning commits themselves will extend the replay set and must be included in the execution snapshot.

| Object                                            | Full commit SHA                            | Disposition                                                   |
| ------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Original upstream fork point                      | `af980a236fd3ff043e3d432336b0f3de540fdd1b` | Preserve original ancestry                                    |
| Original merge first parent                       | `661111ea1ba8c31051b951738241199370c62ab1` | Preserve                                                      |
| Integrated upstream tip / merge second parent     | `045213317de608c04a7b6052b2b843e3a0f2176f` | Preserve; do not advance during migration                     |
| Original merge                                    | `2d8cea699b08afa0f6a2c06eeb1507a52d699636` | Restore unchanged                                             |
| Original post-merge tip before the abandoned plan | `7e55552da0373ad651a245b753fe9dc5a64a6638` | Restoration base                                              |
| Local recovery ref `refs/backup/pre-reshape`      | `fe79c5f44eee1d332cada25d3680e9aab80cfa6e` | Export outside repository before removing local recovery refs |
| Orphan import                                     | `9799f29d8fb81dafedc269ad821a5b0393e7aa73` | Must not remain branch/tag-reachable                          |
| Replacement aggregate                             | `01bc18fd21d58f8551931eb6d96ae76ca959c548` | Must not remain branch/tag-reachable                          |
| Last dedicated implementation/retro commit        | `c52da20b885cae3f30c399c6e364a6508db25c8a` | End of omitted implementation interval                        |

Measured: all 39 positional first-parent pairs from `af980a23..fe79c5f4` and `9799f29d..434f80c6` have identical trees.
The original fork-point tree equals the import tree; the original merge tree equals the aggregate tree.
Pair by sequence and parent structure, not tree alone: adjacent original commits can have identical trees.
The original base deliberately stops before the two dedicated planning commits; do not start at the backup tip and accidentally retain those artifacts.
Measured: 52 later first-parent commits lie in `c52da20b..a7615201`.
`git fsck --connectivity-only --no-dangling` succeeded against the available objects.

### Related work and current scope

Read [#2], [#3], [#4], [#7], [#8], [#9], [#10], and [#11], including their close comments: all are completed.
This issue supersedes [#7], not those independent capabilities.
Only [#12] is an open sibling; there are no open PRs or advertised pull refs at planning time.
The newest triage is `docs/triage/2026-09-02-backlog.md`, predating these fork changes.
Fallback unprefixed `0013` retros describe unrelated upstream issues, not previous work on this fork issue.
No package roadmap references this fork issue.

The root has an untracked `.pi/extensions/pi-permission-system/` directory.
Do not delete, stage, overwrite, or assume it is disposable; snapshot it separately before eventual checkout replacement.
Use an independent clone with independent objects for restoration, not a worktree sharing the live ref store.

### Published-ref inventory

Measured remote inventory: one branch (`main`), five tags, three GitHub Releases, and five npm versions.
No repository rulesets were returned; `main` protection returned “Branch not protected”.
Recheck these facts during the publication freeze; they are observations, not enduring permissions.

| Tag                                  | Old ref object SHA                         | Old peeled commit SHA                      |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| `pi-subagents-v1.0.0`                | `2c6dcd38428c467925b6b496cf3585ee32a1bd32` | Same; lightweight                          |
| `pi-subagents-v1.0.1`                | `012b1e596fb6b5c9b27ae00fea2b39d159a14123` | `3224b27f8c13e7728a228073457e516a59f3869e` |
| `pi-subagents-model-selector-v0.1.0` | `957ece11ecbbeb0523584d2d808ed433feb430ca` | Same; lightweight                          |
| `pi-subagents-model-selector-v1.0.0` | `464eed0184872176b50d417c65ffcb15641d3d7d` | `760b99f3a107b5263bd7a799cd63d39fb2e200dc` |
| `pi-subagents-model-selector-v1.0.1` | `80ea4e39fa1bb8e73a633d9a6f5df3ce844b089c` | `0a4570a4a8df88f523e430634ab3c5496cc9da4c` |

The annotated tags are unsigned.
Keep tag names and lightweight/annotated kinds; reproduce annotation metadata without claiming an old signature authenticates a changed object.
Each target is its corresponding replayed historical release commit, never the final cleanup tip.

GitHub Release IDs are `387977151` (core `1.0.1`), `387912504` (selector `1.0.1`), and `387890847` (selector `1.0.0`).
All three report `immutable: false`, `target_commitish: main`, no attached assets, and ordinary published/non-prerelease state.
The two initial manual-release tags have no GitHub Release objects; do not invent historical releases for them.
Retain existing Release identities, names, dates, and tag names; repair commit links and add a concise migration notice.
Changing `target_commitish` alone does not move an existing tag.
GitHub-generated source archives will follow the relocated tags and may differ in repository tooling from the original archives.

npmjs.org lists core versions `1.0.0`, `1.0.1` and selector versions `0.1.0`, `1.0.0`, `1.0.1`.
Metadata exposes provenance attestations for the three workflow-published versions; no `gitHead` was returned by the queried version metadata.
Capture actual tarballs, integrity values, and available attestations in the external backup rather than inventing a source mapping from absent metadata.
[npm policy] explicitly forbids reusing a package/version even after unpublishing it.

## Design Overview

### Separate restoration, current-tree repair, and publication

1. Snapshot and inventory the frozen input, including every ref, complete commit diffs, release JSON, workflows, package metadata, tarballs, and provenance.
2. Start the isolated candidate at the original `7e55552d` base.
   Replay the 52 later independent commits, plus subsequently approved planning/implementation commits, preserving authors, messages, empty commits, and unrelated hunks.
   Resolve conflicts against the original merge-era handbook, not by taking an entire side.
3. Record an old-to-new commit mapping as each replay completes.
   Preserve historical package subtrees at all five mapped tag targets byte-for-byte, including historical changelogs and source comments.
   Correct obsolete descriptions and links in later cleanup commits, not by falsifying those historical package snapshots.
4. Add the current-tree cleanup, real-merge tests, release-boundary pins, and user-facing migration notices to the isolated candidate.
5. Rehearse tag migration and push preconditions against a disposable bare remote, then independently review the candidate and its external evidence.
6. Obtain exact-ref approval and migrate remote refs; repair Release records, verify fresh-clone behavior and CI, then dispatch the approved new releases.

No restoration operation happens during this planning session.
The full audit and commit mapping live in the external recovery directory; a short user-facing migration notice explains consequences without retaining the abandoned implementation manual.
This plan and its stage notes identify removed objects as migration evidence, not as continuing operational instructions.

### Complete-diff audit and dispositions

Seed the audit from whole commits, not a path allowlist.
For every commit after the restored base, record old SHA, parent(s), every changed path/hunk, keep/drop/correct disposition, reason, and eventual mapped SHA or omission.
The following is the verified seed inventory; execution must account for new commits and resolve every row before approval.

| Commit or group                                                    | Disposition                                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Original `3025ca88`, `fe79c5f4` / rewritten `8f7d9dc9`, `434f80c6` | Omit dedicated abandoned plan/retro additions                                                                                                                |
| `163d88e8e919e0983fe4775e79d41e336684bb8d`                         | Drop script replacement and changes to `AGENTS.md`, `README.md`, and sync handbook                                                                           |
| `c979ef0e8b2492ac8f4cd6ea4d76c4118973765b`                         | Drop transplant recovery fix with the mechanism it served                                                                                                    |
| `6d91b22d032d239413d50618b4adf992485cc26f`                         | Drop dedicated build-stage retro                                                                                                                             |
| `1fae1fb917a0e3bbd4e9552e3d819bc553eb8c71`                         | Drop aggregate-specific lockfile wording; preserve independent manual lockfile regeneration from the original handbook                                       |
| `c52da20b885cae3f30c399c6e364a6508db25c8a`                         | Drop dedicated retro and exact added prompt-template paragraphs; this plan independently requires pre-mutation review and approval                           |
| `d29146af3cb152b9b6e7746eb695b4d492521d51`                         | Keep publishing identities, URLs, and product changes; adapt handbook hunk to original post-publish conflict guidance                                        |
| `3d4f1376d09163987c3057ebf81e25e092824696`                         | Keep npm disable entry and `1.0.0`/upstream `21.7.0` correspondence data                                                                                     |
| `ea579194bd74779ce78214d73fa29df2394777f8`                         | Keep first-publish plan; remove its claim that aggregation prevents upstream subjects appearing in changelogs                                                |
| `63baed14`, `d0ce4601`, `d89e2514`, `eb4e297b`, `30d95bef`         | Keep single model-name formatter, UI fixes, and product documentation; correct dependent conflict recipe, plan/retro, and JSDoc wording at the candidate tip |
| `6e194e35b2e8b9eaac4fc2b7fe34041d99fcf2cc`                         | Remove local-sync-ref planning gate and dependent retro prose; keep unrelated ship major-bump guard and package-scoped pnpm guidance                         |
| `97e03323`, `0b989746`, `1ccd8f5a`                                 | Keep version-fix rationale and unrelated lessons; correct removed-ref measurements and obsolete aggregate examples                                           |
| `a9c3cb46`, `c3792f79`, `025a09fa`, `3224b27f`, `a7615201`         | Preserve independent bounded-version helper, tests, CI prerequisite, release, and release-debt notes                                                         |
| Remaining commits in the enumerated later interval                 | Preserve complete diffs; enumerate each individually in the execution ledger, including all chooser changes and releases                                     |

Do not accept the audit agent's suggestion to keep the abandoned plan/retro: it conflicts with this issue's explicit acceptance criterion.
Likewise, its assertion that the first-publish plan is pre-change is contradicted by its actual aggregation sentence; that file must be corrected.
Search hidden tracked paths too, including `.pi/prompts/`, `.pi/skills/`, and `.github/`.
Match exact fork references rather than `Refs #7` as an unbounded prefix, which also matches unrelated upstream issue numbers.

### Merge behavior and structural review

Restore the original `scripts/upstream-sync.sh` implementation from `661111ea`, with `--merge` and no custom continuation protocol.
Use a conventional merge message such as `chore: merge upstream/main` at the merge invocation so normal hooks do not reject Git's default message.
Conflicts remain on `main` with Git's real `MERGE_HEAD`; recovery is `git add` plus `GIT_EDITOR=true git merge --continue`, or `git merge --abort`.
Do not quit the merge and transplant its tree.
After resolving, regenerate the lockfile from the repository root and follow the original manual conflict/verification checklist.
Remove automated identity/changelog recipes introduced solely for the discarded mechanism; keep their independent, pre-existing manual safety requirements.
The genuine ancestor graph replaces the local sync-base ref and synthetic state file.
Use ordinary ahead/behind and ancestry checks; a fresh clone needs no hidden ref reconstruction.

Design-review checklist: no new shared interface, dependency bag, parameter relay, output argument, reset family, or runtime discriminator is introduced.
The script owns local merge orchestration; Git owns merge state and recovery; existing release helpers own version derivation.
Do not extract doomed script procedures before deleting them or make unrelated changes to the existing `CLIFF_ARGS` convention.
The only package source edit is a comment in an already-forked `display.ts`; preserve the formatter's narrow input and sole-implementation invariant.
Both that path and the sync script have fork commits in `refs/sync/upstream-main..HEAD`; no upstream-clean production path needs a new fork patch.

### Ref migration and rollback boundary

Back up outside the checkout using a full bundle plus repository metadata/config, untracked-file snapshot, and exported service records.
Verify the bundle and restore it into a second independent clone; verify original merge parents and every current tag object there.
Do not use a backup tag or branch on the retained remote: it would retain the unwanted nodes.
Do not prune live objects or reflogs as part of this work.

At approval time, produce a manifest containing every retained/deleted ref, exact old object ID, exact proposed object ID, peeled tag target, and all planned GitHub Release edits.
Include local planning/restoration branches and `refs/backup/*`, `refs/sync/*`, remote-tracking refs, any newly found refs, and any in-progress state.
Intended remote retained refs are `main` and the five mapped tags, plus later newly generated release tags.
Other work must stop or be explicitly included; drift invalidates approval and requires a new snapshot/rehearsal.

Push all changed branch/tag refs atomically to the verified fork `origin`, naming every refspec and an explicit `--force-with-lease=<ref>:<old-object-id>` for each one.
For annotated tags the lease is the tag object, not its peeled commit.
Never use blanket `--force`, `--mirror`, or `--tags`.
If atomic push is unsupported or protection prevents it, stop rather than degrade to a partial migration.
After any transport failure, inspect remote refs before deciding whether to retry.

Git refs and GitHub Release API edits cannot form one transaction.
Save old Release JSON, apply idempotent body corrections after successful ref migration, and verify each object.
A failure keeps the issue open and blocks publishing until reconciled; do not rerun an old release workflow, whose source SHA belongs to the prior history.
Rollback before new publication uses the saved manifest and fresh leases, under renewed approval.
After new npm publication, rollback cannot remove the published evidence; prefer an explicitly approved forward correction.

### Links, historical evidence, and fresh releases

Correct current-tree fork commit links and abbreviated SHA citations using the mapping, including the two package changelogs.
This is the operator-approved one-time exception to the normal no-hand-edit changelog rule: change only affected references, not version headings, release dates, descriptions, or inherited upstream URLs.
Do not regenerate whole changelogs.
Resolve ambiguous abbreviations and repository ownership before replacing anything; leave unmapped external commits alone.
Historical tagged package snapshots remain untouched; the corrected current-tree documents will ship in the new versions.

Add a short migration notice to each package README, linking an absolute fork URL for the repository-level explanation.
Explain that source history was restored, old npm artifacts are unchanged, and new artifacts are built from the restored history.
Use `docs(pi-subagents): repair release references after history restoration` and the equivalent selector commit so the real release mechanism sees both documentation updates.
Do not bump versions by hand or use a meaningless runtime change to manufacture a release.

Inventory fork issue bodies/comments and workflow outputs containing changed commit URLs.
Add narrowly scoped correction notes to affected fork issue threads using the verified mapping, without rewriting other authors' historical statements; [#7]'s note should point to this restoration rather than pretend its removed implementation survives.
Immutable Actions logs, caches, existing npm tarballs, and attestations remain external limitations.
Keep their original values in the external archive and explicitly state that some old links may cease resolving.

Before dispatch, run both `next-version.sh` invocations, inspect both generated release sections, and confirm only the intended documentation changes are new.
Dispatch `release.yml` against `Jopqior/gotgenes-pi-packages`, naming exactly `pi-subagents pi-subagents-model-selector` and the approved restored HEAD SHA.
The operator approved npmjs.org and the `@jopqior` scope in planning; concrete versions and the final publish action are reconfirmed after derivation.
Verify new registry integrity/provenance, corresponding tags and Releases, and selector dependency resolution against the newly published core.

## Module-Level Changes

| Path                                                                                                                                               | Change                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/upstream-sync.sh`                                                                                                                         | Restore guarded real merge and conventional merge message; remove discarded CLI/state/type derivation and automatic recipes                                    |
| `test/upstream-sync/merge.test.mjs`                                                                                                                | New root-suite real-Git integration fixtures for merge topology, repeat/fresh-clone sync, conflict recovery, and preserved guards                              |
| `test/release/bumped-version.test.mjs`                                                                                                             | Extend in place with merged-ancestry and actual changelog assertions; keep existing tests                                                                      |
| `AGENTS.md`                                                                                                                                        | Remove the two added mechanism-specific rules; retain tag/push protections, npm registry rules, and independent testing lessons                                |
| `README.md`                                                                                                                                        | Restore merge-based sync description; preserve published package rows                                                                                          |
| `docs/upstream-sync.md`                                                                                                                            | Rebuild from original merge handbook, preserve later independent publishing correspondence and formatter guidance, restore real merge SHA                      |
| `.pi/prompts/build-plan.md`                                                                                                                        | Remove exact dedicated-change paragraphs identified by its complete diff; no general workflow redesign                                                         |
| `.pi/prompts/plan-issue.md`                                                                                                                        | Remove dedicated mutation examples/sequencing additions and the later obsolete local-ref gate; preserve unrelated requirements                                 |
| `docs/plans/f0007-reshape-upstream-history.md`, `docs/retro/f0007-reshape-upstream-history.md`                                                     | Absent from candidate current tree; archived externally                                                                                                        |
| `docs/plans/f0003-jopqior-pi-subagents-first-publish.md`                                                                                           | Correct obsolete changelog premise; preserve first-publication decisions                                                                                       |
| `docs/plans/f0011-bounded-next-version-walk.md`, `docs/retro/f0011-bounded-next-version-walk.md`                                                   | Correct removed-ref commands and obsolete examples without discarding the independent release fix                                                              |
| `packages/pi-subagents/docs/plans/f0010-tool-ui-shows-selected-model.md`, `packages/pi-subagents/docs/retro/f0010-tool-ui-shows-selected-model.md` | Remove obsolete mechanism descriptions; retain the display design, observed product behavior, and independent lessons                                          |
| `packages/pi-subagents/src/ui/display.ts`                                                                                                          | Remove mechanism-specific JSDoc sentence; retain sole formatter and no-inline constraint                                                                       |
| Both published packages' `README.md`                                                                                                               | Add concise user-facing source-history/provenance notice                                                                                                       |
| Both published packages' `CHANGELOG.md`                                                                                                            | Repair affected fork SHA links only in a later cleanup commit                                                                                                  |
| `docs/history-restoration.md`                                                                                                                      | New short migration record: user impact, clone recovery, publication limitations, and external archive identification; not a replacement implementation manual |
| Other tracked files found by mapped-SHA/link scan                                                                                                  | Correct verified fork references, recording every additional path in the audit before review; no blind global replacement                                      |
| `docs/plans/f0013-restore-merge-history.md`, matching retro                                                                                        | Planning/stage continuity; update only measured outcomes and handoffs                                                                                          |

Release workflow-generated changes to the two `package.json` files and changelogs occur only during the final authorized release.
No package architecture module tree or roadmap step changes: no runtime module is added, removed, renamed, or rewired.

Predicted unchanged, with evidence boundaries:

- `scripts/release/{lib,next-version,verify-cliff-parity,prepare-release,publish-released,create-github-releases}.sh`, `cliff.toml`, and `.github/workflows/{ci,release}.yml`: independent machinery; the existing bounded walk passed the merged-history probe.
  Rehearsal must verify real tagged history and both rendering invocations before retaining this prediction.
- `.pi/prompts/ship.md` and `.pi/prompts/tdd-plan.md`: later independent safeguards, not discarded-mechanism dependencies.
- `packages/pi-subagents/src/tools/spawn-config.ts`, lifecycle/foreground/background code and tests: runtime product behavior stays intact.
- All selector runtime source and tests: only publishing documentation changes.
- `.pi/skills/package-pi-subagents/SKILL.md` and architecture prose: the affected mechanism search found no specific obsolete rule to remove there; preserve upstream-domain statements about the separate `tintinweb` fork.
- `pnpm-lock.yaml`: no planned dependency edit; any change from installation/release must be explained, not accepted as incidental noise.

## Test Impact Analysis

No new production extraction is needed.
New root integration tests cover the real sync script, which currently has no maintained harness.
Extend the existing release test file instead of extracting its small fixture helpers; the Tidy-First assessment's conditional preparatory extraction is therefore unnecessary.
No existing test becomes redundant, and no runtime assertion should be weakened for history restoration.

Use independent scratch Git repositories, explicit test identities, isolated Git configuration, and local bare remotes.
Do not mock merge results or ancestry: assertions inspect actual parents, merge bases, file contents, tags, and Git recovery state.
A narrowly scoped transport wrapper may redirect only `fetch` and `ls-remote` to local remotes while forwarding all other commands to the real Git binary.
Do not install global `url.*.insteadOf` rules: measured `git remote get-url upstream` expands them and makes the script's expected-URL guard fail.
The wrapper must preserve arguments and exit status, record explicit `--no-tags`, and not implement any business logic being tested.
Fixtures contain colliding upstream tag names so an accidental import is observable.

### Planning measurements

Git `2.53.0`, git-cliff `2.14.1`; disposable fixture with a real merge, an old upstream breaking commit, and an out-of-scope release tag:

| Case                                                | Measured result                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| No changes after tag                                | `demo-v1.0.0`                                                      |
| New fork fix after tag                              | `demo-v1.0.1`                                                      |
| Remove the helper's range in the same fix scenario  | `demo-v2.0.0`                                                      |
| Replace range with `HEAD..HEAD` in the fix scenario | `demo-v1.0.0`                                                      |
| Merge a genuinely new upstream breaking commit      | `demo-v2.0.0`                                                      |
| Render `--unreleased` after that merge              | Old upstream break absent; new upstream break and fork fix present |

The fixture versions are measured test outputs, not proposed package releases.
Live baseline: both published packages currently print no next tag and report current `1.0.1`.
`verify-cliff-parity.sh` exits nonzero for eight untagged packages out of ten, while both published-package rows are healthy.
Preserve and account for that existing baseline rather than accepting all failures or claiming the entire command is green.

## Invariants at risk

| Constituency / invariant                                             | Verification                                                                                                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fork maintainers: original identities and real ancestry              | Original merge SHA/parents unchanged; all original restored commits reachable; no unwanted node reachable from any retained branch/tag                                                                 |
| Existing users: unrelated later work preserved                       | Per-commit diff ledger plus byte-identical package subtrees at every mapped historical tag; full root and recursive package suites                                                                     |
| Existing users: chosen model and thinking remain truthful            | Existing `test/display.test.ts` cases for `formatSpawnModelName` and `overlaySpawnPresentation`, including pending selection and selected-model comparison; opened during planning, not mock-only pins |
| Release consumers: old upstream changes do not release twice         | Extended real-Git `bumped-version.test.mjs`, mapped-tag rehearsal, and complete generated-section inspection                                                                                           |
| Release consumers: newly merged upstream changes still release       | New upstream-breaking fixture; no first-parent-only workaround                                                                                                                                         |
| Maintainers: tag namespace and upstream push protection              | Offline sync integration tests plus fresh-clone remote configuration/ref comparison                                                                                                                    |
| Published-package consumers: old artifacts are not silently replaced | Archived metadata/tarball hashes/attestations compared after migration; new versions have new publication evidence                                                                                     |
| Human reviewers: no hidden discarded instructions                    | Complete-diff dispositions and repository-wide exact-mechanism/reference search, including hidden tracked files                                                                                        |

## TDD Order

The implementing session uses `/tdd-plan` for the reversible work and stops at the explicit remote gate.
All production, test, documentation, history-replay, and tag-rehearsal work happens in the isolated candidate before remote publication.
Do not let ordinary plan completion or `/ship` bypass that boundary.

1. **Capture input and prove recovery without changing the live graph.**
   Freeze publishers and peer work; refresh the inventory read-only and archive all refs, complete diffs, release records, npm artifacts, untracked material, and configuration outside the checkout.
   Verify the bundle and restore it independently; establish the complete prefix and later-commit mapping ledger.
   A disposable restoration of the backup must resolve all five old tag objects and the original merge parents.
   Commit only a concise stage breadcrumb, suggested `docs(retro): record verified history recovery inputs (#13)`; do not commit the backup or a ref that keeps the old graph alive.

2. **Build the candidate's recovered history and mapped historical tags.**
   Start from `7e55552d`, omit the dedicated abandoned plan/implementation interval, and replay the enumerated later work in order.
   Review conflicts hunk-by-hunk; preserve empty commits and author attribution.
   Map all five tags to their corresponding replayed commits, preserving historical package subtrees exactly.
   Export the replay script, decisions, and mapping externally so another isolated run can reproduce and verify them.
   Verification: exact original merge identity; package-tree equality at each tag; expected original ancestry restored; unwanted import/aggregate absent from retained refs.
   Adversarial rehearsal: point one retained test tag back to an old release SHA; the reachability audit must fail even when `main` alone passes.
   This step replays existing commits rather than inventing a single aggregate “restore history” commit.

3. **Pin and restore normal upstream merge behavior.**
   Add `test/upstream-sync/merge.test.mjs`; exercise it against a scratch copy of the pre-restoration script to demonstrate the two-parent scenario fails, then against the restored candidate.
   Restore the script and its conventional merge message; update direct CLI docs in the same commit so no committed step prescribes a removed flag.
   Test status-only no HEAD change, divergent two-parent merge, already-integrated no-op, repeated upstream merge, fresh clone without private refs, conflict resolve/continue, conflict abort, and preserved branch/origin/dirty-index/dirty-worktree/merge/rebase guards.
   Inspect actual parent OIDs and first-parent content, not just exit codes.
   Killing mutations by class:
   - Replace the merge invocation with `git merge --squash upstream/main`: successful divergence and second-parent assertions must fail.
   - Replace it with `true`: divergence/content and repeat-sync assertions must fail.
   - On a failed merge, add `git merge --quit` before returning: the fixture's `GIT_EDITOR=true git merge --continue` and `git merge --abort` paths must fail instead of completing/restoring normally.
   - Delete explicit `--no-tags`: the recorded-fetch-arguments assertion must fail; separately inject a new local tag during fetch and remove the tag-set comparison to kill the rejection test.
   - Delete the upstream `pushurl DISABLE` assignment: the protected-push-URL assertion must fail.
   - Delete each precondition invocation/check in turn: its matching hostile-state fixture must fail.
     Use unrelated dirty paths that Git itself could merge around for dirty-index/worktree cases; for in-progress merge/rebase cases, assert the script's exact refusal diagnostic as well as unchanged HEAD/index/state, since Git may independently reject the same operation.
     Wrong-branch and wrong-origin fixtures must also assert the script-owned refusal and no merge mutation, not merely a nonzero exit.
   Verify root tests, shell syntax, lint, and type checks.
   Suggested commit: `feat!: restore normal upstream merge synchronization (#13)`.
   Footer: `BREAKING CHANGE: scripts/upstream-sync.sh uses --merge; finish conflicts with git merge --continue or abort with git merge --abort. The former synchronization flags are removed.`

4. **Pin release derivation and rendering over restored ancestry.**
   Extend `test/release/bumped-version.test.mjs` in place, preserving the three current tests.
   Add the measured merge fixture classes above, both lightweight/out-of-scope and annotated tag boundaries, and real changelog assertions for `--unreleased` and the tagged `--latest` path used by the release scripts.
   These are characterization pins: the unchanged bounded helper is expected to pass, so demonstrate discrimination with mutations rather than pretending the current helper is broken.
   Killing mutations: remove the range to kill the old-upstream-plus-new-fix boundary case; replace it with `HEAD..HEAD` to kill both new-fix and newly merged breaking cases; return an invented next tag unconditionally to kill the no-change class.
   For rendering, widen the requested interval to include the old upstream commit and verify its absence assertion fails; remove the new upstream commit from the fixture's merge parent and verify the presence assertion fails.
   Verify both published-package live rows in the candidate, preserve eight known untagged-package results, and inspect rendered sections.
   Suggested commit: `test: pin release boundaries across upstream merges (#13)`.
   Do not change `lib.sh` or the release workflow unless the full rehearsal contradicts the current prediction; if it does, stop and amend the design before implementation continues.

5. **Finish the full content audit and repair user-facing references.**
   Apply all remaining Module-Level Changes, delete the two dedicated artifacts, remove exact dependent prompt additions, and retain independent product work in mixed commits.
   Correct current-tree SHA references from the completed mapping; keep historical tagged package snapshots unchanged.
   Add the two README notices and short repository migration record, and prepare the three Release body edits outside the repository.
   Suggested checkpoints: `docs: remove obsolete history integration instructions (#13)`, followed by the two package-scoped documentation commits named above.
   Verify the whole-tree diff against the frozen input, every audit disposition, links, exact forbidden-mechanism matches, and original package runtime behavior.
   Clear the rumdl cache after deleting linked artifacts; run `pnpm exec rumdl check` on changed Markdown and full lint.
   For prompt commands, dry-run each surviving prescribed command in the disposable fixture: status does not move HEAD; `--merge` creates real ancestry; `git merge --continue` retains both parents; abort restores pre-merge HEAD/tree.
   Do not replace removed instructions with another generic history-migration framework.

6. **Rehearse the complete cutover and obtain pre-completion review.**
   Seed an independent bare remote with frozen old refs, then apply the candidate manifest using the exact atomic, explicit-lease shape proposed for production.
   Verify all five tags and `main`; deliberately change one remote ref and confirm stale-lease rejection leaves every other ref untouched.
   Verify rollback to the saved old manifest in that disposable remote, and repeat the forward migration.
   Clone the migrated remote fresh without local alternates; verify graph reachability, package snapshots, root tests, recursive package tests, `pnpm run check`, `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`, and `pnpm fallow dead-code`.
   Pack both packages and inspect shipped docs, built public declarations, package names, and selector dependency rewriting.
   Re-run derivation/rendering and archive raw outputs; inspect warnings as well as exit status.
   Dispatch a fresh `pre-completion-reviewer` with the issue, candidate, raw audit, manifests, backup verification, tests, and rehearsal logs rather than a precomputed coverage claim.
   Resolve every blocker and commit a stage handoff such as `docs(retro): record reviewed history migration candidate (#13)`.
   Stop here unless the operator explicitly approves the concrete old/new ref manifest and Release edits.

7. **Approved remote migration and publication — final, non-TDD operation.**
   This is not an ordinary implementation commit and runs only after step 6's review and explicit approval.
   Verify repository identity, remote URL, all expected old refs, absence of active writers, and backup recoverability again.
   Execute the approved atomic explicit-lease push, reconcile GitHub Release bodies and affected fork issue reference notes, and verify exact remote results with a fresh clone.
   Remove or relocate obsolete local branches/refs only as listed in the approved local manifest; never discard unrelated untracked work.
   Verify CI at the restored SHA using explicitly targeted `gh` commands.
   Present derived versions and release notes, reconfirm publication, and dispatch both named `@jopqior` packages through the existing release workflow.
   Verify new npm artifacts/provenance and all resulting tags/Releases; confirm old registry artifacts retain their original integrity.
   Close the issue only after the complete migration and chosen publication scope succeed, reporting immutable external limitations and the external recovery archive.

## Risks and Mitigations

- **Incomplete audit or mixed-commit loss:** complete-diff ledger, positional prefix verification, per-tag package-tree equality, final-tree review, and full suites; a keyword grep is only a cross-check.
- **A retained tag or local branch keeps the unwanted graph alive:** enumerate all ref namespaces, explicitly approve retained/deleted sets, and audit reachability per ref; do not test only `main`.
- **Dead old links and false provenance:** repair editable current records, preserve historical snapshots and external evidence, publish new versions, and disclose immutable old references rather than promise they all redirect.
- **Old upstream breaks inflate the next version:** preserve [#11]'s bounded walk; the no-range failure was measured in an isolated merged-history fixture.
- **A fake green offline merge test:** route network calls only; real Git performs all commits/merges and tests assert actual topology and conflict recovery.
- **Accidental publication or partial cutover:** freeze writers, keep the candidate isolated, require reviewer and exact manifest approval, use atomic leased ref updates, and withhold release dispatch until remote/Release reconciliation is complete.
- **Recovery source disappears:** independently verified external bundle and service/artifact archive precede every migration; no garbage collection or backup cleanup is part of this plan.
- **Scope creep while reversing workflow rules:** remove exact introduced/dependent paragraphs, preserve unrelated safeguards, and keep this one-time gate in this plan rather than redesigning `/ship`.
- **New release metadata differs from old npm bytes:** expected and explicitly disclosed; version numbers are new and old package/version pairs remain immutable.

## Open Questions

No product-direction question remains: the operator chose full repository/Release repair plus new npm releases, accepting the registry's immutable old artifacts.
Execution-time gates remain deliberately unresolved until evidence exists: external backup location, frozen final replay set, exact candidate SHAs/tag objects, complete local-ref disposition, final Release/link corrections, reviewer verdict, and derived new package versions.
None is permission to guess or force-push early.
No speculative follow-up issue is created; the only separately deferred workflow concern is existing [#12].

[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
[#4]: https://github.com/Jopqior/gotgenes-pi-packages/issues/4
[#7]: https://github.com/Jopqior/gotgenes-pi-packages/issues/7
[#8]: https://github.com/Jopqior/gotgenes-pi-packages/issues/8
[#9]: https://github.com/Jopqior/gotgenes-pi-packages/issues/9
[#10]: https://github.com/Jopqior/gotgenes-pi-packages/issues/10
[#11]: https://github.com/Jopqior/gotgenes-pi-packages/issues/11
[#12]: https://github.com/Jopqior/gotgenes-pi-packages/issues/12
[npm policy]: https://docs.npmjs.com/policies/unpublish
