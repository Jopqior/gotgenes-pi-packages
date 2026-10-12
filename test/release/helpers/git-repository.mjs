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

// Tag readers need only a local repository, not release configuration.
export function createTaggedReleaseRepository() {
  const dir = mkdtempSync(path.join(tmpdir(), "release-repo-"));
  function git(...args) {
    return execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      env: gitEnv,
      stdio: "pipe",
    });
  }
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
  return {
    dir,
    git,
    dispose() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Version prediction also consumes the real git-cliff configuration.
export function createScratchReleaseRepository() {
  const repo = createTaggedReleaseRepository();
  const { dir, git } = repo;
  copyFileSync(path.join(root, "cliff.toml"), path.join(dir, "cliff.toml"));
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
    ...repo,
    commitInScope,
    commitOutOfScope,
    bumpedVersion,
    copyReleaseScripts,
    writeManifest,
    runReleaseScript,
  };
}
