---
issue: 937
issue_title: "Split AGENTS.md into principles, environment, and an index; move rule lists into topic skills"
---

# Retro: #937 — Split AGENTS.md into principles, environment, and an index; move rule lists into topic skills

## Stage: Planning (2026-09-18T04:09:26Z)

### Session summary

Measured the always-loaded baseline (8,499 words: `AGENTS.md` 8,045 + 454 in descriptions) and each `AGENTS.md` section's word count, mapped every section to a destination, and gated the open design choices.
Wrote `docs/plans/0937-split-agents-md-into-topic-skills.md`: eight new topic skills (the issue's seven plus `worktrees`), two existing-skill absorptions, a rewritten `AGENTS.md` skeleton with a 1,500–1,700-word band, a sharpened admission test, a template load matrix, and `/audit-agent-docs` changes to apply `offload`.
Filed #942 for the 19 package-skill `offload` rows and recorded it out of scope in both open phases (pi-permission-system Phase 15, pi-subagents Phase 22).

### Observations

- **Operator decisions at the gate**: `worktrees` becomes an eighth skill rather than riding `git-workflow`; templates *do* name the topic skills in their `## Load skills` lists — the issue's deferral of "template-driven loading" was about extension-driven deterministic injection, not the prose lists templates already carry; the 19 package `offload` rows go to a dedicated issue (#942); the 11 non-package skill descriptions are rewritten here as trigger conditions.
- **The verification instrument is a moved-line check, not a review.**
  Every prose line of the pre-split `AGENTS.md` (352 today) must survive verbatim in `AGENTS.md` or a skill, or be on the plan's deliberately-dropped list; a duplicate check catches copies.
  This depends on moving rules *unreworded*, which the plan makes a rule of the move.
- **A dry-run overturned a verify criterion.**
  The plan first proposed `next-version.sh no-such-pkg` to exercise the "see AGENTS.md" error text; the unknown-package check fires first, and every package is tagged, so the no-tag branch is unreachable by any real name.
  Replaced with a text grep.
- **The issue's "sharpen the first question" lands in the second question's slot.**
  Question 1 as written already sends a passage nowhere; the sharpening ("needed before any workflow step has run, or an environment fact no model could infer") is the destination test, which is question 2.
  Recorded in the plan so the build session does not re-derive it.
- **Tidy-First assessment skipped**: no `src/` or `test/` files are touched.
- Not breaking; nothing under `packages/` changes, so `/ship` releases nothing.

#### Deferred tidyings

None — the assessor was not dispatched (docs-only change).
