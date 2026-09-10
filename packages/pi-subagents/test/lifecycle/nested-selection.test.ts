/**
 * nested-selection.test.ts — end-to-end nested and lifecycle coverage.
 *
 * Wires the real service adapter, runtime, and manager (not the resource
 * loader) so a root, child, and grandchild share one lease while keeping
 * distinct catalogues, and so two roots, shutdown, abort, and resume stay
 * isolated. Real-loader factory inheritance lives in construction-inheritance.
 */
import type { Model } from "@earendil-works/pi-ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import { ConcurrencyLimiter } from "#src/lifecycle/concurrency-limiter";
import type { CreateSubagentSessionParams } from "#src/lifecycle/create-subagent-session";
import { captureInheritedSelectionScope, type SelectionScopeHandle } from "#src/lifecycle/selection-scope";
import { SpawnSelectionScope } from "#src/lifecycle/spawn-selection";
import { SubagentManager } from "#src/lifecycle/subagent-manager";
import { createSubagentRuntime } from "#src/runtime";
import type { SpawnSelection, SpawnSelectionRequest } from "#src/service/service";
import { SubagentsServiceAdapter } from "#src/service/service-adapter";
import { resolveModel } from "#src/session/model-resolver";
import type { SessionContext } from "#src/types";
import { makeModel } from "#test/helpers/make-model";
import { createSubagentSessionStub, toSubagentSession } from "#test/helpers/mock-session";

const rootModels = [makeModel({ id: "root-sonnet", name: "Root Sonnet" })];
const childModels = [
  makeModel({ id: "child-haiku", name: "Child Haiku" }),
  makeModel({ id: "child-opus", name: "Child Opus" }),
];
const grandchildModels = [makeModel({ id: "gc-opus", name: "Grandchild Opus" })];

function registryOf(models: Model<any>[]) {
  return {
    find: (provider: string, id: string) =>
      models.find((model) => model.provider === provider && model.id === id),
    getAll: () => models,
    getAvailable: () => models,
  };
}

function makeCtx(models: Model<any>[], model: Model<any> = models[0]): SessionContext {
  return {
    cwd: "/repo",
    model,
    modelRegistry: registryOf(models),
    getSystemPrompt: () => "parent prompt",
    sessionManager: {
      getSessionFile: () => "/sessions/parent.jsonl",
      getSessionId: () => "parent-session",
      getBranch: () => [],
    },
  };
}

function heldProvider() {
  const pending: Array<(value: SpawnSelection | undefined) => void> = [];
  const select = vi.fn(
    (_request: SpawnSelectionRequest, _signal: AbortSignal) => {
      const { promise, resolve } = Promise.withResolvers<SpawnSelection | undefined>();
      pending.push(resolve);
      return promise;
    },
  );
  return {
    select,
    resolve(index: number, value: SpawnSelection | undefined): void {
      pending[index](value);
    },
    resolveAll(): void {
      while (pending.length > 0) pending.pop()!(undefined);
    },
  };
}

describe("nested human selection and lifecycle isolation", () => {
  const managers: SubagentManager[] = [];
  const providers: Array<{ resolveAll: () => void }> = [];

  afterEach(async () => {
    for (const provider of providers) provider.resolveAll();
    for (const manager of managers) {
      manager.abortAll();
      await manager.dispose();
    }
    managers.length = 0;
    providers.length = 0;
  });

  function makeTree(
    scope: SelectionScopeHandle,
    ctx: SessionContext,
    maxConcurrent = 4,
  ) {
    const factory = vi.fn(async (_params: CreateSubagentSessionParams) =>
      toSubagentSession(createSubagentSessionStub()),
    );
    const manager = new SubagentManager({
      createSubagentSession: factory,
      limiter: new ConcurrencyLimiter(() => maxConcurrent),
      baseCwd: "/repo",
      registry: new AgentTypeRegistry(() => new Map()),
      selectionScope: scope,
    });
    managers.push(manager);
    const runtime = createSubagentRuntime(scope);
    runtime.setSessionContext(ctx);
    const service = new SubagentsServiceAdapter(manager, resolveModel, runtime);
    return { factory, manager, runtime, service, ctx };
  }

  describe("spawning-session catalogues", () => {
    it("asks the root provider with the spawning session's catalogue and does not change root settings", async () => {
      const rootScope = new SpawnSelectionScope();
      const rootModel = rootModels[0];
      const root = makeTree(rootScope, makeCtx(rootModels, rootModel));
      const provider = heldProvider();
      providers.push(provider);
      expect(root.service.registerSpawnSelectionProvider({ select: provider.select }).kind).toBe(
        "owned",
      );

      const childHandle = await rootScope.constructChild(async () =>
        captureInheritedSelectionScope(),
      );
      const child = makeTree(childHandle!, makeCtx(childModels, childModels[0]));

      const childId = child.service.spawn("general-purpose", "from child", {
        description: "from child",
      });
      expect(typeof childId).toBe("string");
      expect(provider.select).toHaveBeenCalledTimes(1);
      expect(provider.select).toHaveBeenCalledWith(
        {
          agentId: expect.any(String),
          agentType: "general-purpose",
          description: "from child",
          availableModels: childModels,
        },
        expect.any(AbortSignal),
      );
      expect(root.runtime.currentCtx?.model).toBe(rootModel);

      provider.resolve(0, { model: childModels[1], thinkingLevel: "off" });
      await child.manager.waitForAll();

      expect(child.factory).toHaveBeenCalledTimes(1);
      expect(child.factory).toHaveBeenCalledWith(
        expect.objectContaining({
          model: childModels[1],
          thinkingLevel: "off",
        }),
      );
      expect(root.factory).not.toHaveBeenCalled();
      expect(root.runtime.currentCtx?.model).toBe(rootModel);
    });

    it("asks with the grandchild catalogue when a descendant spawns, still via the root provider", async () => {
      const rootScope = new SpawnSelectionScope();
      const root = makeTree(rootScope, makeCtx(rootModels));
      const provider = heldProvider();
      providers.push(provider);
      root.service.registerSpawnSelectionProvider({ select: provider.select });

      const childHandle = await rootScope.constructChild(async () =>
        captureInheritedSelectionScope(),
      );
      const grandchildHandle = await childHandle!.constructChild(async () =>
        captureInheritedSelectionScope(),
      );
      const grandchild = makeTree(grandchildHandle!, makeCtx(grandchildModels));

      grandchild.service.spawn("general-purpose", "from grandchild", {
        description: "from grandchild",
      });
      expect(provider.select).toHaveBeenCalledWith(
        {
          agentId: expect.any(String),
          agentType: "general-purpose",
          description: "from grandchild",
          availableModels: grandchildModels,
        },
        expect.any(AbortSignal),
      );

      provider.resolve(0, { model: grandchildModels[0], thinkingLevel: "off" });
      await grandchild.manager.waitForAll();
      expect(grandchild.factory).toHaveBeenCalledWith(
        expect.objectContaining({ model: grandchildModels[0] }),
      );
      expect(root.factory).not.toHaveBeenCalled();
    });
  });

  describe("child-loaded registration", () => {
    it("cannot replace the root provider, so the tree still consults the original chooser", async () => {
      const rootScope = new SpawnSelectionScope();
      const root = makeTree(rootScope, makeCtx(rootModels));
      const rootProvider = heldProvider();
      const childProvider = heldProvider();
      providers.push(rootProvider, childProvider);
      root.service.registerSpawnSelectionProvider({ select: rootProvider.select });

      const childHandle = await rootScope.constructChild(async () =>
        captureInheritedSelectionScope(),
      );
      const child = makeTree(childHandle!, makeCtx(childModels));
      const inherited = child.service.registerSpawnSelectionProvider({
        select: childProvider.select,
      });
      expect(inherited.kind).toBe("inherited");
      inherited.dispose();

      child.service.spawn("general-purpose", "still root chooser", {
        description: "still root chooser",
      });
      expect(rootProvider.select).toHaveBeenCalledTimes(1);
      expect(childProvider.select).not.toHaveBeenCalled();
      expect(rootScope.activeProvider).toEqual({ select: rootProvider.select });

      rootProvider.resolve(0, { model: childModels[0], thinkingLevel: "off" });
      await child.manager.waitForAll();
    });
  });

  describe("two roots and generations", () => {
    it("keeps each root's choices and revocation on its own lease", async () => {
      const scopeA = new SpawnSelectionScope();
      const scopeB = new SpawnSelectionScope();
      const treeA = makeTree(scopeA, makeCtx(rootModels));
      const treeB = makeTree(scopeB, makeCtx(childModels));
      const providerA = heldProvider();
      const providerB = heldProvider();
      providers.push(providerA, providerB);
      treeA.service.registerSpawnSelectionProvider({ select: providerA.select });
      treeB.service.registerSpawnSelectionProvider({ select: providerB.select });

      treeA.service.spawn("general-purpose", "root A", { description: "root A" });
      treeB.service.spawn("general-purpose", "root B", { description: "root B" });
      expect(providerA.select).toHaveBeenCalledTimes(1);
      expect(providerB.select).toHaveBeenCalledTimes(1);
      expect(providerA.select.mock.calls[0][0].availableModels).toEqual(rootModels);
      expect(providerB.select.mock.calls[0][0].availableModels).toEqual(childModels);

      treeA.runtime.closeSelectionScope();
      providerA.resolve(0, { model: rootModels[0], thinkingLevel: "off" });
      await treeA.manager.waitForAll();
      expect(treeA.factory).not.toHaveBeenCalled();

      treeB.service.spawn("general-purpose", "root B still live", {
        description: "root B still live",
      });
      expect(providerB.select).toHaveBeenCalledTimes(2);

      providerB.resolve(0, { model: childModels[0], thinkingLevel: "off" });
      providerB.resolve(1, { model: childModels[0], thinkingLevel: "off" });
      await treeB.manager.waitForAll();
      expect(treeB.factory).toHaveBeenCalledTimes(2);
    });

    it("an old generation's disposer cannot revoke a newer root", async () => {
      const firstScope = new SpawnSelectionScope();
      const first = makeTree(firstScope, makeCtx(rootModels));
      const firstProvider = heldProvider();
      providers.push(firstProvider);
      const firstRegistration = first.service.registerSpawnSelectionProvider({
        select: firstProvider.select,
      });
      firstRegistration.dispose();

      const secondScope = new SpawnSelectionScope();
      const second = makeTree(secondScope, makeCtx(childModels));
      const secondProvider = heldProvider();
      providers.push(secondProvider);
      const secondRegistration = second.service.registerSpawnSelectionProvider({
        select: secondProvider.select,
      });

      firstRegistration.dispose();
      second.service.spawn("general-purpose", "second generation", {
        description: "second generation",
      });
      expect(secondProvider.select).toHaveBeenCalledTimes(1);

      secondProvider.resolve(0, { model: childModels[0], thinkingLevel: "off" });
      await second.manager.waitForAll();
      expect(second.factory).toHaveBeenCalledTimes(1);
      secondRegistration.dispose();
    });
  });

  describe("queued and active abort", () => {
    it("aborting the active selection releases the slot so the queued run can ask", async () => {
      const scope = new SpawnSelectionScope();
      const tree = makeTree(scope, makeCtx(rootModels), 1);
      const provider = heldProvider();
      providers.push(provider);
      tree.service.registerSpawnSelectionProvider({ select: provider.select });

      const firstId = tree.service.spawn("general-purpose", "first", { description: "first" });
      const secondId = tree.service.spawn("general-purpose", "second", { description: "second" });
      expect(provider.select).toHaveBeenCalledTimes(1);
      expect(tree.manager.getRecord(secondId)?.status).toBe("queued");

      expect(tree.manager.abort(firstId)).toBe(true);
      provider.resolve(0, { model: rootModels[0], thinkingLevel: "off" });
      await vi.waitFor(() => expect(provider.select).toHaveBeenCalledTimes(2));
      expect(provider.select.mock.calls[1][0].description).toBe("second");

      provider.resolve(1, { model: rootModels[0], thinkingLevel: "off" });
      await tree.manager.waitForAll();
      expect(tree.factory).toHaveBeenCalledTimes(1);
      expect(tree.manager.getRecord(firstId)?.status).toBe("stopped");
    });

    it("aborting a queued record never opens a dialog for it", async () => {
      const scope = new SpawnSelectionScope();
      const tree = makeTree(scope, makeCtx(rootModels), 1);
      const provider = heldProvider();
      providers.push(provider);
      tree.service.registerSpawnSelectionProvider({ select: provider.select });

      const firstId = tree.service.spawn("general-purpose", "first", { description: "first" });
      const secondId = tree.service.spawn("general-purpose", "second", { description: "second" });
      expect(tree.manager.abort(secondId)).toBe(true);
      expect(tree.manager.getRecord(secondId)?.status).toBe("stopped");

      provider.resolve(0, { model: rootModels[0], thinkingLevel: "off" });
      await tree.manager.waitForAll();
      expect(provider.select).toHaveBeenCalledTimes(1);
      expect(provider.select.mock.calls[0][0].description).toBe("first");
      expect(tree.factory).toHaveBeenCalledTimes(1);
      expect(tree.manager.getRecord(firstId)?.status).toBe("completed");
    });
  });

  describe("resume", () => {
    it("reuses the existing session and pair without consulting the chooser", async () => {
      const scope = new SpawnSelectionScope();
      const stub = createSubagentSessionStub();
      const factory = vi.fn(async () => toSubagentSession(stub));
      const manager = new SubagentManager({
        createSubagentSession: factory,
        limiter: new ConcurrencyLimiter(() => 4),
        baseCwd: "/repo",
        registry: new AgentTypeRegistry(() => new Map()),
        selectionScope: scope,
      });
      managers.push(manager);
      const runtime = createSubagentRuntime(scope);
      runtime.setSessionContext(makeCtx(rootModels));
      const service = new SubagentsServiceAdapter(manager, resolveModel, runtime);
      const provider = heldProvider();
      providers.push(provider);
      service.registerSpawnSelectionProvider({ select: provider.select });

      const id = service.spawn("general-purpose", "fresh", { description: "fresh" });
      provider.resolve(0, { model: rootModels[0], thinkingLevel: "off" });
      await manager.waitForAll();
      expect(provider.select).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledTimes(1);
      const session = manager.getRecord(id)?.subagentSession;

      await manager.resume(id, "continue");
      expect(provider.select).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(stub.resumeTurnLoop).toHaveBeenCalledTimes(1);
      expect(manager.getRecord(id)?.subagentSession).toBe(session);
    });
  });
});
