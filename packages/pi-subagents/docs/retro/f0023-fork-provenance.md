---
issue: 23
issue_title: "Clarify pi-subagents fork provenance and model-selector purpose in public documentation"
---

# Retro: #23 — Clarify pi-subagents fork provenance and model-selector purpose in public documentation

## Stage: Planning (2026-09-25T10:53:14Z)

### Session summary

Committed a numbered documentation/metadata plan for the package's direct-upstream identity, selection purpose, attribution, and packed publication surfaces.
Inspected the actual locally packed artifact and npm's README publication documentation; no implementation or publication was performed.
The next stage is `/build-plan`.

### Observations

- The operator chose to preserve the gotgenes-versus-tintinweb comparison as explicitly historical, with a short Jopqior fork introduction, rather than research a new three-way matrix.
- The README's existing selection section already distinguishes the core seam from the companion UI; the introduction and npm description should reflect that distinction without duplicating the detailed contract.
- The packed README contains a sibling-relative companion link that leaves the package; the plan replaces it with a public absolute URL.
- Packing ran the declaration build and included the README, license, comparison, configuration, architecture, and decision documents.
  Source-versus-packed README and license comparisons passed, and packing left tracked files unchanged.
- The MIT notice must remain intact; existing author metadata and credits are preserved while support destinations identify the fork.
- The architecture relationship section and package skill carry inherited maintenance claims; the plan aligns them with the canonical gotgenes sync procedure rather than asserting periodic upstream-suite execution.
- Fork issue [#24] already owns release correspondence and backfill; it is neither a prerequisite nor additional work for this plan.
- No runtime or test files change, so Tidy-First assessment and runtime TDD cycles are not applicable.
  The change is non-breaking and independently releasable, subject to explicit publication approval.

[#24]: https://github.com/Jopqior/gotgenes-pi-packages/issues/24
