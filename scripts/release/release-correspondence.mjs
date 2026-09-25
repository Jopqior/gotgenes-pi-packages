// Provenance resolution at release artifact boundaries. Registration is an
// explicit classification, never inferred from the workspace or dependencies.
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  runGit,
  verifyPublishedCoreCorrespondence,
  verifyPublishedCoreTail,
} from "./core-sync-evidence.mjs";
import { CoreSyncError, parseStrictSemVer } from "./core-sync-values.mjs";

/** @typedef {{ directory: string, name: string, kind: "original" }} OriginalPackage */
/** @typedef {{ directory: string, name: string, kind: "fork", upstream: { name: string, repository: string, directory: string }, evidence: "core-sync" }} ForkPackage */
/** @typedef {OriginalPackage | ForkPackage} ReleasePackage */
/** @typedef {{ schemaVersion: 1, packages: ReleasePackage[] }} ReleaseRegistry */
/** @typedef {import("./core-sync-state.mjs").CoreReleaseRecord} CoreReleaseRecord */

/**
 * @param {string} file
 * @param {string} repo
 * @returns {ReleaseRegistry}
 */
export function readReleasePackages(file, repo) {
  let document;
  try {
    document = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new CoreSyncError(
      `cannot read release package registry ${file}: ${String(error)}`,
    );
  }
  const registry = validateReleasePackages(document);
  for (const entry of registry.packages) {
    const manifest = readWorkingManifest(repo, entry.directory);
    requireIdentity(
      manifest,
      entry.name,
      `registered package ${entry.directory}`,
    );
  }
  return registry;
}

/**
 * @param {unknown} value
 * @returns {ReleaseRegistry}
 */
export function validateReleasePackages(value) {
  const document = requireRecord(value, "release package registry");
  requireKeys(
    document,
    ["schemaVersion", "packages"],
    "release package registry",
  );
  if (document.schemaVersion !== 1 || !Array.isArray(document.packages)) {
    throw new CoreSyncError(
      "release package registry requires schemaVersion 1 and a packages array",
    );
  }
  /** @type {ReleasePackage[]} */
  const packages = [];
  const directories = new Set();
  const names = new Set();
  for (const [index, candidate] of document.packages.entries()) {
    const what = `release packages[${index}]`;
    const entry = requireRecord(candidate, what);
    if (entry.kind !== "fork" && entry.kind !== "original") {
      throw new CoreSyncError(
        `${what} has unsupported kind ${JSON.stringify(entry.kind)}`,
      );
    }
    requireKeys(
      entry,
      entry.kind === "fork"
        ? ["directory", "name", "kind", "upstream", "evidence"]
        : ["directory", "name", "kind"],
      what,
    );
    if (
      typeof entry.directory !== "string" ||
      !/^[a-z][a-z0-9-]*$/.test(entry.directory)
    ) {
      throw new CoreSyncError(
        `${what}.directory must be a package directory name without traversal`,
      );
    }
    if (
      typeof entry.name !== "string" ||
      !/^@[a-z0-9-]+\/[a-z][a-z0-9-]*$/.test(entry.name)
    ) {
      throw new CoreSyncError(`${what}.name must be a scoped npm package name`);
    }
    if (directories.has(entry.directory) || names.has(entry.name)) {
      throw new CoreSyncError(
        `${what} duplicates a registered directory or npm identity`,
      );
    }
    directories.add(entry.directory);
    names.add(entry.name);
    if (entry.kind === "original") {
      packages.push({
        directory: entry.directory,
        name: entry.name,
        kind: "original",
      });
      continue;
    }
    if (entry.evidence !== "core-sync" || entry.directory !== "pi-subagents") {
      throw new CoreSyncError(`${what} has no supported evidence route`);
    }
    const upstream = requireRecord(entry.upstream, `${what}.upstream`);
    requireKeys(
      upstream,
      ["name", "repository", "directory"],
      `${what}.upstream`,
    );
    if (
      typeof upstream.name !== "string" ||
      !/^@[a-z0-9-]+\/[a-z][a-z0-9-]*$/.test(upstream.name) ||
      typeof upstream.repository !== "string" ||
      !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(upstream.repository) ||
      upstream.directory !== "packages/pi-subagents"
    ) {
      throw new CoreSyncError(
        `${what}.upstream has invalid identity, repository, or package path`,
      );
    }
    packages.push({
      directory: entry.directory,
      name: entry.name,
      kind: "fork",
      upstream: {
        name: upstream.name,
        repository: upstream.repository,
        directory: upstream.directory,
      },
      evidence: "core-sync",
    });
  }
  return { schemaVersion: 1, packages };
}

/**
 * @param {ReleaseRegistry} registry
 * @param {string} directory
 * @returns {ReleasePackage}
 */
export function requireReleasePackage(registry, directory) {
  const entry = registry.packages.find(
    (candidate) => candidate.directory === directory,
  );
  if (!entry) {
    throw new CoreSyncError(`no release package registration for ${directory}`);
  }
  return entry;
}

/**
 * Resolve a published artifact against the exact tagged state record; no
 * current HEAD or sync-window decision is involved.
 *
 * @param {{ repo: string, tag: string, registry: ReleaseRegistry, state: { releases: CoreReleaseRecord[] } }} input
 * @returns {{ kind: "original" } | { kind: "fork", upstreamPackage: string, upstreamVersion: string, sourceUrl: string }}
 */
export function resolvePublishedCorrespondence(input) {
  const registration = registrationForTag(input.registry, input.tag);
  const peeled = runGit(
    input.repo,
    "rev-parse",
    "--verify",
    `${input.tag}^{commit}`,
  );
  const manifest = readTaggedManifest(
    input.repo,
    peeled,
    registration.directory,
  );
  requireIdentity(manifest, registration.name, `tag ${input.tag}`);
  requireVersion(
    manifest,
    versionFromTag(input.tag, registration.directory),
    `tag ${input.tag}`,
  );
  if (registration.kind === "original") {
    return { kind: "original" };
  }
  const release = input.state.releases.find(
    (record) => record.forkTag === input.tag,
  );
  if (!release) {
    throw new CoreSyncError(
      `no recorded upstream correspondence for ${input.tag}`,
    );
  }
  verifyPublishedCoreCorrespondence(input.repo, release, peeled);
  verifyPublishedCoreTail(input.repo, release);
  verifyUpstreamIdentity(input.repo, registration, release.upstream.commit);
  return forkProvenance(registration, release.upstream);
}

/**
 * Consume an existing verified decision at preparation HEAD, where the new
 * fork tag and versioned manifest do not yet exist.
 *
 * @param {{ repo: string, tag: string, registry: ReleaseRegistry, decision: { nextTag: string | null, upstream: { version: string, commit: string }, upstreamTip: string } | null }} input
 * @returns {{ kind: "original" } | { kind: "fork", upstreamPackage: string, upstreamVersion: string, sourceUrl: string }}
 */
export function resolvePendingCorrespondence(input) {
  const registration = registrationForTag(input.registry, input.tag);
  requireIdentity(
    readWorkingManifest(input.repo, registration.directory),
    registration.name,
    `pending package ${registration.directory}`,
  );
  if (registration.kind === "original") {
    return { kind: "original" };
  }
  if (!input.decision || input.decision.nextTag !== input.tag) {
    throw new CoreSyncError(`predicted tag does not match ${input.tag}`);
  }
  verifyUpstreamIdentity(
    input.repo,
    registration,
    input.decision.upstream.commit,
  );
  return forkProvenance(registration, input.decision.upstream);
}

function registrationForTag(registry, tag) {
  const match = /^(.*)-v(\d+\.\d+\.\d+)$/.exec(tag);
  if (!match || !parseStrictSemVer(match[2])) {
    throw new CoreSyncError(`invalid package release tag ${tag}`);
  }
  return requireReleasePackage(registry, match[1]);
}

function versionFromTag(tag, directory) {
  return tag.slice(`${directory}-v`.length);
}

function forkProvenance(registration, upstream) {
  return {
    kind: "fork",
    upstreamPackage: registration.upstream.name,
    upstreamVersion: upstream.version,
    sourceUrl: `https://github.com/${registration.upstream.repository}/blob/${upstream.commit}/${registration.upstream.directory}`,
  };
}

function verifyUpstreamIdentity(repo, registration, commit) {
  const manifest = readTaggedManifest(
    repo,
    commit,
    registration.upstream.directory.slice("packages/".length),
  );
  requireIdentity(
    manifest,
    registration.upstream.name,
    `upstream release ${commit}`,
  );
}

function readTaggedManifest(repo, commit, directory) {
  return parseManifest(
    runGit(repo, "show", `${commit}:packages/${directory}/package.json`),
    `packages/${directory} at ${commit}`,
  );
}

function readWorkingManifest(repo, directory) {
  let text;
  try {
    text = readFileSync(
      path.join(repo, "packages", directory, "package.json"),
      "utf8",
    );
  } catch (error) {
    throw new CoreSyncError(
      `cannot read registered package ${directory} manifest: ${String(error)}`,
    );
  }
  return parseManifest(text, `packages/${directory}`);
}

function parseManifest(text, what) {
  try {
    return requireRecord(JSON.parse(text), `${what} manifest`);
  } catch (error) {
    throw new CoreSyncError(`invalid ${what} manifest: ${String(error)}`);
  }
}

function requireIdentity(manifest, name, what) {
  if (manifest.name !== name) {
    throw new CoreSyncError(
      `${what} npm name does not match registration: ${JSON.stringify(manifest.name)} != ${name}`,
    );
  }
}

function requireVersion(manifest, version, what) {
  if (manifest.version !== version) {
    throw new CoreSyncError(
      `${what} manifest version does not match tag: ${JSON.stringify(manifest.version)} != ${version}`,
    );
  }
}

function requireRecord(value, what) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CoreSyncError(`${what} must be an object`);
  }
  return value;
}

function requireKeys(record, allowed, what) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw new CoreSyncError(`unknown ${what} field '${key}'`);
    }
  }
}
