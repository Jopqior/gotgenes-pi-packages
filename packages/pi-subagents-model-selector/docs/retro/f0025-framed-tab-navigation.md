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

## Stage: Ship (2026-10-04T02:28:27Z)

### Session summary

Shipped issue #25 through the trunk lane on root `main`.
The operator approved the exact close comment and publication of `@jopqior/pi-subagents-model-selector` to npmjs.org with tags and GitHub Releases in `Jopqior/gotgenes-pi-packages`.
Released version `3.0.0` and confirmed the issue is closed.

### Observations

- The independent-release recommendation applied; the latest manual-acceptance entry satisfied the corrected-version prerequisite.
- Origin synchronization succeeded with 11 unpushed implementation and documentation commits; no merge or worktree teardown was needed.
- Root lint and dead-code gates passed before pushing.
  CI run `37170680625` succeeded for `af25afcd659b278f663abfc8c3564f15cedb3471`.
- The plan-anchored range changed only the registered selector package; no co-shipped issue or third-party PR required closure.
  Configuration-source work remains with fork issue #26.
- The major release includes the intentional shortcut restriction: return to Model before using Ctrl+S to change scope.
  The final implementation also requires Model Enter confirmation and separates candidate browsing from the confirmed pair.
- Release run `37171048864` succeeded for the approved package and SHA.
  Verified release commit `7070152eb9ed8191671275dd8e555b894a697cb7`, its parent matching the approved SHA, the sole tag `pi-subagents-model-selector-v3.0.0`, the manifest identity/version, and the exact GitHub Release.
  Pulled the release commit with `--ff-only`; no registry polling or retry was needed.
- No architecture roadmap or phase-close action applies to this package.
  The next workflow stage is `/retro 25` at the root on `main`.

## Stage: Final Retrospective (2026-10-04T02:40:18Z)

### Session summary

Reviewed the planning, implementation, interactive-test, acceptance-correction, and ship transcripts alongside their stage notes.
The selector shipped with explicit model confirmation after manual acceptance exposed a mismatch between candidate browsing and the intended selection semantics.
This retrospective changes no runtime behavior or release state.

### Observations

#### What went well

- Manual acceptance supplied a product-contract check that the original automated tests could not supply: they correctly encoded the previously agreed immediate-selection contract.
  Shipping stopped before push, the operator clarified initial confirmation, and `fix(pi-subagents-model-selector): require explicit model confirmation (#25)` separated candidate browsing from the confirmed pair.
- The independent review found a semantic width failure despite bounded output: the scope shortcut fit only because its suffix was clipped.
  The follow-up `fix(pi-subagents-model-selector): keep scope shortcut hint readable` added a full-text preservation test rather than weakening the README claim.
- The corrected-version acceptance was recorded separately from acceptance of the preceding implementation.
  The subsequent ship session consumed that record without asking the operator to repeat the completed check.

#### What caused friction (agent side)

- `wrong-abstraction`: planning framed completion as valid values versus explicit confirmation, but did not walk through confirming A, browsing B, then opening Submit without Enter.
  The operator accepted valid-value markers during planning and later required explicit confirmation; this was a clarified product contract, not an implementation violation of the original decision.
  Impact: the reducer, component, tests, README, and plan required a correction after the original TDD work, followed by another review and manual acceptance.
- `missing-context`: the initial width checks emphasized line bounds and selected identity but did not preserve the complete Model scope shortcut text.
  Impact: the reviewer triggered a separate Red/Green/mutation cycle and fix commit.
- `other` (handoff usability): the implementation final response referred to fresh-session acceptance without supplying the executable checklist.
  The operator had to ask where and how to perform it; the agent then supplied launch, keyboard, resize, submit, and cancel steps.
  Impact: an extra clarification round, with no code rework from the handoff itself.
- `other` (evidence attribution): the interactive-test session called its completed Explore agent a haiku run, but that child's assistant turns identify `zai-coding-cn/glm-5.3-flash`.
  Impact: the test report misidentified the executed model; there is no demonstrated code defect or model-quality mismatch from this discrepancy.
- `missing-context`: the closed issue body still describes Model completion as the presence of a pending model, while the corrected plan and close comment describe explicit confirmation.
  Impact: future readers of the body alone can recover the superseded contract; the corrected plan is the handoff authority for follow-up planning.
  No GitHub body edit is included in this retrospective.

#### What caused friction (user side)

- Concrete interaction examples would have exposed the difference between a highlighted candidate and an accepted value earlier than the phrase "valid current values."
  For future UI decisions, the agent can offer a short action sequence and the operator can state the expected final value, avoiding a requirement to reason about internal state terminology.
- The operator's live interaction and acceptance decisions were necessary product judgment, not redundant mechanical oversight.
  The checklist-location question was avoidable agent-side handoff work; preparing that checklist should not fall to the operator.

### Diagnostic details

#### Model-performance correlation

- Parent planning and acceptance correction used `openai-codex/gpt-6-astra`; implementation and final ship used `openai-codex/gpt-6.1-sol`, as labeled on their assistant turns.
- The Tidy-First assessor used `openai-codex/gpt-6.1-sol` for change-scoped test-boundary and extraction advice.
- Both original pre-completion review dispatches used `openai-codex/gpt-6-astra`; the first found the clipped scope hint and the delta reviewed its correction.
- The confirmation implementation agent and its resumed cursor-test task used `openai-codex/gpt-6.1-sol`.
  The correction reviewer and its resumed delta review also used `openai-codex/gpt-6.1-sol`.
- The retained completed interactive-test child used `zai-coding-cn/glm-5.3-flash` for a package inventory.
  Other test dispatches have no retained child transcript in that session's task directory, so their executed models are unknown.
- These attributions come from type-unfiltered child transcripts, not agent defaults or the parent's model.
  No task/model reassignment is justified by the observed results; correct the attribution practice rather than inferring that a stronger model would have prevented a product-contract clarification.

#### Feedback-loop gap analysis

- The implementation ran repository baselines before edits and focused/package test and typecheck gates throughout the behavior cycles; this was not end-only verification.
  Expected mutation failures were deliberate probes, not repeated attempts to repair the same error.
- The missing loop was scenario-level product validation before encoding the original completion semantics.
  More runs of those tests would have reinforced the same agreed-but-later-revised behavior.
  Clarification should contrast the observable result of browsing without confirmation before asking the operator to choose completion semantics.

### Proposal disposition

- Proposed a concise interaction-sequence rule in `.pi/skills/clarification-gates/SKILL.md`, beside the existing substance-first guidance.
  The operator chose retrospective notes only; the proposal was not implemented.
  The existing skill remains unchanged.
- Rejected duplicating the rule in `AGENTS.md` or workflow prompts: the relevant gate already loads the skill.
- Rejected additional mutation, incremental-check, or fresh-session rules: the existing guidance was followed and did not address the contract mismatch.
- Rejected a new selector package skill or generalized UI framework in this retro: neither is needed for the small clarification improvement.
- No roadmap or phase-close action exists for this package.
  Fork issue #26 is the explicit follow-up named by the plan and is still open; its source-selection design should include browsing-versus-confirmation scenarios.

### Changes made

1. Appended the Final Retrospective stage to `packages/pi-subagents-model-selector/docs/retro/f0025-framed-tab-navigation.md`, preserving prior stages and recording cross-session friction, review findings, model attribution, and verification timing.
2. Recorded the operator's notes-only decision in this file; no skills, prompts, `AGENTS.md`, runtime code, tests, or GitHub issue bodies were changed.
