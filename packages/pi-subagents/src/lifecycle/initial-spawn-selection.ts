import type { SelectionScopeHandle } from "#src/lifecycle/selection-scope";
import { SelectionCancelledError } from "#src/lifecycle/spawn-selection";
import type { SpawnSelection, SpawnSelectionProvider, SpawnSelectionRequest } from "#src/service/service";
import type { ModelRegistry } from "#src/session/model-resolver";
import {
	readSelectionChoices,
	type ValidatedSpawnSelection,
	validateSpawnSelection,
} from "#src/session/selection-catalogue";

/** The initial spawn milestone, independent of the entire run's completion. */
export type SpawnSelectionOutcome =
	| { kind: "not-required" }
	| { kind: "selected" }
	| { kind: "stopped" }
	| { kind: "failed"; error: string };

export interface SelectionPermit {
	readonly pair: ValidatedSpawnSelection;
	readonly signal: AbortSignal;
	assertLive(): void;
}

export interface InitialRunTerminal {
	stopped: boolean;
	error: string | undefined;
}

/** Record-facing contract; neither session construction nor execution state belongs here. */
export interface InitialSelection {
	readonly awaitingSelection: boolean;
	readonly selectedPair: ValidatedSpawnSelection | undefined;
	begin(runSignal: AbortSignal): Promise<SelectionPermit> | undefined;
	wait(signal: AbortSignal | undefined, cancelStartup: () => void): Promise<SpawnSelectionOutcome>;
	cancelUnfinished(cancelStartup: () => void): boolean;
	finished(terminal: InitialRunTerminal): void;
}

type SelectionSource = Pick<SelectionScopeHandle, "activeSelectionProvider" | "closureSignal">;
type SpawnIdentity = Pick<SpawnSelectionRequest, "agentId" | "agentType" | "description">;
type Availability = Pick<ModelRegistry, "getAvailable">;

/** Owns the initial attempt and its one-shot tool acknowledgement separately. */
export class InitialSpawnSelection implements InitialSelection {
	private readonly identity: SpawnIdentity;
	private readonly registry: Availability;
	private readonly source: SelectionSource | undefined;
	private readonly outcome = Promise.withResolvers<SpawnSelectionOutcome>();
	private settled = false;
	private pending = false;
	private pair: ValidatedSpawnSelection | undefined;
	private readonly startupDetachers = new Set<() => void>();

	constructor({ identity, registry, source }: {
		identity: SpawnIdentity;
		registry: Availability;
		source?: SelectionSource;
	}) {
		this.identity = identity;
		this.registry = registry;
		this.source = source;
	}

	get awaitingSelection(): boolean { return this.pending; }
	get selectedPair(): ValidatedSpawnSelection | undefined { return this.pair; }

	/** Consult registration at admission, even if an earlier queued wait was acknowledged. */
	begin(runSignal: AbortSignal): Promise<SelectionPermit> | undefined {
		const source = this.source;
		const provider = source?.activeSelectionProvider();
		if (!source || !provider) {
			this.settle({ kind: "not-required" });
			return undefined;
		}
		const signal = AbortSignal.any([runSignal, source.closureSignal]);
		this.pending = true;
		return this.select(provider, signal);
	}

	private async select(provider: SpawnSelectionProvider, signal: AbortSignal): Promise<SelectionPermit> {
		try {
			assertLive(signal);
			const choices = readSelectionChoices(this.registry);
			const answer = await raceProviderCancellation(
				provider.select({ ...this.identity, availableModels: choices }, signal),
				signal,
			);
			if (answer === undefined) throw new SelectionCancelledError();
			const pair = await validateSpawnSelection(answer, choices, this.registry);
			assertLive(signal);
			this.pair = pair;
			this.pending = false;
			this.settle({ kind: "selected" });
			return { pair, signal, assertLive: () => assertLive(signal) };
		} finally {
			this.pending = false;
		}
	}

	/** Startup signals stop the record only until the one-shot milestone settles. */
	wait(signal: AbortSignal | undefined, cancelStartup: () => void): Promise<SpawnSelectionOutcome> {
		if (this.settled) return this.outcome.promise;
		if (!this.required()) {
			this.settle({ kind: "not-required" });
			return this.outcome.promise;
		}
		this.attachStartupCancellation(signal, cancelStartup);
		return this.outcome.promise;
	}

	private required(): boolean {
		if (!this.source) return false;
		return this.source.closureSignal.aborted || this.pending || this.source.activeSelectionProvider() !== undefined;
	}

	private attachStartupCancellation(signal: AbortSignal | undefined, cancelStartup: () => void): void {
		const closure = this.source?.closureSignal;
		if (signal?.aborted || closure?.aborted) {
			cancelStartup();
			return;
		}
		const watch = (source: AbortSignal) => {
			const controller = new AbortController();
			const detach = () => controller.abort();
			this.startupDetachers.add(detach);
			source.addEventListener("abort", () => {
				this.startupDetachers.delete(detach);
				detach();
				cancelStartup();
			}, { once: true, signal: controller.signal });
		};
		if (signal) watch(signal);
		if (closure) watch(closure);
	}

	/** A late provider can be active even after an earlier no-provider acknowledgement. */
	cancelUnfinished(cancelStartup: () => void): boolean {
		if (!this.pending && (this.settled || !this.required())) return false;
		cancelStartup();
		return true;
	}

	/** Called after the record's original terminal observer, not on resume. */
	finished(terminal: InitialRunTerminal): void {
		if (terminal.error !== undefined) this.settle({ kind: "failed", error: terminal.error });
		else if (terminal.stopped) this.settle({ kind: "stopped" });
	}

	private settle(value: SpawnSelectionOutcome): void {
		if (this.settled) return;
		this.settled = true;
		const detachers = [...this.startupDetachers];
		this.startupDetachers.clear();
		for (const detach of detachers) detach();
		this.outcome.resolve(value);
	}
}

function assertLive(signal: AbortSignal): void {
	if (signal.aborted) throw new SelectionCancelledError();
}

/** The losing provider promise is observed, never allowed to hold a cancelled run. */
function raceProviderCancellation(
	answer: Promise<SpawnSelection | undefined>,
	signal: AbortSignal,
): Promise<SpawnSelection | undefined> {
	if (signal.aborted) {
		observeQuietly(answer);
		return Promise.reject(new SelectionCancelledError());
	}
	const detach = new AbortController();
	const cancelled = new Promise<never>((_resolve, reject) => {
		signal.addEventListener("abort", () => {
			observeQuietly(answer);
			reject(new SelectionCancelledError());
		}, { once: true, signal: detach.signal });
	});
	return Promise.race([answer, cancelled]).finally(() => detach.abort());
}

function observeQuietly(answer: Promise<SpawnSelection | undefined>): void {
	answer.catch(() => {});
}
