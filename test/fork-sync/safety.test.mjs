import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createUpstreamNetwork,
  githubUpstream,
  refuseHint,
} from "./helpers/upstream-network.mjs";

let net;
let createRepository;
let materializeLocalHistory;
let materializeNetwork;
let runScript;
let git;
let revParse;
let gitDir;
let indexTree;
let snapshotDir;
let recordedInvocations;
beforeEach(() => {
  net = createUpstreamNetwork();
  ({
    createRepository,
    materializeLocalHistory,
    materializeNetwork,
    runScript,
    git,
    revParse,
    gitDir,
    indexTree,
    snapshotDir,
    recordedInvocations,
  } = net);
});
afterEach(() => net.dispose());

const expectNoSetupOrEffects = () => {
  expect(
    recordedInvocations().filter(
      ({ args }) =>
        ["config", "remote", "fetch", "merge", "ls-remote", "push"].includes(
          args[0],
        ) && !(args[0] === "remote" && args[1] === "get-url"),
    ),
  ).toEqual([]);
};

describe("fork-sync safety", () => {
  describe("transport and preflight", () => {
    const repositories = {
      origin: "Jopqior/gotgenes-pi-packages",
      upstream: "gotgenes/pi-packages",
    };
    for (const [remote, repository] of Object.entries(repositories)) {
      for (const url of [
        `git@github.com:${repository}`,
        `git@github.com:${repository}.git`,
        `https://github.com/${repository}`,
        `https://github.com/${repository}.git`,
      ]) {
        it(`preserves supported ${remote} URL ${url}`, () => {
          const { work } = createRepository();
          const target = revParse(work, "HEAD");
          git(work, ["update-ref", "refs/remotes/upstream/main", target]);
          git(work, ["remote", "set-url", remote, url]);
          const result = runScript(work, [
            "--merge",
            "--expected-upstream",
            target,
          ]);
          expect(result.status).toBe(0);
          expect(result.stdout).toContain("upstream already contained in HEAD");
          expect(git(work, ["remote", "get-url", remote]).stdout.trim()).toBe(
            url,
          );
        });
      }
      for (const url of [
        `https://evil.example/${repository}.git`,
        `https://github.com/${repository}.git/extra`,
        `https://github.com/${repository}.git?query`,
        `https://github.com/${repository}.git#fragment`,
        `https://user@github.com/${repository}.git`,
        `https://github.com/prefix/${repository}.git`,
        `/tmp/${repository}.git`,
        `git@alias:${repository}.git`,
        `git@github.com:${repository}.git/extra`,
        `git@github.com:${repository}.git?query`,
        `git@github.com:${repository}.git#fragment`,
        `https://github.com/${repository}.git/`,
        `ssh://git@github.com/${repository}.git`,
        `git@github.com:${repository.toUpperCase()}.git`,
        remote === "origin"
          ? githubUpstream
          : "git@github.com:Jopqior/gotgenes-pi-packages.git",
      ]) {
        it(`rejects unsupported ${remote} URL ${url} before writes`, () => {
          const { work } = createRepository();
          const target = revParse(work, "HEAD");
          git(work, ["remote", "set-url", remote, url]);
          const result = runScript(work, [
            "--merge",
            "--expected-upstream",
            target,
          ]);
          expect(result.status).toBe(1);
          expect(result.stderr).toContain(
            remote === "origin"
              ? `origin is not Jopqior/gotgenes-pi-packages (got ${url})`
              : `unsupported upstream remote URL: ${url}`,
          );
          expectNoSetupOrEffects();
          expect(git(work, ["remote", "get-url", remote]).stdout.trim()).toBe(
            url,
          );
        });
      }
    }

    it.each(["ssh", "https"])(
      "creates a missing upstream only with explicit %s",
      (protocol) => {
        const { work } = materializeNetwork();
        git(work, ["remote", "remove", "upstream"]);
        expect(
          runScript(work, ["--fetch", "--upstream-protocol", protocol]).status,
        ).toBe(0);
        expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
          protocol === "ssh"
            ? githubUpstream
            : "https://github.com/gotgenes/pi-packages.git",
        );
      },
    );

    it.each(["ssh", "https"])(
      "merges after an explicit %s choice for a missing upstream",
      (protocol) => {
        const { work, target } = materializeLocalHistory("divergent");
        const before = revParse(work, "HEAD");
        git(work, ["remote", "remove", "upstream"]);
        git(work, ["update-ref", "refs/remotes/upstream/main", target]);
        expect(
          runScript(work, [
            "--merge",
            "--expected-upstream",
            target,
            "--upstream-protocol",
            protocol,
          ]).status,
        ).toBe(0);
        expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
          protocol === "ssh"
            ? githubUpstream
            : "https://github.com/gotgenes/pi-packages.git",
        );
        expect(net.parentsOf(work)).toEqual([before, target]);
        expect(net.recordedFetches()).toEqual([]);
      },
    );

    it.each(["--fetch", "--merge"])(
      "does not choose a protocol for a missing upstream: %s",
      (mode) => {
        const { work } = createRepository();
        const target = revParse(work, "HEAD");
        git(work, ["remote", "remove", "upstream"]);
        const result = runScript(work, [
          mode,
          ...(mode === "--merge" ? ["--expected-upstream", target] : []),
        ]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "missing upstream remote; choose --upstream-protocol",
        );
        expectNoSetupOrEffects();
        expect(git(work, ["remote"]).stdout.trim()).toBe("origin");
      },
    );

    it("refuses a protocol conflicting with the existing URL without rewriting it", () => {
      const { work } = createRepository();
      const result = runScript(work, [
        "--fetch",
        "--upstream-protocol",
        "https",
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "selected protocol conflicts with existing upstream URL",
      );
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
      expectNoSetupOrEffects();
    });

    it.each([
      ["--upstream-protocol"],
      ["--upstream-protocol", "ftp"],
      ["--merge", "--merge"],
      ["--expected-upstream"],
      ["--expected-upstream", "f".repeat(40)],
      ["--merge", "--expected-upstream", "f".repeat(39)],
      ["--merge", "--expected-upstream", "f".repeat(41)],
      ["--merge", "--expected-upstream", "z".repeat(40)],
      [
        "--merge",
        "--expected-upstream",
        "f".repeat(40),
        "--expected-upstream",
        "f".repeat(40),
      ],
    ])(
      "rejects invalid options without locating a repository: %j",
      (...args) => {
        const result = runScript(net.scratch, args);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Usage:");
        expect(recordedInvocations()).toEqual([]);
      },
    );

    it("checks the OID width against the local object format before setup", () => {
      const { work } = createRepository();
      expect(
        git(work, ["rev-parse", "--show-object-format"]).stdout.trim(),
      ).toBe("sha1");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        "f".repeat(64),
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Usage:");
      expect(recordedInvocations().map(({ args }) => args)).toEqual([
        ["rev-parse", "--show-toplevel"],
        ["rev-parse", "--show-object-format"],
      ]);
    });

    it("checks cleanliness before adding a missing upstream", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD");
      git(work, ["remote", "remove", "upstream"]);
      writeFileSync(path.join(work, "unrelated.txt"), "dirty\n");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
        "--upstream-protocol",
        "ssh",
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("index or tracked worktree is not clean");
      expect(git(work, ["remote"]).stdout.trim()).toBe("origin");
      expectNoSetupOrEffects();
    });
  });

  describe("guards", () => {
    it("refuses a non-main branch without merging", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD");
      git(work, ["checkout", "-b", "feature"]);
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: current branch is feature, not main",
      );
      expect(result.stderr).toContain(refuseHint);
      expectNoSetupOrEffects();
      expect(revParse(work, "HEAD")).toBe(target);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "feature",
      );
    });

    it.each([false, true])(
      "refuses tracked dirt (staged=%s) without changing it",
      (staged) => {
        const { work } = createRepository();
        const target = revParse(work, "HEAD");
        writeFileSync(path.join(work, "unrelated.txt"), "dirty\n");
        if (staged) git(work, ["add", "unrelated.txt"]);
        const beforeIndex = indexTree(work);
        const beforeStatus = git(work, ["status", "--porcelain=v1"]).stdout;
        const result = runScript(work, [
          "--merge",
          "--expected-upstream",
          target,
        ]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "error: index or tracked worktree is not clean",
        );
        expect(result.stderr).toContain(refuseHint);
        expectNoSetupOrEffects();
        expect(revParse(work, "HEAD")).toBe(target);
        expect(indexTree(work)).toBe(beforeIndex);
        expect(git(work, ["status", "--porcelain=v1"]).stdout).toBe(
          beforeStatus,
        );
        expect(readFileSync(path.join(work, "unrelated.txt"), "utf8")).toBe(
          "dirty\n",
        );
      },
    );

    it("diagnoses MERGE_HEAD before cleanliness without mutating merge state", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD");
      const state = { MERGE_HEAD: `${target}\n`, MERGE_MODE: "no-ff" };
      net.writeFiles(gitDir(work), state);
      writeFileSync(path.join(work, "shared.txt"), "dirty\n");
      const beforeIndex = indexTree(work);
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a merge is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expectNoSetupOrEffects();
      expect(revParse(work, "HEAD")).toBe(target);
      expect(indexTree(work)).toBe(beforeIndex);
      for (const [file, contents] of Object.entries(state)) {
        expect(net.readGitStateFile(work, file)).toBe(contents);
      }
      expect(readFileSync(path.join(work, "shared.txt"), "utf8")).toBe(
        "dirty\n",
      );
    });

    it.each(["rebase-apply", "rebase-merge"])(
      "refuses an in-progress %s without clearing state",
      (marker) => {
        const { work } = createRepository();
        const target = revParse(work, "HEAD");
        const stateDir = path.join(gitDir(work), marker);
        mkdirSync(stateDir);
        writeFileSync(path.join(stateDir, "head-name"), "refs/heads/main\n");
        writeFileSync(path.join(stateDir, "orig-head"), `${target}\n`);
        const beforeState = snapshotDir(stateDir);
        const beforeIndex = indexTree(work);
        const result = runScript(work, [
          "--merge",
          "--expected-upstream",
          target,
        ]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          "error: a rebase is already in progress",
        );
        expect(result.stderr).toContain(refuseHint);
        expectNoSetupOrEffects();
        expect(revParse(work, "HEAD")).toBe(target);
        expect(indexTree(work)).toBe(beforeIndex);
        expect(snapshotDir(stateDir)).toEqual(beforeState);
        expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      },
    );

    it("refuses a linked worktree on main before setup", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD");
      git(work, ["checkout", "-b", "primary-parked"]);
      const linked = path.join(net.scratch, "linked");
      git(work, ["worktree", "add", linked, "main"]);
      const result = runScript(linked, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "upstream integration requires the primary checkout, not a linked worktree",
      );
      expect(revParse(linked, "HEAD")).toBe(target);
      expectNoSetupOrEffects();
    });
  });

  describe("local pinned input", () => {
    it("refuses a missing local commit rather than fetching it", () => {
      const { work } = createRepository();
      const target = "f".repeat(40);
      expect(
        git(work, ["cat-file", "-e", target], { allowFail: true }).status,
      ).not.toBe(0);
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream commit ${target} is not available locally`,
      );
      expect(result.stderr).toContain("--fetch");
      expect(net.recordedFetches()).toEqual([]);
    });

    it("refuses a missing tracking ref without refreshing it", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "upstream/main is not available locally; run ./scripts/fork-sync/sync.sh --fetch",
      );
      expect(net.recordedFetches()).toEqual([]);
    });

    it("refuses a local target outside fetched upstream history", () => {
      const { work } = materializeLocalHistory("divergent");
      const target = revParse(work, "HEAD");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream ${target} is not contained in local upstream/main`,
      );
      expect(result.stderr).toContain(
        "fetch and replan if upstream history changed",
      );
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "merge", "ls-remote"].includes(args[0]),
        ),
      ).toEqual([]);
    });

    it("refuses a full object OID that is not a commit", () => {
      const { work } = createRepository();
      const target = revParse(work, "HEAD^{tree}");
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `approved upstream commit ${target} is not available locally`,
      );
      expect(net.recordedFetches()).toEqual([]);
    });

    it("keeps merge offline and local tags byte-identical", () => {
      const { work, target } = materializeLocalHistory("divergent");
      git(work, ["tag", "protected"]);
      const tagArgs = [
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ];
      const tags = git(work, tagArgs).stdout;
      const result = runScript(work, [
        "--merge",
        "--expected-upstream",
        target,
      ]);
      expect(result.status).toBe(0);
      expect(
        recordedInvocations().filter(({ args }) =>
          ["fetch", "ls-remote", "push"].includes(args[0]),
        ),
      ).toEqual([]);
      expect(git(work, tagArgs).stdout).toBe(tags);
      expect(result.stdout).not.toContain("ahead/behind");
      expect(result.stdout).not.toContain("newest upstream");
    });
  });
});
