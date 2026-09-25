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
// Module ownership: the value algebra and shared error live in
// `core-sync-values.mjs`, the state schema and reader in
// `core-sync-state.mjs`, local-Git evidence checks in
// `core-sync-evidence.mjs`, and the git-cliff adapter in
// `core-sync-cliff.mjs`. This module owns the decision and the CLI.
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

import path from "node:path";
import { pathToFileURL } from "node:url";
import { forkLevelFromWindow } from "./core-sync-cliff.mjs";
import {
  changedCoreFiles,
  coreCommitsBetween,
  requireAncestor,
  requireCommitObject,
  runGit,
  verifyPublishedCoreCorrespondence,
  verifyPublishedCoreTail,
  verifyUpstreamReleaseManifest,
} from "./core-sync-evidence.mjs";
import { CORE_TAG_PREFIX, readCoreSyncState } from "./core-sync-state.mjs";
import {
  CoreSyncError,
  combineLevels,
  compareVersions,
  incrementVersion,
  levelFromVersions,
} from "./core-sync-values.mjs";

/** @typedef {import("./core-sync-state.mjs").CoreSyncRecord} CoreSyncRecord */
/** @typedef {import("./core-sync-state.mjs").UpstreamRelease} UpstreamRelease */
/** @typedef {import("./core-sync-values.mjs").ReleaseLevel} ReleaseLevel */
/** @typedef {{ currentTag: string, nextTag: string | null, upstream: UpstreamRelease, upstreamTip: string, upstreamLevel: ReleaseLevel, forkLevel: ReleaseLevel }} CoreReleaseDecision */

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

  verifyPublishedCoreCorrespondence(repo, release, peeled);

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
      if (changedCoreFiles(repo, `${merge}^1`, merge).length > 0) {
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
      // The recorded upstream release must be that release: the manifest at
      // the recorded commit claims exactly the recorded version.
      verifyUpstreamReleaseManifest(repo, sync.upstream);
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
  // no in-scope core commit — source, test, shipped doc, or metadata, of any
  // commit type — may sit between the recorded release and the incorporated
  // tip. The scope boundary is `isCoreScopePath`, not git-cliff's hidden
  // types; internal working docs stay excluded.
  for (const { sync, upstreamParent } of windowSyncs) {
    const unreleased = coreCommitsBetween(
      repo,
      sync.upstream.commit,
      upstreamParent,
    );
    if (unreleased.length > 0) {
      throw new CoreSyncError(
        `unreleased upstream core changes follow ${sync.upstream.version}: ${unreleased.join(", ")}. ` +
          "Wait for the upstream release that contains them before recording this sync.",
      );
    }
  }
  verifyPublishedCoreTail(repo, release);

  // One comparison across the whole window: baseline versus the final
  // verified target. Deferred intermediate releases never sum.
  let upstreamLevel = /** @type {ReleaseLevel} */ ("none");
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

  const currentVersion = input.currentTag.slice(CORE_TAG_PREFIX.length);
  const forkLevel = forkLevelFromWindow({
    repo,
    cliffArgs: input.cliffArgs,
    range: `${peeled}..HEAD`,
    currentTag: input.currentTag,
    currentVersion,
    upstreamOwned,
  });

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
