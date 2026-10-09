# Upstream synchronization constraints

These are exceptions to the [standard issue lifecycle](../../AGENTS.md#working-an-issue), not a separate workflow.
The no-argument [upstream-sync entry point](../../.pi/prompts/upstream-sync.md) only finds or creates an exact-target fork issue and stops.
The [fork release policy](fork-release-policy.md) owns evidence validity, recorder semantics, version derivation, and publication restrictions; the [core correspondence view](pi-subagents-release-correspondence.md) and [worktrees correspondence view](pi-subagents-worktrees-release-correspondence.md) are independently machine-owned.

## Prerequisites before Git operations

For actual synchronization or its resumption, apply these prerequisites before startup fetch/pull, overriding template startup ordering.
Require the primary checkout on `main`: compare absolute Git directory/common-directory identity, not merely the branch or toplevel.
Require a clean tracked index/worktree, no unmerged entries, and no pending merge/rebase.
Use these read-only inspections:

```bash
git rev-parse --path-format=absolute --git-dir --git-common-dir
git branch --show-current
git status --porcelain=v1
git ls-files -u
```

Resolve pending-operation paths with `git rev-parse --absolute-git-dir` and inspect `MERGE_HEAD`, `rebase-merge`, and `rebase-apply` there.
On a failed prerequisite, stop for operator-directed recovery against the ordinary plan and actual Git state; do not stash, rebase, or treat unfinished integration as a completed checkpoint.
A clean completed checkpoint uses ordinary fast-forward-only startup; divergence remains a stop.

## Fixed target and compatibility

Keep the issue's exact full `Upstream target: gotgenes/pi-packages@<full SHA>` in the ordinary plan's Design Overview; a newer discovered tip does not substitute for it.
Plan against the incoming common-base-to-target diff, incoming package changes, fork identities/contracts, immutable changelogs, validation, and release-evidence feasibility.
Agree compatibility choices in the ordinary plan; return materially new choices to the operator before affected edits and record them in the ordinary artifacts.
Use `./scripts/upstream-sync.sh --fetch` for explicit safe inspection inputs; if the remote is missing, agree `--upstream-protocol ssh|https` with the operator, and inspect mismatched URLs rather than silently rewriting them.
Use `./scripts/upstream-sync.sh --fetch --package pi-subagents-worktrees` to select worktrees release-status inspection; omitting `--package` retains the core default.
Package selection affects record/status only, not the repository-wide fetch or integration.
Never pass `--package` with `--merge`; the merge remains repository-level and pinned.
Merge only the locally present approved target with `./scripts/upstream-sync.sh --merge --expected-upstream <full SHA>`.
Merge does not implicitly refresh `upstream/main`; missing inputs need explicit fetch and inspection.
Unreleased upstream package work rejected by the recorder is a blocker, not permission to move the target or weaken release policy.
Preserve fork history and immutable changelogs; never import upstream tags into the fork's tag namespace.

## Information acquisition

For actual upstream synchronization only, select task/history sources by the question they answer:

| Question                                        | Preferred source / entry point                                                                       | Expand when                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| What is approved and must be preserved?         | Current plan: shared decisions, compatibility contracts, acceptance requirements and stop conditions | A decision is missing, contradictory or changed           |
| What arrived, including unselected paths?       | Complete common-base-to-pinned-target inventory, then relevant incoming diffs                        | An unexpected path, dependency or contract appears        |
| What actually changed in this integration?      | Separate complete merge-first-parent-to-reviewed-HEAD inventory                                      | Actual changes differ from incoming expectations          |
| How were conflicts resolved?                    | Merge remerge diff by affected path                                                                  | A resolution needs surrounding source or caller context   |
| What happened to automatic fork merges?         | Relevant first-parent-to-merge diffs and preservation contracts                                      | A customization or cross-package contract may be affected |
| What was added after the merge?                 | Merge-to-reviewed-HEAD inventory/diffs, accounting for every contribution                            | Behavior, evidence or approved scope changes              |
| What does the final tree do; is evidence valid? | Relevant final source/tests, callers/state owners; policy-owned release evidence and checks          | Behavior, reachability, ownership or evidence is unclear  |
| Why does an older constraint exist?             | Specifically implicated historical section                                                           | Current evidence is insufficient or points into history   |

Account for all paths in both complete inventories, not only preselected intersections; unexpected or unselected changes require a depth decision, not silent omission.
An empty remerge diff does not show that an automatically merged customization is unchanged.
Read both diff and final source when they answer different questions; avoid equivalent rereads without an unresolved question.
Expand when evidence is insufficient, a change is unexpected or a contract is unclear; reading expansion needs no new approval gate, while materially new compatibility decisions retain operator approval.
Do not load historical backlogs, plans or retros wholesale merely because they exist.

Coordinating sessions and the independent reviewer retain full current-plan reads and all applicable shared decisions and acceptance requirements.
Step workers read shared constraints, their assigned step and relevant dependencies, not unrelated steps' execution detail.
Existing mandatory prior-stage retro reads and complete triggered-skill reads remain unchanged; this sync-only narrowing applies to task/history sources and worker execution detail, not ordinary workflows.

Record exact inventory commit inputs and generation commands in the ordinary plan, alongside selected deep-review contracts/paths and reasons.
Each stage generates separate complete incoming and actual integration-change inventories as temporary text files using `git diff --name-status <common-base> <pinned-target>` and `git diff --name-status <actual-merge-first-parent> <reviewed-HEAD>` once those refs exist.
Record resolved integration refs in ordinary artifacts when available; regenerate from these durable inputs rather than embedding complete listings or broad diffs in the plan or relying on temporary-file survival.
The independent reviewer generates and checks its own complete inventories against actual refs; a dispatcher's count or coverage summary is not proof.

## Review scope

Keep a complete common-base-to-pinned-target inventory of incoming changes, including package/dependency changes and relevant contract changes.
Use this inventory to identify fork intersections, not to require line-by-line review of every incoming file or historical document.
Record selected deep-review paths/contracts and reasons in the ordinary plan and handoff, not a new report or ledger.
Unrelated upstream modules and historical documentation remain inventoried but are not independent audit assignments.

Deep review covers upstream/fork intersections, including automatically merged fork customizations with no conflict markers.
Include selector compatibility and its core/service, lifecycle, presentation and loading contracts; package-path filtering alone is insufficient.
Preserve the eventual `@jopqior/pi-subagents-worktrees` identity and fork repository metadata, published `@jopqior/pi-subagents` imports and dependency, core-first initialization, shared workspace-provider service contract, `subagents-worktrees.json` and `worktreeAgents`, and workspace preparation/disposal, rescue and recovery behavior.
These worktrees intersections require review even when adaptations merge automatically; fork migration and packed loading/provider checks belong to [issue #37](https://github.com/Jopqior/gotgenes-pi-packages/issues/37).
Review actual conflict resolutions, the remerge diff, sync-authored adaptations and every post-merge contribution, including fork-owned workflow/identity adaptations and release evidence.
Inspect only the surrounding unchanged/upstream code necessary to judge those changes and contracts.

## Completed integration and review handoff

Complete a genuine two-parent merge before final validation; its second parent must equal the pinned target.
Feature-worktree rebase, squash, or fast-forward landing cannot replace this merge.
The implementer performs normal local review of adaptations, required validation and the fork-contribution classification needed by the recorder under the unchanged release policy.
Use `git show --remerge-diff <merge>` for resolution review within the scope above.
No separate comprehensive pre-review integration/evidence audit is required; this does not remove the obligation to understand and justify evidence.
Commit reviewed integration changes, invoke the policy-owned recorder, then commit reviewed evidence before final independent review.
After both forks have release anchors, classify and record each affected package separately under the policy; never reuse one fork's level/rationale or state/view for the other.
Before the first worktrees release, use the policy's first-release evidence handoff rather than manufacture a published anchor to unblock recording.
In the ordinary retro record the target, actual merge OID, reviewed fork contribution, evidence commit, checks/reviewer result, and next action.

Every actual synchronization plan must include a final numbered reviewer-handoff step requiring the executing session to resolve the actual merge, its first parent, pinned target/common base and reviewed HEAD before dispatch.
Planning records how to resolve future integration refs, not invented or frozen OIDs.
The step must require this guide and current plan paths, reproducible inventory inputs/commands, and contract-grouped source/diff/test/evidence entry points in the actual reviewer dispatch.
If the step is missing, repair the ordinary plan/handoff before review; do not silently fall back to a tag range.

Resolve the actual merge's first parent as the independent review base and review through HEAD; supply that OID and this guide as required context for the ordinary independent pre-completion review.
The dispatch must explicitly supersede the reviewer's default tag/plan-derived range and include the pinned target/common base, changed-file inventory and identified intersections.
Resolve reviewed HEAD to an OID so the supplied range is exact; require the reviewer to independently regenerate and check both complete inventories against the actual refs.
Missing or stale temporary pointers require regeneration or source lookup, not reduced coverage; a newly revealed compatibility choice still follows the approval boundary above.
Require complete incoming inventory and deep review of the intersections, remerge diff, automatically merged customizations and every post-merge contribution as defined above, not a comprehensive fresh upstream audit.
The reviewer's generic deterministic gates and applicable checklist remain intact.
Do not dispatch an additional reviewer merely for the same incoming inventory or evidence.
Normal follow-up review after an in-scope correction remains possible; a failed in-scope review is not accepted as complete.
Before accepting completion, verify the report states the actual range, inventory versus deep-review scope, relevant results and finding disposition against the supplied context, without repeating a comprehensive audit.

The plan owns decisions, steps, acceptance requirements, selected intersections/reasons and inventory generation inputs; handoffs and retros record actual commits, deviations, new decisions, unresolved matters and evidence locations without restating it.
Dispatch supplies the exact scope and reading entry points, with concise references to those updates and critical warnings, not copied narratives or a predicted verdict.
Brief repetition of critical boundaries and warnings is allowed; durable decisions and continuity information belong in ordinary repository artifacts, never only temporary files.
During the next real synchronization, note material intake, reading expansions and noticed omissions/corrections briefly in existing stage notes; this is observation, not a controlled comparison with #38 or measured token savings.
Editing synchronization tooling or documentation is not integration work: ordinary non-sync tasks retain their normal review range and workflow.

## Validation and escalation

Run root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` on the completed integration.
Existing selector regression suites remain part of the root test run; use targeted runs while adapting affected behavior rather than requiring an identical full pass at every handoff.
The independent reviewer still runs its normal gates; no cross-stage result caching is introduced.

When changes in the completed synchronization, including incoming changes, sync-authored fork adaptations and post-merge contributions, affect host versions, extension loading, package exports/public types or the core/selector service boundary, run existing packed local-core/selector compatibility and applicable public-consumer checks.
Preserve historical compatibility rows when these checks apply and ensure the actual candidate is tested.
When those contracts do not change, do not require unrelated packed or cross-extension acceptance work merely because upstream was synchronized.
Select concrete existing commands in the pinned-target plan according to affected contracts, not a new universal harness.
When worktrees identity, dependency/loading or workspace-provider contracts change, reuse the applicable packed fork-core/worktrees loading and provider checks from issue #37 once available; do not replace them with a new universal acceptance harness.

Human Pi/TUI interaction, live model/judge calls and temporary cross-extension end-to-end harnesses are not default requirements.
Their omission is neither a missing check nor a warning requiring ship-time waiver.
Escalation requires installation/check failure, broken selector or worktrees behavior, or a named fork-adaptation uncertainty that existing automated tests cannot answer.
State the observable uncertainty, the existing evidence and its limit, and the smallest proposed extra verification; obtain operator agreement before adding or executing it.
A failure stops the affected completion path but never implicitly authorizes unrelated upstream repairs, weaker release evidence or a substituted target.

## Finding disposition

Use provenance and relevance, not severity labels alone, to decide synchronization ownership.

| Finding                                                                                 | Sync disposition                                                                                                       |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Regression introduced by conflict resolution or fork adaptation                         | Correct in scope, add appropriate regression coverage and revalidate                                                   |
| Inherited upstream behavior breaks selector or worktrees compatibility                  | In-scope compatibility decision; return materially new choices to the operator                                         |
| Confirmed inherited defect unrelated to fork preservation, with required checks passing | Outside sync scope; no automatic repair, reproduction, new issue or unresolved ship warning                            |
| Required install/check fails, including inherited failure                               | Stop and report the failed gate and provenance; operator decides the next action, without implied repair authorization |
| Specific adaptation uncertainty remains after existing automated checks                 | Request the smallest justified verification before executing it                                                        |
| Optional human/live check not run and no concrete gap identified                        | Not required; no waiver gate                                                                                           |

For an encountered finding, compare the relevant implementation with the pinned target and inspect only enough surrounding behavior to establish whether the integration altered it or exposed a fork dependency.
Unknown provenance is not proof of inheritance, but also not a mandate for a broad upstream investigation.
Record established out-of-scope disposition briefly in ordinary notes when needed, not as a persistent unresolved ship task.
If a reviewer reports an out-of-scope inherited warning, apply this guide's agreed scope explicitly rather than automatically requiring repair or waiver.

## Shipping exceptions

Before shipping, verify merge and evidence commit reachability from HEAD, exactly two merge parents with the planned second parent, committed reviewed evidence, clean completed state, and completed independent review.
Missing or ambiguous facts stop shipping; shipping does not manufacture a merge or evidence.
Apply the review scope, validation triggers and finding disposition above: required gate failures stop shipping, but unrelated inherited defects with passing required checks and omitted optional checks do not become repair or waiver gates.
For release candidates and the closing summary use the actual merge's first parent through HEAD, including follow-ups, overriding generic plan-parent/tag anchors; pass that resolved OID as `RANGE_BASE` to the existing candidate command.
Close only the fork synchronization issue plus explicit fork plan/retro close targets verified against the fork tracker.
Skip the incoming-history co-shipped scan: an incoming upstream issue number does not identify a fork issue.
Push and any separately approved publication remain fork-targeted; registration and integration approval do not authorize publication.
