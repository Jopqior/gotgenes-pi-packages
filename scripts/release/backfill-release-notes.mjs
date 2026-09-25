#!/usr/bin/env node
// A reviewed snapshot is permission to attempt notes-only edits, not a lock on
// GitHub Releases. Another editor can still race the final preflight read.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCoreSyncState } from "./core-sync-state.mjs";
import { CoreSyncError } from "./core-sync-values.mjs";
import {
  readReleasePackages,
  renderUpstreamCorrespondence,
  resolvePublishedCorrespondence,
} from "./release-correspondence.mjs";

const REPOSITORY = "Jopqior/gotgenes-pi-packages";
const RELEASE_FIELDS = [
  "databaseId",
  "id",
  "tagName",
  "name",
  "body",
  "isDraft",
  "isPrerelease",
  "targetCommitish",
  "createdAt",
  "publishedAt",
  "url",
  "isImmutable",
];
const START = "<!-- upstream-correspondence:start -->";
const END = "<!-- upstream-correspondence:end -->";

/** Capture the entire explicitly selected fork batch without editing remote releases. */
export function previewReview({ repo, tags, readRelease }) {
  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    new Set(tags).size !== tags.length ||
    tags.some((tag) => typeof tag !== "string")
  )
    throw new CoreSyncError("select distinct explicit release tags");
  requireCommittedEvidence(repo, "scripts/release/release-packages.json");
  requireCommittedEvidence(repo, "scripts/release/core-sync-state.json");
  const registry = readReleasePackages(
    path.join(repo, "scripts/release/release-packages.json"),
    repo,
  );
  const state = readCoreSyncState(
    path.join(repo, "scripts/release/core-sync-state.json"),
  );
  const review = {
    schemaVersion: 1,
    repository: REPOSITORY,
    releases: [],
    missing: [],
  };
  for (const tag of tags) {
    const provenance = resolvePublishedCorrespondence({
      repo,
      tag,
      registry,
      state,
    });
    if (provenance.kind === "original") continue;
    const tagOid = execFileSync(
      "git",
      ["rev-parse", "--verify", `${tag}^{commit}`],
      { cwd: repo, encoding: "utf8" },
    ).trim();
    const registration = registry.packages.find((entry) =>
      tag.startsWith(`${entry.directory}-v`),
    );
    const evidence = state.releases.find((entry) => entry.forkTag === tag);
    const identity = {
      directory: registration.directory,
      name: registration.name,
      upstream: registration.upstream,
      evidenceRoute: registration.evidence,
    };
    const common = { tag, tagOid, identity, evidence, provenance };
    const remote = readRelease(tag);
    if (remote === null) {
      review.missing.push(common);
      continue;
    }
    validateRelease(remote, tag);
    review.releases.push({
      ...common,
      release: remote,
      proposedBody: proposedBody(remote.body, provenance),
    });
  }
  return review;
}

function requireCommittedEvidence(repo, file) {
  const committed = execFileSync("git", ["show", `HEAD:${file}`], {
    cwd: repo,
    encoding: "utf8",
  });
  if (readFileSync(path.join(repo, file), "utf8") !== committed)
    throw new CoreSyncError(`uncommitted release evidence: ${file}`);
}

function proposedBody(body, provenance) {
  const block = renderUpstreamCorrespondence(provenance);
  const starts = body.split(START).length - 1;
  const ends = body.split(END).length - 1;
  if (starts !== ends || starts > 1 || ends > 1)
    throw new CoreSyncError(
      "malformed or duplicate managed correspondence block",
    );
  if (starts === 1) {
    if (
      !body.includes(block) ||
      !body
        .slice(body.indexOf(START))
        .match(new RegExp(`^${escapeRegex(block)}\\n?$`))
    )
      throw new CoreSyncError("conflicting managed correspondence block");
    return body;
  }
  return `${body}${body.endsWith("\n") ? "\n" : "\n\n"}${block}\n`;
}
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parse a reviewed artifact without silently dropping unknown, missing, or mistyped fields. */
export function readReview(text) {
  const review = JSON.parse(text);
  exactKeys(
    review,
    ["schemaVersion", "repository", "releases", "missing"],
    "review",
  );
  if (
    review.schemaVersion !== 1 ||
    review.repository !== REPOSITORY ||
    !Array.isArray(review.releases) ||
    !Array.isArray(review.missing)
  )
    throw new CoreSyncError("invalid review version, repository, or selection");
  const seen = new Set();
  for (const [kind, entries] of [
    ["releases", review.releases],
    ["missing", review.missing],
  ]) {
    for (const entry of entries) {
      exactKeys(
        entry,
        kind === "releases"
          ? [
              "tag",
              "tagOid",
              "identity",
              "evidence",
              "provenance",
              "release",
              "proposedBody",
            ]
          : ["tag", "tagOid", "identity", "evidence", "provenance"],
        kind,
      );
      if (
        typeof entry.tag !== "string" ||
        !/^pi-subagents-v\d+\.\d+\.\d+$/.test(entry.tag) ||
        seen.has(entry.tag) ||
        !/^[a-f0-9]{40}$/.test(entry.tagOid)
      )
        throw new CoreSyncError("invalid or duplicate reviewed tag/OID");
      seen.add(entry.tag);
      exactKeys(
        entry.identity,
        ["directory", "name", "upstream", "evidenceRoute"],
        "identity",
      );
      exactKeys(
        entry.identity.upstream,
        ["name", "repository", "directory"],
        "upstream identity",
      );
      exactKeys(
        entry.evidence,
        ["forkTag", "upstream", "upstreamTip"],
        "evidence",
      );
      exactKeys(
        entry.evidence.upstream,
        ["version", "commit"],
        "upstream evidence",
      );
      exactKeys(
        entry.provenance,
        ["kind", "upstreamPackage", "upstreamVersion", "sourceUrl"],
        "provenance",
      );
      if (
        entry.identity.directory !== "pi-subagents" ||
        entry.identity.name !== "@jopqior/pi-subagents" ||
        entry.identity.evidenceRoute !== "core-sync" ||
        entry.identity.upstream.name !== "@gotgenes/pi-subagents" ||
        entry.identity.upstream.repository !== "gotgenes/pi-packages" ||
        entry.identity.upstream.directory !== "packages/pi-subagents" ||
        entry.evidence.forkTag !== entry.tag ||
        !/^\d+\.\d+\.\d+$/.test(entry.evidence.upstream.version) ||
        !/^[a-f0-9]{40}$/.test(entry.evidence.upstream.commit) ||
        !/^[a-f0-9]{40}$/.test(entry.evidence.upstreamTip) ||
        entry.provenance.kind !== "fork" ||
        entry.provenance.upstreamPackage !== entry.identity.upstream.name ||
        entry.provenance.upstreamVersion !== entry.evidence.upstream.version ||
        entry.provenance.sourceUrl !==
          `https://github.com/${entry.identity.upstream.repository}/blob/${entry.evidence.upstream.commit}/${entry.identity.upstream.directory}`
      )
        throw new CoreSyncError(
          `invalid reviewed correspondence for ${entry.tag}`,
        );
      if (kind === "releases") {
        validateRelease(entry.release, entry.tag);
        if (typeof entry.proposedBody !== "string")
          throw new CoreSyncError("invalid proposed body");
      }
    }
  }
  if (seen.size === 0)
    throw new CoreSyncError("review has no selected fork releases");
  return review;
}
function exactKeys(value, keys, what) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(value, key))
  )
    throw new CoreSyncError(`invalid ${what} fields`);
}
function validateRelease(value, tag) {
  exactKeys(value, RELEASE_FIELDS, `Release ${tag}`);
  if (
    value.tagName !== tag ||
    !Number.isSafeInteger(value.databaseId) ||
    value.databaseId <= 0 ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.name !== "string" ||
    typeof value.body !== "string" ||
    typeof value.targetCommitish !== "string" ||
    typeof value.createdAt !== "string" ||
    (typeof value.publishedAt !== "string" && value.publishedAt !== null) ||
    value.url !== `https://github.com/${REPOSITORY}/releases/tag/${tag}` ||
    ![value.isDraft, value.isPrerelease, value.isImmutable].every(
      (item) => typeof item === "boolean",
    )
  )
    throw new CoreSyncError(`invalid Release snapshot for ${tag}`);
}

/** Validate all reviewed entries against local evidence and live remote before the first edit. */
export function applyReview({ repo, review, readRelease, editRelease }) {
  const reviewed = readReview(JSON.stringify(review));
  const current = previewReview({
    repo,
    tags: [...reviewed.releases, ...reviewed.missing].map((entry) => entry.tag),
    readRelease,
  });
  const live = new Map(
    [...current.releases, ...current.missing].map((entry) => [
      entry.tag,
      entry,
    ]),
  );
  for (const entry of [...reviewed.releases, ...reviewed.missing]) {
    const now = live.get(entry.tag);
    if (!now || Boolean(now.release) !== Boolean(entry.release))
      throw new CoreSyncError(`Release availability changed for ${entry.tag}`);
    const {
      release: expectedRelease,
      proposedBody: expectedProposed,
      ...originalSnapshot
    } = entry;
    const {
      release: liveRelease,
      proposedBody: liveProposed,
      ...liveSnapshot
    } = now;
    if (JSON.stringify(originalSnapshot) !== JSON.stringify(liveSnapshot))
      throw new CoreSyncError(
        `tag, identity, or evidence changed for ${entry.tag}`,
      );
    if (!expectedRelease) continue;
    if (expectedRelease.isImmutable)
      throw new CoreSyncError(`immutable Release ${entry.tag}`);
    if (
      expectedProposed !== proposedBody(expectedRelease.body, entry.provenance)
    )
      throw new CoreSyncError(`edited proposed body for ${entry.tag}`);
    const { body: originalBody, ...metadata } = expectedRelease;
    const { body: currentBody, ...currentMetadata } = liveRelease;
    if (
      JSON.stringify(metadata) !== JSON.stringify(currentMetadata) ||
      (currentBody !== originalBody && currentBody !== expectedProposed) ||
      liveProposed !== expectedProposed
    )
      throw new CoreSyncError(`stale Release snapshot for ${entry.tag}`);
  }
  for (const entry of reviewed.releases) {
    if (live.get(entry.tag).release.body === entry.proposedBody) continue;
    editRelease(entry.tag, entry.proposedBody);
    const after = readRelease(entry.tag);
    if (
      !after ||
      JSON.stringify({ ...after, body: entry.release.body }) !==
        JSON.stringify(entry.release) ||
      after.body !== entry.proposedBody
    )
      throw new CoreSyncError(`Release readback differs for ${entry.tag}`);
  }
  return reviewed.releases.length;
}

function githubRelease(tag) {
  const command = spawnSync(
    "gh",
    [
      "release",
      "view",
      tag,
      "--repo",
      REPOSITORY,
      "--json",
      RELEASE_FIELDS.join(","),
    ],
    { encoding: "utf8" },
  );
  if (command.error) throw command.error;
  if (command.status === 0) return JSON.parse(command.stdout);
  if (/release not found|HTTP 404/i.test(command.stderr)) return null;
  throw new CoreSyncError(`cannot read Release ${tag}: ${command.stderr}`);
}
function editGithubRelease(tag, body) {
  const dir = mkdtempSync(path.join(tmpdir(), "release-backfill-"));
  try {
    const file = path.join(dir, "notes.md");
    writeFileSync(file, body, { mode: 0o600 });
    execFileSync(
      "gh",
      ["release", "edit", tag, "--repo", REPOSITORY, "--notes-file", file],
      { stdio: "pipe" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    process.stdout.write(
      "Usage: node scripts/release/backfill-release-notes.mjs --output <review.json> <explicit-fork-tag>...\n       node scripts/release/backfill-release-notes.mjs --apply <review.json>\nPreview reads Releases and writes a review artifact; apply requires separate operator approval. Missing Releases are reported, never created.\n",
    );
    return;
  }
  if (args[0] === "--output" && args.length >= 3) {
    const review = previewReview({
      repo: process.cwd(),
      tags: args.slice(2),
      readRelease: githubRelease,
    });
    writeFileSync(args[1], `${JSON.stringify(review, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    process.stdout.write(
      `Preview: ${review.releases.length} existing; missing: ${review.missing.map((entry) => entry.tag).join(", ") || "none"}. No remote edits.\n`,
    );
    return;
  }
  if (args[0] === "--apply" && args.length === 2) {
    const review = readReview(readFileSync(args[1], "utf8"));
    applyReview({
      repo: process.cwd(),
      review,
      readRelease: githubRelease,
      editRelease: editGithubRelease,
    });
    process.stdout.write("Reviewed Release notes checked and read back.\n");
    return;
  }
  throw new CoreSyncError("invalid backfill invocation (see --help)");
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
