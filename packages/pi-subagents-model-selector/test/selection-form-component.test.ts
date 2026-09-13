import type { Api, Model } from "@earendil-works/pi-ai";
import type { SpawnSelection } from "@jopqior/pi-subagents";
import { describe, expect, it, vi } from "vitest";
import type { SelectionFormInput } from "#src/selection-form";
import { presentSelectionForm } from "#src/selection-form-component";
import { makeModel } from "#test/helpers/make-model";
import {
  haiku,
  liveSignal,
  opus,
  sonnet,
} from "#test/helpers/selection-fixtures";

const TAB = "\t";
const ENTER = "\r";
const ESCAPE = "\u001b";
const ARROW_DOWN = "\u001b[B";
const CTRL_S = "\u0013";

function plainTheme() {
  return {
    fg(_color: string, text: string) {
      return text;
    },
  };
}

function matches(data: string, action: string): boolean {
  switch (action) {
    case "tui.input.tab":
      return data === TAB;
    case "tui.select.up":
      return data === "\u001b[A";
    case "tui.select.down":
      return data === ARROW_DOWN;
    case "tui.select.confirm":
      return data === ENTER;
    case "tui.select.cancel":
      return data === ESCAPE || data === "\u0003";
    default:
      return false;
  }
}

interface CapturedComponent {
  render(width: number): string[];
  handleInput(data: string): void;
}

function makeFakeCustom() {
  const captured: {
    component?: CapturedComponent;
    options?: unknown;
  } = {};
  const custom = (
    factory: (
      tui: { requestRender: () => void },
      theme: ReturnType<typeof plainTheme>,
      keybindings: { matches(data: string, action: string): boolean },
      done: (result: unknown) => void,
    ) => CapturedComponent,
    options: unknown,
  ) => {
    captured.options = options;
    return new Promise((resolve) => {
      captured.component = factory(
        { requestRender: vi.fn() },
        plainTheme(),
        { matches },
        resolve,
      );
    });
  };
  return {
    custom: custom as Parameters<typeof presentSelectionForm>[0],
    captured,
  };
}

function levelsFor(
  model: Model<Api>,
): readonly SpawnSelection["thinkingLevel"][] {
  if (model.id === "gpt-opus") return ["off"];
  return ["off", "high"];
}

function makeInput(
  overrides: Partial<SelectionFormInput> = {},
): SelectionFormInput {
  return {
    title: "Select model for Explore agent-1 — find TODOs",
    availableModels: [sonnet, haiku, opus],
    currentModel: sonnet,
    scopedModels: [{ model: haiku }],
    defaultModel: { provider: haiku.provider, id: haiku.id },
    levelsFor,
    ...overrides,
  };
}

async function openForm(
  input: SelectionFormInput = makeInput(),
  signal: AbortSignal = liveSignal(),
) {
  const { custom, captured } = makeFakeCustom();
  const resultPromise = presentSelectionForm(custom, input, signal);
  await vi.waitFor(() => {
    expect(captured.component).toBeDefined();
  });
  return { captured, resultPromise };
}

function screen(component: CapturedComponent | undefined): string {
  return (component?.render(80) ?? []).join("\n");
}

describe("presentSelectionForm", () => {
  it("renders inline rather than as an overlay", async () => {
    const { captured } = await openForm();
    expect(captured.options).toEqual({ overlay: false });
  });

  it("toggles scope on Ctrl+S without inserting into the query", async () => {
    const { captured } = await openForm();
    expect(screen(captured.component)).toContain("claude-haiku");
    expect(screen(captured.component)).not.toContain("claude-sonnet");

    captured.component?.handleInput("h");
    expect(screen(captured.component)).toMatch(/> h/);
    captured.component?.handleInput(CTRL_S);
    const text = screen(captured.component);
    expect(text).toContain("claude-sonnet");
    expect(text).toContain("Scope: all");
    expect(text).toMatch(/> h/);
    expect(text).not.toMatch(/> hs/);
  });

  it("moves to the thinking tab on Tab instead of inserting into the search Input", async () => {
    const { captured } = await openForm();
    expect(screen(captured.component)).toContain("> ");
    captured.component?.handleInput(TAB);
    const text = screen(captured.component);
    expect(text).not.toContain("> ");
    expect(text).toContain("off");
    expect(text).toContain("high");
  });

  it("resolves cancel when the abort signal fires after custom captures done", async () => {
    const controller = new AbortController();
    const { resultPromise } = await openForm(makeInput(), controller.signal);
    controller.abort();
    await expect(resultPromise).resolves.toEqual({ kind: "cancel" });
  });

  it("resolves cancel without calling custom when the signal is already aborted", async () => {
    const { custom, captured } = makeFakeCustom();
    const controller = new AbortController();
    controller.abort();
    await expect(
      presentSelectionForm(custom, makeInput(), controller.signal),
    ).resolves.toEqual({ kind: "cancel" });
    expect(captured.component).toBeUndefined();
    expect(captured.options).toBeUndefined();
  });

  it("shows a 10-row window into a longer catalogue", async () => {
    const availableModels = Array.from({ length: 12 }, (_, index) =>
      makeModel({ id: `m${index}`, provider: "p" }),
    );
    const { captured } = await openForm(
      makeInput({
        availableModels,
        currentModel: undefined,
        scopedModels: [],
        defaultModel: undefined,
      }),
    );
    const text = screen(captured.component);
    expect(text).toContain("m0");
    expect(text).toContain("m9");
    expect(text).not.toContain("m10");
    expect(text).toContain("(1/12)");
  });

  it("renders provider badges, the current checkmark, and the default badge", async () => {
    const { captured } = await openForm(
      makeInput({ scopedModels: [], currentModel: sonnet }),
    );
    const text = screen(captured.component);
    expect(text).toContain("[anthropic]");
    expect(text).toContain("✓");
    expect(text).toContain("· default");
  });

  it("cancels from Escape", async () => {
    const { captured, resultPromise } = await openForm();
    captured.component?.handleInput(ESCAPE);
    await expect(resultPromise).resolves.toEqual({ kind: "cancel" });
  });

  it("submits the pending pair from the Submit tab", async () => {
    const { captured, resultPromise } = await openForm(
      makeInput({ scopedModels: [] }),
    );
    captured.component?.handleInput(ENTER);
    captured.component?.handleInput(ARROW_DOWN);
    captured.component?.handleInput(ENTER);
    captured.component?.handleInput(ENTER);
    await expect(resultPromise).resolves.toEqual({
      kind: "submit",
      model: sonnet,
      thinkingLevel: "high",
    });
  });
});
