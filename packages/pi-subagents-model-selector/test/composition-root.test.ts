/**
 * Composition-root tests for `piSubagentsModelSelectorExtension(pi)`.
 *
 * These run the real factory and pin wiring that unit tests cannot see:
 * registration at initialization, UI attach at session_start, inherited
 * early-return, and the missing-core diagnostic.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  publishSubagentsService,
  type SpawnSelectionProvider,
  type SpawnSelectionRegistration,
  type SubagentsService,
  unpublishSubagentsService,
} from "@gotgenes/pi-subagents";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import piSubagentsModelSelectorExtension from "#src/index";
import { makeModel } from "#test/helpers/make-model";

const sonnet = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });

type RecordedHandler = (event: unknown, ctx: unknown) => unknown;

function makeFakePi() {
  const handlers = new Map<string, RecordedHandler[]>();
  const pi = {
    on(event: string, handler: RecordedHandler): void {
      const registered = handlers.get(event);
      if (registered) registered.push(handler);
      else handlers.set(event, [handler]);
    },
  };
  return {
    pi: pi as unknown as ExtensionAPI,
    handlers,
    async fire(
      event: string,
      input: unknown = {},
      ctx: unknown = {},
    ): Promise<void> {
      for (const handler of handlers.get(event) ?? []) {
        await handler(input, ctx);
      }
    },
  };
}

function makeService(kind: SpawnSelectionRegistration["kind"] = "owned") {
  const dispose = vi.fn();
  let provider: SpawnSelectionProvider | undefined;
  const registerSpawnSelectionProvider = vi.fn(
    (next: SpawnSelectionProvider): SpawnSelectionRegistration => {
      provider = next;
      return { kind, dispose };
    },
  );
  const service = {
    registerSpawnSelectionProvider,
  } as unknown as SubagentsService;
  return {
    service,
    dispose,
    registerSpawnSelectionProvider,
    getProvider: (): SpawnSelectionProvider | undefined => provider,
  };
}

const request = {
  agentId: "agent-1",
  agentType: "Explore",
  description: "find TODOs",
  availableModels: [sonnet],
};

beforeEach(() => {
  unpublishSubagentsService();
});

afterEach(() => {
  unpublishSubagentsService();
});

describe("piSubagentsModelSelectorExtension", () => {
  describe("owned root activation", () => {
    it("registers the provider during factory initialization, before session_start", () => {
      const { service, registerSpawnSelectionProvider, getProvider } =
        makeService();
      publishSubagentsService(service);
      const { pi, handlers } = makeFakePi();

      piSubagentsModelSelectorExtension(pi);

      expect(registerSpawnSelectionProvider).toHaveBeenCalledTimes(1);
      expect(getProvider()).toBeDefined();
      expect(handlers.has("session_start")).toBe(true);
      expect(handlers.has("session_shutdown")).toBe(true);
    });

    it("rejects a selection before UI is attached rather than waiting for session_start", async () => {
      const { service, getProvider } = makeService();
      publishSubagentsService(service);
      const { pi } = makeFakePi();

      piSubagentsModelSelectorExtension(pi);
      const provider = getProvider();
      expect(provider).toBeDefined();

      await expect(
        provider!.select(request, new AbortController().signal),
      ).rejects.toThrow("Spawn model selection requires an interactive UI.");
    });

    it("attaches UI at session_start and uses it for the two dialogs", async () => {
      const { service, getProvider } = makeService();
      publishSubagentsService(service);
      const { pi, fire } = makeFakePi();
      piSubagentsModelSelectorExtension(pi);

      const select = vi.fn(async (title: string, options: string[]) => {
        if (title.includes("thinking")) return "off";
        return options[0];
      });
      await fire(
        "session_start",
        { reason: "start" },
        {
          hasUI: true,
          ui: { select },
        },
      );

      const result = await getProvider()!.select(
        request,
        new AbortController().signal,
      );

      expect(select).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ model: sonnet, thinkingLevel: "off" });
    });

    it("closes the chooser and disposes the owned registration on session_shutdown", async () => {
      const { service, dispose, getProvider } = makeService();
      publishSubagentsService(service);
      const { pi, fire } = makeFakePi();
      piSubagentsModelSelectorExtension(pi);

      await fire(
        "session_start",
        { reason: "start" },
        {
          hasUI: true,
          ui: {
            select: async (_title: string, options: string[]) => options[0],
          },
        },
      );
      await fire("session_shutdown");

      expect(dispose).toHaveBeenCalledTimes(1);
      await expect(
        getProvider()!.select(request, new AbortController().signal),
      ).rejects.toThrow(/closed|interactive UI/i);
    });
  });

  describe("inherited child registration", () => {
    it("installs no UI hooks and does not dispose the inherited handle", () => {
      const { service, dispose, registerSpawnSelectionProvider } =
        makeService("inherited");
      publishSubagentsService(service);
      const { pi, handlers } = makeFakePi();

      piSubagentsModelSelectorExtension(pi);

      expect(registerSpawnSelectionProvider).toHaveBeenCalledTimes(1);
      expect(handlers.size).toBe(0);
      expect(dispose).not.toHaveBeenCalled();
    });
  });

  describe("missing core capability", () => {
    it("throws a configuration error and registers nothing when the service is absent", () => {
      const { pi, handlers } = makeFakePi();

      expect(() => piSubagentsModelSelectorExtension(pi)).toThrow(
        "@jopqior/pi-subagents-model-selector requires @gotgenes/pi-subagents with registerSpawnSelectionProvider, loaded before this extension.",
      );
      expect(handlers.size).toBe(0);
    });

    it("throws when the published service lacks registerSpawnSelectionProvider", () => {
      publishSubagentsService({} as SubagentsService);
      const { pi, handlers } = makeFakePi();

      expect(() => piSubagentsModelSelectorExtension(pi)).toThrow(
        /registerSpawnSelectionProvider/,
      );
      expect(handlers.size).toBe(0);
    });
  });
});
