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

## Stage: Final Retrospective (2026-09-19T09:02:32Z)

### Session summary

Reviewed the planning, implementation, migration, publication, and follow-up conversations, including the implementation agents' transcripts rather than relying only on stage summaries.
The restoration preserved 54 replayed commits and five historical package snapshots, added 25 tests, and completed separately approved migration and publication.
This retrospective changes no runtime behavior, release state, or external recovery files.

### Observations

#### What went well

- Exact local-ref revalidation caught a fixture-induced change that candidate tests and remote-only checks did not detect.
  The migration session invalidated the earlier approval, archived the drift, repeated remote and local-install rehearsals, and obtained approval of the revised packet before production mutation.
- Historical snapshot preservation and current-document repair were kept separate: mapped tags preserved package trees while later documentation commits repaired editable links.
  Publication verification distinguished the workflow-trigger digest from the release commit and verified both new provenance signatures without claiming old artifacts had changed.

#### What caused friction (agent side)

- `instruction-violation` — self-identified across agent stages: a step-3 disposable probe invoked `bash "$OLD" --sync` from the live checkout before rerunning it with the fixture working directory.
  The script discovered its repository from the caller's working directory; redirecting fetch transport to a scratch remote did not isolate the destination ref store.
  The child noticed the working-directory mistake but neither audited the live refs nor reported the side effect; the migration session later identified it through the reflog.
  Impact: live `refs/remotes/upstream/main` changed to a fixture commit, requiring a refreshed backup, revised approval packet, repeated rehearsals, and renewed operator approval.
- `instruction-violation` — user-caught: the implementation handoff requested approval of `approval-manifest.json` without translating it into an interactive decision flow.
  The operator asked whether the JSON was the approval target, then explicitly requested `ask_user` because the file was difficult to review.
  Impact: two clarification turns before five understandable approval gates; the approved machine-readable packet itself did not need changing for presentation.
- `missing-context` — the planning audit recommended retaining the dedicated discarded artifacts despite the issue's removal requirement; the Tidy-First assessment incorrectly described Git URL rewriting and the first-publish plan's dependencies.
  Direct source inspection and a Git probe corrected those claims before the plan landed.
  Impact: additional verification and rejected recommendations, not shipped defects.
- `premature-convergence` — the first step-3 completion report had 18 passing tests but omitted actual second upstream advancement, an existing colliding local tag, and the independent `rebase-merge` guard case.
  Its old-script red stopped at a missing prerequisite rather than demonstrating the topology difference.
  Impact: the parent requested six concrete corrections, the child supplied a second pass, and the parent reran full checks before `feat!: restore normal upstream merge synchronization (#13)`.
- `instruction-violation` — self-identified: implementation combined branch discovery with a trunk-only pull on the issue branch.
  Impact: one failed pull with no merge, followed by the required fetch; the existing branch rule was already explicit.
- `wrong-abstraction` — post-publication backup advice led with retention recommendations before distinguishing operational dependencies from optional recovery evidence.
  The operator had to ask which files referenced the archive; a later search established documentary references rather than runtime dependencies.
  Impact: an extra explanation turn, with no deletion or rework.

#### What caused friction (user side)

- The request to replace JSON review with sequential questions was a useful interface correction, not missing technical context the operator should have supplied.
  Agents should present decisions in terms of effects and preserve exact identifiers in the backing artifact.
- A Tidy-First agent was accidentally closed and had to be respawned at the operator's request.
  Impact: one interrupted dispatch; the completed independent audit did not need rerunning.
- Future archive-cleanup discussions can start with the desired retention outcome, but the agent must first explain whether the archive is an operational dependency.
  No archive deletion or sync-script removal is authorized by those questions or by this retrospective.

### Diagnostic details

- **Model-performance correlation** — parent planning, TDD, and migration turns ran on `openai-codex/gpt-6-astra`.
  Planning audit, implementation full-diff audit, merge-test implementation, and pre-completion review ran on `xai/grok-4.6`; Tidy-First ran on `zai-coding-cn/glm-5.3-flash`; release tests and content cleanup ran on `zai-coding-cn/glm-5.3`.
  The requested unavailable `sonnet-5` audit and cancelled assessor did not produce completed assessments.
  The flash assessor's unprobed Git claim is a judgment-task mismatch worth avoiding; the merge-test agent's missed cases and live-ref side effect also show that a stronger model name is not an isolation guarantee.
- **Feedback-loop gap analysis** — baseline checks preceded replay, targeted tests and mutations ran during implementation, and full checks ran before the merge-test commit and in fresh rehearsal clones.
  The gap was outside the candidate: validation checked candidate files and production remote refs, not the live checkout's local refs/configuration after the disposable probe.
  A local snapshot comparison immediately after that probe would have surfaced the incident before the approval packet was assembled.
- **Unused-tool detection** — delegation and direct Git probes were already available and used; another exploratory agent would not have prevented the working-directory error.
  Explicit subprocess working directories, repository-root assertions, and before/after live-ref comparisons were the missing controls.
- **Evidence boundaries** — source sessions are the root-session files beginning `2026-09-18T13-57-29-933Z`, `2026-09-18T15-07-05-207Z`, and `2026-09-19T08-29-31-303Z` under the repository's Pi session directory.
  The decisive probe is in the TDD session's `tasks/2026-09-18T15-17-34-684Z_01a0b518-295c-73d8-933f-bf592be28e8e.jsonl`; migration evidence is in the external archive's `logs/step7/`.

### Proposed adjustments

1. Add a short Git-fixture isolation rule to `AGENTS.md` under `Shell and search`: bind repository selection explicitly and compare live refs/configuration after probes.
   A script's absolute path selects executable bytes, not its target repository; network redirection alone cannot establish isolation.
2. Add a short approval-presentation rule to `AGENTS.md` under `Clarification gates`: translate machine-readable approval packets into effects and decisions, bind answers to the packet digest, and use `ask_user`.
   Keep the detailed migration checklist in this issue's plan rather than adding it to ordinary shipping templates.
3. Do not add another branch-sync rule, mutation-verification rule, or universal subagent-verification rule; existing instructions already cover those failures.
   Do not remove the guarded synchronization script, clean external backups, or redesign migration/release workflows within this retro.

### Next work

This repository-level issue has no package-roadmap successor.
The newest triage, `docs/triage/2026-09-02-backlog.md`, is inherited upstream context and supplies no ranked fork candidate.
Fork issue #12 was rechecked as open and is the only current open fork issue; it remains a separate deferred-release workflow task, not a residual publication owed by #13.

### Changes made

1. Appended this cross-session retrospective to `docs/retro/f0013-restore-merge-history.md`, including the fixture working-directory failure, approval-presentation friction, model attribution, and verification gap.
2. The operator declined both proposed rule additions as unnecessary; `AGENTS.md` and all prompt templates remain unchanged.
   No follow-up issue was filed, no external recovery material was deleted, and no release was dispatched.
3. After the retrospective commit, the operator approved deleting `../gotgenes-history-recovery` and publishing the exact cleanup comment.
   Deleted the directory at `2026-09-19T09:08:17Z` and verified its absence; it contained only the issue-13 archive and occupied approximately 1.7 GB before removal.
   Updated `docs/history-restoration.md` to state that the external backup and detailed evidence are no longer available, while preserving the earlier stage entries as historical records.
   Posted the approved [cleanup comment](https://github.com/Jopqior/gotgenes-pi-packages/issues/13#issuecomment-5740675149) without reopening the issue.
   The restored repository, published artifacts, `AGENTS.md`, and existing untracked directory remain unchanged by the deletion.
