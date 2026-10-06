import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { ConcurrencyLimiter } from "#src/lifecycle/concurrency-limiter";
import { SpawnSelectionScope } from "#src/lifecycle/spawn-selection";
import { SubagentManager } from "#src/lifecycle/subagent-manager";
import type { TurnLoopResult } from "#src/lifecycle/subagent-session";
import type { TurnBudget } from "#src/lifecycle/turn-limits";
import { AgentTool } from "#src/tools/agent-tool";
import { GetResultTool } from "#src/tools/get-result-tool";
import { buildDetails } from "#src/tools/helpers";
import { resolveSpawnConfig } from "#src/tools/spawn-config";
import { AgentWidget } from "#src/ui/agent-widget";
import { makeModel } from "#test/helpers/make-model";
import { createTestSubagent, makeStubExecution } from "#test/helpers/make-subagent";
import { createMockSession, createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";
import { STUB_CTX } from "#test/helpers/stub-ctx";
import { turnLoopResult } from "#test/helpers/turn-loop-result";

const proposal = makeModel({ provider: "proposal", id: "proposed", name: "Proposed" });
const selected = makeModel({ provider: "selected", id: "chosen", name: "Chosen" });
const live = makeModel({ provider: "live", id: "switched", name: "Switched" });
const registry = new AgentTypeRegistry(() => new Map());

function config() {
  const result = resolveSpawnConfig(
    { subagent_type: "general-purpose", description: "task", prompt: "work", thinking: "low", max_turns: 7, inherit_context: true },
    registry,
    { parentModel: proposal, modelRegistry: undefined },
    { defaultMaxTurns: undefined },
  );
  if ("error" in result) throw new Error(result.error);
  return result;
}

function record(awaitingSelection = false) {
  return createTestSubagent({
    awaitingSelection,
    selectedPair: { model: selected, thinkingLevel: "high" },
    execution: makeStubExecution({ model: proposal, thinkingLevel: "low" }),
  });
}

function observedDetails(agent: ReturnType<typeof record>) {
  return config().presentation.detailFor(agent);
}

const managers: SubagentManager[] = [];
afterEach(async () => {
  for (const manager of managers.splice(0)) await manager.dispose();
});

describe("selection and observed model precedence", () => {
  it("exposes the confirmed pair while session creation is held", () => {
    const agent = record();
    expect(agent.model).toBe(selected);
    expect(agent.thinkingLevel).toBe("high");
    expect(observedDetails(agent)).toEqual({
      displayName: "Agent", description: "task", subagentType: "general-purpose",
      modelName: "selected/chosen", tags: ["twin", "thinking: high", "inherit context", "max turns: 7"],
    });
  });

  it("observes a live model switch instead of the confirmed pair", () => {
    const agent = record();
    const session = createMockSession({ model: selected, thinkingLevel: "high" });
    agent.subagentSession = toSubagentSession(createSubagentSessionStub(session));
    session.model = live;
    session.thinkingLevel = "max";
    expect(agent.model).toBe(live);
    expect(agent.thinkingLevel).toBe("max");
    expect(observedDetails(agent).modelName).toBe("live/switched");
    expect(observedDetails(agent).tags).toEqual(["twin", "thinking: max", "inherit context", "max turns: 7"]);
  });

  it("retains the released live pair instead of reverting to selection or proposal", async () => {
    const agent = record();
    agent.subagentSession = toSubagentSession(createSubagentSessionStub(createMockSession({ model: live, thinkingLevel: "max" })));
    await agent.releaseSession();
    expect(agent.model).toBe(live);
    expect(agent.thinkingLevel).toBe("max");
    expect(observedDetails(agent).modelName).toBe("live/switched");
    expect(observedDetails(agent).tags).toEqual(["twin", "thinking: max", "inherit context", "max turns: 7"]);
  });

  it("composes the minimum-turn advisory with pending and confirmed selection presentation", () => {
    const result = resolveSpawnConfig(
      { subagent_type: "general-purpose", description: "task", prompt: "work", max_turns: 1, model: "proposal/proposed", thinking: "low" },
      registry,
      { parentModel: proposal, modelRegistry: { find: () => proposal, getAll: () => [proposal], getAvailable: () => [proposal] } },
      { defaultMaxTurns: undefined },
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.notes).toEqual(["Note: max_turns 1 is below the minimum of 2 (one turn to work, one to answer), so the subagent runs with 2."]);
    expect(result.execution.effectiveMaxTurns).toBe(2);
    expect(result.presentation.detailFor(record(true)).modelName).toBeUndefined();
    expect(result.presentation.detailFor(record()).modelName).toBe("selected/chosen");
    expect(result.presentation.detailFor(record()).tags).toEqual(["twin", "thinking: high", "max turns: 2"]);
  });

  it("shows the ordinary parent model when no selection exists", () => {
    expect(config().presentation.detailBase.modelName).toBe("proposal/proposed");
  });
});

describe("pending selection output sites", () => {
  it("withholds model and thinking in the shared producer and final helper", () => {
    const agent = record(true);
    agent.subagentSession = toSubagentSession(createSubagentSessionStub(createMockSession({ model: live, thinkingLevel: "max" })));
    const base = observedDetails(agent);
    expect(base.modelName).toBeUndefined();
    expect(base.tags).toEqual(["twin", "inherit context", "max turns: 7"]);
    expect(buildDetails(base, agent).modelName).toBeUndefined();
  });

  it("withholds the model in get-result text", async () => {
    const agent = record(true);
    const result = await new GetResultTool({ getRecord: () => agent }, registry).execute("call", { agent_id: agent.id }, new AbortController().signal, undefined, undefined);
    expect(result.content[0].text).not.toContain("proposal/proposed");
    expect(result.content[0].text).not.toContain("selected/chosen");
    expect(result.content[0].text).not.toContain("Model:");
  });

  it("withholds the model in get-result metadata", async () => {
    const agent = record(true);
    const result = await new GetResultTool({ getRecord: () => agent }, registry).execute("call", { agent_id: agent.id }, new AbortController().signal, undefined, undefined);
    expect(result.details?.modelName).toBeUndefined();
  });

  it("withholds the proposal and confirmed pair in the real widget callback", () => {
    const agent = record(true);
    agent.markRunning(Date.now());
    const manager = { listAgents: () => [agent] } as unknown as SubagentManager;
    const widget = new AgentWidget(manager, registry);
    let render: (() => string[]) | undefined;
    widget.setUICtx({
      setStatus: () => {},
      setWidget: (_key, content) => {
        if (typeof content === "function") {
          const component = content({ mode: "regular", terminal: { columns: 200, rows: 40 }, requestRender: () => {} }, { fg: (_color: string, text: string) => text, bold: (text: string) => text });
          render = () => component.render();
        }
      },
    });
    try {
      widget.update();
      expect(render).toBeDefined();
      const text = render?.().join("\n");
      expect(text).toContain("Awaiting model/thinking selection");
      expect(text).not.toContain("proposal/proposed");
      expect(text).not.toContain("selected/chosen");
      expect(text).not.toContain("↻");
    } finally { widget.dispose(); }
  });
});

describe("real-record background resume", () => {
  function world() {
    const resumeGate = Promise.withResolvers<TurnLoopResult>();
    const resumeStarted = Promise.withResolvers<undefined>();
    const budgetReporters: Array<((budget: TurnBudget) => void) | undefined> = [];
    const session = createMockSession({ model: live, thinkingLevel: "max" });
    const stub = createSubagentSessionStub(session);
    stub.resumeTurnLoop.mockImplementation((_prompt: string, options: { onTurnBudget?: (budget: TurnBudget) => void }) => {
      budgetReporters.push(options.onTurnBudget);
      resumeStarted.resolve(undefined);
      return resumeGate.promise;
    });
    const scope = new SpawnSelectionScope();
    const select = vi.fn();
    const factory = vi.fn(async () => toSubagentSession(stub));
    const snapshot = { cwd: "/repo", systemPrompt: "parent", model: proposal, modelRegistry: { find: () => proposal, getAll: () => [proposal], getAvailable: () => [proposal] } };
    const manager = new SubagentManager({ createSubagentSession: factory, limiter: new ConcurrencyLimiter(() => 4), baseCwd: "/repo", registry, selectionScope: scope });
    managers.push(manager);
    const tool = new AgentTool(manager, { buildSnapshot: () => snapshot, getModelInfo: () => ({ parentModel: proposal, modelRegistry: undefined }), getSessionInfo: () => ({ parentSessionFile: "/parent", parentSessionId: "parent" }) }, { defaultMaxTurns: undefined, maxConcurrent: 4 }, registry, "/agent");
    return { manager, tool, factory, scope, select, snapshot, resumeGate, resumeStarted, budgetReporters };
  }

  it("returns before the held run ends without reselecting or recreating a session", async () => {
    const w = world();
    const id = w.manager.spawn(w.snapshot, "general-purpose", "first", { description: "first", background: { kind: "explicit", isBackground: true } });
    await w.manager.getRecord(id)?.promise;
    w.scope.register({ select: w.select });
    try {
      const result = await w.tool.execute("resume", { subagent_type: "general-purpose", prompt: "next", description: "new description", resume: id, run_in_background: true, thinking: "low" }, undefined, undefined, STUB_CTX);
      expect(result.details?.status).toBe("background");
      expect(w.manager.getRecord(id)?.status).toBe("running");
      expect(w.select).not.toHaveBeenCalled();
      expect(w.factory).toHaveBeenCalledOnce();
    } finally { w.resumeGate.resolve(turnLoopResult({ responseText: "resumed" })); await w.manager.getRecord(id)?.promise; }
  });

  it("projects a fresh resume budget live without selection or session recreation", async () => {
    const w = world();
    const id = w.manager.spawn(w.snapshot, "general-purpose", "first", { description: "first", background: { kind: "explicit", isBackground: true } });
    await w.manager.getRecord(id)?.promise;
    w.scope.register({ select: w.select });
    try {
      await w.tool.execute("resume", { subagent_type: "general-purpose", prompt: "next", description: "next", resume: id, run_in_background: true }, undefined, undefined, STUB_CTX);
      await w.resumeStarted.promise;
      const agent = w.manager.getRecord(id);
      expect(agent?.turnBudget).toBeUndefined();
      const budget: TurnBudget = { maxTurns: 7, used: 1, phase: "within" };
      w.budgetReporters[0]?.(budget);
      expect(agent?.turnBudget).toEqual(budget);
      const result = await new GetResultTool(w.manager, registry).execute("result", { agent_id: id }, new AbortController().signal, undefined, undefined);
      expect(result.details?.turnBudget).toEqual(budget);
      expect(result.details?.modelName).toBe("live/switched");
      expect(w.select).not.toHaveBeenCalled();
      expect(w.factory).toHaveBeenCalledOnce();
    } finally {
      w.resumeGate.resolve(turnLoopResult({ responseText: "resumed" }));
      await w.manager.getRecord(id)?.promise;
    }
  });

  it("renders the record pair instead of the new invocation pair", async () => {
    const w = world();
    const id = w.manager.spawn(w.snapshot, "general-purpose", "first", { description: "first", background: { kind: "explicit", isBackground: true } });
    await w.manager.getRecord(id)?.promise;
    try {
      const result = await w.tool.execute("resume", { subagent_type: "general-purpose", prompt: "next", description: "new description", resume: id, run_in_background: true, thinking: "low" }, undefined, undefined, STUB_CTX);
      expect(result.details?.modelName).toBe("live/switched");
      expect(result.details?.tags).toEqual(["twin", "thinking: max", "background"]);
      expect(result.details?.description).toBe("new description");
    } finally { w.resumeGate.resolve(turnLoopResult({ responseText: "resumed" })); await w.manager.getRecord(id)?.promise; }
  });
});
