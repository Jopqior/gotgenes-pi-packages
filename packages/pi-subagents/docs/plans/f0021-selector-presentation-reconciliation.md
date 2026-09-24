---
issue: 21
issue_title: "Reduce selector presentation reconciliation with upstream UI changes"
---

# Generate ordinary and selected spawn presentation through one path

## Release Recommendation

**Release:** ship independently

Phase 23 assigns this delivery `Release: independent`, with no joint release batch.
The planned changes are non-breaking `test:`, `refactor:`, and `docs:` work, not a new user-visible feature or an automatic publication request.
Confirm release derivation at ship time; publishing still requires approval of the fork destination and package scope.

## Problem Statement

Ordinary spawn presentation is computed before model/thinking selection, then the runners overlay the selected facts onto already-formatted output.
That overlay recognizes thinking-tag strings and a leading `twin` label, while the upstream model-name formula has been relocated from `spawn-config.ts` into `display.ts`.
Consequently an upstream display change can require formula transfer or separate selector-specific interpretation even when the textual merge succeeds.
This delivery must remove identifiable reconciliation work, not merely move code or reduce a diff.

## Goals

- Use one ordinary presentation producer for initial, pending, and confirmed spawn details, choosing raw model/thinking inputs before formatting.
- Remove selector dependence on thinking-tag spelling and the literal `twin`, without replacing string tags with a generic tag system.
- Keep the sole model-name formula in `spawn-config.ts`, alongside the ordinary presentation block it belongs to.
- Centralize pending-activity precedence in the existing activity formatter, retaining the foreground stream and background widget.
- Preserve all observable behavior, defaults, public result shapes, and selection timing: this is a non-breaking internal refactor.
- Deliver affected behavior tests and reproducible, explicitly synthetic before/after display-change trials, including remaining upstream adaptation obligations.

## Non-Goals

- No new lifecycle model, provider API, public snapshot field, selection event, or companion-package change.
- Do not revisit [#20]'s startup owner, cancellation, inheritance, factory checks, observer ordering, or tool-return boundary.
- No renderer copy, renderer replacement, generic tag cleanup, widget redesign, or broad test-harness consolidation.
- Do not change the first foreground placeholder before a record exists, queued presentation, cancellation/failure fallback, resume-call presentation, or background-card chrome.
- Do not add model/thinking display to the live widget or `get_subagent_result`.
- Do not promise conflict-free upstream merges or measured maintenance-time savings.
- Overall delivered maintenance assessment remains [#19]; finishing this issue does not close that parent automatically.

These are scope boundaries, not newly promised follow-up deliveries; no follow-up issue is required.

## Background

### Baselines and context

The mandatory initial `git pull --ff-only` reported already up to date.
No additional fetch is authorized during this fixed-baseline investigation or the reconciliation trials.

- Fixed upstream: `edb35ee28535aac4e12431e47e440f6933911834`.
- Recorded inventory snapshot: `746a4ae812a574d0496cb46c125a32961a608cf1`.
- Current planning implementation: `fbd15ece7b0ec6091ff2259ef40f149e0131559a`.
- Startup implementation from [#20]: `935cdd578b7b1af4da4beceb4707244d74264cb3`, now shipped and closed.

These identifiers were resolved locally with `git rev-parse`.
The inventory-to-current diff is empty for `spawn-config.ts`, `display.ts`, `agent-widget.ts`, and `widget-renderer.ts`; the newer startup implementation must nevertheless remain the execution baseline.
The issue author and authenticated CLI user are both `Jopqior`.
The fork's open-issue searches found this delivery and its parent, and its open-PR sweep returned none.
The newest inherited triage, `docs/triage/2026-09-18-backlog.md`, has no entry for this fork issue.
No fork `f0021-` retro exists; the fallback `pi-permission-system` retro numbered `0021` concerns an unrelated inherited upstream issue.

The operator selected the unified raw-input producer over a narrower tag-only change that would retain the handbook's cross-file model-formula transfer.
The existing README scope permits internal work on presentation the core already owns.
Accepted ADR 0005, `docs/decisions/0005-subagent-record-admission-policy.md`, excludes live activity and display snapshots from the public record; this plan preserves that boundary.

### Current data flow and trigger

`AgentTool.execute()` resolves invocation configuration once, builds a parent snapshot, then routes to a runner or the existing resume door.
`InitialSpawnSelection.begin()` sets pending only after admission; successful validation records the pair before clearing pending and settling the selection outcome, while its `finally` clears pending on failure/cancellation.
`Subagent` exposes those existing private facts through getters.
The foreground runner acquires its record through `onStarted` and rereads it on spinner updates; the background launch waits for the existing selection outcome before constructing details.
The widget polls live records and projects `awaitingSelection` into its private `WidgetAgent` snapshot.
No new trigger or subscription is needed.

The earlier [#10] extraction deliberately prevented ordinary and selected paths from owning different model-name formulas.
Keep that single-source invariant; supersede its location and manual-transfer recipe, not its reason for existing.
Its historical plan and retro remain history rather than being rewritten.

## Design Overview

### One ordinary producer, raw selection inputs

Keep the ordinary producer local to `src/tools/spawn-config.ts`, below its caller according to the stepdown rule.
It returns values and owns the formatting transformation; it is not an extracted void procedure or an alternate renderer.
Capture resolved identity, description, mode label, and invocation facts once, without retaining a registry or rerunning config/model resolution when a spinner renders.

The producer accepts these narrow groups:

```typescript
type DisplayModel = { readonly id: string; readonly name: string };

type SpawnDisplayContext = {
  readonly displayName: string;
  readonly description: string;
  readonly subagentType: string;
  readonly modeLabel: string | undefined;
};

type SpawnInvocationFacts = Omit<AgentInvocation, "modelName">;

type SpawnPresentationSource = {
  readonly awaitingSelection: boolean;
  readonly selectedPair?: {
    readonly model: DisplayModel;
    readonly thinkingLevel: ThinkingLevel;
  };
};

interface SpawnPresentation {
  modelName: string | undefined;
  agentTags: string[];
  detailBase: SpawnDetailBase;
  detailFor(
    source: SpawnPresentationSource | undefined,
    parentId: string | undefined,
  ): SpawnDetailBase;
}
```

Move `SpawnPresentationSource` from `display.ts` to `spawn-config.ts`; keep `SpawnDetailBase` in `display.ts` because `buildDetails` also consumes it.
These are internal types, not package subpath exports or public service contracts.
The local ordinary producer computes the model name, constructs `AgentInvocation`, calls `buildInvocationTags`, applies the mode label, and returns both the invocation and presentation values.
The initial invocation becomes the existing `execution.agentInvocation`; the initial presentation values become the existing fields above.
The bound `detailFor` method captures the resolved facts and initial `detailBase`, not mutable lifecycle state.
It reads the source anew each call and uses the same ordinary producer for altered inputs.

| Source                                   | Inputs and result                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Absent                                   | Return the original `detailBase` object.                                                |
| Pending, even if a pair is also supplied | Supply `model: undefined` and `thinking: undefined`; retain all other resolved facts.   |
| Confirmed pair                           | Supply the pair's model and thinking, including `off`; retain all other resolved facts. |
| Neither pending nor selected             | Return the original `detailBase`, including cancellation/failure fallback.              |

There is no cache, mutable presentation state, or set/clear lifecycle to synchronize.
Never write back into `execution`, the record, the source pair, or an incoming tag array.
The producer makes fresh derived values for pending/selected output; no-provider output keeps the original identity and values.
Unrelated invocation tags and future tags produced by the ordinary builder flow through naturally, rather than being reconstructed by a selector-specific string parser.

The interaction remains direct:

```typescript
// Config resolution, once:
const initial = buildSpawnDisplay(context, invocationFacts, model, initialParentId);
// Bound detailFor chooses raw facts, then delegates:
return buildSpawnDisplay(context, selectedFacts, selectedModel, parentId).presentation.detailBase;
// Runners, at their existing emission sites:
const base = presentation.detailFor(record, params.snapshot.model?.id);
const details = buildDetails(base, record, { tokens: tokenText });
```

The sketch names the ordinary producer `buildSpawnDisplay`; it remains private, and does not call a registry, a manager, or an SDK method.
Its context fields are all read when constructing identity/detail output and mode tags; invocation fields are thinking, explicit normalized max turns, inheritance, and background mode, all consumed by `AgentInvocation`/`buildInvocationTags`.
The model slice reads only `id` and `name`, not the full SDK `Model`.
No public helper receives the whole config or concrete `Subagent` class.

### Preserve subtle existing inputs

Initial presentation compares against `modelInfo.parentModel?.id`; selected presentation continues comparing against the runner's `snapshot.model?.id` through the method argument.
`runtime.ts` and `parent-snapshot.ts` currently derive these from the same session context, but the plan does not require their equality or change their existing sources.
A test supplies different IDs to pin that distinction.

Keep the current fork formula's missing-model and equal-id checks, including the behavior for an empty model ID different from the parent.
The fixed upstream inline formula has an additional truthiness check on the ID; restoring its text verbatim would not preserve the current helper for that input.
Reuse the fork's existing semantics when moving the sole formula back, and document that residual difference.

Keep explicitly configured max turns in invocation tags, not the settings-derived effective limit used by runtime stats.
Resolve the prompt-mode label once for this call; do not reread agent files while rendering.
Leave resume on `presentation.detailBase`, and keep pre-record and unsuccessful-selection fallback behavior unchanged.

### Activity boundary

Extend the existing `describeActivity(activeTools, responseText?, awaitingSelection = false)` with a pending-first branch returning `PENDING_SELECTION_ACTIVITY`.
Foreground and widget renderers pass their existing private boolean and delete their local pending ternaries.
The widget's projection and public lifecycle status remain unchanged.
The transcript's existing two-argument call remains ordinary activity through the default argument.
Keep ordinary tool grouping, response truncation, fallback text, glyphs, spinner lifecycle, and renderer layout untouched.

This removes duplicated precedence decisions, not a duplicated wording constant: wording was already shared before this change.
An ordinary tool-name change already propagated through `describeActivity`; claim no new benefit for that scenario.
An upstream rewrite of the formatter must still preserve its pending-first branch and the caller-supplied boolean.

### Design-review checklist

| Check                   | Evidence and disposition                                                                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency width        | Retain the existing initial presentation fields for config/resume consumers; add only the bound behavior runners use. Narrow producer inputs to display context, invocation facts, model identity, and parent ID. |
| Law of Demeter          | Runners tell their presentation to produce details; they no longer inspect tags. No UI method reaches through a selection owner.                                                                                  |
| Output arguments        | Builder returns new values; no changes to execution facts or record state.                                                                                                                                        |
| Scattered resets        | No mutable field is added, so no reset or cleanup protocol is introduced.                                                                                                                                         |
| Parameter relay         | Retain the existing snapshot-parent input at the final presentation call; do not thread it through manager/lifecycle layers.                                                                                      |
| Repeated discriminators | Pending/selected detail dispatch lives at one bound method; activity precedence lives in its existing formatter. Different products do not justify a generic selection framework.                                 |
| Mock depth              | Migrate selection-specific runner inputs to real config resolution; preserve shallow manager doubles and the real-tool boundary harness.                                                                          |
| Missing abstraction     | Add behavior to the existing presentation concept, not another dependency bag or cross-package service.                                                                                                           |

### Evidence already observed and delivery acceptance

Planning ran the unchanged focused suite: **measured 8 files and 188 tests passed**.
The complete core suite also passed (**measured 86 files and 1984 tests**), as did the companion suite (**measured 9 files and 68 tests**).
These are baseline results, not verification of the proposed refactor.

```bash
pnpm -C packages/pi-subagents exec vitest run test/display.test.ts test/tools/spawn-config.test.ts test/tools/foreground-runner.test.ts test/tools/background-spawner.test.ts test/tools/spawn-selection-boundary.test.ts test/widget-renderer.test.ts test/ui/agent-widget.test.ts test/service/service-adapter.test.ts
pnpm -C packages/pi-subagents run test
pnpm -C packages/pi-subagents-model-selector run test
```

A disposable Vitest probe called the real `resolveSpawnConfig` and `overlaySpawnPresentation`, replacing only `getPromptModeLabel` with controlled output through a partial module mock.
It used the existing `makeModel` helper, synthetic invocation values (`thinking: high`, inheritance enabled), and a selected pair at `off`.
This is a synthetic future-change scenario on real current code, not a reported production bug or an actual upstream change.
The control retained `twin`; the variant returned `mirror`.
Each deterministic arm ran once, with no cache or stochastic provider involved.

| Arm           | Ordinary tags, measured                       | Pending tags, measured      | Confirmed tags, measured                     |
| ------------- | --------------------------------------------- | --------------------------- | -------------------------------------------- |
| Control       | `twin`, `thinking: high`, `inherit context`   | `twin`, `inherit context`   | `twin`, `thinking: off`, `inherit context`   |
| Label variant | `mirror`, `thinking: high`, `inherit context` | `mirror`, `inherit context` | `thinking: off`, `mirror`, `inherit context` |

The variant demonstrates the selector overlay's independent ordering rule: changing the ordinary mode-label producer does not carry its placement into confirmed presentation.
The spike's assertions characterized both outcomes, so its **measured 2 passing tests** do not mean the maintenance defect was fixed.
Command: `pnpm -C packages/pi-subagents exec vitest run test/tools/presentation-maintenance-spike.test.ts --reporter=verbose`.
The disposable file was removed and `git status --short` was empty afterward.
No production change or candidate implementation was made during planning.

The delivered evidence must rerun controls and variants against the planning implementation and the delivered implementation, with these predicted outcomes clearly distinguished from measurements:

| Synthetic incoming change                                                                              | Before obligation                                                                                                                                  | Predicted delivered obligation                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Rename the ordinary mode label from `twin` to `mirror`                                                 | Repair the selector's literal-dependent insertion rule to preserve ordinary order.                                                                 | Change the ordinary label producer only; pending and selected use its placement without selector edits.                            |
| Move the thinking tag after the other invocation tags in `buildInvocationTags`                         | Update the overlay's independent insertion order as well.                                                                                          | Change the ordinary tag producer only; selected thinking follows it, pending still omits thinking.                                 |
| Change the ordinary model-name formula, using an uppercase variant of the fixed-upstream display block | Transfer the incoming formula from `spawn-config.ts` to `display.ts`; accepting it only in the original file leaves selected formatting different. | Adapt the incoming block into the local common producer in `spawn-config.ts`; no cross-file transfer or separate selected formula. |

For the model trial, disclose the required local-block adaptation; do not label extraction as a zero-edit upstream transplant.
Also run the correctly repaired pre-change helper as a control: the current design already has one formula once the handbook is followed.
The improvement is simpler adaptation location and removal of selected tag interpretation, not a claim that the old formatter was duplicated.
Do not count activity wording changes as savings; include them as an already-shared control if useful.

Persist exact source patches, invocation fixtures, expected ordinary/pending/selected outputs, commands, exit statuses, focused test output, and actual before/after commit IDs in `docs/architecture/selector-presentation-maintenance.md`.
Keep the evidence reviewer-readable in the repository, not only in inaccessible temporary logs.
Use disposable isolated trees or backed-up file swaps with unconditional restoration, never fetch or overwrite unrelated uncommitted work.
Restore the production formulas and labels before final verification.
If the trials do not establish the stated improvement, return to [#19] rather than silently enlarging scope or declaring a report-only success.

## Module-Level Changes

Paths are relative to `packages/pi-subagents/` except where noted.

| File                                                     | Change                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tools/spawn-config.ts`                              | Local sole presentation producer, narrow captured raw facts, moved source type, and bound `detailFor`; retain initial fields and execution values.                                                                                                                                                                    |
| `src/ui/display.ts`                                      | Remove `formatSpawnModelName`, `overlaySpawnPresentation`, their private pending/selected helpers, `isThinkingTag`, `thinkingTag`, and `THINKING_TAG_PREFIX`; restore the ordinary direct thinking-tag producer; centralize pending activity in `describeActivity`. Keep `SpawnDetailBase` and the activity constant. |
| `src/tools/foreground-runner.ts`                         | Use `detailFor` at streaming and final-detail sites, and pass pending to `describeActivity`; leave admission observers, timer cleanup, consumption, addenda, and whole-run waiting alone.                                                                                                                             |
| `src/tools/background-spawner.ts`                        | Use `detailFor` at launch details; leave the selection wait, cancellation/failure classification, notes, and launch text alone.                                                                                                                                                                                       |
| `src/ui/widget-renderer.ts`                              | Pass existing pending fact to `describeActivity`, deleting only the local ternary and unused constant import.                                                                                                                                                                                                         |
| `test/tools/spawn-config.test.ts`                        | Add ordinary/selected/pending exact-value characterization, migrate formatter/overlay cases, pin immutable execution and captured config facts.                                                                                                                                                                       |
| `test/tools/foreground-runner.test.ts`                   | Use real resolved inputs for selection cases; pin initial/pending/confirmed/final output, preserving the runner's manager seam.                                                                                                                                                                                       |
| `test/tools/background-spawner.test.ts`                  | Use real resolved inputs for the selected launch; assert complete applicable tags, including genuine mode/background tags.                                                                                                                                                                                            |
| `test/helpers/make-spawn-config.ts`                      | Add a no-op bound detail method for generic non-selection fixtures without changing their existing scalar defaults or initial tags.                                                                                                                                                                                   |
| `test/helpers/make-spawn-config.test.ts`                 | Update the full-shape assertion for the new function and separately assert it returns the fixture's original detail object.                                                                                                                                                                                           |
| `test/display.test.ts`                                   | Move old formatter/overlay behavior coverage to the new producer seam when those exports disappear; add activity-priority and ordinary-fallback tests. Retain unrelated formatter tests.                                                                                                                              |
| `test/widget-renderer.test.ts`                           | Retain pending rendering test and strengthen activity precedence/fallback assertions without changing layout expectations.                                                                                                                                                                                            |
| `test/ui/agent-widget.test.ts`                           | Add or strengthen pending-to-normal projection assertions through the real widget callback, including running status; keep existing lifecycle/disposal tests.                                                                                                                                                         |
| `test/tools/spawn-selection-boundary.test.ts`            | Strengthen exact presentation assertions on the existing real tool/manager path, including background selected details and foreground final details; do not replace phase gates.                                                                                                                                      |
| `docs/architecture/selector-presentation-maintenance.md` | New inspectable reconciliation trials and residual-contract inventory.                                                                                                                                                                                                                                                |
| `docs/architecture/architecture.md`                      | Update current module descriptions and Phase 23 issue-21 heading/node completion markers, commit type, and `Landed:` note at implementation completion. No phase archival or parent-issue closure.                                                                                                                    |
| Repository `docs/upstream-sync.md`                       | Replace the old formatter pin and cross-file transfer steps with the actual common-producer integration recipe and link the trials; retain the separate startup handbook.                                                                                                                                             |

The removed-symbol search covered package `src/`, `test/`, architecture docs, all `.pi/skills/`, and the root sync handbook.
The source consumers are `spawn-config.ts`, the runners, and the old display tests; the mode/tag private helpers are used only inside `display.ts`.
Review historical plan/retro mentions as provenance, not instructions to edit old records.
The package skill describes private selection activity but does not name the old formatter/overlay mechanism, so no skill rewrite is expected.

Predicted unchanged, with explicit reasons:

- `src/tools/agent-tool.ts` and its tests: resume still consumes the initial `detailBase`; existing foreground/background routing and timing assertions stay valid.
- `src/tools/helpers.ts`, result renderers, and their tests: `SpawnDetailBase`/`AgentDetails` output shape does not change.
- `src/ui/agent-widget.ts`: already projects the existing private pending boolean; no timer or observer changes are needed.
- `src/ui/transcript-content.ts` and its tests: its two-argument `describeActivity` call retains ordinary behavior.
- Lifecycle/selection owner, manager, factory, runtime, service source and service tests: no lifecycle input/output or public allowlist changes.
- `README.md` and `docs/configuration.md`: existing selected-pair display and wait semantics remain accurate; review, but do not add a new user-facing feature claim.
- `.pi/skills/package-pi-subagents/SKILL.md`, package manifests, lockfile, and `packages/pi-subagents-model-selector/**`: no changed module layout, public dependency, capability, or consumer contract.

## Test Impact Analysis

The new seam enables direct tests of selection as raw-input substitution through the same real producer that builds ordinary output.
It eliminates tests whose subject is string stripping/insertion in a soon-deleted overlay; migrate their behavior matrix rather than retaining dead-export tests or weakening output assertions.
Keep the ordinary config-resolution tests, runner emission tests, real tool/manager boundary suite, widget projection tests, and service snapshot tests because they exercise distinct wiring/lifecycle layers.
A lower-level passing producer cannot prove the runners call it at the right emission sites.

The generic fixture currently uses a display-only `model` string, leaves `execution.model` undefined, and builds empty initial tags even for a background fixture.
Preserve those defaults and add a shallow method returning its initial detail object; do not duplicate production selection logic in the helper.
Selection-specific runner tests instead call real `resolveSpawnConfig`, with explicit raw inputs and a real registry/model fixture, before invoking the runner.
Those fixtures legitimately gain `twin` and `background` where production would emit them; update exact expectations during the preparatory test commit.
Do not add the previously declined generic `tags` override merely to retain mutation-based arrangements.

The input matrix includes missing source, ordinary record, pending precedence, selected equal/different parent, non-Claude/Claude names, empty model ID, thinking `off`, append/replace prompt mode, empty tags, unrelated inheritance/background/max-turn tags, settings-only turn limits, and terminal fallback.
Pin exact details and tag order independently, not only ordinary-versus-selected equality through the same implementation.

## Invariants at risk

| Invariant and constituency                                                                                         | Evidence to retain or add                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No-provider output and initial placeholder remain unchanged for operators without the companion.                   | Existing config tests plus new exact initial/no-op pins; return the original detail object and keep the first pre-record stream update.                                                            |
| Pending suppresses provisional values and confirmed details use the pair, before session creation.                 | Opened `test/tools/spawn-selection-boundary.test.ts`, foreground whole-run case: real tool/manager/record with held provider and factory; strengthen final-detail assertions.                      |
| Background returns after confirmation but before workspace/session/task completion; foreground waits for the task. | Keep the real boundary suite's sequential-continuation, queued-admission, workspace, and whole-run cases unchanged in timing and gates.                                                            |
| Initial selection facts remain private and public status remains running for public consumers.                     | Opened `test/service/service-adapter.test.ts`, `withholds pending-selection activity from the public snapshot`, and exact admitted-field assertions; widget tests separately pin visible activity. |
| Background widget remains background-only, self-driven, and disposable for interactive users.                      | Keep `test/ui/agent-widget.test.ts` projection, background filtering, lifecycle timer, linger, and disposal cases; production projection is unchanged.                                             |
| Ordinary transcript activity is unaffected for session viewers.                                                    | Run transcript-content tests and direct two-argument activity tests; the new parameter defaults to false.                                                                                          |
| Execution is not changed by presentation for child sessions and later tool calls.                                  | New producer tests compare `execution.agentInvocation`, model/thinking, initial detail values, and notes before/after repeated pending/selected calls.                                             |

The startup delivery's construction inheritance, cancellation race, notification order, and late-session disposal remain covered by its existing lifecycle/factory tests in the full suite; this plan does not replace those proofs with presentation tests.
No quantitative performance or cache invariant is claimed, and no timer frequency is changed.

## TDD Order

1. **Characterize real resolved presentation inputs — `test(pi-subagents): characterize spawn presentation from resolved inputs`.**
   Accept the Tidy-First assessor's recommended preparation: migrate the selection-specific foreground/background tests away from edits to `detailBase.tags` and toward real `resolveSpawnConfig` outputs.
   Add exact ordinary/pending/selected pins, full tag ordering, parent omission, empty tags, explicit-versus-default max turns, and execution immutability using the current overlay at the existing seam.
   Strengthen real-boundary assertions for selected background and final foreground details without changing its gates.
   These are current-behavior characterization tests, not expected new-feature Reds; prove discrimination through temporary mutations, restore Green, run focused tests and `pnpm -C packages/pi-subagents run check`, then commit.
   Killing mutations by class: return `base` in the pending overlay arm (pending suppression); return `base` in the selected arm (confirmed values); remove the equal-parent omission (same-parent case); insert selected thinking before a leading mode tag (order); omit thinking `off` (off case); use `effectiveMaxTurns` for invocation tags (settings-only case); assign selected thinking into `execution.agentInvocation` at a runner call (immutability).
   Each mutation must kill its named class, not merely cause an unrelated signature/import failure.

2. **Replace formatted overlays with the bound ordinary producer — `refactor(pi-subagents): generate selected details from resolved spawn facts`.**
   Red: migrate the formatter/overlay matrix to `presentation.detailFor`, with exact initial/no-op identity, pending/selected values, captured mode/config facts, and distinct initial/snapshot parent IDs.
   Use a controlled mode-label producer returning `mirror` to assert ordinary order is retained for selected output without a literal-name special case.
   Green: add the local producer and bound method, route both runners' existing detail emissions through it, and remove the old formatter/overlay exports and their now-unused private helpers in the same commit.
   Move their direct display tests in this commit, and update the generic fixture and its exact-equality assertion when the required method is introduced.
   Keep `execution.agentInvocation` and initial presentation values derived from the initial ordinary call; no later call mutates them.
   This atomic switch is intentionally bounded to the changed presentation seam: deleting exports requires all importing production and test modules to migrate together.
   Killing mutations: pass the original model/thinking for pending (pending matrix); pass the original pair for selected (selected matrix); compare selected ID against captured initial parent instead of the method's parent argument (distinct-parent case); reread registry mode during `detailFor` (captured-facts case); replace selected tag ordering with the old expression `remaining[0] === "twin" ? ["twin", nextThinking, ...remaining.slice(1)] : [nextThinking, ...remaining]`, where `remaining` strips thinking from the produced tags (mirror-label case).
   The non-`twin` fallback is essential to that mutation: a change confined to the `twin` branch cannot kill a `mirror` test.
   Delete the `detailFor` call at each new runner site, replacing it with initial `detailBase`: streamed pending/confirmed, foreground final, and background selected assertions must fail respectively.
   Make the generic fixture method return a cloned detail object to kill its identity pin.
   Run the focused suites, full core suite, and package typecheck before commit; run typecheck immediately after the shared-interface commit as well.

3. **Centralize private pending activity — `refactor(pi-subagents): centralize pending selection activity formatting`.**
   Red: direct activity tests cover pending with active tools/response, ordinary grouped tools, response-only, and blank fallback, including omitted third argument.
   Green: add the optional pending input and guard to `describeActivity`, remove the runner/widget ternaries, and forward their existing boolean.
   Strengthen the widget projection case using the actual render callback, including pending-to-normal display, without introducing a new projection type or timer.
   Killing mutations: remove the formatter's pending guard (pending precedence); force the foreground call's pending argument to false (foreground activity); force the widget call's argument to false (widget renderer); delete `awaitingSelection` at the unchanged widget projection (record-to-widget wiring); return pending text unconditionally (ordinary/transcript defaults).
   Restore Green, run display/runner/widget/projection/transcript tests, the full core suite, and typecheck, then commit.

4. **Prove reconciliation outcomes and update the handbook — `docs(pi-subagents): record presentation reconciliation evidence`.**
   Run the control/variant trials described above on the planning and delivered implementations, recording literal patches, fixture source, expected results, commands, exit statuses, actual commit IDs, and residual adaptations in the new maintenance document.
   Ordinary/selected tag-order and mode-label trials must discriminate the old selector interpretation from the shared producer; a smaller patch alone is not acceptance.
   Also document the model-formula adaptation and its correctly repaired pre-change control; classify all invented variants as synthetic.
   Restore production sources and verify the restored diff before any final checks or commit.
   Replace all obsolete formula-transfer/pin instructions in the sync handbook, refresh the architecture's current descriptions, and mark the issue-21 heading and Mermaid node complete with a `Landed:` reference to the real implementation commit.
   Run `pnpm run check`, `pnpm run lint`, `pnpm -r run test`, the companion tests, and `pnpm exec rumdl check` on the edited Markdown; perform the repository's fresh-context pre-completion review at the end of `/tdd-plan`.
   No new behavior tests are introduced solely by this documentation step; the trial patches are diagnostic variants, not code to leave in the product.

Optional whole-file test regrouping and widget arrangement extraction were declined because they do not materially shrink this bounded change.
The implementing session executes this order without another Tidy-First assessment.

## Risks and Mitigations

- The common producer remains a fork adaptation of an upstream inline block.
  Keep it in `spawn-config.ts`, preserve one formula, and show the actual local adaptation rather than promising upstream-clean files.
- A newly added upstream display field may depend on more than model/thinking.
  Review its raw inputs and common producer placement; do not add a second selected-only string patch.
- Real resolved fixtures have different defaults from hand-built runner fixtures.
  Migrate selection cases before the production switch, retain generic defaults, and assert exact tags rather than weakening tests.
- Generated tags cannot honor arbitrary mutations of a preformatted fixture as if they were configuration.
  Production writers inspected build them in `resolveSpawnConfig`; remove that test-only mutation pattern rather than preserving an undocumented reverse-parser contract.
- The first pre-record frame and terminal no-pair fallback can still show invocation values.
  Those are retained behaviors, not newly solved bugs; changing them requires a separate operator decision.
- Central activity formatting does not eliminate the need to carry the private pending boolean or retain the branch during a future upstream rewrite.
  Keep projection/consumer mutations and the residual-contract documentation.
- Tests use real local producers and lifecycle objects with stub sessions, not a live interactive SDK host.
  State that limit explicitly and do not convert passing local tests into a universal host-compatibility claim.

## Open Questions

None block implementation.
The delivered reconciliation trials decide whether the approved design actually satisfies this issue; failed acceptance returns to [#19].
No release, parent closure, upstream fetch, or production implementation is authorized by this planning commit.

[#10]: https://github.com/Jopqior/gotgenes-pi-packages/issues/10
[#19]: https://github.com/Jopqior/gotgenes-pi-packages/issues/19
[#20]: https://github.com/Jopqior/gotgenes-pi-packages/issues/20
