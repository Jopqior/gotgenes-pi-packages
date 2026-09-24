# Selector presentation reconciliation trial

## Scope and provenance

This is an explicitly synthetic maintenance trial, not a production incident, an incoming upstream commit, or an interactive Pi-host test.
The fixed planning implementation was `fbd15ece7b0ec6091ff2259ef40f149e0131559a`; the delivered implementation was `6705f856952ab2eb3d5d9f50b07c3c4ab2e6956a` (both resolved with `git rev-parse`).
The fixed upstream reference was `edb35ee28535aac4e12431e47e440f6933911834`; its `spawn-config.ts` inline formula used `effectiveModelId && effectiveModelId !== parentModelId` and `.toLowerCase()`.
No upstream fetch was performed for this trial.

Two detached, disposable Git worktrees ran the same diagnostic fixture against real `resolveSpawnConfig`, real embedded agent configuration, `makeModel`, and the actual presentation path: old `overlaySpawnPresentation` versus delivered `detailFor`.
Only the source lines shown below were varied, one variant per arm; no provider, network, cache, or SDK session was involved.
Each deterministic arm was run once.
The three passing characterization assertions in an old arm describe its divergence, not the correctness of the old selected display.
The source was restored with `git restore` **inside the disposable worktrees**, its diff checked empty, and the worktrees removed via an exit trap; the original tracked worktree remained clean.

## Fixture and commands

The disposable file `packages/pi-subagents/test/tools/presentation-maintenance-trial.test.ts` contained exactly this fixture; it was never added to the product tree:

```typescript
import { describe, expect, it } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { resolveSpawnConfig } from "#src/tools/spawn-config";
import * as display from "#src/ui/display";
import { makeModel } from "#test/helpers/make-model";

// Diagnostic only. The runner runs this same fixture in each isolated Git worktree.
const stage = process.env.TRIAL_STAGE;
const arm = process.env.TRIAL_ARM;
if (stage !== "before" && stage !== "delivered") throw new Error(`unknown stage ${stage}`);
if (!arm || !["control", "mode", "thinking", "model-incoming", "model-repaired", "model-adapted"].includes(arm)) throw new Error(`unknown arm ${arm}`);
const parent = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
const proposed = makeModel({ provider: "openai", id: "gpt-5.5", name: "GPT-5.5" });
const selected = makeModel({ id: "claude-haiku", name: "Claude Haiku" });
const registry = new AgentTypeRegistry(() => new Map()); // Real embedded general-purpose append config.
const result = resolveSpawnConfig(
  { subagent_type: "general-purpose", prompt: "investigate", description: "diagnose", model: "openai/gpt-5.5", thinking: "high", inherit_context: true, run_in_background: true, max_turns: 9 },
  registry,
  { parentModel: parent, modelRegistry: { find: (provider, id) => provider === proposed.provider && id === proposed.id ? proposed : undefined, getAll: () => [proposed], getAvailable: () => [proposed] } },
  { defaultMaxTurns: 25 },
);
if ("error" in result) throw new Error(result.error);
const pair = { model: selected, thinkingLevel: "off" as const };
const base = result.presentation.detailBase;
function project(source: { awaitingSelection: boolean; selectedPair?: typeof pair }) {
  if (stage === "delivered") {
    if (!("detailFor" in result.presentation)) throw new Error("missing detailFor");
    return result.presentation.detailFor(source, parent.id);
  }
  const oldDisplay = display as typeof display & { overlaySpawnPresentation(base: typeof base, source: typeof source, parentId: string): typeof base };
  return oldDisplay.overlaySpawnPresentation(base, source, parent.id);
}
const pending = project({ awaitingSelection: true, selectedPair: pair });
const confirmed = project({ awaitingSelection: false, selectedPair: pair });
const label = arm === "mode" ? "mirror" : "twin";
const other = ["inherit context", "background", "max turns: 9"];
const modelVariant = arm.startsWith("model-");
const ordinaryTags = arm === "thinking" ? [label, ...other, "thinking: high"] : [label, "thinking: high", ...other];
const confirmedTags = arm === "thinking" && stage === "delivered"
  ? [label, ...other, "thinking: off"]
  : arm === "mode" && stage === "before"
    ? ["thinking: off", label, ...other]
    : [label, "thinking: off", ...other];
const expectedBase = { displayName: "Agent", description: "diagnose", subagentType: "general-purpose", modelName: modelVariant ? "GPT-5.5" : "gpt-5.5", tags: ordinaryTags };
const expectedPending = { ...expectedBase, modelName: undefined, tags: [label, ...other] };
const expectedConfirmed = { ...expectedBase, modelName: modelVariant && arm !== "model-incoming" ? "HAIKU" : "haiku", tags: confirmedTags };
describe(`${stage}/${arm} synthetic source trial`, () => {
  it("ordinary exact output", () => {
    console.log("ordinary=" + JSON.stringify(base));
    expect(base).toEqual(expectedBase);
  });
  it("pending exact output", () => {
    console.log("pending=" + JSON.stringify(pending));
    expect(pending).toEqual(expectedPending);
  });
  it("confirmed exact output", () => {
    console.log("confirmed=" + JSON.stringify(confirmed));
    expect(confirmed).toEqual(expectedConfirmed);
  });
});
```

With a clean original checkout at the delivered commit, the trial runner used these commands; `test-file` below means the exact fixture above saved under the disposable package's `test/tools/` path:

```bash
root=$(pwd -P)
trial_root=$(mktemp -d /tmp/selector-maintenance.XXXXXX)
git worktree add --detach "$trial_root/before" fbd15ece7b0ec6091ff2259ef40f149e0131559a
git worktree add --detach "$trial_root/delivered" 6705f856952ab2eb3d5d9f50b07c3c4ab2e6956a
# For each stage, point its node_modules and package/node_modules to the root checkout,
# then copy test-file to packages/pi-subagents/test/tools/presentation-maintenance-trial.test.ts.
ln -s "$root/node_modules" "$trial_root/before/node_modules"
ln -s "$root/packages/pi-subagents/node_modules" "$trial_root/before/packages/pi-subagents/node_modules"
ln -s "$root/node_modules" "$trial_root/delivered/node_modules"
ln -s "$root/packages/pi-subagents/node_modules" "$trial_root/delivered/packages/pi-subagents/node_modules"
# For each arm: restore the two source files inside its disposable stage, apply only
# that arm's patch below, then run this exact command with stage/arm substituted:
(
  cd "$trial_root/$stage/packages/pi-subagents"
  TRIAL_STAGE="$stage" TRIAL_ARM="$arm" \
    "$root/packages/pi-subagents/node_modules/.bin/vitest" run \
    test/tools/presentation-maintenance-trial.test.ts --reporter=verbose
)
# Record exit status; after all arms restore both source files and verify their diff:
git -C "$trial_root/$stage" restore -- packages/pi-subagents/src/tools/spawn-config.ts packages/pi-subagents/src/ui/display.ts
git -C "$trial_root/$stage" diff --exit-code -- packages/pi-subagents/src/tools/spawn-config.ts packages/pi-subagents/src/ui/display.ts
# The actual runner installed an EXIT trap removing each detached tree with
# git worktree remove --force, followed by rmdir "$trial_root".
```

The runner called the installed Vitest executable directly inside each isolated package rather than `pnpm -C ... exec`: on the first attempt pnpm's workspace preflight tried an install, refused the `node_modules` symlink outside the disposable tree (`ERR_PNPM_UNSAFE_MODULES_DIR`), and exited 1 before any tests ran.
This was an isolation/tooling failure, not a presentation failure; the successful run used no install and did not modify the root dependencies.
The test file, both dependency links, and patched sources existed only in the disposable trees.
The runner used `git diff --check` for every arm and verified empty source diffs after restoration; `git status --short` in the original tree was empty.

## Exact synthetic patches

The control in each stage applied no source patch.
Each block below is the literal source delta measured with `git diff`; apply it to its named stage only after restoring that stage's source files.
The `mode` delta is identical in both stages (apart from hunk location).

### Mode label — both stages, `src/ui/display.ts`

```diff
-  return config.promptMode === "append" ? "twin" : undefined;
+  return config.promptMode === "append" ? "mirror" : undefined;
```

### Thinking placement — planning stage, `src/ui/display.ts`

```diff
-  if (invocation.thinking) tags.push(thinkingTag(invocation.thinking));
   if (invocation.inheritContext) tags.push("inherit context");
   if (invocation.runInBackground) tags.push("background");
   if (invocation.maxTurns != null) tags.push(`max turns: ${invocation.maxTurns}`);
+  if (invocation.thinking) tags.push(thinkingTag(invocation.thinking));
```

### Thinking placement — delivered stage, `src/ui/display.ts`

```diff
-  if (invocation.thinking) tags.push(`thinking: ${invocation.thinking}`);
   if (invocation.inheritContext) tags.push("inherit context");
   if (invocation.runInBackground) tags.push("background");
   if (invocation.maxTurns != null) tags.push(`max turns: ${invocation.maxTurns}`);
+  if (invocation.thinking) tags.push(`thinking: ${invocation.thinking}`);
```

### Model formula — planning stage, incoming-only `src/tools/spawn-config.ts`

This is the fixed-upstream inline formula with `.toUpperCase()` substituted as the invented change, accepted **without** adapting the old helper:

```diff
-  const modelName = formatSpawnModelName(model, modelInfo.parentModel?.id);
+  const parentModelId = modelInfo.parentModel?.id;
+  const effectiveModelId = model?.id;
+  const modelName = effectiveModelId && effectiveModelId !== parentModelId
+    ? model.name.replace(/^Claude\s+/i, "").toUpperCase()
+    : undefined;
```

### Model formula — planning stage, correctly repaired `src/ui/display.ts`

Restore `src/tools/spawn-config.ts` to the helper call above and transfer the uppercase operation into the existing helper, retaining its fork-specific empty-ID guard:

```diff
   if (!model || model.id === parentId) return undefined;
-  return model.name.replace(/^Claude\s+/i, "").toLowerCase();
+  return model.name.replace(/^Claude\s+/i, "").toUpperCase();
```

### Model formula — delivered stage, adapted `src/tools/spawn-config.ts`

Restore the delivered common producer, then adapt the upstream operation into its sole helper in the same file:

```diff
   if (!model || model.id === parentId) return undefined;
-  return model.name.replace(/^Claude\s+/i, "").toLowerCase();
+  return model.name.replace(/^Claude\s+/i, "").toUpperCase();
```

## Expected and observed output

Every row below was asserted independently against the literal fixture expectations and observed in the focused verbose Vitest log.
All rows use `displayName: "Agent"`, `description: "diagnose"`, `subagentType: "general-purpose"` in every detail; the table specifies every remaining output field.
A pending `modelName` is present as `undefined` in the asserted object but is omitted by `JSON.stringify` in the printed output.
`other` below abbreviates exactly `["inherit context", "background", "max turns: 9"]` and is not a loose assertion.

| Stage/arm               | Ordinary (`modelName`; exact tags)              | Pending (`modelName`; exact tags) | Confirmed (`modelName`; exact tags)          | Exit / focused result       |
| ----------------------- | ----------------------------------------------- | --------------------------------- | -------------------------------------------- | --------------------------- |
| Before/control          | `gpt-5.5`; `[twin, thinking: high, ...other]`   | `undefined`; `[twin, ...other]`   | `haiku`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |
| Before/mode             | `gpt-5.5`; `[mirror, thinking: high, ...other]` | `undefined`; `[mirror, ...other]` | `haiku`; `[thinking: off, mirror, ...other]` | `0`; 1 file, 3 tests passed |
| Delivered/mode          | `gpt-5.5`; `[mirror, thinking: high, ...other]` | `undefined`; `[mirror, ...other]` | `haiku`; `[mirror, thinking: off, ...other]` | `0`; 1 file, 3 tests passed |
| Before/thinking         | `gpt-5.5`; `[twin, ...other, thinking: high]`   | `undefined`; `[twin, ...other]`   | `haiku`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |
| Delivered/thinking      | `gpt-5.5`; `[twin, ...other, thinking: high]`   | `undefined`; `[twin, ...other]`   | `haiku`; `[twin, ...other, thinking: off]`   | `0`; 1 file, 3 tests passed |
| Before/model-incoming   | `GPT-5.5`; `[twin, thinking: high, ...other]`   | `undefined`; `[twin, ...other]`   | `haiku`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |
| Before/model-repaired   | `GPT-5.5`; `[twin, thinking: high, ...other]`   | `undefined`; `[twin, ...other]`   | `HAIKU`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |
| Delivered/model-adapted | `GPT-5.5`; `[twin, thinking: high, ...other]`   | `undefined`; `[twin, ...other]`   | `HAIKU`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |
| Delivered/control       | `gpt-5.5`; `[twin, thinking: high, ...other]`   | `undefined`; `[twin, ...other]`   | `haiku`; `[twin, thinking: off, ...other]`   | `0`; 1 file, 3 tests passed |

Representative actual focused output (same command above with `TRIAL_STAGE=before TRIAL_ARM=mode`, then with `TRIAL_STAGE=delivered TRIAL_ARM=thinking`):

```text
ordinary={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","modelName":"gpt-5.5","tags":["mirror","thinking: high","inherit context","background","max turns: 9"]}
pending={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","tags":["mirror","inherit context","background","max turns: 9"]}
confirmed={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","modelName":"haiku","tags":["thinking: off","mirror","inherit context","background","max turns: 9"]}
 ✓ test/tools/presentation-maintenance-trial.test.ts > before/mode synthetic source trial > ordinary exact output 3ms
 ✓ test/tools/presentation-maintenance-trial.test.ts > before/mode synthetic source trial > pending exact output 0ms
 ✓ test/tools/presentation-maintenance-trial.test.ts > before/mode synthetic source trial > confirmed exact output 0ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
ordinary={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","modelName":"gpt-5.5","tags":["twin","inherit context","background","max turns: 9","thinking: high"]}
pending={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","tags":["twin","inherit context","background","max turns: 9"]}
confirmed={"displayName":"Agent","description":"diagnose","subagentType":"general-purpose","modelName":"haiku","tags":["twin","inherit context","background","max turns: 9","thinking: off"]}
 ✓ test/tools/presentation-maintenance-trial.test.ts > delivered/thinking synthetic source trial > ordinary exact output 3ms
 ✓ test/tools/presentation-maintenance-trial.test.ts > delivered/thinking synthetic source trial > pending exact output 0ms
 ✓ test/tools/presentation-maintenance-trial.test.ts > delivered/thinking synthetic source trial > confirmed exact output 0ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The measured difference is semantic: the old selector inserts confirmed thinking before `mirror` and before the reordered ordinary tag tail, while the delivered detail producer follows the same order for ordinary and selected values without reading formatted tags.
The correctly repaired old helper already keeps ordinary and selected model names together; the gain in the model trial is avoiding formula transfer from the incoming `spawn-config.ts` location into another file, not eliminating two independent old formulas.
Both old repair and delivered adaptation still require review of the incoming upstream expression: the fixed-upstream `effectiveModelId &&` truthiness guard omits an empty model ID, whereas the fork's existing `model.id === parentId` guard formats an empty ID different from its parent.
The delivered location is a locally adapted common producer, **not** a zero-edit upstream transplant.

## Remaining reconciliation and verification boundaries

- An incoming UI change must be mapped into `buildSpawnDisplay` and its captured raw context/facts in `src/tools/spawn-config.ts`, including mode labels, model identity, explicit max-turn tags, and the runner-supplied selected parent ID; review any newly introduced field instead of assuming it follows the same inputs.
- Review `buildInvocationTags` and `getPromptModeLabel` together when upstream changes ordering or labels; the selected path now calls the same producer, but the initial mode label is captured once and does not re-read agent files during a spinner update.
- Preserve the pending-first branch in `describeActivity` and forwarding of the private pending boolean by foreground and widget callers if upstream rewrites activity code; wording was shared already before this work, so an activity wording change is not counted as saved reconciliation.
- Preserve the original pre-record foreground placeholder, no-pair cancellation/failure fallback, resume's initial `detailBase`, background wait-for-selection boundary, private widget projection, and unchanged public record status/snapshot.
- The static and local Vitest runs use real producers, lifecycle fixtures, and stub sessions, not a live interactive Pi host; they do not establish universal host compatibility or a conflict-free future merge.
- The bound `detailFor` closure and single `buildSpawnDisplay` producer are new internal upkeep: changes to selected inputs must still preserve non-mutation of `execution`, details, and invocation tags.

The overall maintenance assessment remains fork [#19], not this diagnostic trial alone.

[#19]: https://github.com/Jopqior/gotgenes-pi-packages/issues/19
