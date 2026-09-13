import type { Api, Model } from "@earendil-works/pi-ai";
import type { SpawnSelection } from "@jopqior/pi-subagents";
import { describe, expect, it } from "vitest";
import {
  createSelectionFormState,
  reduceSelectionForm,
  type SelectionFormEvent,
  type SelectionFormInput,
  type SelectionFormState,
  viewSelectionForm,
} from "#src/selection-form";
import { makeModel } from "#test/helpers/make-model";
import { haiku, opus, sonnet } from "#test/helpers/selection-fixtures";

function levelsFor(
  model: Model<Api>,
): readonly SpawnSelection["thinkingLevel"][] {
  if (model.id === "gpt-opus") return ["off"];
  return ["off", "high"];
}

function makeInput(
  overrides: Partial<SelectionFormInput> = {},
): SelectionFormInput {
  return {
    title: "Select model for Explore agent-1 — find TODOs",
    availableModels: [sonnet, haiku, opus],
    currentModel: undefined,
    scopedModels: [],
    defaultModel: undefined,
    levelsFor,
    ...overrides,
  };
}

function run(
  input: SelectionFormInput,
  events: readonly SelectionFormEvent[] = [],
  state: SelectionFormState = createSelectionFormState(input),
): ReturnType<typeof viewSelectionForm> {
  const next = events.reduce(
    (current, event) => reduceSelectionForm(current, event, input),
    state,
  );
  return viewSelectionForm(next, input);
}

describe("selection form", () => {
  describe("scope", () => {
    it("opens on all when the scoped intersection is empty", () => {
      const view = run(
        makeInput({
          scopedModels: [
            { model: makeModel({ id: "missing", provider: "other" }) },
          ],
        }),
      );
      expect(view.scope).toBe("all");
      expect(view.hasScoped).toBe(false);
    });

    it("opens on scoped when the intersection is non-empty, using catalogue objects", () => {
      const scopedCopy = makeModel({
        id: haiku.id,
        name: "copy",
        provider: haiku.provider,
      });
      const view = run(
        makeInput({
          scopedModels: [{ model: scopedCopy }],
        }),
      );
      expect(view.scope).toBe("scoped");
      expect(view.hasScoped).toBe(true);
      expect(view.models).toEqual([haiku]);
      expect(view.pendingModel).toBe(haiku);
    });

    it("toggles all and scoped when an intersection exists", () => {
      const input = makeInput({ scopedModels: [{ model: haiku }] });
      const afterToggle = run(input, [{ type: "toggleScope" }]);
      expect(afterToggle.scope).toBe("all");
      expect(afterToggle.models).toEqual([sonnet, haiku, opus]);

      const back = run(input, [
        { type: "toggleScope" },
        { type: "toggleScope" },
      ]);
      expect(back.scope).toBe("scoped");
      expect(back.models).toEqual([haiku]);
    });

    it("ignores toggleScope when there are no scoped models", () => {
      const view = run(makeInput(), [{ type: "toggleScope" }]);
      expect(view.scope).toBe("all");
      expect(view.models).toEqual([sonnet, haiku, opus]);
    });
  });

  describe("sort and highlight", () => {
    it("sorts current, then default, then provider", () => {
      const view = run(
        makeInput({
          currentModel: opus,
          defaultModel: { provider: haiku.provider, id: haiku.id },
        }),
      );
      expect(view.models).toEqual([opus, haiku, sonnet]);
      expect(view.highlightedIndex).toBe(0);
      expect(view.pendingModel).toBe(opus);
    });

    it("highlights the current model when it appears in the active list", () => {
      const view = run(makeInput({ currentModel: haiku }));
      expect(view.pendingModel).toBe(haiku);
      expect(view.highlightedIndex).toBe(0);
    });

    it("treats the highlighted row as the pending model", () => {
      const view = run(makeInput(), [{ type: "moveRow", direction: "down" }]);
      expect(view.pendingModel).toBe(haiku);
      expect(view.highlightedIndex).toBe(1);
    });

    it("wraps row movement on the model list", () => {
      const up = run(makeInput(), [{ type: "moveRow", direction: "up" }]);
      expect(up.pendingModel).toBe(opus);
      const down = run(makeInput(), [
        { type: "moveRow", direction: "down" },
        { type: "moveRow", direction: "down" },
        { type: "moveRow", direction: "down" },
      ]);
      expect(down.pendingModel).toBe(sonnet);
    });
  });

  describe("filter", () => {
    it("filters the active list by the search haystack", () => {
      const view = run(makeInput(), [{ type: "filter", query: "haiku" }]);
      expect(view.models).toEqual([haiku]);
      expect(view.pendingModel).toBe(haiku);
      expect(view.highlightedIndex).toBe(0);
    });

    it("ranks the default model first for a default search token", () => {
      const view = run(
        makeInput({
          defaultModel: { provider: opus.provider, id: opus.id },
        }),
        [{ type: "filter", query: "def" }],
      );
      expect(view.models[0]).toBe(opus);
    });
  });

  describe("thinking", () => {
    it("keeps a still-supported thinking level when the pending model changes", () => {
      const view = run(makeInput(), [
        { type: "confirmTab" },
        { type: "moveRow", direction: "down" },
        { type: "confirmTab" },
        { type: "moveTab", direction: "prev" },
        { type: "moveTab", direction: "prev" },
        { type: "moveRow", direction: "down" },
      ]);
      expect(view.pendingModel).toBe(haiku);
      expect(view.thinkingLevel).toBe("high");
      expect(view.canSubmit).toBe(true);
    });

    it("clears an unsupported thinking level and blocks submit", () => {
      const view = run(makeInput(), [
        { type: "confirmTab" },
        { type: "moveRow", direction: "down" },
        { type: "confirmTab" },
        { type: "moveTab", direction: "prev" },
        { type: "moveTab", direction: "prev" },
        { type: "moveRow", direction: "down" },
        { type: "moveRow", direction: "down" },
      ]);
      expect(view.pendingModel).toBe(opus);
      expect(view.thinkingLevel).toBeUndefined();
      expect(view.canSubmit).toBe(false);
    });

    it("does not auto-select off when it is the only level", () => {
      const view = run(makeInput({ availableModels: [opus] }), [
        { type: "confirmTab" },
      ]);
      expect(view.tab).toBe("thinking");
      expect(view.thinkingLevels).toEqual(["off"]);
      expect(view.thinkingLevel).toBeUndefined();
      expect(view.canSubmit).toBe(false);
    });
  });

  describe("tabs and submit", () => {
    it("wraps Tab and Shift+Tab across model, thinking, and Submit", () => {
      const next = run(makeInput(), [{ type: "moveTab", direction: "next" }]);
      expect(next.tab).toBe("thinking");
      const submit = run(makeInput(), [
        { type: "moveTab", direction: "next" },
        { type: "moveTab", direction: "next" },
      ]);
      expect(submit.tab).toBe("submit");
      const wrap = run(makeInput(), [
        { type: "moveTab", direction: "next" },
        { type: "moveTab", direction: "next" },
        { type: "moveTab", direction: "next" },
      ]);
      expect(wrap.tab).toBe("model");
      const prev = run(makeInput(), [{ type: "moveTab", direction: "prev" }]);
      expect(prev.tab).toBe("submit");
    });

    it("advances from the model tab to thinking on Enter without submitting", () => {
      const view = run(makeInput(), [{ type: "confirmTab" }]);
      expect(view.tab).toBe("thinking");
      expect(view.status).toEqual({ kind: "open" });
    });

    it("selects the highlighted thinking level and advances to Submit", () => {
      const view = run(makeInput(), [
        { type: "confirmTab" },
        { type: "moveRow", direction: "down" },
        { type: "confirmTab" },
      ]);
      expect(view.tab).toBe("submit");
      expect(view.thinkingLevel).toBe("high");
      expect(view.status).toEqual({ kind: "open" });
    });

    it("refuses Submit until a model and a thinking level are set", () => {
      const missingThinking = run(makeInput(), [
        { type: "moveTab", direction: "next" },
        { type: "moveTab", direction: "next" },
        { type: "confirmTab" },
      ]);
      expect(missingThinking.status).toEqual({ kind: "open" });
      expect(missingThinking.tab).toBe("submit");
      expect(missingThinking.submitMessage).toBe("Select a thinking level.");

      const submitted = run(makeInput(), [
        { type: "confirmTab" },
        { type: "moveRow", direction: "down" },
        { type: "confirmTab" },
        { type: "confirmTab" },
      ]);
      expect(submitted.status).toEqual({
        kind: "submit",
        model: sonnet,
        thinkingLevel: "high",
      });
    });

    it("cancels the form", () => {
      const view = run(makeInput(), [{ type: "cancel" }]);
      expect(view.status).toEqual({ kind: "cancel" });
    });
  });
});
