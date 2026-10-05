#!/usr/bin/env node
import { execFileSync } from "node:child_process";
// Build the complete release artifact set before any tracked write or external
// effect. Downstream jobs consume the tagged commit, not a moving branch tip.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  renderCorrespondenceTable,
  updateCorrespondenceDocument,
} from "./correspondence-table.mjs";
import {
  readForkSyncState,
  validateForkSyncState,
} from "./fork-sync/state.mjs";
import { ForkSyncError } from "./fork-sync/values.mjs";
import { requireForkSyncTarget } from "./fork-sync-targets.mjs";
import {
  findReleaseSection,
  readReleasePackages,
  readTaggedReleaseSection,
  renderUpstreamCorrespondence,
  requireReleasePackage,
  resolvePendingCorrespondence,
  resolvePublishedCorrespondence,
} from "./release-correspondence.mjs";

/** @param {string} repo @param {string} out @param {string} specFile */
export function prepareArtifacts(repo, out, specFile) {
  const spec = JSON.parse(readFileSync(specFile, "utf8"));
  if (!Array.isArray(spec) || spec.length === 0)
    throw new ForkSyncError("release selection must not be empty");
  const registry = registryAt(repo);
  const projections = new Map();
  for (const [index, item] of spec.entries()) {
    const provenance = resolvePendingCorrespondence({
      repo,
      tag: item.tag,
      registry,
      decision: item.decision,
    });
    if (item.directory !== item.tag.slice(0, item.tag.lastIndexOf("-v")))
      throw new ForkSyncError(`package/tag mismatch: ${item.tag}`);
    const section = readFileSync(item.section, "utf8");
    // This format is intentionally limited to sections emitted by this repo's
    // git-cliff configuration; a drifted renderer must not publish a guess.
    findReleaseSection(section, item.tag, item.directory);
    const block = renderUpstreamCorrespondence(provenance);
    const decorated = `${section.trimEnd()}${block ? `\n\n${block}` : ""}\n`;
    assertReleaseProvenance(decorated, provenance);
    writeFileSync(path.join(out, `section-${index}`), decorated);
    const changelogFile = path.join(
      repo,
      "packages",
      item.directory,
      "CHANGELOG.md",
    );
    if (!existsSync(changelogFile)) {
      const generated = readFileSync(item.generated, "utf8");
      const firstHeading = generated.indexOf("## ");
      if (
        firstHeading < 0 ||
        !findReleaseSection(generated, item.tag, item.directory).startsWith(
          section.slice(0, section.indexOf("\n")),
        )
      ) {
        throw new ForkSyncError(
          `generated first CHANGELOG has a different release heading ${item.tag}`,
        );
      }
      writeFileSync(
        path.join(out, `header-${index}`),
        generated.slice(0, firstHeading),
      );
    }
    if (provenance.kind === "fork") {
      const target = requireForkSyncTarget(item.directory);
      if (projections.has(item.directory))
        throw new ForkSyncError(
          `duplicate pending fork release for ${item.directory}`,
        );
      const projected = structuredClone(stateAt(repo, target));
      projections.set(item.directory, {
        target,
        projected,
        pending: { tag: item.tag, decision: item.decision },
      });
      projected.releases.push({
        forkTag: item.tag,
        upstream: item.decision.upstream,
        upstreamTip: item.decision.upstreamTip,
      });
    }
  }
  const artifacts = [];
  for (const { target, projected, pending } of projections.values()) {
    validateForkSyncState(projected, target.directory);
    const document = readFileSync(
      path.join(repo, target.correspondencePath),
      "utf8",
    );
    const table = renderCorrespondenceTable({
      repo,
      registry,
      state: projected,
      directory: target.directory,
      pending,
    });
    const stateFile = `state-${target.directory}.json`;
    const correspondenceFile = `correspondence-${target.directory}.md`;
    writeFileSync(
      path.join(out, stateFile),
      `${JSON.stringify(projected, null, 2)}\n`,
    );
    writeFileSync(
      path.join(out, correspondenceFile),
      updateCorrespondenceDocument(document, table),
    );
    artifacts.push({ ...target, stateFile, correspondenceFile });
  }
  writeFileSync(
    path.join(out, "fork-artifacts.json"),
    `${JSON.stringify(artifacts, null, 2)}\n`,
  );
}

/** @param {string} repo @param {string} out @param {string[]} tags */
export function validatePublishedArtifacts(repo, out, tags) {
  const registry = registryAt(repo);
  const states = new Map();
  for (const [index, tag] of tags.entries()) {
    const peeled = execFileSync(
      "git",
      ["rev-parse", "--verify", `${tag}^{commit}`],
      { cwd: repo, encoding: "utf8" },
    ).trim();
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    if (peeled !== head)
      throw new ForkSyncError(
        `release tag ${tag} is not at the checked-out release commit`,
      );
    const directory = tag.slice(0, tag.lastIndexOf("-v"));
    const registration = requireReleasePackage(registry, directory);
    if (registration.kind === "fork" && !states.has(directory))
      states.set(directory, stateAt(repo, requireForkSyncTarget(directory)));
    const provenance = resolvePublishedCorrespondence({
      repo,
      tag,
      registry,
      state: states.get(directory) ?? { releases: [] },
    });
    const section = readTaggedReleaseSection({
      repo,
      tag,
      packageDirectory: directory,
    });
    assertReleaseProvenance(section, provenance);
    // pnpm publish --no-git-checks packs the checkout, not the tagged tree.
    // A dirty package could publish different bits after the tag validates.
    assertTaggedPublishCheckout(repo, tag, directory);
    writeFileSync(path.join(out, `notes-${index}`), section);
  }
}

function assertTaggedPublishCheckout(repo, tag, directory) {
  const packagePath = `packages/${directory}`;
  const changes = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--", packagePath],
    { cwd: repo, encoding: "utf8" },
  );
  if (changes) {
    throw new ForkSyncError(
      `working package ${packagePath} differs from validated tag ${tag}: ${changes.trimEnd()}`,
    );
  }
  // Check critical published claims by bytes even if Git index flags suppress
  // a working-tree status entry (e.g. assume-unchanged).
  for (const file of ["package.json", "CHANGELOG.md"]) {
    const relative = `${packagePath}/${file}`;
    const tagged = execFileSync("git", ["show", `${tag}:${relative}`], {
      cwd: repo,
    });
    const working = readFileSync(path.join(repo, relative));
    if (!working.equals(tagged)) {
      throw new ForkSyncError(
        `working ${relative} differs from validated tag ${tag}`,
      );
    }
  }
}

/** @param {string} section @param {ReturnType<typeof resolvePublishedCorrespondence>} provenance */
export function assertReleaseProvenance(section, provenance) {
  const start = "<!-- upstream-correspondence:start -->";
  const end = "<!-- upstream-correspondence:end -->";
  const starts = section.split(start).length - 1;
  const ends = section.split(end).length - 1;
  if (provenance.kind === "original") {
    if (starts !== 0 || ends !== 0)
      throw new ForkSyncError(
        "original package has upstream correspondence markers",
      );
    return;
  }
  const block = renderUpstreamCorrespondence(provenance);
  if (starts !== 1 || ends !== 1 || !section.includes(block))
    throw new ForkSyncError(
      "tagged CHANGELOG has missing or conflicting managed upstream correspondence",
    );
}

/** @param {string} existing @param {string} expected */
export function assertExistingRelease(existing, expected) {
  const start = "<!-- upstream-correspondence:start -->";
  const end = "<!-- upstream-correspondence:end -->";
  const count = (needle) => existing.split(needle).length - 1;
  if (count(start) === 0 && count(end) === 0) return; // legacy Release, never overwritten here
  const sectionStart = expected.indexOf(start);
  if (
    sectionStart < 0 ||
    count(start) !== 1 ||
    count(end) !== 1 ||
    !existing.includes(
      expected.slice(
        sectionStart,
        expected.indexOf(end, sectionStart) + end.length,
      ),
    )
  ) {
    throw new ForkSyncError(
      "existing Release has conflicting managed upstream correspondence",
    );
  }
}

function registryAt(repo) {
  return readReleasePackages(
    path.join(repo, "scripts/release/release-packages.json"),
    repo,
  );
}
function stateAt(repo, target) {
  return readForkSyncState(path.join(repo, target.statePath), target.directory);
}

function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    process.stdout.write(
      "Usage: node scripts/release/release-artifacts.mjs prepare <repo> <temp-dir> <spec-json> | published <repo> <temp-dir> <tag>... | existing <body-file> <notes-file>\n",
    );
    return;
  }
  const [mode, ...rest] = args;
  if (mode === "prepare" && rest.length === 3) prepareArtifacts(...rest);
  else if (mode === "published" && rest.length >= 3)
    validatePublishedArtifacts(rest[0], rest[1], rest.slice(2));
  else if (mode === "existing" && rest.length === 2)
    assertExistingRelease(
      readFileSync(rest[0], "utf8"),
      readFileSync(rest[1], "utf8"),
    );
  else
    throw new ForkSyncError(
      "invalid release-artifacts invocation (see --help)",
    );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
