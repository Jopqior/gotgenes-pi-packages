import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readReview } from "../../scripts/release/backfill-release-notes.mjs";
import { readForkSyncState } from "../../scripts/release/fork-sync/state.mjs";
import { forkSyncTarget } from "../../scripts/release/pi-subagents/config.mjs";
import { validateReleasePackages } from "../../scripts/release/release-correspondence.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const oldState = JSON.parse(
  readFileSync(
    path.join(root, "test/release/fixtures/pi-subagents-sync-state-v1.json"),
    "utf8",
  ),
);
const statePath = path.join(root, forkSyncTarget.statePath);
const registryPath = path.join(root, "scripts/release/release-packages.json");
const run = (file, ...args) =>
  spawnSync(file, args, { cwd: root, encoding: "utf8" });

describe("fork synchronization migration", () => {
  it("preserves every committed release and sync record, including rationale bytes", () => {
    const translated = {
      schemaVersion: 2,
      releases: oldState.releases,
      syncs: oldState.syncs.map(({ forkCore, ...record }) => ({
        ...record,
        forkContribution: forkCore,
      })),
    };
    expect(readForkSyncState(statePath, forkSyncTarget.directory)).toEqual(
      translated,
    );
    expect(JSON.parse(readFileSync(statePath, "utf8"))).toEqual(translated);
  });

  it("exposes only the new CLI entry points and command flag", () => {
    for (const name of ["fork-sync.mjs", "record-fork-sync.mjs"]) {
      const help = run("node", `scripts/release/${name}`, "--help");
      expect(help.status).toBe(0);
      expect(help.stdout).toContain(`Usage: ${name}`);
    }
    const syncHelp = run("bash", "scripts/upstream-sync.sh", "--help");
    expect(syncHelp.status).toBe(0);
    expect(syncHelp.stderr).toContain("--record-fork-sync");
    expect(syncHelp.stderr).not.toContain("--record-core-sync");
    for (const name of ["core-sync.mjs", "record-core-sync.mjs"]) {
      expect(run("node", `scripts/release/${name}`, "--help").status).not.toBe(
        0,
      );
    }
  });

  it("rejects the obsolete registry route and schema", () => {
    const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    expect(validateReleasePackages(registry)).toEqual(registry);
    expect(registry.schemaVersion).toBe(2);
    expect(registry.packages[0].evidence).toBe("fork-sync");
    expect(() =>
      validateReleasePackages({ ...registry, schemaVersion: 1 }),
    ).toThrow(/schemaVersion 2/);
    expect(() =>
      validateReleasePackages({
        ...registry,
        packages: [
          { ...registry.packages[0], evidence: "core-sync" },
          registry.packages[1],
        ],
      }),
    ).toThrow(/supported evidence route/);
    expect(() =>
      validateReleasePackages({
        ...registry,
        packages: [
          { ...registry.packages[0], directory: "another-fork" },
          registry.packages[1],
        ],
      }),
    ).toThrow(/supported evidence route/);
  });

  it("requires a new preview rather than accepting a previously approved artifact", () => {
    expect(() =>
      readReview(
        JSON.stringify({
          schemaVersion: 1,
          repository: "Jopqior/gotgenes-pi-packages",
          releases: [],
          missing: [],
        }),
      ),
    ).toThrow(/version/);
  });
});
