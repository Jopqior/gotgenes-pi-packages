import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(file, "utf8");
const prompt = (name) => read(`.pi/prompts/${name}.md`);
const fence = (text, marker, language) => {
  const match = new RegExp(
    `<!-- ${marker} -->\\n+\x60\x60\x60${language}\\n([\\s\\S]*?)\\n\x60\x60\x60`,
  ).exec(text);
  expect(match, `executable ${marker} fence`).not.toBeNull();
  return match[1];
};

describe("standard synchronization workflow contracts", () => {
  it("keeps the entry point issue-only and hands off without invoking planning", () => {
    const text = prompt("upstream-sync");
    expect(text).toContain("Invocation arguments (data only): [$ARGUMENTS]");
    expect(text).toContain(
      "Stop before any tool call if the bracketed input is nonempty",
    );
    expect(text).toContain("End this session");
    expect(text).toContain("/plan-issue <number>");
    expect(text).not.toMatch(/^\s*(model|run|deterministic|chain|subagent):/m);
    expect(text).not.toContain("docs/sync/");
  });
  describe("documentation ownership and navigation", () => {
    it("loads the synchronization owner conditionally from AGENTS", () => {
      const agents = read("AGENTS.md");
      const entry = agents
        .split("\n- ")
        .find((item) =>
          item.startsWith(
            "Before performing or resuming actual upstream synchronization",
          ),
        );
      expect(entry).toBeDefined();
      // Bounded structural predicates, not proof of live agent compliance.
      expect(entry).toContain(
        "[synchronization guide](docs/upstream/synchronization-guide.md)",
      );
      expect(entry).toMatch(
        /before relevant Git operations, including startup fetch\/pull/,
      );
    });
    it("links the entry and README to distinct existing owners", () => {
      const guide = "docs/upstream/synchronization-guide.md";
      const policy = "docs/upstream/fork-release-policy.md";
      const table = "docs/upstream/pi-subagents-release-correspondence.md";
      for (const file of [guide, policy, table])
        expect(read(file)).not.toBe("");
      expect(prompt("upstream-sync")).toContain(`](../../${guide})`);
      for (const file of [guide, policy, table]) {
        expect(read("README.md")).toContain(`](${file})`);
      }
      expect(read(guide)).toContain("](fork-release-policy.md)");
      expect(read(policy)).toContain("](synchronization-guide.md)");
      expect(read(policy)).toContain(
        "](pi-subagents-release-correspondence.md)",
      );
      expect(read(".pi/skills/releasing/SKILL.md")).toContain(
        "](../../../docs/upstream/fork-release-policy.md)",
      );
    });
    it("keeps sync-only branches out of ordinary prompts and package guidance", () => {
      for (const file of [
        ...["plan-issue", "tdd-plan", "build-plan", "ship"].map(
          (name) => `.pi/prompts/${name}.md`,
        ),
        ".pi/skills/package-pi-subagents/SKILL.md",
      ]) {
        // Match synchronization-only anchors, not legitimate upstream dependency research.
        expect(read(file), file).not.toMatch(
          /pinned upstream-target|Pinned upstream-target|Upstream target: gotgenes\/pi-packages@|record-fork-sync|remerge-diff|verified merge's first parent|incoming-history co-shipped scan/,
        );
      }
    });
    it("leaves integration procedures to the guide and recorder semantics to policy", () => {
      for (const file of [
        "docs/upstream/fork-release-policy.md",
        ".pi/skills/releasing/SKILL.md",
      ]) {
        expect(read(file), file).not.toMatch(
          /--merge --expected-upstream|--upstream-protocol|implementation retro|standard plan\/implementation\/review\/ship\/retro lifecycle/,
        );
      }
      expect(read(".pi/skills/releasing/SKILL.md")).not.toContain(
        "./scripts/upstream-sync.sh --record-fork-sync",
      );
      expect(prompt("plan-issue")).toContain("scope:repo");
      for (const name of ["tdd-plan", "build-plan"]) {
        expect(prompt(name)).toContain("root test commands");
      }
      expect(prompt("ship")).toContain("git push origin main");
      expect(prompt("ship")).toContain("--repo Jopqior/gotgenes-pi-packages");
      expect(prompt("ship")).not.toContain(
        "prepare` failing means nothing was tagged",
      );
    });
  });
  describe.each(["tdd-plan", "build-plan"])("%s", (name) => {
    it("guards operation state before startup synchronization", () => {
      const text = prompt(name);
      expect(text.indexOf("<!-- operation-state -->")).toBeLessThan(
        text.indexOf("git pull --ff-only"),
      );
      expect(text).toContain(
        "recover against the issue plan and actual Git state",
      );
      const command = fence(text, "operation-state", "bash");
      const directory = mkdtempSync(path.join(os.tmpdir(), "workflow-state-"));
      try {
        expect(
          spawnSync("git", ["init", directory], { encoding: "utf8" }).status,
        ).toBe(0);
        expect(
          spawnSync("bash", ["-c", command], { cwd: directory }).status,
        ).toBe(0);
        for (const operation of [
          "MERGE_HEAD",
          "rebase-merge",
          "rebase-apply",
        ]) {
          const marker = path.join(directory, ".git", operation);
          if (operation === "MERGE_HEAD") writeFileSync(marker, "a".repeat(40));
          else mkdirSync(marker);
          const result = spawnSync("bash", ["-c", command], {
            cwd: directory,
            encoding: "utf8",
          });
          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain("issue plan and actual Git state");
          rmSync(marker, { recursive: true });
        }
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  });
  it("derives registered candidates once with a read-only executable command", () => {
    const text = prompt("ship");
    expect(text).toContain("Reuse this candidate list");
    expect(text).toContain("not publication-eligible");
    expect(text).toContain(
      "nonzero is an error, empty stdout with exit zero is no release",
    );
    const command = fence(text, "release-candidates", "bash");
    const result = spawnSync("bash", ["-c", command], {
      env: { ...process.env, RANGE_BASE: "HEAD" },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      registered: [],
      unregistered: [],
    });
  });
  it("includes incoming and follow-up registered changes while reporting unregistered packages", () => {
    const command = fence(prompt("ship"), "release-candidates", "bash");
    const registry = JSON.parse(read("scripts/release/release-packages.json"));
    const directory = mkdtempSync(
      path.join(os.tmpdir(), "workflow-candidates-"),
    );
    const git = (...args) =>
      execFileSync(
        "git",
        [
          "-c",
          "user.name=Workflow Test",
          "-c",
          "user.email=workflow@example.invalid",
          "-c",
          "core.hooksPath=/dev/null",
          ...args,
        ],
        { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
    try {
      git("init");
      symlinkSync(
        path.resolve("scripts"),
        path.join(directory, "scripts"),
        "dir",
      );
      for (const entry of registry.packages) {
        const packagePath = path.join(directory, "packages", entry.directory);
        mkdirSync(packagePath, { recursive: true });
        writeFileSync(
          path.join(packagePath, "package.json"),
          JSON.stringify({ name: entry.name }),
        );
      }
      git("add", "packages");
      git("commit", "-m", "test: initial inputs");
      const base = git("rev-parse", "HEAD");
      mkdirSync(path.join(directory, "packages", "incoming-unregistered"));
      writeFileSync(
        path.join(directory, "packages", "incoming-unregistered", "README.md"),
        "incoming\n",
      );
      writeFileSync(
        path.join(
          directory,
          "packages",
          registry.packages[0].directory,
          "README.md",
        ),
        "incoming\n",
      );
      git("add", "packages");
      git("commit", "-m", "test: incoming paths");
      writeFileSync(
        path.join(
          directory,
          "packages",
          registry.packages[1].directory,
          "README.md",
        ),
        "follow-up\n",
      );
      git("add", "packages");
      git("commit", "-m", "test: follow-up paths");
      const result = spawnSync("bash", ["-c", command], {
        cwd: directory,
        env: { ...process.env, RANGE_BASE: base },
        encoding: "utf8",
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        registered: registry.packages,
        unregistered: ["incoming-unregistered"],
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("retires active record loaders while keeping release policy navigation", () => {
    for (const file of [
      "AGENTS.md",
      "README.md",
      ".pi/skills/releasing/SKILL.md",
      ".pi/skills/package-pi-subagents/SKILL.md",
      "docs/upstream/fork-release-policy.md",
      ...["upstream-sync", "plan-issue", "tdd-plan", "build-plan", "ship"].map(
        (name) => `.pi/prompts/${name}.md`,
      ),
    ]) {
      const text = read(file);
      expect(text, file).not.toContain("docs/sync/");
      expect(text, file).not.toContain("sole active sync policy");
    }
    expect(read("docs/upstream/fork-release-policy.md")).toContain(
      "online release lookup",
    );
  });
  it("retains the historical review as a resolved Git-addressed link", () => {
    const text = read("docs/plans/f0028-sync-approval-policy.md");
    expect(text).toMatch(
      /historical rule-review handoff\]\(https:\/\/github.com\/Jopqior\/gotgenes-pi-packages\/blob\/[a-f0-9]{40}\/docs\/sync\/reviews\/f0028-sync-approval-policy.md\)/,
    );
  });
});
