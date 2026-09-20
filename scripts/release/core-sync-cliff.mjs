// The git-cliff contract for the core sync release policy: running the real
// binary with the scoping arguments forwarded verbatim from `cliff_args`
// (scripts/release/lib.sh), exporting and validating the JSON context for a
// window, removing verified upstream-owned commits from it, and deriving the
// fork-only level from the filtered context with `--from-context`.
//
// Path authority stays single-sourced: this module forwards the argument
// array lib.sh built and contains no include/exclude list of its own.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CORE_TAG_PREFIX, isFullOid } from "./core-sync-state.mjs";
import {
  CoreSyncError,
  compareVersions,
  levelFromVersions,
  parseStrictSemVer,
} from "./core-sync-values.mjs";

/**
 * Run `git-cliff` with the forwarded scoping arguments and return its stdout.
 *
 * @param {string} repo
 * @param {string[]} cliffArgs
 * @param {...string} extra
 * @returns {string}
 */
export function runGitCliff(repo, cliffArgs, ...extra) {
  try {
    return execFileSync("git-cliff", [...cliffArgs, ...extra], {
      cwd: repo,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String(/** @type {{ stderr?: unknown }} */ (error).stderr).trim()
        : "";
    throw new CoreSyncError(
      `git-cliff ${extra.join(" ")} failed: ${stderr || detail}`,
    );
  }
}

/**
 * Export git-cliff's JSON context for `range` and parse it.
 *
 * @param {string} repo
 * @param {string[]} cliffArgs
 * @param {string} range the actual `<sha>..HEAD` range
 * @param {string} currentTag how the range is named in diagnostics
 * @returns {unknown}
 */
export function exportCliffContext(repo, cliffArgs, range, currentTag) {
  const contextExport = runGitCliff(repo, cliffArgs, "--context", range);
  try {
    return JSON.parse(contextExport);
  } catch (error) {
    throw new CoreSyncError(
      `git-cliff context for ${currentTag}..HEAD is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Strictly validate the parsed git-cliff context for a window anchored at
 * `currentTag`. The top level must be an array, every entry an object
 * without an embedded release boundary and with a commits array, every
 * commit an object with a full 40-hex string id, and — when the array is
 * non-empty — the first entry's `previous` anchor exactly the current tag.
 * An empty array is a legitimate empty window and returns `[]`; no unknown
 * structure is normalized or silently filtered, because a shape change in a
 * future git-cliff must fail loudly rather than discard retained commits.
 *
 * @param {unknown} contextJson
 * @param {string} currentTag
 * @returns {{ version: unknown, commits: { id: string }[] }[]}
 */
export function parseCliffContext(contextJson, currentTag) {
  if (!Array.isArray(contextJson)) {
    throw new CoreSyncError(
      `git-cliff context for ${currentTag}..HEAD is not an array`,
    );
  }
  /** @type {{ version: unknown, commits: { id: string }[] }[]} */
  const entries = [];
  for (const [index, entry] of contextJson.entries()) {
    if (typeof entry !== "object" || entry === null) {
      throw new CoreSyncError(
        `git-cliff context entry ${index} is not an object`,
      );
    }
    const record = /** @type {Record<string, unknown>} */ (entry);
    if (record.version !== null && record.version !== undefined) {
      throw new CoreSyncError(
        `unexpected release boundary ${JSON.stringify(record.version)} inside the ${currentTag}..HEAD window`,
      );
    }
    if (!Array.isArray(record.commits)) {
      throw new CoreSyncError(
        `git-cliff context entry ${index} has no commits array`,
      );
    }
    /** @type {{ id: string }[]} */
    const commits = [];
    for (const [commitIndex, commit] of record.commits.entries()) {
      if (typeof commit !== "object" || commit === null) {
        throw new CoreSyncError(
          `git-cliff context entry ${index} commit ${commitIndex} is not an object`,
        );
      }
      const commitRecord = /** @type {Record<string, unknown>} */ (commit);
      if (typeof commitRecord.id !== "string") {
        throw new CoreSyncError(
          `git-cliff context entry ${index} commit ${commitIndex} has a non-string id: ${JSON.stringify(commitRecord.id)}`,
        );
      }
      if (!isFullOid(commitRecord.id)) {
        throw new CoreSyncError(
          `git-cliff context entry ${index} commit ${commitIndex} id is not a full 40-hex object ID: ${JSON.stringify(commitRecord.id)}`,
        );
      }
      commits.push(/** @type {{ id: string }} */ (commitRecord));
    }
    entries.push({ ...record, commits });
  }
  if (contextJson.length > 0) {
    const first = /** @type {Record<string, unknown>} */ (contextJson[0]);
    const previous = first.previous;
    if (typeof previous !== "object" || previous === null) {
      throw new CoreSyncError(
        `git-cliff context for ${currentTag}..HEAD is not anchored at a previous release; refusing an unbounded walk`,
      );
    }
    const previousVersionInContext = /** @type {Record<string, unknown>} */ (
      previous
    ).version;
    if (previousVersionInContext !== currentTag) {
      throw new CoreSyncError(
        `git-cliff context anchored at ${JSON.stringify(previousVersionInContext)} instead of ${currentTag}; later tag metadata leaked into the window`,
      );
    }
  }
  return entries;
}

/**
 * Derive the fork-only contribution level from the window's git-cliff
 * context: keep only commits whose well-formed id is not upstream-owned, and
 * ask git-cliff for the version the retained commits imply with the current
 * fork tag anchored as the previous release. Empty retained commits mean no
 * fork increment, not a default patch.
 *
 * @param {{
 *   repo: string,
 *   cliffArgs: string[],
 *   range: string,
 *   currentTag: string,
 *   currentVersion: string,
 *   upstreamOwned: Set<string>,
 * }} input
 * @returns {import("./core-sync-values.mjs").ReleaseLevel}
 */
export function forkLevelFromWindow(input) {
  const contextJson = exportCliffContext(
    input.repo,
    input.cliffArgs,
    input.range,
    input.currentTag,
  );
  const entries = parseCliffContext(contextJson, input.currentTag);
  if (entries.length === 0) {
    // An empty window: no commits at all since the release.
    return "none";
  }
  const retained = entries.map((entry) => ({
    ...entry,
    commits: entry.commits.filter(
      (commit) => !input.upstreamOwned.has(commit.id),
    ),
  }));
  const contextDir = mkdtempSync(path.join(tmpdir(), "core-sync-context-"));
  try {
    const contextFile = path.join(contextDir, "context.json");
    writeFileSync(contextFile, `${JSON.stringify(retained)}\n`);
    const forkNextTag = runGitCliff(
      input.repo,
      input.cliffArgs,
      "--from-context",
      contextFile,
      "--bumped-version",
    ).trim();
    if (!forkNextTag) {
      throw new CoreSyncError(
        "git-cliff produced no version from the filtered core context",
      );
    }
    if (!forkNextTag.startsWith(CORE_TAG_PREFIX)) {
      throw new CoreSyncError(
        `git-cliff produced a non-core tag from the filtered context: ${forkNextTag}`,
      );
    }
    const forkNextVersion = forkNextTag.slice(CORE_TAG_PREFIX.length);
    if (!parseStrictSemVer(forkNextVersion)) {
      throw new CoreSyncError(
        `git-cliff produced a non-SemVer version from the filtered context: ${forkNextTag}`,
      );
    }
    if (compareVersions(forkNextVersion, input.currentVersion) > 0) {
      return levelFromVersions(input.currentVersion, forkNextVersion);
    }
    return "none";
  } finally {
    rmSync(contextDir, { recursive: true, force: true });
  }
}
