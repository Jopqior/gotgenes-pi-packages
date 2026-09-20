---
issue: 15
issue_title: "Let model-selector release independently of core, following upstream worktrees"
---

# Independent selector compatibility and releases

## Release Recommendation

**Release:** ship independently

The selector has no architecture roadmap or release batch.
This dependency-contract change requires a new selector release, not a core release.
Publishing remains a separate operator-approved `/ship` action to the fork's approved destination; this plan authorizes no release dispatch.

## Problem Statement

The selector's `workspace:^` runtime dependency becomes a caret range based on the local core version at pack time.
Following [#14], selector metadata needed another release merely to admit core `2.0.0`, although its selection implementation did not change.
The compatibility declaration should describe the core API the selector needs, independently of the core version used for development.

## Goals

- Declare required peer dependency `@jopqior/pi-subagents: >=1.0.0` and registry development dependency `@jopqior/pi-subagents: ^1.0.0`.
- Remove the ordinary core dependency and the selector check script's dependency on building the workspace core.
- Preserve the compatibility floor when packing against a different local core version.
- Verify packed installation, public types, and real extension initialization against supported published cores, with explicit negative loading cases.
- Preserve model-selection UX and existing capability/lifecycle guards.
- Treat this as **breaking**: under Pi's peer-disabled installer, installing only the selector will no longer also download the core.
  Users must explicitly install core and load it before the selector, as the README already instructs.
- Document that selector changes or necessary compatibility-declaration changes require a selector release; a core release alone does not.

## Non-Goals

- Core implementation, public API, service-key, or lifecycle changes.
- UI redesign, optional core operation, dynamic-import fallbacks, or silently disabling selection when core is unavailable.
- Guaranteeing compatibility with every future core release or enforcing semantic versions at runtime.
- Retaining workspace-linked development dependencies, changing Pi peer floors, or migrating other companion packages.
- Rewriting published versions, tags, historical plans, retros, or generated changelogs.
- Release automation redesign or publishing in the implementation session.

## Background

The issue author and authenticated operator are both `Jopqior`.
Related fork issues [#4] and [#14] are closed with implementation summaries; neither is an unfinished prerequisite.
Open fork issue searches for `model-selector`, `SpawnSelectionProvider`, and `release` found no competing work beyond this issue; the fork had no open PRs.
The newest inherited backlog file, `docs/triage/2026-09-18-backlog.md`, has no entry for fork issue 15 or model-selector.
No prior fork or inherited issue-15 plan/retro was found, and no selector-specific package skill or architecture roadmap exists.

The original `workspace:^` policy was introduced by the first-publication change in [#4].
Its plan and retro intentionally retained a local workspace link and a caret published range; the operator now explicitly supersedes that policy with the upstream peer/development pattern.
The reference is the published `@gotgenes/pi-subagents-worktrees@0.3.3`: peer `>=16.4.0`, development `^16.4.0`, and synchronous service lookup/provider registration at initialization.
Its missing-service no-op is not adopted: selection must continue to fail explicitly.

`pnpm-workspace.yaml` sets `linkWorkspacePackages: false`, so a normal registry development range resolves published bundled declarations rather than the local core's gitignored `dist/`.
The selector currently has an explicit sibling build in `scripts.check`; after this change that workaround is unnecessary.
AGENTS.md requires pnpm, committed lockfile changes, explicit npmjs.org registry options, fork-only operations, and separately approved publication.

## Design Overview

### Dependency contract

The operator selected the following shape:

```json
{
  "peerDependencies": {
    "@jopqior/pi-subagents": ">=1.0.0"
  },
  "devDependencies": {
    "@jopqior/pi-subagents": "^1.0.0"
  }
}
```

Keep all existing unrelated peers and development tools.
Remove the core entry from `dependencies`, removing the section if empty; do not mark the peer optional.
Set `scripts.check` to `tsc --noEmit`.
Regenerate `pnpm-lock.yaml` with `pnpm install`; the selector importer must resolve a registry core, not `link:../pi-subagents`.
Do not bump the development range just because local core changes major.
The compatibility script separately exercises current published core releases.

The open upper bound is an explicit maintenance policy, not a proof about future releases.
A future change to the required API, supported range, or selector itself can require another selector release.
An unrelated core release does not.

### Verified API floor

Registry enumeration returned `1.0.0`, `1.0.1`, `1.0.2`, and `2.0.0`.
The earliest published fork release, `1.0.0`, contains every required export and behavior below; there is no earlier published fork version to exclude.
The spawn-selection declaration block in the published service source is identical across those releases.

| Consumer                   | Required core surface                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`             | `getSubagentsService()`, `registerSpawnSelectionProvider(provider)`, registration `kind` and `dispose()`        |
| `src/model-selector.ts`    | `SpawnSelectionProvider.select(request, signal)`, request `availableModels`, result `model` and `thinkingLevel` |
| `src/selection-labels.ts`  | Request `agentId`, `agentType`, and `description`                                                               |
| `src/selection-form.ts`    | `SpawnSelection["thinkingLevel"]`                                                                               |
| Existing composition tests | `publishSubagentsService`, `unpublishSubagentsService`, `SubagentsService`, and `SpawnSelectionRegistration`    |

All published cores export `.` through `dist/public.d.ts` for types and `src/service/service.ts` at runtime.
All use `Symbol.for("@gotgenes/pi-subagents:service")`, intentionally unchanged in this fork.
The selector needs the service instance published by the loaded core, not object identity between imported module copies.
No new collaborator, shared interface, or source extraction is needed.

### Installation and failure semantics

Pinned Pi `0.84.4`, `dist/core/package-manager.js`, implements `getNpmInstallArgs` with peer resolution disabled: pnpm gets `auto-install-peers=false` and `strict-peer-dependencies=false`; the default npm path gets `--legacy-peer-deps`.
Its `resolvePackageSources` iterates configured package sources and collects their resources.
A peer declaration therefore does not install or load core on the user's behalf, and an installed transitive package is not a substitute for explicitly loading its extension.

Preserve the two explicit npm sources in README installation order: core, then selector.
Distinguish three errors:

1. Core package absent: the selector's static import fails during module loading; Pi reports the missing `@jopqior/pi-subagents` module and does not activate the selector.
2. Core package installed but service absent or loaded too late: the existing initialization error identifies the required package, registration method, and load order.
3. Service present without `registerSpawnSelectionProvider`: the existing capability guard gives the same configuration error and registers no hooks.

Do not promise strict install-time rejection from Pi, which disables peer validation.
Ordinary strict package-manager consumers can validate the peer range, but runtime capability checking remains necessary.
No published fork release predates the required capability; an incompatible service test is necessarily synthetic and must be labeled as such.
Do not invent an unpublished registry version or claim that a capability probe proves compatibility with all future majors.

### Planning evidence and its limits

Evidence was gathered against clean `main` at `c048edf53ae0468c48f7ac179a919c9c800d550f`, using pnpm `11.25.0` and npmjs.org tarballs.
Scratch files lived outside the repository under `/tmp/issue15-evidence`; implementation must recreate its own disposable fixtures rather than depend on that directory.

| Check                                                                                             | Measured result                                                                         |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pack unmodified selector                                                                          | Core appears in `dependencies` as `^2.0.0`, with no core peer                           |
| Pack copied real selector with proposed dependency shape                                          | Core peer remains `>=1.0.0`; development range is `^1.0.0`; no ordinary core dependency |
| Repack after changing only copied sibling core version from `2.0.0` to synthetic `99.0.0`         | Same public peer range and no ordinary dependency                                       |
| Install proposed selector tarball with each published core and explicit Pi host packages `0.84.4` | Installation succeeded for `1.0.0`, `1.0.1`, `1.0.2`, and `2.0.0`                       |
| Public `discoverAndLoadExtensions` on each real installed core followed by selector               | No loader errors; both extension factories initialized                                  |
| Type-check packed selector entry and transitive source against core `1.0.0`                       | Passed with strict ES2024/Bundler settings and skipped dependency declaration checks    |
| Load selector with core installed but not initialized                                             | Existing required-core configuration error; selector not loaded                         |
| Load with an empty object in the real service registry                                            | Same capability error; this is a synthetic incompatible-service fixture                 |
| Remove core with peer auto-install disabled, then load selector                                   | Missing-module error naming core; selector not loaded                                   |

These are deterministic single executions per condition, not latency or stochastic measurements.
Each loader execution used a fresh Node process and empty cwd/agent directories, so repository/global extensions and their published services could not mask missing-core failures.
The source of the fixture was the actual selector package and actual published core tarballs; only dependency metadata and the deliberately synthetic sibling version/service were changed.
The baseline pack is the control for dependency rewriting; successful real-core initialization is the control for negative loader cases.
These checks do not constitute a full interactive spawn run or exhaustive compatibility certification.

## Module-Level Changes

- `packages/pi-subagents-model-selector/package.json`: peer/development split, remove runtime core dependency and sibling build, add `verify:core-compatibility` script.
- `pnpm-lock.yaml`: regenerate the selector importer and registry core resolution; inspect unrelated churn.
- `packages/pi-subagents-model-selector/test/package-manifest.test.ts` (new): deterministic manifest contract tests, separate from network/package-loading verification.
- `packages/pi-subagents-model-selector/scripts/verify-core-compatibility.mjs` (new): reproducible temporary packing, published-version installation, type-consumption, and Pi loader matrix.
  Use Node assertions and child processes; no runtime dependency or new framework.
- `packages/pi-subagents-model-selector/README.md`: replace “Upgrading across a core major” with compatibility, explicit installation, release policy, migration, and maintainer verification guidance.
- `docs/upstream-sync.md`: qualify the coordinated selector/core release paragraph as the historical requirement for [#14], and point current maintainers to the new selector policy.
  Preserve the recorded authorization and historical outcome rather than rewriting them.

The work remains single-package even though its lockfile and historical sync documentation are repository-level files.
No other package code changes.

Predicted unchanged:

- Selector `src/**`: static accessor import, guard, initialization timing, and UI behavior already meet this design.
- Existing selector tests and fixtures: keep their behavior and assertions; they resolve the same public API from the registry after the dependency change.
- Core `src/**`, package manifest, declarations, and documentation: no API change required.
- Selector `files`, package version, Pi peer floors, and `CHANGELOG.md`: no allowlist/version editing or hand-written changelog.
- `.pi/settings.json`: explicit local package load order is independent of development dependency resolution.
- Release scripts and workflows: release-by-named-package already exists; no new coupling mechanism is needed.

There is no selector architecture diagram, module listing, or roadmap step to update.
The package-skill search found no current selector coordination rule; inherited plans and retros remain historical artifacts.

## Test Impact Analysis

This is packaging-contract work, not an extraction.
Existing composition tests remain necessary because they pin registration timing, owned/inherited behavior, UI attachment, and disposal; they publish fake services and do not prove real-core compatibility.
No existing tests become redundant.
The new manifest tests guard cheap metadata invariants, while the explicit integration script verifies what the actual tarball and package manager do.

The integration script must:

- Pack the real package, inspect its manifest, and assert the required literal core peer, registry development range, and absence of ordinary/optional/bundled core dependency.
- Build an isolated workspace copy from the real relevant manifests and selector publishable files; preserve enough workspace/catalog configuration to pack faithfully.
  Repack before and after changing only the copied sibling core version, asserting the same public peer range.
  Never edit the checkout or run a release-preparation command for this test.
- Install the packed selector with explicit exact published cores `1.0.0`, `1.0.1`, `1.0.2`, and `2.0.0`, and explicit host packages pinned to the selector's development Pi version.
  Disable peer auto-install and scripts in the disposable consumer, use npmjs.org explicitly, and verify the resolved core version rather than trusting the request.
- Type-check the packed selector source against each core, using the workspace TypeScript binary without workspace source aliases leaking into consumer resolution.
- Use the SDK's public `discoverAndLoadExtensions` with explicit absolute core/selector entry paths and empty cwd/agent directories in a fresh process per case.
  Assert empty `errors` and both loaded extensions on the positive path; check selector lifecycle handlers are registered.
- Exercise missing package, missing service, reversed order, and synthetic incompatible service independently.
  Assert the selector is absent from loaded extensions and inspect the relevant error, not merely a process exit code: Pi collects extension errors instead of throwing them to the caller.
- Clean all temporary artifacts in `finally`; isolate any registry-age override to the disposable verification command, never weaken repository installation policy.
  Keep network verification out of the default Vitest unit suite.

Verified planning command surfaces include `pnpm pack --pack-destination`, `pnpm --ignore-workspace --ignore-scripts add`, and the public loader signature in pinned SDK `0.84.4`.
For removal, pnpm rejects `remove --ignore-scripts`; use `--config.ignore-scripts=true` or a fresh missing-core consumer instead.
Prefer fresh consumers in the permanent harness to avoid stale modules and peer context.

## Invariants at risk

| Invariant and constituency                                          | Existing pin or required verification                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operators get a chooser registered before `session_start` can spawn | Existing composition test “registers the provider during factory initialization, before session_start”; real-core loader matrix additionally exercises package resolution |
| Descendants cannot replace or dispose the root's chooser            | Existing composition tests under “inherited child registration”; leave source and tests unchanged                                                                         |
| Missing or incapable services never silently bypass selection       | Existing “missing core capability” tests plus fresh-process negative loader cases                                                                                         |
| RPC sessions cannot masquerade as interactive selection             | Existing test “fails closed for RPC even when hasUI is true”                                                                                                              |
| Shutdown closes selection and disposes the owned registration       | Existing “closes the chooser and disposes the owned registration on session_shutdown” test                                                                                |
| Maintainers can pack without advancing user compatibility floor     | New packed-manifest assertions and copied-workspace version-change test                                                                                                   |
| Registry consumers receive usable type exports                      | Published-floor source type-check and installation matrix, not a workspace-only test                                                                                      |

The named composition tests were opened during planning.
They invoke the real selector factory but use a fake service; their claims are restricted to that layer.
No prior selector architecture phase supplies additional roadmap invariants.

## TDD Order

Tidy-First found no recommended or optional preparatory refactoring.
Execute this plan with `/tdd-plan`; packaging assertions have a genuine red against the current dependency contract.

1. **Decouple the dependency contract.**
   Add `test/package-manifest.test.ts` assertions for required peer `>=1.0.0`, development `^1.0.0`, no ordinary/optional core dependency, non-optional peer, and standalone `tsc --noEmit` check.
   Observe the failures against current metadata, then change the manifest and regenerate the lockfile in the same cycle.
   Verify package check, full existing selector suite, and registry rather than workspace resolution.
   Include the installation migration and core compatibility/release policy in the package README in this breaking commit.
   Killing mutations: move the core back to `dependencies` to kill dependency-kind/absence tests; set peer to `workspace:^` to kill the fixed-range test; set development range to `workspace:^` to kill registry-development tests; restore the sibling build prefix to kill the independent-check assertion; mark the core peer optional to kill the required-peer assertion.
   Commit: `feat(pi-subagents-model-selector)!: decouple core compatibility from core releases`.
   Footer: `BREAKING CHANGE: The selector now requires an explicitly installed and loaded @jopqior/pi-subagents peer. Install core separately and load it before the selector; Pi does not auto-install peers.`

2. **Make packed compatibility verification reproducible.**
   Add `scripts/verify-core-compatibility.mjs` and its package script, implementing the matrix and isolated pack test described above.
   This characterizes the now-green metadata change and existing runtime behavior; demonstrate its discriminating power with mutations before committing.
   Verify all published-version positive rows, type checks, and each negative row, then run package check/lint/tests.
   Killing mutations by class: restore ordinary `workspace:^` metadata in the isolated test copy to fail the packed peer assertion; remove the copied-workspace peer declaration to fail both pack conditions; remove `registerSpawnSelectionProvider` from a temporary installed core service adapter to fail the positive loader row; remove the selector's capability guard in a temporary copied package to lose the expected configuration diagnostic; replace the missing-service throw with `return` to make the negative loader row unexpectedly load the selector.
   Also run the missing-package case once with core deliberately installed as a control: its assertion must reject the successful resolution.
   Restore every mutation before verification; do not mutate tracked or installed workspace source in place.
   Commit: `test(pi-subagents-model-selector): verify packed core compatibility`.

3. **Reconcile maintainer guidance and run final verification.**
   Qualify the historical coordination paragraph in `docs/upstream-sync.md`, document the permanent verification command in the selector README, and check both documents for contradictory ongoing “release both” instructions.
   Keep historical first-publication plans and retros unchanged.
   Verify markdown lint, repository check/lint/tests as required by the pre-completion gate, and rerun the compatibility command from a clean tree.
   Confirm no core source changes and no hand-written version/changelog changes entered the diff.
   Commit: `docs: clarify independent selector release policy`.
   This documentation step adds no new automated test; its verification is the command output and diff review.

The implementation session must record actual matrix results and dispatch the standard pre-completion reviewer before recommending `/ship`.
Do not publish, push tags, or close the issue during `/tdd-plan`.

## Risks and Mitigations

- **Peer installation differs from the previous dependency.**
  Use a breaking commit and explicit migration guidance; preserve the documented two-package load order.
- **A missing package never reaches the custom capability error.**
  Planning actually removed core and observed the loader's named missing-module failure; preserve this distinct documented outcome rather than inventing a runtime fallback.
- **An open range admits a future incompatible core.**
  State the compatibility policy honestly; capability guards catch missing methods, not arbitrary semantic changes.
  Review the matrix and declaration when required APIs change.
- **Registry development no longer follows workspace core automatically.**
  Keep default checks independent, and verify current published core separately with the integration command.
  Joint unpublished API work requires deliberate temporary integration testing, not an automatic public floor bump.
- **Mocks falsely certify real installation.**
  Keep the published-tarball loader matrix separate from existing fake-service composition tests and label synthetic negative services.
- **Fresh releases hit pnpm supply-chain age policy.**
  Planning encountered this in a disposable consumer; scope any explicit age override to that consumer and keep repository safeguards intact.
- **Tests accidentally inherit global services or extensions.**
  Use fresh processes, empty directories, explicit extension paths, and assertions on loader errors and loaded extensions.

## Open Questions

None blocking.
The operator selected required peer `>=1.0.0` and registry development `^1.0.0`.
No concrete separate follow-up was identified, so no speculative issue is filed.
Future compatibility expansion or contraction is a maintenance decision based on real changes, not an obligation to release on every core version.

[#4]: https://github.com/Jopqior/gotgenes-pi-packages/issues/4
[#14]: https://github.com/Jopqior/gotgenes-pi-packages/issues/14
