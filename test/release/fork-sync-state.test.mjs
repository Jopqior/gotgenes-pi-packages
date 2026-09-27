import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  readForkSyncState,
  validateForkSyncState,
} from "../../scripts/release/fork-sync/state.mjs";

// The committed evidence document's schema: what the strict reader accepts
// and everything it rejects. Hand-built literals only — no Git repository is
// involved; the disk cases use a temporary directory.

/**
 * @param {string} message
 * @returns {Error}
 */
function errorOf(fn) {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error("expected the call to throw, but it returned");
}

/** @type {string} */
let dir;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "fork-sync-state-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("state schema", () => {
  const validState = () => ({
    schemaVersion: 2,
    releases: [
      {
        forkTag: "pi-subagents-v2.0.0",
        upstream: { version: "21.7.3", commit: "f".repeat(40) },
        upstreamTip: "e".repeat(40),
      },
    ],
    syncs: [
      {
        merge: "a".repeat(40),
        upstream: { version: "21.7.3", commit: "f".repeat(40) },
        forkContribution: {
          level: "patch",
          rationale: "resolution adjusted a core default",
          paths: ["packages/pi-subagents/src/a.ts"],
        },
      },
    ],
  });

  it("accepts a valid document", () => {
    expect(validateForkSyncState(validState(), "pi-subagents")).toEqual(
      validState(),
    );
  });

  it("rejects an unknown schema version", () => {
    const state = validState();
    state.schemaVersion = 1;
    expect(
      errorOf(() => validateForkSyncState(state, "pi-subagents")).message,
    ).toMatch(/unsupported fork sync state schema version/);
  });

  it("rejects duplicate release records for one fork tag", () => {
    const state = validState();
    state.releases.push({ ...state.releases[0] });
    expect(
      errorOf(() => validateForkSyncState(state, "pi-subagents")).message,
    ).toMatch(/duplicate release record/);
  });

  it("rejects invalid versions and malformed object IDs", () => {
    const badVersion = validState();
    badVersion.releases[0].upstream.version = "21.7.3-rc1";
    expect(
      errorOf(() => validateForkSyncState(badVersion, "pi-subagents")).message,
    ).toMatch(/not a strict stable SemVer/);

    const shortOid = validState();
    shortOid.releases[0].upstream.commit = "abc123";
    expect(
      errorOf(() => validateForkSyncState(shortOid, "pi-subagents")).message,
    ).toMatch(/not a full 40-hex object ID/);

    const badSyncVersion = validState();
    badSyncVersion.syncs[0].upstream.version = "not-semver";
    expect(
      errorOf(() => validateForkSyncState(badSyncVersion, "pi-subagents"))
        .message,
    ).toMatch(/not a strict stable SemVer/);
  });

  it("rejects unknown fields at every level", () => {
    const topLevel = validState();
    topLevel.cache = true;
    expect(
      errorOf(() => validateForkSyncState(topLevel, "pi-subagents")).message,
    ).toMatch(/unknown state field 'cache'/);

    const releaseField = validState();
    releaseField.releases[0].verified = true;
    expect(
      errorOf(() => validateForkSyncState(releaseField, "pi-subagents"))
        .message,
    ).toMatch(/unknown releases\[0\] field 'verified'/);

    const syncField = validState();
    syncField.syncs[0].reviewedAt = "2026-09-19";
    expect(
      errorOf(() => validateForkSyncState(syncField, "pi-subagents")).message,
    ).toMatch(/unknown syncs\[0\] field 'reviewedAt'/);
  });

  it("rejects contradictory fork contributions", () => {
    const emptyPaths = validState();
    emptyPaths.syncs[0].forkContribution.paths = [];
    expect(
      errorOf(() => validateForkSyncState(emptyPaths, "pi-subagents")).message,
    ).toMatch(/level patch with no changed package paths/);

    const noneWithPaths = validState();
    noneWithPaths.syncs[0].forkContribution.level = "none";
    expect(
      errorOf(() => validateForkSyncState(noneWithPaths, "pi-subagents"))
        .message,
    ).toMatch(/level none with changed package paths/);

    const badLevel = validState();
    badLevel.syncs[0].forkContribution.level = "huge";
    expect(
      errorOf(() => validateForkSyncState(badLevel, "pi-subagents")).message,
    ).toMatch(/not a release level/);

    const emptyRationale = validState();
    emptyRationale.syncs[0].forkContribution.rationale = "  ";
    expect(
      errorOf(() => validateForkSyncState(emptyRationale, "pi-subagents"))
        .message,
    ).toMatch(/rationale must be a non-empty string/);

    const foreignPath = validState();
    foreignPath.syncs[0].forkContribution.paths = [
      "packages/pi-colgrep/src/a.ts",
    ];
    expect(
      errorOf(() => validateForkSyncState(foreignPath, "pi-subagents")).message,
    ).toMatch(/not a package path/);
  });

  it("rejects duplicate sync records for one merge", () => {
    const state = validState();
    state.syncs.push({ ...state.syncs[0] });
    expect(
      errorOf(() => validateForkSyncState(state, "pi-subagents")).message,
    ).toMatch(/duplicate sync record/);
  });

  it("reads strictly from disk", () => {
    const statePath = path.join(dir, "state.json");
    writeFileSync(statePath, "{ not json");
    expect(
      errorOf(() => readForkSyncState(statePath, "pi-subagents")).message,
    ).toMatch(/not valid JSON/);
    expect(
      errorOf(() =>
        readForkSyncState(path.join(dir, "missing.json"), "pi-subagents"),
      ).message,
    ).toMatch(/cannot read fork sync state/);
  });
});
