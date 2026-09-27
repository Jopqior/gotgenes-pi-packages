import { spawnSync } from "node:child_process";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BASE_TAG,
  createForkSyncScenario,
} from "./helpers/fork-sync-scenario.mjs";

// The decision CLI's contract: stdout/stderr/exit status for a decided tag,
// nothing pending, a full --json document, and evidence failures — plus
// agreement with the library decision on the same repository.

/** @type {ReturnType<typeof createForkSyncScenario>} */
let scenario;
/** @type {ReturnType<typeof createForkSyncScenario>["repo"]} */
let repo;
/** @type {ReturnType<typeof createForkSyncScenario>["writeForkSyncState"]} */
let writeForkSyncState;
/** @type {ReturnType<typeof createForkSyncScenario>["decide"]} */
let decide;
/** @type {ReturnType<typeof createForkSyncScenario>["syncUpstream"]} */
let syncUpstream;

const repoRoot = path.resolve(import.meta.dirname, "../..");
const FORK_ARGS = () => repo.cliffArgs("pi-subagents");

beforeEach(() => {
  scenario = createForkSyncScenario();
  repo = scenario.repo;
  writeForkSyncState = scenario.writeForkSyncState;
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
        path.join(repoRoot, "scripts", "release", "fork-sync.mjs"),
        "--repo",
        repo.dir,
        "--current",
        BASE_TAG,
        ...extra,
        "--",
        ...FORK_ARGS(),
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
    writeForkSyncState();

    const result = runCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("pi-subagents-v1.0.1\n");
  });

  it("prints nothing with exit status 0 when nothing is releasable", () => {
    writeForkSyncState();

    const result = runCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("prints a full decision document with --json", () => {
    syncUpstream({ version: "21.7.1" });
    writeForkSyncState();

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
    writeForkSyncState({ releases: [] });

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
    writeForkSyncState();

    const cli = runCli();
    const library = decide();

    expect(cli.stdout.trim()).toBe(library.nextTag);
  });
});
