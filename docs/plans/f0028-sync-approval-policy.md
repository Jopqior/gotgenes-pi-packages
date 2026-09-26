---
issue: 28
issue_title: "Review sync rules and require approval for uncovered resolutions and extra changes"
---

# Review synchronization rules and decision authority

## Release Recommendation

**Release:** ship independently

This is repository-level decision and documentation work, not a package roadmap step or release batch.
It requires no npm publication.
Independent landing of the reviewed decisions does not complete the integration acceptance criterion: final activation and verification depend on [#27].

## Problem Statement

The latest upstream integration resolved conflicts and made additional adaptations before presenting the individual decisions to the operator.
The operator learned the scope after the work had been pushed.
The existing handbook mixes safeguards, broad preservation instructions, specific historical recipes, release mechanics, and one-time authorizations.
Its existence cannot establish that all those instructions are approved policy for future synchronizations.

## Goals

- Inventory existing synchronization instructions and submit each independent rule for an explicit retain, change, or remove disposition during `/build-plan`.
- Include candidate practices from the recent synchronization, without treating successful execution or later publication approval as approval of a reusable rule.
- Permit an unprompted resolution only when a confirmed, active rule clearly covers its circumstances, action, and effects.
- Require advance approval of uncovered or ambiguous conflict resolutions and extra changes, including changes discovered after an automatic merge or independent review.
- Apply the same boundary to delegated work before editing, not merely before committing or pushing.
- Preserve distinct records for historical rule review, per-sync decisions and execution, and stage retrospectives.
- Deliver the confirmed policy to the single `/upstream-sync` workflow owned by [#27], without creating another active handbook or policy skill.
- Classify eventual activation as **breaking for the repository workflow's default decision authority**, not for package APIs: previously assumed resolution latitude becomes an explicit stop-and-approve boundary.
  Decision-record commits remain `docs:`; the activating workflow commit in [#27] must disclose this changed default with `feat!:` and a `BREAKING CHANGE:` footer.

## Non-Goals

- Do not synchronize, resolve a real merge, rewrite published integration commits, revert the recent changes, push, or publish as part of this issue.
- Do not approve all old rules by approving this plan.
- Do not change package runtime code, test fixtures, analysis configuration, dependency resolution, or release algorithms.
- Do not implement a permission engine, approval database, parser, Git hook, or automatic rule matcher.
- Do not choose the command argument contract, move correspondence data, or delete the handbook independently of [#27], which owns unified workflow construction and cleanup.
- Do not rename the release evidence mechanism or add support for another fork package; [#29] owns responsibility-based organization and removal of its ambiguous terminology.
- Do not turn fixed-source or synthetic selector trials into general authorization to adapt future upstream code.
- Do not mix item-by-item approval records into stage retros or duplicate the future workflow's effective policy in a separate document.

## Background

### Scope and dependencies

The issue author and authenticated GitHub user are both `Jopqior`.
The operator confirmed `scope:repo`, review during `/build-plan`, and direct policy placement in `.pi/prompts/upstream-sync.md` rather than a policy skill.
After questioning the proposed use of retros as approval ledgers, the operator approved separating rule-review history, individual synchronization records, and stage summaries.
Specific record paths and layout remain a coordination decision with [#27].

Issues [#27] and [#29] were open when inspected, and the fork's open PR query returned no entries.
The open-issue searches for `sync` and `upstream-sync` identified this coordination group.
The newest local triage, `docs/triage/2026-09-18-backlog.md`, concerns the inherited upstream tracker, not this fork issue.
No matching fork or fallback issue-28 retro existed.

Review and record decisions first; [#27] consumes them to activate the policy and remove redundant sources.
Do not mark the integration criterion complete or close this issue solely because a decision record has landed.
If [#27] has not landed, report the remaining acceptance item explicitly rather than invoking a closing workflow unconditionally.
Issue [#29] is not a prerequisite for policy deliberation; its final names must be reconciled before the unified workflow's command examples are accepted.

### Current surfaces inspected

- `docs/upstream-sync.md`: complete procedure, conflict handbook, release evidence explanation, generated correspondence, and sync log.
- `scripts/upstream-sync.sh`: real CLI and implementation; it configures the remote, fetches without tags, optionally merges, or records release evidence.
  A successful conflict-free `--merge` can commit automatically; it does not perform semantic approval checks or push.
  The no-argument path is not mutation-free: it configures the remote and fetches objects.
- `AGENTS.md` and `README.md`: entry points, fork targeting, synchronization and publication constraints.
- `.pi/skills/releasing/SKILL.md`, `package-pi-subagents/SKILL.md`, and `delegation/SKILL.md`: consumers and adjacent responsibility boundaries.
- `packages/pi-subagents/docs/architecture/selector-startup-maintenance.md` and `selector-presentation-maintenance.md`: bounded technical evidence and remaining review obligations, not universal compatibility proofs.
- `docs/plans/f0002-upstream-sync.md` and its retro: provenance of the original keep-both recipes and unconditional lockfile regeneration.
  The `git log -S` searches traced those handbook instructions to `661111ea1`; the original plan addresses a particular first merge, not arbitrary future resolutions.

AGENTS.md's currently applicable no-upstream-tag, explicit fork targeting, script-only synchronization, and independent publication constraints remain binding throughout this documentation task.
Inventorying their wording does not suspend them.
Changing a constraint requires its own explicit decision and an identified owning issue; merely removing duplicate prose does not remove the underlying safeguard.

### Recent integration evidence

The real completed merge is `d4d90b3de6c19be1516ce0a92c1ad611e8543ba5`.
Its evidence/log follow-up is `3b022a4c71c93ec18a461927868fb4cc6917f378`, and its later discovery-command adaptation is `4e1827113af1b660aa4f02d99df4ac6908d611fc`.
These OIDs were resolved during planning.
The remerge diff shows both ordinary conflict resolutions and additional changes: `.fallowrc.json` type-only allowances, the widget fixture's terminal height, and manifest-derived workspace selection in `finish-phase.md`.
The later commit applies manifest-derived workspace selection to `improvement-discovery/SKILL.md` after independent review.
These are evidence inputs, not changes this issue will undo or retroactively authorize.

The parent session is `2026-09-26T06-14-21-805Z_01a0dc59-b56c-7678-89be-bd86e5ed5d9f.jsonl` under the root checkout's Pi session directory.
Use `read_session_file` with `branches: "all"` to recover the early synchronization portion; its default view did not show that portion during planning.
The session's `tasks/` transcripts identify the integration worker and independent reviewer.
Read actual operator messages separately from assistant summaries and tool success reports.
The operator's later instruction to publish does not establish a standing approval of the preceding resolutions.
Summarize durable evidence in the review record; local transcript availability must not be required to understand an eventual authorization.

## Design Overview

### Review before activation

This plan authorizes a review process, not the candidate dispositions below.
During `/build-plan`, re-read the current sources and split compound rules into independently decidable rows.
For each row, show the existing instruction, its source, the behavior it currently permits or requires, concrete alternatives, and effects.
Ask for retain, change, or remove using focused structured questions.
Related questions may share a briefing, but each rule must receive an individual disposition; silence, a skipped answer, or a general approval of synchronization is not a retained rule.
A removed instruction may still describe evidence that must survive elsewhere; distinguish removal of authority, removal of duplicate wording, and deletion of historical data.

All entries in the following inventory are **pending individual review**.
The table is a source-oriented review queue, not an assertion that its rows are atomic or that their contents should survive.

| Review area                    | Existing instructions or candidate practices to enumerate                                 | Decision to elicit                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Sync timing                    | On demand; check upstream before a fork publish                                           | Retain, change, or remove each scheduling obligation                                         |
| Entry and transport            | Script-only sync; SSH remote; mismatched remote remediation                               | Distinguish safe inspection, configuration changes, and approved execution                   |
| Targeting                      | Fork GitHub default and explicit repository/remote/branch checks                          | Confirm ownership and applicability without weakening current safeguards                     |
| Tags and upstream push         | No upstream tag imports; disabled upstream push; local tag-set comparison                 | Confirm effective guards and eliminate only redundant prose                                  |
| Recovery                       | Delete accidentally imported tags; abandon a merge with `git merge --abort`               | Decide when a recovery requires a separate destructive-action approval                       |
| Merge preconditions            | `main`, correct origin, clean tracked state, no in-progress merge/rebase                  | Confirm the checks and response to failure; do not invent auto-recovery                      |
| Merge topology                 | Upstream two-parent integration versus linear feature-worktree landing                    | Preserve the distinction and identify any situation requiring escalation                     |
| Generic conflict handling      | No wholesale ours/theirs; keep fork behavior and incoming upstream behavior               | Replace unbounded preservation language with explicit applicability and stop cases           |
| First-merge recipes            | Import unions, background presentation concatenation, service methods, module-list unions | Decide historical-only versus still-applicable guidance separately for each recipe           |
| Fork identity                  | Preserve package name and fork version; accept other upstream metadata/dependencies       | Separate identity preservation from dependency or metadata decisions                         |
| Changelog integration          | Preserve fork entries and insert incoming upstream sections                               | Define permitted scope; do not authorize arbitrary historical edits                          |
| New packages                   | Settings, README, issue forms, labels, npm disable entries, release registration          | Decide whether discovery may trigger each mutation without another approval                  |
| Fork issue lookup              | `fNNNN-` short-circuit preservation in lifecycle prompts                                  | Define what exact restoration is covered and what remains a semantic decision                |
| Fork phase identity            | Independent `f` allocation, coexistence with numeric upstream archives                    | Distinguish invariant preservation from a specific reconciliation recipe                     |
| Auto-merged documents          | Restore dropped fork sentences, fork scope header, dispositions, skill references         | Decide whether each instruction permits an edit or only flags review work                    |
| Startup selection              | Owner/observer ordering, cancellation, scopes, factory checks, host timing                | Separate technical invariants and trial evidence from authorization to implement adaptations |
| Presentation selection         | Shared builder, formatting guards, captured facts, pending display, fallback              | Review each preserved contract; synthetic trials are not blanket permission                  |
| Historical compatibility batch | Permission rules, session discovery, context loading, abort handling, autoformat settings | Classify old migration notes as history or current obligations                               |
| Historical permissions         | Local override deletion and coordinated publication from fork issue 14                    | Do not renew one-time authorization; distinguish history from present policy                 |
| Lockfile                       | Always regenerate after merge, including auto-merge                                       | Decide exact permitted action and escalation for unexpected dependency changes               |
| Cache and verification         | Clear rumdl cache after moves; tag check, typecheck, lint, package and script tests       | Confirm checks individually; distinguish check execution from autofix authority              |
| Merge completion               | Stage reviewed resolutions and continue the merge                                         | Require an authorization accounting before completing manual resolutions                     |
| Release evidence               | Record reviewed merge, contribution level and rationale; commit evidence                  | Distinguish semantic review, evidence recording, and approval of source changes              |
| Release calculations           | Correspondence mapping, maximum contribution, ancestry/manifest checks, fail-closed cases | Confirm policy versus mechanism documentation; no algorithm change here                      |
| Generated correspondence       | State ownership, generated rows, validation, immutable published artifacts                | Preserve required data without retaining the old handbook as its home                        |
| Historical Release edits       | Preview, exact remote-edit approval, revalidation, readback, no artifact rewrites         | Confirm separation from sync approval and ordinary publication                               |
| Recent diff accounting         | Use remerge diff plus later commits to identify integration edits                         | Decide the inspection requirement and its limits, not an automatic resolution rule           |
| Recent independent review      | Inspect conflict and automatic paths; disclose checks not performed                       | Decide review requirements without granting reviewers editing authority                      |
| Recent check adaptation        | Resolve actual workspace identity from manifest                                           | Consider a narrowly bounded rule versus case-specific approval, not automatic adoption       |
| Recent publication completion  | Recheck registry visibility after successful publishing rather than republish blindly     | Supply the approved practice, if any, to the release stage owned by [#27]                    |

### Policy semantics to finalize through review

The issue already requires the following approval boundary; `/build-plan` must make its exact wording and examples explicit before handoff.

1. Identify the contemplated change before editing: conflicting inputs or post-merge symptom, affected paths, proposed action, relevant alternatives, and effects on behavior, safeguards, evidence, and verification.
2. Identify a confirmed active rule by a stable reference in the unified workflow and the reviewed version of that rule.
   Explain why the current inputs, action, and effects fit its stated bounds.
   A historical recipe, a desired invariant such as preserving selection, or a rule with ambiguous coverage is not sufficient.
3. If coverage is absent, ambiguous, or contradicted by another applicable constraint, stop the affected edits and ask the operator.
   Do not implement an option merely to present it as an already-passing solution.
   Record the selected scope before implementation; rejected and deferred proposals remain distinguishable.
4. Apply approved work only within its stated scope.
   Newly discovered effects, an altered proposal, changed inputs that invalidate the basis, or an independent review finding reopen the gate.
5. Compare the eventual diff against authorized items, and record execution and verification separately from authorization.
   A clean test run proves neither approval nor the absence of integration-specific edits.

Keep initial authorization to perform the ordinary merge distinct from authorization to author resolutions or follow-up edits.
The existing script may create a conflict-free merge commit; this policy does not promise to intercept Git's own automatic merge before writing.
No new pre-merge runtime mechanism is planned.
Extra repairs after that merge still need rule coverage or explicit approval, even when required to make CI pass.
Record and report covered changes too; absence of a new prompt must not make those edits invisible.

### Delegation

A delegation must name the approved task scope, allowed files/actions, applicable confirmed rule references or item-specific approvals, and the stop condition for uncovered choices.
A read-only inspection or review is the default when those authorizations are not yet available.
The worker must report uncovered decisions before editing; the parent obtains the operator's answer and then supplies a scoped continuation.
Parent-agent approval, a generic request to integrate upstream, and reviewer recommendations cannot substitute for the operator's approval.
Nested delegation must preserve the same bound.
Do not delegate an open-ended repair pass after review.

### Records and sole authority

Keep the following responsibilities separate, as confirmed by the operator:

- **Rule-review history:** original instruction/source, retain/change/remove disposition, exact confirmed replacement or bounds, operator decision evidence, and eventual destination or reason for removal.
  It records how policy was selected, but is not itself the active policy source.
- **Per-sync execution record:** sync inputs and relevant OIDs, item identity, proposal and effects, authorization basis, actual operator response or confirmed-rule reference, execution diff/commit, and verification result.
  A proposal, explicit approval, rule-covered action, rejection/deferment, and executed change must not be conflated.
  A changed or superseded decision retains its history rather than silently replacing the old scope.
- **Stage retro:** concise session summary, observations, and pointers to the relevant records; no approval ledger embedded among stage notes.
- **Unified workflow:** the sole effective policy text, containing confirmed rules and the escalation boundary.
  Historical records cannot independently grant future automatic-edit authority.

Choose the record paths and practical Markdown layout with [#27] before creating them.
Prefer plain committed records over a new executable schema or database.
The choice must address a sync that has no issue number; do not assume every invocation has an issue or invent one in this plan.
A resumed session must be able to identify which proposal was approved, by whom, for which inputs and scope, and whether it has been applied.
Missing or ambiguous evidence returns to the approval gate; an assistant summary saying `approved` is not sufficient provenance.

### Integration contract with issue 27

Hand off confirmed rule wording and bounds, the disposition inventory, record responsibilities, approval scenarios, and the distinction between review completion and activation.
Do not create a partial executable `/upstream-sync` prompt during this issue merely to give the policy a home.
Do not copy the whole old handbook into a draft prompt.
Issue [#27] builds the full workflow, incorporates the confirmed policy, migrates needed correspondence/history data and consumers, then deletes the handbook and other redundant material.
Final acceptance here requires reading the resulting on-disk prompt and checking that pending or deleted instructions did not become active rules.

Tidy-First is skipped: this plan changes no `src/` or `test/` files.
No TypeScript interface, collaborator, extraction, or layer wiring changes are proposed; the design-review extraction checklist is not applicable.

## Module-Level Changes

### Owned by this issue

- `docs/plans/f0028-sync-approval-policy.md`: implementation sequence and pending review queue; record completion/handoff references without presenting proposed rules as approved policy.
- `docs/retro/f0028-sync-approval-policy.md`: stage summaries and links only, including the operator's separation of approval records from retros.
- Historical rule-review record at a location agreed during `/build-plan` with [#27]: create the individually confirmed disposition inventory and decision provenance.
  Do not create another handbook; final record naming and layout are intentionally not settled by this plan.
- Acceptance evidence in the agreed review/handoff record: scenario walkthrough, rule-to-workflow mapping, and outstanding integration criterion until [#27] lands.

### Coordinated touch points owned by issue 27

- `.pi/prompts/upstream-sync.md`: activate the single policy source, apply its gate before authoring resolutions and extra changes, bound delegated work, and load prior execution records on resume.
- `docs/upstream-sync.md`: delete only with the required data migration and consumer updates in [#27].
- `AGENTS.md`, `README.md`, `.pi/skills/releasing/SKILL.md`, and `.pi/skills/package-pi-subagents/SKILL.md`: replace obsolete entry points and reconcile any duplicated policy at integration time.
- `scripts/upstream-sync.sh`: its conflict diagnostic currently points at the handbook; [#27] updates the destination without assigning the shell script human approval semantics.
- `scripts/release/correspondence-table.mjs`, `release-artifacts.mjs`, `prepare-release.sh`, and related `test/release/` and `test/upstream-sync/` references: current handbook consumers discovered by search, to be handled by [#27] and coordinated with [#29], not edited in this documentation issue.
- Per-sync execution records: location and layout owned by the unified workflow design; this issue supplies required authorization semantics.

### Predicted unchanged during this issue's review delivery

- Package `src/`, `test/`, manifests, changelogs, `.fallowrc.json`, and `pnpm-lock.yaml`: historical examples are inspected, not repaired or rewritten.
- `scripts/release/` and `.github/workflows/`: no algorithm, publication, schema, or guard change.
- Selector maintenance trial documents and archived plans/retros: remain evidence inputs; their retention or cleanup belongs to [#27]'s inventory, not an automatic rewrite here.
- `AGENTS.md`, active skills, README, and the existing handbook: no interim second policy or temporary override added by this review phase.
  Existing safeguards remain in force; unreviewed historical recipes do not become confirmed rules for the new workflow.

## Test Impact Analysis

This is a documentation and decision-review plan, so `/build-plan` is the next stage.
It introduces no unit-test seam, automated matcher, or parser, and no existing tests become redundant.
No runtime tests were run during planning; previous sessions' pass reports are historical reports, not fresh validation.

Planning-time command checks:

| Command                                                                                                                                                                                     | Observed result and future use                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `./scripts/upstream-sync.sh --help`                                                                                                                                                         | Exited successfully and described fetch, merge, and evidence-recording modes; help exits before remote setup or fetch  |
| `git show --remerge-diff --format=short d4d90b3de6c19be1516ce0a92c1ad611e8543ba5 -- .fallowrc.json .pi/prompts/finish-phase.md .pi/prompts/pr-review.md .pi/skills/pre-completion/SKILL.md` | Showed both marked conflicts and added integration adaptations; use for historical case review, not approval inference |
| `git show --format=short 4e1827113af1b660aa4f02d99df4ac6908d611fc`                                                                                                                          | Showed the follow-up manifest-derived workspace changes after independent review                                       |
| `git grep -n 'upstream-sync' -- AGENTS.md README.md .pi scripts test ':!scripts/release/core-sync-state.json'`                                                                              | Found handbook entry points, diagnostics, generated-document consumers, and tests; repeat when [#27] integrates        |
| `git diff --check`                                                                                                                                                                          | No findings before plan creation; repeat on each documentation change                                                  |

Do not execute a real synchronization or mutate the old integration to test prose.
If the final workflow prescribes additional commands, [#27] must dry-run their safe inspection/help surfaces and use appropriate isolated tests for mutating scripts.

Walk the confirmed policy against these cases and record the expected authorization result before activation:

| Case                                                                | Required result                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Exact approved rule, same inputs and effects                        | Cite the active rule and matching conditions, record coverage, then proceed within scope |
| Old handbook recipe not individually confirmed                      | It supplies context, not authority; request approval                                     |
| Confirmed invariant but several valid implementation choices        | Ask for the uncovered choice before editing                                              |
| Conflict-free merge followed by a fixture repair                    | Gate the repair even though Git reported no conflict                                     |
| New lint/analysis allowance needed for green checks                 | Report the allowance and effects; do not weaken a gate automatically                     |
| Workspace-name or documentation adaptation                          | Gate unless a confirmed rule specifically covers the edit                                |
| Independent reviewer proposes a follow-up                           | Treat it as a proposal and obtain coverage or approval before dispatching repair work    |
| Worker encounters an uncovered decision                             | Stop affected edits and escalate to the parent, which asks the operator                  |
| Operator authorizes push or publication                             | Does not authorize unrelated resolutions, repairs, or new standing rules                 |
| Resumed session finds only a proposal or assistant approval summary | Do not treat it as operator approval; recover evidence or ask again                      |
| Approved proposal changes materially                                | Reopen approval for the changed scope before applying it                                 |
| Routine validation unexpectedly rewrites files                      | Inspect and classify the changes; validation intent is not blanket edit authority        |
| Rule-review record survives after workflow revision                 | Historical wording cannot override the current active policy                             |

These are manual acceptance scenarios, not claims of automated enforcement.
A reviewer should deliberately read each scenario with the coverage check, post-merge gate, or delegation stop condition omitted and confirm which requirement would then be violated.
No source-code killing mutation is applicable because this plan adds no executable tests.

## Invariants at risk

- **Operator:** approving a plan, sync, push, or publication remains distinct from approving an uncovered edit.
  Pin through the scenario walkthrough and recorded operator decisions, not through test success.
- **Resumed sessions and reviewers:** proposed, approved, rule-covered, applied, and verified remain separately reconstructable.
  Check a sample resumed record without access to the original session and require escalation when evidence is insufficient.
- **Future maintainers:** one active policy source, with historical review records clearly marked as non-authoritative for new work.
  Verify the final prompt and its incoming references after [#27]; do not count a handoff document as activation.
- **Fork release users:** no tags, release evidence, published artifacts, or version calculations change during review.
  Inspect the changed-file list and leave script tests untouched.
- **Package maintainers:** bounded selector trials remain technical evidence with their original limitations.
  No scenario assumes a successful historical transplant proves an arbitrary incoming change safe.

## TDD Order

No red-to-green code cycles are planned; execute with `/build-plan`.
The review and activation distinction below is intentional, not an instruction to claim an incomplete issue finished.

1. **Prepare the rule-review record and settle its handoff location.**
   Re-read this plan, the operator decisions, current handbook and consumers, [#27], and [#29].
   Agree the record location and layout without overloading retro or creating a new policy source.
   Expand every inventory area into individually decidable rules, preserving source references and labeling each item pending.
   Include recent integration candidates and negative approval examples, with their evidence limitations.
   Verify the inventory against every handbook section and the adjacent instructions, not just the conflict headings.
   Commit: `docs: inventory synchronization rules for operator review (#28)`.

2. **Conduct the individual retain/change/remove review.**
   Brief the operator with current behavior, alternatives, and effects for each rule, then obtain its own disposition.
   Record exact confirmed wording or bounds, approval evidence, removals and historical-only classifications.
   Keep unanswered items pending; do not hide them behind a batch approval or mark them retained by default.
   Review the recent-session practices under the same process rather than promoting them automatically.
   Verify that every retained automatic-action rule names its applicability and that broad preservation goals do not authorize arbitrary repairs.
   Commit at coherent completed review checkpoints: `docs: record confirmed synchronization rule dispositions (#28)`.

3. **Finalize the approval boundary and hand off to the unified workflow.**
   Confirm the detailed coverage, escalation, delegation, record, and resume semantics with the operator where the individual review has not settled them.
   Walk all acceptance scenarios, identify which decisions or rule clauses determine each outcome, and record any unresolved question as a blocker rather than inventing its answer.
   Produce the [#27] handoff mapping: confirmed rule to intended workflow stage, history-only material, removed material, and record responsibilities.
   No partial prompt, duplicate handbook, executable policy schema, or unapproved runtime enforcement is added.
   Verify Markdown, links, exact authorization provenance, changed-file scope, and consistency between the handoff and individual dispositions.
   Commit: `docs: define the reviewed sync approval handoff (#28)`.

4. **Verify activation with issue 27 before final acceptance.**
   If [#27] is not ready, record that integration remains pending and stop the implementation stage at a handoff; do not close this issue.
   Once its workflow is available, read the on-disk prompt and all updated entry points, rerun the acceptance walkthrough against that actual text, and confirm no removed or pending rule became active.
   Verify delegated tasks inherit the same pre-edit stop condition, and a resumed execution record distinguishes proposals from approvals without using retro as a ledger.
   Confirm the handbook was deleted with its required data and consumers migrated by [#27], not silently dropped.
   The activating commit belongs to [#27], with suggested subject `feat!: require approval for uncovered upstream integration changes (#27)` and footer `BREAKING CHANGE: Upstream integration now requires confirmed rule coverage or explicit operator approval before authoring conflict resolutions and extra integration edits. Sync, push, publication authorization, and successful checks do not grant that approval.` Record final integration evidence here with `docs: verify sync approval workflow integration (#28)`.
   Run the normal fresh-context pre-completion review; before integration it must report the outstanding criterion rather than issue an unconditional completion recommendation.
   Stage retro notes remain a separate summary commit.

## Risks and Mitigations

- **Review becomes wholesale inheritance:** individually recorded dispositions and pending defaults prohibit a blanket retain decision.
- **Useful recent practices become authority by repetition:** separate observed actions, suggestions, operator responses, and reusable rule approvals.
- **Approval granularity becomes unusable:** review coherent batches with separate answers; permit explicit narrow rules instead of requiring a new prompt for already-covered work.
- **A preservation rule conceals design discretion:** require matching inputs, action, and effects; uncertain applicability escalates.
- **Checks and formatters edit while supposedly validating:** classify write-producing commands and resulting diffs before treating them as covered routine work.
- **Delegation bypasses the boundary:** start uncovered tasks read-only and require a scoped continuation after operator approval.
- **Record duplication:** distinct history, execution, and retro responsibilities; agree paths with [#27] before creation.
- **A handoff is mistaken for delivery:** keep final activation as an explicit unmet acceptance criterion until inspected in [#27].
- **Deleting the handbook breaks release generation:** migration belongs to [#27]; the discovered script/test consumers remain listed in its handoff.
- **Historical trial recipes outlive their inputs:** retain evidence limits and decide their future authority explicitly, rather than generalizing a fixed trial.

## Open Questions

- Exact record paths, layout, and handling of syncs without issue numbers: settle with [#27] before creating the review record.
- Individual retain/change/remove dispositions and exact reusable-rule bounds: deliberately deferred to the operator review in `/build-plan`.
- Final command names and migrated evidence/document destinations: reconcile with [#29] and [#27] before activation.

These are decisions within already-filed issues, not new follow-up work.
No additional issue is required or authorized by this plan.

[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
