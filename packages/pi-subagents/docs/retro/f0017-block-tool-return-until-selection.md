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

## Stage: Implementation — TDD (2026-09-21T01:56:01Z)

### Session summary

Completed the three planned code/test cycles and the documentation step, plus two disposal-edge regression cycles discovered during implementation and review.
Background tools now wait for required admission and model/thinking selection without waiting for workspace, session, or task completion; synchronous service spawning and no-provider acknowledgements are preserved.
The measured core suite grew from 1904 to 1953 tests (+49), with 84 test files in the final run; the unchanged companion suite passed with 68 tests.

### Observations

- Work stayed on `issue-17-plan-selection-boundary`; `git fetch origin` succeeded before plan loading.
  No push, release, or GitHub mutation was performed.
- Root baseline and final `check`, `lint`, `test`, and `fallow dead-code` passed.
  The first baseline lint attempt exhausted the default Node heap; subsequent root lint runs used `NODE_OPTIONS=--max-old-space-size=8192` without changing repository configuration.
  Package checks, public-type verification, and the companion suite also passed.
  No lockfile or workspace configuration changes remained.
- `refactor(pi-subagents): expose internal spawn selection completion (#17)` kept step 1 observational; its optional signal parameter arrived with the behavior step instead of being accepted and ignored.
  Mutations exercised early settlement, queued stop, failed-outcome classification, and one-shot resume behavior.
- `feat(pi-subagents)!: wait for model selection before returning background spawns (#17)` added startup-only cancellation, queued closure handling, uncooperative-provider cancellation, and the async tool boundary.
  Its breaking footer preserves the distinction between tool timing and the synchronous public service.
  Named mutations exercised missing background waiting, whole-run waiting, signal forwarding, queued closure, provider cancellation, late-pair application, listener detachment, and manager teardown.
- `test(pi-subagents): pin sequential parent selection boundaries (#17)` added the real tool-manager-record chain with separately held downstream phases.
  Workspace preparation may begin before the tool continuation resumes; the contract is that the tool does not wait for it, not that it begins afterward.
  The final tests capture the selected pair inside the actual following `ask_user` spy.
  A mutation that fabricated a successful selected outcome while removing the wait failed the continuation and queued-admission assertions, independently of success wording.
- Implementation found a late-registration disposal edge: a no-provider tool acknowledgement could settle before admission later opened a live selection gate.
  `fix(pi-subagents): cancel late-registered selection on disposal (#17)` preserves that one-shot acknowledgement while cancelling the outstanding gate on disposal.
  This was within the plan's explicit live-scope admission behavior, so it was fixed rather than deferred.
- The first pre-completion review returned FAIL: a synchronous service caller with no selection waiter could already be running when a provider was registered, causing disposal to mistake its unobserved outcome for unfinished selection and newly abort the task.
  The operator chose repair and re-review.
  `fix(pi-subagents): preserve running task disposal after provider registration (#17)` settles the no-provider phase at preparation and adds both provider-at-spawn variants; the new no-provider regression failed before the fix, and an inverted disposal guard killed both variants afterward.
  The late-registered live-gate regression remains green.
- Review also identified a timed pending-state drain in the integration harness.
  It was removed in favor of production promises, phase checkpoints, and the selection snapshot captured at parent continuation.
  A child-start progress callback omission encountered during mutation work is the already-recorded [#18], not a new scope expansion.
- Manual acceptance was operator-reported, not independently instrumented: after being asked to open a fresh Pi session from the repository root using the local core and selector, the operator reported that all three cases passed (pending selection holds the parent, confirmation releases it before child completion, and cancellation returns without child creation).
  The current session's stale extension code was not used as evidence for the fix.
  That report preceded the final disposal-only edge correction; no second interactive run is claimed.
- Pre-completion reviewer: WARN after a fresh delta review of the final fix; the earlier blocking defect and timed-drain warning were cleared.
  The reviewer independently reran all four root gates successfully.
  Reviewer warnings: GitHub/vivify Mermaid preview remains unperformed; the changed class and execution diagrams rendered locally with `mmdc` using a temporary Chromium no-sandbox configuration, and the execution PNG was inspected.
- All planned module-level files were updated; the public service, public snapshot shape, limiter, selection-scope ownership, foreground runner, and companion production code remained unchanged.
  No roadmap completion mark applied, and `CHANGELOG.md` was not edited.

[#18]: https://github.com/Jopqior/gotgenes-pi-packages/issues/18

## Stage: Sync (worktree) (2026-09-21T02:26:09Z)

### Session summary

Pre-sync lint passed with `NODE_OPTIONS=--max-old-space-size=8192` after the default Node heap exhausted memory; `pnpm fallow dead-code` passed without findings.
The plan recommends `ship independently` for the breaking core change, with publishing subject to explicit approval; foreground progress follow-up [#18] remains deferred.

**Peer session transcript:** `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/2026-09-21T02-23-25-430Z_01a0c1c6-7af6-7463-a119-cb89ecbfdce1.jsonl` — read with `read_session_file` for message-level verification.

### Observations

- The feature branch is checked out in the root directory rather than a separate linked worktree; synchronization leaves `main` untouched and does not push.
- The implementation-stage warning about the unperformed GitHub/vivify Mermaid preview remains recorded above.
- Final `/retro 17` is deferred to the root after `/ship 17`; this entry is only the sync breadcrumb.

## Stage: Ship (2026-09-21T05:24:21Z)

### Session summary

Fast-forwarded the implementation branch onto root `main`, pushed it, and closed issue #17 after CI passed.
The operator explicitly approved publishing `@jopqior/pi-subagents` to npmjs.org through this fork and approved the issue-close comment.
Release run [35564374563](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/35564374563) succeeded for `pi-subagents-v3.0.0`; the release commit and tag were pulled locally.

### Observations

- Root lint passed with `NODE_OPTIONS=--max-old-space-size=8192`, and dead-code analysis reported no issues on the merged implementation.
  CI run [35564081158](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/35564081158) passed before closing the issue and dispatching the release.
- The release candidate scan found only `pi-subagents`; no companion release or additional issue/PR closure applied.
  Foreground progress follow-up [#18] remains separate, and this change does not complete a roadmap phase.
- Lane detection found the implementation branch, but `git worktree list` showed only the root checkout on `main`.
  No linked worktree existed to remove, so the worktree-removal script was skipped and the merged branch was safely deleted with `git branch -d`.
- The implementation-stage Mermaid preview warning remains unchanged.
  The deliberate final retrospective is `/retro 17` at the root.

## Stage: Final Retrospective (2026-09-21T05:32:14Z)

### Session summary

Reviewed the planning, implementation, sync, and ship transcripts, their stage notes, and the available subagent transcript endings.
The selection-return boundary shipped as `@jopqior/pi-subagents` version `3.0.0`, while the separate foreground observation defect remains tracked by [#18].
This retrospective changes no production behavior and does not reopen the operator-accepted diagram-preview warning.

### Observations

#### What went well

- The fresh-context review found a real service-only disposal regression after all automatic gates were green.
  The contrast between an unobserved selection outcome and a completed lifecycle phase led to `fix(pi-subagents): preserve running task disposal after provider registration (#17)` and a successful delta review.
- The Tidy-First assessment discovered that foreground mocks invoked a callback the real manager did not forward.
  Filing [#18] during planning kept that separate defect visible without expanding the selection-boundary implementation.
- Manual acceptance used a fresh Pi session rather than the implementation session's stale extension instance.
  The operator confirmed the three requested scenarios; the transcript also records the later decision to accept, not falsely mark verified, the GitHub/vivify preview warning.

#### What caused friction (agent side)

- `wrong-abstraction` — selection settlement initially depended on a tool observing the outcome, although synchronous service callers never observe that milestone.
  Late provider registration exposed both the live-gate and already-running-task cases in `src/lifecycle/subagent.ts`.
  Impact: two disposal follow-up commits and a second pre-completion review.
- `instruction-violation` — self-identified through the dispatched reviewer: `test/tools/spawn-selection-boundary.test.ts` used a timed drain despite the plan and `.pi/skills/testing/SKILL.md` requiring explicit promise/phase evidence for pending state.
  Impact: the integration harness was rewritten after its first commit, and the parent strengthened the mutation check to capture the selected pair inside the actual following `ask_user` continuation.
- `missing-context` — the sync session ran plain root lint before reading the implementation breadcrumb that already documented the Node heap failure and working command.
  Impact: another failed lint invocation and retry with `NODE_OPTIONS=--max-old-space-size=8192`; no source rework.
  The ship template already uses that command, while `.pi/prompts/sync-worktree.md` still prescribes plain lint.
- `other` — the sync breadcrumb names its own transcript as the peer transcript, not the implementation transcript.
  Impact: the final retrospective needed `list_session_files` to locate the earlier TDD conversation; the recorded path was useful but insufficient for implementation diagnostics.

#### What caused friction (user side)

- No missing operator context was identified as causing the code rework.
  Admission ordering, fresh-session acceptance, and publication approval were substantive decisions rather than mechanical supervision.
- The operator explicitly accepted the remaining diagram-preview warning after implementation, but subsequent breadcrumbs only repeated that it was unperformed.
  Opportunity: carry the acceptance disposition alongside the verification limitation so later sessions do not ask the operator to adjudicate it again.

### Diagnostic details

- Model attribution comes from executed assistant-turn labels, not agent configuration: the observed Tidy-First, initial review, and delta-review turns used `openai-codex/gpt-6-astra`.
  The observed implementation-step and resumed integration-harness turns used `zai-coding-cn/glm-5.3-flash`; the resumed dispatch reused the integration transcript rather than creating another file.
  The lifecycle work needed judgment, and review found a missed service path and a timed-drain test weakness; this supports retaining independent review, not attributing causation to the model or imposing a model ban.
  No cost or latency comparison was measured.
- Feedback-loop analysis found incremental Red/Green runs, interface typechecking, killing mutations, and repeated full gates rather than end-only verification.
  The gap was scenario selection: a green suite did not cover the synchronous service caller that never waits for selection.
  Future lifecycle work should use this concrete caller contrast; this retro does not add another general testing rule.
- The planning transcript shows two failed module-resolution commands followed by a successful filesystem lookup; the diagram-rendering failure was followed by a temporary Chromium configuration and successful rendering.
  Neither observed recovery warrants a rabbit-hole escalation rule.
- The unused-tool lens found no missing search capability explaining the main rework: the required lifecycle and testing context was available, and independent review supplied the missing counterexample.
  The repeated lint failure instead calls for aligning the command at the sync workflow's point of use.

### Proposed adjustment

Replace only the root lint command in `.pi/prompts/sync-worktree.md` with the heap-sized command already used by `.pi/prompts/ship.md`.
Do not change repository-wide Node defaults, add an `AGENTS.md` rule, duplicate the pending-state testing rule, or restructure the worktree workflow in this retro.

### Next work

There is no fork roadmap successor or phase-close action for this issue.
The newest triage, `docs/triage/2026-09-18-backlog.md`, ranks inherited `gotgenes/pi-packages` work, not this fork's queue.
Fork issue [#18] was checked open during this retrospective and is the concrete follow-up candidate, without an invented triage rank or severity.

### Changes made

1. Appended the cross-session retrospective to `packages/pi-subagents/docs/retro/f0017-block-tool-return-until-selection.md`, including the review-driven repairs, model-attribution limits, and the operator's acceptance of the unperformed diagram preview.
2. With operator approval, replaced the root lint command in `.pi/prompts/sync-worktree.md` with `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`, matching the existing ship command without changing global configuration or adding another rule.
