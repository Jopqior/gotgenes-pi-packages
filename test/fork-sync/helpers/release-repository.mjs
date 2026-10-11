import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createSourceRepository, sourceUrl } from "./source-repository.mjs";

const root = process.cwd();
const upstream = (directory) => ({
  name: `@gotgenes/${directory}`,
  repository: "gotgenes/pi-packages",
  directory: `packages/${directory}`,
});
export const core = "pi-subagents";
export const worktrees = "pi-subagents-worktrees";
export const original = "demo";
export const oldSuffix =
  "## [1.0.0](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/pi-subagents-v1.0.0) (2026-01-01)\r\n\r\n- old bytes  \r\n\r\n\r\n";

// A real independent source graph plus process-boundary interception only.
export function createReleaseRepository() {
  const repo = createSourceRepository(upstream(core));
  const { fork, git, write } = repo;
  const file = (relative) => path.join(fork, relative);
  const read = (relative) => readFileSync(file(relative), "utf8");
  const secondManifest = JSON.stringify({
    name: upstream(worktrees).name,
    version: "2.0.0",
  });
  repo.commit(
    repo.upstream,
    `packages/${worktrees}/package.json`,
    secondManifest,
  );
  git(repo.upstream, "tag", `${worktrees}-v2.0.0`);
  repo.commit(
    repo.upstream,
    `packages/${core}/old-break.txt`,
    "old break\n",
    "feat!: old upstream break",
  );
  const stable = repo.release("1.1.0", { annotated: true });
  const tip = repo.commit(
    repo.upstream,
    `packages/${core}/tail.txt`,
    "tail\n",
    "fix: upstream tail",
  );
  repo.integrate(tip);
  const registrations = [core, worktrees].map((directory) => ({
    directory,
    name: `@jopqior/${directory}`,
    kind: "fork",
    upstream: upstream(directory),
  }));
  registrations.push({
    directory: original,
    name: "@fixture/demo",
    kind: "original",
  });
  write(
    fork,
    "scripts/release/release-packages.json",
    JSON.stringify({ schemaVersion: 3, packages: registrations }),
  );
  for (const directory of [core, worktrees, original]) {
    write(
      fork,
      `packages/${directory}/package.json`,
      JSON.stringify({
        name:
          directory === original ? "@fixture/demo" : `@jopqior/${directory}`,
        version: "1.0.0",
      }),
    );
    write(
      fork,
      `packages/${directory}/CHANGELOG.md`,
      `# Changelog\n\n${oldSuffix.replaceAll(core, directory)}`,
    );
  }
  copyFileSync(path.join(root, "cliff.toml"), file("cliff.toml"));
  for (const name of [
    "lib.sh",
    "next-version.sh",
    "verify-cliff-parity.sh",
    "prepare-release.sh",
    "publish-released.sh",
    "create-github-releases.sh",
    "release-artifacts.mjs",
    "release-metadata.mjs",
  ])
    copyFileSync(
      path.join(root, "scripts/release", name),
      file(`scripts/release/${name}`),
    );
  mkdirSync(file("scripts/fork-sync"));
  copyFileSync(
    path.join(root, "scripts/fork-sync/source.mjs"),
    file("scripts/fork-sync/source.mjs"),
  );
  git(fork, "add", "-A");
  git(fork, "commit", "-m", "chore: release scaffold");
  repo.commit(
    fork,
    "docs/retro/release-marker.txt",
    "excluded tag marker\n",
    "docs: release marker",
  );
  for (const directory of [core, worktrees, original])
    git(fork, "tag", `${directory}-v1.0.0`);
  for (const directory of [core, worktrees, original])
    repo.commit(
      fork,
      `packages/${directory}/fork.txt`,
      "fork fix\n",
      "fix: ordinary fork change",
    );

  const bin = path.join(repo.dir, "bin");
  const bodies = path.join(repo.dir, "bodies");
  const prepared = path.join(repo.dir, "prepared");
  const calls = path.join(repo.dir, "calls");
  mkdirSync(bin);
  mkdirSync(bodies);
  mkdirSync(prepared);
  writeFileSync(calls, "");
  const realGit = execFileSync("which", ["git"], {
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
  const realNode = process.execPath;
  function executable(name, text) {
    writeFileSync(path.join(bin, name), text);
    chmodSync(path.join(bin, name), 0o755);
  }
  executable(
    "git",
    `#!/usr/bin/env bash\nset -euo pipefail\nprintf 'git %s\\n' "$*" >> "$CALLS"\nif [ "\${1:-}" = push ]; then exit 0; fi\nif [ "\${OFFLINE:-}" = 1 ] && [[ "$*" = *'${sourceUrl}'* ]]; then echo 'source reselected downstream' >&2; exit 97; fi\na=()\nfor v in "$@"; do if [ "$v" = '${sourceUrl}' ]; then v="$LOCAL_UPSTREAM"; fi; a+=("$v"); done\nexec '${realGit}' "\${a[@]}"\n`,
  );
  executable(
    "node",
    `#!/usr/bin/env bash\nset -euo pipefail\n'${realNode}' "$@"\nif [ "\${1:-}" = scripts/release/release-artifacts.mjs ] && [ "\${2:-}" = prepare ]; then cp "$4"/section-* "$PREPARED/"; fi\n`,
  );
  executable(
    "pnpm",
    '#!/usr/bin/env bash\nprintf "pnpm %s\\n" "$*" >> "$CALLS"\n',
  );
  executable(
    "gh",
    '#!/usr/bin/env bash\nprintf "gh %s\\n" "$*" >> "$CALLS"\ntag="$3"\nif [ "$2" = view ]; then\n if [ -f "$BODIES/$tag" ]; then cat "$BODIES/$tag"; else echo "release not found" >&2; exit 1; fi\nelif [ "$2" = create ]; then\n while [ "$#" -gt 0 ]; do if [ "$1" = --notes-file ]; then cp "$2" "$BODIES/$tag"; break; fi; shift; done\nfi\n',
  );
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    PATH: `${bin}:${process.env.PATH}`,
    CALLS: calls,
    BODIES: bodies,
    PREPARED: prepared,
    LOCAL_UPSTREAM: repo.bare,
    GH_TOKEN: "test",
    ALLOW_LOCAL_PUSH: "1",
  };
  function run(script, extra = {}, ...args) {
    return spawnSync("bash", [file(`scripts/release/${script}`), ...args], {
      cwd: fork,
      env: { ...env, ...extra },
      encoding: "utf8",
      stdio: "pipe",
    });
  }
  function commitAll(message = "test: fixture change") {
    git(fork, "add", "-A");
    git(fork, "commit", "-m", message);
  }
  function retag() {
    for (const directory of [core, worktrees, original])
      git(fork, "tag", "-f", `${directory}-v1.0.1`);
  }
  return {
    ...repo,
    stable,
    tip,
    file,
    read,
    write: (relative, bytes) => write(fork, relative, bytes),
    registrations,
    run,
    commitAll,
    retag,
    prepare: (...directories) =>
      run("prepare-release.sh", { PACKAGES: directories.join(" ") }),
    calls: () => readFileSync(calls, "utf8"),
    clearCalls: () => writeFileSync(calls, ""),
    bodies,
    prepared,
  };
}
