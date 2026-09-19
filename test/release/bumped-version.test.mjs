import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

/** @type {ReturnType<typeof createScratchReleaseRepository>} */
let repo;

beforeEach(() => {
  repo = createScratchReleaseRepository();
});

afterEach(() => {
  repo.dispose();
});

describe("bumped_version", () => {
  // No range-shape mutation kills the current-version pin below: measured
  // against git-cliff 2.14.1, every degraded range (dropped lower bound,
  // empty walk, bare HEAD) still prints the current version for a repo whose
  // tag sits on an in-scope commit. The pin holds the next == current contract
  // `next-version.sh`'s "Nothing to release" path depends on, not a range
  // regression.
  it("ignores a tag on an out-of-scope commit and bumps from the tagged release", () => {
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.commitOutOfScope("docs(retro): first publish notes");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });

  it("prints the current version when nothing has landed since an annotated tag", () => {
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.0\n");
  });

  it("bumps minor for a feature after the tag", () => {
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");
    repo.commitInScope("feat(demo): add widget", "packages/demo/b.txt");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.1.0\n");
  });
});

describe("bumped_version across an upstream merge boundary", () => {
  it("prints the tagged version when nothing lands after a merge-spanning out-of-scope tag", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "demo-v1.0.0");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.0\n");
  });

  it("bumps patch for a fork fix when an old upstream break was merged before the tag", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });

  it("bumps major for a genuinely new upstream breaking commit merged after the tag", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    const upstreamTip = repo.mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );

    // A real second parent, not a rebased fast-forward: the newly merged
    // upstream change must arrive as merge ancestry for this class to mean
    // "merged after the tag".
    expect(repo.gitOut("rev-parse", "HEAD^2")).toBe(upstreamTip);

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v2.0.0\n");
  });

  it("bounds the same merged-history walk at an annotated tag", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");
    repo.commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");

    expect(repo.bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });
});

describe("release rendering across an upstream merge boundary", () => {
  // Both scripts render after next-version.sh has derived the tag, which for
  // this fixture is demo-v2.0.0: the breaking upstream merge dominates the
  // fork fix. The rendered section embeds commit SHAs and a release date, so
  // the assertions match stable substrings rather than the whole output.
  it("renders only post-tag changes in the prepare-release unreleased section", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    repo.mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );

    const section = repo.renderReleaseSection(
      "--tag",
      "demo-v2.0.0",
      "--unreleased",
      "--strip",
      "header",
    );

    expect(section).toContain("compare/demo-v1.0.0...demo-v2.0.0");
    expect(section).toContain("new upstream break");
    expect(section).toContain("fresh fork fix");
    expect(section).not.toContain("old upstream break");
  });

  it("renders the tag at HEAD in the create-github-releases latest section", () => {
    repo.mergedUpstreamHistory();
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    repo.mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );
    repo.git("tag", "-a", "demo-v2.0.0", "-m", "Release demo-v2.0.0");

    const section = repo.renderReleaseSection("--latest", "--strip", "header");

    expect(section).toContain("compare/demo-v1.0.0...demo-v2.0.0");
    expect(section).toContain("new upstream break");
    expect(section).toContain("fresh fork fix");
    expect(section).not.toContain("old upstream break");
  });
});
