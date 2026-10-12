// Instance-owned scratch directory and invocation recorder for sync.sh.
// Local merge tests use only a working repository; fetch tests additionally
// create a bare upstream and redirect its transport. Origin is metadata only.

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

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(repoRoot, "scripts/fork-sync/sync.sh");

export const realGit = execFileSync("which", ["git"], {
  encoding: "utf8",
  stdio: "pipe",
}).trim();
export const githubUpstream = "git@github.com:gotgenes/pi-packages.git";
export const mergeMessage = "chore: merge upstream/main";
export const refuseHint =
  "run ./scripts/fork-sync/sync.sh --fetch to fetch and print ahead/behind without merging";

const gitWrapperSource = () =>
  [
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
    '    if (arg === "upstream") {',
    "      return upstreamBare;",
    "    }",
    "    return arg;",
    "  });",
    "}",
    "",
    'if (args[0] === "merge" && process.env.UPSTREAM_SYNC_TEST_FAIL_MERGE) {',
    '  process.stderr.write("simulated non-conflict merge failure\\n");',
    "  process.exit(1);",
    "}",
    'if (args[0] === "merge-base" && process.env.UPSTREAM_SYNC_TEST_FAIL_INSPECTION) {',
    '  process.stderr.write("simulated ancestry inspection failure\\n");',
    "  process.exit(128);",
    "}",
    // Record forbidden external effects without ever performing them.
    'if (args[0] === "push") process.exit(0);',
    'const result = spawnSync(realGit, rewrite(args), { stdio: "inherit" });',
    "const code = result.status === null ? 1 : result.status;",
    "if (",
    "  code === 0 &&",
    '  args[0] === "fetch" &&',
    "  process.env.UPSTREAM_SYNC_TEST_INJECT_TAG",
    ") {",
    "  const tag = process.env.UPSTREAM_SYNC_TEST_INJECT_TAG;",
    "  const action = process.env.UPSTREAM_SYNC_TEST_TAG_ACTION;",
    "  const tagArgs =",
    '    action === "delete" ? ["tag", "-d", tag] :',
    '    action === "retarget" ? ["tag", "-f", tag, "upstream/main"] :',
    '    ["tag", tag];',
    '  const injected = spawnSync(realGit, tagArgs, { stdio: "inherit" });',
    "  if (injected.status !== 0) process.exit(1);",
    "}",
    'if (args[0] === "fetch" && process.env.UPSTREAM_SYNC_TEST_FAIL_FETCH_AFTER_TAG) {',
    '  process.stderr.write("simulated fetch failure after tag write\\n");',
    "  process.exit(1);",
    "}",
    "process.exit(code);",
    "",
  ].join("\n");

export const baseGitEnv = {
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

/**
 * Create the script runner and empty invocation log without a repository.
 * Tests opt into local repository state or an upstream transport as needed.
 *
 * @returns {UpstreamNetwork}
 */
export function createUpstreamNetwork() {
  const scratch = mkdtempSync(path.join(tmpdir(), "upstream-sync-"));
  mkdirSync(path.join(scratch, "bin"), { recursive: true });
  const wrapperPath = path.join(scratch, "bin", "git");
  writeFileSync(wrapperPath, gitWrapperSource());
  chmodSync(wrapperPath, 0o755);
  writeFileSync(path.join(scratch, "git-args.jsonl"), "");

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
      stdio: "pipe",
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
    return path.resolve(
      cwd,
      git(cwd, ["rev-parse", "--git-dir"]).stdout.trim(),
    );
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
    const result = spawnSync("bash", [scriptPath, ...args], {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
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

  function createRepository() {
    const work = path.join(scratch, "work");
    mkdirSync(work);
    git(work, ["init", "-b", "main"]);
    configureRepo(work);
    commit(work, "chore: shared base", {
      "shared.txt": "base\n",
      "unrelated.txt": "keep\n",
    });
    git(work, [
      "remote",
      "add",
      "origin",
      "git@github.com:Jopqior/gotgenes-pi-packages.git",
    ]);
    git(work, ["remote", "add", "upstream", githubUpstream]);
    return { work };
  }

  /**
   * Build only the local graph consumed by offline merge.
   * @param {"divergent" | "conflict" | "already-integrated" | "fast-forward" | "unrelated"} topology
   */
  function materializeLocalHistory(topology) {
    const { work } = createRepository();
    if (topology === "already-integrated") {
      commit(work, "feat: upstream advance", {
        "upstream-only.txt": "from upstream\n",
      });
      git(work, ["update-ref", "refs/remotes/upstream/main", "HEAD"]);
    } else {
      git(work, [
        "checkout",
        topology === "unrelated" ? "--orphan" : "-b",
        "upstream-line",
      ]);
      if (topology === "unrelated") {
        git(work, ["rm", "-rf", "."]);
        commit(work, "feat: independent upstream root", {
          "independent.txt": "unrelated history\n",
        });
      } else {
        commit(work, "feat: upstream-only change", {
          ...(topology === "conflict"
            ? { "shared.txt": "upstream side\n" }
            : {}),
          "upstream-only.txt": "from upstream\n",
        });
      }
      git(work, ["update-ref", "refs/remotes/upstream/main", "HEAD"]);
      git(work, ["checkout", "main"]);
      git(work, ["branch", "-D", "upstream-line"]);
    }
    if (topology !== "fast-forward" && topology !== "unrelated") {
      commit(work, "feat: fork-only change", {
        ...(topology === "conflict" ? { "shared.txt": "fork side\n" } : {}),
        "fork-only.txt": "from fork\n",
      });
    }
    return { work, target: revParse(work, "upstream/main") };
  }

  // Fetch needs a real upstream transport, never an origin server.
  function materializeNetwork() {
    const { work } = createRepository();
    const upstreamBare = path.join(
      scratch,
      "remotes",
      "gotgenes",
      "pi-packages.git",
    );
    mkdirSync(upstreamBare, { recursive: true });
    git(upstreamBare, ["init", "--bare", "-b", "main"]);
    git(work, ["push", upstreamBare, "main"]);
    advanceUpstream(upstreamBare, "feat: upstream-only change", {
      "upstream-only.txt": "from upstream\n",
    });
    git(upstreamBare, ["tag", "pi-subagents-v1.0.0", "main"]);
    git(upstreamBare, ["tag", "pi-subagents-v21.7.0", "main"]);
    commit(work, "feat: fork-only change", {
      "fork-only.txt": "from fork\n",
    });
    return { work, upstreamBare };
  }

  return {
    scratch,
    git,
    revParse,
    parentsOf,
    gitDir,
    indexTree,
    snapshotDir,
    readGitStateFile,
    advanceUpstream,
    writeFiles,
    runScript,
    recordedInvocations,
    recordedFetches,
    createRepository,
    materializeLocalHistory,
    materializeNetwork,
    dispose() {
      rmSync(scratch, { recursive: true, force: true });
    },
  };
}

/**
 * @typedef {ReturnType<typeof createUpstreamNetwork>} UpstreamNetwork
 */
