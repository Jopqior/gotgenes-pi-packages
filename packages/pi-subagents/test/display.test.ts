import { describe, expect, it } from "vitest";
import { AgentTypeRegistry } from "#src/config/agent-types";
import type { AgentConfig } from "#src/types";
import {
  describeActivity,
  formatSessionTokens,
  getDisplayName,
  getPromptModeLabel,
} from "#src/ui/display";

const testRegistry = new AgentTypeRegistry(() => new Map());

describe("getDisplayName", () => {
  it("returns displayName when set", () => {
    const customAgents = new Map<string, AgentConfig>([[
      "my-agent",
      {
        name: "my-agent",
        displayName: "My Agent",
        description: "test",
        systemPrompt: "",
        promptMode: "replace",
      },
    ]]);
    const registry = new AgentTypeRegistry(() => customAgents);
    expect(getDisplayName("my-agent", registry)).toBe("My Agent");
  });

  it("falls back to name when displayName is not set", () => {
    const customAgents = new Map<string, AgentConfig>([[
      "my-agent",
      {
        name: "my-agent",
        description: "test",
        systemPrompt: "",
        promptMode: "replace",
      },
    ]]);
    const registry = new AgentTypeRegistry(() => customAgents);
    expect(getDisplayName("my-agent", registry)).toBe("my-agent");
  });

  it("uses registry to resolve Explore displayName", () => {
    expect(getDisplayName("Explore", testRegistry)).toBe("Explore");
  });

  it("uses registry to resolve general-purpose displayName", () => {
    expect(getDisplayName("general-purpose", testRegistry)).toBe("Agent");
  });
});

describe("getPromptModeLabel", () => {
  it("returns 'twin' for append promptMode", () => {
    const customAgents = new Map<string, AgentConfig>([[
      "twin-agent",
      {
        name: "twin-agent",
        description: "test",
        systemPrompt: "",
        promptMode: "append",
      },
    ]]);
    const registry = new AgentTypeRegistry(() => customAgents);
    expect(getPromptModeLabel("twin-agent", registry)).toBe("twin");
  });

  it("returns undefined for replace promptMode", () => {
    expect(getPromptModeLabel("Explore", testRegistry)).toBeUndefined();
  });
});

describe("describeActivity", () => {
  const tools = new Map([["call-1", "read"], ["call-2", "read"], ["call-3", "grep"]]);

  it("prioritizes pending selection over active tools and response text", () => {
    expect(describeActivity(tools, "a response in progress", true)).toBe("Awaiting model/thinking selection");
    expect(describeActivity(new Map(), "a response in progress", true)).toBe("Awaiting model/thinking selection");
  });

  it("groups ordinary tools and keeps them ahead of response text", () => {
    expect(describeActivity(tools, "a response in progress", false)).toBe("reading 2 files, searching…");
    expect(describeActivity(tools, "a response in progress")).toBe("reading 2 files, searching…");
  });

  it("uses the first nonblank response line and truncates it when no tools are active", () => {
    expect(describeActivity(new Map(), "  \n  writing an answer\nmore", false)).toBe("writing an answer");
    expect(describeActivity(new Map(), "x".repeat(61))).toBe(`${"x".repeat(60)}…`);
  });

  it("falls back to thinking when response text is blank, including for an omitted third argument", () => {
    expect(describeActivity(new Map(), "  \n  ", false)).toBe("thinking…");
    expect(describeActivity(new Map())).toBe("thinking…");
  });
});

describe("formatSessionTokens", () => {
  const theme = { fg: (c: string, s: string) => `<${c}>${s}</${c}>`, bold: (s: string) => s };

  it("applies threshold colors (<70 dim, 70–85 warning, ≥85 error)", () => {
    expect(formatSessionTokens(1234, null, theme)).toBe("1.2k token");
    expect(formatSessionTokens(1234, 50, theme)).toBe("1.2k token <dim>(</dim><dim>50%</dim><dim>)</dim>");
    expect(formatSessionTokens(1234, 70, theme)).toBe("1.2k token <dim>(</dim><warning>70%</warning><dim>)</dim>");
    expect(formatSessionTokens(1234, 84, theme)).toBe("1.2k token <dim>(</dim><warning>84%</warning><dim>)</dim>");
    expect(formatSessionTokens(1234, 85, theme)).toBe("1.2k token <dim>(</dim><error>85%</error><dim>)</dim>");
    expect(formatSessionTokens(1234, 99, theme)).toBe("1.2k token <dim>(</dim><error>99%</error><dim>)</dim>");
  });

  it("annotates compaction count alongside percent", () => {
    // compactions only (e.g. immediately post-compaction, percent null)
    expect(formatSessionTokens(1234, null, theme, 1)).toBe("1.2k token <dim>(</dim><dim>⇊1</dim><dim>)</dim>");
    expect(formatSessionTokens(1234, null, theme, 3)).toBe("1.2k token <dim>(</dim><dim>⇊3</dim><dim>)</dim>");
    // percent + compactions, joined with ` · `
    expect(formatSessionTokens(1234, 45, theme, 2)).toBe("1.2k token <dim>(</dim><dim>45%</dim><dim> · </dim><dim>⇊2</dim><dim>)</dim>");
    expect(formatSessionTokens(1234, 88, theme, 4)).toBe("1.2k token <dim>(</dim><error>88%</error><dim> · </dim><dim>⇊4</dim><dim>)</dim>");
    // compactions=0 omitted
    expect(formatSessionTokens(1234, 45, theme, 0)).toBe("1.2k token <dim>(</dim><dim>45%</dim><dim>)</dim>");
  });
});
