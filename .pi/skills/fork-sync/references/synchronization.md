# Synchronization constraints

Apply these exceptions during actual upstream synchronization.
Keep the standard issue lifecycle and the skill entry's shared boundaries.

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

## Complete implementation

Merge the locally present approved target with `./scripts/fork-sync/sync.sh --merge --expected-upstream <full SHA>`.
The merge command does not refresh `upstream/main`.
If inputs are missing, fetch and inspect explicitly before merging.
After the merge enters its expected conflict state, resolve `package.json` conflicts before spawning workers or running pnpm-based tools.

Before final validation, complete a genuine two-parent merge with the pinned target as its second parent.
Feature-worktree rebase, squash and fast-forward landing cannot replace that merge.

The implementer must:

- Review adaptations locally, including conflict resolutions through the remerge diff.
- Run the required synchronization validation.
- Check ancestry/stable-release feasibility for each affected fork separately.
  One package's source claim cannot stand in for another's.
- Use the separately approved first-release handoff for an untagged fork.
  Do not manufacture a published anchor.
- Commit reviewed integration changes before independent review.

An unreleased package tail is display information; it neither blocks completion nor changes the pinned target.
Understand and justify the evidence.
A separate comprehensive pre-review integration/evidence audit or recorder is not required.

## Independent review exceptions

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
- `.pi/skills/fork-sync/SKILL.md` with the actual synchronization review task, and the current plan.
- Changed-file inventory, reproducible inventory inputs/commands and selected intersections.
- Contract-grouped source/diff/test/evidence entry points.
- Relevant handoff updates and critical warnings, without copied narratives or a predicted verdict.

Require the reviewer to regenerate and check both complete inventories against actual refs independently.
A dispatcher's count or coverage summary is not proof.
Regenerate stale temporary inputs or locate their sources; keep coverage intact.
Retain the reviewer's generic deterministic gates and applicable checklist.
Apply the synchronization deep-review scope, without commissioning a fresh upstream audit.

### Accept the report

Check that the report supplies the required synchronization report evidence, without repeating a comprehensive audit.
An in-scope failure leaves review incomplete; correct it and use normal follow-up review.
Do not dispatch an additional reviewer merely for the same incoming inventory or evidence.

## Record continuity

The plan owns decisions, steps, acceptance requirements, selected intersections/reasons and inventory-generation inputs.
Use handoffs and retros for actual commits, deviations, new decisions, unresolved matters and evidence locations.
Reference the plan instead of restating it.
In the retro, record the target, merge OID, reviewed adaptations, source checks, checks/reviewer result and next action.
Keep durable decisions in repository artifacts; brief critical warnings may repeat in dispatches.

During the next real synchronization, note material intake, reading expansions and noticed omissions/corrections briefly in stage notes.
Treat these as observations, not a controlled comparison with fork issue #38 or measured token savings.

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
