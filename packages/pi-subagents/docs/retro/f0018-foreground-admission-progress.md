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
