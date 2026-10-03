/**
 * selection-form-component.ts — TUI adapter for the spawn selection form.
 *
 * Maps raw keys onto form events, owns the search Input, and bridges the
 * queue's abort signal to `done` because `ui.custom` has no `signal` option.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { modelsAreEqual } from "@earendil-works/pi-ai";
import {
  type Component,
  Input,
  matchesKey,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import {
  createSelectionFormState,
  reduceSelectionForm,
  type SelectionFormEvent,
  type SelectionFormInput,
  type SelectionFormResult,
  type SelectionFormState,
  type SelectionTab,
  viewSelectionForm,
} from "./selection-form";

const MAX_VISIBLE = 10;

interface FormTheme {
  fg(color: string, text: string): string;
  bg(color: "selectedBg", text: string): string;
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
    if (width <= 0) return [""];
    const view = viewSelectionForm(this.state, this.input);
    const rule = this.theme.fg("border", "─".repeat(width));
    const lines: string[] = [
      rule,
      ...wrapTextWithAnsi(this.theme.fg("accent", this.input.title), width),
      renderTabs(
        this.theme,
        width,
        view.tab,
        view.pendingModel !== undefined,
        view.pendingModel !== undefined &&
          view.thinkingLevel !== undefined &&
          view.thinkingLevels.includes(view.thinkingLevel),
      ),
      "",
    ];
    if (view.tab === "model") {
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
          ...wrapTextWithAnsi(
            this.theme.fg(
              "warning",
              "Only showing models from configured providers. Use /login to add providers.",
            ),
            width,
          ),
        );
      }
      lines.push("");
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
      lines.push(...wrapTextWithAnsi(`Model: ${modelLabel}`, width));
      lines.push(
        ...wrapTextWithAnsi(
          `Thinking: ${view.thinkingLevel ?? "(none)"}`,
          width,
        ),
      );
      if (view.submitMessage) {
        lines.push(
          ...wrapTextWithAnsi(
            this.theme.fg("warning", view.submitMessage),
            width,
          ),
        );
      }
    }
    lines.push("");
    lines.push(
      ...wrapTextWithAnsi(
        this.theme.fg("dim", "Tab next · Shift+Tab previous"),
        width,
      ),
    );
    if (view.tab === "model") {
      lines.push(
        ...wrapTextWithAnsi(this.theme.fg("dim", "←/→ edit search"), width),
      );
    }
    lines.push(
      ...wrapTextWithAnsi(
        this.theme.fg(
          "dim",
          view.tab === "submit"
            ? "Enter submit · Esc cancel"
            : "Enter confirm · Esc cancel",
        ),
        width,
      ),
    );
    lines.push(rule);
    return lines.map((line) => truncateToWidth(line, width, ""));
  }

  handleInput(data: string): void {
    if (matchesKey(data, "ctrl+s")) {
      if (this.state.tab === "model") {
        this.apply({ type: "toggleScope" });
      }
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
      const previousQuery = this.search.getValue();
      this.search.handleInput(data);
      const query = this.search.getValue();
      if (query !== previousQuery) {
        this.apply({ type: "filter", query });
      } else {
        this.requestRender();
      }
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

function renderTabs(
  theme: FormTheme,
  width: number,
  active: SelectionTab,
  modelComplete: boolean,
  thinkingComplete: boolean,
): string {
  const tabs = [
    { id: "model", label: "Model", complete: modelComplete },
    { id: "thinking", label: "Thinking", complete: thinkingComplete },
    { id: "submit", label: "Submit", complete: undefined },
  ];
  const activeIndex = tabs.findIndex((tab) => tab.id === active);
  const labels = tabs.map((tab) => renderTab(theme, tab, tab.id === active));
  const budget = width - 4;
  let start = activeIndex;
  let end = activeIndex;
  let used = visibleWidth(labels[activeIndex]);
  if (used <= budget) {
    for (let distance = 1; distance < tabs.length; distance++) {
      if (start > 0 && used + 1 + visibleWidth(labels[start - 1]) <= budget) {
        start--;
        used += 1 + visibleWidth(labels[start]);
      }
      if (
        end < tabs.length - 1 &&
        used + 1 + visibleWidth(labels[end + 1]) <= budget
      ) {
        end++;
        used += 1 + visibleWidth(labels[end]);
      }
    }
    return `${theme.fg("muted", "← ")}${labels.slice(start, end + 1).join(" ")}${theme.fg("muted", " →")}`;
  }
  const tab = tabs[activeIndex];
  const names = [
    tab.label,
    tab.id === "thinking" ? "Think" : tab.label[0],
    tab.label[0],
  ];
  for (const label of names) {
    const compact = renderTab(theme, { ...tab, label }, true, false);
    if (visibleWidth(compact) <= budget) {
      return `${theme.fg("muted", "← ")}${compact}${theme.fg("muted", " →")}`;
    }
  }
  const identity = theme.bg("selectedBg", theme.fg("text", tab.label[0]));
  if (width >= 5)
    return `${theme.fg("muted", "← ")}${identity}${theme.fg("muted", " →")}`;
  if (width >= 3)
    return `${theme.fg("muted", "←")}${identity}${theme.fg("muted", "→")}`;
  return identity;
}

function renderTab(
  theme: FormTheme,
  tab: { label: string; complete: boolean | undefined },
  selected: boolean,
  padded = true,
): string {
  const marker =
    tab.complete === undefined
      ? theme.fg("muted", "☰")
      : theme.fg(tab.complete ? "success" : "muted", tab.complete ? "☒" : "☐");
  const padding = padded ? " " : "";
  const label = `${padding}${marker} ${theme.fg(selected ? "text" : "muted", tab.label)}${padding}`;
  return selected ? theme.bg("selectedBg", label) : label;
}
