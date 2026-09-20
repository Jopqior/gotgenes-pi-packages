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
  describe("status", () => {
    it("fetches without changing HEAD", () => {
      const { work } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");

      const result = runScript(work, []);

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
      const upstreamMain = revParse(upstreamBare, "refs/heads/main");

      const result = runScript(work, ["--merge"]);

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
      const { work } = materializeNetwork("already-integrated");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });

    it("merges a second upstream advance then no-ops a repeat", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");
      const forkHead = revParse(work, "HEAD");
      const upstreamFirst = revParse(upstreamBare, "refs/heads/main");

      const first = runScript(work, ["--merge"]);
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
      const second = runScript(work, ["--merge"]);
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

      const third = runScript(work, ["--merge"]);
      expect(third.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(secondMerge);
      expect(parentsOf(work)).toEqual([firstMerge, upstreamSecond]);
    });

    it("merges a fresh clone that has no private sync refs", () => {
      const { work } = materializeNetwork("divergent");
      expect(
        git(work, ["rev-parse", "--verify", "refs/sync/upstream-main"], {
          allowFail: true,
        }).status,
      ).not.toBe(0);
      expect(existsSync(path.join(gitDir(work), "upstream-sync-state"))).toBe(
        false,
      );

      const before = revParse(work, "HEAD");
      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)).toHaveLength(2);
      expect(parentsOf(work)[0]).toBe(before);
    });

    it("leaves MERGE_HEAD so git merge --continue can finish a conflict", () => {
      const { work } = materializeNetwork("conflict");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: merge conflicts remain; see docs/upstream-sync.md",
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
      const { work } = materializeNetwork("conflict");
      const before = revParse(work, "HEAD");
      const beforeTree = revParse(work, "HEAD^{tree}");

      const result = runScript(work, ["--merge"]);

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

  describe("guards", () => {
    it("accepts an existing SSH upstream remote", () => {
      const { work } = materializeNetwork("divergent");
      git(work, ["remote", "add", "upstream", githubUpstream]);

      const result = runScript(work, []);

      expect(result.status).toBe(0);
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
    });

    it("refuses a different upstream repository before fetching", () => {
      const { work } = materializeNetwork("divergent");
      git(work, [
        "remote",
        "add",
        "upstream",
        "git@github.com:example/other.git",
      ]);

      const result = runScript(work, []);

      expect(result.status).toBe(1);
      expect(recordedFetches()).toEqual([]);
    });

    it("refuses a non-main branch without merging", () => {
      const { work } = materializeNetwork("divergent");
      git(work, ["checkout", "-b", "feature"]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: current branch is feature, not main",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "feature",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses a non-fork origin without merging", () => {
      const { work } = materializeNetwork("divergent");
      git(work, [
        "remote",
        "set-url",
        "origin",
        "https://github.com/example/not-the-fork.git",
      ]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: origin is not Jopqior/gotgenes-pi-packages (got https://github.com/example/not-the-fork.git)",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an unrelated dirty worktree that git merge would otherwise accept", () => {
      const { work } = materializeNetwork("divergent");
      writeFileSync(path.join(work, "unrelated.txt"), "dirty worktree\n");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

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
      const { work } = materializeNetwork("divergent");
      writeFileSync(path.join(work, "unrelated.txt"), "dirty index\n");
      git(work, ["add", "unrelated.txt"]);
      const before = revParse(work, "HEAD");
      const cachedBefore = git(work, ["diff", "--cached"]).stdout;

      const result = runScript(work, ["--merge"]);

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
      const { work } = materializeNetwork("empty-upstream");
      const fetched = runScript(work, []);
      expect(fetched.status).toBe(0);
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

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a merge is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(readGitStateFile(work, "MERGE_HEAD")).toBe(before.mergeHead);
      expect(readGitStateFile(work, "MERGE_MODE")).toBe(before.mergeMode);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase without clearing rebase-apply", () => {
      const { work } = materializeNetwork("divergent");
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

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(snapshotDir(path.join(gitDir(work), "rebase-apply"))).toEqual(
        before.rebaseApply,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase-merge without clearing rebase-merge", () => {
      const { work } = materializeNetwork("divergent");
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

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(parentsOf(work)).toEqual(before.parents);
      expect(snapshotDir(path.join(gitDir(work), "rebase-merge"))).toEqual(
        before.rebaseMerge,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });
  });

  describe("fetch protections", () => {
    it("records an explicit fetch --no-tags of upstream main", () => {
      const { work } = materializeNetwork("divergent");

      runScript(work, []);

      const fetches = recordedFetches();
      expect(fetches.length).toBeGreaterThan(0);
      expect(
        fetches.some(
          (args) =>
            args[0] === "fetch" &&
            args.includes("--no-tags") &&
            args.includes("upstream") &&
            args.includes("main"),
        ),
      ).toBe(true);
    });

    it("refuses when the local tag set changes during fetch", () => {
      const { work } = materializeNetwork("divergent");
      const before = revParse(work, "HEAD");
      const tagsBefore = git(work, ["tag"]).stdout;

      const result = runScript(work, ["--merge"], {
        UPSTREAM_SYNC_TEST_INJECT_TAG: "imported-collision-v1.0.0",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: tag set changed during fetch; delete imported tags before merging:",
      );
      expect(result.stderr).toContain("imported-collision-v1.0.0");
      expect(result.stderr).toContain(
        "git tag -d <name> for each, then re-run",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(git(work, ["tag"]).stdout).toContain("imported-collision-v1.0.0");
      expect(tagsBefore).not.toContain("imported-collision-v1.0.0");
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

      const result = runScript(work, ["--merge"]);

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

      const result = runScript(work, []);

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

      const result = runScript(work, []);

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
