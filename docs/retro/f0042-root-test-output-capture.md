---
issue: 42
issue_title: "test(repo): eliminate remaining root test output leakage"
---

# Retro: #42 — test(repo): eliminate remaining root test output leakage

## Stage: Planning (2026-10-11T01:34:34+08:00)

### Session summary

Committed `docs/plans/f0042-root-test-output-capture.md` in `7a3c2a0e526458257ddf11b1e0f621840475c3a3` after the initial fast-forward-only pull reported the checkout current.
Inventoried complete successful root output, verified actual native output boundaries and upstream testing conventions, and recorded a numbered test-only implementation sequence without changing production or starting implementation.

### Observations

- The operator confirmed following upstream's callback-local capture and `finally` restoration convention after asking whether upstream had a similar approach.
  The plan adopts a small root-test helper rather than a process-module mock or production logging dependency, and includes the resolved Chris Lasher co-author trailer for the adopting commit.
- The ordinary complete baseline passed `43` files and `995` tests in `73.50s`, but emitted `250` application lines: `158` clone/continuation, `4` checkout, `69` git-cliff, `10` recorder and `9` expected-failure lines.
  Explicit-default and verbose complete baselines reproduced that inventory, passing in `74.25s` and `74.84s`.
- Vitest's ordinary command can select its agent reporter in this environment.
  The final gate therefore also exercises explicit default and verbose reporting; a multiline unsupported-remote test title produces a legitimate result continuation that must not be mistaken for application diagnostics or removed.
- The disposable spike used the existing equal-version fixture, real `runGit` and real native child execution.
  It confirmed stream interception, retained decisions/errors, explicit-pipe error fields and outer-captured inner forwarding; a synthetic forwarding expectation initially had an escaped-newline typo, corrected before both spike tests passed.
- The fresh-context Tidy-First assessor recommended no preparatory commits.
  Its optional `nextTag` return-JSDoc correction is included inline with that file's subprocess-option changes; `nextTag` returns a string, unlike `failingNextTag`.
- Keep `fork-sync-scenario.mjs` raw and capture noisy calls locally, so outer diagnostic assertions remain possible.
  `upstream-network.mjs` has intentional child forwarding; `packed-compatibility.test.mjs` does not have the inline forwarding fixture initially assumed and already captures its cleanup Git call.
- The historical missing-CHANGELOG Git failure belongs to test-owned `gitText`, not the successful Git read followed by a missing-section parser error.
  Production output stays unchanged, and captured expected failures retain both their native/domain assertions and emitted text.
- Issue #41 remains completed under its original scope, and issue #40 plus its plan/retro remain untouched and independent.
  The inherited unprefixed permission-system retro for upstream issue 42 is unrelated and was not reused as this fork's context or destination.
- Temporary measurements are in `/tmp/f0042-*`; remeasure against current files during implementation rather than assuming those logs survive or that #40 has not landed.
  No concrete follow-up issue was identified or filed.

#### Deferred tidyings

- Shared subprocess/error-wrapper extraction, fixture restructuring and cross-file `errorOf` cleanup were rejected as unnecessary scope expansion, not scheduled follow-up work.

## Stage: Implementation — TDD (2026-10-11T02:15:57+08:00)

### Session summary

Completed three implementation cycles and the plan's verification-only fourth step in three test commits.
Added callback-local byte capture with unconditional writer restoration, piped the remaining test-owned subprocesses, and captured noisy direct production calls without changing production code.
The root suite increased from 43 files and 995 tests to 44 files and 1006 tests, a delta of one file and 11 tests.

### Observations

- Startup operation-state inspection found no merge/rebase in progress; `git pull --ff-only` reported the checkout current.
  Baseline `check`, root `lint`, full `test`, and root `fallow dead-code` all passed before implementation.
- The helper's seven independent mutations produced the expected reds: missing stdout/stderr capture killed 3/5 tests, missing stdout/stderr restoration killed 5/5, replacing the callback value killed 3, wrapping the thrown value killed 4, and per-chunk UTF-8 decoding killed 1.
  Tests also retain mutable-buffer ownership, both original writers, original thrown objects/primitives, and real native subprocess status/stdout/stderr.
- Subprocess-boundary mutations retained functional success while external log checks detected clone, checkout, historical git-cliff/native failure, table failure, and missing-CHANGELOG diagnostics.
  Direct-call bypass mutations detected decision and CLI-comparison leakage, recorder leakage, and missing-evidence diagnostics; captured-text assertions failed independently where added.
  Every mutation was restored and rerun green before committing.
- The only implementation deviation was locale sensitivity in two newly added missing-revision assertions.
  C-locale focused runs passed, but ordinary `pnpm run test` exposed Git's translated message; the amended direct-call commit retains each specific domain error and requires a nonempty `fatal:` diagnostic line instead of the English translation.
  Both ordinary and C-locale focused runs then passed, and bypass mutations killed both revised assertions.
- Final `pnpm run test`, `pnpm run check`, root `pnpm run lint`, and root `pnpm fallow dead-code` passed.
  Ordinary root, explicit-default, and verbose complete C-locale runs each passed 44 files and 1006 tests in 73.84s, 74.37s, and 74.34s respectively.
  Complete ANSI-normalized logs contained no unassigned application output, and all three stderr files were empty.
  The newline-bearing unsupported-remote title was traced to its actual `it.each` input rather than discarded as noise.
- The positive full-output classifier also rejected a temporary clone-capture removal: its focused test still passed, but `Cloning` and `done.` became two unassigned lines.
  Restoring the boundary returned that focused log to zero unassigned lines.
  Temporary raw logs and inspection tooling remain under `/tmp/f0042-*` and are not committed mechanisms.
- The operator asked whether successful-suite and slow-test lines had disappeared from CI.
  Vitest's existing agent detection explains the sparse local ordinary output; explicit-default output retains those lines, and the previous fork CI log contains the exact example supplied by the operator.
  No reporter setting, test command, workflow, silence flag, production file, package file, lockfile, or issue #40 lifecycle artifact changed.
  Actual CI verification of these new commits remains the next `/ship` stage's responsibility.
- All files listed in the plan's Module-Level Changes table were changed; raw scenario helpers and intentional outer-captured child forwarding remained untouched.
  The helper-adoption commit includes the verified Chris Lasher co-author trailer.
- Pre-completion reviewer: PASS.
  The fresh-context reviewer independently ran deterministic gates and classified the complete ordinary/default/verbose logs; no WARN findings or follow-up issues were reported.
  No release or push was performed; the next step is `/ship 42` on `main`.

## Stage: Ship (2026-10-11T03:31:15Z)

### Session summary

Shipped the implementation directly from the root checkout on `main` in the trunk lane.
The implementation push passed CI run [38108138213](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/38108138213).
No package directory changed, so version prediction and release dispatch are skipped.
The operator approved the issue-close comment after removing its redundant contributor-thanks sentence; closure follows verification of the final stage-note commit.

### Observations

- The fast-forward-only pull reported the checkout current, with six implementation and lifecycle commits ahead of `origin/main` before the push.
  Root `pnpm run lint` and `pnpm fallow dead-code` passed on the pushed tree.
- The complete CI root-suite output passed a positive line classification with no unassigned application diagnostics.
  Vitest retained successful suite results and slow-test lines, and reported 44 passed files and 1006 passed tests in 113.73s.
  The multiline unsupported-remote test title remains a legitimate result continuation.
- The first CI classifier invocation rejected its banner because the expression assumed single spaces; reading the actual CI banner exposed the spacing, and the whitespace-aware expression accepted the banner without discarding application output.
- The plan and retro identify no extra close targets or pending manual verification.
  The implementation range contains only this issue's root tests and lifecycle documents, with no registered or unregistered package candidates and no co-shipped issue.
  Issue #40 remains independent, and issue #41 remains completed under its original scope.
- No worktree or branch teardown is needed in this trunk-lane ship.
  The next step is `/retro 42` at the root on `main`.
