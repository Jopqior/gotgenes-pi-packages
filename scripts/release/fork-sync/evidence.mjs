// Local-Git evidence for the fork sync release policy: process helpers and
// the shared provenance checks that both the offline decision
// (`decision.mjs`) and the online recorder (`record.mjs`) run.
//
// `isPackageScopePath` is the only Node-side package path predicate; it mirrors
// `cliff_args` scoping in scripts/release/lib.sh (internal working docs and
// the package's own changelog excluded, everything else under the selected
// package in scope). No other module may grow a second one.
//
// Checks return values or throw ForkSyncError; none writes into a
// caller-owned object. The boolean/throwing duality is deliberate:
// `isAncestorOf` stays boolean because a missing candidate is a legitimate
// negative answer for guard-style questions, while `requireCommitObject` and
// `requireAncestor` throw for required-evidence validation.

import { execFileSync } from "node:child_process";
import { ForkSyncError } from "./values.mjs";

/** @typedef {import("./state.mjs").ForkReleaseRecord} ForkReleaseRecord */

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
    throw new ForkSyncError(
      `git ${args.join(" ")} failed in ${repo}: ${stderr || detail}`,
    );
  }
}

/**
 * @param {string} repo
 * @param {string} oid
 */
export function requireCommitObject(repo, oid) {
  try {
    execFileSync("git", ["cat-file", "-e", `${oid}^{commit}`], {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch {
    throw new ForkSyncError(
      `object ${oid} is missing or not a commit in ${repo}. ` +
        "If this is a shallow or partial clone, fetch history explicitly with scripts/upstream-sync.sh --fetch — never an ad-hoc tag fetch.",
    );
  }
}

/**
 * @param {string} repo
 * @param {string} ancestor
 * @param {string} descendant
 * @returns {boolean}
 */
export function isAncestorOf(repo, ancestor, descendant) {
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
export function requireAncestor(repo, ancestor, descendant, what) {
  if (!isAncestorOf(repo, ancestor, descendant)) {
    throw new ForkSyncError(
      `${what}: ${ancestor} is not an ancestor of ${descendant}`,
    );
  }
}

/**
 * Whether a repository path is inside the package's release scope.
 * Mirrors `cliff_args` scoping: internal working docs and the package's own
 * changelog are excluded, everything else under `packages/<directory>/`
 * counts — including tests, shipped docs, and metadata, which must never be
 * waved through as "just docs".
 *
 * @param {string} file a repository-relative path
 * @param {string} packageDirectory
 * @returns {boolean}
 */
export function isPackageScopePath(file, packageDirectory) {
  const prefix = `packages/${packageDirectory}/`;
  if (!file.startsWith(prefix)) {
    return false;
  }
  if (file === `packages/${packageDirectory}/CHANGELOG.md`) {
    return false;
  }
  const relative = file.slice(prefix.length);
  return !["plans", "retro", "architecture", "decisions", "assets"].some(
    (sub) => relative === `docs/${sub}` || relative.startsWith(`docs/${sub}/`),
  );
}

/**
 * Read the package manifest's version claim at an upstream commit.
 *
 * @param {string} repo
 * @param {string} commit
 * @param {string} what how the commit is named in diagnostics, e.g.
 *   `upstream release 21.7.3 (<oid>)`
 * @param {string} packageDirectory
 * @returns {unknown} the manifest's `version` field
 */
export function readManifestVersion(repo, commit, what, packageDirectory) {
  let manifest;
  try {
    manifest = runGit(
      repo,
      "show",
      `${commit}:packages/${packageDirectory}/package.json`,
    );
  } catch {
    throw new ForkSyncError(
      `${what} has no packages/${packageDirectory}/package.json`,
    );
  }
  try {
    return JSON.parse(manifest).version;
  } catch {
    throw new ForkSyncError(`${what} has a malformed package manifest`);
  }
}

/**
 * Verify that a recorded upstream release's commit really is that release:
 * its package manifest exists and claims exactly the recorded version. Tag
 * names alone prove nothing; this is the check that binds them.
 *
 * @param {string} repo
 * @param {{ version: string, commit: string }} release
 * @param {string} packageDirectory
 */
export function verifyUpstreamReleaseManifest(repo, release, packageDirectory) {
  const what = `upstream release ${release.version} (${release.commit})`;
  const manifestVersion = readManifestVersion(
    repo,
    release.commit,
    what,
    packageDirectory,
  );
  if (manifestVersion !== release.version) {
    throw new ForkSyncError(
      `upstream release tag ${release.version} points at a manifest claiming ${JSON.stringify(manifestVersion)}`,
    );
  }
}

/**
 * Validate the released upstream evidence against a peeled fork release tag.
 * Baseline-tag-to-HEAD ancestry and the window remain decision concerns.
 *
 * @param {string} repo
 * @param {ForkReleaseRecord} release
 * @param {string} peeled
 * @param {string} packageDirectory
 */
export function verifyPublishedCorrespondence(
  repo,
  release,
  peeled,
  packageDirectory,
) {
  requireCommitObject(repo, release.upstream.commit);
  requireCommitObject(repo, release.upstreamTip);
  requireAncestor(
    repo,
    release.upstream.commit,
    release.upstreamTip,
    `release ${release.forkTag} correspondence is inconsistent`,
  );
  requireAncestor(
    repo,
    release.upstream.commit,
    peeled,
    `release ${release.forkTag} does not incorporate recorded upstream ${release.upstream.version}`,
  );
  requireAncestor(
    repo,
    release.upstreamTip,
    peeled,
    `release ${release.forkTag} does not incorporate its recorded upstream tip`,
  );
  // A recorded version must match the upstream manifest, not just its tag.
  verifyUpstreamReleaseManifest(repo, release.upstream, packageDirectory);
}

/**
 * Reject in-scope work between a published upstream release and its tip.
 * Call after window checks when deriving the next fork release so window
 * diagnostics retain precedence over an invalid baseline tail.
 *
 * @param {string} repo
 * @param {ForkReleaseRecord} release
 * @param {string} packageDirectory
 */
export function verifyPublishedTail(repo, release, packageDirectory) {
  const baselineUnreleased = packageCommitsBetween(
    repo,
    release.upstream.commit,
    release.upstreamTip,
    packageDirectory,
  );
  if (baselineUnreleased.length > 0) {
    throw new ForkSyncError(
      `unreleased upstream package changes follow ${release.upstream.version}: ${baselineUnreleased.join(", ")}. ` +
        "The recorded correspondence must end at the released upstream state.",
    );
  }
}

/**
 * Package-scope commits in `from..to`, from real history.
 *
 * The listing is NUL-delimited (`-z`) because git's default prints paths
 * C-quoted whenever they contain non-ASCII, quote, tab, or newline
 * characters, and a quoted path is one `isPackageScopePath` never accepts —
 * an in-scope tail would silently read as out of scope. Measured record
 * layout for `--format=%H --name-only -z` (git 2.53.0): `<oid>\0`, then per
 * changed file `<path>\0`, where the first path token carries the newline
 * git prints between the commit header and its file names; a commit with no
 * changed files emits no path token. A repository path that is exactly 40
 * lowercase hex characters at the repository root would still be mistaken
 * for a commit id — the same limitation the previous line-based parser had.
 *
 * `--diff-merges=first-parent` makes a merge commit's own change visible:
 * the default omits merge diffs entirely, so a merge whose first-parent
 * diff carries package content — an upstream conflict resolution, or package
 * work arriving only through the second parent — sat in a tail with no
 * file names and read as empty. First parent is the same convention the
 * unrecorded-merge guard and the recorder's review binding already use.
 *
 * @param {string} repo
 * @param {string} from
 * @param {string} to
 * @param {string} packageDirectory
 * @returns {string[]} commit OIDs touching package scope
 */
export function packageCommitsBetween(repo, from, to, packageDirectory) {
  const output = runGit(
    repo,
    "log",
    "--format=%H",
    "--name-only",
    "-z",
    "--diff-merges=first-parent",
    `${from}..${to}`,
    "--",
    `packages/${packageDirectory}/`,
  );
  /** @type {string[]} */
  const commits = [];
  let current = null;
  let currentTouchesPackage = false;
  let firstPathOfCommit = true;
  const flush = () => {
    if (current !== null && currentTouchesPackage) {
      commits.push(current);
    }
  };
  for (const token of output.split("\0")) {
    if (/^[0-9a-f]{40}$/.test(token)) {
      flush();
      current = token;
      currentTouchesPackage = false;
      firstPathOfCommit = true;
      continue;
    }
    if (current === null) {
      continue;
    }
    // The token right after an oid carries the header separator's newline;
    // strip exactly that one and leave every other byte of the path alone.
    const file =
      firstPathOfCommit && token.startsWith("\n") ? token.slice(1) : token;
    firstPathOfCommit = false;
    if (file && isPackageScopePath(file, packageDirectory)) {
      currentTouchesPackage = true;
    }
  }
  flush();
  return commits;
}

/**
 * Package-scope files changed between two revisions.
 *
 * NUL-delimited (`-z`) so the names come back raw and lossless — see
 * `packageCommitsBetween` for why git's default quoting loses paths.
 *
 * @param {string} repo
 * @param {string} from
 * @param {string} to
 * @param {string} packageDirectory
 * @returns {string[]}
 */
export function changedPackageFiles(repo, from, to, packageDirectory) {
  return runGit(repo, "diff", "--name-only", "-z", from, to)
    .split("\0")
    .filter((file) => file && isPackageScopePath(file, packageDirectory));
}
