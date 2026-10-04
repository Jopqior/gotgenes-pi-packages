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

## Stage: Acceptance correction (2026-10-04T02:03:52Z)

### Session summary

Paused shipping after the operator reported that the original manual checks passed but browsing Model rows changed the selected model without Enter.
The operator explicitly required initial confirmation too and approved reducer and real-component interaction tests as the verification boundaries.
Separated the confirmed model from the candidate cursor, updated the plan and README, and completed automated verification.

### Observations

- The previous view derived the pending model directly from the visible highlighted row; Thinking and Submit consumed that candidate.
  The reducer now owns an initially absent confirmed model, updated only by Model Enter.
- Row movement, filtering, scope changes, and Tab navigation leave the confirmed model and thinking untouched.
  Thinking and Submit use the confirmed model even when search or scope hides it.
  Confirmation retains compatible thinking and restores its cursor; incompatible confirmation clears thinking and resets its cursor.
- Candidate arrows, confirmation checkmarks, current/default badges, and the confirmed-model summary now describe distinct facts.
  Model completion requires explicit confirmation, superseding the original plan's initial-complete behavior.
- Regression cycles observed failures before the production fix; focused mutations exercised confirmation gating, candidate isolation, rendering, and compatibility handling and were restored.
  The reviewer identified a reconfirmation-cursor test gap; added reachable compatible/incompatible cursor cases and killed the preserved-old-cursor mutation before restoring it.
- Final package verification measured 10 passing test files and 133 passing tests; package typecheck passed.
  Both independent review rounds ran repository test, typecheck, lint, and dead-code gates successfully.
- Pre-completion reviewer: WARN.
  Delta review accepted the cursor tests; the remaining warning is fresh-session manual acceptance of the corrected implementation.
  The operator's earlier manual acceptance applies to the preceding implementation, not this correction.
- Remaining manual checks: initially unchecked Model, explicit Enter confirmation, browsing without changing the confirmed pair, compatible/incompatible reconfirmation, hidden confirmed models, actual submit/cancel, and live narrow/wide resize in a fresh Pi session.
  Automated component tests do not establish these interactive results.
- No push, issue closure, or publication was performed; shipping remained paused pending corrected-version acceptance.

## Stage: Manual acceptance (2026-10-04T02:07:02Z)

### Session summary

The operator reported that manual acceptance passed after correction commit `2df42bca0` and the fresh-session acceptance checklist were provided.
This is operator-reported acceptance, not an automated or agent-observed interactive result.

### Observations

- The corrected-version manual acceptance prerequisite is satisfied by the operator's confirmation.
  The earlier review's remaining manual-check warning is resolved.
- No additional code changes were requested.
  Shipping may resume separately; this session has not pushed, closed the issue, or published a release.
