import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { selectIncorporatedUpstreamRelease } from "../../scripts/release/fork-sync/upstream-release.mjs";
import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

let repo;
let remote;
let baseline;
let upstreamRelease;
let forkParent;
const directory = "alternate";
const noContainedRelease =
  "no stable upstream package release is contained in the merge's upstream parent. " +
  "If required objects are missing locally, run scripts/upstream-sync.sh --fetch — never an ad-hoc tag fetch.";

beforeEach(() => {
  repo = createScratchReleaseRepository({ pkg: directory });
  baseline = commitRelease("21.7.0");
  repo.git("tag", "alternate-v21.7.0");
  repo.git("checkout", "-b", "upstream-side");
  upstreamRelease = commitRelease("21.7.1");
  repo.git("tag", "alternate-v21.7.1");
  repo.git("remote", "add", "upstream", repo.dir);
  repo.git("checkout", "main");
  repo.commitInScope("docs: fork marker", "fork-marker.txt");
  forkParent = repo.gitOut("rev-parse", "HEAD");
});

afterEach(() => {
  repo?.dispose();
  remote?.dispose();
  repo = undefined;
  remote = undefined;
});

function commitRelease(version) {
  repo.writeManifest(directory, version);
  repo.git("add", "packages/alternate/package.json");
  repo.git("commit", "-m", `chore(alternate): release ${version}`);
  return repo.gitOut("rev-parse", "HEAD");
}

function integrate() {
  const upstreamTip = repo.gitOut("rev-parse", "upstream-side");
  repo.git("update-ref", "refs/remotes/upstream/main", upstreamTip);
  repo.git("checkout", "main");
  repo.git("merge", "--no-ff", "-m", "chore: merge upstream", "upstream-side");
  return repo.gitOut("rev-parse", "HEAD");
}

describe("incorporated upstream release selection", () => {
  describe("contained stable releases", () => {
    it("returns the full evidence value from a lightweight tag without changing refs or checkout bytes", () => {
      repo.git("checkout", "upstream-side");
      repo.commitInScope("docs: upstream marker", "upstream-marker.txt");
      const upstreamTip = repo.gitOut("rev-parse", "HEAD");
      const merge = integrate();
      const refs = repo.gitOut("show-ref");
      const manifestPath = path.join(
        repo.dir,
        "packages/alternate/package.json",
      );
      const manifest = readFileSync(manifestPath);
      const status = repo.gitOut("status", "--porcelain");

      expect(
        selectIncorporatedUpstreamRelease(repo.dir, directory, "HEAD"),
      ).toEqual({
        merge,
        forkParent,
        upstreamTip,
        upstream: { version: "21.7.1", commit: upstreamRelease },
      });
      expect(repo.gitOut("show-ref")).toBe(refs);
      expect(repo.gitOut("status", "--porcelain")).toBe(status);
      expect(readFileSync(manifestPath)).toEqual(manifest);
    });

    it("returns the peeled commit rather than the annotated tag object", () => {
      repo.git(
        "tag",
        "-f",
        "-a",
        "alternate-v21.7.1",
        upstreamRelease,
        "-m",
        "upstream release",
      );
      const tagObject = repo.gitOut("rev-parse", "alternate-v21.7.1");
      expect(tagObject).not.toBe(upstreamRelease);
      expect(
        repo.gitOut("ls-remote", "--tags", "upstream", "alternate-v21.7.1*"),
      ).toBe(
        `${tagObject}\trefs/tags/alternate-v21.7.1\n${upstreamRelease}\trefs/tags/alternate-v21.7.1^{}`,
      );
      const merge = integrate();

      expect(
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toEqual({
        merge,
        forkParent,
        upstreamTip: upstreamRelease,
        upstream: { version: "21.7.1", commit: upstreamRelease },
      });
    });

    it("chooses the highest contained version numerically, not the highest advertised uncontained release", () => {
      repo.git("checkout", "upstream-side");
      const highestContained = commitRelease("21.10.0");
      repo.git("tag", "alternate-v21.10.0");
      const upstreamTip = commitRelease("21.9.0");
      repo.git("tag", "alternate-v21.9.0");
      const merge = integrate();
      repo.git("checkout", "-b", "newer-upstream", "upstream-side");
      const newer = commitRelease("30.0.0");
      repo.git("tag", "alternate-v30.0.0");
      repo.git("update-ref", "refs/remotes/upstream/main", newer);
      repo.git("checkout", "main");

      expect(
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toEqual({
        merge,
        forkParent,
        upstreamTip,
        upstream: { version: "21.10.0", commit: highestContained },
      });
    });

    it("excludes a higher contained prerelease even with a matching manifest", () => {
      repo.git("checkout", "upstream-side");
      const upstreamTip = commitRelease("30.0.0-rc.1");
      repo.git("tag", "alternate-v30.0.0-rc.1");
      const merge = integrate();

      expect(
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toEqual({
        merge,
        forkParent,
        upstreamTip,
        upstream: { version: "21.7.1", commit: upstreamRelease },
      });
    });
  });

  describe("missing release objects", () => {
    beforeEach(() => {
      remote = createScratchReleaseRepository({ pkg: directory });
      remote.commitInScope("chore: separate remote history", "remote.txt");
      remote.git("tag", "alternate-v99.0.0");
      repo.git("remote", "set-url", "upstream", remote.dir);
      expect(
        repo.gitOut("ls-remote", "--tags", "upstream", "alternate-v*"),
      ).toBe(
        `${remote.gitOut("rev-parse", "HEAD")}\trefs/tags/alternate-v99.0.0`,
      );
    });

    it("rejects when no advertised stable release object is locally available without importing tags", () => {
      const merge = integrate();
      const refs = repo.gitOut("show-ref");

      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toThrow(noContainedRelease);
      expect(repo.gitOut("show-ref")).toBe(refs);
    });

    it("skips a missing newer object when an older contained release is advertised", () => {
      // The remote needs the real object; use its alternates only inside this disposable fixture.
      writeFileSync(
        path.join(remote.dir, ".git/objects/info/alternates"),
        `${repo.dir}/.git/objects\n`,
      );
      remote.git("update-ref", "refs/tags/alternate-v21.7.1", upstreamRelease);
      const merge = integrate();

      expect(
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toEqual({
        merge,
        forkParent,
        upstreamTip: upstreamRelease,
        upstream: { version: "21.7.1", commit: upstreamRelease },
      });
    });
  });

  describe("release manifest validation", () => {
    it("rejects a selected tag whose manifest claims another version rather than falling back", () => {
      repo.git("tag", "alternate-v21.8.0", upstreamRelease);
      const merge = integrate();

      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toThrow(
        'upstream release tag 21.8.0 points at a manifest claiming "21.7.1"',
      );
    });

    it.each([
      ["missing", undefined, "has no packages/alternate/package.json"],
      ["malformed", "{", "has a malformed package manifest"],
    ])(
      "rejects a %s manifest at the selected release",
      (_kind, bytes, diagnostic) => {
        repo.git("checkout", "upstream-side");
        if (bytes === undefined) {
          repo.git("rm", "packages/alternate/package.json");
        } else {
          writeFileSync(
            path.join(repo.dir, "packages/alternate/package.json"),
            bytes,
          );
          repo.git("add", "packages/alternate/package.json");
        }
        repo.git("commit", "-m", "chore: invalid release manifest");
        const commit = repo.gitOut("rev-parse", "HEAD");
        repo.git("tag", "-f", "alternate-v21.7.1");
        const merge = integrate();

        expect(() =>
          selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
        ).toThrow(`upstream release 21.7.1 (${commit}) ${diagnostic}`);
      },
    );
  });

  describe("merge evidence validation", () => {
    it("rejects an unresolved merge input", () => {
      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, "absent-merge"),
      ).toThrow(`cannot resolve merge 'absent-merge' in ${repo.dir}`);
    });

    it.each([
      ["root", 0],
      ["one-parent", 1],
    ])("rejects %s topology", (kind, parents) => {
      const merge = kind === "root" ? baseline : forkParent;

      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toThrow(
        `merge ${merge} has ${parents} parents; a fork sync is a genuine two-parent merge`,
      );
    });

    it("rejects a genuine merge not contained in HEAD", () => {
      const merge = integrate();
      repo.git("checkout", "-b", "unmerged-head", forkParent);

      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toThrow(
        `merge ${merge} is not an ancestor of HEAD; complete and commit the merge before recording it`,
      );
    });

    it("rejects an upstream parent outside local upstream/main before release lookup", () => {
      const merge = integrate();
      repo.git("update-ref", "refs/remotes/upstream/main", baseline);
      repo.git("remote", "remove", "upstream");

      expect(() =>
        selectIncorporatedUpstreamRelease(repo.dir, directory, merge),
      ).toThrow(
        `merge ${merge}'s upstream parent ${upstreamRelease} is not contained in upstream/main`,
      );
    });
  });
});
