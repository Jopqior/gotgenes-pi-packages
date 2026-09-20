---
issue: 17
issue_title: "Block subagent tool return until model selection completes"
---

# Retro: #17 — Block subagent tool return until model selection completes

## Stage: Planning (2026-09-20T16:13:48Z)

### Session summary

Created and committed a core-only implementation plan for the tool's model/thinking-selection return boundary, with numbered TDD cycles and killing mutations.
The initial fast-forward pull reported already up to date; planning started from `main` and the plan was committed on `issue-17-plan-selection-boundary`.
No implementation was started.

### Observations

- The operator chose admission before selection: a provider-enabled background tool waits for both, then returns without waiting for workspace/session/task completion.
  This preserves selection ordering but can hold the parent behind work that depends on parent continuation; document the trade-off and make queued cancellation independent of admission.
- Keep public `SubagentsService.spawn()` synchronous and the no-provider path non-blocking.
  The tool's documented immediate-return timing changes on upgrade, so the behavior commit is breaking.
- Selection needs an initial-run outcome independent of the whole-run promise and private activity flags.
  Queued stop, scope closure, disposal, and a provider that ignores abort must each settle startup waiting without permitting a late unconfirmed child.
- Startup-only tool cancellation must detach at confirmation, not after workspace construction or tool-return continuation.
  Existing query cancellation in `settleOrAbort` deliberately leaves work running and is not interchangeable with startup cancellation.
- The existing targeted baseline passed: measured 6 files and 358 tests.
  The supplied source trace was verified; interactive dialog replacement was not independently reproduced during planning and remains a fresh-session implementation acceptance check.
- Source inspection of `@earendil-works/pi-agent-core` at pinned version `0.84.4` confirmed distinct sequential and parallel batch paths.
  The plan covers sequential parent continuation, not concurrent tool batches or a descendant chooser against an independently running root.
- The Tidy-First assessment recommended no preparatory commits.
  Its optional background-formatting extraction was declined because it does not supply the missing lifecycle boundary.
- Verified a separate foreground observation defect: `SubagentManager.buildObserver()` omits the per-spawn `onStarted` callback that existing foreground progress mocks invoke directly.
  Filed [#18] with a real-manager regression requirement; it is not a prerequisite and is excluded from this plan.
  The current architecture has no open improvement-phase heading, so roadmap-fit required no disposition update.
- The companion has no package skill in this checkout; its README, provider implementation, and selection queue were read directly.
  No companion production change or release is planned.

#### Deferred tidyings

- `packages/pi-subagents/test/lifecycle/subagent.test.ts`, `subagent-manager.test.ts`, and `nested-selection.test.ts`: do not merge their differing selection fixtures as part of this boundary change.
- `packages/pi-subagents/src/lifecycle/subagent.ts`: do not reorganize the entire terminal/resume lifecycle or generalize query-only `settleOrAbort` into work cancellation.

[#18]: https://github.com/Jopqior/gotgenes-pi-packages/issues/18
