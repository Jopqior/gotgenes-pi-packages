import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  coreCommitsBetween,
  isAncestorOf,
  runGit,
} from "../../scripts/release/core-sync-evidence.mjs";
import { readCoreSyncState } from "../../scripts/release/core-sync-state.mjs";
import {
  readReleasePackages,
  requireReleasePackage,
  resolvePublishedCorrespondence,
} from "../../scripts/release/release-correspondence.mjs";

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const stateFile = path.join(repo, "scripts/release/core-sync-state.json");
const registryFile = path.join(repo, "scripts/release/release-packages.json");
const oldRelease = "b3b6159399f541fd0623f65818557dd3e707a34f";
const oldTip = "045213317de608c04a7b6052b2b843e3a0f2176f";
const newerRelease = "f918568bbb643a6145898c76c5cc225c63b5b793";
const newerTip = "edb35ee28535aac4e12431e47e440f6933911834";

// These are real local tag and upstream objects, not a synthetic scenario.
// Check each tag's own evidence rather than using today's release decision.
const historicalReleases = [
  ["pi-subagents-v1.0.0", "21.7.0", oldRelease, oldTip],
  ["pi-subagents-v1.0.1", "21.7.0", oldRelease, oldTip],
  ["pi-subagents-v1.0.2", "21.7.0", oldRelease, oldTip],
  ["pi-subagents-v2.0.0", "21.7.3", newerRelease, newerTip],
  ["pi-subagents-v3.0.0", "21.7.3", newerRelease, newerTip],
  ["pi-subagents-v4.0.0", "21.7.3", newerRelease, newerTip],
  ["pi-subagents-v4.0.1", "21.7.3", newerRelease, newerTip],
];

function expectHistoricalRecordsRetained(state) {
  const historicalTags = new Set(historicalReleases.map(([tag]) => tag));
  expect(
    state.releases.filter((release) => historicalTags.has(release.forkTag)),
  ).toEqual(
    historicalReleases.map(([forkTag, version, commit, upstreamTip]) => ({
      forkTag,
      upstream: { version, commit },
      upstreamTip,
    })),
  );
  expect(
    state.syncs.filter(
      (sync) => sync.merge === "0408aa5ff9d9811d98df17dde436e7fd45a5a3ad",
    ),
  ).toEqual([
    {
      merge: "0408aa5ff9d9811d98df17dde436e7fd45a5a3ad",
      upstream: { version: "21.7.3", commit: newerRelease },
      forkCore: {
        level: "none",
        rationale:
          "integration carried upstream 21.7.x compatibility work; conflict resolutions kept fork identity without changing the core contract",
        paths: [],
      },
    },
  ]);
}

describe("committed release identities", () => {
  it("registers the actual core fork and independent original selector", () => {
    const registry = readReleasePackages(registryFile, repo);
    expect(requireReleasePackage(registry, "pi-subagents")).toEqual({
      directory: "pi-subagents",
      name: "@jopqior/pi-subagents",
      kind: "fork",
      upstream: {
        name: "@gotgenes/pi-subagents",
        repository: "gotgenes/pi-packages",
        directory: "packages/pi-subagents",
      },
      evidence: "core-sync",
    });
    expect(
      requireReleasePackage(registry, "pi-subagents-model-selector"),
    ).toEqual({
      directory: "pi-subagents-model-selector",
      name: "@jopqior/pi-subagents-model-selector",
      kind: "original",
    });
  });
});

describe("recorded correspondence against real Git history", () => {
  it("retains historical correspondence and sync reviews while verifying every committed row", () => {
    const state = readCoreSyncState(stateFile);
    const registry = readReleasePackages(registryFile, repo);
    expectHistoricalRecordsRetained(state);
    expect(state.releases.map((release) => release.forkTag).toSorted()).toEqual(
      runGit(repo, "tag", "--list", "pi-subagents-v*").split("\n"),
    );
    for (const release of state.releases) {
      expect(
        resolvePublishedCorrespondence({
          repo,
          tag: release.forkTag,
          registry,
          state,
        }),
      ).toEqual({
        kind: "fork",
        upstreamPackage: "@gotgenes/pi-subagents",
        upstreamVersion: release.upstream.version,
        sourceUrl: `https://github.com/gotgenes/pi-packages/blob/${release.upstream.commit}/packages/pi-subagents`,
      });
    }
  });

  it("allows additive future correspondence and reviewed sync records", () => {
    const state = readCoreSyncState(stateFile);
    // Synthetic additions probe the open inventory, not claim a real future tag.
    const projected = {
      ...state,
      releases: [
        ...state.releases,
        {
          forkTag: "pi-subagents-v4.0.2",
          upstream: { version: "21.7.3", commit: newerRelease },
          upstreamTip: newerTip,
        },
      ],
      syncs: [...state.syncs, { ...state.syncs[0], merge: "f".repeat(40) }],
    };
    expectHistoricalRecordsRetained(projected);
  });

  it.each(historicalReleases)(
    "%s binds its own upstream release, manifest, ancestry, and empty in-scope tail",
    (tag, version, releaseCommit, upstreamTip) => {
      const state = readCoreSyncState(stateFile);
      const registry = readReleasePackages(registryFile, repo);
      const row = state.releases.find((record) => record.forkTag === tag);
      const peeled = runGit(repo, "rev-parse", "--verify", `${tag}^{commit}`);
      const forkManifest = JSON.parse(
        runGit(repo, "show", `${peeled}:packages/pi-subagents/package.json`),
      );
      const upstreamManifest = JSON.parse(
        runGit(
          repo,
          "show",
          `${releaseCommit}:packages/pi-subagents/package.json`,
        ),
      );
      expect(forkManifest.name).toBe("@jopqior/pi-subagents");
      expect(forkManifest.version).toBe(tag.slice("pi-subagents-v".length));
      expect(upstreamManifest.name).toBe("@gotgenes/pi-subagents");
      expect(upstreamManifest.version).toBe(version);
      expect(isAncestorOf(repo, releaseCommit, upstreamTip)).toBe(true);
      expect(isAncestorOf(repo, releaseCommit, peeled)).toBe(true);
      expect(isAncestorOf(repo, upstreamTip, peeled)).toBe(true);
      expect(coreCommitsBetween(repo, releaseCommit, upstreamTip)).toEqual([]);
      expect(
        resolvePublishedCorrespondence({ repo, tag, registry, state }),
      ).toEqual({
        kind: "fork",
        upstreamPackage: "@gotgenes/pi-subagents",
        upstreamVersion: version,
        sourceUrl: `https://github.com/gotgenes/pi-packages/blob/${releaseCommit}/packages/pi-subagents`,
      });
      expect(row).toEqual({
        forkTag: tag,
        upstream: { version, commit: releaseCommit },
        upstreamTip,
      });
    },
  );

  it("does not assign inherited upstream correspondence to selector releases", () => {
    const state = readCoreSyncState(stateFile);
    const registry = readReleasePackages(registryFile, repo);
    expect(
      resolvePublishedCorrespondence({
        repo,
        tag: "pi-subagents-model-selector-v2.0.0",
        registry,
        state,
      }),
    ).toEqual({ kind: "original" });
  });
});
