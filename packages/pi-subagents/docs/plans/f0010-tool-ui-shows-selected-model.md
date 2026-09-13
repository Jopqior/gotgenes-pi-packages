---
issue: 10
issue_title: "subagent tool UI shows the call's model, not the one spawn selection chose"
---

# Show the selected model and thinking on the subagent tool card

## Release Recommendation

**Release:** ship independently

This issue is out of scope for Phase 22 (tool-door presentation, not the front-door / delivery-boundary spine), so it has no roadmap `Release:` batch tag.

## Problem Statement

When a spawn-selection provider chooses a model/thinking pair, the child session runs on that pair, but the `subagent` tool card does not.

`resolveSpawnConfig` builds `presentation.detailBase.modelName` and thinking tags from the *invocation* (the tool argument, shown only when the model differs from the parent).
`Subagent.prepareSession` then passes the selected pair to `createSubagentSession`.
The foreground runner and background spawner keep spreading the pre-selection `detailBase`.

The live widget does not show a model name.
The mismatch is the tool's custom renderer (`renderStats` reads `details.modelName` and `details.tags`).

Seen in the [#8] planning session: the parent called `tidy-first-assessor` with `model: "openai-codex/gpt-5.5"`; the chooser ran `deepseek/deepseek-flash` at thinking `high`; every child turn used that pair; the tool result `details` still had `modelName: "gpt-5.5"` and `tags: ["twin"]`.

The inverse is also wrong: a call with no `model` leaves `modelName` unset, so a selector override that differs from the parent never appears either.

## Goals

- Once spawn selection has chosen a pair, the in-progress card and the completed `subagent` tool result name the model and thinking that actually ran.
- Keep the existing display rule: `modelName` is the model's display name with a leading `Claude` plus following whitespace stripped and lowercased, and is omitted when the effective model id equals the parent's.
- During pending selection, stop claiming the call's model and thinking (activity already says `Awaiting model/thinking selection`).
- Leave the no-provider path byte-identical: overlay is a no-op when the record has no selected pair and is not awaiting selection.
- Non-breaking `fix(pi-subagents):`.
  `AgentDetails` is tool-result metadata, not the published `SubagentRecord` surface.

## Non-Goals

- Any change in `@jopqior/pi-subagents-model-selector`.
  The companion already returns the pair; the freeze is in this core.
- Adding `model` / `thinkingLevel` to public `SubagentRecord` (`docs/decisions/0005-subagent-record-admission-policy.md`: no named external consumer).
- `get_subagent_result` presentation (`GetResultDetails` has no model/thinking fields).
- The background *launch* card chrome (`renderBackground` ignores `modelName` / `tags` and prints only the agent id).
  Overlay still runs on that result's `details` so the session JSONL is honest; the TUI line does not start showing stats.
- `resumeExisting` (resume does not call the provider; its `detailBase` comes from the resume call).
- The live widget (it does not show a model name).
- Changing `resolveSpawnConfig`'s invocation presentation, except extracting the shared display-name helper.

No follow-up issue is filed.
The items above are boundaries, not promises.

## Background

Author is the operator; the issue body is the working hypothesis.
[#8] is closed and shipped; this defect was observed in that planning session, not caused by it.
No prior `f0010-` plan or retro.
No open PRs.
Newest inherited triage (`docs/triage/2026-09-02-backlog.md`) has no fork-issue-10 entry.
Phase 22 already records this issue as out of scope.

Labels include `pkg:pi-subagents-model-selector` and `pkg:pi-subagents`.
Only this package changes.

`run()` admits the record and fires `onStarted` *before* `prepareSession`.
The foreground spinner therefore has a live `recordRef` during the chooser (`awaitingSelection === true`) and after it.
Selection is a local `selected` in `prepareSession`; nothing on `Subagent` currently exposes it.
`execution.model` / `execution.thinkingLevel` stay the pre-selection inputs.

`createResolvedSpawnConfig` puts `modelName` only on `presentation.detailBase` and leaves `execution.model` `undefined`.
`STUB_SNAPSHOT.model` is `undefined`.
Runner tests that exercise "selected id equals parent → omit `modelName`" must pass an explicit parent model on the snapshot.

Design principle 8 (no post-construction writes from *external* code): fixtures seed `selectedPair` through `SubagentInit`, not by poking a private field after `new`.
`prepareSession` stamps via an instance method (the object mutating itself, like `markAwaitingSelection`).

The pair stays off `SubagentState` so that module remains free of model types.

## Design Overview

### Decision model

Presentation of model and thinking is a render-time projection of the pair that will run / did run, not a snapshot frozen at `resolveSpawnConfig`.

`resolveSpawnConfig` still builds the *invocation* presentation (correct for the no-provider path, and the fallback before a pair exists).
After a successful selection, the record carries that pair.
The runners overlay `detailBase` whenever they emit `AgentDetails`.

### Selected pair on the record

```typescript
// on SubagentInit (optional; tests seed a born-complete fixture)
selectedPair?: { model: Model<any>; thinkingLevel: ThinkingLevel };

// on Subagent — field and getter cannot share a name
private _selectedPair: { model: Model<any>; thinkingLevel: ThinkingLevel } | undefined;
get selectedPair(): { model: Model<any>; thinkingLevel: ThinkingLevel } | undefined;
private applySelectedPair(pair: { model: Model<any>; thinkingLevel: ThinkingLevel }): void;
```

`prepareSession` calls `applySelectedPair(selected)` inside the `if (gate)` try, after `obtainSelection` resolves and *before* the `finally` that clears `awaitingSelection`, so there is no overlay window where the chooser has finished but the pair is not yet readable.

No stamp on the no-provider path, on cancellation, or on a failed validation (those throw before the assignment).

Getters do **not** fall back to `execution.model`.
Absence means "selection has not chosen a pair", which is the no-provider case and the pre-chooser case.

### Overlay

Pure helper in `src/ui/display.ts` (SDK-free; structural `{ id, name }`):

```typescript
export type SpawnPresentationSource = {
  awaitingSelection: boolean;
  selectedPair?: {
    model: { id: string; name: string };
    thinkingLevel: ThinkingLevel;
  };
};

export function overlaySpawnPresentation(
  base: Pick<AgentDetails, "displayName" | "description" | "subagentType" | "modelName" | "tags">,
  source: SpawnPresentationSource | undefined,
  parentId: string | undefined,
): typeof base;
```

| `source`                  | Result                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `undefined`               | `base` unchanged (first spinner frames before `onStarted`)                                                                                                                                                                                         |
| `awaitingSelection: true` | `modelName: undefined`; strip `thinking: *` tags; keep twin / inherit / background / max-turns; `tags` becomes `undefined` when the remainder is empty                                                                                             |
| `selectedPair` present    | replace `modelName` with `formatSpawnModelName(pair.model, parentId)` (including `undefined` when the selected id equals the parent — the call's modelName must not linger); replace the thinking tag from the selected level, **including `off`** |
| otherwise                 | `base` unchanged (no-provider)                                                                                                                                                                                                                     |

Thinking-tag insert position after a strip: immediately after a leading `"twin"` entry if the remaining tags start with `"twin"`, otherwise at the front of the remaining tags.
That matches `resolveSpawnConfig`'s `[modeLabel, ...invocationTags]` order, where thinking is the first invocation tag.

A `thinkingTag(level)` / `isThinkingTag(tag)` helper in the same file owns the `` `thinking: ${level}` `` literal so `buildInvocationTags` and the overlay cannot drift.

### Shared display-name helper

Extract the untested inline rule at `spawn-config.ts` (the `model.name.replace(/^Claude\s+/i, "").toLowerCase()` ternary) to:

```typescript
export function formatSpawnModelName(
  model: { id: string; name: string } | undefined,
  parentId: string | undefined,
): string | undefined;
```

Returns `undefined` when `model` is missing or `model.id === parentId`; otherwise the stripped, lowercased `model.name`.
`resolveSpawnConfig` becomes a one-line call.
The overlay uses the same helper.

### Runner call sites

```typescript
const detailBase = overlaySpawnPresentation(
  presentation.detailBase,
  recordRef, // or `record` after spawnAndWait / getRecord
  params.snapshot.model?.id,
);
```

`Subagent` structurally satisfies `SpawnPresentationSource` once it exposes `awaitingSelection` (already) and `selectedPair`.

Three emit sites, all already holding the snapshot:

1. `runForeground` `streamUpdate` — live card.
2. `runForeground` completed `buildDetails(...)` — completed / failed result.
3. `spawnBackground` launch `details` literal.

`buildDetails` itself stays dumb.
`resumeExisting` is not a site.

### Design-review notes

- No new field on a shared options bag.
  Overlay takes a three-field source plus `parentId` the runners already have.
- No output-argument into `execution`.
  The selected pair is a later lifecycle fact on `Subagent`, not a write-back of the spawn-time inputs.
- Lifecycle does not import display types.
  A `Subagent.overlayPresentation(...)` method would invert that.
- `SubagentRecord` is not widened.

## Module-Level Changes

| File                                     | Change                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/ui/display.ts`                      | Add `formatSpawnModelName`, `overlaySpawnPresentation`, `SpawnPresentationSource`; `thinkingTag` / `isThinkingTag`; `buildInvocationTags` uses `thinkingTag`.                                                            |
| `test/display.test.ts`                   | Characterization of `formatSpawnModelName` (4 cases) and overlay (pending strip, selected replace including parent-id omit and `off`, no-op when no pair, insert-after-twin, first-frame undefined source).              |
| `src/tools/spawn-config.ts`              | Replace the inline Claude-strip ternary with `formatSpawnModelName`. No other behavior change.                                                                                                                           |
| `test/tools/spawn-config.test.ts`        | Predicted unchanged. The same-as-parent pin stays green.                                                                                                                                                                 |
| `test/helpers/make-spawn-config.ts`      | Optional `tags?: string[]` sets `presentation.detailBase.tags` (and `agentTags` when provided). Default remains `tags: undefined` / `agentTags: []`.                                                                     |
| `test/helpers/make-spawn-config.test.ts` | Pin the new option; default-shape `toEqual` stays as it is.                                                                                                                                                              |
| `src/lifecycle/subagent.ts`              | Optional `selectedPair` on `SubagentInit`; private field + getter; `applySelectedPair`; stamp in `prepareSession` after successful `obtainSelection`.                                                                    |
| `test/lifecycle/subagent.test.ts`        | Sibling of "overrides an explicitly resolved model with the selected pair": after the gate resolves, `agent.selectedPair` equals the chosen pair. Cancellation leaves it `undefined`. No-provider leaves it `undefined`. |
| `test/helpers/make-subagent.ts`          | Optional `selectedPair` on `TestSubagentOptions`, passed through `SubagentInit`.                                                                                                                                         |
| `test/helpers/make-subagent.test.ts`     | Pin the seed.                                                                                                                                                                                                            |
| `src/tools/foreground-runner.ts`         | Overlay in `streamUpdate` and at the completed `buildDetails` call.                                                                                                                                                      |
| `test/tools/foreground-runner.test.ts`   | Pending strip of call `modelName` / thinking tag on streamed details; completed details name the selected pair; selected-equals-parent omits `modelName`.                                                                |
| `src/tools/background-spawner.ts`        | Overlay the launch `details` literal.                                                                                                                                                                                    |
| `test/tools/background-spawner.test.ts`  | Pending-selection case also asserts stripped `details.modelName` / thinking tags.                                                                                                                                        |
| `docs/architecture/architecture.md`      | Module-tree current-behavior lines for `subagent.ts`, `display.ts`, `foreground-runner.ts`, `background-spawner.ts`. No `✅` step-mark (not a roadmap step).                                                             |
| `README.md`                              | One sentence under "Per-spawn model and thinking selection": the `subagent` tool card names the selected pair.                                                                                                           |

Predicted unchanged (claim: overlay is not wired here; `AgentDetails` shape is unchanged):

- `src/tools/helpers.ts` (`buildDetails` still spreads `base`).
- `src/tools/agent-tool.ts` (`resumeExisting` still uses the resume call's `detailBase`).
- `src/tools/result-renderer.ts` (already prints whatever `details.modelName` / `tags` it is given).
- `src/tools/get-result-*.ts`.
- `src/service/service.ts` / `service-adapter.ts` (`SubagentRecord` allowlist).
- `src/ui/agent-widget.ts` / `widget-renderer.ts`.
- `.pi/skills/package-pi-subagents/SKILL.md` (describes pending-selection activity, not tool-card modelName).
- `packages/pi-subagents-model-selector/**`.

## Test Impact Analysis

1. **New tests the overlay enables.**
   Unit tests of `overlaySpawnPresentation` over the input domain (no record, pending, selected ≠ parent, selected = parent, selected thinking `off`, twin-leading tags, inherit-only tags, empty remainder).
   Lifecycle test that the record exposes the pair the factory already receives.
   Runner tests that the *emitted* `details` follow the overlay, which was previously impossible because the pair was a local in `prepareSession`.
2. **Existing tests that stay.**
   `resolveSpawnConfig` presentation pins (invocation pair).
   `renderStats` pins (it already renders whatever `details` carry).
   Pending-selection *activity* pin in `foreground-runner.test.ts`.
   Factory-override pins in `subagent.test.ts` (the selected pair still reaches `createSubagentSession`).
3. **Nothing becomes redundant.**
   The factory-override tests pin a different seam (session creation).
   The overlay tests pin the tool card.

## Invariants at risk

- **No-provider presentation is unchanged.**
  Constituency: every spawn without a selection provider, including CI and operators who do not load the companion.
  Pin: overlay's "otherwise → `base`" case, plus existing `spawn-config.test.ts` presentation pins.
  A mutation that overlays from `execution.model` on a fixture whose `detailBase.modelName` was set only on the config would fail the runner tests that currently rely on `createResolvedSpawnConfig`'s `execution.model: undefined`.
- **Pending-selection activity still projects.**
  Constituency: the in-progress card during the chooser.
  Pin: `test/tools/foreground-runner.test.ts` — "projects pending selection into streaming activity before the session exists".
  Overlay must not replace that activity string.
- **Selected pair still reaches the factory.**
  Constituency: the child session.
  Pin: `test/lifecycle/subagent.test.ts` — "overrides an explicitly resolved model with the selected pair".
  Stamping on the record is additive; do not change the `selected?.model ?? this.execution.model` factory argument.
- **`SubagentRecord` still withholds pending selection and does not gain the pair.**
  Constituency: public snapshot consumers (ADR 0005).
  Pin: `test/service/service-adapter.test.ts` — `awaitingSelection` populated on the source and absent from the snapshot.
  Add no new assertion that would fail if we accidentally copied `selectedPair` into `toSubagentRecord` unless that test is part of this change — it is not; the existing declined-field test is the backstop if the pair is ever placed on state that the adapter copies.
- **`isBackground` remains first-class record state** (Phase 22 Step 1).
  Overlay does not read `invocation` or reconstruct background-ness.
  Pin: existing manager/widget tests; not re-derived here.

## TDD Order

1. **`refactor(pi-subagents): extract formatSpawnModelName from resolveSpawnConfig`** Characterization tests in `test/display.test.ts`: different model strips a leading `Claude` and lowercases; `model.id === parentId` → `undefined`; `model` undefined → `undefined`; a non-`Claude` name passes through lowercased.
   Then move the ternary out of `resolveSpawnConfig`.
   Friction this prepares: the overlay would otherwise duplicate an untested display rule (only the same-as-parent case is pinned today).
   Killing mutation: make `formatSpawnModelName` return `model.name` with no strip/lowercase — the new Claude-strip test goes red; the same-as-parent `spawn-config` pin stays green.

2. **`test(pi-subagents): add a tags option to createResolvedSpawnConfig`** Optional `tags?: string[]` sets `presentation.detailBase.tags` and `presentation.agentTags`.
   Default shape `toEqual` in `make-spawn-config.test.ts` stays `tags: undefined` / `agentTags: []`.
   One new pin that `tags: ["thinking: high", "twin"]` lands on `detailBase.tags`.
   Friction this prepares: pending-selection runner tests need a call-time thinking tag to prove it is stripped; the fixture currently hard-codes `tags: undefined`.
   Killing mutation: ignore the `tags` option (always `undefined`) — the new pin goes red; the default-shape test stays green.

3. **`test:` then `feat(pi-subagents): overlay spawn presentation from the selected pair`** Red: overlay tests in `test/display.test.ts` (the table in Design Overview, including insert-after-twin and `thinking: off`).
   Switch `buildInvocationTags` to `thinkingTag` in the same green.
   Killing mutations (one per class):
   - pending path does not clear `modelName` — pending-strip test red.
   - selected path keeps `base.modelName` when `formatSpawnModelName` returns `undefined` — selected-equals-parent test red.
   - thinking tag inserted at the front even when tags start with `"twin"` — insert-after-twin test red.
   - `off` is treated as "no thinking" (`if (thinkingLevel)` missing `off` is truthy, so the mutation is `if (thinkingLevel && thinkingLevel !== "off")`) — `off` test red.

4. **`feat(pi-subagents): stamp the selected pair on the subagent record`** Optional `selectedPair` on `SubagentInit`; getter; private `applySelectedPair`.
   `prepareSession` stamps inside the gate try after `obtainSelection` succeeds.
   `createTestSubagent` passes the option through init.
   Tests: gated run exposes the chosen pair; cancellation / no-provider leave it `undefined`; factory seed round-trips.
   Killing mutations:
   - delete the `applySelectedPair` call in `prepareSession` — gated exposure test red; factory-override test stays green (factory args are a different line).
   - ignore `SubagentInit.selectedPair` — factory-seed test red.

5. **`feat(pi-subagents): show the selected model on the foreground tool card`** `streamUpdate` and the completed `buildDetails` call overlay with `recordRef` / `record` and `params.snapshot.model?.id`.
   Tests beside the existing pending-activity pin: pending streamed `details.modelName` is unset and thinking tags are gone; after a seeded `selectedPair`, completed `details` name that model and `thinking: <level>`; selected id equal to `snapshot.model.id` omits `modelName` even when `detailBase.modelName` was the call's model.
   Killing mutations:
   - delete the overlay at `streamUpdate` — pending-strip streaming test red; completed test stays green.
   - delete the overlay at `buildDetails` — completed selected-pair test red; streaming test stays green.

6. **`feat(pi-subagents): overlay selected-pair details on background launch`** Same overlay on the launch `details` literal.
   Extend the existing pending-selection background test to assert `details.modelName` is unset and thinking tags are gone.
   Killing mutation: delete the overlay at the new site — that assertion goes red; the "submitted" / "Awaiting model/thinking selection" text pins stay green.

7. **`docs(pi-subagents): note that the tool card names the selected pair`** Architecture module-tree current-behavior lines and the README spawn-selection paragraph.
   No roadmap `✅` (not a phase step).

## Risks and Mitigations

- **First spinner frame still shows the call's pair.**
  `streamUpdate()` runs once before `spawnAndWait`, so `recordRef` is undefined and overlay returns `base`.
  Accepted residual: one ~80 ms frame, then `onStarted` plus pending strip or the stamped pair.
  Not the reported freeze (the freeze lasts the whole run).
- **`createResolvedSpawnConfig` fixtures have `execution.model: undefined`.**
  Overlay must not treat "record exists, no `selectedPair`" as "clear `modelName`".
  The "otherwise → `base`" arm is the mitigation; step 5's tests use that fixture on purpose.
- **Background launch returns before selection.**
  Overlay can strip while pending but cannot name a pair that does not exist yet.
  `renderBackground` does not show those fields anyway.
  Non-Goal, not a follow-up.
- **Cancelled selection.**
  No stamp, overlay returns `base`, the card may still name the call's model on a `stopped` result.
  Accepted residual; cancellation is not the reported defect.
- **Thinking tag string matching.**
  Overlay strips tags that `isThinkingTag` recognizes, not a structured list.
  `thinkingTag` is the single producer; rejected a keyed-tag reshape as scope creep.

## Open Questions

None.
The issue's expected behavior is the spec; the companion is unchanged; ADR 0005 declines a public-snapshot widening.

[#8]: https://github.com/Jopqior/gotgenes-pi-packages/issues/8
