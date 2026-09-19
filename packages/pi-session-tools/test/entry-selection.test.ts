import { describe, expect, it } from "vitest";
import {
  collectEffectiveModelChangeIndices,
  selectEntries,
} from "#src/entry-selection";

describe("collectEffectiveModelChangeIndices", () => {
  function modelChange(provider = "anthropic", modelId = "claude-opus") {
    return { type: "model_change", provider, modelId };
  }

  function assistant() {
    return {
      type: "message",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "hi" }],
        provider: "anthropic",
        model: "claude-sonnet",
      },
    };
  }

  it("returns an empty set for an empty array", () => {
    expect(collectEffectiveModelChangeIndices([])).toEqual(new Set());
  });

  it("marks a model_change effective when an assistant turn follows it", () => {
    const entries = [modelChange(), assistant()];
    expect(collectEffectiveModelChangeIndices(entries)).toEqual(new Set([0]));
  });

  it("excludes a trailing model_change with no following assistant turn", () => {
    const entries = [assistant(), modelChange()];
    expect(collectEffectiveModelChangeIndices(entries)).toEqual(new Set());
  });

  it("keeps only the last of several consecutive model_change entries", () => {
    const entries = [modelChange(), modelChange(), modelChange(), assistant()];
    expect(collectEffectiveModelChangeIndices(entries)).toEqual(new Set([2]));
  });

  it("tracks multiple effective switches interleaved with assistant turns", () => {
    const entries = [
      assistant(),
      modelChange(),
      assistant(),
      modelChange(),
      assistant(),
    ];
    expect(collectEffectiveModelChangeIndices(entries)).toEqual(
      new Set([1, 3]),
    );
  });

  it("treats every model_change as effective when no assistant message is present (filtered-stream guard)", () => {
    const entries = [modelChange(), modelChange(), modelChange()];
    expect(collectEffectiveModelChangeIndices(entries)).toEqual(
      new Set([0, 1, 2]),
    );
  });
});

describe("selectEntries", () => {
  function modelChange(modelId = "claude-opus") {
    return { type: "model_change", provider: "anthropic", modelId };
  }

  function assistant(id: string) {
    return {
      type: "message",
      id,
      message: {
        role: "assistant",
        content: [{ type: "text", text: id }],
        provider: "anthropic",
        model: "claude-sonnet",
      },
    };
  }

  const six = [
    assistant("a0"),
    assistant("a1"),
    assistant("a2"),
    assistant("a3"),
    assistant("a4"),
    assistant("a5"),
  ];

  describe("no bounds", () => {
    it("returns every entry when the selection is empty", () => {
      expect(selectEntries(six, {})).toEqual(six);
    });

    it("returns an empty array for an empty entry list", () => {
      expect(selectEntries([], { offset: 3, limit: 2 })).toEqual([]);
    });
  });

  describe("type filter", () => {
    it("keeps only the requested types", () => {
      const entries = [
        assistant("a0"),
        { type: "compaction", tokensBefore: 10 },
        assistant("a1"),
      ];
      expect(selectEntries(entries, { types: ["compaction"] })).toEqual([
        { type: "compaction", tokensBefore: 10 },
      ]);
    });

    it("counts filtered entries when a window follows the filter", () => {
      const entries = [
        assistant("a0"),
        { type: "compaction", tokensBefore: 10 },
        assistant("a1"),
        { type: "compaction", tokensBefore: 20 },
      ];
      expect(
        selectEntries(entries, { types: ["compaction"], limit: 1 }),
      ).toEqual([{ type: "compaction", tokensBefore: 20 }]);
    });
  });

  describe("limit", () => {
    it("returns the most recent N entries", () => {
      expect(selectEntries(six, { limit: 2 })).toEqual([six[4], six[5]]);
    });

    it("returns every entry when the limit exceeds the entry count", () => {
      expect(selectEntries(six, { limit: 99 })).toEqual(six);
    });

    it("returns no entries for a limit of zero", () => {
      expect(selectEntries(six, { limit: 0 })).toEqual([]);
    });

    it("clamps a negative limit to zero rather than slicing from the front", () => {
      expect(selectEntries(six, { limit: -2 })).toEqual([]);
    });
  });

  describe("offset", () => {
    it("skips the most recent N entries", () => {
      expect(selectEntries(six, { offset: 2 })).toEqual([
        six[0],
        six[1],
        six[2],
        six[3],
      ]);
    });

    it("is a no-op at zero", () => {
      expect(selectEntries(six, { offset: 0 })).toEqual(six);
    });

    it("clamps a negative offset to zero", () => {
      expect(selectEntries(six, { offset: -3 })).toEqual(six);
    });

    it("returns no entries when the offset exceeds the entry count", () => {
      expect(selectEntries(six, { offset: 99 })).toEqual([]);
    });

    it("takes the limit entries ending offset from the tail", () => {
      expect(selectEntries(six, { offset: 2, limit: 2 })).toEqual([
        six[2],
        six[3],
      ]);
    });
  });

  describe("phantom model-change pruning", () => {
    it("drops a trailing marker that ran no turn", () => {
      const entries = [assistant("a0"), modelChange("opus")];
      expect(selectEntries(entries, {})).toEqual([assistant("a0")]);
    });

    it("keeps only the last of several consecutive markers", () => {
      const entries = [modelChange("one"), modelChange("two"), assistant("a0")];
      expect(selectEntries(entries, {})).toEqual([
        modelChange("two"),
        assistant("a0"),
      ]);
    });

    it("keeps every marker when the stream has no assistant turns (filtered-stream guard)", () => {
      const entries = [modelChange("one"), modelChange("two")];
      expect(selectEntries(entries, { types: ["model_change"] })).toEqual(
        entries,
      );
    });

    it("prunes before the limit is counted, so the limit names entries the caller will see", () => {
      const entries = [assistant("a0"), assistant("a1"), modelChange("opus")];
      expect(selectEntries(entries, { limit: 2 })).toEqual([
        assistant("a0"),
        assistant("a1"),
      ]);
    });

    it("keeps a marker whose assistant turn sits past the window's trailing edge", () => {
      const entries = [
        assistant("a0"),
        modelChange("opus"),
        assistant("a2"),
        assistant("a3"),
      ];
      expect(selectEntries(entries, { offset: 2, limit: 2 })).toEqual([
        assistant("a0"),
        modelChange("opus"),
      ]);
    });
  });
});
