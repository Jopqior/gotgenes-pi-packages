/**
 * selection-form-component.ts — TUI adapter for the spawn selection form.
 *
 * Maps raw keys onto form events, owns the search Input, and bridges the
 * queue's abort signal to `done` because `ui.custom` has no `signal` option.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { modelsAreEqual } from "@earendil-works/pi-ai";
import { type Component, Input, matchesKey } from "@earendil-works/pi-tui";
import {
  createSelectionFormState,
  reduceSelectionForm,
  type SelectionFormEvent,
  type SelectionFormInput,
  type SelectionFormResult,
  type SelectionFormState,
  viewSelectionForm,
} from "./selection-form";

const MAX_VISIBLE = 10;

interface FormTheme {
  fg(color: string, text: string): string;
}

interface FormKeybindings {
  matches(data: string, action: string): boolean;
}

type FormCustom = (
  factory: (
    tui: { requestRender: () => void },
    theme: FormTheme,
    keybindings: FormKeybindings,
    done: (result: SelectionFormResult) => void,
  ) => Component,
  options?: { overlay?: boolean },
) => Promise<SelectionFormResult>;

export function presentSelectionForm(
  custom: FormCustom,
  input: SelectionFormInput,
  signal: AbortSignal,
): Promise<SelectionFormResult> {
  if (signal.aborted) {
    return Promise.resolve({ kind: "cancel" });
  }
  return custom(
    (tui, theme, keybindings, done) => {
      let closed = false;
      const finish = (result: SelectionFormResult): void => {
        if (closed) {
          return;
        }
        closed = true;
        signal.removeEventListener("abort", onAbort);
        done(result);
      };
      const onAbort = (): void => {
        finish({ kind: "cancel" });
      };
      signal.addEventListener("abort", onAbort, { once: true });
      return new SelectionFormComponent(
        input,
        theme,
        keybindings,
        () => {
          tui.requestRender();
        },
        finish,
      );
    },
    { overlay: false },
  );
}

class SelectionFormComponent implements Component {
  private state: SelectionFormState;
  private readonly search = new Input();

  constructor(
    private readonly input: SelectionFormInput,
    private readonly theme: FormTheme,
    private readonly keybindings: FormKeybindings,
    private readonly requestRender: () => void,
    private readonly finish: (result: SelectionFormResult) => void,
  ) {
    this.state = createSelectionFormState(input);
    this.search.focused = true;
  }

  invalidate(): void {
    // No cached rendering state to clear.
  }

  render(width: number): string[] {
    const view = viewSelectionForm(this.state, this.input);
    const lines: string[] = [this.theme.fg("accent", this.input.title), ""];
    if (view.hasScoped) {
      const allText =
        view.scope === "all"
          ? this.theme.fg("accent", "all")
          : this.theme.fg("muted", "all");
      const scopedText =
        view.scope === "scoped"
          ? this.theme.fg("accent", "scoped")
          : this.theme.fg("muted", "scoped");
      lines.push(
        `${this.theme.fg("muted", "Scope: ")}${allText}${this.theme.fg("muted", " | ")}${scopedText}`,
      );
      lines.push(this.theme.fg("muted", "Ctrl+S scope (all/scoped)"));
    } else {
      lines.push(
        this.theme.fg(
          "warning",
          "Only showing models from configured providers. Use /login to add providers.",
        ),
      );
    }
    lines.push("");
    if (view.tab === "model") {
      this.search.focused = true;
      lines.push(...this.search.render(width));
      lines.push("");
      lines.push(...this.renderModelRows(view.models, view.highlightedIndex));
    } else if (view.tab === "thinking") {
      this.search.focused = false;
      for (const [index, level] of view.thinkingLevels.entries()) {
        const selected = index === view.thinkingHighlight;
        const chosen =
          level === view.thinkingLevel ? this.theme.fg("success", " ✓") : "";
        const prefix = selected ? this.theme.fg("accent", "→ ") : "  ";
        const label = selected ? this.theme.fg("accent", level) : level;
        lines.push(`${prefix}${label}${chosen}`);
      }
    } else {
      const model = view.pendingModel;
      const modelLabel = model ? `${model.id} [${model.provider}]` : "(none)";
      lines.push(`Model: ${modelLabel}`);
      lines.push(`Thinking: ${view.thinkingLevel ?? "(none)"}`);
      if (view.submitMessage) {
        lines.push(this.theme.fg("warning", view.submitMessage));
      }
    }
    lines.push("");
    lines.push(this.theme.fg("dim", "Tab cycle · Enter confirm · Esc cancel"));
    return lines;
  }

  handleInput(data: string): void {
    if (matchesKey(data, "ctrl+s")) {
      this.apply({ type: "toggleScope" });
      return;
    }
    if (this.keybindings.matches(data, "tui.select.cancel")) {
      this.apply({ type: "cancel" });
      return;
    }
    if (this.keybindings.matches(data, "tui.input.tab")) {
      this.apply({ type: "moveTab", direction: "next" });
      return;
    }
    if (matchesKey(data, "shift+tab")) {
      this.apply({ type: "moveTab", direction: "prev" });
      return;
    }
    if (this.keybindings.matches(data, "tui.select.up")) {
      this.apply({ type: "moveRow", direction: "up" });
      return;
    }
    if (this.keybindings.matches(data, "tui.select.down")) {
      this.apply({ type: "moveRow", direction: "down" });
      return;
    }
    if (this.keybindings.matches(data, "tui.select.confirm")) {
      this.apply({ type: "confirmTab" });
      return;
    }
    if (this.state.tab === "model") {
      this.search.handleInput(data);
      this.apply({ type: "filter", query: this.search.getValue() });
    }
  }

  private apply(event: SelectionFormEvent): void {
    this.state = reduceSelectionForm(this.state, event, this.input);
    if (this.state.status.kind !== "open") {
      this.finish(this.state.status);
      return;
    }
    this.requestRender();
  }

  private renderModelRows(
    models: readonly Model<Api>[],
    selectedIndex: number,
  ): string[] {
    const lines: string[] = [];
    if (models.length === 0) {
      lines.push(this.theme.fg("muted", "  No matching models"));
      return lines;
    }
    const startIndex = Math.max(
      0,
      Math.min(
        selectedIndex - Math.floor(MAX_VISIBLE / 2),
        models.length - MAX_VISIBLE,
      ),
    );
    const endIndex = Math.min(startIndex + MAX_VISIBLE, models.length);
    for (let index = startIndex; index < endIndex; index++) {
      const model = models[index];
      const isSelected = index === selectedIndex;
      const isCurrent = modelsAreEqual(this.input.currentModel, model);
      const isDefault =
        this.input.defaultModel?.provider === model.provider &&
        this.input.defaultModel.id === model.id;
      const defaultBadge = isDefault
        ? this.theme.fg("muted", " · default")
        : "";
      const checkmark = isCurrent ? this.theme.fg("success", " ✓") : "";
      const providerBadge = this.theme.fg("muted", `[${model.provider}]`);
      if (isSelected) {
        lines.push(
          `${this.theme.fg("accent", "→ ")}${this.theme.fg("accent", model.id)} ${providerBadge}${defaultBadge}${checkmark}`,
        );
      } else {
        lines.push(`  ${model.id} ${providerBadge}${defaultBadge}${checkmark}`);
      }
    }
    if (startIndex > 0 || endIndex < models.length) {
      lines.push(
        this.theme.fg("muted", `  (${selectedIndex + 1}/${models.length})`),
      );
    }
    const selected = models[selectedIndex];
    lines.push("");
    lines.push(this.theme.fg("muted", `  Model Name: ${selected.name}`));
    return lines;
  }
}
