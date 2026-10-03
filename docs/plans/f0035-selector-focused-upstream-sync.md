---
issue: 35
issue_title: "Simplify upstream sync around selector preservation without changing generic workflows"
---

# Selector-focused upstream synchronization

## Release Recommendation

**Release:** ship independently

This repository-scoped workflow change is not a package roadmap or release-batch member.
It changes no package release surface and authorizes neither publication nor an actual upstream synchronization.

## Problem Statement

Synchronization should incorporate upstream features and fixes while preserving the fork's selector, rather than re-audit upstream implementation.
The completed [#34] synchronization assigned broad review work before and during independent review, then carried an unrelated inherited defect and optional live checks into shipping decisions.
The current guide's unqualified incoming-scope review mandate permits that expansion.

## Goals

- Distinguish complete incoming-change inventory from targeted deep review of fork intersections.
- Keep ordinary planning, implementation, independent review, ship and retro stages, without an additional comprehensive pre-review audit.
- Make the synchronization guide the sole owner of sync-specific review, validation and finding disposition; generated issues explicitly adopt its scope.
- Preserve existing automated gates, selector regressions and conditionally applicable packed compatibility checks.
- Require a concrete unanswered adaptation question and operator approval before additional manual, live-provider or temporary harness verification.
- Preserve target, topology, fork identity, protected history/tags, reviewed evidence and separate publication approval.
- Classify this as a repository documentation/workflow change, not a breaking package change: no released API, output shape, configuration default or executable command contract changes.
  The deliberate change to synchronization review expectations is recorded here rather than disguised as wording cleanup.

## Non-Goals

- No changes to general-purpose prompts, the generic reviewer, shared skills, `AGENTS.md`, package code or tests, synchronization scripts, release policy, evidence schema or release algorithms.
- No parallel lifecycle, check cache, new orchestration mechanism, mandatory live rehearsal, compaction budget or promise of zero compactions.
- No actual fetch, merge, recorder invocation, publication or historical artifact repair for this issue.
- Do not rewrite the historical plan or stage records for [#34].
- Do not implement selector UI/configuration requests [#25] or [#26].
- Do not repair, reproduce or automatically file issues for unrelated inherited defects discovered during synchronization.
  This is a task boundary, not a claim that those defects are harmless.
- Preserve the already-landed entry-point session naming instruction; it is not this issue's substantive change.

## Background

The issue author and authenticated CLI user are both `Jopqior`.
The operator approved complete inventory with intersection-focused review and escalation only for a specific gap existing automation cannot answer.
Issue [#34] is closed and implemented, not a residual to reopen.
Open fork issues are this task and the selector requests [#25]/[#26]; the open PR sweep returned no entries.
The latest triage, `docs/triage/2026-10-02-backlog.md`, concerns the inherited upstream backlog rather than a fork ranking.
No prior fork planning record exists for this issue; the inherited permission-system issue-35 retro is unrelated.

The `git log -S'full review mandate'` trace leads to [#31]'s documentation-owner consolidation.
Its plan and retro explain why the guide must override generic tag/plan-based ranges: moving instructions alone could lose merge-first-parent, incoming and remerge coverage.
Retain those range protections while distinguishing inventory from deep review; narrowing the review is not permission to restore generic range defaults.

Current surfaces:

- `docs/upstream/synchronization-guide.md` owns prerequisites, compatibility, completed integration/review handoff and shipping exceptions.
- `.pi/prompts/upstream-sync.md` finds or creates an exact-target issue and stops; its drafting paragraph currently lists acceptance expectations without explicitly assigning review depth and finding disposition to the guide.
- `test/upstream-sync/workflow-contract.test.mjs` reads actual documents and executes existing operation-state and release-candidate fences.
- `test/upstream-sync/issue-entry.test.mjs` executes the actual entry fence against a fake GitHub transport, covering exact matching, pagination, failures and creation boundaries.
- `.pi/agents/pre-completion-reviewer.md` supplies the unchanged generic deterministic checks and judgment checklist; scope and range arrive through its dispatch context.
- `docs/upstream/fork-release-policy.md` remains authoritative for evidence validity and recording; reducing review duplication cannot bypass it.

Fork rules require English committed artifacts, repository-scoped plans/retros, fork-targeted mutations, protected tags and separately authorized publication.
Editing synchronization guidance is not actual integration and does not invoke integration prerequisites or merge operations.

## Design Overview

### Review scope: inventory versus depth

Keep a complete common-base-to-pinned-target inventory of incoming changes, including package/dependency changes and relevant contract changes.
Use it to identify intersection risks, not to demand line-by-line review of every incoming file or historical document.
Record the selected deep-review paths/contracts and reasons in the ordinary plan and handoff, not a new report format or ledger.

Deep review includes:

- Upstream/fork intersections, including automatically merged customizations with no conflict markers.
- Selector compatibility and the core/service, lifecycle, presentation or loading contracts on which it depends.
- Actual conflict resolutions, the remerge diff and sync-authored adaptations.
- Every post-merge contribution, including fork-owned workflow/identity adaptations and release evidence.
- Only the surrounding unchanged/upstream code necessary to judge those changes and contracts.

A file outside the selector package can be an intersection; package-path filtering alone is insufficient.
Unrelated upstream modules and historical documentation remain inventoried but are not independent audit assignments.

### Responsibilities and handoff

The implementer performs normal local review of adaptations, required validation and the fork-contribution classification needed by the recorder.
Remove the expectation of a separate comprehensive integration/evidence audit before independent review, not the obligation to understand and justify evidence.
The guide currently has broad prose, not a separately named audit stage: rewrite that mandate rather than inventing a stage to delete.
Commit completed integration and recorder-owned reviewed evidence before the ordinary independent pre-completion review.

The independent dispatch supplies the actual merge first-parent OID through reviewed HEAD, overrides tag/plan-derived defaults, and includes the guide, pinned target/common base, changed-file inventory and identified intersections.
Require the reviewer to state the actual range, inventory versus deep-review scope, relevant results and finding disposition.
Do not dispatch an additional reviewer merely for the same incoming inventory or evidence.
Normal follow-up review after an in-scope correction remains possible; a single required independent review does not mean accepting a known failed review.

The generic reviewer's deterministic gates and applicable checklist remain intact.
Its scope is the sync integration and fork preservation, not a comprehensive fresh upstream audit.
The parent checks the supplied range and scope against the returned report without repeating that audit.

### Validation and escalation

For actual synchronization, retain the existing root `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` gates on the completed integration.
Existing selector regression suites remain part of the root test run; use targeted runs while adapting affected behavior rather than prescribing an additional identical full pass at every handoff.
The independent reviewer still runs its normal gates; this change does not introduce cross-stage result caching or claim those reruns disappear.

When incoming changes affect host versions, extension loading, package exports/public types or the core/selector service boundary, run existing packed local-core/selector compatibility and applicable public-consumer checks.
Preserve historical compatibility rows when those checks apply, while ensuring the actual candidate is tested.
When those contracts do not change, do not require unrelated packed or cross-extension acceptance work merely because upstream was synchronized.
Choose concrete existing commands in each pinned-target plan according to the affected contracts; this guide does not freeze a new universal harness.

Human Pi/TUI interaction, live model/judge calls and temporary cross-extension end-to-end harnesses are not default requirements.
Their omission is neither a missing check nor a warning requiring ship-time waiver.
Escalation requires installation/check failure, broken selector behavior, or a named fork-adaptation uncertainty that existing automated tests cannot answer.
State the observable uncertainty, the existing evidence and its limit, and the smallest proposed extra verification; obtain operator agreement before adding it.
A failure still stops the affected completion path, but never silently authorizes unrelated upstream repairs, weaker release evidence or a substituted target.

### Finding disposition

Use provenance and relevance, not severity labels alone, to decide synchronization ownership.

| Finding                                                                                 | Sync disposition                                                                                                       |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Regression introduced by conflict resolution or fork adaptation                         | Correct in scope, add appropriate regression coverage and revalidate                                                   |
| Inherited upstream behavior breaks selector compatibility                               | An in-scope compatibility decision; return materially new choices to the operator                                      |
| Confirmed inherited defect unrelated to fork preservation, with required checks passing | Outside sync scope; no automatic repair, reproduction, new issue or unresolved ship warning                            |
| Required install/check fails, including failure inherited from upstream                 | Stop and report the failed gate and provenance; operator decides the next action, without implied repair authorization |
| Specific adaptation uncertainty remains after existing automated checks                 | Request the smallest justified verification before executing it                                                        |
| Optional human/live check not run and no concrete gap identified                        | Not required; no waiver gate                                                                                           |

For an encountered finding, compare the relevant implementation with the pinned target and inspect only enough surrounding behavior to establish whether the integration altered it or exposed a fork dependency.
Unknown provenance is not proof of inheritance, but also not a mandate for a broad upstream investigation.
Record established out-of-scope disposition briefly in ordinary notes when needed; do not convert it into a persistent unresolved ship task.
If a reviewer nevertheless reports an out-of-scope inherited warning, apply the agreed guide scope explicitly instead of treating it as automatically requiring repair or waiver.

### Entry-point ownership

In the issue drafting instructions, require an absolute fork link to `docs/upstream/synchronization-guide.md` and state that it governs synchronization review, validation and finding disposition throughout the ordinary stages.
Link the issue acceptance criteria to that owner without duplicating its checklist.
Update any repeated prose in the entry point that could imply broader default review or verification.
Keep the executable `issue-entry` fence, exact target marker, no-argument behavior, all-state recheck, fork scope label, session naming and stop/handoff semantics unchanged.
No new issue-body parser, validation field, executable rejection path or automatic edit of existing issues is needed.

## Module-Level Changes

| File                                            | Planned change                                                                                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/upstream/synchronization-guide.md`        | Clarify inventory/deep-review boundaries, implementation/evidence responsibilities, independent handoff, validation triggers and finding disposition; reconcile existing completion and shipping wording |
| `.pi/prompts/upstream-sync.md`                  | Make generated issues adopt guide-owned scope in drafting/acceptance instructions; retain executable fence and issue-only behavior                                                                       |
| `test/upstream-sync/workflow-contract.test.mjs` | Add a nested scope-contract group using existing read helpers; test bounded owner, review, validation, disposition and preserved safety clauses                                                          |

Predicted unchanged: `test/upstream-sync/issue-entry.test.mjs`, because transport, matcher, shell fence and created-body pass-through are unchanged.
Its existing tests remain execution coverage, not proof that an LLM drafts a compliant issue.
Predicted unchanged: all generic prompts, `.pi/agents/pre-completion-reviewer.md`, all skills, `AGENTS.md`, README navigation, release policy/state/table/scripts and every package file.
No link destinations, commands, module layouts, interfaces or phase status change.
The plan and retro for this issue are the ordinary additional lifecycle artifacts, not new policy owners.

The Tidy First assessment found no preparatory commit necessary: the workflow test already has document readers and concern groups.
Decline parser/fixture extraction and generic workflow edits because none prepares these bounded assertions.

## Test Impact Analysis

There is no runtime extraction or new unit seam.
Add structural predicates against the actual guide and entry-point drafting section, grouped by concern rather than a whole-document snapshot.
Require positive scope/ownership rules and bounded checks against retaining the old unqualified review mandate.
Do not globally forbid words such as `upstream`, `review` or `warning`; they legitimately occur in retained safeguards and exclusions.
No new matcher/parser over arbitrary Markdown is proposed.

Keep all existing workflow execution and issue-entry tests unchanged unless a narrowly worded documentation assertion needs updating in the same commit.
No existing execution test becomes redundant with prose assertions.
Test comments must state that text predicates detect missing instructions, not live agent compliance or semantic completeness.
Independent review includes a short scenario walkthrough of the disposition table and ownership boundaries, not another model-powered rehearsal or live harness.

Planning baseline at `22c386ad6ccf7becad5b6cbee1d0341810232541`:

| Command                                                                                                          | Observed result                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec vitest run test/upstream-sync/workflow-contract.test.mjs test/upstream-sync/issue-entry.test.mjs`     | Measured: 2 files, 32 tests passed; actual retained shell fences executed in their existing fixtures                                 |
| `pnpm run test:scripts -- test/upstream-sync/workflow-contract.test.mjs test/upstream-sync/issue-entry.test.mjs` | Measured: unexpectedly selected the full root script suite, 34 files and 659 tests passed; do not use this spelling for focused runs |

This plan adds no new shell recipe to the prompt or guide; existing mutating entry commands are exercised through their fake-transport tests, not against GitHub creation.
Do not run a real upstream merge or live issue creation to validate a prose-only drafting change.
The baseline proves neither future agent compliance nor a measured reduction in review time or compactions.

## Invariants at risk

| Constituency and invariant                                                                                                                        | Verification                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary-task users: sync-only procedure stays out of generic workflows                                                                           | Existing documentation-ownership tests; inspect the implementation diff for forbidden paths                                                     |
| Sync operator: pending Git operations still stop before startup pull                                                                              | Existing executable operation-state tests in `workflow-contract.test.mjs`                                                                       |
| Issue-entry users: exact target, complete lookup, closed-match handling and no automatic planning                                                 | Existing `issue-entry.test.mjs` plus workflow entry-point assertions                                                                            |
| Sync reviewer and release operator: actual merge first-parent range, incoming inventory and automatic-merge intersections survive scope narrowing | New bounded guide assertions plus independent scenario review; no claim of runtime enforcement                                                  |
| Release consumers: genuine pinned two-parent merge, reviewed committed evidence, protected tags/history and separate publication approval         | Retain guide prerequisites/shipping constraints and policy ownership; add structural pins for retained clauses and run the unchanged root suite |
| Shipping operator: incoming upstream issue numbers do not close fork issues                                                                       | Preserve guide-owned no-incoming-history scan and explicit fork close targets                                                                   |

No quantitative runtime invariant changes.
The scope boundary is deliberately narrower than [#31]'s broad review wording, while its correct-range and single-owner rationale remains load-bearing.

## TDD Order

1. **Define bounded review, validation and finding disposition in the guide.**
   Red: add nested cases in `test/upstream-sync/workflow-contract.test.mjs` for inventory versus deep review, automatically merged intersections, normal implementation/evidence work plus independent review, optional checks not being waiver gates, and concrete escalation with no implicit unrelated repair authority.
   Add retained-safety pins for merge-first-parent range, pinned topology, committed evidence, protected-history/policy ownership and publication separation.
   Existing safety pins may begin green; treat them as characterization and prove their discrimination with mutations.
   Green: rewrite the guide's current broad mandate and add concise constraint sections, reconciling both review handoff and shipping text.
   Verify focused tests, Markdown lint, and a manual walkthrough of automatic selector conflict, unrelated inherited defect, inherited check failure, changed loading contract and absent optional live check.
   Killing mutations, one per class: replace the inventory/deep-review distinction with a comprehensive incoming audit requirement; remove automatically merged intersections; restore a separate comprehensive pre-review audit requirement; replace the optional-check exclusion with a waiver requirement; remove the operator-approval escalation clause; remove the prohibition on implicit unrelated repair; replace the actual merge-first-parent range with a tag-derived range.
   For retained safety pins, delete the specific topology/evidence/publication clause each test asserts and confirm that test fails; restore exact saved green bytes after every mutation.
   Commit: `docs: focus upstream sync review on fork preservation (#35)`.

2. **Bind generated synchronization issues to the guide's scope.**
   Red: extend the workflow-contract tests to inspect the drafting section specifically, requiring its absolute fork guide link and explicit ownership of review, validation and finding disposition.
   A link only in the final handoff paragraph must not satisfy this test.
   Green: update drafting/acceptance prose without copying policy or changing the executable fence; preserve the existing session naming instruction.
   Verify both focused files and Markdown lint; inspect the diff to establish byte-unchanged executable fence and unchanged issue-entry tests.
   Killing mutations: delete the guide link from the drafting section while leaving final navigation intact; separately remove the scope-ownership sentence while retaining the link.
   These must kill their respective drafting predicates, not the unrelated transport tests.
   Commit: `docs: bind upstream sync issues to guide-owned scope (#35)`.

3. **Validate the bounded change and complete ordinary independent review.**
   No new red/green cycle or extra comprehensive audit.
   Run `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` through the ordinary completion workflow, plus `git diff --check`.
   Inspect the changed-file list against the Module-Level Changes and verify generic prompts/reviewer/skills, `AGENTS.md`, packages and historical issue-34 artifacts remain unchanged.
   Dispatch the ordinary fresh-context pre-completion reviewer once with this issue, plan, actual change range and modified files; this is review of a workflow change, not a real sync, so use the normal issue range rather than borrowing issue-34 merge anchors.
   Require review of the acceptance criteria, retained constraints, drafting ownership and the disposition scenarios; do not add human/live-provider checks or a separate rehearsal.
   Address in-scope findings through the normal process, then commit implementation-stage notes with `docs(retro): add implementation stage notes for issue #35`.
   Handoff to `/ship 35`; no package publication is authorized.

No third-party mechanism is adopted; no new co-author trailer is required.
Use `/tdd-plan` because the documentation contracts have red/green cycles.

## Risks and Mitigations

- **A complete inventory becomes another audit:** explicitly distinguish its purpose and require reasons for deep-review intersections, not exhaustive narrative on incoming files.
- **Path-only scope misses automatic semantic collisions:** include selector/core contracts and required surrounding code, not just conflict markers or selector-directory changes.
- **Narrowing review bypasses evidence judgment:** preserve implementer contribution classification and committed evidence before independent review under the unchanged release policy.
- **An inherited failure is silently ignored:** required checks still block; unrelated repair needs separate operator direction.
- **Optional verification returns as a ship warning:** state its non-required status and disposition in the guide, and link generated issues to that owner.
- **Tests mistake prose presence for agent behavior:** document the limitation and independently review concrete scenarios; do not create a costly live compliance experiment.
- **Stale in-process prompt obscures changed drafting rules:** inspect the on-disk prompt during implementation; use a fresh Pi session for the next real `/upstream-sync` invocation, without making that invocation a test requirement.

## Open Questions

No design decision blocks implementation after the operator's scope and escalation selections.
A future pinned target may need a concrete compatibility choice or extra verification; decide it from that target's evidence rather than inventing a universal check here.
No concrete new follow-up issue is required.

[#25]: https://github.com/Jopqior/gotgenes-pi-packages/issues/25
[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#31]: https://github.com/Jopqior/gotgenes-pi-packages/issues/31
[#34]: https://github.com/Jopqior/gotgenes-pi-packages/issues/34
