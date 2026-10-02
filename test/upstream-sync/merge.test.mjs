import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  baseGitEnv,
  createUpstreamNetwork,
  githubUpstream,
  mergeMessage,
  realGit,
  refuseHint,
} from "./helpers/upstream-network.mjs";

/** @type {ReturnType<typeof createUpstreamNetwork>} */
let net;
let materializeNetwork;
let runScript;
let git;
let revParse;
let parentsOf;
let gitDir;
let indexTree;
let snapshotDir;
let readGitStateFile;
let writeFiles;
let advanceUpstream;
let recordedFetches;
let recordedInvocations;

beforeEach(() => {
  net = createUpstreamNetwork();
  ({
    materializeNetwork,
    runScript,
    git,
    revParse,
    parentsOf,
    gitDir,
    indexTree,
    snapshotDir,
    readGitStateFile,
    writeFiles,
    advanceUpstream,
    recordedFetches,
    recordedInvocations,
  } = net);
});

afterEach(() => {
  net.dispose();
});

describe("upstream-sync.sh", () => {
  describe("fetched input preparation", () => {
    it("resolves upstream/main explicitly without importing tags or changing HEAD", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");
      const actual = revParse(upstreamBare, "refs/heads/main");
      git(work, [
        "config",
        "remote.upstream.fetch",
        "+refs/heads/main:refs/remotes/other/main",
      ]);
      git(work, ["update-ref", "refs/remotes/upstream/main", before]);
      git(work, ["tag", "pi-subagents-v1.0.0", before]);
      const tagsBefore = git(work, [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ]).stdout;

      const target = net.prepareFetchedUpstream(work, upstreamBare);

      expect(target).toBe(actual);
      expect(revParse(work, "upstream/main")).toBe(actual);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(
        git(work, [
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ]).stdout,
      ).toBe(tagsBefore);
      expect(recordedInvocations()).toEqual([]);
      expect(
        git(work, ["config", "--get", "remote.upstream.fetch"]).stdout.trim(),
      ).toBe("+refs/heads/main:refs/remotes/other/main");
    });
  });

  describe("help and explicit modes", () => {
    it.each([[], ["--help"], ["-h"]])(
      "shows help without effects: %j",
      (...args) => {
        const { work } = materializeNetwork("divergent");
        const before = git(work, ["config", "--local", "--list"]).stdout;
        const result = runScript(work, args);
        expect(result.status).toBe(0);
        expect(result.stderr).toContain("--fetch");
        expect(recordedInvocations()).toEqual([]);
        expect(git(work, ["config", "--local", "--list"]).stdout).toBe(before);
      },
    );

    it.each([
      ["--merge"],
      ["--fetch", "--fetch"],
      ["--fetch", "--merge"],
      ["--fetch", "--record-fork-sync", "HEAD"],
      ["--fetch", "--expected-upstream", "f".repeat(40)],
      ["--upstream-protocol", "ssh"],
    ])("rejects missing or conflicting modes before effects: %j", (...args) => {
      const { work } = materializeNetwork("divergent");
      const result = runScript(work, args);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Usage:");
      expect(
        recordedInvocations().filter(({ args: call }) =>
          ["config", "fetch", "merge", "ls-remote"].includes(call[0]),
        ),
      ).toEqual([]);
    });
  });

  describe("status", () => {
    it("refreshes upstream/main even when remote.fetch maps main elsewhere", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const actual = revParse(upstreamBare, "refs/heads/main");
      const stale = revParse(work, "HEAD~1");
      git(work, [
        "config",
        "remote.upstream.fetch",
        "+refs/heads/main:refs/remotes/other/main",
      ]);
      git(work, ["update-ref", "refs/remotes/upstream/main", stale]);
      expect(stale).not.toBe(actual);

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "upstream/main")).toBe(actual);
      expect(result.stdout).toContain(
        "ahead/behind (HEAD...upstream/main): 1/1",
      );
      expect(
        git(work, ["config", "--get", "remote.upstream.fetch"]).stdout.trim(),
      ).toBe("+refs/heads/main:refs/remotes/other/main");
    });

    it("uses canonical remote identities with isolated local transport", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      expect(git(work, ["remote", "get-url", "origin"]).stdout.trim()).toBe(
        "git@github.com:Jopqior/gotgenes-pi-packages.git",
      );
      expect(
        git(work, ["remote", "get-url", "upstream"], {
          allowFail: true,
        }).stdout.trim(),
      ).toBe(githubUpstream);

      expect(runScript(work, ["--fetch"]).status).toBe(0);
      expect(revParse(work, "upstream/main")).toBe(
        revParse(upstreamBare, "refs/heads/main"),
      );
      expect(recordedFetches()).toEqual([
        [
          "fetch",
          "--no-tags",
          "upstream",
          "+refs/heads/main:refs/remotes/upstream/main",
        ],
      ]);
    });

    it("fetches without changing HEAD", () => {
      const { work } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(result.stdout).toContain("remote.upstream.tagOpt=--no-tags");
      expect(result.stdout).toContain("remote.upstream.pushurl=DISABLE");
      expect(result.stdout).toMatch(
        /ahead\/behind \(HEAD\.\.\.upstream\/main\): 1\/1/,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });
  });

  describe("--merge", () => {
    it("creates a two-parent merge with first-parent fork content", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");
      const upstreamMain = net.prepareFetchedUpstream(work, upstreamBare);

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        upstreamMain,
      ]);

      expect(result.status).toBe(0);
      const parents = parentsOf(work);
      expect(parents).toEqual([before, upstreamMain]);
      expect(git(work, ["log", "-1", "--format=%s"]).stdout.trim()).toBe(
        mergeMessage,
      );
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD^1:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(
        git(work, ["show", "HEAD^1:upstream-only.txt"], { allowFail: true })
          .status,
      ).not.toBe(0);
    });

    it("is a no-op when upstream is already integrated", () => {
      const { work, upstreamBare } = materializeNetwork("already-integrated");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(result.stdout).toContain(
        "upstream already contained in HEAD; no merge performed",
      );
      expect(result.stdout).not.toContain(
        "record its reviewed fork sync evidence",
      );
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
    });

    it("refuses a fast-forward-only integration without changing HEAD", () => {
      const { work, upstreamBare } = materializeNetwork("fast-forward");
      const before = revParse(work, "HEAD");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      expect(
        git(work, ["merge-base", "--is-ancestor", before, target]).status,
      ).toBe(0);

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "fast-forward-only upstream integration requires separate review",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
      expect(result.stdout).not.toContain(
        "record its reviewed fork sync evidence",
      );
    });

    it("refuses unrelated histories before invoking merge", () => {
      const { work, upstreamBare } = materializeNetwork("unrelated");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");
      expect(
        git(work, ["merge-base", before, target], { allowFail: true }).status,
      ).toBe(1);

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
      expect(result.stderr).toContain(
        "no common ancestor; upstream merge refused",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });

    it("refuses ancestry inspection errors without attempting a merge", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");

      const result = runScript(
        work,
        ["--merge", "--expected-upstream", target],
        {
          UPSTREAM_SYNC_TEST_FAIL_INSPECTION: "1",
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("cannot inspect upstream ancestry");
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
      expect(revParse(work, "HEAD")).toBe(before);
    });

    it("reports a non-conflict merge failure without suggesting conflict resolution", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");
      const result = runScript(
        work,
        ["--merge", "--expected-upstream", target],
        {
          UPSTREAM_SYNC_TEST_FAIL_MERGE: "1",
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("merge failed without unmerged entries");
      expect(result.stderr).not.toContain("merge conflicts remain");
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(revParse(work, "HEAD")).toBe(before);
    });

    it("merges a second upstream advance then no-ops a repeat", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const forkHead = revParse(work, "HEAD");
      const upstreamFirst = net.prepareFetchedUpstream(work, upstreamBare);

      const first = runScript(work, [
        "--merge",
        "--expected-upstream",
        upstreamFirst,
      ]);
      expect(first.status).toBe(0);
      expect(parentsOf(work)).toEqual([forkHead, upstreamFirst]);
      const firstMerge = revParse(work, "HEAD");
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );

      const upstreamSecond = advanceUpstream(
        upstreamBare,
        "feat: second upstream advance",
        { "upstream-second.txt": "second wave\n" },
      );
      expect(net.prepareFetchedUpstream(work, upstreamBare)).toBe(
        upstreamSecond,
      );
      const second = runScript(work, [
        "--merge",
        "--expected-upstream",
        upstreamSecond,
      ]);
      expect(second.status).toBe(0);
      expect(parentsOf(work)).toEqual([firstMerge, upstreamSecond]);
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(git(work, ["show", "HEAD:upstream-second.txt"]).stdout).toBe(
        "second wave\n",
      );
      expect(git(work, ["show", "HEAD^1:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      const secondMerge = revParse(work, "HEAD");

      const third = runScript(work, [
        "--merge",
        "--expected-upstream",
        upstreamSecond,
      ]);
      expect(third.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(secondMerge);
      expect(parentsOf(work)).toEqual([firstMerge, upstreamSecond]);
    });

    it("merges a fresh clone that has no private sync refs", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      expect(
        git(work, ["rev-parse", "--verify", "refs/sync/upstream-main"], {
          allowFail: true,
        }).status,
      ).not.toBe(0);
      expect(existsSync(path.join(gitDir(work), "upstream-sync-state"))).toBe(
        false,
      );

      const before = revParse(work, "HEAD");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)).toHaveLength(2);
      expect(parentsOf(work)[0]).toBe(before);
    });

    it("leaves MERGE_HEAD so git merge --continue can finish a conflict", () => {
      const { work, upstreamBare } = materializeNetwork("conflict");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: merge conflicts remain; recover against the issue implementation plan and retro",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(true);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(readFileSync(path.join(work, "shared.txt"), "utf8")).toContain(
        "<<<<<<<",
      );

      writeFileSync(path.join(work, "shared.txt"), "resolved\n");
      git(work, ["add", "shared.txt"]);
      const continued = spawnSync(realGit, ["merge", "--continue"], {
        cwd: work,
        encoding: "utf8",
        env: { ...baseGitEnv, GIT_EDITOR: "true" },
      });
      expect(continued.status).toBe(0);
      expect(parentsOf(work)).toEqual([
        before,
        revParse(work, "upstream/main"),
      ]);
      expect(git(work, ["show", "HEAD:shared.txt"]).stdout).toBe("resolved\n");
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });

    it("leaves MERGE_HEAD so git merge --abort restores the pre-merge HEAD", () => {
      const { work, upstreamBare } = materializeNetwork("conflict");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const before = revParse(work, "HEAD");
      const beforeTree = revParse(work, "HEAD^{tree}");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(true);

      git(work, ["merge", "--abort"]);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(revParse(work, "HEAD^{tree}")).toBe(beforeTree);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(readFileSync(path.join(work, "shared.txt"), "utf8")).toBe(
        "fork side\n",
      );
    });
  });

  describe("transport and preflight", () => {
    const repositories = {
      origin: "Jopqior/gotgenes-pi-packages",
      upstream: "gotgenes/pi-packages",
    };
    for (const [remote, repository] of Object.entries(repositories)) {
      for (const url of [
        `git@github.com:${repository}`,
        `git@github.com:${repository}.git`,
        `https://github.com/${repository}`,
        `https://github.com/${repository}.git`,
      ]) {
        it(`preserves supported ${remote} URL ${url}`, () => {
          const { work, upstreamBare } = materializeNetwork("divergent");
          const target = net.prepareFetchedUpstream(work, upstreamBare);
          git(work, ["remote", "set-url", remote, url]);
          expect(
            runScript(work, ["--merge", "--expected-upstream", target]).status,
          ).toBe(0);
          expect(git(work, ["remote", "get-url", remote]).stdout.trim()).toBe(
            url,
          );
        });
      }
      for (const url of [
        `https://evil.example/${repository}.git`,
        `https://github.com/${repository}.git/extra`,
        `https://github.com/${repository}.git?query`,
        `https://github.com/${repository}.git#fragment`,
        `https://user@github.com/${repository}.git`,
        `https://github.com/prefix/${repository}.git`,
        `/tmp/${repository}.git`,
        `git@alias:${repository}.git`,
        `git@github.com:${repository}.git/extra`,
        `git@github.com:${repository}.git?query`,
        `git@github.com:${repository}.git#fragment`,
        `https://github.com/${repository}.git/`,
        `ssh://git@github.com/${repository}.git`,
        `git@github.com:${repository.toUpperCase()}.git`,
        remote === "origin"
          ? githubUpstream
          : "git@github.com:Jopqior/gotgenes-pi-packages.git",
      ]) {
        it(`rejects unsupported ${remote} URL ${url} before writes`, () => {
          const { work, upstreamBare } = materializeNetwork("divergent");
          const target = net.prepareFetchedUpstream(work, upstreamBare);
          git(work, ["remote", "set-url", remote, url]);
          const result = runScript(work, [
            "--merge",
            "--expected-upstream",
            target,
          ]);
          expect(result.status).toBe(1);
          expect(result.stderr).toContain(
            remote === "origin"
              ? `origin is not Jopqior/gotgenes-pi-packages (got ${url})`
              : `unsupported upstream remote URL: ${url}`,
          );
          expect(recordedFetches()).toEqual([]);
          expect(
            recordedInvocations().filter(({ args }) => args[0] === "config"),
          ).toEqual([]);
          expect(git(work, ["remote", "get-url", remote]).stdout.trim()).toBe(
            url,
          );
        });
      }
    }

    it.each(["ssh", "https"])(
      "creates a missing upstream only with explicit %s",
      (protocol) => {
        const { work } = materializeNetwork("divergent");
        git(work, ["remote", "remove", "upstream"]);
        expect(
          runScript(work, ["--fetch", "--upstream-protocol", protocol]).status,
        ).toBe(0);
        expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
          protocol === "ssh"
            ? githubUpstream
            : "https://github.com/gotgenes/pi-packages.git",
        );
      },
    );

    it.each(["ssh", "https"])(
      "merges after an explicit %s choice for a missing upstream",
      (protocol) => {
        const { work, upstreamBare } = materializeNetwork("divergent");
        const target = net.prepareFetchedUpstream(work, upstreamBare);
        git(work, ["remote", "remove", "upstream"]);
        net.prepareFetchedUpstream(work, upstreamBare);
        expect(
          runScript(work, [
            "--merge",
            "--expected-upstream",
            target,
            "--upstream-protocol",
            protocol,
          ]).status,
        ).toBe(0);
        expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
          protocol === "ssh"
            ? githubUpstream
            : "https://github.com/gotgenes/pi-packages.git",
        );
        expect(parentsOf(work)).toHaveLength(2);
      },
    );

    it.each(["--fetch", "--merge"])(
      "does not choose a protocol for a missing upstream: %s",
      (mode) => {
        const { work, upstreamBare } = materializeNetwork("divergent");
        const target = net.prepareFetchedUpstream(work, upstreamBare);
        git(work, ["remote", "remove", "upstream"]);
        const result = runScript(work, [
          mode,
          ...(mode === "--merge" ? ["--expected-upstream", target] : []),
        ]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "missing upstream remote; choose --upstream-protocol",
        );
        expect(recordedFetches()).toEqual([]);
        expect(
          recordedInvocations().filter(
            ({ args: call }) => call[0] === "config",
          ),
        ).toEqual([]);
        expect(git(work, ["remote"]).stdout.trim()).toBe("origin");
      },
    );

    it("refuses a protocol conflicting with the existing URL without rewriting it", () => {
      const { work } = materializeNetwork("divergent");
      const result = runScript(work, [
        "--fetch",
        "--upstream-protocol",
        "https",
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "selected protocol conflicts with existing upstream URL",
      );
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
      expect(recordedFetches()).toEqual([]);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "config"),
      ).toEqual([]);
    });

    it.each([
      ["--upstream-protocol"],
      ["--upstream-protocol", "ftp"],
      ["--fork-level", "none"],
      ["--rationale", "orphan"],
      ["--merge", "--record-fork-sync", "HEAD"],
      ["--record-fork-sync", ""],
      ["--merge", "--merge"],
      ["--record-fork-sync", "HEAD", "--fork-level", "invalid"],
      ["--expected-upstream"],
      ["--expected-upstream", "f".repeat(40)],
      ["--record-fork-sync", "HEAD", "--expected-upstream", "f".repeat(40)],
      ["--merge", "--expected-upstream", "f".repeat(39)],
      ["--merge", "--expected-upstream", "f".repeat(41)],
      ["--merge", "--expected-upstream", "f".repeat(64)],
      ["--merge", "--expected-upstream", "z".repeat(40)],
      [
        "--merge",
        "--expected-upstream",
        "f".repeat(40),
        "--expected-upstream",
        "f".repeat(40),
      ],
    ])("rejects invalid options before writes: %j", (...args) => {
      const { work } = materializeNetwork("divergent");
      expect(runScript(work, args).status).toBe(1);
      expect(recordedFetches()).toEqual([]);
      expect(
        recordedInvocations().filter(({ args: call }) => call[0] === "config"),
      ).toEqual([]);
    });

    for (const args of [["--merge"], ["--record-fork-sync", "HEAD"]]) {
      it(`checks local preconditions before setup and fetch in ${args[0]}`, () => {
        const { work, upstreamBare } = materializeNetwork("divergent");
        const target = net.prepareFetchedUpstream(work, upstreamBare);
        git(work, ["remote", "remove", "upstream"]);
        writeFiles(work, { "unrelated.txt": "dirty\n" });
        const result = runScript(work, [
          ...args,
          ...(args[0] === "--merge" ? ["--expected-upstream", target] : []),
          "--upstream-protocol",
          "ssh",
        ]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "index or tracked worktree is not clean",
        );
        expect(recordedFetches()).toEqual([]);
        expect(git(work, ["remote"]).stdout.trim()).toBe("origin");
        expect(
          recordedInvocations().filter(
            ({ args: call }) => call[0] === "config",
          ),
        ).toEqual([]);
      });
    }
  });

  describe("guards", () => {
    const expectNoNetworkWrites = () => {
      expect(recordedFetches()).toEqual([]);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "config"),
      ).toEqual([]);
    };

    it("accepts an existing SSH upstream remote", () => {
      const { work } = materializeNetwork("divergent");
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
    });

    it("refuses a different upstream repository before fetching", () => {
      const { work } = materializeNetwork("divergent");
      git(work, [
        "remote",
        "set-url",
        "upstream",
        "git@github.com:example/other.git",
      ]);

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "unsupported upstream remote URL: git@github.com:example/other.git",
      );
      expect(recordedFetches()).toEqual([]);
    });

    it("refuses a non-main branch without merging", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, ["checkout", "-b", "feature"]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: current branch is feature, not main",
      );
      expectNoNetworkWrites();
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "feature",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses a non-fork origin without merging", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, [
        "remote",
        "set-url",
        "origin",
        "https://github.com/example/not-the-fork.git",
      ]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: origin is not Jopqior/gotgenes-pi-packages (got https://github.com/example/not-the-fork.git)",
      );
      expectNoNetworkWrites();
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an unrelated dirty worktree that git merge would otherwise accept", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      writeFileSync(path.join(work, "unrelated.txt"), "dirty worktree\n");
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expectNoNetworkWrites();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: index or tracked worktree is not clean",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(readFileSync(path.join(work, "unrelated.txt"), "utf8")).toBe(
        "dirty worktree\n",
      );
      expect(git(work, ["diff", "--", "unrelated.txt"]).stdout).toContain(
        "dirty worktree",
      );
    });

    it("refuses an unrelated dirty index with the script diagnostic", () => {
      // Measured on git 2.53.0: merge itself also refuses every staged
      // unrelated-path variant probed. This pin is the script-owned
      // diagnostic plus unchanged HEAD/index, not Git accepting the merge.
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      writeFileSync(path.join(work, "unrelated.txt"), "dirty index\n");
      git(work, ["add", "unrelated.txt"]);
      const before = revParse(work, "HEAD");
      const cachedBefore = git(work, ["diff", "--cached"]).stdout;

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expectNoNetworkWrites();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: index or tracked worktree is not clean",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(git(work, ["diff", "--cached"]).stdout).toBe(cachedBefore);
      expect(git(work, ["diff", "--cached", "--name-only"]).stdout.trim()).toBe(
        "unrelated.txt",
      );
    });

    it("refuses an in-progress merge without mutating MERGE_HEAD", () => {
      const { work, upstreamBare } = materializeNetwork("empty-upstream");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, [
        "merge",
        "--no-commit",
        "--no-ff",
        "-m",
        "wip",
        "upstream/main",
      ]);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        mergeHead: readGitStateFile(work, "MERGE_HEAD"),
        mergeMode: readGitStateFile(work, "MERGE_MODE"),
      };

      const beforeInvocations = recordedInvocations().length;
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a merge is already in progress");
      expect(
        recordedInvocations()
          .slice(beforeInvocations)
          .filter(({ args }) => ["config", "fetch"].includes(args[0])),
      ).toEqual([]);
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(readGitStateFile(work, "MERGE_HEAD")).toBe(before.mergeHead);
      expect(readGitStateFile(work, "MERGE_MODE")).toBe(before.mergeMode);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase without clearing rebase-apply", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      writeFiles(work, { "am.txt": "v1\n" });
      git(work, ["add", "am.txt"]);
      git(work, ["commit", "-m", "test: am base"]);
      const patch = git(work, ["format-patch", "-1", "--stdout"]).stdout;
      const patchPath = path.join(net.scratch, "am.patch");
      writeFileSync(patchPath, patch);
      git(work, ["reset", "--hard", "HEAD~1"]);
      writeFiles(work, { "am.txt": "v3\n" });
      git(work, ["add", "am.txt"]);
      git(work, ["commit", "-m", "test: am blocker"]);
      const am = spawnSync(realGit, ["am", patchPath], {
        cwd: work,
        encoding: "utf8",
        env: baseGitEnv,
      });
      expect(am.status).not.toBe(0);
      expect(existsSync(path.join(gitDir(work), "rebase-apply"))).toBe(true);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "main",
      );
      expect(git(work, ["diff", "--quiet"], { allowFail: true }).status).toBe(
        0,
      );
      expect(
        git(work, ["diff", "--cached", "--quiet"], { allowFail: true }).status,
      ).toBe(0);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        rebaseApply: snapshotDir(path.join(gitDir(work), "rebase-apply")),
      };

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(snapshotDir(path.join(gitDir(work), "rebase-apply"))).toEqual(
        before.rebaseApply,
      );
      expectNoNetworkWrites();
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase-merge without clearing rebase-merge", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const editor = path.join(net.scratch, "rebase-editor.sh");
      writeFileSync(editor, "#!/bin/sh\nprintf 'break\\n' > \"$1\"\n");
      chmodSync(editor, 0o755);
      spawnSync(realGit, ["rebase", "-i", "HEAD~1"], {
        cwd: work,
        encoding: "utf8",
        env: {
          ...baseGitEnv,
          GIT_SEQUENCE_EDITOR: editor,
          GIT_EDITOR: "true",
        },
      });
      expect(existsSync(path.join(gitDir(work), "rebase-merge"))).toBe(true);
      git(work, ["update-ref", "refs/heads/main", "HEAD"]);
      git(work, ["symbolic-ref", "HEAD", "refs/heads/main"]);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "main",
      );
      expect(git(work, ["diff", "--quiet"], { allowFail: true }).status).toBe(
        0,
      );
      expect(
        git(work, ["diff", "--cached", "--quiet"], { allowFail: true }).status,
      ).toBe(0);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        parents: parentsOf(work),
        rebaseMerge: snapshotDir(path.join(gitDir(work), "rebase-merge")),
      };

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(parentsOf(work)).toEqual(before.parents);
      expect(snapshotDir(path.join(gitDir(work), "rebase-merge"))).toEqual(
        before.rebaseMerge,
      );
      expectNoNetworkWrites();
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });
  });

  describe("local pinned input", () => {
    it("refuses a missing local commit rather than fetching it", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = revParse(upstreamBare, "refs/heads/main");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream commit ${target} is not available locally`,
      );
      expect(result.stderr).toContain("--fetch");
      expect(recordedFetches()).toEqual([]);
    });

    it("refuses a missing tracking ref without refreshing it", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, ["update-ref", "-d", "refs/remotes/upstream/main"]);
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "upstream/main is not available locally; run ./scripts/upstream-sync.sh --fetch",
      );
      expect(recordedFetches()).toEqual([]);
    });

    it("refuses a local target outside fetched upstream history", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      net.prepareFetchedUpstream(work, upstreamBare);
      const target = revParse(work, "HEAD");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream ${target} is not contained in local upstream/main`,
      );
      expect(result.stderr).toContain(
        "fetch and replan if upstream history changed",
      );
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "merge", "ls-remote"].includes(args[0]),
        ),
      ).toEqual([]);
    });

    it("refuses a full object OID that is not a commit", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      net.prepareFetchedUpstream(work, upstreamBare);
      const target = revParse(work, "HEAD^{tree}");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream commit ${target} is not available locally`,
      );
      expect(recordedFetches()).toEqual([]);
    });

    it("keeps merge offline and local tags byte-identical", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, ["tag", "protected"]);
      const tags = git(work, [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ]).stdout;
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(0);
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "ls-remote"].includes(args[0]),
        ),
      ).toEqual([]);
      expect(
        git(work, [
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ]).stdout,
      ).toBe(tags);
      expect(result.stdout).not.toContain("ahead/behind");
      expect(result.stdout).not.toContain("newest upstream");
    });

    it.each(["--merge", "--record-fork-sync"])(
      "refuses a linked worktree on main in %s",
      (mode) => {
        const { work, upstreamBare } = materializeNetwork("divergent");
        const target = net.prepareFetchedUpstream(work, upstreamBare);
        git(work, ["checkout", "-b", "primary-parked"]);
        const linked = path.join(net.scratch, "linked");
        git(work, ["worktree", "add", linked, "main"]);
        const before = revParse(linked, "HEAD");
        const result = runScript(
          linked,
          mode === "--merge"
            ? [mode, "--expected-upstream", target]
            : [mode, "HEAD", "--fork-level", "none", "--rationale", "reviewed"],
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "upstream integration requires the primary checkout, not a linked worktree",
        );
        expect(revParse(linked, "HEAD")).toBe(before);
        expect(
          recordedInvocations().filter(({ args }) =>
            ["config", "fetch", "merge", "ls-remote"].includes(args[0]),
          ),
        ).toEqual([]);
      },
    );
  });

  describe("inspected upstream input", () => {
    it("merges the fresh target rather than a cached upstream/main under a custom fetch refspec", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const forkHead = revParse(work, "HEAD");
      const indexBefore = indexTree(work);
      const actual = revParse(upstreamBare, "refs/heads/main");
      git(work, [
        "config",
        "remote.upstream.fetch",
        "+refs/heads/main:refs/remotes/other/main",
      ]);
      git(work, [
        "update-ref",
        "refs/remotes/upstream/main",
        revParse(work, "HEAD~1"),
      ]);

      const target = net.prepareFetchedUpstream(work, upstreamBare);
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)).toEqual([forkHead, actual]);
      expect(revParse(work, "upstream/main")).toBe(actual);
      expect(indexTree(work)).not.toBe(indexBefore);
    });

    it("merges the approved ancestor after an explicit newer fetch under a custom refspec", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const stale = revParse(upstreamBare, "refs/heads/main");
      git(work, ["fetch", "--no-tags", upstreamBare, "main"]);
      expect(revParse(work, "FETCH_HEAD")).toBe(stale);
      const actual = advanceUpstream(upstreamBare, "feat: a newer main", {
        "new-upstream.txt": "new upstream content\n",
      });
      const forkHead = revParse(work, "HEAD");
      const indexBefore = indexTree(work);
      const worktreeBefore = git(work, ["status", "--porcelain=v1"]).stdout;
      git(work, [
        "config",
        "remote.upstream.fetch",
        "+refs/heads/main:refs/remotes/other/main",
      ]);
      git(work, ["update-ref", "refs/remotes/upstream/main", stale]);
      expect(stale).not.toBe(actual);
      expect(net.prepareFetchedUpstream(work, upstreamBare)).toBe(actual);

      const result = runScript(work, ["--merge", "--expected-upstream", stale]);

      expect(result.status).toBe(0);
      expect(revParse(work, "upstream/main")).toBe(actual);
      expect(parentsOf(work)).toEqual([forkHead, stale]);
      expect(indexTree(work)).not.toBe(indexBefore);
      expect(git(work, ["status", "--porcelain=v1"]).stdout).toBe(
        worktreeBefore,
      );
      expect(existsSync(path.join(work, "new-upstream.txt"))).toBe(false);
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "ls-remote"].includes(args[0]),
        ),
      ).toEqual([]);
    });

    it("merges the unchanged, explicitly inspected target by its resolved OID", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      expect(target).toBe(revParse(upstreamBare, "refs/heads/main"));

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)[1]).toBe(target);
      expect(
        recordedInvocations()
          .map(({ args }) => args)
          .filter((args) => args[0] === "merge"),
      ).toEqual([["merge", "--no-ff", "-m", mergeMessage, target]]);
    });

    it("does not discover or integrate a newer remote tip during merge", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      expect(runScript(work, ["--fetch"]).status).toBe(0);
      const inspected = revParse(work, "upstream/main");
      const before = revParse(work, "HEAD");
      const moved = advanceUpstream(upstreamBare, "feat: upstream moved", {
        "upstream-moved.txt": "new input\n",
      });
      expect(moved).not.toBe(inspected);

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        inspected,
      ]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)).toEqual([before, inspected]);
      expect(revParse(work, "upstream/main")).toBe(inspected);
      expect(recordedFetches()).toHaveLength(1);
      expect(result.stdout).not.toContain("newest upstream");
      expect(result.stdout).not.toContain("ahead/behind");
    });
  });

  describe("fetch protections", () => {
    it("records an explicit fetch --no-tags of upstream main", () => {
      const { work } = materializeNetwork("divergent");

      runScript(work, ["--fetch"]);

      const fetches = recordedFetches();
      expect(fetches.length).toBeGreaterThan(0);
      expect(
        fetches.some(
          (args) =>
            args[0] === "fetch" &&
            args.includes("--no-tags") &&
            args.includes("upstream") &&
            args.includes("+refs/heads/main:refs/remotes/upstream/main"),
        ),
      ).toBe(true);
    });

    it("refuses when the local tag set changes during fetch", () => {
      const { work } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");
      const tagsBefore = git(work, ["tag"]).stdout;

      const result = runScript(work, ["--fetch"], {
        UPSTREAM_SYNC_TEST_INJECT_TAG: "imported-collision-v1.0.0",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: local tag ref/object mapping changed during fetch",
      );
      expect(result.stderr).toContain(
        "added: refs/tags/imported-collision-v1.0.0",
      );
      expect(result.stderr).toContain(
        "stop for operator approval before any tag recovery",
      );
      expect(result.stderr).not.toContain("git tag -d");
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(git(work, ["tag"]).stdout).toContain("imported-collision-v1.0.0");
      expect(tagsBefore).not.toContain("imported-collision-v1.0.0");
    });

    it.each([{ args: ["--fetch"] }])(
      "refuses same-name tag retargeting in mode $args",
      ({ args }) => {
        const { work } = materializeNetwork("divergent");
        git(work, ["tag", "protected", "HEAD"]);
        const before = revParse(work, "HEAD");
        const tagBefore = revParse(work, "refs/tags/protected");

        const result = runScript(work, args, {
          UPSTREAM_SYNC_TEST_INJECT_TAG: "protected",
          UPSTREAM_SYNC_TEST_TAG_ACTION: "retarget",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("retargeted: refs/tags/protected");
        expect(result.stderr).toContain(
          "stop for operator approval before any tag recovery",
        );
        expect(revParse(work, "refs/tags/protected")).not.toBe(tagBefore);
        expect(revParse(work, "HEAD")).toBe(before);
      },
    );

    it.each([{ args: ["--fetch"] }])(
      "refuses tag deletion in mode $args",
      ({ args }) => {
        const { work } = materializeNetwork("divergent");
        git(work, ["tag", "protected", "HEAD"]);
        const before = revParse(work, "HEAD");
        const result = runScript(work, args, {
          UPSTREAM_SYNC_TEST_INJECT_TAG: "protected",
          UPSTREAM_SYNC_TEST_TAG_ACTION: "delete",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("removed: refs/tags/protected");
        expect(result.stderr).toContain(
          "stop for operator approval before any tag recovery",
        );
        expect(git(work, ["tag", "--list", "protected"]).stdout.trim()).toBe(
          "",
        );
        expect(revParse(work, "HEAD")).toBe(before);
      },
    );

    it("reports tag drift even if fetch fails after changing refs", () => {
      const { work } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--fetch"], {
        UPSTREAM_SYNC_TEST_INJECT_TAG: "imported-on-failed-fetch",
        UPSTREAM_SYNC_TEST_FAIL_FETCH_AFTER_TAG: "1",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "added: refs/tags/imported-on-failed-fetch",
      );
      expect(result.stderr).toContain(
        "stop for operator approval before any tag recovery",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
    });

    it("does not import colliding upstream tag names", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const forkOid = revParse(work, "HEAD");
      const upstreamV1 = revParse(
        upstreamBare,
        "refs/tags/pi-subagents-v1.0.0",
      );
      expect(forkOid).not.toBe(upstreamV1);
      git(work, ["tag", "pi-subagents-v1.0.0", forkOid]);
      const localTagObject = revParse(work, "refs/tags/pi-subagents-v1.0.0");
      expect(localTagObject).toBe(forkOid);

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "refs/tags/pi-subagents-v1.0.0")).toBe(
        localTagObject,
      );
      expect(
        git(work, ["rev-parse", "--verify", "refs/tags/pi-subagents-v21.7.0"], {
          allowFail: true,
        }).status,
      ).not.toBe(0);
      expect(git(work, ["tag"]).stdout.trim()).toBe("pi-subagents-v1.0.0");
      expect(result.stdout).toContain("tag count unchanged (1)");
    });

    it("sets remote.upstream.pushurl to DISABLE", () => {
      const { work } = materializeNetwork("divergent");

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(
        git(work, ["config", "--get", "remote.upstream.pushurl"]).stdout.trim(),
      ).toBe("DISABLE");
      expect(
        git(work, ["config", "--get", "remote.upstream.tagOpt"]).stdout.trim(),
      ).toBe("--no-tags");
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
    });

    it("prints the newest upstream pi-subagents tag from ls-remote", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const peeled = revParse(upstreamBare, "refs/tags/pi-subagents-v21.7.0");

      const result = runScript(work, ["--fetch"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        `newest upstream pi-subagents tag: pi-subagents-v21.7.0 (${peeled})`,
      );
      const lsRemote = recordedInvocations()
        .map((entry) => entry.args)
        .filter((args) => args[0] === "ls-remote");
      expect(lsRemote.length).toBeGreaterThan(0);
      expect(
        lsRemote.some(
          (args) =>
            args.includes("--tags") &&
            args.includes("upstream") &&
            args.includes("pi-subagents-v*"),
        ),
      ).toBe(true);
    });
  });
});
