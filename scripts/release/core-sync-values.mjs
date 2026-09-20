// Pure value algebra for the core sync release policy: the shared error
// contract, strict stable-SemVer parsing and comparison, release-level
// mapping and combination, and version increment.
//
// A leaf module — it imports nothing, so every other core-sync module can
// throw the shared CoreSyncError while the import graph stays acyclic
// (state validates versions; evidence and cliff throw on process failure;
// the decision composes all of it).

/** @typedef {"none" | "patch" | "minor" | "major"} ReleaseLevel */

/** Error whose message is a complete, actionable diagnostic for the operator. */
export class CoreSyncError extends Error {}

const LEVEL_ORDER = ["none", "patch", "minor", "major"];

/**
 * @param {unknown} value
 * @returns {value is ReleaseLevel}
 */
export function isReleaseLevel(value) {
  return typeof value === "string" && LEVEL_ORDER.includes(value);
}

/**
 * Parse a strict stable SemVer version: three numeric parts, no prerelease or
 * build suffix, no leading zeros. Upstream and fork release tags in this
 * policy are always stable releases.
 *
 * @param {unknown} value
 * @returns {{ major: number, minor: number, patch: number } | null}
 */
export function parseStrictSemVer(value) {
  if (typeof value !== "string") {
    return null;
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    return null;
  }
  const parts = [match[1], match[2], match[3]];
  if (parts.some((part) => part.length > 1 && part.startsWith("0"))) {
    return null;
  }
  return {
    major: Number(parts[0]),
    minor: Number(parts[1]),
    patch: Number(parts[2]),
  };
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} -1, 0, or 1
 */
export function compareVersions(a, b) {
  const left = parseStrictSemVer(a);
  const right = parseStrictSemVer(b);
  if (!left || !right) {
    throw new CoreSyncError(`invalid SemVer in comparison: ${a} vs ${b}`);
  }
  for (const part of /** @type {("major" | "minor" | "patch")[]} */ ([
    "major",
    "minor",
    "patch",
  ])) {
    if (left[part] !== right[part]) {
      return left[part] < right[part] ? -1 : 1;
    }
  }
  return 0;
}

/**
 * The upstream contribution of moving an incorporated upstream release from
 * `baseline` to `target`: the single SemVer step between them, regardless of
 * how many intermediate upstream releases the window skipped.
 *
 * @param {string} baseline
 * @param {string} target
 * @returns {ReleaseLevel}
 */
export function levelFromVersions(baseline, target) {
  const comparison = compareVersions(target, baseline);
  if (comparison < 0) {
    throw new CoreSyncError(
      `upstream release regressed: ${target} precedes ${baseline}`,
    );
  }
  if (comparison === 0) {
    return "none";
  }
  const base = parseStrictSemVer(baseline);
  const goal = parseStrictSemVer(target);
  if (!base || !goal) {
    throw new CoreSyncError(
      `invalid SemVer in mapping: ${baseline} or ${target}`,
    );
  }
  if (goal.major > base.major) {
    return "major";
  }
  if (goal.minor > base.minor) {
    return "minor";
  }
  return "patch";
}

/**
 * @param {...ReleaseLevel} levels
 * @returns {ReleaseLevel}
 */
export function combineLevels(...levels) {
  return levels.reduce(
    (highest, level) =>
      LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(highest)
        ? level
        : highest,
    /** @type {ReleaseLevel} */ ("none"),
  );
}

/**
 * @param {string} version a strict stable SemVer version
 * @param {ReleaseLevel} level
 * @returns {string}
 */
export function incrementVersion(version, level) {
  const parsed = parseStrictSemVer(version);
  if (!parsed) {
    throw new CoreSyncError(`invalid SemVer to increment: ${version}`);
  }
  switch (level) {
    case "none":
      return version;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "major":
      return `${parsed.major + 1}.0.0`;
  }
}
