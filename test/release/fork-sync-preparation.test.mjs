import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { recordForkSync } from "../../scripts/release/fork-sync/record.mjs";
import { readForkSyncState } from "../../scripts/release/fork-sync/state.mjs";
import {
  BASE_TAG,
  createForkSyncScenario,
} from "./helpers/fork-sync-scenario.mjs";

// Release preparation against the fork policy: the all-packages preflight,
// persisting the decided correspondence with the release artifacts, and the
// untouched-state contracts for sibling-only and blocked selections. Each
// test runs in a disposable repository whose only remote is a local bare
// origin, so the push preparation performs can never reach a real remote.

/** @type {ReturnType<typeof createForkSyncScenario>} */
let scenario;
/** @type {ReturnType<typeof createForkSyncScenario>["repo"]} */
let repo;
/** @type {ReturnType<typeof createForkSyncScenario>["recordedSyncs"]} */
let recordedSyncs;
/** @type {ReturnType<typeof createForkSyncScenario>["writeForkSyncState"]} */
let writeForkSyncState;
/** @type {ReturnType<typeof createForkSyncScenario>["syncUpstream"]} */
let syncUpstream;
/** @type {ReturnType<typeof createForkSyncScenario>["uniqueUpstreamBranch"]} */
let uniqueUpstreamBranch;

beforeEach(() => {
  scenario = createForkSyncScenario({ releaseArtifacts: true });
  repo = scenario.repo;
  recordedSyncs = scenario.recordedSyncs;
  writeForkSyncState = scenario.writeForkSyncState;
  syncUpstream = scenario.syncUpstream;
  uniqueUpstreamBranch = scenario.uniqueUpstreamBranch;
});

afterEach(() => {
  scenario.dispose();
});

describe("release preparation", () => {
  const statePath = () =>
    path.join(repo.dir, "scripts", "release", "pi-subagents/sync-state.json");

  /**
   * Commit the fixture's release scaffolding: the fork sync state, package
   * manifests, an existing fork changelog, the release scripts' own copies,
   * and a local-only bare `origin`. Preparation then runs as a real process
   * against a disposable repository whose only remote is local, so the push
   * it performs can never reach a real remote or registry.
   */
  function makeReleasableRepository() {
    writeForkSyncState();
    repo.copyReleaseScripts(
      "lib.sh",
      "next-version.sh",
      "prepare-release.sh",
      "fork-sync.mjs",
      "fork-sync/values.mjs",
      "fork-sync/state.mjs",
      "fork-sync/evidence.mjs",
      "fork-sync/cliff.mjs",
      "fork-sync/decision.mjs",
      "pi-subagents/config.mjs",
      "release-correspondence.mjs",
      "correspondence-table.mjs",
      "release-artifacts.mjs",
    );
    const registrations = [
      {
        directory: "pi-subagents",
        name: "@jopqior/pi-subagents",
        kind: "fork",
        upstream: {
          name: "@gotgenes/pi-subagents",
          repository: "gotgenes/pi-packages",
          directory: "packages/pi-subagents",
        },
        evidence: "fork-sync",
      },
    ];
    if (existsSync(path.join(repo.dir, "packages", "demo", "package.json"))) {
      registrations.push({
        directory: "demo",
        name: "@fixture/demo",
        kind: "original",
      });
    }
    writeFileSync(
      path.join(repo.dir, "scripts/release/release-packages.json"),
      `${JSON.stringify({ schemaVersion: 2, packages: registrations })}\n`,
    );
    mkdirSync(path.join(repo.dir, "docs/upstream"), { recursive: true });
    writeFileSync(
      path.join(
        repo.dir,
        "docs/upstream/pi-subagents-release-correspondence.md",
      ),
      "<!-- release-correspondence:start -->\n\nold\n\n<!-- release-correspondence:end -->\n",
    );
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

  it("prepares a release from recorder-written evidence in one disposable repository", () => {
    makeReleasableRepository();
    const { merge, releaseCommit, upstreamParent } = syncUpstream({
      version: "21.7.1",
    });
    repo.git(
      "tag",
      "-a",
      "pi-subagents-v21.7.1",
      "-m",
      "upstream release",
      releaseCommit,
    );
    repo.git("remote", "add", "upstream", repo.dir);
    repo.git("update-ref", "refs/remotes/upstream/main", upstreamParent);
    recordForkSync(repo.dir, statePath(), "pi-subagents", {
      merge,
      forkLevel: "none",
      rationale: "reviewed integration preserving fork identity",
    });
    const recorded = readForkSyncState(statePath(), "pi-subagents");
    expect(recorded.syncs).toEqual([
      {
        merge,
        upstream: { version: "21.7.1", commit: releaseCommit },
        forkContribution: {
          level: "none",
          rationale: "reviewed integration preserving fork identity",
          paths: [],
        },
      },
    ]);
    repo.git("add", "scripts/release/pi-subagents/sync-state.json");
    repo.git("commit", "-m", "chore: record reviewed fork sync");
    // The recorder queried this scratch remote; the fork's local tag namespace
    // must not retain the upstream release tag before release prediction.
    repo.git("tag", "-d", "pi-subagents-v21.7.1");

    const result = prepareRelease("pi-subagents");
    expect(result.status, result.stderr).toBe(0);
    const prepared = readForkSyncState(statePath(), "pi-subagents");
    expect(prepared.syncs).toEqual(recorded.syncs);
    expect(prepared.releases.at(-1)).toEqual({
      forkTag: "pi-subagents-v1.0.1",
      upstream: recorded.syncs[0].upstream,
      upstreamTip: upstreamParent,
    });
  });

  it("persists the decided correspondence with a selected fork release", () => {
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
    expect(
      readForkSyncState(statePath(), "pi-subagents").releases.at(-1),
    ).toEqual({
      forkTag: "pi-subagents-v1.0.1",
      upstream: recordedSyncs[0].upstream,
      upstreamTip: upstreamParent,
    });
    // The state update ships inside the release commit, not as a worktree
    // edit left behind for the next run to find.
    expect(repo.gitOut("status", "--porcelain")).toBe("");
    const committed = JSON.parse(
      repo.gitOut("show", "HEAD:scripts/release/pi-subagents/sync-state.json"),
    );
    expect(committed.releases.at(-1).forkTag).toBe("pi-subagents-v1.0.1");
    expect(
      repo.gitOut(
        "show",
        "HEAD:docs/upstream/pi-subagents-release-correspondence.md",
      ),
    ).toContain(recordedSyncs[0].upstream.commit);
    expect(
      existsSync(
        path.join(repo.dir, "docs/release/pi-subagents-correspondence.md"),
      ),
    ).toBe(false);
    expect(
      repo.gitOut(
        "ls-tree",
        "--name-only",
        "HEAD",
        "--",
        "docs/release/pi-subagents-correspondence.md",
      ),
    ).toBe("");
    expect(existsSync(path.join(repo.dir, "docs/upstream-sync.md"))).toBe(
      false,
    );
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

  it("leaves fork state untouched when only a sibling is selected", () => {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    makeReleasableRepository();
    const stateBefore = readFileSync(statePath(), "utf8");
    const committedStateBefore = repo.gitOut(
      "show",
      "HEAD:scripts/release/pi-subagents/sync-state.json",
    );
    const forkTagsBefore = repo.gitOut("tag", "--list", "pi-subagents-v*");

    const result = prepareRelease("demo");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Released: demo-v1.0.1");
    expect(repo.gitOut("tag", "--points-at", "HEAD")).toBe("demo-v1.0.1");
    expect(repo.gitOut("show", "HEAD:packages/demo/package.json")).toContain(
      '"version": "1.0.1"',
    );
    expect(readFileSync(statePath(), "utf8")).toBe(stateBefore);
    expect(
      repo.gitOut("show", "HEAD:scripts/release/pi-subagents/sync-state.json"),
    ).toBe(committedStateBefore);
    expect(repo.gitOut("tag", "--list", "pi-subagents-v*")).toBe(
      forkTagsBefore,
    );
    expect(repo.gitOut("status", "--porcelain")).toBe("");
  });

  it("fails before any write when a mixed selection has blocked fork evidence", () => {
    // The sibling is named first, so its version is derived before the fork's
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
    expect(result.stderr).toContain("--record-fork-sync");
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

  it("declines a second fork release with no new sync or fork work", () => {
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
    const releasesAfterFirst = readForkSyncState(
      statePath(),
      "pi-subagents",
    ).releases;

    syncUpstream({ version: "21.8.1" });
    writeForkSyncState({ releases: releasesAfterFirst });

    // 21.8.0 → 21.8.1 is one patch from the newly recorded baseline, not a
    // level recomputed from the previous release's correspondence.
    const prediction = repo.runReleaseScript("next-version.sh", "pi-subagents");
    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("pi-subagents-v1.1.1\n");

    const second = prepareRelease("pi-subagents");
    expect(second.status).toBe(0);
    const releases = readForkSyncState(statePath(), "pi-subagents").releases;
    expect(releases.map((entry) => entry.forkTag)).toEqual([
      BASE_TAG,
      "pi-subagents-v1.1.0",
      "pi-subagents-v1.1.1",
    ]);
    expect(releases[2].upstream).toEqual(recordedSyncs[1].upstream);
  });
});
