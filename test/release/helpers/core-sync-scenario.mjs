// Instance-owned scenario for the core sync release policy tests: the
// baseline history a decision window hangs from, plus the helpers that build
// recorded evidence and run the decision against it. Each test creates its
// own scenario, so one test's repository and recorded-sync bookkeeping can
// never leak into another's.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { decideCoreRelease } from "../../../scripts/release/core-sync.mjs";
import { createScratchReleaseRepository } from "./git-repository.mjs";

/** The fork release tag the scenario's decision window starts from. */
export const BASE_TAG = "pi-subagents-v1.0.0";

const NONE_CONTRIBUTION = {
  level: "none",
  rationale: "upstream-only integration; no fork core resolution",
  paths: [],
};

/**
 * Create the baseline history and the decision helpers around it:
 *
 *   - `pi-subagents-v0.9.0` on an initial core commit (pre-baseline history
 *     the bounded walk must never see),
 *   - the baseline upstream release `21.7.0` (its commit is both the recorded
 *     upstream release and the recorded upstream tip),
 *   - `pi-subagents-v1.0.0` on an out-of-scope release-marker commit, the
 *     shape of a docs-only publish.
 *
 * Tests mutate `baseUpstream` and `recordedSyncs` in place — forge evidence —
 * and `writeCoreSyncState` serializes exactly what those references hold.
 *
 * @returns {CoreSyncScenario}
 */
export function createCoreSyncScenario() {
  const repo = createScratchReleaseRepository({ pkg: "pi-subagents" });
  const coreArgs = () => repo.cliffArgs("pi-subagents");
  let syncCounter = 0;
  /** @type {{ merge: string, upstream: { version: string, commit: string }, forkCore: { level: string, rationale: string, paths: string[] } }[]} */
  const recordedSyncs = [];

  repo.commitInScope(
    "feat(pi-subagents)!: initial core",
    "packages/pi-subagents/src/a.ts",
  );
  repo.git("tag", "pi-subagents-v0.9.0");
  repo.commitInScope(
    "feat(pi-subagents): shape the core",
    "packages/pi-subagents/src/b.ts",
  );
  const baseCommit = repo.gitOut("rev-parse", "HEAD");
  const baseUpstream = { version: "21.7.0", commit: baseCommit };
  const baseUpstreamTip = baseCommit;
  repo.commitOutOfScope("docs: release marker");
  repo.git("tag", "-a", BASE_TAG, "-m", "core v1.0.0");

  /**
   * A fresh upstream branch name, unique within this scenario. `syncUpstream`
   * derives its branches here; hand-built merges use it for the same reason.
   */
  function uniqueUpstreamBranch() {
    return `upstream-${syncCounter++}`;
  }

  /**
   * Write the state document the decision reads, defaulting to the baseline
   * correspondence and whatever `recordedSyncs` currently holds.
   *
   * @param {{ releases?: unknown[], syncs?: unknown[] }} [overrides]
   */
  function writeCoreSyncState(overrides = {}) {
    mkdirSync(path.join(repo.dir, "scripts", "release"), { recursive: true });
    writeFileSync(
      path.join(repo.dir, "scripts", "release", "core-sync-state.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          releases: overrides.releases ?? [
            {
              forkTag: BASE_TAG,
              upstream: baseUpstream,
              upstreamTip: baseUpstreamTip,
            },
          ],
          syncs: overrides.syncs ?? recordedSyncs,
        },
        null,
        2,
      )}\n`,
    );
  }

  /**
   * Run the decision policy against the scenario repository, exactly as
   * `next_tag` invokes it.
   *
   * @param {string} [currentTag]
   */
  function decide(currentTag = BASE_TAG) {
    return decideCoreRelease({
      repo: repo.dir,
      currentTag,
      cliffArgs: coreArgs(),
    });
  }

  /**
   * Commit `files` on a new upstream branch and merge it into main with a real
   * two-parent merge, recording the reviewed sync entry.
   *
   * @param {{
   *   version: string,
   *   files?: { message: string, file: string }[],
   *   mergeMessage?: string,
   *   forkCore?: { level: string, rationale: string, paths: string[] },
   * }} options
   * @returns {{ merge: string, releaseCommit: string, upstreamParent: string }}
   */
  function syncUpstream(options) {
    const branch = uniqueUpstreamBranch();
    repo.git("checkout", "-b", branch);
    for (const change of options.files ?? [
      {
        message: `feat(pi-subagents): upstream change ${options.version}`,
        file: `packages/pi-subagents/up-${options.version}.txt`,
      },
    ]) {
      repo.commitInScope(change.message, change.file);
    }
    const releaseCommit = repo.gitOut("rev-parse", "HEAD");
    repo.git("checkout", "main");
    repo.git(
      "merge",
      "--no-ff",
      "-m",
      options.mergeMessage ?? "chore: merge upstream/main",
      branch,
    );
    const merge = repo.gitOut("rev-parse", "HEAD");
    const upstreamParent = repo.gitOut("rev-parse", `${merge}^2`);
    recordedSyncs.push({
      merge,
      upstream: { version: options.version, commit: releaseCommit },
      forkCore: options.forkCore ?? NONE_CONTRIBUTION,
    });
    return { merge, releaseCommit, upstreamParent };
  }

  return {
    repo,
    baseUpstream,
    baseUpstreamTip,
    recordedSyncs,
    uniqueUpstreamBranch,
    writeCoreSyncState,
    decide,
    syncUpstream,
    dispose() {
      repo.dispose();
    },
  };
}

/**
 * @typedef {ReturnType<typeof createCoreSyncScenario>} CoreSyncScenario
 */
