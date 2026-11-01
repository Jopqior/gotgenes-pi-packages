---
issue: 46
issue_title: "Sync gotgenes/pi-packages@52854c12d590142e61a4f6a6947be9084035300d"
---

# Retro: #46 — Sync gotgenes/pi-packages@52854c12d590142e61a4f6a6947be9084035300d

## Stage: Planning (2026-11-01T23:15:37+08:00)

### Session summary

Committed the repository-scoped pinned synchronization plan in `d8ca6e3475f303f09cdc374c2f1aee07cd90242c`.
Inspected incoming paths, fork intersections and a non-mutating merge preview, obtained operator decisions and completed Tidy First assessment.
No actual merge, implementation, push or publication occurred; the next stage is `/tdd-plan`.

### Observations

- Fixed target: `52854c12d590142e61a4f6a6947be9084035300d`; common base: `41405de895fb53f802df89f8978456cd1dae397e`.
  The plan owns inventory regeneration, selected review scope, conflict policy and exact-ref reviewer handoff.
- Startup `git pull --ff-only` ran before loading `fork-sync`, contrary to synchronization ordering, and returned `Already up to date.`.
  After the issue was read, the skill/references were loaded and primary-checkout, branch, clean-state and operation prerequisites were verified before subsequent synchronization Git work.
  Future stages must load synchronization constraints before startup Git operations.
- The initial decision briefing overgeneralized preservation checks as compatibility conflicts.
  The operator requested concrete upstream/fork comparisons; inspection showed no incoming cancellation/worktrees implementation change, only timing/presentation intersections and existing identity differences.
  Preserve existing selection/workspace behavior without inventing a new lifecycle design.
- The operator explicitly rejected an extra fork breaking declaration merely for adopting upstream changes.
  Retain upstream history/version semantics; no new `!` or `BREAKING CHANGE:` requirement was added to the synchronization commit.
- The operator approved the visible-text `ask_user` guard and the concrete template improvements.
  The `sync-worktree.md` conflict combines fork lifecycle-file naming with upstream's simpler `PI_SESSION_FILE` lookup; both fit together.
  Preserve the existing fork safe-log-redirection rule when resolving the separate testing-skill text conflict.
- The operator required checking existing selector presentation coverage before adding tests.
  Opened the display, widget, observed-selection and timeout-advice tests, then ran the related six-file core set: 209 tests passed at the pre-integration fork HEAD.
  Reuse these tests after merging; no duplicate tests are planned or approved.
- Read-only source resolution succeeded separately for both registered forks at planning HEAD.
  Contained target anchors are upstream core `25.0.5` and worktrees `0.3.3`; core's predicted tail comes from the later phase archival also changing `docs/fallow-snapshot.json`, not from a reason to move the target.
  Re-run the actual resolver per fork after the real merge; no source block was authored.
- Complete temporary inventories and preview outputs are under `/tmp/f0046-*`; durable regeneration inputs live in the plan.
  The preview is not an integration commit or evidence that merged tests pass.
- The shell lacks the `pnpm` shim, but `corepack pnpm` resolves `11.25.0`.
  Direct checks used that entry point; a disposable Corepack shim directory supplied nested `pnpm` calls during the plan commit without changing global configuration.
  Plan Markdown lint and commit hooks passed.

#### Deferred tidyings

These candidates were considered and rejected, not queued implementation work:

- `src/ui/display.ts`: no duration adapter; incoming consumers already migrate to the narrow timing formatter.
- `test/lifecycle/subagent-manager.test.ts`: no advance fixture refactor; upstream already supplies `makeAgentConfig`, and both fork/incoming imports must survive resolution.
- Existing selector presentation tests: no migration or duplicate scenarios merely for synchronization.
- Lifecycle/service and permission modules: no unrelated structural cleanup; no preparatory commit was recommended.
