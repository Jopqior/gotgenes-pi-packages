#!/usr/bin/env node
// Offline core-release decision policy for the fork's pi-subagents package.
//
// The fork versions `pi-subagents` independently of upstream, but its history
// advances mostly through merges of gotgenes/pi-packages. A repository-wide
// Conventional Commit classification of such a merge says nothing about the
// upstream release it incorporates, so this module derives the next core tag
// from verified correspondence evidence instead:
//
//   - `scripts/release/core-sync-state.json` records, for every published
//     fork core release, the upstream release it incorporated, and for every
//     reviewed upstream sync merge, the selected upstream release plus the
//     reviewed fork-core contribution of the conflict resolution.
//   - The upstream contribution is the SemVer distance between the current
//     fork release's recorded upstream version and the last recorded sync's
//     upstream version — compared once across the whole unreleased window,
//     never summed across intermediate releases.
//   - The fork contribution is what git-cliff derives from the window's
//     commits with verified upstream-owned commits (and the sync merges
//     themselves) removed from its context, combined with the reviewed
//     fork-core levels of those merges.
//
// The decision is offline: it reads only local Git objects and the committed
// state file, and shells out to real `git` and `git-cliff`. Missing,
// inconsistent, or ambiguous evidence is an error — never a default level and
// never the silent no-release success path. Recording new evidence (which may
// query the upstream remote) is `record-core-sync.mjs`'s job, invoked through
// `scripts/upstream-sync.sh`.
//
// The value algebra and error contract live in `core-sync-values.mjs`, the
// state schema and reader in `core-sync-state.mjs`; this module owns the
// decision itself, the local-Git evidence checks, and the git-cliff adapter.
//
// Library use: tests and `prepare-release.sh` import the exported functions.
// CLI use (what `next_tag` in lib.sh runs):
//
//   node core-sync.mjs --repo <path> --current <tag> [--state <path>] [--json] \
//     -- <git-cliff scoping arguments, forwarded verbatim>
//
// stdout is the next `pi-subagents-v<version>` tag and exit status 0, or
// empty stdout and exit status 0 when nothing is releasable. Any evidence
// failure prints `error: <diagnostic>` to stderr and exits nonzero.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  CORE_PACKAGE,
  CORE_TAG_PREFIX,
  readCoreSyncState,
} from "./core-sync-state.mjs";
import {
  CoreSyncError,
  combineLevels,
  compareVersions,
  incrementVersion,
  levelFromVersions,
  parseStrictSemVer,
} from "./core-sync-values.mjs";

/** @typedef {import("./core-sync-state.mjs").CoreSyncRecord} CoreSyncRecord */
/** @typedef {import("./core-sync-state.mjs").UpstreamRelease} UpstreamRelease */
/** @typedef {{ currentTag: string, nextTag: string | null, upstream: UpstreamRelease, upstreamTip: string, upstreamLevel: import("./core-sync-values.mjs").ReleaseLevel, forkLevel: import("./core-sync-values.mjs").ReleaseLevel }} CoreReleaseDecision */

/**
 * Run `git` inside `repo` and return its stripped stdout.
 *
 * @param {string} repo repository path
 * @param {...string} args
 * @returns {string}
 */
export function runGit(repo, ...args) {
  try {
    return execFileSync("git", args, {
      cwd: repo,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String(/** @type {{ stderr?: unknown }} */ (error).stderr).trim()
        : "";
    throw new CoreSyncError(
      `git ${args.join(" ")} failed in ${repo}: ${stderr || detail}`,
    );
  }
}

/**
 * @param {string} repo
 * @param {string} oid
 */
function requireCommitObject(repo, oid) {
  try {
    execFileSync("git", ["cat-file", "-e", `${oid}^{commit}`], {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch {
    throw new CoreSyncError(
      `object ${oid} is missing or not a commit in ${repo}. ` +
        "If this is a shallow or partial clone, fetch history through the normal sync flow (scripts/upstream-sync.sh) — never an ad-hoc tag fetch.",
    );
  }
}

/**
 * @param {string} repo
 * @param {string} ancestor
 * @param {string} descendant
 * @returns {boolean}
 */
function isAncestorOf(repo, ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} repo
 * @param {string} ancestor
 * @param {string} descendant
 * @param {string} what
 */
function requireAncestor(repo, ancestor, descendant, what) {
  if (!isAncestorOf(repo, ancestor, descendant)) {
    throw new CoreSyncError(
      `${what}: ${ancestor} is not an ancestor of ${descendant}`,
    );
  }
}

/**
 * Whether a repository path is inside the core package's release scope.
 * Mirrors `cliff_args` scoping: internal working docs and the package's own
 * changelog are excluded, everything else under `packages/pi-subagents/`
 * counts — including tests, shipped docs, and metadata, which must never be
 * waved through as "just docs".
 *
 * @param {string} file a repository-relative path
 * @returns {boolean}
 */
export function isCoreScopePath(file) {
  const prefix = `packages/${CORE_PACKAGE}/`;
  if (!file.startsWith(prefix)) {
    return false;
  }
  if (file === `packages/${CORE_PACKAGE}/CHANGELOG.md`) {
    return false;
  }
  const relative = file.slice(prefix.length);
  return !["plans", "retro", "architecture", "decisions", "assets"].some(
    (sub) => relative === `docs/${sub}` || relative.startsWith(`docs/${sub}/`),
  );
}

/**
 * Run `git-cliff` with the forwarded scoping arguments and return its stdout.
 *
 * @param {string} repo
 * @param {string[]} cliffArgs
 * @param {...string} extra
 * @returns {string}
 */
function runGitCliff(repo, cliffArgs, ...extra) {
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
 * Derive the next core release tag from verified evidence.
 *
 * @param {{ repo: string, currentTag: string, cliffArgs: string[], statePath?: string }} input
 * @returns {CoreReleaseDecision}
 */
export function decideCoreRelease(input) {
  const repo = input.repo;
  const statePath =
    input.statePath ??
    path.join(repo, "scripts", "release", "core-sync-state.json");
  const state = readCoreSyncState(statePath);

  const release = state.releases.find(
    (entry) => entry.forkTag === input.currentTag,
  );
  if (!release) {
    throw new CoreSyncError(
      `no recorded upstream correspondence for ${input.currentTag}. ` +
        "A core release requires its published correspondence recorded in scripts/release/core-sync-state.json; record it with the release artifacts.",
    );
  }

  const peeled = runGit(repo, "rev-parse", `${input.currentTag}^{}`);
  requireAncestor(
    repo,
    peeled,
    "HEAD",
    `${input.currentTag} is not an ancestor of HEAD`,
  );

  // The recorded upstream evidence for the current release must exist and
  // actually be incorporated by that release.
  requireCommitObject(repo, release.upstream.commit);
  requireCommitObject(repo, release.upstreamTip);
  requireAncestor(
    repo,
    release.upstream.commit,
    release.upstreamTip,
    `release ${input.currentTag} correspondence is inconsistent`,
  );
  requireAncestor(
    repo,
    release.upstream.commit,
    peeled,
    `release ${input.currentTag} does not incorporate recorded upstream ${release.upstream.version}`,
  );
  requireAncestor(
    repo,
    release.upstreamTip,
    peeled,
    `release ${input.currentTag} does not incorporate its recorded upstream tip`,
  );

  // Every two-parent commit in the window that changes core paths must be a
  // recorded, reviewed sync. Fork work lands linearly, so an unrecorded
  // core-affecting merge is an unreviewed integration and blocks release.
  const windowMerges = runGit(
    repo,
    "rev-list",
    "--merges",
    "--topo-order",
    "--reverse",
    `${peeled}..HEAD`,
  )
    .split("\n")
    .filter(Boolean);
  const recordedMerges = new Set(state.syncs.map((sync) => sync.merge));
  /** @type {Map<string, string[]>} */
  const mergeParents = new Map();
  for (const merge of windowMerges) {
    if (!recordedMerges.has(merge)) {
      const changedCoreFiles = runGit(
        repo,
        "diff",
        "--name-only",
        `${merge}^1`,
        merge,
      )
        .split("\n")
        .filter((file) => file && isCoreScopePath(file));
      if (changedCoreFiles.length > 0) {
        throw new CoreSyncError(
          `merge ${merge} changes core paths but has no reviewed sync record. ` +
            "Record it with: scripts/upstream-sync.sh --record-core-sync <merge>",
        );
      }
      continue;
    }
    const parents = runGit(repo, "rev-list", "--parents", "-n", "1", merge)
      .split(/\s+/)
      .slice(1);
    if (parents.length !== 2) {
      throw new CoreSyncError(
        `recorded sync merge ${merge} has ${parents.length} parents, expected 2`,
      );
    }
    mergeParents.set(merge, parents);
  }

  // Reviewed syncs in window ancestry order. The upstream parent is the
  // merge's second parent — `git merge upstream/main` (and `git merge
  // --continue` after a conflict) always records HEAD first — and it must
  // contain the recorded upstream release, which is how a mis-recorded
  // provenance fails closed.
  const windowSyncs = windowMerges
    .filter((merge) => recordedMerges.has(merge))
    .map((merge) => {
      const sync = /** @type {CoreSyncRecord} */ (
        state.syncs.find((entry) => entry.merge === merge)
      );
      const [forkParent, upstreamParent] = /** @type {string[]} */ (
        mergeParents.get(merge)
      );
      requireCommitObject(repo, sync.upstream.commit);
      requireAncestor(
        repo,
        sync.upstream.commit,
        upstreamParent,
        `sync ${merge} recorded upstream ${sync.upstream.version} is not contained in its upstream parent`,
      );
      return { sync, upstreamParent, forkParent };
    });

  // One comparison across the whole window: baseline versus the final
  // verified target. Deferred intermediate releases never sum.
  let upstreamLevel =
    /** @type {import("./core-sync-values.mjs").ReleaseLevel} */ ("none");
  let upstreamTarget = release.upstream;
  let upstreamTip = release.upstreamTip;
  let previousVersion = release.upstream.version;
  for (const { sync, upstreamParent } of windowSyncs) {
    if (compareVersions(sync.upstream.version, previousVersion) < 0) {
      throw new CoreSyncError(
        `sync ${sync.merge} incorporates upstream ${sync.upstream.version}, behind the already-incorporated ${previousVersion}`,
      );
    }
    previousVersion = sync.upstream.version;
    upstreamTarget = sync.upstream;
    upstreamTip = upstreamParent;
  }
  if (windowSyncs.length > 0) {
    upstreamLevel = levelFromVersions(
      release.upstream.version,
      previousVersion,
    );
  }

  // Fork-only contribution: git-cliff over the window with verified
  // upstream-owned commits and the sync merges themselves removed.
  const upstreamOwned = new Set(windowSyncs.map(({ sync }) => sync.merge));
  for (const { upstreamParent, forkParent } of windowSyncs) {
    for (const oid of runGit(
      repo,
      "rev-list",
      `${forkParent}..${upstreamParent}`,
    )
      .split("\n")
      .filter(Boolean)) {
      upstreamOwned.add(oid);
    }
  }

  let forkLevel = /** @type {import("./core-sync-values.mjs").ReleaseLevel} */ (
    "none"
  );
  const currentVersion = input.currentTag.slice(CORE_TAG_PREFIX.length);
  const contextExport = runGitCliff(
    repo,
    input.cliffArgs,
    "--context",
    `${peeled}..HEAD`,
  );
  /** @type {unknown} */
  let contextJson;
  try {
    contextJson = JSON.parse(contextExport);
  } catch (error) {
    throw new CoreSyncError(
      `git-cliff context for ${input.currentTag}..HEAD is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!Array.isArray(contextJson) || contextJson.length === 0) {
    // An empty window: no commits at all since the release.
    forkLevel = "none";
  } else {
    /** @type {{ version: unknown, commits: unknown[] }[]} */
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
          `unexpected release boundary ${JSON.stringify(record.version)} inside the ${input.currentTag}..HEAD window`,
        );
      }
      if (!Array.isArray(record.commits)) {
        throw new CoreSyncError(
          `git-cliff context entry ${index} has no commits array`,
        );
      }
      entries.push(record);
    }
    const first = /** @type {Record<string, unknown>} */ (contextJson[0]);
    const previous = first.previous;
    if (typeof previous !== "object" || previous === null) {
      throw new CoreSyncError(
        `git-cliff context for ${input.currentTag}..HEAD is not anchored at a previous release; refusing an unbounded walk`,
      );
    }
    const previousVersionInContext = /** @type {Record<string, unknown>} */ (
      previous
    ).version;
    if (previousVersionInContext !== input.currentTag) {
      throw new CoreSyncError(
        `git-cliff context anchored at ${JSON.stringify(previousVersionInContext)} instead of ${input.currentTag}; later tag metadata leaked into the window`,
      );
    }
    const retained = entries.map((entry) => ({
      ...entry,
      commits: entry.commits.filter((commit) => {
        if (typeof commit !== "object" || commit === null) {
          return false;
        }
        const id = /** @type {Record<string, unknown>} */ (commit).id;
        return typeof id === "string" && !upstreamOwned.has(id);
      }),
    }));
    const contextDir = mkdtempSync(path.join(tmpdir(), "core-sync-context-"));
    try {
      const contextFile = path.join(contextDir, "context.json");
      writeFileSync(contextFile, `${JSON.stringify(retained)}\n`);
      const forkNextTag = runGitCliff(
        repo,
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
      if (compareVersions(forkNextVersion, currentVersion) > 0) {
        forkLevel = levelFromVersions(currentVersion, forkNextVersion);
      }
    } finally {
      rmSync(contextDir, { recursive: true, force: true });
    }
  }

  const forkContribution = combineLevels(
    forkLevel,
    ...windowSyncs.map(({ sync }) => sync.forkCore.level),
  );
  const level = combineLevels(upstreamLevel, forkContribution);
  const nextVersion = incrementVersion(currentVersion, level);

  return {
    currentTag: input.currentTag,
    nextTag: level === "none" ? null : `${CORE_TAG_PREFIX}${nextVersion}`,
    upstream: upstreamTarget,
    upstreamTip,
    upstreamLevel,
    forkLevel: forkContribution,
  };
}

function main() {
  const args = process.argv.slice(2);
  /** @type {string | null} */
  let repo = null;
  /** @type {string | null} */
  let current = null;
  /** @type {string | undefined} */
  let statePath;
  let json = false;
  /** @type {string[]} */
  const cliffArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--repo") {
      repo = args[++i] ?? null;
    } else if (arg === "--current") {
      current = args[++i] ?? null;
    } else if (arg === "--state") {
      statePath = args[i + 1];
      if (statePath === undefined) {
        process.stderr.write("error: --state requires a path\n");
        process.exit(1);
      }
      i++;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--") {
      cliffArgs.push(...args.slice(i + 1));
      break;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: core-sync.mjs --repo <path> --current <tag> [--state <path>] [--json] -- <git-cliff args>",
          "",
          "Prints the next pi-subagents-v<version> tag, or nothing when no core",
          "release is pending. The arguments after -- are git-cliff scoping flags",
          "(cliff_args output) forwarded verbatim. Exits nonzero on evidence failure.",
          "",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      process.stderr.write(`error: unknown argument '${arg}'\n`);
      process.exit(1);
    }
  }
  if (!repo || !current) {
    process.stderr.write(
      "error: --repo and --current are required (see --help)\n",
    );
    process.exit(1);
  }

  try {
    const decision = decideCoreRelease({
      repo,
      currentTag: current,
      cliffArgs,
      statePath,
    });
    if (json) {
      process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
    } else if (decision.nextTag) {
      process.stdout.write(`${decision.nextTag}\n`);
    }
  } catch (error) {
    const message =
      error instanceof CoreSyncError ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
