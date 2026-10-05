import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decideForkRelease } from "../../scripts/release/fork-sync/decision.mjs";
import {
  isAncestorOf,
  isPackageScopePath,
  packageCommitsBetween,
} from "../../scripts/release/fork-sync/evidence.mjs";
import { recordForkSync } from "../../scripts/release/fork-sync/record.mjs";
import {
  readForkSyncState,
  validateForkSyncState,
} from "../../scripts/release/fork-sync/state.mjs";
import { forkSyncTarget } from "../../scripts/release/pi-subagents/config.mjs";
import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

const oid = "a".repeat(40);
const release = { version: "21.7.0", commit: oid };
const contribution = {
  level: "patch",
  rationale: "Reviewed resolution unchanged",
  paths: ["packages/alternate/src/index.ts"],
};
const validState = () => ({
  schemaVersion: 2,
  releases: [
    { forkTag: "alternate-v1.4.0", upstream: release, upstreamTip: oid },
  ],
  syncs: [
    {
      merge: "b".repeat(40),
      upstream: release,
      forkContribution: contribution,
    },
  ],
});

/** @type {ReturnType<typeof createScratchReleaseRepository> | undefined} */
let repo;
/** @type {string | undefined} */
let temporaryStateDir;
afterEach(() => {
  repo?.dispose();
  repo = undefined;
  if (temporaryStateDir)
    rmSync(temporaryStateDir, { recursive: true, force: true });
  temporaryStateDir = undefined;
});

describe("shared fork synchronization boundary", () => {
  describe("configured target", () => {
    it("names only the supported package and its artifact location", () => {
      expect(forkSyncTarget).toEqual({
        directory: "pi-subagents",
        statePath: "scripts/release/pi-subagents/sync-state.json",
        correspondencePath:
          "docs/upstream/pi-subagents-release-correspondence.md",
      });
      expect(Object.isFrozen(forkSyncTarget)).toBe(true);
    });
  });

  describe("explicit package scope", () => {
    it("selects an alternate directory rather than the registered target", () => {
      expect(
        isPackageScopePath("packages/alternate/src/index.ts", "alternate"),
      ).toBe(true);
      expect(
        isPackageScopePath("packages/pi-subagents/src/index.ts", "alternate"),
      ).toBe(false);
      expect(
        isPackageScopePath("packages/alternate/CHANGELOG.md", "alternate"),
      ).toBe(false);
      expect(
        isPackageScopePath(
          "packages/alternate/docs/plans/next.md",
          "alternate",
        ),
      ).toBe(false);
    });
  });

  describe("strict versioned evidence", () => {
    it("validates a complete schema 2 state with the selected directory", () => {
      expect(validateForkSyncState(validState(), "alternate")).toEqual(
        validState(),
      );
      expect(() => validateForkSyncState(validState(), "pi-subagents")).toThrow(
        /forkTag/,
      );
    });

    it("reads from an explicit state path", () => {
      temporaryStateDir = mkdtempSync(path.join(tmpdir(), "fork-sync-state-"));
      const statePath = path.join(temporaryStateDir, "nested", "state.json");
      mkdirSync(path.dirname(statePath), { recursive: true });
      writeFileSync(statePath, `${JSON.stringify(validState())}\n`);
      expect(readForkSyncState(statePath, "alternate")).toEqual(validState());
      expect(JSON.parse(readFileSync(statePath, "utf8"))).toEqual(validState());
    });

    it("rejects schema 1 rather than silently upgrading it", () => {
      expect(() =>
        validateForkSyncState(
          { ...validState(), schemaVersion: 1 },
          "alternate",
        ),
      ).toThrow(/schema version.*expected 2/);
    });

    it("rejects mixed legacy and new fields and unknown fields", () => {
      const state = validState();
      expect(() =>
        validateForkSyncState(
          { ...state, syncs: [{ ...state.syncs[0], forkCore: contribution }] },
          "alternate",
        ),
      ).toThrow(/unknown syncs\[0\] field 'forkCore'/);
      expect(() =>
        validateForkSyncState(
          { ...state, syncs: [{ ...state.syncs[0], extra: true }] },
          "alternate",
        ),
      ).toThrow(/unknown syncs\[0\] field 'extra'/);
      expect(() =>
        validateForkSyncState(
          {
            ...state,
            syncs: [
              {
                merge: state.syncs[0].merge,
                upstream: release,
                forkCore: contribution,
              },
            ],
          },
          "alternate",
        ),
      ).toThrow(/unknown syncs\[0\] field 'forkCore'/);
    });
  });

  describe("explicit-directory recorder", () => {
    it("records schema 2 evidence for an alternate directory without adding tags", () => {
      repo = createScratchReleaseRepository({ pkg: "alternate" });
      repo.writeManifest("alternate", "21.7.0");
      repo.git("add", "packages/alternate/package.json");
      repo.git("commit", "-m", "chore(alternate): upstream baseline");
      const baseline = repo.gitOut("rev-parse", "HEAD");
      repo.git("tag", "alternate-v1.4.0");
      repo.git("checkout", "-b", "upstream-side");
      repo.writeManifest("alternate", "21.7.1");
      repo.git("add", "packages/alternate/package.json");
      repo.git("commit", "-m", "chore(alternate): upstream patch release");
      const upstream = repo.gitOut("rev-parse", "HEAD");
      repo.git("tag", "alternate-v21.7.1");
      repo.git("checkout", "main");
      repo.git(
        "merge",
        "--no-ff",
        "-m",
        "chore: merge upstream",
        "upstream-side",
      );
      const merge = repo.gitOut("rev-parse", "HEAD");
      repo.git("update-ref", "refs/remotes/upstream/main", upstream);
      repo.git("remote", "add", "upstream", repo.dir);
      const statePath = path.join(repo.dir, "state.json");
      writeFileSync(
        statePath,
        `${JSON.stringify({
          schemaVersion: 2,
          releases: [
            {
              forkTag: "alternate-v1.4.0",
              upstream: { version: "21.7.0", commit: baseline },
              upstreamTip: baseline,
            },
          ],
          syncs: [],
        })}\n`,
      );
      const tagsBefore = repo.gitOut(
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      );

      recordForkSync(repo.dir, statePath, "alternate", {
        merge,
        forkLevel: "none",
        rationale: "upstream-only integration",
      });

      expect(readForkSyncState(statePath, "alternate").syncs).toEqual([
        {
          merge,
          upstream: { version: "21.7.1", commit: upstream },
          forkContribution: {
            level: "none",
            rationale: "upstream-only integration",
            paths: [],
          },
        },
      ]);
      expect(
        repo.gitOut(
          "for-each-ref",
          "--format=%(refname) %(objectname)",
          "refs/tags",
        ),
      ).toBe(tagsBefore);
    });

    describe("evidence validation boundaries", () => {
      let statePath;
      let baseline;
      let upstreamRelease;
      let forkParent;

      beforeEach(() => {
        repo = createScratchReleaseRepository({ pkg: "alternate" });
        repo.writeManifest("alternate", "21.7.0");
        repo.git("add", "packages/alternate/package.json");
        repo.git("commit", "-m", "chore(alternate): upstream baseline");
        baseline = repo.gitOut("rev-parse", "HEAD");
        repo.git("checkout", "-b", "upstream-side");
        repo.writeManifest("alternate", "21.7.1");
        repo.git("add", "packages/alternate/package.json");
        repo.git("commit", "-m", "chore(alternate): upstream patch release");
        upstreamRelease = repo.gitOut("rev-parse", "HEAD");
        repo.git("tag", "alternate-v21.7.1");
        repo.git("update-ref", "refs/remotes/upstream/main", upstreamRelease);
        repo.git("remote", "add", "upstream", repo.dir);
        repo.git("checkout", "main");
        repo.commitOutOfScope("docs: previously incorporated tip");
        forkParent = repo.gitOut("rev-parse", "HEAD");
        repo.git("tag", "alternate-v1.4.0");
        statePath = path.join(repo.dir, "state.json");
        writeFileSync(
          statePath,
          `${JSON.stringify({
            schemaVersion: 2,
            releases: [
              {
                forkTag: "alternate-v1.4.0",
                upstream: { version: "21.7.0", commit: baseline },
                upstreamTip: baseline,
              },
            ],
            syncs: [],
          })}\n`,
        );
      });

      it("rejects a one-parent commit with the genuine two-parent diagnostic without changing state bytes", () => {
        expect(
          repo.gitOut("rev-list", "--parents", "-n", "1", forkParent),
        ).toBe(`${forkParent} ${baseline}`);
        const stateBefore = readFileSync(statePath);

        expect(() =>
          recordForkSync(repo.dir, statePath, "alternate", {
            merge: forkParent,
            forkLevel: "none",
            rationale: "upstream-only integration",
          }),
        ).toThrow(
          `merge ${forkParent} has 1 parents; a fork sync is a genuine two-parent merge`,
        );

        expect(readFileSync(statePath)).toEqual(stateBefore);
      });

      it("rejects a genuine merge outside HEAD with the containment diagnostic without changing state bytes", () => {
        repo.git("checkout", "-b", "uncontained-integration");
        repo.git(
          "merge",
          "--no-ff",
          "-m",
          "chore: merge upstream",
          "upstream-side",
        );
        const merge = repo.gitOut("rev-parse", "HEAD");
        repo.git("checkout", "main");
        expect(repo.gitOut("rev-list", "--parents", "-n", "1", merge)).toBe(
          `${merge} ${forkParent} ${upstreamRelease}`,
        );
        expect(isAncestorOf(repo.dir, merge, "HEAD")).toBe(false);
        const stateBefore = readFileSync(statePath);

        expect(() =>
          recordForkSync(repo.dir, statePath, "alternate", {
            merge,
            forkLevel: "none",
            rationale: "upstream-only integration",
          }),
        ).toThrow(
          `merge ${merge} is not an ancestor of HEAD; complete and commit the merge before recording it`,
        );

        expect(readFileSync(statePath)).toEqual(stateBefore);
      });

      it("rejects discontinuous upstream history before its unreleased package tail without changing state bytes", () => {
        repo.git("checkout", "upstream-side");
        repo.commitInScope(
          "feat(alternate): unreleased upstream change",
          "packages/alternate/src/unreleased.ts",
        );
        const upstreamTip = repo.gitOut("rev-parse", "HEAD");
        repo.git("update-ref", "refs/remotes/upstream/main", upstreamTip);
        repo.git("checkout", "main");
        repo.git(
          "merge",
          "--no-ff",
          "-m",
          "chore: merge upstream",
          "upstream-side",
        );
        const merge = repo.gitOut("rev-parse", "HEAD");
        const state = readForkSyncState(statePath, "alternate");
        state.releases[0].upstreamTip = forkParent;
        writeFileSync(statePath, `${JSON.stringify(state)}\n`);
        expect(
          JSON.parse(
            repo.gitOut(
              "show",
              `${upstreamRelease}:packages/alternate/package.json`,
            ),
          ),
        ).toEqual({ name: "@fixture/alternate", version: "21.7.1" });
        expect(isAncestorOf(repo.dir, upstreamRelease, upstreamTip)).toBe(true);
        expect(isAncestorOf(repo.dir, forkParent, upstreamTip)).toBe(false);
        expect(
          packageCommitsBetween(
            repo.dir,
            upstreamRelease,
            upstreamTip,
            "alternate",
          ),
        ).toEqual([upstreamTip]);
        const stateBefore = readFileSync(statePath);

        expect(() =>
          recordForkSync(repo.dir, statePath, "alternate", {
            merge,
            forkLevel: "none",
            rationale: "upstream-only integration",
          }),
        ).toThrow(
          `merge ${merge}'s upstream history does not descend from the previously incorporated tip ${forkParent}`,
        );

        expect(readFileSync(statePath)).toEqual(stateBefore);
      });
    });
  });

  describe("independent fork version decision", () => {
    it("increments the fork tag, not the upstream version, for a scoped fork fix", () => {
      repo = createScratchReleaseRepository({ pkg: "alternate" });
      repo.writeManifest("alternate", "21.7.0");
      repo.git("add", "packages/alternate/package.json");
      repo.git("commit", "-m", "chore(alternate): upstream release");
      const upstreamCommit = repo.gitOut("rev-parse", "HEAD");
      repo.git("tag", "alternate-v1.4.0");
      repo.commitInScope(
        "fix(alternate): fork-only fix",
        "packages/alternate/src/fix.ts",
      );
      const statePath = path.join(repo.dir, "state.json");
      writeFileSync(
        statePath,
        `${JSON.stringify({
          schemaVersion: 2,
          releases: [
            {
              forkTag: "alternate-v1.4.0",
              upstream: { version: "21.7.0", commit: upstreamCommit },
              upstreamTip: upstreamCommit,
            },
          ],
          syncs: [],
        })}\n`,
      );
      expect(
        decideForkRelease({
          repo: repo.dir,
          statePath,
          packageDirectory: "alternate",
          currentTag: "alternate-v1.4.0",
          cliffArgs: repo.cliffArgs("alternate"),
        }),
      ).toEqual({
        currentTag: "alternate-v1.4.0",
        nextTag: "alternate-v1.4.1",
        upstream: { version: "21.7.0", commit: upstreamCommit },
        upstreamTip: upstreamCommit,
        upstreamLevel: "none",
        forkLevel: "patch",
      });
    });
  });
});
