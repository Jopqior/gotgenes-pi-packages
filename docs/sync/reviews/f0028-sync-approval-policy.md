# Synchronization rule review for fork issue 28

## Status and authority

This is a historical deliberation record, not an active synchronization policy or an approval to perform a merge.
Every rule item below is **pending** unless its own decision history records an explicit operator disposition and confirmed bounds.
An index group is a navigation aid, never a batch approval unit.
Existing safeguards remain binding during this review; removing duplicate wording would not repeal them.
The sole future policy source belongs to the unified workflow in [#27].
No rule is activated by committing this file.
Issue [#29] owns release-mechanism terminology; existing names below identify evidence, not approved future names.

## Record organization decision

At the build-stage gate on 2026-09-26, the operator selected `record_location=sync_tree` (visible answer: “集中到 docs/sync/”) and `record_layout=index_sections` (visible answer: “索引表＋独立规则小节”).
The preceding briefing proposed this review at `docs/sync/reviews/f0028-sync-approval-policy.md` and future execution records at `docs/sync/runs/<UTC timestamp>-<upstream short SHA>.md`, without requiring an issue number.
It proposed a short index and an independent section per rule, preserving source, alternatives, response, bounds, destination, and subsequent decision history without a hard line limit.
This answer confirms organization only, not any rule disposition.
Issue [#27] implements execution records and resolves practical filename collisions without treating a filename as sufficient input identity.
Stage summaries remain in `docs/retro/f0028-sync-approval-policy.md`.

Local provenance: build session `2026-09-26T12-51-41-930Z_01a0ddc5-7aea-7605-841f-339bc6b98b89`, gate IDs `record_location` and `record_layout`.
The quoted responses and proposal above are retained here so the decision does not depend on access to a local transcript.

## Review method

Each item carries the current source instruction or observed practice and the particular decision still needed.
Before deciding an item, present concrete retain/change/remove alternatives and their effects to the operator.
Append the actual answer, exact confirmed wording and applicability, and intended destination to that item's section.
A remove disposition must distinguish removing automatic authority, deleting duplicate prose, and preserving historical evidence.
Unanswered questions remain pending; recommendations and assistant summaries are not operator approval.
Changed decisions append a superseding entry rather than erase the original scope.

## Source snapshot and evidence limits

The working baseline was `f6c67319970c1661216b40c68ea6c4ccfbab10f5`.
Source abbreviations below refer to files at that revision, so deleting the old handbook in [#27] will not delete the cited evidence.

| Code | Source                                                                         |
| ---- | ------------------------------------------------------------------------------ |
| H    | `docs/upstream-sync.md`, heading named in each group                           |
| A    | `AGENTS.md`, especially `Personal fork scope and operation targets`            |
| R    | `.pi/skills/releasing/SKILL.md`                                                |
| P    | `.pi/skills/package-pi-subagents/SKILL.md`                                     |
| D    | `.pi/skills/delegation/SKILL.md`                                               |
| S    | `scripts/upstream-sync.sh`                                                     |
| T    | `packages/pi-subagents/docs/architecture/selector-startup-maintenance.md`      |
| U    | `packages/pi-subagents/docs/architecture/selector-presentation-maintenance.md` |

The original integration session was `2026-09-26T06-14-21-805Z_01a0dc59-b56c-7678-89be-bd86e5ed5d9f`.
Its operator request was “现在需要合入到 upstream 的最新提交。”
The subsequent objection was “这些都冲突都应该先告诉我然后向我确认而不应该直接决定，除非是 @docs/upstream-sync.md 有规定。”
The later “好，先发布吧。”
concerned publication, not approval of reusable resolution rules.
Later issue-filing instructions explicitly required reviewing the old handbook's rules rather than inheriting them wholesale.
The planning session separately confirmed keeping review history, per-sync execution records, and retros distinct.

The actual integration is `d4d90b3de6c19be1516ce0a92c1ad611e8543ba5`.
Its evidence/log follow-up is `3b022a4c71c93ec18a461927868fb4cc6917f378`; the later discovery-command adaptation is `4e1827113af1b660aa4f02d99df4ac6908d611fc`.
The remerge diff shows analysis allowances in `.fallowrc.json`, `rows: 40` in the widget fixture, and manifest-derived workspace names in `finish-phase.md`; the later commit changes `improvement-discovery/SKILL.md` similarly.
These observations establish edits, not permission to repeat them.
T used fixed upstream method bodies; U used explicitly synthetic display changes.
Neither establishes general compatibility with future upstream changes or grants adaptation authority.

### Verified script boundaries

Reading S and running only `--help` established the following boundaries; no synchronization was executed in this review.

- The no-argument path configures the remote and fetches; its header's “read-only default” wording is inaccurate.
- Recording mode also performs remote setup and fetch before invoking the recorder.
- Merge preconditions run after remote setup and fetch, not before every write.
- Cleanliness checks inspect tracked worktree and index changes, not all untracked files.
- The origin guard uses a substring match, not exact repository identity validation.
- The merge command has neither `--no-ff` nor `--no-commit`; it can commit automatically and does not force two parents for every possible ancestry.
- The tag guard compares sorted tag names, stronger than a count but not a tag-name-to-object mapping.
- None of these mechanisms verifies human approval of resolution edits.

These limits must remain visible in the handoff; they do not authorize script changes in this documentation issue.

## Index

S01, S02a, and S02b have confirmed change dispositions; all other item IDs remain pending individual disposition.
Confirmation here is a handoff decision, not activation.

| Items   | Review area                                       | Source                                                            |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| S01–S14 | Timing, transport, targeting and recovery         | H introduction, When to sync, Procedure, Forbidden commands; A    |
| M01–M09 | Merge checks, topology and generic handling       | H Procedure and Conflict handbook; A; S                           |
| F01–F11 | First-merge recipes, fork identity and changelog  | H First merge and After issue 3                                   |
| N01–N07 | New-package wiring                                | H After issue 3; R Adding a new package                           |
| I01–I08 | Fork lookup, phases and auto-merged documents     | H Conflict handbook, Auto-merged paths, Compatibility integration |
| B01–B10 | Selection startup obligations                     | H Startup selection; T; P                                         |
| P01–P11 | Selection presentation obligations                | H Spawn presentation; U                                           |
| H01–H09 | Historical compatibility and one-time permissions | H Compatibility integration for fork issue 14                     |
| V01–V10 | Lockfile, validation and merge completion         | H Procedure; R; P                                                 |
| E01–E12 | Release evidence and calculations                 | H Core sync evidence; R                                           |
| C01–C08 | Correspondence and release lifecycle              | H Release correspondence lifecycle and Version correspondence     |
| G01–G07 | Historical Release editing                        | H Historical GitHub Release notes                                 |
| X01–X09 | Recent practices and adjacent authority hazards   | Integration evidence; A; D; P; R                                  |
| A01–A08 | Approval, delegation and record semantics         | Issue 28 and its plan                                             |

## Timing, transport, targeting and recovery

Source: H introduction, `When to sync`, `Procedure`, `Forbidden commands`; A fork header.

### S01: On-demand synchronization

Existing: “On demand.”

Disposition: **change, confirmed by the operator**.
The initial alternatives were an explicit operator-request boundary, retaining the vague original wording, or removing the scheduling rule.
The operator questioned the first alternative: “我如果调用了 /upstream-sync 这个 prompt 肯定就是请求同步了呀？”
The clarification explicitly stated that invoking `/upstream-sync` is itself the synchronization request and needs no redundant confirmation to start; discovering updates in another workflow does not authorize a merge; uncovered resolutions and extra edits still require approval.
The operator then answered: “明白了，同意你。”
This confirms the clarified wording, not an additional start-confirmation gate.

Confirmed handoff wording: Invoking `/upstream-sync` requests synchronization and enters that workflow without asking again whether to start.
Merely discovering upstream updates in another workflow does not authorize starting a merge.
Uncovered conflict resolutions and extra integration edits still require advance operator approval.
This clause does not bypass precondition checks or approve a specific recovery action.

Intended destination: issue 27 workflow entry and authorization boundaries.
Provenance: this build session, gate `S01`, the operator's clarification question, the assistant's explicit clarification, and the subsequent operator response quoted above.
Activation remains pending issue 27.

### S02: Check upstream before publishing

Existing: “Before a fork publish, check whether upstream main has new commits or a new pi-subagents release.”
This parent paragraph has separate decisions for commit discovery and release discovery.

#### S02a: Upstream commit discovery

Disposition: **change, confirmed by the operator**.
The alternatives were checking before every fork publication, checking only within synchronization, or removing the mandatory check.
At the recovery gate `S02a`, the operator selected `change_sync_only`, visible answer “检查提交: 仅在同步工作流内”.

Confirmed handoff wording: Check for new upstream main commits within the synchronization workflow.
An independent fork publication does not require an additional upstream commit-discovery query.
Discovery does not authorize an automatic merge outside the requested synchronization workflow.
Existing release-evidence validation remains required.

Intended destination: issue 27 inspection stage and the publishing-stage handoff.

#### S02b: Upstream release discovery

Disposition: **change, confirmed by the operator**.
The alternatives were checking before every fork publication, checking only within synchronization, or removing the mandatory check.
At the recovery gate `S02b`, the operator selected `change_sync_only`, visible answer “检查版本: 仅在同步工作流内”.

Confirmed handoff wording: Check for newly published upstream pi-subagents releases within the synchronization workflow.
An independent fork publication does not require an additional upstream release-discovery query.
Discovering a newer release does not by itself require incorporating it or alter the verified incorporated baseline.
Existing release-evidence validation remains required.

Intended destination: issue 27 inspection stage and the publishing-stage handoff.
Both decisions are evidenced by this build session's follow-up gate titled “补收未返回的选择”; no missing answer from the earlier elaboration result was inferred.

### S03: Script-only synchronization

Existing: “Sync only through scripts/upstream-sync.sh.”
Decide its future wording, distinguishing safe inspection/help from fetch, configuration, merge, and evidence writes.

### S04: SSH transport

Existing: upstream fetch and tag queries use `git@github.com:gotgenes/pi-packages.git` and require SSH read access.
Decide whether this remains the required transport or merely the current mechanism description.

### S05: Mismatched remote remediation

Existing: switch an HTTPS upstream remote to SSH before running the script.
Decide whether changing an existing URL needs item-specific approval instead of automatic repair.

### S06: Remote setup safeguards

Existing: S adds a missing upstream remote and sets `tagOpt=--no-tags` and `pushurl=DISABLE`.
Decide the scope of permission to run this setup; a fetch request must not be described as mutation-free.

### S07: GitHub default targeting

Existing: pin the CLI default to `Jopqior/gotgenes-pi-packages` when adding upstream; recheck the default for tools without a repository parameter.
Decide whether a mismatch permits configuration repair or requires stopping and using explicitly targeted commands.

### S08: Explicit GitHub mutation target

Existing: verify the target and pass `--repo Jopqior/gotgenes-pi-packages` where supported.
Decide its placement in the unified workflow without weakening the current safeguard.

### S09: Explicit push target

Existing: verify the remote URL and name the remote and branch before pushing.
Decide the required verification separately from the operator's push authorization.

### S10: No upstream tag imports

Existing: never import upstream tags; forbidden examples include tag-forcing fetches, flagless upstream fetch, and `git fetch --all`.
Decide wording that preserves the safeguard without relying on an inaccurate explanation of Git defaults.

### S11: No upstream push

Existing: `git push upstream` is forbidden and the remote push URL is disabled.
Decide its scope; contacting or submitting to upstream still requires an explicit operator request under A.

### S12: Tag-set verification

Existing: S compares sorted local tag names before and after fetch; the later checklist prints only a tag count.
Decide what evidence the workflow must retain and what mismatches must stop execution.

### S13: Imported-tag recovery

Existing: delete accidentally imported tags, then rerun the script.
Decide whether each proposed tag deletion needs explicit destructive-action approval and verified provenance.

### S14: Abandoning a merge

Existing: run `git merge --abort` to abandon conflicts and restore the pre-merge state.
Decide whether this is an operator-selected recovery, not an automatic response to difficulty.

## Merge checks, topology and generic handling

Source: H `Procedure` and `Conflict handbook`; A `Worktrees`; S `check_merge_preconditions` and merge invocation.

### M01: Main-branch precondition

Existing: merge only from `main`.
Decide the check and stop response; this does not authorize switching branches automatically.

### M02: Correct origin precondition

Existing: refuse unless origin is this fork.
Decide the workflow's identity verification, noting S currently checks a substring only.

### M03: Clean tracked state

Existing: require clean index and tracked worktree.
Decide whether to retain that exact scope or include untracked-path hazards; no stash or deletion permission is implied.

### M04: No in-progress merge

Existing: refuse when `MERGE_HEAD` exists.
Decide stop/resume handling, without automatically aborting an existing operation.

### M05: No in-progress rebase

Existing: refuse when a rebase state directory exists.
Decide stop handling separately from merge recovery.

### M06: Upstream merge topology

Existing: A says upstream integration preserves a genuine two-parent merge.
Decide the required topology and escalation for fast-forward/already-integrated cases; S does not force two parents.

### M07: Linear feature landing

Existing: feature worktrees rebase and fast-forward land, unlike upstream integration.
Decide whether the sync workflow needs a short distinction or a reference rather than duplicating that workflow.

### M08: No wholesale ours/theirs

Existing: do not take either side wholesale.
Decide whether this prohibits blanket conflict resolution while allowing an individually approved exact replacement.

### M09: Keep fork and upstream behavior

Existing: preserve spawn selection and incoming upstream behavior.
Decide whether this is an invariant to review, rather than permission to invent a combined implementation.

## First-merge recipes and fork identity

Source: H `First merge (before issue 3)` and `After issue 3`.
The first-merge instructions describe particular historical inputs, not a current compatibility proof.

### F01: Manager import union

Existing: retain selection-scope and upstream resume/lifecycle type imports in `subagent-manager.ts`.
Decide historical-only versus any narrowly reusable import reconciliation rule.

### F02: Service import union

Existing: union model, thinking, resume, and status imports in `service.ts`.
Decide separately from preserving the public service methods.

### F03: Adapter import union

Existing: retain both resume and selection-provider types in `service-adapter.ts`.
Decide whether the historical example has any future automatic-edit authority.

### F04: Background presentation concatenation

Existing: concatenate fork pending-selection presentation with upstream annotated details.
Decide whether this remains only an account of that merge.

### F05: Test import union

Existing: keep model and workspace helpers in `subagent-manager.test.ts`.
Decide whether this stale concrete recipe should be history-only or removed from workflow guidance.

### F06: Module-list union and recount

Existing: keep every unique module token in package skill and architecture listings, then recount rather than add old counts.
Decide whether union is valid only for verified current modules, not arbitrary incoming phrases.

### F07: Service method preservation

Existing: do not drop `resume(...)` or `registerSpawnSelectionProvider(...)`.
Decide invariant versus resolution authority; no contract narrowing is proposed here.

### F08: Fork manifest identity

Existing: retain `@jopqior/pi-subagents` and the fork version.
Decide exact covered fields and situations, separately from other manifest content.

### F09: Other manifest changes

Existing: accept upstream dependency and metadata changes except fork name/version.
Decide dependencies and metadata individually if their effects differ; this broad instruction is not confirmed authority.

### F10: Preserve fork changelog entries

Existing H: keep fork entries unchanged at the top; do not change their versions to upstream numbers.
Decide this preservation safeguard independently of permission to splice incoming sections.

### F11: Insert incoming upstream changelog sections

Existing H: splice newly arrived upstream sections below fork entries and above the shared baseline.
Decide exact insertion bounds and escalation for reordered, overlapping, or corrected history.

## New-package wiring

Source: H `After issue 3`; R `Adding a new package`.
H's reference to an “AGENTS.md four-place list” is stale; the actual list is in R. Discovery of a new directory does not itself approve these mutations.

### N01: Local package loading

Existing: add the package load path in `.pi/settings.json`.
Decide whether discovery may cause automatic extension loading or must first be approved.

### N02: README package entry

Existing: add the package to the Packages table.
Decide the bounds of an automatic documentation-only entry, if any.

### N03: Dedicated-skill note

Existing: add to the no-dedicated-skill note unless a package skill exists.
Decide separately from package installation or loading.

### N04: Bug-report dropdown

Existing: add the package to the bug-report form's required Package dropdown.
Decide whether this mutation is covered by discovery or requires confirmation.

### N05: Feature-request dropdown

Existing: update the feature-request form as well.
Decide this independent consumer rather than assuming the bug-form answer covers it.

### N06: GitHub package label

Existing: create `pkg:<name>` before an issue selects the new package.
Decide remote-write authorization, explicitly targeting the fork.

### N07: Release registration and npm disable entry

Existing: register actual identity/provenance before release preparation; add the npm disable entry only after the approved first publish.
These are separate actions: obtain separate dispositions for registration and the later disable entry before either becomes an active rule.
No registration grants publication permission or a supported evidence route to another fork package.

## Fork lookup, phases and auto-merged documents

Source: H `Conflict handbook`, `Auto-merged both-sides paths`, and `Compatibility integration for fork issue 14`; A fork identity rules.

### I01: Fork issue lookup

Existing: restore dropped `fNNNN-` short-circuit lookup in lifecycle prompts.
Decide exact restoration bounds and escalation when upstream changes lookup semantics.

### I02: Fork issue naming

Existing: new fork files use `fNNNN-`, never the next inherited numeric slot.
Decide preserving this invariant without authorizing bulk renaming of historical records.

### I03: Independent fork phase allocation

Existing: use full `f` phase identities and independent per-package allocation, never numeric upstream maxima or arithmetic predecessors.
Decide invariant and inspection scope separately from reconciliation edits.

### I04: Coexisting phase archives

Existing: retain numeric upstream and fork archives/retros even with matching suffixes; reconcile table conflicts as separate rows.
Decide exact coverage and stop cases such as duplicate fork identities.

### I05: Auto-merged path inspection

Existing: reread both-sides paths even with zero conflict markers; the `ship.md` grep is a spot check, not a semantic proof.
Decide review obligation and report limits.

### I06: Restore dropped selection prose

Existing: restore any dropped spawn-selection sentence in `AGENTS.md` or `packages/pi-subagents/**`.
Decide whether this broad restoration authority becomes inspection-only or receives specific bounds.

### I07: Fork scope header and adjacent conventions

Existing: retain the fork header and reconcile repository targeting, registry flags, and skill/lifecycle references.
Decide whether preservation is an invariant only; implementation choices remain independently gated.

### I08: Move dispositions with archived roadmaps

Existing: when an upstream roadmap moves to history, move fork dispositions rather than drop them.
Decide covered source/destination conditions and handling of ambiguous ownership.

## Selection startup obligations

Source: H `Startup selection after issue 20`, T, and P `Implementation Priorities`.
These are technical review inputs, not permission to modify runtime code in this issue.

### B01: Initial selection owner

Existing: `InitialSpawnSelection` owns the attempt, pair, cancellation race, listeners, and acknowledgement.
Decide retaining the ownership invariant versus treating its current class layout as a permanent recipe.

### B02: Terminal observer ordering

Existing: the original observer runs before handing recorded terminal facts to the selection owner.
Decide the required ordering review and escalation for incoming notification changes.

### B03: Terminal-method settlement avoidance

Existing: when incoming terminal methods preserve recording, cleanup, and notification order, do not reintroduce settlement lines.
Decide narrow applicability rather than general transplant permission.

### B04: Ordinary lifecycle state

Existing: do not restore private selection activity into `subagent-state.ts`.
Decide invariant and review obligation; the empty fixed-source diff is not proof for future sources.

### B05: Cancellation and registration review

Existing: review queued/active cancellation and late provider registration.
Decide required checks separately from choosing repairs.

### B06: Resume and construction review

Existing: review resume and manager construction.
Decide inspection coverage and how unperformed checks must be reported.

### B07: Tool acknowledgement boundary

Existing: retain wait-before-return for selected background tools while the service remains synchronous and no-provider acknowledgement non-blocking.
Decide the preserved contract and approval requirements for any adaptation.

### B08: Scope lifetime

Existing: capture scope during initialization and close it before shutdown disposal.
Decide review obligation without granting arbitrary lifecycle rewiring authority.

### B09: Factory cancellation safety

Existing: retain factory wrapping, selection-signal checks, and late-session disposal before extension binding.
Decide each independent invariant during review rather than assuming one answer approves all factory edits.

### B10: Catalogue and host timing

Existing: authenticated catalogue validation and host loader timing remain semantic obligations.
Decide required evidence and disclosure of absent live-host testing.

## Selection presentation obligations

Source: H `Spawn presentation after issue 21`; U `Remaining reconciliation and verification boundaries`.

### P01: Shared ordinary builder

Existing: ordinary and selected display use `buildSpawnDisplay`.
Decide the invariant without granting unspecified refactoring authority.

### P02: Incoming formatting formula

Existing: adapt incoming model formatting into `formatSpawnModelName` in the same file, not a second inline formula or a move to `ui/display.ts`.
Decide whether this concrete adaptation instruction is reusable or needs case-specific approval.

### P03: Empty model ID behavior

Existing: preserve the fork equality guard rather than upstream truthiness semantics unless deliberately changed and tested.
Decide the contract; tests alone do not approve changing it.

### P04: Parent model identity

Existing: initial formatting uses `modelInfo.parentModel?.id`; selected formatting uses the runner snapshot parent ID.
Decide the preserved inputs and escalation for changed timing.

### P05: Explicit max-turn tags

Existing: retain explicitly configured max turns in display tags.
Decide inspection and bounded restoration authority, if any.

### P06: Captured mode label

Existing: capture the prompt-mode label once and avoid re-reading agent files during updates.
Decide the timing invariant independently of the label's wording.

### P07: Tag order and thinking representation

Existing: review ordering through the shared builder without literal `twin` checks or parsing formatted thinking strings.
Decide whether this is design guidance only or an exact covered edit.

### P08: Pending activity

Existing: preserve the pending-first branch and the foreground/widget private pending boolean.
Decide the contract and review affected callers rather than only ordinary activity wording.

### P09: Resume and failure fallback

Existing: retain non-selection `detailBase` identity for resume and no-pair failure/cancellation.
Decide the invariant independently from new rendering choices.

### P10: Pre-record and public boundary

Existing: retain the pre-record placeholder, private widget projection, and unchanged public status/snapshot.
Decide each affected boundary separately if an incoming change touches it; no public-field change is proposed here.

### P11: Captured facts and non-mutation

Existing: reconcile new fields/host timing explicitly and avoid mutating execution, details, or invocation tags.
Decide evidence requirements; synthetic trials do not authorize future adaptations.

## Historical compatibility and one-time permissions

Source: H `Compatibility integration for fork issue 14`.

### H01: Permission-rule migration

Existing batch note: last matching candidate rule wins; exceptions follow broad rules and prefix handling changed.
Decide historical-only versus a current inspection obligation; no automatic permission-rule edits follow.

### H02: Session-discovery migration

Existing batch note: newest-path default limit, explicit larger limit, and total/shown distinction.
Decide historical-only versus current reference, not a sync-specific edit recipe.

### H03: Child context loading

Existing: retain child-directory project-context loading alongside the selection wrapper.
Decide historical account versus required compatibility inspection.

### H04: Fresh abort controller

Existing: retain fresh per-run abort behavior with selection cancellation and resume handles.
Decide the invariant rather than blanket permission to combine implementations.

### H05: Autoformat directory migration

Existing batch note: global configuration honors `PI_CODING_AGENT_DIR`.
Decide historical-only versus continuing inspection requirement.

### H06: Tracked tripwires and web loading

Existing batch note: adopt tracked permission tripwires and remove project loading of `pi-web-access`.
Decide these independently if retained; history does not authorize future permission or loading changes.

### H07: Local override deletion

Existing: operator authorized deleting the rechecked yolo-only override without backup in that batch.
Decide historical-only classification; this is not a new deletion request.

### H08: Coordinated publication

Existing: the operator authorized publication of the core and selector together for issue 14.
Decide historical-only classification; the old workspace-dependency reason no longer applies.

### H09: Selector release independence

Existing: the selector now uses an independent peer compatibility range, so core publication alone does not require selector publication.
Decide current reference destination rather than renewing the old coordinated dispatch authorization.

## Lockfile, validation and merge completion

Source: H `Procedure`; P `Notes for Agents`; R dependency-change validation.

### V01: Lockfile regeneration

Existing: always run `pnpm install` after merge, including auto-merges without markers.
Decide permitted write scope and escalation for unexpected dependency changes or install side effects.

### V02: Rumdl cache clearing

Existing: delete cached rumdl files after moves/renames.
Decide bounded disposable-cache cleanup versus broader deletion authority.

### V03: Type checking

Existing: run `pnpm run check`.
Decide required execution and honest reporting; failure does not approve repairs.

### V04: Lint checking

Existing: run `pnpm run lint`.
Decide checking separately from autofix authority or gate-weakening configuration edits.

### V05: Package tests

Existing: run `pnpm -r run test`, without assuming a separate periodic upstream-suite run.
Decide scope and handling of unavailable tests.

### V06: Script tests

Recent integration reported script tests in addition to package suites.
Decide whether release/sync script suites are required for each integration and how their scope is selected.

### V07: Dependency-change analysis

Existing R: run `pnpm fallow dead-code` before pushing a new or dependency-changed package.
Decide this conditional check without authorizing suppression of findings.

### V08: Validation-induced writes

Candidate from plan: classify unexpected file writes by checks or formatters; validation intent does not authorize them.
Decide how to stop, inspect, and seek permission without erasing operator work.

### V09: Manual merge completion

Existing: stage reviewed resolutions and run `GIT_EDITOR=true git merge --continue`.
Decide the authorization accounting required before staging/completion; “reviewed” alone is not approval evidence.

### V10: Sync execution log

Existing: append a sync-log row after completion.
Decide its migration into the per-sync execution record, avoiding duplicate manual logs and release correspondence.

## Release evidence and calculations

Source: H `Core sync evidence`, `Mapping rule`, `Blocking cases`, `Recording a completed sync`; R `Core package release levels`.
The current algorithms are evidence inputs, not targets for alteration in this issue.

### E01: Committed evidence ownership

Existing: `scripts/release/core-sync-state.json` is authoritative for published correspondence and reviewed merges.
Decide preserving the machine record separately from the human authorization/execution record.

### E02: Reviewed merge identity

Existing: the recorded merge OID binds evidence to committed resolutions before release prediction.
Decide the review requirement, without equating an evidence record with source-change authorization.

### E03: Fork contribution classification

Existing: record `none|patch|minor|major` plus rationale for resolution effects, not the merge message's type.
Decide who confirms this semantic assessment and what supporting diff must be shown.

### E04: Non-none justification

Existing: a non-none contribution requires package paths whose merged result differs from both parents.
Decide preserving this evidence obligation independently from permitting those changes.

### E05: Recorder entry and commit

Existing: invoke through the sync script after merge completion, then commit the state update.
Decide the allowed action scope, including the script's fetch side effect.

### E06: State conflict correction

Existing: resolve conflicting state evidence only after review, then regenerate/check the table.
Decide explicit approval for a proposed correction; review by an agent alone is not sufficient.

### E07: Highest incorporated stable upstream release

Existing: choose the highest stable release contained in the upstream parent, verify its manifest, and reject unreleased package work.
Decide mechanism-reference retention; no algorithm modification is proposed.

### E08: Upstream SemVer distance

Existing: equal stable baseline with no unreleased work gives none; patch/minor/major distance supplies the corresponding contribution across the entire window.
Decide retaining this mechanism description in its owning documentation rather than duplicating it in workflow policy.

### E09: Maximum contribution, not accumulation

Existing: combine upstream distance, fork-owned commits, and reviewed resolution levels by their maximum; deferred patch syncs do not sum.
Decide reference destination; sibling/root-only commits are excluded by the current mechanism.

### E10: Fail-closed evidence cases

Existing: reject missing correspondence or reviewed merges, invalid parent topology, regressing versions, manifest disagreement, discontinuous ancestry, unreleased package work, and missing objects.
Each guard is a separate preservation obligation, not permission to repair evidence; obtain separate decisions if any guard is proposed for change.

### E11: Idempotence and no override

Existing: identical repeated review is idempotent; conflicting evidence errors and there is no override flag.
Decide preserve-as-mechanism versus duplicate workflow wording.

### E12: Offline revalidation

Existing: prediction rereads committed evidence and local objects, rechecks manifests/ancestry/unreleased work, and rejects malformed git-cliff context instead of discarding entries.
Decide reference placement without claiming recording waives subsequent checks.

## Correspondence and release lifecycle

Source: H `Release correspondence lifecycle` and `Version correspondence`; R `Dispatching a release` and `A package's first release`.

### C01: Generated correspondence ownership

Existing: derive table rows from verified state; never add or repair rows manually.
Decide preservation and migration responsibility under issue 27.

### C02: No unreleased row on sync alone

Existing: only release preparation includes a pending release row, with state, manifest, and decorated changelog committed together.
Decide retaining the distinction between sync completion and publication.

### C03: Exact upstream provenance

Existing: each fork release has a direct fixed upstream baseline, not a claim of behavioral equivalence; several releases may share it.
Decide preserving data and disclosure while deleting the old handbook.

### C04: Registered identities and all-package preflight

Existing: unregistered identities or unsupported fork evidence fail preparation/publication/Release creation; registration does not authorize publication.
Decide workflow reference and independent package/scope/destination approval.

### C05: Tagged artifacts and Release bodies

Existing: publication checks the full tagged set before npm; Release creation uses exact tagged changelog sections and leaves existing bodies unchanged on rerun.
Decide mechanism-reference retention rather than automatic permission to edit remote releases.

### C06: Sibling-only publication isolation

Existing: publishing only siblings leaves fork state/table unchanged; original packages have no upstream block.
Decide preserving this boundary without adding another fork package now.

### C07: Immutable published history

Existing: published tarballs, tags, and historical changelog sections are not rewritten to change correspondence.
Decide explicit retention of this safeguard; correcting notes is a separate operation.

### C08: First release and retry boundaries

Existing R: first release is operator-chosen; an unsupported new fork stops for evidence review; retry prepared releases by the failed job after tagged-checkout verification, not blind redispatch.
Review first-release approval and post-prepare retry separately before either becomes workflow authority.

## Historical Release editing

Source: H `Historical GitHub Release notes`.

### G01: Separate notes-only operation

Existing: backfill is not part of sync or ordinary release preparation.
Decide preserving the independent approval gate.

### G02: Explicit preview inputs

Existing: preview explicit fork tags into a review JSON without editing GitHub.
Decide preview scope; creating the local review file is distinct from remote edits.

### G03: Exact remote-edit approval

Existing: review current body, proposed block, tag OID, identity, and historical evidence; approve the exact edits before apply.
Decide the scope and evidence required on resume.

### G04: Preservation and missing Releases

Existing: preserve `Source-history restoration` disclosures verbatim; report missing Releases without creating them.
Review these separate safeguards individually if either is proposed to change.

### G05: Batch revalidation and readback

Existing: revalidate the whole batch against live Releases/evidence before editing and read back each edit.
Decide verification obligations separately from initial approval.

### G06: Resumption and races

Existing: skip identical completed entries on resume, coordinate an edit window, retain before/after snapshots because another editor can race the final read.
Decide changed-input escalation and the evidence needed to skip an edit safely.

### G07: Excluded artifacts

Existing: backfill never rewrites historical changelogs, tarballs, tags, or Release metadata.
Decide exact notes-only bounds, independently of general sync or publication approval.

## Recent practices and adjacent authority hazards

Source: the integration evidence above; A environment/target rules; D `Scope bounds`; P domain-boundary guidance; R release safeguards.

### X01: Remerge-diff accounting

Observed: remerge diff distinguished conflict resolutions from extra adaptations; later commits were inspected separately.
Decide making both views mandatory inspection without claiming remerge diff proves authorization or semantic completeness.

### X02: Independent integration review

Observed: an independent reviewer inspected conflicted and automatically merged paths.
Decide required review scope and disclosure of checks not performed; reviewer recommendations grant no editing permission.

### X03: Manifest-derived workspace identity

Observed: workflow commands were changed to read actual package names rather than assume `@gotgenes/`.
Decide a narrowly bounded replacement rule versus case-specific approval; package renaming and wider command changes are separate.

### X04: Publication visibility recheck

Observed: successful publication logs preceded registry visibility; the session waited and queried again rather than republish blindly.
Decide the release-stage practice and uncertainty reporting; successful CI alone is not registry confirmation.

### X05: Analysis allowance hazard

Observed: `.fallowrc.json` gained type-only allowances; P says a new intended edge extends its allow list in the same commit.
Decide whether that wording must yield to pre-edit approval; preserving selection does not by itself approve weakening a check.

### X06: Fixture repair hazard

Observed: the widget terminal fixture gained `rows: 40` during integration.
Decide the post-auto-merge approval example; changing a fixture is not authorized merely because it makes tests pass.

### X07: Delegated lint-fix latitude

Existing D permits lint suppressions or type-safe transformations within bounded lint/refactor work.
Decide explicitly preventing those bounds from being mistaken for sync-specific operator approval.

### X08: Session freshness

Existing A requires on-disk prompt authority and restarting before using edited extension tools; renamed commands also need a fresh session.
Decide workflow pause/resume guidance and preservation of approval evidence across restart.

### X09: Adjacent release safeguards

Existing A/R require npmjs registry flags, independent publication approval, and prohibit weakening supply-chain settings to bypass same-day dependency failures.
Review each safeguard independently if its wording or authority changes; synchronization does not grant exceptions.

## Approval, delegation and record semantics

Source: fork issue 28 and `docs/plans/f0028-sync-approval-policy.md`.
These detailed clauses remain to be confirmed through review; the issue's requirement to obtain approval is already the task constraint.

### A01: Proposal before edits

Candidate: report conflicting inputs or post-merge symptom, affected paths, proposed action, alternatives, and effects before authoring an uncovered change.
Decide the minimum decision evidence without demanding a speculative implementation first.

### A02: Exact rule coverage

Candidate: cite a confirmed active rule's stable reference and reviewed version, matching inputs, action, and effects.
Decide coverage evidence; historical records and preservation goals cannot independently authorize edits.

### A03: Ambiguity stops affected edits

Candidate: missing, ambiguous, or contradictory coverage requires the operator's decision before editing, including after an automatic merge.
Decide handling of unrelated already-authorized work while the affected item waits.

### A04: Reopen materially changed proposals

Candidate: changed inputs, scope, effects, or an independent-review finding reopen approval before implementing the changed proposal.
Decide what must be re-presented and preserve the earlier decision history.

### A05: Authorization accounting

Candidate: compare final diff with authorized items, including rule-covered edits, and report execution/verification separately.
Decide the merge-completion and handoff checkpoints; green checks do not prove authority.

### A06: Bounded delegation

Candidate: default to read-only inspection without scope approval; name allowed files/actions, rule references or item approvals, and pre-edit stop conditions for workers and nested workers.
Decide how the parent obtains an operator decision and supplies a scoped continuation; parent approval alone is insufficient.

### A07: Resume evidence

Candidate: retain proposal identity, full relevant OIDs, operator response, approved scope, execution diff/commit, and verification as distinct facts.
Decide the minimum record; absent or ambiguous evidence returns to the gate rather than trusting an assistant's “approved” summary.

### A08: Separate authorities and activation

Candidate: ordinary merge permission does not authorize resolutions, push permission does not authorize repairs, and publication permission does not approve reusable rules.
Decide final wording and handoff mapping; Git's automatic merge commit is not a promised pre-write interception point.

## Inventory completion and handoff status

This inventory is ready for individual deliberation, not activation.
The following subitems split compound source paragraphs into separate decision units; their parent headings are navigation only and cannot receive a blanket disposition.
Each subitem is pending and inherits the original source and evidence limits from its parent section.
Individual deliberation has started: S01 is confirmed with clarified entry semantics, and S02a/S02b are confirmed as synchronization-only discovery obligations.
All other items remain pending.
The first gate's elaboration result omitted the S02a/S02b selections; a follow-up gate recovered both explicitly instead of inferring them from the operator's general confirmation.
Final acceptance requires the actual workflow in [#27], updated entry points, migrated required data, and deletion of the old handbook; a review record alone cannot complete that criterion.

The consumer search inspected `AGENTS.md`, `README.md`, `.pi/skills/releasing/SKILL.md`, `.pi/skills/package-pi-subagents/SKILL.md`, `scripts/upstream-sync.sh`, `scripts/release/correspondence-table.mjs`, `scripts/release/release-artifacts.mjs`, `scripts/release/prepare-release.sh`, and references under `test/release/` and `test/upstream-sync/`.
The table generator, release preparation/staging, artifact writer, fixtures, and conflict-diagnostic assertion depend on the handbook path; deletion must coordinate those consumers rather than only remove prose links.
The release-evidence scripts also refer to the sync CLI and must be reconciled with [#29]'s names.
No consumer was modified during inventory preparation.

### Independent subitems

| Parent | Separate decision units                                                                                                                                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S02    | S02a: inspect upstream main; S02b: inspect upstream package releases before publishing                                                                                                                                                                                       |
| S06    | S06a: add missing remote; S06b: set no-tag default; S06c: disable upstream push URL                                                                                                                                                                                          |
| S07    | S07a: change CLI default; S07b: verify default for repository-less tools                                                                                                                                                                                                     |
| F06    | F06a: module/token union; F06b: recompute counts                                                                                                                                                                                                                             |
| F07    | F07a: preserve resume; F07b: preserve provider registration                                                                                                                                                                                                                  |
| F08    | F08a: retain fork package name; F08b: retain fork version                                                                                                                                                                                                                    |
| F09    | F09a: incoming dependencies; F09b: incoming non-identity metadata                                                                                                                                                                                                            |
| N07    | N07a: release registration; N07b: post-publication npm disable entry                                                                                                                                                                                                         |
| I04    | I04a: preserve upstream numeric records; I04b: preserve fork records; I04c: separate conflicting history rows                                                                                                                                                                |
| B05    | B05a: queued cancellation review; B05b: active cancellation review; B05c: late registration review                                                                                                                                                                           |
| B06    | B06a: resume review; B06b: manager construction review                                                                                                                                                                                                                       |
| B07    | B07a: selected tool wait; B07b: synchronous service spawn; B07c: non-blocking no-provider acknowledgement                                                                                                                                                                    |
| B08    | B08a: initialization-time scope capture; B08b: scope closure before disposal                                                                                                                                                                                                 |
| B09    | B09a: factory wrapping; B09b: pre-creation selection-signal check; B09c: post-creation cancellation check; B09d: late-session disposal before binding                                                                                                                        |
| B10    | B10a: authenticated catalogue validation; B10b: host-loader timing review                                                                                                                                                                                                    |
| P04    | P04a: initial parent identity; P04b: selected runner-snapshot parent identity                                                                                                                                                                                                |
| P07    | P07a: shared-builder tag-order review; P07b: no literal mode checks; P07c: no parsing formatted thinking strings                                                                                                                                                             |
| P08    | P08a: pending-first activity; P08b: foreground pending propagation; P08c: widget pending propagation                                                                                                                                                                         |
| P09    | P09a: resume base identity; P09b: no-pair failure/cancellation fallback                                                                                                                                                                                                      |
| P10    | P10a: pre-record placeholder; P10b: private widget projection; P10c: unchanged public status; P10d: unchanged public snapshot                                                                                                                                                |
| P11    | P11a: new-field review; P11b: timing review; P11c: non-mutation of captured facts                                                                                                                                                                                            |
| H01    | H01a: last-match permission evaluation; H01b: longest-prefix tool qualification                                                                                                                                                                                              |
| H06    | H06a: tracked permission tripwires; H06b: project web-extension removal                                                                                                                                                                                                      |
| E10    | E10a: missing baseline correspondence; E10b: missing merge review; E10c: invalid two-parent topology; E10d: regressing upstream version; E10e: missing/mismatched release manifest; E10f: discontinuous ancestry; E10g: unreleased package work; E10h: missing local objects |
| E11    | E11a: identical-review idempotence; E11b: conflicting-record refusal; E11c: no override                                                                                                                                                                                      |
| E12    | E12a: read-time provenance validation; E12b: malformed context/commit rejection                                                                                                                                                                                              |
| C04    | C04a: identity/evidence preflight; C04b: independent publication approval                                                                                                                                                                                                    |
| C05    | C05a: full tagged-set publication check; C05b: exact tagged Release body; C05c: preserve existing bodies on rerun                                                                                                                                                            |
| C08    | C08a: operator-chosen first release; C08b: new-fork evidence stop; C08c: retry failed post-prepare job rather than redispatch; C08d: verify checkout against tags before retry                                                                                               |
| G04    | G04a: preserve restoration disclosure; G04b: no missing-Release creation                                                                                                                                                                                                     |
| G05    | G05a: batch revalidation; G05b: per-edit readback                                                                                                                                                                                                                            |
| G06    | G06a: skip verified identical completed edits; G06b: coordinate competing writers; G06c: preserve before/after snapshots                                                                                                                                                     |
| X09    | X09a: explicit npmjs registry flags; X09b: retain trusted reviewed lockfile setting; X09c: do not disable minimum release age                                                                                                                                                |
| A06    | A06a: default read-only; A06b: scoped worker continuation; A06c: nested delegation inherits bounds                                                                                                                                                                           |
| A08    | A08a: merge permission is not resolution permission; A08b: push permission is not repair permission; A08c: publication permission is not standing-rule approval; A08d: sole workflow activation authority                                                                    |

Before handoff, walk every acceptance case from the plan against confirmed clauses and record outcomes here.
Pending decisions, missing clause coverage, and unavailable activation evidence remain explicit blockers.

[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
