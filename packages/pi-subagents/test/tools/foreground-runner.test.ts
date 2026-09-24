import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { type ForegroundParams, runForeground } from "#src/tools/foreground-runner";
import { resolveSpawnConfig } from "#src/tools/spawn-config";
import { createToolDeps } from "#test/helpers/make-deps";
import { makeModel } from "#test/helpers/make-model";
import { createResolvedSpawnConfig } from "#test/helpers/make-spawn-config";
import { createTestSubagent } from "#test/helpers/make-subagent";
import { STUB_SNAPSHOT } from "#test/helpers/stub-ctx";

function resolvedSelectionConfig() {
  const parent = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
  const proposal = makeModel({ id: "gpt-5.5", name: "GPT-5.5", provider: "openai" });
  const models = [parent, proposal];
  const config = resolveSpawnConfig(
    { subagent_type: "general-purpose", prompt: "investigate", description: "fg task", model: "openai/gpt-5.5", thinking: "high", inherit_context: true, max_turns: 9 },
    new AgentTypeRegistry(() => new Map()),
    { parentModel: parent, modelRegistry: {
      find: (provider, id) => models.find((model) => model.provider === provider && model.id === id),
      getAll: () => models,
      getAvailable: () => models,
    } },
    { defaultMaxTurns: 25 },
  );
  if ("error" in config) throw new Error(config.error);
  return { config, parent };
}

function makeParams(overrides: Partial<ForegroundParams> = {}): ForegroundParams {
	return {
		config: createResolvedSpawnConfig({ description: "fg task" }),
		snapshot: STUB_SNAPSHOT,
		parentSession: { parentSessionFile: "/sessions/parent.jsonl", parentSessionId: "session-1" },
		...overrides,
	};
}

describe("runForeground", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns completion message with tool use count on success", async () => {
		const { manager } = createToolDeps();
		const result = await runForeground(manager, makeParams(), undefined, undefined);
		expect(result.content[0].text).toContain("Agent completed");
		expect(result.content[0].text).toContain("3 tool uses");
		expect(result.content[0].text).toContain("All done.");
	});

	it("surfaces a declared question as answerable, naming the resume call", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi
			.fn()
			.mockResolvedValue(
				createTestSubagent({
					id: "agent-5",
					result: "Mapped them.",
					pendingQuestion: "Which config?",
					sessionReady: true,
				}),
			);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("This agent is waiting on an answer:");
		expect(result.content[0].text).toContain("Which config?");
		expect(result.content[0].text).toContain('resume: "agent-5"');
	});

	it("reports a question a released session cannot answer, without naming a resume", async () => {
		const { manager } = createToolDeps();
		const released = createTestSubagent({
			id: "agent-5",
			result: "Mapped them.",
			pendingQuestion: "Which config?",
			sessionReady: true,
		});
		await released.releaseSession();
		manager.spawnAndWait = vi.fn().mockResolvedValue(released);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("Which config?");
		expect(result.content[0].text).toContain(
			"its session was released after its retention window",
		);
		expect(result.content[0].text).not.toContain("resume:");
	});

	it("adds no affordance when the agent asked nothing", async () => {
		const { manager } = createToolDeps();
		const result = await runForeground(manager, makeParams(), undefined, undefined);
		expect(result.content[0].text).not.toContain("waiting on an answer");
	});

	it("names where a teardown saved the work of an agent that completed", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({ workspaceNotice: "\n\n---\nChanges saved to branch `pi-agent-5`." }),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("Changes saved to branch `pi-agent-5`.");
	});

	it("reports the updates the agent sent while the parent was blocked", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({ runUpdates: ["The bug is in the retry wrapper."] }),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("Updates this agent sent while it worked:");
		expect(result.content[0].text).toContain("The bug is in the retry wrapper.");
	});

	it("reports the updates of an agent whose run then failed", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({
				status: "error",
				error: "turn loop exploded",
				runUpdates: ["The premise is wrong."],
			}),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("The premise is wrong.");
	});

	it("names where a teardown saved the work of an agent that failed", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({
				status: "error",
				error: "turn loop exploded",
				workspaceNotice: "\n\n---\nChanges saved to branch `pi-agent-5`.",
			}),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("Agent failed: turn loop exploded");
		expect(result.content[0].text).toContain("Changes saved to branch `pi-agent-5`.");
	});

	// A failed run's body carries no result, so the transcript is the only route
	// to what the child did before it died. The nudge and get_subagent_result
	// both name it; this carrier did not (#889).
	it("names the transcript of an agent that failed", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({
				status: "error",
				error: "429 rate limit exceeded",
				sessionReady: true,
				outputFile: "/sessions/child.jsonl",
			}),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).toContain("Agent failed: 429 rate limit exceeded");
		expect(result.content[0].text).toContain(
			"Full transcript available at: /sessions/child.jsonl",
		);
	});

	it("omits the transcript line for a failed agent that persisted none", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({ status: "error", error: "429 rate limit exceeded" }),
		);

		const result = await runForeground(manager, makeParams(), undefined, undefined);

		expect(result.content[0].text).not.toContain("Full transcript available at:");
	});

	it("marks the returned record consumed (foreground-return delivery edge)", async () => {
		const record = createTestSubagent();
		const deps = createToolDeps({
			manager: { ...createToolDeps().manager, spawnAndWait: vi.fn().mockResolvedValue(record) },
		});
		await runForeground(deps.manager, makeParams(), undefined, undefined);
		expect(record.consumed).toBe(true);
	});

	it("marks consumed even when the agent errored (result delivered in the tool result)", async () => {
		const record = createTestSubagent({ status: "error", error: "boom" });
		const deps = createToolDeps({
			manager: { ...createToolDeps().manager, spawnAndWait: vi.fn().mockResolvedValue(record) },
		});
		await runForeground(deps.manager, makeParams(), undefined, undefined);
		expect(record.consumed).toBe(true);
	});

	it("returns error message when agent record status is error", async () => {
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn().mockResolvedValue(
					createTestSubagent({ status: "error", error: "Context window exceeded" }),
				),
			},
		});
		const result = await runForeground(deps.manager, makeParams(), undefined, undefined);
		expect(result.content[0].text).toContain("Agent failed");
		expect(result.content[0].text).toContain("Context window exceeded");
	});

	it("returns error text when spawnAndWait throws", async () => {
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn().mockRejectedValue(new Error("runner crashed")),
			},
		});
		const result = await runForeground(deps.manager, makeParams(), undefined, undefined);
		expect(result.content[0].text).toContain("runner crashed");
	});

	it("includes fallback note when fellBack is true", async () => {
		const { manager } = createToolDeps();
		const result = await runForeground(
			manager,
			makeParams({
				config: createResolvedSpawnConfig({ rawType: "unknown-type", fellBack: true, description: "fg task" }),
			}),
			undefined,
			undefined,
		);
		expect(result.content[0].text).toContain('Unknown agent type "unknown-type"');
	});

	it("projects pending selection into streaming activity before the session exists", async () => {
		const pending = createTestSubagent({
			status: "running",
			completedAt: undefined,
			awaitingSelection: true,
		});
		const held = Promise.withResolvers<ReturnType<typeof createTestSubagent>>();
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn((_snapshot, _type, _prompt, opts) => {
					opts.observer?.onStarted?.(pending);
					return held.promise;
				}),
			},
		});
		const onUpdate = vi.fn();
		const runPromise = runForeground(deps.manager, makeParams(), undefined, onUpdate);

		await vi.advanceTimersByTimeAsync(100);
		const activities = onUpdate.mock.calls.map((call) => call[0].details.activity);
		expect(activities).toContain("Awaiting model/thinking selection");

		held.resolve(createTestSubagent({ result: "done" }));
		await runPromise;
	});

	it("strips call modelName and thinking tags from streamed details while selection is pending", async () => {
		const pending = createTestSubagent({
			status: "running",
			completedAt: undefined,
			awaitingSelection: true,
		});
		const held = Promise.withResolvers<ReturnType<typeof createTestSubagent>>();
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn((_snapshot, _type, _prompt, opts) => {
					opts.observer?.onStarted?.(pending);
					return held.promise;
				}),
			},
		});
		const onUpdate = vi.fn();
		const { config, parent } = resolvedSelectionConfig();
		const runPromise = runForeground(
			deps.manager,
			makeParams({ config, snapshot: { ...STUB_SNAPSHOT, model: parent } }),
			undefined, onUpdate,
		);
		expect(onUpdate.mock.calls[0][0].details.modelName).toBe("gpt-5.5");
		expect(onUpdate.mock.calls[0][0].details.tags).toEqual(["twin", "thinking: high", "inherit context", "max turns: 9"]);

		await vi.advanceTimersByTimeAsync(100);
		const pendingDetails = onUpdate.mock.calls
			.map((call) => call[0].details)
			.filter((details) => details.activity === "Awaiting model/thinking selection");
		expect(pendingDetails.length).toBeGreaterThan(0);
		for (const details of pendingDetails) {
			expect(details.modelName).toBeUndefined();
			expect(details.tags).toEqual(["twin", "inherit context", "max turns: 9"]);
		}

		held.resolve(createTestSubagent({ result: "done" }));
		await runPromise;
	});

	it("names the selected pair on completed details", async () => {
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({
				selectedPair: {
					model: makeModel({ id: "deepseek/deepseek-flash", name: "DeepSeek Flash" }),
					thinkingLevel: "off",
				},
			}),
		);
		const { config, parent } = resolvedSelectionConfig();
		const result = await runForeground(
			manager, makeParams({ config, snapshot: { ...STUB_SNAPSHOT, model: parent } }), undefined, undefined,
		);
		expect(result.details?.modelName).toBe("deepseek flash");
		expect(result.details?.tags).toEqual(["twin", "thinking: off", "inherit context", "max turns: 9"]);
		expect(config.execution.model?.id).toBe("gpt-5.5");
		expect(config.execution.thinking).toBe("high");
		expect(config.execution.agentInvocation).toEqual({
			modelName: "gpt-5.5", thinking: "high", maxTurns: 9, inheritContext: true, runInBackground: false,
		});
		expect(config.presentation.detailBase).toEqual({
			displayName: "Agent", description: "fg task", subagentType: "general-purpose", modelName: "gpt-5.5",
			tags: ["twin", "thinking: high", "inherit context", "max turns: 9"],
		});
	});

	it("omits modelName on completed details when the selected id equals the parent", async () => {
		const parent = makeModel({ id: "openai-codex/gpt-5.5", name: "GPT-5.5" });
		const { manager } = createToolDeps();
		manager.spawnAndWait = vi.fn().mockResolvedValue(
			createTestSubagent({
				selectedPair: { model: parent, thinkingLevel: "medium" },
			}),
		);
		const { config } = resolvedSelectionConfig();
		const result = await runForeground(
			manager,
			makeParams({ config, snapshot: { ...STUB_SNAPSHOT, model: parent } }),
			undefined,
			undefined,
		);
		expect(result.details?.modelName).toBeUndefined();
		expect(result.details?.tags).toEqual(["twin", "thinking: medium", "inherit context", "max turns: 9"]);
	});

	it("calls onUpdate with streaming details while running", async () => {
		let resolve!: (r: any) => void;
		const promise = new Promise<any>((res) => { resolve = res; });
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn().mockReturnValue(promise),
			},
		});
		const onUpdate = vi.fn();
		const runPromise = runForeground(deps.manager, makeParams(), undefined, onUpdate);

		// Advance timer to trigger a spinner tick
		await vi.advanceTimersByTimeAsync(100);
		expect(onUpdate).toHaveBeenCalled();

		resolve(createTestSubagent({ result: "done" }));
		await runPromise;
	});

	it("clears spinner interval on error and does not leave it running", async () => {
		const deps = createToolDeps({
			manager: {
				...createToolDeps().manager,
				spawnAndWait: vi.fn().mockRejectedValue(new Error("fail")),
			},
		});
		const onUpdate = vi.fn();
		await runForeground(deps.manager, makeParams(), undefined, onUpdate);

		onUpdate.mockClear();
		await vi.advanceTimersByTimeAsync(200);
		// Interval must have been cleared — no further onUpdate calls
		expect(onUpdate).not.toHaveBeenCalled();
	});

	describe("agent ID in the result text", () => {
		it("names the agent ID under the completion header", async () => {
			const { manager } = createToolDeps();
			const result = await runForeground(manager, makeParams(), undefined, undefined);
			expect(result.content[0].text).toContain("Agent ID: agent-1");
		});

		it("names the agent ID when the agent failed", async () => {
			const deps = createToolDeps({
				manager: {
					...createToolDeps().manager,
					spawnAndWait: vi.fn().mockResolvedValue(
						createTestSubagent({ status: "error", error: "Context window exceeded" }),
					),
				},
			});
			const result = await runForeground(deps.manager, makeParams(), undefined, undefined);
			expect(result.content[0].text).toContain("Agent ID: agent-1");
		});

		it("keeps the spawn notes ahead of the agent ID line", async () => {
			const { manager } = createToolDeps();
			const result = await runForeground(
				manager,
				makeParams({
					config: createResolvedSpawnConfig({ rawType: "unknown-type", fellBack: true, description: "fg task" }),
				}),
				undefined,
				undefined,
			);
			const text = result.content[0].text;
			expect(text.startsWith('Note: Unknown agent type "unknown-type" — using general-purpose.')).toBe(true);
			expect(text.indexOf("Agent ID: agent-1")).toBeGreaterThan(0);
		});
	});
});
