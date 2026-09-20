// Instance-owned local-upstream network for the upstream-sync tests: a
// scratch directory holding a git wrapper on PATH (which rewrites `fetch`/
// `ls-remote` to the local bare upstream and records every invocation), the
// `remotes/` bare repositories `materializeNetwork` builds, and the process
// helpers tests drive the script with. One instance per test, so no test can
// observe another's remotes or invocation log.

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
const scriptPath = path.join(repoRoot, "scripts", "upstream-sync.sh");

export const realGit = execFileSync("which", ["git"], {
  encoding: "utf8",
}).trim();
export const githubUpstream = "git@github.com:gotgenes/pi-packages.git";
export const mergeMessage = "chore: merge upstream/main";
export const refuseHint =
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
  '    if (arg === "upstream") {',
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
 * Create the scratch network: the `bin/git` wrapper, an empty invocation
 * log, and the `remotes/`/`build/` directories `materializeNetwork` and the
 * advance helpers populate.
 *
 * @returns {UpstreamNetwork}
 */
export function createUpstreamNetwork() {
  const scratch = mkdtempSync(path.join(tmpdir(), "upstream-sync-"));
  mkdirSync(path.join(scratch, "bin"), { recursive: true });
  const wrapperPath = path.join(scratch, "bin", "git");
  writeFileSync(wrapperPath, gitWrapperSource);
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
   * Advance upstream main through named steps, tagging release commits along
   * the way. Each step commits its files; a step with a `tag` also cuts the
   * named upstream release tag (annotated or lightweight) at that commit.
   *
   * @param {string} upstreamBare
   * @param {{ message: string, files: Record<string, string>, tag?: { name: string, annotated?: boolean } }[]} steps
   * @returns {string[]} the commit OIDs of each step
   */
  function advanceUpstreamReleases(upstreamBare, steps) {
    const dir = path.join(scratch, "build", "upstream-releases");
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
    git(scratch, ["clone", upstreamBare, dir]);
    configureRepo(dir);
    const oids = [];
    for (const step of steps) {
      commit(dir, step.message, step.files);
      const oid = revParse(dir, "HEAD");
      oids.push(oid);
      if (step.tag) {
        if (step.tag.annotated) {
          git(dir, [
            "tag",
            "-a",
            step.tag.name,
            "-m",
            `release ${step.tag.name}`,
          ]);
        } else {
          git(dir, ["tag", step.tag.name]);
        }
      }
    }
    git(dir, ["push", "origin", "main"]);
    git(dir, ["push", "--tags", "origin"]);
    return oids;
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

  /**
   * @param {"divergent" | "conflict" | "already-integrated" | "empty-upstream" | "core-sync"} topology
   */
  function materializeNetwork(topology) {
    const upstreamBare = path.join(
      scratch,
      "remotes",
      "gotgenes",
      "pi-packages.git",
    );
    const originBare = path.join(
      scratch,
      "remotes",
      "Jopqior",
      "gotgenes-pi-packages.git",
    );
    const seed = path.join(scratch, "build", "seed");
    const work = path.join(scratch, "work");

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
    } else if (topology === "core-sync") {
      git(seed, ["checkout", "-B", "upstream-line"]);
      commit(seed, "feat(pi-subagents): upstream release 21.7.0", {
        "packages/pi-subagents/package.json": `${JSON.stringify(
          { name: "@gotgenes/pi-subagents", version: "21.7.0" },
          null,
          2,
        )}\n`,
        "packages/pi-subagents/src/core.ts": "export const core = 1;\n",
      });
      git(seed, ["tag", "-a", "pi-subagents-v21.7.0", "-m", "upstream 21.7.0"]);
      git(seed, ["push", "upstream-bare", "HEAD:main"]);
      git(seed, ["push", "--tags", "upstream-bare"]);
      const releaseOid = revParse(seed, "pi-subagents-v21.7.0^{}");
      git(seed, ["checkout", "main"]);
      commit(seed, "feat: fork-only change", {
        "fork-only.txt": "from fork\n",
        "scripts/release/core-sync-state.json": `${JSON.stringify(
          {
            schemaVersion: 1,
            releases: [
              {
                forkTag: "pi-subagents-v1.0.0",
                upstream: { version: "21.7.0", commit: releaseOid },
                upstreamTip: releaseOid,
              },
            ],
            syncs: [],
          },
          null,
          2,
        )}\n`,
      });
      git(seed, ["tag", "pi-subagents-v1.0.0"]);
      git(seed, ["push", "origin-bare", "main"]);
      git(seed, ["push", "origin-bare", "refs/tags/pi-subagents-v1.0.0"]);
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

    git(scratch, ["clone", originBare, work]);
    configureRepo(work);
    return { work, originBare, upstreamBare };
  }

  return {
    scratch,
    git,
    configureRepo,
    revParse,
    parentsOf,
    gitDir,
    indexTree,
    snapshotDir,
    readGitStateFile,
    advanceUpstream,
    advanceUpstreamReleases,
    writeFiles,
    commit,
    runScript,
    recordedInvocations,
    recordedFetches,
    materializeNetwork,
    dispose() {
      rmSync(scratch, { recursive: true, force: true });
    },
  };
}

/**
 * @typedef {ReturnType<typeof createUpstreamNetwork>} UpstreamNetwork
 */
