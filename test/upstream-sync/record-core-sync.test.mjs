import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createUpstreamNetwork, realGit } from "./helpers/upstream-network.mjs";

/** @type {ReturnType<typeof createUpstreamNetwork>} */
let net;

beforeEach(() => {
  net = createUpstreamNetwork();
});

afterEach(() => {
  net.dispose();
});

describe("upstream-sync.sh --record-core-sync", () => {
  /**
   * @param {string} work
   * @returns {string}
   */
  const statePathOf = (work) =>
    path.join(work, "scripts", "release", "core-sync-state.json");

  /**
   * @param {string} work
   */
  const readState = (work) =>
    JSON.parse(readFileSync(statePathOf(work), "utf8"));

  /**
   * Merge upstream into the work repo through the script and return the
   * resulting merge commit OID.
   *
   * @param {string} work
   * @returns {string}
   */
  const mergeUpstream = (work) => {
    const result = net.runScript(work, ["--merge"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("record its reviewed core sync evidence");
    return net.revParse(work, "HEAD");
  };

  it("records verified sync evidence after a completed merge", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    const merge = mergeUpstream(work);
    const releaseOid = net.revParse(
      upstreamBare,
      "refs/tags/pi-subagents-v21.7.0^{}",
    );
    const stateBefore = readState(work);

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration; resolutions kept fork identity",
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("recorded sync");
    const state = readState(work);
    expect(state.releases).toEqual(stateBefore.releases);
    expect(state.syncs).toEqual([
      {
        merge,
        upstream: { version: "21.7.0", commit: releaseOid },
        forkCore: {
          level: "none",
          rationale:
            "upstream-only integration; resolutions kept fork identity",
          paths: [],
        },
      },
    ]);
    expect(result.stdout).toContain(
      "Commit the state update before the next release prediction",
    );
  });

  it("leaves the local tag namespace byte-identical across recording", () => {
    const { work } = net.materializeNetwork("core-sync");
    const merge = mergeUpstream(work);
    const tagsBefore = net
      .git(work, [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ])
      .stdout.trim();

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(0);
    expect(
      net
        .git(work, [
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ])
        .stdout.trim(),
    ).toBe(tagsBefore);
    expect(tagsBefore).toBe(
      `refs/tags/pi-subagents-v1.0.0 ${net.revParse(work, "refs/tags/pi-subagents-v1.0.0")}`,
    );
  });

  it("selects the contained release, not a newer release advertised after the merge", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    // The merge incorporated 21.7.0; upstream then cut 21.7.1 before the
    // operator recorded the sync. The fetch makes 21.7.1's objects local,
    // but it is not contained in the merge's upstream parent, so recording
    // must still bind 21.7.0.
    const merge = mergeUpstream(work);
    net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream release 21.7.1",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
          "packages/pi-subagents/src/feature.ts": "export const feature = 1;\n",
        },
        tag: { name: "pi-subagents-v21.7.1", annotated: true },
      },
    ]);

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(0);
    const [sync] = readState(work).syncs;
    expect(sync.upstream.version).toBe("21.7.0");
    expect(sync.upstream.commit).toBe(
      net.revParse(upstreamBare, "refs/tags/pi-subagents-v21.7.0^{}"),
    );
  });

  it("records a lightweight-tagged release by its commit", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    const [releaseOid] = net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream release 21.7.1",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
          "packages/pi-subagents/src/feature.ts": "export const feature = 1;\n",
        },
        tag: { name: "pi-subagents-v21.7.1" },
      },
    ]);
    const merge = mergeUpstream(work);

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(0);
    const [sync] = readState(work).syncs;
    expect(sync.upstream).toEqual({ version: "21.7.1", commit: releaseOid });
    // The recorded OID is the release commit itself, reachable by ancestry.
    expect(
      net.git(work, ["merge-base", "--is-ancestor", releaseOid, `${merge}^2`], {
        allowFail: true,
      }).status,
    ).toBe(0);
  });

  it("records an explicit reviewed fork resolution level and its paths", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream edits shared core",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
          "packages/pi-subagents/src/core.ts": "export const core = 2;\n",
        },
        tag: { name: "pi-subagents-v21.7.1", annotated: true },
      },
    ]);
    net.writeFiles(work, {
      "packages/pi-subagents/src/core.ts": "export const core = 'fork';\n",
    });
    net.git(work, ["add", "-A"]);
    net.git(work, [
      "commit",
      "-m",
      "feat(pi-subagents): fork edits shared core",
    ]);
    const conflicted = net.runScript(work, ["--merge"]);
    expect(conflicted.status).toBe(1);
    expect(existsSync(path.join(net.gitDir(work), "MERGE_HEAD"))).toBe(true);
    writeFileSync(
      path.join(work, "packages/pi-subagents/src/core.ts"),
      "export const core = 'resolved-combined';\n",
    );
    net.git(work, ["add", "-A"]);
    const continued = spawnSync(realGit, ["merge", "--continue"], {
      cwd: work,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_SYSTEM: "/dev/null",
        GIT_EDITOR: "true",
      },
    });
    expect(continued.status).toBe(0);
    const merge = net.revParse(work, "HEAD");

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "patch",
      "--rationale",
      "resolution combined both sides of the shared core module",
    ]);

    expect(result.status).toBe(0);
    const [sync] = readState(work).syncs;
    expect(sync.forkCore.level).toBe("patch");
    expect(sync.forkCore.paths).toEqual(["packages/pi-subagents/src/core.ts"]);
    expect(result.stdout).toContain("packages/pi-subagents/src/core.ts");
  });

  it("refuses an unreviewed record: the review inputs are required", () => {
    const { work } = net.materializeNetwork("core-sync");
    const merge = mergeUpstream(work);
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, ["--record-core-sync", merge]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--fork-level is required");
    expect(result.stderr).toContain("--rationale is required");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });

  it("refuses recording while a merge is still in progress", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream edits shared core",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
          "packages/pi-subagents/src/core.ts": "export const core = 2;\n",
        },
        tag: { name: "pi-subagents-v21.7.1", annotated: true },
      },
    ]);
    net.writeFiles(work, {
      "packages/pi-subagents/src/core.ts": "export const core = 'fork';\n",
    });
    net.git(work, ["add", "-A"]);
    net.git(work, [
      "commit",
      "-m",
      "feat(pi-subagents): fork edits shared core",
    ]);
    const conflicted = net.runScript(work, ["--merge"]);
    expect(conflicted.status).toBe(1);
    const mergeHeadBefore = net.readGitStateFile(work, "MERGE_HEAD");
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-core-sync",
      "HEAD",
      "--fork-level",
      "none",
      "--rationale",
      "should not be recorded",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("a merge is already in progress");
    expect(net.readGitStateFile(work, "MERGE_HEAD")).toBe(mergeHeadBefore);
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });

  it("refuses unreleased upstream core changes after the selected release", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream release 21.7.1",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
        },
        tag: { name: "pi-subagents-v21.7.1", annotated: true },
      },
      {
        message: "feat(pi-subagents): unreleased core change",
        files: {
          "packages/pi-subagents/src/unreleased.ts":
            "export const pending = 1;\n",
        },
      },
    ]);
    const merge = mergeUpstream(work);
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unreleased upstream core changes");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });

  it("allows internal-doc-only upstream tails under the exclusion policy", () => {
    const { work, upstreamBare } = net.materializeNetwork("core-sync");
    net.advanceUpstreamReleases(upstreamBare, [
      {
        message: "feat(pi-subagents): upstream release 21.7.1",
        files: {
          "packages/pi-subagents/package.json": `${JSON.stringify(
            { name: "@gotgenes/pi-subagents", version: "21.7.1" },
            null,
            2,
          )}\n`,
        },
        tag: { name: "pi-subagents-v21.7.1", annotated: true },
      },
      {
        message: "docs(pi-subagents): internal plan note after the release",
        files: {
          "packages/pi-subagents/docs/plans/next.md": "internal note\n",
        },
      },
    ]);
    const merge = mergeUpstream(work);

    const result = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(0);
    expect(readState(work).syncs[0].upstream.version).toBe("21.7.1");
  });

  it("treats an identical re-record as idempotent and a conflicting one as an error", () => {
    const { work } = net.materializeNetwork("core-sync");
    const merge = mergeUpstream(work);
    const review = [
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ];
    net.runScript(work, ["--record-core-sync", merge, ...review]);
    const recorded = readFileSync(statePathOf(work), "utf8");
    // The operator commits the state update before any re-run: recording
    // writes a tracked file, and the recording preconditions require a
    // clean tree.
    net.git(work, ["add", "scripts/release/core-sync-state.json"]);
    net.git(work, [
      "commit",
      "-m",
      "chore: record core sync evidence for upstream 21.7.0",
    ]);

    const again = net.runScript(work, ["--record-core-sync", merge, ...review]);

    expect(again.status).toBe(0);
    expect(again.stdout).toContain("already recorded");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(recorded);

    const conflicting = net.runScript(work, [
      "--record-core-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "a different review conclusion",
    ]);

    expect(conflicting.status).toBe(1);
    expect(conflicting.stderr).toContain("a different record already exists");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(recorded);
  }, 30_000);

  it("refuses a merge that cannot be resolved", () => {
    const { work } = net.materializeNetwork("core-sync");
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-core-sync",
      "0".repeat(40),
      "--fork-level",
      "none",
      "--rationale",
      "nothing to see",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cannot resolve merge");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });
});
