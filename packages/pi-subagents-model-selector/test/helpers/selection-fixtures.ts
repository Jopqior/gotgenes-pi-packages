/**
 * selection-fixtures.ts — Shared models and request builders for selector tests.
 */
import type { SpawnSelectionRequest } from "@jopqior/pi-subagents";
import { makeModel } from "#test/helpers/make-model";

export const sonnet = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
export const haiku = makeModel({
  id: "claude-haiku",
  name: "Claude Sonnet",
  provider: "anthropic",
});
export const opus = makeModel({
  id: "gpt-opus",
  name: "Opus",
  provider: "openai",
});

export function makeRequest(
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

export function liveSignal(): AbortSignal {
  return new AbortController().signal;
}
