import type { InitialRunTerminal, InitialSelection, SelectionPermit, SpawnSelectionOutcome } from "#src/lifecycle/initial-spawn-selection";

/** Passive presentation fixture: a runnable record must inject InitialSpawnSelection instead. */
export function makeInitialSelection(values: Pick<InitialSelection, "awaitingSelection" | "selectedPair">): InitialSelection {
	return {
		...values,
		begin: (_signal: AbortSignal): Promise<SelectionPermit> | undefined => {
			throw new Error("Passive selection fixture cannot start a run");
		},
		wait: (_signal: AbortSignal | undefined, _cancel: () => void): Promise<SpawnSelectionOutcome> => {
			throw new Error("Passive selection fixture cannot wait for startup");
		},
		cancelUnfinished: (_cancel: () => void): boolean => {
			throw new Error("Passive selection fixture cannot cancel startup");
		},
		finished: (_terminal: InitialRunTerminal): void => {
			throw new Error("Passive selection fixture cannot finish a run");
		},
	};
}
