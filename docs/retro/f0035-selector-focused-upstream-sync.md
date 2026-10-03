---
issue: 35
issue_title: "Simplify upstream sync around selector preservation without changing generic workflows"
---

# Retro: #35 — Simplify upstream sync around selector preservation without changing generic workflows

## Stage: Planning (2026-10-03T13:18:24Z)

### Session summary

Read the operator-authored issue, completed issue-34 context, current synchronization owners and workflow tests, then committed the numbered plan in `docs/plans/f0035-selector-focused-upstream-sync.md`.
The operator approved complete incoming inventory with intersection-focused deep review, and additional verification only for concrete gaps existing automation cannot answer.
No implementation, upstream integration, GitHub mutation, push or publication occurred.

### Observations

- Startup `git pull --ff-only` reported already current; GitHub identity resolved to `Jopqior/gotgenes-pi-packages`.
  This is repository-scoped workflow work, not actual integration or a package roadmap step.
- Implementation scope is the synchronization guide, upstream-sync entry-point prose and necessary workflow-contract tests.
  Generic prompts, reviewer, shared skills, `AGENTS.md`, package files and issue-34 history remain unchanged.
- Keep the ordinary independent review and its generic gates; remove the extra comprehensive pre-review audit expectation, not normal implementer review or recorder-required evidence judgment.
  The current guide has broad mandates rather than a separately named audit stage, so implementation should narrow the prose instead of deleting a lifecycle stage.
- Preserve merge-first-parent review/ship ranges and incoming/automatic-merge visibility.
  Issue-31 plan/retro explain their purpose; reducing review depth does not invalidate those protections.
- Unrelated inherited defects do not automatically become repair, reproduction, issue-filing or ship-waiver work.
  Required check failures still stop completion; a blocker does not grant unrelated repair authority.
- Root automated checks and selector regressions remain required for actual syncs.
  Existing packed candidate compatibility checks apply when host/loading/public interfaces change; human TUI, live provider/judge and temporary cross-extension harness checks are not defaults.
- The first intended focused command used `pnpm run test:scripts -- ...`, which actually ran the complete root script suite: measured 34 files and 659 tests passed.
  The corrected `pnpm exec vitest run test/upstream-sync/workflow-contract.test.mjs test/upstream-sync/issue-entry.test.mjs` passed 2 files and 32 tests.
  The plan uses the corrected spelling and makes no runtime-compliance or compaction-reduction claim.
- Fresh-context Tidy First assessment recommended no preparatory commits.
  Existing read helpers and nested test groups suffice; prose predicates must not be presented as proof of live agent compliance.
- No new concrete follow-up was identified.
  Open selector issues #25 and #26 do not overlap the planned files; no open PR was returned.
  The newest triage describes inherited upstream work, not this fork's priorities.
- Plan Markdown lint and commit hooks passed.
  Next action is `/tdd-plan`, because the bounded documentation contracts have red/green test cycles; stop this session after planning notes.

#### Deferred tidyings

- `test/upstream-sync/workflow-contract.test.mjs`: a document parser, assertion framework or Git-fixture extraction does not prepare the new prose assertions.
- `test/upstream-sync/issue-entry.test.mjs`: sharing fence extraction would expand scope despite its executable entry fence remaining unchanged.

## Stage: Implementation — TDD (2026-10-03T14:18:21Z)

### Session summary

Completed two TDD cycles: bounded synchronization review, validation and finding disposition in the guide, then guide-owned scope in generated issue drafting.
Added 18 contract tests; the focused suite increased from 32 to 50 passing tests and the root script suite from 659 to 677.
Each numbered plan step ran in a separate subagent, with the parent dispatching the ordinary independent reviewer.

### Observations

- Implementation commits are `docs: focus upstream sync review on fork preservation (#35)` and `docs: bind upstream sync issues to guide-owned scope (#35)`.
  No substantive scope deviation occurred; generic workflows, packages and issue-34 historical artifacts remain unchanged.
- Step 1 reported 11 initial failures and five initially green safety characterizations, followed by green tests and 16 individually applied killing mutations.
  Step 2 reported two initial failures and two independently killed drafting predicates: removing the drafting link while retaining final navigation, and removing ownership while retaining the link.
  Each step restored saved green bytes after mutations and reran the focused tests.
- Completion verification independently counted the test delta from the committed test definitions and ran the focused suite.
  Root `pnpm run test`, `pnpm run check`, `pnpm run lint`, `pnpm fallow dead-code` and `git diff --check` passed.
  The entry-point executable fence and `issue-entry.test.mjs` remained byte-identical; lockfile and workspace configuration diffs were empty.
- Pre-completion reviewer: WARN, with no blocking findings; the reviewer independently passed the deterministic gates and verified the acceptance criteria.
  Reviewer warning: the packed/public-consumer check trigger says incoming changes, leaving ambiguity when only fork adaptations or post-merge contributions change loading, exports or service contracts.
  The suggested clarification remains unimplemented for operator disposition before shipping; no additional issue was filed.
- Independent scenario review distinguished automatic fork intersections, adaptation regressions, inherited selector incompatibility, unrelated inherited defects with passing checks, inherited check failures, unknown provenance, loading changes and absent optional live checks.
  Required gate failures still stop completion without implicit unrelated repair authority; optional checks without a concrete gap do not create waiver gates.
- No actual upstream integration, human/live-provider rehearsal, GitHub mutation, push or publication occurred.
  Text predicates and scenario review do not prove future agent compliance or reduced review time.
  The next action is `/ship 35`; package publication is not authorized.

## Stage: Implementation — TDD (2026-10-03T14:30:50Z)

### Session summary

The operator approved resolving the packed-check trigger warning.
Clarified that relevant contract changes from incoming changes, sync-authored fork adaptations and post-merge contributions all trigger the existing compatibility checks, and strengthened the existing contract assertion.
No additional test cases or validation harnesses were introduced.

### Observations

- The implementation subagent observed the strengthened assertion fail against the incoming-only wording, then pass after the guide change.
  An incoming-only killing mutation failed the same assertion; restoring saved green bytes returned the focused suite to 50 passing tests.
- A fresh-context reviewer inspected the uncommitted delta before `docs: clarify sync compatibility check triggers (#35)` was committed.
  Pre-completion reviewer: PASS; the previous WARN is resolved.
  The reviewer independently passed root check, lint, test, dead-code and diff checks; the root script suite remained at 677 tests.
- Review distinguished incoming-only, adaptation-only and post-merge-only relevant changes from synchronization with no relevant contract changes.
  Existing candidate and historical compatibility requirements remain intact, and no unrelated packed checks are added.
- No push, publication or actual upstream synchronization occurred.
  The next action remains `/ship 35`.
