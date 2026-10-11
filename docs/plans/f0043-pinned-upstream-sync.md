---
issue: 43
issue_title: "Sync gotgenes/pi-packages@1810feed6ab2a83fa74f3b242095e0cc03773570"
---

# Integrate the pinned upstream target while preserving fork contracts

## Release Recommendation

**Release:** ship independently

This repository-scoped synchronization is not a package roadmap batch member.
Independent landing does not authorize release dispatch or publication; those require separate approval for registered fork identities.

## Problem Statement

[Issue #43](https://github.com/Jopqior/gotgenes-pi-packages/issues/43) requests synchronization to a fixed upstream commit through separate planning, implementation, independent review, shipping and retrospective stages.
Incoming changes include bounded result waits, resume-refusal snapshots, internal module moves, bash permission fixes and repository authoring safeguards.
A textual merge alone cannot preserve the fork's model-selection behavior or distinguish fork release history from upstream release history.

## Goals

- Incorporate the exact target through a genuine two-parent merge in the primary checkout on `main`.
- Adopt incoming functionality and upstream `feat`/`fix` classification without additional breaking markers, as explicitly directed by the operator during planning.
  Describe observable changes in documentation without adding `!` or `BREAKING CHANGE:` solely because the generic planning prompt classifies them differently.
- Preserve fork identities, current fork manifest versions, immutable published changelogs, model-selection contracts and worktrees compatibility.
- Report pending model selection accurately in result progress and bounded-wait guidance.
- Complete guide-required validation, separate fork source-feasibility checks and independent review before the shipping stage.

## Non-Goals

- Implement [fork issue #26](https://github.com/Jopqior/gotgenes-pi-packages/issues/26), which adds Tool/Agent/Custom choices to the selector form.
- Change selection defaults, reselect on resume, add an automatic wait timeout, introduce a watchdog, or expose private live selection/activity state in the public snapshot.
- Rebuild the worktrees migration or restore its removed packed-consumer verification suite.
  [Fork issue #37](https://github.com/Jopqior/gotgenes-pi-packages/issues/37) is closed; the current worktrees README prescribes package tests and typechecking, not that historical suite.
- Audit or repair unrelated inherited upstream behavior when required gates pass.
- Import upstream tags, rewrite published releases, backfill source claims, manufacture an initial package tag, or publish an unregistered original package.
- Merge, push, close issues, dispatch a release or implement code during this planning stage.

## Background

The [synchronization guide](../fork-sync/synchronization-guide.md) overrides generic worktree landing, review ranges, validation escalation and co-shipped issue scans.
The [release source guide](../fork-sync/release-source-guide.md) owns ordinary version derivation and source reconstruction; there is no synchronization recorder or ledger.

The issue author and authenticated CLI user are both `Jopqior`.
The issue is open and has `scope:repo`; no open fork PR was found, and the other open fork issue is #26.
The newest inherited backlog, `docs/triage/2026-10-02-backlog.md`, has no entry for this fork synchronization issue.
No fork #43 retro exists.
The fallback `packages/pi-permission-system/docs/retro/0043-eliminate-module-scope-state.md` was read and describes an unrelated upstream issue; do not append fork notes to it.

Relevant existing seams:

- `InitialSpawnSelection` owns selection admission, cancellation and terminal acknowledgement.
  The fork's passive presentation fixture deliberately throws if used to execute a run; `createRunnableTestSubagent` already supplies the real selection owner.
- `Subagent.waitUntilSettled` and carrier claims distinguish settled, interrupted and superseded waits.
  Incoming bounded waits reuse this ownership model rather than aborting a child.
- `describeActivity` already accepts `awaitingSelection`; incoming `progressOf` does not pass that fork-specific argument.
- `Subagent.resumeRefusal` already owns the resume decision.
  Incoming `SubagentRecord.resumeRefusal` and `toSubagentRecord` publish that fact, not a new resume algorithm.
- Worktrees statically imports the published fork core and registers its provider once after core initialization.
  No incoming worktrees files change, but the shared core lifecycle still requires preservation review.

## Design Overview

### Fixed inputs and reproducible inventories

Upstream target: gotgenes/pi-packages@1810feed6ab2a83fa74f3b242095e0cc03773570

Planning inspected these resolved commits:

| Input              | OID                                        |
| ------------------ | ------------------------------------------ |
| Fork planning HEAD | `47d9cd496b6a48023a9831fd42455cd23540d79b` |
| Common base        | `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4` |
| Pinned target      | `1810feed6ab2a83fa74f3b242095e0cc03773570` |

The initial `git pull --ff-only` reported up to date.
Before the subsequent upstream fetch, primary-checkout Git/common-directory identity, `main`, clean status/index and absence of merge/rebase state were inspected.
`./scripts/fork-sync/sync.sh --fetch` fetched without tags and reported the pinned target, with the local tag mapping unchanged.
A read-only `git merge-tree --write-tree HEAD <target>` preview reported content conflicts; it did not modify the index/worktree or perform an integration.
Its temporary output is a planning lead, not a completed merge or a substitute for actual remerge review.

Regenerate the complete incoming inventory rather than copying its listing into this plan:

```bash
TARGET=1810feed6ab2a83fa74f3b242095e0cc03773570
COMMON_BASE=8d373ceab20c5236b08d8d6c032fd515b9fa8dc4
git diff --name-status "$COMMON_BASE" "$TARGET" > /tmp/f0043-incoming-paths.txt
```

Planning measured 129 name-status entries with that command followed by `wc -l`.
The inventory covers all incoming paths, not only fork intersections.
Once the real merge exists, separately generate `git diff --name-status "$FIRST_PARENT" "$REVIEWED_HEAD" > /tmp/f0043-integration-paths.txt`.
The implementing session and independent reviewer must resolve those actual inputs and account for every path, including automatic merges and post-merge contributions.
Temporary files need not survive between sessions.

### Compatibility decisions and deep-review selection

| Contract group             | Selected entry points and reason                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Selection and execution    | Core `lifecycle/subagent.ts`, initial-selection owner, manager, service adapter and foreground/background tool callers; incoming lifecycle edits meet fork selection ownership and acknowledgement ordering                                      |
| Result delivery            | `tools/get-result-tool.ts`, `get-result-report.ts`, state and observer; bounded waits must preserve claims, resume races, model hiding and pending-selection meaning                                                                             |
| Public/load boundary       | Core manifest, `service/service.ts`, adapter, public declaration probe, selector entry point and packed matrix; new snapshot facts must survive serialization without removing fork provider registration                                        |
| Workspace contract         | Core workspace bracket/provider call sites plus worktrees manifest, entry point and existing provider/recovery tests; preserve published imports, initialization, preparation/disposal, rescue and recovery even without changed worktrees paths |
| Module order               | `.fallowrc.json`, moved observer/notification renderer, `index.ts`, moved tests and architecture dependency diagrams; preserve fork type-only policy while accepting upstream zone tightening                                                    |
| Fork workflow and identity | `AGENTS.md`, root/core READMEs, incoming prompts/skills, workspace config and core manifest/changelog; conflicts and clean automatic merges must retain fork targets, namespace, root landing and release approval boundaries                    |
| Repository safeguards      | Unicode scanner/tests, `prek.toml`, autoformat and permission configuration, rumdl pin; their new checks run over fork-authored files too                                                                                                        |

Permission-system source/tests/docs are inventoried and adopted as upstream changes, with focused behavioral verification rather than an independent fresh permission-system audit.
There are no fork modifications in that package relative to the common base.
Historical upstream plans/retros/triage edits, demo assets and the model-judge historical retro are inventoried but do not each require a separate audit.
An unexpected actual path or uncertain contract requires reading expansion; a materially new compatibility choice requires operator agreement before affected edits.

### Result querying and pending selection

Adopt the upstream optional `timeout` parameter; omission retains an unbounded wait and `wait: false` remains a non-waiting query.
Validate the upstream timeout domain and retain its timer ceiling.
The local bound owns its timer and abort listener, disposes both on every exit, and ends only this wait.
Expiry releases only this carrier's claim, does not consume an unsettled outcome and does not stop/cancel selection or execution.
Keep the waited run's outcome when a resume supersedes it; do not attach the resumed run's progress to that settled outcome.
These cases are covered in step 2.

```ts
interface GetResultParams {
  agent_id: string;
  wait?: boolean;
  verbose?: boolean;
  timeout?: number;
}

// Excerpt of the existing internal report, not a new public snapshot type.
interface AgentReport {
  // Existing report fields remain unchanged.
  awaitingSelection?: boolean;
}
```

Thread the record's existing `awaitingSelection` fact into `AgentReport` and call `describeActivity(record.activeTools, record.responseText, record.awaitingSelection)`.
Keep both text and compact metadata model labels hidden while selection is pending.
On expiry while awaiting selection, say that only the wait ended and model/thinking selection must be completed; do not recommend steering or diagnose the absence of session events as a stuck child.
Use the existing activity vocabulary rather than introducing another status.
Once selection is confirmed, ordinary upstream progress and transcript/steer guidance apply.
Queued, completed, interrupted and superseded output retain upstream/established carrier behavior; do not expand this adaptation into unrelated upstream queued wording repairs.
Step 3 covers pending selection, transition to ordinary activity, model hiding and the absence of inappropriate advice.

`lastProgressAt` remains state-owned: initialize from the run start, reset at `markRunning` and `resetForResume`, update on each subscribed session event, read for progress reporting, and retire with the record.
A human chooser wait has no child session-event stream yet; the separate private selection fact explains that situation instead of changing timestamps or inventing progress.

### Public snapshot and module moves

Adopt `resumeRefusal?: ResumeRefusal` through the existing service type and explicit adapter allowlist.
Read the record-owned getter; do not reconstruct refusal from status, workspace or session fields.
Check exact-equality fixtures: optionality alone does not preserve `toEqual` assertions, particularly for running records whose refusal is `still-running`.
Do not serialize `awaitingSelection`, `lastProgressAt`, active tools or response fragments.
Step 4 verifies the public type and snapshot boundary.

Accept upstream moves from `observation/record-observer.ts` to `lifecycle/record-observer.ts` and from `observation/renderer.ts` to `ui/notification-renderer.ts`, with their test moves.
Exact importer searches found the observer's lifecycle caller/test and the renderer's `index.ts` caller/test.
`observation/notification.ts` does not import the renderer and needs no invented adaptation.
The moved renderer imports notification DTOs type-only; the target fallow policy permits that edge while removing the old reverse runtime allowances.
The moved observer uses state plus a subscribable session, with no runtime dependency back to `Subagent`:

```ts
const unsubscribe = subscribeSubagentObserver(session, state, { onCompact });
// Every session event marks progress before its existing stats projection.
// The existing lifecycle owner retains responsibility for unsubscribe.
```

Planning ran `pnpm --silent fallow guard packages/pi-subagents/src/lifecycle/subagent.ts` and the same command for `src/index.ts` against the current policy.
The new observer edge is same-zone; source inspection found no new reverse runtime edge from observer to `Subagent`.
Re-run the guards against the adopted policy and moved renderer in step 2 rather than weakening `.fallowrc.json` to accommodate stale imports.

### Design-review outcome

The manager dependency remains the one-method `getRecord` interface; no dependency bag or parameter chain is widened.
The report's added boolean is a presentation fact used by the formatter, not a new public activity API.
Any extracted expiry formatter receiving a domain object should accept only `Pick<AgentReport, "waitExpiredAfter" | "awaitingSelection">`, the fields it reads.
No output-argument mutation, session-object reach-through, scattered reset or second resume predicate is needed.
`WaitBound` owns bounded-wait cleanup; shared carrier handling has the same lifecycle semantics as the existing wait path.
The Tidy-First assessor recommended no preparatory commit: incoming helpers, the refusal getter, adapter allowlist and runnable fixture already provide the required seams.

### Permission and authoring behavior adopted

Adopt the fixed target's literal `/dev/null` reader-wrapper exemption, timed-subshell command descent, no-op reader classification and sudo/env/xargs option grammars.
Retain explicit asks/denies and the existing unresolved/opaque floors; these are not blanket wrapper exemptions.
Adopt per-command-unit session grants: granting one unit does not authorize another asking unit in the same chain.
New approval suggestions retain wrapper options and inner command identity, falling back to exact commands where peeling is unproven; existing grants are not rewritten.
The operator chose upstream classification, not retention of these old behaviors.
Incoming regression tests cover these cases; step 2 runs them.

Accept code-comment Unicode escape scanning, the additional `git commit*-F-` tripwire, rumdl pin commentary, and workflow corrections while preserving fork-specific instructions.
A planning probe executed the target scanner from `/tmp` against the real tracked fork tree, using `NODE_PATH="$PWD/node_modules"` and no `--fix`.
It reported only the widget source/test comment escapes that the incoming diff already decodes; this is a check of real files, not a synthetic defect reproduction or a merged-tree lint result.
Do not change escaped glyph literals used as runtime code or assertions.

### Release/source evidence

Preserve `@jopqior/pi-subagents` identity, fork repository links, current version and published CHANGELOG bytes instead of taking upstream core version/changelog sections.
Adopt the new demo assets and point current core README/manifest asset URLs at the fork's retained paths.
Retain direct upstream author attribution and licenses.
Other original packages may acquire incoming source and upstream changelog additions, but no new original identity is registered or approved for publication.

Read-only upstream tag queries and local ancestry/manifest checks found these contained stable evidence candidates:

| Fork registration | Contained release candidate                       | Release commit                             |
| ----------------- | ------------------------------------------------- | ------------------------------------------ |
| Core              | Upstream `@gotgenes/pi-subagents` 23.4.0          | `63476ff869efd8ea339040f496fa734048b89e70` |
| Worktrees         | Upstream `@gotgenes/pi-subagents-worktrees` 0.3.3 | `62924b0a8389eed41c4da93b0bf0ea89e0b5c794` |

These are planning feasibility inputs, not final source blocks.
The core has scoped source moves after its candidate release; worktrees had no scoped release-path commits in the inspected interval.
After the genuine merge, independently call `resolveUpstreamSource` and `renderUpstreamSource` for each fork registration at the exact reviewed HEAD, following the release source guide's read-only inspection pattern.
The resolver must select its own highest contained stable release and validate topology/manifests/tail; do not author or reuse one package's claim for the other.
Do not run release preparation merely to inspect source.

Planning's offline `next-version.sh` calls found nothing to release for core/worktrees at the pre-integration HEAD.
`verify-cliff-parity.sh` exits nonzero because seven original packages have no local fork tags; its registered fork rows were consistent.
That all-package historical migration check is not a guide-required synchronization gate and does not authorize importing upstream tags or creating original-package release anchors.
Ordinary candidate version prediction after integration remains authoritative and separate from publication approval.

## Module-Level Changes

Paths below are contract-grouped; the complete incoming and actual inventories remain the path census.

- **Core execution/query:** merge `src/lifecycle/subagent.ts`, `subagent-state.ts`, `src/tools/get-result-tool.ts`, `get-result-report.ts`, `src/service/service.ts`, `service-adapter.ts` in `packages/pi-subagents/`.
  Add the selection-aware query adaptation without weakening carrier, selection or workspace ownership.
- **Core moves:** adopt `src/lifecycle/record-observer.ts`, `src/ui/notification-renderer.ts`, corresponding moved tests and `src/index.ts` import changes.
  Remove their old paths; search both alias and relative imports, skills and architecture prose/diagrams for stale paths.
- **Core tests:** reconcile incoming changes in `test/helpers/make-subagent.ts`, agent/background/foreground/get-result tests and snapshot tests; add focused selection-expiry/report assertions and retain real-record carrier/resume tests.
  Reuse incoming `text-of.ts` and its tests; do not rewrite large suites or relax the passive fixture.
- **Public consumer:** extend `packages/pi-subagents/scripts/verify-public-types.sh`'s existing probe to read/type-check `SubagentRecord.resumeRefusal`; leave its loader/peer architecture intact.
- **Core package/docs/assets:** resolve manifest/CHANGELOG conflicts as above; combine README query docs and fork selection guidance, accept new demo assets and media removals, update architecture module tree/dependency diagram and refusal-snapshot ADR wording.
  Recompute current-fork structural metrics if replacing the conflicting metric block; never substitute upstream measurements.
  Preserve fork architecture sections and keep incoming phase history qualified as upstream history; this sync is not a new roadmap completion step.
- **Permission system:** adopt inventoried changes in bash path/effect/enumeration/nested/redirect/wrapper analysis, gate descriptor/runner/bash-command, safe-system paths and pattern suggestions, with their incoming tests/configuration/session-approval/ADR/architecture updates.
  No separate fork algorithm is planned there.
- **Repository:** resolve `AGENTS.md`, `.pi/prompts/{plan-improvements,tdd-plan,sync-worktree}.md`, `.pi/skills/` intersections and root README; adopt incoming safeguards/configuration/workspace/fallow edits without removing fork workflow/release protections.
  Preserve existing fork fallow type-only allowances alongside incoming zone changes.
- **Inventoried historical additions/edits:** retain upstream plans/retros/triage and the model-judge retro without repurposing their numbers as fork close targets.
- **Predicted unchanged:** selector package files and worktrees package files, because incoming changes do not alter their provider registration signatures, published core imports, initialization order or workspace API.
  Verify against the final tree; an unexpected change invalidates this prediction and may trigger a new compatibility decision.
- **Predicted unchanged:** `src/observation/notification.ts`, `src/ui/display.ts`, passive selection fixture, release source/registry/scripts, root test-output capture and `.pi/settings.json`.
  Existing seams supply the adaptation and incoming inventories contain no need to replace these fork mechanisms.

## Test Impact Analysis

No new extraction-specific test layer is needed and no existing suite should be removed.
Incoming state/observer/report tests exercise real implementations; get-result lifecycle tests use real records with stubbed child sessions, not live model calls.
Agent/background/foreground tests with mocked managers pin tool presentation, not manager admission; keep the existing real-manager selection tests for admission and resume invariants.
Add selection-expiry coverage through a real manager/selection owner with a deferred chooser, fake timers and a stub session factory, so timeout can be shown not to cancel the chooser or create a session prematurely.

The planning baseline command passed **95 tests across three files** (measured):

```bash
pnpm --filter @jopqior/pi-subagents exec vitest run \
  test/tools/get-result-tool.test.ts \
  test/tools/observed-selection.test.ts \
  test/service/service-adapter.test.ts
```

This is a pre-integration baseline, not a prediction of the final suite count.
Incoming get-result runnable tests require fixture adaptation; exact snapshot assertions require the new refusal fact.
Keep carrier claims, superseded outcomes, notification delivery, widget bounds, selection override, no-provider acknowledgement and workspace lifecycle regressions.
Packed compatibility verification is required here because the public snapshot type/adapter changed; preserve historical selector rows and exercise the actual local core candidate.

## Invariants at risk

| Constituency and invariant                                                                                                | Existing pin / required addition                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parent outcome carriers: an abandoned wait releases only its own claim; a resumed run retains its delivery obligation     | `test/tools/get-result-tool.test.ts` carrier and superseded-run groups; retain and extend bounded-wait equivalents in step 2                                     |
| Operator/parent: pending selection reveals no proposed/confirmed model and is not misreported as child reasoning          | `test/tools/observed-selection.test.ts` text/metadata/widget assertions; step 3 adds pending-selection progress/expiry and post-confirmation cases               |
| Selector provider: a result timeout cannot cancel its pending choice or let workspace/session startup bypass confirmation | Existing real manager/selection-owner seams; step 3 adds the deferred-provider bounded-query regression                                                          |
| API consumers: snapshot values are copied and live/private state stays private                                            | `test/service/service-adapter.test.ts` exact snapshots, mutable usage copies and private-field absence; step 4 pins refusal serialization and packed type access |
| Workspace consumers: provider teardown/rescue and resume refusal remain record-owned                                      | Existing core workspace tests and worktrees package tests; review final lifecycle/bracket call sites, not just worktrees' mocked service accessor                |
| Fork maintainers: current fork release sections and identities cannot become upstream release records                     | Compare final core CHANGELOG bytes with the actual merge first parent; inspect manifest identity/version and source evidence separately in step 6                |

No token/cache/latency improvement is claimed.
The scope charter does not forbid bounded discrete querying or snapshot refusal facts; do not turn progress reporting into a reactive public service channel.

## TDD Order

No preparatory tidying is recommended.
The first cycle integrates inherited implementation/tests together; subsequent fork adaptations use ordinary separate red → green → verify → commit calls.
Do not batch Red with implementation or a mutation restore with the next mutation.

1. **Establish and complete the pinned integration checkpoint.**
   Re-read the synchronization guide and this complete plan; require primary `main`, clean tracked state, no unmerged entries and no pending operation before startup pull/fetch.
   Refresh only when needed with the safe fetch command; a newer tip does not replace the pinned target.
   Recompute the common base and complete incoming inventory, review the selected intersections, then invoke `./scripts/fork-sync/sync.sh --merge --expected-upstream 1810feed6ab2a83fa74f3b242095e0cc03773570`.
   Resolve previewed workflow/identity/architecture/changelog/core/test conflicts using the decisions above, including automatically merged customizations; inspect actual conflicts rather than relying on the preview list.
   Keep fork runnable fixture usages and model hiding while accepting upstream helpers/types/moves.
   Finish the genuine merge and verify exactly two parents, first parent equal to the actual pre-merge fork HEAD and second parent equal to the target.
   Preserve upstream author credit through retained ancestry; do not squash or replace incoming commits with uncredited reconstructions.
   Suggested merge subject: `chore: merge upstream/main` (the existing script's subject).

2. **Verify imported behavior and repair runnable-fixture compatibility.**
   Run focused core lifecycle/observer/query/report/snapshot and permission bash/gate/pattern suites to expose adaptation failures.
   Incoming bounded-wait helpers such as `stalledAgent()` must use `createRunnableTestSubagent` when they start/finish a run; presentation-only fixtures stay passive.
   Keep incoming timeout validation, omitted timeout, `wait: false`, early completion, parent interrupt, expiry, claim and progress assertions, plus existing superseded outcome tests.
   Verify observer progress updates and state initialization/start/resume resets as one timestamp lifecycle, not disconnected transitions.
   Run fallow guards for the affected caller/moved renderer and package check after importer changes.
   Killing mutations by class: remove `claim.release()` on an unsettled wait (claim tests); omit the bounded signal when calling `waitUntilSettled` (expiry tests); mark a superseded run consumed (resume obligation tests); delete `state.markProgress()` from the moved observer (event timestamp tests); drop the resume timestamp reset (state reset tests).
   Apply mutations only to saved green working files, restore separately and rerun; none may remain committed.
   Suggested adaptation commit if needed: `test(pi-subagents): preserve runnable fixtures during upstream sync`.

3. **Make pending-selection query progress and timeout guidance accurate.**
   Red: add real-record/report tests for an active deferred chooser, expiry without selection cancellation/session creation, claim release, hidden model labels and absence of stuck/steer advice; then confirm selection and verify ordinary progress/guidance returns.
   Green: pass `awaitingSelection` to `describeActivity`, retain model hiding in both carriers, and let the formatter select chooser-specific expiry advice from the narrow private report fact.
   Test every new promised edge in the get-result/observed-selection/report suites, retaining ordinary bounded-wait behavior from step 2.
   Killing mutations: omit the third `describeActivity` argument (pending activity assertions); force generic expiry guidance for pending selection (negative advice assertions); clear/ignore the report flag for every call (pending vs ordinary guidance pair); remove either pending model guard (text or metadata absence assertion); cancel the pending record on timeout (deferred chooser continuation assertion).
   Suggested commit: `fix(pi-subagents): report pending model selection in result queries`.

4. **Pin the public refusal snapshot across adapter and packed consumer.**
   Red/verify: extend or retain exact snapshots for resumable, running and released records, plus omission/private-field checks; add the public consumer probe for the optional refusal field.
   Green: retain incoming `SubagentRecord` and adapter projection using the existing getter, reconcile exact fixtures, and regenerate declarations through the existing pack path.
   Killing mutations: omit `resumeRefusal` from `toSubagentRecord` (running/released snapshot assertions); serialize `awaitingSelection` (private-field assertion); remove the public refusal property (packed consumer typecheck).
   Do not migrate the selector's historical development core floor or expand its API to use private fields.
   Suggested commit: `test(pi-subagents): verify public resume refusal snapshots`.

5. **Finish fork documentation and repository safeguard reconciliation.**
   Explain optional wait bounds, continuing child execution, progress output, chooser-specific guidance and upstream permission changes without extra breaking markers.
   Reconcile current-fork architecture layout/diagrams/metrics, incoming scope policy and fork identity/asset URLs; update `.pi/skills/package-pi-subagents/SKILL.md` wherever mechanism/path prose changed.
   Preserve the fork-specific `AGENTS.md` section, namespace lookup, root-main sync exceptions and approval rules in both narrative and output-format sections of affected workflow documents.
   Run `pnpm exec vitest run test/lint/unicode-escapes.test.mjs`, `node scripts/lint/unicode-escapes.mjs`, and focused markdown lint; inspect comments versus code literals if a new gate reports a finding.
   No new scanner mechanism or data table is authored; incoming scanner tests already accompany the inherited implementation.
   Suggested commit: `docs: reconcile pinned upstream changes with fork contracts (#43)`.

6. **Validate the completed integration and source feasibility.**
   Commit all adaptations, then run root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` without pipelines masking exit status.
   Run `pnpm --filter @jopqior/pi-subagents run verify:public-types` and `pnpm --filter @jopqior/pi-subagents-model-selector run verify:core-compatibility`; the existing matrix must retain historical rows and test the actual packed local core.
   Worktrees tests/check remain part of root gates; use focused package runs if diagnosing an actual shared-provider failure.
   There is no current packed worktrees harness to revive by default.
   Resolve/render source separately for core/worktrees at the actual committed HEAD using the release source guide; preserve local tag mappings and immutable core CHANGELOG bytes.
   Record actual merge/parents/reviewed HEAD, source results and check results in the ordinary implementation retro, not a new report/ledger.
   Required failure stops the affected completion path; distinguish planned adaptation regressions from inherited failures and obtain operator direction before an unplanned repair.
   Human TUI/live-model/temporary cross-extension checks are not default gates; request only the smallest justified extra check for a named uncertainty existing automation cannot answer.
   Suggested handoff commit: `docs(retro): record implementation handoff for issue #43`.

7. **Dispatch the single independent pre-completion review with actual refs.**
   Resolve the reachable first-parent integration whose second parent equals the pinned target; do not invent its future OID or freeze the planning HEAD as its first parent.
   Resolve `MERGE`, `FIRST_PARENT=$(git rev-parse "$MERGE^1")`, `REVIEWED_HEAD=$(git rev-parse HEAD)`, and `COMMON_BASE=$(git merge-base "$FIRST_PARENT" "$TARGET")`; verify two-parent topology and merge reachability.
   Generate both complete inventories from these OIDs and resolve merge-to-reviewed-HEAD contributions.
   Dispatch the ordinary `pre-completion-reviewer` with this complete plan, synchronization/release source guides, actual OIDs, inventory generation commands and contract-grouped source/test/evidence entry points from the deep-review table.
   Explicitly override its generic tag/plan-derived range with `FIRST_PARENT..REVIEWED_HEAD` and require independent regeneration of both inventories, remerge inspection, automatic fork-merge review and review of every post-merge contribution.
   Include operator classification/selection decisions, evidence locations, predicted-unchanged contracts and actual deviations; do not supply a predicted verdict or a coverage claim as proof.
   Retain normal deterministic gates/checklist; apply synchronization-guide finding disposition to inherited unrelated warnings and omitted optional checks.
   Correct in-scope failures and revalidate/review as needed; verify the final report states the actual range, inventory versus deep-review scope and finding disposition.
   Persist the review outcome and next-stage handoff in the ordinary retro, then stop before `/ship #43`.
   The shipping stage uses the actual first parent as `RANGE_BASE`, closes only verified fork targets and does not scan incoming upstream issue numbers as co-shipped fork issues.

## Risks and Mitigations

- **Silent automatic-merge regression:** inspect first-parent-to-merge diffs and final contract owners, not only conflicted hunks or an empty remerge diff.
- **Chooser inactivity mistaken for a hung model:** the query/report adaptation uses the existing private selection state; the real deferred-provider regression distinguishes waiting for the human from executing a child.
- **Tests pass without exercising selection ownership:** keep passive fixtures strict and use runnable real records/manager ownership for lifecycle assertions.
- **Release/source history contamination:** keep core CHANGELOG bytes and fork version/identity, preserve the true upstream second parent and reconstruct each fork's source independently.
- **Inherited gate failure expands scope:** report provenance and the failed required gate; do not silently repair upstream, weaken checks or import tags to satisfy an optional historical parity tool.
- **Stale in-process extension/prompt behavior:** implementation verifies code via fresh test processes; start a fresh Pi session for shipping/human checks that depend on newly loaded extension code or prompt registrations.

## Open Questions

No unresolved design choice blocks implementation.
The operator confirmed upstream classification without extra breaking markers and chooser-specific query guidance.
Publication destination/package selection, any materially new compatibility choice, and any justified extra live verification remain separate future approval gates.
No concrete follow-up beyond already-open fork issue #26 was identified; no speculative issue is filed.
