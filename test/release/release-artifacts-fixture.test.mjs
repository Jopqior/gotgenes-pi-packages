import { existsSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  createReleaseArtifacts,
  FORK,
  ORIGINAL,
} from "./helpers/release-artifacts.mjs";

const WORKTREES = {
  directory: "pi-subagents-worktrees",
  name: "@jopqior/pi-subagents-worktrees",
  kind: "fork",
  upstream: {
    name: "@gotgenes/pi-subagents-worktrees",
    repository: "gotgenes/pi-packages",
    directory: "packages/pi-subagents-worktrees",
  },
  evidence: "fork-sync",
};

/** @type {ReturnType<typeof createReleaseArtifacts> | undefined} */
let fixture;
afterEach(() => fixture?.dispose());

describe("published release artifact fixture", () => {
  it.each([
    ["default core", undefined, FORK],
    ["explicit core", FORK, FORK],
    ["selected worktrees", WORKTREES, WORKTREES],
  ])(
    "preserves the %s registration, identities, tags and state",
    (_label, selected, expected) => {
      fixture = createReleaseArtifacts(selected);
      const { repo, registry, state, first, second } = fixture;
      expect(repo.pkg).toBe(expected.directory);
      expect(registry).toEqual({
        schemaVersion: 2,
        packages: [expected, ORIGINAL],
      });
      const records = [
        ["1.0.0", "21.7.0", first],
        ["1.0.1", "21.7.1", second],
      ].map(([version, upstreamVersion, record]) => {
        const upstreamCommit = repo.gitOut(
          "rev-parse",
          `upstream-${upstreamVersion}`,
        );
        const forkTag = `${expected.directory}-v${version}`;
        expect(record).toEqual({
          forkTag,
          upstream: { version: upstreamVersion, commit: upstreamCommit },
          upstreamTip: upstreamCommit,
        });
        expect(repo.gitOut("cat-file", "-t", forkTag)).toBe("tag");
        expect(
          JSON.parse(
            repo.gitOut(
              "show",
              `${forkTag}:packages/${expected.directory}/package.json`,
            ),
          ),
        ).toEqual({
          name: expected.name,
          version,
        });
        expect(
          JSON.parse(
            repo.gitOut(
              "show",
              `${upstreamCommit}:${expected.upstream.directory}/package.json`,
            ),
          ),
        ).toEqual({
          name: expected.upstream.name,
          version: upstreamVersion,
        });
        expect(
          repo.gitOut(
            "merge-base",
            "--is-ancestor",
            upstreamCommit,
            `${forkTag}^{commit}`,
          ),
        ).toBe("");
        return record;
      });
      expect(state).toEqual({ schemaVersion: 2, releases: records, syncs: [] });
      expect(repo.gitOut("tag", "--list").split("\n")).toEqual([
        "pi-subagents-model-selector-v0.1.0",
        `${expected.directory}-v1.0.0`,
        `${expected.directory}-v1.0.1`,
      ]);
      expect(
        JSON.parse(
          repo.gitOut(
            "show",
            "HEAD:packages/pi-subagents-model-selector/package.json",
          ),
        ),
      ).toEqual({ name: ORIGINAL.name, version: "0.1.0" });
      expect(repo.gitOut("status", "--porcelain")).toBe("");
      if (selected === WORKTREES) {
        expect(
          existsSync(path.join(repo.dir, "packages", FORK.directory)),
        ).toBe(false);
      }
    },
  );
});
