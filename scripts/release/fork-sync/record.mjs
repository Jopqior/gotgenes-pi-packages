// Online evidence recording for a selected fork package. The CLI owns the
// upstream remote and supported-target policy; this module receives paths.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  changedPackageFiles,
  isAncestorOf,
  packageCommitsBetween,
  runGit,
  verifyUpstreamReleaseManifest,
} from "./evidence.mjs";
import { readForkSyncState } from "./state.mjs";
import {
  compareVersions,
  ForkSyncError,
  parseStrictSemVer,
} from "./values.mjs";

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
 * Parse `git ls-remote --tags upstream '<directory>-v*'` into stable release
 * candidates. Annotated tags carry a peeled `^{}` line; lightweight tags are
 * their own commit.
 *
 * @param {string} repo
 * @param {string} packageDirectory
 * @returns {Map<string, string>} version → peeled commit OID
 */
function lsRemoteStableReleases(repo, packageDirectory) {
  const tagPrefix = `${packageDirectory}-v`;
  const listing = runGit(
    repo,
    "ls-remote",
    "--tags",
    "upstream",
    `${tagPrefix}*`,
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
      if (!name.startsWith(tagPrefix)) {
        continue;
      }
      const version = name.slice(tagPrefix.length);
      if (!parseStrictSemVer(version)) {
        continue;
      }
      const entry = tags.get(version) ?? { tagOid: "", peeledOid: null };
      entry.peeledOid = oid;
      tags.set(version, entry);
      continue;
    }
    if (!ref.startsWith(tagPrefix)) {
      continue;
    }
    const version = ref.slice(tagPrefix.length);
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
 * @param {string} statePath
 * @param {string} packageDirectory
 * @param {{ merge: string, forkLevel: import("./values.mjs").ReleaseLevel, rationale: string }} options
 */
export function recordForkSync(repo, statePath, packageDirectory, options) {
  const state = readForkSyncState(statePath, packageDirectory);
  if (state.releases.length === 0) {
    throw new ForkSyncError(
      `${statePath} has no published fork release record to anchor ancestry; bootstrap the published correspondence first`,
    );
  }

  let merge;
  try {
    merge = runGit(repo, "rev-parse", "--verify", `${options.merge}^{commit}`);
  } catch {
    throw new ForkSyncError(
      `cannot resolve merge '${options.merge}' in ${repo}`,
    );
  }
  const parents = runGit(repo, "rev-list", "--parents", "-n", "1", merge)
    .split(/\s+/)
    .slice(1);
  if (parents.length !== 2) {
    throw new ForkSyncError(
      `merge ${merge} has ${parents.length} parents; a fork sync is a genuine two-parent merge`,
    );
  }
  if (!isAncestorOf(repo, merge, "HEAD")) {
    throw new ForkSyncError(
      `merge ${merge} is not an ancestor of HEAD; complete and commit the merge before recording it`,
    );
  }
  const [forkParent, upstreamParent] = parents;
  if (!isAncestorOf(repo, upstreamParent, "upstream/main")) {
    throw new ForkSyncError(
      `merge ${merge}'s upstream parent ${upstreamParent} is not contained in upstream/main`,
    );
  }

  // Select the highest stable release actually contained in the merged
  // upstream history — not the newest advertised tag.
  const candidates = lsRemoteStableReleases(repo, packageDirectory);
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
    throw new ForkSyncError(
      "no stable upstream package release is contained in the merge's upstream parent. " +
        "If required objects are missing locally, run scripts/upstream-sync.sh (the normal fetch) — never an ad-hoc tag fetch.",
    );
  }

  verifyUpstreamReleaseManifest(repo, selected, packageDirectory);

  // The merged upstream history must descend from everything already
  // incorporated: the last release's tip, or the last recorded sync's.
  let previousTip = state.releases[state.releases.length - 1].upstreamTip;
  if (state.syncs.length > 0) {
    const lastSync = state.syncs[state.syncs.length - 1];
    previousTip = runGit(repo, "rev-parse", `${lastSync.merge}^2`);
  }
  if (!isAncestorOf(repo, previousTip, upstreamParent)) {
    throw new ForkSyncError(
      `merge ${merge}'s upstream history does not descend from the previously incorporated tip ${previousTip}`,
    );
  }

  const unreleased = packageCommitsBetween(
    repo,
    selected.commit,
    upstreamParent,
    packageDirectory,
  );
  if (unreleased.length > 0) {
    throw new ForkSyncError(
      `unreleased upstream package changes follow ${selected.version}: ${unreleased.join(", ")}. ` +
        "Wait for the next upstream release before recording this sync.",
    );
  }

  // The fork contribution review binds to files whose merge result differs
  // from both parents: genuinely resolved content, not an ours/theirs take.
  const broughtIn = new Set(
    changedPackageFiles(repo, forkParent, merge, packageDirectory),
  );
  const resolutionPaths = changedPackageFiles(
    repo,
    upstreamParent,
    merge,
    packageDirectory,
  )
    .filter((file) => broughtIn.has(file))
    .sort();
  if (options.forkLevel !== "none" && resolutionPaths.length === 0) {
    throw new ForkSyncError(
      `no resolved package paths justify fork level '${options.forkLevel}' for merge ${merge}. ` +
        "Record level none with a rationale, or re-review the resolution.",
    );
  }

  const entry = {
    merge,
    upstream: { version: selected.version, commit: selected.commit },
    forkContribution: {
      level: options.forkLevel,
      rationale: options.rationale,
      paths: options.forkLevel === "none" ? [] : resolutionPaths,
    },
  };

  const existing = state.syncs.find((sync) => sync.merge === merge);
  if (existing) {
    const identical =
      existing.upstream.commit === entry.upstream.commit &&
      existing.forkContribution.level === entry.forkContribution.level &&
      existing.forkContribution.rationale ===
        entry.forkContribution.rationale &&
      existing.forkContribution.paths.join("\n") ===
        entry.forkContribution.paths.join("\n");
    if (!identical) {
      throw new ForkSyncError(
        `a different record already exists for merge ${merge}; resolve the disagreement by hand in ${statePath}`,
      );
    }
    process.stdout.write(
      `already recorded: sync ${merge} → upstream ${existing.upstream.version}, fork contribution ${existing.forkContribution.level}\n`,
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
      `  fork contribution: ${options.forkLevel}`,
      ...(resolutionPaths.length > 0
        ? [
            "  resolved package paths:",
            ...resolutionPaths.map((file) => `    ${file}`),
          ]
        : []),
      `  state: ${path.relative(repo, statePath)}`,
      "Commit the state update before the next release prediction.",
      "",
    ].join("\n"),
  );
}
