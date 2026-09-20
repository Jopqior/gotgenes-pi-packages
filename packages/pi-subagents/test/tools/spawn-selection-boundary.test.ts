/**
 * spawn-selection-boundary.test.ts — the real spawn tool-return boundary.
 *
 * Wires the real AgentTool to a real SubagentManager and real Subagent records
 * (spawn, the record, and the selection wait are never mocked) and holds each
 * downstream phase on its own test-controlled gate: admission (concurrency
 * limit plus a sibling), selection (a held provider), workspace preparation,
 * the session factory, and the child's task. Characterization pins for the
 * sequential parent continuation: a following ask_user cannot run while the
 * selection is pending, and after confirmation the parent continues without
 * waiting for any child work.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { ConcurrencyLimiter } from "#src/lifecycle/concurrency-limiter";
import type { CreateSubagentSessionParams } from "#src/lifecycle/create-subagent-session";
import type { ParentSnapshot } from "#src/lifecycle/parent-snapshot";
import { SpawnSelectionScope } from "#src/lifecycle/spawn-selection";
import { SubagentManager } from "#src/lifecycle/subagent-manager";
import type { Workspace, WorkspacePrepareContext } from "#src/lifecycle/workspace";
import type { SpawnSelection, SpawnSelectionRequest } from "#src/service/service";
import type { ModelRegistry } from "#src/session/model-resolver";
import { AgentTool, type AgentToolRuntime } from "#src/tools/agent-tool";
import { makeModel } from "#test/helpers/make-model";
import { makeWorkspace } from "#test/helpers/make-workspace";
import { createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";
import { STUB_CTX } from "#test/helpers/stub-ctx";

type ToolExecuteResult = Awaited<ReturnType<AgentTool["execute"]>>;

/** The shape the session stub's runTurnLoop resolves with. */
interface TaskResult {
	responseText: string;
	aborted: boolean;
	steered: boolean;
}

/** A test-held phase gate with an observable settled flag. */
interface Deferred<T> {
	readonly promise: Promise<T>;
	resolve(value: T): void;
	readonly settled: boolean;
}

function deferred<T>(): Deferred<T> {
	const { promise, resolve } = Promise.withResolvers<T>();
	let settled = false;
	return {
		promise,
		resolve(value: T): void {
			settled = true;
			resolve(value);
		},
		get settled() {
			return settled;
		},
	};
}

/**
 * Timer hop for bounded waits and cleanup drains only — never evidence. Every
 * pending-state claim in this file is structural: the gate that would have to
 * resolve the wait is held by the test, so no amount of scheduling can settle
 * it. Positive settlements are awaited directly on the production promise.
 */
const tick = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

/**
 * Wait, bounded, for a settlement the production chain owes. Used only on the
 * positive direction — a gate this test still holds can never satisfy it.
 */
async function settleBound(check: () => boolean, what: string): Promise<void> {
	for (let i = 0; i < 400 && !check(); i++) await tick();
	if (!check()) throw new Error(`${what} did not happen within the failure bound`);
}

const taskDone = (responseText: string): TaskResult => ({ responseText, aborted: false, steered: false });

/** A provider whose select() calls park on test-held deferrals. */
function heldSelectionProvider() {
	const pending: Array<(value: SpawnSelection | undefined) => void> = [];
	const select = vi.fn(
		(_request: SpawnSelectionRequest, _signal: AbortSignal): Promise<SpawnSelection | undefined> => {
			const gate = Promise.withResolvers<SpawnSelection | undefined>();
			pending.push(gate.resolve);
			return gate.promise;
		},
	);
	return {
		select,
		resolveAt(index: number, value: SpawnSelection): void {
			const removed = pending.splice(index, 1);
			if (removed.length === 0) throw new Error(`no pending selection at index ${index}`);
			removed[0](value);
		},
		resolveAllCancelled(): void {
			while (pending.length > 0) pending.pop()!(undefined);
		},
	};
}

interface TestWorld {
	manager: SubagentManager;
	tool: AgentTool;
	provider: ReturnType<typeof heldSelectionProvider> | undefined;
	snapshot: ParentSnapshot;
	models: ReturnType<typeof makeModel>[];
	factoryGates: Deferred<null>[];
	taskGates: Deferred<TaskResult>[];
	workspaceGates: Deferred<Workspace>[];
	releaseFactory(index: number): void;
	releaseTask(index: number, result: TaskResult): void;
	releaseWorkspace(index: number): void;
	releaseAllFactories(): void;
	releaseAllTasks(result: TaskResult): void;
	releaseAllWorkspace(): void;
}

const worlds: TestWorld[] = [];

/**
 * Real tool + real manager + real records. Every downstream phase parks on a
 * test-held gate: each factory invocation waits on its factory gate, each
 * created session's runTurnLoop waits on its task gate, and (optionally) the
 * selection provider and workspace provider park their answers too.
 */
function makeWorld(options: { maxConcurrent?: number; withProvider?: boolean; withWorkspace?: boolean } = {}): TestWorld {
	const maxConcurrent = options.maxConcurrent ?? 4;
	const models = [
		makeModel({ id: "sonnet", name: "Sonnet", provider: "anthropic" }),
		makeModel({ id: "opus", name: "Opus", provider: "anthropic" }),
	];
	const registry: ModelRegistry = {
		find: (searchedProvider, searchedId) =>
			models.find((candidate) => candidate.provider === searchedProvider && candidate.id === searchedId),
		getAll: () => models,
		getAvailable: () => models,
	};
	const snapshot: ParentSnapshot = {
		cwd: "/repo",
		systemPrompt: "parent prompt",
		model: models[0],
		modelRegistry: registry,
	};

	const factoryGates: Deferred<null>[] = [];
	const taskGates: Deferred<TaskResult>[] = [];
	const workspaceGates: Deferred<Workspace>[] = [];
	const createSubagentSession = vi.fn(async (_params: CreateSubagentSessionParams) => {
		const factoryGate = deferred<null>();
		factoryGates.push(factoryGate);
		await factoryGate.promise;
		const taskGate = deferred<TaskResult>();
		taskGates.push(taskGate);
		const stub = createSubagentSessionStub();
		stub.runTurnLoop.mockImplementation(() => taskGate.promise);
		return toSubagentSession(stub);
	});

	const workspaceProvider = {
		prepare: vi.fn((_ctx: WorkspacePrepareContext): Promise<Workspace | undefined> => {
			const gate = deferred<Workspace>();
			workspaceGates.push(gate);
			return gate.promise;
		}),
	};

	const scope = new SpawnSelectionScope();
	const provider = options.withProvider ? heldSelectionProvider() : undefined;
	if (provider) scope.register({ select: provider.select });

	const agentRegistry = new AgentTypeRegistry(() => new Map());
	const manager = new SubagentManager({
		createSubagentSession,
		limiter: new ConcurrencyLimiter(() => maxConcurrent),
		baseCwd: "/repo",
		registry: agentRegistry,
		selectionScope: scope,
	});
	if (options.withWorkspace) manager.registerWorkspaceProvider(workspaceProvider);

	const runtime: AgentToolRuntime = {
		buildSnapshot: () => snapshot,
		getModelInfo: () => ({ parentModel: models[0], modelRegistry: registry }),
		getSessionInfo: () => ({ parentSessionFile: "/sessions/parent.jsonl", parentSessionId: "parent-session" }),
	};
	const tool = new AgentTool(
		manager,
		runtime,
		{ defaultMaxTurns: undefined as number | undefined, maxConcurrent },
		agentRegistry,
		"/home/user/.pi",
	);

	const world: TestWorld = {
		manager,
		tool,
		provider,
		snapshot,
		models,
		factoryGates,
		taskGates,
		workspaceGates,
		releaseFactory: (index) => { factoryGates[index]?.resolve(null); },
		releaseTask: (index, result) => { taskGates[index]?.resolve(result); },
		releaseWorkspace: (index) => { workspaceGates[index]?.resolve(makeWorkspace(`/repo/child-${index}`)); },
		releaseAllFactories: () => { for (const gate of factoryGates) gate.resolve(null); },
		releaseAllTasks: (result) => { for (const gate of taskGates) gate.resolve(result); },
		releaseAllWorkspace: () => { for (const gate of workspaceGates) gate.resolve(makeWorkspace("/repo/child")); },
	};
	worlds.push(world);
	return world;
}

/** Spawn a background sibling through the real manager to occupy the slot. */
function spawnBackgroundSibling(world: TestWorld, prompt: string) {
	const id = world.manager.spawn(world.snapshot, "general-purpose", prompt, {
		description: prompt,
		background: { kind: "explicit", isBackground: true },
	});
	const record = world.manager.getRecord(id);
	if (!record) throw new Error("sibling record missing");
	return record;
}

/** The record under test — the spawned agent that is not a named sibling. */
function mainRecord(world: TestWorld, ...siblingIds: string[]) {
	const record = world.manager.listAgents().find((agent) => !siblingIds.includes(agent.id));
	if (!record) throw new Error("main record missing");
	return record;
}

const selectedPair = (world: TestWorld): SpawnSelection => ({ model: world.models[1], thinkingLevel: "off" });

const backgroundParams = (): Record<string, unknown> => ({
	prompt: "child work",
	description: "bg task",
	subagent_type: "general-purpose",
	run_in_background: true,
});

/**
 * The sequential parent continuation at the real tool boundary: the parent
 * awaits the subagent call, then reaches for ask_user. The spy flips on as
 * soon as it is reached, and its answer parks on a test-held gate.
 *
 * `toolDone` is the real execute promise with one observer chained on: the
 * `toolReturned` flag flips exactly when the tool returns, and awaiting
 * `toolDone` is the explicit phase boundary for the tool's return.
 */
function startSequentialTurn(world: TestWorld, signal?: AbortSignal) {
	const askUserGate = deferred<string>();
	let selectionAtContinuation: SpawnSelection | undefined;
	const askUser = vi.fn(async (): Promise<string> => {
		selectionAtContinuation = world.manager.listAgents().find((record) => record.description === "bg task")?.selectedPair;
		return askUserGate.promise;
	});
	let returned = false;
	let result: ToolExecuteResult | undefined;
	const toolDone = world.tool
		.execute("tc-1", backgroundParams(), signal, undefined, STUB_CTX)
		.then((toolResult) => {
			returned = true;
			result = toolResult;
			return toolResult;
		});
	const turn = (async () => {
		const toolResult = await toolDone;
		const answer = await askUser();
		return { toolResult, answer };
	})();
	return {
		turn,
		toolDone,
		askUser,
		askUserGate,
		toolReturned: () => returned,
		selectionAtContinuation: () => selectionAtContinuation,
		toolResultText: () => {
			if (!result) throw new Error("the tool has not returned yet");
			return result.content[0].text;
		},
	};
}

describe("spawn selection tool boundary (real AgentTool → manager → record)", () => {
	afterEach(async () => {
		for (const world of worlds) {
			// Bounded drain: each release can fan a chain whose next gate only
			// exists after a tick (factory → task), so release-and-tick in a loop.
			for (let i = 0; i < 60; i++) {
				world.provider?.resolveAllCancelled();
				world.releaseAllWorkspace();
				world.releaseAllTasks(taskDone("afterward"));
				world.releaseAllFactories();
				await tick();
			}
			world.manager.abortAll();
			await world.manager.dispose();
		}
		worlds.length = 0;
	});

	describe("sequential parent continuation", () => {
		it("holds the following ask_user spy until selection confirms, then continues while child work is held", async () => {
			const world = makeWorld({ withProvider: true });
			const harness = startSequentialTurn(world);

			// Phase-entry signal: the free slot admitted the record inside the
			// synchronous spawn prologue, and the provider has been invoked — the
			// run is parked inside its selection, and this test holds the answer.
			// Every path that could settle the tool's wait runs through that gate,
			// so the tool and the parent's following ask_user are parked with it.
			expect(world.provider!.select).toHaveBeenCalledTimes(1);
			const record = mainRecord(world);
			expect(record.status).toBe("running");

			// Initial pending snapshot; the selected pair captured inside askUser
			// below pins the actual continuation order independently of this yield.
			await Promise.resolve();
			expect(harness.toolReturned()).toBe(false);
			expect(harness.askUser).not.toHaveBeenCalled();

			world.provider!.resolveAt(0, selectedPair(world));
			await harness.toolDone;
			expect(harness.askUser).toHaveBeenCalledTimes(1);
			// Capture at the actual continuation, not after an arbitrary drain.
			expect(harness.selectionAtContinuation()).toEqual(selectedPair(world));
			expect(harness.toolResultText()).toContain("Model/thinking selection confirmed");
			expect(harness.toolResultText()).toContain("Agent started in background.");

			// The continuation runs while child work is held: the factory gate has
			// not resolved, so no session exists yet and the record has no result.
			// The gate is test-held — only this test can resolve it — so its
			// unsettled flag is structural, not a timing observation.
			expect(record.selectedPair?.model.id).toBe("opus");
			await settleBound(() => world.factoryGates.length >= 1, "the main record's factory gate");
			expect(world.factoryGates[0].settled).toBe(false);
			expect(record.isSessionReady()).toBe(false);
			expect(record.result).toBeUndefined();

			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the main record's task gate");
			expect(record.isSessionReady()).toBe(true);
			expect(record.status).toBe("running");

			// The dialog answer does not wait for the child, and the child is
			// indifferent to it.
			harness.askUserGate.resolve("confirmed");
			await harness.turn;
			expect(record.status).toBe("running");

			world.releaseTask(0, taskDone("child finished"));
			await record.promise;
			expect(record.status).toBe("completed");
		});
	});

	describe("queued admission boundary", () => {
		it("holds the tool across admission and selection when a sibling occupies the slot", async () => {
			const world = makeWorld({ maxConcurrent: 1, withProvider: true });
			const sibling = spawnBackgroundSibling(world, "sibling work");
			const harness = startSequentialTurn(world);

			// Phase-entry signals: the sibling — admitted first — is the only one
			// parked in its selection, and the sibling's own held factory gate is
			// what keeps the slot occupied. Admission of the record under test is
			// downstream of a gate this test holds, so the tool and the following
			// ask_user are parked with it.
			const record = mainRecord(world, sibling.id);
			expect(record.status).toBe("queued");
			expect(world.provider!.select).toHaveBeenCalledTimes(1);

			// Initial pending snapshot; admission and the pair captured inside
			// askUser below provide the later ordering checkpoints.
			await Promise.resolve();
			expect(harness.toolReturned()).toBe(false);
			expect(harness.askUser).not.toHaveBeenCalled();

			// Drain the sibling: its selection, then its factory, then its task.
			world.provider!.resolveAt(0, selectedPair(world));
			await settleBound(() => world.factoryGates.length >= 1, "the sibling's factory gate");
			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the sibling's task gate");
			world.releaseTask(0, taskDone("sibling finished"));
			await sibling.promise;
			await settleBound(
				() => world.provider!.select.mock.calls.length >= 2,
				"the admitted record's selection",
			);

			// Admitted only now: the second selection reaches the provider, and
			// the tool is still held by it — the second answer is test-held.
			expect(world.provider!.select).toHaveBeenCalledTimes(2);
			expect(record.status).toBe("running");
			expect(harness.toolReturned()).toBe(false);

			world.provider!.resolveAt(0, selectedPair(world));
			await harness.toolDone;
			expect(harness.selectionAtContinuation()).toEqual(selectedPair(world));
			expect(harness.toolResultText()).toContain("Model/thinking selection confirmed");

			// The admitted record's own factory work is downstream and still held.
			await settleBound(() => world.factoryGates.length >= 2, "the main record's factory gate");
			expect(world.factoryGates[1].settled).toBe(false);
		});

		it("returns a no-provider spawn immediately while it is still queued", async () => {
			const world = makeWorld({ maxConcurrent: 1 });
			const sibling = spawnBackgroundSibling(world, "sibling work");
			const harness = startSequentialTurn(world);

			// No provider at wait time: the ordinary non-blocking return, even
			// though the record has not been admitted yet. Awaiting the real
			// execute promise is the return boundary — under a wait-that-holds
			// implementation this await would simply never resolve.
			await harness.toolDone;
			expect(harness.askUser).toHaveBeenCalledTimes(1);
			const text = harness.toolResultText();
			expect(text).toContain("Agent queued in background.");
			expect(text).toContain("Position: queued (max 1 concurrent)");
			expect(text).not.toContain("Model/thinking selection confirmed");
			const record = mainRecord(world, sibling.id);
			expect(record.status).toBe("queued");
			expect(record.isSessionReady()).toBe(false);

			harness.askUserGate.resolve("dialog answered");
			await harness.turn;

			// Admission flows on its own afterwards.
			await settleBound(() => world.factoryGates.length >= 1, "the sibling's factory gate");
			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the sibling's task gate");
			world.releaseTask(0, taskDone("sibling finished"));
			await sibling.promise;
			await settleBound(() => world.factoryGates.length >= 2, "the main record's factory gate");
			expect(record.status).toBe("running");

			world.releaseFactory(1);
			await settleBound(() => world.taskGates.length >= 2, "the main record's task gate");
			world.releaseTask(1, taskDone("child finished"));
			await record.promise;
			expect(record.status).toBe("completed");
			expect(record.result).toContain("child finished");
		});
	});

	describe("foreground whole-run boundary", () => {
		it("returns the child's outcome only after the whole run completes", async () => {
			const world = makeWorld({ withProvider: true });
			let toolReturned = false;
			const pending = world.tool
				.execute(
					"tc-1",
					{ prompt: "child work", description: "fg task", subagent_type: "general-purpose" },
					undefined,
					undefined,
					STUB_CTX,
				)
				.then((result) => {
					toolReturned = true;
					return result;
				});

			// Phase-entry signal: the foreground run parked inside its selection
			// (the provider was invoked synchronously at spawn); this test holds
			// the answer, so the tool is parked with it.
			expect(world.provider!.select).toHaveBeenCalledTimes(1);
			expect(toolReturned).toBe(false);

			world.provider!.resolveAt(0, selectedPair(world));
			// Selection has settled, but the foreground return sits behind the
			// whole-run wait — downstream of the factory and task gates, both
			// test-held — so the flag must still be down.
			expect(toolReturned).toBe(false);

			await settleBound(() => world.factoryGates.length >= 1, "the foreground record's factory gate");
			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the foreground record's task gate");
			// The whole-run wait is the only settle path left, and the task gate
			// holding it is test-held.
			expect(toolReturned).toBe(false);

			world.releaseTask(0, taskDone("child finished"));
			const text = (await pending).content[0].text;
			expect(text).toContain("child finished");
			expect(text).toContain("Agent completed");
			const record = mainRecord(world);
			expect(record.status).toBe("completed");
			expect(record.selectedPair?.model.id).toBe("opus");
		});
	});

	describe("downstream workspace boundary", () => {
		it("returns the tool result while workspace preparation is still held", async () => {
			const world = makeWorld({ withProvider: true, withWorkspace: true });
			const harness = startSequentialTurn(world);

			world.provider!.resolveAt(0, selectedPair(world));
			await harness.toolDone;

			// The tool has returned; workspace preparation is still parked on its
			// gate, so the factory behind it has not been reached.
			await settleBound(() => world.workspaceGates.length >= 1, "the workspace gate");
			expect(world.workspaceGates[0].settled).toBe(false);
			expect(world.factoryGates).toHaveLength(0);
			const record = mainRecord(world);
			expect(record.isSessionReady()).toBe(false);

			// Release the workspace; the factory boundary is reached and held next.
			world.releaseWorkspace(0);
			await settleBound(() => world.factoryGates.length >= 1, "the factory gate");
			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the task gate");
			world.releaseTask(0, taskDone("child finished"));
			await record.promise;
			expect(record.status).toBe("completed");
		});
	});

	describe("startup cancellation and failure", () => {
		it("returns did-not-start when the tool signal cancels a pending selection and ignores a late answer", async () => {
			const world = makeWorld({ withProvider: true });
			const controller = new AbortController();
			const pending = world.tool.execute("tc-1", backgroundParams(), controller.signal, undefined, STUB_CTX);
			// Phase-entry signal: the run is parked inside its selection.
			expect(world.provider!.select).toHaveBeenCalledTimes(1);

			controller.abort();
			const text = (await pending).content[0].text;
			expect(text).toContain("did not start");
			expect(text).toContain("cancelled before startup");
			const record = mainRecord(world);
			expect(record.status).toBe("stopped");
			expect(world.factoryGates).toHaveLength(0);

			// A provider answer arriving after cancellation must not start the
			// child, apply the pair, or create a session. The race already decided,
			// so the losing promise's value routes nowhere — these reads are
			// structural, not timing observations.
			world.provider!.resolveAt(0, selectedPair(world));
			expect(record.status).toBe("stopped");
			expect(world.factoryGates).toHaveLength(0);
			expect(record.selectedPair).toBeUndefined();
			expect(record.isSessionReady()).toBe(false);
		});

		it("returns did-not-start with the validation error when the answer is outside the catalogue", async () => {
			const world = makeWorld({ withProvider: true });
			const pending = world.tool.execute("tc-1", backgroundParams(), undefined, undefined, STUB_CTX);
			expect(world.provider!.select).toHaveBeenCalledTimes(1);
			world.provider!.resolveAt(0, {
				model: makeModel({ id: "ghost", name: "Ghost", provider: "astral" }),
				thinkingLevel: "off",
			});
			const text = (await pending).content[0].text;
			expect(text).toContain("did not start: model/thinking selection failed");
			expect(text).toContain("astral/ghost");
			const record = mainRecord(world);
			expect(record.status).toBe("error");
			expect(world.factoryGates).toHaveLength(0);
		});
	});

	describe("startup signal detachment", () => {
		it("does not hand the tool signal to the confirmed background task", async () => {
			const world = makeWorld({ withProvider: true });
			const controller = new AbortController();
			const pending = world.tool.execute("tc-1", backgroundParams(), controller.signal, undefined, STUB_CTX);
			// Phase-entry signal: the run is parked inside its selection.
			expect(world.provider!.select).toHaveBeenCalledTimes(1);
			world.provider!.resolveAt(0, selectedPair(world));
			const text = (await pending).content[0].text;
			expect(text).toContain("Model/thinking selection confirmed");

			const record = mainRecord(world);
			await settleBound(() => world.factoryGates.length >= 1, "the confirmed record's factory gate");
			world.releaseFactory(0);
			await settleBound(() => world.taskGates.length >= 1, "the confirmed task's gate");
			expect(record.isSessionReady()).toBe(true);

			// The startup signal fires after confirmation; a leaked listener would
			// stop the record synchronously on this abort, so the immediate read is
			// the discriminator.
			controller.abort();
			expect(record.status).toBe("running");

			world.releaseTask(0, taskDone("child finished"));
			await record.promise;
			expect(record.status).toBe("completed");
			expect(record.result).toContain("child finished");
		});
	});
});
