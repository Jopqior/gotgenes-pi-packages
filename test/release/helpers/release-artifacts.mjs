import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createScratchReleaseRepository } from "./git-repository.mjs";

export const FORK = {
  directory: "pi-subagents",
  name: "@jopqior/pi-subagents",
  kind: "fork",
  upstream: {
    name: "@gotgenes/pi-subagents",
    repository: "gotgenes/pi-packages",
    directory: "packages/pi-subagents",
  },
  evidence: "core-sync",
};
export const ORIGINAL = {
  directory: "pi-subagents-model-selector",
  name: "@jopqior/pi-subagents-model-selector",
  kind: "original",
};

/**
 * Real local Git objects with separate upstream and fork manifest identities.
 * Unlike the version-decision fixture, each fork tag claims its fork version.
 */
export function createReleaseArtifacts() {
  const repo = createScratchReleaseRepository({ pkg: "pi-subagents" });
  const registry = { schemaVersion: 1, packages: [FORK, ORIGINAL] };
  repo.commitOutOfScope("docs: establish history");
  const first = publishFixtureRelease("1.0.0", "21.7.0");
  const second = publishFixtureRelease("1.0.1", "21.7.1");
  const state = { schemaVersion: 1, releases: [first, second], syncs: [] };
  writeManifest(ORIGINAL.directory, ORIGINAL.name, "0.1.0");
  repo.git("add", ".");
  repo.git("commit", "-m", "chore: add original package");
  repo.git("tag", "pi-subagents-model-selector-v0.1.0");

  function writeManifest(directory, name, version) {
    const file = path.join(repo.dir, "packages", directory, "package.json");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify({ name, version }, null, 2)}\n`);
  }

  function publishFixtureRelease(version, upstreamVersion) {
    repo.git("checkout", "-b", `upstream-${upstreamVersion}`);
    writeManifest("pi-subagents", FORK.upstream.name, upstreamVersion);
    repo.git("add", ".");
    repo.git("commit", "-m", `chore: upstream ${upstreamVersion}`);
    const upstreamCommit = repo.gitOut("rev-parse", "HEAD");
    repo.git("checkout", "main");
    repo.git(
      "merge",
      "--no-ff",
      "-m",
      "chore: integrate upstream",
      `upstream-${upstreamVersion}`,
    );
    const upstreamTip = upstreamCommit;
    writeManifest(FORK.directory, FORK.name, version);
    repo.git("add", ".");
    repo.git("commit", "-m", `chore: fork ${version}`);
    const forkTag = `pi-subagents-v${version}`;
    repo.git("tag", "-a", forkTag, "-m", `fork ${version}`);
    return {
      forkTag,
      upstream: { version: upstreamVersion, commit: upstreamCommit },
      upstreamTip,
    };
  }

  return {
    repo,
    registry,
    state,
    first,
    second,
    writeManifest,
    dispose: () => repo.dispose(),
  };
}
