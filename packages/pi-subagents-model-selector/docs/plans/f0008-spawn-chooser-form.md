---
issue: 8
issue_title: "Spawn chooser: full /model picker plus thinking on one form"
---

# Spawn chooser: one /model-style form

## Release Recommendation

**Release:** ship independently

This companion is not on an inherited improvement-phase roadmap, so there is no batch tag.
The change is a user-visible TUI replacement (and a breaking non-TUI refusal) in `@jopqior/pi-subagents-model-selector` only.

## Problem Statement

Every new run currently opens two stacked `ctx.ui.select()` dialogs.
The model step dumps the whole authenticated catalogue into a generic selector that is hard to search, and a misclick cannot be corrected without cancelling the spawn.
Issue [#1] shipped that fallback because mounting Pi's `ModelSelectorComponent` needs `ModelRuntime` (extensions do not get it) and hard-binds Tab to all/scoped.

This issue keeps the companion-only boundary and rebuilds the *experience* of `/model` inside our own `ctx.ui.custom` form, with thinking and Submit on the same flow so the operator can go back.

## Goals

- Replace the two public `ui.select()` dialogs with one inline `ctx.ui.custom` form: model tab, thinking tab, Submit tab.
- Model tab matches native `/model` in Pi `0.84.4` except the two listed non-goals: type-to-filter, ~10-row viewport, `[provider]` badges, current-model checkmark, `· default` badge, `default` search token, all/scoped when the parent has scoped models.
- Scope toggle is **Ctrl+S** (operator decision).
  Tab / Shift+Tab move between model, thinking, and Submit.
- Thinking levels follow the highlighted model.
  If the previously chosen level is still supported, keep it; otherwise clear it and block Submit until the operator picks again.
  A model that supports only `off` still requires that level to be selected on the thinking tab.
- Esc / `tui.select.cancel` (Escape, Ctrl+C) aborts that run with no workspace or child session.
- Non-TUI sessions (RPC, print, JSON) fail closed.
  Do not call `ui.select` as a fallback.
  This is **breaking** for RPC: today `hasUI` is true there and `ui.select` works; `ui.custom` returns immediately without rendering.
- No `SpawnSelectionProvider` contract change.
  Scoped models come from the parent session's `ctx.scopedModels`, intersected with `request.availableModels`.
- FIFO queue, resume skip, human-pair override, and inherited child registration stay as in [#1].

Use `feat(pi-subagents-model-selector)!:` with a `BREAKING CHANGE:` footer on the wiring commit.

## Non-Goals

- Reusing `ModelSelectorComponent` or constructing a `ModelRuntime`.
- Depending on `@eko24ive/pi-ask` (notes, Elaborate, Type-your-own, settings, left/right tab keys).
- Ctrl+S set-as-default (would rewrite the parent session default).
- Background catalogue refresh and refresh-status rows.
- Timeout, remembered spawn choice, retry, or a core provider field for scoped models.
- Changing `pi-subagents` (including `SpawnSelectionRequest`).
- Overlay chrome (`overlay: true`); native `/model` and pi-ask both occupy the editor slot, which is `ui.custom`'s default.
- Type-to-filter on the thinking tab (the native thinking selector has it; this form's thinking list is short).
- Auto-applying a scoped model's optional `thinkingLevel`.
  The human still picks thinking.

No follow-up issue is filed.
The items above are boundaries, not promises.

## Background

Author is the operator; the issue body is the working hypothesis except where the planning gate and source traces corrected it.
No prior `f0008-` retro.
No open PRs.
Newest inherited triage (`docs/triage/2026-09-02-backlog.md`) has no fork-issue-8 entry.
Pi checkout `../pi` is absent; mechanism is pinned to installed `@earendil-works/pi-coding-agent@0.84.4` sourcemaps.

| Surface                      | Evidence at 0.84.4                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native `/model`              | `ModelSelectorComponent`: `maxVisible = 10`, Tab toggles scope, Ctrl+S set-as-default, `fuzzyFilter` + `getModelSelectorSearchText`, current then default then provider sort, `✓` / `· default`, snapshot then background refresh |
| `getModelSelectorSearchText` | Not re-exported from the SDK root. Formula: `` `${provider} ${provider}/${id} ${provider} ${id}${name}` `` with `name = item.name ?` ${item.name}` : ""`                                                                          |
| `ExtensionContext`           | `mode`, `scopedModels: readonly ScopedModel[]`, `model`, `cwd`, `ui.custom`                                                                                                                                                       |
| `ui.custom`                  | Factory `(tui, theme, keybindings, done)`; default `overlay ?? false` replaces the editor; options have no `signal`                                                                                                               |
| RPC `custom()`               | Returns `undefined as never` without rendering                                                                                                                                                                                    |
| Default model                | `SettingsManager.create(cwd).getDefaultProvider()` / `getDefaultModel()`. `create` is sync. Load `withLock` returns `undefined` (no write). `migrateSettings` is in-memory on read                                                |
| `ScopedModel`                | Exported from the SDK root; `thinkingLevel` is `ThinkingLevel`, not `string`                                                                                                                                                      |

`SelectionQueue` already aborts its `dialogSignal` on request cancel and on `close()`.
Today that signal is passed into `ui.select`.
The form must keep that dismissal; see Design Overview.

Tidy-First: fixture extraction and a title helper land first.
The form/search/component modules cannot land without a production importer in the same commit — root `.fallowrc.json` sets `unused-files: error`.

## Design Overview

### Interaction

Three tabs, wrapping: **model** → **thinking** → **Submit**.

- **Tab / Shift+Tab** change tabs.
  Do not bind left/right (the model search `Input` uses those for the cursor).
- **Model tab:** native list UX.
  Typing filters.
  Up/down wrap.
  Enter advances to thinking when a row is highlighted (does not submit the form).
  Highlighted row *is* the pending model.
- **Thinking tab:** levels for the highlighted model, no search box.
  Up/down wrap.
  Enter selects the highlighted level and advances to Submit when a level is set.
  Opens with **no** level selected, even when the only level is `off`.
- **Submit tab:** shows the pending pair.
  Enter commits only when both a model and a thinking level are set; otherwise stay and say what is missing.
- **Ctrl+S** toggles all/scoped whenever scoped models exist after intersection, on any tab.
  Intercepted before the search `Input`.
  Hint on the model tab: `Ctrl+S scope (all/scoped)`.
  With no scoped models, show only `all` and the configured-providers hint; Ctrl+S is a no-op.
- **Escape / Ctrl+C** (`tui.select.cancel`) cancel.
- Answers stay editable until Submit.

Initial scope is `scoped` when the intersection is non-empty, else `all` (same as native).
Initial highlight is the parent `ctx.model` if it appears in the active list, else index 0.
Sort matches native: current, then default, then `provider` localeCompare.

### Catalogue

- **all:** `request.availableModels` (unchanged core catalogue).
- **scoped:** `ctx.scopedModels` entries whose `provider`/`id` exist in `availableModels`, using the catalogue's own `Model` object (spawn must return that object).
- If the intersection is empty, treat as no scoped models.
- Snapshot facts once per form open (`sessionFacts()` at `runDialogs` start), not per keystroke.

Do not use a second `ModelRuntime` snapshot.

### Abort bridge

`ExtensionUIContext.custom` has no `signal`.
`presentForm(input, signal)` lives in the component module and:

1. If `signal.aborted`, resolve `{ kind: "cancel" }` without calling `custom`.
2. Otherwise call `ui.custom` with `overlay: false`.
3. Register `signal` `abort` → `done({ kind: "cancel" })` with `{ once: true }`.
4. Make `done` idempotent (same `closed` guard as Pi's `showExtensionCustom`).
5. Remove the listener when the form settles.

`ModelSelector.runDialogs` passes the queue's `dialogSignal`.
Existing abort/shutdown tests retarget to: after abort, `presentForm` settles cancel and a second queued job is not started until the first settles.

### Port (ISP)

Do not pass `ExtensionContext` or the `ui.custom` factory into `ModelSelector`.

```typescript
import type { Api, Model } from "@earendil-works/pi-ai";
import type { ScopedModel } from "@earendil-works/pi-coding-agent";
import type { SpawnSelection } from "@jopqior/pi-subagents";

export interface SelectionSessionFacts {
  readonly currentModel: Model<Api> | undefined;
  readonly scopedModels: readonly ScopedModel[];
  readonly defaultModel: { readonly provider: string; readonly id: string } | undefined;
}

export type SelectionFormResult =
  | {
      readonly kind: "submit";
      readonly model: Model<Api>;
      readonly thinkingLevel: SpawnSelection["thinkingLevel"];
    }
  | { readonly kind: "cancel" };

export interface SelectionFormInput {
  readonly title: string;
  readonly availableModels: readonly Model<Api>[];
  readonly currentModel: Model<Api> | undefined;
  readonly scopedModels: readonly ScopedModel[];
  readonly defaultModel:
    | { readonly provider: string; readonly id: string }
    | undefined;
  readonly levelsFor: (
    model: Model<Api>,
  ) => readonly SpawnSelection["thinkingLevel"][];
}

export interface SelectionUIPort {
  readonly isTui: boolean;
  sessionFacts(): SelectionSessionFacts;
  presentForm(
    input: SelectionFormInput,
    signal: AbortSignal,
  ): Promise<SelectionFormResult>;
}
```

`assertReady` gates on `this.ui?.isTui` (not `hasUI`) and the existing empty-catalogue / closed checks.
Error string becomes `Spawn model selection requires a TUI.` so RPC-with-`hasUI` cannot be mistaken for a missing UI.

Consumer sketch (`index.ts`):

```typescript
chooser.attachUI({
  isTui: ctx.mode === "tui",
  sessionFacts: () => ({
    currentModel: ctx.model,
    scopedModels: ctx.scopedModels,
    defaultModel: readDefaultModel(ctx.cwd),
  }),
  presentForm: (input, signal) =>
    presentSelectionForm(ctx.ui.custom, input, signal),
});
```

`readDefaultModel` is a tiny helper in `index.ts` (or `selection-labels.ts` if it stays SDK-free — it cannot; keep it next to the composition root).
On throw or missing provider/id, omit the badge (do not fail the spawn).

### Pure form vs TUI adapter

Follow the permission-dialog split (`permission-prompt-decision.ts` / `permission-prompt-component.ts`):

- `selection-form.ts` — reduce over decoded events (`toggleScope`, `moveRow`, `filter`, `moveTab`, `confirmTab`, `cancel`).
  No `pi-tui` / `pi-coding-agent` UI imports.
  `Model` from `pi-ai` and `ScopedModel` as a structural `{ model: Model<Api> }` are fine.
- `model-search-text.ts` — the pinned haystack formula plus the `" default"` suffix native adds for the default model.
- `selection-form-component.ts` — maps raw keys (`KeybindingsManager.matches` for `tui.select.*` and `tui.input.tab`; `matchesKey` for `ctrl+s` and `shift+tab`), owns the search `Input`, renders the 10-row window, calls `done`.

Tell-Don't-Ask at the adapter: `presentSelectionForm(custom, input, signal)` constructs the component and returns the result.
`ModelSelector` does not reach through `custom` or the factory arguments.

### Design-review checklist

| Smell                    | Location          | Evidence                                                | Suggested fix                                                                                |
| ------------------------ | ----------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Wide port                | `SelectionUIPort` | Passing `ctx` or five raw fields                        | Cluster facts + `isTui` + `presentForm` (adopted)                                            |
| Missing abort channel    | `ui.custom`       | No `signal` option; queue already aborts `dialogSignal` | Bridge in `presentSelectionForm` (adopted)                                                   |
| SettingsManager in tests | `index.ts`        | `create(cwd)` is file IO                                | Stub `sessionFacts().defaultModel` in unit tests; composition-root does not assert the badge |

Inline in this change.
Do not add `src/selection-port.ts` (optional tidy: rewritten by the wiring commit).

## Module-Level Changes

### Added

- `src/selection-form.ts` — pure state.
- `src/selection-form-component.ts` — `presentSelectionForm` + component.
- `src/model-search-text.ts` — search haystack.
- `src/selection-labels.ts` — `boundDescription` / form title (extracted first, then used by the form header).
- `test/helpers/selection-fixtures.ts` — shared models, `makeRequest`, `liveSignal`.
- `test/selection-form.test.ts`, `test/selection-form-component.test.ts`, `test/model-search-text.test.ts`, `test/selection-labels.test.ts`.

### Changed

- `src/model-selector.ts` — `SelectionUIPort` as above; `runDialogs` builds `SelectionFormInput`, awaits `presentForm`, maps `submit` → `{ model, thinkingLevel }` and `cancel` → `undefined`.
  Delete `runDialogs`'s two `ui.select` calls, `modelLabel`, `thinkingTitle`, `isListedLevel`.
- `src/index.ts` — attach the new port; import `presentSelectionForm`; `readDefaultModel` via `SettingsManager.create(ctx.cwd)`.
- `test/model-selector.test.ts` — `makeHeldUI` becomes a held `presentForm`; drop two-call sequences; keep orchestration (FIFO, abort, shutdown, readiness).
- `test/composition-root.test.ts` — `session_start` ctx is `{ mode: "tui", model, scopedModels, cwd, ui: { custom } }`.
  Add `mode: "rpc"` with `hasUI: true` that throws and never calls `custom`.
- `package.json` — peer and devDependency `@earendil-works/pi-tui` at the same 0.84.4 floor as `pi-coding-agent`; `pnpm-lock.yaml` in that commit.
- `README.md` — one form; Ctrl+S scope; TUI-only; cancel the form not "either dialog"; Limitations bullet no longer says generic `ui.select`.
  Reword the catalogue sentence: all-tab is still `availableModels`; scoped-tab is `ctx.scopedModels` ∩ catalogue, not "the catalogue is `/scoped-models`".

### Predicted unchanged

- `src/selection-queue.ts` / `test/selection-queue.test.ts` — jobs remain thunks with a dialog signal.
- `test/helpers/make-model.ts` — fixtures import it.
- `packages/pi-subagents/**` — no core contract change.
- `.pi/skills/package-pi-subagents/SKILL.md` — names the seam, not `ui.select`.

No package `docs/architecture/architecture.md` (none exists).
No roadmap `✅` step.

## Test Impact Analysis

1. **New unit tests the split enables:** filter/default-token/scope/thinking-keep/submit-guard without a TUI; component `handleInput` without the queue; search-text empty-name vs named.
2. **Existing tests that become redundant:** two-dialog title/options assertions, "still opens both dialogs when there is only one model", unique `modelLabel` collision (rows are `id [provider]`, identity is the `Model` object).

   Drop those from `model-selector.test.ts`; replace with form/component pins.
3. **Must stay on `ModelSelector`:** FIFO (B's form does not open while A's form is pending), request-abort dismisses the open form, `close()` drains waiters, empty catalogue / non-TUI / unattached throw, object identity of the returned `model`.
4. **Must stay on composition-root:** register at init, inherited installs no hooks, missing core throws, shutdown disposes, TUI attach uses `custom` not `select`.

Component tests follow `packages/pi-permission-system/test/authority/permission-prompt-component.test.ts`: fake `custom` captures the factory, `plainTheme()`, stub `keybindings.matches`, drive `handleInput`.

## Invariants at risk

| Invariant (from [#1])                           | Constituency      | Pin                                                                     |
| ----------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| FIFO at the root chooser                        | concurrent spawns | retargeted `model-selector.test.ts` FIFO describe                       |
| Cancel / abort creates no child                 | operator          | `presentForm` cancel + existing core nested-selection tests (unchanged) |
| Fail closed without interactive UI              | print/JSON/RPC    | composition-root RPC pin; `assertReady` non-TUI throw                   |
| Inherited child does not install a second queue | nested sessions   | existing inherited composition tests                                    |
| `resume` does not re-ask                        | core              | unchanged in `pi-subagents`; this package never sees resume             |

Open each named test in this package when implementing; do not treat a mocked `presentForm` as a pin of the component.

## TDD Order

1. **`test:` extract shared selection fixtures** Move `sonnet` / `haiku` / `opus`, `makeRequest`, and `liveSignal` from `test/model-selector.test.ts` (and the duplicate `sonnet` / `request` in `test/composition-root.test.ts`) into `test/helpers/selection-fixtures.ts`.
   Prepares every later test file so they do not copy the builders a third time.
   Killing mutation: leave `composition-root.test.ts` on its local `request` literal — the step's verify is that both files import `makeRequest` / `makeModel` from the helper (grep), not a new assertion.
   Commit: `test(pi-subagents-model-selector): extract shared selection fixtures`

2. **`refactor:` extract the form title helper** Move `DESCRIPTION_LIMIT`, `boundDescription`, and `modelTitle` to `src/selection-labels.ts`.
   `model-selector.ts` imports them so fallow `unused-files` stays green.
   Do **not** move `modelLabel` — native rows are `id [provider]`, and the unique-label `ui.select` pin dies with the two-dialog UI.
   Move the "bounds a long description" test to `test/selection-labels.test.ts`.
   Prepares the form header so the wiring commit does not also invent title truncation.
   Killing mutation: `boundDescription` returns the string uncut — the moved test goes red.
   Commit: `refactor(pi-subagents-model-selector): extract spawn form title helper`

3. **`feat(pi-subagents-model-selector)!:` one TUI form for model and thinking** Fallow forbids landing `selection-form.ts` / `model-search-text.ts` / `selection-form-component.ts` without a production importer, so this is one commit.
   Inside the step, still red→green per layer before wiring:

   1. `test/model-search-text.test.ts` then `src/model-search-text.ts` (empty name; named; default suffix is applied by the form, not this helper).
   2. `test/selection-form.test.ts` then `src/selection-form.ts` (filter, default-token ranking, scope initial/toggle, highlight = pending model, thinking keep-if-supported vs clear, `off`-only still unselected, submit guard, Tab wrap).
   3. `test/selection-form-component.test.ts` then `src/selection-form-component.ts` plus `package.json` / lockfile `pi-tui` entries (Ctrl+S toggles scope and is not inserted into the query; Tab does not enter the search `Input`; abort signal resolves cancel; 10-row slice; badges/checkmark/default; `overlay: false`).
   4. Retarget `test/model-selector.test.ts` and `test/composition-root.test.ts`, then switch `src/model-selector.ts` and `src/index.ts`.

   Killing mutations (each must redden the layer named):

   - Search: leading haystack with bare `id` first (the proxy-id ranking bug native avoided) — kills the provider-prefixed pin.
   - Form: `toggleScope` is a no-op — kills the all/scoped test.
   - Form: switching models keeps a stale thinking level even when unsupported — kills the clear-and-block-submit test.
   - Form: auto-select `off` when it is the only level — kills the explicit-`off` test.
   - Component: pass Ctrl+S through to `Input` — kills "query unchanged / scope toggled".
   - Component: ignore `signal.abort` — kills the cancel-on-abort test.
   - `ModelSelector`: `presentForm` for B starts while A's promise is pending — kills FIFO.
   - `index.ts`: `isTui: ctx.hasUI` — kills the RPC `mode: "rpc"` / `hasUI: true` pin.

   Footer:

   ```text
   BREAKING CHANGE: Non-TUI sessions (including RPC) no longer fall back to
   ui.select; spawn selection requires a TUI and fails closed otherwise.
   ```

   Commit: `feat(pi-subagents-model-selector)!: ask for spawn model and thinking on one form`

4. **`docs:` README** Update Behavior, Lifecycle, and Limitations as listed under Module-Level Changes.
   Killing mutation: leave "asks twice" and "generic `ui.select()`" — `rg` those strings in the README (they must be gone).
   Commit: `docs(pi-subagents-model-selector): describe the /model-style spawn form`

## Risks and Mitigations

- **`ui.custom` has no signal** — mitigated by the abort bridge; spike in the component test by aborting after `custom` captures `done`.
- **Ctrl+S muscle memory (native set-as-default)** — hint text says `Ctrl+S scope`; set-as-default is a non-goal.
  Operator chose this key because native `/model` already proves the chord reaches the TUI.
- **`SettingsManager.create` as a second loader** — read-only at 0.84.4; swallow errors and omit the badge rather than failing the spawn.
- **Scoped models not in the core catalogue** — intersection; empty intersection hides the scoped switch.
- **Large wiring commit** — layers 3.1–3.3 stay unit-tested so a failure names a module; do not skip those tests to shrink the diff.

## Open Questions

None.
Scope key is Ctrl+S.
Remaining issue-body items are settled as above.
