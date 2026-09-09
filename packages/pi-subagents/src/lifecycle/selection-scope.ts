/**
 * selection-scope.ts — Shared construction-context carrier for spawn selection.
 *
 * The carrier is the one piece of selection state that must survive separate
 * module evaluations: Pi jiti-loads extension sources per session (and clears
 * its module cache when consecutive children resolve different cwds), so a
 * module-level carrier would hand a child core a channel its root never
 * established. The carrier therefore lives on `globalThis` behind a
 * `Symbol.for()` key — every instance of this module in the process shares it.
 *
 * Its stored value is a scope handle, never a process-wide flag or singleton:
 * ownership, lease state, and registration live on the handle (see
 * `spawn-selection.ts`), one per root runtime generation.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { SpawnSelectionProvider, SpawnSelectionRegistration } from "#src/service/service";

/** What a core factory captures at initialization and retains as a runtime dependency. */
export interface SelectionScopeHandle {
	/** Root generation identity — shared by every handle derived from one root. */
	readonly rootId: string;
	/**
	 * The registration boundary: `owned` on a root lease, `inherited` (nothing
	 * installed) on a descendant handle, whatever the root's state.
	 */
	register(provider: SpawnSelectionProvider): SpawnSelectionRegistration;
	/**
	 * Wrap the complete child factory call in the construction context: the
	 * context is active for everything the thunk does, including the resource
	 * loader's reload and the child extension factories it awaits.
	 *
	 * The thunk is invoked synchronously, so the no-provider timing pins hold.
	 * Rejects when this handle is already closed — a revoked lease prohibits
	 * subsequent creation.
	 */
	constructChild<T>(thunk: () => Promise<T>): Promise<T>;
	/**
	 * Invalidate this handle and its pending subtree. Owner-aware: on a root it
	 * revokes the lease (signalling descendants); on a child it frees only that
	 * child's subtree, never the root or a sibling.
	 */
	close(): void;
	/**
	 * Record that a runtime now owns this handle, so the construction wrapper
	 * that created it leaves it open once the factory call settles. Internal
	 * machinery — called by {@link captureInheritedSelectionScope}.
	 */
	retain(): void;
}

/** The process-wide construction carrier behind the shared symbol. */
interface SelectionCarrier {
	als: AsyncLocalStorage<SelectionScopeHandle>;
}

const CARRIER_KEY = Symbol.for("@gotgenes/pi-subagents:selection-construction-carrier");

function carrier(): SelectionCarrier {
	const globals = globalThis as Record<symbol, unknown>;
	let existing = globals[CARRIER_KEY] as SelectionCarrier | undefined;
	if (existing === undefined) {
		existing = { als: new AsyncLocalStorage<SelectionScopeHandle>() };
		globals[CARRIER_KEY] = existing;
	}
	return existing;
}

/**
 * The ambient scope handle, visible only inside a construction context —
 * a child core factory calls this during its initialization and retains the
 * result for its whole lifetime. Retains the handle: capturing is the
 * retention point, so the construction wrapper leaves it open once the factory
 * call settles.
 */
export function captureInheritedSelectionScope(): SelectionScopeHandle | undefined {
	const handle = carrier().als.getStore();
	handle?.retain();
	return handle;
}

/**
 * Run `thunk` with `handle` as the ambient construction context, releasing the
 * handle again if no runtime captured it.
 *
 * Failure always releases the handle; success releases it only when nobody
 * retained it (a child that never loaded this core has no runtime to close the
 * handle later, so the wrapper is its only cleanup).
 */
export function runInConstructionContext<T>(
	handle: SelectionScopeHandle & { wasRetained(): boolean },
	thunk: () => Promise<T>,
): Promise<T> {
	const settled = carrier().als.run(handle, thunk);
	return settled.then(
		(result) => {
			if (!handle.wasRetained()) handle.close();
			return result;
		},
		(err: unknown) => {
			handle.close();
			throw err;
		},
	);
}
