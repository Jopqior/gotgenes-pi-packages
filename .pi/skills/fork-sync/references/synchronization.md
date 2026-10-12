# Synchronization constraints

Apply these exceptions during actual upstream synchronization.
Keep the standard issue lifecycle and the [skill entry's shared boundaries](../SKILL.md#shared-boundaries).

## Before Git operations

Inspect the checkout before startup fetch/pull:

```bash
git rev-parse --path-format=absolute --git-dir --git-common-dir
git branch --show-current
git status --porcelain=v1
git ls-files -u
```

Proceed only when all prerequisites hold:

- Primary checkout on `main`.
  Identify it by absolute Git directory/common-directory identity, not branch or toplevel alone.
- Clean tracked index and worktree, with no unmerged entries.
- No pending merge or rebase.
  Resolve `git rev-parse --absolute-git-dir` and inspect `MERGE_HEAD`, `rebase-merge` and `rebase-apply` there.

If a prerequisite fails, stop for operator-directed recovery against the plan and actual Git state.
Leave unfinished integration intact; do not stash or rebase it.
Resume a clean completed checkpoint with ordinary fast-forward-only startup.
Stop on divergence.

## Pin the target and compatibility decisions

Copy the issue's exact `Upstream target: gotgenes/pi-packages@<full SHA>` into the plan's Design Overview.
Keep that target even if a newer upstream tip appears.
Plan against the incoming common-base-to-target diff, fork identities/contracts, immutable changelogs, required validation and source-evidence feasibility.
Agree compatibility choices in the plan.
Before edits that require a materially new choice, return to the operator and record the decision in ordinary artifacts.

Use `./scripts/fork-sync/sync.sh --fetch` to obtain inspection inputs.
For a missing remote, agree `--upstream-protocol ssh|https` with the operator.
Inspect mismatched URLs; do not silently rewrite them.
Fetch reports the target OID and ahead/behind counts, without package selection or release-tag queries.

Merge the locally present approved target with `./scripts/fork-sync/sync.sh --merge --expected-upstream <full SHA>`.
The merge command does not refresh `upstream/main`.
If inputs are missing, fetch and inspect explicitly before merging.

## Inventory and deep review

### Inventory every path

Generate two separate inventories, including unselected paths, package/dependency changes and relevant contract changes:

| Inventory          | Generation command                                                   |
| ------------------ | -------------------------------------------------------------------- |
| Incoming           | `git diff --name-status <common-base> <pinned-target>`               |
| Actual integration | `git diff --name-status <actual-merge-first-parent> <reviewed-HEAD>` |

Each stage generates temporary text files once the refs exist.
Record exact inputs and commands in the plan or handoff when available.
Regenerate from those durable inputs if a temporary file disappears or becomes stale.
Keep full listings and broad diffs out of the plan.

Account for every path in both inventories.
For unexpected or unselected changes, decide the review depth explicitly.
Inventory unrelated upstream modules and historical docs without assigning them a fresh line-by-line audit.
Record selected deep-review paths/contracts and reasons in the plan and handoff, not a separate report or ledger.

### Review the fork intersections

Deep review covers:

- Upstream/fork intersections, including automatically merged customizations.
- Actual conflict resolutions and sync-authored adaptations.
- Every post-merge contribution, including workflow/identity changes and release evidence.

Select by contract as well as package path.
For the selector, include core/service, lifecycle, presentation and loading compatibility.
For worktrees, preserve:

- `@jopqior/pi-subagents-worktrees` identity and fork repository metadata.
- Published `@jopqior/pi-subagents` imports and dependency.
- Core-first initialization and the shared workspace-provider service contract.
- `subagents-worktrees.json` and `worktreeAgents`.
- Workspace preparation/disposal, rescue and recovery behavior.

Review these worktrees contracts even when merges are automatic.
Fork migration and packed loading/provider checks are tracked in [fork issue #37](https://github.com/Jopqior/gotgenes-pi-packages/issues/37).
An empty remerge diff does not prove that an automatically merged customization is unchanged.
Inspect surrounding unchanged/upstream code only as needed to judge the changes and contracts.

### Read to answer a question

| Question                                        | Start with                                                                              | Expand when                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| What is approved and must be preserved?         | Current plan's decisions, contracts, acceptance requirements and stop conditions        | A decision is missing, contradictory or changed                                          |
| What arrived or actually changed?               | Corresponding complete inventory, then relevant diffs                                   | A path, dependency or contract is unexpected, or actual changes differ from expectations |
| How were conflicts resolved?                    | `git show --remerge-diff <merge>` by affected path                                      | A resolution needs surrounding source/caller context                                     |
| What happened to automatic fork merges?         | First-parent-to-merge diffs and preservation contracts                                  | A customization or cross-package contract may be affected                                |
| What was added after the merge?                 | Merge-to-reviewed-HEAD inventory/diffs                                                  | Behavior, evidence or approved scope changes                                             |
| What does the final tree do; is evidence valid? | Final source/tests, callers/state owners and [release-source checks](release-source.md) | Behavior, reachability, ownership or evidence is unclear                                 |
| Why does an older constraint exist?             | Specifically implicated historical section                                              | Current evidence is insufficient or points into history                                  |

Read both diff and final source when they answer different questions.
Reread only for an unresolved question.
Expand reading for evidence gaps, unexpected changes or unclear contracts; no new approval gate is needed.
Materially new compatibility choices still require operator approval.
Select historical sections by question instead of loading old backlogs, plans or retros wholesale.

Coordinators and the independent reviewer read the full current plan, including all applicable shared decisions and acceptance requirements.
Step workers read shared constraints, their assigned step and relevant dependencies.
Unrelated steps' execution detail stays outside the worker's task.
This narrowing applies only to sync task/history sources and worker execution detail.
Keep mandatory prior-stage retro reads and complete triggered-skill reads.

## Complete implementation

Before final validation, complete a genuine two-parent merge with the pinned target as its second parent.
Feature-worktree rebase, squash and fast-forward landing cannot replace that merge.

The implementer must:

- Review adaptations locally, including conflict resolutions through the remerge diff.
- Run the required validation below.
- Read [release source](release-source.md) and check ancestry/stable-release feasibility for each affected fork separately.
  One package's source claim cannot stand in for another's.
- Use the separately approved [first-release handoff](first-release.md) for an untagged fork.
  Do not manufacture a published anchor.
- Commit reviewed integration changes before independent review.

An unreleased package tail is display information; it neither blocks completion nor changes the pinned target.
Understand and justify the evidence.
A separate comprehensive pre-review integration/evidence audit or recorder is not required.

## Independent review

### Plan the handoff

Add a final numbered reviewer-handoff step to every actual synchronization plan.
Specify how the executing session will resolve the merge, its first parent, pinned target/common base and reviewed HEAD.
Record resolution methods during planning; resolve OIDs when the commits exist.
Repair a missing handoff step before review.
Do not fall back to a tag range.

### Dispatch with exact inputs

Resolve the actual merge's first parent as the review base and reviewed HEAD as the tip.
Explicitly override the reviewer's default tag/plan-derived range.
Include these inputs in the dispatch:

- Both range OIDs, actual merge, pinned target and common base.
- `.pi/skills/fork-sync/SKILL.md`, this reference and the current plan.
- Changed-file inventory, reproducible inventory inputs/commands and selected intersections.
- Contract-grouped source/diff/test/evidence entry points.
- Relevant handoff updates and critical warnings, without copied narratives or a predicted verdict.

Require the reviewer to regenerate and check both complete inventories against actual refs independently.
A dispatcher's count or coverage summary is not proof.
Regenerate stale temporary inputs or locate their sources; keep coverage intact.
Retain the reviewer's generic deterministic gates and applicable checklist.
Apply the deep-review scope above, without commissioning a fresh upstream audit.

### Accept the report

Before accepting completion, check that the report states:

- The actual review range.
- Inventory coverage and selected deep-review scope.
- Relevant results and finding disposition against the supplied context.

Check the report without repeating a comprehensive audit.
An in-scope failure leaves review incomplete; correct it and use normal follow-up review.
Do not dispatch an additional reviewer merely for the same incoming inventory or evidence.

### Record continuity

The plan owns decisions, steps, acceptance requirements, selected intersections/reasons and inventory-generation inputs.
Use handoffs and retros for actual commits, deviations, new decisions, unresolved matters and evidence locations.
Reference the plan instead of restating it.
In the retro, record the target, merge OID, reviewed adaptations, source checks, checks/reviewer result and next action.
Keep durable decisions in repository artifacts; brief critical warnings may repeat in dispatches.

During the next real synchronization, note material intake, reading expansions and noticed omissions/corrections briefly in stage notes.
Treat these as observations, not a controlled comparison with fork issue #38 or measured token savings.

## Validation and findings

### Required checks

Run on the completed integration:

```bash
pnpm run check
pnpm run lint
pnpm run test
pnpm fallow dead-code
```

Root tests include selector regressions.
While adapting affected behavior, use targeted runs; an identical full pass at every handoff is not required.
The independent reviewer still runs its normal gates.
Do not cache results across stages.

For incoming changes, fork adaptations or post-merge contributions affecting any of these contracts, run relevant package behavior tests, typechecking and applicable public-consumer checks:

- Host versions or extension loading.
- Package exports or public types.
- Core/selector service boundary.

Choose existing commands in the pinned-target plan according to the affected contracts.
Do not add a universal harness or unrelated consumer/cross-extension acceptance work for unchanged contracts.

### Escalate a concrete gap

Human Pi/TUI interaction, live model/judge calls and temporary cross-extension end-to-end harnesses are optional by default.
Omitting them is not a missing check or a warning requiring ship-time waiver.

Escalate only for an installation/check failure, broken selector/worktrees behavior or a named adaptation uncertainty automated tests cannot answer.
Before adding or executing extra verification, present the uncertainty, existing evidence and its limit, and the smallest proposed check.
Obtain operator agreement.
A failure stops the affected completion path; it does not authorize unrelated upstream repairs, weaker evidence or a different target.

### Dispose findings by provenance and relevance

| Finding                                                                         | Action                                                                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Regression introduced by resolution or fork adaptation                          | Correct in scope, add regression coverage and revalidate                                           |
| Inherited behavior breaks selector/worktrees compatibility                      | Treat as an in-scope compatibility decision; return materially new choices to the operator         |
| Confirmed inherited defect unrelated to fork preservation; required checks pass | Keep outside sync scope; no automatic repair, reproduction, new issue or unresolved ship warning   |
| Required install/check fails, including inherited failure                       | Stop and report gate/provenance; operator decides next action without implied repair authorization |
| Specific adaptation uncertainty remains after automated checks                  | Request the smallest justified verification before executing it                                    |
| Optional human/live check omitted; no concrete gap                              | No check or waiver required                                                                        |

For an encountered finding, compare the relevant implementation with the pinned target.
Inspect enough surrounding behavior to establish whether integration altered it or exposed a fork dependency.
Unknown provenance is not proof of inheritance and does not mandate broad upstream investigation.
Record established out-of-scope disposition briefly in ordinary notes when needed.
Apply this scope to inherited reviewer warnings; do not turn out-of-scope findings into repair, waiver or persistent ship tasks.

## Shipping exceptions

Before shipping, verify:

- Merge reachable from HEAD, with exactly two parents and the pinned second parent.
- Committed reviewed adaptations.
- Source feasibility.
- Clean completed state.
- Accepted independent review.

Stop on missing or ambiguous facts; shipping cannot manufacture a merge or source claim.
Required gate failures block shipping.
Unrelated inherited defects with passing gates and omitted optional checks do not require repair or waiver.

Use the actual merge's first parent through HEAD for release candidates and the closing summary, including follow-ups.
This overrides generic plan-parent/tag anchors.
Pass the resolved first-parent OID as `RANGE_BASE` to the existing candidate command.

Close only the fork synchronization issue and explicit fork plan/retro close targets verified against the fork tracker.
Skip the incoming-history co-shipped scan: upstream issue numbers do not identify fork issues.
Push to the fork; integration completion does not authorize publication.
