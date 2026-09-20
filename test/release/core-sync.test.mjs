import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  combineLevels,
  compareVersions,
  incrementVersion,
  isCoreScopePath,
  levelFromVersions,
  parseStrictSemVer,
  readCoreSyncState,
  validateCoreSyncState,
} from "../../scripts/release/core-sync.mjs";
import {
  BASE_TAG,
  createCoreSyncScenario,
} from "./helpers/core-sync-scenario.mjs";

/** @type {ReturnType<typeof createCoreSyncScenario>} */
let scenario;
/** @type {ReturnType<typeof createCoreSyncScenario>["repo"]} */
let repo;
/** @type {ReturnType<typeof createCoreSyncScenario>["recordedSyncs"]} */
let recordedSyncs;
/** @type {ReturnType<typeof createCoreSyncScenario>["baseUpstream"]} */
let baseUpstream;
/** @type {string} */
let baseUpstreamTip;
/** @type {ReturnType<typeof createCoreSyncScenario>["writeCoreSyncState"]} */
let writeCoreSyncState;
/** @type {ReturnType<typeof createCoreSyncScenario>["decide"]} */
let decide;
/** @type {ReturnType<typeof createCoreSyncScenario>["syncUpstream"]} */
let syncUpstream;
/** @type {ReturnType<typeof createCoreSyncScenario>["uniqueUpstreamBranch"]} */
let uniqueUpstreamBranch;

const repoRoot = path.resolve(import.meta.dirname, "../..");
const CORE_ARGS = () => repo.cliffArgs("pi-subagents");

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

beforeEach(() => {
  scenario = createCoreSyncScenario();
  repo = scenario.repo;
  recordedSyncs = scenario.recordedSyncs;
  baseUpstream = scenario.baseUpstream;
  baseUpstreamTip = scenario.baseUpstreamTip;
  writeCoreSyncState = scenario.writeCoreSyncState;
  decide = scenario.decide;
  syncUpstream = scenario.syncUpstream;
  uniqueUpstreamBranch = scenario.uniqueUpstreamBranch;
});

afterEach(() => {
  scenario.dispose();
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
    const branch = uniqueUpstreamBranch();
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
    const branch = uniqueUpstreamBranch();
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

describe("shared entry point", () => {
  /**
   * Run `next_tag` from the real lib.sh against the fixture repository,
   * exactly as next-version.sh invokes it.
   *
   * @param {string} pkg
   * @param {string} tag
   * @returns {{ status: number, stdout: string, stderr: string }}
   */
  function nextTag(pkg, tag) {
    const result = spawnSync(
      "bash",
      [
        "-c",
        `. '${path.join(repoRoot, "scripts", "release", "lib.sh")}'; next_tag ${pkg} ${tag}`,
      ],
      { cwd: repo.dir, encoding: "utf8" },
    );
    return {
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  it("routes the core package through the verified policy", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    const result = nextTag("pi-subagents", BASE_TAG);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("pi-subagents-v1.0.1");
  });

  it("keeps a fork-owned breaking change dominant at the entry point", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents)!: fork break",
      "packages/pi-subagents/break.txt",
    );
    writeCoreSyncState();

    expect(nextTag("pi-subagents", BASE_TAG).stdout.trim()).toBe(
      "pi-subagents-v2.0.0",
    );
  });

  it("prints the current tag for the core package when nothing is releasable", () => {
    writeCoreSyncState();

    const result = nextTag("pi-subagents", BASE_TAG);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(BASE_TAG);
  });

  it("keeps non-core packages on the bounded git-cliff walk", () => {
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");

    const result = nextTag("demo", "demo-v1.0.0");

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("demo-v1.0.1");
  });

  it("fails closed at the entry point on unrecorded core merges", () => {
    const branch = uniqueUpstreamBranch();
    repo.git("checkout", "-b", branch);
    repo.commitInScope(
      "feat(pi-subagents): unrecorded upstream change",
      "packages/pi-subagents/unrecorded.txt",
    );
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge upstream/main", branch);
    writeCoreSyncState();

    const result = nextTag("pi-subagents", BASE_TAG);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--record-core-sync");
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

describe("release preparation", () => {
  const statePath = () =>
    path.join(repo.dir, "scripts", "release", "core-sync-state.json");

  /**
   * Commit the fixture's release scaffolding: the core sync state, package
   * manifests, an existing core changelog, the release scripts' own copies,
   * and a local-only bare `origin`. Preparation then runs as a real process
   * against a disposable repository whose only remote is local, so the push
   * it performs can never reach a real remote or registry.
   */
  function makeReleasableRepository() {
    writeCoreSyncState();
    repo.copyReleaseScripts(
      "lib.sh",
      "next-version.sh",
      "prepare-release.sh",
      "core-sync.mjs",
    );
    repo.writeManifest("pi-subagents", "1.0.0");
    repo.writeChangelog(
      "pi-subagents",
      [
        "# Changelog",
        "",
        "All notable changes to this project will be documented in this file.",
        "",
        "## [1.0.0](https://github.com/Jopqior/gotgenes-pi-packages/compare/pi-subagents-v0.9.0...pi-subagents-v1.0.0) (2026-09-01)",
        "",
        "- shape the core",
        "",
      ].join("\n"),
    );
    repo.addLocalOrigin();
    repo.git("add", "-A");
    repo.git("commit", "-m", "chore(release): fixture scaffolding");
  }

  /**
   * Run the real preparation with the environment the release workflow
   * supplies. ALLOW_LOCAL_PUSH stands in for CI, never for a real push: the
   * fixture's origin is a local bare repository.
   *
   * @param {...string} packages package directory names to release
   */
  function prepareRelease(...packages) {
    return repo.runReleaseScriptEnv(
      { PACKAGES: packages.join(" "), ALLOW_LOCAL_PUSH: "1" },
      "prepare-release.sh",
    );
  }

  it("persists the decided correspondence with a selected core release", () => {
    const { upstreamParent } = syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "fix(pi-subagents): fork fix",
      "packages/pi-subagents/fix.txt",
    );
    makeReleasableRepository();
    const headBefore = repo.gitOut("rev-parse", "HEAD");

    const result = prepareRelease("pi-subagents");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Released: pi-subagents-v1.0.1");
    // The manifest, the created tag, and the appended state record agree.
    expect(
      repo.gitOut("show", "HEAD:packages/pi-subagents/package.json"),
    ).toContain('"version": "1.0.1"');
    expect(repo.gitOut("tag", "--points-at", "HEAD")).toBe(
      "pi-subagents-v1.0.1",
    );
    expect(readCoreSyncState(statePath()).releases.at(-1)).toEqual({
      forkTag: "pi-subagents-v1.0.1",
      upstream: recordedSyncs[0].upstream,
      upstreamTip: upstreamParent,
    });
    // The state update ships inside the release commit, not as a worktree
    // edit left behind for the next run to find.
    expect(repo.gitOut("status", "--porcelain")).toBe("");
    const committed = JSON.parse(
      repo.gitOut("show", "HEAD:scripts/release/core-sync-state.json"),
    );
    expect(committed.releases.at(-1).forkTag).toBe("pi-subagents-v1.0.1");
    expect(repo.gitOut("rev-list", "--count", `${headBefore}..HEAD`)).toBe("1");
    // The tag and the branch really landed on the local-only origin.
    expect(
      repo.gitOut("ls-remote", "--tags", "origin", "pi-subagents-v1.0.1"),
    ).toContain("refs/tags/pi-subagents-v1.0.1");
    // The rendered section keeps the window's upstream and fork entries and
    // borrows none from before the baseline; the old section stays below it.
    const changelog = readFileSync(
      path.join(repo.dir, "packages", "pi-subagents", "CHANGELOG.md"),
      "utf8",
    );
    const oldSectionAt = changelog.indexOf("## [1.0.0]");
    const newSection = changelog.slice(0, oldSectionAt);
    expect(newSection).toContain(
      "compare/pi-subagents-v1.0.0...pi-subagents-v1.0.1",
    );
    expect(newSection).toContain("upstream change 21.7.1");
    expect(newSection).toContain("fork fix");
    expect(newSection).not.toContain("shape the core");
    expect(changelog.slice(oldSectionAt)).toContain("shape the core");
    // Reader/writer round trip on the actual created tag: the prediction
    // anchors at the persisted evidence and finds nothing further pending.
    const prediction = repo.runReleaseScript("next-version.sh", "pi-subagents");
    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("");
    expect(prediction.stderr).toContain(
      "Nothing to release for 'pi-subagents' (at pi-subagents-v1.0.1)",
    );
  });

  it("leaves core state untouched when only a sibling is selected", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    makeReleasableRepository();
    const stateBefore = readFileSync(statePath(), "utf8");
    const committedStateBefore = repo.gitOut(
      "show",
      "HEAD:scripts/release/core-sync-state.json",
    );
    const coreTagsBefore = repo.gitOut("tag", "--list", "pi-subagents-v*");

    const result = prepareRelease("demo");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Released: demo-v1.0.1");
    expect(repo.gitOut("tag", "--points-at", "HEAD")).toBe("demo-v1.0.1");
    expect(repo.gitOut("show", "HEAD:packages/demo/package.json")).toContain(
      '"version": "1.0.1"',
    );
    expect(readFileSync(statePath(), "utf8")).toBe(stateBefore);
    expect(
      repo.gitOut("show", "HEAD:scripts/release/core-sync-state.json"),
    ).toBe(committedStateBefore);
    expect(repo.gitOut("tag", "--list", "pi-subagents-v*")).toBe(
      coreTagsBefore,
    );
    expect(repo.gitOut("status", "--porcelain")).toBe("");
  });

  it("fails before any write when a mixed selection has blocked core evidence", () => {
    // The sibling is named first, so its version is derived before the core's
    // evidence fails; the all-or-nothing contract is that even that derived
    // sibling version produces no write.
    const branch = uniqueUpstreamBranch();
    repo.git("checkout", "-b", branch);
    repo.commitInScope(
      "feat(pi-subagents): unrecorded upstream change",
      "packages/pi-subagents/unrecorded.txt",
    );
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge upstream/main", branch);
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    makeReleasableRepository();
    const headBefore = repo.gitOut("rev-parse", "HEAD");
    const tagsBefore = repo.gitOut("tag");
    const stateBefore = readFileSync(statePath(), "utf8");
    const demoManifestBefore = readFileSync(
      path.join(repo.dir, "packages", "demo", "package.json"),
      "utf8",
    );

    const result = prepareRelease("demo", "pi-subagents");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--record-core-sync");
    expect(repo.gitOut("rev-parse", "HEAD")).toBe(headBefore);
    expect(repo.gitOut("tag")).toBe(tagsBefore);
    expect(repo.gitOut("status", "--porcelain")).toBe("");
    expect(readFileSync(statePath(), "utf8")).toBe(stateBefore);
    expect(
      readFileSync(
        path.join(repo.dir, "packages", "demo", "package.json"),
        "utf8",
      ),
    ).toBe(demoManifestBefore);
  });

  it("declines a second core release with no new sync or fork work", () => {
    syncUpstream({ version: "21.7.1" });
    makeReleasableRepository();
    expect(prepareRelease("pi-subagents").status).toBe(0);

    const headAfterFirst = repo.gitOut("rev-parse", "HEAD");
    const stateAfterFirst = readFileSync(statePath(), "utf8");

    const prediction = repo.runReleaseScript("next-version.sh", "pi-subagents");
    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("");
    expect(prediction.stderr).toContain(
      "Nothing to release for 'pi-subagents' (at pi-subagents-v1.0.1)",
    );

    const second = prepareRelease("pi-subagents");
    expect(second.status).not.toBe(0);
    expect(second.stderr).toContain("'pi-subagents' has nothing to release");
    expect(repo.gitOut("rev-parse", "HEAD")).toBe(headAfterFirst);
    expect(readFileSync(statePath(), "utf8")).toBe(stateAfterFirst);
    expect(repo.gitOut("status", "--porcelain")).toBe("");
  });

  it("anchors the next window at the correspondence the release recorded", () => {
    syncUpstream({ version: "21.8.0" });
    makeReleasableRepository();
    const first = prepareRelease("pi-subagents");
    expect(first.status).toBe(0);
    expect(repo.gitOut("tag", "--points-at", "HEAD")).toBe(
      "pi-subagents-v1.1.0",
    );
    const releasesAfterFirst = readCoreSyncState(statePath()).releases;

    syncUpstream({ version: "21.8.1" });
    writeCoreSyncState({ releases: releasesAfterFirst });

    // 21.8.0 → 21.8.1 is one patch from the newly recorded baseline, not a
    // level recomputed from the previous release's correspondence.
    const prediction = repo.runReleaseScript("next-version.sh", "pi-subagents");
    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("pi-subagents-v1.1.1\n");

    const second = prepareRelease("pi-subagents");
    expect(second.status).toBe(0);
    const releases = readCoreSyncState(statePath()).releases;
    expect(releases.map((entry) => entry.forkTag)).toEqual([
      BASE_TAG,
      "pi-subagents-v1.1.0",
      "pi-subagents-v1.1.1",
    ]);
    expect(releases[2].upstream).toEqual(recordedSyncs[1].upstream);
  });
});
