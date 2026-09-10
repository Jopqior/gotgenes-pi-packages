/**
 * make-model.ts — Test fixture builder for the SDK `Model` type.
 */
import type { Api, Model } from "@earendil-works/pi-ai";

export function makeModel(overrides: Partial<Model<Api>> = {}): Model<Api> {
  return {
    id: "test-model",
    name: "Test Model",
    api: "anthropic-messages",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 8192,
    ...overrides,
  };
}
