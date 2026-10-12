import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveUpstreamSource } from "../../scripts/fork-sync/source.mjs";
import {
  createSourceRepository,
  installSourceTransport,
} from "./helpers/source-repository.mjs";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, spawnSync: vi.fn(actual.spawnSync) };
});
const actual = await vi.importActual("node:child_process");
let repo;
let transport;
let release;
beforeEach(() => {
  spawnSync.mockImplementation(actual.spawnSync);
  repo = createSourceRepository();
  transport = installSourceTransport(repo, spawnSync, actual.spawnSync);
  release = repo.release("1.1.0");
});
afterEach(() => {
  for (const call of transport.calls.filter(
    (call) => call.args[0] === "clone" && call.args.includes("--shared"),
  ))
    expect(existsSync(call.args.at(-1))).toBe(false);
  spawnSync.mockImplementation(actual.spawnSync);
  repo.dispose();
});
function resolve() {
  return resolveUpstreamSource({
    repo: repo.fork,
    at: "HEAD",
    upstream: repo.upstreamPackage,
  });
}

describe("incorporated upstream package tail", () => {
  it.each(["runtime.mjs", "运行\nfile.mjs"])(
    "includes shipped package path %s with lossless Git names",
    (file) => {
      const tip = repo.commit(
        repo.upstream,
        `packages/alternate/${file}`,
        "change",
      );
      repo.integrate();
      expect(resolve()).toEqual({
        upstreamPackage: "@upstream/alternate",
        upstreamVersion: "1.1.0",
        releaseCommit: release,
        incorporatedCommit: tip,
        unreleasedPackageChanges: true,
      });
    },
  );
  it.each([
    "packages/sibling/runtime.mjs",
    "README.md",
    "packages/alternate/CHANGELOG.md",
    ...["plans", "retro", "architecture", "decisions", "assets"].map(
      (dir) => `packages/alternate/docs/${dir}/说明\nfile.md`,
    ),
  ])("excludes unrelated or internal path %s", (file) => {
    repo.commit(repo.upstream, file, "change");
    repo.integrate();
    expect(resolve().unreleasedPackageChanges).toBe(false);
  });
  it("includes package manifest changes", () => {
    repo.commit(
      repo.upstream,
      "packages/alternate/package.json",
      repo.manifest("1.1.1"),
    );
    repo.integrate();
    expect(resolve().unreleasedPackageChanges).toBe(true);
  });
  it("detects a package change followed by revert despite identical endpoint trees", () => {
    repo.commit(
      repo.upstream,
      "packages/alternate/package.json",
      repo.manifest("1.1.1"),
    );
    const tip = repo.commit(
      repo.upstream,
      "packages/alternate/package.json",
      repo.manifest("1.1.0"),
    );
    expect(
      repo.git(repo.upstream, "diff", release, tip, "--", "packages/alternate"),
    ).toBe("");
    repo.integrate();
    expect(resolve().unreleasedPackageChanges).toBe(true);
  });
  it("includes merge-only package tree changes absent from both parents", () => {
    repo.git(repo.upstream, "checkout", "-b", "side");
    const side = repo.commit(repo.upstream, "side", "side");
    repo.git(repo.upstream, "checkout", "main");
    const main = repo.commit(repo.upstream, "main", "main");
    repo.write(
      repo.upstream,
      "packages/alternate/merge-only.mjs",
      "resolution",
    );
    repo.git(repo.upstream, "add", "packages/alternate/merge-only.mjs");
    const tree = repo.git(repo.upstream, "write-tree");
    repo.mergeCommit(repo.upstream, [main, side], tree);
    repo.git(repo.upstream, "reset", "--hard", "HEAD");
    repo.integrate();
    expect(resolve().unreleasedPackageChanges).toBe(true);
  });
  it("does not erase incorporated upstream tail after a subsequent sibling-only integration", () => {
    repo.commit(repo.upstream, "packages/alternate/runtime.mjs", "tail");
    repo.integrate();
    repo.commit(repo.upstream, "packages/sibling/runtime.mjs", "sibling");
    repo.integrate();
    expect(resolve().unreleasedPackageChanges).toBe(true);
  });
  it("does not conflate post-integration fork edits with the incorporated upstream tail", () => {
    repo.integrate();
    repo.commit(repo.fork, "packages/alternate/runtime.mjs", "fork change");
    expect(resolve().unreleasedPackageChanges).toBe(false);
  });
});
