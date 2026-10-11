// Explicit release registration and identity, independent of synchronization
// policy and source provenance. Tagged section reads preserve Git's raw bytes.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Read the exact tagged fork section without trimming Git's stdout. An
 * inherited upstream section with the same version is not a match.
 *
 * @param {{ repo: string, tag: string, packageDirectory: string }} input
 * @returns {string}
 */
export function readTaggedReleaseSection(input) {
  const { repo, tag, packageDirectory } = input;
  if (
    !/^[a-z][a-z0-9-]*$/.test(packageDirectory) ||
    !tag.startsWith(`${packageDirectory}-v`) ||
    !parseStrictSemVer(tag.slice(`${packageDirectory}-v`.length))
  ) {
    throw new Error(`invalid package release tag ${tag}`);
  }
  let text;
  try {
    text = execFileSync(
      "git",
      ["show", `${tag}:packages/${packageDirectory}/CHANGELOG.md`],
      { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    throw new Error(
      `cannot read tagged CHANGELOG for ${tag}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return findReleaseSection(text, tag, packageDirectory);
}

/**
 * Match the section in already-rendered text before a new tag exists.
 * @param {string} text
 * @param {string} tag
 * @param {string} directory
 * @returns {string}
 */
export function findReleaseSection(text, tag, directory) {
  const version = tag.slice(`${directory}-v`.length);
  if (
    !/^[a-z][a-z0-9-]*$/.test(directory) ||
    !tag.startsWith(`${directory}-v`) ||
    !parseStrictSemVer(version)
  )
    throw new Error(`invalid package release tag ${tag}`);
  const headings = [];
  let fence = null;
  let offset = 0;
  for (const match of text.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)) {
    const entireLine = match[0];
    if (!entireLine) {
      continue;
    }
    const line = entireLine.replace(/\r\n$|[\r\n]$/, "");
    if (fence) {
      const closing = /^ {0,3}(`+|~+)[ \t]*$/.exec(line);
      if (
        closing &&
        closing[1][0] === fence.character &&
        closing[1].length >= fence.length
      ) {
        fence = null;
      }
    } else {
      const opening = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (opening) {
        fence = { character: opening[1][0], length: opening[1].length };
      } else if (line.startsWith("## ")) {
        const heading =
          /^## \[(\d+\.\d+\.\d+)\]\(https:\/\/github\.com\/Jopqior\/gotgenes-pi-packages\/compare\/([^)]*)\) \([^\r\n]*\)[ \t]*$/.exec(
            line,
          );
        const previous = heading?.[2].split("...");
        const first =
          /^## \[(\d+\.\d+\.\d+)\]\(https:\/\/github\.com\/Jopqior\/gotgenes-pi-packages\/releases\/tag\/([^)]*)\) \([^\r\n]*\)[ \t]*$/.exec(
            line,
          );
        headings.push({
          start: offset,
          matches:
            (heading?.[1] === version &&
              previous?.length === 2 &&
              previous[0].startsWith(`${directory}-v`) &&
              parseStrictSemVer(previous[0].slice(`${directory}-v`.length)) !==
                null &&
              previous[1] === tag) ||
            (first?.[1] === version && first[2] === tag),
        });
      }
    }
    offset += entireLine.length;
  }
  if (fence) {
    throw new Error(`unclosed Markdown fence in tagged CHANGELOG ${tag}`);
  }
  const matches = headings.filter((heading) => heading.matches);
  if (matches.length !== 1) {
    throw new Error(
      `${matches.length === 0 ? "missing" : "ambiguous"} exact fork section for ${tag}`,
    );
  }
  const next = headings.find((heading) => heading.start > matches[0].start);
  return text.slice(matches[0].start, next?.start ?? text.length);
}

/** @typedef {{ directory: string, name: string, kind: "original" }} OriginalPackage */
/** @typedef {{ directory: string, name: string, kind: "fork", upstream: { name: string, repository: string, directory: string } }} ForkPackage */
/** @typedef {OriginalPackage | ForkPackage} ReleasePackage */
/** @typedef {{ schemaVersion: 3, packages: ReleasePackage[] }} ReleaseRegistry */

/** @param {string} file @param {string} repo @returns {ReleaseRegistry} */
export function readReleasePackages(file, repo) {
  let document;
  try {
    document = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(
      `cannot read release package registry ${file}: ${String(error)}`,
    );
  }
  const registry = validateReleasePackages(document);
  for (const entry of registry.packages) {
    const manifest = readWorkingManifest(repo, entry.directory);
    requireIdentity(
      manifest,
      entry.name,
      `registered package ${entry.directory}`,
    );
  }
  return registry;
}

/** @param {unknown} value @returns {ReleaseRegistry} */
export function validateReleasePackages(value) {
  const document = requireRecord(value, "release package registry");
  requireKeys(
    document,
    ["schemaVersion", "packages"],
    "release package registry",
  );
  if (document.schemaVersion !== 3 || !Array.isArray(document.packages)) {
    throw new Error(
      "release package registry requires schemaVersion 3 and a packages array",
    );
  }
  /** @type {ReleasePackage[]} */
  const packages = [];
  const directories = new Set();
  const names = new Set();
  for (const [index, candidate] of document.packages.entries()) {
    const what = `release packages[${index}]`;
    const entry = requireRecord(candidate, what);
    if (entry.kind !== "fork" && entry.kind !== "original") {
      throw new Error(
        `${what} has unsupported kind ${JSON.stringify(entry.kind)}`,
      );
    }
    requireKeys(
      entry,
      entry.kind === "fork"
        ? ["directory", "name", "kind", "upstream"]
        : ["directory", "name", "kind"],
      what,
    );
    if (
      typeof entry.directory !== "string" ||
      !/^[a-z][a-z0-9-]*$/.test(entry.directory)
    ) {
      throw new Error(
        `${what}.directory must be a package directory name without traversal`,
      );
    }
    if (
      typeof entry.name !== "string" ||
      !/^@[a-z0-9-]+\/[a-z][a-z0-9-]*$/.test(entry.name)
    ) {
      throw new Error(`${what}.name must be a scoped npm package name`);
    }
    if (directories.has(entry.directory) || names.has(entry.name)) {
      throw new Error(
        `${what} duplicates a registered directory or npm identity`,
      );
    }
    directories.add(entry.directory);
    names.add(entry.name);
    if (entry.kind === "original") {
      packages.push({
        directory: entry.directory,
        name: entry.name,
        kind: "original",
      });
      continue;
    }
    const upstream = requireRecord(entry.upstream, `${what}.upstream`);
    requireKeys(
      upstream,
      ["name", "repository", "directory"],
      `${what}.upstream`,
    );
    if (
      typeof upstream.name !== "string" ||
      !/^@[a-z0-9-]+\/[a-z][a-z0-9-]*$/.test(upstream.name) ||
      typeof upstream.repository !== "string" ||
      !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(upstream.repository) ||
      typeof upstream.directory !== "string" ||
      !/^packages\/[a-z][a-z0-9-]*$/.test(upstream.directory)
    ) {
      throw new Error(
        `${what}.upstream has invalid identity, repository, or package path`,
      );
    }
    packages.push({
      directory: entry.directory,
      name: entry.name,
      kind: "fork",
      upstream: {
        name: upstream.name,
        repository: upstream.repository,
        directory: upstream.directory,
      },
    });
  }
  return { schemaVersion: 3, packages };
}

/** @param {ReleaseRegistry} registry @param {string} directory @returns {ReleasePackage} */
export function requireReleasePackage(registry, directory) {
  const entry = registry.packages.find(
    (candidate) => candidate.directory === directory,
  );
  if (!entry) {
    throw new Error(`no release package registration for ${directory}`);
  }
  return entry;
}

/**
 * Resolve explicit registration and check both identity fields at the selected
 * tag, never the working tree or current HEAD.
 * @param {{ repo: string, tag: string, registry: ReleaseRegistry }} input
 * @returns {ReleasePackage}
 */
export function requireTaggedReleasePackage({ repo, tag, registry }) {
  const match = /^([a-z][a-z0-9-]*)-v(\d+\.\d+\.\d+)$/.exec(tag);
  if (!match || !parseStrictSemVer(match[2])) {
    throw new Error(`invalid package release tag ${tag}`);
  }
  const registration = requireReleasePackage(registry, match[1]);
  const manifest = readTaggedManifest(repo, tag, registration.directory);
  requireIdentity(manifest, registration.name, `tag ${tag}`);
  requireVersion(manifest, match[2], `tag ${tag}`);
  return registration;
}

function readTaggedManifest(repo, tag, directory) {
  let text;
  try {
    text = execFileSync(
      "git",
      ["show", `${tag}:packages/${directory}/package.json`],
      {
        cwd: repo,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: "pipe",
      },
    );
  } catch (error) {
    throw new Error(
      `cannot read tagged ${directory} manifest at ${tag}: ${String(error)}`,
    );
  }
  return parseManifest(text, `packages/${directory} at ${tag}`);
}

function readWorkingManifest(repo, directory) {
  let text;
  try {
    text = readFileSync(
      path.join(repo, "packages", directory, "package.json"),
      "utf8",
    );
  } catch (error) {
    throw new Error(
      `cannot read registered package ${directory} manifest: ${String(error)}`,
    );
  }
  return parseManifest(text, `packages/${directory}`);
}

function parseManifest(text, what) {
  try {
    return requireRecord(JSON.parse(text), `${what} manifest`);
  } catch (error) {
    throw new Error(`invalid ${what} manifest: ${String(error)}`);
  }
}

function requireIdentity(manifest, name, what) {
  if (manifest.name !== name) {
    throw new Error(
      `${what} npm name does not match registration: ${JSON.stringify(manifest.name)} != ${name}`,
    );
  }
}

function requireVersion(manifest, version, what) {
  if (manifest.version !== version) {
    throw new Error(
      `${what} manifest version does not match tag: ${JSON.stringify(manifest.version)} != ${version}`,
    );
  }
}

function requireRecord(value, what) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${what} must be an object`);
  }
  return value;
}

function requireKeys(record, allowed, what) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw new Error(`unknown ${what} field '${key}'`);
    }
  }
}

// Stable release-tag syntax only; no release levels or version policy.
function parseStrictSemVer(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;
  const parts = [match[1], match[2], match[3]];
  if (parts.some((part) => part.length > 1 && part.startsWith("0")))
    return null;
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((number) => !Number.isSafeInteger(number))) return null;
  return { major: numbers[0], minor: numbers[1], patch: numbers[2] };
}
