import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  combineLevels,
  compareVersions,
  decideCoreRelease,
  incrementVersion,
  isCoreScopePath,
  levelFromVersions,
  parseStrictSemVer,
  readCoreSyncState,
  validateCoreSyncState,
} from "../../scripts/release/core-sync.mjs";
import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

/** @type {ReturnType<typeof createScratchReleaseRepository>} */
let repo;
/** @type {{ version: string, commit: string }} */
let baseUpstream;
/** @type {string} */
let baseUpstreamTip;
let syncCounter = 0;
/** @type {{ merge: string, upstream: { version: string, commit: string }, forkCore: { level: string, rationale: string, paths: string[] } }[]} */
let recordedSyncs = [];

const BASE_TAG = "pi-subagents-v1.0.0";
const repoRoot = path.resolve(import.meta.dirname, "../..");
const CORE_ARGS = () => repo.cliffArgs("pi-subagents");

const NONE_CONTRIBUTION = {
  level: "none",
  rationale: "upstream-only integration; no fork core resolution",
  paths: [],
};

/**
 * @param {string} message
 * @returns {Error}
 */
function errorOf(fn) {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error("expected the call to throw, but it returned");
}

/**
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
 * @param {string} currentTag
 */
function decide(currentTag = BASE_TAG) {
  return decideCoreRelease({
    repo: repo.dir,
    currentTag,
    cliffArgs: CORE_ARGS(),
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
  const branch = `upstream-${syncCounter++}`;
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

beforeEach(() => {
  syncCounter = 0;
  recordedSyncs = [];
  repo = createScratchReleaseRepository({ pkg: "pi-subagents" });
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
  baseUpstream = { version: "21.7.0", commit: baseCommit };
  baseUpstreamTip = baseCommit;
  repo.commitOutOfScope("docs: release marker");
  repo.git("tag", "-a", BASE_TAG, "-m", "core v1.0.0");
});

afterEach(() => {
  repo.dispose();
});

describe("level mapping", () => {
  it("accepts stable versions and rejects prerelease, build, and malformed forms", () => {
    expect(parseStrictSemVer("21.7.3")).toEqual({
      major: 21,
      minor: 7,
      patch: 3,
    });
    expect(parseStrictSemVer("21.7.3-rc1")).toBeNull();
    expect(parseStrictSemVer("21.7.3+build.1")).toBeNull();
    expect(parseStrictSemVer("01.2.3")).toBeNull();
    expect(parseStrictSemVer("1.0")).toBeNull();
    expect(parseStrictSemVer("v1.0.0")).toBeNull();
    expect(parseStrictSemVer("")).toBeNull();
    expect(parseStrictSemVer(21)).toBeNull();
  });

  it("compares versions field by field", () => {
    expect(compareVersions("21.7.3", "21.7.3")).toBe(0);
    expect(compareVersions("21.7.3", "21.7.4")).toBe(-1);
    expect(compareVersions("21.8.0", "21.7.99")).toBe(1);
    expect(compareVersions("22.0.0", "21.99.99")).toBe(1);
  });

  it("maps version distance to a single level", () => {
    expect(levelFromVersions("21.7.0", "21.7.0")).toBe("none");
    expect(levelFromVersions("21.7.0", "21.7.3")).toBe("patch");
    expect(levelFromVersions("21.7.0", "21.8.0")).toBe("minor");
    expect(levelFromVersions("21.7.3", "22.0.0")).toBe("major");
    // Skipped releases collapse to one step, not a sum.
    expect(levelFromVersions("21.7.0", "21.7.2")).toBe("patch");
    expect(levelFromVersions("21.6.9", "21.8.0")).toBe("minor");
  });

  it("rejects a regressing upstream target", () => {
    expect(() => levelFromVersions("21.7.3", "21.7.0")).toThrow(/regressed/);
  });

  it("combines levels by taking the maximum", () => {
    expect(combineLevels("none", "none")).toBe("none");
    expect(combineLevels("none", "patch")).toBe("patch");
    expect(combineLevels("patch", "minor")).toBe("minor");
    expect(combineLevels("minor", "major")).toBe("major");
    expect(combineLevels("major", "patch")).toBe("major");
  });

  it("increments a version exactly once for the decided level", () => {
    expect(incrementVersion("1.2.3", "none")).toBe("1.2.3");
    expect(incrementVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(incrementVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(incrementVersion("1.2.3", "major")).toBe("2.0.0");
    expect(() => incrementVersion("1.2", "patch")).toThrow(/invalid SemVer/);
  });

  it("scopes core paths like the release scripts' exclusions", () => {
    expect(isCoreScopePath("packages/pi-subagents/src/a.ts")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/test/a.test.ts")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/docs/guides/x.md")).toBe(
      true,
    );
    expect(isCoreScopePath("packages/pi-subagents/package.json")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/CHANGELOG.md")).toBe(false);
    expect(isCoreScopePath("packages/pi-subagents/docs/plans/x.md")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/retro/x.md")).toBe(
      false,
    );
    expect(
      isCoreScopePath("packages/pi-subagents/docs/architecture/x.md"),
    ).toBe(false);
    expect(isCoreScopePath("packages/pi-subagents/docs/decisions/x.md")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/assets/x.svg")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/plans")).toBe(false);
    expect(isCoreScopePath("packages/pi-colgrep/src/a.ts")).toBe(false);
    expect(isCoreScopePath("docs/upstream-sync.md")).toBe(false);
  });
});

describe("state schema", () => {
  const validState = () => ({
    schemaVersion: 1,
    releases: [
      {
        forkTag: "pi-subagents-v2.0.0",
        upstream: { version: "21.7.3", commit: "f".repeat(40) },
        upstreamTip: "e".repeat(40),
      },
    ],
    syncs: [
      {
        merge: "a".repeat(40),
        upstream: { version: "21.7.3", commit: "f".repeat(40) },
        forkCore: {
          level: "patch",
          rationale: "resolution adjusted a core default",
          paths: ["packages/pi-subagents/src/a.ts"],
        },
      },
    ],
  });

  it("accepts a valid document", () => {
    expect(validateCoreSyncState(validState())).toEqual(validState());
  });

  it("rejects an unknown schema version", () => {
    const state = validState();
    state.schemaVersion = 2;
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /unsupported core sync state schema version/,
    );
  });

  it("rejects duplicate release records for one fork tag", () => {
    const state = validState();
    state.releases.push({ ...state.releases[0] });
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /duplicate release record/,
    );
  });

  it("rejects invalid versions and malformed object IDs", () => {
    const badVersion = validState();
    badVersion.releases[0].upstream.version = "21.7.3-rc1";
    expect(errorOf(() => validateCoreSyncState(badVersion)).message).toMatch(
      /not a strict stable SemVer/,
    );

    const shortOid = validState();
    shortOid.releases[0].upstream.commit = "abc123";
    expect(errorOf(() => validateCoreSyncState(shortOid)).message).toMatch(
      /not a full 40-hex object ID/,
    );

    const badSyncVersion = validState();
    badSyncVersion.syncs[0].upstream.version = "not-semver";
    expect(
      errorOf(() => validateCoreSyncState(badSyncVersion)).message,
    ).toMatch(/not a strict stable SemVer/);
  });

  it("rejects unknown fields at every level", () => {
    const topLevel = validState();
    topLevel.cache = true;
    expect(errorOf(() => validateCoreSyncState(topLevel)).message).toMatch(
      /unknown state field 'cache'/,
    );

    const releaseField = validState();
    releaseField.releases[0].verified = true;
    expect(errorOf(() => validateCoreSyncState(releaseField)).message).toMatch(
      /unknown releases\[0\] field 'verified'/,
    );

    const syncField = validState();
    syncField.syncs[0].reviewedAt = "2026-09-19";
    expect(errorOf(() => validateCoreSyncState(syncField)).message).toMatch(
      /unknown syncs\[0\] field 'reviewedAt'/,
    );
  });

  it("rejects contradictory fork-core contributions", () => {
    const emptyPaths = validState();
    emptyPaths.syncs[0].forkCore.paths = [];
    expect(errorOf(() => validateCoreSyncState(emptyPaths)).message).toMatch(
      /level patch with no changed core paths/,
    );

    const noneWithPaths = validState();
    noneWithPaths.syncs[0].forkCore.level = "none";
    expect(errorOf(() => validateCoreSyncState(noneWithPaths)).message).toMatch(
      /level none with changed core paths/,
    );

    const badLevel = validState();
    badLevel.syncs[0].forkCore.level = "huge";
    expect(errorOf(() => validateCoreSyncState(badLevel)).message).toMatch(
      /not a release level/,
    );

    const emptyRationale = validState();
    emptyRationale.syncs[0].forkCore.rationale = "  ";
    expect(
      errorOf(() => validateCoreSyncState(emptyRationale)).message,
    ).toMatch(/rationale must be a non-empty string/);

    const foreignPath = validState();
    foreignPath.syncs[0].forkCore.paths = ["packages/pi-colgrep/src/a.ts"];
    expect(errorOf(() => validateCoreSyncState(foreignPath)).message).toMatch(
      /not a core package path/,
    );
  });

  it("rejects duplicate sync records for one merge", () => {
    const state = validState();
    state.syncs.push({ ...state.syncs[0] });
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /duplicate sync record/,
    );
  });

  it("reads strictly from disk", () => {
    const statePath = path.join(repo.dir, "state.json");
    writeFileSync(statePath, "{ not json");
    expect(errorOf(() => readCoreSyncState(statePath)).message).toMatch(
      /not valid JSON/,
    );
    expect(
      errorOf(() => readCoreSyncState(path.join(repo.dir, "missing.json")))
        .message,
    ).toMatch(/cannot read core sync state/);
  });
});

describe("window derivation", () => {
  it("derives nothing from an equal upstream version and no fork core history", () => {
    syncUpstream({
      version: "21.7.0",
      files: [
        {
          message: "docs(pi-subagents): internal plan note",
          file: "packages/pi-subagents/docs/plans/note.md",
        },
      ],
    });
    writeCoreSyncState();

    const decision = decide();

    expect(decision.nextTag).toBeNull();
    expect(decision.upstreamLevel).toBe("none");
    expect(decision.forkLevel).toBe("none");
  });

  it("maps a higher upstream patch to one fork patch", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
      forkLevel: "none",
    });
  });

  it("maps a higher upstream minor to one fork minor", () => {
    syncUpstream({ version: "21.8.0" });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.1.0",
      upstreamLevel: "minor",
    });
  });

  it("maps a higher upstream major to one fork major", () => {
    syncUpstream({ version: "22.0.0" });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v2.0.0",
      upstreamLevel: "major",
    });
  });

  it("collapses skipped upstream releases into one step", () => {
    syncUpstream({ version: "21.7.2" });
    writeCoreSyncState();

    expect(decide().nextTag).toBe("pi-subagents-v1.0.1");
  });

  it("compares the baseline with the final target across deferred syncs", () => {
    syncUpstream({ version: "21.7.1" });
    syncUpstream({ version: "21.7.2" });
    writeCoreSyncState();

    const decision = decide();

    expect(decision.upstreamLevel).toBe("patch");
    expect(decision.nextTag).toBe("pi-subagents-v1.0.1");
  });

  it("keeps a later minor when earlier deferred syncs were patches", () => {
    syncUpstream({ version: "21.7.1" });
    syncUpstream({ version: "21.8.0" });
    writeCoreSyncState();

    expect(decide().nextTag).toBe("pi-subagents-v1.1.0");
  });

  it("reports the final verified upstream correspondence and tip", () => {
    const { upstreamParent } = syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    const decision = decide();

    expect(decision.upstream).toEqual({
      version: "21.7.1",
      commit: recordedSyncs[0].upstream.commit,
    });
    expect(decision.upstreamTip).toBe(upstreamParent);
  });

  it("derives fork fixes, features, and breaks from the retained context", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "fix(pi-subagents): fork fix",
      "packages/pi-subagents/fix.txt",
    );
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
      forkLevel: "patch",
    });
  });

  it("derives a fork feature as a minor on top of an upstream patch", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents): fork feature",
      "packages/pi-subagents/feat.txt",
    );
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.1.0",
      forkLevel: "minor",
    });
  });

  it("lets a fork breaking change dominate an upstream patch", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents)!: fork break",
      "packages/pi-subagents/break.txt",
    );
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v2.0.0",
      upstreamLevel: "patch",
      forkLevel: "major",
    });
  });

  it("keeps a hidden-type fork breaking commit major", () => {
    repo.commitInScope(
      "refactor(pi-subagents)!: hidden breaking change",
      "packages/pi-subagents/break.txt",
    );
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v2.0.0",
      forkLevel: "major",
    });
  });

  it("replaces a broad breaking merge message with its reviewed none contribution", () => {
    // This is the shape that produced the accidental fork 2.0.0: a
    // repository-wide `feat!:` integration message over an upstream patch
    // release. The reviewed record, not the merge's own classification,
    // decides the fork core level.
    syncUpstream({
      version: "21.7.1",
      mergeMessage: "feat!: integrate upstream compatibility batch",
    });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
      forkLevel: "none",
    });
  });

  it("counts a reviewed breaking merge resolution as fork major", () => {
    const branch = `upstream-${syncCounter++}`;
    repo.git("checkout", "-b", branch);
    repo.commitInScope(
      "feat(pi-subagents): upstream edits shared core",
      "packages/pi-subagents/shared.txt",
    );
    const releaseCommit = repo.gitOut("rev-parse", "HEAD");
    repo.git("checkout", "main");
    repo.commitInScope(
      "feat(pi-subagents): local core edit",
      "packages/pi-subagents/shared.txt",
    );
    const mergeResult = spawnSync(
      "git",
      ["merge", "--no-ff", "-m", "chore: merge upstream/main", branch],
      { cwd: repo.dir, encoding: "utf8" },
    );
    expect(mergeResult.status).not.toBe(0);
    writeFileSync(
      path.join(repo.dir, "packages/pi-subagents/shared.txt"),
      "resolved combined core change\n",
    );
    repo.git("add", "-A");
    repo.git("commit", "-m", "chore: merge upstream/main");
    const merge = repo.gitOut("rev-parse", "HEAD");
    recordedSyncs.push({
      merge,
      upstream: { version: "21.7.1", commit: releaseCommit },
      forkCore: {
        level: "major",
        rationale: "resolution combined both sides into a new core contract",
        paths: ["packages/pi-subagents/shared.txt"],
      },
    });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v2.0.0",
      upstreamLevel: "patch",
      forkLevel: "major",
    });
  });

  it("ignores sibling-only and root-config commits in the core window", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-colgrep): sibling feature",
      "packages/pi-colgrep/src/x.ts",
    );
    repo.commitOutOfScope("docs(retro): session note");
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      forkLevel: "none",
    });
  });
});

describe("evidence failures", () => {
  it("blocks when the current tag has no recorded correspondence", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState({
      releases: [
        {
          forkTag: "pi-subagents-v0.9.0",
          upstream: baseUpstream,
          upstreamTip: baseUpstreamTip,
        },
      ],
    });

    expect(errorOf(() => decide()).message).toMatch(
      /no recorded upstream correspondence for pi-subagents-v1\.0\.0/,
    );
  });

  it("blocks when the current release is not an ancestor of HEAD", () => {
    repo.git("checkout", "--orphan", "divergent");
    repo.git("rm", "-r", "--cached", ".");
    repo.commitInScope(
      "feat(pi-subagents)!: orphan work",
      "packages/pi-subagents/orphan.txt",
    );
    repo.git("tag", "-a", "pi-subagents-v9.9.9", "-m", "divergent");
    repo.git("checkout", "main");
    writeCoreSyncState({
      releases: [
        {
          forkTag: "pi-subagents-v9.9.9",
          upstream: baseUpstream,
          upstreamTip: baseUpstreamTip,
        },
      ],
    });

    expect(errorOf(() => decide("pi-subagents-v9.9.9")).message).toMatch(
      /not an ancestor of HEAD/,
    );
  });

  it("blocks when recorded objects are unavailable", () => {
    writeCoreSyncState({
      releases: [
        {
          forkTag: BASE_TAG,
          upstream: { version: "21.7.0", commit: "1".repeat(40) },
          upstreamTip: baseUpstreamTip,
        },
      ],
    });

    expect(errorOf(() => decide()).message).toMatch(/missing or not a commit/);
  });

  it("blocks when a recorded sync release is not contained in its upstream parent", () => {
    const { merge } = syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents): unrelated fork commit",
      "packages/pi-subagents/unrelated.txt",
    );
    recordedSyncs[0].upstream.commit = repo.gitOut("rev-parse", "HEAD");
    writeCoreSyncState();

    expect(errorOf(() => decide()).message).toMatch(
      new RegExp(
        `sync ${merge} recorded upstream 21\\.7\\.1 is not contained in its upstream parent`,
      ),
    );
  });

  it("blocks an unrecorded core-affecting merge with the recording command", () => {
    const branch = `upstream-${syncCounter++}`;
    repo.git("checkout", "-b", branch);
    repo.commitInScope(
      "feat(pi-subagents): unrecorded upstream change",
      "packages/pi-subagents/unrecorded.txt",
    );
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge upstream/main", branch);
    writeCoreSyncState();

    expect(errorOf(() => decide()).message).toMatch(
      /changes core paths but has no reviewed sync record[\s\S]*--record-core-sync/,
    );
  });

  it("allows an unrecorded merge that never touches core paths", () => {
    const branch = "docs-branch";
    repo.git("checkout", "-b", branch);
    repo.commitInScope("docs(retro): branch note", "docs/retro/branch.md");
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge docs branch", branch);
    writeCoreSyncState();

    expect(decide().nextTag).toBeNull();
  });

  it("blocks a regressing recorded upstream version", () => {
    baseUpstream.version = "21.7.1";
    syncUpstream({ version: "21.7.0" });
    writeCoreSyncState();

    expect(errorOf(() => decide()).message).toMatch(
      /behind the already-incorporated/,
    );
  });

  it("blocks when a release boundary appears inside the window", () => {
    repo.commitInScope(
      "feat(pi-subagents): unrecorded release work",
      "packages/pi-subagents/rel.txt",
    );
    repo.git("tag", "pi-subagents-v1.1.0");
    writeCoreSyncState();

    expect(errorOf(() => decide()).message).toMatch(
      /unexpected release boundary.*inside the pi-subagents-v1\.0\.0\.\.HEAD window/,
    );
  });
});

describe("offline prediction", () => {
  /**
   * Re-run the patch derivation with a `git` wrapper on PATH that refuses
   * every network-facing subcommand and delegates the rest to the real git.
   */
  it("derives a patch without any network-capable git call succeeding", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    const stubBin = mkdtempSync(path.join(tmpdir(), "offline-git-"));
    const stub = path.join(stubBin, "git");
    writeFileSync(
      stub,
      [
        "#!/bin/sh",
        'case "$1" in',
        "  fetch|ls-remote|clone|push|pull|remote)",
        '    echo "network refused: $*" >&2',
        "    exit 1",
        "    ;;",
        "esac",
        'exec "/usr/bin/git" "$@"',
        "",
      ].join("\n"),
    );
    chmodSync(stub, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${stubBin}${path.delimiter}${originalPath}`;
    try {
      expect(decide()).toMatchObject({
        nextTag: "pi-subagents-v1.0.1",
        upstreamLevel: "patch",
      });
    } finally {
      process.env.PATH = originalPath;
      rmSync(stubBin, { recursive: true, force: true });
    }
  });
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
