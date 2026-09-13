import { describe, expect, it } from "vitest";
import { boundDescription, modelTitle } from "#src/selection-labels";
import { makeRequest } from "#test/helpers/selection-fixtures";

describe("selection labels", () => {
  it("returns a description at the limit unchanged", () => {
    const description = "d".repeat(80);
    expect(boundDescription(description)).toBe(description);
  });

  it("bounds a long description", () => {
    const description = "d".repeat(81);
    expect(boundDescription(description)).toBe(`${"d".repeat(79)}…`);
  });

  it("bounds a long description in the model title", () => {
    const description = "d".repeat(81);
    expect(modelTitle(makeRequest({ description }))).toBe(
      `Select model for Explore agent-1 — ${"d".repeat(79)}…`,
    );
  });
});
