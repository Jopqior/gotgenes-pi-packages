---
issue: 30
issue_title: "refactor(repo): move upstream synchronization into the standard issue workflow"
---

# Upstream synchronization through the standard issue lifecycle

## Release Recommendation

**Release:** ship independently

This repository-scoped change is not a package roadmap step or release batch.
The `pi-subagents` README correction is release-scoped documentation; predict its effect at ship time and obtain explicit package, scope, and destination approval before publication.
Keep breaking repository-tooling commits separate from the package documentation commit so workflow changes do not imply a package API major release.

## Problem Statement

The dedicated synchronization prompt combines discovery, compatibility decisions, integration, recovery, review, pushing, and publication in one session.
Its separate approval and execution records duplicate the standard issue lifecycle and make session handoffs harder.
The issue reports an abandoned synchronization where unresolved conflicts and repeated decisions interrupted validation and review; this plan addresses the workflow structure, not a newly reproduced runtime defect.

## Goals

- Make `/upstream-sync` a small, no-argument issue-creation entry point that queries upstream, reuses an exact-target issue, and stops.
- Plan each real synchronization against a fixed upstream commit, with compatibility decisions agreed before implementation and materially new decisions returned to the operator.
- Use standard issue, plan, retro, independent review, `/ship`, and `/retro` artifacts across separate sessions.
- Preserve genuine two-parent integration on the root checkout's `main`; use the standard trunk landing path, never rebase or squash the integration.
- Separate explicit safe fetching, local pinned-target merging, and reviewed evidence recording in the existing script.
- Delete `docs/sync/` without deleting historical plans/retros or changing release evidence, version policy, or published history.
- Classify the new command meaning, removed implicit fetch, and mandatory merge target as **breaking repository-tooling/workflow changes**; package runtime and public API contracts remain unchanged.

## Non-Goals

- Perform an actual upstream synchronization, create its issue, configure real remotes, push, dispatch publication, or modify live release state while implementing this refactor.
- Add a synchronization orchestrator, approval ledger, replacement handbook, custom runtime service, or generic GitHub issue framework.
- Support upstream integration through feature worktrees; their existing rebase/fast-forward lifecycle remains intact.
- Change release registration, version derivation, correspondence schemas, first-publication procedures, or backfill policy.
- Reopen the completed deliberation in [#28], restore its rule-by-rule approval machinery, or use the historical [#27] plan as a prerequisite for future work.
- Broaden ordinary issue closure, release recovery, or worktree tooling beyond the minimal synchronization handoffs below.
- Change selector behavior requested by [#26]; the open release-related search also returned that separate package feature.

## Background

### Existing implementation and history

The issue author and authenticated user are both `Jopqior`.
The operator confirmed repository scope, root/main trunk integration, and explicit script operations during planning.
No fork or fallback issue-30 plan/retro existed.
The upstream-related open issue search found only this issue; the fork open-PR sweep returned none.
The newest triage, `docs/triage/2026-09-18-backlog.md`, is inherited upstream context, not a fork issue-30 prioritization record.
The package architecture contains no release-batch entry for this change.

Issues [#27] and [#28] are closed and their comments describe the installed dedicated workflow; [#29] is closed and its release-tooling reorganization is present.
The introduction of the dedicated prompt traces to `feat!: require approval for uncovered upstream integration changes (#27)`.
Its plan and retro distinguish release evidence from human authorization; this distinction stays, while the separate synchronization workflow and records are intentionally retired.
The release policy's merge requirement is not an incidental approval-workflow rule and must remain.

### Concrete seams

- `scripts/upstream-sync.sh` currently runs remote setup, main fetch, tag comparison, ahead/behind output, and advertised-release discovery before every operation.
- Its optional `--expected-upstream` compares against a newly fetched tip; even an approved older commit cannot be merged after upstream advances.
- `check_merge_preconditions` rejects non-main branches, unsupported fork identity, dirty tracked state, merges, and rebases; it does not currently distinguish a linked worktree from the primary checkout.
- `recordForkSync` in `scripts/release/fork-sync/record.mjs` verifies the merge's parents, ancestry, release manifest, upstream continuity, and resolution contribution.
- The recorder queries `git ls-remote --tags upstream`, selects a contained stable release from locally present objects, and writes `sync-state.json`; it does not itself fetch main.
- `/ship` already has a trunk path with no landing merge, but its stacked-release step derives a package from the plan path and its history scan can mistake incoming upstream issue references for fork work.
- `test/upstream-sync/helpers/upstream-network.mjs` supplies real isolated Git repositories, canonical remote identities, transport redirection, and invocation logs.
- The generated correspondence document already points to the release guide and contains no retired workflow dependency.

AGENTS.md's explicit fork targeting, prohibition on upstream tag imports, pnpm-only tooling, and independent publication approval remain applicable.
The `pi-subagents` README's minimal-core Non-Goals do not conflict with this repository maintenance change.

## Design Overview

### Responsibility boundaries

| Owner                             | Responsibility                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/upstream-sync`                  | Query one upstream target, find or create its fork issue, return the issue and stop                               |
| `/plan-issue`                     | Inspect that fixed target, agree compatibility work, write ordinary plan and retro                                |
| `/tdd-plan` or `/build-plan`      | Execute the approved plan, complete the merge, verify, record evidence, obtain independent review                 |
| `/ship`                           | Push the reviewed trunk result, verify exact-SHA CI, close fork work, release only approved registered candidates |
| `scripts/upstream-sync.sh`        | Explicit low-level Git operations and recorder invocation, never push or publish                                  |
| Release guide and releasing skill | Evidence semantics, version derivation, publication and recovery rules                                            |
| Issue, plan, retro, Git           | Decisions, completed checkpoints, remaining work, and actual merge identity                                       |

The design-review checklist found no new shared interface, dependency bag, output parameter, reset family, parameter relay, or production import edge.
Keep mode selection in the existing shell dispatch and release classification in its existing owner.
The narrow test preparation helper returns a resolved commit rather than mutating a caller's bag; the production command under test remains explicit at each call site.
No extraction of release algorithms or generic workflow layer is warranted.

### Issue creation, not integration

Use an ordinary prompt template with inherited model selection and no deterministic pre-LLM mutation.
Reject nonempty arguments as data before effects.
Load the existing GitHub-writing, git-workflow, and roadmap-fit skills when their normal triggers apply; repository scope does not invent a package roadmap.

1. Verify the GitHub CLI repository with `gh repo view --json nameWithOwner`; every write still names `--repo Jopqior/gotgenes-pi-packages`.
2. Query `gh api repos/gotgenes/pi-packages/commits/main --jq .sha` and validate a full lowercase GitHub commit SHA before constructing commands.
3. Enumerate fork issues across **all states and pages**, excluding PRs, and compare an exact body line: `Upstream target: gotgenes/pi-packages@<full SHA>`.
   Use the REST issues endpoint with `--paginate`, not an open-only search or abbreviated-SHA/title substring.
   Normalize CRLF line endings for the exact comparison.
   Search all fork issues rather than relying on a mutable label to find a previously created one.
4. If found, return the matching issue URL and state without creating or reopening it.
   For multiple existing matches, report them and stop rather than choosing another new issue.
   A closed match stays closed; a residual request requires the normal separate operator decision.
5. Otherwise write an English issue body to a temporary file using the file tool, retaining the exact target line, upstream commit URL, root/main landing requirement, and acceptance criteria for compatibility review, merge evidence, checks, and standard lifecycle handoffs.
   Recheck for an exact match immediately before `gh issue create --repo Jopqior/gotgenes-pi-packages --label scope:repo --title <title> --body-file <file>`.
   Resolve the issue number from the command result; do not guess it.
6. Print the URL and `/plan-issue <number>` and end the entry-point session.
   No conflict analysis, fetch, script execution, implementation, push, release, or automatic invocation of planning follows.

A failed query or incomplete pagination blocks creation.
After an ambiguous create failure, query again before considering a retry; never automatically repeat the mutation.
GitHub issue creation has no atomic unique-key facility here: the final recheck mitigates ordinary duplicates, but concurrent independent creators remain a reported limitation rather than a reason to add a locking service.

### Explicit script interface

| Invocation                                                           | Behavior                                                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| No arguments or `--help`                                             | Help, successful exit, no Git mutation or network                                                                                        |
| `--fetch [--upstream-protocol ssh\|https]`                           | Validate/setup upstream, configure no-tags/disabled push, fetch the explicit main refspec, compare full tag mappings, print status       |
| `--merge --expected-upstream <full OID>`                             | Validate root/main, remotes and clean operation state; resolve and merge the already-present approved commit; no fetch or release query  |
| `--record-fork-sync <merge> --fork-level <level> --rationale <text>` | Validate preconditions/remotes, invoke the existing recorder, verify tag preservation; no main fetch or status/release-summary discovery |

Retain explicit protocol selection for a missing upstream remote where setup is allowed; specifying it alone is not a fetch operation.
Reject conflicting/repeated modes, review flags outside recording, missing values, abbreviated or malformed merge OIDs, wrong object-format lengths, and an expected target without merge mode before effects.
Keep existing remote identity acceptance, mismatch refusal, no silent URL rewriting, tracked cleanliness, and in-progress merge/rebase checks.
Add a primary-checkout guard for merge/record using Git directory/common-directory identity, with a linked-worktree test; checking only the branch name is insufficient.
No worktree launcher change is needed: the planning/execution instructions and low-level guard reject unsupported integration locations.

Fetch keeps `git fetch --no-tags upstream +refs/heads/main:refs/remotes/upstream/main`, independent of `remote.upstream.fetch`.
Keep advertised-release/status output confined to fetch; it never selects the later merge target.
The merge target must resolve locally to that exact commit and be an ancestor of the locally fetched `upstream/main`.
It need not equal the tracking tip: an intervening ordinary upstream advance does not revoke the fixed plan.
A missing object/ref or rewritten history that excludes the target stops with an explicit fetch/replanning diagnostic, not a different target.
Retain already-contained no-op, fast-forward-only refusal, unrelated-history refusal, and genuine divergent `--no-ff` merge with exact first and second parents.
On conflicts, preserve Git's merge state and refer to the issue's implementation plan and retro; remove the instruction to resume the retired execution prompt.

Recording remains online for release lookup and continues to require the local objects and tracking ancestry its evidence contract already validates.
Do not introduce an automatic object-recovery fetch or weaken the missing-object errors.
Update their recovery examples to explicit `--fetch`.
Preserve tag-name/object checks around fetch, including failed fetches; for recording, call the recorder without `exec`, capture its status, and compare mappings after success or failure before returning.
This makes the recording check surround the remaining online operation, rather than silently removing it with the old fetch.
On drift, report and stop without deleting/restoring tags or committing evidence; a possible state write must be inspected, not automatically rolled back.
Merge has no network operation and must leave tag refs unchanged, pinned by tests.

### Standard lifecycle handoffs and topology

`/plan-issue` explicitly accepts `scope:repo` and writes root plans/retros without requiring a fictional package label.
For actual upstream-target issues, require root checkout/main, preserve the issue's target, perform safe explicit fetching for inspection, and record the fixed target in Design Overview.
Inspect the actual common-base diff and incoming package changes, fork identity/changelog handling, compatibility choices, evidence feasibility, and validation commands before finalizing the plan.
The plan, not a resurrected standing rule list, carries the approved compatibility work.
If the target includes unreleased package changes that the recorder would reject, stop and report the release-policy blocker; do not quietly choose a newer release/commit.

Execution templates recognize root plans as repository or cross-package work and use root test commands where appropriate.
Their synchronization-specific addition requires the pinned plan, root/main, completed conflict resolution before validation/reviewer dispatch, actual merge-parent verification, committed reviewed integration changes, then evidence recording and an evidence commit before the final review/ship handoff.
Plans without new red/green tests may use `/build-plan` for the integration steps; plans with test cycles use `/tdd-plan`.
On a resumed unresolved merge/rebase, stop ordinary startup pulls and baseline/reviewer execution; recover against the issue plan and actual Git state with operator decisions before continuing.
This is a short operation-state guard before existing startup synchronization, not a general resume engine or authorization log.
A clean completed checkpoint continues through the existing fast-forward-only pull behavior; divergence remains a stop, never an automatic rebase.

The final implementation retro records the planned upstream target, actual merge OID, reviewed fork contribution, evidence commit, checks/reviewer result, and next action using ordinary stage notes.
Independent review covers automatically merged fork customizations, the remerge diff, and post-merge commits, not just textual conflicts.
Materially new choices are confirmed before affected edits and recorded in ordinary issue artifacts.

`/ship` needs only these bounded integrations:

- Recognize a synchronization issue/plan as trunk-only and reject a detected feature-worktree lane for it.
  Clarify that the generic nonlinear-landing prohibition applies to feature branch landing, not the already-committed genuine upstream merge.
- Before pushing a synchronization, verify its recorded merge is reachable from HEAD with the planned second parent, completed review/evidence, clean tracked state, and no unmerged entries.
  Ship does not create or rewrite the merge or manufacture missing evidence.
- Resolve candidate packages once from the actual integration/implementation range and the existing release registry, not the root plan directory name.
  Report incoming unregistered packages as not publication-eligible, without treating inherited npm identities as authorization or running them through a failing first-release predictor.
  Registered changed candidates use `next-version.sh`; preserve nonzero/error versus empty/no-release semantics and reuse the list in stacked-release checks and dispatch.
- Use the verified merge's first parent as the synchronization integration-range anchor; include follow-up changes through HEAD.
  Close the synchronization issue, not upstream issues whose numbers happen to appear in incoming commits or plans.
  For this path, consider additional fork close targets only when explicitly identified in the fork plan/retro and verified against the fork tracker; do not apply the unrestricted incoming-history co-shipped scan.
- Verify origin fetch/push destination and use `git push origin main`; use explicit fork repository targeting for mutations and verify wrapper-tool targeting.
  Keep CI on the exact pushed SHA, separate publication approval, and releasing-skill recovery/completion checks.
  Replace step 11's stale unconditional failed-prepare retry advice with a pointer to that existing owner; do not duplicate the removed sync prompt's release state machine.

Ordinary package issues retain their standard worktree and trunk paths.
This issue itself is the workflow refactor, not an upstream-target synchronization, so its implementation does not acquire permission to merge upstream.

### Retiring documents without erasing history

Delete the tracked `docs/sync/reviews/f0028-sync-approval-policy.md` and every tracked `docs/sync/runs/` entry.
Do not migrate their contents into another large required artifact.
Keep historical plans and retros, including their historical code-span path mentions.
The real relative Markdown link in `docs/plans/f0028-sync-approval-policy.md` must instead point to the deleted document at a resolved pre-deletion Git commit on GitHub, with historical labeling; preserve its decision text.
Existing inline path mentions in historical plans/retros are not active loaders and need no mass rewrite.
Update active entry-point prose to issue creation and the standard lifecycle.
Retain the release guide; retain the generated correspondence document unchanged unless a genuinely stale prose reference is found outside its generated region.

## Module-Level Changes

| File                                                                                         | Change                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `.pi/prompts/upstream-sync.md`                                                               | Replace execution workflow with small query/deduplicate/create/stop prompt and executable query snippets                            |
| `scripts/upstream-sync.sh`                                                                   | Explicit modes, mandatory local pinned merge, root guard, independent recording, revised diagnostics                                |
| `test/upstream-sync/helpers/upstream-network.mjs`                                            | Add narrow explicit fetched-input preparation; update refusal hint and bounded tag-fault trigger for recording                      |
| `test/upstream-sync/merge.test.mjs`                                                          | Migrate ordinary setup separately; cover explicit modes, pinned ancestor, no merge fetch, root/main and preserved safeguards        |
| `test/upstream-sync/record-fork-sync.test.mjs`                                               | Migrate merge setup including direct conflict call; replace main-fetch expectations and exercise recorder-boundary tag preservation |
| `test/upstream-sync/issue-entry.test.mjs` (new)                                              | Execute actual prompt snippets with a fake `gh`; test exact-target lookup and creation boundary                                     |
| `test/upstream-sync/workflow-contract.test.mjs` (new)                                        | Small structural contract checks and executable read-only command examples; no full prompt snapshots                                |
| `scripts/release/fork-sync/record.mjs`, `scripts/release/fork-sync/evidence.mjs`             | Explicit-fetch recovery wording only; algorithms and exports unchanged                                                              |
| `.pi/prompts/plan-issue.md`                                                                  | Repo-scope handling and bounded fixed-target planning requirements                                                                  |
| `.pi/prompts/tdd-plan.md`, `.pi/prompts/build-plan.md`                                       | Root-plan/test-command support and bounded synchronization execution/completion guards                                              |
| `.pi/prompts/ship.md`                                                                        | Trunk topology exception, evidence check, registered candidates, fork-only close scope, explicit destinations, reuse release owner  |
| `AGENTS.md`, `README.md`                                                                     | Replace retired workflow pointers; retain root/main and tag safeguards                                                              |
| `.pi/skills/releasing/SKILL.md`                                                              | Replace synchronization entry-point ownership, retain release/evidence policy                                                       |
| `.pi/skills/package-pi-subagents/SKILL.md`                                                   | Update both integration and verification references                                                                                 |
| `docs/release/fork-sync.md`                                                                  | Standard lifecycle and explicit operations, preserve policy and evidence role                                                       |
| `packages/pi-subagents/README.md`, `packages/pi-subagents/docs/architecture/architecture.md` | Correct upstream relationship/navigation prose, separate package docs commit                                                        |
| `docs/plans/f0028-sync-approval-policy.md`                                                   | Historical link repair only                                                                                                         |
| `docs/sync/`                                                                                 | Delete tracked review and run artifacts                                                                                             |
| `docs/retro/f0030-standard-upstream-workflow.md`                                             | Ordinary stage handoffs                                                                                                             |

Predicted unchanged: `scripts/release/pi-subagents/sync-state.json`, `docs/release/pi-subagents-correspondence.md`, release registry, release preparation/publication/version algorithms, all manifests/changelogs, lockfile, and package runtime/tests.
The current correspondence document already has release-owned navigation and no sync-workflow link.
`test/release/fork-sync-migration.test.mjs` should remain unchanged because the retained recorder/help names and schema are unchanged; rerun it to falsify that prediction.
No package roadmap completion marker, module tree change, or runtime diagram change is required.

## Test Impact Analysis

The change enables direct tests of a previously inseparable operation boundary: fetch, pinned merge, and record can each be observed independently through subprocess invocations.
Existing real-Git topology, conflict, identity, cleanliness, tag-collision, release selection, idempotence, and evidence validation tests remain valuable and must stay.
Tests asserting a redundant fetch in merge/record must change in the same commit as that behavior; they cannot be retained as compatibility requirements.
Tag-fault cases attached to merge's removed fetch move to explicit fetch; recorder cases inject at its remaining release-query boundary rather than retaining a dead fetch trigger.
No release-library tests become redundant and no large test-file rewrite is planned.

Entry-point tests execute the real fenced bash snippets with controlled `gh` responses and invocation logs, not a second copy of the algorithm.
Use a narrowly identified fence/block rather than introducing a general Markdown parser.
Cover exact open and closed matches, matching issue on a later page, unrelated/short/prefix SHA text, PR exclusion, CRLF, null body, malformed target, query failure, no match, final pre-create recheck, create failure, and forbidden integration commands.
Synthetic positive fixtures specify the new contract; they are not a reproduction of the reported abandoned session.
Static prompt checks pin required handoff destinations and absence of retired loaders, but do not claim to enforce an agent's semantic compliance.
Review the lifecycle manually with scenarios for dirty startup, unresolved merge, clean checkpoint resume, upstream advance, missing evidence, unregistered incoming package, no release, publication declined, failed CI, and failed/partial release preparation.

### Planning-time verification

Measured against the existing checkout, without fetching or merging upstream:

| Command/surface                                                       | Observed result                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `git pull --ff-only`                                                  | Already up to date                                                                                           |
| `gh repo view --json nameWithOwner`                                   | `Jopqior/gotgenes-pi-packages`                                                                               |
| `gh api repos/gotgenes/pi-packages/commits/main --jq .sha`            | Full target returned; query only, not authorization for this refactor to integrate it                        |
| Paginated REST fork issues lookup with exact target-line comparison   | Successful query, no matching issue                                                                          |
| `gh api --help`, `gh issue create --help`                             | Pagination, jq filtering, explicit repository, label, and body-file options confirmed; creation not executed |
| `bash scripts/upstream-sync.sh --help`                                | Existing interface confirmed; new `--fetch` is planned, not claimed to exist yet                             |
| `node scripts/release/correspondence-table.mjs --check`               | Exit zero                                                                                                    |
| `pnpm exec vitest run test/upstream-sync test/release`                | 20 files and 334 tests passed                                                                                |
| Validated registry reader and both registered `next-version.sh` calls | Registry identities validated; neither package currently needs release                                       |

The exact candidate lookup exercised during planning was:

```bash
set -euo pipefail
TARGET=$(gh api repos/gotgenes/pi-packages/commits/main --jq .sha)
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]]
gh api --paginate 'repos/Jopqior/gotgenes-pi-packages/issues?state=all&per_page=100' --jq ".[] | select(.pull_request == null) | select(((.body // \"\") | split(\"\n\") | map(rtrimstr(\"\r\")) | index(\"Upstream target: gotgenes/pi-packages@$TARGET\")) != null) | {number,state,html_url}"
```

Implementation must preserve full-query success before interpreting empty output as no match.
Mutation commands are tested only against isolated Git repositories or a fake GitHub CLI, never the real fork during this refactor.
The planning session did not replay the abandoned synchronization or establish a runtime root cause beyond the inspected workflow ordering.

## Invariants at risk

| Constituency/invariant                                                             | Existing or planned pin                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fork maintainers: no imported/retargeted/deleted local tags                        | `merge.test.mjs` fetch-protection cases; retain at explicit fetch and add recorder-boundary cases      |
| Release consumers: real merge and exact upstream parent                            | Existing two-parent/topology tests; add pinned ancestor after upstream advance                         |
| Maintainers: unsupported identities and dirty/in-progress state fail before writes | Existing preflight groups with valid target setup; add primary-checkout rejection                      |
| Published consumers: evidence and historical rationale remain unchanged            | Opened `fork-sync-migration.test.mjs` ordered historical-prefix assertions and unchanged state diff    |
| Release consumers: selected release belongs to incorporated history                | Existing recorder tests and full release suite; no newest-tip substitution                             |
| Session operators: validation/review never starts on unresolved integration        | New workflow contract plus scenario walkthrough; distinguish this prose guard from runtime enforcement |
| Fork tracker: incoming upstream issue numbers are not fork close targets           | Synchronization-specific ship scenario with colliding issue numbers                                    |

There is no claimed latency or token-budget improvement measurement.
The architectural result is fewer workflow owners, not a predicted numerical performance gain.

## TDD Order

1. **Prepare fetched inputs explicitly without changing production behavior.**
   Add `prepareFetchedUpstream(work, upstreamBare)` to the existing test network; use real Git with the canonical no-tag refspec and return the locally resolved target.
   Migrate ordinary merge, topology, conflict and precondition tests to supply the supported `--expected-upstream` argument, including recording's `mergeUpstream` and direct conflict setup.
   Leave fetch-specific, missing-input, drift and tag-injection cases for the behavior steps.
   This accepted Tidy-First preparation prevents missing-argument failures from masking the guards under test; do not hide the production act inside a compatibility wrapper or change `materializeNetwork` defaults.
   Verify both sync suites remain green; the new preparation pin must fail if its fetch refspec maps to a different tracking ref, and the topology pin must fail if the production merge targets `HEAD` instead of the supplied upstream OID.
   Commit: `test(repo): prepare fetched upstream inputs explicitly (#30)`.

2. **Separate explicit fetch and pinned merge from recording discovery.**
   Red: add no-argument/help no-effects, invalid mode/target, missing local commit, target outside upstream ancestry, approved ancestor after a newer fetch, no-network merge, and linked-worktree rejection cases.
   Green: introduce `--fetch`, require the merge OID, move fetch/status/discovery into its own branch, and dispatch record without that common fetch.
   Update all affected old default-fetch/merge/record expectations in this commit so it remains green; retain record's required remote release query and clean-tree checks.
   Keep the tag comparison around explicit fetch, capture recording status rather than `exec`, and migrate recorder tag-injection tests to the query boundary in the same commit.
   Update conflict/refusal and missing-object diagnostics and the helper's refusal string.
   Killing mutations: make no-argument dispatch select fetch (help/no-effects); resolve merge target from `upstream/main` (approved-ancestor case); insert a fetch in merge/record (invocation-window cases); remove the ancestry guard (out-of-history target); remove primary-checkout guard (linked-worktree case); skip final tag comparison (add/delete/retarget cases); ignore recorder exit status (failed-record case).
   Existing precondition assertions must continue naming their actual reason rather than merely asserting nonzero status.
   Verify `pnpm exec vitest run test/upstream-sync test/release`, `bash -n scripts/upstream-sync.sh`, help, and `pnpm run check`.
   Commit: `feat(repo)!: separate upstream fetch, pinned merge, and recording (#30)`.
   Footer: `BREAKING CHANGE: Upstream fetching requires --fetch; merging requires --expected-upstream with a fetched full commit OID. Merge and recording no longer refresh upstream/main implicitly.`

3. **Replace the dedicated workflow with issue creation and standard lifecycle handoffs.**
   Red: add executable snippet tests for the entry-point equivalence classes and focused workflow contract tests.
   Green: replace the prompt, apply the bounded plan/execution/ship changes above, update root and skill/release-guide entry points, remove `docs/sync/`, and repair the historical link in the same commit.
   Resolve the historical-link commit from Git during implementation; do not author an approximate hash.
   Test the actual create command against fake `gh`, asserting exact fork, `scope:repo`, body target, and stop boundary; no real issue is filed here.
   Killing mutations by class: replace exact-line equality with a substring match (near-match); remove all-state or pagination options (closed/later-page); drop PR exclusion (PR); omit CRLF normalization (CRLF); ignore query status (failure); bypass the found-match branch or final recheck (dedupe); change create repository/label (destination); add an integration command after creation (stop boundary).
   For static workflow pins, remove the pinned-target handoff or restore the retired record-loader line and confirm the corresponding contract case fails; these only test the text contract.
   Run the manual scenario table, focused tests, root lint, and correspondence check; clear rumdl's path-dependent cache after deletion before trusting link checks.
   Commit: `feat(repo)!: route upstream synchronization through issues (#30)`.
   Footer: `BREAKING CHANGE: /upstream-sync now only finds or creates a pinned-target synchronization issue. Plan, implement, review, and ship through the standard issue lifecycle; docs/sync is retired.`

4. **Update package navigation without implying runtime breakage.**
   Change the `pi-subagents` README and architecture relationship prose to describe the issue-creation entry point and standard lifecycle.
   No new runtime tests; verify active references across the package docs and `.pi/skills/`, then run root lint and the existing focused suites.
   Commit: `docs(pi-subagents): describe issue-based upstream integration (#30)`.
   Keep this commit separate from the repository `!` commits.

5. **Verify the completed handoffs and obtain independent review.**
   Confirm release state, generated correspondence region, schemas, manifests, lockfile, changelogs, and historical plan/retro decision text have no unintended diff.
   Run `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm fallow dead-code`, correspondence check, and `git diff --check`.
   Dispatch the standard fresh-context pre-completion reviewer over acceptance criteria, real script/CLI tests, and the manual cross-session scenarios; disclose that prompt compliance is not runtime-enforced.
   Address findings within agreed scope, asking before materially new decisions.
   Append implementation observations and verification to the normal retro and commit them as `docs(retro): add implementation stage notes for issue #30`.
   Hand off to `/ship 30`; do not run the next upstream synchronization.

No adopted third-party mechanism needs a co-author trailer; the source proposal and operator decisions are the maintainer's own.

## Risks and Mitigations

- **False-green preflight tests:** a mandatory new argument can make every invalid-remote test fail for the wrong reason; prepare valid inputs first and assert exact reasons and absence of side effects.
- **Dead tag-fault probes:** the current fault injector fires only after fetch; move recording probes to its actual online boundary and keep fetch probes on explicit fetch.
- **Lost merge provenance:** worktree rebasing changes merge identity/topology; prohibit that route, pin both parents, and commit evidence before review/ship.
- **Accidental latest-tip integration:** permit a planned ancestor but always pass its exact OID to merge; newer tips are discovery only.
- **Scope creep through workflow prose:** replace owners and add short conditional requirements in existing lifecycle steps, not another sync-sized mandatory document.
- **Unregistered incoming packages:** report them but do not publish, register, or attempt a first release implicitly.
- **Upstream issue-number collisions:** constrain synchronization closure to verified fork targets rather than incoming commit messages or inherited plans.
- **Stale session prompt expansion:** implement and smoke-test the changed slash command in a fresh Pi session; the current process is not proof of the new entry point.
- **Deleted historical links:** retain Git-addressable provenance without rewriting the old decisions or retaining a second active approval source.
- **Partial recording or release failures:** stop and inspect actual writes; reuse the existing release owner rather than claiming a failed command implies no effects.

## Open Questions

None block implementation after the operator's scope/landing and CLI decisions.
Actual future synchronization compatibility choices and publication approval belong to that future issue and its plan, not this refactor.
No concrete follow-up issue was identified or filed.

[#26]: https://github.com/Jopqior/gotgenes-pi-packages/issues/26
[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#28]: https://github.com/Jopqior/gotgenes-pi-packages/issues/28
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
