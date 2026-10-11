import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const sourceUrl = "https://github.com/gotgenes/pi-packages.git";

// Independent upstream worktree and fork clone: upstream never descends from a fork commit.
export function createSourceRepository() {
  const dir = mkdtempSync(path.join(tmpdir(), "fork-source-test-"));
  const upstream = path.join(dir, "upstream");
  const bare = path.join(dir, "upstream.git");
  const fork = path.join(dir, "fork");
  const upstreamPackage = {
    repository: "gotgenes/pi-packages",
    directory: "packages/alternate",
    name: "@upstream/alternate",
  };
  function git(cwd, ...args) {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C", GIT_TERMINAL_PROMPT: "0" },
    });
    if (result.error || result.status !== 0)
      throw new Error(
        `git ${args.join(" ")} in ${cwd}: status ${result.status}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
        { cause: result.error },
      );
    return result.stdout.trim();
  }
  function write(cwd, file, bytes) {
    const filename = path.join(cwd, file);
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, bytes);
  }
  function commit(cwd, file, bytes, message = "test: change") {
    write(cwd, file, bytes);
    git(cwd, "add", "--", file);
    git(cwd, "commit", "-m", message);
    return git(cwd, "rev-parse", "HEAD");
  }
  const manifest = (version, name = upstreamPackage.name) =>
    `${JSON.stringify({ name, version })}\n`;
  mkdirSync(upstream);
  git(upstream, "init", "-b", "main");
  git(upstream, "config", "user.name", "Source Test");
  git(upstream, "config", "user.email", "source@example.invalid");
  const baseline = commit(
    upstream,
    "packages/alternate/package.json",
    manifest("1.0.0"),
  );
  git(upstream, "tag", "alternate-v1.0.0");
  git(dir, "init", "--bare", "--initial-branch=main", bare);
  git(upstream, "remote", "add", "local", bare);
  function publish() {
    git(upstream, "push", "local", "main", "refs/tags/*:refs/tags/*");
  }
  publish();
  git(dir, "clone", "--no-tags", bare, fork);
  git(fork, "config", "user.name", "Source Test");
  git(fork, "config", "user.email", "source@example.invalid");
  git(fork, "remote", "rename", "origin", "upstream");
  git(
    fork,
    "remote",
    "set-url",
    "upstream",
    "https://example.invalid/untrusted",
  );
  const forkStart = commit(fork, "fork-marker", "fork\n");
  function fetch() {
    git(
      fork,
      "fetch",
      "--no-tags",
      bare,
      "refs/heads/main:refs/remotes/upstream/main",
    );
  }
  function integrate(tip = git(upstream, "rev-parse", "HEAD")) {
    publish();
    fetch();
    git(fork, "merge", "--no-ff", "-m", "test: incorporate upstream", tip);
    return git(fork, "rev-parse", "HEAD");
  }
  function release(version, options = {}) {
    const oid = commit(
      upstream,
      "packages/alternate/package.json",
      manifest(version, options.name),
    );
    git(
      upstream,
      "tag",
      ...(options.annotated ? ["-a", "-m", "release"] : []),
      `alternate-v${options.tagVersion ?? version}`,
    );
    return oid;
  }
  function mergeCommit(
    cwd,
    parents,
    tree = git(cwd, "rev-parse", "HEAD^{tree}"),
  ) {
    const oid = git(
      cwd,
      "commit-tree",
      tree,
      ...parents.flatMap((parent) => ["-p", parent]),
      "-m",
      "test: topology",
    );
    git(cwd, "update-ref", "refs/heads/main", oid);
    return oid;
  }
  function snapshot() {
    function files(directory = fork, prefix = "") {
      return readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.name !== ".git")
        .flatMap((entry) => {
          const relative = `${prefix}${entry.name}`;
          const filename = path.join(directory, entry.name);
          return entry.isDirectory()
            ? files(filename, `${relative}/`)
            : [[relative, readFileSync(filename)]];
        });
    }
    return {
      refs: git(fork, "show-ref"),
      config: git(fork, "config", "--local", "--list"),
      head: git(fork, "rev-parse", "HEAD"),
      status: git(fork, "status", "--porcelain"),
      tags: git(
        fork,
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      ),
      files: Object.fromEntries(files()),
    };
  }
  return {
    dir,
    upstream,
    bare,
    fork,
    upstreamPackage,
    baseline,
    forkStart,
    git,
    write,
    commit,
    manifest,
    publish,
    fetch,
    integrate,
    release,
    mergeCommit,
    snapshot,
    dispose() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Tests mock only spawnSync's external boundary; redirected Git still runs against a real bare repository.
export function installSourceTransport(repo, mockedSpawn, actualSpawn) {
  const transport = { calls: [], failure: undefined };
  mockedSpawn.mockImplementation((command, args, options) => {
    transport.calls.push({ command, args: [...args], cwd: options.cwd });
    const failure = transport.failure?.(args, options);
    if (failure)
      return { status: 128, stdout: "", stderr: `fatal: ${failure}\n` };
    const result = actualSpawn(
      command,
      args.map((arg) => (arg === sourceUrl ? repo.bare : arg)),
      options,
    );
    transport.observe?.(args, options, result);
    return result;
  });
  return transport;
}
