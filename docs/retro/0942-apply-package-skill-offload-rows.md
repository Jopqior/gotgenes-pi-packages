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

## Stage: Implementation — Build (2026-09-19T07:03:59Z)

### Session summary

Executed all 11 plan steps as 11 `docs:` commits (`04e3edf8`..
`20ebdb16`), applying every one of the 19 offload rows plus the one stray `compress` row.
`package-pi-permission-system` went from 12,859 to 5,451 words and `package-pi-subagents` from 2,681 to 2,533 (measured with `wc -w`); `always-loaded.mjs` is unchanged at `total=2425`.
Pre-completion reviewer: PASS.

### Observations

- **The already-stated share was even larger than planning predicted.**
  Row 17's bullets turned out to be verbatim in ADR 0003 (the probe found most of them without any classification), and rows 15 and 18 needed only a handful of residue clauses against ~45 module-tree entries.
  The residue for the whole change is roughly 25 clauses appended to existing module-tree entries, one extended entry (`tool-kind.ts` for `shellTools`), five sentences in `subagent-integration.md`, and one new page.
- **The probe's output had to be classified by claim, not by line.**
  Every step's probe printed every removed line, because the destination states the same claim in different words; the useful work was the per-claim grep (`grep -rlF '<distinctive phrase>' docs/`) against the row's named destination region, done before each cut.
  Seven greps per row was typical; the survey's `partial` verdicts were right in every case but one.
- **One survey finding was overturned during planning, and one plan detail during the build.**
  Planning: the "heartbeat records live beside `sessions/`" contradiction was a misread of which `sessions/` directory.
  Build: the row 16 residue extended the existing `tool-kind.ts` entry rather than adding a new entry beside it, because `resolveShellInvocation` lives in that file; the row 4 latch constraint went to the `child-node-audit.ts` entry rather than the integration spec, because it constrains this package rather than an adapter.
- **Cutting with an anchor-bounded script was safer than a 30-line `oldText`.**
  A small `node` script that deletes from a start-anchor line to an end-anchor line (exclusive) and splices in a replacement file made each cut deterministic and re-readable; it dropped a paragraph blank line twice, both caught by the immediate `sed -n` re-read.
- **Orphaned link definitions were the only lint findings**, eleven across the two skills, each caught by the per-step `rumdl check` and removed in the same commit.
- **The released commit is exactly one** (`5cd4eca5`, `subagent-integration.md`); `next-version.sh pi-permission-system` now reports a patch bump, as the plan's Release Recommendation predicted.
