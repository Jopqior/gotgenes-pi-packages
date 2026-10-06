---
issue: 36
issue_title: "Support worktrees fork release evidence and upstream synchronization"
---

# Retro: #36 — Support worktrees fork release evidence and upstream synchronization

## Stage: Planning (2026-10-05T12:52:16Z)

### Session summary

Committed the repository-scoped implementation plan at `docs/plans/f0036-worktrees-fork-release-support.md` in `6833517f0`.
Verified the independent worktrees upstream baseline against real Git objects and production evidence checks, inspected the release/synchronization consumers, and completed fresh-context exploration and Tidy First assessment.
No implementation, real evidence update, registration, synchronization, push or publication occurred.

### Observations

- The operator chose `0.1.0` as the initial fork version and an artifact-only generator writing a fresh external candidate directory.
  These decisions do not authorize first publication or a release dispatch.
- Support exactly core and worktrees through a fixed selector, retaining the core default and existing schema/config export.
  Keep the actual registry unchanged until issue #37 migrates the real manifest; that issue also owns runtime compatibility, artifact application and publication handoff.
- Real worktrees upstream `0.3.3` resolves to `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, contained in the existing integration's second parent `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`.
  Production ancestry/version/tail checks succeeded; no worktrees-scoped unreleased tail or upstream-to-HEAD fork changes were found by the recorded commands.
  Revalidate the actual incorporated merge/release when preparing issue #37's candidate.
- First release cannot use the current previous-fork compare-heading requirement.
  Plan a strict exact release-tag URL heading, no invented previous tag, and preserve inherited CHANGELOG bytes while generating correspondence/state/view consistently.
- Accept preparatory recorder-boundary tests and returned upstream-selection extraction, preserving release/version → continuity → tail diagnostic order.
  Also accept narrow published-artifact registration and network fault-injection parameterization; the current drift trigger otherwise matches only the core query.
- The baseline `pnpm exec vitest run test/release test/upstream-sync` passed 22 files and 401 tests.
  Core/model-selector prediction remained quiet, the core table check passed, and worktrees prediction correctly refused its missing first tag.
- Historical backfill stays core-specific and unchanged; there are no existing worktrees fork Releases to backfill.
  The final implementation must verify selected-package isolation and run the normal fresh-context pre-completion review before ship.

#### Deferred tidyings

- Keep `test/release/helpers/fork-sync-scenario.mjs`, `release-artifacts.mjs` and `test/upstream-sync/helpers/upstream-network.mjs` as separate lifecycle fixtures rather than a universal factory.
- Do not reorganize the large decision/merge test files, rewrite CLI parsers, add a generic script-copy bundle, expand backfill or extract the entire CHANGELOG fence scanner for this change.

## Stage: Implementation — TDD (2026-10-05T16:58:43Z)

### Session summary

Completed all eight planned TDD/characterization cycles as separate commits, with a fresh implementation subagent for each step and parent inspection at each handoff.
Implemented independently selected worktrees prediction, recording, artifact preparation/publication preflight and an external first-release candidate generator while retaining core defaults and original-package behavior.
Root tests increased from the measured baseline of 677 to 880 (+203); final collection contains 41 files, including 604 release/sync tests.

### Observations

- Startup confirmed clean primary `main`, no pending merge/rebase and an already-up-to-date fast-forward-only pull.
  Starting `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` all passed.
  The same root gates passed after implementation and in independent pre-completion review.
- Each step ran its focused Red or current-behavior characterization, then Green and the planned killing mutations before committing.
  The recorder extraction retained release/version validation before continuity, and continuity before unreleased-tail rejection.
  Green copies were saved separately before mutations and restored before final verification.
- No substantive design deviation occurred.
  Focused `worktrees-prediction.test.mjs`, `multi-fork-release.test.mjs`, `upstream-release.test.mjs` and `first-fork-release.test.mjs` hold the added contracts rather than distributing every assertion across the large existing suites.
  Existing correspondence, table, history, migration and core-only backfill suites remained in the verification set even where their files needed no edit.
  Actual script import paths required target/config copy-list updates but no copied recorder-selector dependency.
- Missing recording review inputs now reject before remote/config effects; an existing dirty-precondition fixture was updated to provide its explicit review.
  Independent fork baselines and full unselected manifest/CHANGELOG/state/view bytes were used to distinguish routing rather than equal-valued evidence.
- Intermediate parallel release/sync runs encountered an existing recorder-case timeout.
  Affected files passed alone and the full release/sync suite passed with one worker; no timeout configuration was changed.
  Final full root tests and the independent review did not reproduce the timeout.
- First CHANGELOG insertion preserves inherited header/disclosure bytes and the historical suffix while keeping first Release notes bounded to the reviewed summary and generated provenance.
  The worktrees scaffold's marker-external unreleased statement was made conditional so a projected released view does not carry a stale claim; the managed region remains empty in the real checkout.
- The implemented interface is `node scripts/release/prepare-first-fork-release.mjs --repo <primary-checkout> --package pi-subagents-worktrees --version <explicit-stable-version> --merge <completed-incorporated-merge> --notes <reviewed-summary-file> --output <fresh-external-directory>`.
  Every input is required; the output parent must exist, and there is no default version or apply/publish/dispatch mode.
  Issue #37 supplies the already selected `0.1.0` after committing its actual migration and registration.
- The external candidate's exact application set is `packages/pi-subagents-worktrees/package.json`, `packages/pi-subagents-worktrees/CHANGELOG.md`, `scripts/release/pi-subagents-worktrees/sync-state.json` and `docs/upstream/pi-subagents-worktrees-release-correspondence.md`.
  Its `first-fork-release.json` records `sourceHead`, selected merge, tag/version, incorporated upstream evidence and `applicationFiles`; retain this transient review manifest externally.
  Issue #37 must revalidate source HEAD and candidate bytes, run its packing/compatibility checks, apply and commit the reviewed set together, and obtain separate scope/destination approval before tagging or publication.
- The actual worktrees state remains schema 2 with empty `releases` and `syncs`; the real registry, all package files, core state/view, ordinary prompts, lockfile/workspace YAML, global cliff configuration and publication workflows/scripts were compared against the starting checkpoint without differences.
  No real first artifacts, release rows, tags, integration, push, npm publication or GitHub mutation occurred.
  Real core/selector prediction stayed quiet; worktrees prediction still refuses its missing first tag and its selected table command refuses missing registration.
- Pre-completion reviewer: PASS, with no warnings or required fixes, for `405b7675aa859f5186388bf03f61e4abc48013fd..b915938a055043b8382d38e88b34ac17b8009b5e`.
  The reviewer independently ran the root gates and re-derived routing, ancestry, exact-heading, no-effects and approval boundaries.
  Next action is `/ship 36` on `main`; shipping repository support does not authorize package publication, and issue #37 remains the migration/first-publication handoff.

## Stage: Ship (2026-10-06T02:06:41Z)

### Session summary

Confirmed the primary checkout on `main` and the trunk lane, read the complete plan and retro, and completed the fast-forward-only origin synchronization.
The pre-push checkpoint had 11 unpushed implementation/planning commits; root `pnpm run lint` and `pnpm fallow dead-code` passed.

### Observations

- The plan recommends independent delivery, but the implementation range changes no package directory and requires no version prediction or release dispatch.
  Package registration, artifact application and first publication remain issue #37's separately approved handoff.
- No additional close target, roadmap phase completion or outstanding manual verification was identified in the issue's plan and stage records.
- Both origin fetch and push URLs resolve exclusively to `Jopqior/gotgenes-pi-packages`, with no effective URL rewrite configured.
  Push, CI verification and the operator-approved close comment follow this committed checkpoint; their results belong to the issue and final ship report.
- The next workflow stage is `/retro 36` at the root on `main`.

## Stage: Final Retrospective (2026-10-06T02:19:52Z)

### Session summary

Reviewed the filing, planning, explanation, implementation and ship transcripts alongside the accumulated stage notes and twelve executed subagent transcripts.
Issue #36 delivered independent worktrees release/synchronization evidence support through eight separately committed steps; the ship transcript and live close comment confirm delivery without a package release.
Issue #37 remains open for package migration, registration, compatibility verification and separately approved first publication.

### Observations

#### What went well

- The Tidy First assessment found two otherwise easy-to-miss boundaries before implementation: recorder diagnostic precedence and the core-only network fault-injection trigger.
  The preparatory fixture and characterization commits made worktrees drift tests executable and pinned release/version validation before continuity, then unreleased-tail rejection.
- Mutation testing found a weak oracle in `test/release/fork-sync-targets.test.mjs`: the first target-routing mutation killed two cases rather than the expected three.
  The step-2 agent replaced the CLI expectation with an independent worktrees value and reran the mutation before `feat(release): support independent worktrees fork prediction (#36)`.
  This was a concrete benefit beyond merely obtaining a green suite.
- The first-release agent inspected the generated notes after its initial Green and found inherited CHANGELOG preamble/disclosure entering the new Release body.
  It added a failing boundary test and repaired the insertion seam before `feat(release): stage verified first worktrees fork artifacts (#36)`.
  The disposable candidate-application, local-tag, publication-preflight and subsequent-prediction round trip tested the actual artifact consumers without performing a real publication.

#### What caused friction (agent side)

- `missing-context`: the plan explanation used `core` for `@jopqior/pi-subagents` and `companion` for `@jopqior/pi-subagents-model-selector` without identifying those packages first.
  The operator asked separately where each term came from; each answer required four search/read calls, eight in total.
  Impact: two avoidable clarification exchanges and additional lookup work; no code rework.
  Existing architectural usage explains the vocabulary, but `companion` is not a unique package identifier.
- `premature-convergence`: after delegating implementation steps 1 and 2, the parent began an inline edit for step 3 because it considered the characterization step small.
  The operator first confirmed the step number, then requested a fresh subagent for every step; the pending edit did not produce a completed write in the rendered transcript.
  Impact: two clarification exchanges and an interrupted edit attempt; steps 3 through 8 subsequently used fresh sequential agents without code rollback.
  This was an unconfirmed execution preference, not an instruction violation predating the operator's request.
- `other`: `.pi/skills/pre-completion/SKILL.md` requires an explicit `Overall: PASS|WARN|FAIL` line, but `.pi/agents/pre-completion-reviewer.md` demonstrates `### Overall` followed by an unprefixed verdict.
  The reviewer followed that example, and the parent resumed the same reviewer to obtain `Overall: PASS` for the already-reviewed range.
  Impact: one format-only resume and reply; no repeated substantive review or implementation fix.
- `instruction-violation` (self-identified by the child): the implementation Explore dispatch explicitly requested `colgrep` before exact search, but the child rejected semantic search because it could update a local index.
  It investigated cache behavior and ran `colgrep --help` and `colgrep status`, then substituted exact searches and disclosed the deviation.
  Impact: extra cache-investigation work and a missing semantic-search leg in that child; the parent had separately used `colgrep`, and no source rework was attributed to this omission.
  The scope distinction is derived local search data versus project files and Git/GitHub state, not a blanket permission for writes.
- `other`: broad release/sync runs timed out in an existing recorder case during steps 4 and 6; the step-6 run overlapped static verification.
  Step 4 reran the failed file and single-worker suite in one command; step 6 used two subsequent commands for those reruns.
  Impact: two failed broad runs and additional verification; no timeout/configuration change, and later full root tests and reviewer checks did not reproduce the failure.
  These observations are consistent with contention but do not establish a deterministic root cause.
- `missing-context`: planning, implementation and this retrospective initially guessed `.pi/skills/colgrep/SKILL.md` instead of using the advertised `packages/pi-colgrep/skills/colgrep/SKILL.md` location.
  Impact: one failed skill read per stage followed by correction; no artifact rework.
  The available-skill metadata already supplies the correct path, so adding another path cache would duplicate the source of truth.

#### What caused friction (user side)

- The operator's terminology questions and delegation redirect exposed assumptions the agent should have made visible earlier; they were not missing product requirements.
  An optional early instruction such as "one fresh subagent per plan step; parent checks each handoff" would make the execution preference explicit, but the parent can also announce its mode before starting.
- Providing the installed-package reproduction at filing time enabled an offline loader check and the separation of repository support from package migration.
  The remaining decisions were appropriately strategic: issue split, explicit first version and artifact-only generation.

### Diagnostic details

#### Model-performance correlation

Attribution comes from type-unfiltered transcript turns, not agent definitions or the current session's model.
The filing, planning, explanation, implementation and ship parent turns examined here ran on `openai-codex/gpt-6.1-sol`.

| Dispatch                                  | Actual model                  | Task and observation                                                                                                                                                 |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning Explore                          | `openai-codex/gpt-6.1-sol`    | Traced release/sync consumers and the untagged first-release gap; informed the bounded design.                                                                       |
| Planning Tidy First assessor              | `openai-codex/gpt-6.1-sol`    | Identified recorder precedence and fixture seams; recommendations became preparatory steps.                                                                          |
| Implementation Explore                    | `zai-coding-cn/glm-5.3-flash` | Mapped imports, fixture copies and step sites; useful inventory, but skipped the requested semantic search after interpreting index maintenance as forbidden writes. |
| Implementation step 1                     | `openai-codex/gpt-6.1-sol`    | Selected-registration and query-injection fixture tests, implementation and mutations.                                                                               |
| Implementation step 2                     | `openai-codex/gpt-6.1-sol`    | Fixed targets and offline prediction; corrected the weak CLI oracle through mutation testing.                                                                        |
| Implementation step 3                     | `openai-codex/gpt-6.1-sol`    | Recorder topology, containment and diagnostic-precedence characterization.                                                                                           |
| Implementation step 4                     | `openai-codex/gpt-6.1-sol`    | Returned upstream-selection extraction, mutation checks and isolated timeout reruns.                                                                                 |
| Implementation step 5                     | `openai-codex/gpt-6.1-sol`    | Selected recording/status, early option rejection and tag-drift tests.                                                                                               |
| Implementation step 6                     | `openai-codex/gpt-6.1-sol`    | Independent artifact preparation and package-isolation controls.                                                                                                     |
| Implementation step 7                     | `openai-codex/gpt-6.1-sol`    | First-release evidence/candidate generation, historical-byte boundary and consumer round trip.                                                                       |
| Implementation step 8                     | `openai-codex/gpt-6.1-sol`    | Guarded documentation handoff, contract mutations and root gates.                                                                                                    |
| Pre-completion reviewer and format resume | `openai-codex/gpt-6.1-sol`    | Independent checks and boundary probes; PASS, followed by a format-only reply.                                                                                       |

The implementation steps included safety-boundary judgment as well as mechanical edits; this record does not justify a blanket cheaper-model substitution.
The Explore tool-choice issue warrants clearer scope wording, not an unsupported general ranking of model quality or cost.

#### Unused-tool detection

The notable omitted tool was `colgrep` in the implementation Explore child, despite its explicit dispatch mandate.
Exploration and independent review were otherwise delegated; no observed friction warrants inventing a missing subagent escalation.

#### Feedback-loop gap analysis

Verification was incremental: initial root baseline, per-step focused tests and mutations, broader release/sync reruns, static gates, final root gates, independent review and ship CI.
The actionable scheduling observation is the overlap of a process-heavy suite with static checks, not verification being deferred until the end.
The existing testing skill already prescribes isolated reruns; the evidence does not justify a permanent worker/timeout change.

### Proposed adjustments

1. Align `.pi/agents/pre-completion-reviewer.md` output examples and ending instruction with the existing explicit verdict contract in `.pi/skills/pre-completion/SKILL.md`.
2. In `.pi/skills/delegation/SKILL.md`, keep an established one-fresh-agent-per-step mode for preparatory steps and require approval before switching a step inline.
3. In that skill's read-only scope guidance, allow `colgrep`'s derived local index/cache maintenance while preserving project files and Git/GitHub state.

The operator approved proposals 1 and 3 and did not select proposal 2; no per-step delegation policy is added.
No new global terminology rule, hardcoded skill-path rule, test-timeout policy, prompt rewrite or follow-up issue is proposed.
The index/cache permission belongs at delegation time, not in always-loaded `AGENTS.md`; the reviewer change repairs its existing output example rather than duplicating the protocol.

### Evidence reviewed

Parent transcripts are under `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/`:

- Filing: `2026-10-05T11-44-49-825Z_01a10be1-7ea1-73a1-b665-4658b3d2dc72.jsonl`.
- Planning: `2026-10-05T12-28-26-030Z_01a10c09-6a2e-73a1-b665-465a480e2c10.jsonl`, including both child transcripts in its `tasks/` directory.
- Explanation: `2026-10-05T13-36-17-616Z_01a10c47-8ad0-73a1-b665-466560ae9701.jsonl`.
- Implementation: `2026-10-05T14-06-12-058Z_01a10c62-ec59-73a1-b665-4666778f62b2.jsonl`, including all ten child transcripts in its `tasks/` directory.
- Ship: `2026-10-06T02-04-25-780Z_01a10ef4-7b33-71da-a587-fa9782864914.jsonl`.

The live fork issue #36 close comment confirms the implementation handoff and no-dispatch decision; the live fork issue #37 remains open.

### Changes made

1. Appended this cross-session synthesis, friction impacts, model attribution and operator dispositions to `docs/retro/f0036-worktrees-fork-release-support.md`, preserving all prior stages.
2. Aligned the output instruction and PASS/FAIL examples in `.pi/agents/pre-completion-reviewer.md` with the existing explicit verdict protocol; removed the conflicting ending instruction.
3. Added the narrow derived-index/cache permission to `.pi/skills/delegation/SKILL.md`, retaining read-only project and Git/GitHub boundaries.
4. Left per-step delegation defaults, `AGENTS.md`, prompt templates, runtime code, tests, package artifacts and publication state unchanged; no new issue was filed.

Validation: root `pnpm run lint`, `git diff --check` and `pnpm exec vitest run test/agent-docs` passed; the focused run contains five files and 61 tests.
The reviewer examples were read back against the existing verdict contract; no live-agent behavior test or full runtime-suite rerun is claimed for these documentation-only changes.
