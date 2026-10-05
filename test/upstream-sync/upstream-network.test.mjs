import { spawnSync } from "node:child_process";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  baseGitEnv,
  createUpstreamNetwork,
  realGit,
} from "./helpers/upstream-network.mjs";

/** @type {ReturnType<typeof createUpstreamNetwork> | undefined} */
let net;
afterEach(() => net?.dispose());

describe("upstream network record-query fault injection", () => {
  it.each([
    ["default core", undefined, "pi-subagents-v*", "pi-subagents-worktrees-v*"],
    [
      "selected worktrees",
      "pi-subagents-worktrees-v*",
      "pi-subagents-worktrees-v*",
      "pi-subagents-v*",
    ],
  ])(
    "retargets a local tag only for the %s query",
    (_label, selected, query, otherQuery) => {
      net = createUpstreamNetwork(selected);
      const { work, upstreamBare } = net.materializeNetwork("divergent");
      net.git(upstreamBare, ["tag", "pi-subagents-worktrees-v0.3.3", "main"]);
      const upstreamTip = net.revParse(work, "HEAD");
      net.git(work, ["update-ref", "refs/remotes/upstream/main", upstreamTip]);
      net.commit(work, "docs: local tag target", { "marker.txt": "local\n" });
      const forkTip = net.revParse(work, "HEAD");
      const protectedTag = "protected-fork-release";
      net.git(work, ["tag", protectedTag]);
      const snapshot = () =>
        net.git(work, [
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ]).stdout;
      const before = snapshot();
      expect(before).toBe(`refs/tags/${protectedTag} ${forkTip}\n`);

      const queryTags = (pattern) =>
        spawnSync(
          path.join(net.scratch, "bin", "git"),
          ["ls-remote", "--tags", "upstream", pattern],
          {
            cwd: work,
            encoding: "utf8",
            env: {
              ...baseGitEnv,
              UPSTREAM_SYNC_TEST_REAL_GIT: realGit,
              UPSTREAM_SYNC_TEST_GIT_LOG: path.join(
                net.scratch,
                "git-args.jsonl",
              ),
              UPSTREAM_SYNC_TEST_UPSTREAM_BARE: upstreamBare,
              UPSTREAM_SYNC_TEST_TAG_TRIGGER: "record",
              UPSTREAM_SYNC_TEST_INJECT_TAG: protectedTag,
              UPSTREAM_SYNC_TEST_TAG_ACTION: "retarget",
            },
          },
        );
      const other = queryTags(otherQuery);
      expect(other.status).toBe(0);
      expect(snapshot()).toBe(before);

      const result = queryTags(query);
      expect(result.status).toBe(0);
      // Remote OIDs vary with the disposable history; require actual tag output.
      expect(result.stdout).toContain(query.replace("*", ""));
      expect(snapshot()).toBe(`refs/tags/${protectedTag} ${upstreamTip}\n`);
      expect(net.recordedInvocations()).toEqual([
        { args: ["ls-remote", "--tags", "upstream", otherQuery] },
        { args: ["ls-remote", "--tags", "upstream", query] },
      ]);
    },
  );
});
