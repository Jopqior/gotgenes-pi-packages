import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  devDependencies: Record<string, string>;
}

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageManifest;

const CORE = "@jopqior/pi-subagents";

describe("package manifest", () => {
  describe("core dependency contract", () => {
    it("declares the core as a required peer at the compatibility floor", () => {
      expect(manifest.peerDependencies[CORE]).toBe(">=1.0.0");
    });

    it("does not mark the core peer optional", () => {
      expect(manifest.peerDependenciesMeta?.[CORE]?.optional).not.toBe(true);
    });

    it("ships the core in neither runtime nor optional dependencies", () => {
      expect(manifest.dependencies?.[CORE]).toBeUndefined();
      expect(manifest.optionalDependencies?.[CORE]).toBeUndefined();
    });

    it("resolves the core from the registry for development, not the workspace", () => {
      expect(manifest.devDependencies[CORE]).toBe("^1.0.0");
    });
  });

  describe("check script", () => {
    it("type-checks standalone without building the workspace core first", () => {
      expect(manifest.scripts.check).toBe("tsc --noEmit");
    });
  });
});
