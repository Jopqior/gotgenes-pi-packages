import type { SpawnSelection } from "@jopqior/pi-subagents";
import { describe, expect, it, vi } from "vitest";
import { ModelSelector } from "#src/model-selector";
import type {
  SelectionFormInput,
  SelectionFormResult,
} from "#src/selection-form";
import {
  haiku,
  liveSignal,
  makeRequest,
  opus,
  sonnet,
} from "#test/helpers/selection-fixtures";

/** A UI port that holds every form until the test resolves it. */
function makeHeldUI(isTui = true) {
  const calls: Array<{
    input: SelectionFormInput;
    signal: AbortSignal;
    resolve: (value: SelectionFormResult) => void;
  }> = [];
  const presentForm = vi.fn(
    (
      input: SelectionFormInput,
      signal: AbortSignal,
    ): Promise<SelectionFormResult> => {
      const { promise, resolve } = Promise.withResolvers<SelectionFormResult>();
      calls.push({ input, signal, resolve });
      return promise;
    },
  );
  return {
    isTui,
    sessionFacts: () => ({
      currentModel: undefined,
      scopedModels: [],
      defaultModel: undefined,
    }),
    presentForm,
    calls,
  };
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
  describe("one-form selection", () => {
    it("asks on one form and returns the chosen pair", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      expect(ui.calls[0].input.title).toBe(
        "Select model for Explore agent-1 — find TODOs",
      );
      expect(ui.calls[0].input.availableModels).toEqual([sonnet, haiku]);

      ui.calls[0].resolve({
        kind: "submit",
        model: haiku,
        thinkingLevel: "high",
      });
      await expect(resultPromise).resolves.toEqual({
        model: haiku,
        thinkingLevel: "high",
      });
    });

    it("maps the selected model back to the catalogue's own object", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      ui.calls[0].resolve({
        kind: "submit",
        model: sonnet,
        thinkingLevel: "off",
      });
      const result = await resultPromise;
      expect(result?.model).toBe(sonnet);
    });
  });

  describe("cancellation", () => {
    it("returns undefined when the form is dismissed", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);
      const resultPromise = chooser.select(makeRequest(), liveSignal());

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(1);
      });
      ui.calls[0].resolve({ kind: "cancel" });

      await expect(resultPromise).resolves.toBeUndefined();
      expect(ui.calls).toHaveLength(1);
    });

    it("aborts the open form when the request signal is aborted", async () => {
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

      ui.calls[0].resolve({ kind: "cancel" });
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
        "Spawn model selection requires a TUI.",
      );
    });

    it("rejects when the attached session is not a TUI", async () => {
      const ui = makeHeldUI(false);
      const chooser = attachChooser(ui);

      await expect(chooser.select(makeRequest(), liveSignal())).rejects.toThrow(
        "Spawn model selection requires a TUI.",
      );
      expect(ui.presentForm).not.toHaveBeenCalled();
    });

    it("rejects an empty catalogue rather than inventing a model", async () => {
      const ui = makeHeldUI();
      const chooser = attachChooser(ui);

      await expect(
        chooser.select(makeRequest({ availableModels: [] }), liveSignal()),
      ).rejects.toThrow("No models are available to select.");
      expect(ui.presentForm).not.toHaveBeenCalled();
    });
  });

  describe("FIFO", () => {
    it("does not open B's form while A's form is pending", async () => {
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
      expect(ui.calls[0].input.title).toContain("agent-a");

      ui.calls[0].resolve({
        kind: "submit",
        model: sonnet,
        thinkingLevel: "off",
      });
      await expect(a).resolves.toEqual({
        model: sonnet,
        thinkingLevel: "off",
      });

      await vi.waitFor(() => {
        expect(ui.calls).toHaveLength(2);
      });
      expect(ui.calls[1].input.title).toContain("agent-b");

      ui.calls[1].resolve({
        kind: "submit",
        model: opus,
        thinkingLevel: "high",
      });
      await expect(b).resolves.toEqual({
        model: opus,
        thinkingLevel: "high",
      });
    });
  });

  describe("shutdown", () => {
    it("cancels the active request and drains a waiter without opening its form", async () => {
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
      ui.calls[0].resolve({ kind: "cancel" });
      await expect(a).resolves.toBeUndefined();
      await expect(b).resolves.toBeUndefined();
      expect(ui.calls).toHaveLength(1);
    });
  });
});
