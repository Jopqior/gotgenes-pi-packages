---
issue: 927
issue_title: "[Feature Request] pi-permission-system: Configurable hotkeys for the inline permission dialog (unfriendly to IME users)"
---

# Retro: #927 — Configurable hotkeys for the inline permission dialog

## Stage: Planning (2026-09-16T05:23:00Z)

### Session summary

Planned a `permissionDialogKeys` config option that rebinds the inline TUI permission dialog's five decisions to single printable characters, keeping `y`/`s`/`b`/`n`/`r` as defaults.
Two `ask_user` gates settled the direction (config map rather than always-on digit aliases) and three implementation parameters (single-character vocabulary, tolerant fallback instead of fail-closed scope rejection, whole-object cross-scope merge).
The plan is `packages/pi-permission-system/docs/plans/0927-configurable-permission-dialog-hotkeys.md`, with seven TDD steps — two of them Tidy-First preparatory refactors.

### Observations

- The issue is third-party (`undoubted`), so the `ask_user` direction gate was mandatory.
  The operator chose option B (config map, defaults unchanged) over the recommended option C (digit aliases by default plus config override).
- The reported accidental denial traces to a specific code path: `escape` is the natural key for dismissing an IME candidate popup, it reaches the terminal when letter presses do not, and `toEvent` maps it to `cancel` → `createDeniedPermissionDecision()`.
  That is the only non-letter deny path in the dialog.
- Probed `matchesKey` against the pinned `@earendil-works/pi-tui@0.79.1` rather than reading docs.
  Three findings the plan rests on: `matchesKey("+", "+")` is **`false`** (`parseKeyId` splits the id on `+`, leaving an empty key name), `matchesKey("a", "A")` is `true` while `matchesKey("A", "a")` is `false` (so an uppercase config value silently binds the lowercase key and must be rejected), and `Key`'s single-character values enumerate pi-tui's 31 symbol keys at runtime — which turned "named keys are expensive to validate" into a false premise and removed it from the vocabulary trade-off.
- Confirmed Pi has no seam for this: `RESERVED_KEYBINDINGS_FOR_EXTENSION_CONFLICTS` in pi's extension runner governs global editor shortcuts, and a focused `ctx.ui.custom` component consumes every keystroke itself.
- Plan `0573`'s Non-Goal named its own trigger — "revisit only if requested" — so the deferral was a lead that resolved cleanly rather than a boundary to argue around.
  No ADR, README scope row, or architecture non-goal names hotkey configurability.
- The Tidy-First assessor **inverted** the design's own sequencing.
  The design summary led with a `PromptKey` → `PromptAction` rename; the assessor showed the rename is unsafe until the identity/character split lands, because until then the literal `"y"` means "the approve action" on one test line and "the key pressed" on the next.
  Its recommended first commit is a three-site, test-invisible indirection (`config.keys?.[key] ?? key`), after which the rename is a bounded hand edit of ~44 occurrences in one test file.
  It also measured that `permission-prompt-component.test.ts` has **zero** identity-typed occurrences, which shrank the predicted blast radius substantially.
- The assessor's survey of `DEFAULT_EXTENSION_CONFIG` assertion sites found every one spreads `...DEFAULT_EXTENSION_CONFIG`.
  Separately, the package skill's rule that `promptMaxRows`/`promptFieldMaxWidth` keep their defaults at their resolver (`resolveRenderBudget`) redirected the design away from putting a resolved map on `DEFAULT_EXTENSION_CONFIG` at all — which also keeps `config-modal.ts`'s hand-listing `cloneDefaultConfig()` compiling.
  That file is recorded in the plan as a predicted-unchanged site with the claim it rests on (the field is optional).
- The collision rule needed a bounded fixed point rather than a single pass.
  Dropping a colliding override restores its default, and that default can collide with a surviving override: `{ approve: "b", deny: "y" }` needs two rounds.
  That case is the plan's named killing mutation for the loop, and eleven other equivalence classes pass under a single-pass implementation.
- Layering drove the new module into `src/config/dialog-keys.ts` rather than `src/authority/`: `config-loader.ts` needs the resolver for its issue detector, and `config/` is documented as the bottom layer, so the dialog imports *down* into config instead of config importing *up* into authority.
- The tolerant-validation choice is a deliberate carve-out from the package's fail-closed convention (#547).
  The plan states the split explicitly — shape strict in the schema, binding semantics tolerant in the resolver — so a later reader does not read it as an oversight.

#### Deferred tidyings

- `packages/pi-permission-system/src/authority/permission-prompt-decision.ts` — three parallel per-action tables (`OPTION_ORDER`, `NARROW_OPTION_ORDER`, `OPTION_VERBS`) plus `OPTION_LABELS` in the component could collapse into one record carrying order, verb, and label together.
  Rejected as scope creep: none of them gain a dimension from this change, so consolidating now is unrelated cleanup rather than preparation.
