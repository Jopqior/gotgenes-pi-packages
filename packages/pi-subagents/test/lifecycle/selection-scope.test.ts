import { describe, expect, it, vi } from "vitest";
import { captureInheritedSelectionScope, type SelectionScopeHandle } from "#src/lifecycle/selection-scope";
import { ChildSelectionScope, SpawnSelectionScope } from "#src/lifecycle/spawn-selection";

describe("SpawnSelectionScope — lease states", () => {
  it("starts unconfigured, with no active provider", () => {
    const scope = new SpawnSelectionScope();
    expect(scope.state).toBe("unconfigured");
    expect(scope.activeProvider).toBeUndefined();
  });

  it("becomes active with the registered provider", () => {
    const scope = new SpawnSelectionScope();
    const provider = { select: vi.fn() };
    scope.register(provider);
    expect(scope.state).toBe("active");
    expect(scope.activeProvider).toBe(provider);
  });

  it("rejects a second registration on an active root", () => {
    const scope = new SpawnSelectionScope();
    scope.register({ select: vi.fn() });
    expect(() => scope.register({ select: vi.fn() })).toThrow(/already registered/i);
  });

  it("rejects registration on a revoked root — revocation is not the unconfigured state", () => {
    const scope = new SpawnSelectionScope();
    scope.register({ select: vi.fn() });
    scope.revoke();
    expect(scope.state).toBe("revoked");
    expect(() => scope.register({ select: vi.fn() })).toThrow(/closed/i);
  });

  it("an owned disposer revokes the lease and is idempotent", () => {
    const scope = new SpawnSelectionScope();
    const registration = scope.register({ select: vi.fn() });
    expect(registration.kind).toBe("owned");

    registration.dispose();
    expect(scope.state).toBe("revoked");

    // Idempotent: a second dispose is a no-op, not a throw.
    expect(() => registration.dispose()).not.toThrow();
  });

  it("drops the provider when the lease is revoked", () => {
    const scope = new SpawnSelectionScope();
    scope.register({ select: vi.fn() });
    scope.revoke();
    expect(scope.activeProvider).toBeUndefined();
  });
});

describe("SpawnSelectionScope — construction context", () => {
  it("invokes the factory thunk synchronously, before constructChild returns", () => {
    const scope = new SpawnSelectionScope();
    let invoked = false;
    void scope.constructChild(() => {
      invoked = true;
      return new Promise<void>(() => {});
    });
    expect(invoked).toBe(true);
    scope.revoke();
  });

  it("exposes the child handle inside the context, carrying the root's identity", async () => {
    const scope = new SpawnSelectionScope();
    const seen = await scope.constructChild(async () => captureInheritedSelectionScope());
    expect(seen).toBeDefined();
    expect(seen!.rootId).toBe(scope.rootId);
    expect(seen).toBeInstanceOf(ChildSelectionScope);
  });

  it("returns undefined outside any construction context", () => {
    expect(captureInheritedSelectionScope()).toBeUndefined();
  });

  it("nests: a grandchild handle shares the root's identity but is its own handle", async () => {
    const root = new SpawnSelectionScope();
    const grandchild = await root.constructChild(async () => {
      const child = captureInheritedSelectionScope()!;
      return child.constructChild(async () => captureInheritedSelectionScope());
    });
    expect(grandchild).toBeDefined();
    expect(grandchild!.rootId).toBe(root.rootId);
    expect(grandchild).not.toBe(root);
  });

  it("closes the construction handle when the factory thunk fails", async () => {
    const root = new SpawnSelectionScope();
    const child = await root.constructChild(async () => captureInheritedSelectionScope());
    // Retained by the capture above — close it, then verify failed construction
    // closes a fresh handle the same way.
    child!.close();

    let handleFromFailingRun: SelectionScopeHandle | undefined;
    await expect(
      root.constructChild(async () => {
        handleFromFailingRun = captureInheritedSelectionScope();
        throw new Error("loader exploded");
      }),
    ).rejects.toThrow("loader exploded");
    // A failed construction releases its handle: further construction from it is denied.
    await expect(handleFromFailingRun!.constructChild(async () => undefined)).rejects.toThrow(/closed/i);
  });

  it("closes a handle no runtime retained once construction settles", async () => {
    const root = new SpawnSelectionScope();
    expect(root.openChildCount).toBe(0);
    // The thunk captures nothing, so no child runtime exists to own the handle.
    await root.constructChild(async () => undefined);
    expect(root.openChildCount).toBe(0);
  });

  it("keeps a captured handle open after construction settles", async () => {
    const root = new SpawnSelectionScope();
    const child = await root.constructChild(async () => captureInheritedSelectionScope());
    expect(root.openChildCount).toBe(1);
    child!.close();
    expect(root.openChildCount).toBe(0);
  });
});

describe("SpawnSelectionScope — revocation", () => {
  it("closes every open child when the root lease is revoked", async () => {
    const root = new SpawnSelectionScope();
    const child = await root.constructChild(async () => captureInheritedSelectionScope());
    expect(root.openChildCount).toBe(1);

    root.revoke();

    await expect(child!.constructChild(async () => undefined)).rejects.toThrow(/closed/i);
  });

  it("denies new construction from a revoked root", async () => {
    const root = new SpawnSelectionScope();
    root.revoke();
    await expect(root.constructChild(async () => undefined)).rejects.toThrow(/closed/i);
  });
});

describe("ChildSelectionScope — non-owning registration", () => {
  async function makeChild(): Promise<{ root: SpawnSelectionScope; child: ChildSelectionScope }> {
    const root = new SpawnSelectionScope();
    const child = await root.constructChild(async () => captureInheritedSelectionScope());
    return { root, child: child as ChildSelectionScope };
  }

  it("returns an inherited registration without installing the provider", async () => {
    const { root, child } = await makeChild();
    const provider = { select: vi.fn() };

    const registration = child.register(provider);

    expect(registration.kind).toBe("inherited");
    // Nothing was installed: the root stays unconfigured.
    expect(root.state).toBe("unconfigured");
    expect(root.activeProvider).toBeUndefined();
  });

  it("leaves root ownership untouched — a child cannot revoke or replace the root's lease", async () => {
    const { root, child } = await makeChild();
    const provider = { select: vi.fn() };
    const owned = root.register(provider);

    child.register({ select: vi.fn() });
    expect(root.activeProvider).toBe(provider);

    // Closing the child (its own shutdown) must not revoke the root's lease.
    child.close();
    expect(root.state).toBe("active");
    expect(root.activeProvider).toBe(provider);

    owned.dispose();
  });

  it("an inherited disposer is a no-op and never releases the root's lease", async () => {
    const { root, child } = await makeChild();
    const owned = root.register({ select: vi.fn() });

    child.register({ select: vi.fn() }).dispose();
    expect(root.state).toBe("active");

    owned.dispose();
  });

  it("stays denied (never owned) on a closed child handle, without touching the root", async () => {
    const { root, child } = await makeChild();
    const owned = root.register({ select: vi.fn() });
    child.close();

    const registration = child.register({ select: vi.fn() });
    expect(registration.kind).toBe("inherited");
    expect(root.state).toBe("active");

    owned.dispose();
  });

  it("closing a child does not close an unrelated sibling", async () => {
    const root = new SpawnSelectionScope();
    const first = await root.constructChild(async () => captureInheritedSelectionScope());
    const second = await root.constructChild(async () => captureInheritedSelectionScope());

    (first as ChildSelectionScope).close();

    // The sibling keeps constructing; only the closed child is denied.
    await expect(second!.constructChild(async () => "ok")).resolves.toBe("ok");
    await expect(first!.constructChild(async () => undefined)).rejects.toThrow(/closed/i);
  });
});

describe("SpawnSelectionScope — multiple roots", () => {
  it("isolates leases and identities across concurrent roots", async () => {
    const rootA = new SpawnSelectionScope();
    const rootB = new SpawnSelectionScope();
    expect(rootA.rootId).not.toBe(rootB.rootId);

    const providerA = { select: vi.fn() };
    const ownedA = rootA.register(providerA);
    rootB.register({ select: vi.fn() });

    expect(rootA.activeProvider).toBe(providerA);
    expect(rootB.activeProvider).not.toBe(providerA);

    // An old generation's disposer cannot affect a newer root.
    ownedA.dispose();
    expect(rootA.state).toBe("revoked");
    expect(rootB.state).toBe("active");
  });

  it("routes each construction to its own root's identity", async () => {
    const rootA = new SpawnSelectionScope();
    const rootB = new SpawnSelectionScope();
    const childA = await rootA.constructChild(async () => captureInheritedSelectionScope());
    const childB = await rootB.constructChild(async () => captureInheritedSelectionScope());
    expect(childA!.rootId).toBe(rootA.rootId);
    expect(childB!.rootId).toBe(rootB.rootId);
  });
});

describe("selection scope — separate module instances", () => {
  /**
   * Re-import the scope modules under a fresh registry, the way a second jiti
   * instance evaluates the same sources. A module-local carrier would give the
   * fresh instance its own AsyncLocalStorage and break every assertion below;
   * only the process-global Symbol.for carrier keeps the instances
   * interoperating (the reason the carrier is not module state).
   */
  async function importFreshInstances() {
    vi.resetModules();
    return {
      scopeModule: await import("#src/lifecycle/selection-scope"),
      selectionModule: await import("#src/lifecycle/spawn-selection"),
    };
  }

  it("captures a context established by another instance", async () => {
    const root = new SpawnSelectionScope();
    const { scopeModule } = await importFreshInstances();

    const seen = await root.constructChild(async () => scopeModule.captureInheritedSelectionScope());

    expect(seen).toBeDefined();
    expect(seen!.rootId).toBe(root.rootId);
  });

  it("lets the other instance establish a context this instance captures", async () => {
    const { selectionModule } = await importFreshInstances();
    const foreignRoot = new selectionModule.SpawnSelectionScope();

    const seen = await foreignRoot.constructChild(async () => captureInheritedSelectionScope());

    expect(seen).toBeDefined();
    expect(seen!.rootId).toBe(foreignRoot.rootId);
  });
});
