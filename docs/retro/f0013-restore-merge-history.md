---
issue: 13
issue_title: "Fully undo #7 and restore merge-based upstream history"
---

# Retro: #13 — Fully undo #7 and restore merge-based upstream history

## Stage: Planning (2026-09-18T14:25:31Z)

### Session summary

Committed `docs/plans/f0013-restore-merge-history.md` as `3412da1e19b3cd50bc849bfc583e84ea3bf4406a`, covering complete-diff audit, original-history recovery, mapped release tags, real-merge integration tests, release-boundary verification, and an explicitly gated remote migration.
Verified recovery objects and published references without changing history or remote services; disposable git-cliff probes exercised merged ancestry and killing mutations.
The operator chose repository and GitHub Release repair followed by fresh npm releases of both `@jopqior` packages, accepting that old npm artifacts cannot be overwritten.

### Observations

- `git pull --ff-only` reported already up to date; planning began at `a76152015e4d6946e37ece9717888dcc1b008aa1` and was committed on `issue-13-restore-merge-history`.
  The pre-existing untracked `.pi/extensions/pi-permission-system/` directory was left untouched.
- Original merge `2d8cea699b08afa0f6a2c06eeb1507a52d699636` is available through the local recovery ref.
  All 39 paired first-parent trees match; the restoration base precedes the two dedicated abandoned planning commits, and 52 later commits existed before this planning session.
- Measured remote inventory: one branch, five tags, three mutable GitHub Releases with no attached assets, no advertised pull refs, and five npm versions.
  All five tags must migrate, not just `main`; exact replacement SHAs and remote updates remain unapproved until isolated rehearsal and fresh review.
- The operator asked whether retaining tag names constrains restoration and whether old commit links may break.
  The plan separates tag names from targets, preserves historical package trees at mapped tags, repairs editable current references in later documentation commits, and records immutable npm/provenance limitations.
  After reading npm's official unpublish policy, the operator selected new publication rather than trying to reuse old versions.
- The independent release fix from fork issue 11 stays.
  With git-cliff `2.14.1`, a merged old upstream breaking commit below the release tag stays excluded; a new fork fix bumps patch, and a newly merged upstream breaking commit bumps major.
  Dropping the bounded range reproduces a false major; the live baseline has two healthy published-package rows and eight expected untagged-package parity failures.
- Complete-diff audit found dependent material outside the sync script: prompt-template additions, the first-publish plan, display JSDoc, and the issue 10/11 plans and retros.
  Reject the audit agent's suggestion to retain the dedicated abandoned plan/retro: the issue explicitly requires their removal.
  Also reject the assessor's statement that the first-publish plan needs no correction; its current changelog sentence explicitly depends on aggregation.
- The initial `sonnet-5` dispatch failed because that model is unavailable; the audit was relaunched with a supported model request.
  The first Tidy-First agent was accidentally stopped before tool execution and was respawned at the operator's request.
  Extend `test/release/bumped-version.test.mjs` in place, so the assessor's conditional fixture extraction is unnecessary.
- A direct probe contradicted the assessor's claim about transport rewrites: `git remote get-url` expands `insteadOf` mappings.
  The plan therefore limits offline transport redirection to `fetch` and `ls-remote`, keeping real Git ancestry and conflict behavior under test.
- No implementation, history rewrite, remote mutation, or npm publication ran.
  The next stage is `/tdd-plan`, with isolated reconstruction and explicit pre-publication approval rather than ordinary `/ship` convergence.

#### Deferred tidyings

- `scripts/upstream-sync.sh` — do not refactor procedures that restoration deletes; no separate cleanup is warranted.
- `test/release/bumped-version.test.mjs` and `test/upstream-sync/merge.test.mjs` — avoid a generic cross-domain Git fixture; their transport and release-boundary arrangements differ.
- `packages/pi-subagents/src/ui/display.ts` — preserve formatter signature, body, consumers, and sole-implementation constraint; only obsolete mechanism-specific commentary is in scope.

## Stage: Implementation — Recovery inputs (2026-09-18T15:18:57Z)

### Session summary

The operator confirmed a writer/publication freeze and approved the external recovery directory `/home/whh/projects/gotgenes-history-recovery/issue-13-20260918T150901Z/`.
Archived a complete bundle, Git metadata/configuration, untracked files, remote/local ref inventories, complete commit diffs, GitHub records, and all five published npm tarballs with available attestations.
The baseline passed type checking, root lint without warnings, all 6,973 tests, and root dead-code detection.

### Observations

- Bundle verification and an independent restore passed connectivity checks, resolved all five old tag objects, and recovered the original merge with both original parents.
  All five npm tarballs matched registry integrity values.
- Frozen input is `f0914c7d16e906f4fb2077adf677b7c3bc78d080`; its 54 later commits include both planning commits.
  Remote refs were rechecked without drift; no active run appeared in the captured Actions response.
- Forty prefix mappings, including the original root pair, have equal trees.
  Replayed all 54 later commits in the isolated candidate; only the handbook hunks in `d29146af3cb152b9b6e7746eb695b4d492521d51` and `30d95bef32978dfce03e120574e9ffaa892ffc02` required conflict adaptation.
  Every replay preserves author/message metadata and non-handbook patch identity.
- All five candidate tag targets preserve both historical package trees exactly, and annotated tags preserve annotation metadata while changing the target.
  An adversarial old-release tag made the per-ref reachability audit fail; removing it restored green.
- Exported resolved per-commit patches and metadata reproduce all 54 exact candidate commit IDs in a second independent clone.
  Raw evidence, mapping, and scripts remain outside the repository; the complete-diff audit is still in progress.
- The recovery breadcrumb was committed after replay into the candidate rather than into the live graph, keeping the frozen input unchanged.
  The initial branch-detection command mistakenly also attempted a trunk-only pull; it failed for missing tracking information without merging, followed by the required fetch.
- No live branch/tag was rewritten, no GitHub mutation ran, and no publication occurred.
  Step 3 verification and the remaining content/release/cutover work are not yet complete; no pre-completion verdict is claimed.

## Stage: Implementation — TDD (2026-09-18T17:08:28Z)

### Session summary

Completed reversible plan steps 1–6 in the independent candidate, preserving 54 replayed commits and all five historical tagged package snapshots while restoring native merge synchronization and removing dependent instructions.
Two test cycles added 19 real-Git merge tests and six release-boundary tests, taking the complete suite from 6,973 to 6,998 passing tests.
Atomic ref replacement, stale-lease rejection, rollback, repeated forward migration, and independent fresh-clone verification passed offline; production migration and publication remain unapproved.

### Observations

- Candidate checkout: `/home/whh/projects/gotgenes-history-recovery/issue-13-20260918T150901Z/candidate`.
  The external archive contains `approval-manifest.json`, the frozen bundle and service records, replay mappings and reproducible per-commit patches, complete-diff audit records, raw mutation logs, and the disposable cutover remotes.
  The live checkout remains on its original issue branch with its unrelated untracked directory untouched.
- Pre-completion reviewer: WARN at `0aaa30c8eb800053888da4bc29f495163aa0d64e`.
  The reviewer independently checked the candidate and reported no blocking findings; the sole warning was the missing final implementation/rehearsal stage entry, supplied here.
  All deterministic checks passed, with zero lint warnings; package architecture and roadmap behavior remain unchanged.
- Step 3 reached a genuine old-script red after supplying its required baseline: synchronization succeeded but produced one parent rather than the required two.
  Mutations covered merge omission, squash replacement, lost merge state, tag isolation, push protection, and precondition checks, including both rebase-state branches.
  Git itself rejects staged unrelated paths, so the dirty-index pin checks the script-owned diagnostic and unchanged state rather than assuming Git accepts that merge.
- Step 4 preserved the original three release tests and the production release helpers.
  An explicit widened range does not defeat the renderer's tag-reachability boundary; the successful rendering mutation removes the unreleased-only selection instead, with the ineffective range probe retained as a negative control.
- Complete-diff review required two handbook conflict adaptations during replay and additional current-tree corrections in the issue-3 and selector issue-4 retros.
  Removed residual historical descriptions rather than retaining tombstone instructions, and verified historical comparisons against explicit upstream and restored planning commits.
  Historical tagged package trees remain unchanged; current changelogs alter only affected fork commit links.
- The original merge script was recovered through replay, so its new implementation commit changes only the merge message and adds integration coverage.
  A separate documentation checkpoint makes native continuation and abort explicit.
  The issue-13 plan remains frozen migration evidence; this stage records measured deviations and the handoff instead of rewriting its input inventory.
- Both published-package version previews remain patch releases; their exact derived tags and rendered sections are in the external packet.
  Eight untagged-package parity failures remain the known baseline, not new regressions.
  The disposable latest-section preview must use an in-scope tag target: tagging the core at a selector-only commit prints an unreleased heading, unlike the production release commit that writes each named package manifest.
- Both inspection tarballs passed the allowlist audit; the core's public declarations passed an external consumer type check, and the selector's workspace dependency became the current core version range.
  Those locally packed, unchanged-version tarballs are inspection artifacts only and must never be published.
  New-version dependency resolution and provenance verification belong to the approved publication step.
- The approval packet contains six remote ref replacements, explicit local-ref dispositions, three Release body edits, and eight additive issue correction notes.
  None has been applied to production.
  Step 7 requires approval of the exact final packet, renewed old-ref/writer/backup checks, and later reconfirmation of publication; ordinary `/ship` or `/sync-worktree` must not attempt this migration.

## Stage: Migration and Publication (2026-09-19T08:45:31Z)

### Session summary

Completed plan step 7 after renewing the writer/publication freeze and obtaining approval of a revised exact-ref packet.
Atomically replaced remote `main` and all five historical tags with explicit per-ref leases, reconciled three Release bodies and eight issue correction notes, and installed restored `main` locally without changing the existing untracked directory.
After successful fresh-clone verification and CI, the operator separately approved publication of `@jopqior/pi-subagents@1.0.2` and `@jopqior/pi-subagents-model-selector@1.0.2` to npmjs.org.
Both publications and their GitHub Releases succeeded through [release run 35432681523](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/35432681523).

### Observations

- Initial revalidation rejected the previously approved packet: local `refs/remotes/upstream/main` held `6b51c0b1a1eeb83a528499a3ed9151e044f560cd` rather than the frozen integrated upstream commit.
  Its reflog records a prior-session fetch from a disposable fixture at `2026-09-18T23:32:01+08:00`; the remote production refs and editable service records had not drifted.
  No production mutation occurred under that invalidated approval.
- Archived the drifted live graph, Git metadata, reflog, and refreshed untracked snapshot externally, then independently restored the original backup and verified all historical tag objects and original merge parents.
  Repeated atomic forward/rollback/stale-lease/fresh-clone rehearsal and added a local-install rehearsal that preserved untracked file hashes.
  The operator approved `approval-manifest-renewed.json`, SHA-256 `200f395e47ccf81825ffb63b93f6c4fd9af7fe02c7f9ffd2968c342ec30b8dce`.
  Its only changed ref disposition restores the accidentally overwritten local upstream tracking ref; candidate HEAD and all remote/service payloads remain unchanged.
- Restored candidate `a57fc4567c2d206d9b5cff19996b42f2152ac8e6` passed [CI run 35432449727](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/35432449727).
  A fresh production clone verified every migrated ref, original ancestry and merge parents, absence of the discarded nodes from retained refs, and byte-identical historical package trees.
  The approved obsolete local refs were removed; upstream push blocking and tag isolation remain configured.
- Release commit `788f64093ce023e12ac491355563004f1610142f` is a direct child of the approved candidate and passed [CI run 35432692126](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/35432692126).
  Both new release sections contain only the inspected documentation entries, and both next-version queries now report nothing pending.
  The nonblocking Fallow full-report step emits an exit-1 annotation; the workflow succeeds and its separate required dead-code gate passes.
- Downloaded all seven registry tarballs and verified their integrity hashes.
  The five older tarballs and their available attestations exactly match the external backup.
  New tarballs contain the intended public files and exclude internal plans, retros, and tests; core declaration bundles are present, and the selector dependency is `^1.0.2`, which the registry resolves to the new core version.
- Verified both new provenance bundles cryptographically with `gh attestation verify`, enforcing the fork repository, release workflow, `main` source ref, and candidate source digest.
  Provenance records the workflow-trigger SHA `a57fc4567c2d206d9b5cff19996b42f2152ac8e6`; the publish job checks out release commit `788f64093ce023e12ac491355563004f1610142f`.
  Do not describe the provenance source field as the release commit.
- All new and preserved tag/Release records were rechecked after publication, including exact historical Release bodies and preserved identity fields.
  Older Actions records, registry provenance, third-party clones, and caches remain outside the ref migration; no garbage collection or deletion of external evidence was attempted.
  Recovery inputs and execution evidence remain at `/home/whh/projects/gotgenes-history-recovery/issue-13-20260918T150901Z/`, with this stage's raw records under `logs/step7/`.
- The operator approved the closing text and requested completion of the remaining stage-note commit, push, and issue closure only.
  The final interactive `/retro 13` is explicitly deferred to a later session.
  Ordinary `/ship` and `/sync-worktree` were not used; no further release dispatch is needed for this issue.
