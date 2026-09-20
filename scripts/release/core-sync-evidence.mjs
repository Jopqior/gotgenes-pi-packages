// Local-Git evidence for the core sync release policy: process helpers and
// the shared provenance checks that both the offline decision
// (`core-sync.mjs`) and the online recorder (`record-core-sync.mjs`) run.
//
// `isCoreScopePath` is the only Node-side core path predicate; it mirrors
// `cliff_args` scoping in scripts/release/lib.sh (internal working docs and
// the package's own changelog excluded, everything else under the core
// package in scope). No other module may grow a second one.
//
// Checks return values or throw CoreSyncError; none writes into a
// caller-owned object. The boolean/throwing duality is deliberate:
// `isAncestorOf` stays boolean because a missing candidate is a legitimate
// negative answer for guard-style questions, while `requireCommitObject` and
// `requireAncestor` throw for required-evidence validation.

import { execFileSync } from "node:child_process";
import { CORE_PACKAGE } from "./core-sync-state.mjs";
import { CoreSyncError } from "./core-sync-values.mjs";

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
export function requireCommitObject(repo, oid) {
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
 * Read the core manifest's version claim at an upstream commit.
 *
 * @param {string} repo
 * @param {string} commit
 * @param {string} what how the commit is named in diagnostics, e.g.
 *   `upstream release 21.7.3 (<oid>)`
 * @returns {unknown} the manifest's `version` field
 */
export function readManifestVersion(repo, commit, what) {
  let manifest;
  try {
    manifest = runGit(
      repo,
      "show",
      `${commit}:packages/${CORE_PACKAGE}/package.json`,
    );
  } catch {
    throw new CoreSyncError(
      `${what} has no packages/${CORE_PACKAGE}/package.json`,
    );
  }
  try {
    return JSON.parse(manifest).version;
  } catch {
    throw new CoreSyncError(`${what} has a malformed core manifest`);
  }
}

/**
 * Verify that a recorded upstream release's commit really is that release:
 * its core manifest exists and claims exactly the recorded version. Tag
 * names alone prove nothing; this is the check that binds them.
 *
 * @param {string} repo
 * @param {{ version: string, commit: string }} release
 */
export function verifyUpstreamReleaseManifest(repo, release) {
  const what = `upstream release ${release.version} (${release.commit})`;
  const manifestVersion = readManifestVersion(repo, release.commit, what);
  if (manifestVersion !== release.version) {
    throw new CoreSyncError(
      `upstream release tag ${release.version} points at a manifest claiming ${JSON.stringify(manifestVersion)}`,
    );
  }
}

/**
 * Core-scope commits in `from..to`, from real history.
 *
 * The listing is NUL-delimited (`-z`) because git's default prints paths
 * C-quoted whenever they contain non-ASCII, quote, tab, or newline
 * characters, and a quoted path is one `isCoreScopePath` never accepts —
 * an in-scope tail would silently read as out of scope. Measured record
 * layout for `--format=%H --name-only -z` (git 2.53.0): `<oid>\0`, then per
 * changed file `<path>\0`, where the first path token carries the newline
 * git prints between the commit header and its file names; a commit with no
 * changed files emits no path token. A repository path that is exactly 40
 * lowercase hex characters at the repository root would still be mistaken
 * for a commit id — the same limitation the previous line-based parser had.
 *
 * @param {string} repo
 * @param {string} from
 * @param {string} to
 * @returns {string[]} commit OIDs touching core scope
 */
export function coreCommitsBetween(repo, from, to) {
  const output = runGit(
    repo,
    "log",
    "--format=%H",
    "--name-only",
    "-z",
    `${from}..${to}`,
    "--",
    `packages/${CORE_PACKAGE}/`,
  );
  /** @type {string[]} */
  const commits = [];
  let current = null;
  let currentTouchesCore = false;
  let firstPathOfCommit = true;
  const flush = () => {
    if (current !== null && currentTouchesCore) {
      commits.push(current);
    }
  };
  for (const token of output.split("\0")) {
    if (/^[0-9a-f]{40}$/.test(token)) {
      flush();
      current = token;
      currentTouchesCore = false;
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
    if (file && isCoreScopePath(file)) {
      currentTouchesCore = true;
    }
  }
  flush();
  return commits;
}

/**
 * Core-scope files changed between two revisions.
 *
 * NUL-delimited (`-z`) so the names come back raw and lossless — see
 * `coreCommitsBetween` for why git's default quoting loses paths.
 *
 * @param {string} repo
 * @param {string} from
 * @param {string} to
 * @returns {string[]}
 */
export function changedCoreFiles(repo, from, to) {
  return runGit(repo, "diff", "--name-only", "-z", from, to)
    .split("\0")
    .filter((file) => file && isCoreScopePath(file));
}
