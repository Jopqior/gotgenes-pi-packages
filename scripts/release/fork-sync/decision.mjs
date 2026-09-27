// Offline fork-release decision from explicit package identity, state path,
// local Git objects, and the git-cliff-scoped release window. The upstream
// SemVer distance is compared once; verified upstream-owned commits are
// excluded from the fork-only level. No network request is made here.

import { forkLevelFromWindow } from "./cliff.mjs";
import {
  changedPackageFiles,
  packageCommitsBetween,
  requireAncestor,
  requireCommitObject,
  runGit,
  verifyPublishedCorrespondence,
  verifyPublishedTail,
  verifyUpstreamReleaseManifest,
} from "./evidence.mjs";
import { readForkSyncState } from "./state.mjs";
import {
  combineLevels,
  compareVersions,
  ForkSyncError,
  incrementVersion,
  levelFromVersions,
} from "./values.mjs";

/** @typedef {import("./state.mjs").ForkSyncRecord} ForkSyncRecord */
/** @typedef {import("./state.mjs").UpstreamRelease} UpstreamRelease */
/** @typedef {import("./values.mjs").ReleaseLevel} ReleaseLevel */
/** @typedef {{ currentTag: string, nextTag: string | null, upstream: UpstreamRelease, upstreamTip: string, upstreamLevel: ReleaseLevel, forkLevel: ReleaseLevel }} ForkReleaseDecision */

/**
 * Derive the next fork release tag from verified evidence.
 *
 * @param {{ repo: string, currentTag: string, cliffArgs: string[], statePath: string, packageDirectory: string }} input
 * @returns {ForkReleaseDecision}
 */
export function decideForkRelease(input) {
  const repo = input.repo;
  const packageDirectory = input.packageDirectory;
  const tagPrefix = `${packageDirectory}-v`;
  const state = readForkSyncState(input.statePath, packageDirectory);

  const release = state.releases.find(
    (entry) => entry.forkTag === input.currentTag,
  );
  if (!release) {
    throw new ForkSyncError(
      `no recorded upstream correspondence for ${input.currentTag}. ` +
        `A fork release requires its published correspondence recorded in ${input.statePath}; record it with the release artifacts.`,
    );
  }

  const peeled = runGit(repo, "rev-parse", `${input.currentTag}^{}`);
  requireAncestor(
    repo,
    peeled,
    "HEAD",
    `${input.currentTag} is not an ancestor of HEAD`,
  );

  verifyPublishedCorrespondence(repo, release, peeled, packageDirectory);

  // Every two-parent commit in the window that changes package paths must be a
  // recorded, reviewed sync. Fork work lands linearly, so an unrecorded
  // package-affecting merge is an unreviewed integration and blocks release.
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
      if (
        changedPackageFiles(repo, `${merge}^1`, merge, packageDirectory)
          .length > 0
      ) {
        throw new ForkSyncError(
          `merge ${merge} changes package paths but has no reviewed sync record. ` +
            "Record it with: scripts/upstream-sync.sh --record-fork-sync <merge>",
        );
      }
      continue;
    }
    const parents = runGit(repo, "rev-list", "--parents", "-n", "1", merge)
      .split(/\s+/)
      .slice(1);
    if (parents.length !== 2) {
      throw new ForkSyncError(
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
      const sync = /** @type {ForkSyncRecord} */ (
        state.syncs.find((entry) => entry.merge === merge)
      );
      const [forkParent, upstreamParent] = /** @type {string[]} */ (
        mergeParents.get(merge)
      );
      requireCommitObject(repo, sync.upstream.commit);
      // The recorded upstream release must be that release: the manifest at
      // the recorded commit claims exactly the recorded version.
      verifyUpstreamReleaseManifest(repo, sync.upstream, packageDirectory);
      requireAncestor(
        repo,
        sync.upstream.commit,
        upstreamParent,
        `sync ${merge} recorded upstream ${sync.upstream.version} is not contained in its upstream parent`,
      );
      return { sync, upstreamParent, forkParent };
    });

  // The window's sync chain must be continuous on the upstream side: each
  // incorporated line descends from everything incorporated before it. The
  // first must descend from the release record's upstream tip; each later
  // one from the previous sync's upstream parent — the recorder's
  // previousTip rule, enforced again at read time.
  let previousTip = release.upstreamTip;
  for (const { sync, upstreamParent } of windowSyncs) {
    requireAncestor(
      repo,
      previousTip,
      upstreamParent,
      `sync ${sync.merge}'s upstream parent does not descend from the previously incorporated tip`,
    );
    previousTip = upstreamParent;
  }

  // Every recorded sync must have incorporated a *released* upstream state:
  // no in-scope package commit — source, test, shipped doc, or metadata, of any
  // commit type — may sit between the recorded release and the incorporated
  // tip. The scope boundary is `isPackageScopePath`, not git-cliff's hidden
  // types; internal working docs stay excluded.
  for (const { sync, upstreamParent } of windowSyncs) {
    const unreleased = packageCommitsBetween(
      repo,
      sync.upstream.commit,
      upstreamParent,
      packageDirectory,
    );
    if (unreleased.length > 0) {
      throw new ForkSyncError(
        `unreleased upstream package changes follow ${sync.upstream.version}: ${unreleased.join(", ")}. ` +
          "Wait for the upstream release that contains them before recording this sync.",
      );
    }
  }
  verifyPublishedTail(repo, release, packageDirectory);

  // One comparison across the whole window: baseline versus the final
  // verified target. Deferred intermediate releases never sum.
  let upstreamLevel = /** @type {ReleaseLevel} */ ("none");
  let upstreamTarget = release.upstream;
  let upstreamTip = release.upstreamTip;
  let previousVersion = release.upstream.version;
  for (const { sync, upstreamParent } of windowSyncs) {
    if (compareVersions(sync.upstream.version, previousVersion) < 0) {
      throw new ForkSyncError(
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

  const currentVersion = input.currentTag.slice(tagPrefix.length);
  const forkLevel = forkLevelFromWindow({
    repo,
    cliffArgs: input.cliffArgs,
    range: `${peeled}..HEAD`,
    currentTag: input.currentTag,
    packageDirectory,
    upstreamOwned,
  });

  const forkContribution = combineLevels(
    forkLevel,
    ...windowSyncs.map(({ sync }) => sync.forkContribution.level),
  );
  const level = combineLevels(upstreamLevel, forkContribution);
  const nextVersion = incrementVersion(currentVersion, level);

  return {
    currentTag: input.currentTag,
    nextTag: level === "none" ? null : `${tagPrefix}${nextVersion}`,
    upstream: upstreamTarget,
    upstreamTip,
    upstreamLevel,
    forkLevel: forkContribution,
  };
}
