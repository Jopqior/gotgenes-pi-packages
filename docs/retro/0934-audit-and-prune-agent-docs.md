---
issue: 934
issue_title: "Audit and prune the agent documentation, then make the pass periodic"
---

# Retro: #934 — Audit and prune the agent documentation, then make the pass periodic

## Stage: Planning (2026-09-17T01:43:31Z)

### Session summary

This session filed the issue from a measurement pass, committed the evidence and two `.mjs` derivations (8c9bb3c6), then planned the work.
The plan lands the admission test in `AGENTS.md`, gates `/retro` Step 7 on it, makes the scripts testable in the `roadmap-check.mjs` shape, adds a third script for the always-loaded count, and adds `/audit-agent-docs` — which is run once in a fresh session as the plan's final, non-implementing step.
Filed [#935] for the prompt-template and subagent-definition pass the operator scoped out.

### Observations

- **The growth pump is `/retro`, not ad-hoc edits.**
  44 of the last 60 commits to `AGENTS.md` are `docs(retro):`.
  Its Step 7 governs an addition's shape (rule + tight example) but never its admission, which is why a prune without a `/retro` edit re-grows at the measured +635 words/wk.
  The issue did not name this; the plan's step 8 is the mitigation.
- **The admission test rests on a cost boundary, not a taste boundary.**
  Skill descriptions are always loaded (454 words); skill bodies are not (34,608).
  "Needed before the agent could know to load a skill" is a mechanical test, and it is the one the plan writes.
- **A new prompt template cannot run in the session that creates it** (the `#869` staleness rule applies to new commands as well as renamed ones).
  That resolved the sequencing question of where the first prune runs: the implementing session stops at the committed command, and the audit is a separate session.
  The plan says so explicitly so `/build-plan` does not try to invoke it.
- **Model usage is measurable from the transcripts; thinking level was the operator's dimension.**
  The first stage-attribution pass took the last `session_info` name per file and inflated `Retrospective` roughly fivefold.
  Ordered attribution fixed it and became the discriminating test in the plan (step 5's killing mutation is exactly that bug).
- **The `agents_md` bucket over-reads the always-loaded number by ~400 words** — nine sentinel `packages/*/AGENTS.md` files that fire only from a package subdirectory.
  Correct for the pre-consolidation series, wrong as an always-loaded figure; that is why `always-loaded.mjs` is a separate script rather than a column.
- **Two counting methods disagreed (8,760 vs 9,037) and the disagreement was the sentinel finding.**
  Worth chasing a 3% discrepancy in a baseline before it goes into a plan.
- Operator decisions at the gate: no numeric budget this round; the command applies `delete`/`compress` **in place on the current branch** (not a review branch); the recurrence-since-Opus-5 heuristic is guidance with survivorship bias named, not a rule; the plan carries through applying the reviewed inventory.
- **A "predicted unchanged" claim needs the right probe.**
  `grep '^/' README.md` found nothing and the plan said "lists slash commands nowhere"; a mid-line grep found nine.
  The prediction held (README's table is lifecycle-only, and `/triage-backlog` is absent by the same convention) but the stated reason was wrong and was corrected before commit.

#### Deferred tidyings

- `scripts/agent-docs/model-usage.mjs` — `DEFAULT_PREFIX` hardcodes this checkout's session-store directory name.
  `transcriptPaths` already takes `prefix`, so it is not a testability blocker; making the default portable is a separate decision.

[#935]: https://github.com/gotgenes/pi-packages/issues/935
