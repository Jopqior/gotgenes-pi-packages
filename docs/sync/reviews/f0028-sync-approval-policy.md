# Synchronization rule review for fork issue 28

## Status and authority

This is a historical deliberation record, not an active synchronization policy or an approval to perform a merge.
All items have recorded individual or explicitly authorized group dispositions; none is activated here.
An index group alone is not approval.
Existing safeguards remain binding during this review; removing duplicate wording would not repeal them.
The sole future policy source belongs to the unified workflow in [#27].
No rule is activated by committing this file.
Issue [#29] owns release-mechanism terminology; existing names below identify evidence, not approved future names.

## Record organization decision

In build session `2026-09-26T12-51-41-930Z_01a0ddc5-7aea-7605-841f-339bc6b98b89`, the operator selected `record_location=sync_tree` (“集中到 docs/sync/”) and `record_layout=index_sections` (“索引表＋独立规则小节”), approving this review path and an index with independent rule sections preserving sources, alternatives, answers, bounds, destinations, and decision history without a hard line limit.
The proposed execution-record path was `docs/sync/runs/<UTC timestamp>-<upstream short SHA>.md`, requiring no issue number; [#27] owns implementation and filename collisions, filenames are not sufficient input identity, and stage summaries stay in `docs/retro/f0028-sync-approval-policy.md`.

This was organization approval only; subsequent gate evidence in this record belongs to the same build review unless otherwise identified, and quoted answers are retained independently of local transcripts.

## Review method

The review presented retain/change/remove alternatives and recorded actual answers separately from recommendations.
Dispositions distinguish removed authority, duplicate prose, and preserved evidence; superseding clarifications retain the material decision history.

After the operator requested brief history and the assistant inspected `sync-worktree.md`, `ship-no-issue.md`, and `audit-agent-docs.md`, the proposal was to delete F01–F03 from workflow guidance, keep only concise dispositions/sources here, and leave original recipes solely in Git history; the operator answered “好，继续。”
This confirmed concise recordkeeping and F01–F03 removal, not blanket removal of the remaining queue or a new archive of obsolete recipes.

## Later package-scope clarification

The operator clarified: “除了我真正修改/新增的包，对于其他就直接合并就行了，比如上游的新增包。”
Confirmed direction: incorporate upstream packages not customized by this fork, including newly added upstream packages, as supplied rather than requiring a separate adoption decision for each package.
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

The sections record completed dispositions and bounds; the package-scope clarification preceding this index supersedes N01/N02's original scope.
The closing handoff identifies integration blockers, including S04's unimplemented transport requirement.

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

**Change, confirmed (gate S01):** the operator challenged a possible extra start gate: “我如果调用了 /upstream-sync 这个 prompt 肯定就是请求同步了呀？”
After clarification that invocation is the request and only uncovered edits need further approval, the operator answered “明白了，同意你。”

Confirmed handoff wording: Invoking `/upstream-sync` requests synchronization and enters that workflow without asking again whether to start.
Merely discovering upstream updates in another workflow does not authorize starting a merge.
Uncovered conflict resolutions and extra integration edits still require advance operator approval.
This clause does not bypass precondition checks or approve a specific recovery action.

Intended destination: issue 27 workflow entry and authorization boundaries.

### S02: Check upstream before publishing

Existing: “Before a fork publish, check whether upstream main has new commits or a new pi-subagents release.”
This parent paragraph has separate decisions for commit discovery and release discovery.

#### S02a: Upstream commit discovery

Disposition: **change, confirmed by the operator**.
At the recovery gate `S02a`, the operator selected `change_sync_only`, visible answer “检查提交: 仅在同步工作流内”.

Confirmed handoff wording: Check for new upstream main commits within the synchronization workflow.
An independent fork publication does not require an additional upstream commit-discovery query.
Discovery does not authorize an automatic merge outside the requested synchronization workflow.
Existing release-evidence validation remains required.

Intended destination: issue 27 inspection stage and the publishing-stage handoff.

#### S02b: Upstream release discovery

Disposition: **change, confirmed by the operator**.
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

Confirmed handoff wording: Perform synchronization fetch/merge actions through `scripts/upstream-sync.sh`, not ad-hoc equivalent commands.
Ordinary non-mutating Git inspection, including status, diff, history, and script help, may run directly.
The no-argument script mode is not a read-only inspection exemption: it configures the remote and fetches.
Intended destination: issue 27 execution entry and inspection stage.

### S04: SSH transport

Existing: upstream fetch and tag queries use `git@github.com:gotgenes/pi-packages.git` and require SSH read access.

Disposition: **change requested and confirmed by the operator; mechanism integration pending**.
At gate `S04`, the operator selected `change_https_support`, visible answer “SSH 要求: 希望同时支持 HTTPS”.
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

Confirmed handoff wording: If upstream is absent, present the SSH and HTTPS addresses for `gotgenes/pi-packages`, obtain the operator's protocol choice, and then create the remote with that selected address.
Do not silently choose a protocol or another repository.
The choice covers that creation only; existing-URL changes remain governed by S05.
The workflow must ask before invoking the current script, which otherwise creates the SSH remote automatically.
Intended destination: issue 27 transport setup; HTTPS execution depends on S04's mechanism handoff.

#### S06b: No-tag default

Disposition: **retain automatic action with reporting, confirmed by the operator**.
At gate `S06b`, the operator selected `retain_automatic`, visible answer “禁跟随标签: 自动设置并记录”.

Confirmed handoff wording: Within requested synchronization, set the upstream remote's `tagOpt` to `--no-tags` and record that configuration action without a separate prompt.
This covers correcting an absent or different value on that remote, not deleting tags or changing unrelated configuration.
Intended destination: issue 27 transport safeguards and execution accounting.

#### S06c: Disabled upstream push URL

Disposition: **retain automatic action with reporting, confirmed by the operator**.
At gate `S06c`, the operator selected `retain_automatic`, visible answer “禁上游推送: 自动设置并记录”.
The briefing and selected option explicitly disclosed that this can overwrite an existing custom push URL.

Confirmed handoff wording: Within requested synchronization, set upstream's `pushurl` to `DISABLE`, including replacing an existing value, and record the configuration action without a separate prompt.
This authorizes that push-protection setting only, not changing the upstream fetch URL or any other remote's push URL.
Intended destination: issue 27 transport safeguards and execution accounting.

### S07: GitHub default targeting

Existing: pin the CLI default to `Jopqior/gotgenes-pi-packages` when adding upstream; recheck the default for tools without a repository parameter.

#### S07a: Default repository configuration

Disposition: **change, confirmed by the operator**.
At gate `S07a`, the operator selected `change_ask_before_set`, visible answer “默认仓库配置: 修改默认值前先确认”.

Confirmed handoff wording: Prefer explicitly targeted GitHub commands; adding an upstream remote does not authorize changing the GitHub CLI default repository.
If changing that default is necessary, present the change and obtain operator approval before writing it.
Intended destination: issue 27 GitHub targeting and configuration recovery.

#### S07b: Tools without a repository argument

Disposition: **retain, confirmed by the operator**.
At gate `S07b`, the operator selected `retain_check_fallback`, visible answer “无仓库参数工具: 保留，错目标时用显式 gh”.

Confirmed handoff wording: Before using tools without a repository argument, verify that the GitHub CLI default resolves to `Jopqior/gotgenes-pi-packages`.
If it does not, use an equivalent `gh` command with an explicit fork repository argument instead; do not silently repair the default.
If no suitable explicit alternative is available, stop and request a decision rather than operate against the wrong repository.
Intended destination: issue 27 GitHub inspection and CI stages.

### S08: Explicit GitHub mutation target

Existing: verify the target and pass `--repo Jopqior/gotgenes-pi-packages` where supported.

Disposition: **retain, confirmed by the operator**.
At gate `S08`, the operator selected `retain_explicit_target`, visible answer “GitHub 写操作: 保留”.

Confirmed handoff wording: Before a GitHub mutation, verify the target repository and explicitly pass `--repo Jopqior/gotgenes-pi-packages` where supported.
Target verification does not authorize the mutation itself.
Intended destination: issue 27 GitHub mutation checkpoints.

### S09: Explicit push target

Existing: verify the remote URL and name the remote and branch before pushing.

Disposition: **retain, confirmed by the operator**.
At gate `S09`, the operator selected `retain`, visible answer “推送目标: 保留”.
Confirmed handoff wording: Before an authorized push, verify the intended remote URL and explicitly name the remote and branch in the push command.
This target check does not authorize pushing.
Intended destination: issue 27 push checkpoint.

### S10: No upstream tag imports

Existing: never import upstream tags; forbidden examples include tag-forcing fetches, flagless upstream fetch, and `git fetch --all`.

Disposition: **retain, confirmed by the operator**.
At gate `S10`, the operator selected `retain`, visible answer “上游标签: 保留”.
Confirmed handoff wording: Never import upstream tags into the fork's tag namespace.
The workflow's concrete forbidden-command examples must be checked against actual Git behavior; do not rely solely on the remote default because explicit tag flags can override it.
Existing command prohibitions remain binding during review.
Intended destination: issue 27 transport safeguards.

### S11: No upstream push

Existing: `git push upstream` is forbidden and the remote push URL is disabled.

Disposition: **retain, confirmed by the operator**.
At gate `S11`, the operator selected `retain`, visible answer “上游推送: 保留”.
Confirmed handoff wording: The synchronization workflow must not push to upstream.
Any future request to contribute upstream is a separately authorized operation, not an implied part of synchronization.
Intended destination: issue 27 transport and push safeguards.

### S12: Tag-set verification

Existing: S compares sorted local tag names before and after fetch; the later checklist prints only a tag count.

Disposition: **change, confirmed by the operator**.
At gate `S12`, the operator selected `change_name_oid`, visible answer “标签检查: 比较标签名和对象 OID”.
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

Confirmed handoff wording: Report the suspected imported tags, their provenance evidence, and the exact proposed deletion list; obtain operator approval before deleting them.
Uncertain provenance requires investigation, not an assumption that a tag is disposable.
Permission to synchronize or detect tag drift does not authorize deletion.
Intended destination: issue 27 tag-recovery gate.

### S14: Abandoning a merge

Existing: run `git merge --abort` to abandon conflicts and restore the pre-merge state.

Disposition: **change, confirmed by the operator**.
At gate `S14`, the operator selected `change_explicit_abort`, visible answer “放弃合并: 我明确选择放弃时”.

Confirmed handoff wording: Explain the merge work that abort would discard and execute `git merge --abort` only when the operator explicitly chooses to abandon that merge.
Complex conflicts or failed verification do not authorize automatic abort.
Intended destination: issue 27 merge-recovery gate.

## Merge checks, topology and generic handling

Source: H `Procedure` and `Conflict handbook`; A `Worktrees`; S `check_merge_preconditions` and merge invocation.

### M01: Main-branch precondition

Existing: merge only from `main`.

Disposition: **retain with stop behavior, confirmed by the operator**.
At gate `M01`, the operator selected `retain_stop_other_branch`, visible answer “分支: 保留，其他分支停止”.
Confirmed handoff wording: Merge upstream only on main; on any other branch, stop and report rather than automatically switch branches or rewrite history.
Intended destination: issue 27 preflight.

### M02: Correct origin precondition

Existing: refuse unless origin is this fork.

Disposition: **change, confirmed by the operator**.
At gate `M02`, the operator selected `change_exact_identity`, visible answer “origin 身份: 核对完整仓库身份”.
Confirmed handoff wording: Verify that origin's complete repository identity is Jopqior/gotgenes-pi-packages using the verified supported SSH/HTTPS forms, rather than accepting an arbitrary URL containing that substring.
Stop on a mismatch; do not automatically modify the remote.
Issue 27 must verify the concrete address-recognition procedure before activating it.
Intended destination: issue 27 preflight; no script change in this issue.

### M03: Clean tracked state

Existing: require clean index and tracked worktree.

Disposition: **change, confirmed by the operator**.
At gate `M03`, the operator selected `change_inspect_untracked`, visible answer “工作区: 报告未跟踪文件，有风险则停”.
Confirmed handoff wording: Require a clean index and tracked worktree before merging.
Also report untracked files and stop when there is an overwrite risk or unclear ownership; unrelated temporary files do not automatically block synchronization.
Do not stash, delete, or commit existing work to satisfy this precondition without its own authorization.
Intended destination: issue 27 preflight.

### M04: No in-progress merge

Existing: refuse when `MERGE_HEAD` exists.

Disposition: **change, confirmed by the operator**.
At gate `M04`, the operator selected `change_verified_resume`, visible answer “已有 merge: 有完整本次记录才恢复”.
Confirmed handoff wording: Do not begin another merge when one is in progress.
Resume the existing synchronization only after matching its inputs, authorization, and execution state to complete records for that synchronization; otherwise stop and ask.
Resumption does not authorize new repairs or re-execution of the merge.
Intended destination: issue 27 preflight and resume stage.

### M05: No in-progress rebase

Existing: refuse when a rebase state directory exists.

Disposition: **retain, confirmed by the operator**.
At gate `M05`, the operator selected `retain_stop`, visible answer “已有 rebase: 保留，停止同步”.
Confirmed handoff wording: Stop synchronization when a rebase is in progress; do not automatically continue or abort it.
Intended destination: issue 27 preflight.

### M06: Upstream merge topology

Existing: A says upstream integration preserves a genuine two-parent merge.

Disposition: **retain with verified applicability, confirmed by the operator**.
At gate `M06`, the operator selected `retain_with_preflight`, visible answer “双亲合并: 保留，并核对拓扑适用条件”.
Confirmed handoff wording: Preserve genuine two-parent topology for upstream integration, consistent with the current release-evidence requirement.
Check the actual ancestry and report fast-forward or already-incorporated cases before deciding how to proceed; do not manufacture a merge record.
Issue 27 must supply and verify executable preflight/handling rather than claim the existing script forces two parents.
Intended destination: issue 27 preflight, merge, and evidence stages.

### M07: Linear feature landing

Existing: feature worktrees rebase and fast-forward land, unlike upstream integration.

**Remove duplicate sync-workflow material, confirmed (gate M07):** the operator rejected the proposed feature-landing cross-reference as unrelated: “怎么就涉及到功能分支这些了？
似乎没有关系啊。”
After clarification that even the cross-reference could be omitted without changing feature workflows, the answer was “对，直接删去是最好的。”

Confirmed handoff wording: Do not carry the feature-branch linear-landing explanation into the unified upstream synchronization workflow.
This removes unrelated duplicate prose, not the existing rules in `/sync-worktree` or `/ship`.
Intended destination: issue 27 cleanup inventory; no replacement sync-policy clause.

### M08: No wholesale ours/theirs

Existing: do not take either side wholesale.

Disposition: **change, confirmed by the operator**.
At gate `M08`, the operator's elaboration result identified `change_explicit_exception`, visible selection “禁止擅自覆盖，允许明确批准”, with note “确认。”

Confirmed handoff wording: Do not take ours/theirs wholesale as an unreviewed shortcut.
A whole-file choice is permitted when the operator explicitly approves the specific file, selected side, and disclosed effects; verify the resulting scope.
That approval does not cover other files or a blanket conflict-resolution pass.
Intended destination: issue 27 conflict-resolution gate.

### M09: Keep fork and upstream behavior

Existing: preserve spawn selection and incoming upstream behavior.

Disposition: **change, confirmed by the operator**.
At gate `M09`, the operator's elaboration result identified `change_review_goal`, visible selection “改为审查目标，不授予修改权”, with note “同意。”

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

**Change, confirmed, then scope clarified:** extra agent-authored local Pi loading configuration requires explaining purpose/effects and obtaining approval before editing settings; upstream-supplied loading wiring merges as-is under the package-scope clarification (source H `After issue 3` and R `Adding a new package`, original gate N01 answer “加载新扩展: 不自动加载，先批准”).

### N02: README package entry

**Change, confirmed, then scope clarified:** report a missing README package entry and obtain approval for an extra agent-authored addition; upstream-supplied README wiring merges as-is under the package-scope clarification (source R `Adding a new package`, original gate N02 answer “README 包表: 纳入文档方案先批准”).

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

**Confirm gate:** authored lint/analysis allowance changes require exact rule coverage or prior operator approval; type-only status, CI success, or a package skill's development instruction is not authorization (gate X05 answer “分析 Allowance: 确认”).
Use the general approval boundary in the workflow, not a copied incident narrative.

### X06: Fixture repair hazard

**Confirm gate:** uncovered fixture repairs require approval before editing; making a test pass does not approve the proposed repair (gate X06 answer “测试 Fixture: 确认”).
Keep this as an acceptance example, not a standing historical recipe.

### X07: Delegated lint-fix latitude

**Confirm gate:** generic delegation limits on lint/refactor transformations define an upper bound, not sync-specific permission; both parent and worker still need exact rule coverage or operator approval before editing (source D `Scope bounds`, gate X07 answer “委派修复: 确认”).

### X08: Session freshness

**Reference existing rule, confirmed:** follow the generic on-disk prompt and restart requirements before a step needs updated extension code, then recheck inputs and authorization records on resume; do not duplicate the full explanation or claim an old process has loaded new code (source A environment rules, gate X08 answer “会话新鲜度: 引用现有规则”).

### X09: Adjacent release safeguards

**Reference existing constraints as a group, confirmed:** X09a–X09c remain with A/R, covering explicit npmjs registry selection, reviewed-lockfile trust configuration, and the prohibition on disabling minimum release age to bypass installation failures; synchronization grants no exception and the workflow need not duplicate their mechanics (gate X09 answer “Registry 与供应链: 引用现有约束，不授予例外”).

## Approval, delegation and record semantics

Source: fork issue 28 and `docs/plans/f0028-sync-approval-policy.md`.
The following clauses are confirmed handoff decisions, not active policy.

### A01: Proposal before edits

**Confirm concise proposal before edits:** explain the conflict/problem, affected files, proposed handling, relevant alternatives, and effects before implementing an uncovered change, then wait for approval; neither an already-passing implementation nor an unnecessarily long code dump substitutes for that decision (gate A01 answer “提案内容: 确认”).

### A02: Exact rule coverage

**Confirm rule evidence:** identify the specific confirmed active rule and explain why the current inputs, action, and effects match its bounds; record the workflow version used for the run without inventing a separate rule-versioning system (gate A02 answer “覆盖依据: 确认”).
Historical recipes and broad preservation goals are not authorization.

### A03: Ambiguity stops affected edits

**Confirm affected-scope stop:** missing, ambiguous, or contradictory coverage stops the affected edits and dependent actions pending operator decision, including after an automatic merge; independent read-only checks and explicitly authorized work with no dependency on that decision may continue (gate A03 answer “暂停范围: 停止受影响及依赖动作”).

### A04: Reopen materially changed proposals

**Confirm reopening:** materially changed scope, effects, or inputs that invalidate the approved basis require renewed approval before implementing the changed proposal; reviewer suggestions cannot extend the old approval, while purely verbal clarification needs no repeated gate (gate A04 answer “实质变化: 确认”).

### A05: Authorization accounting

**Confirm final accounting:** match actual authored extra changes to a confirmed rule or operator approval, and distinguish execution from verification; covered edits remain traceable, but original upstream content is identified by input/merge commits rather than line-by-line approvals, and V02 cache cleanup needs no individual report (gate A05 answer “最终对账: 确认”).
Green checks prove neither authorization nor absence of integration edits.

### A06: Bounded delegation

#### A06a: Default read-only

**Confirm:** without specific edit approval or exact rule coverage, delegate read-only investigation/proposals, not implementation trials (gate A06a answer “默认权限: 确认”).

#### A06b: Scoped continuation

**Confirm:** a worker stops affected edits on uncovered choices and reports to the parent, which obtains the operator's decision and supplies a continuation naming permitted files/actions, scope, and rule or approval evidence; parent/reviewer agreement is not operator approval (gate A06b answer “升级决定: 确认”).
Already-covered actions may be delegated with the applicable rule and bounds without asking again.

#### A06c: Nested delegation

**Confirm:** nested workers inherit the same authorization bounds and pre-edit stop condition; another delegation layer cannot enlarge permission (gate A06c answer “嵌套委派: 确认”).

### A07: Resume evidence

**Confirm resumable evidence:** use concise Markdown to preserve input OIDs, proposal identity/scope, the operator's actual answer or active-rule basis, execution diff/commit, and verification as distinct facts; retain changed/superseded decisions rather than overwrite them (gate A07 answer “恢复证据: 确认”).
An unanswered proposal or an assistant-only approval summary is insufficient: recover actual evidence or ask again before relying on the purported permission.
No approval database, executable schema, or parser is required.

### A08: Separate authorities and activation

**Confirm separate authority and sole activation source:** synchronization, push, publication, and successful checks do not substitute for approval of uncovered authored changes; issue 27's unified workflow is the only future active rule source, and historical review records cannot independently authorize later edits (gate A08 answer “总边界: 确认”, covering A08a–A08d as explicitly briefed).
Git's own automatic merge commit is not a promised pre-write interception point; subsequent extra edits still require coverage or approval.
Final acceptance remains pending inspection of issue 27's actual workflow.

## Issue 27 handoff: activation BLOCKED

Deliberation is complete; activation and final acceptance remain **BLOCKED** pending inspection of [#27]'s actual on-disk workflow, updated entry points, and required handbook migration/deletion.
This mapping describes intended destinations, not an executable prompt or a second active policy.
All listed IDs include their subitems and retain the exact bounds and response evidence in their sections.

| Intended stage or responsibility                                              | Confirmed IDs                                                     | Handoff                                                                                                                                                    |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry and discovery                                                           | S01–S03; package-scope clarification                              | Invocation is the request, without a second start prompt; discovery obligations stay inside synchronization.                                               |
| Transport, targeting, recovery                                                | S04–S14                                                           | Implement and verify dual transport separately; preserve configuration, target, tag-evidence, deletion, and abort bounds.                                  |
| Preflight and resume                                                          | M01–M06; A07; X08                                                 | Verify identity, workspace, operation state, ancestry, and recoverable authorization before proceeding.                                                    |
| Merge and semantic review                                                     | M08/M09; F08–F11; N01/N02/N04–N06; I01/I04b/I04c/I05/I07/I08      | Apply only precise coverage; incoming non-customized packages and supplied wiring merge as-is, while extra loading/README wiring remains gated.            |
| Cross-stage approval and delegation                                           | A01–A08; X05–X07                                                  | Preserve coverage, post-merge, changed-scope, and nested-worker stop gates before authored edits; do not confuse merge, push, and publication authority.   |
| Verification and manual completion                                            | V01–V09; X01–X03                                                  | Preserve bounded writes, no-report V02 cleanup, full checks, authorization accounting, and independent read-only review before push.                       |
| Records and release evidence                                                  | V10; E01–E03/E05/E06; C01                                         | Keep per-sync authorization/execution separate from machine evidence; derive final versions through scripts, not E03 classification.                       |
| Push and independently approved release                                       | S07–S11; C04b/C07; X04/X09                                        | Target checks do not grant push authority; predict releases, obtain package/scope/destination approval, execute and verify without blind republication.    |
| Delete obsolete workflow recipes; retain original sources only in Git history | F01–F07; I06; B01–B10; P01–P11; H01–H09                           | Do not re-archive implementation recipes or renew one-time permissions; package behavior/contracts and T/U evidence are not deleted by these dispositions. |
| Remove duplicate or unrelated sync prose; retain owning constraints           | M07; N03/N07; I02/I03/I04a; E04/E07–E12; C02/C03/C04a/C05/C06/C08 | Use the relevant feature, repository, package, or release owner rather than copying its rules or algorithms.                                               |
| Independently authorized historical release maintenance                       | G01–G07                                                           | Preserve necessary approval, tooling, and artifact safeguards in a release-owned home; no synchronization backfill authority.                              |

### Migration and integration responsibilities

Issue 27 owns execution records under the agreed `docs/sync/runs/` layout, collision handling, and resume loading without requiring an issue number.
It migrates necessary old sync history (V10), correspondence data and generator consumers (C01), and release-owned safeguards (including G), while leaving machine evidence ownership intact (E01).
This review holds decision provenance; retros hold stage summaries and pointers, not approval ledgers.
The source snapshot and headings in this record remain recoverable through Git after handbook deletion; obsolete recipe bodies need no new archive.
Issue 29's final responsibility-based terminology must be reconciled with evidence/CLI references and examples before acceptance, without changing algorithms or adding package/publication authority.

S04 is a required but unimplemented capability; M02 and M06 likewise need verified full-identity and topology handling rather than reliance on the substring guard or ordinary merge command without `--no-ff`.
Issue 27 must account for remote setup/fetch preceding current script checks and for record-mode fetches; it must not describe these paths as offline or read-only.
These implementation gaps are not permission to change scripts in issue 28.
Issue 27's activation changes the repository workflow's default decision authority, not package APIs: use a breaking Conventional Commit with `feat!:` and a `BREAKING CHANGE:` footer describing the pre-edit coverage-or-approval requirement.
The final integration review must rerun the scenarios against the actual prompt, ensure removed material has not regained authority, and verify migrated consumers before deleting the handbook.

The consumer search inspected `AGENTS.md`, `README.md`, `.pi/skills/releasing/SKILL.md`, `.pi/skills/package-pi-subagents/SKILL.md`, `scripts/upstream-sync.sh`, `scripts/release/correspondence-table.mjs`, `scripts/release/release-artifacts.mjs`, `scripts/release/prepare-release.sh`, and references under `test/release/` and `test/upstream-sync/`.
The table generator, release preparation/staging, artifact writer, fixtures, and conflict-diagnostic assertion depend on the handbook path; deletion must coordinate those consumers rather than only remove prose links.
The release-evidence scripts also refer to the sync CLI and must be reconciled with [#29]'s names.
No consumer was modified during inventory preparation.

### Grouped subitem identities

Only subitems without their own decision headings are listed here; each inherits its parent's source, confirmed group disposition, and bounds.
These identifiers preserve review traceability, not implementation recipes or additional pending decisions.

| Parent | Separate decision units                                                                                                                                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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
| C05    | C05a: full tagged-set publication check; C05b: exact tagged Release body; C05c: preserve existing bodies on rerun                                                                                                                                                            |
| C08    | C08a: operator-chosen first release; C08b: new-fork evidence stop; C08c: retry failed post-prepare job rather than redispatch; C08d: verify checkout against tags before retry                                                                                               |
| G04    | G04a: preserve restoration disclosure; G04b: no missing-Release creation                                                                                                                                                                                                     |
| G05    | G05a: batch revalidation; G05b: per-edit readback                                                                                                                                                                                                                            |
| G06    | G06a: skip verified identical completed edits; G06b: coordinate competing writers; G06c: preserve before/after snapshots                                                                                                                                                     |
| X09    | X09a: explicit npmjs registry flags; X09b: retain trusted reviewed lockfile setting; X09c: do not disable minimum release age                                                                                                                                                |
| A08    | A08a: merge permission is not resolution permission; A08b: push permission is not repair permission; A08c: publication permission is not standing-rule approval; A08d: sole workflow activation authority                                                                    |

## Manual acceptance walkthrough

This is a non-executed reasoning walkthrough of every case in the plan against the confirmed handoff clauses, not runtime tests or verification of an active workflow.
The omission column identifies the requirement lost if the relevant coverage, post-merge, or delegation gate were absent; issue 27 must repeat the walkthrough against its actual text.

| Case                                                     | Determining clauses              | Expected authorization result                                                                                                                                                                                          | Gate omission would violate                                                                              |
| -------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Exact approved rule, same inputs and effects             | A02/A05; applicable bounded rule | Cite the active rule and recorded workflow version, explain the match, record coverage, then proceed only within scope. This historical record alone is insufficient.                                                  | Coverage: traceable input/action/effect matching, even for unprompted work.                              |
| Old handbook recipe not individually confirmed           | A02/A08; removed F/B/P/H recipes | Treat it as context only; request approval for the proposed edit.                                                                                                                                                      | Coverage: historical advice would regain edit authority.                                                 |
| Confirmed invariant with several implementations         | M09; A01–A03                     | Explain alternatives and ask before choosing an uncovered implementation.                                                                                                                                              | Coverage: a preservation goal would become an arbitrary repair license.                                  |
| Conflict-free merge followed by fixture repair           | I05; X06; A03/A08                | Git may already have committed; gate the authored fixture repair before editing.                                                                                                                                       | Post-merge: absence of Git conflicts would authorize extra repairs.                                      |
| New lint/analysis allowance for green checks             | V04; X05; A01–A03                | Disclose exact allowance and effects and obtain coverage or approval; do not weaken checks automatically.                                                                                                              | Coverage/post-merge: successful CI would substitute for permission.                                      |
| Workspace-name or documentation adaptation               | X03; N01/N02; I01/I08; A02/A03   | X03 covers only actual manifest identity for the same package/check semantics; exact I01/I08 restoration may qualify. Other authored adaptations need approval; supplied upstream wiring is not extra authored wiring. | Coverage: narrow command/restoration rules would become general documentation or package-edit authority. |
| Independent reviewer proposes follow-up                  | X02; A04; A06a/A06b              | Record a proposal; establish exact coverage or obtain operator approval before dispatching repair.                                                                                                                     | Post-merge/delegation: reviewer advice would silently enlarge authority.                                 |
| Worker encounters uncovered decision                     | X07; A03; A06a–A06c              | Stop affected edits and dependencies, report to parent, obtain operator decision and scoped continuation; nested workers inherit bounds.                                                                               | Delegation: parent or worker discretion would replace operator approval.                                 |
| Operator authorizes push or publication                  | S09; C04b; A08                   | Perform only the independently authorized operation with its checks; do not infer resolution, repair, or standing-rule approval.                                                                                       | Coverage: distinct authorities would be conflated.                                                       |
| Resume finds only proposal or assistant approval summary | M04; A07/A08                     | Recover actual operator evidence or valid active-rule coverage; otherwise ask again before affected edits.                                                                                                             | Coverage/delegation: an assistant's assertion would become permission across sessions.                   |
| Approved proposal changes materially                     | A03/A04                          | Reopen approval for changed scope/effects/invalidating inputs before implementing; verbal clarification alone does not reopen it.                                                                                      | Coverage: obsolete approval would cover a different proposal.                                            |
| Routine validation unexpectedly rewrites files           | V01/V02/V08; A03/A05             | Inspect/classify project-file changes; exact coverage or approval determines handling, not automatic commit or revert. Ordinary cache artifacts are not source edits; V02 has no separate report.                      | Post-merge/coverage: intent to validate would become blanket write or recovery authority.                |
| Review record survives workflow revision                 | A02/A08                          | Read current active workflow and version; this record supplies history, never an override.                                                                                                                             | Coverage: obsolete historical wording would become a second active policy.                               |

### Synthetic resume illustration: unanswered proposal

This illustration is synthetic and non-executed, not an operator decision or a real synchronization record; no OIDs, approvals, diffs, or successful tests are invented.
A future real record must supply measured input identities and actual evidence rather than copy these absent fields.

| Fact                                            | Synthetic record                                                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inputs and workflow version                     | Not supplied; exact pre-sync fork/upstream/merge OIDs and active workflow version must be recovered before resume.                                                                                                                                        |
| Proposal identity and scope                     | `example-fixture-repair`: after a hypothetical automatic merge, propose changing one widget-test fixture's terminal height; disclose affected path and rendering effects before approval. Alternative: investigate the rendering failure without editing. |
| Actual operator answer or active-rule reference | None. An assistant note saying “approved” would not supply either. X06/A07 in this review explain the stop requirement but are not an active authorization for this hypothetical edit.                                                                    |
| Applied                                         | No edit or commit in this illustration; a resumed real session must inspect its actual diff rather than infer application from a proposal.                                                                                                                |
| Verified                                        | Not run; no test result or semantic verification claimed.                                                                                                                                                                                                 |
| Resume outcome                                  | Stop this repair and dependent completion; recover inputs and authorization evidence or ask the operator. Independent read-only investigation may continue.                                                                                               |

If a real answer later arrives, preserve its actual wording, actor, proposal/input scope, and any supersession separately from the eventual applied diff/commit and verification result.
If relying on rule coverage instead, identify the actual active rule and workflow version and explain matching inputs/actions/effects; missing evidence or materially changed scope returns to the gate.

[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
