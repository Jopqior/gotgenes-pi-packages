---
issue: 11
issue_title: "next-version.sh prints a fake pi-subagents-v2.0.0: include-path drops the tag-bearing commit from git-cliff release splitting"
---

# Bound the next-version derivation at the latest release tag

## Release Recommendation

**Release:** ship independently

Repo-level change (`scope:repo`): every edited path is `scripts/`, `test/`, or `.github/workflows/`, all outside every package's release scope, so no package's changelog gains an entry and `/ship` names no package.
No package roadmap references this issue.

## Problem Statement

`./scripts/release/next-version.sh pi-subagents` prints `pi-subagents-v2.0.0` — a major that nothing in the unreleased window justifies.
The two `fix:` commits from [#10] are still unreleased because of it: #10's ship correctly refused to dispatch a release against the phantom major.

git-cliff's `--bumped-version` walk splits releases only when it *encounters the tagged commit during the walk*, and `--include-path` filters commits *before* release splitting.
`pi-subagents-v1.0.0` is a hand-cut tag (the manual first publish, per AGENTS.md) sitting on `8d7bcf2c`, whose only file change is the repo-root `docs/retro/f0003-jopqior-pi-subagents-first-publish.md` — outside `--include-path packages/pi-subagents/**`.
The release boundary never forms, the pre-tag breaking commit (`1f613f20` `feat(pi-subagents)!:`) spills into the unreleased section, and `breaking_always_bump_major` bumps 1.0.0 → 2.0.0.

Measured live on current `main` (git-cliff 2.14.1):

| Invocation                                                      | Output                                     |
| --------------------------------------------------------------- | ------------------------------------------ |
| `./scripts/release/next-version.sh pi-subagents`                | `pi-subagents-v2.0.0` (wrong)              |
| bounded range, same `cliff_args` flags                          | `pi-subagents-v1.0.1` (correct)            |
| `./scripts/release/next-version.sh pi-subagents-model-selector` | "Nothing to release" (correct, unaffected) |

Every future hand-cut first-release tag can hit this — the manual first publish often ends on a retro/docs commit.
The rendered `--unreleased`/`--tag` output is range-correct (it bounds by the tag ref directly), which is why #10's changelog preview looked sane while the version lied; only the walk-based derivation is broken.

## Goals

- `next-version.sh pi-subagents` prints the real next version (measured at plan time: `pi-subagents-v1.0.1`; the concrete number follows the unreleased window until the release runs).
- `next-version.sh pi-subagents-model-selector` still reports nothing to release.
- Both `--bumped-version` call sites go through one shared helper in `scripts/release/lib.sh`.
- A comment at the helper explains the tag-placement hazard.
- A regression test pins the hazard class in CI, so a future edit that drops the range goes red before a release dispatch adopts a fake major.

## Non-Goals

- Moving or rewriting `pi-subagents-v1.0.0` onto an in-scope commit — rejected in the issue: it rewrites an already-pushed tag and falsifies which commit the release was cut from.
- Reporting the path-filtering behavior upstream to git-cliff — the issue leaves that to the operator; the explicit range makes this repo independent of the outcome.
- Extending the test harness to the other three release scripts (`prepare-release.sh`, `publish-released.sh`, `create-github-releases.sh`) — the missing shell harness is already recorded as an open consequence in the upstream ADR `docs/decisions/0002-git-cliff-release-automation.md`; this plan narrows that residual, it does not close it.
- Editing ADR 0002's decision sketch — the sketch is illustrative and already elides the exclude paths, and the ADR is content-identical to the integrated upstream commit `045213317de608c04a7b6052b2b843e3a0f2176f` (measured: `git diff 045213317de608c04a7b6052b2b843e3a0f2176f..HEAD -- docs/decisions/0002-git-cliff-release-automation.md` is empty); diverging a synced decision record is a recurring sync cost for an abbreviation-level fidelity gain.
  The authoritative explanation lives in the `lib.sh` comment this plan adds.
- Repairing `next-version.sh`'s "git-cliff produced no version" branch, which a failing `git-cliff` cannot reach because `set -e` exits on the failing assignment first — an error-handling change in a region this plan keeps; recorded as a deferred tidying in the retro.

## Background

- `scripts/release/lib.sh` holds the shared helpers (`release_packages`, `require_package`, `cliff_args`, `latest_tag`, `package_json_version`) and the `CLIFF_EXCLUDED_DOC_DIRS` convention.
  `cliff_args <pkg>` populates the global array `CLIFF_ARGS` — a global rather than stdout because the values contain glob characters; `prepare-release.sh` already consumes `CLIFF_ARGS` directly after calling `cliff_args`, so "caller populates the global first" is the file's established precondition pattern.
- `scripts/release/next-version.sh` answers "what would release?"
  read-only and offline; `scripts/release/verify-cliff-parity.sh` is the cross-package consistency gate; `scripts/release/prepare-release.sh` (the pushing half, CI-guarded) *delegates* its version derivation to `next-version.sh` in phase 1, so the fix reaches the workflow through the script without touching it.
  The issue names two call sites — `next-version.sh:49` and `verify-cliff-parity.sh:63` — and a grep of `scripts/` confirms those are the only live `--bumped-version` invocations (the `prepare-release.sh` hit is a comment).
- The two call sites differ in how they consume the result: `next-version.sh` assigns plainly and tests for empty output; parity wraps the assignment in `if ! next=$(...)` and tests the exit status.
  The helper must preserve both contracts (stdout, and exit-status propagation through command substitution — verified with a bash probe: a failing function inside `x=$(f)` still aborts under `set -e`).
- Root-level testing has an established precedent: `vitest.config.mjs` includes `test/**/*.test.mjs`, and `test/roadmap/*.test.mjs` exercises `scripts/roadmap-check.mjs` against temp workspaces.
  No test spawns a process or touches git today, and `git-cliff` is not a managed dependency (absent from every `package.json`; `mise.toml` sets only `_.path`) — the plan settles what the test does when the binary is missing (see Design Overview).
- Fork-sync posture, measured at planning time against the integrated upstream commit `045213317de608c04a7b6052b2b843e3a0f2176f` at fork baseline `ca6db428d491e9c82e3cb73c70b5a32081058a73`: `lib.sh`, `next-version.sh`, `verify-cliff-parity.sh`, and ADR 0002 were content-identical to that baseline; `ci.yml` and `cliff.toml` already carried fork patches.
  Editing the three scripts therefore created *new* divergence — the fork patches now present in the tree — sanctioned by the issue itself (the operator's proposed fix names these files and `lib.sh` as the helper's home); the residual sync-conflict cost is recorded under Risks.
- AGENTS.md constraints that apply: conventional commits with no `Closes #N` keyword; a `fix:` commit at repo scope (unscooped, matching the fork's existing script commits) cuts no package release because `scripts/` is outside every package's path scope; do not name an unreleased version except as the measured output of `next-version.sh` (the Goals bullet phrases it that way).

## Design Overview

One helper, one bounded invocation, one test seam.

### The helper

```bash
# Print the version git-cliff derives as the next release, bounded at the
# commit tag $1 points at. Requires CLIFF_ARGS to already hold the scoping
# flags for the package (via `cliff_args`), like every other CLIFF_ARGS
# consumer. Prints the current version when nothing has landed since the tag.
#
# The explicit "<sha>..HEAD" range is load-bearing, not an optimization.
# git-cliff splits releases when it encounters the tagged commit during its
# walk, and --include-path filters commits before release splitting — so a tag
# whose only file change is outside the package's path scope never forms a
# release boundary, every pre-tag commit spills into the unreleased section,
# and breaking_always_bump_major turns them into a fake major. A hand-cut
# first-release tag on a retro-only commit (the natural end of the manual
# first publish) is exactly that shape (Refs #11). Bounding the walk at the
# tag's commit makes tag placement stop mattering.
bumped_version() { # <tag>
  git-cliff "${CLIFF_ARGS[@]}" --bumped-version "$(git rev-parse "$1")..HEAD" 2>/dev/null
}
```

Placement: between `latest_tag` and `package_json_version`, so the two tag-domain helpers read together (the Tidy-First assessor's placement note).
The interface is one string argument plus the established `CLIFF_ARGS` global precondition — no new convention, and both callers already hold the tag (`$current` / `$tag`) for their own messaging and error paths, so a deeper helper that re-derived `latest_tag` internally would duplicate work every caller still needs.

### Call-site changes

`next-version.sh` (the surrounding flow — no-tag error, empty-output error, `next == current` "Nothing to release" — is untouched):

```bash
cliff_args "$pkg"

# git-cliff prints the *current* version, plus a "nothing to bump" warning on
# stderr, when no releasable commit has landed since the last tag.
next=$(bumped_version "$current")
```

`verify-cliff-parity.sh` (the `if !` exit-status test is preserved by the function's status propagation):

```bash
cliff_args "$pkg"
if ! next=$(bumped_version "$tag"); then
```

### What the fix deliberately does not change

The output contract (prints `<pkg>-v<version>` or nothing; exit 0 either way — documented in AGENTS.md), the offline/read-only property (the range is a local `git rev-parse`), and the speed (measured baseline ~20 ms per invocation; one extra `git rev-parse` is sub-millisecond).

### Missing-binary behavior: fail loudly

`git-cliff` is not a managed dependency, and the new root-suite test shells out to it, so `pnpm run test` on a checkout without the binary would fail.
This plan makes that failure loud rather than skipped: the test asserts on the spawned command's output and fails with a message naming the missing binary if `bash` cannot source-and-run it.
Rationale: CI (the protection that matters) installs git-cliff via the `ci.yml` edit, the operator machine already has it (2.14.1 measured), and a skip guard would let a broken local environment report green without the pin — a "green locally, red in CI" surprise is worse friction than a clear local failure.
The alternative (presence guard + visible skip, as `pnpm run prepare` does for `prek`) was rejected because `prek` is a local convenience while git-cliff here is the subject under test.

### Test design

`test/release/bumped-version.test.mjs` builds a scratch git repo per test (`mkdtempSync`, `git init`, `git config user.name/user.email` — CI runners have no global identity), copies the repo's `cliff.toml` in at test time (so config drift in the real file flows into the fixture automatically), runs scripted commits/tags, then drives the helper in a spawned bash with `cwd` = scratch repo:

```js
const out = execFileSync(
  "bash",
  [
    "-c",
    `. '${libShPath}'; cliff_args demo; bumped_version demo-v1.0.0`,
  ],
  { cwd: scratchRepo, encoding: "utf8" },
);
```

The `cliff_args` paths (`packages/demo/**`) are relative globs, so they resolve against the scratch repo; the excluded-path globs need no matching files to exist.
Three equivalence classes, one repo each:

1. **Hazard (the red test):** `feat(demo)!:` in-scope commit, then a `docs(retro):` out-of-scope commit tagged `demo-v1.0.0` (lightweight, like the real hand-cut tag), then `fix(demo):` in-scope → expect `demo-v1.0.1`.
   Against the unbounded helper this prints `demo-v2.0.0` — reproduced in a prototype at plan time.
2. **Nothing-to-release (invariant pin):** `feat(demo)!:` in-scope, annotated tag `demo-v1.0.0` (`git tag -a`, like `prepare-release.sh` cuts) on it, nothing after → expect `demo-v1.0.0` (current version).
   Pins both the `next == current` path `next-version.sh` depends on and annotated-tag dereferencing in the range (`git rev-parse` on an annotated tag yields the tag object SHA; git peels it in range syntax — validated live against `pi-subagents-model-selector-v1.0.1`).
3. **Minor bump (invariant pin):** same repo shape as class 2 plus a `feat(demo):` commit after the tag → expect `demo-v1.1.0`.
   Pins that the range does not over-restrict the walk into printing the current version.

Classes 2 and 3 pass against the *unbounded* helper (their tag sits on an in-scope commit, so the boundary forms) — they are deliberate invariant pins, per the testing skill's rule that a Red-step green must be classified: here they guard the contracts the range must not break, and they go red under the opposite mutation (see TDD Order).

## Module-Level Changes

- `scripts/release/lib.sh` — add `bumped_version` (with the hazard comment) between `latest_tag` and `package_json_version`.
  Step 1 adds it with the body unchanged from today's call-site literal; step 2 adds the range.
- `scripts/release/next-version.sh` — line ~49 becomes `next=$(bumped_version "$current")` (step 1).
- `scripts/release/verify-cliff-parity.sh` — line ~63 becomes `if ! next=$(bumped_version "$tag"); then` (step 1).
- `test/release/bumped-version.test.mjs` — new file, three tests as designed (step 2).
- `.github/workflows/ci.yml` — add `- uses: taiki-e/install-action@git-cliff` immediately before the "Test" step, with a comment naming the root suite as the consumer; same installer action `release.yml` already uses (step 2).

Predicted unchanged, with the claim each rests on:

- `scripts/release/prepare-release.sh` — phase 1 delegates to `next-version.sh`; its `--bumped-version` mention is a comment about the tag's prefixed shape, which the helper preserves verbatim.
- `scripts/release/create-github-releases.sh`, `scripts/release/publish-released.sh` — render with `--latest`/`--tag`, which bound by the tag ref directly (the asymmetry confirmed in the issue and re-measured at plan time: the `--unreleased` render for `pi-subagents` carries no breaking section today).
- `cliff.toml` — the range is a CLI positional, not expressible in config; no key changes.
- `.github/workflows/release.yml` — already installs git-cliff for both jobs that need it.
- `AGENTS.md` and `README.md` — grep shows only contract-level mentions of `next-version.sh`/`verify-cliff-parity.sh` ("prints `<pkg>-v<version>`, or nothing"), and the contract is unchanged.
- `docs/decisions/0002-git-cliff-release-automation.md` — frozen decision record; see Non-Goals.

No export is removed or renamed (the change adds a function), so no symbol-sweep obligations arise.

## Test Impact Analysis

- **Newly possible:** the extraction creates the testable seam.
  Before it, the derivation lived inline in scripts hardwired to this repo's root (`cd "$(dirname "$0")/../.."`, `require_package` against this workspace), so no scratch-repo fixture could reach it; after it, sourcing `lib.sh` and calling `cliff_args` + `bumped_version` is a three-token shell snippet.
- **Redundant existing tests:** none — the release scripts have no tests today.
  This file is the first pin on any of them, narrowing the ADR 0002 residual ("no test harness for repo-root shell").
- **Staying as-is:** the live acceptance runs (below) exercise the real repo's real tags, which the scratch fixture cannot reproduce; they remain the plan-level verification rather than automated tests, because constructing the real history in a fixture would re-implement the repo rather than test the derivation.

## Invariants at risk

- **The output contract** (`<pkg>-v<version>` or nothing, exit 0 either way — AGENTS.md-documented, and `/ship` greps the output).
  Pinned by: class 2 (current-version output), the live model-selector run, and the untouched script flow.
- **Exit-status propagation through the helper** (parity's `if !` arm).
  Verified at plan time with a bash probe (a failing function inside `x=$(f)` aborts under `set -e`); the live parity run in step 2 exercises the real path.
- **Offline/read-only and speed** (AGENTS.md: "read-only and offline ... in under a second").
  Measured baseline: ~20 ms per invocation on this machine; predicted post-change: unchanged within noise (one added `git rev-parse`).
  Re-measure at implementation after the range lands.
- **The 8 untagged-package FAILs in `verify-cliff-parity.sh`** (never-published packages with no fork tags) are pre-existing and by design; the step-2 verification greps the `pi-subagents` line rather than the script's exit status.

## TDD Order

1. **`refactor: extract the bumped-version invocation into lib.sh (#11)`** — move today's call-site literal (`git-cliff "${CLIFF_ARGS[@]}" --bumped-version 2>/dev/null`) into `bumped_version <tag>` in `lib.sh` **unchanged** (no range yet), and point both call sites at it.
  This is the Tidy-First assessor's recommended preparation: it makes the behavior change a one-line diff inside the helper, reviewable in isolation from the three-file move, and it creates the seam step 2's test drives.
  Verification is measured equivalence (a refactor adds no tests): `next-version.sh pi-subagents` still prints `pi-subagents-v2.0.0` (the bug, unchanged), `pi-subagents-model-selector` still reports nothing to release, and `verify-cliff-parity.sh` prints the same per-package lines as before the commit.
2. **`fix: derive the next release version bounded at the latest tag (#11)`** — Red: add `test/release/bumped-version.test.mjs` against the unbounded helper; class 1 goes red (`demo-v2.0.0` ≠ `demo-v1.0.1`), classes 2–3 stay green as classified invariant pins.
Green: add the `"$(git rev-parse "$1")..HEAD"` positional and the hazard comment to the helper; all three classes pass.
Then add the `ci.yml` git-cliff install step (the commit that needs it), run the full root suite (`pnpm run test`), and verify live: `next-version.sh pi-subagents` prints `pi-subagents-v1.0.1` (the measured plan-time value; re-read it rather than trusting this number if commits land first), `pi-subagents-model-selector` reports nothing to release, and parity's `pi-subagents` line reads `1.0.0 -> would release 1.0.1`.
Killing mutations, one per equivalence class:
   - **Drop the whole range** (revert the helper to bare `--bumped-version`): class 1 must go red with the fake major — this is the exact regression the issue reports.
   - **Drop the lower bound** (range becomes just `HEAD`, so the walk sees all history): classes 2 and 3 must go red (`demo-v2.0.0` where `demo-v1.0.0`/`demo-v1.1.0` are expected) — this pins that the range does not merely change what spills, but bounds correctly at the tag.
   - **Over-restrict the range** to `HEAD..HEAD` (empty walk): class 3 must go red (`demo-v1.0.0` ≠ `demo-v1.1.0`), while class 2 correctly stays green (nothing to release is the right answer there) — pinning the discrimination between "empty because nothing landed" and "empty because the walk is broken".

No step after 2; the plan's docs (this file and the retro) are committed by the planning session, and ADR 0002 is deliberately untouched.

## Risks and Mitigations

- **Upstream-sync divergence:** at planning time `lib.sh` and the two scripts were content-identical to the integrated upstream commit `045213317de608c04a7b6052b2b843e3a0f2176f`, so this fix created fork patches where none existed; a future upstream change to the same hunks conflicts at `--merge` time.
  Mitigation: the edit is sanctioned by the issue (the operator's proposed fix names these files), it is small and localized, and `docs/upstream-sync.md`'s conflict handbook covers exactly this case; the alternative (landing the behavior in an already-forked file) does not exist — the range is a CLI positional that only these scripts pass.
- **git-cliff version drift:** CI installs the latest git-cliff, so an upstream behavior change could turn the new test red.
  That is a feature: the same drift today surfaces as a fake major in an actual release dispatch, which is the bug this plan fixes.
- **Local `pnpm run test` fails without git-cliff:** accepted deliberately (fail-loudly decision above); the failure names the missing binary, CI and the operator machine both have it, and package-scoped suites (`pnpm -r run test`) are unaffected.
- **Scratch-repo fidelity:** the fixture repo lacks the real repo's CHANGELOG.md files and excluded doc trees, but the path globs need no matching files, and `cliff.toml` is copied dynamically so config drift flows in.
  The real-repo acceptance runs in step 2 cover what the fixture cannot.

## Open Questions

None.
The one design point the Tidy-First assessor flagged (skip-guard vs fail-loudly for a missing git-cliff) is settled above as fail-loudly; if the operator prefers a skip guard at plan review, only the test file's header behavior changes, not the helper or the call sites.

[#10]: https://github.com/Jopqior/gotgenes-pi-packages/issues/10
