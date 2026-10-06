---
issue: 37
issue_title: "Publish @jopqior/pi-subagents-worktrees with fork-core compatibility"
---

# Publish the worktrees fork with fork-core compatibility

## Release Recommendation

**Release:** ship independently

Worktrees has no architecture roadmap or release batch.
This is the first publication of a new npm identity, so independent delivery means the separately approved manual bootstrap in the existing [first fork release policy], not ordinary `release.yml` dispatch.
Registration, implementation, candidate review and this plan do not authorize tagging, npm publication or GitHub Release creation.
The first version `0.1.0` was explicitly selected by the operator during [#36]; it is not a predicted bump or an upstream version.

## Problem Statement

The operator installed `@jopqior/pi-subagents` followed by `@gotgenes/pi-subagents-worktrees`, but Pi reported `Cannot find module '@gotgenes/pi-subagents'` while loading the companion.
The shared service symbol cannot make a different npm import name resolve.
The inherited worktrees manifest, runtime imports and installation documentation still target the upstream core, so the fork needs its own correctly wired companion identity.

## Goals

- Rename the existing package to `@jopqior/pi-subagents-worktrees` without moving its directory.
- Consume published `@jopqior/pi-subagents` through a required peer with the operator-approved open range `>=1.0.0`, independently of the development version.
- Update current metadata, installation/removal guidance, badges, issue destinations and development guidance while preserving direct upstream attribution and license bytes.
- Preserve configuration, factory-time registration, commands, opt-in behavior, workspace disposal and recovery behavior.
- Verify the packed installation against real fork-core services and configured Git workspace preparation/disposal, without the upstream core or global extensions.
- Register the actual migrated manifest through [#36]'s fork evidence route and apply reviewed first-release artifacts separately from publication.
- Provide an explicit manual first-publication and npm Trusted Publisher handoff.
- Treat this as non-breaking first publication: the old npm identity is not upgraded or replaced automatically, and neither core APIs nor existing worktrees defaults/output change.
  Use `fix(pi-subagents-worktrees):`, without a breaking-change footer; switching to the new package remains an explicit operator installation edit.

## Non-Goals

- No core source, public API, service symbol, event channel or worktree algorithm changes.
- No npm aliases, upstream-core fallback discovery, ordinary/bundled core dependency, workspace symlinks or requirement to install both cores.
- No new missing-service error, delayed registration or change to the existing resolvable-core-but-uninitialized-service behavior.
- No wildcard configuration, automatic rescue-branch merging/deletion, new model-facing recovery tool or human-session worktree feature.
- No rewriting inherited plans/retros, historical CHANGELOG sections, upstream npm artifacts or imported upstream tags.
- No synchronization integration, release-tool redesign, generic compatibility framework or new persistent evidence ledger.
  Mechanical retirement of now-false migration-status prose is not a policy change.
- No live model invocation, interactive TUI smoke test or new core child/resume test harness.
  The packed check proves registration and the registered provider's lifecycle; existing core regression tests retain ownership of child execution and resume scheduling.
- No publication, tag creation, GitHub Release mutation or release dispatch during `/tdd-plan`.
  These are the same issue's approval-gated ship handoff, not a speculative follow-up issue.

## Background

### Existing boundaries

- `src/index.ts` statically imports `getSubagentsService`, loads layered configuration and prunes orphaned administrative entries before looking up the service.
  With a service it registers one `WorktreeWorkspaceProvider`, recovery commands/notices and a shutdown disposer.
- `src/config.ts` imports `loadLayeredSettings` from the core's `/settings` export and retains `subagents-worktrees.json`, `worktreeAgents`, project-over-global layering and the `pi-subagents-worktrees` warning label.
- `src/workspace-provider.ts` implements the exported `WorkspaceProvider` contract and returns a workspace whose disposal translates real Git cleanup outcomes into result addenda.
- The service key remains `Symbol.for("@gotgenes/pi-subagents:service")` in the fork core.
  Both inspected published core tarballs use it; this issue changes module resolution, not the registry key.
- `pnpm-workspace.yaml` sets `linkWorkspacePackages: false` because published siblings supply bundled public declarations.
  Keep that setting and `trustLockfile: true`.
- `.pi/settings.json` already loads the local core before selector/worktrees and disables the upstream npm worktrees copy.
  A fork npm disable entry is intentionally absent before first publication.

### Dependencies and prior context

[#36] is closed completed and its release/synchronization support is present on `main`.
Its complete retro records the selected first version, external-only generator, exact application set and separate publication approvals.
Use those existing mechanisms rather than reimplementing them.

No fork `f0037-*` or inherited `0037-*` plan/retro existed at planning time.
The newest triage file, `docs/triage/2026-10-02-backlog.md`, is inherited upstream context and has no fork-issue finding for this migration.
Fork searches for open worktrees/`registerWorkspaceProvider` issues found no additional sibling work, and the open-PR sweep was empty.
Worktrees has no `docs/architecture/` tree, so there is no roadmap step-mark, health-metric recomputation or batch-tail deferred work to carry forward.
The README's scope admits this dependency-wiring correction and retains its human-session and post-rescue non-goals.

### Applicable repository constraints

Keep artifacts in English, use pnpm from the repository root, and target this fork explicitly for GitHub mutations.
Never infer publication approval from `@jopqior/*` metadata or registration.
All npmjs.org queries/publications name `--registry=https://registry.npmjs.org/`.
The first-release generator requires clean primary `main` and committed migration/registration; it cannot run midway through an uncommitted step or in a feature worktree.

## Design Overview

### Evidence provenance and limits

Planning reproduced the existing installation through the actual offline Pi CLI with explicit installed extension paths from `/tmp/gotgenes-worktree-test`, disabling extension/skill/template/context discovery.
The two-package row reproduced the reported missing upstream-core module; the fork-core-only control loaded successfully.
The current CLI reported `1.0.4`, rather than the report's earlier `1.0.3`.
Each deterministic condition was run once, without an LLM or stochastic cache.

The registry's published version inventory starts at `@jopqior/pi-subagents@1.0.0` and includes `5.0.0`.
Planning downloaded those exact npmjs.org tarballs, inspected the floor's runtime exports and bundled declarations, and exercised the consumed contracts through installed-source type-checks and real-service probes in both versions.
The earliest published version already has the root service accessor, `registerWorkspaceProvider`, `Workspace`, `WorkspaceProvider`, `WorkspacePrepareContext`, `WorkspaceDisposeOutcome` and `/settings`'s `loadLayeredSettings`.
There is no earlier published fork release to establish a lower floor.

A disposable projection copied this package's real source into isolated consumers and substituted only the core import namespace and package identity.
It type-checked the installed source and used the real Pi loader/core service, transparently capturing registration while delegating to the original method.
It exercised actual project configuration, non-opted preparation, opted-in clean/dirty worktrees, saved file bytes and shutdown unregister/re-registration.
This is a measured source-projection spike, not a packed migrated-package acceptance result or a live child execution test.
Its temporary source/configuration stayed outside the checkout.

| Planning measurement                                                 | Observed result                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Published core `1.0.0` with its historical development host `0.84.4` | Type-check, real registration, configuration and clean/dirty disposal passed                                      |
| Published core `5.0.0` with host `1.0.0` and TypeBox `1.3.27`        | The same checks passed                                                                                            |
| Existing package tests                                               | Measured: 8 files and 74 tests passed                                                                             |
| Existing package `check` and `lint`                                  | Passed                                                                                                            |
| Root first-release and correspondence suites                         | Measured: 2 files and 107 tests passed                                                                            |
| Production `decideFirstForkRelease` against current Git objects      | Verified independent worktrees upstream `0.3.3`, ancestry and empty package tail without writing evidence or refs |

The initial external type-check failed on extensionless `#src/*` imports until its consumer configuration mapped that namespace to the installed worktrees source.
The maintained check must use installed-package-only paths for that namespace, never repository `src` paths or sibling symlinks.
The runtime loader remains responsible for testing the unmodified packed import map.

### Identity and compatibility declarations

Change the worktrees manifest and registry atomically.
Use fork repository/homepage/bugs URLs, a description naming the fork core, and retain the existing author, MIT license and direct upstream lineage.
Keep the directory, entry point, exports, `pi.extensions` and runtime distribution scope unchanged.

Set required core peer `>=1.0.0` and published development range `^5.0.0`.
The operator selected the open upper bound after comparing it with a current-major cap; it is a maintenance policy, not a guarantee about future core majors.
Use Pi coding-agent `1.0.0` for development to satisfy the selected development core's host peers.
Preserve the worktrees package's own existing host peer range; installation must also satisfy the chosen core's independently published host peers.
Regenerate and review the lockfile using npmjs.org, without unrelated dependency upgrades or workspace conversion.

The consumer interaction remains the existing direct composition:

```typescript
const service = getSubagentsService();
if (!service) return;
const unregister = service.registerWorkspaceProvider(
  new WorktreeWorkspaceProvider(config, live),
);
pi.on("session_shutdown", () => unregister());
```

This is an unchanged interaction sketch, not a proposal to move configuration/pruning below the lookup.
No interface fields, callback relays, dependency bags, module owners or internal import edges change.
The design-review checklist found no new dependency-width, output-argument, reset, discriminator or abstraction problem introduced by these namespace edits.
The provider continues using all prepare-context fields (`agentId`, `agentType`, `baseCwd`) and disposal's `description`; importing the existing exported contract does not introduce a new over-wide exported function.

### Actual load behavior

| Installation/load shape                                           | Required behavior                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Required fork core cannot resolve                                 | Static import fails; Pi records an extension-loading error attributed to worktrees   |
| Core resolves, but is not initialized when worktrees factory runs | Configuration/pruning still run; no provider, command or lifecycle handlers register |
| Worktrees listed before a resolvable core                         | It does not retry registration when the core later initializes                       |
| Core initialized first                                            | Worktrees registers exactly once and unregisters at shutdown                         |

Correct README and source comments that currently equate an absent module with the missing-service early return.
Do not change the code's initialization timing or no-provider behavior to make documentation easier.

### Packed compatibility check

Add `scripts/verify-core-compatibility.mjs` within this package, exposed as `verify:core-compatibility`.
Follow the selector's established explicit packed-consumer convention, but do not copy its unrelated chooser-specific rows or extract a common framework.
The network-dependent command stays outside Vitest and runs as a dedicated CI step after the concurrent workspace tests.

The command packs the actual worktrees package and checks identity, required/non-optional peer, absence of ordinary/optional/bundled/upstream-core dependencies, registry dev range and shipped files.
Install into disposable consumers with peer auto-install and lifecycle scripts disabled, explicit npmjs.org resolution, empty agent/project discovery roots and no upstream core.
Any relaxed install-age policy is confined to those disposable consumers, not the repository configuration.
Resolve packages from the installed entry points, record actual names/versions/paths and reject resolution back into the monorepo.

Positive rows are published core `1.0.0` with host `0.84.4`, published `5.0.0` with host `1.0.0`, and the actual local core tarball with host `1.0.0`.
Read the candidate's name/version from its packed manifest rather than presuming that its version still matches today's registry release.
Each row type-checks against installed declarations/source and loads extensions in a fresh process through the real SDK loader.

A small instrumentation extension between core and worktrees captures the provider while forwarding registration to the actual service method and retaining its actual disposer.
It supplies no synthetic service and changes no service symbol.
Drive that registered provider against a real disposable Git repository with actual global/project config files.
Assert non-opted return, detached `HEAD` workspace creation, clean removal, dirty rescue branch contents/addendum, required command/hooks and successful re-registration after shutdown unregisters the original provider.
Track created worktree paths separately from the consumer directory and reclaim them in `finally`, including assertion-failure paths.

Negative fresh-process rows omit the core package, leave a resolvable core unloaded, or load worktrees before core.
Assert collected loader errors and exact worktrees registrations, not process exit code alone.
The missing-package assertion must reject positive rows, wrong-entry attribution and a diagnostic naming only the longer worktrees package name.
The installed-but-inactive assertions must reject a registered provider and remain distinct from import failure.
No future-incompatible-service guard is added to production code.

### First-release artifacts and ship handoff

Register worktrees as `kind: "fork"`, `evidence: "fork-sync"`, with direct upstream `@gotgenes/pi-subagents-worktrees`, repository `gotgenes/pi-packages` and directory `packages/pi-subagents-worktrees`.
Keep existing core and selector registrations/evidence unchanged.

Planning's production evidence check resolved incorporated merge `877efb38d5ea8723391160e8c3d6d9597c40b1e5`, upstream tip `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032` and direct worktrees release `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
These are measured provenance, not permission to skip revalidation if `main` advances before candidate generation.
There were no worktrees fork tags and its schema-2 state had empty `releases`/`syncs`.

After committing migration, tests and docs, prepare bounded external notes describing actual fork changes and use the existing generator:

```bash
node scripts/release/prepare-first-fork-release.mjs \
  --repo "$PWD" --package pi-subagents-worktrees --version 0.1.0 \
  --merge 877efb38d5ea8723391160e8c3d6d9597c40b1e5 \
  --notes /tmp/worktrees-first-summary.md \
  --output /tmp/worktrees-first-candidate
```

The output path must be fresh with an existing parent; choose a new external path if it already exists.
Present the actual candidate manifest and complete diff to the operator, including `sourceHead`, incorporated evidence and `applicationFiles`, before applying anything.
Recheck clean primary `main`, unchanged reviewed bytes and `sourceHead === HEAD` immediately before copying.
Apply exactly the generator's four application files and commit them together; retain `first-fork-release.json` externally.
Do not hand-author the CHANGELOG version/date/provenance or rerender inherited history.

An applied first row is projected bootstrap evidence until its tag/publication exist.
Root tests must not require an existing first tag or a permanently empty scaffold at this intermediate stage.
Do not run the ordinary worktrees correspondence CLI `--check` against an untagged projected row; use the generator's pending-aware rendering/evidence validation and the existing first-release fixture round trip.
After approved tagging, ordinary tagged-artifact/table validation becomes applicable.

The README maintainer section links the policy and records the exact first-publication handoff:

1. Obtain separate approval for the public npmjs.org destination and `@jopqior/pi-subagents-worktrees` identity, exact artifacts and tagging/Release effects.
2. Tag the reviewed artifact commit only after approval and publish from the exact tagged checkout after `release-artifacts.mjs published` preflight into an existing temporary output directory.
3. The operator publishes manually with `pnpm --filter @jopqior/pi-subagents-worktrees publish --access public --no-git-checks --registry=https://registry.npmjs.org/`, without `--provenance`; OTP interaction belongs in the operator's terminal.
4. Any approved GitHub Release uses that same tag and exact CHANGELOG section, explicitly targeting `Jopqior/gotgenes-pi-packages`.
5. After successful first publication, configure npm's GitHub Actions Trusted Publisher with owner `Jopqior`, repository `gotgenes-pi-packages`, workflow filename `release.yml` and no environment unless the actual workflow gains one.
   Permit direct publishing for the existing workflow; saving the dashboard configuration does not verify it.
6. Only after confirmed approved first publication add the fork npm disable object to `.pi/settings.json`, retaining local core-first order and the upstream disable entry.
   Subsequent releases use ordinary separately approved guarded dispatch.

The npm Trusted Publisher fields were checked against [npm trusted publishing documentation] and the actual `release.yml` job with `id-token: write`.
Do not change that workflow or use `whoami` as proof of OIDC permission.
If approval is withheld, stop with a precise unpublished handoff rather than dispatching ordinary preparation or claiming publication complete.

## Module-Level Changes

| File                                                                                                                                  | Planned change                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents-worktrees/package.json`                                                                                        | Fork identity/metadata, required fork-core peer, published dev core/host, explicit verification script; generator later owns first version                                                                             |
| `packages/pi-subagents-worktrees/src/index.ts`                                                                                        | Fork-core accessor import and accurate loading comment only                                                                                                                                                            |
| `packages/pi-subagents-worktrees/src/config.ts`                                                                                       | Fork `/settings` import and removal of upstream-version header claim only                                                                                                                                              |
| `packages/pi-subagents-worktrees/src/workspace-provider.ts`                                                                           | Fork-core type import only                                                                                                                                                                                             |
| `packages/pi-subagents-worktrees/test/index.test.ts`                                                                                  | Fork-core mock path and wording identifying uninitialized service rather than missing module                                                                                                                           |
| `packages/pi-subagents-worktrees/scripts/verify-core-compatibility.mjs` (new)                                                         | Bounded packed install/type/load/configured-provider matrix and fixture cleanup                                                                                                                                        |
| `test/worktrees/package-contract.test.mjs` (new)                                                                                      | Offline package metadata/import/required-peer/registration and packed file-set checks                                                                                                                                  |
| `test/worktrees/packed-compatibility.test.mjs` (new)                                                                                  | Offline discriminating result-validator, manifest and cleanup controls for the maintained packed command                                                                                                               |
| `pnpm-lock.yaml`                                                                                                                      | Reviewed registry dependency wiring, generated by pnpm in the manifest migration commit                                                                                                                                |
| `scripts/release/release-packages.json`                                                                                               | Append the actual migrated worktrees fork registration, preserving existing entry order and bytes where possible                                                                                                       |
| `.github/workflows/ci.yml`                                                                                                            | Dedicated worktrees packed-verification invocation after concurrent tests, separate from Vitest                                                                                                                        |
| `packages/pi-subagents-worktrees/README.md`                                                                                           | Fork badges/identity/provenance/install/removal/core floor/load-order/failure distinction and guarded maintainer handoff; keep behavior/recovery/scope sections                                                        |
| `README.md`                                                                                                                           | Correct mixed fork/upstream scope description, worktrees table/badge, fork git install/remove source and explicit npm identities; retire false pending-migration wording and fix the worktrees dedicated-skill listing |
| `.pi/skills/package-pi-subagents-worktrees/SKILL.md`                                                                                  | Fork identity/core, published dependency convention, actual load behavior and verification boundary                                                                                                                    |
| `.pi/skills/package-pi-subagents/SKILL.md`                                                                                            | Change only the old worktrees package identity in its published-sibling example                                                                                                                                        |
| `docs/upstream/fork-release-policy.md`                                                                                                | Retire only the introductory claim that worktrees remains unregistered after its actual migration; preserve all policy/approval semantics                                                                              |
| `test/upstream-sync/workflow-contract.test.mjs`                                                                                       | In migration commit, expect only touched registry entries in candidate selection; preparatory state-aware scaffold/view contract before artifact application                                                           |
| `packages/pi-subagents-worktrees/CHANGELOG.md`                                                                                        | Generator-only bounded first section insertion preserving all inherited bytes outside its seam                                                                                                                         |
| `scripts/release/pi-subagents-worktrees/sync-state.json`                                                                              | Generator-only independently verified first correspondence row                                                                                                                                                         |
| `docs/upstream/pi-subagents-worktrees-release-correspondence.md`                                                                      | Generator-only managed table projection, preserving external prose                                                                                                                                                     |
| `.pi/settings.json`                                                                                                                   | Predicted unchanged during implementation because local ordering/upstream suppression are already correct; add only the fork disable entry after approved first publication                                            |
| `pnpm-workspace.yaml`                                                                                                                 | Predicted unchanged: registry sibling resolution and reviewed-lockfile policy already satisfy the requirement                                                                                                          |
| Core/selector package files, both core state/view artifacts, release scripts/workflow, inherited worktrees plans/retros and `LICENSE` | Predicted unchanged: this migration uses their existing contracts rather than modifying them                                                                                                                           |

The exact-identifier sweep included all worktrees source/tests/docs and `.pi/skills/`.
Retain upstream names where they describe provenance, historical migrations or immutable history; do not bulk-replace every match.
Root release tests reading the real registry were inspected: publication fixtures overwrite their copied registry, migration/history/table readers do not require a two-entry registry, and the candidate-selection fixture above does require a same-commit repair.
The package has no architecture layout or Mermaid diagram to update, and no export/module is removed or relocated.

## Test Impact Analysis

This is wiring correction, not an extraction; it creates no new lower-level runtime unit seam.
The new test surface is the packed module/dependency boundary that existing mocked entry tests cannot exercise.

- Keep `test/index.test.ts`: it exercises entry wiring, UI/no-UI notices, command registration and shutdown disposal, but its mocked core cannot prove npm resolution or real service registration.
- Keep `test/config.test.ts`: it already exercises the real shared settings loader with files, including precedence, malformed JSON and invalid values.
- Keep `test/workspace-provider.test.ts` and `test/worktree.test.ts`: they drive real Git and own opt-in, creation failure, clean/dirty disposal, hook retry/restaging and preservation on cleanup failure.
- Keep `test/preserved.test.ts`, `test/preserved-command.test.ts` and `test/rescue-branches.test.ts`: they own rescue detection, confirmed destructive removal and branch recovery; their APIs/imports do not change.
- No existing test becomes redundant with a packed smoke matrix, whose purpose is composition across installed artifacts rather than exhaustive recovery behavior.
- Planning dry-ran `pi install --help`, `pi remove --help` and `node scripts/release/prepare-first-fork-release.mjs --help`: they returned the documented package-source syntax, local/trust flags and six-input external-only generator interface.
  Publication commands were not executed; the future compatibility command cannot be run until implemented.
- New offline tests validate the maintained probe's assertions using positive and invalid result shapes; network installation and real Git/load effects run only in the explicit compatibility command.
- Repair the real-registry candidate fixture when adding the third registration, not later.
  Before applying bootstrap evidence, replace the permanent-empty-scaffold assertion with state-aware validation; retain synthetic first-release fixture tests for complete pending projection/tagged preflight.

## Invariants at risk

| Constituency/invariant                                                           | Existing pin or required added pin                                                                                                                                                                             |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing users' opt-in and configuration semantics                               | `config.test.ts` precedence/invalid-file cases and `workspace-provider.test.ts` non-opted preparation; new packed matrix uses actual layered files                                                             |
| Children requiring isolation fail rather than run unisolated on creation failure | `workspace-provider.test.ts`: `throws for an opted-in agent when the base dir is not a git repo`                                                                                                               |
| Users' changed files remain recoverable after disposal or cleanup failure        | `workspace-provider.test.ts` dirty/failure addenda and `worktree.test.ts` preservation, rejected-hook/restaging cases                                                                                          |
| Active/current/foreign worktrees are not mistaken for preserved work             | `preserved.test.ts` exclusion cases; files remain unchanged                                                                                                                                                    |
| Destructive recovery remains human-confirmed                                     | `preserved-command.test.ts` dismissed/declined and confirmed-removal cases                                                                                                                                     |
| Headless children do not scan or emit recovery notices                           | `index.test.ts` no-UI notice cases, retained with the new mock namespace                                                                                                                                       |
| Parent registration is revoked at shutdown                                       | Existing entry test plus new real-service re-registration assertion; deleting shutdown registration must fail the latter                                                                                       |
| Core and selector release evidence remain independent                            | Existing first-release/correspondence fixtures plus byte comparison of unselected real artifacts before/after worktrees application                                                                            |
| Migration does not alter already published upstream history                      | Candidate historical-suffix comparison and unchanged `LICENSE`, inherited plans/retros; no upstream tag/ref mutation                                                                                           |
| Development startup cannot fetch an unpublished fork                             | Migration/publication checkpoint review pins absence before publication; persistent settings tests pin local core-first order and fully disabled resource arrays if the npm suppression entry is later present |

The cited worktrees tests were opened during planning; only the entry suite mocks the core under migration.
The affected source-projection checks passed, but final packed and lockfile behavior must be measured again after implementation.
No token/cache/latency invariant is altered or inferred from this identity-only change.

## TDD Order

1. **Migrate the real package and register its actual fork identity atomically.**
   Red: add `test/worktrees/package-contract.test.mjs` checks for fork metadata, required `>=1.0.0` peer, published `^5.0.0` dev core, runtime/type/settings import namespaces, no upstream-core dependency, packed runtime/docs/license file set and matching fork registration.
   Add persistent development-settings assertions for local core-first order and fully disabled resource arrays if a fork npm suppression entry is present.
   Separately verify at this migration checkpoint that the unpublished fork npm source is absent; do not make a permanent test reject the correctly disabled entry after approved publication.
   Green: change manifest, the three source imports/comments and entry mock together; append worktrees registration and run `pnpm install --registry=https://registry.npmjs.org/`.
   Repair the root candidate-selection fixture in this commit to expect only the two modified entries and exclude the third untouched registration.
   Killing mutations: rename the packed manifest back to the upstream identity (identity class); restore either runtime accessor or `/settings` import to upstream (resolution/import class); restore upstream core dependency or use `workspace:` (dependency class); remove/change the worktrees registry entry (registration class); move local worktrees before core or add an enabled fork npm source (startup/configuration classes).
   Verify: root focused contract/workflow tests, full worktrees suite and `check`/`lint`, then root `check` and `fallow dead-code`; review lockfile sources rather than accepting a broad upgrade.
   Commit: `fix(pi-subagents-worktrees): load with the fork subagents core (#37)`.

2. **Add maintained packed registration and provider acceptance checks.**
   Red: add offline `test/worktrees/packed-compatibility.test.mjs` cases requiring discriminating manifest/load/provider/shutdown assertions, absent-module versus inactive-service classification and cleanup after a failing probe.
   Green: implement the bounded package verification command and its pure result checks; run historical-floor, published-current and actual packed-candidate rows plus the negative rows from Design Overview.
   Cover the mutable captured provider's lifecycle together: set only during forwarded real registration, read for preparation/disposal and unregister with the actual returned disposer before confirming re-registration.
   Add the dedicated CI invocation only after the command passes; keep network installation out of the root/package Vitest suites.
   Killing mutations: delete `service.registerWorkspaceProvider(...)` in the packed extension (registered-provider class); make `prepare` always return `undefined` (opted-in class), or delete its opt-in guard (non-opted class); replace dirty disposal's addendum with `undefined` (rescue class); delete the shutdown handler registration (unregister class); make missing-module validation accept every loader error (negative-result class); omit reclamation of tracked external worktree paths (failure-cleanup class).
   Run mutations against separate disposable packed copies, verify the edits applied, then restore/repack the real green package; do not mutate checkout files without saved green copies.
   Verify: focused offline tests, `pnpm -C packages/pi-subagents-worktrees run verify:core-compatibility`, full package tests/check/lint, root check and dead-code.
   Commit: `test(pi-subagents-worktrees): verify packed fork-core workspace compatibility (#37)`.

3. **Document the fork installation and guarded publication workflow.**
   Red/verification surface: the package contract and packed negative rows already distinguish missing module, missing initialization and correct order.
   Green: update package/root READMEs, package skill and the core skill's worktrees example, plus only the now-false introductory migration-status sentence in the release policy.
   Describe the open peer range as policy, preserve upstream provenance and current behavior/recovery sections, and document explicit install/remove plus publication/Trusted Publisher handoff.
   Do not add the unpublished fork npm settings object.
   Verify actual CLI flags against `pi install --help`/`pi remove --help` without executing installation/removal, run `rumdl check` on changed markdown and root agent-doc/workflow contract suites, inspect rendered links/badges and rescan current namespace/floor wording while retaining historical/provenance matches.
   No new behavior tests or killing mutation are required for this documentation-only step.
   Commit: `docs(pi-subagents-worktrees): document fork installation and first publication (#37)`.

4. **Prepare the real-view test for first-release evidence application (accepted Tidy First recommendation).**
   This test-only commit removes the permanent-empty-state assumption that would otherwise make the reviewed artifact commit fail.
   Red: in `test/upstream-sync/workflow-contract.test.mjs`, characterize empty and first-row projected state/view contracts and deliberately mismatched view/state; keep exact managed-marker and external-prose checks.
   Green: make the real scaffold assertion state-aware using authoritative worktrees state, validating rows/identity/fixed upstream links when populated rather than requiring a nonexistent tag or unconditionally calling the CLI.
   If the renderer is used, supply the verified pending first decision explicitly; never silently treat every missing historical tag as pending.
   Killing mutations: hard-code the empty placeholder for populated state (projected class); ignore an altered upstream source/row version in the view (mismatch class); omit standalone-marker validation (region class).
   Verify: focused workflow contracts, existing first-release/correspondence fixture suites and root lint.
   Commit: `test(repo): make worktrees bootstrap view checks state-aware (#37)`.

5. **Review and apply generated first-release artifacts without publishing.**
   Require clean committed primary `main`; revalidate the incorporated worktrees evidence and generate the external candidate with the already selected version.
   Show the operator the actual candidate and seek artifact-application approval separately from publication; stop if it is refused or the candidate/source is stale.
   After the immediate freshness/byte checks, apply only the four actual `applicationFiles`, preserving inherited CHANGELOG bytes and all unselected artifacts.
   Verify the generated pending view/evidence and historical suffix with the existing generator/fixture boundaries, rerun packed compatibility and applicable package/root gates, and inspect the exact four-file diff.
   This step uses existing tested mechanisms and adds no new runtime tests or mutation; it must not invoke tag creation, publication, GitHub Release creation or ordinary dispatch.
   Commit together: `docs(release): prepare reviewed worktrees first-release artifacts (#37)`.
   Record the actual artifact commit, candidate path, review disposition, checks and unperformed publication actions in the implementation retro.

After the last implementation step run root `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code`, plus applicable public-consumer checks and the worktrees packed command.
Dispatch the ordinary fresh-context `pre-completion-reviewer` with this plan, the implementation range and actual candidate/evidence paths.
Only then hand off to `/ship 37`, explicitly identifying the untagged manual bootstrap exception and pending separate publication approval.
No third-party design mechanism was adopted in this planning session, so no additional `Co-authored-by:` trailer is prescribed.

## Risks and Mitigations

- **Workspace-installed upstream core hides the bug.**
  Packed consumers disable peer auto-install, assert the upstream package cannot resolve from the worktrees entry and reject monorepo resolution paths.
  A missing-fork-core row runs without that module, not merely with an unpublished service.
- **Startup appears successful despite an inactive provider.**
  Inspect SDK loader errors and registrations and execute the captured real provider; do not accept exit status or accessor existence alone.
  The planning reproduction established this distinction before design.
- **New declared floor is only a guessed version.**
  The earliest published fork tarball contains every consumed runtime/type/settings export, and its installed source-projection row passed.
  Recheck the actual packed worktrees source against that release during implementation.
- **Temporary Git work survives a failing acceptance test.**
  Track worktrees outside consumer roots and verify cleanup-failure paths in the verifier's tests.
  Never run destructive fixture cleanup against the operator's repository or reproduction installation.
- **First artifacts advance another package or rewrite upstream history.**
  Use the selected generator, exact application set, inherited-byte comparison and unselected-artifact byte snapshots.
- **Applied bootstrap evidence makes tests demand an uncreated tag.**
  The accepted preparatory test commit distinguishes pending first evidence from published tagged evidence; the full production generator already validates the pending projection.
- **Ordinary ship automation publishes or re-prepares an untagged package.**
  Put the bootstrap exception in the release recommendation, implementation retro and README handoff; require separate identity/destination and exact-artifact approvals.
- **Open upper bound admits an incompatible future core major.**
  This is the operator's explicit policy choice; retain a maintained floor/current/candidate compatibility command and the dependency-change verification trigger rather than claiming future compatibility.

## Open Questions

- None remain for package identity, runtime design, peer-range policy or selected first version.
- Exact first-artifact application approval, tagging/public npm destination approval and dashboard Trusted Publisher configuration remain deliberate later gates for the actual reviewed artifact set.
- If `main`, the incorporated merge or selected artifacts change before the relevant gate, regenerate a fresh candidate or stop for review; do not invent a new baseline or repair release evidence automatically.

[#36]: https://github.com/Jopqior/gotgenes-pi-packages/issues/36
[first fork release policy]: https://github.com/Jopqior/gotgenes-pi-packages/blob/main/docs/upstream/fork-release-policy.md#first-fork-release-handoff
[npm trusted publishing documentation]: https://docs.npmjs.com/trusted-publishers/
