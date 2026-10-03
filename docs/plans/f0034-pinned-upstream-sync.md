---
issue: 34
issue_title: "Sync gotgenes/pi-packages@9087a8dfa6edbfa1808fe3deab46ac3e17a7c032"
---

# Integrate the pinned upstream target

## Release Recommendation

**Release:** ship independently

This repository-scoped integration is not a roadmap batch member.
This marker authorizes independent landing, not publication.
Only the registered fork identities are eligible for separately approved publication; inherited package version changes do not authorize publishing `@gotgenes/*`.
The core's upstream contribution is major under the existing correspondence policy; derive the actual fork version with the release command after committing reviewed evidence, never by copying upstream's version.

## Problem Statement

Integrate the exact upstream target while preserving the fork's model-selection contract, package identity, release history, and repository workflow safeguards.
Resolving textual conflicts alone is insufficient: automatically merged display and test paths contain incompatible assumptions.
The deliverable is a reviewed genuine merge with committed release evidence, not a replay, squash, release, or new synchronization mechanism.

## Goals

- Merge the fixed target in the primary checkout on `main`, retaining exactly two parents and the target as the second parent.
- Accept the operator-approved Pi 1.0 requirement, host-provided TypeBox migration, permission changes, prompt changes, built-in child extensions, and incoming fixes.
- Accept always-visible `provider/id` model labels except while selection is pending, and explicit background resume returning before completion.
- Preserve initial-selection admission, cancellation, confirmation, nested ownership, synchronous service spawn, and no-provider acknowledgements.
- Classify the integration as **breaking**: older hosts lose support, model/output formats change, explicit background resume changes its return boundary, and inherited permission behavior changes without a configuration edit.
  Use `feat!:` and a `BREAKING CHANGE:` footer for the integration commit.
- Validate the packed candidate core with the selector on Pi 1.0 without coupling the selector's peer floor to the core's release number.
- Preserve published fork artifacts and record the reviewed merge through the existing recorder before independent review.

## Non-Goals

- No newer upstream target, feature-worktree integration, rebase, squash, upstream tag import, or publication.
- No implementation of selector navigation [#25] or Tool/Agent/Custom selection [#26].
- No legacy-Pi compatibility branch, new public selection fields, permission bypass to suppress new prompts, or lifecycle redesign.
- No merging PR [#33] on top of the upstream TypeBox migration; its manifest-only legacy-package approach is superseded by the accepted target.
  Verify [#32] is resolved and retain both as explicit fork ship-time disposition targets, not automatic commit-message closures.
- No handwritten CHANGELOG entries, historical correspondence corrections, release registry additions, or republishing inherited packages.
- No rewriting historical plans, retros, or synthetic maintenance-trial results to describe the new implementation.

## Background

The issue author and authenticated operator are both `Jopqior`.
No fork or fallback inherited issue-34 retro exists.
Open fork issue/PR inspection found the TypeBox overlap and the separate selector work above; the latest local triage, `docs/triage/2026-09-18-backlog.md`, concerns the upstream tracker, not this fork task.
The issue links the synchronization guide and release policy rather than numeric prerequisite issues.
Those owners are already present; their constraints apply directly.

Planning inspected local HEAD `999d2784a8c8c9093f0d085a1454faf5274a84b5` and common base `4dd378ca97a35e380ed946cd5ce0bcb9050ced5a`.
Startup pull reported already up to date; once the issue revealed synchronization scope, the guide was loaded before subsequent Git operations.
Absolute Git/common directories matched the primary checkout, branch was `main`, and tracked state, unmerged entries, and pending-operation checks were empty.
The supported fetch retained the tag namespace.

Relevant fork owners are `InitialSpawnSelection`, `SpawnSelectionScope`, the manager's selection-only wait, and the bound `buildSpawnDisplay`/`detailFor` presentation producer.
The startup and presentation maintenance documents describe preserved responsibilities, not a promise that upstream changes merge without adaptation.
Upstream adds per-run carrier claims, superseded wait outcomes, background resume, live model observation, and child built-in extension loading.
These are separate from the initial selection attempt and must remain so.

The fork's `AGENTS.md` requires Chinese operator communication, English artifacts, explicit fork GitHub targeting, protected tags, and separate publication approval.
The synchronization guide overrides generic worktree, review-range, and co-shipped issue-scanning defaults.

## Design Overview

### Fixed inputs and evidence provenance

Upstream target: gotgenes/pi-packages@9087a8dfa6edbfa1808fe3deab46ac3e17a7c032

The incoming scope is the common-base-to-target diff, not `HEAD..target` and not a moving upstream tip.
A planning-only `git merge-tree --write-tree --name-only HEAD <target>` against the real commits returned conflicts without changing the index or working tree.
Its preview is diagnostic only, not a completed integration or executable test result.
Recompute the preview if local integration inputs change.

The supported fetch advertised upstream core release `22.0.0` at `84111ba0e8eebddd3c4bb4ae04298b1a78f96f86`.
Calling the real `verifyUpstreamReleaseManifest`, `isAncestorOf`, and `packageCommitsBetween` helpers against these actual Git objects verified the release manifest, continuous ancestry, and an empty unreleased-package commit list.
The release-to-target core path diff contains only a retro file, excluded by policy.
This establishes planning feasibility, not approval to fabricate a sync record before a merge exists.
The last published fork correspondence is `pi-subagents-v4.0.7` to upstream `21.7.7`; the policy therefore maps the accepted upstream distance to major.
The actual recorder must repeat its online lookup and validation after integration.

### Approved compatibility policy

The operator approved all three gate choices: target upgrade, `provider/id` display with pending suppression, and explicit background resume.

| Surface                       | Accepted behavior                                                                                                                                                    | Preserved boundary                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Core, permission-system, nocd | Pi peers requiring 1.0; core uses `typebox` peer and development dependency instead of runtime `@sinclair/typebox`                                                   | Keep fork npm/repository identity; do not claim compatibility by retaining obsolete floors               |
| Core tools/display            | Show provider and model even when equal to parent; follow actual live model switches                                                                                 | Pending selection reveals neither proposal nor confirmed-but-not-active display; preserve non-model tags |
| Resume                        | Explicit `run_in_background: true` returns a launch acknowledgement; omitted/false waits                                                                             | Reuse session; no selection, workspace creation, or initial-selection reset                              |
| Permissions                   | Narrow infrastructure reads, exclude permission logs, honor targeted external-directory denies, route built-in MCP through `mcp`, gate native paths as Pi opens them | Retain upstream migration handling and fail-closed tests; do not loosen operator policies                |
| Bash permissions              | Accept heredoc-tail salvage, conservative computed/rebound words, and proven-reader sed/awk classification                                                           | Keep direction and external-directory gates distinct                                                     |
| Prompts                       | Accept structured options edits and custom-root-prompt ownership; child identity excludes parent's tool surface                                                      | Preserve other extensions' sections and child-local tool capabilities                                    |
| Other output                  | Silence autoformat's no-UI success summary; include session-tools system/context-edit lines                                                                          | Keep failures visible and transcript branch semantics intact                                             |

Prompt notification features remain opt-in; the target does not enable a new default bell.
Permission session approval of a directory no longer grants its parent and sibling directories.
These accepted changes stay within the affected packages' existing scope; this plan adds no orchestration or permission authority to the subagent core.

### Reconcile selection with observed model state

Keep initial selection in its existing owner.
Keep the original terminal observer before `selection.finished()`, admission before `selection.begin()`, the post-workspace permit check, and both SDK factory cancellation checks.
Keep ordinary state free of selector bookkeeping; incoming resume resets its own run/claim lifecycle only.

For record model/thinking observation, resolve live session, retained released-session value, confirmed selection, then ordinary execution proposal.
Presentation separately gives pending selection precedence over every model source.
Use the record's observed values when a session exists or was released; a confirmed pair must be visible while session creation is still held.
Do not let incoming foreground/helper/widget/get-result code overwrite the pending projection with an unconditional `modelLabel(record.model)`.
Preserve the original pre-record placeholder; pending suppression starts when a pending record exists.

Retain one tool-detail producer rather than a second formatted-tag overlay.
Remove the obsolete parent-ID comparison argument from `detailFor` and every caller/test in the same merge commit.
Use a narrow structural model shape containing only `provider` and `id` for labels; the projection reads pending activity, selected pair, and observed model/thinking, not a concrete `Subagent` dependency.
A suitable internal shape is:

```typescript
interface ObservedSpawnPresentation {
  readonly awaitingSelection: boolean;
  readonly selectedPair?: {
    readonly model: { readonly provider: string; readonly id: string };
    readonly thinkingLevel: ThinkingLevel;
  };
  readonly model?: { readonly provider: string; readonly id: string };
  readonly thinkingLevel?: ThinkingLevel;
}
```

The type is internal and illustrative; reuse the existing narrow source type rather than adding a competing interface.
Each field must have a real producer/consumer; no public record field or serialized contract is added.

```typescript
const details = presentation.detailFor(record);
return buildDetails(record, details);
// buildDetails adds metrics/status, not a second model selection decision.
```

Keep `spawnBackground`'s selection wait and stopped/failed classification, then use incoming `renderBackgroundLaunch` for rendering only.
Pass any selection-confirmation note explicitly to that renderer; do not move lifecycle waiting into it.
Background resume uses existing-record model/thinking rather than the new invocation's proposed pair, while retaining unrelated invocation presentation semantics.
Do not import `spawn-config` back from `helpers` if `spawn-config` already reaches it; preserve the existing import direction and inspect every new same-directory edge.

### Identity, changelogs, and release evidence

Keep core name `@jopqior/pi-subagents`, fork URLs, current fork manifest version until release preparation, selection exports, and `Symbol.for("@gotgenes/pi-subagents:service")` unchanged.
The process-global key is a compatibility contract, not package branding to rename.
Resolve the core CHANGELOG conflict by retaining the complete pre-merge fork file byte-for-byte; do not splice upstream release sections into the fork's published history.
Accept other packages' upstream manifests/changelogs with their original provenance where the fork has no competing published history.
Keep the selector's published manifest and changelog unchanged unless verification reveals a materially new compatibility decision, which returns to the operator.

After the completed merge and any corrective commits are reviewed, classify the merge resolution's own fork contribution separately from upstream's major change.
Expected classification is `none` if resolution only preserves the fork contract under accepted upstream behavior; this is a review hypothesis, not a preapproved recorder value.
A genuine fork-only behavior change requires its own justified level and affected resolution paths.
Use the policy-owned recorder, commit its state update, then run version prediction.
Do not update the published correspondence table with an unreleased row; release preparation owns that lifecycle.

### Repository workflow reconciliation

Merge useful upstream prompt/skill improvements with fork safeguards, not whole-file ours/theirs choices.
Preserve `fNNNN` issue lookup, `fN` phases, root/package artifact routing, explicit fork mutations, registered release candidates, publication approval, primary-checkout merge constraints, root/`pnpm -C` test commands, and unpiped verification.
The preview's new `repos/gotgenes/pi-packages/issues/<M>/events` query in `ship.md` must target the fork for ordinary fork work.
For this synchronization, skip the incoming-history co-shipped issue scan entirely under the guide.
Keep upstream issue references qualified in newly authored guidance.

The new `/upstream-impact` workflow assumes a neighboring Pi checkout that this machine lacks.
Adapt its active instructions and `upstream-watch` guidance to the existing local-source policy: use resolved installed SDK source where appropriate; explicitly stop for a supplied checkout when a requested historical comparison needs one.
Do not invent a checkout, fetch arbitrary history, or silently substitute an unavailable model.
Preserve inherited historical artifacts as history.

### Packed selector validation

Keep historical registry-core rows and their existing host pins.
Add a separate candidate row to the existing compatibility script: pack the actual local core and selector, install both tarballs in a disposable consumer with Pi 1.0 host packages, type-check without workspace aliases, and run the real loader in a fresh process.
Read expected candidate identity/version from the packed manifest, not from a guessed unreleased version.
Separate installation specifier from expected manifest version; a `file:` tarball cannot be treated as both.
Pass host pins explicitly for the candidate instead of changing global defaults for historical rows.
Assert the candidate row actually loads the tarball identity and selector registration capability; historical-row success is not candidate coverage.
Use npmjs.org explicitly for registry reads and preserve isolated cleanup and negative controls.
The selector's existing peer floor remains independent because the public selection contract is unchanged.

### Design review and Tidy First

The fresh-context assessor recommended no preparatory commit.
Existing selection ownership, presentation producer, and passive/runnable fixtures already provide the needed seams.
Decline optional type-check helper extraction as a separate preparatory commit; if the candidate row duplicates the existing operation, a small private same-file helper belongs in that verification step, with unchanged historical behavior.

| Check                   | Design disposition                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency width/ISP    | Presentation reads only the fields listed above; candidate installation receives explicit specifier, expected identity, and host facts |
| Demeter/output mutation | No session reach-through in renderers; no mutation of execution proposals, tags, or caller dependency bags                             |
| Resets/relay            | Selection owner remains one-shot; per-run claims retain separate reset/release semantics                                               |
| Repeated discriminators | Pending/confirmed tool details stay in the shared producer, not independently reconstructed by runners                                 |
| Mock depth              | Real producer and real manager/record boundary tests carry semantic claims; static-detail fixtures remain unit conveniences only       |
| Missing abstraction     | No new lifecycle framework or cross-package bridge is justified                                                                        |

## Module-Level Changes

The exact incoming inventory is reproducible with `git diff --name-status 4dd378ca97a35e380ed946cd5ce0bcb9050ced5a 9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`.
It is accepted as an integration set; the following table names local reconciliation and high-risk review surfaces, not permission to omit automatically merged files.

| Files                                                                                                                                                                                                                 | Change or verification                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/package.json`, `rollup.dts.config.mjs`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`                                                                                                                | Reconcile fork identity/version with upstream peers/typebox/pins; regenerate lockfile, retain fork install/test settings                                       |
| `packages/pi-subagents/CHANGELOG.md`                                                                                                                                                                                  | Resolve to pre-merge fork bytes; no newly authored entries                                                                                                     |
| Core `src/lifecycle/{subagent,subagent-manager,subagent-state,subagent-session,create-subagent-session}.ts`                                                                                                           | Combine selection contract with run claims, resume, model observation, and built-in loading; repair confirmed-pair observation                                 |
| Core `src/tools/{agent-tool,background-spawner,foreground-runner,helpers,spawn-config,get-result-tool,get-result-report,get-result-renderer}.ts`                                                                      | Reconcile background spawn/resume, narrow presentation, pending suppression, and superseded waiter results                                                     |
| Core `src/ui/{display,agent-widget,widget-renderer,session-navigation,session-navigator,labeled-rule}.ts` and `src/observation/renderer.ts`                                                                           | Accept upstream model labels/viewer changes without revealing pending proposals                                                                                |
| Core `src/index.ts`, `src/session/{prompts,builtin-extensions,mcp-tool-patterns,ask-parent-tool,notify-parent-tool}.ts`, `src/types.ts`                                                                               | Review automatic selection-scope composition with built-ins, prompt boundary and TypeBox changes                                                               |
| Corresponding core tests; `test/tools/spawn-selection-boundary.test.ts`; `test/helpers/{make-deps,make-spawn-config,make-subagent}.ts` and helper tests                                                               | Preserve both incoming and fork scenarios, update exact labels/signatures, add cross-behavior assertions; use runnable owner fixtures for new run/resume tests |
| Core `README.md`, `docs/configuration.md`, `docs/comparison-with-upstream.md`, `docs/architecture/architecture.md`, package skill                                                                                     | Reconcile host/display/resume documentation, fork scope and current module map; preserve historical phase ownership                                            |
| `packages/pi-subagents-model-selector/scripts/verify-core-compatibility.mjs`, `test/verify-script-isolation.test.ts`, new `test/verify-candidate.test.ts`, `README.md`                                                | Add candidate/host row, offline contract tests and documented verification coverage; do not alter selector UI or public peer range                             |
| `packages/pi-permission-system/{src,test}/`, manifest, schema, example and docs                                                                                                                                       | Accept complete target changes; prioritize MCP, native-path, infrastructure bypass, session grants, prompt options and bash salvage/effect tests               |
| `packages/pi-autoformat/src/extension.ts` and test/docs; `packages/pi-nocd/src/{index,working-directory-prompt}.ts` and tests/docs; `packages/pi-session-tools/src/{format-transcript,turn-ledger}.ts` and tests/docs | Accept target behavior and release provenance; verify actual no-UI, prompt, and transcript surfaces                                                            |
| Colgrep/github-tools manifests; permission-model-judge test fixtures                                                                                                                                                  | Accept peer declarations and typed tool-call fixture updates; no speculative runtime edits                                                                     |
| `AGENTS.md`, `.pi/prompts/`, `.pi/agents/`, `.pi/skills/`, `.pi/extensions/pi-permission-system/config.json`                                                                                                          | Resolve active guidance with fork/environment safeguards; inspect automatically merged passages and repeated sequences                                         |
| `scripts/roadmap/{parse-roadmap,validate-roadmap}.mjs`, `test/roadmap/`                                                                                                                                               | Accept explicit edge vocabulary while preserving numeric and `fN` phase identities; fix auto-merged old expectations for bare dashed edges                     |
| `scripts/agent-docs/`, `test/agent-docs/`                                                                                                                                                                             | Accept incoming inventory/frontmatter/invocation-volume changes and tests                                                                                      |
| `scripts/release/pi-subagents/sync-state.json`                                                                                                                                                                        | Recorder-owned reviewed merge evidence after integration                                                                                                       |
| This plan and matching retro                                                                                                                                                                                          | Record implementation facts, actual merge/evidence OIDs, review range and next-stage handoff                                                                   |

Predicted unchanged beyond upstream: core `src/service/service.ts`, selection owner/scope/catalogue modules, runtime and shutdown contracts, selector `src/`, selector manifest, synchronization/release algorithms and registry, and `.github/workflows/`.
Their contracts must still be exercised; a green legacy dependency suite alone is not evidence of new-host compatibility.
The fork construction/nested-selection and service tests remain required even if their source stays unchanged.
Historical maintenance-trial code fences remain historical, not active call sites to rewrite.
This issue is not a roadmap step; do not mark inherited open upstream roadmap work complete on behalf of the fork.

## Test Impact Analysis

This is integration, not a testability extraction; no new lower-level seam justifies deleting existing integration tests.
Retain upstream claims/resume/built-in/prompt tests and fork selection-owner, construction, nested, service and full tool-boundary tests.
Update obsolete short-name/same-parent-hidden expectations to the approved provider/id contract rather than keeping contradictory assertions.
The automatically merged roadmap fixture must expect unrecognized bare/informs dashed edges while retaining both numeric and fork phase cases.

Planning measurements against the unchanged checkout:

| Check                                                                                                                                                                                                                      | Measured result                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm exec vitest run test/upstream-sync test/release --maxWorkers=2`                                                                                                                                                      | 22 files, 383 tests passed                                                         |
| `pnpm -C packages/pi-subagents exec vitest run test/tools/spawn-selection-boundary.test.ts test/tools/spawn-config.test.ts test/lifecycle/initial-spawn-selection.test.ts test/lifecycle/construction-inheritance.test.ts` | 4 files, 62 tests passed                                                           |
| `./scripts/upstream-sync.sh --help`                                                                                                                                                                                        | Explicit fetch, pinned merge and reviewed-record interfaces confirmed              |
| `./scripts/release/next-version.sh pi-subagents`                                                                                                                                                                           | Successful no-release result at the current published fork tag, before integration |
| Real evidence helpers on release-to-target history                                                                                                                                                                         | Manifest verified, continuous ancestry, no policy-relevant unreleased core commits |

No merged candidate, packed new-host consumer, full root suite, or interactive smoke test was executed during planning.
The merge preview and source analysis identify risks, not measured runtime failures of an implemented resolution.
Run changed prompt commands through existing workflow-contract fixtures; read-only inspections above are already dry-run, while merge/record examples must not run until their implementation step.

## Invariants at risk

| Constituency and invariant                                                                               | Test surface to preserve or extend                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Parent agent: following tool cannot run before required selection; no-provider queue remains nonblocking | Opened real `test/tools/spawn-selection-boundary.test.ts`, queued and sequential continuation groups                         |
| Operator: pending model/thinking withheld; confirmation reflected before session creation                | Same real boundary test plus `test/tools/spawn-config.test.ts`; extend widget/get-result and actual record observation cases |
| Child startup: late cancellation cannot bind or leak a created session                                   | `test/lifecycle/create-subagent-session.test.ts` and real loader `construction-inheritance.test.ts`                          |
| Nested users: child registrations do not replace root provider                                           | Retain construction/nested-selection tests and public service capability checks                                              |
| Resume callers: initial selection is not rerun; old waiters cannot consume/release a new run             | Incoming lifecycle/state/get-result tests plus a real-record background-resume cross-case                                    |
| Presentation maintenance: one producer, tag ordering and execution facts not mutated                     | Existing spawn-config exact-object tests; change approved label expectations only                                            |
| Fork operators: topology, tag namespace, evidence and immutable history                                  | Existing `test/upstream-sync/` and `test/release/`, actual parent/reachability inspection and byte comparison                |
| Workflow users: `fN` remains distinct from numeric upstream phases                                       | Both phase-identity cases in roadmap parser/validator tests                                                                  |

No quantitative cache, latency, or token-prefix improvement is claimed.
Keep upstream prompt identity tests, but do not interpret shared parts as universal provider cache reuse.

## TDD Order

1. **Integrate the fixed target and resolve all cross-behavior conflicts atomically.**
   Re-load the synchronization guide, verify primary/main clean state and no pending operation before startup Git operations, and stop on failure.
   Recheck local target and evidence feasibility; never substitute a newer tip.
   Run the supported pinned merge command below; the inspected inputs produce conflicts, so resolve all required source/test/manifest/lockfile/doc changes together before completing that merge.
   The script uses `git merge --no-ff -m` rather than `--no-commit`: if changed local inputs unexpectedly merge cleanly, it completes the merge itself.
   In that case inspect the actual topology, retain the genuine merge, amend only that session's own fresh merge message to the classification below, and land semantic repairs as separately tested follow-up commits; never manufacture a pending state or replay the integration.
   Red: add the distinct proposal/selected/live/released model cases, pending widget/get-result suppression, and background-resume real-record case before repairing the semantic intersections.
   Existing invariant tests may already pass; use the named mutations rather than inventing a regression.
   Green: implement the approved precedence, keep `detailFor` as the shared detail producer, reconcile the background renderer without losing selection waiting, retain incoming claims and initial owner isolation, and resolve root workflow/roadmap conflicts.
   Update all affected constructors, mocks, exact-equality assertions, imports and current documentation in this same merge; no partially migrated type/signature commit is valid.
   Verify focused core/selector/roadmap/workflow tests, package checks, lockfile consistency, and the unchanged fork CHANGELOG bytes before completing the merge.
   Killing mutations: remove the selection wait in `spawnBackground` (sequential/queued boundary); replace the confirmed-pair model fallback with `execution.model` (held-session selected case); prioritize selected pair over live session (mid-run switch case); omit retained released values (post-release case); use unconditional record labels after pending projection at each output site (that site's pending case); render resume's new invocation pair instead of its record (resume display case); route explicit background resume through awaited `resume()` (held-run return case); delete the new-site built-in factory wiring (child capability case).
   Keep incoming claim-handle/superseded waiter regressions; mutation of interruption cleanup to release every claim must kill the new-run ownership case, not merely any test.
   Complete the genuine merge with subject `feat!: sync Pi 1.0 behavior while preserving fork selection (#34)`.
   Footer: `BREAKING CHANGE: The integrated core, permission system, and nocd require Pi 1.0 or later. Model labels use provider/id, explicit background resume returns before completion, and upstream permission and prompt contracts apply. Initial human selection remains required before selected background startup is acknowledged.` Upstream authorship is retained through the genuine merge; no separate mechanism from PR #33 is adopted, so no new co-author trailer is required.

   ```bash
   ./scripts/upstream-sync.sh --merge --expected-upstream 9087a8dfa6edbfa1808fe3deab46ac3e17a7c032
   ```

2. **Verify the real packed core/selector pair on the new host.**
   Red: add offline script tests separating tarball install specifier, expected manifest version and candidate host pins, and requiring candidate orchestration alongside historical rows.
   Green: extend the existing isolated compatibility script with the actual packed-candidate row and shared private type-check operation only where reused.
   Preserve historical registry rows, negative controls, cleanup and unchanged published selector peer contract; update README verification instructions.
   Verify selector checks/tests, core public declarations, historical matrix and candidate loader/type-check with no workspace aliases; inspect package manifests and actual installed paths.
   Killing mutations: use the candidate tarball path as the expected installed version (candidate identity case); use selector's legacy dev host pins for the candidate (host-selection case); skip invoking the candidate verifier (orchestration case); replace the installed service with an empty object (real loader capability case).
   If new-host verification requires selector runtime/API changes, stop for a new operator decision rather than broadening this step silently.
   Commit: `test: verify packed fork selection with the integrated Pi host (#34)`.

3. **Review the completed integration and record release evidence.**
   Resolve the actual merge OID and its parents from Git; assert exactly two parents, the planned second parent, and reachability from HEAD.
   Inspect `git show --remerge-diff <merge>`, automatically merged fork customizations and every post-merge contribution; compare core CHANGELOG against the actual first parent byte-for-byte.
   Run root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` on the completed integration, not a conflict state.
   Also run core and permission-system `verify:public-types`, autoformat `test:acceptance`, selector `verify:core-compatibility`, root upstream/release/roadmap suites, and `git diff --check`.
   In a fresh Pi 1.0-or-later session, verify chooser cancellation/confirmation, selected labels, background resume, child tool allowlists, permission-system/nocd prompt composition, and the permission-judge combination; use the actual packages under test rather than only old registry dependencies.
   Record exact host/package sources and any unavailable manual surface; do not call an omitted check passed.
   Commit necessary bounded fixes with their real type, then classify the reviewed fork contribution and invoke the recorder below with actual values.
   Inspect state/tag mappings on recorder failure; stop rather than bypass policy or silently undo evidence.
   Commit only reviewed evidence and accompanying handoff facts with `chore: record reviewed upstream sync evidence (#34)`.
   Run `./scripts/release/next-version.sh pi-subagents` after that commit and record its actual output and upstream/fork contribution derivation; no release preparation or version editing.
   This step exercises existing tests and has no new test seam; any corrective code requires a discriminating regression and mutation before commit.

   ```bash
   ./scripts/upstream-sync.sh --record-fork-sync <actual-merge-OID> \
     --fork-level <reviewed-level> --rationale "<reviewed resolution rationale>"
   ```

4. **Obtain independent review and finish the standard implementation handoff.**
   Dispatch the fresh-context pre-completion reviewer after reviewed evidence is committed.
   Supply the actual merge's first parent as the explicit base through HEAD, this plan, and the synchronization guide; explicitly supersede default tag/plan-derived ranges.
   Separately require incoming common-base-to-target review, remerge diff review, automatically merged customizations, and every post-merge contribution including evidence.
   Verify that the report states that range and those surfaces before accepting it.
   Resolve findings, repeat affected gates and obtain re-review as needed.
   Commit implementation-stage notes containing target, actual merge, reviewed fork contribution, evidence commit, checks/manual results, reviewer range/result and next action.
   Suggested note commit: `docs(retro): record issue #34 integration and review handoff`.
   Next stage is `/ship 34` in a separate session, with actual merge-first-parent `RANGE_BASE`, no incoming-history close scan, fork-only explicit close targets, and no publication without separate approval.

Execute through `/tdd-plan` because the conflict intersections and candidate verification include new test cycles.
A pending merge is not a resumable clean checkpoint: stop for operator-directed recovery if a later session finds one.

## Risks and Mitigations

- **Automatic merge retains incompatible semantics:** inspect ordinary/pending/confirmed/live/released and resume paths with distinct values; do not rely on conflict markers or stubbed detail producers.
- **Host pins hide integration defects:** run packed candidate and real-loader checks on the new host in addition to historical rows and local suites.
- **New permissions change daily operations:** accept the documented target restrictions, exercise migration scenarios, and never add blanket allows just to pass tests.
- **Fork history becomes upstream history:** preserve identity, CHANGELOG bytes, tag namespace and committed evidence; derive versions through policy rather than merge-message severity alone.
- **Workflow prose silently targets upstream:** inspect newly added API paths and automatically merged prompts, while retaining guide-owned synchronization exceptions.
- **New behavior invalidates historical trial assumptions:** update current docs and tests, not historical measured results.
- **Current Pi process runs old extensions/templates:** restart for manual integration checks and again before shipping if loaded workflow tools changed.
- **Recorder rejects target or evidence:** treat it as a blocker; do not move the pinned target, weaken validation, or invent a release correspondence.

## Open Questions

No product decision remains open after the operator gate.
The actual fork-resolution level, merge OID, evidence commit, release prediction and manual-host outcomes are implementation facts to record, not values to author during planning.
New material compatibility choices must return to the operator before affected edits.
No new speculative follow-up issue is required; #25/#26 already own deferred selector work, and #32/PR #33 remain explicit ship-time verification/disposition targets.

[#25]: https://github.com/Jopqior/gotgenes-pi-packages/issues/25
[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#32]: https://github.com/Jopqior/gotgenes-pi-packages/issues/32
[#33]: https://github.com/Jopqior/gotgenes-pi-packages/pull/33
