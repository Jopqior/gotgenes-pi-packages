import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const SCRIPT_URL = JSON.stringify(
  new URL("../scripts/verify-core-compatibility.mjs", import.meta.url).href,
);

interface DriverResult {
  status: number;
  stderr: string;
}

/**
 * Drives the real verification script module in a fresh Node process: the
 * script is plain JavaScript outside the TypeScript program, and a child
 * process starts without fixtures from this one.
 */
function runDriver(driver: string): DriverResult {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", driver],
    { encoding: "utf8" },
  );
  return { status: result.status ?? -1, stderr: result.stderr };
}

describe("verify-core-compatibility script", () => {
  describe("run root", () => {
    it("exists while the run uses it and is removed afterwards", () => {
      const driver = `
        const assert = (await import("node:assert/strict")).default;
        const { existsSync } = await import("node:fs");
        const { withDisposableRoot } = await import(${SCRIPT_URL});
        const returned = await withDisposableRoot((root) => {
          assert(existsSync(root), "run root must exist while the run uses it");
          return root;
        });
        assert(!existsSync(returned), "run root must be removed after the run");
      `;
      const result = runDriver(driver);
      expect(result.status, result.stderr).toBe(0);
    });

    it("is unique per run and lives under the system temp directory", () => {
      const driver = `
        const assert = (await import("node:assert/strict")).default;
        const { mkdtempSync } = await import("node:fs");
        const { tmpdir } = await import("node:os");
        const { join } = await import("node:path");
        const { withDisposableRoot } = await import(${SCRIPT_URL});
        const first = await withDisposableRoot((root) => root);
        const second = await withDisposableRoot((root) => root);
        assert.notEqual(first, second, "each run must receive a unique run root");
        assert(
          first.startsWith(join(tmpdir(), "selector-core-compat-")),
          \`run root must live under the temp prefix: \${first}\`,
        );
      `;
      const result = runDriver(driver);
      expect(result.status, result.stderr).toBe(0);
    });
  });
});
