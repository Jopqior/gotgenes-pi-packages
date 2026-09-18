import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const scriptPath = path.join(repoRoot, "scripts", "upstream-sync.sh");
const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
const githubUpstream = "https://github.com/gotgenes/pi-packages.git";
const mergeMessage = "chore: merge upstream/main";
const refuseHint =
  "run ./scripts/upstream-sync.sh to fetch and print ahead/behind without merging";

const gitWrapperSource = [
  "#!/usr/bin/env node",
  '"use strict";',
  'const { spawnSync } = require("node:child_process");',
  'const { appendFileSync } = require("node:fs");',
  "",
  "const realGit = process.env.UPSTREAM_SYNC_TEST_REAL_GIT;",
  "const logFile = process.env.UPSTREAM_SYNC_TEST_GIT_LOG;",
  "const upstreamBare = process.env.UPSTREAM_SYNC_TEST_UPSTREAM_BARE;",
  "const args = process.argv.slice(2);",
  "",
  'appendFileSync(logFile, JSON.stringify(args) + "\\n");',
  "",
  "function rewrite(input) {",
  "  const cmd = input[0];",
  '  if (cmd !== "fetch" && cmd !== "ls-remote") {',
  "    return input;",
  "  }",
  "  return input.map((arg) => {",
  "    if (",
  '      arg === "https://github.com/gotgenes/pi-packages.git" ||',
  '      arg === "https://github.com/gotgenes/pi-packages"',
  "    ) {",
  "      return upstreamBare;",
  "    }",
  '    if (cmd === "fetch" && arg === "upstream") {',
  "      return upstreamBare;",
  "    }",
  '    if (cmd === "fetch" && arg === "main") {',
  '      return "+refs/heads/main:refs/remotes/upstream/main";',
  "    }",
  "    return arg;",
  "  });",
  "}",
  "",
  'const result = spawnSync(realGit, rewrite(args), { stdio: "inherit" });',
  "const code = result.status === null ? 1 : result.status;",
  "if (",
  "  code === 0 &&",
  '  args[0] === "fetch" &&',
  "  process.env.UPSTREAM_SYNC_TEST_INJECT_TAG",
  ") {",
  '  spawnSync(realGit, ["tag", process.env.UPSTREAM_SYNC_TEST_INJECT_TAG], {',
  '    stdio: "inherit",',
  "  });",
  "}",
  "process.exit(code);",
  "",
].join("\n");

const baseGitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
  GIT_TERMINAL_PROMPT: "0",
  LC_ALL: "C",
  LANG: "C",
};

/** @type {string | undefined} */
let scratch;

/**
 * @param {string} cwd
 * @param {string[]} args
 * @param {{ allowFail?: boolean }} [options]
 */
function git(cwd, args, options = {}) {
  const result = spawnSync(realGit, args, {
    cwd,
    encoding: "utf8",
    env: baseGitEnv,
  });
  if ((result.status ?? 1) !== 0 && !options.allowFail) {
    throw new Error(
      `git ${args.join(" ")} in ${cwd} exited ${result.status}\n${result.stderr}\n${result.stdout}`,
    );
  }
  return result;
}

/**
 * @param {string} cwd
 */
function configureRepo(cwd) {
  git(cwd, ["config", "user.name", "Test"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "commit.gpgsign", "false"]);
  git(cwd, ["config", "core.hooksPath", "/dev/null"]);
}

/**
 * @param {string} cwd
 * @param {string} rev
 */
function revParse(cwd, rev) {
  return git(cwd, ["rev-parse", rev]).stdout.trim();
}

/**
 * @param {string} cwd
 * @param {string} [rev]
 */
function parentsOf(cwd, rev = "HEAD") {
  const line = git(cwd, ["log", "-1", "--format=%P", rev]).stdout.trim();
  return line === "" ? [] : line.split(" ");
}

/**
 * @param {string} cwd
 */
function gitDir(cwd) {
  return path.resolve(cwd, git(cwd, ["rev-parse", "--git-dir"]).stdout.trim());
}

/**
 * @param {string} cwd
 */
function indexTree(cwd) {
  return git(cwd, ["write-tree"]).stdout.trim();
}

/**
 * @param {string} directory
 * @returns {Record<string, string> | null}
 */
function snapshotDir(directory) {
  if (!existsSync(directory)) {
    return null;
  }
  /** @type {Record<string, string>} */
  const files = {};
  /**
   * @param {string} current
   * @param {string} prefix
   */
  function walk(current, prefix) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, relative);
      } else if (entry.isFile()) {
        files[relative] = readFileSync(full, "utf8");
      }
    }
  }
  walk(directory, "");
  return files;
}

/**
 * @param {string} cwd
 * @param {string} name
 */
function readGitStateFile(cwd, name) {
  const filePath = path.join(gitDir(cwd), name);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
}

/**
 * @param {string} upstreamBare
 * @param {string} message
 * @param {Record<string, string>} files
 */
function advanceUpstream(upstreamBare, message, files) {
  if (scratch === undefined) {
    throw new Error("scratch directory is not initialized");
  }
  const dir = path.join(scratch, "build", "upstream-advance");
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  git(scratch, ["clone", upstreamBare, dir]);
  configureRepo(dir);
  commit(dir, message, files);
  git(dir, ["push", "origin", "main"]);
  return revParse(dir, "HEAD");
}

/**
 * @param {string} cwd
 * @param {Record<string, string>} files
 */
function writeFiles(cwd, files) {
  for (const [relative, content] of Object.entries(files)) {
    const filePath = path.join(cwd, relative);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }
}

/**
 * @param {string} cwd
 * @param {string} message
 * @param {Record<string, string>} files
 */
function commit(cwd, message, files) {
  writeFiles(cwd, files);
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "-m", message]);
}

/**
 * @param {string} cwd
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [extraEnv]
 */
function runScript(cwd, args, extraEnv = {}) {
  if (scratch === undefined) {
    throw new Error("scratch directory is not initialized");
  }
  const result = spawnSync("bash", [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...baseGitEnv,
      PATH: `${path.join(scratch, "bin")}${path.delimiter}${process.env.PATH}`,
      UPSTREAM_SYNC_TEST_REAL_GIT: realGit,
      UPSTREAM_SYNC_TEST_GIT_LOG: path.join(scratch, "git-args.jsonl"),
      UPSTREAM_SYNC_TEST_UPSTREAM_BARE: path.join(
        scratch,
        "remotes",
        "gotgenes",
        "pi-packages.git",
      ),
      ...extraEnv,
    },
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * @returns {{ args: string[] }[]}
 */
function recordedInvocations() {
  if (scratch === undefined) {
    throw new Error("scratch directory is not initialized");
  }
  const logPath = path.join(scratch, "git-args.jsonl");
  if (!existsSync(logPath)) {
    return [];
  }
  return readFileSync(logPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ args: JSON.parse(line) }));
}

/**
 * @returns {string[][]}
 */
function recordedFetches() {
  return recordedInvocations()
    .map((entry) => entry.args)
    .filter((args) => args[0] === "fetch");
}

/**
 * @param {string} scratchDir
 * @param {"divergent" | "conflict" | "already-integrated" | "empty-upstream"} topology
 */
function materializeNetwork(scratchDir, topology) {
  const upstreamBare = path.join(
    scratchDir,
    "remotes",
    "gotgenes",
    "pi-packages.git",
  );
  const originBare = path.join(
    scratchDir,
    "remotes",
    "Jopqior",
    "gotgenes-pi-packages.git",
  );
  const seed = path.join(scratchDir, "build", "seed");
  const work = path.join(scratchDir, "work");

  mkdirSync(upstreamBare, { recursive: true });
  mkdirSync(originBare, { recursive: true });
  mkdirSync(seed, { recursive: true });
  git(upstreamBare, ["init", "--bare", "-b", "main"]);
  git(originBare, ["init", "--bare", "-b", "main"]);

  git(seed, ["init", "-b", "main"]);
  configureRepo(seed);
  commit(seed, "chore: shared base", {
    "README.md": "base\n",
    "shared.txt": "base\n",
    "unrelated.txt": "keep\n",
  });
  git(seed, ["remote", "add", "upstream-bare", upstreamBare]);
  git(seed, ["remote", "add", "origin-bare", originBare]);
  git(seed, ["push", "upstream-bare", "main"]);
  git(seed, ["push", "origin-bare", "main"]);

  if (topology === "already-integrated") {
    git(seed, ["checkout", "-B", "main"]);
    commit(seed, "feat: upstream advance", {
      "upstream-only.txt": "from upstream\n",
    });
    git(seed, ["tag", "pi-subagents-v1.0.0"]);
    git(seed, ["tag", "pi-subagents-v21.7.0"]);
    git(seed, ["push", "upstream-bare", "main"]);
    git(seed, ["push", "--tags", "upstream-bare"]);
    commit(seed, "feat: fork-only change", {
      "fork-only.txt": "from fork\n",
    });
    git(seed, ["push", "origin-bare", "main"]);
  } else {
    git(seed, ["checkout", "-B", "upstream-line"]);
    if (topology === "empty-upstream") {
      git(seed, ["commit", "--allow-empty", "-m", "chore: empty upstream"]);
    } else if (topology === "conflict") {
      commit(seed, "feat: upstream shared edit", {
        "shared.txt": "upstream side\n",
        "upstream-only.txt": "from upstream\n",
      });
    } else {
      commit(seed, "feat: upstream-only change", {
        "upstream-only.txt": "from upstream\n",
      });
    }
    git(seed, ["tag", "pi-subagents-v1.0.0"]);
    git(seed, ["tag", "pi-subagents-v21.7.0"]);
    git(seed, ["push", "upstream-bare", "HEAD:main"]);
    git(seed, ["push", "--tags", "upstream-bare"]);

    git(seed, ["checkout", "main"]);
    if (topology === "conflict") {
      commit(seed, "feat: fork shared edit", {
        "shared.txt": "fork side\n",
        "fork-only.txt": "from fork\n",
      });
    } else {
      commit(seed, "feat: fork-only change", {
        "fork-only.txt": "from fork\n",
      });
    }
    git(seed, ["push", "origin-bare", "main"]);
  }

  git(scratchDir, ["clone", originBare, work]);
  configureRepo(work);
  return { work, originBare, upstreamBare };
}

beforeEach(() => {
  scratch = mkdtempSync(path.join(tmpdir(), "upstream-sync-"));
  mkdirSync(path.join(scratch, "bin"), { recursive: true });
  const wrapperPath = path.join(scratch, "bin", "git");
  writeFileSync(wrapperPath, gitWrapperSource);
  chmodSync(wrapperPath, 0o755);
  writeFileSync(path.join(scratch, "git-args.jsonl"), "");
});

afterEach(() => {
  if (scratch !== undefined) {
    rmSync(scratch, { recursive: true, force: true });
  }
  scratch = undefined;
});

describe("upstream-sync.sh", () => {
  describe("status", () => {
    it("fetches without changing HEAD", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      const before = revParse(work, "HEAD");

      const result = runScript(work, []);

      expect(result.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(result.stdout).toContain("remote.upstream.tagOpt=--no-tags");
      expect(result.stdout).toContain("remote.upstream.pushurl=DISABLE");
      expect(result.stdout).toMatch(
        /ahead\/behind \(HEAD\.\.\.upstream\/main\): 1\/1/,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });
  });

  describe("--merge", () => {
    it("creates a two-parent merge with first-parent fork content", () => {
      const { work, upstreamBare } = materializeNetwork(scratch, "divergent");
      const before = revParse(work, "HEAD");
      const upstreamMain = revParse(upstreamBare, "refs/heads/main");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      const parents = parentsOf(work);
      expect(parents).toEqual([before, upstreamMain]);
      expect(git(work, ["log", "-1", "--format=%s"]).stdout.trim()).toBe(
        mergeMessage,
      );
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD^1:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(
        git(work, ["show", "HEAD^1:upstream-only.txt"], { allowFail: true })
          .status,
      ).not.toBe(0);
    });

    it("is a no-op when upstream is already integrated", () => {
      const { work } = materializeNetwork(scratch, "already-integrated");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });

    it("merges a second upstream advance then no-ops a repeat", () => {
      const { work, upstreamBare } = materializeNetwork(scratch, "divergent");
      const forkHead = revParse(work, "HEAD");
      const upstreamFirst = revParse(upstreamBare, "refs/heads/main");

      const first = runScript(work, ["--merge"]);
      expect(first.status).toBe(0);
      expect(parentsOf(work)).toEqual([forkHead, upstreamFirst]);
      const firstMerge = revParse(work, "HEAD");
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );

      const upstreamSecond = advanceUpstream(
        upstreamBare,
        "feat: second upstream advance",
        { "upstream-second.txt": "second wave\n" },
      );
      const second = runScript(work, ["--merge"]);
      expect(second.status).toBe(0);
      expect(parentsOf(work)).toEqual([firstMerge, upstreamSecond]);
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(git(work, ["show", "HEAD:upstream-second.txt"]).stdout).toBe(
        "second wave\n",
      );
      expect(git(work, ["show", "HEAD^1:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      const secondMerge = revParse(work, "HEAD");

      const third = runScript(work, ["--merge"]);
      expect(third.status).toBe(0);
      expect(revParse(work, "HEAD")).toBe(secondMerge);
      expect(parentsOf(work)).toEqual([firstMerge, upstreamSecond]);
    });

    it("merges a fresh clone that has no private sync refs", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      expect(
        git(work, ["rev-parse", "--verify", "refs/sync/upstream-main"], {
          allowFail: true,
        }).status,
      ).not.toBe(0);
      expect(existsSync(path.join(gitDir(work), "upstream-sync-state"))).toBe(
        false,
      );

      const before = revParse(work, "HEAD");
      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      expect(parentsOf(work)).toHaveLength(2);
      expect(parentsOf(work)[0]).toBe(before);
    });

    it("leaves MERGE_HEAD so git merge --continue can finish a conflict", () => {
      const { work } = materializeNetwork(scratch, "conflict");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: merge conflicts remain; see docs/upstream-sync.md",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(true);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(readFileSync(path.join(work, "shared.txt"), "utf8")).toContain(
        "<<<<<<<",
      );

      writeFileSync(path.join(work, "shared.txt"), "resolved\n");
      git(work, ["add", "shared.txt"]);
      const continued = spawnSync(realGit, ["merge", "--continue"], {
        cwd: work,
        encoding: "utf8",
        env: { ...baseGitEnv, GIT_EDITOR: "true" },
      });
      expect(continued.status).toBe(0);
      expect(parentsOf(work)).toEqual([
        before,
        revParse(work, "upstream/main"),
      ]);
      expect(git(work, ["show", "HEAD:shared.txt"]).stdout).toBe("resolved\n");
      expect(git(work, ["show", "HEAD:fork-only.txt"]).stdout).toBe(
        "from fork\n",
      );
      expect(git(work, ["show", "HEAD:upstream-only.txt"]).stdout).toBe(
        "from upstream\n",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });

    it("leaves MERGE_HEAD so git merge --abort restores the pre-merge HEAD", () => {
      const { work } = materializeNetwork(scratch, "conflict");
      const before = revParse(work, "HEAD");
      const beforeTree = revParse(work, "HEAD^{tree}");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(true);

      git(work, ["merge", "--abort"]);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(revParse(work, "HEAD^{tree}")).toBe(beforeTree);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(readFileSync(path.join(work, "shared.txt"), "utf8")).toBe(
        "fork side\n",
      );
    });
  });

  describe("guards", () => {
    it("refuses a non-main branch without merging", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      git(work, ["checkout", "-b", "feature"]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: current branch is feature, not main",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "feature",
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses a non-fork origin without merging", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      git(work, [
        "remote",
        "set-url",
        "origin",
        "https://github.com/example/not-the-fork.git",
      ]);
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: origin is not Jopqior/gotgenes-pi-packages (got https://github.com/example/not-the-fork.git)",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an unrelated dirty worktree that git merge would otherwise accept", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      writeFileSync(path.join(work, "unrelated.txt"), "dirty worktree\n");
      const before = revParse(work, "HEAD");

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: index or tracked worktree is not clean",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(readFileSync(path.join(work, "unrelated.txt"), "utf8")).toBe(
        "dirty worktree\n",
      );
      expect(git(work, ["diff", "--", "unrelated.txt"]).stdout).toContain(
        "dirty worktree",
      );
    });

    it("refuses an unrelated dirty index with the script diagnostic", () => {
      // Measured on git 2.53.0: merge itself also refuses every staged
      // unrelated-path variant probed. This pin is the script-owned
      // diagnostic plus unchanged HEAD/index, not Git accepting the merge.
      const { work } = materializeNetwork(scratch, "divergent");
      writeFileSync(path.join(work, "unrelated.txt"), "dirty index\n");
      git(work, ["add", "unrelated.txt"]);
      const before = revParse(work, "HEAD");
      const cachedBefore = git(work, ["diff", "--cached"]).stdout;

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: index or tracked worktree is not clean",
      );
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(git(work, ["diff", "--cached"]).stdout).toBe(cachedBefore);
      expect(git(work, ["diff", "--cached", "--name-only"]).stdout.trim()).toBe(
        "unrelated.txt",
      );
    });

    it("refuses an in-progress merge without mutating MERGE_HEAD", () => {
      const { work } = materializeNetwork(scratch, "empty-upstream");
      const fetched = runScript(work, []);
      expect(fetched.status).toBe(0);
      git(work, [
        "merge",
        "--no-commit",
        "--no-ff",
        "-m",
        "wip",
        "upstream/main",
      ]);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        mergeHead: readGitStateFile(work, "MERGE_HEAD"),
        mergeMode: readGitStateFile(work, "MERGE_MODE"),
      };

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a merge is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(readGitStateFile(work, "MERGE_HEAD")).toBe(before.mergeHead);
      expect(readGitStateFile(work, "MERGE_MODE")).toBe(before.mergeMode);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase without clearing rebase-apply", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      writeFiles(work, { "am.txt": "v1\n" });
      git(work, ["add", "am.txt"]);
      git(work, ["commit", "-m", "test: am base"]);
      const patch = git(work, ["format-patch", "-1", "--stdout"]).stdout;
      const patchPath = path.join(scratch, "am.patch");
      writeFileSync(patchPath, patch);
      git(work, ["reset", "--hard", "HEAD~1"]);
      writeFiles(work, { "am.txt": "v3\n" });
      git(work, ["add", "am.txt"]);
      git(work, ["commit", "-m", "test: am blocker"]);
      const am = spawnSync(realGit, ["am", patchPath], {
        cwd: work,
        encoding: "utf8",
        env: baseGitEnv,
      });
      expect(am.status).not.toBe(0);
      expect(existsSync(path.join(gitDir(work), "rebase-apply"))).toBe(true);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "main",
      );
      expect(git(work, ["diff", "--quiet"], { allowFail: true }).status).toBe(
        0,
      );
      expect(
        git(work, ["diff", "--cached", "--quiet"], { allowFail: true }).status,
      ).toBe(0);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        rebaseApply: snapshotDir(path.join(gitDir(work), "rebase-apply")),
      };

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(snapshotDir(path.join(gitDir(work), "rebase-apply"))).toEqual(
        before.rebaseApply,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(parentsOf(work)).toHaveLength(1);
    });

    it("refuses an in-progress rebase-merge without clearing rebase-merge", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      const editor = path.join(scratch, "rebase-editor.sh");
      writeFileSync(editor, "#!/bin/sh\nprintf 'break\\n' > \"$1\"\n");
      chmodSync(editor, 0o755);
      spawnSync(realGit, ["rebase", "-i", "HEAD~1"], {
        cwd: work,
        encoding: "utf8",
        env: {
          ...baseGitEnv,
          GIT_SEQUENCE_EDITOR: editor,
          GIT_EDITOR: "true",
        },
      });
      expect(existsSync(path.join(gitDir(work), "rebase-merge"))).toBe(true);
      git(work, ["update-ref", "refs/heads/main", "HEAD"]);
      git(work, ["symbolic-ref", "HEAD", "refs/heads/main"]);
      expect(git(work, ["branch", "--show-current"]).stdout.trim()).toBe(
        "main",
      );
      expect(git(work, ["diff", "--quiet"], { allowFail: true }).status).toBe(
        0,
      );
      expect(
        git(work, ["diff", "--cached", "--quiet"], { allowFail: true }).status,
      ).toBe(0);
      const before = {
        head: revParse(work, "HEAD"),
        indexTree: indexTree(work),
        parents: parentsOf(work),
        rebaseMerge: snapshotDir(path.join(gitDir(work), "rebase-merge")),
      };

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: a rebase is already in progress");
      expect(result.stderr).toContain(refuseHint);
      expect(revParse(work, "HEAD")).toBe(before.head);
      expect(indexTree(work)).toBe(before.indexTree);
      expect(parentsOf(work)).toEqual(before.parents);
      expect(snapshotDir(path.join(gitDir(work), "rebase-merge"))).toEqual(
        before.rebaseMerge,
      );
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
    });
  });

  describe("fetch protections", () => {
    it("records an explicit fetch --no-tags of upstream main", () => {
      const { work } = materializeNetwork(scratch, "divergent");

      runScript(work, []);

      const fetches = recordedFetches();
      expect(fetches.length).toBeGreaterThan(0);
      expect(
        fetches.some(
          (args) =>
            args[0] === "fetch" &&
            args.includes("--no-tags") &&
            args.includes("upstream") &&
            args.includes("main"),
        ),
      ).toBe(true);
    });

    it("refuses when the local tag set changes during fetch", () => {
      const { work } = materializeNetwork(scratch, "divergent");
      const before = revParse(work, "HEAD");
      const tagsBefore = git(work, ["tag"]).stdout;

      const result = runScript(work, ["--merge"], {
        UPSTREAM_SYNC_TEST_INJECT_TAG: "imported-collision-v1.0.0",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "error: tag set changed during fetch; delete imported tags before merging:",
      );
      expect(result.stderr).toContain("imported-collision-v1.0.0");
      expect(result.stderr).toContain(
        "git tag -d <name> for each, then re-run",
      );
      expect(revParse(work, "HEAD")).toBe(before);
      expect(parentsOf(work)).toHaveLength(1);
      expect(existsSync(path.join(gitDir(work), "MERGE_HEAD"))).toBe(false);
      expect(git(work, ["tag"]).stdout).toContain("imported-collision-v1.0.0");
      expect(tagsBefore).not.toContain("imported-collision-v1.0.0");
    });

    it("does not import colliding upstream tag names", () => {
      const { work, upstreamBare } = materializeNetwork(scratch, "divergent");
      const forkOid = revParse(work, "HEAD");
      const upstreamV1 = revParse(
        upstreamBare,
        "refs/tags/pi-subagents-v1.0.0",
      );
      expect(forkOid).not.toBe(upstreamV1);
      git(work, ["tag", "pi-subagents-v1.0.0", forkOid]);
      const localTagObject = revParse(work, "refs/tags/pi-subagents-v1.0.0");
      expect(localTagObject).toBe(forkOid);

      const result = runScript(work, ["--merge"]);

      expect(result.status).toBe(0);
      expect(revParse(work, "refs/tags/pi-subagents-v1.0.0")).toBe(
        localTagObject,
      );
      expect(
        git(work, ["rev-parse", "--verify", "refs/tags/pi-subagents-v21.7.0"], {
          allowFail: true,
        }).status,
      ).not.toBe(0);
      expect(git(work, ["tag"]).stdout.trim()).toBe("pi-subagents-v1.0.0");
      expect(result.stdout).toContain("tag count unchanged (1)");
    });

    it("sets remote.upstream.pushurl to DISABLE", () => {
      const { work } = materializeNetwork(scratch, "divergent");

      const result = runScript(work, []);

      expect(result.status).toBe(0);
      expect(
        git(work, ["config", "--get", "remote.upstream.pushurl"]).stdout.trim(),
      ).toBe("DISABLE");
      expect(
        git(work, ["config", "--get", "remote.upstream.tagOpt"]).stdout.trim(),
      ).toBe("--no-tags");
      expect(git(work, ["remote", "get-url", "upstream"]).stdout.trim()).toBe(
        githubUpstream,
      );
    });

    it("prints the newest upstream pi-subagents tag from ls-remote", () => {
      const { work, upstreamBare } = materializeNetwork(scratch, "divergent");
      const peeled = revParse(upstreamBare, "refs/tags/pi-subagents-v21.7.0");

      const result = runScript(work, []);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        `newest upstream pi-subagents tag: pi-subagents-v21.7.0 (${peeled})`,
      );
      const lsRemote = recordedInvocations()
        .map((entry) => entry.args)
        .filter((args) => args[0] === "ls-remote");
      expect(lsRemote.length).toBeGreaterThan(0);
      expect(
        lsRemote.some(
          (args) =>
            args.includes("--tags") &&
            args.includes(githubUpstream) &&
            args.includes("pi-subagents-v*"),
        ),
      ).toBe(true);
    });
  });
});
