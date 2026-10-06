---
name: package-pi-subagents-worktrees
description: |
  Package-specific context for @jopqior/pi-subagents-worktrees.
  Load when working on code, tests, or docs in packages/pi-subagents-worktrees/.
---

# pi-subagents-worktrees

Git worktree isolation for `@jopqior/pi-subagents`: a `WorkspaceProvider` that runs opted-in subagents in isolated worktrees.
This fork retains direct upstream lineage from `@gotgenes/pi-subagents-worktrees` in `gotgenes/pi-packages`, including its author attribution and MIT license.

## Core compatibility and initialization

The required peer is `@jopqior/pi-subagents >=1.0.0`; the open upper bound is operator-selected maintenance policy, not a guarantee about future majors.
Development consumes published `@jopqior/pi-subagents ^5.0.0` from the npm registry, not a workspace symlink (see `pnpm-workspace.yaml`), so public bundled declarations are available.
Keep the worktrees host peer separate from the selected core's independently declared host peers.

Load and initialize the fork core before worktrees: registration happens once at factory time, not when the core later becomes available.
An unresolved required core module fails the static import and produces a worktrees extension-loading error.
A resolvable but uninitialized core still allows configuration loading and orphaned administrative-entry pruning, then returns without registering the provider, recovery command or lifecycle handlers.
There is no later registration retry.
Preserve configuration precedence, opt-in behavior, shutdown unregistering and recovery semantics; scope and operator publication gates live in the [package README](../../../packages/pi-subagents-worktrees/README.md).

## Verification boundary

Run `pnpm -C packages/pi-subagents-worktrees run verify:core-compatibility` after changing the core dependency or consumed contracts.
This explicit network-dependent packed-consumer check uses real fork-core services, installed declarations and Git workspaces for the published floor, published development core and packed local candidate, plus missing-module/inactive-service/load-order controls.
It validates registration, configured preparation, clean/dirty disposal and shutdown unregistering, not live child execution, resume scheduling or interactive TUI behavior.
Offline root contract/validator tests check package wiring and the verifier's discriminating assertions; package unit tests remain responsible for detailed recovery cases.

## Upstream assumptions

The `/upstream-impact` watchlist for this package; the `upstream-watch` skill defines the impact classes.
Paths are relative to the Pi checkout.

| Our assumption                                                                                              | Upstream file                                                                                                                                                                                 | Breaks as                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `getAgentDir()` honors `PI_CODING_AGENT_DIR`                                                                | `packages/coding-agent/src/config.ts` (`getAgentDir`)                                                                                                                                         | Behavioral-silent: `worktreeAgents` silently falls back to empty                                                 |
| Subagent children see `ctx.hasUI === false` at `session_start`, the user session `true`                     | `packages/coding-agent/src/core/extensions/runner.ts` (`hasUI`)                                                                                                                               | Behavioral-silent: every child rescans worktrees and repeats the notice                                          |
| `session_start` fires on startup, reload, new, resume, and fork                                             | `packages/coding-agent/src/core/extensions/types.ts` (`SessionStartEvent.reason`); `packages/coding-agent/src/core/agent-session-runtime.ts`                                                  | Behavioral-silent: the notice frequency changes                                                                  |
| `session_shutdown` runs before every runtime replacement, so the provider is unregistered once per instance | `packages/coding-agent/src/core/agent-session-runtime.ts`; `packages/coding-agent/src/core/extensions/runner.ts`                                                                              | Coverage-gap: a replacement without it leaves two providers and two worktrees per child                          |
| `process.cwd()` at factory time is the session's repo root                                                  | `packages/coding-agent/src/core/extensions/types.ts` (`ExtensionContext.cwd`); `packages/coding-agent/src/core/agent-session-runtime.ts` (session switch takes the session's cwd, no `chdir`) | Coverage-gap, already live: resuming a session recorded in another directory leaves the captured `repoCwd` stale |
| `ctx.ui.select`/`confirm`/`notify` are usable in a command handler                                          | `packages/coding-agent/src/core/extensions/types.ts` (`registerCommand`, `ExtensionCommandContext`)                                                                                           | Behavioral-silent in RPC and print modes                                                                         |

The sibling `@jopqior/pi-subagents` contract (`getSubagentsService`, `registerWorkspaceProvider`, `dispose` on every outcome) is a first-party seam; `pi-subagents`' own tests own its implementation.
`test/index.test.ts` mocks Pi down to `getAgentDir` and does not detect upstream drift; the packed compatibility command exercises the real installed loader and service boundary, not every host lifecycle assumption above.
