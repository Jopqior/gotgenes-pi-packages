---
issue: 40
issue_title: "refactor(repo): simplify fork-sync scripts, release integration, and tests"
---

# Retro: #40 — refactor(repo): simplify fork-sync scripts, release integration, and tests

## Stage: Planning (2026-10-10T15:15:27Z)

### Session summary

Committed the repository-scoped implementation plan in `f05e395efa052e5758dc2cd26ed70766d0a03ea6` after the required fast-forward-only pull reported the checkout current.
Inventoried live script/prompt/CI consumers and scenario-level test dispositions, then verified source reconstruction and ordinary git-cliff behavior against real fork/upstream objects.
The plan sequences new source and metadata modules alongside the old consumers, one accepted preparatory test commit, a coordinated policy removal, namespace cutover and separate packaged-documentation refresh; no implementation, integration or publication began.

### Observations

- The operator approved automatic source preflight in a temporary bare repository during release preparation.
  Normal execution is in CI; an explicitly allowed local preparation follows the same route, while local version prediction remains offline.
  Acquisition must use no-tag fetch into temporary refs, leave the fork's refs/config/tag namespace untouched, fail before tracked release writes and clean temporary resources on both outcomes.
- The operator asked whether preserving the existing latest-tag range contradicted the issue.
  It does not: the issue explicitly asks to retain justified local range-safety fixes, and the real first-release history measured `1.0.1` with the bound versus the false `2.0.0` without it.
  Removing the fork-specific version policy must not remove `bumped_version`'s ordinary range safety.
- Real current core source resolves to stable `23.2.0` at `6879774308ba8056859fa42284da71763fe1fe78`, incorporated through `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`.
  Worktrees independently resolves to `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`; newer remote tags do not become incorporated source.
  Real positive-tail range probes used actual upstream commits, but those tips were not integrated into this fork; the plan labels that distinction.
- The first historical git-cliff probe accidentally left later fork tags visible and produced misleading historical predictions.
  Those results were discarded; disposable checkouts at the real preparation commits, with future tags removed only there, produced the measured ordinary `5.0.0` and `6.0.0` predictions.
  Current core/worktrees predictions both return successful empty stdout.
- Tidy First exposed an invalid reuse premise: the old single-fork fixtures create “upstream” branches from fork HEAD.
  New source fixtures must have independent upstream ancestry, real stable tags and local bare transport, not merely omit ledger fields.
  Accepted preparation is limited to isolating exact section/CRLF/fence contracts from ledger fixtures in the plan's step 3.
- The exact section corpus has existing first-tag gaps for core and selector; preserving scanner failures is not authorization for historical repair.
  The old insertion helper also normalizes boundary bytes, so prepared/tagged section equality needs a new executable pin rather than an assumption.
- `.pi/prompts/ship.md`'s executable registry import and `test/worktrees/package-contract.test.mjs`'s exact registration assertion are coordinated migration points outside an ordinary release-script import sweep.
  The packaged README changes have their own `docs:` commit, separate from the breaking root-tooling commits, to avoid assigning package major bumps for maintainer guidance alone.
- Planning checks passed: the full root script suite measured 43 files / 995 tests, and the explicit focused version suite measured 12 tests.
  `pnpm run test:scripts -- <file>` ran the whole suite in this environment; use `pnpm exec vitest run <file>` for a focused run.
  The plan passed `rumdl` and commit hooks.
- No concrete follow-up issue was identified; the open fork selector issue #26 is unrelated.
  Temporary probe files are disposable evidence, not implementation artifacts; the committed plan records the real Git inputs and measured results for regeneration.

#### Deferred tidyings

The assessor rejected rebuilding old ledger fixtures, extracting obsolete decision/recorder/table helpers, compatibility wrappers, a larger script-copy framework, mechanical line-count splitting and generic tag-selection-loop cleanup.
None is an implementation task or an approved follow-up issue; the plan removes obsolete responsibilities instead.
