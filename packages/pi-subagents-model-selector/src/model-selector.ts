/**
 * model-selector.ts — Two public Pi dialogs for one spawn selection.
 *
 * Model first, then thinking. Every option — including a single `off` — is
 * confirmed explicitly. Missing UI is an error, not an approval.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { getSupportedThinkingLevels } from "@earendil-works/pi-ai";
import type {
  SpawnSelection,
  SpawnSelectionProvider,
  SpawnSelectionRequest,
} from "@gotgenes/pi-subagents";
import {
  SelectionQueue,
  SelectionQueueCancelledError,
  SelectionQueueClosedError,
} from "./selection-queue";

const DESCRIPTION_LIMIT = 80;

const NO_UI = "Spawn model selection requires an interactive UI.";
const NO_MODELS = "No models are available to select.";
const CLOSED = "Spawn model selection is closed.";

export interface SelectionUIPort {
  readonly hasUI: boolean;
  select(
    title: string,
    options: string[],
    signal: AbortSignal,
  ): Promise<string | undefined>;
}

export class ModelSelector implements SpawnSelectionProvider {
  private readonly levelsFor: (
    model: Model<Api>,
  ) => readonly SpawnSelection["thinkingLevel"][];
  private readonly queue = new SelectionQueue();
  private ui: SelectionUIPort | undefined;

  constructor(
    deps: {
      supportedThinkingLevels?: (
        model: Model<Api>,
      ) => readonly SpawnSelection["thinkingLevel"][];
    } = {},
  ) {
    this.levelsFor = deps.supportedThinkingLevels ?? getSupportedThinkingLevels;
  }

  attachUI(ui: SelectionUIPort): void {
    this.ui = ui;
  }

  close(): void {
    this.ui = undefined;
    this.queue.close();
  }

  async select(
    request: SpawnSelectionRequest,
    signal: AbortSignal,
  ): Promise<SpawnSelection | undefined> {
    this.assertReady(request);
    try {
      return await this.queue.enqueue(
        async (dialogSignal) => this.runDialogs(request, signal, dialogSignal),
        signal,
      );
    } catch (err) {
      if (
        err instanceof SelectionQueueCancelledError ||
        err instanceof SelectionQueueClosedError
      ) {
        return undefined;
      }
      throw err;
    }
  }

  private assertReady(request: SpawnSelectionRequest): void {
    if (this.queue.closed) {
      throw new Error(CLOSED);
    }
    if (!this.ui?.hasUI) {
      throw new Error(NO_UI);
    }
    if (request.availableModels.length === 0) {
      throw new Error(NO_MODELS);
    }
  }

  private async runDialogs(
    request: SpawnSelectionRequest,
    requestSignal: AbortSignal,
    dialogSignal: AbortSignal,
  ): Promise<SpawnSelection | undefined> {
    if (this.abandoned(requestSignal, dialogSignal)) {
      return undefined;
    }
    const ui = this.ui;
    if (!ui?.hasUI) {
      throw new Error(NO_UI);
    }

    const labels = request.availableModels.map(modelLabel);
    const modelChoice = await ui.select(
      modelTitle(request),
      [...labels],
      dialogSignal,
    );
    if (
      modelChoice === undefined ||
      this.abandoned(requestSignal, dialogSignal)
    ) {
      return undefined;
    }
    const modelIndex = labels.indexOf(modelChoice);
    const model =
      modelIndex < 0 ? undefined : request.availableModels[modelIndex];
    if (model === undefined) {
      throw new Error(
        `Selected option ${JSON.stringify(modelChoice)} does not match any offered model.`,
      );
    }

    const levels = [...this.levelsFor(model)];
    if (levels.length === 0) {
      throw new Error(
        `Model ${model.provider}/${model.id} has no supported thinking levels.`,
      );
    }
    const thinkingChoice = await ui.select(
      thinkingTitle(model),
      [...levels],
      dialogSignal,
    );
    if (
      thinkingChoice === undefined ||
      this.abandoned(requestSignal, dialogSignal)
    ) {
      return undefined;
    }
    if (!isListedLevel(thinkingChoice, levels)) {
      throw new Error(
        `Selected thinking level ${JSON.stringify(thinkingChoice)} is not supported.`,
      );
    }
    return { model, thinkingLevel: thinkingChoice };
  }

  private abandoned(
    requestSignal: AbortSignal,
    dialogSignal: AbortSignal,
  ): boolean {
    return this.queue.closed || requestSignal.aborted || dialogSignal.aborted;
  }
}

function isListedLevel(
  value: string,
  levels: readonly SpawnSelection["thinkingLevel"][],
): value is SpawnSelection["thinkingLevel"] {
  return levels.some((level) => level === value);
}

function modelLabel(model: Model<Api>): string {
  return `${model.provider}/${model.id} — ${model.name}`;
}

function boundDescription(description: string): string {
  if (description.length <= DESCRIPTION_LIMIT) {
    return description;
  }
  return `${description.slice(0, DESCRIPTION_LIMIT - 1)}…`;
}

function modelTitle(request: SpawnSelectionRequest): string {
  return `Select model for ${request.agentType} ${request.agentId} — ${boundDescription(request.description)}`;
}

function thinkingTitle(model: Model<Api>): string {
  return `Select thinking level for ${model.provider}/${model.id} (${model.name})`;
}
