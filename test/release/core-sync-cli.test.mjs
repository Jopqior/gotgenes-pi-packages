import { spawnSync } from "node:child_process";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BASE_TAG,
  createCoreSyncScenario,
} from "./helpers/core-sync-scenario.mjs";

// The decision CLI's contract: stdout/stderr/exit status for a decided tag,
// nothing pending, a full --json document, and evidence failures — plus
// agreement with the library decision on the same repository.

/** @type {ReturnType<typeof createCoreSyncScenario>} */
let scenario;
/** @type {ReturnType<typeof createCoreSyncScenario>["repo"]} */
let repo;
/** @type {ReturnType<typeof createCoreSyncScenario>["writeCoreSyncState"]} */
let writeCoreSyncState;
/** @type {ReturnType<typeof createCoreSyncScenario>["decide"]} */
let decide;
/** @type {ReturnType<typeof createCoreSyncScenario>["syncUpstream"]} */
let syncUpstream;

const repoRoot = path.resolve(import.meta.dirname, "../..");
const CORE_ARGS = () => repo.cliffArgs("pi-subagents");

beforeEach(() => {
  scenario = createCoreSyncScenario();
  repo = scenario.repo;
  writeCoreSyncState = scenario.writeCoreSyncState;
  decide = scenario.decide;
  syncUpstream = scenario.syncUpstream;
});

afterEach(() => {
  scenario.dispose();
});

describe("decision CLI", () => {
  /**
   * @param {...string} extra
   */
  function runCli(...extra) {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, "scripts", "release", "core-sync.mjs"),
        "--repo",
        repo.dir,
        "--current",
        BASE_TAG,
        ...extra,
        "--",
        ...CORE_ARGS(),
      ],
      { encoding: "utf8" },
    );
    return {
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  it("prints the decided tag on stdout with exit status 0", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    const result = runCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("pi-subagents-v1.0.1\n");
  });

  it("prints nothing with exit status 0 when nothing is releasable", () => {
    writeCoreSyncState();

    const result = runCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("prints a full decision document with --json", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    const result = runCli("--json");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      currentTag: BASE_TAG,
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
      forkLevel: "none",
    });
  });

  it("reports evidence failures on stderr with a nonzero status", () => {
    writeCoreSyncState({ releases: [] });

    const result = runCli();

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/^error: /);
    expect(result.stderr).toMatch(/no recorded upstream correspondence/);
  });

  it("agrees with the library decision on the same repository", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents)!: fork break",
      "packages/pi-subagents/break.txt",
    );
    writeCoreSyncState();

    const cli = runCli();
    const library = decide();

    expect(cli.stdout.trim()).toBe(library.nextTag);
  });
});
