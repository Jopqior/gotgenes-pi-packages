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

## Stage: Implementation — TDD (2026-10-03T16:17:06Z)

### Session summary

Implemented Model-only scope controls, framed tabs with derived completion, query-change-only filtering, and ANSI-aware width fitting through three planned behavior cycles plus a reviewer-driven fourth cycle.
The preparatory test grouping and README update are committed; the documentation step's fresh-session interactive acceptance remains unperformed.
Measured package tests increased from 71 to 112 (+41), and repository-level test, typecheck, lint, and dead-code checks passed at the final reviewed implementation.

### Observations

- Startup `git pull --ff-only` on `main` reported up to date, and all four repository baseline gates passed before edits.
- The typed custom factory exposed that Pi's `Component.handleInput` is optional.
  The captured test adapter checks for the handler and binds it rather than casting the whole factory; production wiring is unchanged.
- Reducer and component scope guards were tested independently.
  Focused mutations killed both inactive-page reducer cases, both eventual-pair component cases, and all four inactive-page visibility cases; separate Model visibility pins also discriminated.
- Completion flags, selected background, both tab directions, cursor editing, and non-first filtered-model preservation received focused killing mutations before their commit.
  An additional supported-level test distinguishes a currently supported choice from a merely present thinking value without changing submission validation.
- Width tests cover non-positive and tiny widths, long task/model/provider values, CJK, emoji, combining characters, ANSI styling, empty search results, and wide-to-narrow-to-wide rendering on every page.
  Mutations of final clamping, active anchoring, cached tab layout, code-unit slicing, and prose wrapping produced the expected focused failures and were restored before committing.
- Deviations: added an explicit negative-width case and post-Green wide-character/empty-result pins, verified by mutation.
  The tiny Input test initially used the plain theme despite asserting background styling; correcting it to the ANSI theme and mutating final clamping verified the repaired pin.
- The first reviewer found that the Model `Ctrl+S scope (all/scoped)` hint still clipped, contradicting the README's keyboard-hint wrapping claim.
  Added a Red/Green/mutation cycle and the separate commit `fix(pi-subagents-model-selector): keep scope shortcut hint readable`; the delta review accepted that correction.
- Pre-completion reviewer: WARN.
  Both review rounds ran the repository deterministic gates; the final delta review retained only the unavailable interactive acceptance warning.
- Reviewer warnings: no fresh Pi session was opened for visual comparison against installed pi-ask, live terminal resize, an actual submitted pair, or cancellation before spawning.
  These checks were unavailable in this API tool session and are not complete; factory/component tests are not substitutes.
  Start a fresh Pi session from the repository root for that acceptance before shipping, because the current process still holds the old extension code.
- All files in the plan's changed-module list were updated; composition, queue, catalogue/search helpers, peer ranges, and lockfiles were unchanged.
  No architecture roadmap was updated, and deferred configuration-source work remains with fork issue #26.
- No push, issue closure, release dispatch, or publication was performed.
