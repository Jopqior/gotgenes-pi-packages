---
issue: 942
issue_title: "Apply the 19 package-skill offload rows from the 2026-09-17 agent-doc audit"
---

# Retro: #942 — Apply the 19 package-skill offload rows from the 2026-09-17 agent-doc audit

## Stage: Planning (2026-09-19T06:21:20Z)

### Session summary

Measured the two package skills (`package-pi-permission-system` 12,859 words with 8,406 inside the 18 offload regions; `package-pi-subagents` 2,681 with 177), surveyed every row's destination with a background `Explore` dispatch, and gated four open design choices.
Wrote `docs/plans/0942-apply-package-skill-offload-rows.md`: a per-row disposition table (`already-stated` / `partial` / `absent`), a removed-line probe adapted from #937's moved-line check, and 11 build steps ordered by skill section.
No follow-up issues filed — the one candidate defect the survey reported did not survive verification.

### Observations

- **The audit's `offload` verdict assumed the destination was empty, and it usually is not.**
  `architecture.md`'s `## Module structure` tree and the fourteen ADRs already carry most of these passages, often near-verbatim with the same symbol names and issue refs.
  Eleven of nineteen rows are therefore applied as a cut plus a pointer, with no destination edit at all.
  This is the finding that reshaped the job from "move 8,406 words" into "delete most of them and confirm the destination already says it".
- **Operator decisions at the gate**: per-row disposition rather than verbatim-append-everywhere; all mechanism prose routes to `architecture.md` and no ADR is amended; Debugging steps 5–6 go to a new `docs/architecture/investigating-a-report.md` rather than being split across six retro files; rows 4–5 go to `docs/subagent-integration.md` and the resulting patch release of `pi-permission-system` is accepted.
- **The verification instrument had to change shape.**
  #937's moved-line check asserts every removed line appears at a destination.
  Here the dominant disposition is *delete*, so the probe's output is an input to a three-way classification (already-stated / residue / deliberate drop) rather than a pass-fail.
  Dry-run against #937's `b649d3ea`: 56 removed lines, zero missing.
- **A subagent contradiction did not survive verification.**
  The survey reported that the skill's "heartbeat records live beside `sessions/`, never inside it" contradicts the code, reading `sessions/` as the agent-dir sessions directory.
  Reading `extension-paths.ts:47`, `permission-forwarding.ts:70`, and `forwarding-liveness.ts:176` shows the request/response records sit at `forwardingDir/sessions/<id>/` and the heartbeats at `forwardingDir/serving/` — beside that `sessions/` directory, exactly as documented.
  Had this gone into the plan unchecked it would have authorized a "correction" that introduced an error.
- **The survey also found one genuinely absent row and one misfiled destination.**
  Row 16 (`shellTools` aliasing) has no architecture-doc entry at all — its only occurrence there is inside a roadmap step body — so it is the plan's single `absent` row.
  Row 12's closing sentence is testing guidance, not architecture, and is relocated into the skill's own `## Testing` rather than offloaded.
- **`always-loaded` does not move.**
  Package skills load on demand, so this change's benefit is paid to every session that touches `packages/pi-permission-system/` rather than to every session.
  The plan pins `agentsMd=1863 descriptions=562 total=2425` as an invariant precisely because a change there would mean a description was edited by accident.
- **One unapplied `compress` row was found in the same file** — `(Refs #547)` in `## Configuration`, whose sibling `(Refs #646)` #934 did apply.
  Folded into the plan's last step rather than filed: one row from the same table, one deletion.
- **Tidy-First assessment skipped**: no `src/` or `test/` files are touched.

#### Deferred tidyings

None — the assessor was not dispatched (docs-only change).
