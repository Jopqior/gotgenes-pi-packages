import { describe, expect, it } from "vitest";
import { getModelSelectorSearchText } from "#src/model-search-text";

describe("getModelSelectorSearchText", () => {
  it("omits a trailing name token when the name is empty", () => {
    expect(
      getModelSelectorSearchText({
        id: "claude-sonnet",
        provider: "anthropic",
      }),
    ).toBe("anthropic anthropic/claude-sonnet anthropic claude-sonnet");
  });

  it("appends a leading-space name token when the model is named", () => {
    expect(
      getModelSelectorSearchText({
        id: "claude-sonnet",
        provider: "anthropic",
        name: "Claude Sonnet",
      }),
    ).toBe(
      "anthropic anthropic/claude-sonnet anthropic claude-sonnet Claude Sonnet",
    );
  });

  it("puts the provider first so a provider-prefixed query ranks before a proxy id", () => {
    const haystack = getModelSelectorSearchText({
      id: "openai/gpt-5",
      provider: "openrouter",
      name: "GPT-5",
    });
    expect(haystack).toBe(
      "openrouter openrouter/openai/gpt-5 openrouter openai/gpt-5 GPT-5",
    );
    expect(haystack.startsWith("openai/gpt-5 ")).toBe(false);
  });

  it("does not append the default-model suffix", () => {
    expect(
      getModelSelectorSearchText({
        id: "claude-sonnet",
        provider: "anthropic",
        name: "Claude Sonnet",
      }),
    ).not.toMatch(/default/);
  });
});
