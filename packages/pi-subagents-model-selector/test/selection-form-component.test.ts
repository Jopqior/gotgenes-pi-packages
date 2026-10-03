import type { Api, Model } from "@earendil-works/pi-ai";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
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
const ARROW_LEFT = "\u001b[D";
const ARROW_RIGHT = "\u001b[C";

function plainTheme() {
  return {
    fg(_color: string, text: string) {
      return text;
    },
    bg(_color: "selectedBg", text: string) {
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

function ansiTheme() {
  return {
    fg(color: string, text: string) {
      const code = color === "success" ? 32 : color === "text" ? 37 : 90;
      return `\u001b[${code}m${text}\u001b[39m`;
    },
    bg(_color: "selectedBg", text: string) {
      return `\u001b[44m${text}\u001b[49m`;
    },
  };
}

type TestTheme = ReturnType<typeof plainTheme>;

function makeFakeCustom(theme: TestTheme = plainTheme()) {
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
        theme,
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
  theme: TestTheme = plainTheme(),
) {
  const { custom, captured } = makeFakeCustom(theme);
  const resultPromise = presentSelectionForm(custom, input, signal);
  await vi.waitFor(() => {
    expect(captured.component).toBeDefined();
  });
  if (!captured.component) throw new Error("Chooser was not captured");
  return { captured, component: captured.component, resultPromise };
}

function screen(component: CapturedComponent | undefined): string {
  return stripTerminalSequences((component?.render(80) ?? []).join("\n"));
}

function tabStrip(component: CapturedComponent): string {
  const line = component
    .render(80)
    .find((line) => stripTerminalSequences(line).includes("☰ Submit"));
  if (!line) throw new Error("Missing tab strip");
  return stripTerminalSequences(line).trim().replace(/ +/g, " ");
}

function activeTab(component: CapturedComponent, width = 80): string {
  const chunks = component.render(width).flatMap((line) =>
    line
      .split("\u001b[44m")
      .slice(1)
      .map((chunk) => chunk.split("\u001b[49m")[0]),
  );
  expect(chunks).toHaveLength(1);
  return stripTerminalSequences(chunks[0]).trim();
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

    describe("tab navigation and search editing", () => {
      it.each([
        { key: TAB, pages: ["☐ Thinking", "☰ Submit", "☒ Model"] },
        { key: SHIFT_TAB, pages: ["☰ Submit", "☐ Thinking", "☒ Model"] },
      ])(
        "cycles without confirmation or submission (key: $key)",
        async ({ key, pages }) => {
          const { component, resultPromise } = await openForm(
            makeInput(),
            liveSignal(),
            ansiTheme(),
          );
          const resolved = vi.fn();
          const observed = resultPromise.then(resolved);
          for (const page of pages) {
            component.handleInput(key);
            expect(activeTab(component)).toBe(page);
            expect(tabStrip(component)).toBe("← ☒ Model ☐ Thinking ☰ Submit →");
          }
          await Promise.resolve();
          expect(resolved).not.toHaveBeenCalled();
          component.handleInput(ESCAPE);
          await observed;
          expect(resolved).toHaveBeenCalledWith({ kind: "cancel" });
        },
      );

      it.each([ARROW_LEFT, ARROW_RIGHT])(
        "keeps empty search on Model for cursor key %s",
        async (key) => {
          const { component } = await openForm(
            makeInput(),
            liveSignal(),
            ansiTheme(),
          );
          component.handleInput(key);
          expect(activeTab(component)).toBe("☒ Model");
          expect(screen(component)).toContain("> ");
        },
      );

      it("inserts at the real cursor after left and right movements in a non-empty search", async () => {
        const { component } = await openForm(
          makeInput(),
          liveSignal(),
          ansiTheme(),
        );
        component.handleInput("hiku");
        component.handleInput(ARROW_LEFT);
        component.handleInput(ARROW_LEFT);
        component.handleInput(ARROW_LEFT);
        component.handleInput(ARROW_RIGHT);
        component.handleInput(ARROW_LEFT);
        component.handleInput("a");
        expect(activeTab(component)).toBe("☒ Model");
        expect(screen(component)).toContain("> haiku");
      });

      it("preserves a non-first filtered model and thinking on cursor-only query movement", async () => {
        const { component, resultPromise } = await openForm(
          makeInput({ scopedModels: [], defaultModel: undefined }),
        );
        component.handleInput("cl");
        component.handleInput(ARROW_DOWN);
        component.handleInput(ENTER);
        component.handleInput(ARROW_DOWN);
        component.handleInput(ENTER);
        component.handleInput(TAB);
        expect(screen(component)).toContain(`→ ${haiku.id}`);
        component.handleInput(ARROW_LEFT);
        expect(screen(component)).toContain(`→ ${haiku.id}`);
        component.handleInput(ARROW_RIGHT);
        expect(screen(component)).toContain(`→ ${haiku.id}`);
        component.handleInput(SHIFT_TAB);
        expect(screen(component)).toContain("Thinking: high");
        component.handleInput(ENTER);
        await expect(resultPromise).resolves.toEqual({
          kind: "submit",
          model: haiku,
          thinkingLevel: "high",
        });
      });
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
    describe("frame and completion", () => {
      it("places the task title before the tab strip between horizontal rules", async () => {
        const input = makeInput();
        const { component } = await openForm(input);
        const lines = component.render(80);
        expect(lines[0]).toBe("─".repeat(80));
        expect(lines[1]).toBe(input.title);
        expect(stripTerminalSequences(lines[2])).toContain("☰ Submit");
        expect(lines.at(-1)).toBe("─".repeat(80));
        expect(tabStrip(component)).toBe("← ☒ Model ☐ Thinking ☰ Submit →");
      });

      it.each(["Model", "Thinking", "Submit"])(
        "styles only the active %s tab and gives accurate hints",
        async (page) => {
          const { component } = await openForm(
            makeInput(),
            liveSignal(),
            ansiTheme(),
          );
          for (
            let index = 0;
            index < ["Model", "Thinking", "Submit"].indexOf(page);
            index++
          )
            component.handleInput(TAB);
          expect(activeTab(component)).toBe(
            page === "Model"
              ? "☒ Model"
              : page === "Thinking"
                ? "☐ Thinking"
                : "☰ Submit",
          );
          const strip = component.render(80)[2];
          expect(strip).toContain("\u001b[32m☒\u001b[39m");
          expect(strip).toContain("\u001b[90m☐\u001b[39m");
          expect(strip).toContain(`\u001b[37m${page}\u001b[39m`);
          const text = screen(component);
          expect(text).toContain("Tab next · Shift+Tab previous");
          expect(text).toContain(
            page === "Submit"
              ? "Enter submit · Esc cancel"
              : "Enter confirm · Esc cancel",
          );
          expect(text).not.toContain("←/→ tabs");
          if (page === "Model") expect(text).toContain("←/→ edit search");
          else expect(text).not.toContain("←/→ edit search");
        },
      );

      it("leaves Thinking unchecked for an off-only model until explicitly chosen", async () => {
        const { component } = await openForm(
          makeInput({ availableModels: [opus], scopedModels: [] }),
        );
        expect(tabStrip(component)).toBe("← ☒ Model ☐ Thinking ☰ Submit →");
        component.handleInput(ENTER);
        expect(tabStrip(component)).toBe("← ☒ Model ☐ Thinking ☰ Submit →");
        component.handleInput(ENTER);
        expect(tabStrip(component)).toBe("← ☒ Model ☒ Thinking ☰ Submit →");
      });

      it("unchecks Model and Thinking when search has no results", async () => {
        const { component } = await openForm();
        component.handleInput(ENTER);
        component.handleInput(ARROW_DOWN);
        component.handleInput(ENTER);
        component.handleInput(TAB);
        component.handleInput("zzzz-no-match");
        expect(tabStrip(component)).toBe("← ☐ Model ☐ Thinking ☰ Submit →");
      });

      describe.each(["row", "search", "scope"])(
        "model change by %s",
        (change) => {
          it.each([true, false])(
            "reflects supported thinking (compatible: %s)",
            async (compatible) => {
              const target = compatible ? haiku : opus;
              const { component } = await openForm(
                makeInput({
                  availableModels: [sonnet, target],
                  currentModel: undefined,
                  scopedModels: change === "scope" ? [{ model: sonnet }] : [],
                  defaultModel:
                    change === "scope"
                      ? { provider: target.provider, id: target.id }
                      : undefined,
                }),
              );
              component.handleInput(ENTER);
              component.handleInput(ARROW_DOWN);
              component.handleInput(ENTER);
              expect(tabStrip(component)).toBe(
                "← ☒ Model ☒ Thinking ☰ Submit →",
              );
              component.handleInput(TAB);
              component.handleInput(
                change === "row"
                  ? ARROW_DOWN
                  : change === "scope"
                    ? CTRL_S
                    : target.id,
              );
              expect(tabStrip(component)).toBe(
                compatible
                  ? "← ☒ Model ☒ Thinking ☰ Submit →"
                  : "← ☒ Model ☐ Thinking ☰ Submit →",
              );
              component.handleInput(SHIFT_TAB);
              expect(screen(component)).toContain(
                `Model: ${target.id} [${target.provider}]`,
              );
              expect(screen(component)).toContain(
                compatible ? "Thinking: high" : "Thinking: (none)",
              );
            },
          );
        },
      );

      it("requires a currently supported level rather than just a present value for the Thinking marker", async () => {
        const supported = vi.fn(
          (): readonly SpawnSelection["thinkingLevel"][] => ["off", "high"],
        );
        const { component } = await openForm(
          makeInput({ levelsFor: supported }),
        );
        component.handleInput(ENTER);
        component.handleInput(ARROW_DOWN);
        component.handleInput(ENTER);
        expect(tabStrip(component)).toBe("← ☒ Model ☒ Thinking ☰ Submit →");
        supported.mockReturnValue(["off"]);
        expect(tabStrip(component)).toBe("← ☒ Model ☐ Thinking ☰ Submit →");
      });
    });
    describe("terminal width and resize", () => {
      const longModel = makeModel({
        id: "模型-🔬-é-".repeat(12),
        name: "Research 模型 🧪 é ".repeat(14),
        provider: "provider-供应商-🌏-".repeat(8),
      });
      const longTitle =
        "Select model for Explore agent-identity-123 — 调查 🔬 é ".repeat(5);
      const widths = [
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 32, 40,
        80, 120,
      ];

      describe.each([true, false])("scoped catalogue: %s", (hasScoped) => {
        it.each(["Model", "Thinking", "Submit"])(
          "bounds every line and retains active %s and the pending pair through resize",
          async (page) => {
            const { component, resultPromise } = await openForm(
              makeInput({
                title: longTitle,
                availableModels: [longModel],
                currentModel: longModel,
                defaultModel: {
                  id: longModel.id,
                  provider: longModel.provider,
                },
                scopedModels: hasScoped ? [{ model: longModel }] : [],
              }),
              liveSignal(),
              ansiTheme(),
            );
            component.handleInput(ENTER);
            component.handleInput(ARROW_DOWN);
            component.handleInput(ENTER);
            if (page === "Model") component.handleInput(TAB);
            if (page === "Thinking") component.handleInput(SHIFT_TAB);
            const wide = component.render(120);
            const marker = page === "Submit" ? "☰" : "☒";
            for (const width of widths) {
              const lines = component.render(width);
              for (const line of lines)
                expect(
                  visibleWidth(line),
                  `page=${page}, width=${width}, line=${line}`,
                ).toBeLessThanOrEqual(Math.max(0, width));
              if (width <= 0) {
                expect(lines.every((line) => line === "")).toBe(true);
                continue;
              }
              const active = activeTab(component, width);
              if (width >= 16) {
                expect(active).toBe(`${marker} ${page}`);
                const strip = stripTerminalSequences(
                  lines.find((line) => line.includes("\u001b[44m")) ?? "",
                );
                expect(strip.startsWith("←")).toBe(true);
                expect(strip.endsWith("→")).toBe(true);
              } else if (width <= 2) {
                expect(active).toBe(page[0]);
              } else {
                const label = active.replace(/[☒☰ ]/g, "");
                expect(
                  page === "Thinking"
                    ? ["Thinking", "Think", "T"]
                    : [page, page[0]],
                ).toContain(label);
              }
            }
            expect(component.render(120)).toEqual(wide);
            expect(activeTab(component, 120)).toBe(`${marker} ${page}`);
            if (page === "Model") component.handleInput(SHIFT_TAB);
            if (page === "Thinking") component.handleInput(TAB);
            component.handleInput(ENTER);
            await expect(resultPromise).resolves.toEqual({
              kind: "submit",
              model: longModel,
              thinkingLevel: "high",
            });
          },
        );
      });

      it("wraps task identity, catalogue notice and keyboard hints instead of dropping their content", async () => {
        const { component } = await openForm(
          makeInput({ title: longTitle, scopedModels: [] }),
        );
        const lines = component.render(24).map(stripTerminalSequences);
        for (const line of lines)
          expect(visibleWidth(line)).toBeLessThanOrEqual(24);
        const stripIndex = lines.findIndex((line) => line.startsWith("←"));
        expect(stripIndex).toBeGreaterThan(1);
        expect(lines.slice(1, stripIndex).join("").replace(/\s/g, "")).toBe(
          longTitle.replace(/\s/g, ""),
        );
        const body = lines
          .slice(stripIndex + 1)
          .join(" ")
          .replace(/\s+/g, " ");
        expect(body).toContain(
          "Only showing models from configured providers. Use /login to add providers.",
        );
        expect(body).toContain("Tab next · Shift+Tab previous");
        expect(body).toContain("←/→ edit search");
        expect(body).toContain("Enter confirm · Esc cancel");
      });

      it("wraps oversized review values and validation messages within columns", async () => {
        const { component } = await openForm(
          makeInput({
            availableModels: [longModel],
            currentModel: longModel,
            scopedModels: [],
          }),
        );
        component.handleInput(SHIFT_TAB);
        component.handleInput(ENTER);
        const lines = component.render(24).map(stripTerminalSequences);
        const text = lines.join("").replace(/\s/g, "");
        expect(text).toContain(`Model:${longModel.id}[${longModel.provider}]`);
        expect(text).toContain("Thinking:(none)");
        expect(lines.join(" ").replace(/\s+/g, " ")).toContain(
          "Select a thinking level.",
        );
        for (const line of lines)
          expect(visibleWidth(line)).toBeLessThanOrEqual(24);
      });

      it("clips wide-character model rows by columns rather than code units", async () => {
        const model = makeModel({
          id: "界".repeat(20),
          name: "长名称".repeat(20),
          provider: "p",
        });
        const { component } = await openForm(
          makeInput({
            title: "x",
            availableModels: [model],
            currentModel: model,
            scopedModels: [],
          }),
        );
        const lines = component.render(16).map(stripTerminalSequences);
        expect(lines.find((line) => line.startsWith("→ "))).toBe(
          `→ ${"界".repeat(7)}`,
        );
        for (const line of lines)
          expect(visibleWidth(line)).toBeLessThanOrEqual(16);
      });

      it("bounds empty-result pages without inventing completion", async () => {
        const { component } = await openForm(
          makeInput(),
          liveSignal(),
          ansiTheme(),
        );
        component.handleInput("zzzz-no-match");
        for (const page of ["Model", "Thinking", "Submit"]) {
          for (const width of [1, 2, 16, 24, 80]) {
            for (const line of component.render(width))
              expect(visibleWidth(line)).toBeLessThanOrEqual(width);
            expect(activeTab(component, width)).toBe(
              width <= 2 ? page[0] : `${page === "Submit" ? "☰" : "☐"} ${page}`,
            );
          }
          component.handleInput(TAB);
        }
      });

      it("bounds the Input prompt when only one column is available", async () => {
        const { component } = await openForm(
          makeInput({ title: "x" }),
          liveSignal(),
          ansiTheme(),
        );
        const lines = component.render(1);
        expect(lines.map(stripTerminalSequences)).toContain(">");
        for (const line of lines)
          expect(visibleWidth(line)).toBeLessThanOrEqual(1);
        expect(activeTab(component, 1)).toBe("M");
      });
    });

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
