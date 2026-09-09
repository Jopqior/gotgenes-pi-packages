---
issue: 1
issue_title: "pi-subagents：启动前交互选择 model 和 thinking（优先独立扩展）"
---

# Per-spawn human model and thinking selection

## Release Recommendation

**Release:** ship independently

This is fork-maintainer work in `Jopqior/gotgenes-pi-packages`, independent of inherited `gotgenes/pi-packages` roadmaps and release batches.
Implement on a feature branch from `fork-base` and land there, never on upstream-sync `main`.
The new package is `@jopqior/pi-subagents-model-selector`; this plan authorizes local workspace integration, not npm publication or upstream submissions.
Any later release requires separate approval of the destination, scopes, and compatibility floor; do not invent an upstream version containing this fork-only service capability.

## Problem Statement

The maintainer wants to choose both model and thinking explicitly before every covered child session is created.
Today agent configuration and call parameters select them automatically, with different lock semantics for tool and service callers.
An independent extension intercepting `tool_call` would leave direct service calls uncovered and could have its chosen arguments changed by later middleware.
The requirement therefore needs a small generative interface in `pi-subagents`, with selection policy and UI in an independent extension.

## Goals

- Require two explicit selections for every new run in an enabled root's in-process `pi-subagents` tree, including foreground/background tool calls and service calls from descendants.
- Preserve synchronous `SubagentsService.spawn()` and its immediately returned, cancellable task ID.
- Allow an admitted task record to exist while waiting, but create neither its workspace nor its child session before selection succeeds.
- Apply the human-selected model and required thinking level after ordinary call/config resolution, overriding model/thinking defaults, explicit arguments, and `locked:` values.
- Preserve other locked fields and all behavior when no selection provider is installed.
- Display every authenticated available model from the session whose manager is spawning the child, not a process-global or root-only catalogue and not `/scoped-models` filtering.
- Forward nested selections to the originating root UI even when the chooser extension is excluded from children.
- Never change the parent's active model, thinking level, agent files, or tool-call arguments to carry the choice.
- Preserve the existing public status vocabulary and record shape; pending selection is private activity, not a new public status.
- Treat this as an opt-in feature, not a breaking default change: installing/enabling the new package activates the changed selection policy; upgrading the core alone does not.

## Non-Goals

- Reusing the native `/model` component, modifying Pi, or requesting upstream acceptance.
- Out-of-process children, arbitrary third-party SDK session factories, or hostile extensions bypassing the installed core entirely.
- Reselecting for `resume`, which reuses an existing child session.
- Remembering choices, automatic defaults, timeouts, automatic retries, provider authentication UI, or new model configuration files.
- Changing ordinary `resolveModel()` fallback behavior, public task statuses, permission-system policy, workspace-provider semantics, or the concurrency limit.
- Redesigning the legacy global service locator; consumers of this feature capture their core service instance during extension initialization rather than repeatedly resolving a global slot.
- Publishing packages, adding an unpublished `npm:` load entry, or updating inherited improvement-phase completion markers.

No separately actionable follow-up is created by this plan.
The declined alternatives above are scope boundaries, not promises to implement them later.

## Background

### Evidence and existing paths

Planning examined baseline `28d9eacc03a77444b73fe98a77478e8c28d68a3b` and the package's installed Pi `0.84.4` dependencies.
The fork tracker contained only this open issue and no open PRs; its issue body names no prerequisites.
The newest inherited triage, `docs/triage/2026-09-02-backlog.md`, and historical package-local issue-1 artifacts concern the upstream repositories, not this fork issue.
No earlier planning stage for this fork issue was found.

| Surface            | Current mechanism                                                    | Consequence                                                   |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Tool foreground    | `AgentTool` → `manager.spawnAndWait()` → record execution            | Gate belongs below the tool boundary.                         |
| Tool background    | `AgentTool` → `manager.spawn()` → limiter → record execution         | ID and queue entry may precede selection.                     |
| Service            | `SubagentsServiceAdapter.spawn()` → `manager.spawn()`                | A `tool_call` interceptor is insufficient.                    |
| Fresh session      | `Subagent.run()` → workspace preparation → `createSubagentSession()` | Insert selection before both side effects.                    |
| Resume             | Existing `SubagentSession` is reused                                 | Do not enter the fresh-session selection path.                |
| Lifecycle events   | Fire-and-forget observation                                          | They cannot await a human decision or return a selected pair. |
| Workspace provider | Awaitable, but returns workspace information only                    | Do not overload or replace it with model policy.              |

`docs/configuration.md` intentionally applies `locked:` to the tool path, while programmatic service options win.
The new provider is a final, explicitly enabled human-choice authority for the pair only; it does not rewrite those ordinary resolution rules.
Invalid invocations that ordinary validation rejects still fail without creating a child; the chooser is not a repair mechanism for malformed requests.

The core's ADR `packages/pi-subagents/docs/decisions/0002-extensions-on-a-minimal-core.md` permits generative provider seams for concrete consumers, unlike observational lifecycle events.
The core must not import or discover the chooser package by name.
The permission-system's pre-bind inheritance conventions are useful evidence, but its source and API are not dependencies of this feature.

### Native UI feasibility

Pi `0.84.4` exports `ModelSelectorComponent` and `ThinkingSelectorComponent`.
The model selector requires `ModelRuntime`; `ExtensionContext` exposes `ModelRegistry` but no public accessor for its runtime.
A separate `ModelRuntime.create()` does not inherit the parent's dynamically registered providers or availability snapshot, and the selector refreshes its supplied runtime.
It is therefore not an equivalent, low-maintenance reuse path.
The maintainer approved two public `ctx.ui.select()` dialogs instead of the native `/model` selector.
RPC can support `ui.select()` through its UI request protocol; print/JSON and unserved UI requests cannot satisfy the selection requirement.

### Initialization timing

In `create-subagent-session.ts`, `await loader.reload()` precedes `sessionManager.newSession()`, which precedes SDK session creation and `bindExtensions({})`.
Registering a session-ID map only at `sessionCreated` is too late to supply initialization-time state to child extension factories.
Pinned `dist/core/resource-loader.js.map` and `dist/core/extensions/loader.js.map` establish the awaited chain:

```text
reload()
  → loadFinalExtensionSet()
  → loadExtensionsCached()/loadExtensionsInternal()
  → loadExtension()/initializeExtension()
  → await factory(load.api)
```

Wrap the complete core child factory call, including loader reload, in a shared `AsyncLocalStorage` construction context.
A child core factory captures the inherited selection scope during initialization and retains it as an ordinary runtime dependency.
Do not assume an event callback, later disposal, or resume executes in the earlier ambient context.
The adjacent Pi tracking checkout was absent; these claims are pinned-version findings, not assertions about a later Pi main branch.

## Design Overview

### Settled behavior

| Condition                                                              | Required behavior                                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| New enabled run                                                        | Explicitly select model, then thinking; no workspace/session before success.                   |
| Call supplied both values                                              | Still ask; the selected pair wins.                                                             |
| Agent locks either value                                               | Still ask; human choice wins for these fields only.                                            |
| Model supports only `off`                                              | Show `off` and require confirmation; do not silently skip the dialog.                          |
| Concurrent requests                                                    | FIFO at the root chooser; each admitted run continues occupying its own existing limiter slot. |
| Queued, not yet admitted                                               | No selection dialog until its execution begins.                                                |
| Cancel either dialog                                                   | Stop that record without a workspace/session, release its slot, and continue the queue.        |
| Missing UI, not yet ready, unavailable catalogue, or invalid selection | Fail that run explicitly; never use defaults.                                                  |
| Abort, root shutdown, or generation revocation                         | Dismiss active UI, invalidate pending work, and prohibit subsequent creation from that lease.  |
| Child chooser excluded                                                 | Inherited core scope still routes to the root chooser.                                         |
| Child chooser also loaded                                              | It must not replace or revoke the inherited root chooser.                                      |
| Resume                                                                 | No dialog; reuse existing model/thinking.                                                      |
| No root provider                                                       | Preserve ordinary core behavior and the synchronous factory fast path.                         |

The guarantee applies after successful root activation, with the core loaded before the companion.
A companion missing its required core capability reports a clear configuration error, never advertises activation, and has no tool-only fallback.
This is not a guarantee that a package absent or failed at load time can enforce policy.

### Public provider contract

Keep the new public contract in the existing service export surface.
Use `Model<Api>` from `@earendil-works/pi-ai` and the existing `SubagentThinkingLevel` from `src/config/thinking-level.ts`, whose tuple includes `off` through `max`; the service declaration build can inline the latter type.
Do not use pi-ai's bare `ThinkingLevel`, which excludes `off`, or change the existing optional string `SpawnOptions.thinkingLevel` contract.

```typescript
export interface SpawnSelection {
  readonly model: Model<Api>;
  readonly thinkingLevel: SubagentThinkingLevel;
}

export interface SpawnSelectionRequest {
  readonly agentId: string;
  readonly agentType: string;
  readonly description: string;
  readonly availableModels: readonly Model<Api>[];
}

export interface SpawnSelectionProvider {
  select(
    request: SpawnSelectionRequest,
    signal: AbortSignal,
  ): Promise<SpawnSelection | undefined>;
}

export type SpawnSelectionRegistration =
  | { readonly kind: "owned"; dispose(): void }
  | { readonly kind: "inherited"; dispose(): void };

export interface SubagentsService {
  // Existing members remain unchanged.
  registerSpawnSelectionProvider(
    provider: SpawnSelectionProvider,
  ): SpawnSelectionRegistration;
}
```

`undefined` means user cancellation, never approval with inherited values.
`thinkingLevel` is mandatory and never `undefined` in a successful result.
Unavailable UI/catalogue or provider failures use explicit errors, distinct from cancellation.
An unconfigured root returns `owned`; its idempotent disposer revokes that generation's lease.
A second registration on an active root throws a duplicate-registration error, and a revoked root cannot reactivate without a new runtime generation.
A child handle returns `inherited` without installing the supplied provider; its disposer is a no-op and never releases the core-owned child handle or revokes the root.
This result also applies to a revoked inherited lease, which remains denied, and to a child of an unconfigured root, which cannot activate this root-only extension on its ancestor's behalf.
The companion returns immediately on `inherited` and installs no UI hooks or local selection queue for that registration.

The request fields are all consumed: ID/type/description identify the request in the root UI, and available models define the actual choices.
Do not pass the full prompt, `ParentSnapshot`, lock metadata, full `ExtensionContext`, or a manager dependency bag to the provider.
Labels and dialog layout belong to the companion; core selection values carry no display strings.

Consumer sketch:

```typescript
const service = getSubagentsService(); // capture once during extension initialization
const chooser = new ModelSelector(/* narrow UI port, initially unavailable */);
const registration = service.registerSpawnSelectionProvider(chooser);
if (registration.kind === "inherited") return;
pi.on("session_start", (_event, ctx) => chooser.attachUI(ctx));
pi.on("session_shutdown", () => { chooser.close(); registration.dispose(); });
```

The missing-capability diagnostic precedes this sketch and requires a composition test.
The owned branch creates/attaches the UI adapter; the inherited branch discards the unused chooser without registering lifecycle hooks.
The inherited branch must leave root ownership untouched, including when the inherited lease is already revoked.
No parent `setModel()` or `setThinkingLevel()` call is permitted.

### Scope ownership and construction inheritance

`SpawnSelectionScope` owns the provider lease and registration lifecycle for one root runtime generation.
A descendant gets a non-owning handle to that same lease; it does not copy the provider into an independently revocable registration.
The lease distinguishes never configured, active, and revoked.
Revoking an active lease must not turn it into the never-configured state for existing descendants or queued records.
A new root session generation gets a new scope; old disposers cannot affect it.

Use one process-global `Symbol.for()` accessor for the `AsyncLocalStorage` carrier so separate jiti module instances share the construction channel.
Its stored value is a scope handle, never a process-wide enabled flag or a singleton chooser.
The companion does not access this carrier; it uses the public service registration only.

```typescript
const scope = captureInheritedSelectionScope() ?? createRootSelectionScope();
const runtime = new SubagentRuntime(/* existing dependencies, owned scope */);
// Inside an admitted fresh run, after a validated selection:
const child = await scope.constructChild(() => createSubagentSession(params));
```

`constructChild()` establishes a child handle before any loader activity, including when the root has never configured a provider.
Only the selection await is conditional; construction inheritance is unconditional and must invoke the factory thunk synchronously.
A child of an unconfigured root therefore remains a non-owner and cannot accidentally activate the root-only companion.
The child core factory captures it once; later manager calls, shutdown, and resume use the retained handle rather than reading ambient state.
Creation failures release the construction handle; child shutdown releases only its own handle.
Make owner-aware `runtime.closeSelectionScope()` the first operation in `src/handlers/lifecycle.ts`'s shutdown path, before unpublishing, context clearing, notification disposal, `abortAll()`, and manager disposal, not merely in the companion's later shutdown handler.
Pin that order in `test/handlers/lifecycle.test.ts` and keep the pre-existing order of the remaining operations unchanged.
For a root it revokes the lease and signals all pending selections; for a child it invalidates only that child handle and its pending work, without revoking the root or unrelated siblings.
Combine each run's abort signal with its retained handle's closure signal and the root lease's revocation signal for the provider call.
Child handles retain ancestry so closing a child invalidates its pending subtree, not a sibling or the root.
Core revocation must abort the signal passed to the active chooser, so manager disposal cannot wait for a later companion handler to dismiss UI.
Already queued or retained calls on a closed handle remain denied; clearing `runtime.currentCtx` or unpublishing the service is not the revocation mechanism.
No session-ID tombstone registry or change to the service locator is necessary for this feature.
Construction-handle cleanup and optional in-factory cancellation checks are complementary: releasing a handle does not cancel an already-running loader automatically.

### Execution and validation

`Subagent.run()` retains the current admission and signal wiring semantics.
When selection is required, set private pending activity, obtain the spawning parent's authenticated available catalogue, and await the provider before workspace preparation.
Clear pending activity in `finally`, and recheck both the run abort signal and lease validity after selection.
Check the combined signal and lease again after workspace preparation and immediately before the factory call.
For a gated run, carry that combined signal as an optional factory parameter and check it again after environment/loader awaits, immediately before the SDK session-creation call.
The outer check alone cannot prevent revocation during `loader.reload()` from reaching SDK creation.
If cancellation occurs after SDK creation has already begun, clean up the resulting session before binding or prompting; do not claim to undo an already-invoked SDK call.
Keep the new factory parameter absent on the no-provider path to preserve ordinary behavior.
All rejection paths reach exactly one existing terminal/observer/listener cleanup funnel.

A selection-only catalogue adapter obtains `getAvailable()` from the spawning parent's registry.
The registry's optional availability method must not fall back to `getAll()` in this path; missing support or an empty catalogue is an error.
Snapshot the choices when this admitted selection begins, keep them stable across the two dialogs, and revalidate availability before creation if the registry changed while the dialog was open.
Validate the returned provider/model identity against the catalogue, canonicalize to the registry model object, and validate thinking with Pi's supported-level helper.
Reject an unknown model, unavailable model, unsupported level, omitted thinking, or forged result instead of clamping or defaulting it.
Use `getSupportedThinkingLevels<TApi extends Api>(model: Model<TApi>): ModelThinkingLevel[]` from the root exports of `@earendil-works/pi-ai@0.84.4` at the SDK-facing catalogue/UI adapter boundary.
Pinned `dist/index.d.ts` re-exports `dist/models.d.ts`, and `dist/models.js` implements the helper: non-reasoning models yield only `off`, null-mapped levels are excluded, and `xhigh`/`max` require a defined mapping.
This is not `AgentSession.getAvailableThinkingLevels()` from pi-coding-agent and requires no parent session mutation.
The core's optional adapter must feature-detect this helper through the package namespace rather than introduce an unconditional named import unavailable on an older supported peer; missing capability denies only gated execution.
The companion can import it directly because its initial Pi floor is the verified version.
Keep the scope and queue independent of SDK runtime imports, and test the helper-unavailable branch without changing the ordinary core peer floors.

Pass the validated pair into the existing factory before `assembleSessionConfig()`.
This ensures provider-specific `promptInheritance` follows the selected provider, not the original agent/caller model.
Do not reapply model/thinking locks after this point.
The no-provider branch bypasses the new asynchronous phase entirely and retains ordinary resolution and timing.

### UI, cancellation, and readiness

The companion owns one FIFO queue per root activation.
Each queued request carries its own abort signal; cancellation removes only that request, and an active cancellation aborts the currently displayed `ui.select()` using its dialog signal.
Closing the chooser invalidates the active request and drains all pending requests without confirmation.
Every queue advancement checks both cancellation and closed state; a dismissed dialog cannot later approve a replacement generation.

Attach a narrow UI port from `session_start`, and clear it at `session_shutdown`.
Register the provider during extension initialization so an earlier `session_start` handler cannot spawn unguarded.
If that handler requests a child before the chooser's UI is attached, fail explicitly rather than waiting for a later sequential handler and deadlocking startup.
This is the same fail-closed class as unavailable UI, not an automatic selection.

Model rows use unique provider/model identifiers with a human-readable name; map the selected label back to one exact model.
The title identifies agent ID/type and a bounded description, and the thinking title names the selected model.
Use a compact two-dialog interaction, not a new configuration wizard or persistent settings screen.
No automatic timeout, single-option auto-confirmation, remembered choice, or retry is introduced.

### Private pending display

Store pending-selection activity on the existing private `SubagentState`, with set/clear/read covered together.
Internal foreground/widget projections may display `Awaiting model/thinking selection` while the public status remains `running`.
Tool background text must not claim the child session has started while it is waiting; render a submitted/waiting message for that branch.
Do not add transient activity to `SubagentRecord`, consistent with its existing record-admission policy.
Preserve no-provider output verbatim.

### Dependency and compatibility boundary

The companion uses a local `workspace:*` development dependency on `@gotgenes/pi-subagents` and is initially private.
It imports only the core's public service entry, never `#src` or a relative sibling source path.
The capability is fork-only: verify `registerSpawnSelectionProvider` at activation instead of asserting that an existing upstream semver release includes it.
Use Pi `0.84.4` as the initial verified companion compatibility floor; do not raise the core's existing peer floors for an optional feature.
Build core public declarations explicitly before the companion typecheck, including clean CI installs.
An explicit companion `check` script that invokes the core's `build:types` before `tsc --noEmit` is sufficient without a new multi-line workflow block.
Reconsider publish-facing dependency ranges only with an authorized release destination.

## Module-Level Changes

Paths in the following core tables are relative to `packages/pi-subagents/`.
Also change `src/handlers/lifecycle.ts` and its existing shutdown tests to call the owner-aware runtime close operation before abort/disposal; this wiring is required even if the companion's shutdown handler never runs.

| File                                                                       | Planned change                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/service/service.ts`                                                   | Public selection provider/request/result and registration contract, with lifecycle/error documentation.                              |
| `src/service/service-adapter.ts`                                           | Delegate registration to the runtime-owned scope; no outbound chooser import.                                                        |
| `src/lifecycle/spawn-selection.ts`                                         | Lease ownership, active/revoked distinction, selection outcome handling, narrow provider boundary.                                   |
| `src/lifecycle/selection-scope.ts`                                         | Shared construction carrier and captured root/child scope handles; identity-safe cleanup.                                            |
| `src/session/selection-catalogue.ts`                                       | Selection-only authenticated catalogue and model/thinking validation adapter.                                                        |
| `src/index.ts`                                                             | Capture inherited scope at factory initialization and wire it to runtime; preserve existing service capture convention.              |
| `src/runtime.ts`                                                           | Own scope lifetime, expose narrow registration delegation, revoke root before teardown.                                              |
| `src/lifecycle/subagent-manager.ts`                                        | Carry the retained scope into records, including queued records; keep synchronous ID return and claim ordering.                      |
| `src/lifecycle/subagent.ts`                                                | Value-returning preparatory factory helper; selected-pair gate, cancellation checks, construction wrapper, private pending activity. |
| `src/lifecycle/subagent-state.ts`                                          | Own pending activity set/clear/read without changing public status enumeration.                                                      |
| `src/lifecycle/parent-snapshot.ts`                                         | Supply the spawning parent's registry to the selection catalogue without widening ordinary resolution requirements.                  |
| `src/tools/agent-tool.ts`                                                  | Pending background wording and agent-facing explanation that enabled human selection overrides model/thinking locks.                 |
| `src/tools/foreground-runner.ts`                                           | Project private pending activity in foreground progress.                                                                             |
| `src/ui/agent-widget.ts`, `src/ui/widget-renderer.ts`, `src/ui/display.ts` | Localized pending-selection rendering, preserving ordinary output.                                                                   |
| `README.md`, `docs/configuration.md`                                       | Opt-in behavior, precedence, limitations, correct load order, captured service usage, error semantics and minimal provider example.  |
| `docs/architecture/architecture.md`                                        | Current module-tree entries for the new seam and ownership; no inherited phase marks.                                                |
| `.pi/skills/package-pi-subagents/SKILL.md` at repo root                    | Refresh the mechanism/precedence and public-seam description without historical clutter.                                             |

Also change `src/lifecycle/create-subagent-session.ts`: add the optional gated-run signal to its parameter contract, check it after asynchronous preparation before SDK creation, and dispose a session returned after cancellation.
Keep existing lifecycle ordering unchanged on success, and update `test/lifecycle/create-subagent-session.test.ts` plus its parameter/IO fixtures in the same step.

Predicted unchanged files remain regression surfaces, not invisible omissions:

- `src/lifecycle/subagent-session.ts`: selection is before the wrapper exists; resume and session disposal retain their existing behavior.
- `src/tools/spawn-config.ts`, `src/config/invocation-config.ts`, `src/session/model-resolver.ts`: ordinary resolution/locks are preserved; final human override occurs later.
- `src/session/session-config.ts`: explicit selected values should already drive its provider-specific assembly; tests must prove this rather than assume it.
- `src/types.ts`: keep new public contracts on the service surface unless an actual existing construction type needs the new narrow collaborator.
- `packages/pi-permission-system/`: no changes or new runtime dependency.
- `src/service/service.ts`'s existing global locator implementation: new registration is instance-owned; the feature does not replace locator semantics.

If these predictions fail, update the plan and affected fixtures before expanding the implementation step; do not silently introduce a global model-resolution change.

| New companion file                                                                             | Responsibility                                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents-model-selector/package.json`                                            | Private `@jopqior` package, workspace development dependency, verified Pi dependencies, source-only files allowlist, ordered typecheck/test/lint scripts. |
| `tsconfig.json`, `vitest.config.ts`, `biome.json` in that package                              | Existing ES2024, aliases and test/lint conventions.                                                                                                       |
| `src/index.ts`                                                                                 | Capture service, activate provider, handle inherited registration, attach/clear UI, diagnose missing capability.                                          |
| `src/selection-queue.ts`                                                                       | FIFO ownership, cancellation and shutdown without Pi imports.                                                                                             |
| `src/model-selector.ts`                                                                        | Two public Pi dialogs, unique labels, supported thinking levels and explicit confirmations.                                                               |
| `test/selection-queue.test.ts`, `test/model-selector.test.ts`, `test/composition-root.test.ts` | Queue, UI adapter and extension-registration behavior.                                                                                                    |
| `README.md`                                                                                    | Local-only installation, scope/precedence, lifecycle, noninteractive refusal and usage.                                                                   |

Repository integration also touches `.pi/settings.json`, `README.md`, both `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.yml` dropdowns, and `pnpm-lock.yaml`.
Add the local load path after the core, the README package row and no-dedicated-skill note, and the fork package label during implementation.
Do not add an unpublished `npm:` disable entry.
Release scripts already enumerate workspace packages; no release configuration change is needed.

### Test files and fixtures

Retain and inspect the existing core tests in these groups:

- Service/runtime wiring: `test/service/service.test.ts`, `test/service/service-adapter.test.ts`, `test/runtime.test.ts`, `test/handlers/lifecycle.test.ts`, `test/composition-root.test.ts`.
- Lifecycle: `test/lifecycle/subagent.test.ts`, `test/lifecycle/subagent-manager.test.ts`, `test/lifecycle/subagent-state.test.ts`, `test/lifecycle/create-subagent-session.test.ts`, `test/lifecycle/parent-snapshot.test.ts`.
- UI/tool: `test/tools/agent-tool.test.ts`, `test/tools/foreground-runner.test.ts`, `test/ui/agent-widget.test.ts`, `test/widget-renderer.test.ts`, `test/display.test.ts`.
- Cross-consumer assembly: `test/session/session-config.test.ts`; keep `test/tools/spawn-config.test.ts`, `test/session/model-resolver.test.ts`, and `test/lifecycle/subagent-session.test.ts` as ordinary-resolution/resume regression coverage.
- Helpers: `test/helpers/make-subagent.ts`, `test/helpers/make-deps.ts`, `test/helpers/manager-stubs.ts`, `test/helpers/subagent-session-io.ts`, `test/helpers/stub-ctx.ts`.

Add `test/lifecycle/spawn-selection.test.ts`, `test/lifecycle/selection-scope.test.ts`, and `test/session/selection-catalogue.test.ts`.
Add focused cases to existing groups rather than rewriting the large lifecycle/composition suites.
Only update `test/tools/result-renderer.test.ts` if its existing private projection actually renders the new activity; do not grow its public result contract.

## Test Impact Analysis

The new lease and FIFO queue enable deterministic tests of revocation, root isolation, request cancellation, and nested construction without live models or a terminal.
They do not replace lifecycle or composition tests: those still prove that every real creation path consults the gate and that extension initialization captures the right scope.
No existing test is redundant merely because a provider unit test passes.

Use `Promise.withResolvers()` barriers to assert ordering and unresolved work; do not rely on sleeps.
Use the existing test factories, typed mocks and exact argument/result assertions.
A mocked `createSubagentSession()` can pin pre-factory ordering, but cannot prove that child extension initialization inherits anything.
At least one integration test must exercise the real loader/factory path with local stub extensions and fake model transport, with no network calls, while checking the child core captures the scope during initialization.
Use the existing injected `io.createResourceLoader(options)` test seam to instantiate a real SDK `DefaultResourceLoader` with test-only `additionalExtensionPaths` captured by that adapter's closure.
Do not pass this field through or widen production `ResourceLoaderOptions`.
Give that SDK loader an explicitly temporary agent directory and project cwd, empty in-memory package/extension settings, and absolute local paths for the real core and a tiny scope-observer fixture.
Those temporary roots contain no ambient package declarations; trap installation/network attempts rather than silently allowing external discovery.
Run the real resource loader's `reload()` and factory initialization, but inject the existing session IO seam after loading so no provider prompt or network transport executes.
Fail the test if package installation or network access is attempted; do not attempt to pass an `extensionFactories` option through the core's narrower resource-loader options.
The fixture factory records initialization-time scope identity; fake `bindExtensions()` alone is not evidence of inheritance.
Recheck the pinned source-map trace if the dependency changes before implementation.

Coverage matrix:

| Class                                        | Required discriminating assertion                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tool foreground/background, direct service   | Same final selected pair reaches the factory, and factory/workspace counts are zero before both selections.              |
| Defaults/explicit/locked pair                | Choose a different model and level from every input; the selected pair wins in every class.                              |
| No provider                                  | Existing factory call timing, values and output remain unchanged.                                                        |
| Cancel model/cancel thinking/not ready/no UI | No factory/workspace call; cancellation is stopped, infrastructure failure is an error, never default approval.          |
| Abort/revoke during dialog or workspace      | No later child creation, queue/limiter released, terminal callbacks once.                                                |
| Missing/empty availability                   | A populated `getAll()` cannot allow a gated spawn.                                                                       |
| Invalid result                               | Unknown model, omitted thinking and unsupported level fail; no clamping.                                                 |
| FIFO                                         | Request B cannot open its model dialog between request A's model and thinking dialogs; cancelling A permits B.           |
| Nested/excluded companion                    | Root UI handles child and grandchild requests using each spawning manager's catalogue.                                   |
| Multiple roots/generations                   | Choices/cancellation/revocation stay on the originating root; an old disposer cannot affect a new root.                  |
| Startup order                                | Provider registered at initialization rejects an early request before UI readiness rather than bypassing or deadlocking. |
| Resume                                       | Chooser call count does not increase and original session identity/pair stay unchanged.                                  |

## Invariants at Risk

| Invariant and constituency                                   | Existing surface and required pin                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Synchronous IDs for extension authors                        | `service-adapter.test.ts` and manager tests: `spawn()` returns a string before the held selection resolves.              |
| Foreground claim ordering and exactly-once completion        | Existing lifecycle/manager tests plus a held/cancelled chooser case; retain real manager/record interaction.             |
| Worktree admission/cleanup                                   | `subagent.test.ts`: no workspace before approval and exactly-once cleanup if aborted afterward.                          |
| No-provider fast path                                        | Characterization in `subagent.test.ts`: factory invoked before `spawn()` returns when current no-workspace path does so. |
| Born-complete child creation and pre-bind lifecycle ordering | `create-subagent-session.test.ts` plus real-loader scope test; do not move existing events to implement selection.       |
| Provider-based prompt inheritance                            | `session-config.test.ts`: selected provider differs from agent/default provider and selects the correct strategy.        |
| Public record admission policy                               | Service snapshot tests show no pending UI activity added to `SubagentRecord`.                                            |
| Resume identity                                              | Existing `subagent-session.test.ts` plus fresh-run gate call-count test.                                                 |
| Root isolation across cached extension factories             | Composition tests instantiate multiple root generations and child factories while sharing the carrier.                   |

These are current mechanisms, not claims that fork issue 1 belongs to an inherited improvement phase.
The change promises no token/cache/latency improvement, and introduces no quantitative performance target.

## TDD Order

Each numbered item is a reviewable commit checkpoint; run typecheck immediately after changing shared interfaces and the full affected package suite before committing a shared-helper change.

1. Characterize admitted creation and cancellation before restructuring.
   Add exact timing/claim/cleanup pins to `subagent.test.ts` and manager tests, using the existing factories.
   Killing mutations: defer the no-workspace factory through `Promise.resolve().then(...)` for the synchronous pin; remove the existing terminal/listener cleanup call for the cancellation pin.
   Red via mutation, restore, verify the package suite and typecheck, then commit `test(pi-subagents): pin admitted creation ordering (#1)`.

2. Apply the accepted Tidy First preparation as a value-returning extraction.
   Extract workspace preparation and factory invocation from `Subagent.run()` into a private helper returning `Promise<SubagentSession>`; leave observer wiring and turn-loop ownership in `run()`.
   It must return the new session rather than mutate a passed dependency bag or merely relocate an imperative block.
   Keep immediate factory invocation on the no-workspace path and preserve all existing error/cleanup behavior.
   This prepares the single insertion point before workspace/session side effects.
   Verify the step-1 pins and full package suite, then commit `refactor(pi-subagents): isolate prepared session creation (#1)`.
   If the helper cannot preserve those pins, keep the original block and record why the advisory extraction was declined rather than changing behavior to satisfy the refactor.

3. Introduce the public provider, revocable scope and construction carrier without enabling a root policy.
   Write focused lease/scope tests and service registration tests first; add the narrow contracts, instance registration delegation, root ownership and inherited non-owner handles.
   Capture construction scope at the core factory initialization and retain it on the runtime; wrap the complete child factory call, not merely `bindExtensions()`.
   Include root teardown, child release and failed-factory cleanup in this step, plus cached-factory/multiple-root tests.
Add an unconfigured-root case proving that the unconditional construction wrapper makes a child registration return `inherited`, not `owned`; deleting the wrapper only in the no-provider branch must kill that pin.
Wire `handlers/lifecycle.ts` to close the scope before abort/disposal and test a queued request after closure; do not defer this ordering to companion integration.
Update all touched interface fixtures in this same commit and build/verify public declarations.
Killing mutations: turn revoked into unconfigured for the denial pin; let child release revoke its root for ownership; instantiate a module-local carrier instead of the shared symbol for cross-instance inheritance; move capture to `session_start` for the real-loader initialization pin.
Verify full core tests/typecheck/public types, then commit `refactor(pi-subagents): add scoped spawn selection provider (#1)`.
The provider is not yet an activated feature; do not claim this commit enables human selection.

4. Enforce the admitted-run gate and validated selected pair.
   Add selection-catalogue tests and lifecycle/tool/service integration tests before wiring the gate.
   Set/read/clear private pending activity as one lifecycle; await only for active/required scopes, validate model and required thinking, and check abort/revocation before workspace and again before factory invocation.
   Pass the pair before session assembly, and test defaults, explicit arguments and both locked fields with different chosen values.
Include the optional gated-run factory signal and all parameter fixtures in this commit; hold loader reload unresolved, revoke the scope, then assert the SDK factory was never called.
Do not modify ordinary resolver fallback or require availability from no-provider fixtures.
Killing mutations: move selection below workspace preparation for pre-side-effect pins; forward original model or original thinking separately for the two override classes; treat cancellation/revocation as no provider for denial pins; use `getAll()` when availability is absent for catalogue pins; remove the post-await/post-workspace validity checks for the respective race pins; remove the pre-SDK check after loader reload for the in-factory revocation pin.
Verify full core tests/typecheck and public types, then commit `feat(pi-subagents): require registered selection before child creation (#1)`.

5. Build the independent selector package and its FIFO interaction.
   Add the private package scaffold and local workspace development dependency; update the lockfile with `pnpm install` in the same commit.
   Write queue and two-dialog adapter tests first, then implement explicit model/thinking choices, supported levels, unique labels, readiness refusal, cancellation and shutdown.
   Register at extension initialization, capture the service once, and attach UI at `session_start`; inherited child registrations must not replace root ownership.
   Killing mutations: auto-choose the first option for explicit-confirmation pins; return `undefined` thinking for required-level pins; open B while A awaits thinking for FIFO; ignore dialog abort for cancellation; treat absent UI as approval for no-UI; register only at `session_start` for startup-order pins.
   Verify both packages' suites, check/lint/dead-code and local packed contents, then commit `feat(pi-subagents-model-selector): ask for model and thinking on every new run (#1)`.

6. Pin end-to-end nested and lifecycle coverage.
   Exercise real core/service wiring with root, child and grandchild extension loads; exclude the companion in one descendant and load it in another.
   Give spawning sessions different available model sets and assert the root UI selects from the correct set without changing root settings.
   Cover two roots, old-generation shutdown, queued/active abort, early startup refusal, and resume retaining its session/pair.
   Killing mutations: remove the new construction wrapper for nested inheritance; overwrite inherited registration for child-loaded behavior; always use root catalogue for different-catalogue tests; share one lease across roots for isolation; call the chooser from resume for reuse.
   Verify the full workspace test run, then commit `test(pi-subagents): cover nested human selection and lifecycle isolation (#1)`.

7. Expose accurate pending activity and document the contract.
   Add private foreground/widget/background wording tests before changing projections; keep ordinary output and public snapshots unchanged.
   Killing mutations: render `Agent started` for a pending run for the background wording pin; omit the pending projection for foreground/widget pins; leak pending activity into the public snapshot for the snapshot-shape pin.
   Update core README/configuration/architecture and its package skill, and write the companion README with precedence, load order, captured service ownership, no-UI errors, nested support and limitations.
   Load `writing-for-agents` before editing the package skill and `markdown-conventions` before markdown.
   Verify both suites and doc lint, then commit `feat(pi-subagents): show when a run awaits human selection (#1)`.

8. Wire and verify local fork activation.
   Add the companion local path after core in `.pi/settings.json`, root README entries, both issue-form options and the fork label; never add an unpublished registry load entry.
   Verify the remote remains `Jopqior/gotgenes-pi-packages` before creating `pkg:pi-subagents-model-selector` with an explicitly targeted `gh label create` command.
   No issue filing or publication is part of this step.
   On a clean dependency/type-build state, run the full gates below and inspect the local tarball allowlist.
   Restart Pi for a manual foreground/background/service/nested selection smoke test; the current process cannot verify newly edited extension code.
   Commit `build: wire fork-local subagent model selector (#1)` and run fresh-context pre-completion review before handoff to `/ship`.

### Verification commands

```bash
pnpm --filter @gotgenes/pi-subagents run build:types
pnpm --filter @gotgenes/pi-subagents run verify:public-types
pnpm --filter @gotgenes/pi-subagents exec vitest run
pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run
pnpm run check
pnpm run lint
pnpm run test
pnpm fallow dead-code
pnpm --filter @jopqior/pi-subagents-model-selector exec pnpm pack --pack-destination /tmp
```

The companion commands become runnable only after its scaffold exists; they were not claimed to pass at planning time.
Inspect the archive for runtime source and linked user docs, and absence of tests/dev configuration/internal docs.
Review lint warnings as well as the exit status.
Manually verify the displayed selected pair against the child session's effective SDK model/thinking without making paid provider calls in automated tests.

## Risks and Mitigations

- An early UI-ready wait can deadlock sequential `session_start` handlers: register early but reject unavailable UI instead of awaiting a later handler.
- An omitted child package can bypass extension-only policy: retain the core-owned inherited lease and pin real-loader initialization, not merely event registration.
- A revoked provider can become accidental no-policy execution: separate never-configured and revoked states, retain generation identity, and test queued descendants.
- Human waiting holds an existing concurrency slot: this is explicitly accepted, shown as private pending activity, and released on every terminal path.
- Cancellation during workspace preparation can race creation: check the signal and lease again before invoking the child factory and preserve workspace cleanup.
- A selected provider can disagree with prompt assembly: supply the pair before existing provider-based assembly and test with distinct providers.
- A generic selector can return ambiguous labels or unsupported levels: unique provider/model labels, explicit single-option confirmation and final core validation prohibit fallback.
- The SDK's factory call order could change: isolate the construction carrier, retain the pinned integration test, and reverify on dependency updates rather than relying on internal imports.
- Separate jiti instances can split module state: share only the carrier through `globalThis` and `Symbol.for()`, with per-runtime scope ownership and cross-instance tests.
- A local dependency can accidentally resolve the published core: use explicit `workspace:*` and verify the exported registration capability and declaration-build ordering.
- Legacy dynamic service lookup can name a different runtime than a caller intended: use the existing captured-instance pattern for the companion and integration fixtures; make no claim to redesign service routing.
- Native UI reuse may be confused with the accepted fallback: documentation must explicitly say Pi generic selection dialogs, not the native `/model` picker.

## Open Questions

No product-direction question blocks implementation.
The inherited-registration result and owner-aware shutdown order are settled above.
Error text remains an implementation detail constrained by the contracts and tests; do not widen scope or return an optional thinking value.
If a pinned integration test disproves construction-context propagation or cancellation guarantees, stop and return to the maintainer rather than substituting a tool-only interceptor.
