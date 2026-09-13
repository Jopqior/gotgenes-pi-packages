/**
 * selection-form.ts — Pure spawn-selection form state.
 *
 * Reduce over decoded events. Rendering and keymaps live in the TUI adapter.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { modelsAreEqual } from "@earendil-works/pi-ai";
import { fuzzyFilter } from "@earendil-works/pi-tui";
import type { SpawnSelection } from "@jopqior/pi-subagents";
import { getModelSelectorSearchText } from "./model-search-text";

const TABS = ["model", "thinking", "submit"] as const;

export type SelectionTab = (typeof TABS)[number];
export type SelectionScope = "all" | "scoped";

export type SelectionFormResult =
  | {
      readonly kind: "submit";
      readonly model: Model<Api>;
      readonly thinkingLevel: SpawnSelection["thinkingLevel"];
    }
  | { readonly kind: "cancel" };

export type SelectionFormStatus =
  | { readonly kind: "open" }
  | SelectionFormResult;

export type SelectionFormEvent =
  | { readonly type: "toggleScope" }
  | { readonly type: "moveRow"; readonly direction: "up" | "down" }
  | { readonly type: "filter"; readonly query: string }
  | { readonly type: "moveTab"; readonly direction: "next" | "prev" }
  | { readonly type: "confirmTab" }
  | { readonly type: "cancel" };

export interface SelectionFormInput {
  readonly title: string;
  readonly availableModels: readonly Model<Api>[];
  readonly currentModel: Model<Api> | undefined;
  readonly scopedModels: readonly { readonly model: Model<Api> }[];
  readonly defaultModel:
    | { readonly provider: string; readonly id: string }
    | undefined;
  readonly levelsFor: (
    model: Model<Api>,
  ) => readonly SpawnSelection["thinkingLevel"][];
}

export interface SelectionFormState {
  readonly tab: SelectionTab;
  readonly scope: SelectionScope;
  readonly query: string;
  readonly highlightedIndex: number;
  readonly thinkingHighlight: number;
  readonly thinkingLevel: SpawnSelection["thinkingLevel"] | undefined;
  readonly submitMessage: string | undefined;
  readonly status: SelectionFormStatus;
}

export interface SelectionFormView extends SelectionFormState {
  readonly hasScoped: boolean;
  readonly models: readonly Model<Api>[];
  readonly pendingModel: Model<Api> | undefined;
  readonly thinkingLevels: readonly SpawnSelection["thinkingLevel"][];
  readonly canSubmit: boolean;
}

export function createSelectionFormState(
  input: SelectionFormInput,
): SelectionFormState {
  const scope: SelectionScope =
    scopedCatalogue(input).length > 0 ? "scoped" : "all";
  const active = activeModels(scope, input);
  const currentIndex = active.findIndex((model) =>
    modelsAreEqual(input.currentModel, model),
  );
  return {
    tab: "model",
    scope,
    query: "",
    highlightedIndex: currentIndex >= 0 ? currentIndex : 0,
    thinkingHighlight: 0,
    thinkingLevel: undefined,
    submitMessage: undefined,
    status: { kind: "open" },
  };
}

export function reduceSelectionForm(
  state: SelectionFormState,
  event: SelectionFormEvent,
  input: SelectionFormInput,
): SelectionFormState {
  if (state.status.kind !== "open" && event.type !== "cancel") {
    return state;
  }
  switch (event.type) {
    case "toggleScope":
      return toggleScope(state, input);
    case "moveRow":
      return moveRow(state, event.direction, input);
    case "filter":
      return applyFilter(state, event.query, input);
    case "moveTab":
      return moveTab(state, event.direction);
    case "confirmTab":
      return confirmTab(state, input);
    case "cancel":
      return { ...state, status: { kind: "cancel" } };
  }
}

export function viewSelectionForm(
  state: SelectionFormState,
  input: SelectionFormInput,
): SelectionFormView {
  const models = visibleModels(state, input);
  const pendingModel = modelAt(models, state.highlightedIndex);
  const thinkingLevels = pendingModel ? input.levelsFor(pendingModel) : [];
  return {
    ...state,
    hasScoped: scopedCatalogue(input).length > 0,
    models,
    pendingModel,
    thinkingLevels,
    canSubmit: pendingModel !== undefined && state.thinkingLevel !== undefined,
  };
}

function toggleScope(
  state: SelectionFormState,
  input: SelectionFormInput,
): SelectionFormState {
  if (scopedCatalogue(input).length === 0) {
    return state;
  }
  const scope: SelectionScope = state.scope === "all" ? "scoped" : "all";
  const active = activeModels(scope, input);
  const currentIndex = active.findIndex((model) =>
    modelsAreEqual(input.currentModel, model),
  );
  const highlightedIndex = state.query
    ? 0
    : currentIndex >= 0
      ? currentIndex
      : 0;
  return syncModelCursor({ ...state, scope, highlightedIndex }, input);
}

function applyFilter(
  state: SelectionFormState,
  query: string,
  input: SelectionFormInput,
): SelectionFormState {
  return syncModelCursor(
    {
      ...state,
      query,
      highlightedIndex: query ? 0 : state.highlightedIndex,
      submitMessage: undefined,
    },
    input,
  );
}

function moveRow(
  state: SelectionFormState,
  direction: "up" | "down",
  input: SelectionFormInput,
): SelectionFormState {
  if (state.tab === "thinking") {
    const levels = currentThinkingLevels(state, input);
    if (levels.length === 0) {
      return state;
    }
    return {
      ...state,
      thinkingHighlight: wrapIndex(
        state.thinkingHighlight,
        levels.length,
        direction,
      ),
    };
  }
  if (state.tab !== "model") {
    return state;
  }
  const models = visibleModels(state, input);
  if (models.length === 0) {
    return state;
  }
  return syncModelCursor(
    {
      ...state,
      highlightedIndex: wrapIndex(
        state.highlightedIndex,
        models.length,
        direction,
      ),
    },
    input,
  );
}

function moveTab(
  state: SelectionFormState,
  direction: "next" | "prev",
): SelectionFormState {
  const index = TABS.indexOf(state.tab);
  const next =
    direction === "next"
      ? (index + 1) % TABS.length
      : (index + TABS.length - 1) % TABS.length;
  return { ...state, tab: TABS[next], submitMessage: undefined };
}

function confirmTab(
  state: SelectionFormState,
  input: SelectionFormInput,
): SelectionFormState {
  if (state.tab === "model") {
    if (
      modelAt(visibleModels(state, input), state.highlightedIndex) === undefined
    ) {
      return state;
    }
    return { ...state, tab: "thinking", submitMessage: undefined };
  }
  if (state.tab === "thinking") {
    const levels = currentThinkingLevels(state, input);
    const chosen = modelAt(levels, state.thinkingHighlight);
    if (chosen === undefined) {
      return state;
    }
    return {
      ...state,
      thinkingLevel: chosen,
      tab: "submit",
      submitMessage: undefined,
    };
  }
  const model = modelAt(visibleModels(state, input), state.highlightedIndex);
  if (model === undefined) {
    return { ...state, submitMessage: "Select a model." };
  }
  if (state.thinkingLevel === undefined) {
    return { ...state, submitMessage: "Select a thinking level." };
  }
  return {
    ...state,
    submitMessage: undefined,
    status: { kind: "submit", model, thinkingLevel: state.thinkingLevel },
  };
}

function syncModelCursor(
  state: SelectionFormState,
  input: SelectionFormInput,
): SelectionFormState {
  const models = visibleModels(state, input);
  const highlightedIndex = Math.min(
    state.highlightedIndex,
    Math.max(0, models.length - 1),
  );
  const next = { ...state, highlightedIndex };
  const levels = currentThinkingLevels(next, input);
  const kept =
    next.thinkingLevel !== undefined && levels.includes(next.thinkingLevel)
      ? next.thinkingLevel
      : undefined;
  return {
    ...next,
    thinkingLevel: kept,
    thinkingHighlight:
      kept === undefined ? 0 : Math.max(0, levels.indexOf(kept)),
  };
}

function currentThinkingLevels(
  state: SelectionFormState,
  input: SelectionFormInput,
): readonly SpawnSelection["thinkingLevel"][] {
  const model = modelAt(visibleModels(state, input), state.highlightedIndex);
  return model ? input.levelsFor(model) : [];
}

function visibleModels(
  state: SelectionFormState,
  input: SelectionFormInput,
): readonly Model<Api>[] {
  return filterModels(activeModels(state.scope, input), state.query, input);
}

function activeModels(
  scope: SelectionScope,
  input: SelectionFormInput,
): readonly Model<Api>[] {
  if (scope === "scoped") {
    const scoped = scopedCatalogue(input);
    if (scoped.length > 0) {
      return scoped;
    }
  }
  return sortModels(input.availableModels, input);
}

function scopedCatalogue(input: SelectionFormInput): readonly Model<Api>[] {
  const matched: Model<Api>[] = [];
  for (const scoped of input.scopedModels) {
    const catalogue = input.availableModels.find(
      (model) =>
        model.provider === scoped.model.provider &&
        model.id === scoped.model.id,
    );
    if (
      catalogue &&
      !matched.some(
        (model) =>
          model.provider === catalogue.provider && model.id === catalogue.id,
      )
    ) {
      matched.push(catalogue);
    }
  }
  return sortModels(matched, input);
}

function sortModels(
  models: readonly Model<Api>[],
  input: SelectionFormInput,
): Model<Api>[] {
  return [...models].sort((a, b) => {
    const aCurrent = modelsAreEqual(input.currentModel, a);
    const bCurrent = modelsAreEqual(input.currentModel, b);
    if (aCurrent !== bCurrent) {
      return aCurrent ? -1 : 1;
    }
    const aDefault = isDefaultModel(a, input.defaultModel);
    const bDefault = isDefaultModel(b, input.defaultModel);
    if (aDefault !== bDefault) {
      return aDefault ? -1 : 1;
    }
    return a.provider.localeCompare(b.provider);
  });
}

function filterModels(
  models: readonly Model<Api>[],
  query: string,
  input: SelectionFormInput,
): readonly Model<Api>[] {
  if (!query) {
    return models;
  }
  const filtered = fuzzyFilter([...models], query, (model) =>
    modelHaystack(model, input),
  );
  if (!isDefaultSearch(query)) {
    return filtered;
  }
  const defaults = models.filter((model) =>
    isDefaultModel(model, input.defaultModel),
  );
  const keys = new Set(
    defaults.map((model) => `${model.provider}\0${model.id}`),
  );
  return [
    ...defaults,
    ...filtered.filter((model) => !keys.has(`${model.provider}\0${model.id}`)),
  ];
}

function modelHaystack(model: Model<Api>, input: SelectionFormInput): string {
  const text = getModelSelectorSearchText({
    id: model.id,
    provider: model.provider,
    name: model.name,
  });
  return isDefaultModel(model, input.defaultModel) ? `${text} default` : text;
}

function isDefaultSearch(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length > 0 && "default".startsWith(normalized);
}

function isDefaultModel(
  model: Model<Api>,
  defaultModel: SelectionFormInput["defaultModel"],
): boolean {
  return (
    defaultModel?.provider === model.provider && defaultModel.id === model.id
  );
}

function modelAt<T>(items: readonly T[], index: number): T | undefined {
  return index >= 0 && index < items.length ? items[index] : undefined;
}

function wrapIndex(
  index: number,
  length: number,
  direction: "up" | "down",
): number {
  if (direction === "down") {
    return index === length - 1 ? 0 : index + 1;
  }
  return index === 0 ? length - 1 : index - 1;
}
