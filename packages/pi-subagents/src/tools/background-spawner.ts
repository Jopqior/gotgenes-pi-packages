import type { SpawnSelectionOutcome } from "#src/lifecycle/initial-spawn-selection";
import type { ParentSnapshot } from "#src/lifecycle/parent-snapshot";
import type { AgentSpawnConfig } from "#src/lifecycle/subagent-manager";
import { renderSpawnNotes, textResult } from "#src/tools/helpers";
import type { ResolvedSpawnConfig } from "#src/tools/spawn-config";
import type { ParentSessionInfo, Subagent } from "#src/types";
import type { AgentDetails } from "#src/ui/display";

/** Narrow manager interface for the background spawner. */
export interface BackgroundManagerDeps {
  spawn(snapshot: ParentSnapshot, type: string, prompt: string, opts: AgentSpawnConfig): string;
  waitForSpawnSelection(id: string, signal?: AbortSignal): Promise<SpawnSelectionOutcome>;
  getRecord(id: string): Subagent | undefined;
}

/** All values the background spawner needs beyond the resolved config. */
export interface BackgroundParams {
  config: ResolvedSpawnConfig;
  snapshot: ParentSnapshot;
  parentSession: ParentSessionInfo;
  settings: { readonly maxConcurrent: number };
}

/**
 * Spawn a background agent and return the tool result once its initial
 * selection settled — never waiting for the child's task. Owns: launch
 * message formatting and the selected/stopped/failed startup classification.
 *
 * `signal` is a startup-only cancellation lever: it reaches the record's
 * selection wait and is detached there at settlement, so it never binds the
 * confirmed background task.
 */
export async function spawnBackground(
  manager: BackgroundManagerDeps,
  params: BackgroundParams,
  signal?: AbortSignal,
) {
  const { identity, execution, presentation, notes } = params.config;

  let id: string;
  try {
    id = manager.spawn(params.snapshot, identity.subagentType, execution.prompt, {
      parentSession: params.parentSession,
      description: execution.description,
      model: execution.model,
      maxTurns: execution.effectiveMaxTurns,
      inheritContext: execution.inheritContext,
      thinkingLevel: execution.thinking,
      // resolveSpawnConfig already merged the agent's frontmatter and AgentTool
      // routed here on the result, so this door has committed.
      background: { kind: "explicit", isBackground: true },
    });
  } catch (err) {
    return textResult(err instanceof Error ? err.message : String(err));
  }

  // The startup boundary: hold this result through concurrency admission and
  // any required model/thinking selection. The selected pair (if any) is on
  // the record; this wait does not depend on workspace preparation or session
  // creation finishing.
  const selection = await manager.waitForSpawnSelection(id, signal);
  const record = manager.getRecord(id);

  if (selection.kind === "stopped") {
    return textResult(
      `Agent ${id} did not start: the model/thinking selection was cancelled before startup, so no background work is running for it.`,
    );
  }
  if (selection.kind === "failed") {
    return textResult(`Agent ${id} did not start: model/thinking selection failed. ${selection.error}`);
  }

  const isQueued = record?.status === "queued";
  const launchVerb = isQueued ? "queued" : "started";
  // Annotated rather than inlined into the call: `textResult` is generic over its
  // details, so an inline literal would define the type instead of being checked
  // against it.
  const details: AgentDetails = {
    ...presentation.detailFor(record, params.snapshot.model?.id),
    toolUses: 0,
    tokens: "",
    durationMs: 0,
    status: "background",
    agentId: id,
  };
  return textResult(
    renderSpawnNotes(notes) +
      `Agent ${launchVerb} in background.\n` +
      `Agent ID: ${id}\n` +
      `Type: ${identity.displayName}\n` +
      `Description: ${execution.description}\n` +
      (record?.outputFile ? `Output file: ${record.outputFile}\n` : "") +
      (isQueued
        ? `Position: queued (max ${params.settings.maxConcurrent} concurrent)\n`
        : "") +
      (selection.kind === "selected"
        ? `Model/thinking selection confirmed — background startup is proceeding.\n`
        : "") +
      `\nYou will be notified when this agent completes.\n` +
      `Use get_subagent_result to retrieve full results, or steer_subagent to send it messages.\n` +
      `Do not duplicate this agent's work.`,
    details,
  );
}
