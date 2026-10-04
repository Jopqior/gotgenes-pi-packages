---
issue: 25
issue_title: "fix(pi-subagents-model-selector): scope model controls and add framed tab navigation"
---

# Scope model controls and frame the spawn chooser

## Acceptance Correction

The operator approved implementation of this correction after the original implementation.
This section supersedes the original initial-complete and immediate-selection acceptance rules and the corresponding statements in the earlier retro stages.
The frame, Model-only scope controls, Tab/Shift+Tab policy, width bounds, and real search-cursor behavior remain required.
No push, release, issue mutation, or commit is authorized by this correction's implementation task.

### Corrected contract

- Initial Model is unconfirmed and incomplete, even when the current model is highlighted.
- Row navigation, filtering, and Model scope toggles change only the candidate, never the confirmed model or thinking choice/cursor.
- Enter on Model confirms the candidate and advances to Thinking; retain a compatible thinking choice and reset its cursor to that choice, otherwise clear thinking and reset its cursor.
- Enter on Model with no candidate does nothing and preserves the previous confirmed pair.
- Thinking options and Submit review/result use the confirmed model, including when it is hidden by search or outside the current scope.
- Without Model confirmation, Thinking cannot choose and Submit cannot finish.
- Tab and Shift+Tab only navigate; they never confirm or submit.
- The browsing arrow identifies the candidate; the success checkmark identifies the confirmed selection, with separate muted current/default badges and a visible confirmed-model summary on Model and Thinking.

### Correction TDD Order

1. Pin initial incompleteness and blocked Thinking/Submit through public reducer transitions and the actual component keyboard/render boundary; observe the old behavior before production edits.
   Add `confirmedModel` to reducer-owned state, confirm it only on Model Enter, and derive Thinking/Submit from it.
2. Pin browsing isolation, compatible/incompatible re-confirmation, empty-candidate Enter, and hidden/out-of-scope confirmed-pair selection/submission.
   Restrict candidate synchronization to the model cursor; intentionally replace tests asserting immediate selection changes.
3. Pin candidate/confirmation rendering and missing-confirmation guidance using existing themes and real component rendering.
   Keep the frame/layout implementation and search Input rather than adding a framework.
4. Mutate individual confirmation, browsing, option-source, submission-source, and presentation decisions to verify discriminating tests; restore all mutations.
   Run the full package test, check, and lint gates plus feasible repository gates.
5. Update README and this plan; leave fresh-session visual comparison, actual spawn submission/cancellation, and live resize explicitly pending if interactive acceptance is unavailable.
   The parent records the retro stage and arranges review before any commit.

## Release Recommendation

**Release:** ship independently

This package has no architecture roadmap or release batch.
The selector can ship before the configuration-source flow in [#26]; planning does not authorize publication.

## Problem Statement

After selecting a thinking level, an operator can still see model-scope controls on Thinking or Submit and press Ctrl+S there to change the pending model, potentially clearing the chosen thinking level.
The chooser also lacks a visible tab strip and frame, and its unbounded title, model rows, notices, and footer can exceed the supplied terminal width.

## Goals

- Restrict scope information, Ctrl+S, and catalogue notices to Model.
- Frame every page with horizontal rules, the existing task identity title, and an active/completion-aware tab strip.
- Preserve Tab/Shift+Tab navigation and left/right search editing, with accurate hints.
- Derive completion from a confirmed model and a compatible explicitly chosen thinking level, never from visiting a page or highlighting a candidate.
- Keep all output within terminal columns and retain the active tab when resizing.
- Preserve catalogue ordering, fuzzy search, thinking choices, final validation, and cancellation.
- Classify the scope restriction as breaking under this workflow's observable-behavior rule: Ctrl+S on Thinking and Submit becomes a no-op on upgrade.
  Use a breaking fix commit and document that scope changes now require returning to Model.

## Non-Goals

- Left/right tab navigation or a new search-focus mode: the operator explicitly rejected both the proposed arrow navigation and the need to arbitrate it against editing.
- Tool / Agent / Custom presets, configuration provenance, or inheritance changes; [#26] owns that cross-package flow and depends on this UI repair.
- A pi-ask runtime dependency, copied generic tab framework, or public rendering API.
- Changes to core contracts, queue ownership, root/child routing, resume behavior, default selection, or package peer ranges.
- Replacing core-level submission validation or changing selection-provider contracts.

## Background

The issue author and authenticated GitHub user are both `Jopqior`.
The operator settled the keyboard and completion rules during planning, and the issue body was updated and read back to record them.
No prior fork or inherited issue-25 retro was found.
Open issue searches for the selector and `selection-form` found [#26] as the related future flow; the open PR sweep returned none.
The newest triage file, `docs/triage/2026-10-02-backlog.md`, has no matching selector or issue-25 entry.
There is no package-specific skill or `docs/architecture/` directory for this package; use its README and actual modules rather than inventing an architecture roadmap.

`SelectionFormComponent.handleInput` currently dispatches `toggleScope` before checking the active tab.
The reducer's `toggleScope` selects the current model or first matching row in the new scope, then calls `syncModelCursor`, which retains only a supported thinking choice.
This is the reachable trigger: after choosing `high`, move to Submit with a scope whose first model differs from the other scope, then press Ctrl+S.
The rendering defect is separate: scope lines and the no-scoped-catalogue notice are emitted before the Model/Thinking/Submit branch.

`selection-form.ts` owns selection state and transitions; `selection-form-component.ts` owns the real Pi `Input`, keys, and rendering.
`presentSelectionForm` owns inline custom-UI presentation and abort cleanup.
`src/index.ts` forwards the SDK theme through `ctx.ui.custom`; `model-selector.ts` constructs the task title through `modelTitle` and supplies session facts.
Neither needs new wiring.

The local pi-ask `src/ui/render-frame.ts` was read as a visual reference: horizontal rules, completion boxes, active background, arrows, and active-centered tab fitting.
Implement the small fixed-tab layout locally, rather than copying its output-argument mutation helpers or importing its state model.
The issue's screenshot paths under `/tmp/model-selector-screen/` are unavailable on this machine; screenshot comparison has not been performed.

The package resolves Pi TUI and coding-agent to `0.84.4`.
That installed TUI exports `visibleWidth`, `truncateToWidth`, and `wrapTextWithAnsi`; the installed theme declares `bg` and `selectedBg`.
Its compiled `Input.handleInput` handles cursor movement, and `Input.render` returns its full prompt even when width is smaller than the prompt, so input rows also need the component's final width bound.
Do not use newer APIs from the globally installed Pi documentation without checking the package's pinned surface.

Planning baseline: the two existing form test files passed with 29 tests measured, and the package typecheck passed.
This diagnosis is a source trace plus existing-suite baseline, not a fresh interactive reproduction or a synthetic prototype result.

## Design Overview

### State and keyboard policy

Put the tab guard in the reducer's `toggleScope`: return the same state unless `state.tab === "model"` and a scoped catalogue exists.
In the component, consume Ctrl+S everywhere but dispatch the event only on Model.
The reducer pin tests the domain rule independently; component tests pin real key routing.

Keep Tab, Shift+Tab, Escape, and candidate row navigation; Model Enter now explicitly confirms its candidate as specified by the acceptance correction.
Do not intercept left/right for page navigation, even when the query is empty.
On Model, forward search editing to the real `Input`; on other pages, those keys have no effect.
Only dispatch a `filter` event when the Input's value actually changes; cursor-only movement should request a render without reselecting the first filtered model or invalidating thinking.
This preserves editing while avoiding a hidden value change from an unchanged query.
Test this with a non-empty query matching multiple models and a non-first highlighted row.

Completion is derived during rendering:

- Model: `view.confirmedModel !== undefined`.
- Thinking: a confirmed model exists, `view.thinkingLevel !== undefined`, and `view.thinkingLevels.includes(view.thinkingLevel)`.
- Submit: a distinct review/submit marker, not another completion checkbox.

Initial Model and Thinking are unchecked, even for a current or off-only model.
`pendingModel` remains the highlighted candidate; `confirmedModel` is reducer-owned state set only by Model Enter.
Row movement, search, and scope changes continue through `syncModelCursor`, which only bounds the candidate cursor.
Model Enter reconciles thinking compatibility and its cursor; browsing never invalidates the confirmed pair.
Thinking options and Submit use `confirmedModel`, not the visible catalogue or candidate.
`view.canSubmit` checks confirmed-model and thinking presence; the supported-level completion marker and core-level validation remain separate.

### Frame and layout

Render in this order: top rule, task title, tab strip, current page body, explicit keyboard hints, bottom rule.
Preserve the title's type, ID, and description; wrap it rather than removing identity fields.
Use `☐` / `☒` boxes for Model and Thinking, `☰ Submit` for the final page, and `selectedBg` with text foreground for the active tab.
Completion color and active background represent different facts.
Keep the visual arrows at both ends when space allows; the footer explicitly says `Tab next · Shift+Tab previous`, never `←/→ tabs`.
Model additionally documents left/right cursor editing; Enter confirms the current page and submits only on Submit; Escape cancels everywhere.

The only adapter contract addition is a background-color operation:

```typescript
interface FormTheme {
  fg(color: string, text: string): string;
  bg(color: "selectedBg", text: string): string;
}
```

Keep private layout helpers beside the component and return strings or arrays instead of mutating caller-owned line buffers.
A private tab renderer accepts only the width, active tab, and completion facts it reads, not the whole form input or model objects.
No new import edge between local modules is required.

Fit tabs before clipping the completed strip: reserve arrow space, anchor the visible range on the active tab, then include neighboring tabs only when they fit.
If the active label itself cannot fit, reduce padding and abbreviate the active label before dropping decorative arrows.
At tiny widths prioritize an active `M`, `T`, or `S` over arrows or boxes; width zero returns empty lines, since visible identity is impossible there.
At ordinary narrow widths the full active label, marker, and both arrows should remain visible.
Compute layout afresh for each width, so resizing changes neither selection nor active page.

Use Pi's ANSI-aware column utilities, never string-length slicing for display width.
Wrap the title, catalogue notice, review values, and footer hints; clip individual model-list rows and model-name detail as needed.
Apply a final `truncateToWidth` bound to every emitted line, including Input output; handle non-positive width explicitly before helpers that assume positive widths.
The final bound is a safety net, not a substitute for keeping the active tab in the visible range.
Keep the existing model window, provider/default badges, and thinking rows.
Use a muted `current` badge for the session's current model and the success checkmark for the confirmed selection; show a wrapped confirmed-model summary on Model and Thinking.

### Structural review and Tidy First

The theme gains only the background operation that the renderer consumes; no new dependency bag or parameter relay crosses the composition root.
The frame helpers return values and read narrow presentation inputs, avoiding output arguments and model-registry reach-through.
The only added scope decisions are boundary key consumption and reducer enforcement, deliberately tested independently.
No shared mutable artifact, extension event, or global registry is changed.

Accept the assessor's recommended test grouping as a preparatory commit.
Also accept its optional typed fake-custom improvement: removing the whole-function cast makes the added theme requirement visible to TypeScript.
Do not extract Thinking/Submit renderers solely to split the procedure; extract a private value-returning helper only where the width-layout implementation needs one.

## Module-Level Changes

### Changed

- `src/selection-form.ts`: Model-only scope guard, separate candidate/confirmed state, confirmation-only thinking reconciliation, and confirmed-model Thinking/Submit transitions; preserve catalogue ordering and fuzzy search.
- `src/selection-form-component.ts`: page-local controls/notices, Ctrl+S consumption, query-change-only filter dispatch, shared frame, derived completion markers, `FormTheme.bg`, and width-aware output.
- `test/selection-form.test.ts`: public transition pins for scope guards, explicit confirmation, candidate isolation, compatibility reconciliation, and hidden-model submission without constructing private state.
- `test/selection-form-component.test.ts`: behavioral groups, typed custom/theme fake, semantic-style assertions, real-Input cursor tests, navigation and completion regressions, width/resize matrix.
- `README.md`: replace misleading all/scoped "tab" wording with Model-page scope; explain navigation, completion, frame, scope shortcut migration, and narrow-width behavior in Behavior/Limitations as appropriate.

### Predicted unchanged

- `src/index.ts` and `test/composition-root.test.ts`: actual SDK theme already supplies `bg`; typecheck verifies forwarding compatibility.
  The existing composition test mocks `custom` without calling its factory and is not evidence of frame rendering.
- `src/model-selector.ts`, `src/selection-queue.ts`, and their tests: unchanged request/result and abort contracts; run the full package suite as regression coverage.
- `src/selection-labels.ts`, model search text, and their tests: preserve title construction and matching haystack.
- `package.json`, lockfile, core package, and package skills: no dependency or cross-package API changes.
- No architecture layout, diagram, roadmap step, or package-specific skill exists to update here.

## Test Impact Analysis

The component tests exercise the real reducer and real Pi `Input`; keep that boundary rather than mocking search or state.
No existing tests become redundant: reducer tests pin domain transitions, component tests pin keys/theme/layout, and composition tests pin extension wiring.
Regroup existing component tests without weakening their assertions.
Use a plain theme for text assertions and an ANSI-producing or recording theme for selected-background assertions; plain text alone cannot prove active styling.
Update `plainTheme` and the typed fake in the same commit that requires `bg`.

New regressions cover scope/no-scope catalogues on every page, inactive Ctrl+S preserving the eventual submitted pair, both tab directions and wraparound, query cursor editing, completion invalidation, and all-line width bounds.
Assert both scope literals and the entire catalogue notice are absent on Thinking and Submit, not just one hidden hint.
Use realistic long title/model/provider values plus CJK, emoji, combining characters, and ANSI styling in width fixtures.
Width cases are chosen test inputs, not measured terminal dimensions: zero, one, two, a compact narrow range, and normal/wide layouts.
Exercise the same component wide-to-narrow-to-wide on each active tab and confirm the active identity and selection remain stable.

## Invariants at risk

- Search users retain fuzzy subsequence matching and score ordering: existing `selection-form.test.ts` filter tests remain unchanged.
- Operators retain current/default/provider ordering: existing sort-and-highlight tests remain unchanged.
- Confirming a model preserves supported thinking and clears unsupported thinking; candidate changes preserve both choices, with reducer and actual-component tests across row, filter, and scope transitions.
- An off-only model still requires an explicit Thinking choice: existing reducer test plus a new unchecked-marker assertion.
- Tab navigation never confirms or submits: existing reducer tests plus component result-observer assertions for Tab/Shift+Tab.
- Existing inline rendering, Escape cancellation, abort-before-open, abort-after-open, and final submitted pair tests remain in `selection-form-component.test.ts`.
- Search cursor movement must not alter the pending pair merely because the query is non-empty: add a regression selecting a non-first filtered row before moving the cursor.

These are current source/test invariants, not claims inferred from an inherited roadmap.
No quantitative cache, token-budget, or latency invariant is changed or claimed.

## Original TDD Order (historical)

The following order records the original implementation, already completed.
Its immediate-selection and initial-complete test expectations are superseded by the Acceptance Correction and its Correction TDD Order above; do not execute those old expectations again.

1. **Prepare the component test boundary.**
   Group the existing tests under rendering, keyboard input, submission, and cancellation.
   Type `makeFakeCustom` against `Parameters<typeof presentSelectionForm>[0]`, with the actual result type, rather than casting the whole custom function.
   Keep current behavior, real Input, fixtures, and assertions intact.
   This is test maintenance, not a red/green behavior cycle; no new behavioral assertion or killing mutation is claimed.
   Verify the component suite and package typecheck.
   Commit: `test(pi-subagents-model-selector): organize chooser interaction tests`.

2. **Restrict scope changes to Model.**
   Red: reducer `toggleScope` on Thinking and Submit must return the unchanged state, using different scoped/all pending models and a chosen level so a scope switch is observable.
   Red: component pages must omit both scope lines and catalogue notices; Ctrl+S on either non-Model page must preserve the eventual submitted pair.
   Keep the existing positive Model Ctrl+S/search test.
   Green: add the reducer guard, consume inactive Ctrl+S in the component, and move scope/notices inside the Model branch.
   Mutations: remove the reducer's tab guard to kill the reducer inactive-page cases; dispatch a Model-context scope toggle from the inactive-key branch to kill component pair-preservation cases; move scope/notice output outside the Model branch to kill their absence cases.
   A simple component-guard deletion can be masked by the reducer guard, so it is not claimed as a discriminating mutation.
   Verify the two form suites, full package suite, and typecheck.
   Commit: `fix(pi-subagents-model-selector)!: restrict model scope controls to Model`.
   Footer: `BREAKING CHANGE: Ctrl+S no longer changes model scope from Thinking or Submit. Return to Model with Tab or Shift+Tab before changing scope.`

3. **Show framed navigation and current completion state.**
   Red: assert title-before-tabs ordering, top/bottom rules, all page labels, separate completion boxes and Submit marker, and active background on each page.
   Add initial, off-only, empty-result, compatible-model-change, and incompatible-model-change marker cases; exercise row, search, and scope changes.
   Add Tab/Shift+Tab bidirectional/wraparound tests with no resolved result and no Thinking selection caused by navigation.
   Pin left/right on empty and non-empty search without leaving Model, and insert a character after moving the real cursor to prove the edit position.
   Pin unchanged query cursor movement preserving a non-first filtered model and selected thinking.
   Green: add local frame/tab helpers and derived completion rendering, extend the theme fake with `bg`, render accurate page-specific hints, and dispatch filter events only when the query changes.
   Existing navigation/cancellation assertions stay in this commit, adjusted only where their rendered text intentionally changes.
   Mutations: remove the new tab-strip call to kill frame tests; return unstyled text instead of `theme.bg` to kill active-style tests; force each completion flag true to kill initial/empty/invalid cases and false to kill selected/compatible cases; dispatch `confirmTab` for Tab to kill navigation-without-confirmation tests; intercept left/right as `moveTab` to kill cursor tests; always apply `filter` after Input handling to kill the non-first-row preservation test.
   Verify component and reducer suites, full package suite, typecheck, and package lint.
   Commit: `fix(pi-subagents-model-selector): show framed selection progress`.

4. **Bound layout and preserve the active tab through resize.**
   Red: assert `visibleWidth(line) <= width` for every line across the width/content/page matrix; assert the active label or compact identity remains present and styled, rather than accepting any clipped strip.
   Include width smaller than the Input prompt, oversized review model names, catalogue notices, long task identity, and wrapped hints.
   Green: active-first tab fitting, compact fallback, wrapped prose, bounded rows, and final ANSI-aware line clamping.
   Mutations: omit final clamping to kill the tiny-Input-width case; choose the first tab instead of the active tab when narrowing to kill Thinking/Submit retention; return the previous render's tab layout after resizing to kill resize tests; replace column truncation with string slicing to kill ANSI/wide-character bounds or identity assertions.
   Revert every mutation before continuing.
   Verify full package suite, typecheck, and lint.
   Commit: `fix(pi-subagents-model-selector): keep chooser within terminal width`.

5. **Document and manually verify the agreed interaction.**
   Update README Behavior scope terminology, keyboard rules, completion semantics, and breaking shortcut migration.
   Check that no passage claims left/right page navigation or describes all/scoped as separate tabs.
   Run package checks below, then start a fresh Pi session from the repository root so the edited extension is actually loaded.
   Compare against the installed pi-ask frame at normal and narrow widths: title, active strip, completion, arrows, rules, scope visibility, Enter/Escape, cursor editing, and live resize.
   Confirm an actual submitted pair and cancellation before spawning; do not claim a mocked composition test is this manual check.
   Record results or explicitly record an unavailable interactive check in the implementation retro; do not mark manual acceptance complete without it.
   Commit: `docs(pi-subagents-model-selector): document chooser navigation and progress`.

Use these verification commands from the repository root:

```bash
pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run test/selection-form.test.ts test/selection-form-component.test.ts
pnpm --filter @jopqior/pi-subagents-model-selector run test
pnpm --filter @jopqior/pi-subagents-model-selector run check
pnpm --filter @jopqior/pi-subagents-model-selector run lint
```

Finish implementation with the standard fresh-context pre-completion review before recommending `/ship`.

## Risks and Mitigations

- Visual arrows could imply arrow-key navigation: explicit Tab/Shift+Tab hints and cursor-editing documentation accompany them, with negative navigation tests.
- A clipped strip can hide the active tab while satisfying width assertions: assert active identity and background in addition to all-line bounds.
- Narrow Input output can exceed width: the pinned source explicitly returns its full prompt at tiny widths; test and bound that output.
- Candidate and confirmed selection can be conflated: use explicit reducer-owned confirmation state, and test Thinking/Submit with a confirmed model absent from the visible catalogue.
- The two scope guards can mask each other's tests: test reducer and real component separately with the discriminating mutations listed above.
- Long titles and wrapped hints increase vertical space: preserve task identity and explicit controls; a new height-budget framework is not part of this width repair.
- In-process extensions remain stale after edits: manual comparison must use a fresh session.

## Open Questions

No unresolved product decision remains.
The manual visual comparison is an implementation acceptance task, not evidence already collected.
No new follow-up issue is needed; the concrete deferred configuration-source work is already tracked in [#26].

[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
