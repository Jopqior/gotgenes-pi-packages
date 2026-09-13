/**
 * model-selector.ts — One TUI form for spawn model and thinking.
 *
 * Missing TUI is an error, not an approval. Cancel returns undefined and
 * creates no child. Concurrent requests stay FIFO at the queue.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { getSupportedThinkingLevels } from "@earendil-works/pi-ai";
import type { ScopedModel } from "@earendil-works/pi-coding-agent";
import type {
  SpawnSelection,
  SpawnSelectionProvider,
  SpawnSelectionRequest,
} from "@jopqior/pi-subagents";
import type { SelectionFormInput, SelectionFormResult } from "./selection-form";
import { modelTitle } from "./selection-labels";
import {
  SelectionQueue,
  SelectionQueueCancelledError,
  SelectionQueueClosedError,
} from "./selection-queue";

const NO_UI = "Spawn model selection requires a TUI.";
const NO_MODELS = "No models are available to select.";
const CLOSED = "Spawn model selection is closed.";

export interface SelectionSessionFacts {
  readonly currentModel: Model<Api> | undefined;
  readonly scopedModels: readonly ScopedModel[];
  readonly defaultModel:
    | { readonly provider: string; readonly id: string }
    | undefined;
}

export interface SelectionUIPort {
  readonly isTui: boolean;
  sessionFacts(): SelectionSessionFacts;
  presentForm(
    input: SelectionFormInput,
    signal: AbortSignal,
  ): Promise<SelectionFormResult>;
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
    if (!this.ui?.isTui) {
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
    if (!ui?.isTui) {
      throw new Error(NO_UI);
    }
    const facts = ui.sessionFacts();
    const result = await ui.presentForm(
      {
        title: modelTitle(request),
        availableModels: request.availableModels,
        currentModel: facts.currentModel,
        scopedModels: facts.scopedModels,
        defaultModel: facts.defaultModel,
        levelsFor: this.levelsFor,
      },
      dialogSignal,
    );
    if (
      result.kind === "cancel" ||
      this.abandoned(requestSignal, dialogSignal)
    ) {
      return undefined;
    }
    return { model: result.model, thinkingLevel: result.thinkingLevel };
  }

  private abandoned(
    requestSignal: AbortSignal,
    dialogSignal: AbortSignal,
  ): boolean {
    return this.queue.closed || requestSignal.aborted || dialogSignal.aborted;
  }
}
