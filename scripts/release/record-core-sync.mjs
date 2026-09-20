#!/usr/bin/env node
// Record verified upstream core sync evidence for the fork's pi-subagents
// package.
//
// This is the online half of the core release policy: it may query the
// upstream remote (through `git ls-remote`) to resolve release tags, but it
// never creates local tag refs, never pushes, and never changes the merge.
// It is invoked only through `scripts/upstream-sync.sh --record-core-sync`,
// after a merge has completed and its conflict resolutions have been reviewed.
//
// The recorder is deliberately stricter than any single piece of evidence:
//
//   - The merge must be a genuine two-parent merge, an ancestor of HEAD, and
//     its second parent must be contained in the just-fetched upstream/main.
//   - The selected upstream release is the highest *stable* release whose
//     peeled commit is contained in that upstream parent — not the newest
//     advertised tag — and its manifest must agree with the tag version
//     (verified with the shared evidence check the offline decision uses).
//   - The upstream parent must descend from the previously incorporated
//     upstream tip, and no in-scope core commits may follow the selected
//     release (unreleased source, tests, shipped docs, or metadata block
//     recording; internal working docs stay excluded).
//   - The fork-core contribution is an explicit review: `--fork-level` and
//     `--rationale` are required even for `none`, and a non-`none` level must
//     be justified by core files whose merge result differs from both parents.
//
// A successful run appends one deterministic entry to
// `scripts/release/core-sync-state.json`; re-running with the same review is
// idempotent, and conflicting evidence is an error. The operator commits the
// state update before the next release prediction.

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  changedCoreFiles,
  coreCommitsBetween,
  isAncestorOf,
  runGit,
  verifyUpstreamReleaseManifest,
} from "./core-sync-evidence.mjs";
import { CORE_TAG_PREFIX, readCoreSyncState } from "./core-sync-state.mjs";
import {
  CoreSyncError,
  compareVersions,
  isReleaseLevel,
  parseStrictSemVer,
} from "./core-sync-values.mjs";

/**
 * @param {string} repo
 * @param {string} oid
 * @returns {boolean}
 */
function commitExists(repo, oid) {
  const result = spawnSync("git", ["cat-file", "-e", `${oid}^{commit}`], {
    cwd: repo,
    encoding: "utf8",
  });
  return result.status === 0;
}

/**
 * Parse `git ls-remote --tags upstream 'pi-subagents-v*'` into stable release
 * candidates. Annotated tags carry a peeled `^{}` line; lightweight tags are
 * their own commit.
 *
 * @param {string} repo
 * @returns {Map<string, string>} version → peeled commit OID
 */
function lsRemoteStableReleases(repo) {
  const listing = runGit(
    repo,
    "ls-remote",
    "--tags",
    "upstream",
    `${CORE_TAG_PREFIX}*`,
  );
  /** @type {Map<string, { tagOid: string, peeledOid: string | null }>} */
  const tags = new Map();
  for (const line of listing.split("\n").filter(Boolean)) {
    const match = /^([0-9a-f]{40})\trefs\/tags\/(.+)$/.exec(line);
    if (!match) {
      continue;
    }
    const [, oid, ref] = match;
    const peeledMatch = /^(.*)\^\{\}$/.exec(ref);
    if (peeledMatch) {
      const name = peeledMatch[1];
      if (!name.startsWith(CORE_TAG_PREFIX)) {
        continue;
      }
      const version = name.slice(CORE_TAG_PREFIX.length);
      if (!parseStrictSemVer(version)) {
        continue;
      }
      const entry = tags.get(version) ?? { tagOid: "", peeledOid: null };
      entry.peeledOid = oid;
      tags.set(version, entry);
      continue;
    }
    if (!ref.startsWith(CORE_TAG_PREFIX)) {
      continue;
    }
    const version = ref.slice(CORE_TAG_PREFIX.length);
    if (!parseStrictSemVer(version)) {
      continue; // prerelease or malformed: not a stable release
    }
    const entry = tags.get(version) ?? { tagOid: oid, peeledOid: null };
    entry.tagOid = oid;
    tags.set(version, entry);
  }
  /** @type {Map<string, string>} */
  const releases = new Map();
  for (const [version, entry] of tags) {
    releases.set(version, entry.peeledOid ?? entry.tagOid);
  }
  return releases;
}

/**
 * @param {string} repo
 */
function recordSync(repo, options) {
  const statePath = path.join(
    repo,
    "scripts",
    "release",
    "core-sync-state.json",
  );
  const state = readCoreSyncState(statePath);
  if (state.releases.length === 0) {
    throw new CoreSyncError(
      `${statePath} has no published core release record to anchor ancestry; bootstrap the published correspondence first`,
    );
  }

  let merge;
  try {
    merge = runGit(repo, "rev-parse", "--verify", `${options.merge}^{commit}`);
  } catch {
    throw new CoreSyncError(
      `cannot resolve merge '${options.merge}' in ${repo}`,
    );
  }
  const parents = runGit(repo, "rev-list", "--parents", "-n", "1", merge)
    .split(/\s+/)
    .slice(1);
  if (parents.length !== 2) {
    throw new CoreSyncError(
      `merge ${merge} has ${parents.length} parents; a core sync is a genuine two-parent merge`,
    );
  }
  if (!isAncestorOf(repo, merge, "HEAD")) {
    throw new CoreSyncError(
      `merge ${merge} is not an ancestor of HEAD; complete and commit the merge before recording it`,
    );
  }
  const [forkParent, upstreamParent] = parents;
  if (!isAncestorOf(repo, upstreamParent, "upstream/main")) {
    throw new CoreSyncError(
      `merge ${merge}'s upstream parent ${upstreamParent} is not contained in upstream/main`,
    );
  }

  // Select the highest stable release actually contained in the merged
  // upstream history — not the newest advertised tag.
  const candidates = lsRemoteStableReleases(repo);
  /** @type {{ version: string, commit: string } | null} */
  let selected = null;
  for (const [version, oid] of candidates) {
    if (!commitExists(repo, oid) || !isAncestorOf(repo, oid, upstreamParent)) {
      continue;
    }
    if (!selected || compareVersions(version, selected.version) > 0) {
      selected = { version, commit: oid };
    }
  }
  if (!selected) {
    throw new CoreSyncError(
      "no stable upstream core release is contained in the merge's upstream parent. " +
        "If required objects are missing locally, run scripts/upstream-sync.sh (the normal fetch) — never an ad-hoc tag fetch.",
    );
  }

  verifyUpstreamReleaseManifest(repo, selected);

  // The merged upstream history must descend from everything already
  // incorporated: the last release's tip, or the last recorded sync's.
  let previousTip = state.releases[state.releases.length - 1].upstreamTip;
  if (state.syncs.length > 0) {
    const lastSync = state.syncs[state.syncs.length - 1];
    previousTip = runGit(repo, "rev-parse", `${lastSync.merge}^2`);
  }
  if (!isAncestorOf(repo, previousTip, upstreamParent)) {
    throw new CoreSyncError(
      `merge ${merge}'s upstream history does not descend from the previously incorporated tip ${previousTip}`,
    );
  }

  const unreleased = coreCommitsBetween(repo, selected.commit, upstreamParent);
  if (unreleased.length > 0) {
    throw new CoreSyncError(
      `unreleased upstream core changes follow ${selected.version}: ${unreleased.join(", ")}. ` +
        "Wait for the next upstream release before recording this sync.",
    );
  }

  // The fork-core review binds to files whose merge result differs from both
  // parents: genuinely resolved content, not a wholesale ours/theirs take.
  const broughtIn = new Set(changedCoreFiles(repo, forkParent, merge));
  const resolutionPaths = changedCoreFiles(repo, upstreamParent, merge)
    .filter((file) => broughtIn.has(file))
    .sort();
  if (options.forkLevel !== "none" && resolutionPaths.length === 0) {
    throw new CoreSyncError(
      `no resolved core paths justify fork level '${options.forkLevel}' for merge ${merge}. ` +
        "Record level none with a rationale, or re-review the resolution.",
    );
  }

  const entry = {
    merge,
    upstream: { version: selected.version, commit: selected.commit },
    forkCore: {
      level: options.forkLevel,
      rationale: options.rationale,
      paths: options.forkLevel === "none" ? [] : resolutionPaths,
    },
  };

  const existing = state.syncs.find((sync) => sync.merge === merge);
  if (existing) {
    const identical =
      existing.upstream.commit === entry.upstream.commit &&
      existing.forkCore.level === entry.forkCore.level &&
      existing.forkCore.rationale === entry.forkCore.rationale &&
      existing.forkCore.paths.join("\n") === entry.forkCore.paths.join("\n");
    if (!identical) {
      throw new CoreSyncError(
        `a different record already exists for merge ${merge}; resolve the disagreement by hand in scripts/release/core-sync-state.json`,
      );
    }
    process.stdout.write(
      `already recorded: sync ${merge} → upstream ${existing.upstream.version}, fork core ${existing.forkCore.level}\n`,
    );
    return;
  }

  state.syncs.push(entry);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  process.stdout.write(
    [
      `recorded sync ${merge}:`,
      `  upstream release ${selected.version} (${selected.commit})`,
      `  fork core contribution: ${options.forkLevel}`,
      ...(resolutionPaths.length > 0
        ? [
            "  resolved core paths:",
            ...resolutionPaths.map((file) => `    ${file}`),
          ]
        : []),
      `  state: ${path.relative(repo, statePath)}`,
      "Commit the state update before the next release prediction.",
      "",
    ].join("\n"),
  );
}

function main() {
  const args = process.argv.slice(2);
  /** @type {Record<string, string>} */
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (
      arg === "--repo" ||
      arg === "--merge" ||
      arg === "--fork-level" ||
      arg === "--rationale"
    ) {
      const value = args[i + 1];
      if (value === undefined) {
        process.stderr.write(`error: ${arg} requires a value\n`);
        process.exit(1);
      }
      options[arg.slice(2)] = value;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: record-core-sync.mjs --repo <path> --merge <oid>",
          "       --fork-level <none|patch|minor|major> --rationale <text>",
          "",
          "Appends a reviewed sync record to scripts/release/core-sync-state.json.",
          "Run through scripts/upstream-sync.sh --record-core-sync, which supplies",
          "the upstream identity and no-tag safeguards. Never pushes.",
          "",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      process.stderr.write(`error: unknown argument '${arg}'\n`);
      process.exit(1);
    }
  }
  const missing = ["repo", "merge", "fork-level", "rationale"].filter(
    (name) => !options[name],
  );
  if (missing.length > 0) {
    for (const name of missing) {
      process.stderr.write(`error: --${name} is required (see --help)\n`);
    }
    process.exit(1);
  }
  if (!isReleaseLevel(options["fork-level"])) {
    process.stderr.write(
      "error: --fork-level must be one of none, patch, minor, major\n",
    );
    process.exit(1);
  }

  try {
    recordSync(options.repo, {
      merge: options.merge,
      forkLevel: /** @type {"none" | "patch" | "minor" | "major"} */ (
        options["fork-level"]
      ),
      rationale: options.rationale,
    });
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
