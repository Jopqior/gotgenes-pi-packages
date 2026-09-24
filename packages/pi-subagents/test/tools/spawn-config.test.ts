import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { resolveSpawnConfig } from "#src/tools/spawn-config";
import type { AgentConfig } from "#src/types";

const { modeLabelOverride } = vi.hoisted(() => ({ modeLabelOverride: vi.fn<() => string | undefined>() }));
vi.mock("#src/ui/display", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/ui/display")>();
  return { ...actual, getPromptModeLabel: (...args: Parameters<typeof actual.getPromptModeLabel>) =>
    modeLabelOverride.getMockImplementation()?.() ?? actual.getPromptModeLabel(...args) };
});
beforeEach(() => modeLabelOverride.mockReset());

import { makeModel } from "#test/helpers/make-model";

/** Minimal registry with default agents only. */
const testRegistry = new AgentTypeRegistry(() => new Map());

/** Shorthand for building ModelInfo. */
function makeModelInfo(overrides: Partial<Parameters<typeof resolveSpawnConfig>[2]> = {}) {
  return {
    parentModel: makeModel({ id: "claude-sonnet", name: "Claude Sonnet" }),
    modelRegistry: { find: () => undefined, getAll: () => [], getAvailable: () => [] },
    ...overrides,
  };
}

const defaultSettings = { defaultMaxTurns: undefined as number | undefined };

describe("resolveSpawnConfig — type resolution", () => {
  it("resolves a known agent type", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    expect("error" in result && result.error).toBeFalsy();
    if ("error" in result) return;
    expect(result.identity.subagentType).toBe("general-purpose");
    expect(result.identity.fellBack).toBe(false);
  });

  it("falls back to general-purpose for unknown agent type", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "unknown-type", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    expect("error" in result && result.error).toBeFalsy();
    if ("error" in result) return;
    expect(result.identity.subagentType).toBe("general-purpose");
    expect(result.identity.fellBack).toBe(true);
  });

  it("sets displayName from registry", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.identity.displayName).toBe("Explore");
  });

  it("uses displayName from agent config when available", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    // general-purpose config has displayName: "Agent"
    expect(result.identity.displayName).toBe("Agent");
  });
});

describe("resolveSpawnConfig — model resolution", () => {
  it("inherits parent model when no model specified", () => {
    const parentModel = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo({ parentModel }),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.model).toBe(parentModel);
    // modelName is undefined when same as parent
    expect(result.presentation.modelName).toBeUndefined();
  });

  it("returns error when user-specified model cannot be resolved", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d", model: "nonexistent-xyz" },
      testRegistry,
      makeModelInfo({ modelRegistry: { find: () => undefined, getAll: () => [], getAvailable: () => [] } }),
      defaultSettings,
    );
    expect("error" in result && result.error).toBeTruthy();
  });
});

describe("resolveSpawnConfig — max turns normalization", () => {
  it("normalizes max_turns from params", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d", max_turns: 10 },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.effectiveMaxTurns).toBe(10);
  });

  it("uses settings defaultMaxTurns when no max_turns in params", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      { defaultMaxTurns: 25 },
    );
    if ("error" in result) return;
    expect(result.execution.effectiveMaxTurns).toBe(25);
  });

  it("returns undefined effectiveMaxTurns when neither params nor settings specify", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.effectiveMaxTurns).toBeUndefined();
  });
});

describe("resolveSpawnConfig — invocation fields", () => {
  it("sets runInBackground from params", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d", run_in_background: true },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.runInBackground).toBe(true);
  });

  it("builds agentInvocation snapshot", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d", thinking: "high" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.agentInvocation).toEqual({
      modelName: undefined,
      thinking: "high",
      maxTurns: undefined,
      inheritContext: false,
      runInBackground: false,
    });
  });
});

describe("resolveSpawnConfig — detailBase and tags", () => {
  it("builds detailBase with description from params", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "my task" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.presentation.detailBase.description).toBe("my task");
    expect(result.presentation.detailBase.subagentType).toBe("general-purpose");
    expect(result.presentation.detailBase.displayName).toBe("Agent");
  });

  it("includes thinking tag when thinking is set", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d", thinking: "high" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.presentation.agentTags).toContain("thinking: high");
  });

  it("omits mode label for replace-mode agents", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    // Explore has promptMode: "replace" → no mode label, no invocation overrides
    expect(result.presentation.agentTags).toEqual([]);
  });

  it("includes twin tag for append-mode agents like general-purpose", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    // general-purpose has promptMode: "append" → gets "twin" label
    expect(result.presentation.agentTags).toContain("twin");
  });

  it("sets tags to undefined on detailBase for replace-mode agents with no invocation overrides", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    // Explore has promptMode: "replace" and no invocation overrides → no tags
    expect(result.presentation.detailBase.tags).toBeUndefined();
  });
});

describe("resolveSpawnConfig — thinking level", () => {
  it("returns an error naming the valid levels for an unrecognized thinking param", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d", thinking: "turbo" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    expect(result).toEqual({
      error:
        'Invalid thinking level "turbo". Valid levels: off, minimal, low, medium, high, xhigh, max.',
    });
  });

  it("resolves a recognized thinking param", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d", thinking: "xhigh" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.execution.thinking).toBe("xhigh");
  });
});

describe("resolveSpawnConfig — notes", () => {
  it("carries no note for a known agent type", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.notes).toEqual([]);
  });

  it("carries a lock note naming the discarded parameters", () => {
    const lockedRegistry = new AgentTypeRegistry(
      () =>
        new Map([
          [
            "pinned",
            {
              name: "pinned",
              description: "Pinned",
              systemPrompt: "",
              promptMode: "append" as const,
              model: "provider/pinned",
              maxTurns: 7,
              locked: true as const,
            },
          ],
        ]),
    );
    const result = resolveSpawnConfig(
      {
        subagent_type: "pinned",
        prompt: "test",
        description: "d",
        model: "other",
        max_turns: 3,
      },
      lockedRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.notes).toEqual([
      'Note: agent "pinned" locks model, max_turns, so those parameters were ignored.',
    ]);
  });

  it("names a single discarded parameter in the singular", () => {
    const lockedRegistry = new AgentTypeRegistry(
      () =>
        new Map([
          [
            "pinned",
            {
              name: "pinned",
              description: "Pinned",
              systemPrompt: "",
              promptMode: "append" as const,
              model: "provider/pinned",
              locked: ["model"] as const,
            },
          ],
        ]),
    );
    const result = resolveSpawnConfig(
      { subagent_type: "pinned", prompt: "test", description: "d", model: "other" },
      lockedRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.notes).toEqual([
      'Note: agent "pinned" locks model, so the model parameter was ignored.',
    ]);
  });

  it("carries the unknown-type note when the type fell back", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "unknown-type", prompt: "test", description: "d" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.notes).toEqual([
      'Note: Unknown agent type "unknown-type" — using general-purpose.',
    ]);
  });

  it("reports the fallback before the lock when a project pins the fallback agent", () => {
    const pinnedFallback = new AgentTypeRegistry(
      () =>
        new Map([
          [
            "general-purpose",
            {
              name: "general-purpose",
              description: "Pinned general-purpose",
              systemPrompt: "",
              promptMode: "append" as const,
              maxTurns: 7,
              locked: true as const,
            },
          ],
        ]),
    );
    const result = resolveSpawnConfig(
      { subagent_type: "unknown-type", prompt: "test", description: "d", max_turns: 3 },
      pinnedFallback,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.notes).toEqual([
      'Note: Unknown agent type "unknown-type" — using general-purpose.',
      'Note: agent "general-purpose" locks max_turns, so the max_turns parameter was ignored.',
    ]);
  });
});

describe("resolveSpawnConfig — prompt and rawType passthrough", () => {
  it("passes through prompt and rawType", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "search for bugs", description: "bug search" },
      testRegistry,
      makeModelInfo(),
      defaultSettings,
    );
    if ("error" in result) return;
    expect(result.execution.prompt).toBe("search for bugs");
    expect(result.identity.rawType).toBe("Explore");
  });
});

describe("resolved spawn presentation from one ordinary producer", () => {
  const parent = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
  const proposed = makeModel({ id: "gpt-5.5", name: "GPT-5.5", provider: "openai" });
  const selected = makeModel({ id: "claude-haiku", name: "Claude Haiku" });
  const modelInfo = makeModelInfo({
    parentModel: parent,
    modelRegistry: {
      find: (provider, id) => [parent, proposed, selected].find((model) => model.provider === provider && model.id === id),
      getAll: () => [parent, proposed, selected],
      getAvailable: () => [parent, proposed, selected],
    },
  });

  it("pins ordinary, absent, pending, and selected complete details without changing execution", () => {
    const result = resolveSpawnConfig(
      {
        subagent_type: "general-purpose", prompt: "investigate", description: "diagnose",
        model: "openai/gpt-5.5", thinking: "high", inherit_context: true,
        run_in_background: true, max_turns: 9,
      },
      testRegistry, modelInfo, { defaultMaxTurns: 25 },
    );
    if ("error" in result) throw new Error(result.error);
    const base = {
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose",
      modelName: "gpt-5.5", tags: ["twin", "thinking: high", "inherit context", "background", "max turns: 9"],
    };
    expect(result.presentation.detailBase).toEqual(base);
    expect(result.presentation.agentTags).toEqual(base.tags);
    expect(result.execution.agentInvocation).toEqual({
      modelName: "gpt-5.5", thinking: "high", maxTurns: 9,
      inheritContext: true, runInBackground: true,
    });
    expect(result.presentation.detailFor(undefined, parent.id)).toBe(result.presentation.detailBase);
    expect(result.presentation.detailFor({ awaitingSelection: false }, parent.id)).toBe(result.presentation.detailBase);
    const pair = { model: selected, thinkingLevel: "off" as const };
    expect(result.presentation.detailFor({ awaitingSelection: true, selectedPair: pair }, parent.id)).toEqual({
      ...base, modelName: undefined, tags: ["twin", "inherit context", "background", "max turns: 9"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: false, selectedPair: pair }, parent.id)).toEqual({
      ...base, modelName: "haiku", tags: ["twin", "thinking: off", "inherit context", "background", "max turns: 9"],
    });
    expect(result.execution.model).toBe(proposed);
    expect(result.execution.thinking).toBe("high");
    expect(result.execution.agentInvocation).toEqual({
      modelName: "gpt-5.5", thinking: "high", maxTurns: 9,
      inheritContext: true, runInBackground: true,
    });
    expect(result.presentation.detailBase).toEqual(base);
    expect(result.notes).toEqual([]);
  });

  it("omits selected model name for the supplied parent id, not the initial proposal", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "investigate", description: "diagnose", model: "openai/gpt-5.5" },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailBase.modelName).toBe("gpt-5.5");
    expect(result.presentation.detailFor({
      awaitingSelection: false, selectedPair: { model: parent, thinkingLevel: "medium" },
    }, parent.id)).toEqual({
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose",
      modelName: undefined, tags: ["twin", "thinking: medium"],
    });
  });

  it("retains empty replace-mode tags while pending, then introduces selected thinking", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "investigate", description: "scan" },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailBase).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore", modelName: undefined, tags: undefined,
    });
    expect(result.presentation.detailFor({ awaitingSelection: true }, parent.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore", modelName: undefined, tags: undefined,
    });
    expect(result.presentation.detailFor({
      awaitingSelection: false, selectedPair: { model: selected, thinkingLevel: "off" },
    }, parent.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore", modelName: "haiku", tags: ["thinking: off"],
    });
  });

  it("formats an empty selected model id when it differs from the parent", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "investigate", description: "scan" },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailFor({
      awaitingSelection: false,
      selectedPair: { model: makeModel({ id: "", name: "Claude Zero" }), thinkingLevel: "off" },
    }, parent.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore", modelName: "zero", tags: ["thinking: off"],
    });
  });

  it("compares selected model against the runner parent even when initial parent differed", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "investigate", description: "scan" },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailBase.modelName).toBeUndefined();
    expect(result.presentation.detailFor({ awaitingSelection: false,
      selectedPair: { model: selected, thinkingLevel: "medium" },
    }, selected.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore",
      modelName: undefined, tags: ["thinking: medium"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: false,
      selectedPair: { model: parent, thinkingLevel: "off" },
    }, selected.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore",
      modelName: "sonnet", tags: ["thinking: off"],
    });
  });

  it("captures resolved identity, mode, and invocation facts before registry reload", () => {
    const configs = new Map<string, AgentConfig>([["custom", {
      name: "custom", description: "custom", systemPrompt: "", promptMode: "append" as const,
      displayName: "Original Agent",
    }]]);
    const registry = new AgentTypeRegistry(() => configs);
    const result = resolveSpawnConfig(
      { subagent_type: "custom", prompt: "investigate", description: "original task", thinking: "high", inherit_context: true },
      registry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    configs.set("custom", { name: "custom", description: "custom", systemPrompt: "", promptMode: "replace", displayName: "Changed Agent" });
    registry.reload();
    const pair = { model: selected, thinkingLevel: "off" as const };
    expect(result.presentation.detailFor({ awaitingSelection: false, selectedPair: pair }, parent.id)).toEqual({
      displayName: "Original Agent", description: "original task", subagentType: "custom",
      modelName: "haiku", tags: ["twin", "thinking: off", "inherit context"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: true, selectedPair: pair }, parent.id)).toEqual({
      displayName: "Original Agent", description: "original task", subagentType: "custom",
      modelName: undefined, tags: ["twin", "inherit context"],
    });
    expect(result.presentation.detailBase).toEqual({
      displayName: "Original Agent", description: "original task", subagentType: "custom",
      modelName: undefined, tags: ["twin", "thinking: high", "inherit context"],
    });
  });

  it("retains a controlled non-twin mode label in ordinary and selected tag order", () => {
    modeLabelOverride.mockReturnValue("mirror");
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "investigate", description: "diagnose", thinking: "high", inherit_context: true },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailBase).toEqual({
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose",
      modelName: undefined, tags: ["mirror", "thinking: high", "inherit context"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: true }, parent.id)).toEqual({
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose",
      modelName: undefined, tags: ["mirror", "inherit context"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: false,
      selectedPair: { model: selected, thinkingLevel: "off" },
    }, parent.id)).toEqual({
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose",
      modelName: "haiku", tags: ["mirror", "thinking: off", "inherit context"],
    });
  });

  it("pins absent model and same-parent and non-Claude model names through the producer", () => {
    const noModel = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "investigate", description: "scan" },
      testRegistry, makeModelInfo({ parentModel: undefined }), defaultSettings,
    );
    if ("error" in noModel) throw new Error(noModel.error);
    expect(noModel.presentation.detailBase).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore", modelName: undefined, tags: undefined,
    });
    const result = resolveSpawnConfig(
      { subagent_type: "Explore", prompt: "investigate", description: "scan" },
      testRegistry, modelInfo, defaultSettings,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.presentation.detailFor({ awaitingSelection: false,
      selectedPair: { model: proposed, thinkingLevel: "high" },
    }, parent.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore",
      modelName: "gpt-5.5", tags: ["thinking: high"],
    });
    expect(result.presentation.detailFor({ awaitingSelection: false,
      selectedPair: { model: makeModel({ id: "claude-opus-4-6", name: "Claude Opus 4.6" }), thinkingLevel: "high" },
    }, parent.id)).toEqual({
      displayName: "Explore", description: "scan", subagentType: "Explore",
      modelName: "opus 4.6", tags: ["thinking: high"],
    });
  });

  it("keeps a settings-only max-turn limit out of invocation tags", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", prompt: "investigate", description: "diagnose" },
      testRegistry, modelInfo, { defaultMaxTurns: 25 },
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.execution.effectiveMaxTurns).toBe(25);
    expect(result.execution.agentInvocation.maxTurns).toBeUndefined();
    expect(result.presentation.detailBase).toEqual({
      displayName: "Agent", description: "diagnose", subagentType: "general-purpose", modelName: undefined, tags: ["twin"],
    });
  });
});
