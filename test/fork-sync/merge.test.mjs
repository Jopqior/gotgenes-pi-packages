import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  baseGitEnv,
  createUpstreamNetwork,
  mergeMessage,
  realGit,
} from "./helpers/upstream-network.mjs";

let net;
let materializeNetwork;
let materializeLocalHistory;
let runScript;
let git;
let revParse;
let parentsOf;
let gitDir;
let indexTree;
let advanceUpstream;
let recordedFetches;
let recordedInvocations;
beforeEach(() => {
  net = createUpstreamNetwork();
  ({
    materializeNetwork,
    materializeLocalHistory,
    runScript,
    git,
    revParse,
    parentsOf,
    gitDir,
    indexTree,
    advanceUpstream,
    recordedFetches,
    recordedInvocations,
  } = net);
});
afterEach(() => net.dispose());

describe("fork-sync merge", () => {
  describe("--merge", () => {
    it("creates a two-parent merge with first-parent fork content", () => {
      const { work, target: upstreamMain } =
        materializeLocalHistory("divergent");
      const before = revParse(work, "HEAD");

      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        upstreamMain,
      ]);

      expect(result.status).toBe(0);
      const parents = parentsOf(work);
      expect(parents).toEqual([before, upstreamMain]);
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([
        { args: ["merge", "--no-ff", "-m", mergeMessage, upstreamMain] },
      ]);
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "ls-remote", "push"].includes(args[0]),
        ),
      ).toEqual([]);
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
      const { work, target } = materializeLocalHistory("already-integrated");
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
      expect(result.stdout).not.toContain("merge complete:");
      expect(
        recordedInvocations().filter(({ args }) => args[0] === "merge"),
      ).toEqual([]);
    });

    it("refuses a fast-forward-only integration without changing HEAD", () => {
      const { work, target } = materializeLocalHistory("fast-forward");
      const before = revParse(work, "HEAD");
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
      expect(result.stdout).not.toContain("merge complete:");
    });

    it("refuses unrelated histories before invoking merge", () => {
      const { work, target } = materializeLocalHistory("unrelated");
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
      const { work, target } = materializeLocalHistory("divergent");
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
      const { work, target } = materializeLocalHistory("divergent");
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

    it("leaves MERGE_HEAD so git merge --continue can finish a conflict", () => {
      const { work, target } = materializeLocalHistory("conflict");
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
  });

  describe("inspected upstream input", () => {
    it("merges the approved ancestor after an explicit newer fetch under a custom refspec", () => {
      const { work, upstreamBare } = materializeNetwork();
      expect(runScript(work, ["--fetch"]).status).toBe(0);
      const stale = revParse(work, "upstream/main");
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
      expect(stale).not.toBe(actual);
      expect(runScript(work, ["--fetch"]).status).toBe(0);
      expect(revParse(work, "upstream/main")).toBe(actual);
      const beforeMerge = recordedInvocations().length;

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
        recordedInvocations()
          .slice(beforeMerge)
          .filter(({ args }) =>
            ["fetch", "ls-remote", "push"].includes(args[0]),
          ),
      ).toEqual([]);
    });

    it("does not discover or integrate a newer remote tip during merge", () => {
      const { work, upstreamBare } = materializeNetwork();
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
});
