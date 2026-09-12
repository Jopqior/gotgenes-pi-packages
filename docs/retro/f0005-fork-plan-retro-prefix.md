---
issue: 5
issue_title: "fork 文档编号改用 f 前缀，规避与上游 plans/retros 编号冲突"
---

# Retro: #5 — fork 文档编号改用 f 前缀，规避与上游 plans/retros 编号冲突

## Stage: Planning (2026-09-12T08:22:33Z)

### Session summary

Planned fork issue 5 as a repo-level `/build-plan` change.
The plan is already `docs/plans/f0005-fork-plan-retro-prefix.md` so implementation does not rename it.
Tidy-First and design-review were skipped (no `src/`/`test/` files, no shared TypeScript wiring).

### Observations

- Measured `/build-plan 5` today resolves to `packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md`.
  Lookup must short-circuit on `fNNNN-` rather than union with unprefixed `NNNN-`, or the inherited `0005` stays in the result set beside `f0005`.
- `scripts/issue-context.sh 1` already cats inherited package `0001` plans beside the fork plan; short-circuit after rename is a deliberate narrowing.
- `/ship` plan location stays frontmatter `^issue: $1$` and already collides for issue 1 with inherited `packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md`.
  Out of scope.
- Next session must invoke `/build-plan docs/plans/f0005-fork-plan-retro-prefix.md` (path form) because in-process prompts still glob `NNNN-`.
- Land this issue before planning [#2] so that `/plan-issue` does not emit `0002-`.
