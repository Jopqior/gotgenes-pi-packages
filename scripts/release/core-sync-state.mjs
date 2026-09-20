// The committed evidence document for the core sync release policy: the core
// package identity, the strict schema validator, and the strict reader.
// Correspondence is recorded evidence, never inferred from manifests or
// newest tags; the reader rejects anything it cannot verify exactly.

import { readFileSync } from "node:fs";

import {
  CoreSyncError,
  isReleaseLevel,
  parseStrictSemVer,
} from "./core-sync-values.mjs";

export const CORE_PACKAGE = "pi-subagents";
export const CORE_TAG_PREFIX = `${CORE_PACKAGE}-v`;

/** @typedef {{ version: string, commit: string }} UpstreamRelease */
/** @typedef {{ level: import("./core-sync-values.mjs").ReleaseLevel, rationale: string, paths: string[] }} ForkCoreContribution */
/** @typedef {{ forkTag: string, upstream: UpstreamRelease, upstreamTip: string }} CoreReleaseRecord */
/** @typedef {{ merge: string, upstream: UpstreamRelease, forkCore: ForkCoreContribution }} CoreSyncRecord */
/** @typedef {{ schemaVersion: 1, releases: CoreReleaseRecord[], syncs: CoreSyncRecord[] }} CoreSyncState */

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
    throw new CoreSyncError(
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
    throw new CoreSyncError(`${what} must be an object`);
  }
  const record = /** @type {Record<string, unknown>} */ (value);
  rejectUnknownKeys(record, ["version", "commit"], what);
  if (!parseStrictSemVer(record.version)) {
    throw new CoreSyncError(
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
      throw new CoreSyncError(`unknown ${what} field '${key}'`);
    }
  }
}

/**
 * Strictly validate a parsed core-sync state document. Rejects unknown schema
 * versions, unknown fields, malformed tags/versions/OIDs, duplicate entries,
 * and fork-core contributions whose recorded paths contradict their level.
 *
 * @param {unknown} value
 * @returns {CoreSyncState}
 */
export function validateCoreSyncState(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CoreSyncError("core sync state must be a JSON object");
  }
  const document = /** @type {Record<string, unknown>} */ (value);
  rejectUnknownKeys(document, ["schemaVersion", "releases", "syncs"], "state");
  if (document.schemaVersion !== 1) {
    throw new CoreSyncError(
      `unsupported core sync state schema version: ${JSON.stringify(document.schemaVersion)} (expected 1)`,
    );
  }
  if (!Array.isArray(document.releases) || !Array.isArray(document.syncs)) {
    throw new CoreSyncError(
      "core sync state 'releases' and 'syncs' must be arrays",
    );
  }

  /** @type {CoreReleaseRecord[]} */
  const releases = [];
  const seenReleaseTags = new Set();
  for (const [index, entry] of document.releases.entries()) {
    const what = `releases[${index}]`;
    if (typeof entry !== "object" || entry === null) {
      throw new CoreSyncError(`${what} must be an object`);
    }
    const record = /** @type {Record<string, unknown>} */ (entry);
    rejectUnknownKeys(record, ["forkTag", "upstream", "upstreamTip"], what);
    if (
      typeof record.forkTag !== "string" ||
      !record.forkTag.startsWith(CORE_TAG_PREFIX) ||
      !parseStrictSemVer(record.forkTag.slice(CORE_TAG_PREFIX.length))
    ) {
      throw new CoreSyncError(
        `${what}.forkTag is not a ${CORE_TAG_PREFIX}<SemVer> tag: ${JSON.stringify(record.forkTag)}`,
      );
    }
    if (seenReleaseTags.has(record.forkTag)) {
      throw new CoreSyncError(`duplicate release record for ${record.forkTag}`);
    }
    seenReleaseTags.add(record.forkTag);
    releases.push({
      forkTag: record.forkTag,
      upstream: requireUpstreamRelease(record.upstream, `${what}.upstream`),
      upstreamTip: requireOid(record.upstreamTip, `${what}.upstreamTip`),
    });
  }

  /** @type {CoreSyncRecord[]} */
  const syncs = [];
  const seenMerges = new Set();
  for (const [index, entry] of document.syncs.entries()) {
    const what = `syncs[${index}]`;
    if (typeof entry !== "object" || entry === null) {
      throw new CoreSyncError(`${what} must be an object`);
    }
    const record = /** @type {Record<string, unknown>} */ (entry);
    rejectUnknownKeys(record, ["merge", "upstream", "forkCore"], what);
    const merge = requireOid(record.merge, `${what}.merge`);
    if (seenMerges.has(merge)) {
      throw new CoreSyncError(`duplicate sync record for merge ${merge}`);
    }
    seenMerges.add(merge);
    const forkCore = record.forkCore;
    if (typeof forkCore !== "object" || forkCore === null) {
      throw new CoreSyncError(`${what}.forkCore must be an object`);
    }
    const contribution = /** @type {Record<string, unknown>} */ (forkCore);
    rejectUnknownKeys(
      contribution,
      ["level", "rationale", "paths"],
      `${what}.forkCore`,
    );
    if (!isReleaseLevel(contribution.level)) {
      throw new CoreSyncError(
        `${what}.forkCore.level is not a release level: ${JSON.stringify(contribution.level)}`,
      );
    }
    if (
      typeof contribution.rationale !== "string" ||
      !contribution.rationale.trim()
    ) {
      throw new CoreSyncError(
        `${what}.forkCore.rationale must be a non-empty string`,
      );
    }
    if (!Array.isArray(contribution.paths)) {
      throw new CoreSyncError(`${what}.forkCore.paths must be an array`);
    }
    /** @type {string[]} */
    const paths = [];
    for (const [pathIndex, file] of contribution.paths.entries()) {
      if (
        typeof file !== "string" ||
        !file.startsWith(`packages/${CORE_PACKAGE}/`)
      ) {
        throw new CoreSyncError(
          `${what}.forkCore.paths[${pathIndex}] is not a core package path: ${JSON.stringify(file)}`,
        );
      }
      paths.push(file);
    }
    if (contribution.level !== "none" && paths.length === 0) {
      throw new CoreSyncError(
        `${what}.forkCore records level ${contribution.level} with no changed core paths`,
      );
    }
    if (contribution.level === "none" && paths.length > 0) {
      throw new CoreSyncError(
        `${what}.forkCore records level none with changed core paths`,
      );
    }
    syncs.push({
      merge,
      upstream: requireUpstreamRelease(record.upstream, `${what}.upstream`),
      forkCore: {
        level: contribution.level,
        rationale: contribution.rationale,
        paths,
      },
    });
  }

  return { schemaVersion: 1, releases, syncs };
}

/**
 * Read and strictly validate the state document at `statePath`.
 *
 * @param {string} statePath
 * @returns {CoreSyncState}
 */
export function readCoreSyncState(statePath) {
  let raw;
  try {
    raw = readFileSync(statePath, "utf8");
  } catch (error) {
    throw new CoreSyncError(
      `cannot read core sync state ${statePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new CoreSyncError(
      `core sync state ${statePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return validateCoreSyncState(parsed);
}
