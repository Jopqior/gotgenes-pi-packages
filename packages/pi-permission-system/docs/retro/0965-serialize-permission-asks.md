---
issue: 965
issue_title: "pi-permission-system: a second inline permission ask replaces the first and strands its Promise — serialize asks per session"
---

# Retro: #965 — a second inline permission ask replaces the first and strands its Promise

## Stage: Planning (2026-09-22T17:33:37Z)

### Session summary

Planned the per-session FIFO serialization of human-facing permission asks for third-party issue #965 (reporter `gitwyy`, carrying a private fork).
The plan lands in `packages/pi-permission-system/docs/plans/0965-serialize-permission-asks.md`: a new `AskDialogQueue` in `authority/`, injected into `LocalUserAuthorizer` through `AuthorizerSelectionDeps`, with `releaseAll` driven from `SessionLifecycleHandler.handleSessionShutdown`.
Five TDD steps, one of them the Tidy-First assessor's single accepted preparatory test refactor.

### Observations

- The mechanism was verified against the **published** `@earendil-works/pi-coding-agent@0.87.0` tarball (`showExtensionCustom` at `dist/modes/interactive/interactive-mode.js:2237`) and found byte-identical to the tracking checkout at `d1230ea20`.
  `Container.clear()` calls no `dispose`, so an evicted component cannot detect its own eviction — that ruled out a self-healing design before it was proposed.
- Two facts the issue does not state, both found by reading the real code and both load-bearing.
  `LocalUserAuthorizer` is rebuilt on every activation inside `selectAuthorizer`, so the queue cannot be a field it owns; it has to be threaded through `AuthorizerSelectionDeps`.
  And `docs/cross-extension-api.md` documents `permissions:ui_prompt` as firing "immediately before" the UI is invoked, which **rejects** the smallest possible design (decorating the injected `requestPermissionDecision` at the composition root) because that fires the event at enqueue time.
- Other writers of Pi's inline slot were enumerated rather than assumed: `@eko24ive/pi-ask` (`ctx.ui.custom` with no options, mounted from a tool call) and `pi-subagents`' session navigator.
  Our own `/permission-system` modal uses `{ overlay: true }` and is therefore **not** a colliding writer — a check that would have added scope if skipped in the other direction.
- Honest regression surfaced and accepted at the gate: behind an unbounded FIFO, a foreign clobber of the head jams every later ask, where today it strands one and the next still renders.
  Operator chose the unbounded FIFO anyway, declining a bounded wait because that is issue #931's feature arriving through the back door.
- Operator also chose to release pending asks at shutdown as unanswered denials.
  The plan adds `denialReason` to the released decision, which the issue's proposal omits — issue #726's rule is that the agent-facing string and `decidedBy.reason` are the same string.
- The Tidy-First assessor confirmed every structural claim (field counts 5, 9, 6; the shared fixture is the only `AuthorizerSelectionDeps` construction site) and recommended no preparatory commits beyond one optional test cleanup, which was folded in as step 1.
  Its incidental report that `fallow` has a broken `.fallowrc.json` was **not** reproduced: `pnpm --silent fallow guard` works from the repo root, so the error came from its `pnpm -C` invocation.
  Treated as a lead, checked, discarded — no issue filed.
- No follow-up issues filed.
  The two open questions (an idle-threshold release, a core coordination primitive) already have homes in issue #931 and the closed `earendil-works/pi#7007`.
