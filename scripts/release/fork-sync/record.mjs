// Online evidence recording for a selected fork package. The CLI owns the
// upstream remote and supported-target policy; this module receives paths.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  changedPackageFiles,
  isAncestorOf,
  packageCommitsBetween,
  runGit,
} from "./evidence.mjs";
import { readForkSyncState } from "./state.mjs";
import { selectIncorporatedUpstreamRelease } from "./upstream-release.mjs";
import { ForkSyncError } from "./values.mjs";

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

  const {
    merge,
    forkParent,
    upstreamTip: upstreamParent,
    upstream: selected,
  } = selectIncorporatedUpstreamRelease(repo, packageDirectory, options.merge);

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
