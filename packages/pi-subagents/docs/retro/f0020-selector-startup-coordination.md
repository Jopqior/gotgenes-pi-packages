---
issue: 20
issue_title: "Reduce selector startup coordination with upstream lifecycle changes"
---

# Retro: #20 — Reduce selector startup coordination with upstream lifecycle changes

## Stage: Planning (2026-09-24T10:08:38Z)

### Session summary

Produced and committed the numbered implementation plan at `packages/pi-subagents/docs/plans/f0020-selector-startup-coordination.md` in commit `61b9b5a02e01eb7b0d7e2ecc183af73b46cbfc02` on `issue-20-selector-startup-coordination`.
The operator approved a cohesive selection-state owner and settlement through existing record-level initial-run terminal notifications, preserving behavior rather than adding a manager-wide startup framework.
No production implementation, push, release, or issue closure occurred; the next entry point is `/tdd-plan`.

### Observations

- The required initial `git pull --ff-only` reported already up to date; no subsequent fetch occurred.
  Fixed upstream remains `edb35ee28535aac4e12431e47e440f6933911834`, inventory snapshot remains `746a4ae812a574d0496cb46c125a32961a608cf1`, and planning baseline was `213513eb3f38157ddde17b069815f4701ee7ecf7`.
  The inventory-to-baseline diff was empty for core `src/` and `test/`.
- Keep acknowledgement settlement distinct from an active selection attempt: no-provider queued acknowledgement can precede late provider registration and admitted selection.
  Manager disposal must cancel that later attempt without rewriting the earlier outcome or aborting confirmed service-only tasks.
- Keep construction capture/wrapping, scope closure ordering, and factory inline cancellation checks at their current boundaries.
  The earlier issue-19 IO-wrapper counterexample is synthetic deterministic evidence against relocating both checks, not fresh SDK-host acceptance.
- The Tidy-First assessor recommended terminal-order characterization followed by notification centralization.
  The plan accepts characterization and adapts centralization to the approved record-internal observer composition, avoiding a new explicit selection-outcome parameter at every terminal method.
  New owner unit tests do not replace real record/manager/tool or real-loader tests.
- A bounded independent plan review identified two fixture hazards, incorporated before commit: `createRunnableAgent()` converts an omitted observer to `{}`, and a directly throwing record observer rejects the run promise while leaving selection unsettled, unlike the manager observer that catches external exceptions.
  The no-observer pin must truly omit the field and keep a real selection owner after migration.
- Measured baseline verification passed: targeted core run, 7 files and 379 tests; full core suite, 84 files and 1956 tests; companion suite, 9 files and 68 tests.
  The plan passed `pnpm exec rumdl check` and commit hooks.
  No new implementation, mutation trial, full repository typecheck/lint, or interactive host acceptance was performed in this planning session.
- Acceptance requires replaying actual fixed-upstream `failRun()` and `stopQueued()` bodies against before/after trees and recording test outcomes, plus checking that `SubagentState` no longer needs selector reconciliation.
  These are future delivery checks, not measured maintenance savings.
  If they fail, return to fork issue 19 rather than treating extraction or documentation as completion.
- Presentation remains fork issue 21, with independent release and no hard dependency.
  No speculative follow-up was created, and fork issue 19 stays open for overall delivered-outcome assessment.

#### Deferred tidyings

- `test/lifecycle/subagent.test.ts` and `test/lifecycle/subagent-manager.test.ts`: whole-file splitting was rejected; existing selection groups are sufficient and inherited file size is not this delivery's goal.
- `test/lifecycle/subagent.test.ts` and `test/lifecycle/subagent-manager.test.ts`: cross-file catalogue/provider fixture consolidation was rejected; the new owner's narrow fixtures do not justify a general shared abstraction.
- `src/lifecycle/subagent.ts`: general inherited lifecycle cleanup remains outside scope; only selector ownership and required integration points change.

## Stage: Implementation — TDD (2026-09-24T14:21:53Z)

### Session summary

Completed all five planned steps as separate commits, with one subagent per step after the operator stopped the initial whole-plan delegation before it made changes.
Initial selection now has a narrow lifecycle owner, and existing initial-run terminal notifications settle its acknowledgement without separate settlement statements in each terminal method; observable startup, cancellation, tool-return, and service behavior remains unchanged.
Core tests increased from 1956 to 1984 (+28), while the companion suite remained at 68 passing tests.

### Observations

- The initial `main` pull reported already up to date, and root `check`, `lint`, `test`, and `fallow dead-code` passed before implementation.
  The final independent reviewer reran all four root gates successfully against the completed delivery.
  Public-type consumption verification and the companion suite also passed during implementation.
- Each step used its own subagent and commit, with parent inspection between steps.
  Characterization pins preceded observer composition, the new owner was built alongside the old implementation, and required-interface migration removed the duplicate implementation atomically.
- Per-class killing mutations exercised terminal ordering, observer exceptions, stopped/error precedence including empty errors, ignored-abort providers, post-validation cancellation, listener detachment, late registration/disposal, immutable acknowledgement, ordinary synchronous startup, pair/signal propagation, workspace revocation, queued cancellation, and presentation getters.
  The empty-error classification mutation was performed in step 2 once the mapping existed.
  An initial queued-cancellation test filter matched no tests; the agent corrected the filter and obtained an actual Red before restoring Green.
- Three runnable fixture migrations extended the anticipated changes: `test/observation/notification.test.ts`, runnable cases in `test/tools/agent-tool.test.ts`, and `test/tools/get-result-tool.test.ts`.
  Those tests require a real selection owner rather than the passive fixture; their assertions were retained.
  The real-tool boundary suite needed no edits and continued to run in the complete core suite.
- Step 5 replayed actual fixed-upstream `stopQueued()` and `failRun()` bodies.
  Each planning-baseline transplant lost its corresponding selection-settlement pin through a bounded timeout, whereas both delivered variants passed and already matched the upstream bodies.
  All trial files were restored before final gates; `subagent-state.ts` matches the fixed upstream object, and the maintenance evidence document records literal diffs, commands, outcomes, and remaining compatibility obligations.
  This is synthetic reconciliation evidence, not a measured future conflict rate or interactive SDK-host acceptance.
- Pre-completion reviewer: WARN, with no required code fixes.
  The review covered implementation through `0a1d45b37350615f19c1a7c77c6b45de7f909652` and found no blocking regression.
  Reviewer warnings: the inherited `run()` comment still says its promise always resolves although a directly throwing observer can reject it; the reviewer's role restrictions prevented reading raw replay logs under `/tmp/pi-subagents-issue20-replay`, so it independently verified Git method bodies and state-file equality but not those timeout logs.
  Both limitations remain disclosed rather than represented as resolved.
- Both issue-20 architecture completion markers are present; issue 21 presentation work and issue 19 overall maintenance assessment remain separate.
  No changelog, manifest, lockfile, release, push, or issue closure was performed.
  The next workflow step is `/ship 20`, with publication still requiring explicit destination and scope approval.
