import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  baseGitEnv,
  createUpstreamNetwork,
  githubUpstream,
  realGit,
  refuseHint,
} from "./helpers/upstream-network.mjs";

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
    recordedFetches,
    recordedInvocations,
  } = net);
});
afterEach(() => net.dispose());

describe("fork-sync safety", () => {
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
      ["--merge", "--merge"],
      ["--expected-upstream"],
      ["--expected-upstream", "f".repeat(40)],
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

    for (const args of [["--merge"]]) {
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
        "upstream/main is not available locally; run ./scripts/fork-sync/sync.sh --fetch",
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
          ["fetch", "ls-remote", "push"].includes(args[0]),
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

    it.each(["--merge"])("refuses a linked worktree on main in %s", (mode) => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const target = net.prepareFetchedUpstream(work, upstreamBare);
      git(work, ["checkout", "-b", "primary-parked"]);
      const linked = path.join(net.scratch, "linked");
      git(work, ["worktree", "add", linked, "main"]);
      const before = revParse(linked, "HEAD");
      const result = runScript(linked, [mode, "--expected-upstream", target]);
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
    });
  });
});
