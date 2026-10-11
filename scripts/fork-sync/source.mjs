import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const startMarker = "<!-- upstream-correspondence:start -->";
const endMarker = "<!-- upstream-correspondence:end -->";
const tailParagraph = "Includes unreleased changes to this package.";

/**
 * @typedef {{name: string, repository: string, directory: string}} UpstreamPackage
 * @typedef {{upstreamPackage: string, upstreamVersion: string, releaseCommit: string, incorporatedCommit: string, unreleasedPackageChanges: boolean}} UpstreamSource
 */

/**
 * Resolve incorporated source independently of fork versions and historical ledgers.
 * @param {{repo: string, at: string, upstream: UpstreamPackage}} input
 * @returns {UpstreamSource}
 */
export function resolveUpstreamSource({ repo, at, upstream }) {
  requireUpstream(upstream);
  repo = path.resolve(repo);
  requireCompleteHistory(repo);
  const head = git(repo, "rev-parse", "--verify", `${at}^{commit}`);
  const temporary = mkdtempSync(path.join(tmpdir(), "fork-sync-source-"));
  try {
    git(repo, "clone", "--bare", "--shared", "--no-tags", repo, temporary);
    git(
      temporary,
      "fetch",
      "--no-tags",
      "--no-write-fetch-head",
      upstreamUrl(upstream),
      "+refs/heads/main:refs/fork-sync/upstream-main",
    );
    const main = git(
      temporary,
      "rev-parse",
      "--verify",
      "refs/fork-sync/upstream-main^{commit}",
    );
    const integration = incorporatedParent(temporary, head, main);
    const tagPrefix = `${path.posix.basename(upstream.directory)}-v`;
    const candidates = stableReleases(
      git(
        temporary,
        "ls-remote",
        "--tags",
        upstreamUrl(upstream),
        `${tagPrefix}*`,
      ),
      tagPrefix,
    );
    // Enumerating complete ancestry also makes missing required objects an inspection error.
    const contained = new Set(
      git(temporary, "rev-list", integration.tip).split("\n"),
    );
    const release = candidates.find((candidate) =>
      contained.has(candidate.commit),
    );
    if (!release)
      throw new Error(
        "no contained stable upstream release for selected integration",
      );
    verifyManifest(temporary, upstream, release.commit, release.version);
    return {
      upstreamPackage: upstream.name,
      upstreamVersion: release.version,
      releaseCommit: release.commit,
      incorporatedCommit: integration.tip,
      unreleasedPackageChanges: packageTail(
        temporary,
        upstream.directory,
        release.commit,
        integration.tip,
      ),
    };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

/**
 * Render only the canonical new source block; original packages pass null source.
 * @param {{source: UpstreamSource | null, upstream?: UpstreamPackage}} input
 * @returns {string}
 */
export function renderUpstreamSource({ source, upstream }) {
  if (source === null) return "";
  requireUpstream(upstream);
  requireSourceValue(source, upstream);
  const base = upstreamUrl(upstream).slice(0, -4);
  return [
    startMarker,
    "### Upstream correspondence",
    "",
    `Direct upstream package: \`${source.upstreamPackage}\``,
    "",
    `Contained stable upstream release: \`${source.upstreamVersion}\``,
    "",
    `Stable release source: [fixed upstream release commit](${base}/blob/${source.releaseCommit}/${upstream.directory})`,
    "",
    `Incorporated source: [fixed incorporated upstream commit](${base}/blob/${source.incorporatedCommit}/${upstream.directory})`,
    "",
    ...(source.unreleasedPackageChanges ? [tailParagraph, ""] : []),
    "This records incorporated source provenance, not behavioral equivalence or the identity of historical npm artifacts.",
    endMarker,
  ].join("\n");
}

/**
 * Verify prepared claims using local objects only, never upstream transport or tag selection.
 * @param {{repo?: string, at?: string, upstream: UpstreamPackage | null, text: string}} input
 * @returns {UpstreamSource | null}
 */
export function validateUpstreamSource({ repo, at, upstream, text }) {
  if (!upstream) {
    if (text.includes(startMarker) || text.includes(endMarker))
      throw new Error("original package must not carry a source block");
    return null;
  }
  requireUpstream(upstream);
  const block = extractBlock(text);
  const source = {
    upstreamPackage: /^Direct upstream package: `([^`\n]+)`$/m.exec(block)?.[1],
    upstreamVersion: /^Contained stable upstream release: `([^`\n]+)`$/m.exec(
      block,
    )?.[1],
    releaseCommit:
      /^Stable release source: \[fixed upstream release commit\]\(https:\/\/[^\n]+\/blob\/([a-f0-9]+)\/[^\n]+\)$/m.exec(
        block,
      )?.[1],
    incorporatedCommit:
      /^Incorporated source: \[fixed incorporated upstream commit\]\(https:\/\/[^\n]+\/blob\/([a-f0-9]+)\/[^\n]+\)$/m.exec(
        block,
      )?.[1],
    unreleasedPackageChanges: block.split("\n").includes(tailParagraph),
  };
  requireSourceValue(source, upstream);
  if (block !== renderUpstreamSource({ source, upstream }))
    throw new Error("conflicting or malformed new source block");
  requireCompleteHistory(repo);
  const head = git(repo, "rev-parse", "--verify", `${at}^{commit}`);
  const integration = incorporatedParent(repo, head, source.incorporatedCommit);
  if (integration.tip !== source.incorporatedCommit)
    throw new Error("source incorporated commit is not the integration parent");
  if (!isAncestor(repo, source.releaseCommit, source.incorporatedCommit))
    throw new Error(
      "source release commit is not contained in incorporated source",
    );
  verifyManifest(repo, upstream, source.releaseCommit, source.upstreamVersion);
  if (
    packageTail(
      repo,
      upstream.directory,
      source.releaseCommit,
      source.incorporatedCommit,
    ) !== source.unreleasedPackageChanges
  )
    throw new Error("source package tail claim conflicts with local history");
  return source;
}

function incorporatedParent(repo, at, main) {
  const chain = git(repo, "rev-list", "--first-parent", "--parents", at)
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(" "));
  let selected;
  for (const [index, [merge, ...parents]] of chain.entries()) {
    if (parents.length < 2 || isAncestor(repo, merge, main)) continue;
    const upstreamParents = parents.map((parent) =>
      isAncestor(repo, parent, main),
    );
    if (!upstreamParents.some(Boolean)) {
      if (selected) continue;
      // A fork feature must share a fork-side first-parent ancestor, not only upstream history.
      const provenFeature = parents
        .slice(1)
        .every((parent) =>
          chain
            .slice(index + 1)
            .some(
              ([base]) =>
                !isAncestor(repo, base, main) && isAncestor(repo, base, parent),
            ),
        );
      if (!provenFeature)
        throw new Error(`ambiguous newer source merge origin at ${merge}`);
      continue;
    }
    if (parents.length !== 2)
      throw new Error(
        `ambiguous upstream-carrying octopus topology at ${merge}`,
      );
    if (upstreamParents[0])
      throw new Error(`invalid fork first-parent topology at ${merge}`);
    if (!upstreamParents[1]) continue;
    const integration = { merge, tip: parents[1] };
    if (!selected) selected = integration;
    else if (!isAncestor(repo, integration.tip, selected.tip))
      throw new Error(
        `regressive or incomparable integration ordering at ${selected.merge}`,
      );
  }
  if (!selected)
    throw new Error("no eligible first-parent upstream integration");
  return selected;
}

function packageTail(repo, directory, release, tip) {
  const commits = git(repo, "rev-list", `${release}..${tip}`)
    .split("\n")
    .filter(Boolean);
  return commits.some((commit) => {
    const names = gitOutput(
      repo,
      "diff-tree",
      "--root",
      "-m",
      "-r",
      "--no-commit-id",
      "--name-only",
      "-z",
      commit,
      "--",
      directory,
    );
    return names
      .split("\0")
      .filter(Boolean)
      .some((filename) => releasePath(filename, directory));
  });
}
function releasePath(filename, directory) {
  if (!filename.startsWith(`${directory}/`)) return false;
  const relative = filename.slice(directory.length + 1);
  return (
    relative !== "CHANGELOG.md" &&
    !/^docs\/(plans|retro|architecture|decisions|assets)\//.test(relative)
  );
}
function stableReleases(listing, prefix) {
  const tags = new Map();
  for (const line of listing.split("\n")) {
    const match =
      /^([a-f0-9]{40}|[a-f0-9]{64})\trefs\/tags\/(.+?)(\^\{\})?$/.exec(line);
    if (!match?.[2].startsWith(prefix)) continue;
    const [, oid, name, peeled] = match;
    const version = name.slice(prefix.length);
    if (!stableVersion(version)) continue;
    const entry = tags.get(name) ?? { version };
    if (peeled) entry.peeled = oid;
    else entry.oid = oid;
    tags.set(name, entry);
  }
  return [...tags.values()]
    .map((entry) => ({
      version: entry.version,
      commit: entry.peeled ?? entry.oid,
    }))
    .sort((a, b) => compareVersions(a.version, b.version));
}
function stableVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
    version ?? "",
  );
  return match ? match.slice(1).map(BigInt) : null;
}
function compareVersions(left, right) {
  const a = stableVersion(left),
    b = stableVersion(right);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? -1 : 1;
  return 0;
}
function verifyManifest(repo, upstream, commit, version) {
  let manifest;
  try {
    manifest = JSON.parse(
      git(repo, "show", `${commit}:${upstream.directory}/package.json`),
    );
  } catch (error) {
    throw new Error(`cannot read upstream release manifest: ${error.message}`, {
      cause: error,
    });
  }
  if (manifest?.name !== upstream.name)
    throw new Error(`upstream release manifest name must be ${upstream.name}`);
  if (manifest.version !== version)
    throw new Error(`upstream release manifest version must be ${version}`);
}
function extractBlock(text) {
  if (
    text.split(startMarker).length !== 2 ||
    text.split(endMarker).length !== 2
  )
    throw new Error("missing or duplicate new source block");
  const start = text.indexOf(startMarker),
    end = text.indexOf(endMarker);
  if (end < start) throw new Error("malformed new source block markers");
  return text.slice(start, end + endMarker.length);
}
function requireSourceValue(source, upstream) {
  if (
    !source ||
    source.upstreamPackage !== upstream.name ||
    !stableVersion(source.upstreamVersion) ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(source.releaseCommit ?? "") ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(source.incorporatedCommit ?? "") ||
    typeof source.unreleasedPackageChanges !== "boolean"
  )
    throw new Error("invalid source block values for registered upstream");
}
function requireUpstream(upstream) {
  if (
    !upstream ||
    !/^[\w.-]+\/[\w.-]+$/.test(upstream.repository) ||
    !/^packages\/[\w.-]+$/.test(upstream.directory) ||
    typeof upstream.name !== "string" ||
    !upstream.name
  )
    throw new Error("source resolution requires registered upstream identity");
}
function upstreamUrl(upstream) {
  return `https://github.com/${upstream.repository}.git`;
}
function requireCompleteHistory(repo) {
  if (git(repo, "rev-parse", "--is-shallow-repository") !== "false")
    throw new Error("shallow source history is unsupported");
  const args = [
    "config",
    "--get-regexp",
    "^(extensions\\.partialclone|remote\\..*\\.promisor)$",
  ];
  const result = gitResult(repo, ...args);
  if (result.error || ![0, 1].includes(result.status))
    throw gitFailure(repo, args, result);
  if (
    result.status === 0 &&
    result.stdout.split("\n").some((line) => line && !line.endsWith(" false"))
  )
    throw new Error("partial source history is unsupported");
}
function isAncestor(repo, ancestor, descendant) {
  const args = ["merge-base", "--is-ancestor", ancestor, descendant];
  const result = gitResult(repo, ...args);
  if (!result.error && result.status === 1) return false;
  if (result.error || result.status !== 0) throw gitFailure(repo, args, result);
  return true;
}
function gitResult(repo, ...args) {
  return spawnSync("git", args, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}
function git(repo, ...args) {
  return gitOutput(repo, ...args).trim();
}
function gitOutput(repo, ...args) {
  const result = gitResult(repo, ...args);
  if (result.error || result.status !== 0) throw gitFailure(repo, args, result);
  return result.stdout;
}
function gitFailure(repo, args, result) {
  return new Error(
    `git ${args.join(" ")} in ${repo} failed (status ${result.status}): ${result.stderr ?? ""}${result.stdout ?? ""}`,
    { cause: result.error },
  );
}
