---
issue: 7
issue_title: "历史重塑：上游段聚合为单条 commit，让 fork 提交可见"
---

# Retro: #7 — 历史重塑：上游段聚合为单条 commit，让 fork 提交可见

## Stage: Planning (2026-09-12T15:49:05Z)

### Session summary

Planned fork issue 7 as a repo-level `/build-plan` change: one-time `commit-tree` reshape of `main` into an orphan import plus replayed fork commits plus a single-parent squash-sync, then rewrite `scripts/upstream-sync.sh` from `--merge` to `--sync`.
Measured the window still open (0 tags, only `main`, 0 PRs, `main...origin/main` is `0 0`) and pinned the historical squash type as `feat!:` against the 102-commit `af980a23..04521331` range.
Tidy-First and design-review were skipped (no `src/`/`test/`; no shared TypeScript wiring).

### Observations

- The issue's "37 fork commits from the fork point to `2d8cea69`" is the Jopqior author count on current `HEAD` (33 before the merge + the merge + 3 after), not the replay set.
  Build must re-measure `2d8cea69..HEAD` after this plan and retro land.
- Default `git log --oneline | wc -l` is 5881 versus 4631 first-parent; a two-parent squash would restore that drowning, so linearity (`%P` has no two-parent line) is a step-1 pin.
- `HEAD...upstream/main` is `37 0` today because the merge-base is upstream `main`; after reshape it becomes unrelated-history noise, so the script must print `U_old..upstream/main` instead.
- `ask_user` was skipped: author matches the operator, and the issue already rejected view-only and future-only.
  Synthetic ancestor, local-only `refs/sync/upstream-main`, and always-`feat!:` for breaking ranges follow the issue's primary wording.
- Reshape uses `git commit-tree` (copy trees, preserve author and committer) rather than `git rebase --onto` or `git cherry-pick`, which would apply patches and run hooks 33+ times.
- No reshape script is committed; the `/tmp` snippet lives only in the build step.
- `mmdc` needed `--no-sandbox` to render the history flowchart; syntax was fine.

## Stage: Implementation — Build (2026-09-12T16:23:33Z)

### Session summary

Reshaped `main` into a 40-commit linear history (orphan import `9799f29d`, 33 replayed fork commits, single-parent squash `01bc18fd`, 5 post-sync replays), then rewrote `scripts/upstream-sync.sh` to `--sync` / `--continue` / `--derive-type` and updated the handbook, README, and `AGENTS.md`.
Force-pushed `origin main` to `163d88e8` with `--force-with-lease` against the pre-reshape origin tip.
A pre-completion FAIL on `MERGE_HEAD` blocking `git switch` was fixed in `c979ef0e` (`git merge --quit` before transplant).

### Observations

- `N_after` at reshape time was 5, not the planning-time 3.
- `main...origin/main` was `2 0` (unpushed plan and planning retro), not `0 0`.
  Proceeded because origin had no unique commits.
- Force-with-lease targeted `origin/main` (`7e55552d`), not `refs/backup/pre-reshape` (`fe79c5f4`), because origin never received those two local commits.
- `--derive-type` bash `=~` needed the regex in a variable; an inline `(\([^)]+\))` is a syntax error on bash 5.3.
- Historical range still prints `feat!:`; throwaway subject lists match the plan table, including `fix!:` → `feat!:` and a `BREAKING CHANGE:` body.
- Pre-completion reviewer: round 1 FAIL (`transplant_onto_main` switched while `MERGE_HEAD` existed; `--continue` and recipe-resolved `--sync` aborted with exit 128).
  Round 2 WARN after `c979ef0e`: `docs/upstream-sync.md` says lockfile regeneration happens after the squash-sync commit, but `pnpm install` runs inside `transplant_onto_main` before `git commit`.
  Reviewer warnings: one-line ordering wording in the handbook; no behavioral gap.

## Stage: Final Retrospective (2026-09-12T16:45:53Z)

### Session summary

Shipped fork issue 7 on trunk: linear reshape of `main` (orphan import, replayed fork commits, single-parent squash `01bc18fd`), `scripts/upstream-sync.sh --sync`, and a `--force-with-lease` of `origin main`.
CI run 34705654343 succeeded; the issue closed with no package release (no `packages/` path in range; zero tags; plan forbids `release.yml` until issue 3).
Four sessions ran on `xai/grok-4.6` (plan, build, ship, this retro) plus two `pre-completion-reviewer` rounds whose agent frontmatter requests `anthropic/claude-sonnet-5`.

### Observations

#### What went well

- `git commit-tree` replay kept every fork tree OID; `git diff refs/backup/pre-reshape HEAD` was empty before the script/docs commit, and default `git log` dropped from 5881 lines to a 40-commit linear chain.
- `--derive-type` throwaway repos caught bash 5.3 `=~` with an inline capture group before the `feat:` commit; historical `af980a23..04521331` still prints `feat!:`.
- Pre-completion round 1 FAIL was a real conflict-path break (`MERGE_HEAD` vs `git switch`), not a docs nit.
  The operator chose fix-now; `c979ef0e` plus a throwaway conflicted-transplant pin made round 2 WARN.
- Ship skipped `release.yml` even though the plan marker is `ship independently`, because the range touched no `packages/` file.

#### What caused friction (agent side)

- `missing-context` — `transplant_onto_main` called `git switch --force main` while `MERGE_HEAD` still existed.
  Happy-path verifies (`--merge` exit 2, `--derive-type`, read-only status, `pnpm` check/lint/test) never opened a conflicted merge.
  The plan's killing mutations also skipped the `--continue` path.
  Impact: pre-completion FAIL; follow-up `c979ef0e`; `origin/main` already held the broken script at `163d88e8` until `/ship` pushed the fix.
- `other` (process sequencing) — plan step 3 force-pushed after step 2 was green, and `/build-plan` runs pre-completion only after every numbered step.
  `/ship` never force-pushes, so the rewrite push cannot wait until ship.
  Impact: the MERGE_HEAD defect reached `origin/main` before the reviewer ran.
- `missing-context` — handbook step 4 put `pnpm install` after the squash-sync commit; the script regenerates the lockfile inside `transplant_onto_main` before `git commit`.
  Impact: reviewer WARN; operator asked for the wording fix; extra `1fae1fb9`.
- `other` — bash `[[ =~ ]]` with an inline `(\([^)]+\))` is a syntax error on bash 5.3; the regex had to live in a variable.
  Impact: two failed `--derive-type` runs, then a same-commit fix; no extra commit.

#### What caused friction (user side)

- The issue and plan ordered force-push as the last TDD-Order step after "step 2 is green," with no pre-completion gate in between.
  Opportunity: asking at planning whether the next git step is reversible on origin would have moved the review before the lease push.
- After build offered to fix the handbook WARN, the operator said yes.
  That was mechanical confirmation, not a design call.

### Diagnostic details

- **Model-performance correlation** — Plan, build, ship, and this retro ran on `xai/grok-4.6`.
  Parent transcripts do not inline the reviewer's model; `.pi/agents/pre-completion-reviewer.md` requests `anthropic/claude-sonnet-5`.
  Round 1 FAIL and round 2 WARN were both load-bearing; no quality mismatch.
- **Unused-tool detection** — the conflicted-transplant fixture (temp repo, merge, `write-tree`, `switch --force` with and without `git merge --quit`) ran only after FAIL.
  The same bash pin before dispatching the reviewer would have caught `MERGE_HEAD` without a round trip.
- **Feedback-loop gap analysis** — `pnpm run check`, `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`, and `pnpm -r run test` ran after the script/docs edit and before `163d88e8`.
  Those gates do not execute `--continue`.
  The conflict path was unverified until the reviewer simulated it.

### Changes made

1. Appended this Final Retrospective stage to `docs/retro/f0007-reshape-upstream-history.md`.
2. `.pi/prompts/build-plan.md`: run pre-completion before an irreversible published-git step (`--force-with-lease`, rewrite of `origin/main`, `reset --hard` of a pushed tip).
3. `.pi/prompts/plan-issue.md`: a conflict or `--continue` recovery path is an equivalence class for shell pins; a force-push is not an ordinary TDD-Order step.
