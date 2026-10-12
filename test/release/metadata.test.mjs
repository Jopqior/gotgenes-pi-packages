import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import {
  readReleasePackages,
  requireReleasePackage,
  requireTaggedReleasePackage,
  validateReleasePackages,
} from "../../scripts/release/release-metadata.mjs";
import { createTaggedReleaseRepository } from "./helpers/git-repository.mjs";

const original = {
  directory: "demo",
  name: "@jopqior/demo",
  kind: "original",
};
const fork = {
  directory: "another-fork",
  name: "@jopqior/another-fork",
  kind: "fork",
  upstream: {
    name: "@someone/upstream",
    repository: "someone/upstream-repo",
    directory: "packages/upstream",
  },
};
const registry = (packages = [original, fork]) => ({
  schemaVersion: 3,
  packages,
});

function writeManifest(dir, directory, manifest) {
  const folder = path.join(dir, "packages", directory);
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "package.json"), JSON.stringify(manifest));
}

function writeRegistry(dir, value) {
  const file = path.join(dir, "release-packages.json");
  writeFileSync(file, JSON.stringify(value));
  return file;
}

function taggedPackage(
  manifest = { name: original.name, version: "1.2.3" },
  annotated = false,
) {
  const repo = createTaggedReleaseRepository();
  writeManifest(repo.dir, "demo", manifest);
  repo.git("add", ".");
  repo.git("commit", "-m", "test: tagged manifest");
  if (annotated) repo.git("tag", "-a", "demo-v1.2.3", "-m", "annotated");
  else repo.git("tag", "demo-v1.2.3");
  return repo;
}

describe("explicit release registration", () => {
  it("accepts schema 3 originals and forks without package-specific configuration", () => {
    expect(validateReleasePackages(registry())).toEqual({
      schemaVersion: 3,
      packages: [original, fork],
    });
    expect(requireReleasePackage(registry(), "another-fork")).toEqual(fork);
  });

  it.each([
    [
      "old schema",
      { schemaVersion: 2, packages: [original] },
      /schemaVersion 3/,
    ],
    ["missing schema", { packages: [] }, /schemaVersion 3/],
    [
      "non-array packages",
      { schemaVersion: 3, packages: {} },
      /packages array/,
    ],
    ["non-object registry", null, /must be an object/],
    [
      "unknown registry field",
      { ...registry(), evidence: "fork-sync" },
      /unknown/,
    ],
    [
      "old evidence field",
      registry([{ ...fork, evidence: "fork-sync" }]),
      /unknown/,
    ],
    [
      "unsupported kind",
      registry([{ ...original, kind: "workspace" }]),
      /unsupported kind/,
    ],
    [
      "missing kind",
      registry([{ directory: "demo", name: original.name }]),
      /unsupported kind/,
    ],
    [
      "missing name",
      registry([{ directory: "demo", kind: "original" }]),
      /scoped npm/,
    ],
    ["unscoped name", registry([{ ...original, name: "demo" }]), /scoped npm/],
    [
      "missing directory",
      registry([{ name: original.name, kind: "original" }]),
      /without traversal/,
    ],
    [
      "missing upstream",
      registry([{ directory: fork.directory, name: fork.name, kind: "fork" }]),
      /must be an object/,
    ],
    [
      "upstream on original",
      registry([{ ...original, upstream: fork.upstream }]),
      /unknown/,
    ],
    [
      "unknown package field",
      registry([{ ...original, extra: true }]),
      /unknown/,
    ],
  ])("rejects %s", (_label, value, error) => {
    expect(() => validateReleasePackages(value)).toThrow(error);
  });

  it.each([
    "../demo",
    "packages/demo",
    "/demo",
    "demo/child",
    "demo\\child",
    "Demo",
    "",
  ])("rejects malformed or traversal directory %j", (directory) => {
    expect(() =>
      validateReleasePackages(registry([{ ...original, directory }])),
    ).toThrow(/without traversal/);
  });

  it.each([
    ["directory", { ...original, name: "@jopqior/other" }],
    ["npm identity", { ...original, directory: "other" }],
  ])("rejects duplicate %s", (_label, duplicate) => {
    expect(() =>
      validateReleasePackages(registry([original, duplicate])),
    ).toThrow(/duplicates/);
  });

  it.each([
    ["name", "upstream"],
    ["name", undefined],
    ["repository", "https://github.com/someone/repo"],
    ["repository", "../repo"],
    ["repository", undefined],
    ["directory", "packages/../upstream"],
    ["directory", "../upstream"],
    ["directory", "packages/upstream/child"],
    ["directory", "packages\\upstream"],
    ["directory", undefined],
  ])("rejects invalid upstream %s %j", (field, value) => {
    expect(() =>
      validateReleasePackages(
        registry([{ ...fork, upstream: { ...fork.upstream, [field]: value } }]),
      ),
    ).toThrow(/invalid identity, repository, or package path/);
  });

  it("rejects unknown upstream fields", () => {
    expect(() =>
      validateReleasePackages(
        registry([
          { ...fork, upstream: { ...fork.upstream, evidence: "fork-sync" } },
        ]),
      ),
    ).toThrow(/unknown/);
  });

  it("checks working manifest identity against explicit registration", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "release-metadata-"));
    try {
      writeManifest(dir, "demo", { name: original.name, version: "1.2.3" });
      const file = writeRegistry(dir, registry([original]));
      expect(readReleasePackages(file, dir)).toEqual(registry([original]));
      writeManifest(dir, "demo", { name: "@gotgenes/demo", version: "1.2.3" });
      expect(() => readReleasePackages(file, dir)).toThrow(
        /npm name does not match registration/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not infer registration from an unregistered workspace", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "release-metadata-"));
    try {
      writeManifest(dir, "demo", { name: original.name, version: "1.2.3" });
      const file = writeRegistry(dir, registry([]));
      const empty = readReleasePackages(file, dir);
      expect(empty).toEqual(registry([]));
      expect(() => requireReleasePackage(empty, "demo")).toThrow(
        /no release package registration/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects an unregistered tag before reading Git", () => {
    expect(() =>
      requireTaggedReleasePackage({
        repo: "/does-not-exist",
        registry: registry([]),
        tag: "demo-v1.2.3",
      }),
    ).toThrow(/no release package registration/);
  });

  it("fails on missing or malformed registered manifests and unreadable registry", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "release-metadata-"));
    try {
      const file = writeRegistry(dir, registry([original]));
      expect(() => readReleasePackages(file, dir)).toThrow(
        /cannot read registered package demo manifest/,
      );
      writeManifest(dir, "demo", []);
      expect(() => readReleasePackages(file, dir)).toThrow(
        /invalid .* manifest/,
      );
      writeFileSync(path.join(dir, "packages/demo/package.json"), "{");
      expect(() => readReleasePackages(file, dir)).toThrow(
        /invalid .* manifest/,
      );
      writeFileSync(file, "{");
      expect(() => readReleasePackages(file, dir)).toThrow(
        /cannot read release package registry/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("tagged release identity", () => {
  it.each([false, true])(
    "reads exact tag, not HEAD (annotated=%s)",
    (annotated) => {
      const repo = taggedPackage(undefined, annotated);
      try {
        writeManifest(repo.dir, "demo", {
          name: "@wrong/head",
          version: "9.9.9",
        });
        repo.git("add", ".");
        repo.git("commit", "-m", "test: moving HEAD");
        expect(
          requireTaggedReleasePackage({
            repo: repo.dir,
            registry: registry([original]),
            tag: "demo-v1.2.3",
          }),
        ).toEqual(original);
      } finally {
        repo.dispose();
      }
    },
  );

  it.each([
    [
      "npm name",
      { name: "@gotgenes/demo", version: "1.2.3" },
      /npm name does not match registration/,
    ],
    [
      "version",
      { name: original.name, version: "1.2.4" },
      /manifest version does not match tag/,
    ],
  ])("rejects tagged %s mismatch", (_label, manifest, error) => {
    const repo = taggedPackage(manifest);
    try {
      expect(() =>
        requireTaggedReleasePackage({
          repo: repo.dir,
          registry: registry([original]),
          tag: "demo-v1.2.3",
        }),
      ).toThrow(error);
    } finally {
      repo.dispose();
    }
  });

  it.each([
    "../demo-v1.2.3",
    "demo-v01.2.3",
    "demo-v1.2.3-beta",
    "demo-v1.2.3+build",
    "demo-v9007199254740992.0.0",
    "demo-v1.2",
    "--help",
  ])("rejects malformed tag %j before reading Git", (tag) => {
    expect(() =>
      requireTaggedReleasePackage({
        repo: "/does-not-exist",
        registry: registry([original]),
        tag,
      }),
    ).toThrow(/invalid package release tag/);
  });

  it("fails when a selected tag or tagged manifest is unavailable", () => {
    const repo = createTaggedReleaseRepository();
    try {
      repo.git("commit", "--allow-empty", "-m", "test: no package");
      repo.git("tag", "demo-v1.2.3");
      expect(() =>
        requireTaggedReleasePackage({
          repo: repo.dir,
          registry: registry([original]),
          tag: "demo-v1.2.3",
        }),
      ).toThrow(/cannot read tagged .* manifest/);
      expect(() =>
        requireTaggedReleasePackage({
          repo: repo.dir,
          registry: registry([original]),
          tag: "demo-v1.2.4",
        }),
      ).toThrow(/cannot read tagged .* manifest/);
    } finally {
      repo.dispose();
    }
  });
});
