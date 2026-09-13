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

let scratchRepo;

/**
 * Run a git command inside the scratch repo.
 *
 * @param {string[]} args
 */
function git(...args) {
  execFileSync("git", args, { cwd: scratchRepo });
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
      { cwd: scratchRepo, encoding: "utf8" },
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
