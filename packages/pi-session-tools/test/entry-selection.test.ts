import { describe, expect, it } from "vitest";
import { collectEffectiveModelChangeIndices } from "#src/entry-selection";

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
