// Provenance resolution at release artifact boundaries. Registration is an
// explicit classification, never inferred from the workspace or dependencies.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  runGit,
  verifyPublishedCoreCorrespondence,
  verifyPublishedCoreTail,
} from "./core-sync-evidence.mjs";
import { CoreSyncError, parseStrictSemVer } from "./core-sync-values.mjs";

/**
 * Render a single bounded claim from verified provenance; originals have no
 * upstream release to claim.
 *
 * @param {{ kind: "original" } | { kind: "fork", upstreamPackage: string, upstreamVersion: string, sourceUrl: string }} provenance
 * @returns {string}
 */
export function renderUpstreamCorrespondence(provenance) {
  if (provenance.kind === "original") {
    return "";
  }
  return (
    "<!-- upstream-correspondence:start -->\n" +
    "### Upstream correspondence\n\n" +
    `Direct upstream package: \`${provenance.upstreamPackage}\`  \n` +
    `Incorporated upstream release: \`${provenance.upstreamVersion}\`  \n` +
    `Source: [fixed upstream release commit](${provenance.sourceUrl})\n\n` +
    "This records incorporated source provenance, not behavioral equivalence or the identity of historical npm artifacts.\n" +
    "<!-- upstream-correspondence:end -->"
  );
}

/**
 * Read the exact tagged fork section without trimming Git's stdout. An
 * inherited upstream section with the same version is not a match.
 *
 * @param {{ repo: string, tag: string, packageDirectory: string }} input
 * @returns {string}
 */
export function readTaggedReleaseSection(input) {
  const { repo, tag, packageDirectory } = input;
  if (
    !/^[a-z][a-z0-9-]*$/.test(packageDirectory) ||
    !tag.startsWith(`${packageDirectory}-v`) ||
    !parseStrictSemVer(tag.slice(`${packageDirectory}-v`.length))
  ) {
    throw new CoreSyncError(`invalid package release tag ${tag}`);
  }
  let text;
  try {
    text = execFileSync(
      "git",
      ["show", `${tag}:packages/${packageDirectory}/CHANGELOG.md`],
      { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    throw new CoreSyncError(
      `cannot read tagged CHANGELOG for ${tag}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return findReleaseSection(text, tag, packageDirectory);
}

/**
 * Match the section in already-rendered text before a new tag exists.
 * @param {string} text
 * @param {string} tag
 * @param {string} directory
 * @returns {string}
 */
export function findReleaseSection(text, tag, directory) {
  const version = tag.slice(`${directory}-v`.length);
  const headings = [];
  let fence = null;
  let offset = 0;
  for (const match of text.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)) {
    const entireLine = match[0];
    if (!entireLine) {
      continue;
    }
    const line = entireLine.replace(/\r\n$|[\r\n]$/, "");
    if (fence) {
      const closing = /^ {0,3}(`+|~+)[ \t]*$/.exec(line);
      if (
        closing &&
        closing[1][0] === fence.character &&
        closing[1].length >= fence.length
      ) {
        fence = null;
      }
    } else {
      const opening = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (opening) {
        fence = { character: opening[1][0], length: opening[1].length };
      } else if (line.startsWith("## ")) {
        const heading =
          /^## \[(\d+\.\d+\.\d+)\]\(https:\/\/github\.com\/Jopqior\/gotgenes-pi-packages\/compare\/([^)]*)\) \([^\r\n]*\)[ \t]*$/.exec(
            line,
          );
        const previous = heading?.[2].split("...");
        headings.push({
          start: offset,
          matches:
            heading?.[1] === version &&
            previous?.length === 2 &&
            previous[0].startsWith(`${directory}-v`) &&
            parseStrictSemVer(previous[0].slice(`${directory}-v`.length)) !==
              null &&
            previous[1] === tag,
        });
      }
    }
    offset += entireLine.length;
  }
  if (fence) {
    throw new CoreSyncError(
      `unclosed Markdown fence in tagged CHANGELOG ${tag}`,
    );
  }
  const matches = headings.filter((heading) => heading.matches);
  if (matches.length !== 1) {
    throw new CoreSyncError(
      `${matches.length === 0 ? "missing" : "ambiguous"} exact fork section for ${tag}`,
    );
  }
  const next = headings.find((heading) => heading.start > matches[0].start);
  return text.slice(matches[0].start, next?.start ?? text.length);
}

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
