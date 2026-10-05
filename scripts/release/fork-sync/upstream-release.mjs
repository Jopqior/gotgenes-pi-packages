import { spawnSync } from "node:child_process";
import {
  isAncestorOf,
  runGit,
  verifyUpstreamReleaseManifest,
} from "./evidence.mjs";
import {
  compareVersions,
  ForkSyncError,
  parseStrictSemVer,
} from "./values.mjs";

/**
 * Resolve a completed integration and its highest contained stable upstream
 * release. Queries upstream tags without fetching; missing/uncontained
 * candidates are skipped. Throws ForkSyncError when merge or release evidence
 * is invalid. Continuity, unreleased tails and recording remain caller-owned.
 *
 * @param {string} repo
 * @param {string} packageDirectory
 * @param {string} mergeInput
 * @returns {{ merge: string, forkParent: string, upstreamTip: string, upstream: { version: string, commit: string } }}
 */
export function selectIncorporatedUpstreamRelease(
  repo,
  packageDirectory,
  mergeInput,
) {
  let merge;
  try {
    merge = runGit(repo, "rev-parse", "--verify", `${mergeInput}^{commit}`);
  } catch {
    throw new ForkSyncError(`cannot resolve merge '${mergeInput}' in ${repo}`);
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
  const [forkParent, upstreamTip] = parents;
  if (!isAncestorOf(repo, upstreamTip, "upstream/main")) {
    throw new ForkSyncError(
      `merge ${merge}'s upstream parent ${upstreamTip} is not contained in upstream/main`,
    );
  }

  // Select the highest stable release actually contained in the merged
  // upstream history — not the newest advertised tag.
  const candidates = lsRemoteStableReleases(repo, packageDirectory);
  /** @type {{ version: string, commit: string } | null} */
  let selected = null;
  for (const [version, oid] of candidates) {
    if (!commitExists(repo, oid) || !isAncestorOf(repo, oid, upstreamTip)) {
      continue;
    }
    if (!selected || compareVersions(version, selected.version) > 0) {
      selected = { version, commit: oid };
    }
  }
  if (!selected) {
    throw new ForkSyncError(
      "no stable upstream package release is contained in the merge's upstream parent. " +
        "If required objects are missing locally, run scripts/upstream-sync.sh --fetch — never an ad-hoc tag fetch.",
    );
  }

  verifyUpstreamReleaseManifest(repo, selected, packageDirectory);
  return { merge, forkParent, upstreamTip, upstream: selected };
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
