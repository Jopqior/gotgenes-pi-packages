---
issue: 919
issue_title: "pi-permission-system: renderToolSurface appends duplicate Available tools and Guidelines when a custom SYSTEM.md is used"
---

# Retro: #919 — pi-permission-system: renderToolSurface appends duplicate Available tools and Guidelines when a custom SYSTEM.md is used

## Stage: Planning (2026-09-16T16:40:02Z)

### Session summary

Planned a region-scoped rework of `renderToolSurface` so the pass removes a tool-surface section only where Pi or this package wrote it, and only as far as the section's own body.
Mid-session the operator surfaced [#932], a second third-party report of the same mechanism; a live reproduction against pi 0.85.1 showed the two issues are one defect, so the plan covers both and [#932] closes with it.
Plan committed at `packages/pi-permission-system/docs/plans/0919-preserve-a-custom-system-prompt.md`.

### Observations

- **The issue's suggested one-line fix could not ship.**
  `systemPromptOptions.customPrompt` is truthy in **every** `@gotgenes/pi-subagents` child, not only for a user `SYSTEM.md`: `create-subagent-session.ts:251` sets `systemPromptOverride`, which becomes `ResourceLoader.systemPrompt` (`dist/core/resource-loader.js:329`) and then `customPrompt` (`dist/core/agent-session.js:761`).
  Skipping the pass on that field would strip the tool block from every child — the case ADR 0014 built render-from-parts for.
  The existing handler test pinning the child case builds its event without `customPrompt`, so the regression would have shipped green; the plan's step 3 adds the killing-mutation test.
- **Live reproduction beat reasoning.**
  A temp `PI_CODING_AGENT_DIR` plus a dump extension capturing `ctx.getSystemPrompt()` after the `before_agent_start` chain (via a `setTimeout(…, 0)` inside a handler, since the runner threads `currentSystemPrompt` through the chain) showed a blast radius neither issue reported: a `SYSTEM.md` with literal headers lost its tool list, both guideline bullets, its own trailing instruction, **and** Pi's `<project_context>` opening tag — swept because Pi's lead-in `Project-specific instructions and guidelines:` ends with a colon.
  That is the mechanism behind [#932]'s "pi agent send the default one"; `SYSTEM.md` loading itself is not broken.
- **The triage entry was a lead, not a finding.**
  `docs/triage/2026-09-15-backlog.md` recorded that "#919's remedy is buildable exactly as proposed" — true of the field's availability in the pinned SDK, and wrong about the remedy, because it did not trace who else sets that field.
- **ADR 0014 had already named the fix.**
  Its first accepted residual says the headers are matched on trimmed text "with nothing tying them to Pi's authorship", and nominates anchoring to Pi's own position — the footer `pi-subagents` anchors on — as "the fix if one is ever needed".
  [#919] and [#932] are that residual being reported by two users.
  `docs/plans/archive/0033-fix-findsection-greedy-end.md` had half-fixed the same boundary years earlier and recorded the masking assumption in its Non-Goals.
- **Gate decisions.**
  Direction: preserve-and-append (never remove text we did not write; still render the block).
  Boundary: full repair — own-region plus body-only section end, closing the ADR residual and the `APPEND_SYSTEM.md` exposure in the same mechanism.
  Issues: one plan, both closed, both reporters credited.
  Standing aside entirely for an operator-authored prompt, and a config switch, were both offered and declined; they are recorded in the plan's Non-Goals with the condition that would reopen them.
- **First-occurrence matching needed no change.**
  `findSection` already starts at the first match, so under the default prompt Pi's own section is always the one removed; the `AGENTS.md`-heading exposure existed only in the `customPrompt` branch, which the authorship gate covers.
  The plan records this as a predicted-unchanged claim rather than a step.

#### Deferred tidyings

- `src/exposure/tool-surface-prompt.ts` — the assessor declined splitting the module into a removal half and a render half: the render half is untouched, the split would not shrink the diff, and it would add cross-file imports for one cohesive concept.
- `src/exposure/tool-surface-prompt.ts` — extracting the `CUSTOM_TOOLS_FILLER_PREFIX` filter into its own function was rated Optional only; `removeToolSurfaceSections` is rewritten in the same commit, so it buys no isolation and is folded into step 3.

[#932]: https://github.com/gotgenes/pi-packages/issues/932
