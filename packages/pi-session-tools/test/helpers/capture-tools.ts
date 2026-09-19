/**
 * capture-tools.ts — Capture the tool definitions an extension registers.
 *
 * The extension registers its tools through `pi.registerTool`, so a test drives
 * a tool by registering against a stub `ExtensionAPI` and calling the captured
 * definition's `execute` directly.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { vi } from "vitest";

/** Register the extension's tools against a stub API and return them by name. */
export function captureTools(factory: (pi: ExtensionAPI) => void) {
  const tools = new Map<
    string,
    { execute: (...args: unknown[]) => Promise<unknown> }
  >();
  const pi = {
    registerTool: vi.fn(
      (tool: {
        name: string;
        execute: (...args: unknown[]) => Promise<unknown>;
      }) => {
        tools.set(tool.name, tool);
      },
    ),
  } as unknown as ExtensionAPI;
  factory(pi);
  return tools;
}
