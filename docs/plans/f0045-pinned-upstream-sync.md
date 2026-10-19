---
issue: 45
issue_title: "Sync gotgenes/pi-packages@41405de895fb53f802df89f8978456cd1dae397e"
---

# Integrate the pinned upstream target without losing fork contracts

## Release Recommendation

**Release:** ship independently

This repository-scoped synchronization is not a package roadmap batch member.
Landing is independent of publication; release selection, npm identities and destination require separate operator approval.
Do not predict a fork version in this plan or dispatch a release as part of implementation.

## Problem Statement

The fork needs the exact upstream target named by the issue, including its run-owned outcome, background-resume admission, queued-result reporting and bounded permission-delegation changes.
A text merge alone cannot preserve the fork's initial-spawn selection gate, private presentation state, package identities and workspace-provider compatibility.
Complete the ordinary planning, implementation, independent review, shipping and retrospective stages separately, preserving a genuine upstream merge in Git.

## Goals

- Integrate the fixed target through a genuine two-parent merge on primary-checkout `main`.
- Adopt the operator-approved breaking background-resume behavior: background spawn and resume share `maxConcurrent`; another resume while queued is refused with `resume-queued`; `subagents:resuming` fires on admission rather than queue entry.
- Adopt the operator-approved breaking permission change: an authorizer-chain link may allow a bash external-directory ask carrying the gate-computed nothing-on-disk license, with its restrictions and audit record intact.
- Preserve fork spawn-selection behavior, service exports, snapshot privacy, worktrees behavior, identities and immutable release artifacts.
- Inventory every incoming and actual integration path, deeply reviewing fork intersections, conflict resolutions and sync-authored contributions.
- Complete required validation, separate core/worktrees source-feasibility checks and a committed independent-review handoff.

## Non-Goals

- Do not advance to a later upstream tip, rebase, squash, use a feature worktree or replace the merge with a fast-forward.
- Do not publish, dispatch releases, create tags, regenerate CHANGELOG sections or modify already published artifacts.
- Do not implement fork [#26], which proposes choosing Tool, Agent or Custom configuration before spawn.
- Do not redesign the selector, change its peer policy, add fields to the public snapshot or re-ask on resume.
- Do not redesign workspace creation, disposal, rescue or recovery; fork [#37] is already implemented and closed.
- Do not add a universal loading harness, compatibility matrix, source ledger, cache or synchronization recorder.
- Do not repair unrelated inherited defects merely because they are noticed, or turn omitted optional live/TUI checks into ship-time waivers.
- Do not add tests for adopted upstream behavior; use the synchronization test-scope exception only for an authored functional adaptation with a demonstrated existing-test gap and explicit operator approval.

## Background

The issue is open, authored by the authenticated operator, and labeled `scope:repo`.
There are no open fork PRs; the only other open fork issue is [#26].
The newest local triage at planning startup, `docs/triage/2026-10-02-backlog.md`, is inherited upstream context and has no fork-issue entry for this synchronization.
The incoming triage dated 2026-10-18 is likewise upstream context, not a fork backlog mandate.
No fork-prefixed issue-45 retro exists; the fallback `packages/pi-permission-system/docs/retro/0045-session-scoped-approvals.md` describes a different inherited upstream issue and must not receive these notes.

The governing instructions are `.pi/skills/fork-sync/SKILL.md` and its `synchronization.md`, `sync-assessment.md` and `release-source.md` references.
The checkout was verified as primary `main`, with identical absolute Git/common directories, a clean index/worktree, no unmerged entries and no merge/rebase state.
The verified remotes are `origin=git@github.com:Jopqior/gotgenes-pi-packages.git` and `upstream=git@github.com:gotgenes/pi-packages.git`; upstream pushing is disabled.
The explicit synchronization fetch preserved the local tag mapping.

Core `InitialSpawnSelection` owns the initial acknowledgement and operator choice; `Subagent` owns session/workspace orchestration.
Upstream moves per-run results, claims, questions, budgets and updates into `SubagentRun`, leaving session-lifetime accounting in `SubagentState`.
These are distinct state owners; selection must not become another result/outcome field.
The selector registers a provider through the fork core service; worktrees registers a `WorkspaceProvider` through that same core.
Their current package suites use service doubles and are not proof of real installed cross-extension loading.
The selector package skill listed in some context is absent from disk; use its actual README, manifest, source and tests rather than inventing skill contents.

## Design Overview

### Fixed inputs and evidence provenance

Upstream target: gotgenes/pi-packages@41405de895fb53f802df89f8978456cd1dae397e

Planning fork HEAD is `6f7ceb0c22ab7eca3398a0bdcbeab291bee42e91`.
The measured common base is `23c08264aa180222e8953a835337ada28534f1b7`.
These are inspection inputs, not the eventual merge's first parent: planning and subsequent fork commits will advance it.

The inventory and conflict forecast came from the real Git objects using `git diff` and `git merge-tree --write-tree HEAD <target>`, not a synthetic source fixture or an applied integration.
The preview exited with conflicts and left the live index/worktree unchanged; it does not prove integrated runtime behavior.
Existing tests were run against the planning fork, not the preview tree.
No live model, permission judge or human TUI reproduction was performed or is required absent a concrete automated-evidence gap.

### Approved compatibility decisions

The operator selected both upstream behaviors at the planning gate.
Background resumes now wait alongside background spawns and can be aborted before admission; foreground resumes still bypass the limiter and never reopen the chooser.
The service result remains the same `resumed`/`refused` discriminated union, but the refusal vocabulary and documented event timing change.
The relevant incoming breaking commit is `fix(pi-subagents)!: refuse a second resume while one waits for a concurrency slot`; preserve its existing `BREAKING CHANGE:` footer and history.

The permission change applies only when a configured chain link returns `allow` and the ask carries the upstream gate's bounded nothing-on-disk license.
Keep the whole-parse, standalone verbatim absolute-word, known-working-directory, non-root, no-shell-expansion, absent-entry-chain and not-proven-write restrictions.
Keep the forwarding serializer/parser and server reconstruction of the license together; an allowlisted parser must not silently drop it.
Retain the `authorizer_allow_licensed` audit and authorizer-link name.
Existing paths, file-tool asks, `path`-family asks and undetermined surfaces remain capped.
There is no changed allow outcome when no chain is configured or when its only link is the existing deny/defer-only model judge.
The incoming `feat(pi-permission-system)!: let a chain link allow a bash external_directory ask whose paths name nothing on disk` already carries the breaking footer and migration guidance.
Do not edit operator permission configuration to activate a chain.

This is adoption, not a published-scope expansion authored by the fork: the target includes the permission ADR amendment and migration, and the core remains an in-process subagent core without Git knowledge.
A materially new compatibility choice returns to the operator before affected edits.
Preserve incoming authorship through the merge; no third-party issue/PR mechanism is being separately reimplemented or credited through an invented co-author identity.

### Core resolution model

- `SubagentManager.create()` keeps the fork's `selection: new InitialSpawnSelection(...)` but drops its old initial outcome-seeding `SubagentState` construction.
  The target's `Subagent` constructor creates the initial `SubagentRun`; do not inject a run from the manager.
- `SubagentInit` retains optional `state?: SubagentState`, adds upstream `outcome?: RunOutcomeInit`, and retains the fork `selection` collaborator.
  Merge passive fixture seeds by owner rather than widening state to retain removed fields.
- Adopt upstream `currentRun`, `RunOutcome`, scheduler admission and per-run claims/consumption.
  Remove obsolete `releaseClaims()` and any stale calls to removed state methods, including those outside conflict markers.
- Update the fork initial-selection cancellation funnel in the same merge: write stopped/question/notice changes through the active run, and call `disposeWorkspaceQuietly(run, status)`.
  Preserve cancellation after asynchronous workspace preparation and before session creation.
- Keep the constructor's original-observer-first wrapper and settle selection only for the initial run.
  There is no `notifyTerminal` method to move or extract; do not add `finally`, which would change observer-throw behavior.
- Keep `selection.begin()` returning synchronously without a provider; preserve the same-turn factory call when neither selection nor a workspace provider requires waiting.
  An initially acknowledged queued spawn must still consult the live provider when admission eventually occurs.
- A selected milestone precedes downstream workspace/session work, and `permit.assertLive()` remains after asynchronous workspace preparation.
  Background new-spawn acknowledgement waits for required selection; resume never enters that wait.

The existing interaction remains conceptually:

```typescript
const attempt = selection.begin(run.signal);
const permit = attempt === undefined ? undefined : await attempt;
const cwd = workspaceBracket.hasProvider() ? await workspaceBracket.prepare(context) : undefined;
permit?.assertLive();
return execution.createSubagentSession({ ...params, cwd, model: permit?.pair.model ?? execution.model, thinkingLevel: permit?.pair.thinkingLevel ?? execution.thinkingLevel });
```

This illustrates the existing synchronous branch when neither provider requires waiting, not a new helper or dependency API.
No new import edge, module extraction or expanded service dependency bag is planned.
Keep mutations on the owning run's methods, not output arguments or public snapshots.
The design-review checklist found no need for a new intermediate abstraction, reset protocol or parameter relay; do not mix unrelated upstream structural improvements into synchronization.

### Reports and automatic merges

Merge queued concurrency-slot guidance, running-awaiting-selection guidance and ordinary running/stall guidance as distinct existing presentation cases.
Keep fork model suppression while selection is pending in report, tool and TUI paths; queued text must not falsely say a child has started or merely has no output.
Adopt upstream run-owned waiting/collection so a late completion cannot overwrite the resume that replaced it.
Review automatically merged `service.ts`, `agent-tool.ts`, manager tests and report tests as carefully as marked conflicts.
The `ResumeResult` union and adapter's by-value conversion do not require redesign.

### Inventory generation and review depth

Regenerate the incoming inventory and fork-intersection candidate list from these durable inputs; temporary files are disposable:

```bash
TARGET=41405de895fb53f802df89f8978456cd1dae397e
FORK=$(git rev-parse HEAD)
COMMON=$(git merge-base "$FORK" "$TARGET")
git diff --name-status "$COMMON" "$TARGET" > /tmp/f0045-incoming-paths.txt
git diff --name-only "$COMMON" "$FORK" > /tmp/f0045-fork-paths.txt
LC_ALL=C comm -12 \
  <(git diff --name-only "$COMMON" "$TARGET" | LC_ALL=C sort) \
  <(LC_ALL=C sort /tmp/f0045-fork-paths.txt) > /tmp/f0045-intersections.txt
```

These commands were dry-run on the planning refs; the incoming listing contained 72 paths (measured by `wc -l`).
Path intersection is a lead, not complete review coverage: selection, loading, public types and workspace contracts also select unchanged entry points.
Account for every path in both full inventories under the following depth decisions; expand when evidence reveals an unexpected dependency or contract change.

| Inventory group                                                   | Planned depth and reason                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/src/**` and `test/**`                      | Deep review fork selection/run ownership intersections, automatic merges, conflicts and adapted fixtures; reuse incoming scenarios for adopted behavior.              |
| Core manifest, README, architecture and package skill             | Deep review fork identity, public contracts, selection documentation, retained module tree and adopted roadmap outcomes.                                              |
| Core CHANGELOG                                                    | Resolve in favor of immutable fork bytes; upstream release history remains in Git, not spliced into the fork changelog.                                               |
| `packages/pi-permission-system/**` and its package skill          | Adopt the target behavior, schema, migration and existing tests; check contract summary and required gates without commissioning a fresh line-by-line upstream audit. |
| `.pi/agents/pre-completion-reviewer.md`                           | Resolve explicitly: retain fork synchronization range/scope/report rules and generic checks while accepting upstream Conventional Commit type guidance.               |
| `.pi/skills/{edit-tool,markdown-conventions,tidy-first}/SKILL.md` | Inspect incoming deltas and preserve fork-specific instructions; automatic markdown-conventions merging is still an intersection.                                     |
| Root incoming triage and new upstream plan/retro/history records  | Inventory and retain as historical upstream context; no fresh upstream backlog or artifact audit.                                                                     |
| `packages/pi-permission-model-judge/docs/retro/1077-*`            | Historical upstream note only, not an instruction to change the fork judge pin.                                                                                       |
| Selector and worktrees preservation contracts                     | Deep boundary review even though these paths have no incoming diff; use the unchanged entry points and existing tests named below.                                    |
| Every resolution and post-merge contribution                      | Deep review actual diff and final source; classify every unexpected path rather than omitting it.                                                                     |

### Release-source feasibility

Core and worktrees are separately registered, tagged forks; selector is an original package.
The live resolver succeeded for each fork at planning HEAD, identifying the prior incorporated target; that is a baseline, not evidence that this unperformed integration is complete.
Read-only remote tag inspection and local ancestry/manifest checks found contained upstream stable core `25.0.1` at `cd353d754517f35a1c284930a3647fa521e0c3f1` and worktrees `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`.
Both stable commits are ancestors of the fixed target, and neither package has scoped release-relevant commits after its stable anchor through this target.
The core's remaining target-side change after its release is a retro; worktrees has no scoped tail.
Re-run the actual resolver separately for both forks at the completed reviewed HEAD; do not manually synthesize correspondence blocks or import tag refs.
No first-release bootstrap is needed while the existing fork tags remain valid; missing tags or contradictory ancestry are stop conditions, not permission to manufacture an anchor.

## Module-Level Changes

Paths below describe expected implementation changes or explicit unchanged predictions, not edits performed during planning.
The complete incoming inventory supplies individual upstream-only filenames without copying its full listing here.

| Files                                                                                                                              | Change or prediction                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/package.json`                                                                                               | Resolve manifest version conflict by preserving the current fork version, `@jopqior` identity, repository URLs, exports, peers and package files; do not substitute upstream `25.0.1`.                                      |
| `packages/pi-subagents/CHANGELOG.md`                                                                                               | Preserve exact pre-merge fork bytes, including tagged correspondence sections.                                                                                                                                              |
| `src/lifecycle/subagent-manager.ts`, `subagent.ts` under core                                                                      | Merge scheduler/run ownership with initial-selection construction, cancellation and observer semantics described above.                                                                                                     |
| Core `src/lifecycle/subagent-run.ts`, `subagent-state.ts`, `src/observation/outcome-delivery.ts`                                   | Adopt run-owned outcome and delivery; inspect their interaction with the fork selection funnel.                                                                                                                             |
| Core `src/service/service.ts`, `src/tools/agent-tool.ts`                                                                           | Retain fork selection contracts and pending wording alongside upstream queued-resume refusal, launch wording and event documentation.                                                                                       |
| Core `src/tools/get-result-report.ts`, `get-result-tool.ts`                                                                        | Combine run-specific collection and queued reporting with private selection guidance/model suppression.                                                                                                                     |
| Core `test/helpers/make-subagent.ts`                                                                                               | Split state/outcome seeds and keep real/passive selection helpers; preserve explicit `undefined` semantics for queued/running fixtures.                                                                                     |
| Core incoming lifecycle, observation and tool tests; new `test/helpers/gated-scheduler{,.test}.ts`                                 | Retain upstream tests and scenarios; resolve conflicts and adjust existing fork fixtures/call sites for removed methods and new ownership.                                                                                  |
| Core `test/service/service-adapter.test.ts` and other direct `SubagentState`/`Subagent` fixture constructors                       | Audit source and test callers together; update outcome fields removed from state in the same merge, without rewriting whole files or weakening assertions.                                                                  |
| Core README, `docs/architecture/architecture.md`, `.pi/skills/package-pi-subagents/SKILL.md`                                       | Combine upstream run/queue/report descriptions with fork identity, selector contracts and current module-layout prose; preserve incoming landed roadmap notes without claiming this fork issue is an upstream roadmap step. |
| `.pi/agents/pre-completion-reviewer.md`, other incoming `.pi/skills/**`                                                            | Resolve/review the instruction intersections listed above; preserve synchronization exceptions.                                                                                                                             |
| Permission incoming source/tests/schema/manifest and current documentation                                                         | Adopt target as a unit, including the wire parser and migration; no fork-authored permission behavior or local-config edits planned.                                                                                        |
| Incoming upstream historical records                                                                                               | Retain unchanged from the target, except any demonstrated merge necessity; do not rewrite historical issue provenance.                                                                                                      |
| Core `initial-spawn-selection.ts`, `selection-scope.ts`, selection catalogue, runtime scope lifecycle and TUI presentation modules | Predicted unchanged: their APIs and selection ownership do not change; inspect callers and run existing selection/presentation suites to test that prediction.                                                              |
| Core `service/service-adapter.ts`, public-types verification script                                                                | Predicted unchanged: result union, value conversion and exported consumer operations remain compatible; existing suite and packaged consumer check must still pass.                                                         |
| `packages/pi-subagents-model-selector/**`                                                                                          | Predicted unchanged: only provider registration/selection is consumed; no run-owner or resume internals are imported.                                                                                                       |
| `packages/pi-subagents-worktrees/**`, its package skill, development settings and fork release registry                            | Predicted unchanged: imports, identity, `subagents-worktrees.json`, `worktreeAgents`, core-first registration and rescue/recovery contracts remain intact.                                                                  |
| `pnpm-lock.yaml`, workspace/catalog and release scripts                                                                            | Predicted unchanged: incoming manifests change versions, not dependency requirements; do not perform opportunistic dependency updates.                                                                                      |
| `docs/retro/f0045-pinned-upstream-sync.md`                                                                                         | Append implementation OIDs, local-review/source evidence, validation and reviewer handoffs at actual checkpoints.                                                                                                           |

Before finalizing resolutions, search removed state methods/types across all core `src/` and `test/` plus its architecture docs and package skill.
Inspect direct fixture constructors, not only the central helper; callers constructing now-invalid state literals must move in the same merge.
If the final tree requires a different touched-file list or materially different contract, update ordinary handoffs and obtain any needed operator decision before those edits.

## Test Impact Analysis

This integration does not invent an extraction or a lower-level test API.
Upstream's run-owned extraction already brings its run/state/outcome-delivery tests, which remain the tests for that behavior; do not duplicate them or remove fork integration scenarios as redundant.
Keep existing selection, manager, service, report and consumer suites because they exercise different boundaries.
Necessary fixture/interface adjustments retain their original scenarios and assertions.
No additional tests or killing-mutation work is planned under the synchronization test-scope policy.
If a concrete fork-authored functional adaptation is not discriminated by existing tests, show the gap and seek approval before planning or adding that test and its killing mutation.

Planning baseline at the recorded fork HEAD passed `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code`.
Targeted core, selector and worktrees suites also passed, as did their package checks and core `verify:public-types`.
Logs were captured as `/tmp/f0045-{check,lint,test,fallow,core,selector,worktrees,public-types}-baseline.log`; temporary logs may disappear and are not implementation evidence.
The existing public-types command packs the actual fork core, checks bundled declarations and typechecks an external consumer; it does not run selector UI or worktree lifecycle end to end.
A successful mock service suite must not be described as installed-package loading acceptance.

## Invariants at risk

Existing tests were read around the named scenarios; none of the mocked consumer-entry tests is used to establish the real core's behavior.
All rows are verified in implementation steps 2 and 3.

| Constituency and invariant                                                                                                                                                    | Existing evidence to retain                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core-only users: startup with neither selection nor workspace provider calls the session factory in the same turn; late selection-provider registration is read at admission. | `test/lifecycle/initial-spawn-selection.test.ts` admission cases and `test/lifecycle/subagent.test.ts` same-turn factory case.                                |
| Operator/parent: required background selection delays acknowledgement, selection precedes workspace/session work, and selected milestone is independent of child completion.  | `test/tools/agent-tool.test.ts` background wait cases and real selection/lifecycle suites.                                                                    |
| Workspace owners: revocation during asynchronous prepare disposes the acquired workspace without creating a session.                                                          | `test/lifecycle/subagent.test.ts` post-prepare revocation and startup-cancellation cases; the tests use real core orchestration with a controllable provider. |
| Lifecycle subscribers: original terminal observer runs first; only initial runs settle selection; observer throws retain existing semantics.                                  | `test/lifecycle/subagent.test.ts` observer order, thrown observer and initial-only settlement cases.                                                          |
| Resuming clients: existing session/model pair is reused without chooser invocation.                                                                                           | `test/lifecycle/nested-selection.test.ts` real manager/service resume scenario.                                                                               |
| Public consumers: pending selection and progress internals stay private; snapshots are by value.                                                                              | `test/service/service-adapter.test.ts` snapshot/privacy and resume cases, plus `verify:public-types`.                                                         |
| Parent agent: queued reports explain admission/waiting, pending selection explains completing the chooser, and ordinary running retains stall advice.                         | Incoming and fork `test/tools/get-result-report.test.ts`, `get-result-tool.test.ts`, and `agent-tool.test.ts`.                                                |
| Run consumers: a waiter keeps the outcome of the run it waited on; old late results do not overwrite a new resume or its delivery claims.                                     | Incoming `test/lifecycle/subagent-run.test.ts`, `subagent.test.ts` and `test/observation/outcome-delivery.test.ts`.                                           |
| Selector operator: registration is core-first, inherited registrations install no duplicate UI, and missing TUI/capability fails explicitly.                                  | Selector `test/index.test.ts` and existing selection/form/queue suites; fake-service boundary is acknowledged.                                                |
| Worktrees users: fork core imports, registration/unregister, opt-in preparation, disposal, rescue and manual recovery are preserved.                                          | Worktrees existing package suite, including `test/index.test.ts`; inspect real core workspace orchestration separately, since entry tests mock the service.   |

The intentionally changed invariants are the background-resume queue/event contract and permission envelope exception explicitly approved above.
Do not preserve the old assertions by disabling scheduling, stripping the forwarding license or weakening audits.

## TDD Order

These are numbered synchronization adoption/verification checkpoints for `/tdd-plan`, not permission to manufacture new red tests for unchanged upstream behavior.
No preparatory tidying was recommended by the fresh-context assessor; direct merge resolution is narrower than extracting observers or adding a fixture compatibility layer.

### 1. Re-establish clean prerequisites and freeze the inspection inputs

Load the current fork-sync skill/references before startup Git operations, confirm primary `main`, clean state and no unfinished integration, then perform only ordinary fast-forward startup.
Re-read issue target/decisions and prior retro stages; fetch explicitly only if required, without importing upstream tags or changing the approved target.
Regenerate the complete incoming inventory and intersections using the commands above and compare against the planned groups.
Record the pre-merge fork OID and common base in the ordinary retro; they become the actual review inputs after the merge exists.
No behavior commit is expected for this read-only checkpoint.

### 2. Complete the approved merge, preserving both test populations

Run `./scripts/fork-sync/sync.sh --merge --expected-upstream 41405de895fb53f802df89f8978456cd1dae397e`.
A conflict exit with unmerged entries is the expected resolution state, not permission to stash, abort or rebase; an unexpected failure stops for operator-directed recovery.
Resolve `package.json` conflicts first, before workers or pnpm tools: retain the fork core identity/current version and the incoming permission manifest version.
Preserve the core fork CHANGELOG byte-for-byte.
Resolve the core and instruction/doc conflicts using the design above, checking adjacent automatically merged code for stale state methods and workspace signatures.
Adapt the central helper and direct fixtures in place, incrementally by owner/caller, without mass rewriting the large lifecycle test file.
Keep the incoming gated scheduler and upstream test scenarios; preserve all fork selection scenarios and assertions.

Use targeted existing suites while resolving: core lifecycle selection/run/state/manager, nested selection, outcome delivery, service adapter, agent/get-result tools, plus selector and worktrees package suites.
Run package typechecks after fixture changes; an invalid partial fixture is not grounds to loosen production types.
Once all conflicts and required integration edits are staged, complete the genuine merge with its existing Conventional Commit subject `chore: merge upstream/main`.
If continuing a conflicted merge requires an editor, use `GIT_EDITOR=true git merge --continue` after inspecting the staged resolution.
Record `M=$(git rev-parse HEAD)`, verify exactly two parents and the pinned second parent, and preserve incoming breaking subjects/footers in ancestry.
Any later adaptation uses an outcome-appropriate `fix(pi-subagents): ...` or `docs: ...` commit; a newly approved breaking adaptation must use `fix(pi-subagents)!:` with its own `BREAKING CHANGE:` footer, not hide under `chore:`.

### 3. Review adaptations locally, validate and establish final source feasibility

Inspect `git show --remerge-diff "$M"` for conflicted paths, first-parent-to-merge diffs for automatic fork intersections, and every merge-to-HEAD contribution.
Compare both diffs and final source where necessary; an empty remerge diff cannot establish automatic-merge preservation.
Correct integration-authored regressions in scope, commit reviewed adaptations, and update the retro with actual deviations/OIDs before independent review.
Run the required checks on the completed two-parent integration:

```bash
pnpm run check
pnpm run lint
pnpm run test
pnpm fallow dead-code
pnpm --filter @jopqior/pi-subagents run verify:public-types
./scripts/release/next-version.sh pi-subagents
./scripts/release/next-version.sh pi-subagents-model-selector
./scripts/release/next-version.sh pi-subagents-worktrees
./scripts/release/verify-cliff-parity.sh
```

Root checks/tests include the selector and worktrees packages; targeted reruns during adaptation do not substitute for this completed-integration pass.
Recompute source evidence separately for both registered forks using the real resolver without tracked artifact writes:

```bash
node --input-type=module -e '
  import {execFileSync} from "node:child_process";
  import {readReleasePackages, requireReleasePackage} from "./scripts/release/release-metadata.mjs";
  import {resolveUpstreamSource, renderUpstreamSource} from "./scripts/fork-sync/source.mjs";
  const repo = process.cwd();
  const registry = readReleasePackages("scripts/release/release-packages.json", repo);
  const at = execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim();
  for (const pkg of ["pi-subagents", "pi-subagents-worktrees"]) {
    const registration = requireReleasePackage(registry, pkg);
    const source = resolveUpstreamSource({repo, at, upstream: registration.upstream});
    console.log(pkg, renderUpstreamSource({source, upstream: registration.upstream}));
  }
'
```

This command was dry-run during planning and resolved both forks to the prior incorporated target; after implementation, each incorporated link must name this issue's pinned target.
Record source outputs and validation locations in ordinary stage notes, not a new ledger.
Stop on required install/check failures, including inherited ones, and report provenance without implied repair authorization.
An unrelated inherited defect with passing required gates stays outside synchronization scope; an unrun optional live/TUI check requires no waiver.
Seek approval for the smallest extra check only when a concrete adaptation uncertainty remains after automated evidence.
Suggested checkpoint commit: `docs(retro): record integration validation for issue #45`.

### 4. Hand off the actual merge range for independent review

This final numbered step is mandatory and overrides the reviewer's default tag/plan-derived base.
Resolve the recorded actual merge `M`; if recovering it, inspect `git log --first-parent --merges --format='%H %P' HEAD` and identify the genuine merge whose second parent is the exact pinned target, then verify ancestry and parent count rather than trusting a subject.
Resolve `BASE=$(git rev-parse "$M^1")`, `TIP=$(git rev-parse HEAD)` and `COMMON=$(git merge-base "$BASE" 41405de895fb53f802df89f8978456cd1dae397e)` when those commits exist.
Generate the separate complete inventories:

```bash
git diff --name-status "$COMMON" 41405de895fb53f802df89f8978456cd1dae397e > /tmp/f0045-incoming-paths.txt
git diff --name-status "$BASE" "$TIP" > /tmp/f0045-actual-paths.txt
```

Dispatch the fresh `pre-completion-reviewer` with full resolved OIDs for actual merge, first-parent base, reviewed tip, pinned target and common base; this plan; fork-sync skill with the actual synchronization review task; inventory-generation inputs/commands; selected contract groups and reasons; and evidence entry points from steps 2 and 3.
Include core lifecycle/selection/service/report files and tests, selector initialization/privacy boundaries, worktrees identity/provider/loading contracts, manifest/CHANGELOG resolutions, instruction intersections and each post-merge contribution.
Pass critical warnings and handoff changes, not a predicted verdict or copied coverage narrative.
Require independent regeneration and checking of both complete inventories against the actual refs and preservation of generic deterministic reviewer gates.
The report must state the actual range, inventory coverage/deep-review scope, relevant results and finding dispositions under sync-assessment policy.
Correct in-scope failures and use normal follow-up review; do not commission a second comprehensive upstream audit or evidence recorder.
Record the accepted report, reviewed HEAD and next action in the retro and commit ordinary handoff updates; no release/push/issue closure occurs in this implementation stage.

At the later `/ship` stage, verify the reachable two-parent merge, committed reviewed adaptations, source feasibility and clean completed state.
Use this actual first parent as `RANGE_BASE` for the existing release-candidate command and closing summary, including follow-up adaptations; do not use a release tag or plan-parent approximation.
Skip incoming-history co-shipped issue scans and close only verified fork close targets.
The only planned close target is fork issue 45; upstream issue numbers and the preserved worktrees issue are not close targets.
Publication remains separately authorized, even after successful review and CI.

## Risks and Mitigations

- Conflict markers understate the adaptation: scan adjacent automatic merges for removed `SubagentState` methods, old claim handling and workspace-disposal signatures.
- A retained selection gate could silently delay startup with neither provider: keep synchronous `begin()` semantics, the conditional workspace await and the existing same-turn factory assertion.
- Run ownership could be undone by a cancellation fix: update the full stopped/question/notice lifecycle through the same run and retain upstream late-result/waiter tests.
- A simplistic report resolution could lose either queued admission or pending-choice advice: retain both upstream and fork cases and exact existing assertions.
- Permission license fields could disappear over forwarding: adopt the producer, serializer, tolerant parser, server reconstruction and existing round-trip tests together.
- An automatic documentation merge could erase fork requirements: review final identity/selection prose and reviewer instructions, not just conflict hunks.
- Source claims could accidentally use a dependency's anchor or the newest remote tip: resolve each registered fork independently from actual merge ancestry and stop on ambiguity.
- Old tests or typechecks could be overstated as integrated evidence: baseline results are labeled as pre-merge, and implementation/reviewer stages rerun their own required checks.

## Open Questions

No unresolved design choice blocks the approved integration.
Unexpected compatibility choices, authored test gaps, failed required checks or new verification needs return to the operator at the affected boundary.
No concrete new follow-up issue was identified; existing fork [#26] remains separate.

[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#37]: https://github.com/Jopqior/gotgenes-pi-packages/issues/37
