import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { updateCorrespondenceDocument } from "../../scripts/release/correspondence-table.mjs";
import { validateForkSyncState } from "../../scripts/release/fork-sync/state.mjs";
import {
  requireForkSyncTarget,
  resolveForkSyncTarget,
} from "../../scripts/release/fork-sync-targets.mjs";
import { forkSyncTarget } from "../../scripts/release/pi-subagents/config.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const worktrees = {
  directory: "pi-subagents-worktrees",
  statePath: "scripts/release/pi-subagents-worktrees/sync-state.json",
  correspondencePath:
    "docs/upstream/pi-subagents-worktrees-release-correspondence.md",
};
const cli = (...args) =>
  spawnSync(
    process.execPath,
    [path.join(root, "scripts/release/fork-sync-targets.mjs"), ...args],
    { encoding: "utf8" },
  );

function assertWorktreesArtifacts(state, view) {
  validateForkSyncState(state, worktrees.directory);
  updateCorrespondenceDocument(view, "");
  // The workflow contract owns table/state correspondence; these target
  // artifacts must also remain usable before the first fork tag exists.
  if (state.releases.length === 0) {
    expect(view).toMatch(/unreleased/i);
    expect(view).not.toMatch(/pi-subagents-worktrees-v\d/);
  }
}

describe("fixed fork sync targets", () => {
  it("retains the core value and resolves a distinct frozen worktrees target", () => {
    expect(resolveForkSyncTarget("pi-subagents")).toBe(forkSyncTarget);
    expect(requireForkSyncTarget("pi-subagents-worktrees")).toEqual(worktrees);
    expect(
      Object.isFrozen(requireForkSyncTarget("pi-subagents-worktrees")),
    ).toBe(true);
    expect(Object.isFrozen(forkSyncTarget)).toBe(true);
  });

  it.each([
    "pi-subagents-model-selector",
    "unknown",
    "../pi-subagents",
    "pi-subagents/",
    "./pi-subagents",
    "/pi-subagents",
    "pi-subagents\n",
    "",
    "__proto__",
    "constructor",
  ])("does not resolve or authorize %j", (directory) => {
    expect(resolveForkSyncTarget(directory)).toBeNull();
    expect(() => requireForkSyncTarget(directory)).toThrow(
      /unsupported fork sync package/,
    );
    const result = cli(directory);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("null\n");
    expect(result.stderr).toBe("");
  });

  it.each(["pi-subagents", "pi-subagents-worktrees"])(
    "prints the exact JSON target for %s",
    (directory) => {
      const result = cli(directory);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(
        directory === "pi-subagents" ? forkSyncTarget : worktrees,
      );
      expect(result.stderr).toBe("");
    },
  );

  it.each(
    [
      [],
      ["pi-subagents", "extra"],
      ["--package", "pi-subagents"],
      ["--unknown"],
    ].map((args) => ({ args })),
  )("rejects malformed CLI arguments $args", ({ args }) => {
    const result = cli(...args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/Usage:|unknown argument/);
  });

  it("provides help without resolving a target", () => {
    const result = cli("--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/<package-directory>/);
    expect(result.stderr).toBe("");
  });

  describe("worktrees target artifacts", () => {
    const start = "<!-- release-correspondence:start -->";
    const end = "<!-- release-correspondence:end -->";
    const empty = { schemaVersion: 2, releases: [], syncs: [] };
    const emptyView =
      `# Worktrees unreleased scaffold\n\n${start}\n\n` +
      `No fork release has been recorded.\n\n${end}\n`;
    const projected = {
      ...empty,
      releases: [
        {
          forkTag: "pi-subagents-worktrees-v0.1.0",
          upstream: { version: "0.3.3", commit: "a".repeat(40) },
          upstreamTip: "b".repeat(40),
        },
      ],
    };
    const projectedView = updateCorrespondenceDocument(
      emptyView,
      "| Fork `@jopqior/pi-subagents-worktrees` | Direct upstream release | Fixed source |\n" +
        "| --- | --- | --- |\n" +
        `| 0.1.0 | \`0.3.3\` | [source](https://github.com/gotgenes/pi-packages/blob/${"a".repeat(40)}/packages/pi-subagents-worktrees) |\n`,
    );

    it("validates the real state and managed region before or after bootstrap", () => {
      assertWorktreesArtifacts(
        JSON.parse(readFileSync(path.join(root, worktrees.statePath), "utf8")),
        readFileSync(path.join(root, worktrees.correspondencePath), "utf8"),
      );
    });

    it("retains the unreleased empty scaffold contract in an explicit fixture", () => {
      assertWorktreesArtifacts(empty, emptyView);
    });

    it("accepts first-row projected artifacts without looking up a fork tag", () => {
      assertWorktreesArtifacts(projected, projectedView);
    });

    it.each([
      ["fork identity", { forkTag: "pi-subagents-v0.1.0" }, /forkTag/],
      [
        "upstream version",
        { upstream: { ...projected.releases[0].upstream, version: "latest" } },
        /upstream.version/,
      ],
      [
        "fixed upstream commit",
        { upstream: { ...projected.releases[0].upstream, commit: "main" } },
        /upstream.commit/,
      ],
    ])(
      "rejects invalid populated %s evidence",
      (_label, change, diagnostic) => {
        expect(() =>
          assertWorktreesArtifacts(
            {
              ...projected,
              releases: [{ ...projected.releases[0], ...change }],
            },
            projectedView,
          ),
        ).toThrow(diagnostic);
      },
    );

    describe("standalone managed-marker pair", () => {
      it.each([
        ["missing start", emptyView.replace(start, "")],
        ["missing end", emptyView.replace(end, "")],
        ["duplicate start", `${emptyView}${start}\n`],
        ["duplicate end", `${emptyView}${end}\n`],
        ["second pair", `${emptyView}${start}\n${end}\n`],
        ["reversed markers", `${end}\n\n${start}\n`],
        ["inline start prefix", emptyView.replace(start, `prefix ${start}`)],
        ["inline start suffix", emptyView.replace(start, `${start} suffix`)],
        ["inline end prefix", emptyView.replace(end, `prefix ${end}`)],
        ["inline end suffix", emptyView.replace(end, `${end} suffix`)],
      ])("rejects %s", (_label, view) => {
        expect(() => assertWorktreesArtifacts(empty, view)).toThrow(
          /marker|region/,
        );
      });
    });
  });
});
