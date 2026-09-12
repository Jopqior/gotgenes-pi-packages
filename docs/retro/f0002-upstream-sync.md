---
issue: 2
issue_title: "建立上游同步机制并首次合并上游 main（tags 导入 + 版本对应表）"
---

# Retro: #2 — 建立上游同步机制并首次合并上游 main（tags 导入 + 版本对应表）

## Stage: Planning (2026-09-12T13:49:35Z)

### Session summary

Planned fork issue 2 as a repo-level `/build-plan` change: guarded `upstream` remote, `scripts/upstream-sync.sh` (fetch default, `--merge` opt-in, never push, never import tags), `docs/upstream-sync.md`, and the first merge of 102 upstream commits.
Measured divergence with `git fetch --no-tags` via URL (no remote added): 30 ahead / 102 behind, 0 local tags, upstream `pi-subagents` 21.7.0.
Tidy-First and design-review were skipped (no new `src/`/`test/` of our own; no new shared TypeScript wiring).

### Observations

- The issue's predicted first-merge conflicts (root `README.md`, `.pi/settings.json`, issue-form dropdowns, `pnpm-lock.yaml`) are not content conflicts today.
  `git merge-tree` reports seven content conflicts, all in `pi-subagents` spawn-selection vs upstream resume/compact-result (imports, one `background-spawner.ts` hunk, two doc tables).
  Resolution is keep-both; `pnpm-lock.yaml` auto-merges and must still be regenerated.
- `tagOpt=--no-tags` on the remote is the default for a flagless fetch; `git fetch --tags` still overrides it, so the script always passes `--no-tags` and compares the tag set before/after fetch.
- Version correspondence has no fork row until [#3] publishes 1.0.0; this issue only records a sync-log baseline of upstream 21.7.0.
- `ask_user` was skipped: author matches the operator, version scheme is settled in the issue, and keep-both follows already-landed [#1].

## Stage: Implementation — Build (2026-09-12T14:24:18Z)

### Session summary

Three plan steps landed: guarded `scripts/upstream-sync.sh` plus handbook and pointers, first merge of `upstream/main` (102 commits, seven keep-both conflicts), and a sync-log baseline of `pi-subagents-v21.7.0`.
Local tag count stayed 0.
`pnpm run check`, `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`, and `pnpm -r run test` were green after the merge.

### Observations

- Ahead/behind at merge time was 33/102, not the plan's 30/102: fork commits for [#5]/[#6] and this issue's script/docs landed after planning.
  Upstream SHA was still `045213317de608c04a7b6052b2b843e3a0f2176f`; the seven content conflicts matched the plan.
- The merge commit is `chore: merge upstream/main without importing tags (#2)` because the `committed` hook rejected git's default untyped merge subject.
  That is the only message-shape deviation; conflict recipes were keep-both as planned.
- `pi-autoformat` joined `<<<<<<< HEAD` / `=======` onto the following SKILL.md sentences, so git no longer saw a well-formed conflict.
  The domain table was rewritten as a union and recounted to 71 files (HEAD 69 plus `get-result-renderer.ts` and `bounded-lines.ts`).
- `pnpm install` after the merge reported already up to date; the auto-merged `pnpm-lock.yaml` was valid.
- Untracked `.pi/extensions/pi-permission-system/` was never staged.
- Pre-completion reviewer: WARN.
  Reviewer warnings: `packages/pi-subagents/docs/architecture/architecture.md` health-metrics still say 63 files while the tree is 71; byte-identical in both merge parents, so inherited staleness rather than a regression of this issue.

[#1]: https://github.com/Jopqior/gotgenes-pi-packages/issues/1
[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
