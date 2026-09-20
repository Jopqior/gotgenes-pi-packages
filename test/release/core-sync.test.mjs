import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BASE_TAG,
  createCoreSyncScenario,
} from "./helpers/core-sync-scenario.mjs";

// Decision integration for the core sync release policy: window derivation
// over recorded evidence, fail-closed evidence errors, the shared
// `next_tag` entry point, and offline prediction. The pure algebra, the
// state schema, the git-cliff adapter, the CLI contract, and release
// preparation live in their own focused files.

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
    // The hand-built release commit carries the matching release manifest,
    // exactly as every `syncUpstream` release commit does.
    repo.writeManifest("pi-subagents", "21.7.1");
    repo.git("add", "packages/pi-subagents/package.json");
    repo.git("commit", "-m", "chore(pi-subagents): release 21.7.1");
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

  it("blocks a sync whose recorded release commit lacks a manifest", () => {
    // Valid construction of exactly one invalid property: the recorded
    // release commit is a real, contained, continuous, tail-free commit on
    // its upstream line whose tree simply dropped the manifest.
    syncUpstream({ version: "21.7.1" });
    const branch = uniqueUpstreamBranch();
    repo.git("checkout", "-b", branch);
    repo.git("rm", "packages/pi-subagents/package.json");
    repo.git("commit", "-m", "chore(pi-subagents): drop the release manifest");
    const manifestless = repo.gitOut("rev-parse", "HEAD");
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge upstream/main", branch);
    recordedSyncs.push({
      merge: repo.gitOut("rev-parse", "HEAD"),
      upstream: { version: "21.7.2", commit: manifestless },
      forkCore: {
        level: "none",
        rationale: "upstream-only integration; no fork core resolution",
        paths: [],
      },
    });
    writeCoreSyncState();

    expect(errorOf(() => decide()).message).toMatch(
      new RegExp(
        `upstream release 21\\.7\\.2 \\(${manifestless}\\) has no packages/pi-subagents/package\\.json`,
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
    // Forged manifest-consistently: the baseline scenario is created with
    // its baseline manifest and record both claiming 21.7.1, so the version
    // regression — syncing 21.7.0 behind an already-incorporated 21.7.1 —
    // is the only failing property, whichever check runs first.
    const forged = createCoreSyncScenario({
      baselineUpstreamVersion: "21.7.1",
    });
    try {
      forged.syncUpstream({ version: "21.7.0" });
      forged.writeCoreSyncState();

      expect(errorOf(() => forged.decide()).message).toMatch(
        /behind the already-incorporated/,
      );
    } finally {
      forged.dispose();
    }
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

describe("unreleased upstream tails", () => {
  /**
   * Hand-build a sync whose upstream branch closes with the release-bump
   * manifest commit, then carries `files` past it — the recorded-release
   * shape with an appended tail.
   *
   * @param {{ message: string, file: string }[]} tailFiles
   * @returns {{ releaseCommit: string, tail: string }}
   */
  function syncWithTail(tailFiles) {
    const branch = uniqueUpstreamBranch();
    repo.git("checkout", "-b", branch);
    repo.commitInScope(
      "feat(pi-subagents): upstream 21.7.1",
      "packages/pi-subagents/up-21.7.1.txt",
    );
    repo.writeManifest("pi-subagents", "21.7.1");
    repo.git("add", "packages/pi-subagents/package.json");
    repo.git("commit", "-m", "chore(pi-subagents): release 21.7.1");
    const releaseCommit = repo.gitOut("rev-parse", "HEAD");
    for (const change of tailFiles) {
      repo.commitInScope(change.message, change.file);
    }
    const tail = repo.gitOut("rev-parse", "HEAD");
    repo.git("checkout", "main");
    repo.git("merge", "--no-ff", "-m", "chore: merge upstream/main", branch);
    recordedSyncs.push({
      merge: repo.gitOut("rev-parse", "HEAD"),
      upstream: { version: "21.7.1", commit: releaseCommit },
      forkCore: {
        level: "none",
        rationale: "upstream-only integration; no fork core resolution",
        paths: [],
      },
    });
    return { releaseCommit, tail };
  }

  it("still derives a patch when the recorded tails are empty", () => {
    syncUpstream({ version: "21.7.1" });
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
    });
  });

  it("blocks unreleased in-scope core commits after the recorded sync release", () => {
    // A hidden type on a test path: git-cliff's classification would hide
    // it, but the unreleased guard must not — in-scope work past the
    // recorded release blocks the release, whatever its commit type.
    const { tail } = syncWithTail([
      {
        message: "test(pi-subagents): unreleased hidden test change",
        file: "packages/pi-subagents/src/up.test.ts",
      },
    ]);
    writeCoreSyncState();

    const error = errorOf(() => decide());

    expect(error.message).toMatch(
      /unreleased upstream core changes follow 21\.7\.1/,
    );
    expect(error.message).toContain(tail);
  });

  it("blocks unreleased core commits after the current release record's upstream release", () => {
    // A shipped-docs path past the baseline release. Forging the baseline
    // tip means moving the fork release tag onto it: the recorded tip must
    // stay an ancestor of the fork release for the other guards to pass, so
    // the unreleased span is the only failing property.
    repo.commitInScope(
      "docs(pi-subagents): unreleased shipped guide",
      "packages/pi-subagents/docs/guide.md",
    );
    const tail = repo.gitOut("rev-parse", "HEAD");
    repo.git("tag", "-f", "-a", BASE_TAG, "-m", "forge baseline tip", tail);
    writeCoreSyncState({
      releases: [
        {
          forkTag: BASE_TAG,
          upstream: baseUpstream,
          upstreamTip: tail,
        },
      ],
    });

    const error = errorOf(() => decide());

    expect(error.message).toMatch(
      /unreleased upstream core changes follow 21\.7\.0/,
    );
    expect(error.message).toContain(tail);
  });

  it("still allows an internal-docs-only tail after the recorded sync release", () => {
    syncWithTail([
      {
        message: "docs(pi-subagents): internal plan note",
        file: "packages/pi-subagents/docs/plans/note.md",
      },
    ]);
    writeCoreSyncState();

    expect(decide()).toMatchObject({
      nextTag: "pi-subagents-v1.0.1",
      upstreamLevel: "patch",
    });
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
