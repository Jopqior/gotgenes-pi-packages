# Synchronization assessment

These rules scope upstream synchronization assessment; the standard reviewer gates still apply.

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

| Question                                        | Start with                                                                       | Expand when                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| What is approved and must be preserved?         | Current plan's decisions, contracts, acceptance requirements and stop conditions | A decision is missing, contradictory or changed                                          |
| What arrived or actually changed?               | Corresponding complete inventory, then relevant diffs                            | A path, dependency or contract is unexpected, or actual changes differ from expectations |
| How were conflicts resolved?                    | `git show --remerge-diff <merge>` by affected path                               | A resolution needs surrounding source/caller context                                     |
| What happened to automatic fork merges?         | First-parent-to-merge diffs and preservation contracts                           | A customization or cross-package contract may be affected                                |
| What was added after the merge?                 | Merge-to-reviewed-HEAD inventory/diffs                                           | Behavior, evidence or approved scope changes                                             |
| What does the final tree do; is evidence valid? | Final source/tests, callers/state owners and release-source checks               | Behavior, reachability, ownership or evidence is unclear                                 |
| Why does an older constraint exist?             | Specifically implicated historical section                                       | Current evidence is insufficient or points into history                                  |

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

## Synchronization report evidence

The independent review report must state:

- The actual review range.
- Inventory coverage and selected deep-review scope.
- Relevant results and finding disposition against the supplied context.
