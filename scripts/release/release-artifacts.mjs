#!/usr/bin/env node
// Preflight the complete selection; downstream jobs reuse tagged claims offline.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  renderUpstreamSource,
  resolveUpstreamSource,
  validateUpstreamSource,
} from "../fork-sync/source.mjs";
import {
  findReleaseSection,
  readReleasePackages,
  readTaggedReleaseSection,
  requireReleasePackage,
  requireTaggedReleasePackage,
} from "./release-metadata.mjs";

const start = "<!-- upstream-correspondence:start -->";
const end = "<!-- upstream-correspondence:end -->";

/** @param {string} repo @param {string} out @param {string} specFile */
export function prepareArtifacts(repo, out, specFile) {
  const spec = JSON.parse(readFileSync(specFile, "utf8"));
  if (!Array.isArray(spec) || spec.length === 0)
    throw new Error("release selection must not be empty");
  const registry = registryAt(repo);
  const head = git(repo, ["rev-parse", "HEAD"]).trim();
  const seen = new Set();
  const prepared = spec.map((item) => {
    const registration = requireReleasePackage(registry, item.directory);
    if (
      !new RegExp(
        `^${item.directory}-v(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)$`,
      ).test(item.tag)
    )
      throw new Error(`package/tag mismatch: ${item.tag}`);
    if (seen.has(item.directory))
      throw new Error(`duplicate release for ${item.directory}`);
    seen.add(item.directory);
    const raw = readFileSync(item.section, "utf8");
    if (raw.includes(start) || raw.includes(end))
      throw new Error("raw section contains upstream correspondence markers");
    const rawSection = findReleaseSection(raw, item.tag, item.directory);
    const source =
      registration.kind === "fork"
        ? resolveUpstreamSource({
            repo,
            at: head,
            upstream: registration.upstream,
          })
        : null;
    const block = renderUpstreamSource({
      source,
      upstream: registration.kind === "fork" ? registration.upstream : null,
    });
    // Compose the complete canonical section, including its boundary newline,
    // once. Insertion must not trim these bytes or append another separator.
    const section = `${rawSection.trimEnd()}${block ? `\n\n${block}` : ""}\n\n`;
    findReleaseSection(section, item.tag, item.directory);
    let header;
    if (
      !existsSync(path.join(repo, "packages", item.directory, "CHANGELOG.md"))
    ) {
      const generated = readFileSync(item.generated, "utf8");
      const exact = findReleaseSection(generated, item.tag, item.directory);
      const firstHeading = generated.indexOf(exact);
      if (
        firstHeading < 0 ||
        exact.split("\n")[0] !== rawSection.split("\n")[0]
      )
        throw new Error(
          `generated first CHANGELOG has a different release heading ${item.tag}`,
        );
      header = generated.slice(0, firstHeading);
    }
    return { section, header };
  });
  for (const [index, item] of prepared.entries()) {
    writeFileSync(path.join(out, `section-${index}`), item.section);
    if (item.header !== undefined)
      writeFileSync(path.join(out, `header-${index}`), item.header);
  }
}

/** @param {string} repo @param {string} out @param {string[]} tags */
export function validatePublishedArtifacts(repo, out, tags) {
  const registry = registryAt(repo);
  const head = git(repo, ["rev-parse", "HEAD"]).trim();
  const notes = tags.map((tag) => {
    if (git(repo, ["rev-parse", "--verify", `${tag}^{commit}`]).trim() !== head)
      throw new Error(
        `release tag ${tag} is not at the checked-out release commit`,
      );
    const registration = requireTaggedReleasePackage({ repo, tag, registry });
    const section = readTaggedReleaseSection({
      repo,
      tag,
      packageDirectory: registration.directory,
    });
    if (registration.kind === "fork")
      validateUpstreamSource({
        repo,
        at: head,
        upstream: registration.upstream,
        text: section,
      });
    else if (section.includes(start) || section.includes(end))
      throw new Error("original package has upstream correspondence markers");
    assertTaggedPublishCheckout(repo, tag, registration.directory);
    return section;
  });
  for (const [index, section] of notes.entries())
    writeFileSync(path.join(out, `notes-${index}`), section);
}

function assertTaggedPublishCheckout(repo, tag, directory) {
  const packagePath = `packages/${directory}`;
  const changes = git(repo, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    packagePath,
  ]);
  if (changes)
    throw new Error(
      `working package ${packagePath} differs from validated tag ${tag}: ${changes.trimEnd()}`,
    );
  // Git status can hide assume-unchanged claims; compare critical raw bytes too.
  for (const file of ["package.json", "CHANGELOG.md"]) {
    const relative = `${packagePath}/${file}`;
    const tagged = execFileSync("git", ["show", `${tag}:${relative}`], {
      cwd: repo,
      stdio: "pipe",
    });
    if (!readFileSync(path.join(repo, relative)).equals(tagged))
      throw new Error(`working ${relative} differs from validated tag ${tag}`);
  }
}

/** @param {string} existing @param {string} expected */
export function assertExistingRelease(existing, expected) {
  const count = (needle) => existing.split(needle).length - 1;
  if (count(start) === 0 && count(end) === 0) return; // legacy Release, never overwritten
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
  )
    throw new Error(
      "existing Release has conflicting managed upstream correspondence",
    );
}

function registryAt(repo) {
  return readReleasePackages(
    path.join(repo, "scripts/release/release-packages.json"),
    repo,
  );
}
function git(repo, args) {
  return execFileSync("git", args, {
    cwd: repo,
    encoding: "utf8",
    stdio: "pipe",
  });
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
  else throw new Error("invalid release-artifacts invocation (see --help)");
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
