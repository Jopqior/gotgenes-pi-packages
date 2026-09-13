# @jopqior/pi-subagents-model-selector

[![npm version](https://img.shields.io/npm/v/@jopqior/pi-subagents-model-selector?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/package/@jopqior/pi-subagents-model-selector) [![CI](https://img.shields.io/github/actions/workflow/status/Jopqior/gotgenes-pi-packages/ci.yml?style=flat&logo=github&label=CI)](https://github.com/Jopqior/gotgenes-pi-packages/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io/) [![Pi Package](https://img.shields.io/badge/Pi-Package-6366F1?style=flat)](https://pi.mariozechner.at/)

Ask for model and thinking before every new in-process `@jopqior/pi-subagents` child session.

Installing or upgrading the core alone does not change selection.

## Install

Load **after** `@jopqior/pi-subagents`.
Pi loads packages in the order they are listed in `.pi/settings.json`, and this extension registers its provider with the subagents service at load time — so the core must load first.

```bash
pi install npm:@jopqior/pi-subagents
pi install npm:@jopqior/pi-subagents-model-selector
```

Then list those two `npm:` sources in that order:

```json
{
  "packages": [
    "npm:@jopqior/pi-subagents",
    "npm:@jopqior/pi-subagents-model-selector"
  ]
}
```

Or load from a checkout:

```json
{
  "packages": [
    "../packages/pi-subagents",
    "../packages/pi-subagents-model-selector"
  ]
}
```

If the core is missing, failed to load, or lacks `registerSpawnSelectionProvider`, this extension throws a configuration error at initialization and does not activate.

## Behavior

Every **new** run in an enabled root's in-process tree opens one `/model`-style form: model, thinking, and Submit.
Foreground tool calls, background tool calls, and `SubagentsService.spawn()` all go through the same gate.

The operator's pair is applied after ordinary call and config resolution.
It overrides defaults, explicit `model`/`thinking` arguments, and `locked:` values for those two fields only.
Other locked fields are unchanged.

The all-tab catalogue is every authenticated available model of the session whose manager is spawning — not a process-global list.
The scoped tab is `ctx.scopedModels` intersected with that catalogue, and is hidden when the intersection is empty.
Ctrl+S toggles all/scoped when the scoped tab exists.
A model that supports only `off` still shows `off` and requires an explicit choice on the thinking tab.

Concurrent requests are FIFO at the root chooser.
A queued run does not open the form until it is admitted.
Cancel the form stops that run without creating a workspace or child session.

A missing TUI, a UI that is not yet attached, an empty catalogue, or an invalid selection fails that run explicitly.
Print, JSON, and RPC sessions fail closed — there is no `ui.select` fallback.
There is no default, timeout, remembered choice, or retry.

Nested children still route to the root UI, including when this package is excluded from them.
A child that also loads this package receives an `inherited` registration and installs no second queue.

`resume` does not re-ask.
The parent's active model, thinking level, agent files, and tool-call arguments are not rewritten to carry the choice.

## Lifecycle

The extension captures `getSubagentsService()` once during initialization and registers the provider immediately, before any `session_start` handler can spawn.
It attaches `ctx.ui.custom` at `session_start` when `ctx.mode` is `tui`, and closes the chooser at `session_shutdown`.
A request that arrives before the UI is attached fails closed rather than waiting for a later sequential handler.

## Limitations

- Out-of-process children and third-party session factories are not covered.
- The form rebuilds the `/model` experience without mounting Pi's `ModelSelectorComponent` (no type-to-filter on the thinking tab, no set-as-default).
- Public task status stays `running` while waiting.
  Pending selection is private widget, foreground, and background wording.

## License

MIT
