import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const libShPath = path.join(root, "scripts/release/lib.sh");
const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

// Generic local history for metadata/scanner and ordinary prediction tests.
export function createScratchReleaseRepository() {
  const dir = mkdtempSync(path.join(tmpdir(), "release-repo-"));
  copyFileSync(path.join(root, "cliff.toml"), path.join(dir, "cliff.toml"));
  function git(...args) {
    execFileSync("git", args, { cwd: dir, env: gitEnv, stdio: "pipe" });
  }
  function gitOut(...args) {
    return execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      env: gitEnv,
      stdio: "pipe",
    }).trim();
  }
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
  function write(relative, content) {
    const file = path.join(dir, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  function commitInScope(message, file) {
    write(file, `${message}\n`);
    git("add", ".");
    git("commit", "-m", message);
  }
  function commitOutOfScope(message) {
    commitInScope(message, "docs/retro/note.md");
  }
  function bumpedVersion(tag) {
    try {
      return execFileSync(
        "bash",
        ["-c", `. '${libShPath}'; cliff_args demo; bumped_version ${tag}`],
        { cwd: dir, encoding: "utf8", env: gitEnv, stdio: "pipe" },
      );
    } catch (error) {
      throw new Error(
        `bumped_version failed — is git-cliff installed and on PATH?\n${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`,
      );
    }
  }
  function copyReleaseScripts(...names) {
    for (const name of names) {
      const destination = path.join(dir, "scripts/release", name);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(root, "scripts/release", name), destination);
    }
  }
  function writeChangelog(name, content) {
    write(`packages/${name}/CHANGELOG.md`, content);
  }
  function writeManifest(name, version) {
    write(
      `packages/${name}/package.json`,
      `${JSON.stringify({ name: `@fixture/${name}`, version }, null, 2)}\n`,
    );
  }
  function runReleaseScript(name, ...args) {
    const result = spawnSync(
      "bash",
      [path.join(dir, "scripts/release", name), ...args],
      { cwd: dir, encoding: "utf8", env: gitEnv, stdio: "pipe" },
    );
    return {
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  return {
    dir,
    git,
    gitOut,
    commitInScope,
    commitOutOfScope,
    bumpedVersion,
    copyReleaseScripts,
    writeManifest,
    writeChangelog,
    runReleaseScript,
    dispose() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
