// Bootstrap evidence only: no registry, target configuration, renderer or
// writes. The artifact boundary separately verifies registered npm identity.
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import {
  runGit,
  verifyPublishedCorrespondence,
  verifyPublishedTail,
} from "./evidence.mjs";
import { readForkSyncState } from "./state.mjs";
import { selectIncorporatedUpstreamRelease } from "./upstream-release.mjs";
import { ForkSyncError, parseStrictSemVer } from "./values.mjs";

/**
 * Verify an untagged first fork release and return pending correspondence.
 * Requires a clean primary main checkout, empty schema-2 state, explicit
 * stable version and completed incorporated upstream merge. Queries tags
 * without fetching; detects full local tag-map drift on success or failure,
 * leaving any externally altered refs untouched. Throws ForkSyncError.
 *
 * @param {string} repo
 * @param {string} statePath
 * @param {string} packageDirectory
 * @param {{ version: string, merge: string }} options
 */
export function decideFirstForkRelease(
  repo,
  statePath,
  packageDirectory,
  options,
) {
  const tags = tagMappings(repo);
  try {
    if (!/^[a-z][a-z0-9-]*$/.test(packageDirectory))
      throw new ForkSyncError("invalid first-release package directory");
    if (!parseStrictSemVer(options.version))
      throw new ForkSyncError("an explicit strict stable version is required");
    requirePrimaryCheckout(repo);
    const state = readForkSyncState(statePath, packageDirectory);
    if (state.releases.length !== 0 || state.syncs.length !== 0)
      throw new ForkSyncError(
        "first release requires empty selected schema-2 state",
      );
    if (runGit(repo, "tag", "--list", `${packageDirectory}-v*`))
      throw new ForkSyncError(
        "first release refuses existing selected release tags",
      );
    const remote = runGit(repo, "remote", "get-url", "--all", "upstream");
    if (
      !/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)gotgenes\/pi-packages(?:\.git)?$/.test(
        remote,
      )
    )
      throw new ForkSyncError(`unsupported upstream remote URL: ${remote}`);
    const incorporated = selectIncorporatedUpstreamRelease(
      repo,
      packageDirectory,
      options.merge,
    );
    const nextTag = `${packageDirectory}-v${options.version}`;
    const row = {
      forkTag: nextTag,
      upstream: incorporated.upstream,
      upstreamTip: incorporated.upstreamTip,
    };
    const head = runGit(repo, "rev-parse", "HEAD");
    verifyPublishedCorrespondence(repo, row, head, packageDirectory);
    verifyPublishedTail(repo, row, packageDirectory);
    return {
      head,
      incorporated,
      decision: {
        nextTag,
        version: options.version,
        upstream: row.upstream,
        upstreamTip: row.upstreamTip,
      },
    };
  } finally {
    if (tags !== tagMappings(repo)) {
      // biome-ignore lint/correctness/noUnsafeFinally: ref drift must override query failure as well as success; never restore refs.
      throw new ForkSyncError(
        "local tag mappings changed during first-release verification; no refs restored",
      );
    }
  }
}

function tagMappings(repo) {
  return runGit(
    repo,
    "for-each-ref",
    "--format=%(refname) %(objectname)",
    "refs/tags/",
  );
}

function requirePrimaryCheckout(repo) {
  const gitDir = realpathSync(runGit(repo, "rev-parse", "--absolute-git-dir"));
  const commonDir = realpathSync(
    runGit(repo, "rev-parse", "--path-format=absolute", "--git-common-dir"),
  );
  if (
    gitDir !== commonDir ||
    realpathSync(runGit(repo, "rev-parse", "--show-toplevel")) !==
      realpathSync(repo)
  )
    throw new ForkSyncError("first release requires the primary checkout root");
  if (runGit(repo, "rev-parse", "--abbrev-ref", "HEAD") !== "main")
    throw new ForkSyncError("first release requires branch main");
  for (const marker of [
    "MERGE_HEAD",
    "CHERRY_PICK_HEAD",
    "REVERT_HEAD",
    "rebase-merge",
    "rebase-apply",
    "sequencer",
    "BISECT_LOG",
  ]) {
    if (existsSync(path.join(gitDir, marker)))
      throw new ForkSyncError(`pending Git operation: ${marker}`);
  }
  // --no-optional-locks avoids a status index refresh in this read-only route.
  if (
    runGit(
      repo,
      "--no-optional-locks",
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    )
  )
    throw new ForkSyncError("first release requires a clean checkout");
}
