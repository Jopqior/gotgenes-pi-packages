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

## Stage: Final Retrospective (2026-09-13T17:18:24Z)

### Session summary

Issue #11 closed across three clean trunk sessions — planning (`glm-5.3`), TDD (`glm-5.3-flash`), ship (`glm-5.3-flash`) — landing `a9c3cb46` (extraction) and `c3792f79` (bounded walk) plus the repo's first shell-harness test, with CI green and the release correctly skipped (`scope:repo`, no package paths).
The fake `pi-subagents-v2.0.0` is gone: `next-version.sh` now derives from a walk bounded at the tag's commit, pinned by three equivalence classes in `test/release/bumped-version.test.mjs`.

### Observations

#### What went well

- **The repo's first shell-harness test pattern** — scratch git repo + sourced `lib.sh` + `cliff.toml` copied at run time so config drift flows into the fixture — is a reusable seam for the three remaining untested release scripts (the ADR 0002 residual this plan deliberately narrowed, not closed).
- **Probe-first discipline paid for itself at TDD time**: mutation 2's kill-set mismatch triggered a direct probe of git-cliff 2.14.1 rather than an argument, and the real mechanism (explicit range ⇒ current version established from the lower-bound commit's tag) is now recorded in the fix commit body and the class-2 test comment, where a future session will meet it.
- **Model downshift was free**: `glm-5.3-flash` carried the judgment-heavy TDD session (mutation classification, binary probing) with no observable quality loss, and the pre-completion reviewer (`anthropic/claude-sonnet-5` per its frontmatter) independently reproduced the mutation-2 analysis — the two layers caught different things.
- The ship session resolved the plan's `ship independently` marker against the deterministic no-package-path rule correctly and skipped the release steps without asking — the plan's Release Recommendation rationale had pre-answered the question.

#### What caused friction (agent side)

- `missing-context` — the plan's killing mutation 2 was wrong in mechanism, kill set, and even syntax: predicted "drop the lower bound ⇒ pre-tag commits spill ⇒ classes 2–3 red with a fake major"; measured "git-cliff rejects the literal `HEAD` form outright, and the valid `..HEAD` form degrades every walk to printing the current version", killing classes 1 and 3 instead.
  Root cause: the planning session probed the fix and mutation 1 (which coincides with the bug reproduction) in its scratch-repo prototype, but **inferred** mutations 2–3's predicted outputs instead of running them.
  Impact: ~7 tool calls of re-probing and re-classification at TDD time, the plan text superseded inside the fix commit body, and a test comment needed to explain class 2's non-discriminability — no wrong claim reached a committed artifact, and the TDD session caught it itself (self-identified).
- `other` — four one-call self-corrections across the lifecycle: the Red run needed one iteration (fixture `mkdir` before `git init`), one overlapping-`Edit` batch was rejected and re-merged, one `git log --oneline 5` typo (missing `-`), and the ship session's retro-glob `ls` errored before the `read` fallback.
  Impact: added friction but no rework.
- `instruction-violation` (self-identified, during this retro) — the P2 line landed as `#11's plan predicted…`, violating the `markdown-conventions` rule that a line-initial issue number must be prefixed with `Issue` (a line starting `#N` reads as an H2).
  The autoformatter normalized it into a real `##` heading and then re-leveled every heading downstream of it (`####` → `#####`, `#####` → `######`), corrupting the document structure far beyond the edited line.
  Impact: one backup + `git checkout HEAD -- AGENTS.md` + edit replay (3 calls); the committed text was rewritten as `The #11 plan predicted…`.
  The existing autoformat bullet list in `AGENTS.md` documents line-joining, conflict-marker, `§`, `~`, heredoc, and export-merge behaviors but not this one — a candidate bullet for a future retro, not implemented here.
- `other` — **the release debt from #10 was never re-dispatched, and this retro session initially repeated the blind spot**.
  Each ship was locally correct (#10 refused against the fake major; #11's repo-scope range released nothing), but nothing re-visited the deferral once #11 lifted the blocker — `pi-subagents` sat at 1.0.0 with `next-version.sh` correctly printing `pi-subagents-v1.0.1`.
  The operator caught it; the retro's own next-step recommendation had surveyed the roadmap and the triage queue without ever running `next-version.sh`/`verify-cliff-parity.sh` — the offline, read-only tools that answer exactly this question.
  Impact: two `fix(pi-subagents)` commits from #10 stayed unreleased past one complete fix-and-ship cycle; remedied in-session (dispatch below) and tracked as #12.

#### What caused friction (user side)

- The fail-loudly decision (no skip guard when `git-cliff` is absent) was settled in-plan without a gate, yet it changes the local dev-loop default for every future session — root `pnpm run test` now hard-requires a binary no `package.json` manages.
  It surfaced to the operator only via the reviewer's WARN and the ship report's footnote.
  Opportunity: a design point that changes the local test-running experience is gate-worthy even when the fix itself is unambiguous; this retro proposes the documentation half (below), and the skip-vs-fail call stays as made.
- The issue itself was high-quality context — named call sites, a proposed fix shape, and a pre-rejected alternative (tag rewrite) — which is why planning ran nearly friction-free.

### Diagnostic details

- **Model-performance correlation** — planning `zai-coding-cn/glm-5.3`, TDD and ship `zai-coding-cn/glm-5.3-flash`, pre-completion reviewer `anthropic/claude-sonnet-5` (all attributed from the session transcripts' inline `[provider/model]` labels).
  No mismatches; notably, the lighter model on the judgment-heavy TDD session produced no quality loss — downshifting TDD sessions is empirically safe here.
- **Escalation-delay tracking** — no rabbit-holes.
  The mutation-2 investigation ran ~7 consecutive calls, but each was a distinct forward step (invalid form rejected ⇒ valid `..HEAD` form ⇒ output inspection ⇒ direct binary probes), not repeated attempts at one error; no sequence exceeded the 5-call threshold on a *single* error.
- **Unused-tool detection** — none.
  The change was well-scoped with exact symbols (`bumped_version`, `cliff_args`), so `grep` sufficed; no Explore/Plan dispatch or semantic search was warranted.
- **Feedback-loop gap analysis** — verification ran incrementally at every boundary: measured equivalence after the refactor commit, `vitest` after each mutation, `check`/`lint`/`test` before the pre-completion review, and `lint` + `fallow dead-code` pre-push in the ship session.
  No gaps.

### Changes made

1. `AGENTS.md` `##### Testing` — documented that the root test suite shells out to `git-cliff` (no `package.json` manages it; CI installs it via `taiki-e/install-action@git-cliff`) and fails loudly when the binary is absent — the pre-completion reviewer's finding 2, resolved as approved (P1).
2. `AGENTS.md` external-facts paragraph (after "Documentation answers whether a flag exists…") — added the rule that a killing mutation predicting a tool's output must be probed at plan time, with the #11 fake-major instance — the plan-time friction point 1, resolved as approved (P2).
3. No other files changed; the ADR 0002 sentence stays stale by recorded decision, and the deferred tidyings stay queued for `/plan-improvements`.
4. Filed [#12](https://github.com/Jopqior/gotgenes-pi-packages/issues/12) — a deferred release has no re-dispatch trigger once its blocker lifts; `/ship`'s nothing-to-release path should sweep all packages with `next-version.sh` and surface pending tags (operator-caught during this retro; roadmap-fit exits at step 1, repo scope, no open phase).
5. Dispatched `release.yml` for `pi-subagents` from this retro session (run [34771784394](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/34771784394)), closing #10's release debt.
