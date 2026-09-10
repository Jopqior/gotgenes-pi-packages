# @jopqior/pi-subagents-model-selector

Ask for model and thinking before every new in-process `@gotgenes/pi-subagents` child session.

This is a private, locally loaded companion.
Installing or upgrading the core alone does not change selection.

## Install

Load **after** `@gotgenes/pi-subagents`.
Pi loads packages in the order they are listed in `.pi/settings.json`, and this extension registers its provider with the subagents service at load time — so the core must load first.

```json
{
  "packages": [
    "../packages/pi-subagents",
    "../packages/pi-subagents-model-selector"
  ]
}
```

Do not add an unpublished `npm:@jopqior/pi-subagents-model-selector` entry.
If the core is missing, failed to load, or lacks `registerSpawnSelectionProvider`, this extension throws a configuration error at initialization and does not activate.

## Behavior

Every **new** run in an enabled root's in-process tree asks twice: model, then thinking.
Foreground tool calls, background tool calls, and `SubagentsService.spawn()` all go through the same gate.

The operator's pair is applied after ordinary call and config resolution.
It overrides defaults, explicit `model`/`thinking` arguments, and `locked:` values for those two fields only.
Other locked fields are unchanged.

The catalogue is every authenticated available model of the session whose manager is spawning — not a process-global list, and not `/scoped-models`.
A model that supports only `off` still shows `off` and requires confirmation.

Concurrent requests are FIFO at the root chooser.
A queued run does not open a dialog until it is admitted.
Cancel either dialog stops that run without creating a workspace or child session.

Missing UI, a UI that is not yet attached, an empty catalogue, or an invalid selection fails that run explicitly.
There is no default, timeout, remembered choice, or retry.

Nested children still route to the root UI, including when this package is excluded from them.
A child that also loads this package receives an `inherited` registration and installs no second queue.

`resume` does not re-ask.
The parent's active model, thinking level, agent files, and tool-call arguments are not rewritten to carry the choice.

## Lifecycle

The extension captures `getSubagentsService()` once during initialization and registers the provider immediately, before any `session_start` handler can spawn.
It attaches `ctx.ui.select` at `session_start` and closes the chooser at `session_shutdown`.
A request that arrives before the UI is attached fails closed rather than waiting for a later sequential handler.

Print, JSON, and other non-interactive sessions cannot satisfy the selection requirement.

## Limitations

- Out-of-process children and third-party session factories are not covered.
- The dialogs are Pi's generic `ui.select()`, not the native `/model` picker.
- Public task status stays `running` while waiting.
  Pending selection is private widget, foreground, and background wording.

## License

MIT
