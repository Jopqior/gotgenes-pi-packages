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

## Stage: Implementation — TDD follow-up (2026-09-21T07:17:00Z)

### Session summary

At the operator's request, a new implementation subagent addressed the observer-order warning in `test(pi-subagents): pin admission observer callback order (#18)`.
The existing admission test now asserts a shared `manager` then `spawn` event sequence while retaining delivery-count and record-identity assertions; production code and test counts are unchanged.

### Observations

- The implementing agent temporarily swapped the production callback order and observed the new assertion fail with the reversed sequence, then restored the production file before verification and commit.
- An independent delta review returned PASS and reran root check, lint, tests, and dead-code analysis sequentially with all checks passing.
  Lint again used `NODE_OPTIONS=--max-old-space-size=6144`.
- The callback-order warning is resolved.
  Historical mutation logs outside the repository remain outside the reviewer's inspection scope; its PASS rests on independent source inspection and current checks, not a claim to have witnessed those historical runs.

## Stage: Sync (worktree) (2026-09-21T07:50:48Z)

### Session summary

Root lint passed with `NODE_OPTIONS=--max-old-space-size=8192`, and `pnpm fallow dead-code` reported no issues.
The issue branch is checked out in the root checkout rather than a separate peer worktree; synchronization leaves `main` untouched, and publishing still requires explicit release-destination approval.

**Peer session transcript:** `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/2026-09-21T07-46-57-883Z_01a0c2ee-b0da-74b9-b662-039f0b804a3f.jsonl` — read with `read_session_file` for message-level verification.

### Observations

- This is a synchronization breadcrumb only; final `/retro 18` runs at the root after `/ship 18`.
- No branch push, issue closure, or release is performed in this stage.

## Stage: Ship (2026-09-21T07:56:53Z)

### Session summary

Fast-forwarded `issue-18-plan-foreground-admission-progress` into root `main` from `993d01cab49d8045d279962d8e39b4decc723f95`.
Root lint with an 8192 MiB Node heap and dead-code analysis passed on the landed tree.
Push, CI verification, issue closure, and release verification follow this checkpoint.

### Observations

- The operator explicitly authorized publishing `@jopqior/pi-subagents` to npmjs.org and creating the corresponding tag and GitHub Release in `Jopqior/gotgenes-pi-packages`.
  The plan recommends independent release and the implementation carries the planned breaking-change marker.
- The landed range touches only `pi-subagents` plus the repository test-timeout adjustment; no co-shipped issue or adopted PR is identified in its commits, plan, or retro.
- Lane detection found an issue branch, but `git worktree list` contains only the root checkout.
  After successful release verification, delete the merged branch without attempting to remove a nonexistent peer directory.
- Final interactive retrospective remains `/retro 18` at the root on `main`.

## Stage: Final Retrospective (2026-09-21T08:13:16Z)

### Session summary

Reviewed the planning, implementation, follow-up, synchronization, and shipping transcripts, including the child sessions rather than only their reports.
The foreground admission repair and observer-order follow-up landed, and the shipping transcript records successful CI, release, issue closure, and branch cleanup.
This retrospective preserves those outcomes and proposes a bounded TDD validation adjustment without reopening production work.

### Observations

#### What went well

- Reusing the real-manager boundary harness from fork issue #17 exposed the connection that mock-driven foreground tests bypassed.
  The implementation transcript records missing-callback Red, restored forwarding Green, and separate mutations for presentation, waiting, consumption, and spinner cleanup.
- Independent review distinguished correct production ordering from missing regression protection, and the operator-approved follow-up added a shared event sequence in `test(pi-subagents): pin admission observer callback order (#18)`.
  Swapping the callbacks then failed the assertion without changing the shipped production behavior.

#### What caused friction (agent side)

- `other` — Root validation commands did not carry the resource settings already used by `/sync-worktree` and `/ship`.
  The implementation child ran plain lint twice before using a larger heap, then repeated concurrent root gates at final verification despite the baseline resource failures.
  Impact: failed lint reruns, an isolated test rerun, and another full test run; serial success supports a load-sensitivity hypothesis but does not prove that concurrency was the only cause.
  The separately committed timeout adjustment addressed a different test that also failed in isolation.
- `missing-context` — The plan preserved manager-before-spawn ordering but its mutation list did not include swapping those callbacks, and the initial tests recorded them in separate arrays.
  Impact: an additional test commit and independent delta review after the first review returned WARN.
  This was reviewer-caught; the operator chose to address it after asking what the callbacks meant and why order mattered.
- `instruction-violation` — The implementation child omitted the producer's `twin` tag from the initial exact pending-tags expectation despite the TDD instruction to copy producer output.
  Impact: one expectation correction and targeted rerun after the forwarding fix.
  Self-identified during implementation.
- `instruction-violation` — The implementation parent delegated before loading the package and TDD skills inline; its child loaded them, but that did not satisfy the parent's inline-loading instruction.
  The child also used `sed` to read source despite the `read` requirement.
  Impact: weaker instruction visibility and nonstandard inspection, with no specific code rework attributable to either breach.
  Self-identified in this retrospective, not caught during execution or by the operator.
- `other` — The spinner mutation initially changed a comment instead of deleting the target statement; the child inspected the diff and corrected it before running the mutation test.
  Impact: an extra edit and inspection, without false-green evidence being accepted.
- `other` — Historical mutation logs were kept in `/tmp`, outside the reviewer's allowed filesystem scope.
  Impact: the reviewer could independently inspect current code and run gates but could not attest to those historical results; the parent also resumed it once to obtain the required `Overall: WARN` line.

#### What caused friction (user side)

- The first WARN summary named two observers without explaining their responsibilities or the practical consequence of their order, requiring an explanatory exchange before the operator could decide.
  Opportunity: the agent should lead with “manager lifecycle notification, then this invocation's record capture” and distinguish a missing test pin from a current bug.
  No missing operator context caused the defect; release approval remained an appropriate strategic decision rather than mechanical oversight.

### Diagnostic details

- Model-performance correlation: the implementation child ran on `zai-coding-cn/glm-5.3-flash`; the Tidy-First assessor, initial reviewer, callback-order follow-up implementer, and delta reviewer ran on `openai-codex/gpt-6-astra`, as shown by their own transcript turn labels.
  The implementation child completed the planned mutations but needed local corrections for tags and the spinner edit, while independent review found the order pin the plan also omitted.
  This is insufficient evidence for a blanket model restriction or a cost comparison; retain bounded implementation delegation with independent judgment review.
- Feedback-loop gap analysis: verification was incremental, not deferred until completion: baseline, targeted Red/Green, mutations, package gates, and independent root gates all appear in the transcripts.
  The actionable gap was concurrent root verification and inconsistent lint heap settings, not missing checks.
- Unused-tool detection: the implementation child spent five consecutive shell calls locating `AgentToolResult` through guessed SDK declaration paths before moving on.
  The available path search could have located the declaration without repeated guesses; this bounded detour did not exceed the escalation threshold.
  Existing exploration and source-reading instructions already address it, so no additional rule is proposed.

### Evidence and scope

- Parent transcripts reviewed under `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/`: planning `2026-09-21T05-53-00-145Z_01a0c286-5af0-731b-9054-267c6a6ec308.jsonl`, implementation `2026-09-21T06-18-13-459Z_01a0c29d-7252-7260-abf8-5262765b32c1.jsonl`, synchronization `2026-09-21T07-46-57-883Z_01a0c2ee-b0da-74b9-b662-039f0b804a3f.jsonl`, and shipping `2026-09-21T07-52-37-900Z_01a0c2f3-e10b-77cf-abcd-b0d8a321adb6.jsonl`.
  Child transcripts were located with `list_subagent_sessions` and read with `read_session_file`; this retrospective did not rerun historical mutations.
- Proposed adjustment: make baseline and final TDD root gates sequential and use the existing ship/sync lint heap command in `.pi/prompts/tdd-plan.md`.
  The operator selected notes only in `ask_user`; this proposal is not implemented or scheduled.
- Declined additions: another generic mutation rule, a global model policy, wider reviewer filesystem access, and blanket test-timeout changes.
  Existing rules cover the first; the other changes need evidence or authorization beyond this retrospective.
- The plan names no roadmap successor for fork issue #18, and the current fork open-issue query returned none.
  The newest triage, `docs/triage/2026-09-18-backlog.md`, ranks upstream work rather than an authorized fork queue; no upstream item is promoted automatically.

### Changes made

1. Appended this cross-session retrospective to `packages/pi-subagents/docs/retro/f0018-foreground-admission-progress.md`, preserving all prior stage entries and recording the operator's notes-only decision.
2. Left `AGENTS.md`, prompts, skills, production code, tests, and `CHANGELOG.md` unchanged; no follow-up issue was filed.
3. After the initial retrospective commit, the operator rejected distributing machine-resource settings across workflow prose and explicitly approved project-level configuration instead.
   Added `nodeOptions: "--max-old-space-size=8192"` to `pnpm-workspace.yaml`; existing prompt prefixes remain unchanged.
   Verification with inherited `NODE_OPTIONS` removed passed: `pnpm run lint` completed successfully, and `pnpm exec node` reported the configured environment value and an 8384 MiB V8 heap limit.
   The configured old-space limit is not a total-process or aggregate concurrency budget.
