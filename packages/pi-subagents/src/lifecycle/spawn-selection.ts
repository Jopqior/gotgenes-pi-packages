/**
 * spawn-selection.ts — Lease ownership for per-spawn selection.
 *
 * `SpawnSelectionScope` is one root runtime generation's provider lease; a
 * descendant runtime never gets its own lease but a `ChildSelectionScope`
 * handle to the root's. The lease distinguishes never-configured, active, and
 * revoked: a revoked lease is denied forever (a new root session is a new
 * scope), and closing a child frees only that child's subtree — never the root
 * or a sibling.
 *
 * The construction wrapper is deliberately unconditional: it establishes a
 * child handle before any loader activity even when the root has never
 * configured a provider, so a descendant's registration is `inherited` by
 * construction rather than by a configured-only branch.
 */

import { randomUUID } from "node:crypto";
import { runInConstructionContext, type SelectionScopeHandle } from "#src/lifecycle/selection-scope";
import type { SpawnSelectionProvider, SpawnSelectionRegistration } from "#src/service/service";

/** The three lease states a root's selection scope moves through, in order. */
export type SelectionLeaseState = "unconfigured" | "active" | "revoked";

/** A handle a construction wrapper created and a runtime may or may not retain. */
interface ConstructedHandle extends SelectionScopeHandle {
	/** True once a runtime captured this handle as its retained dependency. */
	wasRetained(): boolean;
}

/** The closed-handle denial every new construction from a closed scope reads. */
function closedScopeError(): Error {
	return new Error("Spawn selection scope is closed; no further child can be created from it.");
}

/**
 * The root runtime generation's selection lease.
 *
 * Created by the extension factory when no ambient construction context exists
 * (the root); captured — never re-created — when one does (a descendant).
 */
export class SpawnSelectionScope implements SelectionScopeHandle {
	readonly rootId: string;

	private leaseState: SelectionLeaseState = "unconfigured";
	private provider?: SpawnSelectionProvider;
	private readonly children = new Set<ChildSelectionScope>();

	constructor() {
		this.rootId = `spawn-selection-${randomUUID()}`;
	}

	/** The lease's current state — unconfigured, active, or revoked. */
	get state(): SelectionLeaseState {
		return this.leaseState;
	}

	/** The registered provider, defined only while the lease is active. */
	get activeProvider(): SpawnSelectionProvider | undefined {
		return this.leaseState === "active" ? this.provider : undefined;
	}

	/** How many direct child handles are still open (diagnostics and tests). */
	get openChildCount(): number {
		return this.children.size;
	}

	/**
	 * Register the single provider this root's tree will consult. Only an
	 * unconfigured root accepts one: a second registration on an active lease
	 * and any registration on a revoked lease are both refused — a closed
	 * generation cannot reactivate itself.
	 */
	register(provider: SpawnSelectionProvider): SpawnSelectionRegistration {
		if (this.leaseState === "active") {
			throw new Error("A spawn selection provider is already registered for this session.");
		}
		if (this.leaseState === "revoked") {
			throw new Error(
				"This session's spawn selection scope is closed; a new session is required to register a provider.",
			);
		}
		this.provider = provider;
		this.leaseState = "active";
		let disposed = false;
		return {
			kind: "owned",
			dispose: () => {
				if (disposed) return;
				disposed = true;
				this.revoke();
			},
		};
	}

	/**
	 * Revoke the lease: deny every later registration and construction, and
	 * close all descendant handles. Idempotent.
	 */
	revoke(): void {
		if (this.leaseState === "revoked") return;
		this.leaseState = "revoked";
		this.provider = undefined;
		const children = [...this.children];
		this.children.clear();
		for (const child of children) child.close();
	}

	constructChild<T>(thunk: () => Promise<T>): Promise<T> {
		if (this.leaseState === "revoked") return Promise.reject(closedScopeError());
		return this.adoptChild(new ChildSelectionScope(this), thunk);
	}

	close(): void {
		this.revoke();
	}

	/** A root is never retained by a construction wrapper — it owns itself. */
	retain(): void {
		/* no-op: the root's lifetime is the runtime's, not a thunk's */
	}

	/** Wrap a freshly created child handle and track it as open. */
	private adoptChild<T>(child: ChildSelectionScope, thunk: () => Promise<T>): Promise<T> {
		this.children.add(child);
		return runInConstructionContext(child, thunk).finally(() => {
			if (child.isClosed()) this.children.delete(child);
		});
	}

	/** Detach a child that closed itself (its own shutdown path). */
	detach(child: ChildSelectionScope): void {
		this.children.delete(child);
	}
}

/**
 * A descendant's non-owning handle to the root's lease. Captured during the
 * child core factory's initialization and retained for the child runtime's
 * lifetime; registration is denied here (`inherited`) whatever the root's
 * state, so a child can neither install nor revoke the root's provider.
 */
export class ChildSelectionScope implements ConstructedHandle {
	readonly rootId: string;

	private closed = false;
	private retained = false;
	private readonly children = new Set<ChildSelectionScope>();

	/** Created only by a construction wrapper — the root or a parent child handle. */
	constructor(private readonly root: SpawnSelectionScope) {
		this.rootId = root.rootId;
	}

	// fallow-ignore-next-line unused-class-member -- reached via SelectionScopeHandle dispatch (a descendant's own spawns)
	constructChild<T>(thunk: () => Promise<T>): Promise<T> {
		if (this.closed) return Promise.reject(closedScopeError());
		const grandchild = new ChildSelectionScope(this.root);
		this.children.add(grandchild);
		return runInConstructionContext(grandchild, thunk).finally(() => {
			if (grandchild.isClosed()) this.children.delete(grandchild);
		});
	}

	/**
	 * The denied registration: installs nothing, touches nothing. Applies to a
	 * live handle and a closed one alike — a closed inherited lease stays
	 * denied rather than becoming installable or throwing.
	 */
	// fallow-ignore-next-line unused-class-member -- reached via SelectionScopeHandle dispatch (runtime.registerSpawnSelectionProvider)
	register(_provider: SpawnSelectionProvider): SpawnSelectionRegistration {
		return { kind: "inherited", dispose: () => {} };
	}

	// fallow-ignore-next-line unused-class-member -- reached via SelectionScopeHandle dispatch (captureInheritedSelectionScope)
	retain(): void {
		this.retained = true;
	}

	wasRetained(): boolean {
		return this.retained;
	}

	/** True once this handle (or the root's revocation) closed it. */
	isClosed(): boolean {
		return this.closed;
	}

	/**
	 * Close this handle and its subtree only. The root's lease and unrelated
	 * siblings are untouched; the root stops tracking this child.
	 */
	close(): void {
		if (this.closed) return;
		this.closed = true;
		const children = [...this.children];
		this.children.clear();
		for (const child of children) child.close();
		this.root.detach(this);
	}
}
