---
issue: 29
issue_title: "Remove ambiguous core naming and organize fork release tooling by responsibility"
---

# Retro: #29 — Remove ambiguous core naming and organize fork release tooling by responsibility

## Stage: Planning (2026-09-26T16:39:21Z)

### Session summary

Committed the repository-level implementation plan at `docs/plans/f0029-fork-sync-release-tooling.md` in `5e20fad40` after the required fast-forward-only pull reported the checkout current.
Traced evidence recording, strict validation, release calculation, state persistence, correspondence generation, publication callers, and historical note maintenance against their actual implementations.
No implementation, synchronization, push, publication, tag modification, or GitHub mutation occurred.

### Observations

- The operator selected `organization=fork_sync`: shared algorithms under `scripts/release/fork-sync/`, with package configuration and evidence under `scripts/release/pi-subagents/`.
  The inspected algorithms do not depend on subagent runtime behavior; current package literals and registration restrictions are configuration and boundary policy, not a reason to duplicate algorithms.
- The operator selected `docs_coordination=migrate_here`: this issue migrates release guidance, generated correspondence, and their consumers to `docs/release/`; issue 27 deletes the remaining handbook and owns synchronization workflow activation.
  Issue 28's reviewed dispositions remain historical decision evidence, not an active policy source or permission to change unrelated safeguards.
- The briefing explicitly classified CLI/schema/route migration as breaking repository tooling, not a package API or version-calculation change.
  The plan preserves all historical record values and requires regenerating and reapproving old backfill previews rather than inheriting approval across format changes.
- The Tidy-First assessment recommended preparing nested destination support in `test/release/helpers/git-repository.mjs:copyReleaseScripts`.
  The parent verified its current root-only directory creation and added a disposable-source test seam because no nested production release file exists before the move.
  An optional one-caller contribution-validator extraction was not accepted.
- Measured baseline: `pnpm exec vitest run test/release test/upstream-sync` passed 17 files and 229 tests; both registered package predictors exited successfully with no release pending; the generated correspondence check passed.
  The state inventory contained 9 release records and 2 sync records; implementation must re-read it to retain any later additions.
- The plan sequences additive shared modules before an atomic producer/reader/schema/caller cutover, then moves the generated document with all its consumers.
  Existing real-history, remote-network, publication-effect, and byte-preservation tests remain necessary despite new lower-level tests.
- A final plan pass corrected a proposed sibling-isolation mutation: merely rewriting identical bytes would not discriminate, so the specified mutation instead wrongly projects an original package as a fork.
- Scope stays repository-only and publication-free; existing package handbook links remain for issue 27, and historical plans, reviews, rationale strings, and authentic published fixtures are not global rename targets.
  Plan Markdown lint and commit hooks passed.

#### Deferred tidyings

- `test/release/helpers/core-sync-scenario.mjs` and `test/upstream-sync/helpers/upstream-network.mjs`: fixture consolidation would mix single-repository and remote-network lifecycles and is unnecessary for this move.
- `scripts/release/release-correspondence.mjs`: generalizing the supported-fork registry would expand product scope rather than prepare the naming migration.

## Stage: Implementation — TDD (2026-09-27T09:22:41Z)

### Session summary

Completed all five plan steps using a fresh subagent for each step, as requested by the operator: four Red/Green/mutation cycles followed by final verification and handoff.
Shared fork synchronization algorithms, strict version-2 interfaces and evidence, release-owned documentation, and the issue-27 handoff are committed; root tests increased from 459 to 475, with release/upstream-sync tests increasing from 229 to 245.
The final incremental pre-completion reviewer returned PASS after approved corrections to active test terminology and configuration consumption; check, lint, full tests, and dead-code gates passed serially.

### Observations

- Every behavior step ran its planned killing mutations and restored the green files before committing.
  An initial scope mutation had a syntax error rather than a discriminating failure; the step agent corrected it and reran the mutation against the intended behavior.
- The evidence migration preserves the complete pre-cutover document after field translation, including raw rationale content; the historical version-1 fixture and authentic Release fixture were independently verified against Git.
  No tag changes, historical CHANGELOG edits, package version changes, push, synchronization, backfill, or publication were performed.
- A necessary deviation from the predicted unchanged package documentation was the release-table link in `packages/pi-subagents/README.md`, which otherwise pointed at the removed handbook anchor.
  Its separate sync-procedure link remains for issue 27; the README change is inside package release scope, and read-only prediction reports a pending fork patch while the selector has no pending release.
  Publication requires separate approval and was not authorized here.
- Final handoff is recorded in `docs/sync/f0029-to-f0027-handoff.md`, including final paths and remaining handbook-deletion consumers.
  The synchronization procedure, conflict guidance, and log remain owned by issue 27.
- The first pre-completion review returned FAIL for active test variables, titles, and comments still using the old terminology, plus WARN for two Node consumers hardcoding the correspondence path instead of reading configuration.
  The operator approved both corrections; a separate repair agent prepared them, and a fresh reviewer inspected the uncommitted delta before it was committed as `refactor(release): finish fork terminology and path configuration (#29)`.
  Final verdict: PASS, with no remaining findings in the incremental review.
- Parallel full-suite verification during the cutover hit a timeout; serial reruns passed, and subsequent final gates were run serially.
  Broad terminology scans must include prose and camel-case identifiers, not only old module filenames and exported symbols.
- No implementation steps remain; the next workflow is `/ship 29`, with any package publication still subject to explicit approval.

## Stage: Ship (2026-09-27T09:27:29Z)

### Session summary

Started the trunk-lane ship from the root checkout on `main`.
The operator explicitly approved publication of `@jopqior/pi-subagents` to npmjs.org after successful CI; read-only prediction returned `pi-subagents-v4.0.4`.
Remote CI, issue closure, and release verification remain subsequent ship gates at this checkpoint.

### Observations

- Fast-forward-only synchronization succeeded; the checkout had 24 unpushed commits, including the earlier issue-28 documentation work.
  Issue 28 remains open for the issue-27 integration acceptance described in the handoff, rather than closing with issue 29.
- Root `pnpm run lint` and `pnpm fallow dead-code` passed.
- The package README link correction makes `pi-subagents` a release candidate despite the plan's original repository-only expectation.
  No other package path appears in the issue-29 change range.
- There is no peer branch to merge or worktree to remove, no adopted PR close target, and no package roadmap phase to finish.
  The repository-tooling CLI/schema cutover is breaking; the package change is documentation-only.

## Stage: Final Retrospective (2026-09-27T09:39:12Z)

### Session summary

Reviewed the planning, implementation, ship, and child-agent transcripts against the committed plan and stage notes.
The responsibility split and strict interface migration shipped, CI and release workflows succeeded, and issue 29 is closed; the ship transcript records publication of `@jopqior/pi-subagents@4.0.4`.
Issue 27 remains open and consumes `docs/sync/f0029-to-f0027-handoff.md`; issue 28's integration acceptance remains separate.

### Observations

#### What went well

- The Tidy-First assessment found the nested-copy limitation before modules moved, and the first implementation step supplied the fixture seam rather than debugging missing directories during cutover.
  This supported an additive shared-layer checkpoint followed by an atomic producer/reader migration without retaining compatibility aliases.
- Fresh-context review caught acceptance failures that passing tests could not detect: active terminology and an unused configuration value.
  The repair then mutated the configured correspondence path, demonstrating that both Node consumers actually read it rather than merely declaring configuration.
- The release gate distinguished repository-tooling breakage from the package README change and obtained explicit publication approval before dispatching the release.

#### What caused friction (agent side)

- `missing-context`: planning predicted that package documentation would remain untouched, but its recorded reference sweep covered package architecture docs rather than package READMEs.
  `packages/pi-subagents/README.md` still linked to the correspondence anchor being removed.
  Impact: step 4 needed an additional package-file edit and changed the release expectation from repository-only work to a pending package patch; publication was subsequently approved separately.
- `premature-convergence`: cutover and final scans enumerated compound legacy names but missed standalone prose and identifiers such as `coreTagsBefore`.
  Step 5's claim that remaining uses were historical did not survive independent review; `correspondencePath` also existed without its intended production consumers.
  Impact: one additional repair commit, `refactor(release): finish fork terminology and path configuration (#29)`, and an incremental review were required after the planned steps.
- `other` (verification contention): step 3 launched root and workspace tests concurrently, encountered a root-suite timeout, inspected the log, and reran the root suite serially successfully.
  Impact: one extra root-suite run; the transcript does not establish resource contention as the timeout's proven cause.
- `instruction-violation` (self-identified in this retrospective, not user-caught): `docs: record fork sync tooling migration handoff (#29)` bundled test-comment edits with the handoff despite the TDD prompt's instruction to keep fixups out of documentation commits.
  Impact: mixed-purpose commit history; the affected tests are outside package release scope, and no additional package release is attributed to this commit.
  Do not rewrite already shipped history to repair its classification.

#### What caused friction (user side)

- The implementation transcript records a clarification to use a fresh subagent for each step after an initial whole-plan dispatch attempt.
  Stating that granularity alongside the initial execution command would avoid dispatch ambiguity; there is no evidence that the initial attempt changed files.
- The naming repair required another approval interaction for work already demanded by the issue, alongside the separate configuration warning.
  Future briefings can distinguish acceptance-required cleanup from optional design changes so the operator spends attention on the latter rather than re-establishing the goal.

### Diagnostic details

- Model attribution comes from type-unfiltered child transcripts, not agent definitions: the Tidy-First assessor, implementation steps 1 through 5, and repair agent show `openai-codex/gpt-6-sol`; both reviewers show `openai-codex/gpt-6-astra`.
  Parent planning, implementation, and ship turns show `openai-codex/gpt-6-astra`.
  These tasks included provenance and acceptance judgment, not merely formatting; the observed omissions do not establish a model-capability or cost mismatch, so no routing change is proposed.
- Verification was incremental: the parent ran the green baseline before dispatch, child reports record focused tests and killing mutations per behavior step, and both reviewers ran full gates.
  The step-3 transcript directly shows the concurrent test launches followed by a log read and a serial rerun; no prolonged same-error retry chain warrants escalation.
- The missing tools were not the problem: planning used `colgrep`, implementation used exact searches, and an independent reviewer was dispatched.
  The missing search inputs were package README links and the short legacy term across prose and compound identifiers.
- Primary transcript files under `~/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/` are `2026-09-26T16-25-30-174Z_01a0de89-393e-751e-a218-7f3af1c690e7.jsonl`, `2026-09-27T07-53-46-956Z_01a0e1db-16cb-7553-8f3e-3f982ef89312.jsonl`, and `2026-09-27T09-24-18-776Z_01a0e22d-f8d7-745a-be12-43a53c499545.jsonl`.
  Child transcripts were located with `list_subagent_sessions` and read separately.

### Proposed adjustment

Extend the existing rename guidance in `.pi/skills/edit-tool/SKILL.md` with a short-term search and explicit classification of historical matches before declaring a terminology migration complete.
The skill already loads for symbol renames; this belongs beside its prose-verification rule, not in always-loaded `AGENTS.md`.
Retain existing guidance rather than create another rename checklist or a new skill.

Do not add a universal serial-testing rule from a single timeout, duplicate existing commit-type rules, or change model selection without comparative evidence.
No broader implementation work or new issue is proposed.

### Changes made

1. Appended the cross-session retrospective to `docs/retro/f0029-fork-sync-release-tooling.md`, including concrete rework, verification sequencing, observed model attribution, and the completed ship outcome.
2. Recorded the operator's decision to persist observations only after explaining the proposed rename guidance and its placement.
   No skills, prompts, `AGENTS.md`, code, or tests were changed; the proposed skill addition was not adopted.
3. Confirmed that issue 27 remains open and is the next dependency-linked task; consume `docs/sync/f0029-to-f0027-handoff.md` when planning its unified synchronization workflow.
