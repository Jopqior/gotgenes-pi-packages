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
