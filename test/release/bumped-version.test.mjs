import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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

describe("entry-point parity", () => {
  // `next-version.sh` and `verify-cliff-parity.sh` must answer "what would
  // this package release?" through the same decision entry, so the two
  // scripts are exercised as real processes against the same fixture history
  // and their answers compared. The scripts cd to their own root, so the
  // fixture runs its own copies against its own packages/demo.
  function prepareParityFixture() {
    repo.copyReleaseScripts(
      "lib.sh",
      "next-version.sh",
      "verify-cliff-parity.sh",
    );
    repo.writeManifest("demo", "1.0.0");
    repo.commitInScope("feat(demo)!: initial scope", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
  }

  it("derives the same patch tag in the predictor and the parity check", () => {
    prepareParityFixture();
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");

    const prediction = repo.runReleaseScript("next-version.sh", "demo");
    const parity = repo.runReleaseScript("verify-cliff-parity.sh");

    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("demo-v1.0.1\n");
    expect(parity.status).toBe(0);
    expect(parity.stdout).toContain("would release 1.0.1");
  });

  it("reports the same empty window in the predictor and the parity check", () => {
    prepareParityFixture();

    const prediction = repo.runReleaseScript("next-version.sh", "demo");
    const parity = repo.runReleaseScript("verify-cliff-parity.sh");

    expect(prediction.status).toBe(0);
    expect(prediction.stdout).toBe("");
    expect(prediction.stderr).toContain(
      "Nothing to release for 'demo' (at demo-v1.0.0)",
    );
    expect(parity.status).toBe(0);
    expect(parity.stdout).toContain("ok    1.0.0 (nothing to release)");
  });

  it("propagates a failing git-cliff invocation in both entry points", () => {
    prepareParityFixture();
    repo.commitInScope("fix(demo): repair widget", "packages/demo/a.txt");
    const failingBin = mkdtempSync(path.join(tmpdir(), "failing-cliff-"));
    const cliffStub = path.join(failingBin, "git-cliff");
    writeFileSync(cliffStub, "#!/bin/sh\nexit 1\n");
    chmodSync(cliffStub, 0o755);
    const stubEnv = {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      PATH: `${failingBin}${path.delimiter}${process.env.PATH}`,
    };
    try {
      const prediction = spawnSync(
        "bash",
        [path.join(repo.dir, "scripts", "release", "next-version.sh"), "demo"],
        { cwd: repo.dir, encoding: "utf8", env: stubEnv, stdio: "pipe" },
      );
      const parity = spawnSync(
        "bash",
        [path.join(repo.dir, "scripts", "release", "verify-cliff-parity.sh")],
        { cwd: repo.dir, encoding: "utf8", env: stubEnv, stdio: "pipe" },
      );

      expect(prediction.status).not.toBe(0);
      expect(parity.status).toBe(1);
      expect(parity.stdout).toContain(
        "FAIL  git-cliff could not derive a version",
      );
    } finally {
      rmSync(failingBin, { recursive: true, force: true });
    }
  });
});
