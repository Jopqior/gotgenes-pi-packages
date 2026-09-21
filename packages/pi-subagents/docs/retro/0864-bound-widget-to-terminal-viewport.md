---
issue: 864
issue_title: "pi-subagents: regular TUI can go blank when background AgentWidget starts; resize restores it"
---

# Retro: #864 — pi-subagents: regular TUI can go blank when background AgentWidget starts; resize restores it

## Stage: Planning (2026-09-21T15:49:58Z)

### Session summary

Planned the fix for a third-party report (`Kacep91`) that Pi's regular-mode TUI goes blank while the background agents widget animates.
The reported mechanism was traced to Pi's `firstChanged < prevViewportTop` guard in `tui-main-screen.js`, then **reproduced and measured** with a throwaway spike that drove Pi's real `TuiMainScreen` against a fake `Terminal` with the real `AgentWidget` mounted.
The plan (`packages/pi-subagents/docs/plans/0864-bound-widget-to-terminal-viewport.md`) has seven steps: three Tidy-First preparations, a viewport-derived line budget, a running-only timer rule, the 250 ms cadence, and a doc refresh.

### Observations

- The reporter's diagnosis named the 80 ms loop but not the path to a blank screen.
  Measuring found it: at 12 widget lines and 14 terminal rows, **100 of 100** spinner ticks call `fullRender(true)`, which clears screen *and* scrollback and repaints the whole transcript (53,699 bytes/tick on a 2000-line transcript, roughly 671 KB/s at 12.5 Hz).
  At 24 rows it is 0 of 100.
  The trigger is `(widgetLines - 1) + dockLinesBelowWidget > terminalRows`, so the extension owns a real lever: `renderWidgetLines` never saw `tui.terminal.rows` and capped at a hard-coded 12.
- The spike refuted the reporter's proposed item 2 and redirected it.
  Change-gating `requestRender()` on a content snapshot saves nothing while an agent runs, because the spinner and the `formatMs` elapsed readout genuinely change every tick.
  The saving lives entirely in the no-running-agent case: a queued-only or finished-only widget writes **0 bytes** per tick yet burns 0.34–0.41 ms of whole-tree re-render, indefinitely, since `finishedTurnAge` ages only on `turn_start`.
  That became a timer-lifetime rule (`timer runs iff runningCount > 0`) rather than a cached snapshot, which needs no new state.
- Verified the issue's six cross-references rather than trusting them.
  All six exist.
  `pi#4785` (the closest match: names `pi-subagents`, the 80 ms spinner, and `fullRender(true)` in small panes) is closed **completed** while its one-line PR `pi#4784` is closed **unmerged**, and the guard is unchanged in Pi 0.86.0.
  `pi#8923`, which the body summarizes as "missing terminal rows restored by resize", is actually a **fullscreen**-mode issue closed `NOT_PLANNED` whose own repro notes regular-mode recovery worked and that the failure persists with widgets removed, so it does not support the regular-mode claim.
- The issue's diagnostics recipe (`PI_DEBUG_REDRAW=1`, log at `~/.pi/agent/pi-debug.log`) is correct for the reported 0.84.4 but wrong for current Pi: `main` renamed it to `PI_TUI_DEBUG_REDRAW` and the log to `pi-tui-debug.log` under `logDirectory`.
- The operator asked whether to match Pi's own animation timer instead of picking 250 ms. Checked: Pi's `Loader` default is also 80 ms, so we already match, but `DEFAULT_INTERVAL_MS` is module-private, `InteractiveMode.workingIndicatorOptions` is `private`, and `ctx.ui.setWorkingIndicator()` is a setter with no getter, so there is no runtime read path.
  More decisive: Pi's loader animates only while the parent is *working* and is swapped for the static `IdleStatus` when idle, the opposite duty cycle to ours, so its cadence carries no justification for our window.
  Operator chose 250 ms flat.
- The package already had the convention for this: `TranscriptPane.viewportHeight` in `session-navigator.ts` reads `tui.terminal.rows` and clamps with a `CHROME_LINES` / `MIN_VIEWPORT` / `VIEWPORT_HEIGHT_PCT` triple.
  `widgetLineBudget` mirrors it, using the absolute-reserve form rather than the percentage one because the reserved quantity is a literal count of dock rows below the widget.
- An existing doc comment on `onSubagentResuming` already asserts "the timer stops once nothing is running", which the code does not hold (`clearWidget` stops it only when nothing is active *and* nothing finished).
  Step 5 makes the comment true.
- Escape-hatch setting declined by the operator: once the height bound removes the hazard, a disable knob guards nothing, and mechanism is forever while docs are reversible.
- Tidy-First assessor returned three Recommended preparations (a params builder in `test/widget-renderer.test.ts`, a `stubTui()` builder in `test/ui/agent-widget.test.ts`, and a `setTimerRunning(shouldRun)` extraction in `agent-widget.ts`), and corrected the design summary's field count (the params object has 6 fields, so `terminalHeight` is the 7th, not the 8th).
  Its most useful note was a rejection: a fully behavior-preserving "single owner in `update()`" refactor is not reachable, because collapsing three event triggers to one state check *is* the behavior change, so it stays one atomic `fix:` commit on top of the mechanism extraction.
  Every count it reported was re-verified by grep before the plan recorded it.

#### Deferred tidyings

- `packages/pi-subagents/test/widget-renderer.test.ts` and `packages/pi-subagents/test/ui/agent-widget.test.ts` — promoting the two new local builders to `test/helpers/ui-stubs.ts` was rejected as premature; neither shape is reused outside its own file today, and `ui-stubs.ts` currently exports only `makeMenuUI`.
- `packages/pi-subagents/src/ui/widget-renderer.ts` — narrowing the `renderWidgetLines` params object was rejected: every field is read on every call by the single consumer, so 6→7 fields is cohesion, not a dependency bag.
