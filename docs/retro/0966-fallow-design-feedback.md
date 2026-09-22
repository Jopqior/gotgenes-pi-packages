---
issue: 966
issue_title: "Use fallow as design feedback across the workflow: boundaries, review brief, snapshots, coverage"
---

# Retro: #966 — Use fallow as design feedback across the workflow

## Stage: Planning (2026-09-22T04:02:08Z)

### Session summary

Verified every surface the issue names against the 3.22.0 binary (`--help`, `config-schema`, and live runs on this checkout) rather than the 3.27.0 docs, spiked a boundaries config to the point of a zero-violation ratchet with a killing mutation, and measured the snapshot, coverage, and type-aware behaviors the design rests on.
A bundled three-question gate settled the rule model (ratchet narrowed by documented principles), the review depth (`decision-surface` JSON in the reviewer; `guard`/`inspect`/`symbol-impact` in the assessor), and the coverage scope (add `@vitest/coverage-istanbul`, after a timing spike the operator asked for).
Plan committed as `docs/plans/0966-fallow-design-feedback.md`, seven `/build-plan` steps.

### Observations

- Three issue premises did not survive the real surface: the `coverage-gaps` rule at `warn` is inert on 3.22.0 (the `--coverage-gaps` flag works without it); a snapshot records no workspace and `--trend` reads only the gitignored `.fallow/snapshots/`, so per-package trending needs a copy recipe; and `boundaries.coverage.requireAllFiles` does not report a new unzoned `src/` directory, so `autoDiscover` covers that case instead.
- Two measured findings for the skill refresh: `--type-aware --symbol-impact` misses a consumer that receives the symbol as an object-literal shorthand property (`index.ts` for `buildAgentPrompt`) while reporting `confidence: high` (syntactic `--trace` finds it), and `--type-aware` clears 3 of the repo's 5 `unused-class-member` suppressions but abstains on the 2 reached through a field typed by a structural interface.
- The coverage spike was cheap to run (install, measure, revert in about a minute) and moved the decision: real coverage flipped `agent-tool.ts` from 13.8 to 42.0 CRAP and dropped seven estimated flags, at +0.6 s test time.
- The boundary derivation is fallow-native (empty `allow` lists, read `boundary_violations`), so the plan carries a recompute recipe and a verify count rather than a script; the derived table is in the plan for cross-checking only.
- `decision-surface`'s `coupling-boundary` category fires only on an edge a rule forbids, which is why the ratchet (every zone ruled) rather than principle-only rules was the recommended option.
- Tidy-First assessment skipped: no `src/` or `test/` file changes.
- Not filed anywhere: the `--symbol-impact` miss is a candidate upstream report (`fallow-rs/fallow`), left as an Open Question for the operator.

#### Deferred tidyings

- `packages/pi-subagents/src/lifecycle/subagent.ts` — the only `lifecycle → observation` value import (`subscribeSubagentObserver`); the ratchet allows it, the doc states no ordering.
- `packages/pi-subagents/src/observation/renderer.ts` — the only `observation → ui` imports (`display`, `glyphs`).
- `packages/pi-permission-system/src/config/config-loader.ts` — `config → policy` value import (`mergeFlatPermissions`) against the doc's "consumed by `policy/`".
- `packages/pi-permission-system/src/path/pi-infrastructure-read.ts` — `path → policy` value import (`wildcardMatch`).
- `packages/pi-permission-system/src/service/bash-advisory-check.ts` — `service → handlers` value import (`resolveBashCommandCheck`).
