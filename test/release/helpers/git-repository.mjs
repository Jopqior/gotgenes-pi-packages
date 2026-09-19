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

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const libShPath = path.join(repoRoot, "scripts", "release", "lib.sh");
const cliffTomlPath = path.join(repoRoot, "cliff.toml");
const releaseScriptsDir = path.join(repoRoot, "scripts", "release");
const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

/**
 * Create an instance-owned scratch Git repository for release-script tests.
 *
 * The repository starts with the repository's real `cliff.toml` copied in and
 * git identity configured, so tests only add commits and tags. The fixture
 * owns its own process invocation helpers; there is no shared global
 * repository, so tests in one file cannot observe another file's history.
 *
 * `pkg` parameterizes the package the cliff-scoping helpers address; the
 * fixture itself does not require `packages/<pkg>/` to exist until a test
 * commits into it.
 *
 * @param {{ pkg?: string }} [options]
 * @returns {ReleaseRepositoryFixture}
 */
export function createScratchReleaseRepository(options = {}) {
  const pkg = options.pkg ?? "demo";
  const dir = mkdtempSync(path.join(tmpdir(), "release-repo-"));
  copyFileSync(cliffTomlPath, path.join(dir, "cliff.toml"));

  /**
   * Run a git command inside the scratch repo.
   *
   * @param {...string} args
   */
  function git(...args) {
    execFileSync("git", args, { cwd: dir, env: gitEnv });
  }

  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");

  /**
   * Run a git command inside the scratch repo and return its stripped stdout.
   *
   * @param {...string} args
   * @returns {string}
   */
  function gitOut(...args) {
    return execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      env: gitEnv,
    }).trim();
  }

  /**
   * Create an in-scope commit touching the given file.
   *
   * @param {string} message a Conventional Commits subject
   * @param {string} file the file to create, relative to the scratch repo
   */
  function commitInScope(message, file) {
    const filePath = path.join(dir, file);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${message}\n`);
    git("add", ".");
    git("commit", "-m", message);
  }

  /**
   * Create an out-of-scope commit the packages' path filters never match.
   *
   * @param {string} message a Conventional Commits subject
   */
  function commitOutOfScope(message) {
    commitInScope(message, path.join("docs", "retro", "note.md"));
  }

  /**
   * Build the merged-history fixture shared by the merge-boundary tests: a
   * root config commit, a fork commit, an upstream branch whose breaking
   * change predates the release, a real two-parent merge of that branch, and
   * an out-of-scope release marker commit ready to be tagged by the caller.
   *
   * This is the restored-repository shape: upstream changes arrive through
   * real merges, and a release tag can sit on a commit whose changes are
   * outside the package's path scope (the natural end of a docs-only
   * publish).
   */
  function mergedUpstreamHistory() {
    commitInScope("build: fixture config", "cliff-config-marker.txt");
    commitInScope(`fix(${pkg}): initial fork work`, `packages/${pkg}/fork.txt`);
    git("checkout", "-b", "upstream-side");
    commitInScope(
      `feat(${pkg})!: old upstream break`,
      `packages/${pkg}/old.txt`,
    );
    git("checkout", "main");
    git("merge", "--no-ff", "-m", "chore: merge upstream", "upstream-side");
    commitOutOfScope("docs: release marker");
  }

  /**
   * Commit `message` on a new upstream branch and merge it into main with a
   * real two-parent merge, returning the merged upstream tip's commit OID.
   *
   * @param {string} message a Conventional Commits subject
   * @param {string} file the file to create, relative to the scratch repo
   * @returns {string} the merged upstream tip's commit OID
   */
  function mergeNewUpstream(message, file) {
    git("checkout", "-b", "upstream-new");
    commitInScope(message, file);
    const tip = gitOut("rev-parse", "HEAD");
    git("checkout", "main");
    git(
      "merge",
      "--no-ff",
      "-m",
      "chore: merge upstream again",
      "upstream-new",
    );
    return tip;
  }

  /**
   * Spawn a bash that sources the real `lib.sh`, scopes `cliff_args` to the
   * fixture's package, and prints `bumped_version`'s output. The scratch repo
   * is the cwd, so `cliff_args`' relative path globs resolve against it.
   *
   * @param {string} tag the package's latest release tag
   * @returns {string} stdout of the helper
   */
  function bumpedVersion(tag) {
    try {
      return execFileSync(
        "bash",
        ["-c", `. '${libShPath}'; cliff_args ${pkg}; bumped_version ${tag}`],
        { cwd: dir, encoding: "utf8", env: gitEnv },
      );
    } catch (error) {
      // Fail loudly rather than skipping: CI installs git-cliff, so a local
      // failure here means this checkout cannot run the release scripts' own
      // derivation and must not report green without the pin.
      throw new Error(
        `bumped_version failed — is git-cliff installed and on PATH?\n${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`,
      );
    }
  }

  /**
   * Spawn a bash that sources the real `lib.sh`, scopes `cliff_args` to the
   * fixture's package, and runs a git-cliff rendering invocation with the
   * flags a release script passes. `prepare-release.sh` renders the section
   * it splices into a changelog with `--tag <tag> --unreleased --strip
   * header`, and `create-github-releases.sh` renders the notes for the tag at
   * HEAD with `--latest --strip header`; passing the flags through verbatim
   * exercises the scripts' real invocation shapes rather than a convenient
   * approximation.
   *
   * @param {...string} flags the literal flags the release script passes
   * @returns {string} stdout of git-cliff
   */
  function renderReleaseSection(...flags) {
    const invocation =
      ". '" +
      libShPath +
      "'; cliff_args " +
      pkg +
      // biome-ignore lint/suspicious/noTemplateCurlyInString: "${CLIFF_ARGS[@]}" is bash array expansion inside the command handed to `bash -c`, not a JS template placeholder — lib.sh owns the array.
      '; git-cliff "${CLIFF_ARGS[@]}" ' +
      flags.join(" ");
    try {
      return execFileSync("bash", ["-c", invocation], {
        cwd: dir,
        encoding: "utf8",
        env: gitEnv,
      });
    } catch (error) {
      throw new Error(
        `git-cliff rendering failed — is git-cliff installed and on PATH?\n${error.message}\nstdout: ${error.stdout}\nstderr: ${error.stderr}`,
      );
    }
  }

  /**
   * Copy the real release entry-point scripts into the scratch repo, so a
   * test can run them as processes against fixture history. The scripts
   * `cd` to their own repository root, so the copies operate on the scratch
   * repo rather than the real checkout.
   *
   * @param {...string} names file names under scripts/release/
   */
  function copyReleaseScripts(...names) {
    mkdirSync(path.join(dir, "scripts", "release"), { recursive: true });
    for (const name of names) {
      copyFileSync(
        path.join(releaseScriptsDir, name),
        path.join(dir, "scripts", "release", name),
      );
    }
  }

  /**
   * Write a minimal package manifest so `require_package` and the parity
   * tag-versus-manifest check accept the fixture package.
   *
   * @param {string} name package directory name
   * @param {string} version manifest version
   */
  function writeManifest(name, version) {
    const manifestPath = path.join(dir, "packages", name, "package.json");
    mkdirSync(path.dirname(manifestPath), { recursive: true });
    writeFileSync(
      manifestPath,
      `${JSON.stringify({ name: `@fixture/${name}`, version }, null, 2)}\n`,
    );
  }

  /**
   * Run a script from the scratch repo's own copy as a real process.
   *
   * @param {string} name file name under scripts/release/
   * @param {...string} args script arguments
   * @returns {{ status: number, stdout: string, stderr: string }}
   */
  function runReleaseScript(name, ...args) {
    const result = spawnSync(
      "bash",
      [path.join(dir, "scripts", "release", name), ...args],
      { cwd: dir, encoding: "utf8", env: gitEnv },
    );
    return {
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  /**
   * The `cliff_args` scoping arguments lib.sh computes for a package, as an
   * argv array. Sourcing the real lib.sh keeps tests in step with the
   * scripts' own scoping instead of duplicating the argument list.
   *
   * @param {string} name package directory name
   * @returns {string[]}
   */
  function cliffArgs(name) {
    const command =
      ". '" +
      libShPath +
      "'; cliff_args " +
      name +
      // biome-ignore lint/suspicious/noTemplateCurlyInString: "${CLIFF_ARGS[@]}" is bash array expansion inside the command handed to `bash -c`, not a JS template placeholder — lib.sh owns the array.
      '; printf "%s\\n" "${CLIFF_ARGS[@]}"';
    const listing = execFileSync("bash", ["-c", command], {
      cwd: dir,
      encoding: "utf8",
      env: gitEnv,
    });
    return listing.trim().split("\n");
  }

  return {
    dir,
    pkg,
    git,
    gitOut,
    commitInScope,
    commitOutOfScope,
    mergedUpstreamHistory,
    mergeNewUpstream,
    bumpedVersion,
    renderReleaseSection,
    copyReleaseScripts,
    writeManifest,
    runReleaseScript,
    cliffArgs,
    dispose() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * @typedef {ReturnType<typeof createScratchReleaseRepository>} ReleaseRepositoryFixture
 */
