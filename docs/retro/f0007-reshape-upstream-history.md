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
