---
package: pi-subagents
phase: "f1"
---

# Retro: pi-subagents — Phase f1 Planning (upstream-integration-maintenance)

This fork phase was originally recorded as Phase 23 and is now Phase f1; its planning and archival stage records are retained.

## Stage: Improvement Planning (2026-09-24T09:00:03Z)

### Session summary

The operator approved a focused fork-maintenance phase under issue 19 after discussion of delivery boundaries.
The cause is selector-specific temporal and presentation coupling to upstream-owned paths, not general package complexity.
The phase adopts fork issue 20 for startup coordination and fork issue 21 for presentation reconciliation, each with its own behavior preservation and inspectable maintenance evidence.

### Decisions and scope

- Issue 19 remains the overall maintenance objective and final assessment tracker, not a single atomic implementation plan.
- The operator first retained startup, construction isolation, and presentation as candidates, then folded construction/inheritance preservation into startup acceptance after a counterexample refuted the cheapest proposed isolation boundary.
- Startup includes the spawning tool's initial-return boundary; testing is not deferred to a later standalone issue.
- Presentation is independently assessable against existing pending/selected facts.
  Recommended working order is issue 20 then issue 21; no hard dependency or joint release batch is established.
- Concrete implementation design, module placement, and release classification belong in each issue's `/plan-issue` session.
  No runtime mechanism, package split, file-size threshold, generic lifecycle rewrite, or generic tag-system redesign was selected.
- The operator authorized creation of fork child issues and a Phase f1 roadmap, but not a commit, push, or release.

### Evidence and limits

The complete investigation and reproduction recipe are in [the issue checkpoint](f0019-upstream-integration-maintenance.md).
Local HEAD remains the inventory snapshot `746a4ae812a574d0496cb46c125a32961a608cf1` and upstream remains fixed at `edb35ee28535aac4e12431e47e440f6933911834`.
No fetch was performed; the generic planning template's synchronization step was deliberately skipped.

Source inspection covered the baseline diffs, composition wiring, record/manager startup additions, scope inheritance, session factory IO, presentation overlays, and relevant existing tests.
Historical remerge diffs distinguished import/text conflicts from semantic obligations that survived a clean merge.

A disposable characterization probe executed the real assembly factory with existing stub IO/session helpers and a synthetic deterministic cancellation schedule.
Moving both checks into an asynchronous IO wrapper allowed binding with an already-aborted signal; retaining the final factory check prevented binding and disposed the session.
All three characterization cases passed their distinct assertions; this refutes that relocation, not all possible construction designs.
The probe was removed without production edits.
No full SDK-host, interactive, full-suite, typecheck, or public-type verification was performed in this planning stage.
The earlier checkpoint's package suite results remain evidence about the unchanged snapshot, not new acceptance measurements.

Fallow was rerun after probe removal: health 78/B, maintainability 91.0, average/p90 cyclomatic complexity 1.3/2, no dead-code issues, and no production duplication.
Those metrics corroborate but do not establish maintenance benefit.
The inherited Phase 22 archive reports no missed targets; its upstream feature candidates were not adopted into this fork phase.
The startup hotspot is accelerating, so the inherited cooling-hotspot rotation premise does not apply.

### GitHub and artifact state

Verified `gh repo view --json nameWithOwner` resolved to `Jopqior/gotgenes-pi-packages` before mutation.
Created and read back the bodies and titles of [issue 20](https://github.com/Jopqior/gotgenes-pi-packages/issues/20) and [issue 21](https://github.com/Jopqior/gotgenes-pi-packages/issues/21).
Both use `enhancement` and `pkg:pi-subagents`, and both were attached to [issue 19](https://github.com/Jopqior/gotgenes-pi-packages/issues/19) through GitHub's sub-issue relationship and verified by listing it.
No upstream issue, PR, or publication was created.

The roadmap is in [architecture.md](../architecture/architecture.md), immediately above Refactoring history.
Its baseline commands remain fixed, outcome checks are scenario-based, and both steps carry independent release tags without assuming a release vehicle.
The stale single-provider wording was reconciled with the actual workspace and spawn-selection seams; inherited structural tables are explicitly labeled historical.
The operator subsequently authorized a local commit of the roadmap and both retros, without push or publication.

### Artifact checks

- `./scripts/roadmap-check.mjs pi-subagents`: two steps, zero findings.
- `pnpm exec rumdl check` on the architecture and both planning retros: no issues in the three files.
- `git diff --check`: clean.
- Issue reference-link scan of `architecture.md`: no missing numbered issue definitions.
- Mermaid CLI rendered the new dependency diagram to SVG and PNG successfully; the PNG was visually inspected and shows the intended disconnected issue nodes.
  GitHub/vivify Markdown-preview verification was not performed, so the renderer-specific check remains pending rather than implied by Markdown lint.

### Next entry point

The operator subsequently authorized committing and pushing these planning documents directly to fork `main`, superseding the local-only gate.
The planning commit was fast-forwarded onto local `main`; the extra planning branch was unnecessary.
No fetch, production implementation, or publication is authorized by this clarification.
Start implementation planning with `/plan-issue #20`; afterward use `/plan-issue #21` against the delivered startup facts.
Preserve behavior unless a change is explicitly approved, and keep issue 19 open until actual combined maintenance outcomes are assessed or the operator explicitly defers/stops.

## Stage: Phase Archive (2026-09-25T05:34:05Z)

### Session summary

The operator requested `/finish-phase pi-subagents` for Phase f1.
`git pull --ff-only` reported already up to date, and the worktree was clean.
Implementation issues 20 and 21 were closed, but overall objective 19 remained open without a recorded combined assessment.
The operator chose to assess the combined outcome in this session, then explicitly accepted the bounded maintenance benefit and authorized closing issue 19 and archiving the phase.
Issue 19 was closed as completed in the fork.

The full roadmap moved to [the phase archive](../architecture/history/phase-f1-upstream-integration-maintenance.md), preserving its findings, step wording, diagram, tracks, and release accounting.
The archive adds the accepted before/after assessment, residual obligations, issue mapping, and delivered supporting metrics.
The current architecture retains the history table entry and structural-issue mapping rather than a duplicate completion narrative.
Its stale inherited structural metrics were refreshed; the delivered module descriptions and lifecycle diagrams already matched the inspected implementation.

### Evidence and limits

- Source inspection checked the initial-selection owner, terminal observer composition, session-factory cancellation checks, common display producer, and foreground/background/widget integrations.
  The lifecycle and composition-root paths matched the recorded startup delivery; tools/UI matched the presentation delivery; ordinary lifecycle state matched the fixed upstream file.
- Core tests passed: 86 files / 1,988 tests.
  Companion tests passed: 9 files / 68 tests.
  These were local suite runs, not an interactive host or packed-new-core compatibility replay.
- The existing fixed-source startup transplant and synthetic presentation trial reports were read against current code, not rerun.
  Their evidence supports reduced repeated settlement and formatted-tag reconciliation, not a prediction of future merge conflicts or maintenance time.
- Health remained 78/B, average/p90 cyclomatic complexity 1.3/2, with no dead-code or production-duplication findings.
  Maintainability was 90.9 against the planning baseline 91.0; no increase was promised.
  Source totals were 73 files / 12,121 LOC.
- The package-labeled issue sweep from the planning date returned only issues 20 and 21, already accounted for; no residual disposition was needed.
  The live roadmap checker reported two steps and zero findings before archival.
- Deterministic normalized comparison confirmed the full original roadmap was preserved after heading promotion, link rebasing, and table formatting.
  The archive retains two step headings and one Mermaid fence; architecture retains no roadmap, step, or completion-summary heading for this phase.
  Numbered issue definitions in both documents are complete and used.
- Repository lint passed.
  Mermaid CLI rendered the unchanged dependency diagram; GitHub/vivify preview was not performed, so the inherited renderer-specific caveat remains explicit.

### Observations and handoff

The package skill's 73-file count and per-domain module counts still agree with the source layout, but its architectural-direction sentence still describes the history as phases 14 through 18.
That stale phase-range prose was noted, not expanded into a skill rewrite during archival.
The structural metrics are supporting evidence only; the lifecycle observer contract, scope inheritance timing, cancellation-before-binding checks, UI input mapping, and new abstraction upkeep remain real maintenance obligations.

Next entry point: `/plan-improvements pi-subagents` when another round is desired.
This archive proposes no next phase and dispatches no release.
