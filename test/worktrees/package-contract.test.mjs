import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const packageDirectory = "packages/pi-subagents-worktrees";
const forkCore = "@jopqior/pi-subagents";
const forkWorktrees = "@jopqior/pi-subagents-worktrees";
const read = (file) => readFileSync(file, "utf8");
const manifest = JSON.parse(read(`${packageDirectory}/package.json`));
const settings = JSON.parse(read(".pi/settings.json"));
let packedManifest;
let packedFiles;
let tarball;
let temporaryDirectory;

beforeAll(() => {
  temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "worktrees-contract-"),
  );
  tarball = path.join(temporaryDirectory, "worktrees.tgz");
  execFileSync("pnpm", ["-C", packageDirectory, "pack", "--out", tarball], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  packedManifest = JSON.parse(packedRead("package.json"));
  packedFiles = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .trim()
    .split("\n")
    .sort();
}, 30_000);

afterAll(() => {
  if (temporaryDirectory)
    rmSync(temporaryDirectory, { recursive: true, force: true });
});

function packedRead(file) {
  return execFileSync("tar", ["-xOzf", tarball, `package/${file}`], {
    encoding: "utf8",
  });
}

function assertDevelopmentSettings(packages) {
  const coreIndex = packages.indexOf("../packages/pi-subagents");
  const selectorIndex = packages.indexOf(
    "../packages/pi-subagents-model-selector",
  );
  const worktreesIndex = packages.indexOf("../packages/pi-subagents-worktrees");
  expect(coreIndex).toBeGreaterThanOrEqual(0);
  expect(selectorIndex).toBeGreaterThan(coreIndex);
  expect(worktreesIndex).toBeGreaterThan(coreIndex);
  for (const entry of packages) {
    expect(entry).not.toBe(`npm:${forkWorktrees}`);
    if (typeof entry === "object" && entry.source === `npm:${forkWorktrees}`) {
      for (const resource of ["extensions", "skills", "prompts", "themes"]) {
        expect(entry[resource], resource).toEqual([]);
      }
    }
  }
}

describe("worktrees fork package contract", () => {
  describe.each(["source", "packed"])("%s manifest", (surface) => {
    const getManifest = () =>
      surface === "source" ? manifest : packedManifest;

    it("names the fork and its repository while retaining author and license", () => {
      const actual = getManifest();
      expect(actual.name).toBe(forkWorktrees);
      expect(actual.description).toContain(forkCore);
      expect(actual.repository).toEqual({
        type: "git",
        url: "git+https://github.com/Jopqior/gotgenes-pi-packages.git",
        directory: packageDirectory,
      });
      expect(actual.bugs).toEqual({
        url: "https://github.com/Jopqior/gotgenes-pi-packages/issues",
      });
      expect(actual.homepage).toBe(
        "https://github.com/Jopqior/gotgenes-pi-packages/tree/main/packages/pi-subagents-worktrees#readme",
      );
      expect(actual.author).toEqual({ name: "Chris Lasher" });
      expect(actual.license).toBe("MIT");
    });

    it("requires the published fork core without bundling or upstream fallback", () => {
      const actual = getManifest();
      expect(actual.peerDependencies).toEqual({
        "@earendil-works/pi-coding-agent": ">=0.75.0",
        [forkCore]: ">=1.0.0",
      });
      expect(actual.peerDependenciesMeta?.[forkCore]?.optional).not.toBe(true);
      expect(actual.devDependencies[forkCore]).toBe("^5.0.0");
      expect(actual.devDependencies["@earendil-works/pi-coding-agent"]).toBe(
        "1.0.0",
      );
      for (const field of [
        "dependencies",
        "optionalDependencies",
        "devDependencies",
        "peerDependencies",
      ]) {
        expect(Object.keys(actual[field] ?? {})).not.toContain(
          "@gotgenes/pi-subagents",
        );
      }
      for (const field of ["dependencies", "optionalDependencies"]) {
        expect(Object.keys(actual[field] ?? {})).not.toContain(forkCore);
      }
      for (const field of ["bundledDependencies", "bundleDependencies"]) {
        expect(actual[field] ?? []).toEqual([]);
      }
    });

    it("preserves the runtime entry point and distribution scope", () => {
      const actual = getManifest();
      expect(actual.type).toBe("module");
      expect(actual.exports).toEqual({ ".": "./src/index.ts" });
      expect(actual.pi).toEqual({ extensions: ["./src/index.ts"] });
      expect(actual.files).toEqual([
        "src",
        "README.md",
        "CHANGELOG.md",
        "LICENSE",
      ]);
      expect(actual.imports).toEqual({
        "#src/*": "./src/*",
        "#test/*": "./test/*",
      });
    });
  });

  describe("core resolution", () => {
    it.each([
      ["index.ts", forkCore],
      ["config.ts", `${forkCore}/settings`],
      ["workspace-provider.ts", forkCore],
    ])("uses the fork namespace in source and packed %s", (file, expected) => {
      for (const source of [
        read(`${packageDirectory}/src/${file}`),
        packedRead(`src/${file}`),
      ]) {
        const coreImports = [
          ...source.matchAll(
            /from\s+["'](@(?:gotgenes|jopqior)\/pi-subagents(?:\/settings)?)["']/g,
          ),
        ].map((match) => match[1]);
        expect(coreImports).toEqual([expected]);
      }
    });

    it("mocks the same fork accessor the entry point imports", () => {
      const source = read(`${packageDirectory}/test/index.test.ts`);
      expect(source).toContain(`vi.mock("${forkCore}",`);
      expect(source).not.toContain('vi.mock("@gotgenes/pi-subagents",');
    });
  });

  it("ships only the existing runtime, documentation and license files with original bytes", () => {
    const shipped = [
      "package.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      ...[
        "active-worktrees",
        "config",
        "debug",
        "index",
        "preserved-command",
        "preserved",
        "rescue-branches",
        "workspace-provider",
        "worktree",
      ].map((name) => `src/${name}.ts`),
    ];
    expect(packedFiles).toEqual(
      shipped.map((file) => `package/${file}`).sort(),
    );
    for (const file of shipped.filter((file) => file !== "package.json")) {
      expect(packedRead(file), file).toBe(read(`${packageDirectory}/${file}`));
    }
  });

  it("registers the actual manifest as a direct upstream fork without changing sibling registrations", () => {
    const registry = JSON.parse(read("scripts/release/release-packages.json"));
    expect(registry).toEqual({
      schemaVersion: 2,
      packages: [
        {
          directory: "pi-subagents",
          name: forkCore,
          kind: "fork",
          upstream: {
            name: "@gotgenes/pi-subagents",
            repository: "gotgenes/pi-packages",
            directory: "packages/pi-subagents",
          },
          evidence: "fork-sync",
        },
        {
          directory: "pi-subagents-model-selector",
          name: "@jopqior/pi-subagents-model-selector",
          kind: "original",
        },
        {
          directory: "pi-subagents-worktrees",
          name: manifest.name,
          kind: "fork",
          upstream: {
            name: "@gotgenes/pi-subagents-worktrees",
            repository: "gotgenes/pi-packages",
            directory: packageDirectory,
          },
          evidence: "fork-sync",
        },
      ],
    });
    expect(manifest.name).toBe(forkWorktrees);
  });

  describe("development startup", () => {
    it("loads local companions after core and disables every resource of any fork npm copy", () => {
      assertDevelopmentSettings(settings.packages);
      const upstreamCopy = settings.packages.filter(
        (entry) =>
          typeof entry === "object" &&
          entry.source === "npm:@gotgenes/pi-subagents-worktrees",
      );
      expect(upstreamCopy).toEqual([
        {
          source: "npm:@gotgenes/pi-subagents-worktrees",
          extensions: [],
          skills: [],
        },
      ]);
    });

    it("allows a fully disabled fork npm copy after approved publication", () => {
      assertDevelopmentSettings([
        ...settings.packages,
        {
          source: `npm:${forkWorktrees}`,
          extensions: [],
          skills: [],
          prompts: [],
          themes: [],
        },
      ]);
    });
  });
});
