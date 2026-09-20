import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The real-history regression for the core sync release policy: the actual
// issue-14 integration objects, not synthetic approximations. The fixture
// clones this repository with shared objects and no tags, checks out the
// historical integration merge, and restores only the historical fork
// baseline tag, so the derivation cannot see today's later tags. The current
// release implementation and configuration run against that repository.
//
// These objects are pinned by the verified correspondence in
// scripts/release/core-sync-state.json and docs/upstream-sync.md; a shallow
// or partial clone that lacks them must fail loudly, not skip.

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const libShPath = path.join(repoRoot, "scripts", "release", "lib.sh");
const cliffTomlPath = path.join(repoRoot, "cliff.toml");

const INTEGRATION_MERGE = "0408aa5ff9d9811d98df17dde436e7fd45a5a3ad";
const HISTORICAL_BASELINE_TAG = "pi-subagents-v1.0.2";
const HISTORICAL_BASELINE_COMMIT = "788f64093ce023e12ac491355563004f1610142f";
const HISTORICAL_UPSTREAM_RELEASE = {
  version: "21.7.0",
  commit: "b3b6159399f541fd0623f65818557dd3e707a34f",
};
const HISTORICAL_UPSTREAM_TIP = "045213317de608c04a7b6052b2b843e3a0f2176f";
const INTEGRATED_UPSTREAM_RELEASE = {
  version: "21.7.3",
  commit: "f918568bbb643a6145898c76c5cc225c63b5b793",
};

const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

/** @type {string | undefined} */
let fixtureRepo;

/**
 * @param {...string} args
 */
function gitInFixture(...args) {
  return execFileSync("git", args, {
    cwd: fixtureRepo,
    encoding: "utf8",
    env: gitEnv,
  }).trim();
}

/**
 * Run the shared decision entry (`next_tag`) from the real lib.sh against the
 * fixture repository, exactly as `next-version.sh` invokes it.
 *
 * @param {string} pkg
 * @param {string} tag
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function nextTag(pkg, tag) {
  const result = execFileSync(
    "bash",
    ["-c", `. '${libShPath}'; next_tag ${pkg} ${tag}`],
    { cwd: fixtureRepo, encoding: "utf8", env: gitEnv },
  );
  return result;
}

/**
 * Run `next_tag` expecting failure, capturing the process result —
 * `execFileSync` throws on nonzero status with stdout/stderr attached.
 *
 * @param {string} pkg
 * @param {string} tag
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function failingNextTag(pkg, tag) {
  try {
    nextTag(pkg, tag);
  } catch (error) {
    const failure =
      /** @type {{ status?: number, stdout?: unknown, stderr?: unknown }} */ (
        error
      );
    return {
      status: failure.status ?? 1,
      stdout: typeof failure.stdout === "string" ? failure.stdout : "",
      stderr: typeof failure.stderr === "string" ? failure.stderr : "",
    };
  }
  throw new Error("expected next_tag to fail, but it exited 0");
}

/**
 * Write the fixture's core sync state, defaulting to the verified
 * correspondence. Tests forge exactly one invalid property at a time
 * through the overrides; the real manifests at the pinned upstream commits
 * claim exactly the recorded versions, so a version forgery is the only
 * inconsistent property.
 *
 * @param {{ releases?: unknown[], syncs?: unknown[] }} [overrides]
 */
function writeFixtureState(overrides = {}) {
  writeFileSync(
    path.join(fixtureRepo, "scripts", "release", "core-sync-state.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        releases: overrides.releases ?? [
          {
            forkTag: HISTORICAL_BASELINE_TAG,
            upstream: HISTORICAL_UPSTREAM_RELEASE,
            upstreamTip: HISTORICAL_UPSTREAM_TIP,
          },
        ],
        syncs: overrides.syncs ?? [
          {
            merge: INTEGRATION_MERGE,
            upstream: INTEGRATED_UPSTREAM_RELEASE,
            forkCore: {
              level: "none",
              rationale:
                "integration carried upstream 21.7.x compatibility work; resolutions kept fork identity",
              paths: [],
            },
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

beforeEach(() => {
  const scratch = mkdtempSync(path.join(tmpdir(), "core-sync-history-"));
  fixtureRepo = path.join(scratch, "repo");
  execFileSync(
    "git",
    ["clone", "--shared", "--no-checkout", "--no-tags", repoRoot, fixtureRepo],
    { encoding: "utf8", env: gitEnv },
  );
  gitInFixture("config", "user.name", "Test");
  gitInFixture("config", "user.email", "test@example.com");
  gitInFixture("checkout", "--detach", INTEGRATION_MERGE);
  // Restore only the historical fork baseline tag: the derivation must be
  // anchored at the world as it was at the integration, blind to every later
  // fork release.
  gitInFixture(
    "tag",
    "-a",
    HISTORICAL_BASELINE_TAG,
    "-m",
    "historical baseline",
    HISTORICAL_BASELINE_COMMIT,
  );
  // Current policy code and configuration, per the verified correspondence
  // that held at the historical baseline.
  copyFileSync(cliffTomlPath, path.join(fixtureRepo, "cliff.toml"));
  mkdirSync(path.join(fixtureRepo, "scripts", "release"), {
    recursive: true,
  });
  writeFixtureState();
});

afterEach(() => {
  if (fixtureRepo !== undefined) {
    rmSync(path.dirname(fixtureRepo), { recursive: true, force: true });
  }
  fixtureRepo = undefined;
});

describe("core release policy against the real issue-14 history", () => {
  it("derives the historical counterfactual patch instead of the accidental major", () => {
    // Under the old repository-wide classification this window printed
    // pi-subagents-v2.0.0 (the integration merge's broad `feat!:` message
    // forced a major over an upstream patch release). The policy compares the
    // verified correspondence 21.7.0 → 21.7.3, finds no retained fork core
    // commits, and reviews the merge itself as a none contribution.
    expect(nextTag("pi-subagents", HISTORICAL_BASELINE_TAG)).toBe(
      "pi-subagents-v1.0.3\n",
    );
  });

  it("sees only the historical baseline tag in the fixture", () => {
    expect(gitInFixture("tag")).toBe(HISTORICAL_BASELINE_TAG);
    expect(gitInFixture("rev-parse", "HEAD")).toBe(INTEGRATION_MERGE);
  });

  it("blocks a recorded upstream version that contradicts the release manifest (real issue-14 objects)", () => {
    // The real 21.7.3 release commit's manifest claims 21.7.3. A record
    // claiming 22.0.0 at that commit is forged provenance whose mismatch
    // implies a major; the offline decision must name the manifest claim,
    // not accept it.
    writeFixtureState({
      syncs: [
        {
          merge: INTEGRATION_MERGE,
          upstream: {
            version: "22.0.0",
            commit: INTEGRATED_UPSTREAM_RELEASE.commit,
          },
          forkCore: {
            level: "none",
            rationale: "forged version over the real 21.7.3 release commit",
            paths: [],
          },
        },
      ],
    });

    const failure = failingNextTag("pi-subagents", HISTORICAL_BASELINE_TAG);

    expect(failure.status).not.toBe(0);
    expect(failure.stdout).toBe("");
    expect(failure.stderr).toMatch(
      /upstream release tag 22\.0\.0 points at a manifest claiming "21\.7\.3"/,
    );
  });

  it("blocks a baseline version that contradicts its upstream manifest", () => {
    // The real 21.7.0 release commit's manifest claims 21.7.0. A baseline
    // record claiming 21.6.0 stays monotone against the window sync, so the
    // manifest correspondence — not the version-regression guard — must be
    // what rejects it.
    writeFixtureState({
      releases: [
        {
          forkTag: HISTORICAL_BASELINE_TAG,
          upstream: {
            version: "21.6.0",
            commit: HISTORICAL_UPSTREAM_RELEASE.commit,
          },
          upstreamTip: HISTORICAL_UPSTREAM_TIP,
        },
      ],
    });

    const failure = failingNextTag("pi-subagents", HISTORICAL_BASELINE_TAG);

    expect(failure.status).not.toBe(0);
    expect(failure.stdout).toBe("");
    expect(failure.stderr).toMatch(
      /upstream release tag 21\.6\.0 points at a manifest claiming "21\.7\.0"/,
    );
    expect(failure.stderr).not.toMatch(/behind the already-incorporated/);
  });
});
