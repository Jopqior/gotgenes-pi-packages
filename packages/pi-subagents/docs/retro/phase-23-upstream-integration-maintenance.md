---
package: pi-subagents
phase: 23
---

# Retro: pi-subagents — Phase 23 Planning (upstream-integration-maintenance)

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
- The operator authorized creation of fork child issues and a Phase 23 roadmap, but not a commit, push, or release.

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

Local commit authorization was obtained after artifact checks; pushing or landing the planning branch remains a separate decision.
Start implementation planning with `/plan-issue #20`; afterward use `/plan-issue #21` against the delivered startup facts.
Preserve behavior unless a change is explicitly approved, and keep issue 19 open until actual combined maintenance outcomes are assessed or the operator explicitly defers/stops.
