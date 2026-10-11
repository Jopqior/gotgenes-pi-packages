import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUpstreamNetwork } from "./helpers/upstream-network.mjs";

let net;
let materializeNetwork;
let runScript;
let git;
let revParse;
let parentsOf;
let gitDir;
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
    recordedFetches,
    recordedInvocations,
  } = net);
});
afterEach(() => net.dispose());

describe("fork-sync fetch", () => {
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
    it("fetches repository status without a package tag query", () => {
      const { work, upstreamBare } = materializeNetwork("divergent");

      const headBefore = revParse(work, "HEAD");
      const tagsBefore = git(work, [
        "for-each-ref",
        "--sort=refname",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ]).stdout;
      const result = runScript(work, ["--fetch"]);
      expect(result.status).toBe(0);
      expect(
        recordedInvocations()
          .map(({ args }) => args)
          .filter((args) => ["ls-remote", "push"].includes(args[0])),
      ).toEqual([]);
      expect(
        git(work, ["config", "--get", "remote.upstream.tagOpt"]).stdout.trim(),
      ).toBe("--no-tags");
      expect(
        git(work, ["config", "--get", "remote.upstream.pushurl"]).stdout.trim(),
      ).toBe("DISABLE");
      expect(result.stdout).toContain(
        `upstream target: ${revParse(upstreamBare, "main")}`,
      );
      expect(recordedFetches()).toEqual([
        [
          "fetch",
          "--no-tags",
          "upstream",
          "+refs/heads/main:refs/remotes/upstream/main",
        ],
      ]);
      expect(revParse(work, "HEAD")).toBe(headBefore);
      expect(
        git(work, [
          "for-each-ref",
          "--sort=refname",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ]).stdout,
      ).toBe(tagsBefore);
    });

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
  });

  describe("fetch protections", () => {
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

    it.each([
      { action: "add", diagnostic: "added" },
      { action: "retarget", diagnostic: "retargeted" },
      { action: "delete", diagnostic: "removed" },
    ])(
      "reports $action tag drift even if fetch fails after changing refs",
      ({ action, diagnostic }) => {
        const { work } = materializeNetwork("divergent");
        const before = revParse(work, "HEAD");
        const tag = "protected-on-failed-fetch";
        if (action !== "add") git(work, ["tag", tag, "HEAD"]);
        const result = runScript(work, ["--fetch"], {
          UPSTREAM_SYNC_TEST_INJECT_TAG: tag,
          UPSTREAM_SYNC_TEST_TAG_ACTION: action,
          UPSTREAM_SYNC_TEST_FAIL_FETCH_AFTER_TAG: "1",
        });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(`${diagnostic}: refs/tags/${tag}`);
        expect(result.stderr).toContain(
          "stop for operator approval before any tag recovery",
        );
        expect(revParse(work, "HEAD")).toBe(before);
        const remaining = git(
          work,
          ["rev-parse", "--verify", `refs/tags/${tag}`],
          { allowFail: true },
        );
        if (action === "delete") expect(remaining.status).not.toBe(0);
        else
          expect(remaining.stdout.trim()).toBe(
            action === "add" ? before : revParse(work, "upstream/main"),
          );
        expect(
          recordedInvocations().filter(({ args }) =>
            ["merge", "push"].includes(args[0]),
          ),
        ).toEqual([]);
      },
    );

    it("reports failed fetch without drift and leaves HEAD and tag objects unchanged", () => {
      const { work } = materializeNetwork("divergent");
      git(work, ["tag", "protected"]);
      const before = revParse(work, "HEAD");
      const tags = git(work, [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ]).stdout;
      const result = runScript(work, ["--fetch"], {
        UPSTREAM_SYNC_TEST_FAIL_FETCH_AFTER_TAG: "1",
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "upstream fetch failed; inspect Git output and tag refs before retrying",
      );
      expect(result.stderr).not.toContain(
        "local tag ref/object mapping changed",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(
        git(work, [
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ]).stdout,
      ).toBe(tags);
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
  });
});
