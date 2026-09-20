import { describe, expect, it } from "vitest";

import { isCoreScopePath } from "../../scripts/release/core-sync-evidence.mjs";
import {
  combineLevels,
  compareVersions,
  incrementVersion,
  levelFromVersions,
  parseStrictSemVer,
} from "../../scripts/release/core-sync-values.mjs";

// The pure algebra of the core sync release policy: strict SemVer parsing,
// version comparison, level mapping and combination, version increment, and
// the core path-scope predicate that mirrors the release scripts' exclusions.
// No Git, no git-cliff — these tests never build a repository.

describe("level mapping", () => {
  it("accepts stable versions and rejects prerelease, build, and malformed forms", () => {
    expect(parseStrictSemVer("21.7.3")).toEqual({
      major: 21,
      minor: 7,
      patch: 3,
    });
    expect(parseStrictSemVer("21.7.3-rc1")).toBeNull();
    expect(parseStrictSemVer("21.7.3+build.1")).toBeNull();
    expect(parseStrictSemVer("01.2.3")).toBeNull();
    expect(parseStrictSemVer("1.0")).toBeNull();
    expect(parseStrictSemVer("v1.0.0")).toBeNull();
    expect(parseStrictSemVer("")).toBeNull();
    expect(parseStrictSemVer(21)).toBeNull();
  });

  it("compares versions field by field", () => {
    expect(compareVersions("21.7.3", "21.7.3")).toBe(0);
    expect(compareVersions("21.7.3", "21.7.4")).toBe(-1);
    expect(compareVersions("21.8.0", "21.7.99")).toBe(1);
    expect(compareVersions("22.0.0", "21.99.99")).toBe(1);
  });

  it("maps version distance to a single level", () => {
    expect(levelFromVersions("21.7.0", "21.7.0")).toBe("none");
    expect(levelFromVersions("21.7.0", "21.7.3")).toBe("patch");
    expect(levelFromVersions("21.7.0", "21.8.0")).toBe("minor");
    expect(levelFromVersions("21.7.3", "22.0.0")).toBe("major");
    // Skipped releases collapse to one step, not a sum.
    expect(levelFromVersions("21.7.0", "21.7.2")).toBe("patch");
    expect(levelFromVersions("21.6.9", "21.8.0")).toBe("minor");
  });

  it("rejects a regressing upstream target", () => {
    expect(() => levelFromVersions("21.7.3", "21.7.0")).toThrow(/regressed/);
  });

  it("combines levels by taking the maximum", () => {
    expect(combineLevels("none", "none")).toBe("none");
    expect(combineLevels("none", "patch")).toBe("patch");
    expect(combineLevels("patch", "minor")).toBe("minor");
    expect(combineLevels("minor", "major")).toBe("major");
    expect(combineLevels("major", "patch")).toBe("major");
  });

  it("increments a version exactly once for the decided level", () => {
    expect(incrementVersion("1.2.3", "none")).toBe("1.2.3");
    expect(incrementVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(incrementVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(incrementVersion("1.2.3", "major")).toBe("2.0.0");
    expect(() => incrementVersion("1.2", "patch")).toThrow(/invalid SemVer/);
  });

  it("scopes core paths like the release scripts' exclusions", () => {
    expect(isCoreScopePath("packages/pi-subagents/src/a.ts")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/test/a.test.ts")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/docs/guides/x.md")).toBe(
      true,
    );
    expect(isCoreScopePath("packages/pi-subagents/package.json")).toBe(true);
    expect(isCoreScopePath("packages/pi-subagents/CHANGELOG.md")).toBe(false);
    expect(isCoreScopePath("packages/pi-subagents/docs/plans/x.md")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/retro/x.md")).toBe(
      false,
    );
    expect(
      isCoreScopePath("packages/pi-subagents/docs/architecture/x.md"),
    ).toBe(false);
    expect(isCoreScopePath("packages/pi-subagents/docs/decisions/x.md")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/assets/x.svg")).toBe(
      false,
    );
    expect(isCoreScopePath("packages/pi-subagents/docs/plans")).toBe(false);
    expect(isCoreScopePath("packages/pi-colgrep/src/a.ts")).toBe(false);
    expect(isCoreScopePath("docs/upstream-sync.md")).toBe(false);
  });
});

describe("safe integer bounds", () => {
  const max = `${Number.MAX_SAFE_INTEGER}`;
  const belowMax = `${Number.MAX_SAFE_INTEGER - 1}`;

  it("parses each segment at the safe limit and rejects beyond it", () => {
    expect(parseStrictSemVer(`${max}.0.0`)).toEqual({
      major: Number.MAX_SAFE_INTEGER,
      minor: 0,
      patch: 0,
    });
    expect(parseStrictSemVer(`1.${max}.0`)).toEqual({
      major: 1,
      minor: Number.MAX_SAFE_INTEGER,
      patch: 0,
    });
    expect(parseStrictSemVer(`1.0.${max}`)).toEqual({
      major: 1,
      minor: 0,
      patch: Number.MAX_SAFE_INTEGER,
    });
    // 2**53 is exactly representable, but the longer digit forms it absorbs
    // are not — both must reject rather than alias distinct versions.
    expect(parseStrictSemVer("9007199254740992.0.0")).toBeNull();
    expect(parseStrictSemVer("1.9007199254740992.0")).toBeNull();
    expect(parseStrictSemVer("9007199254740993.0.0")).toBeNull();
  });

  it("fails closed when comparing or mapping beyond the safe limit", () => {
    expect(() => compareVersions("9007199254740992.0.0", "1.0.0")).toThrow(
      /invalid SemVer in comparison/,
    );
    // `levelFromVersions` validates through `compareVersions` first, so an
    // out-of-range target surfaces the comparison diagnostic, not mapping's.
    expect(() => levelFromVersions("1.0.0", "9007199254740992.0.0")).toThrow(
      /invalid SemVer in comparison/,
    );
  });

  it("rejects increments that would leave the safe integer range", () => {
    expect(() => incrementVersion(`${max}.0.0`, "major")).toThrow(
      /safe integer/,
    );
    expect(() => incrementVersion(`1.${max}.0`, "minor")).toThrow(
      /safe integer/,
    );
    expect(() => incrementVersion(`1.2.${max}`, "patch")).toThrow(
      /safe integer/,
    );
  });

  it("keeps one-below-limit increments safe and none unchanged", () => {
    expect(incrementVersion(`1.2.${belowMax}`, "patch")).toBe(`1.2.${max}`);
    expect(incrementVersion(`1.${belowMax}.0`, "minor")).toBe(`1.${max}.0`);
    expect(incrementVersion(`${belowMax}.0.0`, "major")).toBe(`${max}.0.0`);
    expect(incrementVersion(`1.2.${max}`, "none")).toBe(`1.2.${max}`);
  });
});
