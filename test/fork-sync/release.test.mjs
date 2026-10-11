import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validatePublishedArtifacts } from "../../scripts/release/release-artifacts.mjs";
import { readTaggedReleaseSection } from "../../scripts/release/release-metadata.mjs";
import { captureOutput } from "../helpers/capture-output.mjs";
import {
  core,
  createReleaseRepository,
  oldSuffix,
  original,
  worktrees,
} from "./helpers/release-repository.mjs";

let repo;
beforeEach(() => {
  repo = createReleaseRepository();
});
afterEach(() => repo.dispose());
const section = (directory) =>
  readTaggedReleaseSection({
    repo: repo.fork,
    tag: `${directory}-v1.0.1`,
    packageDirectory: directory,
  });
function prepared(...directories) {
  const result = repo.prepare(...directories);
  expect(result.status, result.stderr + result.stdout).toBe(0);
}
const effects = () =>
  repo
    .calls()
    .split("\n")
    .filter((call) => /^(pnpm |gh release create|git push)/.test(call));

describe("source-only all-selected preparation", () => {
  it("uses ordinary patch prediction for both forks without querying source", () => {
    for (const directory of [core, worktrees, original]) {
      const result = repo.run("next-version.sh", {}, directory);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe(`${directory}-v1.0.1\n`);
    }
    const parity = repo.run("verify-cliff-parity.sh");
    expect(parity.status, parity.stdout + parity.stderr).toBe(0);
    expect(repo.calls()).not.toMatch(/ls-remote|git fetch/);
  });
  it("bounds old upstream breaking ancestry at an annotated excluded-path tag", () => {
    const target = repo.git(repo.fork, "rev-parse", `${core}-v1.0.0`);
    repo.git(repo.fork, "tag", "-d", `${core}-v1.0.0`);
    repo.git(
      repo.fork,
      "tag",
      "-a",
      `${core}-v1.0.0`,
      target,
      "-m",
      "annotated fork release",
    );
    const result = repo.run("next-version.sh", {}, core);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(`${core}-v1.0.1\n`);
  });
  it("bumps for a new upstream break and renders only the post-tag merge range", () => {
    const tip = repo.commit(
      repo.upstream,
      `packages/${core}/new-break.txt`,
      "new break\n",
      "feat!: new upstream break",
    );
    repo.integrate(tip);
    const prediction = repo.run("next-version.sh", {}, core);
    expect(prediction.status, prediction.stderr).toBe(0);
    expect(prediction.stdout).toBe(`${core}-v2.0.0\n`);
    prepared(core);
    const text = readTaggedReleaseSection({
      repo: repo.fork,
      tag: `${core}-v2.0.0`,
      packageDirectory: core,
    });
    expect(text).toContain(`compare/${core}-v1.0.0...${core}-v2.0.0`);
    expect(text).toContain("new upstream break");
    expect(text).toContain("ordinary fork change");
    expect(text).not.toContain("old upstream break");
    expect(repo.git(repo.fork, "rev-parse", "HEAD~1^2")).toBe(tip);
  });
  it("splices the full prepared bytes, preserves the old suffix, and uses each fork's own source", () => {
    prepared(core, worktrees, original);
    for (const [index, directory] of [core, worktrees, original].entries()) {
      expect(section(directory)).toBe(
        readFileSync(path.join(repo.prepared, `section-${index}`), "utf8"),
      );
      expect(
        repo
          .read(`packages/${directory}/CHANGELOG.md`)
          .endsWith(oldSuffix.replaceAll(core, directory)),
      ).toBe(true);
    }
    expect(section(core)).toContain(
      "Contained stable upstream release: `1.1.0`",
    );
    expect(section(core)).toContain(`${repo.stable}/packages/${core}`);
    expect(section(core)).toContain(`${repo.tip}/packages/${core}`);
    expect(section(core)).toContain(
      "Includes unreleased changes to this package.",
    );
    expect(section(worktrees)).toContain(
      `Direct upstream package: \`@gotgenes/${worktrees}\``,
    );
    expect(section(worktrees)).toContain(
      "Contained stable upstream release: `2.0.0`",
    );
    expect(section(worktrees)).not.toContain("Includes unreleased changes");
    expect(section(original)).not.toContain("upstream-correspondence");
    expect(repo.git(repo.fork, "status", "--porcelain")).toBe("");
  });
  it("keeps preflighted source text when the CHANGELOG is absent", () => {
    rmSync(repo.file(`packages/${core}/CHANGELOG.md`));
    repo.commitAll();
    prepared(core);
    expect(section(core)).toBe(
      readFileSync(path.join(repo.prepared, "section-0"), "utf8"),
    );
    expect(repo.read(`packages/${core}/CHANGELOG.md`)).toContain("# Changelog");
  });
  it("does not contact upstream or change an unselected fork for an original release", () => {
    const unselected = () =>
      Object.fromEntries(
        Object.entries(repo.snapshot().files).filter(
          ([file]) =>
            file.startsWith(`packages/${core}/`) ||
            file.startsWith(`packages/${worktrees}/`),
        ),
      );
    const before = unselected();
    prepared(original);
    expect(repo.calls()).not.toMatch(/ls-remote|git fetch/);
    expect(unselected()).toEqual(before);
    expect(section(original)).not.toContain("upstream-correspondence");
  });
  for (const failure of ["source", "registration", "heading", "identity"]) {
    it(`fails a later ${failure} before any tracked write, commit, tag or push`, () => {
      if (failure === "source") {
        const entry = repo.registrations.find(
          (entry) => entry.directory === worktrees,
        );
        entry.upstream.name = "@gotgenes/wrong";
        repo.write(
          "scripts/release/release-packages.json",
          JSON.stringify({ schemaVersion: 3, packages: repo.registrations }),
        );
      } else if (failure === "registration") {
        repo.write(
          "scripts/release/release-packages.json",
          JSON.stringify({
            schemaVersion: 3,
            packages: repo.registrations.filter(
              (entry) => entry.directory !== worktrees,
            ),
          }),
        );
      } else if (failure === "heading") {
        repo.write(
          "cliff.toml",
          repo
            .read("cliff.toml")
            .replace(
              'replace = "https://github.com/Jopqior/gotgenes-pi-packages"',
              'replace = "https://github.com/other/repository"',
            ),
        );
      } else {
        repo.write(
          `packages/${worktrees}/package.json`,
          JSON.stringify({ name: "@fixture/wrong", version: "1.0.0" }),
        );
      }
      repo.commitAll();
      const before = repo.snapshot();
      const result = repo.prepare(original, core, worktrees);
      expect(result.status).not.toBe(0);
      expect(result.stderr).not.toBe("");
      expect(repo.snapshot()).toEqual(before);
      expect(effects()).toEqual([]);
    });
  }
  it("refuses first-tag inference and distinguishes current-tag no-op from failed prediction", () => {
    repo.git(repo.fork, "tag", "-d", `${core}-v1.0.0`);
    let result = repo.run("next-version.sh", {}, core);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("first version by hand");
    repo.git(repo.fork, "tag", `${core}-v1.0.0`);
    result = repo.run("next-version.sh", {}, core);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Nothing to release");
    expect(repo.prepare(core).status).not.toBe(0);
  });
});

describe("offline tagged publication and exact notes", () => {
  it("binds an explicitly selected tag to the checked-out release commit", () => {
    prepared(core);
    repo.commit(
      repo.fork,
      "later.txt",
      "later\n",
      "docs: later unrelated commit",
    );
    expect(() =>
      captureOutput(() =>
        validatePublishedArtifacts(repo.fork, repo.prepared, [
          `${core}-v1.0.1`,
        ]),
      ),
    ).toThrow("not at the checked-out release commit");
  });
  it("publishes the whole mixed set with explicit identities and exact tagged notes, without source reselection", () => {
    prepared(core, worktrees, original);
    const releaseHead = repo.git(repo.fork, "rev-parse", "HEAD");
    repo.commit(repo.fork, "later.txt", "unrelated\n", "docs: later tag");
    repo.git(repo.fork, "tag", "unrelated-v99.0.0");
    repo.git(repo.fork, "checkout", "--detach", releaseHead);
    // Today's advertised stable releases advance, but tagged claims stay fixed.
    repo.release("1.2.0");
    repo.publish();
    repo.clearCalls();
    for (const script of ["publish-released.sh", "create-github-releases.sh"]) {
      const result = repo.run(script, { OFFLINE: "1" });
      expect(result.status, result.stderr + result.stdout).toBe(0);
    }
    for (const directory of [core, worktrees, original])
      expect(
        readFileSync(path.join(repo.bodies, `${directory}-v1.0.1`), "utf8"),
      ).toBe(section(directory));
    expect(repo.calls()).not.toMatch(/ls-remote|git fetch/);
    expect(effects().filter((line) => line.startsWith("pnpm "))).toEqual([
      "pnpm --filter @fixture/demo publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/",
      `pnpm --filter @jopqior/${core} publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/`,
      `pnpm --filter @jopqior/${worktrees} publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/`,
    ]);
    expect(
      effects()
        .filter((line) => line.startsWith("gh "))
        .every((line) => line.includes("--repo Jopqior/gotgenes-pi-packages")),
    ).toBe(true);
    repo.clearCalls();
    expect(repo.run("create-github-releases.sh", { OFFLINE: "1" }).status).toBe(
      0,
    );
    expect(effects()).toEqual([]);
    const body = path.join(repo.bodies, `${worktrees}-v1.0.1`);
    writeFileSync(body, "Legacy body retained\n");
    expect(repo.run("create-github-releases.sh", { OFFLINE: "1" }).status).toBe(
      0,
    );
    expect(readFileSync(body, "utf8")).toBe("Legacy body retained\n");
    expect(effects()).toEqual([]);
    rmSync(path.join(repo.bodies, `${original}-v1.0.1`));
    writeFileSync(
      body,
      "<!-- upstream-correspondence:start -->\nwrong\n<!-- upstream-correspondence:end -->\n",
    );
    const conflict = repo.run("create-github-releases.sh", { OFFLINE: "1" });
    expect(conflict.status).not.toBe(0);
    expect(conflict.stderr).toContain("conflicting");
    expect(effects()).toEqual([]);
  }, 15_000);
  for (const damage of [
    "dirty code",
    "dirty index",
    "hidden manifest",
    "hidden changelog",
    "tagged name",
    "tagged version",
    "missing block",
    "original block",
    "wrong tail",
    "wrong tip",
  ]) {
    it(`rejects later ${damage} before any selected publication or creation`, () => {
      prepared(core, worktrees, original);
      const relative = `packages/${worktrees}/`;
      if (damage === "dirty code")
        repo.write(`${relative}untracked.txt`, "dirty");
      else if (damage === "dirty index") {
        repo.write(`${relative}fork.txt`, "dirty");
        repo.git(repo.fork, "add", `${relative}fork.txt`);
      } else if (
        damage.includes("manifest") ||
        damage === "tagged name" ||
        damage === "tagged version"
      ) {
        const manifest = JSON.parse(repo.read(`${relative}package.json`));
        if (damage === "tagged name") manifest.name = "@jopqior/wrong";
        else manifest.version = "9.9.9";
        repo.write(`${relative}package.json`, JSON.stringify(manifest));
        if (damage === "hidden manifest")
          repo.git(
            repo.fork,
            "update-index",
            "--assume-unchanged",
            `${relative}package.json`,
          );
      } else if (damage === "original block") {
        repo.write(
          `packages/${original}/CHANGELOG.md`,
          repo
            .read(`packages/${original}/CHANGELOG.md`)
            .replace(
              "### Bug Fixes",
              "<!-- upstream-correspondence:start -->\n### Bug Fixes",
            ),
        );
      } else {
        const text = repo.read(`${relative}CHANGELOG.md`);
        const changed =
          damage === "wrong tail"
            ? text.replace(
                "This records incorporated",
                "Includes unreleased changes to this package.\n\nThis records incorporated",
              )
            : damage === "wrong tip"
              ? text.replaceAll(repo.tip, repo.stable)
              : text.replace(
                  "<!-- upstream-correspondence:start -->",
                  "<!-- upstream-correspondence:broken -->",
                );
        repo.write(`${relative}CHANGELOG.md`, changed);
        if (damage === "hidden changelog")
          repo.git(
            repo.fork,
            "update-index",
            "--assume-unchanged",
            `${relative}CHANGELOG.md`,
          );
      }
      if (!damage.startsWith("dirty") && !damage.startsWith("hidden")) {
        repo.commitAll();
        repo.retag();
      }
      repo.clearCalls();
      for (const script of [
        "publish-released.sh",
        "create-github-releases.sh",
      ]) {
        const result = repo.run(script, { OFFLINE: "1" });
        expect(result.status, damage).not.toBe(0);
        expect(result.stderr).not.toBe("");
      }
      expect(effects()).toEqual([]);
    });
  }
});
