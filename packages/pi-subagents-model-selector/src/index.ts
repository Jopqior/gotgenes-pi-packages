/**
 * pi-subagents-model-selector — ask for model and thinking on every new run.
 *
 * Captures the core service once at initialization and registers the chooser
 * before any session_start handler can spawn. An inherited registration
 * installs nothing: the root chooser already serves the tree.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getSubagentsService } from "@gotgenes/pi-subagents";
import { ModelSelector } from "./model-selector";

const MISSING_CORE_MESSAGE =
  "@jopqior/pi-subagents-model-selector requires @gotgenes/pi-subagents with registerSpawnSelectionProvider, loaded before this extension.";

export default function piSubagentsModelSelectorExtension(
  pi: ExtensionAPI,
): void {
  const service = getSubagentsService();
  if (service === undefined) {
    throw new Error(MISSING_CORE_MESSAGE);
  }
  const register = (service as { registerSpawnSelectionProvider?: unknown })
    .registerSpawnSelectionProvider;
  if (typeof register !== "function") {
    throw new Error(MISSING_CORE_MESSAGE);
  }

  const chooser = new ModelSelector();
  const registration = service.registerSpawnSelectionProvider(chooser);
  if (registration.kind === "inherited") {
    return;
  }

  pi.on("session_start", (_event, ctx) => {
    chooser.attachUI({
      hasUI: ctx.hasUI,
      select: (title, options, signal) =>
        ctx.ui.select(title, options, { signal }),
    });
  });

  pi.on("session_shutdown", () => {
    chooser.close();
    registration.dispose();
  });
}
