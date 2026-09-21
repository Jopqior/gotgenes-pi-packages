---
issue: 18
issue_title: "Forward per-spawn admission observation to foreground selection progress"
---

# Retro: #18 — Forward per-spawn admission observation to foreground selection progress

## Stage: Planning (2026-09-21T06:07:58Z)

### Session summary

Verified the issue's source trace and committed the implementation plan in `packages/pi-subagents/docs/plans/f0018-foreground-admission-progress.md`.
The planned production change forwards the existing per-spawn admission observer; regression coverage keeps the foreground tool, manager, and record real.
No implementation was started.

### Observations

- The initial `git pull --ff-only` reported already up to date, and the issue author matches the authenticated operator.
  Planning commits are on `issue-18-plan-foreground-admission-progress`, created from `main`.
- Related fork issue #17 is closed with the background selection boundary implemented; its existing real-manager test harness provides the regression seam for this issue.
  The fork has no sibling open issue or open PR from the performed sweeps.
- `Subagent.run()` emits `onStarted` before selection becomes pending.
  The foreground runner needs the live record reference so subsequent interval updates observe the transition; the initial synchronous pre-spawn placeholder remains unchanged.
- The supplied source diagnosis was confirmed, not interactively reproduced.
  At baseline `993d01cab49d8045d279962d8e39b4decc723f95`, the targeted manager, runner, and tool-boundary suite passed: measured 3 files and 138 tests.
- The workflow's strict observable-output rule makes this a breaking change despite unchanged configuration and public types.
  The plan recommends independent shipping, without authorizing publication.
- Tidy-First recommended no preparatory commit.
  Its optional setup move is avoided by placing new manager admission tests in a sibling describe group that owns construction and disposal, rather than overwriting the existing group's manager.
- No matching fork retro existed; the inherited issue-18 fallback records an unrelated permission-system change and contributes no prior decision to this plan.

#### Deferred tidyings

- `test/tools/spawn-selection-boundary.test.ts`: global fake-timer conversion and a generic progress/gate framework would enlarge a regression that existing held gates and bounded positive waits already support.
- `test/helpers/manager-stubs.ts`: shared fixture expansion is unnecessary because the existing configurable session stub can hold task completion.
- `src/lifecycle/subagent-manager.ts` and `src/tools/foreground-runner.ts`: observer-composition, exception-policy, and runner restructuring are unrelated to restoring the missing callback.

## Stage: Implementation — TDD (2026-09-21T07:05:20Z)

### Session summary

Completed the single planned TDD cycle in `feat(pi-subagents)!: show pending foreground model selection (#18)`.
The manager now forwards admission to the per-spawn observer, and real-path tests check pending presentation, confirmed selection before session creation, whole-run waiting, consumption, and spinner cleanup.
The package suite increased from 1953 to 1956 tests; root checks, lint, tests, and dead-code analysis passed in the independent review.

### Observations

- Remote synchronization used `git fetch origin` on the existing issue branch; no rebase or push was performed.
- Baseline cleanup was committed separately as `test: allow slow hosts to finish the upstream-sync re-record test`, extending one existing git-heavy test's timeout without changing its assertions.
  Root lint exhausted the default Node heap and passed with `NODE_OPTIONS=--max-old-space-size=6144`.
  Concurrent final gates exposed another git-test timeout; a sequential full test rerun and the reviewer's sequential gates passed without another code change.
- The initial regression run failed in the three new manager tests and the extended foreground boundary test before the production forwarding line was added.
  The implementing agent ran and restored all eight planned killing mutations; its logs remain session-local under `/tmp/f0018-*.log`.
- Pending presentation retains both `twin` and `inherit context`, matching the producer's actual append-mode tags.
  No public interface, architecture description, roadmap entry, lockfile, or changelog update was needed.
- Pre-completion reviewer: WARN, with no blocking findings.
  Reviewer warnings: the observer tests assert identity and delivery counts but do not pin manager-before-per-spawn relative order; the production order is correct.
  The reviewer independently checked source and ran all four root gates, but its filesystem scope prevented reading the historical mutation logs outside the repository.
- All planned implementation steps are complete.
  The next step on this issue branch is `/sync-worktree 18`, followed by `/ship 18` from the root session; publishing still requires explicit release-destination approval.
