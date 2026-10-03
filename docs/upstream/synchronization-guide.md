# Upstream synchronization constraints

These are exceptions to the [standard issue lifecycle](../../AGENTS.md#working-an-issue), not a separate workflow.
The no-argument [upstream-sync entry point](../../.pi/prompts/upstream-sync.md) only finds or creates an exact-target fork issue and stops.
The [fork release policy](fork-release-policy.md) owns evidence validity, recorder semantics, version derivation, and publication restrictions; the [correspondence view](pi-subagents-release-correspondence.md) is machine-owned.

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
Merge only the locally present approved target with `./scripts/upstream-sync.sh --merge --expected-upstream <full SHA>`.
Merge does not implicitly refresh `upstream/main`; missing inputs need explicit fetch and inspection.
Unreleased upstream package work rejected by the recorder is a blocker, not permission to move the target or weaken release policy.

## Completed integration and review handoff

Complete a genuine two-parent merge before final validation; its second parent must equal the pinned target.
Feature-worktree rebase, squash, or fast-forward landing cannot replace this merge.
Review `git show --remerge-diff <merge>`, automatically merged fork customizations, and all post-merge contributions, not only textual conflicts.
Run root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` on the completed integration.
Commit reviewed integration changes, invoke the policy-owned recorder, then commit reviewed evidence before final independent review.
In the ordinary retro record the target, actual merge OID, reviewed fork contribution, evidence commit, checks/reviewer result, and next action.

Resolve the actual merge's first parent as the independent review base and review through HEAD; supply that OID, a full review mandate, and this guide as required context.
The dispatch must explicitly supersede the reviewer's default tag/plan-derived range and separately require inspection of the incoming common-base-to-target scope, remerge diff, automatically merged customizations, and every post-merge contribution.
Before accepting completion, verify the report states the supplied range and these extra surfaces.

## Shipping exceptions

Before shipping, verify merge and evidence commit reachability from HEAD, exactly two merge parents with the planned second parent, committed reviewed evidence, clean completed state, and completed independent review.
Missing or ambiguous facts stop shipping; shipping does not manufacture a merge or evidence.
For release candidates and the closing summary use the actual merge's first parent through HEAD, including follow-ups, overriding generic plan-parent/tag anchors; pass that resolved OID as `RANGE_BASE` to the existing candidate command.
Close only the fork synchronization issue plus explicit fork plan/retro close targets verified against the fork tracker.
Skip the incoming-history co-shipped scan: an incoming upstream issue number does not identify a fork issue.
Push and any separately approved publication remain fork-targeted; registration and integration approval do not authorize publication.
