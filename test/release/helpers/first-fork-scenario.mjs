import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createScratchReleaseRepository } from "./git-repository.mjs";

export const FIRST_DIRECTORY = "pi-subagents-worktrees";
export const FIRST_STATE = `scripts/release/${FIRST_DIRECTORY}/sync-state.json`;
export const FIRST_VIEW = `docs/upstream/${FIRST_DIRECTORY}-release-correspondence.md`;
export const FIRST_FILES = [
  `packages/${FIRST_DIRECTORY}/package.json`,
  `packages/${FIRST_DIRECTORY}/CHANGELOG.md`,
  FIRST_STATE,
  FIRST_VIEW,
];

// A bounded untagged bootstrap history, separate from decision-window,
// published-artifact and combined-selection fixtures.
export function createFirstForkScenario({
  upstreamName = "@gotgenes/pi-subagents-worktrees",
  tail = false,
} = {}) {
  const repo = createScratchReleaseRepository({ pkg: FIRST_DIRECTORY });
  const external = mkdtempSync(path.join(tmpdir(), "first-fork-"));
  const bare = path.join(external, "upstream.git");
  const output = path.join(external, "candidate");
  const notes = path.join(external, "notes.md");
  const bin = path.join(external, "bin");
  mkdirSync(bin);
  function write(relative, text) {
    const file = path.join(repo.dir, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  function commit(message) {
    repo.git("add", "-A");
    repo.git("commit", "-m", message);
    return repo.gitOut("rev-parse", "HEAD");
  }
  repo.commitOutOfScope("docs: bootstrap root");
  repo.git("checkout", "-b", "upstream-line");
  write(
    `packages/${FIRST_DIRECTORY}/package.json`,
    JSON.stringify({ name: upstreamName, version: "0.3.3" }),
  );
  write(`packages/${FIRST_DIRECTORY}/source.txt`, "upstream source\n");
  const release = commit("feat(pi-subagents-worktrees): upstream release");
  repo.git("tag", "-a", `${FIRST_DIRECTORY}-v0.3.3`, "-m", "upstream release");
  if (tail)
    repo.commitInScope(
      "fix(pi-subagents-worktrees): unreleased tail",
      `packages/${FIRST_DIRECTORY}/tail.txt`,
    );
  else repo.commitOutOfScope("docs: upstream non-package tail");
  const tip = repo.gitOut("rev-parse", "HEAD");
  execFileSync("git", ["clone", "--bare", repo.dir, bare]);
  repo.git("tag", "-d", `${FIRST_DIRECTORY}-v0.3.3`);
  repo.git("checkout", "main");
  repo.git(
    "merge",
    "--no-ff",
    "-m",
    "chore: incorporate released upstream",
    "upstream-line",
  );
  const merge = repo.gitOut("rev-parse", "HEAD");
  repo.git("update-ref", "refs/remotes/upstream/main", tip);
  repo.git(
    "remote",
    "add",
    "upstream",
    "https://github.com/gotgenes/pi-packages.git",
  );
  repo.git(
    "config",
    `url.${bare}.insteadOf`,
    "https://github.com/gotgenes/pi-packages.git",
  );
  repo.copyReleaseScripts(
    "lib.sh",
    "next-version.sh",
    "publish-released.sh",
    "create-github-releases.sh",
    "fork-sync.mjs",
    "fork-sync-targets.mjs",
    "pi-subagents/config.mjs",
    "pi-subagents-worktrees/config.mjs",
    "fork-sync/values.mjs",
    "fork-sync/state.mjs",
    "fork-sync/evidence.mjs",
    "fork-sync/cliff.mjs",
    "fork-sync/decision.mjs",
    "release-correspondence.mjs",
    "correspondence-table.mjs",
    "release-artifacts.mjs",
  );
  const registration = {
    directory: FIRST_DIRECTORY,
    name: "@jopqior/pi-subagents-worktrees",
    kind: "fork",
    upstream: {
      name: "@gotgenes/pi-subagents-worktrees",
      repository: "gotgenes/pi-packages",
      directory: `packages/${FIRST_DIRECTORY}`,
    },
    evidence: "fork-sync",
  };
  const registry = { schemaVersion: 2, packages: [registration] };
  write("scripts/release/release-packages.json", JSON.stringify(registry));
  const manifest = {
    name: registration.name,
    version: "0.3.3",
    description: "preserve me",
    dependencies: { "@jopqior/pi-subagents": "^5.0.0" },
    custom: { nested: [1, "two"] },
  };
  write(FIRST_FILES[0], `${JSON.stringify(manifest, null, 2)}\n`);
  const inherited = Buffer.from(
    "# Changelog\r\n\r\nRestored release-please disclosure.\r\n\r\n## [0.3.3](https://github.com/gotgenes/pi-packages/releases/tag/pi-subagents-worktrees-v0.3.3)\r\n\r\n- inherited bytes \r\n",
  );
  write(FIRST_FILES[1], inherited);
  write(FIRST_STATE, '{ "schemaVersion": 2, "releases": [], "syncs": [] }\n');
  write(
    FIRST_VIEW,
    "# Worktrees fork\n\nThis fork is unreleased.\n\n<!-- release-correspondence:start -->\n\nNo release yet.\n\n<!-- release-correspondence:end -->\n",
  );
  write(
    "scripts/release/pi-subagents/sync-state.json",
    "unselected core state bytes\n",
  );
  write(
    "docs/upstream/pi-subagents-release-correspondence.md",
    "unselected core view bytes\n",
  );
  write(
    "packages/pi-subagents/package.json",
    '{"name":"@jopqior/pi-subagents","version":"5.0.0"}\n',
  );
  write("packages/pi-subagents/CHANGELOG.md", "unselected core changelog\n");
  commit("chore: migrate and register actual fork manifest");
  writeFileSync(notes, "### Features\n\n- Reviewed migration to fork core.\n");
  const git = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const wrapper = path.join(bin, "git");
  writeFileSync(
    wrapper,
    `#!/usr/bin/env bash\nif [[ "$1" == remote && "$2" == get-url ]]; then\n  remote="\${!#}"\n  ${JSON.stringify(git)} config --get-all "remote.$remote.url"\n  exit\nfi\nif [[ "$1" == ls-remote && "$2" == --tags ]]; then\n  printf '%s\\n' "$*" >> "$QUERY_LOG"\n  if [[ -n "$DRIFT_TAG" ]]; then ${JSON.stringify(git)} tag -f "$DRIFT_TAG" HEAD >/dev/null; fi\n  if [[ "$QUERY_FAIL" == 1 ]]; then echo "injected query failure" >&2; exit 1; fi\n  if [[ "$MISSING_OBJECT" == 1 ]]; then printf '1111111111111111111111111111111111111111\\trefs/tags/${FIRST_DIRECTORY}-v0.3.3\\n'; exit; fi\n  exec ${JSON.stringify(git)} ls-remote --tags "$UPSTREAM_BARE" "$4"\nfi\nexec ${JSON.stringify(git)} "$@"\n`,
  );
  chmodSync(wrapper, 0o755);
  const queryLog = path.join(external, "queries");
  writeFileSync(queryLog, "");
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    QUERY_LOG: queryLog,
    UPSTREAM_BARE: bare,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
  };
  function run(overrides = {}, extraEnv = {}, extra = []) {
    const options = {
      repo: repo.dir,
      package: FIRST_DIRECTORY,
      version: "0.1.0",
      merge,
      notes,
      output,
      ...overrides,
    };
    const args = Object.entries(options).flatMap(([name, value]) =>
      value === null ? [] : [`--${name}`, value],
    );
    return spawnSync(
      "node",
      [
        path.resolve("scripts/release/prepare-first-fork-release.mjs"),
        ...args,
        ...extra,
      ],
      { cwd: repo.dir, env: { ...env, ...extraEnv }, encoding: "utf8" },
    );
  }
  function snapshot() {
    const tracked = repo.gitOut("ls-files", "-z").split("\0").filter(Boolean);
    return {
      head: repo.gitOut("rev-parse", "HEAD"),
      index: readFileSync(path.join(repo.dir, ".git/index")),
      status: repo.gitOut("status", "--porcelain=v1", "--untracked-files=all"),
      refs: repo.gitOut("for-each-ref", "--format=%(refname) %(objectname)"),
      remoteRefs: execFileSync(
        "git",
        [
          "--git-dir",
          bare,
          "for-each-ref",
          "--format=%(refname) %(objectname)",
        ],
        { encoding: "utf8" },
      ),
      bytes: Object.fromEntries(
        tracked.map((file) => [
          file,
          existsSync(path.join(repo.dir, file))
            ? readFileSync(path.join(repo.dir, file))
            : null,
        ]),
      ),
    };
  }
  return {
    repo,
    external,
    bare,
    output,
    notes,
    bin,
    env,
    queryLog,
    merge,
    release,
    tip,
    registry,
    manifest,
    inherited,
    write,
    commit,
    run,
    snapshot,
    dispose() {
      repo.dispose();
      rmSync(external, { recursive: true, force: true });
    },
  };
}
