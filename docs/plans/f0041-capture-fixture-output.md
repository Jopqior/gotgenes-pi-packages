---
issue: 41
issue_title: "test(repo): capture subprocess output explicitly in test fixtures"
---

# Capture subprocess output in retained test fixtures

## Release Recommendation

**Release:** ship independently

This repository-scoped, test-only change is not part of a package roadmap or release batch.
Landing it does not require a package publication, release-policy change or completion of [#40].

## Problem Statement

Successful tests print Git branch-switching, bare-repository initialization and git-cliff messages from fixture subprocesses directly into the runner output.
These messages obscure results even though the invoking fixture already captures command stdout and can report failures.
The same missing explicit capture appears in otherwise quiet tar, Git branch-query and Git-path-query calls.

## Goals

- Add `stdio: "pipe"` directly to retained synchronous subprocess calls that lack explicit capture.
- Preserve stdout bytes, existing string/Buffer conversions, nonzero-exit behavior and existing error reporting.
- Preserve intentional forwarding into an outer process capture.
- Verify output with existing suites and disposable focused process checks, without adding regression tests, as selected by the operator.
- Keep production behavior and published contracts unchanged; this is not a breaking change.

## Non-Goals

- No subprocess abstraction, logging/error wrapper, shared options object, fixture framework, global Vitest silence setting or command-specific quiet flags.
- No production files, package manifests, release policy, package README or architecture changes.
- No cleanup of obsolete fixtures solely to have [#40] delete them.
- No changes to [#40]'s implementation plan, sync behavior or migration sequencing.
- No attempt to make the entire current root-suite log silent while intentionally excluded, soon-to-be-deleted suites still exist.
- No new permanent output-verification tests or probe scripts.

## Background

The issue is open and was filed by the authenticated operator.
The latest repository triage, `docs/triage/2026-10-02-backlog.md`, predates this fork issue and supplies no entry for it.
Open-issue searches for `execFileSync`, `fixture`, `git-repository` and `worktrees` identify [#40] as the overlapping work; the fork has no open PRs at planning time.

Node's synchronous APIs differ at the relevant boundary.
Without an explicit `stdio` option, `execFileSync` captures command stderr but also writes it to its parent's stderr.
Explicit `stdio: "pipe"` retains the captured data without that unsolicited write.
Existing `spawnSync` calls already capture stdout/stderr by default and do not need mechanical option additions.

The release fixture owns Git commands and Bash invocations in `test/release/helpers/git-repository.mjs`.
Its native Git errors carry process status and captured streams; `bumpedVersion` and `renderReleaseSection` instead preserve captured diagnostics in their existing wrapped error messages.
The upstream network's generated Git wrapper deliberately uses `stdio: "inherit"` to forward into the script process's outer capture.
The worktrees fixture already demonstrates direct `stdio: "pipe"` options without another layer.

[#40] is planned but not implemented at the planning baseline.
It retains the generic release fixture, moves a trimmed upstream-network helper to `test/fork-sync/helpers/`, updates the worktrees contract test, and removes old policy-specific tests and fixture helpers.
There is no implementation dependency: either issue may land first, provided this change follows retained/replacement call sites rather than reviving deleted code.
Repository-root execution, pnpm-only commands and fork-specific `f0041-` artifact naming apply.

## Design Overview

Edit each existing options object in place; do not alter arguments, environment, cwd, encoding, return expressions, catches or cleanup.
The measured current target is ten missing-capture calls across four files.
An `execFileSync` census finds six calls in the release helper, one in the network helper, three in the package contract and four in the provider test; exclude the already captured pack call and three already captured provider cleanup calls.

The `which git` lookup is ordinarily quiet, but it is a retained call of the same synchronous API and should explicitly capture diagnostics as well.
Silent-success calls are included because a subprocess can produce diagnostics without changing its exit status.
No interfaces, collaborators, exports, import edges or lifecycle state are introduced.
The Tidy First assessor read the target files and recommended no preparatory commits: the existing option objects are already the appropriate edit points.

### Evidence provenance

Measurements were made at `fb826e71a50b0de8da2972617918f7ba3cc34a43` with Node `v24.20.0` and git-cliff `2.14.2`.
The real reproduction ran the issue's existing `pnpm exec vitest run test/release/bumped-version.test.mjs` command, not a reconstructed version of its logic.
It passed while emitting branch-switching and git-cliff configuration messages.

A disposable outer Node process also imported the actual release helper and exercised Git checkout, `gitOut`, local bare-origin creation, version calculation, section rendering and cliff argument retrieval.
It additionally invoked invalid Git revisions, an invalid git-cliff option, and both existing script runners against a disposable script that emits stdout/stderr and exits nonzero.
A control changed only the child process's Node builtin invocation options to explicit pipe capture before importing the same helper; no repository files were modified.
Fixed Git author/committer dates and an identical locale made the returned release data comparable.
Both processes exited successfully; the actual helper leaked stderr, the control did not, and the complete serialized returned data and failure diagnostics were byte-identical.
This deterministic local process check used one execution per condition and has no cache-dependent source.

Separate disposable PATH shims emitted a stderr marker before delegating to real tar, `which`, or the provider test's `git branch --list` command.
These are synthetic diagnostic injections through real existing test paths, not claims that ordinary tar or `which` currently emits those messages.
They confirmed that currently quiet success paths also leak diagnostics.

| Observation                                                          | Measured baseline                  | Expected after the change              |
| -------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| Release-helper outer process stderr                                  | Nonempty Git/git-cliff diagnostics | Empty (predicted; remeasure in step 1) |
| Complete serialized returned data, actual helper versus pipe control | Byte-identical                     | Byte-identical (predicted; step 1)     |
| Noisy tar marker in the contract suite                               | 17 matches                         | 0 matches (predicted; step 2)          |
| Noisy `which` marker in the network suite                            | 1 match                            | 0 matches (predicted; step 1)          |
| Noisy branch-query marker in the provider suite                      | 1 match                            | 0 matches (predicted; step 2)          |

Native Git failures must still throw with captured streams, and existing Bash wrappers must still report their contextual message and captured diagnostics (step 1).
Successful stdout remains available to callers, including tar listings, extracted packed files and the rescued-branch query (step 2).
The generated Git wrapper's forwarded output must still reach existing outer assertions (step 1).
Do not require empty stderr from a deliberately failing command's result object; require its absence from the outer terminal stream when the failure is caught for inspection.

## Module-Level Changes

- `test/release/helpers/git-repository.mjs`: add explicit pipe capture to `git`, `gitOut`, `bumpedVersion`, `renderReleaseSection`, `addLocalOrigin` and `cliffArgs`.
- `test/upstream-sync/helpers/upstream-network.mjs`: add explicit pipe capture to the top-level `realGit` lookup if it remains at this path.
  If [#40] has landed, follow the retained lookup in `test/fork-sync/helpers/upstream-network.mjs`; inspect any replacement synchronous calls instead of restoring the old file.
- `test/worktrees/package-contract.test.mjs`: capture the tar listing in `beforeAll` and extraction in `packedRead`; retain the pack call's existing `stdio: ["ignore", "pipe", "pipe"]`.
- `packages/pi-subagents-worktrees/test/workspace-provider.test.ts`: capture the branch-list query in the saved-branch disposal test, retaining its Buffer-to-string conversion and assertions.
- `test/release/bumped-version.test.mjs`: predicted unchanged; its version, rendering and failing-entry-point assertions exercise the same retained helper and are verification inputs, not edit targets.
- `test/upstream-sync/upstream-network.test.mjs`: predicted unchanged while present; its output/tag assertions exercise the generated wrapper and outer capture.
  If removed by [#40], use its retained forwarding/safety scenarios in `test/fork-sync/` instead.
- `packages/pi-subagents-worktrees/test/support/git-fixture.ts`: predicted unchanged because its subprocess calls already explicitly capture output.
- Other package tests and generated wrappers: predicted unchanged after the synchronous-call census; existing explicit capture, default-pipe `spawnSync`, mocks and asynchronous processes are not this change's missing-capture sites.
- No module layout or architecture metric changes are expected; the worktrees package has no `docs/architecture/architecture.md` or roadmap entry for this issue.

The census also found uncaptured calls in old fork-policy helpers and tests, including `first-fork-scenario`, `multi-fork-scenario`, `fork-sync-history`, `fork-sync-cliff`, `release-correspondence-views` and `multi-fork-release`.
Their deletion/replacement is already specified by [#40]; leave those old sites untouched and inspect actual replacements if they exist when implementation begins.

## Test Impact Analysis

There is no extraction, no newly enabled lower-level test seam, and no new permanent test coverage.
No existing test becomes redundant because of this change; keep existing behavioral assertions as-is unless [#40] independently migrates them.
A runner exit status alone does not detect leakage: the existing tests are green at the measured noisy baseline.
Use disposable output predicates as the red/green signal, and the existing suites to check stdout/error semantics.

Measured baseline commands all passed:

```bash
pnpm exec vitest run test/release/bumped-version.test.mjs
pnpm exec vitest run test/worktrees/package-contract.test.mjs test/upstream-sync/upstream-network.test.mjs
pnpm -C packages/pi-subagents-worktrees exec vitest run test/workspace-provider.test.ts
pnpm run test:scripts
pnpm -C packages/pi-subagents-worktrees run test
```

The focused version suite measured 12 tests, the combined root contract/network run 16 tests, and the focused provider run 10 tests.
The full root suite measured 43 files / 995 tests; the full worktrees suite measured 8 files / 74 tests.
These are baseline measurements, not authored post-migration targets.
Use the current retained tests and remeasure counts if [#40] lands first.

For the focused noisy-success checks, recreate disposable shims outside the repository using this pattern, measured during planning:

```bash
set -euo pipefail
scratch=$(mktemp -d /tmp/f0041-noisy-XXXXXX)
trap 'rm -rf "$scratch"' EXIT
real_tar=$(command -v tar)
real_git=$(command -v git)
real_which=$(command -v which)
printf '%s\n' '#!/bin/sh' 'printf "f0041-tar-stderr\n" >&2' > "$scratch/tar"
printf 'exec "%s" "$@"\n' "$real_tar" >> "$scratch/tar"
printf '%s\n' '#!/bin/sh' 'if [ "$1" = branch ] && [ "$2" = --list ]; then printf "f0041-git-stderr\n" >&2; fi' > "$scratch/git"
printf 'exec "%s" "$@"\n' "$real_git" >> "$scratch/git"
printf '%s\n' '#!/bin/sh' 'printf "f0041-which-stderr\n" >&2' > "$scratch/which"
printf 'exec "%s" "$@"\n' "$real_which" >> "$scratch/which"
chmod +x "$scratch/tar" "$scratch/git" "$scratch/which"
PATH="$scratch:$PATH" pnpm exec vitest run test/worktrees/package-contract.test.mjs test/upstream-sync/upstream-network.test.mjs > /tmp/f0041-root-noisy.log 2>&1
PATH="$scratch:$PATH" pnpm -C packages/pi-subagents-worktrees exec vitest run test/workspace-provider.test.ts > /tmp/f0041-provider-noisy.log 2>&1
if grep -qE 'f0041-(tar|which)-stderr' /tmp/f0041-root-noisy.log; then
  printf 'root subprocess output leaked\n' >&2
  exit 1
fi
if grep -q 'f0041-git-stderr' /tmp/f0041-provider-noisy.log; then
  printf 'provider subprocess output leaked\n' >&2
  exit 1
fi
```

Run the relevant root check separately for each implementation step so the still-unfixed tar call does not invalidate step 1's `which` verification.
Replace the old network test path with a retained importing suite if [#40] has moved it.
During planning, each shim was run separately against its real suite; each suite passed and the marker-presence check demonstrated the expected red condition.
After implementation, the same marker-absence predicates must pass without changes to the shims or behavioral assertions.

The disposable release probe is not a committed dependency.
Regenerate it by importing the current helper in an outer `spawnSync(process.execPath, ["--input-type=module", "-e", ...], { encoding: "utf8" })`, performing the operations listed in Evidence provenance, printing their returned data as JSON and disposing the repository in `finally`.
Capture the unmodified-helper baseline before editing, repeat after editing with fixed dates/locale, and diff the complete stdout JSON, including caught failure data.
Planning's scratch evidence is in `/tmp/f0041-output-probe.mjs`, `/tmp/f0041-output-probe-results.json` and `/tmp/f0041-{actual,pipe-control}.{stdout.json,stderr.log}` while available; recreate it rather than treating temporary paths as durable artifacts.

## Invariants at risk

- Release callers retain exact stdout, ordinary scoped version derivation and rendering contents.
  Existing `bumped-version.test.mjs` assertions cover these outputs; the disposable full-data comparison additionally measures that capture changes no return/error data.
- Tests and maintainers retain actionable failure information.
  The real invalid-revision probe measured native status `128` and stderr; wrapped Bash failures retained their existing contextual messages and `stdout:`/`stderr:` sections rather than acquiring new structured fields.
- Sync safety tests retain wrapper forwarding into their result objects.
  The current `upstream-network.test.mjs` inspects actual tag-query stdout and recorded invocations; keep its generated `inherit` sites unchanged and verify retained failure/safety cases in the root suite.
- Worktrees tests retain rescued-branch and package-byte signals.
  The provider test queries the surviving branch; the package contract compares packed file contents to source bytes, so neither stdout may be discarded.
- [#40]'s retained release range and sync safety responsibilities remain independent of this output cleanup.
  No guards, command arguments, version bounds, transport rewriting or production script changes are permitted here.

## TDD Order

These are output-check red/green cycles over existing tests, not new regression-test commits.
The operator declined permanent regression tests, and Tidy First found no preparatory refactoring warranted.

1. **Capture retained release and network fixture subprocesses.**
   Red: run the focused version suite and disposable release probe before editing; retain the noisy logs and full JSON output.
   Run the noisy `which` shim against the current retained network suite and confirm marker presence despite a successful suite.
   Green: add `stdio: "pipe"` to the six release-helper option objects and retained Git-path lookup only.
   Verify: repeat without builtin overrides; outer probe stderr is empty and its complete returned JSON matches the baseline, including caught native and wrapped failure diagnostics.
   Verify the `which` marker disappears, version/rendering tests still pass and generated-wrapper output remains visible through the existing result assertions.
   Keep `spawnSync`, both script runners, existing catches and generated `inherit` calls unchanged.
   Commit: `test(repo): capture retained fixture subprocess output (#41)`.

2. **Capture package archive and worktree-query subprocesses.**
   Red: run the noisy tar and branch-query shims before this step's edits; assert their markers reach runner logs while the existing suites remain green.
   Green: add explicit pipe capture to the two tar calls and the single uncaptured provider branch-list query.
   Verify: rerun the same shims and assert marker absence; existing packed-list/content and rescued-branch assertions must still pass.
   Rerun the focused version/network checks, `pnpm run test:scripts` and `pnpm -C packages/pi-subagents-worktrees run test`.
   Recheck the synchronous-call census against retained/replacement sites and inspect the diff for options-only changes.
   Commit: `test(repo): capture archive and worktree query output (#41)`.

No step adds tests, so no new-test killing mutation is specified.
The normally quiet `bumpedVersion` and `cliffArgs` success paths are covered by the options census and return/error comparison, not an unsupported claim that each naturally emits stderr.
Before implementation handoff, follow the normal pre-completion review gate and record the verification results in the fork retro.
No external contributor mechanism was adopted, so no co-author trailer is required.

## Risks and Mitigations

- A green suite can still leak output: use marker-absence predicates and the real outer-process stderr check, not exit status alone.
- Quiet tools can conceal a missing option: the synthetic stderr shims demonstrate the tar, branch and path-lookup boundary while preserving actual stdout and status.
- Suppressing all output would break tests or conceal errors: use `pipe`, never `ignore`, retain existing conversions/catches and compare returned/error data.
- Wrapper forwarding is part of the tested interface, not unwanted fixture output: keep generated `inherit` calls and run existing forwarding/safety scenarios.
- [#40] may move or delete files before execution: reread its current plan/retro and census retained/replacement calls first; do not repair doomed fixtures or edit that issue's plan.
- Current unrelated fixtures can still print messages in the full suite: judge this issue's output guarantee on retained scoped paths and record excluded old emitters rather than broadening scope.
- Temporary evidence may be gone next session: the plan records inputs, operations, measurements and shim regeneration; the implementation stage must remeasure the actual code rather than reuse the planning control as proof of completion.

## Open Questions

None blocking.
The only sequencing check is which retained helper/test paths exist when implementation starts.
No concrete separate follow-up work was identified, so no speculative issue is filed.

[#40]: https://github.com/Jopqior/gotgenes-pi-packages/issues/40
