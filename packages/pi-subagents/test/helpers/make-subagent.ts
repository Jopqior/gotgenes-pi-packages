import type { CreateSubagentSessionParams } from "#src/lifecycle/create-subagent-session";
import { type InitialSelection, InitialSpawnSelection } from "#src/lifecycle/initial-spawn-selection";
import { Subagent, type SubagentExecution } from "#src/lifecycle/subagent";
import type { SubagentSession } from "#src/lifecycle/subagent-session";
import { SubagentState, type SubagentStatus } from "#src/lifecycle/subagent-state";
import type { SubagentType } from "#src/types";
import { makeInitialSelection } from "#test/helpers/make-initial-selection";
import { createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";
import { STUB_SNAPSHOT } from "#test/helpers/stub-ctx";

/**
 * A minimal, mandatory SubagentExecution for tests that build a passive record
 * and never call run(). The factory resolves to a default session stub.
 */
export function makeStubExecution(overrides: Partial<SubagentExecution> = {}): SubagentExecution {
	return {
		createSubagentSession: async (_params: CreateSubagentSessionParams): Promise<SubagentSession> =>
			toSubagentSession(createSubagentSessionStub()),
		snapshot: STUB_SNAPSHOT,
		prompt: "do something",
		baseCwd: "",
		...overrides,
	};
}

export interface TestSubagentOptions {
	id?: string;
	type?: SubagentType;
	description?: string;
	/** Defaults to true so a fixture survives the widget's background-only filter. */
	isBackground?: boolean;
	execution?: SubagentExecution;
	/** Override the passive owner only when intentionally running this fixture. */
	selection?: InitialSelection;
	/** Shorthand to set execution.parentSession.toolCallId. Ignored when execution is supplied. */
	toolCallId?: string;
	/** Passive lifecycle state shorthands. */
	status?: SubagentStatus;
	result?: string;
	/** Seed the question the agent ended its turn with. */
	pendingQuestion?: string;
	/** Seed what a teardown with no result text reported. */
	workspaceNotice?: string;
	error?: string;
	/** Seed the never-started marker (the agent was stopped before it was admitted). */
	stoppedWhileQueued?: boolean;
	startedAt?: number;
	completedAt?: number;
	/** Seed the consumed-outcome timestamp (undefined = obligation open). */
	consumedAt?: number;
	/** Seed toolUses. */
	toolUses?: number;
	/** Seed lifetimeUsage. */
	lifetimeUsage?: { input: number; output: number; cacheWrite: number };
	/** Seed compactionCount. */
	compactionCount?: number;
	/**
	 * Set turnCount. Starts at 1; pass a higher value to simulate multiple turns.
	 * Ignored when `execution` is supplied (maxTurns lives on the execution, not state).
	 */
	turnCount?: number;
	/** Seed active tools by name. */
	activeTools?: string[];
	/** Seed the run's updates, in order (each replays recordUpdate). */
	runUpdates?: string[];
	/** Seed private pending-selection activity. */
	awaitingSelection?: boolean;
	/** Seed the pair spawn selection already chose. */
	selectedPair?: InitialSelection["selectedPair"];
	/** Seed responseText. */
	responseText?: string;
	/** Thread maxTurns into the stub execution. Ignored when `execution` is supplied. */
	maxTurns?: number;
	/**
	 * Attach a session stub after construction, so the record reads as
	 * session-ready. Defaults to false: a passive fixture has never run, so it has
	 * no session, which is what most callers want.
	 */
	sessionReady?: boolean;
	/**
	 * Transcript path the attached session stub reports. Ignored unless
	 * `sessionReady` is set — a record with no session has no transcript.
	 */
	outputFile?: string;
}

/** Runnable variant: every run uses the real owner rather than the passive presentation fixture. */
export function createRunnableTestSubagent(overrides: TestSubagentOptions = {}): Subagent {
	return createTestSubagent({
		...overrides,
		selection: new InitialSpawnSelection({
			identity: {
				agentId: overrides.id ?? "agent-1",
				agentType: overrides.type ?? "general-purpose",
				description: overrides.description ?? "Test task",
			},
			registry: overrides.execution?.snapshot.modelRegistry ?? STUB_SNAPSHOT.modelRegistry,
		}),
	});
}

export function createTestSubagent(overrides: TestSubagentOptions = {}): Subagent {
	const { id, type, description, isBackground, execution, selection, toolCallId, toolUses, lifetimeUsage, compactionCount, turnCount, activeTools, responseText, runUpdates, awaitingSelection, selectedPair, maxTurns, sessionReady, outputFile, ...stateOverrides } =
		overrides;
	const state = new SubagentState({
		status: "completed",
		result: "All done.",
		startedAt: 1000,
		completedAt: 2000,
		toolUses: toolUses ?? 3,
		lifetimeUsage: lifetimeUsage ?? { input: 500, output: 500, cacheWrite: 0 },
		...(compactionCount !== undefined ? { compactionCount } : {}),
		...(turnCount !== undefined ? { turnCount } : {}),
		...(activeTools !== undefined ? { activeTools } : {}),
		...(responseText !== undefined ? { responseText } : {}),
		...stateOverrides,
	});
	for (const update of runUpdates ?? []) state.recordUpdate(update);
	const agent = new Subagent({
		id: id ?? "agent-1",
		type: type ?? "general-purpose",
		description: description ?? "Test task",
		isBackground: isBackground ?? true,
		execution: execution ?? makeStubExecution({
			...(toolCallId ? { parentSession: { toolCallId } } : {}),
			...(maxTurns !== undefined ? { maxTurns } : {}),
		}),
		state,
		selection: selection ?? makeInitialSelection({ awaitingSelection: awaitingSelection ?? false, selectedPair }),
	});
	// Assigned rather than passed to the constructor: run() is what sets this in
	// production, and a passive fixture never runs.
	if (sessionReady) {
		agent.subagentSession = toSubagentSession(createSubagentSessionStub(undefined, outputFile));
	}
	return agent;
}
