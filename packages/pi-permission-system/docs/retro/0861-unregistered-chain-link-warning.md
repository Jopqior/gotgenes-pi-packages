---
issue: 861
issue_title: "pi-permission-system: a locally-adjudicating child silently skips a configured chain link whose provider is excluded"
---

# Retro: #861 — a locally-adjudicating child silently skips a configured chain link whose provider is excluded

## Stage: Planning (2026-09-16T05:29:00Z)

### Session summary

Planned the fix for the silence around a skipped `authorizerChain` link: a new `AuthorizerChainAudit` in `src/authority/`, modelled on [#792]'s `ChildNodeAudit`, that owns both the existing per-ask `authorizer_chain_unregistered_link` review entry and a new visible warning latched once per session per link name.
The operator confirmed three decisions at the clarification gate — report at the first ask that skips (not at turn prep, not in `/permission-system show`), name all three causes unbranched, and latch per name.
The plan is `packages/pi-permission-system/docs/plans/0861-unregistered-chain-link-warning.md`, with four steps: a Tidy-First type extraction, the unwired audit module, the wiring `fix:`, and the docs commit.

### Observations

- The issue's resolution (the skip stays; no link inheritance across a node boundary) was never in question — ADR 0012 decision 1, ADR 0007 §7, and the `fact-shaping inheritance stops at live authority` composition-root test all converge on it.
  The whole design question was the reporting surface.
- Measured the defect in the operator's own review log rather than arguing it: **48 genuine `authorizer_chain_unregistered_link` events across 13 days**, all naming `model-judge`.
  Two traps in that measurement, both worth repeating — a raw `grep -c` reports 54 because the string appears inside a logged `bash` heredoc, and 44 of the 48 predate the `requestId` field, so a `requestId`-keyed scan under-counts them (the schema-drift hazard the package skill names).
- Two facts settled the option set and neither was inferable from the issue.
  First, an `Explore` trace of the Pi checkout established that `ctx.ui.notify(msg, "warning")` appends durably to `chatContainer` (scrollback), and that the permission dialog's `ui.select` swaps the editor area rather than compositing an overlay — so a warning emitted immediately before the prompt cannot be covered by it.
  That refuted the main UX objection to reporting at the ask.
  Second, `pi-permission-model-judge`'s ready handler opens with `if (dispose || !config) return;` — a session with no provider config *deliberately* registers nothing — so an absent link is not always the operator contradiction the issue frames it as, and the message had to admit three causes instead of two.
- Rejected turn-prep reporting on a citable ground rather than taste: ADR 0007 §4 only requires a link to register *before the session's first ask*, so a prep-time check is a prediction that can falsely accuse a conforming async registrar.
  Reporting at the skip reports a fact.
- Accepted two residuals rather than filing them, because the mechanisms that would cover them were put to the operator and declined: a headless locally-adjudicating node gets no visible warning (`noOpUIContext.notify` is literally `() => {}`), and a session where no ask ever escalates (notably under `yoloMode`) never learns its chain is broken.
- The Tidy-First assessor returned one recommendation (name the anonymous constructor-deps intersection that `test/helpers/authorizer-fixtures.ts` hand-copies, so step 3 adds its field once instead of twice) and one useful correction: the new audit's tests should use `makeLogger()` from `session-fixtures.ts`, since `makeAuthorizerLog()` returns no `warn`.
  It also flagged that `test/composition-root.test.ts` already asserts on `authorizer_chain_unregistered_link` in a block that drives this issue's exact scenario end to end — the natural place to pin the wiring.
- The assessor explicitly rejected a shared base with `ChildNodeAudit`: the two latch differently (per instance vs. per name) because their cause sets have different bounds, and a shared base would need a strategy parameter existing only to hide that.
  Recorded in the plan as a deliberate duplication.

#### Deferred tidyings

- `packages/pi-permission-system/test/helpers/authorizer-log-fixtures.ts` — `makeAuthorizerLog()`'s docstring claims its `{ review, debug }` return "structurally satisfies the session logger", but `SessionLogger` also requires `warn`.
  Rejected as out of scope: the file is not a target of this change.
- `packages/pi-permission-system/test/authority/authorizer-selection.test.ts` — the flat `describe("chain resolution")` block holds ~10 sibling `it`s; a nested `describe("unregistered configured links")` would group the ones this change touches.
  Cosmetic rather than change-shrinking, so left out.

[#792]: https://github.com/gotgenes/pi-packages/issues/792
