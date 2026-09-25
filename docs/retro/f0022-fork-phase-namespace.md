---
issue: 22
issue_title: "Separate fork improvement phases from upstream with an f-prefixed namespace"
---

# Retro: #22 — Separate fork improvement phases from upstream with an f-prefixed namespace

## Stage: Planning (2026-09-25T08:27:54Z)

### Session summary

Read the fork issue, completed maintenance-phase records, workflow templates, and roadmap parser/checker tests, then committed the implementation plan at `3257a2010`.
The operator confirmed repository scope and changed the migration target from the issue's proposed `f23` to `f1`, with independent per-package fork sequences and normalized fork-owned references.
The next entry point is `/tdd-plan docs/plans/f0022-fork-phase-namespace.md`; this session implements nothing and does not push or publish.

### Observations

- `git pull --ff-only` reported already up to date, and the working tree was clean before planning.
  The issue author and authenticated user were both `Jopqior`.
- The operator's latest decision governs: the existing fork Phase 23 becomes Phase f1, its next phase is f2, and a package without fork phases starts at f1 regardless of upstream numbering.
  This explicitly supersedes the issue body's numeric-suffix-preservation requirement; that body was not edited.
- The trigger is the planning template's highest-completed-phase increment and arithmetic predecessor lookup, not a runtime validation defect.
  The plan separates allocation from predecessor context and preserves the active-roadmap archive gate for both namespaces.
- A direct probe of the existing synthetic roadmap fixture through the real parser and validator preserved numeric and f-prefixed titles, issue identities, and clean validation.
  Production parser/checker changes are therefore not planned; characterization tests will pin the selected f1 spelling, diagnostics, and status behavior.
- Focused `pnpm exec vitest run test/roadmap` passed 4 files / 66 tests.
  An earlier `pnpm run test:scripts -- test/roadmap` unexpectedly ran the full root suite, which passed 19 files / 270 tests; use the direct invocation for focused runs.
- The all-package roadmap checker reported inherited permission-system Phase 15 with 8 steps and 0 findings; subagents has no active roadmap after archival.
  Fork issues 19, 20, and 21 are closed; the fork issue/PR sweeps found no competing work.
  The inherited triage and unprefixed issue-22 retros are unrelated upstream context.
- The workflow/default and document-path migration is classified as breaking for repository consumers, not for npm package APIs.
  The plan uses one atomic convention-and-migration commit with a breaking footer, preserves inherited files, and requires no package release.
- Losslessness remains an implementation acceptance check, not a planning claim: compare normalized archive/retro bodies, unchanged diagrams, inherited files, and all inbound links and anchors.
  The archive and phase retro will carry the original-name mapping while fork references are normalized.
- The Tidy-First assessor recommended no preparatory commit.
  Existing concern groups and fixtures can host the new tests without a shared builder or production abstraction.
- The plan passed `pnpm exec rumdl check` and commit hooks.
  No concrete follow-up issue was deferred or filed.

#### Deferred tidyings

- `test/roadmap/parse-roadmap.test.mjs` and `test/roadmap/roadmap-check.test.mjs`: a cross-file fixture builder was rejected because the rich parser graph and minimal checker document serve different test concerns.
- `test/roadmap/parse-roadmap.test.mjs` and `test/roadmap/roadmap-check.test.mjs`: wholesale assertion strengthening or test-tree reorganization was rejected because it does not prepare the scoped compatibility additions.

These are rejected cleanup candidates, not implementation commitments.

## Stage: Implementation — TDD (2026-09-25T08:56:41Z)

### Session summary

Completed the characterization-test step and the atomic convention-and-record migration, followed by the verification and handoff step.
Fork phases now use independent per-package identities beginning at `f1`, and the former fork Phase 23 archive and retro have moved to `phase-f1-upstream-integration-maintenance.md` with original-name mappings.
Added 9 tests: the root script suite increased from 270 to 279 passing tests, with package-suite counts unchanged.

### Observations

- `git pull --ff-only` reported already up to date; the initial working tree was clean.
  Baseline and final `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` all passed.
- Characterization tests were initially green as planned.
  Five separately applied mutations established discrimination: numeric-only headings killed 6 new tests, empty steps killed 5, empty edges killed 2, unconditional empty validation findings killed 2, and stripping the fork prefix from reports killed 3.
  Each mutation was restored from a saved green file before the final focused and root-script runs; production parser, checker, and validator files remain unchanged.
- Normalized before/after comparisons passed for the migrated archive, phase retro, and fork issue records.
  Diagram bytes and inherited numeric phase records were preserved; old-path and anchor searches, uncached Markdown lint after clearing the rename cache, and the roadmap checker passed.
- Allocation and lookup checks included numeric-only history, higher upstream phases, numeric suffix ordering, active roadmaps in either namespace, numeric/fork coexistence, retained planning retros, and duplicate-record reconciliation.
  The templates preserve early session naming and resolve predecessor context through history links rather than arithmetic.
- No scope deviations or changes to predicted-unchanged production files were required.
  No phase was opened or archived, no follow-up issue was filed, and no package publication is required.
- Pre-completion reviewer: PASS.
  The fresh-context reviewer independently reran all four repository gates and checked migration preservation, namespace rules, tests, links, commits, and Mermaid rendering.
- Implementation commits are `test: preserve fork and upstream roadmap title compatibility (#22)` and `feat!: separate fork improvement phase identities (#22)`.
  The latter includes the planned repository-workflow breaking-change footer.
  Next step: `/ship #22` without package publication; reload or start a fresh Pi session before using the edited planning or archival templates.

## Stage: Ship (2026-09-25T08:59:46Z)

### Session summary

Shipping through the trunk lane from the root checkout on `main`.
The plan requires no npm publication; the only touched package, `pi-subagents`, has no pending release according to `next-version.sh`.

### Observations

- Fetch and fast-forward pull succeeded; five local commits were ahead of `origin/main` before this stage note.
- Root lint and dead-code gates passed on the implementation tree.
- The range contains only issue #22 work; edits to closed issues 19, 20, and 21 are historical-reference migration, not newly co-shipped implementations.
- No third-party PR close target or worktree teardown is involved.
- Push and exact-commit CI verification follow this note; issue closure is conditional on CI success.
- The breaking change concerns repository phase identities and document paths, not package runtime APIs.
- This migration opens or completes no roadmap phase; the next workflow after successful shipping is `/retro 22`.

## Stage: Final Retrospective (2026-09-25T09:06:58Z)

### Session summary

Reviewed the planning, implementation, and shipping transcripts, plus all four child transcripts, against the accumulated stage notes.
The compatibility tests and atomic fork-phase migration shipped through `test: preserve fork and upstream roadmap title compatibility (#22)` and `feat!: separate fork improvement phase identities (#22)`; the shipping transcript records exact-commit CI success and issue closure without publication.
This retrospective changes no runtime behavior or phase status.

### Observations

#### What went well

- The parser probe disproved the need for a production change before implementation: existing title handling already accepted fork identities.
  Characterization tests then used separately restored killing mutations rather than manufacturing a production defect to obtain an initial red.
- The operator's `f1` decision survived separate planning, implementation, reviewer, and ship sessions despite the issue body retaining `f23`.
  The plan, handoff prompts, and close comment consistently named the override.
- Migration verification combined normalized record comparisons, unchanged diagram bytes, exact-namespace lookups, and a cold link check.
  This preserved historical evidence without adding a runtime allocator or old-path redirect documents.

#### What caused friction (agent side)

- `premature-convergence` — planning initially carried the issue's `f23` suffix into the choice set instead of contrasting it with a genuinely independent `f1` sequence.
  The operator prompted the reconsideration before the plan was written.
  Impact: an additional clarification exchange, but no implementation rework.
- `missing-context` — planning attempted `.pi/skills/colgrep/SKILL.md` instead of the catalogued `packages/pi-colgrep/skills/colgrep/SKILL.md`.
  Impact: one failed read, followed by a successful read of the supplied path.
- `other` — the planning command `pnpm run test:scripts -- test/roadmap` ran the root suite rather than the intended focused tests.
  Impact: an unnecessary broad run; the plan recorded `pnpm exec vitest run test/roadmap`, which implementation subsequently used.
- `other` — the migration child encountered four rejected `Edit` calls across the planning template, archival template, issue-19 retro, and architecture document.
  Each was recovered locally; the architecture cleanup also used two string-length probes to reduce table-formatting churn.
  Impact: retry and cosmetic-edit work before the atomic migration commit, with no follow-up repair commit.

#### What caused friction (user side)

- The `f1` preference emerged during planning rather than in the original issue, which still requested `f23`.
  Stating the desired independent starting point earlier could remove that clarification, but the operator's intervention was useful strategic judgment, not mechanical supervision.
  The agent should still have surfaced that alternative without requiring the intervention.

### Diagnostic details

- Model attribution comes from unfiltered child transcripts: `openai-codex/gpt-6-astra` performed the Tidy-First assessment and pre-completion review; `openai-codex/gpt-6-sol` performed the characterization-test and migration steps.
  The test child handled mutation discrimination, and the migration child handled preservation checks as well as edits; neither assignment was purely formatting work.
  No model-quality mismatch is established, and no comparative latency or cost was measured.
- The migration child transcript contains the edit retries and cosmetic probes omitted from its clean completion summary.
  Keep transcript-level review for friction analysis; a successful stage summary is not evidence that execution had no rework.
- No repeated-error sequence exceeded five consecutive calls before recovery or a strategy change.
  No additional Explore or Plan dispatch is justified by the observed retries; the missing skill location was already supplied by the catalog.
- Verification was incremental: focused tests and mutations preceded the test commit, migration checks preceded its commit, and repository gates ran at baseline, completion, and independent review.
  Shipping additionally checked the pushed commit's CI run; there was no end-only verification gap.

### Follow-up disposition

No new workflow rule is proposed: `clarification-gates` already addresses shared premises, and `edit-tool` already addresses exact anchors and atomic retries.
The focused test invocation is already preserved in the plan and planning notes.
Adding these again would duplicate existing guidance rather than address missing policy.

This repository-level issue has no roadmap successor and did not complete a phase.
The newest triage, `docs/triage/2026-09-18-backlog.md`, concerns inherited `gotgenes/pi-packages` work rather than this fork's queue.
The live fork queue contains issues #23 and #24, neither ranked by that triage; no inherited rank or severity is assigned to them.

### Changes made

1. Appended this cross-session retrospective to `docs/retro/f0022-fork-phase-namespace.md`, including child-transcript diagnostics and the fork-specific queue disposition.
2. With operator approval, left `AGENTS.md`, skills, and prompt templates unchanged; no follow-up issue or package release was created.
