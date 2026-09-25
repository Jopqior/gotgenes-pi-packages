# Historical comparison: gotgenes and tintinweb

The Jopqior fork, [`@jopqior/pi-subagents`](../README.md), follows [`@gotgenes/pi-subagents`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-subagents) and adds per-spawn model/thinking selection support.
Its companion supplies the interactive UI; see [selection documentation](../README.md#per-spawn-model-and-thinking-selection).

This retained matrix compares historical gotgenes and tintinweb versions only.
It is neither a current three-project benchmark nor a record of the gotgenes version incorporated into a Jopqior release.
The version labels below are preserved from the earlier comparison, not newly verified release facts.

`@gotgenes/pi-subagents` began as a fork of [`tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents) by [@tintinweb](https://github.com/tintinweb).
The original design — autonomous subagent dispatch, the live widget, the conversation viewer, custom agent types — is the foundation everything here builds on.

The gotgenes project adopted an independent minimal-core architecture, diverging from tintinweb's broader scope.
The earlier comparison described gotgenes as cherry-picking compatible tintinweb fixes rather than tracking tintinweb as a merge target; that is not Jopqior's synchronization policy.

Historical versions compared: `@gotgenes/pi-subagents` 16.2.1 and `@tintinweb/pi-subagents` 0.10.3.

## At a glance

| Aspect          | @gotgenes/pi-subagents          | @tintinweb/pi-subagents                 |
| --------------- | ------------------------------- | --------------------------------------- |
| Philosophy      | Minimal, composable core        | Batteries-included, all-in-one          |
| Pi peer scope   | `@earendil-works/pi-*` (>=0.75) | `@earendil-works/pi-*` (>=0.74)         |
| Spawn tool name | `subagent`                      | `Agent`                                 |
| Runtime deps    | `@sinclair/typebox`             | `@sinclair/typebox`, `croner`, `nanoid` |
| License         | MIT                             | MIT                                     |

Both compared versions ship TypeScript source directly (Pi runs `./src/index.ts`) and target the same `@earendil-works/pi-*` Pi.
Both compared versions already use the renamed Pi peer scope, so that scope does not distinguish them.

## Common ground

The compared gotgenes and tintinweb versions provide the same core experience:

- Foreground/background subagents with a live above-editor widget and a conversation viewer.
- Custom agent types defined in `.pi/agents/<name>.md` with YAML frontmatter (system prompt, model, thinking, tools).
- Fuzzy model selection, context inheritance, mid-run steering, session resume, and graceful turn limits.
- A `pi.events` lifecycle bus (`subagents:created`, `started`, `completed`, `failed`, `steered`, `compacted`).

## Tintinweb capabilities removed or delegated by gotgenes

In this historical comparison, tintinweb is the batteries-included option.
The tintinweb version keeps several subsystems built in that gotgenes removed or delegated:

| Capability              | @tintinweb/pi-subagents                           | @gotgenes/pi-subagents                                                                                                                            |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool restrictions       | `disallowed_tools` frontmatter (denylist)         | Delegated — `permission:` via [`@gotgenes/pi-permission-system`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-permission-system) |
| Worktree isolation      | Built-in                                          | Delegated — [`@gotgenes/pi-subagents-worktrees`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-subagents-worktrees)               |
| Persistent agent memory | `memory:` frontmatter (project / local / user)    | Removed                                                                                                                                           |
| Skill preloading        | `skills:` frontmatter (preload named skills)      | Removed — children always inherit the parent's skills                                                                                             |
| Scheduling              | Cron / interval / one-shot subagents (`schedule`) | Removed                                                                                                                                           |
| Cross-extension control | `subagents:rpc:*` event RPC                       | Replaced by a typed service (below)                                                                                                               |
| Model-scope enforcement | `enabledModels` allowlist validation              | Not included                                                                                                                                      |
| Notifications           | Smart group-join consolidation                    | Individual per-agent notifications                                                                                                                |

## Gotgenes additions

The compared gotgenes version provides a minimal core that other extensions build on, plus a small companion ecosystem:

- **Typed service API** — `SubagentsService` exposed via `Symbol.for()` accessors, so another extension can spawn and manage subagents without importing this package or relying on ad-hoc event RPC.
- **Child-session lifecycle events** — `subagents:child:spawning` / `session-created` / `bound` / `completed` / `disposed`, with `session-created` firing synchronously before `bindExtensions()` so consumers can register the child session deterministically, and `bound` firing after it resolves so they can observe what the child's extensions installed.
- **`<active_agent>` system-prompt tag** — lets [`@gotgenes/pi-permission-system`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-permission-system) resolve per-agent `permission:` frontmatter (allow / ask / deny — richer than a binary denylist) inside the child session.
- **Companion packages** — permission policy and worktree isolation live in dedicated packages rather than the core.
- **Re-architected codebase** — decomposed into seven domains behind a typed public API boundary.

## Historical selection guidance

These recommendations describe the compared versions, not current releases; consult each project's documentation before choosing.

**Use `@tintinweb/pi-subagents`** if you want a single, batteries-included extension with nothing else to install: built-in tool denylist, scheduled / cron subagents, cross-extension RPC, and model-scope enforcement in one package.
Tintinweb is the original project in this lineage.

**Use `@gotgenes/pi-subagents`** if you want a minimal, composable core: richer allow / ask / deny permissions and worktree isolation through companion packages, a typed service plus lifecycle events to build your own extensions on, and the decomposed gotgenes codebase — and you do not need built-in scheduling, RPC, or model-scope enforcement.

The compared gotgenes spawn tool is named `subagent` versus tintinweb's `Agent`, so prompts and docs that hard-code the tool name are not drop-in portable between the two.

## Historical contributions to tintinweb

These early gotgenes contributions to tintinweb record shared lineage, not present PR status:

1. Peer-dep migration to `@earendil-works/pi-*` — [tintinweb/pi-subagents#71](https://github.com/tintinweb/pi-subagents/pull/71).
2. Post-`bindExtensions` active-tool re-filter — [tintinweb/pi-subagents#72](https://github.com/tintinweb/pi-subagents/pull/72).
3. `<active_agent>` system-prompt tag — [tintinweb/pi-subagents#73](https://github.com/tintinweb/pi-subagents/pull/73).

The gotgenes architecture described above extends beyond these early contributions.
