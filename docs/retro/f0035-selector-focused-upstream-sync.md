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
