import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

describe("copyReleaseScripts", () => {
  /** @type {ReturnType<typeof createScratchReleaseRepository>} */
  let repo;
  let releaseScriptSourceDir;

  beforeEach(() => {
    releaseScriptSourceDir = mkdtempSync(
      path.join(tmpdir(), "release-scripts-"),
    );
    repo = createScratchReleaseRepository({ releaseScriptSourceDir });
  });

  afterEach(() => {
    repo.dispose();
    rmSync(releaseScriptSourceDir, { recursive: true, force: true });
  });

  it("copies a root-level executable script with its bytes and mode", () => {
    const name = "prepare-release.sh";
    const source = path.join(releaseScriptSourceDir, name);
    const bytes = Buffer.from("#!/bin/sh\nprintf 'ready\\n'\n");
    writeFileSync(source, bytes);
    chmodSync(source, 0o755);

    repo.copyReleaseScripts(name);

    const destination = path.join(repo.dir, "scripts", "release", name);
    expect(readFileSync(destination)).toEqual(bytes);
    expect(statSync(destination).mode & 0o777).toBe(0o755);
  });

  it("copies a nested script into a previously absent destination directory", () => {
    const name = path.join("fork-sync", "evidence.mjs");
    const source = path.join(releaseScriptSourceDir, name);
    const bytes = Buffer.from([0, 1, 127, 255, 10]);
    mkdirSync(path.dirname(source), { recursive: true });
    writeFileSync(source, bytes);

    repo.copyReleaseScripts(name);

    expect(
      readFileSync(path.join(repo.dir, "scripts", "release", name)),
    ).toEqual(bytes);
  });
});
