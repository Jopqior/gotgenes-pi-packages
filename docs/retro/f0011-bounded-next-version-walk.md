---
issue: 11
issue_title: "next-version.sh prints a fake pi-subagents-v2.0.0: include-path drops the tag-bearing commit from git-cliff release splitting"
---

# Retro: #11 — next-version.sh prints a fake pi-subagents-v2.0.0: include-path drops the tag-bearing commit from git-cliff release splitting

## Stage: Planning (2026-09-13T16:29:41Z)

### Session summary

Planned issue #11 as `docs/plans/f0011-bounded-next-version-walk.md`: bound the `--bumped-version` derivation at the latest release tag via a shared `bumped_version` helper in `scripts/release/lib.sh`, plus the repo's first shell-harness regression test under `test/release/`.
Reproduced the bug and validated the fix empirically before planning (live repo: `pi-subagents-v2.0.0` wrong → `pi-subagents-v1.0.1` correct; scratch-repo prototype reproduces both directions deterministically).
Dispatched the Tidy-First assessor; its recommended preparation (extract the unchanged literal first, fix in a second commit) became the plan's two-step TDD Order.

### Observations

- Root cause verified against the real repo: `pi-subagents-v1.0.0` sits on `2c6dcd38` (retro-only, repo-root path), and the walk-based `--bumped-version` loses the release boundary while the rendered `--unreleased`/`--tag` output stays range-correct — the asymmetry that misled #10's ship.
- The issue's two call sites are the only live `--bumped-version` invocations; `prepare-release.sh` delegates to `next-version.sh` and its own mention is a comment.
- Design choice settled in-plan rather than gated: the new root-suite test fails loudly when `git-cliff` is absent (no skip guard) — CI gets the binary via a `ci.yml` install step, and a skip guard would let a broken local environment report green without the pin.
- Fork-sync posture measured: `lib.sh` and both scripts are content-identical to `refs/sync/upstream-main`, so the fix creates new divergence — sanctioned by the operator's own issue, recorded in Risks.
  `ci.yml` and `cliff.toml` are already forked; new files are conflict-free.
- ADR 0002 deliberately left untouched (sync-divergence trade for an illustrative sketch); the hazard explanation lives in the `lib.sh` comment instead — recorded in Non-Goals.
- Test classes classified up front: class 1 (out-of-scope tag + pre-tag breaking commit) is the only red test; classes 2–3 (nothing-to-release, minor bump) are invariant pins that are green pre-fix by design, each with a named killing mutation in the opposite direction.
- Timing baseline measured (~20 ms per `next-version.sh` invocation) so the "offline and fast" invariant has a number to re-measure against.

#### Deferred tidyings

- `scripts/release/next-version.sh` — the "git-cliff produced no version" branch is unreachable for a failing `git-cliff` (`set -e` exits on the failing assignment before the `-z` test); an error-handling repair for a future improvement round.
- `scripts/release/lib.sh` — noun inconsistency (`latest_tag`/`bumped_version` return tags, `package_json_version` returns a bare version); rename declined, no call site is confused today.

## Stage: Implementation — TDD (2026-09-13T17:02:50Z)

### Session summary

Executed the plan's two-step TDD Order on trunk: step 1 extracted the `--bumped-version` literal into a shared `bumped_version <tag>` helper in `scripts/release/lib.sh` (verified by measured equivalence — parity output byte-identical, both live `next-version.sh` runs unchanged); step 2 added the `"$(git rev-parse "$1")..HEAD"` range plus the hazard comment, the repo's first shell-harness test `test/release/bumped-version.test.mjs` (three equivalence classes; class 1 red pre-fix with the fake major, classes 2–3 classified invariant pins), and the `taiki-e/install-action@git-cliff` step in `ci.yml`.
Live verification after the fix: `pi-subagents` prints `pi-subagents-v1.0.1`, `pi-subagents-model-selector` still reports nothing to release, parity reads `1.0.0 -> would release 1.0.1`, timing unchanged (~18 ms).
Root suite went from 4 to 5 files (+3 tests).
Pre-completion reviewer: WARN.

### Observations

- **Plan's killing mutation 2 was wrong in both mechanism and kill set.**
  Predicted: dropping the range's lower bound makes pre-tag commits spill, so classes 2 and 3 go red with `demo-v2.0.0`.
  Measured: classes 1 and 3 go red with the bare *current* version.
  Probed against git-cliff 2.14.1 directly: with an explicit range, the current version is established from the tag on the range's **lower-bound commit**; with `..HEAD` no boundary tag exists and every walk degrades to printing the current version.
  For class 2's shape (in-scope tag, nothing after) that degraded output coincides with the correct answer, so no range-shape mutation kills class 2 — the reviewer independently reproduced this across five range variants and superseded the plan's assignment.
  Class 2's real job (recorded in a test comment): holding the `next == current` contract and the annotated-tag peel.
- **The plan's literal `HEAD` mutation is rejected by git-cliff outright** (error-red, not a discrimination signal); `..HEAD` is the drop-the-lower-bound form in valid syntax.
  Another plan-external-fact claim settled by running the binary.
- **Commit subject reworded at the changelog-preview step:** the plan's suggested message (`fix: derive the next release version bounded at the latest tag`) names the mechanism; the landed subject (`fix: print the real next version when the latest tag sits out of scope`) names the symptom, per the `/tdd-plan` preview rule.
  Nothing was pushed, so the amend was free.
- **Post-review amendments (fix commit, unpushed):** `fileURLToPath` replaces `new URL(...).pathname` for `repoRoot` (portability — a percent-encoded checkout path would break the `bash -c` spawn misleadingly), and the class-2 non-discriminability comment.
  ADR 0002's "no test harness for repo-root shell" sentence left stale deliberately (plan Non-Goal, sync-divergence trade).
- **Reviewer warnings left for the operator:** (1) root `pnpm run test` now hard-requires `git-cliff` on PATH and no tracked doc records the prerequisite — discoverable via the test's failure message and the new `ci.yml` comment, but a candidate line for `AGENTS.md` if the operator wants it written down; (2) the ADR sentence above.
- The mutation-discipline flow (save green with `cp`, `Edit` the mutation, grep to confirm the file changed, re-run, restore from the copy) worked cleanly across three mutations; the probe-first correction of mutation 2 prevented committing a mis-classified "pass".

Pre-completion reviewer verdict: **WARN** — no FAILs; findings 1 (ADR 0002 harness sentence) and 2 (undocumented git-cliff prerequisite) above, plus the two amended fixes.
AC 1's concrete version number must be re-read at `/ship` time — it moves with every commit until the release runs.
