import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { requireForkSyncTarget } from "../../../scripts/release/fork-sync-targets.mjs";
import { createScratchReleaseRepository } from "./git-repository.mjs";
import { FORK, ORIGINAL } from "./release-artifacts.mjs";

export const WORKTREES = {
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

// Bounded combined-selection history; deliberately unlike the single-fork
// decision and published-artifact fixtures, both forks coexist here.
export function createMultiForkScenario() {
  const repo = createScratchReleaseRepository();
  const registry = { schemaVersion: 2, packages: [FORK, WORKTREES, ORIGINAL] };
  const forks = [FORK, WORKTREES];
  const versions = {
    "pi-subagents": {
      fork: "1.0.0",
      upstream: "21.7.0",
      nextUpstream: "21.8.0",
      next: "1.1.0",
    },
    "pi-subagents-worktrees": {
      fork: "0.1.0",
      upstream: "0.3.3",
      nextUpstream: "0.3.4",
      next: "0.1.1",
    },
  };
  const states = {};
  const upstream = {};
  repo.commitOutOfScope("docs: establish combined history");
  repo.git("checkout", "-b", "upstream-line");
  for (const registration of forks) {
    const directory = registration.directory;
    writeManifest(
      directory,
      registration.upstream.name,
      versions[directory].upstream,
    );
    repo.commitInScope(
      `feat(${directory}): initial upstream`,
      `packages/${directory}/source.txt`,
    );
    upstream[directory] = repo.gitOut("rev-parse", "HEAD");
  }
  const initialTip = repo.gitOut("rev-parse", "HEAD");
  repo.git("checkout", "main");
  repo.git(
    "merge",
    "--no-ff",
    "-m",
    "chore: incorporate initial upstream",
    "upstream-line",
  );
  repo.copyReleaseScripts(
    "lib.sh",
    "next-version.sh",
    "prepare-release.sh",
    "publish-released.sh",
    "create-github-releases.sh",
    "fork-sync.mjs",
    "fork-sync-targets.mjs",
    "pi-subagents/config.mjs",
    "pi-subagents-worktrees/config.mjs",
    "fork-sync/values.mjs",
    "fork-sync/state.mjs",
    "fork-sync/evidence.mjs",
    "fork-sync/cliff.mjs",
    "fork-sync/decision.mjs",
    "release-correspondence.mjs",
    "correspondence-table.mjs",
    "release-artifacts.mjs",
  );
  write(
    "scripts/release/release-packages.json",
    `${JSON.stringify(registry, null, 2)}\n`,
  );
  for (const registration of forks) {
    const directory = registration.directory;
    const version = versions[directory].fork;
    writeManifest(directory, registration.name, version);
    states[directory] = {
      schemaVersion: 2,
      releases: [
        {
          forkTag: `${directory}-v${version}`,
          upstream: {
            version: versions[directory].upstream,
            commit: upstream[directory],
          },
          upstreamTip: initialTip,
        },
      ],
      syncs: [],
    };
    write(
      requireForkSyncTarget(directory).statePath,
      `${JSON.stringify(states[directory], null, 2)}\n`,
    );
    write(
      requireForkSyncTarget(directory).correspondencePath,
      `# ${directory}\n\nKeep preface.\n\n<!-- release-correspondence:start -->\n\nold ${directory}\n\n<!-- release-correspondence:end -->\n\nKeep suffix.\n`,
    );
    repo.writeChangelog(
      directory,
      `# Changelog\n\n## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v0.0.0...${directory}-v${version}) (2026-09-01)\n\nHistorical ${directory} bytes.\n`,
    );
  }
  writeManifest(ORIGINAL.directory, ORIGINAL.name, "2.0.0");
  repo.writeChangelog(
    ORIGINAL.directory,
    `# Changelog\n\n## [2.0.0](https://github.com/Jopqior/gotgenes-pi-packages/compare/${ORIGINAL.directory}-v1.9.0...${ORIGINAL.directory}-v2.0.0) (2026-09-01)\n\nHistorical original bytes.\n`,
  );
  repo.git("add", "-A");
  repo.git(
    "commit",
    "-m",
    "chore(release): establish independent fork artifacts",
  );
  for (const registration of forks)
    repo.git(
      "tag",
      "-a",
      `${registration.directory}-v${versions[registration.directory].fork}`,
      "-m",
      "baseline fork",
    );
  repo.git("tag", `${ORIGINAL.directory}-v2.0.0`);
  repo.git("checkout", "upstream-line");
  for (const registration of forks) {
    const directory = registration.directory;
    writeManifest(
      directory,
      registration.upstream.name,
      versions[directory].nextUpstream,
    );
    repo.commitInScope(
      `feat(${directory})!: upstream release change`,
      `packages/${directory}/next.txt`,
    );
    upstream[directory] = repo.gitOut("rev-parse", "HEAD");
  }
  const tip = repo.gitOut("rev-parse", "HEAD");
  repo.git("checkout", "main");
  repo.git("merge", "--no-ff", "--no-commit", "-X", "ours", "upstream-line");
  for (const registration of forks)
    writeManifest(
      registration.directory,
      registration.name,
      versions[registration.directory].fork,
    );
  repo.git("add", "-A");
  repo.git(
    "commit",
    "-m",
    "chore: integrate independently reviewed upstream releases",
  );
  const merge = repo.gitOut("rev-parse", "HEAD");
  for (const registration of forks) {
    const directory = registration.directory;
    states[directory].syncs.push({
      merge,
      upstream: {
        version: versions[directory].nextUpstream,
        commit: upstream[directory],
      },
      forkContribution: {
        level: "none",
        rationale: `reviewed ${directory} independently`,
        paths: [],
      },
    });
    write(
      requireForkSyncTarget(directory).statePath,
      `${JSON.stringify(states[directory], null, 2)}\n`,
    );
  }
  repo.commitInScope(
    `fix(${ORIGINAL.directory}): original improvement`,
    `packages/${ORIGINAL.directory}/fix.txt`,
  );
  const origin = repo.addLocalOrigin();

  function write(relative, text) {
    const file = path.join(repo.dir, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  function writeManifest(directory, name, version) {
    write(
      `packages/${directory}/package.json`,
      `${JSON.stringify({ name, version }, null, 2)}\n`,
    );
  }
  function files(directory) {
    const target =
      directory === ORIGINAL.directory
        ? null
        : requireForkSyncTarget(directory);
    return [
      `packages/${directory}/package.json`,
      `packages/${directory}/CHANGELOG.md`,
      ...(target ? [target.statePath, target.correspondencePath] : []),
    ];
  }
  function bytes(directory) {
    return Object.fromEntries(
      files(directory).map((file) => [
        file,
        readFileSync(path.join(repo.dir, file)),
      ]),
    );
  }
  function refs() {
    return repo.gitOut("for-each-ref", "--format=%(refname) %(objectname)");
  }
  function remoteRefs() {
    return execFileSync(
      "git",
      ["for-each-ref", "--format=%(refname) %(objectname)"],
      { cwd: origin, encoding: "utf8" },
    );
  }
  return {
    repo,
    registry,
    forks,
    versions,
    states,
    upstream,
    tip,
    merge,
    write,
    files,
    bytes,
    refs,
    remoteRefs,
    dispose: () => repo.dispose(),
  };
}
