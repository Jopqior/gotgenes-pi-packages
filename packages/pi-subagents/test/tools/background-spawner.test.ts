import { describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import type { SpawnSelectionOutcome } from "#src/lifecycle/initial-spawn-selection";
import { type BackgroundParams, spawnBackground } from "#src/tools/background-spawner";
import { resolveSpawnConfig } from "#src/tools/spawn-config";
import { createToolDeps } from "#test/helpers/make-deps";
import { makeModel } from "#test/helpers/make-model";
import { createResolvedSpawnConfig } from "#test/helpers/make-spawn-config";
import { createTestSubagent } from "#test/helpers/make-subagent";
import { createMockSession, createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";
import { STUB_SNAPSHOT } from "#test/helpers/stub-ctx";

function makeConfig(overrides: Parameters<typeof createResolvedSpawnConfig>[0] = {}) {
  return createResolvedSpawnConfig({
    displayName: "General-purpose",
    prompt: "do something",
    description: "bg task",
    runInBackground: true,
    ...overrides,
  });
}

function makeParams(overrides: Partial<BackgroundParams> = {}): BackgroundParams {
  return {
    config: makeConfig(),
    snapshot: STUB_SNAPSHOT,
    parentSession: { parentSessionFile: "/sessions/parent.jsonl", parentSessionId: "session-1", toolCallId: "tc-1" },
    settings: { maxConcurrent: 4 },
    ...overrides,
  };
}

type Deps = ReturnType<typeof createToolDeps>;

/** A deps fixture whose manager reports `outcome` from the selection wait. */
function makeDepsWithOutcome(outcome: SpawnSelectionOutcome, record?: ReturnType<typeof createTestSubagent>): Deps {
  const deps = createToolDeps();
  deps.manager.spawn = vi.fn().mockReturnValue("bg-sel");
  deps.manager.waitForSpawnSelection = vi.fn(
    (_id: string, _signal?: AbortSignal): Promise<SpawnSelectionOutcome> => Promise.resolve(outcome),
  );
  deps.manager.getRecord = vi.fn().mockReturnValue(record ?? createTestSubagent({ status: "running" }));
  return deps;
}

describe("spawnBackground", () => {
  /**
   * The door declares a commitment rather than a default, because
   * resolveSpawnConfig already merged the agent's frontmatter and AgentTool
   * routed here on the result. The distinction is not observable today — the
   * tool only reaches this door when the merged value was already true, where
   * both request kinds resolve alike — but it is the contract #829 builds on to
   * make a caller's explicit override win, so a silent flip to "default" must
   * fail here rather than in that issue's work.
   */
  it("commits explicitly to background rather than deferring to frontmatter", async () => {
    const { manager } = createToolDeps();

    await spawnBackground(manager, makeParams());

    expect(manager.spawn).toHaveBeenCalledWith(
      expect.anything(), // snapshot
      expect.any(String),
      "do something",
      expect.objectContaining({ background: { kind: "explicit", isBackground: true } }),
    );
  });

  it("passes parentSession.toolCallId to manager.spawn", async () => {
    const { manager } = createToolDeps();
    await spawnBackground(manager, makeParams({ parentSession: { toolCallId: "tc-99" } }));
    const spawnOpts = (manager.spawn as ReturnType<typeof vi.fn>).mock.calls[0][3];
    expect(spawnOpts.parentSession?.toolCallId).toBe("tc-99");
  });

  it("forwards the tool signal to the manager's selection wait", async () => {
    const { manager } = createToolDeps();
    const controller = new AbortController();
    await spawnBackground(manager, makeParams(), controller.signal);
    expect(manager.waitForSpawnSelection).toHaveBeenCalledWith("agent-1", controller.signal);
  });

  it("holds the result until the manager's selection wait settles", async () => {
    const deps = createToolDeps();
    const gate = Promise.withResolvers<SpawnSelectionOutcome>();
    deps.manager.waitForSpawnSelection = vi.fn((_id: string, _signal?: AbortSignal) => gate.promise);
    deps.manager.getRecord = vi.fn().mockReturnValue(createTestSubagent({ status: "running" }));

    let returned = false;
    const pending = spawnBackground(deps.manager, makeParams()).then((result) => {
      returned = true;
      return result;
    });
    await Promise.resolve();
    // The tool has not returned while the selection is pending.
    expect(returned).toBe(false);

    gate.resolve({ kind: "not-required" });
    const result = await pending;
    expect(returned).toBe(true);
    expect(result.content[0].text).toContain("agent-1");
  });

  it("returns text result with agent ID and description", async () => {
    const { manager } = createToolDeps();
    const result = await spawnBackground(
      manager,
      makeParams({
        config: makeConfig({ description: "my task" }),
      }),
    );
    expect(result.content[0].text).toContain("agent-1");
    expect(result.content[0].text).toContain("my task");
  });

  it("mentions 'queued' in result when record status is queued", async () => {
    const deps = makeDepsWithOutcome({ kind: "not-required" }, createTestSubagent({ status: "queued" }));
    const result = await spawnBackground(deps.manager, makeParams({ settings: { maxConcurrent: 4 } }));
    expect(result.content[0].text).toContain("queued");
    expect(result.content[0].text).toContain("max 4 concurrent");
  });

  it("mentions 'started' in result when record is running", async () => {
    const { manager } = createToolDeps();
    const result = await spawnBackground(manager, makeParams());
    expect(result.content[0].text).toContain("started");
  });

  it("renders the confirmed pair when selection completed, without pending-selection wording", async () => {
    const selectedModel = makeModel({ id: "claude-haiku", name: "Claude Haiku" });
    const record = createTestSubagent({
      status: "running",
      completedAt: undefined,
      selectedPair: { model: selectedModel, thinkingLevel: "off" },
    });
    const deps = makeDepsWithOutcome({ kind: "selected" }, record);
    const parent = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
    const proposal = makeModel({ id: "gpt-5.5", name: "GPT-5.5", provider: "openai" });
    const models = [parent, proposal, selectedModel];
    const config = resolveSpawnConfig(
      {
        subagent_type: "general-purpose", prompt: "do something", description: "bg task",
        run_in_background: true, model: "openai/gpt-5.5", thinking: "high",
        inherit_context: true, max_turns: 9,
      },
      new AgentTypeRegistry(() => new Map()),
      { parentModel: parent, modelRegistry: {
        find: (provider, id) => models.find((model) => model.provider === provider && model.id === id),
        getAll: () => models,
        getAvailable: () => models,
      } },
      { defaultMaxTurns: 25 },
    );
    if ("error" in config) throw new Error(config.error);
    expect(config.presentation.detailBase).toEqual({
      displayName: "Agent", description: "bg task", subagentType: "general-purpose", modelName: "gpt-5.5",
      tags: ["twin", "thinking: high", "inherit context", "background", "max turns: 9"],
    });

    const result = await spawnBackground(
      deps.manager, makeParams({ config, snapshot: { ...STUB_SNAPSHOT, model: parent } }),
    );
    const text = result.content[0].text;
    // Selection is confirmed: the caller's proposed model never appears as the choice.
    expect(text).not.toContain("gpt-5.5");
    expect(text).not.toContain("Awaiting model/thinking selection");
    expect(text).toContain("Agent started in background.");
    expect(text).toContain("selection confirmed");
    // The confirmed pair is the presented one.
    expect(result.details?.modelName).toBe("haiku");
    expect(result.details?.tags).toEqual(["twin", "thinking: off", "inherit context", "background", "max turns: 9"]);
    expect(config.execution.agentInvocation).toEqual({
      modelName: "gpt-5.5", thinking: "high", maxTurns: 9, inheritContext: true, runInBackground: true,
    });
  });

  it("reports a cancelled selection as a startup that produced no running child", async () => {
    const deps = makeDepsWithOutcome({ kind: "stopped" });
    const config = makeConfig({ model: "gpt-5.5" });
    const result = await spawnBackground(deps.manager, makeParams({ config }));
    const text = result.content[0].text;
    expect(text).toContain("bg-sel");
    expect(text).toContain("did not start");
    expect(text).toContain("cancelled");
    // Not a background success: nothing to be notified about.
    expect(text).not.toContain("You will be notified");
    // The caller's proposed model is not advertised as a confirmed choice.
    expect(text).not.toContain("gpt-5.5");
    expect(result.details).toBeUndefined();
  });

  it("reports a failed selection with the recorded error", async () => {
    const deps = makeDepsWithOutcome({ kind: "failed", error: "catalogue exploded" });
    const result = await spawnBackground(deps.manager, makeParams());
    const text = result.content[0].text;
    expect(text).toContain("bg-sel");
    expect(text).toContain("catalogue exploded");
    expect(text).not.toContain("You will be notified");
    expect(result.details).toBeUndefined();
  });

  it("includes output file path in result when present", async () => {
    const deps = createToolDeps();
    const record = createTestSubagent({ status: "running" });
    record.subagentSession = toSubagentSession(createSubagentSessionStub(createMockSession(), "/sessions/bg.jsonl"));
    deps.manager.getRecord = vi.fn().mockReturnValue(record);
    const result = await spawnBackground(deps.manager, makeParams());
    expect(result.content[0].text).toContain("/sessions/bg.jsonl");
  });

  it("leads the result with the spawn's notes", async () => {
    const { manager } = createToolDeps();
    const result = await spawnBackground(
      manager,
      makeParams({ config: makeConfig({ fellBack: true, rawType: "unknown-type" }) }),
    );
    expect(result.content[0].text).toMatch(
      /^Note: Unknown agent type "unknown-type" — using general-purpose\.\n\nAgent (started|queued) in background\./,
    );
  });

  it("leads the result with the launch message when there are no notes", async () => {
    const { manager } = createToolDeps();
    const result = await spawnBackground(manager, makeParams());
    expect(result.content[0].text).toMatch(/^Agent (started|queued) in background\./);
  });

  it("returns error text when manager.spawn throws", async () => {
    const deps = createToolDeps();
    deps.manager.spawn = vi.fn().mockImplementation(() => { throw new Error("spawn failed"); });
    deps.manager.getRecord = vi.fn();
    const result = await spawnBackground(deps.manager, makeParams());
    expect(result.content[0].text).toContain("spawn failed");
  });
});
