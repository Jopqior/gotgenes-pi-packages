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
