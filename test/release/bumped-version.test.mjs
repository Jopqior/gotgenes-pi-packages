import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const libShPath = path.join(repoRoot, "scripts", "release", "lib.sh");
const cliffTomlPath = path.join(repoRoot, "cliff.toml");
const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

let scratchRepo;

/**
 * Run a git command inside the scratch repo.
 *
 * @param {string[]} args
 */
function git(...args) {
  execFileSync("git", args, { cwd: scratchRepo, env: gitEnv });
}

/**
 * Create an in-scope commit touching `packages/demo/`.
 *
 * @param {string} message a Conventional Commits subject
 * @param {string} file the file to create, relative to the scratch repo
 */
function commitInScope(message, file) {
  const filePath = path.join(scratchRepo, file);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${message}\n`);
  git("add", ".");
  git("commit", "-m", message);
}

/**
 * Create an out-of-scope commit the demo package's path filters never match.
 *
 * @param {string} message a Conventional Commits subject
 */
function commitOutOfScope(message) {
  commitInScope(message, path.join("docs", "retro", "note.md"));
}

/**
 * Spawn a bash that sources `lib.sh`, scopes `cliff_args` to the demo
 * package, and prints `bumped_version`'s output. The scratch repo is the cwd,
 * so `cliff_args`' relative path globs resolve against it.
 *
 * @param {string} tag the package's latest release tag
 * @returns {string} stdout of the helper
 */
function bumpedVersion(tag) {
  try {
    return execFileSync(
      "bash",
      ["-c", `. '${libShPath}'; cliff_args demo; bumped_version ${tag}`],
      { cwd: scratchRepo, encoding: "utf8", env: gitEnv },
    );
  } catch (error) {
    // Fail loudly rather than skipping: CI installs git-cliff, so a local
    // failure here means this checkout cannot run the release scripts' own
    // derivation and must not report green without the pin.
    throw new Error(
      `bumped_version failed — is git-cliff installed and on PATH?\n${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`,
    );
  }
}

/**
 * Run a git command inside the scratch repo and return its stripped stdout.
 *
 * @param {...string} args
 * @returns {string}
 */
function gitOut(...args) {
  return execFileSync("git", args, {
    cwd: scratchRepo,
    encoding: "utf8",
    env: gitEnv,
  }).trim();
}

/**
 * Build the merged-history fixture shared by the merge-boundary tests: a root
 * config commit, a fork commit, an upstream branch whose breaking change
 * predates the release, a real two-parent merge of that branch, and an
 * out-of-scope release marker commit ready to be tagged by the caller.
 *
 * This is the restored-repository shape: upstream changes arrive through real
 * merges, and a release tag can sit on a commit whose changes are outside the
 * package's path scope (the natural end of a docs-only publish).
 */
function mergedUpstreamHistory() {
  commitInScope("build: fixture config", "cliff-config-marker.txt");
  commitInScope("fix(demo): initial fork work", "packages/demo/fork.txt");
  git("checkout", "-b", "upstream-side");
  commitInScope("feat(demo)!: old upstream break", "packages/demo/old.txt");
  git("checkout", "main");
  git("merge", "--no-ff", "-m", "chore: merge upstream", "upstream-side");
  commitOutOfScope("docs: release marker");
}

/**
 * Commit `message` on a new upstream branch and merge it into main with a real
 * two-parent merge, returning the merged upstream tip's commit OID.
 *
 * @param {string} message a Conventional Commits subject
 * @param {string} file the file to create, relative to the scratch repo
 * @returns {string} the merged upstream tip's commit OID
 */
function mergeNewUpstream(message, file) {
  git("checkout", "-b", "upstream-new");
  commitInScope(message, file);
  const tip = gitOut("rev-parse", "HEAD");
  git("checkout", "main");
  git("merge", "--no-ff", "-m", "chore: merge upstream again", "upstream-new");
  return tip;
}

/**
 * Spawn a bash that sources `lib.sh`, scopes `cliff_args` to the demo
 * package, and runs a git-cliff rendering invocation with the flags a release
 * script passes. `prepare-release.sh` renders the section it splices into a
 * changelog with `--tag <tag> --unreleased --strip header`, and
 * `create-github-releases.sh` renders the notes for the tag at HEAD with
 * `--latest --strip header`; passing the flags through verbatim exercises the
 * scripts' real invocation shapes rather than a convenient approximation.
 *
 * @param {...string} flags the literal flags the release script passes
 * @returns {string} stdout of git-cliff
 */
function renderReleaseSection(...flags) {
  const invocation =
    ". '" +
    libShPath +
    // biome-ignore lint/suspicious/noTemplateCurlyInString: "${CLIFF_ARGS[@]}" is bash array expansion inside the command handed to `bash -c`, not a JS template placeholder — lib.sh owns the array.
    '\'; cliff_args demo; git-cliff "${CLIFF_ARGS[@]}" ' +
    flags.join(" ");
  try {
    return execFileSync("bash", ["-c", invocation], {
      cwd: scratchRepo,
      encoding: "utf8",
      env: gitEnv,
    });
  } catch (error) {
    throw new Error(
      `git-cliff rendering failed — is git-cliff installed and on PATH?\n${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`,
    );
  }
}

beforeEach(() => {
  scratchRepo = mkdtempSync(path.join(tmpdir(), "bumped-version-"));
  copyFileSync(cliffTomlPath, path.join(scratchRepo, "cliff.toml"));
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
});

afterEach(() => {
  rmSync(scratchRepo, { recursive: true, force: true });
});

describe("bumped_version", () => {
  // No range-shape mutation kills the current-version pin below: measured
  // against git-cliff 2.14.1, every degraded range (dropped lower bound,
  // empty walk, bare HEAD) still prints the current version for a repo whose
  // tag sits on an in-scope commit. The pin holds the next == current contract
  // `next-version.sh`'s "Nothing to release" path depends on, not a range
  // regression.
  it("ignores a tag on an out-of-scope commit and bumps from the tagged release", () => {
    commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    commitOutOfScope("docs(retro): first publish notes");
    git("tag", "demo-v1.0.0");
    commitInScope("fix(demo): repair widget", "packages/demo/a.txt");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });

  it("prints the current version when nothing has landed since an annotated tag", () => {
    commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.0\n");
  });

  it("bumps minor for a feature after the tag", () => {
    commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");
    commitInScope("feat(demo): add widget", "packages/demo/b.txt");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.1.0\n");
  });
});

describe("bumped_version across an upstream merge boundary", () => {
  it("prints the tagged version when nothing lands after a merge-spanning out-of-scope tag", () => {
    mergedUpstreamHistory();
    git("tag", "demo-v1.0.0");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.0\n");
  });

  it("bumps patch for a fork fix when an old upstream break was merged before the tag", () => {
    mergedUpstreamHistory();
    git("tag", "demo-v1.0.0");
    commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });

  it("bumps major for a genuinely new upstream breaking commit merged after the tag", () => {
    mergedUpstreamHistory();
    git("tag", "demo-v1.0.0");
    commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    const upstreamTip = mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );

    // A real second parent, not a rebased fast-forward: the newly merged
    // upstream change must arrive as merge ancestry for this class to mean
    // "merged after the tag".
    expect(gitOut("rev-parse", "HEAD^2")).toBe(upstreamTip);

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v2.0.0\n");
  });

  it("bounds the same merged-history walk at an annotated tag", () => {
    mergedUpstreamHistory();
    git("tag", "-a", "demo-v1.0.0", "-m", "demo v1.0.0");
    commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");

    expect(bumpedVersion("demo-v1.0.0")).toBe("demo-v1.0.1\n");
  });
});

describe("release rendering across an upstream merge boundary", () => {
  // Both scripts render after next-version.sh has derived the tag, which for
  // this fixture is demo-v2.0.0: the breaking upstream merge dominates the
  // fork fix. The rendered section embeds commit SHAs and a release date, so
  // the assertions match stable substrings rather than the whole output.
  it("renders only post-tag changes in the prepare-release unreleased section", () => {
    mergedUpstreamHistory();
    git("tag", "demo-v1.0.0");
    commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );

    const section = renderReleaseSection(
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
    mergedUpstreamHistory();
    git("tag", "demo-v1.0.0");
    commitInScope("fix(demo): fresh fork fix", "packages/demo/new.txt");
    mergeNewUpstream(
      "feat(demo)!: new upstream break",
      "packages/demo/newer.txt",
    );
    git("tag", "-a", "demo-v2.0.0", "-m", "Release demo-v2.0.0");

    const section = renderReleaseSection("--latest", "--strip", "header");

    expect(section).toContain("compare/demo-v1.0.0...demo-v2.0.0");
    expect(section).toContain("new upstream break");
    expect(section).toContain("fresh fork fix");
    expect(section).not.toContain("old upstream break");
  });
});
