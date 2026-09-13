/**
 * selection-labels.ts — Title and description bounds for the spawn form.
 */
import type { SpawnSelectionRequest } from "@jopqior/pi-subagents";

const DESCRIPTION_LIMIT = 80;

export function boundDescription(description: string): string {
  if (description.length <= DESCRIPTION_LIMIT) {
    return description;
  }
  return `${description.slice(0, DESCRIPTION_LIMIT - 1)}…`;
}

export function modelTitle(request: SpawnSelectionRequest): string {
  return `Select model for ${request.agentType} ${request.agentId} — ${boundDescription(request.description)}`;
}
