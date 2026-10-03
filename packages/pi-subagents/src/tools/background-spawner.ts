import type { SpawnSelectionOutcome } from "#src/lifecycle/initial-spawn-selection";
import type { ParentSnapshot } from "#src/lifecycle/parent-snapshot";
import type { AgentSpawnConfig } from "#src/lifecycle/subagent-manager";
import { renderSpawnNotes, textResult } from "#src/tools/helpers";
import type { ResolvedSpawnConfig, SpawnPresentation } from "#src/tools/spawn-config";
import type { ParentSessionInfo, Subagent } from "#src/types";
import type { AgentDetails } from "#src/ui/display";

/** Narrow manager interface for the background spawner. */
export interface BackgroundManagerDeps {
  spawn(snapshot: ParentSnapshot, type: string, prompt: string, opts: AgentSpawnConfig): string;
  waitForSpawnSelection(id: string, signal?: AbortSignal): Promise<SpawnSelectionOutcome>;
  getRecord(id: string): Subagent | undefined;
}

export interface BackgroundParams {
  config: ResolvedSpawnConfig;
  snapshot: ParentSnapshot;
  parentSession: ParentSessionInfo;
  settings: { readonly maxConcurrent: number };
}

/** One report shape for every door that returns before the run ends. */
export interface BackgroundLaunch {
  headline: string;
  id: string;
  displayName: string;
  description: string;
  detailBase: SpawnPresentation["detailBase"];
  notes?: readonly string[];
  outputFile?: string;
  queuePosition?: { maxConcurrent: number };
  selectionConfirmed?: boolean;
}

/**
 * Hold a new background launch through admission and required initial selection,
 * never through workspace creation or task completion. The signal cancels only
 * startup and is detached by the selection owner at settlement.
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
      background: { kind: "explicit", isBackground: true },
    });
  } catch (err) {
    return textResult(err instanceof Error ? err.message : String(err));
  }

  const selection = await manager.waitForSpawnSelection(id, signal);
  const record = manager.getRecord(id);
  if (selection.kind === "stopped") {
    return textResult(`Agent ${id} did not start: the model/thinking selection was cancelled before startup, so no background work is running for it.`);
  }
  if (selection.kind === "failed") {
    return textResult(`Agent ${id} did not start: model/thinking selection failed. ${selection.error}`);
  }
  const isQueued = record?.status === "queued";
  return renderBackgroundLaunch({
    headline: `Agent ${isQueued ? "queued" : "started"} in background.`,
    id,
    displayName: identity.displayName,
    description: execution.description,
    detailBase: presentation.detailFor(record),
    notes,
    outputFile: record?.outputFile,
    queuePosition: isQueued ? { maxConcurrent: params.settings.maxConcurrent } : undefined,
    selectionConfirmed: selection.kind === "selected",
  });
}

/** Render only; lifecycle waiting belongs to the spawning door. */
export function renderBackgroundLaunch(launch: BackgroundLaunch) {
  const details: AgentDetails = {
    ...launch.detailBase,
    toolUses: 0,
    tokens: "",
    durationMs: 0,
    status: "background",
    agentId: launch.id,
  };
  return textResult(
    renderSpawnNotes(launch.notes ?? []) +
      `${launch.headline}\n` +
      `Agent ID: ${launch.id}\n` +
      `Type: ${launch.displayName}\n` +
      `Description: ${launch.description}\n` +
      (launch.outputFile ? `Output file: ${launch.outputFile}\n` : "") +
      (launch.queuePosition ? `Position: queued (max ${launch.queuePosition.maxConcurrent} concurrent)\n` : "") +
      (launch.selectionConfirmed ? `Model/thinking selection confirmed — background startup is proceeding.\n` : "") +
      `\nYou will be notified when this agent completes.\n` +
      `Use get_subagent_result to retrieve full results, or steer_subagent to send it messages.\n` +
      `Do not duplicate this agent's work.`,
    details,
  );
}
