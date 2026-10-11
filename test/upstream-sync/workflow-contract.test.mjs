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

describe("live synchronization resources and workflow wiring", () => {
  it("keeps the current entry resources resolvable until the namespace cutover", () => {
    for (const file of [
      "scripts/upstream-sync.sh",
      "scripts/fork-sync/issue.mjs",
      "docs/upstream/synchronization-guide.md",
      "docs/upstream/fork-release-policy.md",
    ])
      expect(existsSync(file), file).toBe(true);
    const text = prompt("upstream-sync");
    expect(text).toContain("scripts/fork-sync/issue.mjs");
    expect(text).toContain("](../../docs/upstream/synchronization-guide.md)");
    expect(read("AGENTS.md")).toContain(
      "](docs/upstream/synchronization-guide.md)",
    );
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
    const result = shell(fence(prompt("ship"), "release-candidates"), {
      env: { ...process.env, RANGE_BASE: "HEAD" },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      registered: [],
      unregistered: [],
    });
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
      const result = shell(fence(prompt("ship"), "release-candidates"), {
        cwd: dir,
        env: { ...process.env, RANGE_BASE: base },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        registered: [registry.packages[0], registry.packages[1]],
        unregistered: ["incoming-unregistered"],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
