import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readReleasePackages,
  resolvePublishedCorrespondence,
  validateReleasePackages,
} from "../../scripts/release/release-correspondence.mjs";
import { createReleaseArtifacts } from "./helpers/release-artifacts.mjs";

const WORKTREES = {
  directory: "pi-subagents-worktrees",
  name: "@jopqior/pi-subagents-worktrees",
  kind: "fork",
  upstream: {
    name: "@gotgenes/pi-subagents-worktrees",
    repository: "gotgenes/pi-packages",
    directory: "packages/pi-subagents-worktrees",
  },
  evidence: "fork-sync",
};
const root = path.resolve(import.meta.dirname, "../..");
let fixture;
let statePath;
let corePath;
const coreBytes = "invalid unselected core evidence\n";
const scripts = [
  "lib.sh",
  "next-version.sh",
  "fork-sync.mjs",
  "fork-sync-targets.mjs",
  "pi-subagents/config.mjs",
  "pi-subagents-worktrees/config.mjs",
  "fork-sync/decision.mjs",
  "fork-sync/cliff.mjs",
  "fork-sync/evidence.mjs",
  "fork-sync/state.mjs",
  "fork-sync/values.mjs",
];

beforeEach(() => {
  fixture = createReleaseArtifacts(WORKTREES);
  statePath = path.join(
    fixture.repo.dir,
    "scripts/release/pi-subagents-worktrees/sync-state.json",
  );
  corePath = path.join(
    fixture.repo.dir,
    "scripts/release/pi-subagents/sync-state.json",
  );
  mkdirSync(path.dirname(statePath), { recursive: true });
  mkdirSync(path.dirname(corePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(fixture.state));
  writeFileSync(corePath, coreBytes);
});
afterEach(() => fixture.dispose());

function runCli(extra = [], current = fixture.second.forkTag) {
  return spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/release/fork-sync.mjs"),
      "--repo",
      fixture.repo.dir,
      "--current",
      current,
      ...extra,
      "--",
      ...fixture.repo.cliffArgs(WORKTREES.directory),
    ],
    { encoding: "utf8" },
  );
}

function integratePatch() {
  const { repo } = fixture;
  repo.git("checkout", "-b", "upstream-patch", fixture.second.upstream.commit);
  fixture.writeManifest(WORKTREES.directory, WORKTREES.upstream.name, "21.7.2");
  repo.git("add", ".");
  repo.git("commit", "-m", "chore: upstream patch release");
  const commit = repo.gitOut("rev-parse", "HEAD");
  repo.git("checkout", "main");
  repo.git(
    "merge",
    "--no-ff",
    "-X",
    "theirs",
    "-m",
    "feat!: integrate broad upstream breaking release",
    "upstream-patch",
  );
  const merge = repo.gitOut("rev-parse", "HEAD");
  fixture.writeManifest(WORKTREES.directory, WORKTREES.name, "1.0.1");
  repo.git("add", ".");
  repo.git("commit", "-m", "chore(release): preserve fork identity");
  fixture.state.syncs.push({
    merge,
    upstream: { version: "21.7.2", commit },
    forkContribution: {
      level: "none",
      rationale: "upstream-only patch incorporation",
      paths: [],
    },
  });
  writeFileSync(statePath, JSON.stringify(fixture.state));
  return { commit, merge };
}

describe("selected worktrees offline prediction", () => {
  it("reads its own default state without consulting core", () => {
    const result = runCli(["--package", WORKTREES.directory]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    // git-cliff emits version/configuration notices even on successful prediction.
    expect(result.stderr).not.toMatch(/^error:/m);
    expect(readFileSync(corePath, "utf8")).toBe(coreBytes);
  });

  it("uses recorded upstream distance instead of a broad integration message", () => {
    const { commit } = integratePatch();
    const result = runCli(["--package", WORKTREES.directory, "--json"]);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      currentTag: fixture.second.forkTag,
      nextTag: "pi-subagents-worktrees-v1.0.2",
      upstream: { version: "21.7.2", commit },
      upstreamTip: commit,
      upstreamLevel: "patch",
      forkLevel: "none",
    });
    fixture.repo.copyReleaseScripts(...scripts);
    const next = fixture.repo.runReleaseScript(
      "next-version.sh",
      WORKTREES.directory,
    );
    expect(next.status).toBe(0);
    expect(next.stdout).toBe("pi-subagents-worktrees-v1.0.2\n");
    expect(readFileSync(corePath, "utf8")).toBe(coreBytes);
  });

  it("retains explicit --state with a selected package and a path containing spaces", () => {
    const explicit = path.join(fixture.repo.dir, "selected evidence.json");
    writeFileSync(explicit, JSON.stringify(fixture.state));
    writeFileSync(statePath, "invalid selected default");
    const result = runCli([
      "--package",
      WORKTREES.directory,
      "--state",
      explicit,
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    // Preserve the existing git-cliff diagnostic stream.
    expect(result.stderr).not.toMatch(/^error:/m);
  });

  it("rejects another package's state even through --state", () => {
    const crossed = structuredClone(fixture.state);
    crossed.releases[0].forkTag = "pi-subagents-v1.0.0";
    writeFileSync(corePath, JSON.stringify(crossed));
    const result = runCli([
      "--package",
      WORKTREES.directory,
      "--state",
      corePath,
    ]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/forkTag is not a pi-subagents-worktrees-v/);
  });

  it.each([
    "pi-subagents-v1.0.1",
    "pi-subagents-worktrees-v01.0.1",
    "pi-subagents-worktrees-v1.0.1-beta",
    "pi-subagents-worktrees-v1.0.1:packages/other",
  ])("rejects mismatched or malformed current tag %s", (tag) => {
    const result = runCli(["--package", WORKTREES.directory], tag);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/invalid package release tag/);
  });

  it.each(
    [
      ["--package"],
      ["--package", ""],
      ["--package", "--json"],
      ["--package", WORKTREES.directory, "--package", WORKTREES.directory],
      ["--package=pi-subagents-worktrees"],
      ["--package", "../pi-subagents-worktrees"],
      ["--package", "pi-subagents-model-selector"],
    ].map((args) => ({ args })),
  )("rejects invalid package arguments $args", ({ args }) => {
    const result = runCli(args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(
      /--package|unsupported fork sync package|unknown argument/,
    );
  });

  it.each(
    [
      ["--state", ""],
      ["--state", "--json"],
    ].map((args) => ({ args })),
  )("rejects malformed explicit state $args", ({ args }) => {
    const result = runCli(["--package", WORKTREES.directory, ...args]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/--state requires a path/);
  });

  it("refuses a tagged but empty evidence container", () => {
    writeFileSync(
      statePath,
      JSON.stringify({ schemaVersion: 2, releases: [], syncs: [] }),
    );
    const result = runCli(["--package", WORKTREES.directory]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/no recorded upstream correspondence/);
  });

  it("fails closed on missing selected evidence even when core evidence exists", () => {
    writeFileSync(corePath, JSON.stringify(fixture.state));
    unlinkSync(statePath);
    fixture.repo.copyReleaseScripts(...scripts);
    const result = fixture.repo.runReleaseScript(
      "next-version.sh",
      WORKTREES.directory,
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/cannot read fork sync state/);
    expect(readFileSync(corePath, "utf8")).toBe(JSON.stringify(fixture.state));
  });

  it("predicts offline without changing evidence, HEAD or tag mappings", () => {
    integratePatch();
    fixture.repo.copyReleaseScripts(...scripts);
    const bin = path.join(fixture.repo.dir, "offline-bin");
    mkdirSync(bin);
    const log = path.join(bin, "network.log");
    writeFileSync(log, "");
    const git = execFileSync("bash", ["-c", "command -v git"], {
      encoding: "utf8",
    }).trim();
    const wrapper = path.join(bin, "git");
    writeFileSync(
      wrapper,
      [
        "#!/bin/sh",
        'case "$1" in',
        "fetch|ls-remote|clone|push|pull|remote)",
        `  printf '%s\\n' "$*" >> '${log}'`,
        "  exit 1;;",
        "esac",
        `exec '${git}' "$@"`,
        "",
      ].join("\n"),
    );
    chmodSync(wrapper, 0o755);
    const snapshot = () => ({
      head: fixture.repo.gitOut("rev-parse", "HEAD"),
      tags: fixture.repo.gitOut("show-ref", "--tags"),
      state: readFileSync(statePath, "utf8"),
      core: readFileSync(corePath, "utf8"),
      status: fixture.repo.gitOut("status", "--porcelain"),
    });
    const before = snapshot();
    const result = fixture.repo.runReleaseScriptEnv(
      { PATH: `${bin}:${process.env.PATH}` },
      "next-version.sh",
      WORKTREES.directory,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("pi-subagents-worktrees-v1.0.2\n");
    expect(readFileSync(log, "utf8")).toBe("");
    expect(snapshot()).toEqual(before);
  });

  it("still refuses prediction without a first tag", () => {
    fixture.repo.copyReleaseScripts(...scripts);
    fixture.repo.git(
      "tag",
      "-d",
      fixture.first.forkTag,
      fixture.second.forkTag,
    );
    const result = fixture.repo.runReleaseScript(
      "next-version.sh",
      WORKTREES.directory,
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/has no pi-subagents-worktrees-v\* tag/);
  });
});

describe("supported worktrees correspondence route", () => {
  it("validates registration and verifies its own exact upstream source", () => {
    expect(validateReleasePackages(fixture.registry)).toEqual(fixture.registry);
    const file = path.join(fixture.repo.dir, "release-packages.json");
    writeFileSync(file, JSON.stringify(fixture.registry));
    expect(readReleasePackages(file, fixture.repo.dir)).toEqual(
      fixture.registry,
    );
    expect(
      resolvePublishedCorrespondence({
        repo: fixture.repo.dir,
        tag: fixture.first.forkTag,
        registry: fixture.registry,
        state: fixture.state,
      }),
    ).toEqual({
      kind: "fork",
      upstreamPackage: WORKTREES.upstream.name,
      upstreamVersion: "21.7.0",
      sourceUrl: `https://github.com/gotgenes/pi-packages/blob/${fixture.first.upstream.commit}/packages/pi-subagents-worktrees`,
    });
  });

  it("rejects registering an old upstream working manifest as the fork", () => {
    fixture.writeManifest(
      WORKTREES.directory,
      WORKTREES.upstream.name,
      "1.0.1",
    );
    const file = path.join(fixture.repo.dir, "release-packages.json");
    writeFileSync(file, JSON.stringify(fixture.registry));
    expect(() => readReleasePackages(file, fixture.repo.dir)).toThrow(
      /registered package pi-subagents-worktrees npm name does not match registration/,
    );
  });

  it.each([
    "packages/pi-subagents",
    "packages/./pi-subagents-worktrees",
    "packages/pi-subagents-worktrees/",
    "packages/../pi-subagents-worktrees",
  ])("rejects a crossed or nonexact direct upstream path %s", (directory) => {
    const registry = structuredClone(fixture.registry);
    registry.packages[0].upstream.directory = directory;
    expect(() => validateReleasePackages(registry)).toThrow(
      /invalid identity, repository, or package path/,
    );
  });

  it("does not open an unrestricted fork route", () => {
    const registry = structuredClone(fixture.registry);
    registry.packages[0].directory = "other-fork";
    registry.packages[0].upstream.directory = "packages/other-fork";
    expect(() => validateReleasePackages(registry)).toThrow(
      /no supported evidence route/,
    );
  });
});
