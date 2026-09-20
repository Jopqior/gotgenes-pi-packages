import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  readCoreSyncState,
  validateCoreSyncState,
} from "../../scripts/release/core-sync-state.mjs";

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
  dir = mkdtempSync(path.join(tmpdir(), "core-sync-state-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("state schema", () => {
  const validState = () => ({
    schemaVersion: 1,
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
        forkCore: {
          level: "patch",
          rationale: "resolution adjusted a core default",
          paths: ["packages/pi-subagents/src/a.ts"],
        },
      },
    ],
  });

  it("accepts a valid document", () => {
    expect(validateCoreSyncState(validState())).toEqual(validState());
  });

  it("rejects an unknown schema version", () => {
    const state = validState();
    state.schemaVersion = 2;
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /unsupported core sync state schema version/,
    );
  });

  it("rejects duplicate release records for one fork tag", () => {
    const state = validState();
    state.releases.push({ ...state.releases[0] });
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /duplicate release record/,
    );
  });

  it("rejects invalid versions and malformed object IDs", () => {
    const badVersion = validState();
    badVersion.releases[0].upstream.version = "21.7.3-rc1";
    expect(errorOf(() => validateCoreSyncState(badVersion)).message).toMatch(
      /not a strict stable SemVer/,
    );

    const shortOid = validState();
    shortOid.releases[0].upstream.commit = "abc123";
    expect(errorOf(() => validateCoreSyncState(shortOid)).message).toMatch(
      /not a full 40-hex object ID/,
    );

    const badSyncVersion = validState();
    badSyncVersion.syncs[0].upstream.version = "not-semver";
    expect(
      errorOf(() => validateCoreSyncState(badSyncVersion)).message,
    ).toMatch(/not a strict stable SemVer/);
  });

  it("rejects unknown fields at every level", () => {
    const topLevel = validState();
    topLevel.cache = true;
    expect(errorOf(() => validateCoreSyncState(topLevel)).message).toMatch(
      /unknown state field 'cache'/,
    );

    const releaseField = validState();
    releaseField.releases[0].verified = true;
    expect(errorOf(() => validateCoreSyncState(releaseField)).message).toMatch(
      /unknown releases\[0\] field 'verified'/,
    );

    const syncField = validState();
    syncField.syncs[0].reviewedAt = "2026-09-19";
    expect(errorOf(() => validateCoreSyncState(syncField)).message).toMatch(
      /unknown syncs\[0\] field 'reviewedAt'/,
    );
  });

  it("rejects contradictory fork-core contributions", () => {
    const emptyPaths = validState();
    emptyPaths.syncs[0].forkCore.paths = [];
    expect(errorOf(() => validateCoreSyncState(emptyPaths)).message).toMatch(
      /level patch with no changed core paths/,
    );

    const noneWithPaths = validState();
    noneWithPaths.syncs[0].forkCore.level = "none";
    expect(errorOf(() => validateCoreSyncState(noneWithPaths)).message).toMatch(
      /level none with changed core paths/,
    );

    const badLevel = validState();
    badLevel.syncs[0].forkCore.level = "huge";
    expect(errorOf(() => validateCoreSyncState(badLevel)).message).toMatch(
      /not a release level/,
    );

    const emptyRationale = validState();
    emptyRationale.syncs[0].forkCore.rationale = "  ";
    expect(
      errorOf(() => validateCoreSyncState(emptyRationale)).message,
    ).toMatch(/rationale must be a non-empty string/);

    const foreignPath = validState();
    foreignPath.syncs[0].forkCore.paths = ["packages/pi-colgrep/src/a.ts"];
    expect(errorOf(() => validateCoreSyncState(foreignPath)).message).toMatch(
      /not a core package path/,
    );
  });

  it("rejects duplicate sync records for one merge", () => {
    const state = validState();
    state.syncs.push({ ...state.syncs[0] });
    expect(errorOf(() => validateCoreSyncState(state)).message).toMatch(
      /duplicate sync record/,
    );
  });

  it("reads strictly from disk", () => {
    const statePath = path.join(dir, "state.json");
    writeFileSync(statePath, "{ not json");
    expect(errorOf(() => readCoreSyncState(statePath)).message).toMatch(
      /not valid JSON/,
    );
    expect(
      errorOf(() => readCoreSyncState(path.join(dir, "missing.json"))).message,
    ).toMatch(/cannot read core sync state/);
  });
});
