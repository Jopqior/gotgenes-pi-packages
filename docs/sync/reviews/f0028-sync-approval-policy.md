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

The operator subsequently requested that historical explanations be brief and questioned whether they needed retaining at all.
After inspecting `sync-worktree.md`, `ship-no-issue.md`, and `audit-agent-docs.md`, the assistant proposed deleting the first-merge import recipes from the new workflow, retaining only a one-sentence disposition and source per item here, and leaving the original recipes solely in Git history; the operator answered “好，继续。”
That confirmation applies to F01, F02, and F03 and to concise recordkeeping, not blanket deletion of the remaining review queue.
Do not recreate an archive of obsolete recipes or copy them into the workflow.

## Later package-scope clarification

The operator clarified: “除了我真正修改/新增的包，对于其他就直接合并就行了，比如上游的新增包。”
Confirmed direction: incorporate unchanged upstream packages, including newly added upstream packages, as supplied rather than requiring a separate adoption decision for each package.
Identify actual fork customizations instead of treating every upstream package as fork-maintained; the current read-only `git diff --name-only upstream/main HEAD -- packages` showed package differences only under `pi-subagents` and `pi-subagents-model-selector`, not a permanent allowlist.
Fork-customized or fork-added packages retain the approval boundary for uncovered resolutions and extra changes; repository targeting, tags, push, and publication safeguards remain applicable.
This does not grant an open-ended repair pass if upstream integration exposes incompatibilities with fork customizations.

At follow-up gate `upstream_package_wiring_scope`, the operator selected `upstream_as_is_extra_ask`, visible answer “新增包接线: 上游已有的直接合入，额外补写先问”.
Thus upstream-supplied loading configuration and README wiring may arrive as part of the ordinary merge; N01/N02 approval applies to additional agent-authored wiring, not to separately approving incoming upstream content.
The alternative explicitly allowing the agent to fill missing loading/README wiring automatically was not selected.
The independently approved bounded form/label actions in N04/N05/N06 remain specific rule coverage, not blanket package-adoption or publication authority.
This clarification is a handoff requirement for issue 27, not an upstream synchronization executed during this review.

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

S01 through S14, M01 through M09, F01 through F11, N01 through N07, and I01 through I08 have operator-confirmed dispositions, using their independent subitems where defined.
B01–B10, P01–P11, and H01–H09, including their subitems, are removed from workflow guidance under explicitly approved group-removal decisions below.
V01–V10, E01–E03, E05/E06, and C01 are confirmed.
E04, E07–E12, C02, C03, C05, and C06 have a confirmed group disposition: remove duplicate mechanism explanations from synchronization policy while retaining the owning release mechanisms.
C04a, C08a–C08d, and G01–G07 (including subitems) are removed as duplicate or out-of-sync-scope workflow material, with the owning release safeguards retained.
C04b/C07 and X01–X04 are confirmed; other X items and the detailed A clauses remain pending.
The later package-scope clarification below narrows how N01/N02 apply.
S04 requires a mechanism handoff before activation, not a claim that HTTPS already works.
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

Disposition: **retain with clarified bounds, confirmed by the operator**.
At gate `S03`, the operator selected `retain_scoped`, visible answer “脚本入口: 保留，并明确检查不受限”.
The alternatives were retaining the bounded script entry, requesting a changed entry restriction, or deferring.

Confirmed handoff wording: Perform synchronization fetch/merge actions through `scripts/upstream-sync.sh`, not ad-hoc equivalent commands.
Ordinary non-mutating Git inspection, including status, diff, history, and script help, may run directly.
The no-argument script mode is not a read-only inspection exemption: it configures the remote and fetches.
Intended destination: issue 27 execution entry and inspection stage.

### S04: SSH transport

Existing: upstream fetch and tag queries use `git@github.com:gotgenes/pi-packages.git` and require SSH read access.

Disposition: **change requested and confirmed by the operator; mechanism integration pending**.
At gate `S04`, the operator selected `change_https_support`, visible answer “SSH 要求: 希望同时支持 HTTPS”.
The alternatives were retaining SSH-only transport, supporting HTTPS as well, or deferring.
The briefing explicitly stated that HTTPS requires a separately coordinated script change and verification, not a prose-only change in this issue.

Confirmed handoff requirement: Support both SSH and HTTPS access to the same upstream repository, rather than requiring SSH exclusively.
This does not approve arbitrary hosts, repository identities, credential changes, or automatic conversion of an existing URL.
S06a subsequently settled missing-remote protocol selection as an operator choice, not an automatic default.
Exact supported URL spellings remain for issue 27 to verify.
The current script still rejects HTTPS; do not claim this requirement is active or bypass S03 to simulate support.
Intended destination: issue 27 transport design, with implementation ownership and tests to be settled there before activation.
No script edit or new issue is authorized by this record.

### S05: Mismatched remote remediation

Existing: switch an HTTPS upstream remote to SSH before running the script.

Disposition: **change, confirmed by the operator**.
At gate `S05`, the operator selected `change_ask_first`, visible answer “地址纠正: 报告并获批后再改”.
The alternatives were approval before any existing-URL change, automatic conversion only for the exact same-repository HTTPS URL, retaining the old conversion instruction, or stopping for manual remediation.

Confirmed handoff wording: Before changing an existing upstream remote URL, report its current value, the proposed value, and the effects, and obtain explicit operator approval.
Do not automatically convert HTTPS to SSH or overwrite a mismatched repository address.
Support for HTTPS under S04 does not waive this gate.
Intended destination: issue 27 remote inspection and recovery stage.

### S06: Remote setup safeguards

Existing: S adds a missing upstream remote and sets `tagOpt=--no-tags` and `pushurl=DISABLE`.
This parent paragraph has separate decisions for creating a remote and writing each safeguard.

#### S06a: Missing upstream remote

Disposition: **change, confirmed by the operator**.
At gate `S06a`, the operator selected `ask_transport`, visible answer “创建 remote: 先问协议，再创建”.
The alternatives were asking for the protocol, defaulting to HTTPS, defaulting to SSH, or stopping for manual configuration.

Confirmed handoff wording: If upstream is absent, present the SSH and HTTPS addresses for `gotgenes/pi-packages`, obtain the operator's protocol choice, and then create the remote with that selected address.
Do not silently choose a protocol or another repository.
The choice covers that creation only; existing-URL changes remain governed by S05.
The workflow must ask before invoking the current script, which otherwise creates the SSH remote automatically.
Intended destination: issue 27 transport setup; HTTPS execution depends on S04's mechanism handoff.

#### S06b: No-tag default

Disposition: **retain automatic action with reporting, confirmed by the operator**.
At gate `S06b`, the operator selected `retain_automatic`, visible answer “禁跟随标签: 自动设置并记录”.
The alternatives were automatic setup, confirmation before changing a value, or stopping for manual setup.

Confirmed handoff wording: Within requested synchronization, set the upstream remote's `tagOpt` to `--no-tags` and record that configuration action without a separate prompt.
This covers correcting an absent or different value on that remote, not deleting tags or changing unrelated configuration.
Intended destination: issue 27 transport safeguards and execution accounting.

#### S06c: Disabled upstream push URL

Disposition: **retain automatic action with reporting, confirmed by the operator**.
At gate `S06c`, the operator selected `retain_automatic`, visible answer “禁上游推送: 自动设置并记录”.
The briefing and selected option explicitly disclosed that this can overwrite an existing custom push URL.
The alternatives were automatic setup, confirmation before changing a value, or stopping for manual setup.

Confirmed handoff wording: Within requested synchronization, set upstream's `pushurl` to `DISABLE`, including replacing an existing value, and record the configuration action without a separate prompt.
This authorizes that push-protection setting only, not changing the upstream fetch URL or any other remote's push URL.
Intended destination: issue 27 transport safeguards and execution accounting.

### S07: GitHub default targeting

Existing: pin the CLI default to `Jopqior/gotgenes-pi-packages` when adding upstream; recheck the default for tools without a repository parameter.

#### S07a: Default repository configuration

Disposition: **change, confirmed by the operator**.
At gate `S07a`, the operator selected `change_ask_before_set`, visible answer “默认仓库配置: 修改默认值前先确认”.
The alternatives were approval before changing the default, automatically pinning it to the fork, or removing configuration changes from the workflow.

Confirmed handoff wording: Prefer explicitly targeted GitHub commands; adding an upstream remote does not authorize changing the GitHub CLI default repository.
If changing that default is necessary, present the change and obtain operator approval before writing it.
Intended destination: issue 27 GitHub targeting and configuration recovery.

#### S07b: Tools without a repository argument

Disposition: **retain, confirmed by the operator**.
At gate `S07b`, the operator selected `retain_check_fallback`, visible answer “无仓库参数工具: 保留，错目标时用显式 gh”.
The alternatives were verified wrappers with explicit-command fallback, using only explicit gh commands, or deferring.

Confirmed handoff wording: Before using tools without a repository argument, verify that the GitHub CLI default resolves to `Jopqior/gotgenes-pi-packages`.
If it does not, use an equivalent `gh` command with an explicit fork repository argument instead; do not silently repair the default.
If no suitable explicit alternative is available, stop and request a decision rather than operate against the wrong repository.
Intended destination: issue 27 GitHub inspection and CI stages.

### S08: Explicit GitHub mutation target

Existing: verify the target and pass `--repo Jopqior/gotgenes-pi-packages` where supported.

Disposition: **retain, confirmed by the operator**.
At gate `S08`, the operator selected `retain_explicit_target`, visible answer “GitHub 写操作: 保留”.
The alternatives were retention, requesting an adjusted requirement, or deferring without weakening the current safeguard.

Confirmed handoff wording: Before a GitHub mutation, verify the target repository and explicitly pass `--repo Jopqior/gotgenes-pi-packages` where supported.
Target verification does not authorize the mutation itself.
Intended destination: issue 27 GitHub mutation checkpoints.

### S09: Explicit push target

Existing: verify the remote URL and name the remote and branch before pushing.

Disposition: **retain, confirmed by the operator**.
At gate `S09`, the operator selected `retain`, visible answer “推送目标: 保留”.
The alternatives were retention, a specified adjustment, or deferral.
Confirmed handoff wording: Before an authorized push, verify the intended remote URL and explicitly name the remote and branch in the push command.
This target check does not authorize pushing.
Intended destination: issue 27 push checkpoint.

### S10: No upstream tag imports

Existing: never import upstream tags; forbidden examples include tag-forcing fetches, flagless upstream fetch, and `git fetch --all`.

Disposition: **retain, confirmed by the operator**.
At gate `S10`, the operator selected `retain`, visible answer “上游标签: 保留”.
The alternatives were retention, an explicitly evaluated adjustment, or deferral.
Confirmed handoff wording: Never import upstream tags into the fork's tag namespace.
The workflow's concrete forbidden-command examples must be checked against actual Git behavior; do not rely solely on the remote default because explicit tag flags can override it.
Existing command prohibitions remain binding during review.
Intended destination: issue 27 transport safeguards.

### S11: No upstream push

Existing: `git push upstream` is forbidden and the remote push URL is disabled.

Disposition: **retain, confirmed by the operator**.
At gate `S11`, the operator selected `retain`, visible answer “上游推送: 保留”.
The alternatives were retention, a specified adjustment, or deferral.
Confirmed handoff wording: The synchronization workflow must not push to upstream.
Any future request to contribute upstream is a separately authorized operation, not an implied part of synchronization.
Intended destination: issue 27 transport and push safeguards.

### S12: Tag-set verification

Existing: S compares sorted local tag names before and after fetch; the later checklist prints only a tag count.

Disposition: **change, confirmed by the operator**.
At gate `S12`, the operator selected `change_name_oid`, visible answer “标签检查: 比较标签名和对象 OID”.
The alternatives were name-and-object comparison, retaining the name-set comparison with its limitations, or deferring.
The read-only command `git for-each-ref --format='%(refname) %(objectname)' refs/tags` was run successfully during this review and printed local tag refs and their object OIDs.

Confirmed handoff wording: Capture and compare local tag names and their referenced object OIDs before and after synchronization fetch operations.
A change stops the workflow for reporting and investigation; detection does not authorize recovery.
Retain the compared evidence in the execution record or an identified supporting artifact.
This catches same-name ref changes as well as added/deleted names; a mere count is insufficient.
Intended destination: issue 27 workflow verification, not a script edit in this issue.

### S13: Imported-tag recovery

Existing: delete accidentally imported tags, then rerun the script.

Disposition: **change, confirmed by the operator**.
At gate `S13`, the operator selected `change_approve_deletion`, visible answer “误导入标签: 列明依据，批准后删除”.
The alternatives were exact-list approval, automatic deletion only for proven current-operation imports, or manual operator recovery.

Confirmed handoff wording: Report the suspected imported tags, their provenance evidence, and the exact proposed deletion list; obtain operator approval before deleting them.
Uncertain provenance requires investigation, not an assumption that a tag is disposable.
Permission to synchronize or detect tag drift does not authorize deletion.
Intended destination: issue 27 tag-recovery gate.

### S14: Abandoning a merge

Existing: run `git merge --abort` to abandon conflicts and restore the pre-merge state.

Disposition: **change, confirmed by the operator**.
At gate `S14`, the operator selected `change_explicit_abort`, visible answer “放弃合并: 我明确选择放弃时”.
The alternatives were an explicit abandon decision, retaining abort as explanatory guidance only, or manual-only execution.

Confirmed handoff wording: Explain the merge work that abort would discard and execute `git merge --abort` only when the operator explicitly chooses to abandon that merge.
Complex conflicts or failed verification do not authorize automatic abort.
Intended destination: issue 27 merge-recovery gate.

## Merge checks, topology and generic handling

Source: H `Procedure` and `Conflict handbook`; A `Worktrees`; S `check_merge_preconditions` and merge invocation.

### M01: Main-branch precondition

Existing: merge only from `main`.

Disposition: **retain with stop behavior, confirmed by the operator**.
At gate `M01`, the operator selected `retain_stop_other_branch`, visible answer “分支: 保留，其他分支停止”.
Alternatives: retain and stop, request support for other branches, or defer.
Confirmed handoff wording: Merge upstream only on main; on any other branch, stop and report rather than automatically switch branches or rewrite history.
Intended destination: issue 27 preflight.

### M02: Correct origin precondition

Existing: refuse unless origin is this fork.

Disposition: **change, confirmed by the operator**.
At gate `M02`, the operator selected `change_exact_identity`, visible answer “origin 身份: 核对完整仓库身份”.
Alternatives: verify full identity, accept the script's existing substring guard alone, or defer.
Confirmed handoff wording: Verify that origin's complete repository identity is Jopqior/gotgenes-pi-packages using the verified supported SSH/HTTPS forms, rather than accepting an arbitrary URL containing that substring.
Stop on a mismatch; do not automatically modify the remote.
Issue 27 must verify the concrete address-recognition procedure before activating it.
Intended destination: issue 27 preflight; no script change in this issue.

### M03: Clean tracked state

Existing: require clean index and tracked worktree.

Disposition: **change, confirmed by the operator**.
At gate `M03`, the operator selected `change_inspect_untracked`, visible answer “工作区: 报告未跟踪文件，有风险则停”.
Alternatives: inspect/report untracked paths and stop on risk, block every untracked file, or retain tracked/index checks alone.
Confirmed handoff wording: Require a clean index and tracked worktree before merging.
Also report untracked files and stop when there is an overwrite risk or unclear ownership; unrelated temporary files do not automatically block synchronization.
Do not stash, delete, or commit existing work to satisfy this precondition without its own authorization.
Intended destination: issue 27 preflight.

### M04: No in-progress merge

Existing: refuse when `MERGE_HEAD` exists.

Disposition: **change, confirmed by the operator**.
At gate `M04`, the operator selected `change_verified_resume`, visible answer “已有 merge: 有完整本次记录才恢复”.
Alternatives: resume only with verified current-sync records, always stop for an explicit resume request, or defer.
Confirmed handoff wording: Do not begin another merge when one is in progress.
Resume the existing synchronization only after matching its inputs, authorization, and execution state to complete records for that synchronization; otherwise stop and ask.
Resumption does not authorize new repairs or re-execution of the merge.
Intended destination: issue 27 preflight and resume stage.

### M05: No in-progress rebase

Existing: refuse when a rebase state directory exists.

Disposition: **retain, confirmed by the operator**.
At gate `M05`, the operator selected `retain_stop`, visible answer “已有 rebase: 保留，停止同步”.
Alternatives: stop, design a specifically authorized recovery, or defer.
Confirmed handoff wording: Stop synchronization when a rebase is in progress; do not automatically continue or abort it.
Intended destination: issue 27 preflight.

### M06: Upstream merge topology

Existing: A says upstream integration preserves a genuine two-parent merge.

Disposition: **retain with verified applicability, confirmed by the operator**.
At gate `M06`, the operator selected `retain_with_preflight`, visible answer “双亲合并: 保留，并核对拓扑适用条件”.
Alternatives: retain with topology preflight, request fast-forward support with evidence-contract redesign, or defer.
Confirmed handoff wording: Preserve genuine two-parent topology for upstream integration, consistent with the current release-evidence requirement.
Check the actual ancestry and report fast-forward or already-incorporated cases before deciding how to proceed; do not manufacture a merge record.
Issue 27 must supply and verify executable preflight/handling rather than claim the existing script forces two parents.
Intended destination: issue 27 preflight, merge, and evidence stages.

### M07: Linear feature landing

Existing: feature worktrees rebase and fast-forward land, unlike upstream integration.

Disposition: **remove duplicate sync-workflow material, confirmed by the operator**.
Gate `M07` offered a short cross-reference, a repeated full explanation, or removal of the duplicate explanation.
The operator challenged the premise: “怎么就涉及到功能分支这些了？
似乎没有关系啊。”
The clarification acknowledged that feature landing is unrelated to upstream synchronization and proposed omitting even the cross-reference from the new workflow, without changing the existing feature workflows.
The operator answered: “对，直接删去是最好的。”

Confirmed handoff wording: Do not carry the feature-branch linear-landing explanation into the unified upstream synchronization workflow.
This removes unrelated duplicate prose, not the existing rules in `/sync-worktree` or `/ship`.
Intended destination: issue 27 cleanup inventory; no replacement sync-policy clause.

### M08: No wholesale ours/theirs

Existing: do not take either side wholesale.

Disposition: **change, confirmed by the operator**.
At gate `M08`, the operator's elaboration result identified `change_explicit_exception`, visible selection “禁止擅自覆盖，允许明确批准”, with note “确认。”
Alternatives: prohibit unapproved whole-file selection but allow an exact approval, retain an absolute ban, or remove the special prohibition while retaining the general approval gate.

Confirmed handoff wording: Do not take ours/theirs wholesale as an unreviewed shortcut.
A whole-file choice is permitted when the operator explicitly approves the specific file, selected side, and disclosed effects; verify the resulting scope.
That approval does not cover other files or a blanket conflict-resolution pass.
Intended destination: issue 27 conflict-resolution gate.

### M09: Keep fork and upstream behavior

Existing: preserve spawn selection and incoming upstream behavior.

Disposition: **change, confirmed by the operator**.
At gate `M09`, the operator's elaboration result identified `change_review_goal`, visible selection “改为审查目标，不授予修改权”, with note “同意。”
Alternatives: make preservation a review goal only, remove the broad requirement in favor of specific contracts, or defer.

Confirmed handoff wording: Review the fork and incoming upstream behaviors, disclose incompatibilities and any trade-offs, and obtain approval for implementation choices not covered by a confirmed rule.
Preserving both sides is a review goal, not authority to invent or apply arbitrary repairs.
Intended destination: issue 27 semantic review and conflict-resolution gate.

## First-merge recipes and fork identity

Source: H `First merge (before issue 3)` and `After issue 3`.
The first-merge instructions describe particular historical inputs, not a current compatibility proof.

### F01: Manager import union

**Remove, confirmed:** delete the first-merge manager import recipe from workflow guidance; original source is H `First merge`, and the recipe remains only in Git history (operator confirmation recorded under Review method).

### F02: Service import union

**Remove, confirmed:** delete the first-merge service import recipe from workflow guidance, without removing service methods; original source is H `First merge`, retained only in Git history (operator confirmation recorded under Review method).

### F03: Adapter import union

**Remove, confirmed:** delete the first-merge adapter import recipe from workflow guidance, without changing functionality; original source is H `First merge`, retained only in Git history (operator confirmation recorded under Review method).

### F04: Background presentation concatenation

**Remove, confirmed:** delete the historical background-presentation concatenation recipe from workflow guidance, not the functionality; source H `First merge`, gate F04 answer “后台代码拼接: 删除”.

### F05: Test import union

**Remove, confirmed:** delete the historical test-import recipe from workflow guidance, not the tests; source H `First merge`, gate F05 answer “测试 imports: 删除”.

### F06: Module-list union and recount

Original source: H `First merge`, unique module/token union followed by recounting.

#### F06a: Module/token union

**Remove, confirmed:** delete the mechanical union recipe; documentation should describe the actual implementation rather than preserve every old token, and edits still require coverage or approval (gate F06a answer “文档取并集: 删除”).

#### F06b: Recompute counts

**Remove duplicate, confirmed:** omit the first-merge recount reminder from the workflow; the repository-wide requirement to derive numbers from commands remains unchanged (gate F06b answer “重新计数: 删除重复提醒”).

### F07: Service method preservation

Original source: H `First merge`, fixed method-preservation list.

#### F07a: Resume

**Remove duplicate, confirmed:** omit the fixed `resume(...)` preservation line from the workflow, without changing the API or approving removal; review affected interfaces against their current contracts (gate F07a answer “resume 方法: 删除重复说明”).

#### F07b: Provider registration

**Remove duplicate, confirmed:** omit the fixed `registerSpawnSelectionProvider(...)` preservation line from the workflow, without removing selection functionality or authorizing an API change (gate F07b answer “选择注册方法: 删除重复说明”).

### F08: Fork manifest identity

Original source: H `After issue 3`, fork manifest identity preservation.

#### F08a: Fork package name

**Retain, confirmed:** during requested synchronization, preserve or precisely restore `packages/pi-subagents/package.json`'s `name` as `@jopqior/pi-subagents` and report the action; this authorizes no other rename (gate F08a answer “Fork 包名: 保留，可按规则恢复并报告”).

#### F08b: Fork version

**Retain, confirmed:** preserve or precisely restore that manifest's pre-sync fork version and report the action; do not substitute the upstream version or manually select the next fork version, which belongs to release calculation (gate F08b answer “Fork 版本: 保留，可按规则恢复并报告”).

### F09: Other manifest changes

Original source: H `After issue 3`, taking upstream changes outside name/version.

#### F09a: Dependencies

**Change, confirmed:** remove blanket permission to select upstream dependency fields when authoring a conflict resolution or extra dependency adjustment; present differences, compatibility effects, and the proposed handling for approval first (gate F09a answer “依赖冲突: 取消，先报告方案并批准”).
The briefing distinguished ordinary Git auto-merged upstream changes within the requested merge from authored resolutions or subsequent repairs; this decision does not introduce per-field approval for the former.

#### F09b: Non-identity metadata

**Change, confirmed:** remove blanket permission to choose upstream non-identity metadata; authored conflict resolutions or extra changes, including exports, files, and scripts, require a presented proposal and approval, while ordinary automatic merging is not per-field approval (gate F09b answer “元数据冲突: 取消，人工调整先批准”).

### F10: Preserve fork changelog entries

**Retain, confirmed:** keep published fork changelog entries unchanged in content, version, and order; do not rewrite them to align with upstream (source H `After issue 3`, gate F10 answer “Fork 历史: 保留”).

### F11: Insert incoming upstream changelog sections

**Retain with bounds, confirmed:** when the shared baseline and genuinely new sections are unambiguous, insert incoming upstream changelog sections verbatim after fork entries and before shared history, and report the edit; overlapping entries, reordering, or revisions to historical entries require approval first (source H `After issue 3`, gate F11 answer “上游条目拼接: 允许精确、无歧义的拼接”).

## New-package wiring

Source: H `After issue 3`; R `Adding a new package`.
H's reference to an “AGENTS.md four-place list” is stale; the actual list is in R. Discovery of a new directory does not itself approve these mutations.

### N01: Local package loading

**Change, confirmed:** discovering a new upstream package does not authorize adding its local Pi load path; explain its purpose and loading effects and obtain approval before editing settings (source H `After issue 3` and R `Adding a new package`, gate N01 answer “加载新扩展: 不自动加载，先批准”).

### N02: README package entry

**Change, confirmed:** report a missing README package entry and include the proposed addition in a documentation proposal for approval before writing it (source R `Adding a new package`, gate N02 answer “README 包表: 纳入文档方案先批准”).

### N03: Dedicated-skill note

**Remove sync-specific recipe, confirmed:** do not duplicate the no-dedicated-skill wiring instruction in the sync workflow; if a change is needed, include it in the documentation proposal for approval (source R `Adding a new package`, gate N03 answer “Skill 分类说明: 删除同步中的专门规则”).

### N04: Bug-report dropdown

**Retain automatic action, confirmed:** for a real newly added upstream package, add its missing Package option to the fork's bug-report form and report the edit; no other form redesign is covered (source R `Adding a new package`, gate N04 answer “Bug 表单: 允许自动补齐并报告”).

### N05: Feature-request dropdown

**Retain automatic action, confirmed:** for a real newly added upstream package, add its missing Package option to the fork's feature-request form and report the edit; no other form redesign is covered (source R `Adding a new package`, gate N05 answer “Feature 表单: 允许自动补齐并报告”).

### N06: GitHub package label

**Retain bounded automatic action, confirmed:** create the missing `pkg:<name>` GitHub label for a real newly added upstream package in `Jopqior/gotgenes-pi-packages` and report it, subject to verified explicit fork targeting; this does not authorize editing unrelated existing labels (source R `Adding a new package`, gate N06 answer “GitHub Label: 允许自动创建并报告”).

### N07: Release registration and npm disable entry

Original source: H `After issue 3` and R `Adding a new package`.

#### N07a: Release registration

**Remove sync-specific recipe, confirmed:** leave package registration to the separate publishing workflow and preserve its existing identity/provenance gates; synchronization does not automatically register discovered packages (gate N07a answer “发布注册: 从同步规则删除”).

#### N07b: Post-publication npm disable entry

**Remove sync-specific recipe, confirmed:** leave duplicate-load prevention configuration to the separate publishing/installation workflow rather than prescribe another synchronization action (gate N07b answer “防重复加载: 从同步规则删除”).

## Fork lookup, phases and auto-merged documents

Source: H `Conflict handbook`, `Auto-merged both-sides paths`, and `Compatibility integration for fork issue 14`; A fork identity rules.

### I01: Fork issue lookup

**Retain exact restoration, confirmed:** restore an unambiguously dropped fork issue lookup that checks `fNNNN-` first and falls back to `NNNN-` only when no fork match exists, and report the edit; changed lookup structure or multiple valid implementation choices require approval first (source H `Auto-merged both-sides paths`, gate I01 answer “Issue 查找: 保留精确恢复并报告”).

### I02: Fork issue naming

**Remove duplicate, confirmed:** omit the repeated fork issue filename convention from the sync workflow; the existing AGENTS and Markdown-skill convention remains unchanged (gate I02 answer “Issue 文件名: 删除重复说明”).

### I03: Independent fork phase allocation

**Remove duplicate, confirmed:** omit the repeated fork phase identity/allocation definition from the sync workflow; existing independent phase conventions remain binding and repairs still require coverage or approval (source H `Conflict handbook`, gate I03 answer “Phase 编号: 删除重复定义”).

### I04: Coexisting phase archives

Original source: H `Conflict handbook`, independent archive identities and history rows.

#### I04a: Upstream numeric archives

**Remove duplicate, confirmed:** omit the separate numeric-archive preservation instruction, covered by merging non-customized upstream content as supplied (gate I04a answer “上游归档: 删除重复说明”).

#### I04b: Fork archives

**Retain, confirmed:** do not overwrite or rename a fork phase archive because an upstream numeric phase has the same numeric suffix; this grants no unrelated history-reorganization authority (gate I04b answer “Fork 归档: 保留”).

#### I04c: Independent added history rows

**Retain bounded reconciliation, confirmed:** preserve verbatim and report both sides' newly added independent history-table rows when their identities are distinct and unambiguous; conflicting versions of one record, duplicate identities, or unclear links require approval first (gate I04c answer “历史表新增行: 允许，并报告”).

### I05: Auto-merged path inspection

**Retain scoped review, confirmed:** inspect actual affected fork-customized paths for semantic preservation even when Git reports no conflicts; do not turn this into per-package adoption approval for non-customized upstream packages, and do not repair uncovered findings without approval (source H `Auto-merged both-sides paths`, gate I05 answer “无冲突也检查: 保留，按定制影响范围检查”).

### I06: Restore dropped selection prose

**Remove, confirmed:** delete the blanket authority to restore every dropped spawn-selection sentence; evaluate current contracts rather than automatically restore potentially obsolete wording (source H `Auto-merged both-sides paths`, gate I06 answer “恢复旧句子: 删除”).

### I07: Fork scope header and adjacent conventions

**Change to review only, confirmed:** verify that fork priority and safeguards remain effective, but obtain approval for header or related rule rewrites not covered by a precise confirmed rule; preservation is not authority to compose replacement policy (source H `Compatibility integration for fork issue 14`, gate I07 answer “Fork 规则头部: 核对边界，未覆盖的改写先问”).

### I08: Move dispositions with archived roadmaps

**Retain bounded migration, confirmed:** when an upstream roadmap moves to history, move its fork dispositions verbatim only when source, destination, and owning phase are unambiguous, and report the action; uncertain ownership or location requires approval first (source H `Compatibility integration for fork issue 14`, gate I08 answer “处置记录迁移: 明确归属时原样迁移并报告”).

## Selector implementation recipes: removed as a group

**Remove from workflow guidance, confirmed:** B01–B10 and P01–P11, including their independent subitems, are not carried into the unified workflow; review affected package behavior against its current package contracts instead.
Sources: H `Startup selection after issue 20` and `Spawn presentation after issue 21`, with technical evidence in T and U. The gate briefing named startup ownership, observer order, cancellation, scope/factory handling, formatting, pending presentation, and fallback as the scope being removed from duplicated workflow guidance.
At gate `selector_workflow_detail`, the operator selected `remove_workflow_recipes`, visible answer “Selector 实现清单: 整体移除，不再逐项审议实现细节”.
The alternative was continuing individual implementation-detail review; the briefing explicitly identified this as a change to the plan's review granularity.
This removes workflow recipes and their purported automatic-adaptation authority, not package contracts, runtime behavior, or the technical evidence documents themselves.
It does not approve a public API change, turn historical trials into general compatibility proofs, or waive the approval gate for uncovered repairs.
Original per-item inventory bodies remain in Git history rather than being re-archived here.

## Historical compatibility and one-time permissions: removed as a group

**Remove, confirmed:** omit H01–H09, including subitems, from the unified workflow; the issue 14 migration details and one-time override-deletion/publication permissions remain only in Git history, without changing current package contracts or release safeguards (source H `Compatibility integration for fork issue 14`).
At gate `historical_compatibility_group`, the operator selected `remove_group`, visible answer “旧兼容章节: 整段移除，原文只留 Git”, explicitly choosing group removal rather than continued per-detail review.
No past permission becomes a new deletion or publication authorization.

## Lockfile, validation and merge completion

Source: H `Procedure`; P `Notes for Agents`; R dependency-change validation.

### V01: Lockfile regeneration

**Retain bounded routine installation, confirmed:** after merging, allow `pnpm install` from the repository root to regenerate the lockfile against the incorporated manifests and report the resulting changes; stop and ask about unexpected dependency changes or other effects outside the expected installation scope (source H `Procedure`, gate V01 answer “锁文件重建: 保留例行安装，异常变化再问”).
The briefing disclosed that installation writes files and may execute install scripts, rather than being a read-only check.
This authorizes the bounded installation, not an open-ended dependency repair or silent acceptance of unexpected changes.

### V02: Rumdl cache clearing

**Retain bounded cleanup without separate reporting, confirmed:** after file moves or renames, clear only the regenerable local rumdl cache without a separate approval prompt or report; other deletion targets are not covered (source H `Procedure`, gate V02 and operator follow-up).
The operator qualified the initial choice: if generic lint already triggers cleanup, avoid duplication; otherwise “允许清理且不用报告”.
Inspection of root `package.json` showed no cache-cleaning command in `lint`; `git-workflow` contains a textual instruction, and the sync script does not itself run lint.
The assistant explained those facts and the resulting no-separate-report boundary; the operator answered “继续。”
Issue 27 may reference the generic cleanup instruction instead of repeating its command; it must still ensure cleanup occurs when required.

### V03: Type checking

**Retain, confirmed:** run workspace-wide `pnpm run check` after synchronization; failures do not authorize uncovered repairs (source H `Procedure`, gate V03 answer “类型检查: 保留”).

### V04: Lint checking

**Retain checking only, confirmed:** run repository-wide `pnpm run lint`; this grants no permission to alter lint rules, add suppressions, or apply uncovered fixes (source H `Procedure`, gate V04 answer “Lint: 保留检查，不附带修复授权”).

### V05: Package tests

**Retain, confirmed:** run tests for all workspace packages, including non-customized upstream packages, to validate integration and shared dependency effects; this is verification, not per-package adoption approval or repair authority (source H `Procedure`, gate V05 answer “包测试: 保留全包测试”).

### V06: Script tests

**Retain complete suite, confirmed:** run root `pnpm run test`, which currently executes all workspace package tests followed by root script tests; do not separately repeat package tests just to satisfy V05 (gate V06 answer “脚本测试: 是，复用 pnpm run test”; root package.json was inspected).

### V07: Dependency-change analysis

**Retain conditional check, confirmed:** run `pnpm fallow dead-code` when synchronization introduces a new package or changes dependencies; the check grants no suppression or repair permission (source R `Docs-in-distribution convention`, gate V07 answer “Dead-code 检查: 保留条件检查”).

### V08: Validation-induced writes

**Confirm boundary:** inspect and classify unexpected project-file changes from validation tools; proceed only within existing exact rule/approval coverage, otherwise request approval before deciding how to handle them, without automatically committing or reverting them (gate V08 answer “意外改写: 是，保留这条边界”).
Ordinary cache/test artifacts are not reported individually as source edits; the explicit rumdl cleanup exception in V02 remains applicable.

### V09: Manual merge completion

**Change, confirmed:** before staging authored resolutions and continuing a manual merge, match each actual change to exact confirmed rule coverage or operator approval; proceed without redundant approval only when no uncovered scope remains, otherwise stop (source H `Procedure`, gate V09 answer “继续合并: 是，核对后继续”).
This does not promise to intercept Git's own conflict-free merge commit before creation; later extra edits remain gated.

### V10: Sync execution log

**Change, confirmed:** store sync inputs and relevant OIDs in the per-sync execution record instead of maintaining a second manual sync-log table; issue 27 migrates necessary old history (source H `Procedure`, gate V10 answer “同步日志: 是，不重复维护日志”).

## Release evidence and calculations

Source: H `Core sync evidence`, `Mapping rule`, `Blocking cases`, `Recording a completed sync`; R `Core package release levels`.
The current algorithms are evidence inputs, not targets for alteration in this issue.

### E01: Committed evidence ownership

**Retain separation, confirmed:** the existing machine record remains responsible for release evidence and calculation, while the per-sync record captures proposals, operator approvals, and execution; neither substitutes for the other and no new approval database is introduced (source H `Core sync evidence`, gate E01 answer “发布证据: 保留分离”).

### E02: Reviewed merge identity

**Retain, confirmed:** bind the evidence review to the actual final merge OID and its reviewed diff, not a different revision; writing evidence does not retroactively authorize source edits (source H `Core sync evidence`, gate E02 answer “绑定实际合并: 保留”).

### E03: Fork contribution classification

**Confirm agent classification with reporting:** the agent may classify approved actual resolution effects as `none|patch|minor|major`, provide the rationale and supporting diff, and record that input; ambiguity or insufficient evidence requires asking the operator (gate E03 selection `agent_classify_report`).
The operator asked whether the script already decides this; inspection of `record-core-sync.mjs` and `core-sync.mjs` confirmed that the recorder accepts an explicit reviewed `forkLevel`, while final version calculation combines upstream distance, fork commits, and that input.
After this distinction was explained, the operator answered “同意，继续。”
This grants no manual version selection or publication permission; final versions remain script-produced.

### E04: Non-none justification

**Remove duplicate explanation, confirmed:** the justification guard remains in the release mechanism, not copied into sync policy; see the release-mechanism group decision below.

### E05: Recorder entry and commit

**Retain scoped recording, confirmed:** after completing and reviewing the actual merge, use the existing sync entry to record that merge's reviewed contribution and commit the state update, following the confirmed transport/tag safeguards and reporting the result; its current fetch side effect is not exempted as an offline write (source H `Recording a completed sync`, gate E05 answer “正常记录: 允许，遵守已有保护并报告”).

### E06: State conflict correction

**Require explicit approval, confirmed:** before correcting conflicting or erroneous existing evidence, present the contradiction, supporting facts, and exact proposed state changes for operator approval; a release blocker does not authorize historical-state repair (source H `Core sync evidence`, gate E06 answer “纠正已有证据: 是，展示依据和精确修改”).

### E07: Highest incorporated stable upstream release

**Remove duplicate explanation, confirmed:** incorporated-release selection remains the release mechanism's responsibility; no algorithm or guard is removed.

### E08: Upstream SemVer distance

**Remove duplicate explanation, confirmed:** upstream SemVer calculation remains with the release mechanism, not repeated in sync policy.

### E09: Maximum contribution, not accumulation

**Remove duplicate explanation, confirmed:** contribution combination remains with the release mechanism, unchanged.

### E10: Fail-closed evidence cases

**Remove duplicate explanation, confirmed:** E10a–E10h remain enforced release-evidence checks; the workflow calls validation and stops on errors instead of duplicating or bypassing the checks.

### E11: Idempotence and no override

**Remove duplicate explanation, confirmed:** E11a–E11c remain properties of the owning mechanism, including conflict refusal and no override.

### E12: Offline revalidation

**Remove duplicate explanation, confirmed:** E12a/E12b remain release read-time checks; recording evidence does not exempt it from validation.

### Release-mechanism group decision

At gate `release_mechanism_group`, the operator selected `remove_duplicate_mechanism`, visible answer “算法说明去重: 是，引用所属发布机制”.
The explicitly listed scope was E04, E07–E12, C02, C03, C05, and C06, including their subitems, as an alternative to continued per-algorithm deliberation.
Retain existing algorithms, data, and checks in their owning release implementation/documentation; the sync workflow calls the mechanism and stops on failures rather than copying its internals.
Issue 27 coordinates destinations with issue 29; this is neither data deletion nor authority to repair inconsistent state.

## Correspondence and release lifecycle

Source: H `Release correspondence lifecycle` and `Version correspondence`; R `Dispatching a release` and `A package's first release`.

### C01: Generated correspondence ownership

**Retain generated-only ownership, confirmed:** never hand-add or repair correspondence rows; after an approved state change, use the generator and validator without a redundant approval for the same derived result, while normal release generation remains with the release mechanism (source H `Version correspondence`, gate C01 answer “生成对应表: 保留”).
Generation does not authorize an unapproved state edit; issue 27 migrates required data and generator consumers.

### C02: No unreleased row on sync alone

**Remove duplicate explanation, confirmed:** keep release-row generation with the release mechanism; a sync alone does not create a released version (release-mechanism group decision).

### C03: Exact upstream provenance

**Remove duplicate explanation, confirmed:** preserve fixed-source provenance data and its non-equivalence disclosure in the owning release artifacts, not another sync-policy copy (release-mechanism group decision).

### C04: Registered identities and all-package preflight

Original source: H `Release correspondence lifecycle` and R release gates.

#### C04a: Registration and all-package preflight

**Remove duplicate, confirmed:** reference the owning release mechanism instead of repeating its registration and all-package checks in sync policy; those checks remain unchanged and mandatory (gate C04a answer “发布预检查: 删除重复说明，校验不变”).

#### C04b: Independent publication approval

**Confirm explicit release gate:** after synchronization, proactively predict and report releasable packages and versions; if a release is needed, obtain approval naming the packages, npm scope, and destination, then execute and verify it rather than wait for another reminder; sync/registration/push authority does not authorize publication (gate C04b answer “发布批准: 确认”, consistent with issue 27).

### C05: Tagged artifacts and Release bodies

**Remove duplicate explanation, confirmed:** C05a–C05c remain tagged-artifact and Release-body protections in the release mechanism (release-mechanism group decision).

### C06: Sibling-only publication isolation

**Remove duplicate explanation, confirmed:** preserve sibling-publication isolation in the owning release mechanism without adding another fork package (release-mechanism group decision).

### C07: Immutable published history

**Retain, confirmed:** do not rewrite published tarballs, tags, or historical changelog sections; separately authorized Release-note backfill does not waive those protections (source H `Version correspondence`, gate C07 answer “已发布历史: 保留”).

### C08: First release and retry boundaries

**Remove duplicate group, confirmed:** C08a–C08d remain with the owning release workflow, including operator-chosen first publication, new-fork evidence review, failed-job retry after preparation, and checkout/tag verification; reference that workflow rather than maintain another sync-specific copy (gate C08 answer “首次发布与重试: 整组去重，引用发布流程”).

## Historical Release editing: outside synchronization

**Remove from sync workflow as a group, confirmed:** G01–G07 and their subitems belong to independently authorized release maintenance, not synchronization (source H `Historical GitHub Release notes`, gate G_group answer “历史文案回填: 移出同步，独立审批保护保留”).
Preserve the backfill tool, exact-edit approval, preview/revalidation/readback, disclosure and artifact protections; issue 27 gives necessary guidance an appropriate release-owned home when deleting the handbook.
This does not authorize running backfill during synchronization or deleting its safeguards.

## Recent practices and adjacent authority hazards

Source: the integration evidence above; A environment/target rules; D `Scope bounds`; P domain-boundary guidance; R release safeguards.

### X01: Remerge-diff accounting

**Retain, confirmed:** inspect remerge diff together with post-merge commits to account for authored resolutions and extra adaptations against authorization; neither tool output nor a clean final diff proves approval or semantic completeness (gate X01 answer “整合改动核对: 保留该检查”).

### X02: Independent integration review

**Retain independent read-only review, confirmed:** after verification and before pushing, review affected fork customizations including automatically merged paths, and disclose unperformed checks; reviewer findings are proposals, not permission to edit (gate X02 answer “独立审查: 保留”).

### X03: Manifest-derived workspace identity

**Allow narrow adaptation with reporting, confirmed:** replace an assumed workspace identity in a check command with the actual manifest name only when it still targets the same package with unchanged purpose, scope, and check strength; other command semantics or scope changes require approval first (gate X03 answer “实际包名: 允许窄范围适配并报告”).
This permits neither renaming the package nor using the adjustment as a pretext to alter checks.

### X04: Publication visibility recheck

**Retain, confirmed:** when publication reports success but registry visibility lags, wait and recheck rather than blindly republish; if visibility remains unverified, report workflow success and pending visibility separately, not verified publication (gate X04 answer “Registry 可见性: 保留该做法”).
The owning release workflow sets the practical wait/recheck procedure.

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
Each subitem inherits the original source and evidence limits from its parent section; its explicit decision, or an explicitly approved group-removal decision, determines its status.
Subitem names retained below are historical inventory identities, not pending exceptions to a confirmed group removal.
Individual deliberation has started: S01 confirms entry semantics; S02a/S02b limit discovery obligations to synchronization; S03 retains the bounded script entry; S04 requests SSH and HTTPS support; S05 requires approval before existing-URL changes.
S06a requires a protocol choice before creating a missing upstream remote; S06b/S06c authorize their exact protective configuration writes with recording.
S07a requires approval before changing the GitHub default; S07b retains verified wrapper use with explicit-command fallback; S08 retains explicit fork targeting for mutations.
S09 retains explicit verified push targets; S10 prohibits upstream tag imports; S11 prohibits upstream pushes within synchronization.
S12 requires tag-name/object comparison; S13 gates exact tag deletions; S14 gates abort on an explicit abandon decision.
M01 requires main; M02 requires complete origin identity verification; M03 requires clean tracked/index state and review of untracked-file risks.
M04 permits only verified current-sync resumption; M05 stops on an existing rebase; M06 retains genuine two-parent integration with ancestry preflight and an implementation handoff.
M07 removes unrelated feature-landing prose from the sync workflow; M08 allows whole-file side selection only with specific approval; M09 makes broad preservation a review goal, not repair authority.
F01 through F05 remove first-merge import/concatenation recipes without relocating their historical bodies; F06a removes mechanical documentation unions.
F06b removes a duplicate recount reminder; F07a/F07b remove duplicate method-name reminders without changing API contracts.
F08a/F08b authorize exact preservation/restoration of fork name and pre-sync version with reporting; F09a/F09b require approval for authored dependency/metadata resolutions or extra adjustments.
F10 preserves published fork changelog entries; F11 authorizes only verbatim, unambiguous insertion of new upstream sections with reporting.
N01/N02 require approval for extra package-loading and README-table edits; N03 removes the sync-specific skill-classification recipe; N04/N05/N06 allow bounded missing dropdown/label additions with reporting.
The later package-scope clarification confirms that non-customized upstream packages, including new ones and their supplied wiring, merge as supplied without individual adoption approval.
Extra agent-authored loading/README wiring still requires approval, while specifically confirmed form/label rules provide their own bounded coverage.
N07a/N07b remove sync-specific release-registration and post-publication loading recipes without weakening the owning workflows' safeguards.
I01 permits only unambiguous restoration of fork-first issue lookup with reporting; I02/I03/I04a remove duplicate issue/phase/upstream-archive instructions.
I04b protects fork archive identity; I04c permits only unambiguous independent added history rows to coexist verbatim, with reporting.
I05 requires scoped semantic review after auto-merge; I06 removes blanket sentence restoration; I07 limits header preservation to review unless exact edit coverage exists; I08 permits only unambiguous verbatim disposition migration.
The operator explicitly changed review granularity to remove all B/P selector implementation recipes from the workflow as a group, without removing package contracts or technical evidence.
The operator also approved group removal of H01–H09's obsolete migration/one-time-permission chapter.
V01 permits bounded routine installation and requires escalation of unexpected effects; V02 permits exact rumdl cache cleanup after moves without a separate report.
V03/V04/V05 retain workspace typechecking, repository lint, and all-package tests without implied repair authority.
V06 uses the full root test command including script tests; V07 retains conditional dead-code checking; V08 gates handling unexpected project-file writes without treating ordinary cache output as source edits.
V09 requires authorization accounting before manual merge completion; V10 replaces the duplicate sync log with execution records; E01 preserves machine/human record separation.
E02 binds review to the actual merge; E03 permits agent classification of approved resolution effects with reporting, not manual final version selection.
The explicitly approved release-mechanism group removes only duplicate explanations, retaining all existing algorithms, data, and checks.
E05 permits normal scoped evidence recording; E06 gates existing-evidence corrections; C01 preserves generated-only correspondence and allows regeneration from approved state.
C04a/C08 remove duplicate release-preflight/bootstrap/retry prose; G01–G07 move out of sync workflow responsibility while retaining their independent tools and approval safeguards.
C04b confirms proactive prediction and independently approved publication; C07 protects immutable history; X04 requires honest visibility verification without blind republication.
X01 requires integration-diff authorization accounting; X02 requires independent read-only review before push; X03 permits only same-workspace, same-semantics manifest-name adaptation with reporting.
Concise dispositions and original source identification suffice.
All other items remain pending.
S04 adds a transport mechanism requirement beyond this documentation-only implementation; hand it to issue 27 for ownership and verified implementation, without changing the current script here.
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
