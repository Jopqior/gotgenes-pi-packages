import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { ConcurrencyLimiter } from "#src/lifecycle/concurrency-limiter";
import { SpawnSelectionScope } from "#src/lifecycle/spawn-selection";
import { SubagentManager } from "#src/lifecycle/subagent-manager";
import type { TurnLoopResult } from "#src/lifecycle/subagent-session";
import { GetResultTool } from "#src/tools/get-result-tool";
import { makeModel } from "#test/helpers/make-model";
import { createMockSession, createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";
import { STUB_CTX } from "#test/helpers/stub-ctx";
import { turnLoopResult } from "#test/helpers/turn-loop-result";

const proposal = makeModel({ provider: "proposal", id: "proposed" });
const selected = makeModel({ provider: "selected", id: "chosen", reasoning: true });
const registry = new AgentTypeRegistry(() => new Map());

afterEach(() => vi.useRealTimers());

describe("bounded queries during real spawn selection", () => {
  it("expires only the query, then reports ordinary execution after selection", async () => {
    vi.useFakeTimers();
    const choice = Promise.withResolvers<{ model: typeof selected; thinkingLevel: "high" }>();
    const run = Promise.withResolvers<TurnLoopResult>();
    const scope = new SpawnSelectionScope();
    let selectionSignal: AbortSignal | undefined;
    scope.register({ select: (_request, signal) => { selectionSignal = signal; return choice.promise; } });
    const stub = createSubagentSessionStub(createMockSession({ model: selected, thinkingLevel: "high" }));
    stub.runTurnLoop.mockReturnValue(run.promise);
    const factory = vi.fn(async () => toSubagentSession(stub));
    const snapshot = { cwd: "/repo", systemPrompt: "parent", model: proposal, modelRegistry: { find: () => proposal, getAll: () => [proposal, selected], getAvailable: () => [proposal, selected] } };
    const manager = new SubagentManager({ createSubagentSession: factory, limiter: new ConcurrencyLimiter(() => 4), baseCwd: "/repo", registry, selectionScope: scope });
    const id = manager.spawn(snapshot, "general-purpose", "first", { description: "first", background: { kind: "explicit", isBackground: true } });
    const agent = manager.getRecord(id);
    const query = new GetResultTool(manager, registry);
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(agent?.awaitingSelection).toBe(true);
      const pending = query.execute("result", { agent_id: id, wait: true, timeout: 1 }, new AbortController().signal, undefined, STUB_CTX);
      expect(agent?.claimed).toBe(true);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await pending;
      expect(selectionSignal?.aborted).toBe(false);
      expect(factory).not.toHaveBeenCalled();
      expect(agent?.claimed).toBe(false);
      expect(agent?.consumed).toBe(false);
      expect(agent?.status).toBe("running");
      const text = result.content[0].text;
      expect(text).toContain("Progress: Awaiting model/thinking selection");
      expect(text).toContain("This wait ended after its 1s timeout");
      expect(text).toContain("Complete the model/thinking selection");
      expect(text).not.toContain("steer_subagent");
      expect(text).not.toContain("stuck");
      expect(text).not.toContain("Model:");
      expect(result.details?.modelName).toBeUndefined();

      choice.resolve({ model: selected, thinkingLevel: "high" });
      await vi.waitFor(() => expect(factory).toHaveBeenCalledOnce());
      expect(agent?.awaitingSelection).toBe(false);
      const executing = query.execute("result", { agent_id: id, wait: true, timeout: 1 }, new AbortController().signal, undefined, STUB_CTX);
      await vi.advanceTimersByTimeAsync(1000);
      const ordinary = await executing;
      expect(ordinary.content[0].text).toContain("Progress: thinking");
      expect(ordinary.content[0].text).toContain("steer_subagent");
      expect(ordinary.content[0].text).not.toContain("Complete the model/thinking selection");
      expect(ordinary.content[0].text).toContain("Model: selected/chosen");
      expect(ordinary.details?.modelName).toBe("selected/chosen");
    } finally {
      choice.resolve({ model: selected, thinkingLevel: "high" });
      run.resolve(turnLoopResult({ responseText: "done" }));
      await agent?.promise;
      await manager.dispose();
    }
  });
});
