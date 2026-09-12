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

[#1]: https://github.com/Jopqior/gotgenes-pi-packages/issues/1
[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
