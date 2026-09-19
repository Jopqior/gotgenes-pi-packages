---
issue: 916
issue_title: "pi-session-tools: list_session_files has no limit, returning every session path for a cwd"
---

# Retro: #916 — pi-session-tools: list_session_files has no limit, returning every session path for a cwd

## Stage: Planning (2026-09-19T04:05:20Z)

### Session summary

Planned a `limit` parameter for `list_session_files`, defaulting to 10, with the count line still reporting the true total.
The plan lands in `packages/pi-session-tools/docs/plans/0916-list-session-files-limit.md` as three TDD steps: a `refactor:` extracting listing presentation into a new `src/session-listing.ts`, a `test:` fixture helper, and a `feat!:` behavior change.
Filed [#950] for a mirror-image defect found on the transcript side while designing the clamp.

### Observations

- The issue explicitly deferred the default question, so it went to an `ask_user` gate with measured numbers: this repo's own session directory holds 608 files totaling 88,160 chars of path text, against 1,450 for the newest ten.
  The operator chose a default of 10 (breaking, `feat!:`), the count-line disclosure form (`608 session files, newest first (showing 10):`), and a new `details.shown` field driving the collapsed TUI row.
  The plan records that this cuts **2.0.0** from `1.2.1` — worth re-confirming at ship time, since a major bump for a one-parameter addition is the kind of cost that reads differently a week later.
- The `tidy-first-assessor` recommended reshaping `renderListing` into a `buildListingResult` mirroring `buildTranscriptResult`, and an n-file fixture helper for the test suite.
  Both became TDD steps 1 and 2.
  It also verified the design's claim that the existing one- and two-file tests stay green under a default of 10.
- I extended step 1 beyond the assessor's recommendation: the presentation moves into a **new module** `src/session-listing.ts` rather than staying in `index.ts`.
  Reason: the collapsed-row phrasing lives in `formatResultText`, which calls `keyHint`, which reads `getKeybindings()` and a module-level `theme` (verified in the pinned `@earendil-works/pi-coding-agent@0.79.1` dist).
  No test anywhere in this repo exercises a tool's `renderResult`, so leaving the phrasing there would have shipped a behavior change with no killing mutation available.
  The package already keeps pure presentation in sibling modules with their own suites (`entry-summary.ts`, `format-transcript.ts`), so this follows existing structure rather than inventing one.
- Measured rather than reasoned about the slice directions: `buildTranscriptResult` slices the **tail** (`slice(-limit)`, oldest-first entries), the listing slices the **head** (`slice(0, limit)`, newest-first paths).
  They are not the same operation and the plan says not to share them.
- Scope check: the package README says "A new capability arrives as a new tool rather than as another parameter on an existing one", which reads like a collision.
  `docs/triage/2026-09-18-backlog.md:73` already recorded the verdict that a bound is not a new capability — the triage entry named #916 by number, so no fresh adjudication was needed.
- [#943] (recursive `tasks/` listing) is the sibling issue; the plan's Non-Goals record that bounding first means [#943] inherits the bound by construction.
- `roadmap-fit` exited at Step 1 for [#950]: `pi-session-tools` has no `docs/architecture/architecture.md`, so no open phase exists to record a disposition against.

#### Deferred tidyings

- `packages/pi-session-tools/src/index.ts` — the assessor declined a shared pluralization helper for "N session file(s)", used in two spots today and three after this change; the three strings diverge enough that extracting it mostly relocates a ternary.
- `packages/pi-session-tools/test/list-session-files.test.ts` — the assessor declined adding `renderResult`-level coverage for the collapsed row as a pre-existing module-wide gap rather than preparation for this change.

[#943]: https://github.com/gotgenes/pi-packages/issues/943
[#950]: https://github.com/gotgenes/pi-packages/issues/950
