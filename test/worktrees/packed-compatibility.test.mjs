import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertInactiveLoad,
  assertMissingPackageLoad,
  assertPackedContract,
  assertPositiveLoad,
  assertProviderResult,
  withDisposableRoot,
} from "../../packages/pi-subagents-worktrees/scripts/verify-core-compatibility.mjs";

const coreEntry = "/consumer/core/src/index.ts";
const worktreesEntry = "/consumer/worktrees/src/index.ts";
const entries = { coreEntry, worktreesEntry };
const worktrees = {
  path: worktreesEntry,
  handlers: ["session_shutdown", "session_start"],
  commands: ["subagents-worktrees"],
};
const positive = () => ({
  errors: [],
  extensions: [{ path: coreEntry, handlers: [], commands: [] }, worktrees],
  registrations: 1,
  unregisters: 1,
});
const missing = () => ({
  errors: [
    {
      path: worktreesEntry,
      error:
        "Failed to load extension: Cannot find module '@jopqior/pi-subagents'",
    },
  ],
  extensions: [],
  registrations: 0,
  unregisters: 0,
});
const inactive = (reversed = false) => ({
  errors: [],
  extensions: [
    ...(reversed ? [{ path: coreEntry, handlers: [], commands: [] }] : []),
    { path: worktreesEntry, handlers: [], commands: [] },
  ],
  registrations: 0,
  unregisters: 0,
});
const provider = () => ({
  nonOpted: null,
  globalOverridden: null,
  clean: {
    detached: true,
    head: "base-head",
    existsAfter: false,
    disposal: null,
  },
  dirty: {
    detached: true,
    head: "base-head",
    existsAfter: false,
    savedBytes: "packed work\nexact bytes\n",
    disposal: {
      resultAddendum:
        "\n\n---\nChanges saved to branch `pi-agent-dirty`. Merge with: `git merge pi-agent-dirty`",
    },
  },
  baseHead: "base-head",
  reregistered: true,
});

describe("packed worktrees compatibility verifier", () => {
  describe("manifest", () => {
    const manifest = JSON.parse(
      readFileSync("packages/pi-subagents-worktrees/package.json", "utf8"),
    );
    it("accepts the real maintained contract", () =>
      assertPackedContract(manifest));
    it.each([
      [
        "identity",
        (m) => {
          m.name = "@gotgenes/pi-subagents-worktrees";
        },
      ],
      [
        "floor",
        (m) => {
          m.peerDependencies["@jopqior/pi-subagents"] = "*";
        },
      ],
      [
        "optional peer",
        (m) => {
          m.peerDependenciesMeta = {
            "@jopqior/pi-subagents": { optional: true },
          };
        },
      ],
      [
        "ordinary core",
        (m) => {
          m.dependencies = { "@jopqior/pi-subagents": "*" };
        },
      ],
      [
        "optional core",
        (m) => {
          m.optionalDependencies = { "@jopqior/pi-subagents": "*" };
        },
      ],
      [
        "bundled core",
        (m) => {
          m.bundledDependencies = ["@jopqior/pi-subagents"];
        },
      ],
      [
        "bundle alias",
        (m) => {
          m.bundleDependencies = ["@gotgenes/pi-subagents"];
        },
      ],
      [
        "upstream core",
        (m) => {
          m.peerDependencies["@gotgenes/pi-subagents"] = "*";
        },
      ],
      [
        "workspace dev",
        (m) => {
          m.devDependencies["@jopqior/pi-subagents"] = "workspace:*";
        },
      ],
      [
        "shipped scripts",
        (m) => {
          m.files.push("scripts");
        },
      ],
    ])("rejects %s", (_label, mutate) => {
      const changed = structuredClone(manifest);
      mutate(changed);
      expect(() => assertPackedContract(changed)).toThrow();
    });
  });

  describe("real registration and shutdown", () => {
    it("accepts exact positive registrations", () =>
      assertPositiveLoad(positive(), entries));
    it.each([
      [
        "loader errors",
        (r) => {
          r.errors = missing().errors;
        },
      ],
      [
        "absent provider",
        (r) => {
          r.registrations = 0;
        },
      ],
      [
        "duplicate provider",
        (r) => {
          r.registrations = 2;
        },
      ],
      [
        "no unregister",
        (r) => {
          r.unregisters = 0;
        },
      ],
      [
        "wrong path",
        (r) => {
          r.extensions[1] = { ...worktrees, path: coreEntry };
        },
      ],
      [
        "no shutdown",
        (r) => {
          r.extensions[1] = { ...worktrees, handlers: ["session_start"] };
        },
      ],
      [
        "no command",
        (r) => {
          r.extensions[1] = { ...worktrees, commands: [] };
        },
      ],
    ])("rejects %s", (_label, mutate) => {
      const changed = positive();
      mutate(changed);
      expect(() => assertPositiveLoad(changed, entries)).toThrow();
    });
  });

  describe("missing import versus inactive service", () => {
    it("accepts only an attributed quoted core import error", () =>
      assertMissingPackageLoad(missing(), entries));
    it.each([
      ["positive", positive],
      ["inactive", inactive],
      [
        "wrong entry",
        () => ({
          ...missing(),
          errors: [{ ...missing().errors[0], path: coreEntry }],
        }),
      ],
      [
        "longer worktrees-only name",
        () => ({
          ...missing(),
          errors: [
            {
              path: worktreesEntry,
              error: "Cannot find module '@jopqior/pi-subagents-worktrees'",
            },
          ],
        }),
      ],
      [
        "arbitrary error",
        () => ({
          ...missing(),
          errors: [{ path: worktreesEntry, error: "factory exploded" }],
        }),
      ],
    ])("rejects %s as missing core", (_label, result) => {
      expect(() => assertMissingPackageLoad(result(), entries)).toThrow();
    });
    it.each([false, true])(
      "accepts inactive/reversed=%s without retry",
      (reversed) => {
        assertInactiveLoad(inactive(reversed), { ...entries, reversed });
      },
    );
    it.each([
      ["import error", () => missing()],
      ["provider", () => ({ ...inactive(), registrations: 1 })],
      ["commands/hooks", () => ({ ...inactive(), extensions: [worktrees] })],
      ["unexpected core", () => inactive(true)],
    ])("rejects %s as inactive", (_label, result) => {
      expect(() =>
        assertInactiveLoad(result(), { ...entries, reversed: false }),
      ).toThrow();
    });
  });

  describe("configured provider lifecycle", () => {
    it("accepts measured clean and saved dirty outcomes", () =>
      assertProviderResult(provider()));
    it.each([
      [
        "nonopted isolation",
        (r) => {
          r.nonOpted = {};
        },
      ],
      [
        "global not overridden",
        (r) => {
          r.globalOverridden = {};
        },
      ],
      [
        "no opted workspace",
        (r) => {
          r.clean = null;
        },
      ],
      [
        "attached HEAD",
        (r) => {
          r.clean.detached = false;
        },
      ],
      [
        "wrong HEAD",
        (r) => {
          r.dirty.head = "other";
        },
      ],
      [
        "clean retained",
        (r) => {
          r.clean.existsAfter = true;
        },
      ],
      [
        "dirty retained",
        (r) => {
          r.dirty.existsAfter = true;
        },
      ],
      [
        "dirty bytes lost",
        (r) => {
          r.dirty.savedBytes = "wrong";
        },
      ],
      [
        "no dirty addendum",
        (r) => {
          r.dirty.disposal = {};
        },
      ],
      [
        "wrong rescue branch",
        (r) => {
          r.dirty.disposal.resultAddendum = "saved elsewhere";
        },
      ],
      [
        "no reregistration",
        (r) => {
          r.reregistered = false;
        },
      ],
    ])("rejects %s", (_label, mutate) => {
      const changed = provider();
      mutate(changed);
      expect(() => assertProviderResult(changed)).toThrow();
    });
  });

  describe("failure cleanup", () => {
    it("awaits an async callback before removing its root", async () => {
      let rootPath;
      await withDisposableRoot(async (root) => {
        rootPath = root;
        await Promise.resolve();
        assert.equal(existsSync(root), true);
        writeFileSync(join(root, "after-await"), "done");
      });
      expect(existsSync(rootPath)).toBe(false);
    });
    it("reclaims tracked external Git worktrees after a failing async probe", async () => {
      const externalRoot = mkdtempSync(
        join(tmpdir(), "worktrees-cleanup-control-"),
      );
      const external = join(externalRoot, "outside-consumer");
      let rootPath;
      try {
        await expect(
          withDisposableRoot(async (root, tracked) => {
            rootPath = root;
            const repo = join(root, "git");
            mkdirSync(repo);
            const git = (...args) =>
              execFileSync("git", ["-C", repo, ...args], { stdio: "pipe" });
            git("init");
            git(
              "-c",
              "user.name=Probe",
              "-c",
              "user.email=probe@example.invalid",
              "commit",
              "--allow-empty",
              "-m",
              "fixture",
            );
            git("worktree", "add", "--detach", external, "HEAD");
            tracked.add(external);
            await Promise.resolve();
            assert.equal(existsSync(external), true);
            throw new Error("deliberate failing probe");
          }),
        ).rejects.toThrow("deliberate failing probe");
        expect(existsSync(external)).toBe(false);
        expect(existsSync(rootPath)).toBe(false);
      } finally {
        rmSync(externalRoot, { recursive: true, force: true });
      }
    });
  });
});
