#!/usr/bin/env node
// The marked correspondence view derives from verified tag evidence, never a
// second human-maintained mapping. Preparation may supply a verified pending
// decision before its tag exists; the CLI reads only committed releases.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CORE_PACKAGE, readCoreSyncState } from "./core-sync-state.mjs";
import { CoreSyncError, compareVersions } from "./core-sync-values.mjs";
import {
  readReleasePackages,
  requireReleasePackage,
  resolvePendingCorrespondence,
  resolvePublishedCorrespondence,
} from "./release-correspondence.mjs";

const START = "<!-- release-correspondence:start -->";
const END = "<!-- release-correspondence:end -->";

/**
 * @param {{ repo: string, registry: import('./release-correspondence.mjs').ReleaseRegistry, state: import('./core-sync-state.mjs').CoreSyncState, pending?: { tag: string, decision: { nextTag: string | null, upstream: { version: string, commit: string }, upstreamTip: string } } }} input
 * @returns {string}
 */
export function renderCorrespondenceTable(input) {
  const registration = requireReleasePackage(input.registry, CORE_PACKAGE);
  if (registration.kind !== "fork") {
    throw new CoreSyncError(`${CORE_PACKAGE} must be registered as a fork`);
  }
  const pendingTag = input.pending?.tag;
  const projectedRow = input.state.releases.find(
    (row) => row.forkTag === pendingTag,
  );
  if (
    projectedRow &&
    input.pending &&
    (projectedRow.upstream.version !==
      input.pending.decision.upstream.version ||
      projectedRow.upstream.commit !== input.pending.decision.upstream.commit ||
      projectedRow.upstreamTip !== input.pending.decision.upstreamTip)
  ) {
    throw new CoreSyncError(
      `projected correspondence disagrees with pending decision for ${pendingTag}`,
    );
  }
  const released = input.state.releases
    .filter((row) => row.forkTag !== pendingTag)
    .map((row) => ({
      tag: row.forkTag,
      provenance: resolvePublishedCorrespondence({
        repo: input.repo,
        tag: row.forkTag,
        registry: input.registry,
        state: input.state,
      }),
    }));
  if (input.pending) {
    released.push({
      tag: input.pending.tag,
      provenance: resolvePendingCorrespondence({
        repo: input.repo,
        tag: input.pending.tag,
        registry: input.registry,
        decision: input.pending.decision,
      }),
    });
  }
  const prefix = `${CORE_PACKAGE}-v`;
  released.sort((a, b) =>
    compareVersions(a.tag.slice(prefix.length), b.tag.slice(prefix.length)),
  );
  const rows = released.map(({ tag, provenance }) => {
    if (provenance.kind !== "fork" || !tag.startsWith(prefix)) {
      throw new CoreSyncError(`invalid fork correspondence row for ${tag}`);
    }
    const version = tag.slice(prefix.length);
    return [
      version,
      `\`${provenance.upstreamVersion}\``,
      `[source](${provenance.sourceUrl})`,
    ];
  });
  const cells = [
    [
      `Fork \`${registration.name}\``,
      "Direct upstream release",
      "Fixed source",
    ],
    ...rows,
  ];
  const widths = [0, 1, 2].map((column) =>
    Math.max(3, ...cells.map((row) => row[column].length)),
  );
  const line = (row) =>
    `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(" | ")} |\n`;
  return (
    line(cells[0]) +
    line(widths.map((width) => "-".repeat(width))) +
    rows.map(line).join("")
  );
}

/**
 * Replace only the bytes between exactly one pair of standalone markers.
 * @param {string} document
 * @param {string} table
 * @returns {string}
 */
export function updateCorrespondenceDocument(document, table) {
  const starts = [
    ...document.matchAll(/<!-- release-correspondence:start -->/g),
  ];
  const ends = [...document.matchAll(/<!-- release-correspondence:end -->/g)];
  if (starts.length !== 1 || ends.length !== 1) {
    throw new CoreSyncError(
      "correspondence region requires exactly one start and end marker",
    );
  }
  const begin = starts[0].index;
  const finish = ends[0].index;
  if (
    begin >= finish ||
    (begin > 0 && document[begin - 1] !== "\n") ||
    document[begin + START.length] !== "\n" ||
    (finish > 0 && document[finish - 1] !== "\n") ||
    !["\n", undefined].includes(document[finish + END.length])
  ) {
    throw new CoreSyncError("malformed correspondence region markers");
  }
  return (
    document.slice(0, begin + START.length + 1) +
    "\n" +
    table +
    "\n" +
    document.slice(finish)
  );
}

function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    process.stdout.write(
      "Usage: node scripts/release/correspondence-table.mjs (--check|--write) [--repo <path>]\n",
    );
    return;
  }
  let repo = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const flags = [...args];
  const repoIndex = flags.indexOf("--repo");
  if (repoIndex !== -1) {
    if (!flags[repoIndex + 1]) {
      throw new CoreSyncError("--repo requires a path");
    }
    repo = path.resolve(flags[repoIndex + 1]);
    flags.splice(repoIndex, 2);
  }
  if (flags.length !== 1 || !["--check", "--write"].includes(flags[0])) {
    throw new CoreSyncError(
      "expected exactly one of --check or --write (see --help)",
    );
  }
  const state = readCoreSyncState(
    path.join(repo, "scripts/release/core-sync-state.json"),
  );
  const registry = readReleasePackages(
    path.join(repo, "scripts/release/release-packages.json"),
    repo,
  );
  const documentPath = path.join(repo, "docs/upstream-sync.md");
  const current = readFileSync(documentPath, "utf8");
  const expected = updateCorrespondenceDocument(
    current,
    renderCorrespondenceTable({ repo, state, registry }),
  );
  if (flags[0] === "--check") {
    if (current !== expected) {
      throw new CoreSyncError(
        `generated correspondence table is stale: ${documentPath} (run --write)`,
      );
    }
  } else if (current !== expected) {
    writeFileSync(documentPath, expected);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
