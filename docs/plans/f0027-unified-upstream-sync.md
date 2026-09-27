---
issue: 27
issue_title: "Add a unified upstream-sync workflow and remove redundant artifacts"
---

# Unified upstream synchronization

## Release Recommendation

**Release:** ship independently

This is repository-scoped work, outside any package roadmap or release batch.
The package README link correction is in `pi-subagents` release scope and can produce a documentation patch; derive its actual version at ship time and obtain independent publication approval.
Keep repository-workflow breaking commits separate from that package documentation commit so workflow breakage does not imply a package API major release.

## Problem Statement

Synchronization currently requires assembling instructions from a handbook, scripts, skills, package documentation, and historical records.
Some instructions are obsolete recipes or duplicate release mechanics, and the existing script does not implement all safeguards confirmed in [#28].
A dedicated workflow must perform the complete synchronization lifecycle, including independently approved publication, without retaining the handbook as a second authority.

## Goals

- Provide `/upstream-sync` as a no-argument repository workflow; invocation requests synchronization without a redundant start confirmation.
- Activate the individually reviewed [#28] policy in one prompt, preserving its exact authorization bounds rather than copying the old handbook.
- Reuse and harden `scripts/upstream-sync.sh` for dual transport, complete repository identity, tag-name/object preservation, preconditions, and topology handling.
- Keep proposals, actual operator decisions, execution, verification, and publication results distinguishable across resumed sessions.
- Delete `docs/upstream-sync.md`, obsolete recipes, duplicate entry-point prose, and the consumed [#29] handoff artifact after reconciling its remaining consumers.
- Retain necessary historical facts and machine-owned correspondence without fabricating historical approvals.
- Proactively report release candidates and predicted versions, obtain explicit package/scope/destination approval, then dispatch, wait, and verify publication when prerequisites succeed.
- Restore a green migration-test baseline without weakening historical-entry preservation or changing release data.
- Treat activation and stricter script defaults as **breaking repository-tooling/workflow changes**, not package runtime or API changes.

## Non-Goals

- No real upstream synchronization, remote configuration, push, publication, label creation, or historical Release backfill during implementation of this plan.
- No new approval engine, database, executable record schema, generic workflow runner, or second policy skill.
- No package runtime, dependency, release-level algorithm, registry schema, or evidence-schema changes.
- No arbitrary upstream ref/package selector, issue argument, release flag, or automatic first publication.
- No rewriting published tags, tarballs, changelogs, or authentic historical fixtures.
- No generic `/ship` or `/ship-no-issue` redesign; their unrelated issue/worktree lifecycle is not part of synchronization.
- No re-review of settled [#28] dispositions or reopening of completed [#29].
- Existing selector work in [#25] and [#26] remains separate.

## Background

### Dependencies and operator decisions

The author and authenticated GitHub user are both `Jopqior`; the issue explicitly carries `scope:repo`.
Issue [#28] remains open because workflow activation and final acceptance are pending, not because rule deliberation is unfinished.
Read its complete historical review at `docs/sync/reviews/f0028-sync-approval-policy.md` and its retro before implementation.
Issue [#29] is closed and its release-tooling changes are present; `docs/sync/f0029-to-f0027-handoff.md` identifies remaining consumers.
Its release guidance and generated table already live under `docs/release/`.

The planning gate confirmed:

- `invocation=no_args`: no arguments; match execution records to actual Git state before resuming, asking when ambiguous.
- `script_scope=harden_here`: implement the script protections here; report and stop on fast-forward-only ancestry.
- `baseline_test=include`: repair the migration-test assumption as the first implementation checkpoint.

No issue-27 fork or fallback retro existed.
Open issue searches found the coordination issues; the fork open-PR sweep returned no entries.
The newest triage, `docs/triage/2026-09-18-backlog.md`, covers inherited upstream work and has no entry for this fork issue.
No package roadmap step references this work.

### Real surfaces inspected

- `scripts/upstream-sync.sh`: default mode creates/configures a remote and fetches, despite its misleading read-only comment; merge/record checks currently occur afterward.
- `ensure_upstream_remote`: accepts one SSH URL and silently creates it when missing.
- `check_merge_preconditions`: checks origin by substring, allowing even the tests' local filesystem origin path.
- Fetch guard: compares tag names, not tag objects; its diagnostic currently prescribes deletion without approval.
- Merge branch: ordinary Git merge can fast-forward and prints an evidence instruction even when nothing merged.
- `test/upstream-sync/helpers/upstream-network.mjs`: uses real scratch Git repositories and a wrapper that redirects network transport and records invocations.
- `scripts/release/fork-sync/`, root release CLIs, the version predictor, registry, and `release.yml`: already own evidence, version derivation, explicit package dispatch, and publication guards.
- `ship-no-issue.md`: its unrestricted workspace predictor loop is unsuitable for this fork, where inherited packages may lack fork tags or release registration.
- `ship.md` release verification waits for Actions and pulls afterward, but does not itself prove registry visibility; the new workflow must complete that check.

AGENTS.md's explicit fork targeting, no upstream tag imports, script-only synchronization, pnpm usage, and independent publication approval remain binding.
The package README's minimal-core scope is unaffected: only its repository workflow link changes.
Pi prompt-template documentation supports a plain project Markdown template with inherited model selection; use no deterministic pre-LLM command, which would run before the approval/preflight instructions.
A fresh Pi session is required for the first invocation of the new command under this repository's session-freshness rules.

## Design Overview

### Responsibility split

| Owner                                             | Responsibility                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.pi/prompts/upstream-sync.md`                    | Ordered workflow, confirmed sync policy, pre-edit decisions, delegation, resume, push/release orchestration |
| `scripts/upstream-sync.sh`                        | Concrete Git transport, identity checks, tag protection, merge preconditions/topology, recorder invocation  |
| `docs/sync/runs/`                                 | Per-run inputs, proposals, decisions, execution and verification evidence; never standing policy            |
| `docs/sync/reviews/f0028-sync-approval-policy.md` | Historical operator deliberation and activation acceptance evidence                                         |
| `docs/release/fork-sync.md` and releasing skill   | Existing release mechanism and publication procedures                                                       |
| `scripts/release/pi-subagents/sync-state.json`    | Machine-owned release evidence, unchanged schema                                                            |
| `docs/release/pi-subagents-correspondence.md`     | Generated released-version view, unchanged ownership                                                        |

No TypeScript API or production module extraction is needed.
Keep narrow shell predicates/private helpers in the existing script; avoid a generic URL service or sharing the test network's state with release fixtures.
The design-review checklist found no new dependency bag, output argument, reset family, parameter relay, or cross-directory production import edge.
The concrete structural friction is the fixture's implicit remote setup; prepare it independently before tightening the production guards.

### Invocation and execution records

Use a plain template with `description` frontmatter and an explicit no-argument contract.
Expose `$ARGUMENTS` as input data and stop on unexpected arguments before mutation; do not interpret them as permission, shell code, issue numbers, or alternate targets.
No model lock, chain, loop, or implicit subagent execution is needed.

Use the already-approved `docs/sync/runs/<UTC timestamp>-<upstream short SHA>.md` convention, with filesystem-safe UTC formatting from `date` and the short SHA from Git.
If the path exists, inspect it: resume only when its full inputs and operation state match; for a genuinely new run obtain another timestamp rather than overwrite or guess a numeric suffix.
A filename is not evidence identity.
Before the first fetch, capture the tag mapping and configuration observations in scratch evidence; allocate the committed run record once the fetched upstream OID is known, retaining failure evidence when discovery stops early.

The prompt contains one concise record outline, not another template file or schema:

- Status and workflow revision; repository identity; pre-sync fork, discovered upstream, merge parents/final merge, and later verification/push/release OIDs.
- Inspected fork customization scope, upstream changes, tag-name/object snapshots, and remote configuration actions.
- Decision items with stable local IDs, proposal/files/effects/alternatives, actual operator answer and actor or active rule ID plus matching conditions, supersessions, execution diff/commit, and verification.
- Checks performed/not performed, independent review findings, release predictions, separate push/publication approvals, Actions IDs and publication readback.

Keep a new run record untracked while the merge is in progress and stage explicit paths, never a blanket `git add -A` that incorporates it accidentally.
After the merge, commit reviewed integration changes and the run checkpoint before invoking recording mode, which requires a clean tracked tree.
After machine evidence is recorded, commit that state and the next record checkpoint together before prediction.
Tracked record edits are not an exemption from clean-state checks; finish a permitted documentation checkpoint rather than bypass the script guard.
On resume, reconcile actual Git state, recorded inputs, operator evidence, and the current workflow before continuing; missing evidence stops affected work.
Do not start a new fetch/merge over an existing merge.

Migrate each existing handbook sync-log row into a historical run entry under the same directory, preserving its recorded timestamp, full upstream/merge OIDs, and tag literally.
Mark these as migrated historical facts with the old handbook Git revision as source; approvals/check results absent from the source remain unknown.
Do not create a second maintained history table or infer authorization from a successful historical merge.

### Script contract and sequencing

Retain the existing default fetch, `--merge`, and `--record-fork-sync` modes.
Add `--upstream-protocol <ssh|https>` solely to select the URL when creating a missing remote after the workflow's protocol question.
Without that explicit choice, a missing remote fails before configuration/fetch; an existing remote is preserved, and a conflicting supplied protocol fails rather than converting it.
Reject malformed or incompatible options before mutation.

Recognize complete, case-sensitive allowlisted identities for each role:

- `git@github.com:<owner>/<repository>` with optional `.git`.
- `https://github.com/<owner>/<repository>` with optional `.git`.

Use the upstream and fork owner/repository pairs appropriate to each guard.
Do not accept substring matches, arbitrary hosts, embedded credentials, query/fragment suffixes, extra path components, local paths, or SSH aliases; report unsupported spelling without rewriting it.
Do not claim these checks validate arbitrary Git `insteadOf` or SSH configuration; unexpected effective transport configuration is an inspection stop, not a credential-management task.

For merge and record modes, run branch/origin/in-progress-state/clean-tracked checks before remote writes and fetch.
Default fetch remains a mutating discovery operation, not a read-only mode.
The prompt separately inspects untracked ownership/overwrite risk, because the script cannot decide ownership.
It also verifies origin push URLs before any push; fetch identity alone is not push identity.

Capture `git for-each-ref --format='%(refname) %(objectname)' refs/tags` in deterministic order before and after every script fetch, including recording mode.
Compare mapping bytes, not counts or names alone.
Report additions, removals, or retargeting and stop without deleting/restoring tags; recovery needs the operator's exact approval.
Retain explicit `fetch --no-tags`, `tagOpt=--no-tags`, and upstream `pushurl=DISABLE`.

For a merge, resolve the fetched target to a full commit OID and classify ancestry before changing HEAD:

- Upstream already contained in HEAD: report no merge performed, retain HEAD, and omit the new-merge evidence instruction.
- HEAD is an ancestor of upstream but not equal: refuse fast-forward-only integration and ask for a separately reviewed approach; do not create an artificial evidence record.
- Divergent histories with a common ancestor: merge the resolved OID, explicitly preserving two-parent topology; verify the resulting parents before recording.
- No common ancestor or failed Git inspection: stop; never use unrelated-history or force recovery flags.

Add optional `--expected-upstream <full OID>` for `--merge`, used by the prompt after discovery.
After the script's second fetch, refuse if the target differs; return to inspection and reopen approvals whose input basis changed.
This pins the inspected input without introducing a new offline merge mode or dropping the existing fetch safeguards.
Standalone `--merge` still classifies its freshly fetched target; it never claims human approval.
Conflicts remain in progress, with diagnostics directing the operator to `/upstream-sync` and its on-disk prompt.
Other merge failures must not be labeled conflicts unless unmerged state actually exists.

### Workflow stages and confirmed-policy placement

1. **Load and inspect.**
   Read the current prompt, relevant skills, and matching prior run records; set a sync-stage session name without requiring an issue.
   Verify main, fork origin, operation state, tracked cleanliness, untracked risks, and current remote configuration before invoking the script.
   Resolve missing remote protocol or existing-URL changes under S04–S06; do not change the gh default without approval.
2. **Discover and classify.**
   Fetch through the script, retain tag evidence, inspect upstream main/new release information, identify actual fork-customized paths rather than a permanent package allowlist, and record input OIDs.
   Non-customized upstream content and supplied wiring merge as supplied; extra authored wiring is a separate decision.
   An already-contained target skips merge/evidence creation but still reaches release assessment.
3. **Synchronize.**
   Invoke the guarded merge against the inspected OID; leave conflicts intact for review.
   Do not abort, stash, switch branches, delete tags, or rewrite history automatically.
4. **Resolve and inspect extra changes.**
   Apply A01–A08 before authored edits, including conflict-free post-merge repairs and reviewer findings.
   Keep bounded active rules with their existing review IDs and exact conditions in the prompt, adjacent to their stage.
   Record why each automatic action fits the current inputs/action/effects; broad preservation goals are not rule coverage.
   Delegation defaults to read-only and carries the same bounds to nested workers.
5. **Verify and complete.**
   Perform bounded installation; classify unexpected project writes; apply cache cleanup only as already permitted.
   Run `pnpm run check`, `pnpm run lint`, and root `pnpm run test` once, with conditional dead-code analysis for new packages/dependency changes.
   Before manual merge continuation, reconcile the staged resolution diff and unmerged-index state against decisions.
   After the merge exists, inspect its remerge diff plus post-merge commits to complete authorization accounting before push.
   Obtain independent read-only review of affected fork customizations, including automatically merged paths, before push; uncovered repairs return to the gate.
6. **Record release evidence.**
   Bind the existing recorder to the actual reviewed merge OID and reported contribution level/rationale; ask on classification ambiguity.
   Existing-state corrections require their own approval; validation errors remain blockers, not a no-release result.
   Reference the release guide for algorithms and generated correspondence rather than repeating them.
7. **Predict and authorize.**
   Inventory affected workspace packages and the validated release registry; predict registered candidates using the existing version script, retaining exit status separately from stdout.
   Also disclose registered pending work unrelated to this sync, rather than silently bundling it.
   Unregistered/new packages are explicitly not publication-eligible; do not use inherited upstream tags/scopes as fork release permission.
   Report either concrete candidates and predicted versions, no release needed for eligible packages with no unresolved prediction failures, or a blocked prediction with reasons.
   Ask for push authority separately and publication approval naming exact packages, npm scope, destination, and predicted versions.
8. **Push and publish.**
   Reverify intended origin fetch/push identity and pending commits; push explicitly to `origin main`, never force.
   If origin moved, stop or reconcile under a new approved scope, then rerun relevant verification; never blindly pull across recorded input changes.
   Watch CI for the exact pushed SHA with verified-fork wrappers or explicitly targeted gh equivalents.
   Once approved and CI succeeds, re-predict at that SHA and dispatch the approved package set with the expected-SHA guard; changed versions/scope return to approval.
   Follow the existing release owner's prepare-versus-later-job recovery rules; do not invoke the whole `/ship` issue-closing workflow.
9. **Verify publication and finish.**
   Watch the exact release run, reconcile its release commit/tags, verify GitHub Release existence and exact npm package/version visibility at the approved registry, then record the result.
   Put the bounded wait/recheck procedure in the releasing skill so it owns registry visibility for future release callers as well.
   Workflow success with delayed registry visibility is pending verification, never a cue to republish blindly.
   Persist deferred/failed/pending status and a precise resume point if approval is declined or a prerequisite fails; no second operator reminder is needed after approval when prerequisites succeed.

For implementation acceptance, map every [#28] disposition to an active prompt clause, existing owner, removed material, or historical record.
The review document receives that mapping and scenario results, not another copy of active policy.
Keep #28 open until this activation has actually been inspected.

## Module-Level Changes

| Path                                                      | Planned change                                                                                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/release/fork-sync-migration.test.mjs`               | Replace whole-live-state equality with exact preservation of historical release/sync entries and ordering, while permitting later append-only records; keep raw and parsed checks     |
| `test/upstream-sync/helpers/upstream-network.mjs`         | Expose canonical GitHub origin after local clone; configure upstream explicitly; add focused topology/tag-drift controls alongside their tests                                        |
| `test/upstream-sync/merge.test.mjs`                       | Remote URL matrix, missing-remote protocol choice, side-effect ordering, tag mapping, target drift, ancestry outcomes, and new diagnostics                                            |
| `test/upstream-sync/record-fork-sync.test.mjs`            | Confirm dual transport, preflight ordering and tag-drift protections also cover recording; retain provenance/idempotence cases                                                        |
| `scripts/upstream-sync.sh`                                | Implement the script contract above; correct read-only claims and unsafe recovery guidance; preserve recorder ownership                                                               |
| `.pi/prompts/upstream-sync.md`                            | New sole workflow and confirmed sync-policy source, no argument contract, record outline, complete publication lifecycle                                                              |
| `docs/sync/runs/*.md`                                     | Migrate old factual rows without invented authority; future records created only by actual runs                                                                                       |
| `docs/upstream-sync.md`                                   | Delete after migration and active consumer cutover; do not archive obsolete recipe bodies                                                                                             |
| `docs/sync/f0029-to-f0027-handoff.md`                     | Delete consumed transitional handoff after verifying its remaining consumers; keep provenance in Git and this plan                                                                    |
| `docs/sync/reviews/f0028-sync-approval-policy.md`         | Append activation mapping and actual acceptance results; preserve historical decisions as historical                                                                                  |
| `AGENTS.md`                                               | Replace obsolete handbook pointer with the prompt entry point and release-owned pointer; preserve always-needed fork safeguards without importing the workflow body                   |
| `README.md`                                               | Replace script-procedure duplication with concise `/upstream-sync` invocation and responsibility links                                                                                |
| `.pi/skills/package-pi-subagents/SKILL.md`                | Collapse duplicated sync-procedure/verification directions into a conditional pointer to the workflow; preserve package contracts                                                     |
| `.pi/skills/releasing/SKILL.md`                           | Keep release mechanics here, add bounded publication-visibility readback, and point upstream integration callers to the workflow without reintroducing pre-publish upstream discovery |
| `docs/release/fork-sync.md`                               | Replace handbook navigation; retain algorithms/backfill and cross-reference workflow-owned approvals for sync-time evidence correction                                                |
| `packages/pi-subagents/README.md`                         | Replace the absolute handbook URL with the absolute workflow URL in a separate documentation commit                                                                                   |
| `packages/pi-subagents/docs/architecture/architecture.md` | Replace the relationship-to-upstream link; no runtime diagram or roadmap changes                                                                                                      |
| `test/release/fork-sync-values.test.mjs`                  | Replace the stale handbook-name scope-control input with an existing root documentation path                                                                                          |

Predicted unchanged:

- `scripts/release/fork-sync/`, release CLIs, registry/config/state, generator, preparation, publication scripts and `release.yml`: #29 already migrated their document dependencies; this work changes no release algorithm or schema.
- `test/release/fork-sync-preparation.test.mjs` and `release-publication.test.mjs`: retain explicit handbook-absent success assertions; mentioning the deleted path there is intentional regression coverage.
- Selector maintenance trial documents: retain bounded technical evidence in their package home, not as sync authorization; their deletion was not approved in #28.
- Historical plans/retros/review quotations: retain source-path mentions as historical text, not live navigation.
  If a real Markdown link to the removed handoff exists, change only that link to a fixed Git revision, not the historical narrative.
- Other package files and both generic ship prompts: no runtime or general release-workflow restructuring.

## Test Impact Analysis

This is a mixed script/TDD and workflow-documentation plan; execute with `/tdd-plan`.
No extraction creates a new unit seam and no existing integration/provenance tests become redundant.
The real scratch-network tests remain necessary because mocks of the guard would not pin Git topology, unchanged refs/index, or actual recorder integration.

At planning baseline `6b14694e2509f2895cb8e37f9fb65f2b94ca4f80`, `pnpm exec vitest run test/upstream-sync test/release` measured 19 passing files and 1 failing file, with 244 passing tests and 1 failure.
The isolated migration file reproduced the same failure: the live state contains the legitimate `pi-subagents-v4.0.4` release absent from the version-1 fixture.
This is direct execution of existing tests, not a synthetic reproduction of an upstream defect.
The current CI run for that HEAD is marked failure; this plan does not infer its cause without reading its logs.

### Planning-time command checks

| Command/surface                                                                                       | Observed result and implementation verification                                                             |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `./scripts/upstream-sync.sh --help`                                                                   | Success; confirms existing fetch/merge/record entry points; new flags must receive help and rejection tests |
| `git branch --show-current`; `git status --porcelain=v1`                                              | `main`, clean; future workflow also checks untracked risk                                                   |
| `git rev-list --left-right --count HEAD...upstream/main`                                              | Measured `271 0` against the local cached upstream ref; not a fresh network discovery                       |
| `git for-each-ref --format='%(refname) %(objectname)' refs/tags`                                      | Successfully emits full tag/object pairs; future tests must cover same-name retargeting and deletion        |
| `node scripts/release/correspondence-table.mjs --check`                                               | Success with the release-owned document                                                                     |
| `./scripts/release/next-version.sh pi-subagents` and selector equivalent                              | Both exit successfully with empty stdout and explicit no-release diagnostics at this baseline               |
| `readReleasePackages(...).packages` via Node                                                          | Validates and lists the registered fork identities; the returned value is a registry object, not an array   |
| `gh repo view --json nameWithOwner`                                                                   | Resolves to `Jopqior/gotgenes-pi-packages`                                                                  |
| `gh workflow run --help`; `gh run watch --help`                                                       | Confirm explicit repo, dispatch fields/ref, and watch exit-status flags without mutation                    |
| `gh release view pi-subagents-v4.0.4 --repo Jopqior/gotgenes-pi-packages --json tagName,url`          | Existing GitHub Release returned                                                                            |
| `pnpm view @jopqior/pi-subagents@4.0.4 version dist.integrity --registry=https://registry.npmjs.org/` | Published version and integrity returned; read-only example of post-release visibility verification         |

Re-run every safe command actually prescribed by the authored prompt, using real resolved values rather than placeholders.
For merge, remote setup, push, dispatch, recovery, and publication, use isolated tests or CLI help/fixture verification; never perform the real effect as a documentation dry run.
Run URL acceptance against the actual `git remote -v` forms plus the complete planned accepted/rejected matrix; a supported protocol name alone does not prove complete identity matching.
Manually walk the #28 scenario table against the final on-disk prompt, plus missing remote, tag retargeting, target movement, fast-forward-only, no-op with pending release, publication declined, CI failure, later-job failure, delayed registry visibility, and ambiguous resume.
Text-presence checks alone cannot prove agent compliance; label this as manual workflow acceptance, not runtime policy enforcement.

## Invariants at risk

| Constituency/invariant                                                  | Existing or planned pin                                                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Fork maintainers: upstream tags never replace fork refs                 | Existing colliding-tag and recording byte-identical tests; add same-name retarget/delete cases                                  |
| Operators: rejected merge/record leaves existing work untouched         | Existing dirty index/worktree, merge and both rebase-state tests; add assertions that no fetch/config write occurred            |
| Release users: merge evidence describes actual two-parent input         | Existing two-parent/conflict-continuation and contained-release recording tests; add FF refusal/no-op and expected-target cases |
| Historical release consumers: migration preserves exact old records     | Repaired raw/parsed historical-entry assertions, allowing append-only growth without changing old values/order                  |
| Publication users: release preparation no longer depends on handbook    | Keep handbook-absent preparation/publication tests and generated-table check unchanged                                          |
| Operator/resumed worker: approval is neither execution nor green checks | Full #28 walkthrough and an unanswered-record resume case; no historical recipe is an active rule                               |
| Package users: runtime and version policy unchanged                     | No package source/dependency/state/algorithm changes; README correction isolated from breaking tooling commit                   |

## TDD Order

Each executable step runs focused tests, its specified mutations with the intended assertion failure, then the relevant release/upstream-sync suite before committing.
Restore mutation edits from saved working files, not by discarding uncommitted work through Git.

1. **Repair the migration baseline.**
   Red is already observed against the live released state.
   Green: assert schema plus exact ordered historical release/sync prefixes in both parsed and raw state, permitting only later records beyond the historical baseline.
   This prepares reliable regression verification without changing release evidence.
   Killing mutations: temporarily change one historical release's upstream commit, remove one historical sync, and change rationale whitespace in the state file the test actually reads; each corresponding preservation assertion must fail.
   Save and restore the working file for every mutation and confirm no evidence change is staged.
   Adding a valid later record must remain green.
   Verify the isolated file and the complete release/upstream-sync suite.
   Commit: `test(repo): preserve historical fork-sync entries while allowing additions (#27)`.

2. **Prepare explicit network fixture identities.**
   Use canonical fork origin after cloning from the local bare fixture and explicitly add canonical upstream for ordinary scenarios.
   Adjust the existing SSH test to inspect the already-present remote; missing-remote tests will remove it explicitly.
   This removes reliance on the permissive substring check and implicit SSH creation before those behaviors change.
   Characterization assertions pin the configured URLs and local redirected transport.
   Killing mutations: omit the fixture origin replacement to fail the identity assertion; omit explicit upstream setup to fail the upstream assertion rather than relying on the old script to recreate it.
   Keep every existing merge/record test green.
   Commit: `test(repo): make sync fixture remote identities explicit (#27)`.

3. **Implement approved transport and preflight boundaries.**
   Red: accepted SSH/HTTPS spellings, explicit missing-remote protocol, unsupported/mismatched URLs, invalid options, and merge/record failures before config/fetch.
   Green: update usage/argument handling, exact identity guards and setup, and move local merge/record checks before network/config writes.
   Keep protocol handling in the existing script, not a new framework.
   Killing mutations by class: replace origin identity checking with the old substring predicate; reject the HTTPS arm; default missing protocol to SSH; overwrite an existing remote; move preflight below fetch.
   Each must fail its respective matrix or side-effect assertion; test both merge and recording modes where applicable.
   Verify all shared-fixture consumers in `test/upstream-sync/` and release CLI migration assertions.
   Commit: `feat(repo)!: require explicit safe upstream transport setup (#27)`.
   Footer: `BREAKING CHANGE: Missing upstream remotes require an explicit protocol choice; merge and record operations reject unsupported repository URLs and failed local preconditions before remote setup or fetch. Existing supported remote URLs are not rewritten.`

4. **Protect tag objects and inspected merge inputs.**
   Red: same-name tag retargeting, deletion/addition, recording-mode drift, fast-forward-only refusal, already-contained messaging, no-common-ancestor refusal, and changed expected target after discovery.
   Add each focused wrapper/topology capability together with the test that uses it.
   Green: mapping comparison, approval-safe drift diagnostic, optional expected-upstream guard, ancestry classification, and merge of the resolved OID.
   Preserve conflict state and distinguish non-conflict failure; retain ordinary two-parent success.
   Killing mutations: snapshot names only (retarget case); skip comparison (addition/deletion cases); bypass mapping check in recording (record drift); remove FF refusal (FF case); print recording instructions in no-op branch (no-op case); bypass expected OID equality (target drift); remove common-ancestor refusal (assert script-owned diagnostic and no merge invocation).
   Verify the old collision, conflict continue/abort, contained-tag and idempotence tests still exercise real Git.
   Commit: `feat(repo)!: stop unsafe upstream merges and tag drift (#27)`.
   Footer: `BREAKING CHANGE: Fast-forward-only upstream integration now stops for review; tag-object drift blocks synchronization without prescribing deletion. Already-incorporated upstream commits no longer request a new merge evidence record.`

5. **Activate the workflow and retire superseded instructions.**
   Author the no-argument prompt, migrate factual history, update root entry points/skills/release navigation and script conflict diagnostic, and delete the consumed handoff.
   Replace the handbook body with a temporary pointer-only stub so the package links remain valid until step 6; retain no procedure, policy, recipes, or history table in that stub.
   Remove old first-merge recipes, duplicated selector implementation advice, historical one-time permissions, duplicate release algorithms, and repeated package-skill sync instructions rather than relocating them.
   Update the exact diagnostic test and neutral scope-control path in this same step; retain handbook-absent tests.
   Killing mutation for the changed executable assertion: restore the old conflict diagnostic path; its new assertion must fail.
   Manually remove the pre-edit gate, delegated-worker stop condition, or post-merge gate in a review copy and identify which #28 acceptance scenarios fail; these are document review exercises, not automated compliance tests.
   Verify all active references and classify remaining old-path mentions; do not make a zero-match claim that excludes deliberate historical/negative controls.
   The pointer-only stub exists solely to keep this intermediate commit valid; step 6 removes it with its last package consumers.
   Commit: `feat!: require approval for uncovered upstream integration changes (#27)`.
   Footer: `BREAKING CHANGE: Upstream integration now uses /upstream-sync and requires confirmed rule coverage or explicit operator approval before authored conflict resolutions and extra integration edits. Sync, push, publication authorization, and successful checks do not grant that approval; the old handbook is superseded.`

6. **Finish package navigation and activation acceptance.**
   Update the package README and architecture link to the actual prompt and delete the temporary `docs/upstream-sync.md` stub in the same commit, separately from repository breaking commits.
   Confirm the handbook is absent before acceptance; no redirect artifact remains.
   Commit: `docs(pi-subagents): point maintainers to the unified sync workflow (#27)`.
   Re-run fresh-cache Markdown/link checks, safe command dry runs, release/upstream-sync tests, root check/lint/test, and dead-code verification.
   Walk #28's dispositions and scenarios against the actual prompt, record activation evidence in its historical review, and only then report its integration criterion satisfied.
   Commit: `docs: record sync workflow activation acceptance (#27)`.
   Dispatch the fresh-context pre-completion reviewer under the standard `/tdd-plan` gate; findings that require implementation choices must be surfaced rather than silently expanding scope.
   No actual sync, push, release, issue closure, or branch cleanup is part of these implementation steps.

## Risks and Mitigations

- **Approval history becomes policy again:** historical review/run documents explicitly cannot authorize future edits; active clauses live only in the prompt, with recorded workflow revision.
- **A clean merge conceals authored fixes:** inspect affected customized paths and account for remerge diff plus later commits before push; tests do not confer authority.
- **Input movement invalidates deliberation:** expected-target check returns to discovery; resumed records require full OID matching, not filename matching.
- **Strict identities break fixtures instead of detecting bugs:** land the canonical fixture preparation first; real production checks never allow local-path shortcuts for tests.
- **Record updates violate cleanliness:** explicit checkpoint ordering before recording/prediction; no blanket staging or guard exemption.
- **Unregistered upstream packages become accidental publication candidates:** inventory separately from validated registry, report ineligibility, and retain explicit scope/destination approval.
- **Release success is mistaken for publication visibility:** read registry and GitHub Release results, bound retries, preserve pending status, never republish blindly.
- **Handbook deletion loses facts or restores obsolete prose elsewhere:** preserve only original factual rows and decision provenance; compare migration values to the pre-deletion Git revision.
- **Workflow breaking message bumps a documentation package major:** keep package-tree changes out of the breaking tooling commits and run the real predictor afterward.
- **Baseline failure is hidden by unrelated work:** operator-approved migration-test correction leads the sequence; historical data is never edited to make it pass.

## Open Questions

None blocks implementation after the recorded planning gate.
Actual conflict choices, transport selection for a missing remote, push/publication approval, and first-release cases are deliberately runtime decisions, not permissions granted by this plan.
No speculative follow-up issue is needed; #28 already owns final policy acceptance and remains open until activation evidence exists.

[#25]: https://github.com/Jopqior/gotgenes-pi-packages/issues/25
[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#28]: https://github.com/Jopqior/gotgenes-pi-packages/issues/28
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
