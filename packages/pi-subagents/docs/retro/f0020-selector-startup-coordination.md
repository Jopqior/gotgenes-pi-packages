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

## Stage: Ship (2026-09-24T15:17:45Z)

### Session summary

Shipping from root `main` through the trunk lane; no issue-20 branch or worktree needs merging or teardown.
The plan recommends independent delivery, but the release derivation reports nothing to release for `pi-subagents` at `pi-subagents-v4.0.0`, so no publication or release dispatch is planned.

### Observations

- Verified the GitHub target and origin remote as `Jopqior/gotgenes-pi-packages`.
  Fetch and fast-forward-only pull succeeded; local `main` had six unpushed implementation commits.
- Root lint and dead-code gates passed before this stage note; the final tree will be checked again before pushing.
  Push and exact-SHA CI verification are still pending at this note's commit; issue closure remains gated on CI success.
- The plan-to-HEAD range contains no co-shipped issue or adopted PR close target.
  Issues 19 and 21 remain open, and Phase f1 is not complete.
- This delivery preserves public behavior and carries no breaking change.
  The next interactive workflow step after successful shipping is `/retro 20`.

## Stage: Final Retrospective (2026-09-24T15:27:02Z)

### Session summary

Reviewed the planning, implementation, and shipping transcripts alongside the accumulated stage notes and the individual subagent reports.
The delivery preserved selector behavior while demonstrating narrower reconciliation obligations through fixed-upstream method replays; shipping subsequently passed exact-SHA CI and closed fork issue 20 without a release.
Fork issues 19 and 21 remain open, and Phase f1 still recommends presentation work next.

### Observations

#### What went well

- The maintenance objective became a falsifiable acceptance test rather than a source-size claim: `docs(pi-subagents): record startup reconciliation evidence` compared actual upstream terminal bodies against both trees and disclosed the remaining notification contract.
- Independent plan review caught two fixture traps before implementation: the runnable helper silently supplied an empty observer, and observer exceptions affected the run and selection promises differently.
  Those findings became explicit characterization and mutation requirements rather than late review repairs.
- After the operator corrected delegation granularity, each implementation step used a fresh agent, its own commit, and parent inspection before the next dispatch.
  This preserved the introduce-alongside, migrate, and remove sequence without treating the entire plan as one opaque task.

#### What caused friction (agent side)

- `wrong-abstraction` — the implementation parent delegated the complete TDD plan to one agent before the operator requested one agent per step.
  Impact: one abandoned dispatch and a user intervention; the parent checked that no files or commits had changed before restarting at step 1.
  This was a preference mismatch, not a violation of an already-written per-step delegation rule.
- `other` — planning obeyed the then-current mandatory feature-branch rule, which the operator rejected for this fork.
  Impact: a temporary branch, a fast-forward back to `main`, branch deletion, and the separate `docs: remove mandatory feature branch guidance` commit.
  The rule was already removed during planning; no additional branch-policy change is needed.
- `missing-context` — step 2 initially used the inherited `@gotgenes/pi-subagents` filter rather than the manifest's fork identity.
  Impact: a no-project-match invocation followed by correction to `@jopqior/pi-subagents`, with no product rework.
- `missing-context` — required-owner migration exposed runnable uses of the nominally passive fixture in `test/observation/notification.test.ts`, `test/tools/agent-tool.test.ts`, and `test/tools/get-result-tool.test.ts`.
  Impact: the complete suite initially failed and those callers required real-owner fixtures in the same migration step; assertions were retained.
- `other` — the first queued-cancellation mutation filter selected no tests.
  Impact: one ineffective mutation invocation, self-corrected by using the exact test name and obtaining an actual Red before restoring Green.
- `missing-context` — raw replay logs lived under `/tmp/pi-subagents-issue20-replay`, outside the reviewer's permitted read scope.
  Impact: the reviewer could verify Git bodies and state equality but not independently inspect the recorded baseline timeout logs; the handoff retained a provenance WARN rather than closing that evidence gap.
  Future review handoffs can provide a bounded, reviewer-readable evidence copy without broadening filesystem permissions.

#### What caused friction (user side)

- The operator had to correct branch policy and delegation granularity rather than judge the implementation itself.
  Both interventions were useful and early; persisting the remaining per-step preference would avoid requiring the same mechanical oversight on the next plan.
- No evidence suggests missing product requirements from the operator caused the fixture migration or review-evidence gap.
  Those are agent discovery and handoff responsibilities.

### Diagnostic details

- Model attribution comes from unfiltered rendered transcript excerpts, not agent configuration or current-session environment variables.
  The planning design comparison and independent plan review ran on `openai-codex/gpt-6-astra`; the Tidy-First assessment ran on `openai-codex/gpt-6-sol`.
  The abandoned whole-plan worker and each of steps 1–5 ran on `openai-codex/gpt-6-sol`; the final pre-completion reviewer ran on `openai-codex/gpt-6-astra`.
  The parent planning, implementation, and shipping turns inspected also used `openai-codex/gpt-6-astra`.
  No observed quality failure can be attributed to model choice; task bounds and evidence accessibility explain the concrete mismatches better.
- Feedback-loop inspection found root baseline gates before delegation, step-level tests/typechecks and mutation restoration, then restored-tree root gates and an independent final gate run.
  Verification was not deferred until the end; the full-suite fixture failures were caught within migration rather than after shipping.
- No observed repeated-error sequence warrants a rabbit-hole escalation finding.
  The missed-filter and package-filter errors were corrected locally; adding a generic escalation threshold would not address their causes.
- Existing delegation guidance already requires raw evidence rather than inherited coverage claims, and manifest-aware package invocation is already documented in `AGENTS.md`.
  Do not add duplicate global rules for either incident.

### Proposed adjustment

Add a short per-step delegation constraint to `.pi/prompts/tdd-plan.md`: when delegating implementation, use a fresh subagent for one TDD step, inspect its diff and verification evidence before the next dispatch, and keep final review separate.
Do not change `AGENTS.md`, broaden reviewer permissions, rewrite inherited lifecycle comments, or introduce a new evidence-storage mechanism in this retrospective.

### Next work

The Phase f1 roadmap's next delivery is fork issue 21, `Reduce selector presentation reconciliation with upstream UI changes`; GitHub still reports it open.
Proceed with `/plan-issue #21`, then retain issue 19 for the overall maintenance-outcome assessment rather than closing the phase now.

### Changes made

1. Appended this cross-session retrospective to `packages/pi-subagents/docs/retro/f0020-selector-startup-coordination.md`, including delegation friction, evidence limits, diagnostic findings, and the verified next issue.
2. The operator chose notes only and declined the proposed `.pi/prompts/tdd-plan.md` adjustment; no prompt, skill, `AGENTS.md`, or production-code changes were made.
