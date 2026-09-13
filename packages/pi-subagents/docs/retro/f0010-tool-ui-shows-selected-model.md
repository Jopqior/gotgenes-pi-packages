---
issue: 10
issue_title: "subagent tool UI shows the call's model, not the one spawn selection chose"
---

# Retro: #10 — subagent tool UI shows the call's model, not the one spawn selection chose

## Stage: Planning (2026-09-13T14:27:08Z)

### Session summary

Planned the tool-card freeze as a `pi-subagents`-only `fix:`: stamp the selected pair on `Subagent` after the gate, overlay `detailBase` at the three runner emit sites, and extract `formatSpawnModelName` so the display rule has one home.
Dual `pkg:` labels are observational; `@jopqior/pi-subagents-model-selector` does not change.
Committed `docs/plans/f0010-tool-ui-shows-selected-model.md`.

### Observations

- The pair that runs is a local `selected` in `prepareSession`; `execution.model` is never overwritten, and `SubagentRecord` does not carry it (ADR 0005).
- Overlay is a no-op unless `awaitingSelection` or `selectedPair` is set, so no-provider presentation and `createResolvedSpawnConfig` fixtures (`execution.model: undefined`) stay intact.
- Test seam is `SubagentInit.selectedPair` (construct-complete), not a post-construction write, matching design principle 8.
- Field/getter cannot share the name `selectedPair`; the plan uses `_selectedPair` plus a getter.
- Skipped `ask_user`: operator-authored issue, expected behavior is the spec, ADR 0005 declines a public-snapshot widening.

#### Deferred tidyings

- `src/ui/display.ts` — `detailBase.tags` stays a string list; a keyed tag vocabulary would dissolve thinking-tag matching but reshapes the widget, renderer, and every tag pin.
- `src/tools/spawn-config.ts` — only the Claude-strip ternary moves; the rest of `resolveSpawnConfig` is untouched.
- `test/lifecycle/subagent.test.ts` — gated-selection `start` / `resolve` / `await promise` idiom stays inlined; no `settleGatedRun` helper.
- `src/ui/display.ts` — `"twin"` mode-label literal stays in `getPromptModeLabel`; overlay matches a leading `"twin"` by string.
