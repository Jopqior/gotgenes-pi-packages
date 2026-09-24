import { getEventListeners } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { InitialSpawnSelection } from "#src/lifecycle/initial-spawn-selection";
import { SelectionCancelledError } from "#src/lifecycle/spawn-selection";
import type { SpawnSelectionProvider } from "#src/service/service";
import { makeModel } from "#test/helpers/make-model";

const model = makeModel({ id: "selected", reasoning: true });
const other = makeModel({ id: "unavailable" });
const pair = { model, thinkingLevel: "high" as const };

function setup(provider?: SpawnSelectionProvider) {
	const scope = new AbortController();
	const registry = { getAvailable: vi.fn(() => [model]) };
	let current = provider;
	const owner = new InitialSpawnSelection({
		identity: { agentId: "id", agentType: "worker", description: "task" },
		registry,
		source: { activeSelectionProvider: () => current, closureSignal: scope.signal },
	});
	return { owner, registry, scope, setProvider: (next: SpawnSelectionProvider) => { current = next; } };
}

function chooser(select: SpawnSelectionProvider["select"]): SpawnSelectionProvider {
	return { select: vi.fn(select) };
}

function pending<T>() {
	return Promise.withResolvers<T>();
}

async function cancelled(promise: Promise<unknown>): Promise<void> {
	await expect(promise).rejects.toBeInstanceOf(SelectionCancelledError);
}

async function within<T>(promise: Promise<T>): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<T>((_resolve, reject) => {
		timer = setTimeout(() => reject(new Error("Selection did not release the gate")), 200);
	});
	try {
		return await Promise.race([promise, deadline]);
	} finally {
		clearTimeout(timer);
	}
}

describe("InitialSpawnSelection", () => {
	describe("admission and acknowledgement", () => {
		it("returns synchronously with no provider, settles without admission, and keeps the same outcome", async () => {
			const { owner } = setup();
			const first = owner.wait(undefined, vi.fn());
			const attempt = owner.begin(new AbortController().signal);
			expect(attempt).toBeUndefined();
			expect(owner.awaitingSelection).toBe(false);
			expect(owner.selectedPair).toBeUndefined();
			expect(owner.wait(undefined, vi.fn())).toBe(first);
			expect(await first).toEqual({ kind: "not-required" });
		});

		it("consults the live provider at admission after a queued no-provider acknowledgement", async () => {
			const { owner, setProvider } = setup();
			const first = owner.wait(undefined, vi.fn());
			const answer = pending<typeof pair>();
			const provider = chooser(() => answer.promise);
			setProvider(provider);
			const attempt = owner.begin(new AbortController().signal);
			expect(attempt).toBeDefined();
			expect(provider.select).toHaveBeenCalledWith({ agentId: "id", agentType: "worker", description: "task", availableModels: [model] }, expect.any(AbortSignal));
			expect(owner.awaitingSelection).toBe(true);
			answer.resolve(pair);
			const permit = await attempt;
			expect(permit?.pair).toEqual(pair);
			expect(owner.selectedPair).toEqual(pair);
			expect(owner.awaitingSelection).toBe(false);
			expect(await first).toEqual({ kind: "not-required" });
			expect(owner.wait(undefined, vi.fn())).toBe(first);
		});

		it("settles selected before downstream work, and the permit rejects subsequent revocation", async () => {
			const { owner, scope } = setup(chooser(async () => pair));
			const outcome = owner.wait(undefined, vi.fn());
			const permit = await owner.begin(new AbortController().signal);
			expect(await outcome).toEqual({ kind: "selected" });
			expect(permit?.pair).toEqual(pair);
			permit?.assertLive();
			scope.abort();
			expect(() => permit?.assertLive()).toThrow();
			expect(owner.selectedPair).toEqual(pair);
			expect(await outcome).toEqual({ kind: "selected" });
		});
	});

	describe("attempt cancellation and validation", () => {
		it("does not invoke a provider when the run was already aborted", async () => {
			const provider = chooser(async () => pair);
			const { owner } = setup(provider);
			const run = new AbortController();
			run.abort();
			const attempt = owner.begin(run.signal);
			expect(attempt).toBeDefined();
			await cancelled(attempt as Promise<unknown>);
			expect(provider.select).not.toHaveBeenCalled();
			expect(owner.awaitingSelection).toBe(false);
		});

		it("releases an ignored-abort provider without awaiting its answer and drains its late rejection", async () => {
			const answer = pending<typeof pair>();
			const { owner } = setup(chooser(() => answer.promise));
			const run = new AbortController();
			const attempt = owner.begin(run.signal);
			expect(owner.awaitingSelection).toBe(true);
			run.abort();
			try {
				await cancelled(within(attempt as Promise<unknown>));
				expect(owner.awaitingSelection).toBe(false);
				expect(owner.selectedPair).toBeUndefined();
			} finally {
				void attempt?.catch(() => {});
				answer.reject(new Error("late rejection"));
			}
			await Promise.resolve();
		});

		it("drops a late answer after cancellation", async () => {
			const answer = pending<typeof pair>();
			const { owner } = setup(chooser(() => answer.promise));
			const run = new AbortController();
			const attempt = owner.begin(run.signal);
			run.abort();
			try {
				await cancelled(within(attempt as Promise<unknown>));
			} finally {
				void attempt?.catch(() => {});
				answer.resolve(pair);
			}
			await Promise.resolve();
			expect(owner.selectedPair).toBeUndefined();
		});

		it("rechecks cancellation after asynchronous validation before storing a pair", async () => {
			const { owner, registry } = setup(chooser(async () => pair));
			const run = new AbortController();
			registry.getAvailable
				.mockImplementationOnce(() => [model])
				.mockImplementationOnce(() => { run.abort(); return [model]; });
			const attempt = owner.begin(run.signal);
			await cancelled(attempt as Promise<unknown>);
			expect(owner.selectedPair).toBeUndefined();
			expect(owner.awaitingSelection).toBe(false);
		});

		it("rejects an unavailable answer without storing a provisional pair", async () => {
			const { owner } = setup(chooser(async () => ({ model: other, thinkingLevel: "high" })));
			await expect(owner.begin(new AbortController().signal)).rejects.toThrow(/not in the available catalogue/);
			expect(owner.selectedPair).toBeUndefined();
			expect(owner.awaitingSelection).toBe(false);
		});

		it("treats an undefined answer as selection cancellation", async () => {
			const { owner } = setup(chooser(async () => undefined));
			await cancelled(owner.begin(new AbortController().signal) as Promise<unknown>);
			expect(owner.selectedPair).toBeUndefined();
		});
	});

	describe("startup listeners and terminal settlement", () => {
		it("dispatches queued cancellation and detaches both startup listeners at terminal settlement", async () => {
			const { owner, scope } = setup(chooser(async () => pair));
			const startup = new AbortController();
			const cancel = vi.fn(() => owner.finished({ stopped: true, error: undefined }));
			const result = owner.wait(startup.signal, cancel);
			expect(getEventListeners(startup.signal, "abort")).toHaveLength(1);
			expect(getEventListeners(scope.signal, "abort")).toHaveLength(1);
			startup.abort();
			expect(cancel).toHaveBeenCalledTimes(1);
			expect(await result).toEqual({ kind: "stopped" });
			expect(getEventListeners(startup.signal, "abort")).toHaveLength(0);
			expect(getEventListeners(scope.signal, "abort")).toHaveLength(0);
			scope.abort();
			expect(cancel).toHaveBeenCalledTimes(1);
		});

		it("detaches startup cancellation at confirmation, leaving the running task alone", async () => {
			const { owner, scope } = setup(chooser(async () => pair));
			const startup = new AbortController();
			const cancel = vi.fn();
			const result = owner.wait(startup.signal, cancel);
			await owner.begin(new AbortController().signal);
			expect(await result).toEqual({ kind: "selected" });
			expect(getEventListeners(startup.signal, "abort")).toHaveLength(0);
			expect(getEventListeners(scope.signal, "abort")).toHaveLength(0);
			startup.abort();
			expect(cancel).not.toHaveBeenCalled();
		});

		it("records a stopped error (including empty text) as failed and never overwrites it", async () => {
			const { owner } = setup(chooser(async () => pair));
			const result = owner.wait(undefined, vi.fn());
			owner.finished({ stopped: true, error: "" });
			owner.finished({ stopped: true, error: undefined });
			expect(await result).toEqual({ kind: "failed", error: "" });
			expect(owner.wait(undefined, vi.fn())).toBe(result);
		});

		it("cannot overwrite an acknowledged no-provider result with a late selected or failed result", async () => {
			const { owner, setProvider } = setup();
			const result = owner.wait(undefined, vi.fn());
			setProvider(chooser(async () => pair));
			await owner.begin(new AbortController().signal);
			owner.finished({ stopped: true, error: "later" });
			expect(owner.wait(undefined, vi.fn())).toBe(result);
			expect(await result).toEqual({ kind: "not-required" });
		});
	});

	describe("unfinished disposal", () => {
		it("cancels a late active attempt despite an earlier no-provider acknowledgement", async () => {
			const answer = pending<typeof pair>();
			const { owner, setProvider } = setup();
			const result = owner.wait(undefined, vi.fn());
			setProvider(chooser(() => answer.promise));
			const run = new AbortController();
			const attempt = owner.begin(run.signal);
			const cancel = vi.fn(() => run.abort());
			try {
				expect(owner.cancelUnfinished(cancel)).toBe(true);
				expect(cancel).toHaveBeenCalledTimes(1);
				await cancelled(within(attempt as Promise<unknown>));
				expect(await result).toEqual({ kind: "not-required" });
			} finally {
				run.abort();
				void attempt?.catch(() => {});
				answer.resolve(pair);
			}
		});

		it("cancels a queued provider and settles through the caller's terminal notification", async () => {
			const { owner } = setup(chooser(async () => pair));
			const outcome = owner.wait(undefined, vi.fn());
			const cancel = vi.fn(() => owner.finished({ stopped: true, error: undefined }));
			expect(owner.cancelUnfinished(cancel)).toBe(true);
			expect(cancel).toHaveBeenCalledTimes(1);
			expect(await outcome).toEqual({ kind: "stopped" });
		});

		it("does not cancel confirmed selection or an admitted ordinary task", async () => {
			const selected = setup(chooser(async () => pair)).owner;
			await selected.begin(new AbortController().signal);
			const ordinary = setup().owner;
			expect(ordinary.begin(new AbortController().signal)).toBeUndefined();
			const cancel = vi.fn();
			expect(selected.cancelUnfinished(cancel)).toBe(false);
			expect(ordinary.cancelUnfinished(cancel)).toBe(false);
			expect(cancel).not.toHaveBeenCalled();
		});
	});
});
