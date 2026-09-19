/**
 * entry-selection.ts — Chooses which session entries a transcript renders.
 *
 * Everything that happens to an entry array before formatting lives here:
 * type filtering, phantom `model_change` pruning, and windowing. Keeping the
 * selection pure and separate from `format-transcript.ts` lets the window be
 * computed against the whole session rather than against what a caller asked
 * to see.
 */

import type { TranscriptEntry } from "./format-transcript.js";

/**
 * Return the entry indices of `model_change` markers that took effect — a
 * switch followed by at least one assistant turn before the next switch (or
 * the end of entries).
 *
 * A phantom switch (cycling the TUI picker, or ending a session on a switch)
 * never produces a turn and is excluded.
 * Guard: when the stream contains no assistant messages at all (e.g. a
 * `types: ["model_change"]` filtered query), every marker is treated as
 * effective — there is no ground truth to validate against, and suppressing
 * all of them would hide the only signal the caller asked for.
 */
export function collectEffectiveModelChangeIndices(
  entries: TranscriptEntry[],
): Set<number> {
  const effective = new Set<number>();
  const modelChangeIndices: number[] = [];
  let pendingIndex: number | null = null;
  let sawAssistantMessage = false;

  for (const [index, entry] of entries.entries()) {
    if (entry.type === "model_change") {
      modelChangeIndices.push(index);
      pendingIndex = index;
      continue;
    }
    if (entry.type !== "message") continue;
    const msg = (entry as unknown as Record<string, unknown>).message as
      | Record<string, unknown>
      | undefined;
    if (msg?.role !== "assistant") continue;
    sawAssistantMessage = true;
    if (pendingIndex !== null) {
      effective.add(pendingIndex);
      pendingIndex = null;
    }
  }

  if (!sawAssistantMessage) return new Set(modelChangeIndices);
  return effective;
}
