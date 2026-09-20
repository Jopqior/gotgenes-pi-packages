---
issue: 933
issue_title: "pi-permission-system: a config warning present at session start is never shown"
---

# Retro: #933 — pi-permission-system: a config warning present at session start is never shown

## Stage: Planning (2026-09-20T04:45:02Z)

### Session summary

Reproduced the swallowed config warning through the real composition root before designing: a global config of `{"permission": {"*": "allow"}}` with a `hasUI: true` ctx produced **0** `ui.notify` calls across `session_start` + `before_agent_start`.
The operator's first gate answer was a question about ownership rather than a selection, which redirected the design from a three-line dedupe patch to a seam move: `ConfigStore` answers its issues, a new `ConfigIssueReporter` owns the latch and delivers through `logger.warn`, driven at both `session_start` and every `before_agent_start`.
Plan committed as `packages/pi-permission-system/docs/plans/0933-session-start-config-warning.md` — five TDD steps, lift-and-shift ordered so no commit leaves a config warning without a delivery path.

### Observations

- **The first gate was premature.**
  It offered three fix shapes without establishing who owns operator-facing warnings in this package.
  Answering the ownership question produced the finding the option set lacked: `ConfigStore.refresh:122` is the *only* session-lifecycle warning that reaches `ctx.ui.notify` directly — measured against 10 `ui.notify` hits in `src/`, the other nine being a command ctx, a gate ctx, or `PermissionSession.notify` itself.
  That direct reach made a ctx *parameter* the delivery channel, which is the defect's enabling condition, not an implementation detail.
- **Rejected: the minimal delivery-gated dedupe.**
  Spiked and measured — exactly 1 notify, full suite green with zero test edits (166 files / 4523 tests).
  It works, and it leaves the notification lifecycle inside a config holder.
  Rejected on ownership, not correctness.
- **Rejected: driving the reporter from `ConfigStore.refresh` itself.**
  Needs no handler changes and reintroduces the bug: `refresh` runs at factory time and again at `handleSessionStart` *before* `resetForNewSession`, so `session.context` is null at both and `logger.warn` has nowhere to go.
  Verified `resetForNewSession` → `activate` → `this.context` is what makes the adjacent policy-issue loop work.
- **Rejected: driving from turn prep alone.** `before_agent_start` fires after the user message is pushed (`../../pi/packages/coding-agent/src/core/agent-session.ts:1390-1406`), so a startup warning would wait for the operator's first prompt.
- **Rejected: wiring the reporter through `PermissionSession`.**
  It would spare the handlers a new dep at the cost of a fourth pure config relay on a seven-dep aggregate.
- **Mid-session re-warn is load-bearing per the operator:** "given that we refresh mid-session, we must therefore keep the user informed if they create an issue with the config mid-session."
  That fixed the latch's home (a collaborator both drivers share) rather than letting it dissolve into a once-per-session report.
- **Latch semantics chosen: latch while present.**
  Replacing `reported` with the current set each report — not accumulating into it — preserves today's clearing behavior at per-issue granularity, so an issue that disappears and returns warns again.
- Measured the notification ceiling at **3** (one per cross-cutting detector) so the per-issue split replacing the `\n`-joined blob could be priced rather than asserted.
- No existing test pins the swallow — the minimal-fix spike went green with zero edits.
  Every candidate design therefore needs a new end-to-end pin; the plan's counts notifications across two `before_agent_start` fires so the latch's absence is caught too.

#### Deferred tidyings

The Tidy-First assessor recommended no preparatory commits and declined four candidates:

- `src/handlers/lifecycle.ts`, `src/handlers/session-turn-prep.ts` — converting positional constructors to a deps-object; positional is the `src/handlers/` convention across all four classes, and the design-review five-field trigger is about a shared dependency interface, not per-class arity.
- `test/handlers/lifecycle.test.ts`, `test/handlers/session-turn-prep.test.ts` — reshaping `makeSetup` / `makeTurnPrep` into options-bags; one call site each, so no repeated-edit pain to prepare for.
- `src/config/config-store.ts` — decomposing `refresh`'s five jobs (load, normalize, status sync, issue capture, debug log); at 33 lines with a surgical edit ahead of it, and no caller needs the steps split.
- `src/config/config-issue-reporter.ts` vs `src/authority/authorizer-chain-audit.ts` — merging the two warn-once latches into a shared base; same shape, different semantics (the audit never re-arms, the reporter re-warns after an issue returns).

Two corrections it returned that the plan absorbed: `docs/architecture/architecture.md:934`'s `lifecycle.ts` entry already omits `logger`, the existing fourth dep, independent of this issue (folded into step 3); and `ConfigStore.getConfigIssues()` will share a name with `PermissionResolver.getConfigIssues(agentName?)`, recorded as an Open Question rather than a rename in scope.
