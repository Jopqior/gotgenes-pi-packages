/**
 * display.ts — Pure formatting helpers and display utilities for agent UI.
 *
 * All functions are stateless and dependency-free (no SDK, no widget lifecycle).
 * Consumed by the widget, the menu, tool modules, and the notification renderer.
 */

import type { AgentConfigLookup } from "#src/config/agent-types";
import type { AgentInvocation, SubagentType, ThinkingLevel } from "#src/types";
import { GLYPHS } from "#src/ui/glyphs";

// ---- Types ----

export type Theme = {
  fg(color: string, text: string): string;
  bold(text: string): string;
};

/** Metadata attached to Agent tool results for custom rendering. */
export interface AgentDetails {
  displayName: string;
  description: string;
  subagentType: string;
  toolUses: number;
  tokens: string;
  durationMs: number;
  status: "queued" | "running" | "completed" | "steered" | "aborted" | "stopped" | "error" | "background";
  /** Human-readable description of what the agent is currently doing. */
  activity?: string;
  /** Current spinner frame index (for animated running indicator). */
  spinnerFrame?: number;
  /** Short model name if different from parent (e.g. "haiku", "sonnet"). */
  modelName?: string;
  /** Notable config tags (e.g. ["thinking: high", "inherit context"]). */
  tags?: string[];
  /** Current turn count. */
  turnCount?: number;
  /** Effective max turns (undefined = unlimited). */
  maxTurns?: number;
  agentId?: string;
  error?: string;
}

export type SpawnPresentationSource = {
  awaitingSelection: boolean;
  selectedPair?: {
    model: { id: string; name: string };
    thinkingLevel: ThinkingLevel;
  };
};

export type SpawnDetailBase = Pick<
  AgentDetails,
  "displayName" | "description" | "subagentType" | "modelName" | "tags"
>;

// ---- Constants ----

/** Statuses that indicate an error/non-success outcome (used for linger behavior and icon rendering). */
export const ERROR_STATUSES = new Set(["error", "aborted", "steered", "stopped"]);

/** Private pending-selection activity shown while public status stays `running`. */
export const PENDING_SELECTION_ACTIVITY = "Awaiting model/thinking selection";

/** Shared by `thinkingTag` and `isThinkingTag` so the producer and matcher cannot drift. */
const THINKING_TAG_PREFIX = "thinking: ";

/** Tool name → human-readable action for activity descriptions. */
const TOOL_DISPLAY: Record<string, string> = {
  read: "reading",
  bash: "running command",
  edit: "editing",
  write: "writing",
  grep: "searching",
  find: "finding files",
  ls: "listing",
};

// ---- Pure formatters ----

/** Format a token count compactly: "33.8k token", "1.2M token". */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M token`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k token`;
  return `${count} token`;
}

/**
 * Token count with optional context-fill % and compaction-count annotations.
 * Thresholds for percent: <70% dim, 70–85% warning, ≥85% error.
 * Compaction count rendered as `⇊N` in dim (see `glyphs.ts`).
 *
 *   "12.3k token"               — no annotations
 *   "12.3k token (45%)"         — percent only
 *   "12.3k token (⇊2)"          — compactions only (e.g. right after compact)
 *   "12.3k token (45% · ⇊2)"    — both
 */
export function formatSessionTokens(
  tokens: number,
  percent: number | null,
  theme: Theme,
  compactions = 0,
): string {
  const tokenStr = formatTokens(tokens);
  const annot: string[] = [];
  if (percent !== null) {
    const color = percent >= 85 ? "error" : percent >= 70 ? "warning" : "dim";
    annot.push(theme.fg(color, `${Math.round(percent)}%`));
  }
  if (compactions > 0) {
    annot.push(theme.fg("dim", `${GLYPHS.compactions}${compactions}`));
  }
  if (annot.length === 0) return tokenStr;
  const sep = theme.fg("dim", " · ");
  return `${tokenStr} ${theme.fg("dim", "(")}${annot.join(sep)}${theme.fg("dim", ")")}`;
}

/** Format turn count with optional max limit: "↻5≤30" or "↻5". */
export function formatTurns(turnCount: number, maxTurns?: number | null): string {
  return maxTurns != null
    ? `${GLYPHS.turns}${turnCount}≤${maxTurns}`
    : `${GLYPHS.turns}${turnCount}`;
}

/** Format milliseconds as human-readable duration. */
export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format duration from start/completed timestamps. */
export function formatDuration(startedAt: number, completedAt?: number): string {
  if (completedAt) return formatMs(completedAt - startedAt);
  return `${formatMs(Date.now() - startedAt)} (running)`;
}

/**
 * Tool-card short name for a spawn model.
 * Sole implementation of the rule `resolveSpawnConfig` used to inline:
 * omit when `model.id` equals the parent id, otherwise `model.name` with a
 * leading "Claude " stripped and lowercased.
 * `resolveSpawnConfig` and `overlaySpawnPresentation` both call this.
 * Do not inline the formula back into `resolveSpawnConfig`.
 */
export function formatSpawnModelName(
  model: { id: string; name: string } | undefined,
  parentId: string | undefined,
): string | undefined {
  if (!model || model.id === parentId) return undefined;
  return model.name.replace(/^Claude\s+/i, "").toLowerCase();
}

export function overlaySpawnPresentation(
  base: SpawnDetailBase,
  source: SpawnPresentationSource | undefined,
  parentId: string | undefined,
): SpawnDetailBase {
  if (!source) return base;
  if (source.awaitingSelection) return overlayPendingPresentation(base);
  if (source.selectedPair) return overlaySelectedPresentation(base, source.selectedPair, parentId);
  return base;
}

function overlayPendingPresentation(base: SpawnDetailBase): SpawnDetailBase {
  const remaining = (base.tags ?? []).filter((tag) => !isThinkingTag(tag));
  return {
    ...base,
    modelName: undefined,
    tags: remaining.length > 0 ? remaining : undefined,
  };
}

function overlaySelectedPresentation(
  base: SpawnDetailBase,
  pair: NonNullable<SpawnPresentationSource["selectedPair"]>,
  parentId: string | undefined,
): SpawnDetailBase {
  const remaining = (base.tags ?? []).filter((tag) => !isThinkingTag(tag));
  const nextThinking = thinkingTag(pair.thinkingLevel);
  const tags =
    remaining[0] === "twin"
      ? ["twin", nextThinking, ...remaining.slice(1)]
      : [nextThinking, ...remaining];
  return {
    ...base,
    modelName: formatSpawnModelName(pair.model, parentId),
    tags,
  };
}

function thinkingTag(level: ThinkingLevel): string {
  return `${THINKING_TAG_PREFIX}${level}`;
}

function isThinkingTag(tag: string): boolean {
  return tag.startsWith(THINKING_TAG_PREFIX);
}

// ---- Display helpers ----

/** Get display name for any agent type (built-in or custom). */
export function getDisplayName(type: SubagentType, registry: AgentConfigLookup): string {
  const config = registry.resolveAgentConfig(type);
  return config.displayName ?? config.name;
}

/** Short label for prompt mode: "twin" for append, nothing for replace (the default). */
export function getPromptModeLabel(type: SubagentType, registry: AgentConfigLookup): string | undefined {
  const config = registry.resolveAgentConfig(type);
  return config.promptMode === "append" ? "twin" : undefined;
}

/** Mode label is not included — callers add it where they want it. */
export function buildInvocationTags(
  invocation: AgentInvocation | undefined,
): { modelName?: string; tags: string[] } {
  const tags: string[] = [];
  if (!invocation) return { tags };
  if (invocation.thinking) tags.push(thinkingTag(invocation.thinking));
  if (invocation.inheritContext) tags.push("inherit context");
  if (invocation.runInBackground) tags.push("background");
  if (invocation.maxTurns != null) tags.push(`max turns: ${invocation.maxTurns}`);
  return { modelName: invocation.modelName, tags };
}

/** Truncate text to a single line, max `len` chars. */
function truncateLine(text: string, len = 60): string {
  const line = text.split("\n").find(l => l.trim())?.trim() ?? "";
  if (line.length <= len) return line;
  return line.slice(0, len) + "…";
}

/** Build a human-readable activity string from currently-running tools or response text. */
export function describeActivity(activeTools: ReadonlyMap<string, string>, responseText?: string): string {
  if (activeTools.size > 0) {
    const groups = new Map<string, number>();
    for (const toolName of activeTools.values()) {
      const action = TOOL_DISPLAY[toolName] ?? toolName;
      groups.set(action, (groups.get(action) ?? 0) + 1);
    }

    const parts: string[] = [];
    for (const [action, count] of groups) {
      if (count > 1) {
        parts.push(`${action} ${count} ${action === "searching" ? "patterns" : "files"}`);
      } else {
        parts.push(action);
      }
    }
    return parts.join(", ") + "…";
  }

  // No tools active — show truncated response text if available
  if (responseText && responseText.trim().length > 0) {
    return truncateLine(responseText);
  }

  return "thinking…";
}
