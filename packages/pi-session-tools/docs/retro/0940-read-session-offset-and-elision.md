---
issue: 940
issue_title: "read_session has no offset: attributing early turns in a long session re-renders the whole tail"
---

# Retro: #940 — read_session has no offset: attributing early turns in a long session re-renders the whole tail

## Stage: Planning (2026-09-19T07:54:30Z)

### Session summary

Planned `packages/pi-session-tools/docs/plans/0940-read-session-offset-and-elision.md`: a new pure `src/entry-selection.ts` owning type filtering, phantom `model_change` pruning, and a clamped `offset`/`limit` window, plus an `elide_user_text` rendering option and `session_info` rendering, across seven TDD steps.
The operator's gate settled three things: build both capabilities from the issue (not one), fold in the newly-found `session_info` rendering gap, and close [#950] in the same pass since `offset` rewrites the exact slice it reports.
The Tidy-First assessor contributed one Recommended preparatory step — relocating `collectEffectiveModelChangeIndices` before the behavior change — which leads the TDD Order.

### Observations

- **Measured before framing the gate.**
  Ran the package's own `formatTranscript` over the real #934 session (246 entries) rather than reasoning about cost: 99,905 rendered chars full; 78,001 for the three calls `/retro` actually made; ~34,000 for the same coverage paged with `offset`; 53,377 for all 246 entries with user bodies elided.
  That showed the two proposals are complementary rather than alternatives — `offset` flattens the re-read, elision flattens the per-entry cost — which is what turned "either would do" into "both, sequenced".
- **The issue's own fix would have broken its own use case.**
  Eliding user bodies destroys stage attribution, because stage boundaries are only visible in the user-message text — `formatMetadataEntry` drops `session_info` entries on its `default:` arm.
  The measured session carries four such entries naming `#934 Ship` and `#934 Retrospective`.
  Rendering them (+309 chars, 0.3%) is what makes elision non-lossy rather than merely cheaper; it became the third goal.
- **Pruning order is the design's load-bearing decision.**
  `collectEffectiveModelChangeIndices` reads "end of array" as "no turn followed", which is only sound because `limit` always yields a suffix.
  With `offset` the window ends mid-session, so an in-window suppression pass would silently drop a real model switch at the trailing edge — for the one reader whose job is noticing model switches.
  Pruning on the unwindowed array removes the failure mode structurally; the cost is that `formatTranscript` and `summarizeEntries` both get simpler, and five test cases move layers.
- **Two observable output changes were classified rather than hidden.**
  Non-breaking (no default, name, or result shape changes), but an unparameterized `read_session` call does render four new `[session]` lines and report `241 entries` instead of `246` on the measured session.
  Both are written into Goals with their measured magnitudes.
- **Conventions confirmed against the repo, not assumed.**
  Multi-word tool params are snake_case here (`run_in_background`, `expected_sha`), so `elide_user_text`; "elide" is already this repo's word for a budget-driven omission (`pi-permission-system`); `Math.max(0, …)` mirrors [#916]'s `boundListingPaths`; `TNumberOptions.minimum` verified in the pinned typebox 1.1.38.
- **Rejected: a shared entries fixture across the three tool tests** (the assessor's one Optional item).
  The three deliver entries through structurally different seams (`sessionManager.getEntries()` vs. a mocked `node:fs`), and moving the windowing matrix into `entry-selection.test.ts` drops each file to 2-3 new cases — under the threshold where the duplication would justify the abstraction risk.
- **Nothing was filed as a follow-up.**
  Both Open Questions (eliding assistant prose; a session-size probe) are deferred deliberately without an issue — neither is concretely named deferred work, and filing them now would be speculative.

[#916]: https://github.com/gotgenes/pi-packages/issues/916
[#950]: https://github.com/gotgenes/pi-packages/issues/950
