---
issue: 22
issue_title: "Separate fork improvement phases from upstream with an f-prefixed namespace"
---

# Separate fork improvement phase identities

## Release Recommendation

**Release:** ship independently

This is repository-level workflow, test, and historical-document maintenance, not a package roadmap step or release batch.
No npm package release is required; changed package documents are under release-excluded architecture, plan, and retro directories.

## Problem Statement

The fork's first improvement phase followed the incorporated upstream sequence and became Phase 23.
Its archive and retro therefore occupy names a future upstream Phase 23 could also use.
The planning template recreates that collision by selecting the last completed phase plus one and locating its predecessor by subtraction.

The operator explicitly changed the issue's original migration proposal during planning: migrate the existing fork Phase 23 to **Phase f1**, not f23.
Normalize fork-owned references to f1 and retain an explicit original-name mapping for traceability.
This decision supersedes the issue body's instruction to retain the numeric part.

## Goals

- Give each package an independent fork phase sequence, starting at f1 and advancing within that namespace only.
- Migrate the existing fork phase's archive, retro, identity, frontmatter, indexes, and inbound references to f1 without changing its recorded decisions, evidence, or completion status.
- Preserve inherited upstream numeric phase identities, files, and validation support.
- Make planning, archival, lookup, session naming, and upstream integration preserve the complete phase identity.
- Pin the existing roadmap parser and checker behavior for both numeric and f-prefixed titles.
- Classify the default numbering and documentation-path change as **breaking for the repository workflow/document contract**, while preserving package runtime and public API behavior.
  The convention-and-migration commit uses `feat!:` with a `BREAKING CHANGE:` footer; it does not authorize publication.

## Non-Goals

- No new runtime phase allocator, CLI command, schema, phase registry, or parser restriction.
- No changes to extension source, package versions, public types, or dependency configuration.
- No renumbering of inherited upstream phases, issues, ADRs, or issue-keyed `fNNNN-` plans and retros.
- No Git history rewriting, tag changes, upstream synchronization, editing published artifacts, or retroactive GitHub issue/comment rewriting.
- No reopening the completed maintenance work in [#19], [#20], or [#21].
- No general historical-document cleanup or refresh of unrelated architecture metrics.
- No new improvement phase, roadmap step, or follow-up issue is required by this migration.

## Background

The issue and authenticated CLI user both identify `Jopqior`; this is the operator's own fork requirement.
The operator confirmed `scope:repo`, so this plan lives at the repository root despite the migrated records belonging to `pi-subagents`.
Issues [#19], [#20], and [#21] are closed, and the phase archive contains the operator's combined completion assessment.
The fork's open-issue searches for phase and roadmap work returned this issue, and its open PR sweep returned none.
The newest local triage, `docs/triage/2026-09-18-backlog.md`, is inherited upstream context and has no entry for this fork issue.
No fork f0022 retro existed; the unprefixed fallback retros describe unrelated inherited issues and are not prior work on this change.

Relevant surfaces:

- `.pi/prompts/plan-improvements.md` owns allocation, the previous-phase archive gate, predecessor lookup, roadmap headings, session labels, and phase retro creation.
- `.pi/prompts/finish-phase.md` reads the active phase, archives it, updates history indexes, and checks moved links and headings.
- `.pi/skills/markdown-conventions/SKILL.md` owns document naming and frontmatter conventions.
- `.pi/skills/improvement-discovery/SKILL.md` and `.pi/skills/roadmap-fit/SKILL.md` describe roadmap production and mid-phase bookkeeping.
- `scripts/roadmap/parse-roadmap.mjs` retains the complete heading as `phaseTitle`; step identity remains a GitHub issue number independently of phase identity.
- `scripts/roadmap/validate-roadmap.mjs` validates steps, scores, releases, and dependencies, not phase numbering.
- `scripts/roadmap-check.mjs` reports the retained title and existing status codes.

The history of the allocation sentence shows it was introduced while moving session naming earlier in the planning workflow.
Preserve early session naming; separating namespaces does not remove that behavior.
The package README and architecture scope tables concern runtime boundaries, not repository phase numbering; this change contradicts none of those boundaries.

AGENTS.md requires fork-targeted GitHub operations, English committed artifacts, explicit publication approval, and preservation of upstream tags and identities.
Detailed phase rules belong in the already-loaded topic skills and workflow templates, not a new always-loaded AGENTS.md block.

## Design Overview

### Identity and allocation

Use the term **phase identity** for the complete token, such as `f1` or inherited `22`.
Use `PHASE` as the prose placeholder for that token; reserve issue-number placeholders for GitHub issues so examples do not confuse the two.
A fork identity is lowercase `f` followed by a positive decimal integer, without zero padding.
Its identity is scoped to the package, not to the whole monorepo.

The canonical convention lives under Documentation frontmatter in `markdown-conventions`; discovery and archival instructions consume it.

1. Read the package's architecture document and detect any active detailed roadmap before allocating a phase.
   An active upstream or fork roadmap still triggers the existing stop-and-finish gate; the gate no longer assumes that the active phase equals the proposed identity minus one.
2. Inventory that package's committed fork phase identities in history files, phase retros, and architecture phase records.
   Count the history and retro pair once, compare suffixes numerically, and select one greater than the greatest allocated fork suffix.
   With no fork identity, select f1.
   A retained retro reserves its identity even if that planning attempt did not produce an archive; do not silently reuse it.
3. Resolve predecessor context separately from allocation.
   Read the latest completed fork archive through its history-index link, or the latest incorporated upstream archive if no completed fork archive exists.
   Preserve the existing findings, metric-miss, deferred-tidying, and handoff sweeps.
   Incoming upstream phases remain additional integration context, never a numbering input for the fork.
4. Preserve the full token in headings, session names, filenames, commit subjects, and lookup expressions.
   A lookup for f1 uses `phase-f1-*.md`; it must not fall back to `phase-1-*.md` or infer that upstream Phase 1 is the same phase.
   Detect duplicate or inconsistent records and stop for reconciliation instead of choosing one by filename order.

Illustrative acceptance cases, not measured phase inventories:

| Existing state in one package                                   | Expected action                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| Only inherited numeric archives                                 | Allocate f1; read the latest inherited archive as context  |
| Completed fork f1 plus any higher upstream phase                | Allocate f2; upstream numbers do not affect allocation     |
| Fork f2 and f10 records                                         | Allocate f11, not a lexicographic successor                |
| Active numeric or fork roadmap                                  | Stop and request `/finish-phase`; allocate no new phase    |
| Numeric 1 and fork f1 both exist                                | Preserve both; exact-namespace lookup                      |
| Highest fork identity appears only in a retained planning retro | Reserve that identity and advance rather than overwrite it |

### Document representation and migration

Fork retros use a string identity rather than the inherited numeric field:

```yaml
---
package: pi-subagents
phase: "f1"
---
```

Inherited numeric `phase:` fields remain unchanged and supported.
History files currently have no frontmatter; keep that convention rather than introducing an unnecessary history schema.
Use `# Phase f1: Upstream integration maintenance` in the renamed archive and the complete identity in the phase retro's H1.
The two filenames share `phase-f1-upstream-integration-maintenance.md`.

Add a brief mapping note to the migrated archive and phase retro: this fork phase was originally recorded as Phase 23 and is now f1; its original findings and stage records are retained.
Normalize references in the fork issue 19/20/21 plans and retros to f1, including links, without rewriting timestamps, recorded permissions, SHAs, issue numbers, measured results, or historical statements about what was open at the time.
This is a present-tree document migration, not a claim that old commits used the new spelling.

The architecture history introduction must name inherited upstream phases and fork phases separately rather than describing a continuous sequence through 23.
Keep the existing history table layout, label the migrated row `f1`, and distinguish its structural-issue rows from upstream rows.
Do not create a third completion-summary tier or a redirect stub occupying the old unprefixed archive namespace.

### Existing executable behavior

A planning-time probe called the real `parseRoadmap` and `validateRoadmap` functions with the existing `ISSUE_ROADMAP` test fixture, replacing only its title token between `23` and `f23`.
Both preserved the title, produced issue identities `[857, 878]`, and returned no findings.
This is a synthetic compatibility probe using an existing test artifact, not a reproduction of a future upstream file collision.
Source inspection shows the title is opaque to validation, so no production parser change is needed; implementation tests will pin the operator-selected f1 spelling explicitly.

The source of the collision is the real planning instruction and existing unprefixed archive/retro pair, not a runtime parser failure.
No new shared interface, collaborator, layer wiring, or extracted module is introduced, so the design-review extraction checklist is not applicable.
The Tidy-First assessor read both target tests and the production parser/checker/validator and recommended no preparatory commits.

## Module-Level Changes

### Workflow and conventions

- `.pi/skills/markdown-conventions/SKILL.md`: define package-scoped fork identities, independent allocation, exact-namespace lookup, string phase frontmatter, and separation from issue-keyed filenames.
- `.pi/prompts/plan-improvements.md`: replace the highest-overall-number and `N−1` assumptions; update Step 1, Output, commit/session examples, and Write planning notes together.
  Check for any active roadmap before allocation and use the actual predecessor archive link.
- `.pi/prompts/finish-phase.md`: read and preserve the full identity throughout identification, date fallback search, archival filenames, history labels, verification commands, session labels, and commit examples.
  Numeric inherited phases remain valid inputs, and history summary instructions explicitly separate namespaces.
- `.pi/skills/improvement-discovery/SKILL.md`: point to the canonical identity rule when selecting previous-phase findings and producing the roadmap; preserve issue-keyed step identity and existing structural anchors.
- `.pi/skills/roadmap-fit/SKILL.md`: use full phase identities in archival paths and commit examples; its existing open-roadmap prefix grep already supports both namespaces.
- `docs/upstream-sync.md`: extend the conflict handbook and auto-merge review checklist to retain fork phase identities and independent allocation while incorporating numeric upstream records unchanged.
- `.pi/skills/package-pi-subagents/SKILL.md`: replace the stale history-range statement with a namespace-aware pointer to the history table, not another growing count/range cache.

### Fork records

- Rename `packages/pi-subagents/docs/architecture/history/phase-23-upstream-integration-maintenance.md` to `phase-f1-upstream-integration-maintenance.md` in the same directory.
  Update H1, retro link, and original-name mapping only; retain findings, steps, issue definitions, diagram, release accounting, and completion assessment.
- Rename `packages/pi-subagents/docs/retro/phase-23-upstream-integration-maintenance.md` to `phase-f1-upstream-integration-maintenance.md` in the same directory.
  Update phase frontmatter, phase references, archive link, H1, and mapping note; retain both planning and archival stage records.
- `packages/pi-subagents/docs/architecture/architecture.md`: update the history introduction, archive row/link, and fork structural-issue rows.
- `packages/pi-subagents/docs/plans/f0020-selector-startup-coordination.md` and `f0021-selector-presentation-reconciliation.md`: normalize the phase references in release recommendations and module-change tables.
- `packages/pi-subagents/docs/retro/f0019-upstream-integration-maintenance.md`: normalize fork phase references and the phase-retro link.
- `packages/pi-subagents/docs/retro/f0020-selector-startup-coordination.md` and `f0021-selector-presentation-reconciliation.md`: normalize the phase references without changing the historical stage outcomes.

### Tests

- `test/roadmap/parse-roadmap.test.mjs`: add a phase-identity group for numeric and f1 headings using the existing fixture shapes, with explicit expected parsed titles, steps, releases, and edges.
- `test/roadmap/roadmap-check.test.mjs`: exercise f1 success, validation failure, and warning-only output/status through `checkRoadmaps` and the existing temporary-workspace fixture.
  Use scoped full-heading replacement, or a small default-preserving fixture option if repetition warrants it; no separate builder extraction.

### Predicted unchanged

- `scripts/roadmap/parse-roadmap.mjs`, `validate-roadmap.mjs`, `step-references.mjs`, and `scripts/roadmap-check.mjs`: phase titles are already opaque strings; no numeric phase conversion or allocation exists there.
- `test/roadmap/validate-roadmap.test.mjs` and `step-references.test.mjs`: validation and issue/ordinal references remain unchanged; retain the existing regression coverage.
- The synthetic numeric `Phase 23: Resume delivery` test fixture: it is not the fork's maintenance phase and remains a compatibility input.
- Inherited numeric history/retro records, including upstream Phase 22: no renames or content changes.
- `AGENTS.md`, root/package READMEs, issue-keyed lookup scripts, and other issue lifecycle prompts: their existing contracts do not allocate or resolve phase identities.
- Existing Mermaid blocks: no nodes, labels, edges, or ordering change; verify byte preservation rather than redrawing diagrams.

## Test Impact Analysis

This change enables no new runtime unit-test seam and makes no existing tests redundant.
Keep all numeric and issue/ordinal step fixtures; the new tests characterize compatibility that already works, rather than inventing a failing production defect.
Assert expected values independently, not only equality between numeric and prefixed runs.
The f1 error case must retain the normal score diagnostic and failure status, while the warning-only case retains its warning and successful status.

Measured planning checks:

- `pnpm exec vitest run test/roadmap`: 4 files, 66 tests passed.
- `./scripts/roadmap-check.mjs`: the inherited permission-system Phase 15 reports 8 steps and 0 findings; the archived subagents package is skipped by the all-package sweep.
- An earlier `pnpm run test:scripts -- test/roadmap` invocation ran the entire root suite rather than filtering: 19 files, 270 tests passed.
  Use the direct `pnpm exec vitest run test/roadmap` command for focused verification.

The following read-only commands were dry-run during planning and form the changed workflow's lookup/check surface:

```bash
rg --files packages/pi-subagents/docs/architecture/history packages/pi-subagents/docs/retro -g 'phase-f[0-9]*-*.md'
rg --files packages/pi-subagents/docs/architecture/history packages/pi-subagents/docs/retro -g 'phase-23-*.md'
rg -n '^## Improvement roadmap|^\| (23|f[0-9]+) ' packages/pi-subagents/docs/architecture/architecture.md
./scripts/roadmap-check.mjs
pnpm exec vitest run test/roadmap
```

Before migration, the fork-file inventory is empty, the old-name inventory returns the archive and retro, and the architecture query returns only the completed row 23.
After migration, the first command must return the f1 archive and retro, the second must return no files, and the architecture query must return only the f1 row with no active roadmap.
An empty `rg` result exits 1 and is expected for those absence checks, not a failed implementation gate.
No command above allocates numbers automatically: apply the documented allocation decision table to the inventory, including numeric ordering and the active-roadmap stop case.

The implementation must dry-run any additional shell expression it introduces into the prompts and record its actual result before committing.
Do not invoke the full planning or archival commands as tests: they can file issues, write roadmaps, commit, and push.

## Invariants at risk

- **Fork maintainers and historical readers:** original maintenance findings, issue links, assessment, measurements, and stage decisions survive.
  Capture the pre-migration files and compare them with the renamed files after normalizing only the documented identity/path substitutions and removing the new mapping notes.
  Any remaining content difference requires review; counts alone are not a losslessness check.
- **Upstream integration:** inherited numeric records retain names and bytes.
  Review the explicit changed-file list against the pre-implementation commit, and require no diff in inherited phase records.
- **Roadmap consumers:** GitHub issue/ordinal step identity, graph edges, scores, release semantics, and checker status codes remain unchanged.
  The opened parser and checker tests exercise the real functions, and the complete roadmap test directory remains the regression gate.
- **Archive workflow:** one detailed archive plus its history-table row, with no duplicate completion narrative.
  The existing phase archive's dependency diagram remains byte-identical.
- **Link readers:** inbound file links and changed heading anchors resolve to the migrated identity.
  The planning-time repository search found file references but no inbound `#phase-23` or `#improvement-roadmap…phase-23` anchors; repeat the search after migration rather than assuming Markdown lint checks anchors.

## TDD Order

Use `/tdd-plan` because this plan includes characterization tests with explicit red-by-mutation checks; it does not require a production bug-fix cycle.

1. **Pin existing phase-title compatibility.**
   Add the parser and checker cases described above while retaining numeric fixtures and the current production implementation.
   Initial green is expected characterization, not proof of test strength.
   Establish red with temporary, separately applied killing mutations, then restore the exact working state and verify green:
   - Replace `ROADMAP_HEADING` with a numeric-only phase-heading matcher: prefixed-title parser cases and f1 checker cases must fail; numeric cases must survive.
   - Make the parser's returned `steps` an empty array: explicit step-content cases for both namespaces must fail.
   - Make the parser's returned `edges` an empty array: explicit dependency-edge cases must fail.
   - Make `validateRoadmap` return `[]` unconditionally: f1 error and warning cases must fail, while the clean case is not expected to fail.
   - Strip `f` from the phase identity when `describe` renders the report: the exact f1 report assertion must fail.
   Keep each mutation disposable and never commit it.
   Verify with `pnpm exec vitest run test/roadmap` and the complete root script suite before committing.
   Commit: `test: preserve fork and upstream roadmap title compatibility (#22)`.

2. **Change the convention and migrate the existing records atomically.**
   Apply all Workflow and conventions and Fork records changes in one commit, so a new allocator never sees the existing fork phase still masquerading as upstream history.
   Use `git mv` for the archive and retro, preserve their slug, and update all inbound links in the same step.
   Review allocation and lookup against every Design Overview case; check both narrative and output-example sections of each edited prompt.
   Perform normalized before/after record comparisons, inherited-file diff checks, diagram byte checks, and repository-wide old-path/anchor searches.
   Old names may remain only in the explicit migration mapping and this issue's planning evidence; the unrelated numeric test fixture stays.
   Clear `.rumdl_cache` after the rename with `find .rumdl_cache -type f -delete`, then run Markdown lint uncached, `pnpm exec vitest run test/roadmap`, `pnpm run test:scripts`, `./scripts/roadmap-check.mjs`, and `git diff --check`.
   Reload templates or start a fresh Pi session before using the changed slash commands; on-disk templates remain authoritative in a stale session.
   Commit: `feat!: separate fork improvement phase identities (#22)`.
   Footer: `BREAKING CHANGE: Fork improvement phases now use per-package f-prefixed identities starting at f1. The former fork Phase 23 archive and retro move to phase-f1-upstream-integration-maintenance.md; update local links and lookups. Inherited numeric upstream phases remain unchanged.`

3. **Complete verification and handoff.**
   Run the repository pre-completion gate with a fresh-context reviewer after the implementation steps, supplying the operator's f1 decision as the governing requirement rather than the issue's superseded f23 wording.
   Persist implementation stage notes in this issue's root retro and record any deviations from predicted-unchanged files.
   Commit the stage notes separately as `docs(retro): record issue #22 implementation verification`.
   Recommend `/ship #22` without package publication; do not open or archive an improvement phase as part of verification.

## Risks and Mitigations

- **Issue/plan disagreement:** the issue still says f23; the operator-approved f1 override is explicit in this plan and the planning retro.
- **Silent namespace fallback:** exact identity lookup keeps numeric 1 and f1 distinct; the allocation table includes coexistence and high-numbered upstream examples.
- **Wrong predecessor:** remove arithmetic predecessor lookup, but preserve the existing archive gate and findings sweeps using actual history links.
- **Historical evidence drift:** normalized content comparison permits identity/path edits only; stage facts and original timestamps are not rewritten to present-day truth.
- **Dangling links hidden by cache:** update links atomically, clear the Markdown cache, and check anchors separately.
- **Unnecessary runtime churn:** existing title handling is already compatible; tests pin it without adding a new phase parser or allocator.
- **Stale workflow expansion:** reload or use a fresh session before exercising edited prompts; never treat a stale slash expansion as evidence of the new rule.
- **Future upstream collision:** the sync handbook preserves both namespaces and forbids treating a same-number upstream phase as a rename of the fork phase.

## Open Questions

None blocking.
The operator settled f1 migration, independent per-package sequences, and normalization of fork-owned references.
No concrete follow-up work was deferred or filed.

[#19]: https://github.com/Jopqior/gotgenes-pi-packages/issues/19
[#20]: https://github.com/Jopqior/gotgenes-pi-packages/issues/20
[#21]: https://github.com/Jopqior/gotgenes-pi-packages/issues/21
