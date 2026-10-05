import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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

  it("starts worktrees unreleased, with empty evidence and one marker pair", () => {
    expect(
      JSON.parse(readFileSync(path.join(root, worktrees.statePath), "utf8")),
    ).toEqual({ schemaVersion: 2, releases: [], syncs: [] });
    const view = readFileSync(
      path.join(root, worktrees.correspondencePath),
      "utf8",
    );
    expect(view).toMatch(/unreleased/i);
    expect(view.match(/<!-- release-correspondence:start -->/g)).toHaveLength(
      1,
    );
    expect(view.match(/<!-- release-correspondence:end -->/g)).toHaveLength(1);
    expect(view).not.toMatch(/pi-subagents-worktrees-v\d/);
  });
});
