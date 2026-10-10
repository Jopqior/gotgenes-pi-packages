---
issue: 41
issue_title: "test(repo): capture subprocess output explicitly in test fixtures"
---

# Retro: #41 — test(repo): capture subprocess output explicitly in test fixtures

## Stage: Planning (2026-10-10T23:58:53+08:00)

### Session summary

Committed the repository-scoped plan as `27df01f47c03534324eac40436e4b94311380093` after the required fast-forward-only pull reported the checkout current.
Reproduced fixture stderr leakage through existing tests and actual helper calls, checked retained/replacement call sites against fork issue #40, and completed a fresh-context Tidy First assessment.
No implementation, synchronization integration, push or publication began.

### Observations

- The operator selected existing suites plus disposable focused output verification and explicitly declined new regression tests.
  The plan therefore uses output-check red/green cycles without adding persistent tests or a fixture framework.
- The current target is ten uncaptured `execFileSync` calls across four files: six release-helper calls, one retained Git-path lookup, two tar calls and one provider branch query.
  Existing explicit capture, default-pipe `spawnSync` and generated-wrapper `stdio: "inherit"` remain unchanged.
- The real version suite passed while printing branch-switching and git-cliff messages.
  A disposable outer process imported the real release helper; a child-only builtin-options control suppressed leakage while preserving the complete serialized return/error data byte-for-byte.
  Native Git failure status and streams, existing contextual Bash error messages, and both script runners' forwarded results were inspected; the control is planning evidence, not proof of the future implementation.
- Disposable noisy-success shims delegated to actual tools and produced measured runner-log marker counts of 17 for tar, 1 for `which`, and 1 for the branch query while the existing suites remained green.
  These are synthetic diagnostic injections through real test paths, not naturally occurring tar or `which` warnings.
- Measured baseline suites passed: root scripts had 43 files / 995 tests, and worktrees had 8 files / 74 tests.
  The plan passed `rumdl` and commit hooks; implementation must regenerate focused evidence rather than depend on temporary probe files.
- Fork issue #40 remains a separate planned change, not a prerequisite.
  Follow retained/moved helpers if it lands first, inspect replacement subprocess calls and leave doomed policy fixtures untouched.
  Its plan was not edited.
- No prior fork `f0041-` retro existed.
  The fallback unprefixed `packages/pi-permission-system/docs/retro/0041-extract-permission-gate.md` describes an unrelated inherited upstream issue, so it was read but not reused as fork continuity.
- The package scope check found no published-contract change or roadmap batch for this repository-level test cleanup.
  No concrete follow-up issue was identified.

#### Deferred tidyings

The assessor rejected process wrappers, shared options, fixture migrations, permanent regression scaffolding and cleanup of fixtures fork issue #40 will delete.
Existing option objects already support the change directly; no preparatory commit is warranted.

## Stage: Implementation — TDD (2026-10-11T00:20:38+08:00)

### Session summary

Completed both planned output-check red/green cycles and committed them separately as `test(repo): capture retained fixture subprocess output (#41)` and `test(repo): capture archive and worktree query output (#41)`.
Added ten explicit `stdio: "pipe"` options across the four planned test/fixture files without adding permanent tests or changing production code.
The full suite passed 9,990 tests before and after implementation, a test-count delta of zero.

### Observations

- Startup operation-state inspection found no merge/rebase in progress, the working tree was clean, and `git pull --ff-only` reported the checkout current.
  Baseline and final `pnpm run check`, root `pnpm run lint`, `pnpm run test` and root `pnpm fallow dead-code` all passed; lint logs contained no Biome warning markers.
- Regenerated the disposable release probe instead of reusing planning's builtin-options control.
  It imported the actual helper in an outer child process with fixed Git dates and locale, exercised all six changed helper paths, caught native Git and wrapped Bash failures, and inspected both unchanged script runners.
  Outer stderr fell from 1,253 bytes to zero, while the complete 2,876-byte serialized return/error data stayed byte-identical.
  Native Git failures retained status `128` and captured diagnostics; both script runners retained forwarded stdout, stderr and status `7`.
- Regenerated separate noisy-success PATH shims that delegated to real `which`, tar and Git commands through existing suites.
  The suites passed before the edits while their output predicates failed; marker counts fell from 1, 17 and 1 respectively to zero after the edits.
  These markers are synthetic diagnostics, not claims of naturally noisy tar, path lookup or branch-query success.
- Focused version/network checks passed 14 tests; the complete root script suite passed 43 files / 995 tests, and worktrees passed 8 files / 74 tests.
  Packed file-list/content assertions, rescued-branch assertions and generated-wrapper forwarding remained intact.
  No new tests were authored, and the plan specified no killing mutations for these output-check cycles.
- The synchronous-call census was repeated after implementation.
  Fork issue #40 had not landed, so all planned retained paths remained in place; its obsolete policy fixtures were deliberately left untouched and still emit some output in the full root suite.
  All four planned edit targets changed; the other listed verification inputs stayed unchanged as predicted.
  There were no plan deviations, lockfile changes, module-layout changes, architecture updates or new follow-up issues.
- Pre-completion reviewer: WARN, with no blocking findings.
  The reviewer independently ran all deterministic gates and repeated the green output probes.
  Reviewer warnings: the automated public-contract decision surface flagged the exported `createScratchReleaseRepository` change because no permanent contract test or external consumer edit was added.
  Existing consumers and the complete return/error comparison showed no contract break; the warning does not change the operator-approved decision to use disposable verification only.
- No push, package publication, release dispatch or production synchronization was performed.
  The next stage is `/ship 41` on `main`.

## Stage: Ship (2026-10-11T00:32:00+08:00)

### Session summary

Shipped the implementation directly from the root checkout on `main` and closed fork issue #41 with the operator-approved comment.
The implementation push passed [CI run 38067516359](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/38067516359).
No release was dispatched and no worktree teardown was needed.

### Observations

- Trunk-lane detection found no `issue-41-*` branch, no pending merge/rebase and a clean working tree.
  The fast-forward-only pull reported the checkout current; seven local commits were pushed, including fork issue #40's planning artifacts, not its implementation.
  Issue #40 remains open and is not a co-shipped completion.
- Root `pnpm run lint` and `pnpm fallow dead-code` passed on the implementation tree before pushing.
  Both origin URLs named only this fork and no URL rewrite was configured.
- The plan's release marker was `ship independently`.
  The validated registry found only `@jopqior/pi-subagents-worktrees` as a changed package, with no unregistered changed directory.
  Its version predictor exited zero with empty stdout, so there was nothing to publish; publication approval, dispatch and release verification were skipped.
- The plan and complete retro contained no additional close target or unfinished verification requiring a ship-time decision.
  The issue's author was the operator and there were no commenters to credit separately.
  Both implementation hashes in the approved close comment were resolved and confirmed ancestors of `main` before publication.
- This checkpoint records the completed implementation ship; its documentation-only commit still needs the final push and CI verification.
  The next workflow step is `/retro 41` at the root on `main`.
