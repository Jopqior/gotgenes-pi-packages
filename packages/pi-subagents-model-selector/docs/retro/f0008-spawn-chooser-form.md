---
issue: 8
issue_title: "Spawn chooser: full /model picker plus thinking on one form"
---

# Retro: #8 — Spawn chooser: full /model picker plus thinking on one form

## Stage: Planning (2026-09-13T10:39:48Z)

### Session summary

Planned fork issue 8 after a clean `git pull --ff-only` on `main`.
The operator chose **Ctrl+S** for all/scoped (not Tab).
Committed `packages/pi-subagents-model-selector/docs/plans/f0008-spawn-chooser-form.md`.
Next stage is `/tdd-plan`.

### Observations

- Native `/model` was read from installed `pi-coding-agent@0.84.4` sourcemaps (`../pi` is absent).
  `getModelSelectorSearchText` is not a public export; the plan copies the pinned haystack formula.
  `ui.custom` has no `signal`; the queue's `dialogSignal` must be bridged to `done({ kind: "cancel" })`.
- RPC is a documented break: `hasUI` is true and `ui.select` works today; `custom()` is a no-op.
  Gate on `ctx.mode === "tui"`, not `hasUI`.
- `SettingsManager.create(cwd)` is sync and read-only at this pin (load `withLock` returns `undefined`).
  Default badge is best-effort; a throw omits the badge rather than failing the spawn.
- Tidy-First accepted fixture extraction and a title helper (`boundDescription` / `modelTitle` only — not `modelLabel`, because rows become `id [provider]`).
  Form, search-text, and component cannot land as unwired `refactor:` commits: root `.fallowrc.json` `unused-files: error`.
  They share the `feat!:` wiring commit, with red→green per layer inside that step.
- Optional tidyings declined: `src/selection-port.ts` (rewritten by the same commit) and extracting the `session_start` attach body (rewritten too).
- Unrelated untracked `.pi/extensions/pi-permission-system/` was left untouched.

#### Deferred tidyings

- Root `.fallowrc.json` `ignoreDependencies` still lists `@gotgenes/pi-subagents` while this fork's companion depends on `@jopqior/pi-subagents` (inert; no package declares the old name).

## Stage: Implementation — TDD (2026-09-13T11:39:28Z)

### Session summary

Implemented the `/model`-style spawn form across four TDD steps: shared fixtures, title helper, the `feat!` form plus wiring, and README.
Package tests went from 28 to 59.
Next stage is `/ship 8` on trunk.

### Observations

- Pre-completion reviewer: WARN.
  Search matching is token-substring `includes`, not native `fuzzyFilter` (ordered subsequences and score order).
  `canSubmit` is computed on every view but only asserted in tests; the renderer uses `submitMessage` instead.
- Killing mutations behaved as named except: ignoring `signal.abort` timed out rather than asserting a wrong result; skipping the queue also reddened shutdown; `isTui: ctx.hasUI` also broke the TUI attach fixture because it omitted `hasUI`.
- ESLint `no-unnecessary-condition` rejected array-index `undefined` guards without `noUncheckedIndexedAccess`; `modelAt` restores a real out-of-range `undefined`.
- Unrelated untracked `.pi/extensions/pi-permission-system/` was left untouched.
