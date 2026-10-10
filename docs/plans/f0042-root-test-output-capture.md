---
issue: 42
issue_title: "test(repo): eliminate remaining root test output leakage"
---

# Capture remaining root test diagnostics

## Release Recommendation

**Release:** ship independently

This is repository-scoped test maintenance, outside package release scopes and package improvement batches.
No package publication, release-policy change or completion of [#40] is required.

## Problem Statement

Successful root `test/` runs still print application diagnostics alongside Vitest output after [#41] captured subprocess output in its retained fixture scope.
The remaining output includes clone and checkout messages, git-cliff information and warnings, recorder stdout, and diagnostics from deliberately failing commands.
Some calls belong to tests; others execute inside production functions imported by tests, so changing a fixture's subprocess options alone cannot cover them.
Expected failures must remain observable to assertions without making successful runner logs noisy.

## Goals

- Make successful complete root-suite output contain only Vitest-generated results and summary, including slow-test results.
- Capture both test-owned subprocess output and output from synchronous production calls executed inside tests.
- Retain returned stdout, native exception fields, exit status, original thrown values, diagnostic assertions and fixture state checks.
- Keep real CLI output, public runtime behavior and release policy unchanged.
- Include currently existing fixtures that [#40] schedules for removal, without changing that issue or its plan.
- Keep the change non-breaking: only test observation boundaries change, not production defaults or contracts.

## Non-Goals

- Reopen or expand the completed scope of [#41].
- Implement, amend or depend on [#40]'s simplification, issue body or acceptance requirements.
- Modify `scripts/`, package code, package documentation, release manifests or workflows.
- Add global Vitest silence settings, quiet command flags, process-module mocks, production logging dependencies or an error-wrapper framework.
- Remove intentional forwarding inside child processes whose outer process already captures and inspects output.
- Turn the small synchronous test helper into an asynchronous, nested, concurrent or general-purpose writable-stream abstraction.
- Capture successful calls that the full inventory finds quiet merely because their options omit `stdio`; list them as predicted unchanged instead.

## Background

### Scope and related work

The issue has `scope:repo`, is open, and was filed by the authenticated operator, `Jopqior`.
It has no package roadmap release tag or release-batch dependency.
[#41] is closed with an implementation summary under its original fixture-capture scope.
[#40] remains open and touches several of the same tests, but does not block this cleanup.
The fork's open-issue searches for `fork-sync` and `release-correspondence` returned this issue and [#40]; the open-PR sweep returned no PRs.
The latest available backlog triage, `docs/triage/2026-10-02-backlog.md`, predates this fork issue and has no entry for it.

No fork-prefixed prior plan or retro exists for this issue.
The fallback search found `packages/pi-permission-system/docs/retro/0042-extract-event-handlers.md`, whose title and content concern an unrelated inherited upstream issue; it is not context or a retro destination for this fork issue.

AGENTS.md requires fork-prefixed plan/retro names, explicit fork targets for GitHub mutations, pnpm-only commands and no inferred publishing authority.
No upstream integration or GitHub mutation is part of this plan.
Reading upstream source for its testing convention did not fetch or import tags.

### Actual output boundaries

On Node `v24.20.0`, the installed native `child_process` implementation's `execFileSync` sets `inheritStderr = !options.stdio`, calls `spawnSync`, then writes `ret.stderr` with `process.stderr.write` before checking for a command error.
This explains successful git-cliff diagnostics as well as expected-failure leakage; exception catching alone is too late.
The inspected native source was saved to `/tmp/f0042-node-child-process-source.js` during planning.

- `test/release/helpers/first-fork-scenario.mjs:createFirstForkScenario` runs a bare clone without explicit `stdio`.
- `test/release/fork-sync-history.test.mjs` owns its clone, checkout commands and `nextTag` subprocess; `failingNextTag` already returns native failure fields for assertions.
- `test/release/correspondence-table.test.mjs` deliberately invokes stale/ambiguous-region CLI failures using `execFileSync` without explicit capture.
- `test/release/release-correspondence-views.test.mjs:gitText` deliberately reads a missing historical CHANGELOG using the same uncaptured native boundary.
- `scripts/release/fork-sync/cliff.mjs:runGitCliff` is reached in-process through `scenario.decide` and `decideForkRelease`.
- `scripts/release/fork-sync/evidence.mjs:runGit` is reached by missing-tag, missing-manifest and unresolved-merge tests.
- `scripts/release/fork-sync/record.mjs:recordForkSync` writes to `process.stdout` when called directly by preparation and shared-boundary tests.

The missing section assertion in correspondence views is different from the missing-file assertion: `readTaggedReleaseSection` can successfully read Git bytes and then throw during section parsing.
Do not attribute that parser failure to subprocess output.
`isAncestorOf` and `requireCommitObject` already use explicit pipe capture and are not remaining leakage sites.

### Established convention and operator decision

Upstream `gotgenes/pi-packages` has no fork release-root suites equivalent to these tests.
Its `packages/pi-subagents/test/helpers/capture-warn.ts`, also present in this checkout, establishes callback-local Vitest spying, diagnostic retention and `finally` restoration even when the callback throws.
The operator confirmed following that convention rather than adapting `execFileSync` with a module mock.
The upstream helper's provenance is commit `a66ad8319e5320152ec99a9ecbb8305afc3d92f9`, authored by Chris Lasher; the adopting helper commit carries the resolved credit below.

## Design Overview

### Test-owned subprocesses

Add `stdio: "pipe"` at the actual test-owned `execFileSync` boundary.
Keep each call's command, arguments, encoding, environment, cwd and trimming unchanged.
The call still returns stdout and still throws the native error on nonzero status, with `status`, `stdout` and `stderr` available.
Do not use `"ignore"`, remove diagnostics or convert existing throwing helpers to `spawnSync` merely to clean output.

Within the already touched first-fork helper and correspondence-table test, explicitly capture their remaining test-owned lookup/snapshot/check calls as well.
Do not blanket-edit every quiet call elsewhere.

### Direct production calls

Add a small root-test helper, `test/helpers/capture-output.mjs`, importing only Vitest and Node's byte utilities as needed.
It captures the no-callback string/Buffer writes used by the observed synchronous paths and returns the callback value with separate stdout/stderr text.
It installs spies immediately before invoking the callback, collects owned chunks, returns `true` from intercepted writes, and restores both original writers in `finally`.
Collect bytes before decoding so Unicode and newlines remain intact.
It does not catch, wrap, normalize or serialize a thrown error.
There is no logger interface, injected production dependency, global setup or persisted output contract.

The JSDoc contract is equivalent to:

```typescript
type CapturedOutput<T> = {
  value: T;
  stdout: string;
  stderr: string;
};
// Synchronous callbacks only; exceptions propagate unchanged.
declare function captureOutput<T>(run: () => T): CapturedOutput<T>;
```

A consumer asks for the outcome and captured text, not access to the helper's spies:

```javascript
const captured = captureOutput(() => scenario.decide());
expect(captured.value.nextTag).toBeNull();
expect(captured.stderr).toContain("there is nothing to bump");
```

Expected exceptions may be asserted inside the callback, so the helper can also return their emitted diagnostics:

```javascript
const captured = captureOutput(() => {
  expect(() => published(missingTag, state)).toThrow(/git|tag|object/);
});
expect(captured.stderr).toContain("Needed a single revision");
```

Keep `test/release/helpers/fork-sync-scenario.mjs:decide` raw and unchanged.
In the large decision suite, its existing local `decide` binding may wrap the raw call and return `.value`, preserving the suite's return/throw semantics without rewriting every assertion.
Tests asserting captured diagnostics must call the raw scenario function inside one capture scope, not nest capture scopes.
Keep `errorOf` unless consumer search proves it unused after migration; a sole-call-site removal must remove the helper in the same commit.
Other suites need only local capture around their actual noisy direct calls.
Do not capture whole tests, setup/teardown or suite lifetimes.

### Edge cases and verification ownership

- Empty output and callback value identity: step 1.
- Ordered string/Buffer writes, Unicode and newlines: step 1.
- Original thrown object/primitive and restoration after success or failure: step 1.
- Real native subprocess success/exception output, without mocking execution: step 1.
- Native CLI failure fields and exact historical stdout: step 2.
- Git-cliff warnings retained alongside unchanged decisions: step 3.
- Recorder output retained alongside unchanged state and tags: step 3.
- Missing-tag/manifest/merge diagnostics retained alongside domain errors: step 3.
- All remaining root output and Vitest's own slow-test display: step 4.

### Evidence provenance

The primary reproduction ran the actual current root suite, not hand-authored approximations, at baseline `a0c18ac08879069a6ac2790986b9e1bef7e406c8`:

```bash
LC_ALL=C LANG=C pnpm exec vitest run > /tmp/f0042-root-baseline-1.log 2>&1
```

Measured result: exit status `0`, `43` files, `995` tests and `73.50s` runner duration.
After stripping ANSI SGR sequences for inspection, every nonblank application line was assigned to a source family:

| Family                          | Measured application lines | Planned capture point                                |
| ------------------------------- | -------------------------- | ---------------------------------------------------- |
| Clone and `done.`               | 158                        | Test-owned clone options                             |
| Checkout                        | 4                          | Historical fixture Git options                       |
| git-cliff information/warnings  | 69                         | Direct-call helper; historical subprocess options    |
| Recorder and continuation lines | 10                         | Direct-call helper                                   |
| Expected command failures       | 9                          | Test-owned pipe options or direct-call helper        |
| Unclassified                    | 0                          | No unassigned baseline lines                         |
| Total                           | 250                        | Complete successful log, not a representative sample |

The predicted post-change target is zero application lines in a successful root run; this is an acceptance requirement, not a measured post-change result.
Do not predict timings or freeze test counts after adding tests.
Separate focused runs attributed output to the decision, shared, CLI-comparison, preparation, upstream-release and correspondence suites; `release-backfill.test.mjs` passed without application output in its focused run.
The exact issue-provided title filters also passed: the first-fork case emitted clone/`done.` lines, and the equal-version case emitted two git-cliff information lines and its warning.
Complete explicit-default and verbose baseline runs both passed the same `43` files and `995` tests and reproduced the same measured `250` application lines; their measured durations were `74.25s` and `74.84s`, respectively.
The baseline logs are `/tmp/f0042-root-default-baseline.{stdout,stderr}` and `/tmp/f0042-root-verbose-baseline.{stdout,stderr}`.
Vitest `4.1.11` selects `agent` rather than `default` when its `isAgent` detection is true (`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js`), so verify explicit default reporting as well as the ordinary command.
Default/verbose logs contain a legitimate multiline test-title continuation from the unsupported-remote case in `first-fork-release.test.mjs`; its newline-bearing input is real test data, not leaked application output.
Trace such continuation lines to their originating result instead of discarding or declaring them diagnostic leakage.

A disposable Vitest spike outside the repo, under `/tmp/f0042-spike/`, used the existing equal-upstream-version scenario and the real `runGit` function to confirm that stream spies capture native diagnostics while retaining decisions and errors.
A separate synthetic child command emitted both streams and exited with status `7`, proving native error fields survive explicit pipe capture; an outer `spawnSync` captured intentionally forwarded inner stderr.
Both spike tests passed after correcting an escaped-newline expectation in the synthetic forwarding control.
The spike validates the observed capture boundaries, not a finished implementation of the new helper.
There was one invocation per deterministic condition, no network or cache-dependent service, and no production edits.

### Structural review

The `design-review` checklist found no production interface growth, parameter relay, output-argument mutation, scattered reset policy or new discriminator.
The new helper accepts only a callback, owns its captured chunks and returns a value; it neither receives domain objects nor exposes spy internals.
Restoration belongs to one callback lifecycle, rather than being shared across suites with different cleanup semantics.

All six direct-call consumer files were checked with `pnpm --silent fallow guard <file>` during planning.
Each is outside configured zones and has unrestricted boundary imports, so imports from `test/release/` to `test/helpers/` are allowed.
The helper imports no consumer or production fixture; it cannot create a reverse dependency into those consumers.

The fresh-context Tidy-First assessor recommended no preparatory commits.
Its optional correction of `nextTag`'s inaccurate return JSDoc belongs in the existing subprocess-options step: `nextTag` returns a string, while `failingNextTag` returns failure fields.
Do not extract fixtures or add a shared subprocess/error wrapper.

## Module-Level Changes

| File                                                 | Planned change                                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `test/helpers/capture-output.mjs`                    | Add minimal synchronous callback-local stdout/stderr capture and unconditional restoration.                                      |
| `test/helpers/capture-output.test.mjs`               | Add value, bytes, exception/restoration and real native-execution tests.                                                         |
| `test/release/helpers/first-fork-scenario.mjs`       | Explicitly pipe bare clone, executable lookup and remote-ref snapshot calls; retain the generated Git wrapper's protocol output. |
| `test/release/fork-sync-history.test.mjs`            | Explicitly pipe fixture Git, clone and `nextTag`; correct only the inaccurate `nextTag` return JSDoc.                            |
| `test/release/correspondence-table.test.mjs`         | Explicitly pipe CLI/check/tag calls; assert native failure status and captured diagnostics as well as untouched document bytes.  |
| `test/release/release-correspondence-views.test.mjs` | Explicitly pipe `gitText`; strengthen the missing historical CHANGELOG assertion without weakening the corpus/section checks.    |
| `test/release/fork-sync.test.mjs`                    | Capture the local decision binding and add raw-call diagnostic assertions while retaining exact decision/evidence checks.        |
| `test/release/fork-sync-cli.test.mjs`                | Capture only the in-process library comparison; leave `runCli` subprocess output available to assertions.                        |
| `test/release/fork-sync-shared.test.mjs`             | Capture direct recorder and decision calls; assert captured recorder text alongside existing state/ref checks.                   |
| `test/release/fork-sync-preparation.test.mjs`        | Capture its direct recorder call; retain preparation subprocess output and state assertions.                                     |
| `test/release/upstream-release.test.mjs`             | Capture the expected missing-manifest and unresolved-merge calls; retain exact domain errors and refs/state checks.              |
| `test/release/release-correspondence.test.mjs`       | Capture the missing-tag direct call; retain provenance and identity/error assertions.                                            |

Predicted unchanged files in the blast radius:

- `scripts/release/fork-sync/{cliff,evidence,record}.mjs`, `scripts/release/release-correspondence.mjs` and all CLI entry points: output belongs to production, so capture stays in tests.
- `test/release/helpers/fork-sync-scenario.mjs`: keeping the raw boundary permits output assertions and avoids nested capture.
- `test/release/first-fork-release.test.mjs`: its existing help case exercises setup clone output externally; it is a focused log acceptance command, not an existing capture assertion.
- `test/release/helpers/git-repository.mjs`: [#41] already supplies explicit pipe capture for its fixture process helpers.
- `test/release/helpers/multi-fork-scenario.mjs`, `test/release/{multi-fork-release,release-publication,worktrees-prediction,fork-sync-cliff,release-backfill}.test.mjs`: inventory includes their process/direct-call boundaries, but the complete baseline attributed no remaining output to them beyond the shared first-fork fixture already listed.
- `test/upstream-sync/helpers/upstream-network.mjs`: its generated wrapper intentionally uses `stdio: "inherit"`; the outer script runner captures output for assertions.
- `test/upstream-sync/{merge,record-fork-sync}.test.mjs`: retain transport, forwarding, exit-status and CLI diagnostic checks.
- `test/worktrees/packed-compatibility.test.mjs`: its existing cleanup Git call already uses `stdio: "pipe"`; it has no inline forwarding fixture requiring alteration.
- `vitest.config.mjs`, `package.json`, root skills and runtime documentation: no runner policy, scripts interface or documented production mechanism changes.
- `docs/plans/f0040-fork-sync-simplification.md` and `docs/retro/f0040-fork-sync-simplification.md`: untouched independent lifecycle artifacts.

Re-check these predictions against the final complete log.
If a currently quiet boundary produces output under the final run, identify its actual owner and apply the same test-only rule; do not infer completeness from the initial file list.
No export removal, module relocation, package architecture diagram or roadmap step-mark is involved.

## Test Impact Analysis

The helper enables isolated tests of capture/restoration and native error preservation without a live logging dependency or a production API change.
These tests do not replace policy, provenance, history, preparation or CLI tests; those exercise real layers and must remain.
No existing suite or assertion becomes redundant simply because its output is captured.
Strengthen the table/view bare failure checks with diagnostic and status assertions rather than replacing them with generic success assertions.

Whole-run output observation is a separate oracle from helper unit tests: a green helper test cannot detect an omitted consumer.
Focused command output must be captured outside Vitest so removing a capture boundary makes a successful test's unwanted output visible.
The existing focused help and equal-version cases reproduced clone and git-cliff output during the full baseline; rerun them with exact title filters in step 4.
Do not embed a recursively running complete root suite inside a new root test.

## Invariants at Risk

| Constituency and invariant                                                                  | Existing or added test surface                                                                                               |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Fixture callers retain stdout/throw behavior established by [#41].                          | New native-execution tests plus existing historical `nextTag` and `failingNextTag` assertions.                               |
| Historical policy readers see only the pinned baseline tag and exact counterfactual result. | `fork-sync-history.test.mjs`: historical patch, tag isolation and forged-manifest cases.                                     |
| Decision consumers retain equal-version no-release behavior and domain failures.            | `fork-sync.test.mjs`: equal-version test, window/provenance failures and added captured-warning assertion.                   |
| Real CLI consumers retain decided tag, JSON, nonzero status and stderr.                     | `fork-sync-cli.test.mjs`: tag, JSON, failure and library-agreement cases.                                                    |
| Recorder consumers retain state/ref behavior and visible real CLI guidance.                 | Direct recorder checks in shared/preparation suites plus `record-fork-sync.test.mjs` CLI output/idempotency/conflict checks. |
| Artifact readers retain exact section bytes and immutable historical failure behavior.      | Correspondence table/views tests, including untouched marker-external bytes and real tagged corpus.                          |
| Upstream-sync wrapper consumers retain deliberately forwarded output.                       | Existing merge/record suites inspect outer-captured status and diagnostics; no wrapper changes.                              |
| Vitest users retain results and slow-test display.                                          | Complete default/verbose logs in step 4; no reporter or global-silence configuration edits.                                  |

The planning baseline pins the application-line inventory, not a performance or caching claim.
The quantitative goal is removal of application lines; stdout/status and document/state byte equality remain enforced by their existing exact assertions.
No invariant is discharged by assuming that future command failures cannot occur.

## TDD Order

Each step is red, green, verify and commit; keep existing fixture and output assertions throughout.
No separate preparatory refactor is recommended.

1. **Add the scoped test-only capture primitive.**
   - Red: add `test/helpers/capture-output.test.mjs` for callback value identity, empty output, ordered string/Buffer writes, Unicode/newline preservation including a UTF-8 character split across Buffer chunks, both channels, and restoration after success and original thrown object/primitive.
   - Include real `execFileSync` executions: a successful returned stdout plus emitted stderr, and a deliberately nonzero child retaining native status/stdout/stderr when its error is caught inside the callback.
   - Green: implement the minimal helper with owned byte chunks, `true` write returns and `finally` restoration; do not add an error result field or production integration.
   - Killing mutations: omit the stdout spy to kill stdout-retention tests; omit the stderr spy to kill stderr/native-diagnostic tests; remove each `mockRestore()` to kill its success/failure writer-identity assertions; replace the returned callback value with `undefined` to kill identity tests; catch and replace the thrown sentinel with `new Error("wrapped")` to kill exception-identity tests; decode each Buffer chunk separately to kill a split-UTF-8 test.
   - Verify: run the new file alone, apply each killing mutation separately, restore it and rerun green.
   - Commit: `test(repo): add scoped output capture for direct calls (#42)`.
   - Credit the adopted upstream restoration/capture convention in this commit's final trailer paragraph:

     ```text
     Co-authored-by: Chris Lasher <chris.lasher@gmail.com>
     ```

2. **Capture remaining test-owned subprocesses.**
   - Red: run the existing first-fork help and historical cases with externally captured logs and observe clone/checkout/CLI diagnostics; strengthen table/view expected-failure checks to inspect the native error's status/stdout/stderr and retain unchanged document bytes.
   - Green: add explicit pipe options at the listed test-owned boundaries, without changing commands, arguments, stdout trimming or failure conversion; correct `nextTag`'s return JSDoc inline.
   - Killing mutations by class: delete the clone's `stdio` option to make the focused first-fork log check detect `Cloning`; delete `gitInFixture` capture to make the historical checkout log check detect `HEAD is now`; delete `nextTag` capture to make historical warning/failure log checks detect diagnostics; delete table `run` capture to make the stale/duplicate-marker log check detect diagnostics; delete `gitText` capture to make the historical missing-file log check detect Git fatal output.
   - The existing functional tests may still pass under those mutations; the external output checks, not a bare `toThrow`, are the predicted red oracle.
   - Verify: run first-fork, history, table and view files; inspect their complete logs and native failure-field assertions.
   - Commit: `test(repo): capture remaining fixture and expected-failure output (#42)`.

3. **Capture noisy direct production calls without changing production.**
   - Red: rerun the equal-version decision and direct recorder/missing-evidence cases with external output capture; assert that retained text includes their actual diagnostic while values/state/errors remain unchanged.
   - Green: use callback-local capture at the six direct-call consumer files in Module-Level Changes; preserve raw scenario helpers and independent CLI subprocess boundaries.
   - Add captured-warning checks on the raw equal-version scenario and captured-recorder checks in shared/preparation tests; add captured Git diagnostic checks on missing tag/manifest/merge failures with domain errors asserted inside the callback.
   - Killing mutations by class: replace the local decision wrapper with the raw binding to make decision-file log verification red; bypass capture in the CLI/library comparison to make that file's log verification red; bypass direct recorder capture to make recorder-file log verification red; bypass the missing-evidence capture to make that failure-file log verification red.
   - Verify: run all six files and the helper tests; run existing decision CLI and recorder CLI contracts to check that output remains available outside Vitest's process.
   - Commit: `test(repo): capture policy and recorder diagnostics in direct tests (#42)`.

4. **Verify the whole successful root output and preserved forwarding.**
   - Red/green completion check: run the focused commands below, then the complete root suite in ordinary, explicit-default and verbose modes, without silence flags or a reduced test selection.
   - Save both stdout and stderr; inspect every nonblank line after ANSI normalization and classify it as Vitest-generated, including nested slow-test lines.
   - A diagnostic blacklist is only an aid: success requires no unassigned application output anywhere in any complete log, with multiline test-title continuations traced to their originating Vitest result.
   - Run the root upstream merge/recorder suites and existing worktree/root tests as part of that complete run; retain intentional child forwarding and all output-sensitive assertions.
   - Killing mutation for the whole-run oracle: temporarily remove first-fork clone capture, rerun the focused first-fork case and confirm the external output inspection detects the leaked clone while the case still succeeds; restore and rerun green.
   - Verify `pnpm run check`, `pnpm run lint`, `pnpm run test` and the normal pre-completion gate; the package-suite portion of `pnpm run test` is outside this issue's root-only silence requirement.
   - Confirm `git diff a0c18ac08879069a6ac2790986b9e1bef7e406c8 -- scripts packages vitest.config.mjs package.json docs/plans/f0040-fork-sync-simplification.md docs/retro/f0040-fork-sync-simplification.md` is empty, absent independently landed concurrent work.
   - No extra implementation commit is needed when this step only verifies; record measurements and any same-scope correction in the implementation retro, then dispatch the fresh-context pre-completion reviewer.

Focused log acceptance commands:

```bash
LC_ALL=C LANG=C pnpm exec vitest run test/release/first-fork-release.test.mjs -t 'describes artifact-only review' > /tmp/f0042-first-fork-final.log 2>&1
LC_ALL=C LANG=C pnpm exec vitest run test/release/fork-sync.test.mjs -t 'derives nothing from an equal upstream version' > /tmp/f0042-decision-final.log 2>&1
LC_ALL=C LANG=C pnpm exec vitest run > /tmp/f0042-root-final.stdout 2> /tmp/f0042-root-final.stderr
LC_ALL=C LANG=C pnpm exec vitest run --reporter=default > /tmp/f0042-root-default.stdout 2> /tmp/f0042-root-default.stderr
LC_ALL=C LANG=C pnpm exec vitest run --reporter=verbose > /tmp/f0042-root-verbose.stdout 2> /tmp/f0042-root-verbose.stderr
```

Check each command's own exit status before interpreting its log; do not pipe it into a filter that masks failure.
The installed Vitest help was checked for `--reporter`; verbose output is an observation mode, not a committed reporter change.

## Risks and Mitigations

- Stream spies cannot intercept children that inherit OS file descriptors directly: use explicit pipe options for test-owned commands and preserve already outer-captured intentional forwarding.
- Capturing too broadly can suppress Vitest output or another test's diagnostics: keep capture synchronous and callback-local, never use concurrent/nested capture, and test restoration after exceptions.
- Capturing diagnostics can leave meaningless failure checks: retain exact domain/native fields and add assertions on captured text rather than accepting any exception.
- Hiding output in a shared fixture can make an outer assertion see empty diagnostics: keep scenario helpers raw, with only test-local wrapping where existing values are needed.
- A passing suite does not prove clean output: inspect full default and verbose logs and demonstrate that a removed capture boundary makes the external oracle fail.
- [#40] could land first and remove a target: re-inventory the current root suite and capture every remaining noisy boundary; do not change [#40]'s plan, resurrect deleted fixtures or skip still-present ones.
- Test helper scope could grow into an output/error framework: retain the single synchronous callback contract and no production dependency or global registration.

## Open Questions

None blocking after the operator confirmed the established callback-capture convention.
No concrete separate follow-up was identified, so no speculative issue is filed.

[#40]: https://github.com/Jopqior/gotgenes-pi-packages/issues/40
[#41]: https://github.com/Jopqior/gotgenes-pi-packages/issues/41
