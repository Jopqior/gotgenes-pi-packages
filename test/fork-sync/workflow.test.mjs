import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(file, "utf8");
const prompt = (name) => read(`.pi/prompts/${name}.md`);
function fence(text, marker) {
  const match = new RegExp(
    `<!-- ${marker} -->\\n+\x60\x60\x60bash\\n([\\s\\S]*?)\\n\x60\x60\x60`,
  ).exec(text);
  expect(match, marker).not.toBeNull();
  return match[1];
}
const shell = (command, options = {}) =>
  spawnSync("bash", ["-c", command], {
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });

function repositorySnapshot(cwd = process.cwd()) {
  const git = (...args) =>
    execFileSync("git", ["--no-optional-locks", ...args], {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    });
  return {
    head: git("rev-parse", "HEAD"),
    refs: git("show-ref"),
    index: git("ls-files", "--stage"),
    status: git("status", "--porcelain=v1"),
    config: git("config", "--local", "--list"),
    registry: read(path.join(cwd, "scripts/release/release-packages.json")),
  };
}

describe("live synchronization resources and workflow wiring", () => {
  it("resolves the new entry resources, linked guides and actual module imports without aliases", () => {
    const resources = [
      "scripts/fork-sync/sync.sh",
      "scripts/fork-sync/issue.mjs",
      ".pi/prompts/fork-sync.md",
      ".pi/skills/fork-sync/SKILL.md",
      ".pi/skills/fork-sync/references/synchronization.md",
      ".pi/skills/fork-sync/references/release-source.md",
      ".pi/skills/fork-sync/references/first-release.md",
    ];
    for (const file of resources) expect(existsSync(file), file).toBe(true);
    for (const file of [
      "scripts/upstream-sync.sh",
      ".pi/prompts/upstream-sync.md",
      "docs/upstream",
      "docs/fork-sync",
      "test/upstream-sync",
    ])
      expect(existsSync(file), file).toBe(false);

    for (const file of [
      ...resources.filter((file) => file.endsWith(".md")),
      "AGENTS.md",
      "README.md",
      ".pi/skills/releasing/SKILL.md",
    ]) {
      const text = read(file);
      for (const [, reference] of text.matchAll(/\]\(([^)]+)\)/g)) {
        const local = reference.startsWith(
          "https://github.com/Jopqior/gotgenes-pi-packages/blob/main/",
        )
          ? reference.split("/blob/main/")[1]
          : /^[a-z]+:/.test(reference)
            ? null
            : path.join(path.dirname(file), reference);
        if (local)
          expect(existsSync(local.split("#")[0]), `${file}: ${reference}`).toBe(
            true,
          );
      }
      for (const [reference] of text.matchAll(/scripts\/[\w/.-]+\.(?:mjs|sh)/g))
        expect(existsSync(reference), `${file}: ${reference}`).toBe(true);
    }
    for (const file of [
      "scripts/fork-sync/issue.mjs",
      "scripts/fork-sync/source.mjs",
      "scripts/release/release-metadata.mjs",
    ]) {
      for (const [, reference] of read(file).matchAll(
        /from\s+["'](\.[^"']+)["']/g,
      ))
        expect(
          existsSync(path.resolve(path.dirname(file), reference)),
          `${file}: ${reference}`,
        ).toBe(true);
    }
  });
  for (const name of ["tdd-plan", "build-plan"]) {
    it(`executes the ${name} operation guard before startup synchronization`, () => {
      const text = prompt(name);
      expect(text.indexOf("<!-- operation-state -->")).toBeLessThan(
        text.indexOf("git pull --ff-only"),
      );
      const dir = mkdtempSync(path.join(tmpdir(), "workflow-state-"));
      try {
        execFileSync("git", ["init", dir], { stdio: "pipe" });
        const command = fence(text, "operation-state");
        expect(shell(command, { cwd: dir }).status).toBe(0);
        for (const state of ["MERGE_HEAD", "rebase-merge", "rebase-apply"]) {
          const marker = path.join(dir, ".git", state);
          if (state === "MERGE_HEAD") writeFileSync(marker, "a".repeat(40));
          else mkdirSync(marker);
          const result = shell(command, { cwd: dir });
          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain("issue plan and actual Git state");
          rmSync(marker, { recursive: true });
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
  it("executes the ship candidate import read-only at HEAD", () => {
    const before = repositorySnapshot();
    const result = shell(fence(prompt("ship"), "release-candidates"), {
      env: { ...process.env, RANGE_BASE: "HEAD" },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      registered: [],
      unregistered: [],
    });
    expect(repositorySnapshot()).toEqual(before);
  });
  it("includes incoming/follow-up registered changes and reports unregistered paths", () => {
    const registry = JSON.parse(read("scripts/release/release-packages.json"));
    const dir = mkdtempSync(path.join(tmpdir(), "workflow-candidates-"));
    const git = (...args) =>
      execFileSync(
        "git",
        [
          "-c",
          "user.name=Workflow",
          "-c",
          "user.email=workflow@example.invalid",
          "-c",
          "core.hooksPath=/dev/null",
          ...args,
        ],
        { cwd: dir, encoding: "utf8", stdio: "pipe" },
      ).trim();
    try {
      git("init");
      symlinkSync(path.resolve("scripts"), path.join(dir, "scripts"), "dir");
      for (const entry of registry.packages) {
        const pkg = path.join(dir, "packages", entry.directory);
        mkdirSync(pkg, { recursive: true });
        writeFileSync(
          path.join(pkg, "package.json"),
          JSON.stringify({ name: entry.name }),
        );
      }
      git("add", "packages");
      git("commit", "-m", "test: baseline");
      const base = git("rev-parse", "HEAD");
      mkdirSync(path.join(dir, "packages", "incoming-unregistered"));
      for (const directory of [
        registry.packages[0].directory,
        "incoming-unregistered",
      ])
        writeFileSync(
          path.join(dir, "packages", directory, "README.md"),
          "incoming\n",
        );
      git("add", "packages");
      git("commit", "-m", "test: incoming");
      writeFileSync(
        path.join(dir, "packages", registry.packages[1].directory, "README.md"),
        "follow-up\n",
      );
      git("add", "packages");
      git("commit", "-m", "test: follow-up");
      const before = repositorySnapshot(dir);
      const result = shell(fence(prompt("ship"), "release-candidates"), {
        cwd: dir,
        env: { ...process.env, RANGE_BASE: base },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        registered: [registry.packages[0], registry.packages[1]],
        unregistered: ["incoming-unregistered"],
      });
      expect(repositorySnapshot(dir)).toEqual(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
