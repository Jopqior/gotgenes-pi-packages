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

## Stage: Implementation — Build (2026-09-18T04:34:13Z)

### Session summary

Executed all 13 plan steps as 13 `docs:` commits (`b649d3ea`..
`b4a96011`): eight new topic skills, two existing-skill absorptions, the `AGENTS.md` rewrite, 11 description rewrites, the template load lists, and the `/audit-agent-docs` `offload`/`moved` verdicts.
Always-loaded went from `agentsMd=8045 descriptions=454 total=8499` to `agentsMd=1848 descriptions=536 total=2384` (measured with `scripts/agent-docs/always-loaded.mjs`), a 72% cut.
Pre-completion reviewer: WARN (two non-blocking findings, below).

### Observations

- **The moved-line check earned its place.**
  Run after every move against the pre-split SHA, it caught nothing lost in eight moves; at the rewrite step it printed exactly the plan's deliberately-dropped list (23 lines: the old admission-test question 2, the four Workflow bullets folded into principle 6, the session-naming table, the four index stubs) plus three label lines (`Key properties:`, `Convergence…:`, `Guardrails:`) that became headings in `worktrees` and one reflow.
  The reviewer re-derived it with its own script and reached the same set.
- **One anticipated reflow happened.**
  `pi-autoformat` rewrote `*around*` as `_around_` when the Pi-source paragraph landed in `code-design`, whose emphasis style is underscores.
  Accepted as a formatter-owned rewrite; the plan's risk list named this class.
- **Cutting moved lines from `AGENTS.md` by exact-line match was safe only for unindented prose.**
  Lines that the destination re-shaped — bulletized autoformat quirks in `markdown-conventions`, fenced retro-format example lines — had to be removed by hand; a match-and-delete script that ignored fences would have half-deleted the example block.
- **Reviewer WARN 1 — `agentsMd` is 1,848, above the plan's 1,500–1,700 estimate.**
  The plan declared this a finding to report, not a target to cut to; the reviewer's per-section count puts the overrun in `## Working an issue` (375 words, lifecycle kept verbatim) and the index table (292), offset by principles coming in under.
  Left as is; the next `/audit-agent-docs` run holds the lifecycle section to the sharpened question 2.
- **Reviewer WARN 2 — one sentence in `clarification-gates` is new, not moved**: "Label every number in an option as measured or estimated; measure when the command runs in under a minute."
  Added because the skill's `description:` promises it and the moved body did not carry it; `plan-issue.md` line ~134 states the same rule for its own predicted-effect table.
  Left both: the template's is step-specific, the skill's is the general rule.
- **Deviation from the plan's roster**: the four `### Workflow` bullets became principle 6 rather than moving to a skill, and the `delegation` skill carries the pre-completion-reviewer and craftsmanship paragraphs verbatim (the plan had them collapsing to index rows) — moving them whole was cheaper than proving a summary lossless, and they are loaded only on demand now.
- The `Retro file format` example block now lives in `markdown-conventions`; each template still carries its own stage-entry skeleton, so nothing reads the block at run time.
- Operator follow-through: a fresh `pi` session is needed to see the eight new skills in `<available_skills>`; this session cannot.
