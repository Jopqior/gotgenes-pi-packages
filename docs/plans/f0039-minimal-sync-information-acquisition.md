---
issue: 39
issue_title: "docs(upstream-sync): define a minimal information-acquisition contract"
---

# Minimal information acquisition for upstream synchronization

## Release Recommendation

**Release:** ship independently

This repository-scoped documentation change is not a package roadmap or release-batch member.
It does not authorize package publication or another upstream synchronization.

## Problem Statement

Synchronization sessions accumulated broad historical documents, Git diffs, source/tests, and repeated handoff narratives in the same context.
The [#38 retrospective](../retro/f0038-pinned-upstream-sync.md#context-growth-and-high-occupancy-resume) identifies accumulated ingestion as the measured growth source, but does not establish that any representation can be eliminated wholesale.
A small reading contract should assign each source a question, an entry point, and an expansion condition without reducing review coverage.

## Goals

- Keep the contract solely in `docs/upstream/synchronization-guide.md`, using a compact question/source/expansion table and short role boundaries.
- Preserve existing mandatory full reads of coordinating/reviewer plans, applicable prior-stage retros, and triggered skills; bound historical and task-specific material instead.
- Make sync-only step-worker reading boundaries explicit without changing ordinary workflows or skill-loading requirements.
- Retain complete incoming and actual integration-change inventories, all required deep-review intersections, release evidence, and independent checks.
- Require each future synchronization plan to include an executable reviewer-handoff step; the implementation session supplies its resolved Git inputs and reading pointers in the actual dispatch.
- Walk through the historical #38 materials and prescribe observation during the next actual sync without claiming token savings.
- Treat this as a non-breaking documentation change: no package API, output shape, config default, or runtime behavior changes.

## Non-Goals

- Modifying `AGENTS.md`, generic prompts, skills, or agent definitions, including `.pi/skills/pre-completion/SKILL.md` and `.pi/agents/pre-completion-reviewer.md`.
- New reports, inventory ledgers, handoff protocols, scripts, runtime controls, context-occupancy checkpoints, or altered tool/log returns.
- Splitting or selectively loading skills, changing deterministic gates, or replacing independent review with implementation summaries.
- Integrating another upstream target, reopening implemented [fork issue #38](https://github.com/Jopqior/gotgenes-pi-packages/issues/38), or changing release policy/evidence.
- Selector configuration work in [fork issue #26](https://github.com/Jopqior/gotgenes-pi-packages/issues/26).

## Background

The synchronization guide already separates complete inventory from selected deep review and owns the actual merge-first-parent review range.
It requires automatic-merge fork intersections, conflict resolutions, and every post-merge contribution, while leaving generic checks intact.
`AGENTS.md` already loads the guide for actual synchronization; the root README and issue-only `/upstream-sync` entry point link to this owner.
The generic pre-completion skill dispatches a plan path, and the reviewer definition already requires reading that plan before review.
These existing edges let a synchronization-specific plan carry the handoff requirement without editing their definitions.

The operator confirmed that the guide must require the reviewer instruction in the plan, rather than adding conditional hooks to generic skills/agents.
The guide remains the rule owner; the plan records the specific task and navigation, not another copy of the contract.
Fork issue #38 is closed with its implementation recorded; its artifacts are walkthrough inputs, not an unfinished prerequisite.
The open-issue sweep found #26 as the other open fork issue and no open PRs.
The newest inherited triage, `docs/triage/2026-10-02-backlog.md`, has no entry establishing a diagnosis for fork #39.

## Design Overview

### Question-directed source selection

Add `## Information acquisition` without renaming existing headings used by structural tests.
The compact table should distinguish these questions and preferred sources:

| Question                                                    | Preferred source and reading entry point                                                          | Expand when                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| What is approved and what must be preserved?                | Current plan: shared decisions, compatibility contracts, acceptance requirements, stop conditions | A decision is missing, contradictory, or changed                     |
| What arrived, including paths not preselected for review?   | Complete common-base-to-target inventory, then relevant incoming diffs                            | An unexpected path, dependency change, or contract appears           |
| What actually changed in this integration?                  | Separate complete merge-first-parent-to-reviewed-HEAD inventory                                   | Actual changes differ from incoming expectations                     |
| How were conflicts resolved?                                | Integration merge remerge diff, located by affected path                                          | A resolution needs surrounding source or caller context              |
| What happened to automatically merged fork customizations?  | Relevant first-parent-to-merge diffs and fork preservation contracts                              | A customization or cross-package contract may be affected            |
| What was added after the merge?                             | Merge-to-reviewed-HEAD inventory/diff, accounting for every contribution                          | A contribution changes behavior, evidence, or the approved scope     |
| What does the final tree do, and is release evidence valid? | Relevant final source/tests, callers/state owners; policy-owned evidence and checks               | Behavior, reachability, ownership, or evidence cannot be established |
| Why does an older constraint exist?                         | Specifically implicated historical section                                                        | Current evidence is insufficient or explicitly points into history   |

Path accounting is not limited to preselected intersections.
Inspect both complete inventories and select review depth from their contents; unexpected paths trigger ordinary expansion, not silent omission.
Do not infer that an empty remerge diff means an automatically merged customization is unchanged.
Source and diff are both appropriate when they answer different questions; avoid rereading equivalent representations without an unresolved question.
Expansion itself needs no new operator gate; materially new compatibility decisions retain the existing approval requirement.
Step 1's walkthrough covers these boundaries.

### Shared decisions and reproducible inventories

Coordinating sessions and the independent reviewer retain their existing full-plan reading requirement and all applicable shared decisions/acceptance requirements.
Step workers read the shared constraints, their assigned step, and relevant dependencies rather than unrelated execution details.
Keep existing mandatory prior-stage retro and complete triggered-skill reads unchanged.
Explicitly limit this sync-only narrowing to task/history source selection and worker execution detail, not skill bodies or shared decisions.

A sync plan records selected deep-review contracts/paths and reasons, plus exact inventory commit inputs and generation commands.
Each stage generates complete incoming and actual integration-change inventories into temporary text files; do not embed their complete listings or broad diffs into the plan merely to preserve them.
They must be regenerable from durable inputs even after temporary files disappear.
The reviewer generates and checks its own inventories against the actual refs; a dispatcher-supplied count or coverage summary is not proof.
Step 1 verifies the inventory distinction and reading boundaries.

### Plan-mediated reviewer handoff

Extend the existing review-handoff guidance to require a final numbered handoff step in every actual synchronization plan.
That step requires the executing session, before dispatch, to:

- Resolve the actual merge, its first parent, pinned target/common base, and reviewed HEAD; explicitly override the generic tag/plan-derived review range.
- Supply the synchronization guide and current plan paths, reproducible inventory inputs/commands, and selected contract-grouped source/diff/test/evidence entry points.
- Carry actual deviations, new decisions, unresolved matters, and critical warnings by concise references, without copying the plan or predicting PASS.
- Require the reviewer to independently regenerate complete inventories and verify the guide-owned scope, evidence, deterministic gates, and applicable checklist.

Planning cannot know a future merge OID; record its resolution instruction rather than a fabricated or frozen result.
Missing/stale temporary pointers cause regeneration or source lookup, not reduced coverage.
If a plan lacks the required handoff step, repair the ordinary plan/handoff before review rather than falling back silently to a tag range.
If a pointer reveals a changed compatibility decision, use the existing operator-approval boundary.
Step 2 covers these cases and verifies that ordinary tasks, including this guide-only issue, still use their normal review range.

Retros and stage handoffs retain actual commits, deviations, new decisions, unresolved matters, and evidence locations without restating the plan.
Brief repetition of critical boundaries/warnings is allowed.
During the next real sync, record material intake, expansions, and noticed omissions/corrections briefly in the existing stage notes; this is observational, not a controlled comparison or new tracking artifact.

## Module-Level Changes

| File or surface                                               | Planned change or explicit unchanged prediction                                                                                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/upstream/synchronization-guide.md`                      | Add the acquisition table and short role/artifact boundaries; connect its existing final-review requirements to a required step in each future sync plan; prescribe the next-sync observation |
| `.pi/skills/pre-completion/SKILL.md`                          | Unchanged: the executing session uses its existing dispatch operation with the sync plan's additional context                                                                                 |
| `.pi/agents/pre-completion-reviewer.md`                       | Unchanged: its existing full-plan read exposes the plan's handoff requirement; the dispatch supplies the guide and actual range                                                               |
| `AGENTS.md`, `README.md`, `.pi/prompts/*.md`, other skills    | Unchanged: existing owner links and ordinary behavior remain valid; no heading/link is removed                                                                                                |
| `test/upstream-sync/workflow-contract.test.mjs`               | Unchanged: existing section-bounded ownership/scope/safety assertions remain valid; new prose semantics are checked by walkthrough and independent review                                     |
| Packages, release policy/state/views, historical plans/retros | Unchanged: no runtime, evidence, topology, or historical rewrite is required                                                                                                                  |

The plan and its planning/implementation stage notes are ordinary lifecycle artifacts, not additional contract owners.
No module, export, import edge, interface, command, or Mermaid diagram changes.
The dependency/design checklist introduces no new collaborator or relay through generic layers: the existing plan and dispatch carry the sync-specific instructions.

## Test Impact Analysis

No new automated tests or red/green cycles are planned.
This is a prose-only change with no new parser or executable mechanism; existing tests are not made redundant or removed.
`test/upstream-sync/workflow-contract.test.mjs` reads the real guide/prompts, not mocked copies.
Its planning baseline was measured: **61 tests passed** with `pnpm exec vitest run test/upstream-sync/workflow-contract.test.mjs`.
Its bounded predicates detect removed instructions, not live compliance or semantic completeness of the new table.
The document walkthrough and ordinary independent reviewer assess those semantics.

### Real historical walkthrough inputs

The following IDs were resolved locally from #38's recorded integration/review checkpoints:

```bash
MERGE=0b865f9b2f34413d6a09684560f66f5978fffd76
TARGET=8d373ceab20c5236b08d8d6c032fd515b9fa8dc4
REVIEW_HEAD=c3738f43de7326a799126c970f4a3546e937b20a
FORK_BASE=$(git rev-parse "$MERGE^1")
COMMON_BASE=$(git merge-base "$FORK_BASE" "$TARGET")
```

Measured results: `FORK_BASE` is `49a8e68407f404869e84e460b061738faf4e06e0`; `COMMON_BASE` is `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`; the merge's second parent equals `TARGET`.
These are historical walkthrough inputs, never the review range for implementing #39.
The walkthrough used real local Git history and committed artifacts, not a synthetic session or performance replay.

Re-run the following read-only commands while checking the new wording:

```bash
INCOMING=$(mktemp /tmp/f0039-incoming.XXXXXX)
ACTUAL=$(mktemp /tmp/f0039-review.XXXXXX)
git diff --name-status "$COMMON_BASE" "$TARGET" > "$INCOMING"
git diff --name-status "$FORK_BASE" "$REVIEW_HEAD" > "$ACTUAL"
wc -l "$INCOMING" "$ACTUAL"
rg -n '^#{1,4} ' docs/retro/f0038-pinned-upstream-sync.md
git diff --unified=3 "$COMMON_BASE" "$TARGET" -- .pi/prompts/tdd-plan.md
git show --format= --name-only --remerge-diff "$MERGE"
git show --format= --remerge-diff "$MERGE" -- .pi/prompts/tdd-plan.md
git diff --unified=3 "$FORK_BASE" "$MERGE" -- .pi/prompts/tdd-plan.md
git diff --name-status "$MERGE" "$REVIEW_HEAD"
git diff --unified=3 "$MERGE" "$REVIEW_HEAD" -- scripts/release/pi-subagents/sync-state.json
```

Planning observed **214 incoming inventory lines** and **217 actual-change inventory lines**, measured from the separate unfiltered files.
The heading search located the context-growth diagnosis rather than requiring another complete historical-retro read.
The selected incoming and first-parent-to-merge prompt diffs both exposed the mutation-copy instruction change, while that path's remerge diff was empty.
The unfiltered remerge path list exposed actual resolution paths; the post-merge inventory exposed public-type verification, lifecycle characterization, and both release-state contributions.
The selected release-state diff contained the reviewed merge/evidence row.
Relevant final-source navigation was also checked with `git show "$REVIEW_HEAD:.pi/prompts/tdd-plan.md"`: it retained the changed instruction.
These observations validate reading entry points, not a renewed certification of all #38 behavior or measured token savings.

## Invariants at risk

| Constituency and invariant                                                                                                  | Existing pin and planned verification                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ordinary-task users: sync-only procedures stay out of generic workflows                                                     | `documentation ownership and navigation` tests; inspect changed paths for forbidden generic edits                                                                                                                        |
| Sync reviewers: full inventory and automatic fork intersections survive narrowed reading                                    | `selector-focused synchronization scope` → `distinguishes complete incoming inventory from targeted deep review`, plus its automatic-intersection and report predicates; walkthrough unexpected-path/empty-remerge cases |
| Sync operator: final review uses the actual merge-first-parent range, with unchanged independent checks                     | `uses the actual merge first parent instead of tag or plan defaults` and report predicates; inspect the plan-to-dispatch requirement                                                                                     |
| Fork/release consumers: topology, protected history, committed evidence, policy ownership, and publication approval survive | Existing retained-safety predicates in the same test group; preserve current guide clauses and release-policy links                                                                                                      |
| Worktrees consumers: identity, loading/provider and workspace contracts remain required even without conflicts              | `preserves worktrees identity, fork-core loading and workspace behavior in intersection review`; retain its existing `Review scope` section                                                                              |
| Coordinators, workers and reviewers: shared decisions/warnings cannot disappear behind focused reading                      | Manual scenarios for a worker-relevant cross-step dependency, stale evidence pointer, and unresolved decision; no claim of a runtime enforcement test                                                                    |

The cited test groups were opened and run during planning.
Do not move protected clauses into new sections just to make the prose shorter: several tests deliberately inspect their owning section.
No quantitative runtime invariant or predicted performance effect changes.

## TDD Order

There are no new tests to write; use `/build-plan`.
Each numbered cycle is inspect → edit → verify → commit, not a fabricated red/green exercise.
No Tidy-First assessment is needed because no source/test file changes.

1. **Define the compact acquisition contract in the guide.**
   Inspect its existing scope and the historical walkthrough inputs above.
   Add the question/source/expansion table, worker/shared-decision boundaries, distinct reproducible inventories, and historical-reading limits.
   Preserve mandatory plan/retro/skill reads, existing safety clauses, and complete accounting outside preselected intersections.
   Verify the walkthrough routes, especially unexpected paths and empty remerge output with a nonempty automatic-merge diff.
   Run `pnpm exec rumdl check docs/upstream/synchronization-guide.md`, `pnpm exec vitest run test/upstream-sync/workflow-contract.test.mjs`, and `git diff --check`.
   Commit: `docs: define focused upstream sync information acquisition (#39)`.

2. **Make future sync plans carry the reviewer handoff requirement.**
   Update the guide's existing final-review guidance to require the plan step and execution-time resolved range/pointers, without copying the acquisition table or touching generic definitions.
   State concise plan/handoff/retro/dispatch responsibilities and the next-real-sync observation instruction.
   Walk through a complete sync dispatch, missing temporary inventory, stale pointer, missing plan handoff, cross-step warning, and an ordinary non-sync dispatch.
   Confirm that missing evidence expands reading, new compatibility decisions retain approval, and a dispatcher cannot supply PASS as a premise.
   Re-run the focused checks from step 1 and inspect changed paths against Module-Level Changes.
   Commit: `docs: require plan-mediated upstream sync review handoffs (#39)`.

3. **Complete ordinary validation and independent review of this documentation change.**
   Run the unchanged `/build-plan` completion gates and fresh-context pre-completion reviewer.
   Supply #39's normal issue base, plan path, and modified files; do not borrow #38's integration range or treat editing synchronization docs as actual integration.
   Request verification of the acceptance criteria, source/expansion routes, retained ownership/safety, plan-mediated dispatch, and forbidden generic edits.
   Address in-scope findings through the ordinary process and write concise implementation-stage notes.
   Commit stage notes with `docs(retro): add implementation stage notes for issue #39`.
   Handoff to `/ship 39`; no package publication or actual upstream synchronization is authorized.

No third-party implementation mechanism is adopted; no new co-author trailer is required.

## Risks and Mitigations

- **Focused reading hides changes:** keep complete independent inventories and explicit expansion for unselected or unexpected paths.
- **Plan indirection loses reviewer instructions:** require a numbered handoff step and actual dispatch inputs, while the guide remains the single owner.
- **Temporary files disappear or references go stale:** preserve exact Git inputs/commands in ordinary artifacts and regenerate rather than trust a summary.
- **Prose additions weaken existing section-level pins:** preserve headings/clauses and run the real workflow-contract suite.
- **The contract grows into another workflow:** use the compact table and existing plan/retro/dispatch surfaces only; do not add generic hooks or new tracking artifacts.
- **Walkthrough is sold as an optimization result:** report only observed entry points; leave actual intake/omission observations to the next real sync, without a controlled-comparison claim.

## Open Questions

None block implementation.
The next real synchronization's target and timing are not selected by #39; its intake/omission observation is an instruction delivered here, not a separate synchronization operation or an already-completed validation claim.
No concrete follow-up issue is required by this plan.
