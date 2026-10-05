import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readForkSyncState } from "../../scripts/release/fork-sync/state.mjs";

import {
  baseGitEnv,
  createUpstreamNetwork,
  realGit,
} from "./helpers/upstream-network.mjs";

/** @type {ReturnType<typeof createUpstreamNetwork>} */
let net;

beforeEach(() => {
  net = createUpstreamNetwork();
});

afterEach(() => {
  net.dispose();
});

describe("upstream-sync.sh --record-fork-sync", () => {
  /**
   * @param {string} work
   * @returns {string}
   */
  const statePathOf = (work) =>
    path.join(work, "scripts", "release", "pi-subagents/sync-state.json");

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
   * @param {string} upstreamBare
   * @returns {string}
   */
  const mergeUpstream = (work, upstreamBare) => {
    const target = net.prepareFetchedUpstream(work, upstreamBare);
    const result = net.runScript(work, [
      "--merge",
      "--expected-upstream",
      target,
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("record its reviewed fork sync evidence");
    return net.revParse(work, "HEAD");
  };

  describe("transport and preflight", () => {
    const review = [
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ];

    it("preserves both HTTPS remote identities during recording", () => {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const merge = mergeUpstream(work, upstreamBare);
      const origin = "https://github.com/Jopqior/gotgenes-pi-packages";
      const upstream = "https://github.com/gotgenes/pi-packages.git";
      net.git(work, ["remote", "set-url", "origin", origin]);
      net.git(work, ["remote", "set-url", "upstream", upstream]);
      const before = net.recordedInvocations().length;

      const result = net.runScript(work, [
        "--record-fork-sync",
        merge,
        ...review,
      ]);

      expect(result.status).toBe(0);
      expect(net.git(work, ["remote", "get-url", "origin"]).stdout.trim()).toBe(
        origin,
      );
      expect(
        net.git(work, ["remote", "get-url", "upstream"]).stdout.trim(),
      ).toBe(upstream);
      expect(
        net
          .recordedInvocations()
          .slice(before)
          .map(({ args }) => args)
          .filter((args) => args[0] === "fetch"),
      ).toEqual([]);
      expect(
        net
          .recordedInvocations()
          .slice(before)
          .map(({ args }) => args)
          .filter((args) => args[0] === "ls-remote"),
      ).toEqual([["ls-remote", "--tags", "upstream", "pi-subagents-v*"]]);
      expect(result.stdout).not.toContain("ahead/behind");
      expect(result.stdout).not.toContain("newest upstream");
    });

    for (const remote of ["origin", "upstream"]) {
      it(`rejects an unsupported ${remote} identity before recording writes`, () => {
        const { work, upstreamBare } = net.materializeNetwork("fork-sync");
        const merge = mergeUpstream(work, upstreamBare);
        const url =
          remote === "origin"
            ? "https://github.com/other/Jopqior/gotgenes-pi-packages.git"
            : "https://github.com/gotgenes/pi-packages.git/extra";
        net.git(work, ["remote", "set-url", remote, url]);
        const before = net.recordedInvocations().length;
        const stateBefore = readFileSync(statePathOf(work), "utf8");

        const result = net.runScript(work, [
          "--record-fork-sync",
          merge,
          ...review,
        ]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          remote === "origin"
            ? `origin is not Jopqior/gotgenes-pi-packages (got ${url})`
            : `unsupported upstream remote URL: ${url}`,
        );
        expect(
          net
            .recordedInvocations()
            .slice(before)
            .map(({ args }) => args)
            .filter((args) => ["config", "fetch"].includes(args[0])),
        ).toEqual([]);
        expect(net.git(work, ["remote", "get-url", remote]).stdout.trim()).toBe(
          url,
        );
        expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
      });
    }

    it("requires explicit protocol when the upstream remote is missing during recording", () => {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const merge = mergeUpstream(work, upstreamBare);
      net.git(work, ["remote", "remove", "upstream"]);
      const before = net.recordedInvocations().length;

      const result = net.runScript(work, [
        "--record-fork-sync",
        merge,
        ...review,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "missing upstream remote; choose --upstream-protocol",
      );
      expect(net.git(work, ["remote"]).stdout.trim()).toBe("origin");
      expect(
        net
          .recordedInvocations()
          .slice(before)
          .map(({ args }) => args)
          .filter((args) => ["config", "fetch"].includes(args[0])),
      ).toEqual([]);
    });

    it("uses an explicitly chosen HTTPS remote for recording", () => {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const merge = mergeUpstream(work, upstreamBare);
      net.git(work, ["remote", "remove", "upstream"]);
      net.prepareFetchedUpstream(work, upstreamBare);

      const result = net.runScript(work, [
        "--record-fork-sync",
        merge,
        ...review,
        "--upstream-protocol",
        "https",
      ]);

      expect(result.status).toBe(0);
      expect(
        net.git(work, ["remote", "get-url", "upstream"]).stdout.trim(),
      ).toBe("https://github.com/gotgenes/pi-packages.git");
    });

    it("rejects a conflicting protocol without rewriting the existing recording remote", () => {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const merge = mergeUpstream(work, upstreamBare);
      const before = net.recordedInvocations().length;

      const result = net.runScript(work, [
        "--record-fork-sync",
        merge,
        ...review,
        "--upstream-protocol",
        "https",
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "selected protocol conflicts with existing upstream URL",
      );
      expect(
        net.git(work, ["remote", "get-url", "upstream"]).stdout.trim(),
      ).toBe("git@github.com:gotgenes/pi-packages.git");
      expect(
        net
          .recordedInvocations()
          .slice(before)
          .map(({ args }) => args)
          .filter((args) => ["config", "fetch"].includes(args[0])),
      ).toEqual([]);
    });

    it("checks a dirty index before adding a missing remote or fetching in recording mode", () => {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const merge = mergeUpstream(work, upstreamBare);
      net.git(work, ["remote", "remove", "upstream"]);
      net.writeFiles(work, { "README.md": "staged change\n" });
      net.git(work, ["add", "README.md"]);
      const before = net.recordedInvocations().length;
      const indexBefore = net.indexTree(work);

      const result = net.runScript(work, [
        "--record-fork-sync",
        merge,
        ...review,
        "--upstream-protocol",
        "ssh",
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("index or tracked worktree is not clean");
      expect(net.git(work, ["remote"]).stdout.trim()).toBe("origin");
      expect(net.indexTree(work)).toBe(indexBefore);
      expect(
        net
          .recordedInvocations()
          .slice(before)
          .map(({ args }) => args)
          .filter((args) => ["config", "fetch"].includes(args[0])),
      ).toEqual([]);
    });
  });

  it("does not refresh an insufficient local upstream/main during recording", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    net.git(work, [
      "fetch",
      "--no-tags",
      upstreamBare,
      "+refs/heads/main:refs/remotes/upstream/main",
    ]);
    const merge = mergeUpstream(work, upstreamBare);
    const actual = net.revParse(upstreamBare, "refs/heads/main");
    const stale = net.revParse(work, `${merge}^1~1`);
    net.git(work, [
      "config",
      "remote.upstream.fetch",
      "+refs/heads/main:refs/remotes/other/main",
    ]);
    net.git(work, ["update-ref", "refs/remotes/upstream/main", stale]);
    const before = readFileSync(statePathOf(work), "utf8");
    expect(stale).not.toBe(actual);

    const result = net.runScript(work, [
      "--record-fork-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not contained in upstream/main");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(before);
    expect(net.revParse(work, "upstream/main")).toBe(stale);
    expect(net.recordedFetches()).toEqual([]);
    expect(
      net.git(work, ["config", "--get", "remote.upstream.fetch"]).stdout.trim(),
    ).toBe("+refs/heads/main:refs/remotes/other/main");
  });

  it("records verified sync evidence after a completed merge", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    const merge = mergeUpstream(work, upstreamBare);
    const releaseOid = net.revParse(
      upstreamBare,
      "refs/tags/pi-subagents-v21.7.0^{}",
    );
    const stateBefore = readState(work);

    const result = net.runScript(work, [
      "--record-fork-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration; resolutions kept fork identity",
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("recorded sync");
    const state = readState(work);
    expect(readForkSyncState(statePathOf(work), "pi-subagents")).toEqual(state);
    expect(state.schemaVersion).toBe(2);
    expect(state.releases).toEqual(stateBefore.releases);
    expect(state.syncs).toEqual([
      {
        merge,
        upstream: { version: "21.7.0", commit: releaseOid },
        forkContribution: {
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
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    const merge = mergeUpstream(work, upstreamBare);
    const tagsBefore = net
      .git(work, [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ])
      .stdout.trim();

    const result = net.runScript(work, [
      "--record-fork-sync",
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

  describe("tag ref/object drift during recording", () => {
    for (const scenario of [
      {
        action: "add",
        tag: "new-local-tag",
        report: "added: refs/tags/new-local-tag",
      },
      {
        action: "delete",
        tag: "pi-subagents-v1.0.0",
        report: "removed: refs/tags/pi-subagents-v1.0.0",
      },
      {
        action: "retarget",
        tag: "pi-subagents-v1.0.0",
        report: "retargeted: refs/tags/pi-subagents-v1.0.0",
      },
    ]) {
      it(`reports ${scenario.action} at the release query boundary without rolling back state`, () => {
        const { work, upstreamBare } = net.materializeNetwork("fork-sync");
        const merge = mergeUpstream(work, upstreamBare);
        const headBefore = net.revParse(work, "HEAD");
        const before = net.recordedInvocations().length;

        const result = net.runScript(
          work,
          [
            "--record-fork-sync",
            merge,
            "--fork-level",
            "none",
            "--rationale",
            "upstream-only integration",
          ],
          {
            UPSTREAM_SYNC_TEST_INJECT_TAG: scenario.tag,
            UPSTREAM_SYNC_TEST_TAG_ACTION: scenario.action,
            UPSTREAM_SYNC_TEST_TAG_TRIGGER: "record",
          },
        );

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(scenario.report);
        expect(result.stderr).toContain(
          "stop for operator approval before any tag recovery",
        );
        // The recorder may have written evidence before drift is detected.
        // The script must stop for inspection, never silently roll it back.
        expect(readState(work).syncs[0].merge).toBe(merge);
        expect(net.revParse(work, "HEAD")).toBe(headBefore);
        expect(
          net
            .recordedInvocations()
            .slice(before)
            .map(({ args }) => args)
            .filter((args) => args[0] === "fetch"),
        ).toEqual([]);
      });
    }
  });

  describe("failed recording boundary", () => {
    it.each([false, true])(
      "preserves recorder failure and checks tags after a failed query (drift=%s)",
      (drift) => {
        const { work, upstreamBare } = net.materializeNetwork("fork-sync");
        const merge = mergeUpstream(work, upstreamBare);
        const before = net.recordedInvocations().length;
        const stateBefore = readFileSync(statePathOf(work), "utf8");
        const result = net.runScript(
          work,
          [
            "--record-fork-sync",
            merge,
            "--fork-level",
            "none",
            "--rationale",
            "reviewed",
          ],
          {
            UPSTREAM_SYNC_TEST_FAIL_RELEASE_QUERY_AFTER_TAG: "1",
            ...(drift
              ? {
                  UPSTREAM_SYNC_TEST_INJECT_TAG: "failed-record-tag",
                  UPSTREAM_SYNC_TEST_TAG_TRIGGER: "record",
                }
              : {}),
          },
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "simulated release query failure after tag write",
        );
        if (drift) {
          expect(result.stderr).toContain("added: refs/tags/failed-record-tag");
          expect(result.stderr).toContain(
            "stop for operator approval before any tag recovery",
          );
          expect(
            net.git(work, ["tag", "--list", "failed-record-tag"]).stdout.trim(),
          ).toBe("failed-record-tag");
        }
        expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
        expect(
          net
            .recordedInvocations()
            .slice(before)
            .filter(({ args }) => args[0] === "fetch"),
        ).toEqual([]);
      },
    );
  });

  it("selects the contained release, not a newer release advertised after the merge", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    // A newly advertised release is outside the merged history. Recording
    // must bind the contained release without recovering newer objects.
    const merge = mergeUpstream(work, upstreamBare);
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
      "--record-fork-sync",
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
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
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
    const merge = mergeUpstream(work, upstreamBare);

    const result = net.runScript(work, [
      "--record-fork-sync",
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
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
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
    const target = net.prepareFetchedUpstream(work, upstreamBare);
    const conflicted = net.runScript(work, [
      "--merge",
      "--expected-upstream",
      target,
    ]);
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
      "--record-fork-sync",
      merge,
      "--fork-level",
      "patch",
      "--rationale",
      "resolution combined both sides of the shared core module",
    ]);

    expect(result.status).toBe(0);
    const [sync] = readState(work).syncs;
    expect(sync.forkContribution.level).toBe("patch");
    expect(sync.forkContribution.paths).toEqual([
      "packages/pi-subagents/src/core.ts",
    ]);
    expect(result.stdout).toContain("packages/pi-subagents/src/core.ts");
  });

  it("refuses an unreviewed record: the review inputs are required", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    const merge = mergeUpstream(work, upstreamBare);
    const stateBefore = readFileSync(statePathOf(work), "utf8");
    net.git(work, ["remote", "remove", "upstream"]);
    const configBefore = readFileSync(path.join(net.gitDir(work), "config"));
    const start = net.recordedInvocations().length;

    const result = net.runScript(work, [
      "--record-fork-sync",
      merge,
      "--upstream-protocol",
      "ssh",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--fork-level is required");
    expect(result.stderr).toContain("--rationale is required");
    expect(
      net
        .recordedInvocations()
        .slice(start)
        .filter(({ args }) =>
          ["config", "remote", "fetch", "ls-remote"].includes(args[0]),
        ),
    ).toEqual([]);
    expect(readFileSync(path.join(net.gitDir(work), "config"))).toEqual(
      configBefore,
    );
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });

  it("refuses recording while a merge is still in progress", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
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
    const target = net.prepareFetchedUpstream(work, upstreamBare);
    const conflicted = net.runScript(work, [
      "--merge",
      "--expected-upstream",
      target,
    ]);
    expect(conflicted.status).toBe(1);
    const mergeHeadBefore = net.readGitStateFile(work, "MERGE_HEAD");
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-fork-sync",
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

  it("refuses unreleased upstream package changes after the selected release", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
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
    const merge = mergeUpstream(work, upstreamBare);
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-fork-sync",
      merge,
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unreleased upstream package changes");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(stateBefore);
  });

  it("allows internal-doc-only upstream tails under the exclusion policy", () => {
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
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
    const merge = mergeUpstream(work, upstreamBare);

    const result = net.runScript(work, [
      "--record-fork-sync",
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
    const { work, upstreamBare } = net.materializeNetwork("fork-sync");
    const merge = mergeUpstream(work, upstreamBare);
    const review = [
      "--fork-level",
      "none",
      "--rationale",
      "upstream-only integration",
    ];
    net.runScript(work, ["--record-fork-sync", merge, ...review]);
    const recorded = readFileSync(statePathOf(work), "utf8");
    // The operator commits the state update before any re-run: recording
    // writes a tracked file, and the recording preconditions require a
    // clean tree.
    net.git(work, ["add", "scripts/release/pi-subagents/sync-state.json"]);
    net.git(work, [
      "commit",
      "-m",
      "chore: record core sync evidence for upstream 21.7.0",
    ]);

    const again = net.runScript(work, ["--record-fork-sync", merge, ...review]);

    expect(again.status).toBe(0);
    expect(again.stdout).toContain("already recorded");
    expect(readFileSync(statePathOf(work), "utf8")).toBe(recorded);

    const conflicting = net.runScript(work, [
      "--record-fork-sync",
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

  describe("selected worktrees recording", () => {
    const directory = "pi-subagents-worktrees";
    const stateRelative = `scripts/release/${directory}/sync-state.json`;
    const viewRelative = "docs/upstream/pi-subagents-release-correspondence.md";
    const review = [
      "--fork-level",
      "none",
      "--rationale",
      "worktrees-only review",
    ];

    beforeEach(() => {
      net.dispose();
      net = createUpstreamNetwork(`${directory}-v*`);
    });

    function selectedHistory() {
      const { work, upstreamBare } = net.materializeNetwork("fork-sync");
      const [release] = net.advanceUpstreamReleases(upstreamBare, [
        {
          message: "feat(pi-subagents-worktrees): upstream release 0.3.3",
          files: {
            [`packages/${directory}/package.json`]: `${JSON.stringify({ name: "@gotgenes/pi-subagents-worktrees", version: "0.3.3" })}\n`,
          },
          tag: { name: `${directory}-v0.3.3`, annotated: true },
        },
      ]);
      const initialState = {
        schemaVersion: 2,
        releases: [
          {
            forkTag: `${directory}-v0.1.0`,
            upstream: { version: "0.3.3", commit: release },
            upstreamTip: release,
          },
        ],
        syncs: [],
      };
      net.commit(work, "test: independent published worktrees baseline", {
        [stateRelative]: `${JSON.stringify(initialState, null, 2)}\n`,
        [viewRelative]: "core correspondence sentinel\n",
      });
      net.git(work, ["tag", `${directory}-v0.1.0`]);
      const merge = mergeUpstream(work, upstreamBare);
      return { work, merge, release, initialState };
    }

    const tagMap = (work) =>
      net.git(work, [
        "for-each-ref",
        "--sort=refname",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ]).stdout;
    const releaseQueries = (start) =>
      net
        .recordedInvocations()
        .slice(start)
        .map(({ args }) => args)
        .filter((args) => args[0] === "ls-remote");

    function runRecorder(work, args) {
      return spawnSync(
        process.execPath,
        [
          path.resolve("scripts/release/record-fork-sync.mjs"),
          "--repo",
          work,
          ...args,
        ],
        {
          cwd: work,
          encoding: "utf8",
          env: {
            ...baseGitEnv,
            PATH: `${path.join(net.scratch, "bin")}${path.delimiter}${process.env.PATH}`,
            UPSTREAM_SYNC_TEST_REAL_GIT: realGit,
            UPSTREAM_SYNC_TEST_GIT_LOG: path.join(
              net.scratch,
              "git-args.jsonl",
            ),
            UPSTREAM_SYNC_TEST_UPSTREAM_BARE: path.join(
              net.scratch,
              "remotes/gotgenes/pi-packages.git",
            ),
          },
        },
      );
    }

    it.each(["shell", "CLI"])(
      "selects worktrees query/state and preserves core bytes through %s",
      (entry) => {
        const { work, merge, release, initialState } = selectedHistory();
        const coreBefore = readFileSync(statePathOf(work));
        const viewBefore = readFileSync(path.join(work, viewRelative));
        const tagsBefore = tagMap(work);
        const headBefore = net.revParse(work, "HEAD");
        const start = net.recordedInvocations().length;
        const result =
          entry === "shell"
            ? net.runScript(work, [
                "--record-fork-sync",
                merge,
                "--package",
                directory,
                ...review,
              ])
            : runRecorder(work, [
                "--merge",
                merge,
                "--package",
                directory,
                ...review,
              ]);

        expect(releaseQueries(start)).toEqual([
          ["ls-remote", "--tags", "upstream", `${directory}-v*`],
        ]);
        expect(result.status).toBe(0);
        expect(
          readForkSyncState(path.join(work, stateRelative), directory),
        ).toEqual({
          ...initialState,
          syncs: [
            {
              merge,
              upstream: { version: "0.3.3", commit: release },
              forkContribution: {
                level: "none",
                rationale: "worktrees-only review",
                paths: [],
              },
            },
          ],
        });
        expect(
          net
            .recordedInvocations()
            .slice(start)
            .filter(({ args }) => args[0] === "fetch"),
        ).toEqual([]);
        expect(readFileSync(statePathOf(work))).toEqual(coreBefore);
        expect(readFileSync(path.join(work, viewRelative))).toEqual(viewBefore);
        expect(tagMap(work)).toBe(tagsBefore);
        expect(net.revParse(work, "HEAD")).toBe(headBefore);
      },
    );

    it("records each package with independent review and preserves repeated/conflicting worktrees records", () => {
      const { work, merge } = selectedHistory();
      const args = [
        "--record-fork-sync",
        merge,
        "--package",
        directory,
        ...review,
      ];
      expect(net.runScript(work, args).status).toBe(0);
      const selectedBefore = readFileSync(path.join(work, stateRelative));
      net.git(work, ["add", stateRelative]);
      net.git(work, ["commit", "-m", "test: save worktrees review"]);

      const repeated = net.runScript(work, args);
      expect(repeated.status).toBe(0);
      expect(repeated.stdout).toContain("already recorded");
      const conflict = net.runScript(work, [
        "--record-fork-sync",
        merge,
        "--package",
        directory,
        "--fork-level",
        "none",
        "--rationale",
        "different worktrees review",
      ]);
      expect(conflict.status).toBe(1);
      expect(conflict.stderr).toContain("a different record already exists");
      expect(readFileSync(path.join(work, stateRelative))).toEqual(
        selectedBefore,
      );

      const core = net.runScript(work, [
        "--record-fork-sync",
        merge,
        "--fork-level",
        "none",
        "--rationale",
        "separate core review",
      ]);
      expect(core.status).toBe(0);
      expect(readState(work).syncs[0].forkContribution.rationale).toBe(
        "separate core review",
      );
      expect(readState(work).syncs[0].upstream.version).toBe("21.7.0");
      expect(readFileSync(path.join(work, stateRelative))).toEqual(
        selectedBefore,
      );
    }, 30_000);

    it.each([false, true])(
      "detects selected-query tag drift without recovery (query failure=%s)",
      (failed) => {
        const { work, merge } = selectedHistory();
        const coreBefore = readFileSync(statePathOf(work));
        const stateBefore = readFileSync(path.join(work, stateRelative));
        const protectedTag = `${directory}-v0.1.0`;
        const oldTag = net.revParse(work, protectedTag);
        const headBefore = net.revParse(work, "HEAD");
        const start = net.recordedInvocations().length;
        const result = net.runScript(
          work,
          ["--record-fork-sync", merge, "--package", directory, ...review],
          {
            UPSTREAM_SYNC_TEST_TAG_TRIGGER: "record",
            UPSTREAM_SYNC_TEST_INJECT_TAG: protectedTag,
            UPSTREAM_SYNC_TEST_TAG_ACTION: "retarget",
            ...(failed
              ? { UPSTREAM_SYNC_TEST_FAIL_RELEASE_QUERY_AFTER_TAG: "1" }
              : {}),
          },
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          `retargeted: refs/tags/${protectedTag}`,
        );
        expect(result.stderr).toContain(
          "stop for operator approval before any tag recovery",
        );
        expect(releaseQueries(start)).toEqual([
          ["ls-remote", "--tags", "upstream", `${directory}-v*`],
        ]);
        expect(net.revParse(work, protectedTag)).toBe(
          net.revParse(work, "upstream/main"),
        );
        expect(net.revParse(work, protectedTag)).not.toBe(oldTag);
        expect(net.revParse(work, "HEAD")).toBe(headBefore);
        expect(readFileSync(statePathOf(work))).toEqual(coreBefore);
        if (failed) {
          expect(result.stderr).toContain(
            "simulated release query failure after tag write",
          );
          expect(readFileSync(path.join(work, stateRelative))).toEqual(
            stateBefore,
          );
        } else {
          expect(
            readForkSyncState(path.join(work, stateRelative), directory)
              .syncs[0].merge,
          ).toBe(merge);
        }
      },
    );

    describe("early input rejection", () => {
      const invalid = [
        ["unknown", ["--package", "unknown"], true],
        ["path traversal", ["--package", "../pi-subagents"], true],
        ["missing value", ["--package"], true],
        ["empty value", ["--package", ""], true],
        ["option value", ["--package", "--help"], true],
        ["duplicate", ["--package", directory, "--package", directory], true],
        [
          "missing level",
          ["--package", directory, "--rationale", "review"],
          false,
        ],
        [
          "missing rationale",
          ["--package", directory, "--fork-level", "none"],
          false,
        ],
        ["missing review", ["--package", directory], false],
      ];
      for (const entry of ["shell", "CLI"]) {
        it.each(invalid)(
          `rejects %s before remote/config/query effects through ${entry}`,
          (label, options, completeReview) => {
            const { work } = net.materializeNetwork("fork-sync");
            net.git(work, ["remote", "remove", "upstream"]);
            const configBefore = readFileSync(
              path.join(net.gitDir(work), "config"),
            );
            const coreBefore = readFileSync(statePathOf(work));
            const args = [...options, ...(completeReview ? review : [])];
            const result =
              entry === "shell"
                ? net.runScript(work, [
                    "--record-fork-sync",
                    "HEAD",
                    "--upstream-protocol",
                    "ssh",
                    ...args,
                  ])
                : runRecorder(work, ["--merge", "HEAD", ...args]);
            expect(result.status).toBe(1);
            if (["unknown", "path traversal"].includes(label)) {
              expect(result.stderr).toContain("unsupported fork sync package");
            }
            if (entry === "CLI" && label === "duplicate") {
              expect(result.stderr).toContain("--package cannot be repeated");
            }
            expect(
              net
                .recordedInvocations()
                .filter(({ args }) =>
                  ["config", "remote", "fetch", "ls-remote"].includes(args[0]),
                ),
            ).toEqual([]);
            expect(readFileSync(path.join(net.gitDir(work), "config"))).toEqual(
              configBefore,
            );
            expect(readFileSync(statePathOf(work))).toEqual(coreBefore);
          },
        );
      }
    });
  });

  it("refuses a merge that cannot be resolved", () => {
    const { work } = net.materializeNetwork("fork-sync");
    const stateBefore = readFileSync(statePathOf(work), "utf8");

    const result = net.runScript(work, [
      "--record-fork-sync",
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
