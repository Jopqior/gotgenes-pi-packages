import type { Api, Model } from "@earendil-works/pi-ai";
import type { SpawnSelection } from "@jopqior/pi-subagents";
import { describe, expect, it, vi } from "vitest";
import type {
  SelectionFormInput,
  SelectionFormResult,
} from "#src/selection-form";
import { presentSelectionForm } from "#src/selection-form-component";
import { makeModel } from "#test/helpers/make-model";
import {
  haiku,
  liveSignal,
  opus,
  sonnet,
} from "#test/helpers/selection-fixtures";

const TAB = "\t";
const SHIFT_TAB = "\u001b[Z";
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
  const custom: Parameters<typeof presentSelectionForm>[0] = (
    factory,
    options,
  ) => {
    captured.options = options;
    return new Promise<SelectionFormResult>((resolve) => {
      const component = factory(
        { requestRender: vi.fn() },
        plainTheme(),
        { matches },
        resolve,
      );
      const handleInput = component.handleInput?.bind(component);
      if (!handleInput) throw new Error("Chooser must handle input");
      captured.component = {
        render: (width) => component.render(width),
        handleInput,
      };
    });
  };
  return {
    custom,
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
  describe("keyboard input", () => {
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
  });

  describe("rendering", () => {
    describe.each([true, false])("scope catalogue present: %s", (hasScoped) => {
      it.each([0, 1, 2])(
        "shows scope information only on Model (page %s)",
        async (page) => {
          const { captured } = await openForm(
            makeInput({
              scopedModels: hasScoped ? [{ model: haiku }] : [],
            }),
          );
          for (let index = 0; index < page; index++)
            captured.component?.handleInput(TAB);
          const text = screen(captured.component);
          const scopeLines = [
            "Scope: scoped | all",
            "Scope: all | scoped",
            "Ctrl+S scope (all/scoped)",
          ];
          const notice =
            "Only showing models from configured providers. Use /login to add providers.";
          if (page === 0 && hasScoped) {
            expect(text).toContain("Scope: all | scoped");
            expect(text).toContain(scopeLines[2]);
            expect(text).not.toContain(notice);
          } else if (page === 0) {
            expect(text).toContain(notice);
            for (const line of scopeLines) expect(text).not.toContain(line);
          } else {
            for (const line of scopeLines) expect(text).not.toContain(line);
            expect(text).not.toContain(notice);
          }
        },
      );
    });

    it("renders inline rather than as an overlay", async () => {
      const { captured } = await openForm();
      expect(captured.options).toEqual({ overlay: false });
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
  });

  describe("submission", () => {
    it.each(["thinking", "submit"])(
      "ignores Ctrl+S on %s without changing the submitted pair",
      async (page) => {
        const { captured, resultPromise } = await openForm(
          makeInput({ currentModel: opus }),
        );
        captured.component?.handleInput(ENTER);
        captured.component?.handleInput(ARROW_DOWN);
        captured.component?.handleInput(ENTER);
        if (page === "thinking") captured.component?.handleInput(SHIFT_TAB);
        captured.component?.handleInput(CTRL_S);
        if (page === "thinking") captured.component?.handleInput(TAB);
        expect(screen(captured.component)).toContain(
          `Model: ${haiku.id} [${haiku.provider}]`,
        );
        expect(screen(captured.component)).toContain("Thinking: high");
        captured.component?.handleInput(ENTER);
        await expect(resultPromise).resolves.toEqual({
          kind: "submit",
          model: haiku,
          thinkingLevel: "high",
        });
      },
    );

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

  describe("cancellation", () => {
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

    it("cancels from Escape", async () => {
      const { captured, resultPromise } = await openForm();
      captured.component?.handleInput(ESCAPE);
      await expect(resultPromise).resolves.toEqual({ kind: "cancel" });
    });
  });
});
