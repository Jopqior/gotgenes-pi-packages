---
issue: 25
issue_title: "fix(pi-subagents-model-selector): scope model controls and add framed tab navigation"
---

# Retro: #25 — fix(pi-subagents-model-selector): scope model controls and add framed tab navigation

## Stage: Planning (2026-10-03T15:31:00Z)

### Session summary

Committed the numbered implementation plan in `docs/plans/f0025-framed-tab-navigation.md` within this package; no implementation was started.
Verified the existing component/reducer code, installed Pi TUI input and theme surface, and local pi-ask frame reference.
The focused baseline passed with 29 tests measured and the package typecheck passed.

### Observations

- The operator explicitly withdrew left/right tab navigation during clarification; preserve cursor editing and use Tab/Shift+Tab for page navigation.
  Updated fork issue #25 and read back the body to confirm that decision.
- Completion means valid current values, not visited pages or an additional Enter-confirmation requirement.
  Keep compatible thinking choices and clear incompatible ones through the existing reducer transitions.
- Scope rendering and input handling are both misplaced today; guard the reducer and consume inactive Ctrl+S in the component.
  Under the requested breaking-change classification, document the shortcut restriction with a breaking fix commit.
- Cursor-only Input handling currently reapplies filtering even when the query is unchanged; the plan pins preservation of a non-first filtered model and only dispatches filtering on actual text changes.
- Accepted Tidy-First test grouping and the optional typed fake-custom boundary; no production extraction is required before the UI work.
  The `bg` theme addition must update the test fake in the same step.
- Neither a package-specific skill nor an architecture roadmap exists for this selector.
  The plan recommends independent shipping; source-selection and inheritance work stays with fork issue #26.
- The screenshot directory `/tmp/model-selector-screen/` is absent; fresh-session visual comparison remains an implementation acceptance task.
  The existing composition-root test does not execute the custom UI factory, so it does not prove visual correctness.

#### Deferred tidyings

- `test/selection-form.test.ts` and `test/selection-form-component.test.ts`: do not merge their input factories; defaults encode different scenarios.
- `src/selection-form-component.ts`: no generic public tab framework or keyboard dispatch abstraction is needed for this fixed-tab repair.
- `src/index.ts`, `src/model-selector.ts`, and `src/selection-queue.ts`: no composition, catalogue, or queue refactor is needed for the selected design.
