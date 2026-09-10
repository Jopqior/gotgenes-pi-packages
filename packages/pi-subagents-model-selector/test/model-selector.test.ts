import type { Api, Model } from "@earendil-works/pi-ai";
import type {
  SpawnSelection,
  SpawnSelectionRequest,
} from "@gotgenes/pi-subagents";
import { describe, expect, it, vi } from "vitest";
import { ModelSelector } from "#src/model-selector";
import { makeModel } from "#test/helpers/make-model";

const sonnet = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
const haiku = makeModel({
  id: "claude-haiku",
  name: "Claude Sonnet",
  provider: "anthropic",
});
const opus = makeModel({
  id: "gpt-opus",
  name: "Opus",
  provider: "openai",
});

function modelLabel(model: Model<Api>): string {
  return `${model.provider}/${model.id} — ${model.name}`;
}

function makeRequest(
  overrides: Partial<SpawnSelectionRequest> = {},
): SpawnSelectionRequest {
  return {
    agentId: "agent-1",
    agentType: "Explore",
    description: "find TODOs",
    availableModels: [sonnet, haiku],
    ...overrides,
  };
}

/** A UI port that holds every dialog until the test resolves it. */
function makeHeldUI(hasUI = true) {
  const calls: Array<{
    title: string;
    options: string[];
    signal: AbortSignal;
    resolve: (value: string | undefined) => void;
  }> = [];
  const select = vi.fn(
    (
      title: string,
      options: string[],
      signal: AbortSignal,
    ): Promise<string | undefined> => {
      const { promise, resolve } = Promise.withResolvers<string | undefined>();
      calls.push({ title, options, signal, resolve });
      return promise;
    },
  );
  return { hasUI, select, calls };
}

function liveSignal(): AbortSignal {
  return new AbortController().signal;
}

function attachChooser(
  ui: ReturnType<typeof makeHeldUI>,
  levels: readonly SpawnSelection["thinkingLevel"][] = ["off", "high"],
): ModelSelector {
  const chooser = new ModelSelector({
    supportedThinkingLevels: () => levels,
  });
  chooser.attachUI(ui);
  return chooser;
}

describe("ModelSelector", () => {
  describe("two-dialog selection", () => {
    it("asks for a model, then thinking, and returns the chosen pair", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].title).toBe(
        "Select model for Explore agent-1 — find TODOs",
      );
      expect(ui.calls[0].options).toEqual([
        modelLabel(sonnet),
        modelLabel(haiku),
      ]);

      ui.calls[0].resolve(modelLabel(haiku));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      expect(ui.calls[1].title).toBe(
        "Select thinking level for anthropic/claude-haiku (Claude Sonnet)",
      );
      expect(ui.calls[1].options).toEqual(["off", "high"]);

      ui.calls[1].resolve("high");
      await expect(resultPromise).resolves.toEqual({
        model: haiku,
        thinkingLevel: "high",
      });
    });

    it("gives each model a unique label even when display names collide", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(new Set(ui.calls[0].options).size).toBe(2);
      expect(ui.calls[0].options[0]).not.toBe(ui.calls[0].options[1]);

      ui.calls[0].resolve(modelLabel(sonnet));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      ui.calls[1].resolve("off");
      await expect(resultPromise).resolves.toEqual({
        model: sonnet,
        thinkingLevel: "off",
      });
    });

    it("maps the selected label back to the catalogue's own model object", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      ui.calls[0].resolve(modelLabel(sonnet));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      ui.calls[1].resolve("off");
      const result = await resultPromise;
      expect(result?.model).toBe(sonnet);
    });

    it("bounds a long description in the model title", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const description = "d".repeat(81);
      const resultPromise = chooser.select(
        makeRequest({ description }),
        liveSignal(),
      );

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].title).toBe(
        `Select model for Explore agent-1 — ${"d".repeat(79)}…`,
      );

      ui.calls[0].resolve(modelLabel(sonnet));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      ui.calls[1].resolve("off");
      await resultPromise;
    });

    it("still opens both dialogs when there is only one model and one thinking level", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui, ["off"]);
      const resultPromise = chooser.select(
        makeRequest({ availableModels: [opus] }),
        liveSignal(),
      );

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].options).toEqual([modelLabel(opus)]);
      ui.calls[0].resolve(modelLabel(opus));

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      expect(ui.calls[1].options).toEqual(["off"]);
      ui.calls[1].resolve("off");

      await expect(resultPromise).resolves.toEqual({
        model: opus,
        thinkingLevel: "off",
      });
      expect(ui.select).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancellation", () => {
    it("returns undefined and skips thinking when the model dialog is dismissed", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      ui.calls[0].resolve(undefined);

      await expect(resultPromise).resolves.toBeUndefined();
      expect(ui.calls).toHaveLength(1);
    });

    it("returns undefined when the thinking dialog is dismissed", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      ui.calls[0].resolve(modelLabel(sonnet));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      ui.calls[1].resolve(undefined);

      await expect(resultPromise).resolves.toBeUndefined();
    });

    it("aborts the open dialog when the request signal is aborted", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const controller = new AbortController();
      const resultPromise = chooser.select(makeRequest(), controller.signal);

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].signal.aborted).toBe(false);

      controller.abort();
      expect(ui.calls[0].signal.aborted).toBe(true);

      ui.calls[0].resolve(modelLabel(sonnet));
      await expect(resultPromise).resolves.toBeUndefined();
      expect(ui.calls).toHaveLength(1);
    });
  });

  describe("readiness refusal", () => {
    it("rejects when no UI is attached rather than approving a default pair", async () => {
      const chooser = new ModelSelector({
        supportedThinkingLevels: () => ["off"],
      });

      await expect(chooser.select(makeRequest(), liveSignal())).rejects.toThrow(
        "Spawn model selection requires an interactive UI.",
      );
    });

    it("rejects when the attached UI cannot show dialogs", async () => {
      const ui = makeHeldUI(false);
      const chooser = attachChooser(ui);

      await expect(chooser.select(makeRequest(), liveSignal())).rejects.toThrow(
        "Spawn model selection requires an interactive UI.",
      );
      expect(ui.select).not.toHaveBeenCalled();
    });

    it("rejects an empty catalogue rather than inventing a model", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);

      await expect(
        chooser.select(makeRequest({ availableModels: [] }), liveSignal()),
      ).rejects.toThrow("No models are available to select.");
      expect(ui.select).not.toHaveBeenCalled();
    });
  });

  describe("FIFO across two dialogs", () => {
    it("does not open B's model dialog while A is choosing thinking", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const requestA = makeRequest({
        agentId: "agent-a",
        description: "task A",
      });
      const requestB = makeRequest({
        agentId: "agent-b",
        description: "task B",
        availableModels: [opus],
      });

      const a = chooser.select(requestA, liveSignal());
      const b = chooser.select(requestB, liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].title).toContain("agent-a");

      ui.calls[0].resolve(modelLabel(sonnet));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      expect(ui.calls[1].title).toContain("thinking");
      expect(ui.calls[1].title).not.toContain("agent-b");

      ui.calls[1].resolve("off");
      await expect(a).resolves.toEqual({
        model: sonnet,
        thinkingLevel: "off",
      });

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(3);
      });
      expect(ui.calls[2].title).toContain("agent-b");

      ui.calls[2].resolve(modelLabel(opus));
      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(4);
      });
      ui.calls[3].resolve("high");
      await expect(b).resolves.toEqual({
        model: opus,
        thinkingLevel: "high",
      });
    });
  });

  describe("shutdown", () => {
    it("cancels the active request and drains a waiter without opening its dialog", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const a = chooser.select(
        makeRequest({ agentId: "agent-a" }),
        liveSignal(),
      );
      const b = chooser.select(
        makeRequest({ agentId: "agent-b" }),
        liveSignal(),
      );

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      chooser.close();

      expect(ui.calls[0].signal.aborted).toBe(true);
      ui.calls[0].resolve(modelLabel(sonnet));
      await expect(a).resolves.toBeUndefined();
      await expect(b).resolves.toBeUndefined();
      expect(ui.calls).toHaveLength(1);
    });
  });
});
