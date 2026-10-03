---
issue: 31
issue_title: "refactor(repo): consolidate upstream documentation and decouple generic workflows"
---

# Consolidate upstream documentation and decouple generic workflows

## Release Recommendation

**Release:** ship independently

This repository-scoped change is not a package roadmap step or release-batch member.
Root documentation and tooling do not themselves release a package; the separate `pi-subagents` README link correction can contribute to its next release.
At ship time use actual registered-candidate discovery and prediction, and obtain separate approval of any publication destination and package identity.
This plan authorizes neither dispatch nor publication.

## Problem Statement

Synchronization constraints currently live inside ordinary planning, implementation, shipping, and package skills.
The release guide also mixes integration operations, release policy, and completed tooling migration history.
Moving the same paragraphs wholesale would preserve that confusion, while restoring entire older prompts would discard useful general improvements.
The replacement specification asks for clear documentation owners and ordinary workflows that need no synchronization classifier.

## Goals

- Establish a concise synchronization constraint guide, a fork release policy, and a machine-owned correspondence view under `docs/upstream/`.
- Load synchronization guidance through a short conditional `AGENTS.md` entry before relevant Git operations, including startup fetch/pull, without adding ordinary-task classification.
- Remove synchronization-specific procedures and branches from generic prompts and skills while retaining general improvements and publication safeguards.
- Preserve fixed targets, primary-checkout/main integration, genuine two-parent topology, protected tags, complete review, committed evidence, correct integration ranges, and fork-only closure.
- Keep algorithms, schemas, synchronization CLI, issue-only discovery, and quality gates unchanged.
- Explicitly classify the generated-document default-path relocation as a breaking repository-tooling change, not a package runtime/API change.
  Use `feat(repo)!:` and a `BREAKING CHANGE:` footer for the atomic path migration; consumers of the old root document paths must update their references.

## Non-Goals

- No actual upstream integration, upstream fetch, release dispatch, publication, remote reconfiguration, approval ledger, runtime classifier, or new workflow command.
- No whole-file rollback, exhaustive rule-by-rule audit, or general prompt/reviewer redesign.
- No state-schema migration, evidence correction, release-version change, manual correspondence-row editing, or published-artifact rewriting.
- No resurrection of discarded issue-31 plans or implementation as a baseline.
- No changes to package runtime/tests, manifests, changelogs, package exports, architecture diagrams, or roadmap completion markers.
- Preserve `docs/history-restoration.md`: its old-clone recovery guidance and published-artifact disclosure are not proven obsolete for external clones.
  Removing completed internal tooling migration narration is not permission to remove that user-facing history.
- Do not rewrite historical plan/retro decisions or historical code-span paths; repair an actual broken relative link only if the final link check identifies one.

## Background

Prerequisite [#30] is implemented and closed.
Its `63bb8bf24dc6542733407e6b27f09803fcac5baa` commit introduced both synchronization branches and general improvements; `git log -S` for the pinned-target planning text resolves to that commit.
The restart section of `docs/retro/f0030-standard-upstream-workflow.md` supersedes earlier issue-31 directions.
No existing fork issue-31 retro was found, and no inherited issue-31 retro matched the fallback lookup.
The issue author and authenticated operator both resolve to `Jopqior`.

The fork open-issue searches for upstream/release work returned this issue and no overlapping synchronization change.
The open PR sweep returned PR #33 about TypeBox dependency placement, not these files.
The newest triage is `docs/triage/2026-09-18-backlog.md`; it contains inherited upstream backlog context, not an entry governing fork issue #31.
No package roadmap step references this fork task.

Current owners and consumers:

- `.pi/prompts/{plan-issue,tdd-plan,build-plan,ship}.md` contain pinned-target planning, completion, topology, range, and closure branches.
- `.pi/skills/releasing/SKILL.md` mixes valid release policy with synchronization lifecycle instructions.
- `.pi/skills/package-pi-subagents/SKILL.md` repeats synchronization process requirements.
- `docs/release/fork-sync.md` owns current mapping, blocking cases, recording, publication restrictions, and historical-notes recovery, but also duplicates integration instructions.
- `scripts/release/pi-subagents/config.mjs` owns `forkSyncTarget.correspondencePath`; the table CLI and `release-artifacts.mjs` read that field.
- `scripts/release/prepare-release.sh` separately hardcodes the correspondence copy destination and staged path.
- `test/upstream-sync/workflow-contract.test.mjs` mixes executable prompt-snippet tests with assertions locking synchronization prose into generic prompts.

The fork's `AGENTS.md` requires Chinese operator replies, English committed artifacts, explicit fork GitHub mutations, protected upstream tags, and separate publication approval.
The root plan remains `scope:repo` even though a package README link changes.
The package scope charter does not conflict with a provenance-navigation correction.

## Design Overview

### Documentation ownership

The operator selected these names and the conditional-loader design during planning:

| Owner                                                  | Contents                                                                                                                                                          | Exclusions                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `docs/upstream/synchronization-guide.md`               | Synchronization prerequisites and exceptions to the normal lifecycle; pinned target, integration/review/evidence handoff, shipping range and closure restrictions | No copied lifecycle recipe, new command, classifier, ledger, or release algorithm |
| `docs/upstream/fork-release-policy.md`                 | Current evidence authority, version mapping, blocking cases, recording/validation, immutable history, publication restrictions and recovery                       | No issue discovery or planning/implementation/ship procedure                      |
| `docs/upstream/pi-subagents-release-correspondence.md` | Published fork versions and verified upstream baselines, marked machine-owned region, regeneration/check instructions                                             | No hand-authored rows or independent policy copy                                  |

Keep the synchronization guide as short constraint-focused sections, not a stage-by-stage replacement workflow.
Each constraint has one authoritative home; navigation links do not repeat the procedures.
The release skill remains the publication entry point and links to the policy for detail.
Keep its generic approval, registration, prediction-error, dispatch, and recovery safeguards.
Remove its issue-entry/root-main/fetch/merge lifecycle narration; do not remove evidence requirements merely because they mention a sync.

Remove the old policy's completed `core-sync` rename/path-transition narrative after confirming the current entry points and strict schema tests.
Retain current schema validity, rejection of stale evidence, fresh preview/approval for incompatible backfill artifacts, and immutable publication rules as present-tense constraints.
The migration tests remain: completed migration prose can retire while historical compatibility rejection remains tested.

### Conditional loading and ordinary workflows

Replace the long synchronization lifecycle instructions in `AGENTS.md` with a compact conditional pointer to the guide.
Its trigger is performing or resuming actual upstream synchronization, including a pinned-target issue; its timing is before relevant Git operations, explicitly including startup fetch/pull.
State that these prerequisites take precedence over a template's startup pull for synchronization work.
A task editing synchronization tooling or documentation is not itself an integration task.
Do not add a mandatory classification pass, issue-body probe, or conditional guide loader to ordinary prompts/skills.
Recognition uses the task context; a documentation pointer is not runtime enforcement or a proof that an opaque issue number has already been recognized.
When synchronization context becomes available, load the guide before subsequent relevant Git operations.

Keep the global tag-import prohibition in `AGENTS.md`: it protects arbitrary Git commands before any workflow loads and is not a synchronization classifier.
Keep fork-target verification, explicit remote push, and publication authorization there too.
The dedicated `/upstream-sync` command still only finds or creates an exact-target issue and stops; update its final navigation without changing its executable lookup/create snippet.

General workflow content retained includes repository-scoped artifacts, root test commands, pending-operation checks, ordinary trunk/worktree lanes, fast-forward feature landing, registered candidate discovery/reuse, prediction errors versus successful empty results, exact-SHA CI, and explicit publication approval/recovery.
Edit only affected sections and mixed clauses, not entire files restored from history.
References to third-party dependency investigation, Git tracking upstreams, and inherited roadmap identities are not synchronization branches.

### Synchronization constraints retained in the guide

- Before startup fetch/pull for synchronization, require primary checkout/main by absolute Git-dir/common-dir identity, clean tracked index/worktree, no unmerged entries, and no pending merge/rebase.
  Stop for operator-directed recovery rather than stashing, rebasing, or treating unfinished work as a checkpoint.
- Keep the issue's exact full upstream target, agree compatibility choices in the ordinary plan, and return materially new choices to the operator before affected edits.
  Plan against the common-base-to-target incoming diff, fork identities/contracts, immutable changelogs, validation, and release-evidence feasibility.
- Use the existing script for explicit safe fetch and locally pinned merge; preserve missing-remote protocol choice and refuse silent URL changes or target substitution.
  Unreleased upstream package work rejected by the recorder is a blocker, not permission to move the target or weaken policy.
- Complete a genuine two-parent merge before final validation; second parent must equal the target.
  Worktree rebase, squash, or fast-forward landing cannot replace this merge.
- Review the remerge diff, automatically merged fork customizations, and all post-merge contributions, not only textual conflicts.
  Run root check/lint/test/dead-code gates on the completed integration.
- Commit reviewed integration changes, invoke the policy-owned recorder, then commit evidence before final independent review.
  Record target, actual merge OID, fork contribution, evidence commit, check/reviewer result, and next action in the ordinary retro.
  Online recording and tag-drift/failure inspection retain their existing semantics.
- Supply the independent reviewer an explicit resolved base and full review mandate, with the guide as required context.
  For synchronization use the actual merge's first parent through HEAD and separately inspect the incoming common-base-to-target scope and remerge diff.
  The dispatch must explicitly supersede the reviewer's default tag/plan-derived range; verify the report states the supplied range and extra surfaces before accepting completion.
  The generic reviewer and pre-completion skill do not gain synchronization branches.
- Before shipping, verify merge/evidence reachability, exact parents, clean completed state, and completed independent review.
  Missing facts stop shipping; shipping does not manufacture a merge or evidence.
- For release candidates and the closing summary use the actual merge's first parent through HEAD, including follow-ups, rather than resetting to a plan-parent/tag anchor.
  These guide exceptions govern the generic range defaults; preserve the existing candidate command itself.
- Close only the fork synchronization issue plus explicit fork plan/retro close targets verified against the fork tracker.
  Skip the incoming-history co-shipped scan; an incoming upstream issue number does not identify a fork issue.
  Push and any separately approved publication remain fork-targeted.

### Generated document migration

Move the correspondence document and switch `forkSyncTarget.correspondencePath`, shell copy/stage paths, fixture directories, fixture reads, and tagged assertions atomically.
Keep the marked region byte-identical to the pre-change document.
Change only surrounding navigation text as needed, retaining the generator markers and authoritative state path.
Do not add a fallback reader, alias, compatibility stub, or new path abstraction.
The CLI flags, table format, release state, and version derivation remain unchanged.

Consumer interaction remains `table CLI / prepareArtifacts -> forkSyncTarget.correspondencePath -> document`.
The shell continues its existing copy-and-stage operation at the renamed destination.
No new imports, collaborator interfaces, parameter relays, mutable state, or serialized fields are introduced.

### Design-review checklist

| Check                                | Finding                                                                                                 | Disposition                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dependency width and ISP             | Existing target object retains its shape; only its correspondence path changes                          | No interface growth                                                                           |
| Demeter/output arguments/reset/relay | No new runtime call chain or state manipulation                                                         | No refactor needed                                                                            |
| Repeated discriminators              | Sync decisions are repeated in prompts/skills today                                                     | Consolidate prose constraints behind the agreed conditional pointer, not a runtime classifier |
| Test mock depth                      | Existing Git/CLI fixtures exercise actual entry points; prose assertions are not behavioral enforcement | Preserve execution fixtures and narrow structural assertions                                  |
| Missing abstraction                  | Existing config already serves JS consumers; shell copy/stage remains explicit                          | No new helper layer                                                                           |

The fresh-context Tidy-First assessor recommended no preparatory commit.
Its optional same-file test regrouping is not necessary for this bounded edit and is declined.

## Module-Level Changes

| File                                            | Change                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/release/fork-sync.md`                     | Move/rewrite as `docs/upstream/fork-release-policy.md`; remove completed internal migration narration and transfer integration-only constraints to the guide                    |
| `docs/release/pi-subagents-correspondence.md`   | Move to `docs/upstream/pi-subagents-release-correspondence.md`; preserve generated region, repair policy navigation                                                             |
| `docs/upstream/synchronization-guide.md`        | Add concise prerequisites, review/completion constraints, and explicit shipping exceptions                                                                                      |
| `AGENTS.md`                                     | Replace detailed sync lifecycle passages, including the Worktrees exception's duplicated instructions, with the conditional entry; retain global Git/tag/publication safeguards |
| `README.md`                                     | Replace duplicated upstream procedure summary with concise navigation to the dedicated command and three owners                                                                 |
| `.pi/prompts/upstream-sync.md`                  | Update guide/policy navigation; executable entry remains issue-only                                                                                                             |
| `.pi/prompts/plan-issue.md`                     | Remove pinned-target-specific section; preserve repository scope and unrelated upstream-dependency research rules                                                               |
| `.pi/prompts/tdd-plan.md`                       | Remove pinned-plan check and upstream completion section; preserve pending-operation guard/root tests/review                                                                    |
| `.pi/prompts/build-plan.md`                     | Same removal; preserve eligibility for plans without new test cycles and general startup safeguards                                                                             |
| `.pi/prompts/ship.md`                           | Remove sync classification, trunk exception narration, special pre-push/range/close branches, and repeated footer exceptions; preserve general safeguards/candidate command     |
| `.pi/skills/releasing/SKILL.md`                 | Remove sync workflow narration, update current policy/table links, retain release evidence and publication safeguards                                                           |
| `.pi/skills/package-pi-subagents/SKILL.md`      | Remove duplicated sync process bullets; preserve current package-contract guidance without requiring ordinary work to run a sync suite                                          |
| `packages/pi-subagents/README.md`               | Update the absolute correspondence link in Release provenance, as a separate package documentation commit                                                                       |
| `scripts/release/pi-subagents/config.mjs`       | Set the new correspondence destination                                                                                                                                          |
| `scripts/release/prepare-release.sh`            | Update correspondence copy and staging destinations together                                                                                                                    |
| `test/upstream-sync/workflow-contract.test.mjs` | Replace old placement/wording contracts with bounded owner/navigation assertions; preserve actual operation-state and candidate execution coverage                              |
| `test/release/correspondence-table.test.mjs`    | Update fixture directory/paths and real-repository read; assert new-path CLI behavior                                                                                           |
| `test/release/fork-sync-shared.test.mjs`        | Update configured-target full-object expectation                                                                                                                                |
| `test/release/fork-sync-preparation.test.mjs`   | Update scaffold directory, document writes, and tagged reads; assert committed new path and absence of old output                                                               |
| `test/release/release-publication.test.mjs`     | Update scaffold, snapshot, tagged reads, malformed-marker input, and untouched-sibling assertions                                                                               |
| `test/release/fork-sync-values.test.mjs`        | Update root-policy exclusion example to the current path                                                                                                                        |
| `test/release/fork-sync-history.test.mjs`       | Update correspondence-path comment                                                                                                                                              |

Predicted unchanged: `scripts/upstream-sync.sh`, `scripts/release/correspondence-table.mjs`, `scripts/release/release-artifacts.mjs`, all `fork-sync/` algorithms, registry, state, release workflow, and published changelogs.
The JS readers already consume `forkSyncTarget.correspondencePath`; their behavior must be reverified through the real CLI/preparation tests, not assumed from type compatibility.
Also predicted unchanged: `test/upstream-sync/{issue-entry,merge,record-fork-sync}.test.mjs`, `test/release/fork-sync-migration.test.mjs`, `.pi/skills/pre-completion/SKILL.md`, and `.pi/agents/pre-completion-reviewer.md`.
They exercise retained mechanisms or contain no synchronization-specific branches to remove.
Search active docs, scripts, tests, all skills and repeated passages within edited prompts before finalizing the implementation diff.

## Test Impact Analysis

No runtime extraction is proposed, so no formerly impractical unit seam is created.
The new test surface is the configured generated-document destination and the documentation entry/ownership graph.

Replace assertions demanding phrases such as a fixed target inside `plan-issue`, merge completion inside both execution templates, and synchronization ranges inside `ship`.
Do not move an entire phrase snapshot into the new guide as a replacement proof.
Use exact link destinations and bounded synchronization-only anchors to detect misplaced procedures, plus a focused structural check that the conditional entry names startup fetch/pull before operations.
Do not ban every occurrence of `upstream`, since legitimate dependency investigations and release policy remain.
Manually review the guide against the acceptance constraints; structural tests cannot prove semantic completeness or live agent compliance.

Retain the executable `operation-state` and `release-candidates` fences and their actual Git-fixture tests.
Retain the issue-entry snippet tests, merge/recorder topology and tag tests, strict migration tests, table marker/byte-preservation tests, publication preflight tests, and sibling-only unchanged-evidence tests.
No generic document parser or new orchestration harness is needed.

Planning-time checks on the unchanged checkout:

| Command/surface                                                       | Observed result                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm exec vitest run test/upstream-sync test/release --maxWorkers=2` | Measured: 22 files and 383 tests passed; actual prompt snippets and isolated Git/release fixtures executed |
| `node scripts/release/correspondence-table.mjs --check`               | Exit zero, empty stdout; committed table matches verified evidence                                         |
| `bash scripts/upstream-sync.sh --help`                                | Existing explicit fetch, pinned merge, and record syntax shown without effects                             |
| `git rev-parse --path-format=absolute --git-dir --git-common-dir`     | Both paths resolve to the root checkout's `.git`                                                           |
| `git status --porcelain=v1` and `git ls-files -u`                     | Empty before planning artifacts were created                                                               |

The guide reuses existing command interfaces rather than adding executable startup orchestration.
Mutating fetch/merge/record examples are validated by existing isolated tests and help, never by running an actual integration during this task.
Re-run each retained executable prompt fence through its tests and each new read-only command example during implementation.
If authors introduce additional shell snippets, dry-run them safely before committing.

## Invariants at risk

These are retained issue-30 and release-system contracts, not a new package phase.

| Constituency/invariant                                                                                                   | Existing verification to retain                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary implementers: pending merge/rebase stops before startup pull                                                    | Executed `operation-state` scenarios in `workflow-contract.test.mjs`                                                                                  |
| Repository-scoped shipping: registered candidates include incoming and follow-up changes, unregistered remain ineligible | Real Git `release-candidates` fixture in `workflow-contract.test.mjs`                                                                                 |
| Sync operator: approved target survives a newer explicit fetch and offline merge                                         | `merge.test.mjs`: approved-ancestor/custom-refspec and unchanged-target cases assert actual merge parents and invocation logs                         |
| Fork tag namespace: recording does not change tag name/object mappings                                                   | `record-fork-sync.test.mjs`: byte-identical tag snapshot before/after recording                                                                       |
| Release consumers: reviewed evidence stays valid and historical published content stays intact                           | `fork-sync-preparation.test.mjs` record-to-prepare round trip; `release-publication.test.mjs` tagged state/table and historical CHANGELOG byte checks |
| Sibling package releases: fork state/table remain untouched                                                              | `release-publication.test.mjs` original-only snapshot test                                                                                            |
| Readers of provenance: generated rows and markers remain generator-owned                                                 | `correspondence-table.test.mjs` whole-document regeneration equality, marker rejection, and real-evidence checks                                      |
| Sync reviewers: complete review and correct ranges survive prose relocation                                              | Guide review plus explicit dispatch/range handoff requirements; not falsely attributed to a runtime test                                              |

Measure the generated region against its pre-migration bytes during implementation and require byte equality after the move.
No new evidence rows or quantitative performance claim is predicted.

## TDD Order

1. **Move the release documents and generated output atomically.**
   Red: update independent expected destinations in the target-object, table CLI, release-preparation, and publication tests; create fixtures at only the new path, so old readers/writers fail.
   Extend the real preparation assertions to require the new table in the release commit and no recreated old table path.
   Green: move the documents, update config and shell copy/stage paths, fix root/skill/prompt navigation together, and update the root-path example/comment fixtures.
   Retarget the existing workflow-contract policy reads to the moved document in this same step; retain their current content assertions until step 2.
   At this checkpoint preserve still-live synchronization paragraphs in the moved policy; the next step transfers/removes them so every intermediate owner remains complete.
   Verify the focused suite, correspondence check, generated-region byte equality, shell syntax, and a cold-cache Markdown link check.
   Killing mutations: restore the old `correspondencePath` string to kill the target/CLI new-path tests; change the shell `cp` destination back to the old path to kill preparation; omit the new table from `git add` to kill committed-artifact/clean-tree assertions.
   Root commit: `feat(repo)!: move upstream release documentation to descriptive paths (#31)`.
   Footer: `BREAKING CHANGE: Fork release documentation and the generated correspondence table now live under docs/upstream/. Update consumers of docs/release/fork-sync.md and docs/release/pi-subagents-correspondence.md to docs/upstream/fork-release-policy.md and docs/upstream/pi-subagents-release-correspondence.md; CLI flags and evidence formats are unchanged.`

2. **Consolidate synchronization constraints and remove generic branches.**
   Red: replace placement-locked workflow assertions with new owner/navigation tests that fail before the guide and conditional entry exist, and verify bounded sync-only branch anchors are absent from generic prompts/skills.
   Preserve operation-state/candidate execution tests rather than replacing them with text checks.
   Green: add the concise guide; install the `AGENTS.md` pointer; remove dedicated branches and repeated mixed clauses; trim README navigation, release policy duplication, and package-skill process guidance.
   Keep `/upstream-sync` issue-only and release authorization separate.
   Verify the workflow-contract and issue-entry tests, all moved/new documentation links, and a manual acceptance walkthrough of dirty startup, linked worktree, pending operation, advanced upstream target, automatically merged customization, missing evidence, and incoming issue-number collision.
   Killing mutations: remove the guide link from the conditional entry to kill navigation coverage; remove its startup fetch/pull timing constraint to kill the focused structural check; reinsert a pinned-target classification branch into an ordinary prompt to kill the bounded ownership assertion.
   These mutations prove only the stated structural predicates, not live compliance.
   Commit: `refactor(repo): isolate upstream synchronization constraints from generic workflows (#31)`.

3. **Repair the package's public provenance navigation.**
   Update only the absolute correspondence URL in `packages/pi-subagents/README.md` to the document moved in step 1.
   Verify the target exists locally, inspect the absolute fork URL, and run Markdown lint.
   This documentation-only step has no new test cycle; keep it separate so the repository tooling's breaking classification does not become a package API claim.
   Commit: `docs(pi-subagents): point release provenance to the upstream correspondence table (#31)`.

4. **Verify retained behavior and complete the handoff.**
   No new red/green cycle or speculative test helper is required for this final validation step.
   Run `pnpm run test`, `pnpm run check`, `pnpm run lint`, and `pnpm fallow dead-code` sequentially, plus the focused upstream/release suite and correspondence check.
   Clear `.rumdl_cache` after document moves before trusting the repository Markdown check.
   Check `git diff --check`, all active old-path references, and the implementation range for unintended changes to evidence, algorithms, schemas, tags, and package code.
   Review the reader/writer path round trip and exact generated-region bytes independently of the configuration assertion.
   In a fresh Pi session, perform a bounded read-only walkthrough of an ordinary task and a synchronization-resume scenario: observe which guidance loads and the proposed ordering, stopping before Git mutation or GitHub issue creation.
   Record observed behavior and limitations; this rehearsal is not a real integration or proof of all future agent runs.
   Dispatch the normal fresh-context pre-completion reviewer with this plan, actual changed files, resolved issue base, and a mandate to independently inspect retained constraints and document ownership.
   If a substantive fix is needed, commit it with its actual type and re-review; otherwise commit only the required implementation-stage notes.
   Handoff remains `/ship 31`, not upstream synchronization or publication.

No third-party mechanism is adopted by this plan, so no new co-author trailer is required.
Execute through `/tdd-plan` because steps 1 and 2 have discriminating test cycles.

## Risks and Mitigations

- **A pointer loads too late:** explicitly include startup fetch/pull and resume, and state precedence over generic startup instructions for synchronization tasks.
  Preserve the limitation that prose is not a runtime classifier; fresh-session observations are reported as observations.
- **Guide becomes the retired orchestrator:** use constraints and exceptions only, with links to standard lifecycle and the policy owner, not duplicated step lists or approval records.
- **Default review/ship ranges overwrite the integration range:** name the actual merge first-parent range in the guide, reviewer dispatch, and ordinary handoff facts; verify the review report and ship inputs use it.
- **Path migration updates only readers:** atomically update shell copy/stage and real tagged-commit tests with the JS configuration.
- **Tests preserve old wording rather than behavior:** retain executable fences, constrain structural tests to navigation/ownership predicates, and require independent manual content review.
- **Completed migration cleanup removes active safety:** keep strict schema/route/backfill tests and current validity/recovery rules; leave old-clone history disclosure intact.
- **Overbroad cleanup drops general improvements:** use targeted edits and inspect the retained list against the actual diff, not whole-file restoration.
- **Stale in-process prompts hide the new loading behavior:** restart Pi for the bounded walkthrough; do not use the editing session's injected prompt as fix verification.

## Open Questions

No design question blocks implementation.
If the fresh-session walkthrough reveals a materially different loading or precedence requirement, return to the operator before adding any mechanism or generic branch.
No concrete out-of-scope follow-up was identified for filing during planning.

[#30]: https://github.com/Jopqior/gotgenes-pi-packages/issues/30
