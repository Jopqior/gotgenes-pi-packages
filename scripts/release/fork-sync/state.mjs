// Strict schema validation and reading for committed fork sync evidence.
// Correspondence is recorded evidence, never inferred from manifests or
// newest tags; the reader rejects anything it cannot verify exactly.

import { readFileSync } from "node:fs";

import { ForkSyncError, isReleaseLevel, parseStrictSemVer } from "./values.mjs";

/** @typedef {{ version: string, commit: string }} UpstreamRelease */
/** @typedef {{ level: import("./values.mjs").ReleaseLevel, rationale: string, paths: string[] }} ForkContribution */
/** @typedef {{ forkTag: string, upstream: UpstreamRelease, upstreamTip: string }} ForkReleaseRecord */
/** @typedef {{ merge: string, upstream: UpstreamRelease, forkContribution: ForkContribution }} ForkSyncRecord */
/** @typedef {{ schemaVersion: 2, releases: ForkReleaseRecord[], syncs: ForkSyncRecord[] }} ForkSyncState */

const OID_PATTERN = /^[0-9a-f]{40}$/;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isFullOid(value) {
  return typeof value === "string" && OID_PATTERN.test(value);
}

/**
 * @param {unknown} value
 * @param {string} what
 * @returns {string}
 */
function requireOid(value, what) {
  if (!isFullOid(value)) {
    throw new ForkSyncError(
      `${what} is not a full 40-hex object ID: ${JSON.stringify(value)}`,
    );
  }
  return value;
}

/**
 * @param {unknown} value
 * @param {string} what
 * @returns {UpstreamRelease}
 */
function requireUpstreamRelease(value, what) {
  if (typeof value !== "object" || value === null) {
    throw new ForkSyncError(`${what} must be an object`);
  }
  const record = /** @type {Record<string, unknown>} */ (value);
  rejectUnknownKeys(record, ["version", "commit"], what);
  if (!parseStrictSemVer(record.version)) {
    throw new ForkSyncError(
      `${what}.version is not a strict stable SemVer version: ${JSON.stringify(record.version)}`,
    );
  }
  return {
    version: /** @type {string} */ (record.version),
    commit: requireOid(record.commit, `${what}.commit`),
  };
}

/**
 * @param {Record<string, unknown>} record
 * @param {string[]} allowed
 * @param {string} what
 */
function rejectUnknownKeys(record, allowed, what) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw new ForkSyncError(`unknown ${what} field '${key}'`);
    }
  }
}

/**
 * Strictly validate evidence for the selected package. Rejects unknown schema
 * versions, fields, malformed tags/versions/OIDs, duplicate entries, and
 * contributions whose recorded paths contradict their level.
 *
 * @param {unknown} value
 * @param {string} packageDirectory
 * @returns {ForkSyncState}
 */
export function validateForkSyncState(value, packageDirectory) {
  const tagPrefix = `${packageDirectory}-v`;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ForkSyncError("fork sync state must be a JSON object");
  }
  const document = /** @type {Record<string, unknown>} */ (value);
  rejectUnknownKeys(document, ["schemaVersion", "releases", "syncs"], "state");
  if (document.schemaVersion !== 2) {
    throw new ForkSyncError(
      `unsupported fork sync state schema version: ${JSON.stringify(document.schemaVersion)} (expected 2)`,
    );
  }
  if (!Array.isArray(document.releases) || !Array.isArray(document.syncs)) {
    throw new ForkSyncError(
      "fork sync state 'releases' and 'syncs' must be arrays",
    );
  }

  /** @type {ForkReleaseRecord[]} */
  const releases = [];
  const seenReleaseTags = new Set();
  for (const [index, entry] of document.releases.entries()) {
    const what = `releases[${index}]`;
    if (typeof entry !== "object" || entry === null) {
      throw new ForkSyncError(`${what} must be an object`);
    }
    const record = /** @type {Record<string, unknown>} */ (entry);
    rejectUnknownKeys(record, ["forkTag", "upstream", "upstreamTip"], what);
    if (
      typeof record.forkTag !== "string" ||
      !record.forkTag.startsWith(tagPrefix) ||
      !parseStrictSemVer(record.forkTag.slice(tagPrefix.length))
    ) {
      throw new ForkSyncError(
        `${what}.forkTag is not a ${tagPrefix}<SemVer> tag: ${JSON.stringify(record.forkTag)}`,
      );
    }
    if (seenReleaseTags.has(record.forkTag)) {
      throw new ForkSyncError(`duplicate release record for ${record.forkTag}`);
    }
    seenReleaseTags.add(record.forkTag);
    releases.push({
      forkTag: record.forkTag,
      upstream: requireUpstreamRelease(record.upstream, `${what}.upstream`),
      upstreamTip: requireOid(record.upstreamTip, `${what}.upstreamTip`),
    });
  }

  /** @type {ForkSyncRecord[]} */
  const syncs = [];
  const seenMerges = new Set();
  for (const [index, entry] of document.syncs.entries()) {
    const what = `syncs[${index}]`;
    if (typeof entry !== "object" || entry === null) {
      throw new ForkSyncError(`${what} must be an object`);
    }
    const record = /** @type {Record<string, unknown>} */ (entry);
    rejectUnknownKeys(record, ["merge", "upstream", "forkContribution"], what);
    const merge = requireOid(record.merge, `${what}.merge`);
    if (seenMerges.has(merge)) {
      throw new ForkSyncError(`duplicate sync record for merge ${merge}`);
    }
    seenMerges.add(merge);
    const forkContribution = record.forkContribution;
    if (typeof forkContribution !== "object" || forkContribution === null) {
      throw new ForkSyncError(`${what}.forkContribution must be an object`);
    }
    const contribution = /** @type {Record<string, unknown>} */ (
      forkContribution
    );
    rejectUnknownKeys(
      contribution,
      ["level", "rationale", "paths"],
      `${what}.forkContribution`,
    );
    if (!isReleaseLevel(contribution.level)) {
      throw new ForkSyncError(
        `${what}.forkContribution.level is not a release level: ${JSON.stringify(contribution.level)}`,
      );
    }
    if (
      typeof contribution.rationale !== "string" ||
      !contribution.rationale.trim()
    ) {
      throw new ForkSyncError(
        `${what}.forkContribution.rationale must be a non-empty string`,
      );
    }
    if (!Array.isArray(contribution.paths)) {
      throw new ForkSyncError(
        `${what}.forkContribution.paths must be an array`,
      );
    }
    /** @type {string[]} */
    const paths = [];
    for (const [pathIndex, file] of contribution.paths.entries()) {
      if (
        typeof file !== "string" ||
        !file.startsWith(`packages/${packageDirectory}/`)
      ) {
        throw new ForkSyncError(
          `${what}.forkContribution.paths[${pathIndex}] is not a package path: ${JSON.stringify(file)}`,
        );
      }
      paths.push(file);
    }
    if (contribution.level !== "none" && paths.length === 0) {
      throw new ForkSyncError(
        `${what}.forkContribution records level ${contribution.level} with no changed package paths`,
      );
    }
    if (contribution.level === "none" && paths.length > 0) {
      throw new ForkSyncError(
        `${what}.forkContribution records level none with changed package paths`,
      );
    }
    syncs.push({
      merge,
      upstream: requireUpstreamRelease(record.upstream, `${what}.upstream`),
      forkContribution: {
        level: contribution.level,
        rationale: contribution.rationale,
        paths,
      },
    });
  }

  return { schemaVersion: 2, releases, syncs };
}

/**
 * Read and strictly validate the state document at `statePath`.
 *
 * @param {string} statePath
 * @param {string} packageDirectory
 * @returns {ForkSyncState}
 */
export function readForkSyncState(statePath, packageDirectory) {
  let raw;
  try {
    raw = readFileSync(statePath, "utf8");
  } catch (error) {
    throw new ForkSyncError(
      `cannot read fork sync state ${statePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ForkSyncError(
      `fork sync state ${statePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return validateForkSyncState(parsed, packageDirectory);
}
