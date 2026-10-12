import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  renderUpstreamSource,
  resolveUpstreamSource,
  validateUpstreamSource,
} from "../../scripts/fork-sync/source.mjs";
import {
  createSourceRepository,
  installSourceTransport,
  sourceUrl,
} from "./helpers/source-repository.mjs";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, spawnSync: vi.fn(actual.spawnSync) };
});
const actual = await vi.importActual("node:child_process");
let repo;
let transport;
const upstream = {
  repository: "gotgenes/pi-packages",
  directory: "packages/alternate",
  name: "@upstream/alternate",
};
function resolve(at = "HEAD", fork = repo.fork) {
  return resolveUpstreamSource({
    repo: fork,
    at,
    upstream: repo.upstreamPackage,
  });
}
function expected(
  releaseCommit,
  incorporatedCommit,
  upstreamVersion = "1.1.0",
  unreleasedPackageChanges = false,
) {
  return {
    upstreamPackage: "@upstream/alternate",
    upstreamVersion,
    releaseCommit,
    incorporatedCommit,
    unreleasedPackageChanges,
  };
}
function block(source) {
  return renderUpstreamSource({ source, upstream });
}

describe("resolveUpstreamSource", () => {
  beforeEach(() => {
    spawnSync.mockImplementation(actual.spawnSync);
    repo = createSourceRepository();
    transport = installSourceTransport(repo, spawnSync, actual.spawnSync);
  });
  afterEach(() => {
    const stores = transport.calls
      .filter(
        (call) => call.args[0] === "clone" && call.args.includes("--shared"),
      )
      .map((call) => call.args.at(-1));
    for (const store of stores) expect(existsSync(store)).toBe(false);
    spawnSync.mockImplementation(actual.spawnSync);
    repo.dispose();
  });
  describe("source selection", () => {
    it.each([false, true])(
      "resolves annotated=%s stable tags with no live fork changes or GitHub Release query",
      (annotated) => {
        const release = repo.release("1.1.0", { annotated });
        repo.integrate();
        repo.git(repo.fork, "tag", "alternate-v1.1.0", repo.forkStart);
        repo.write(repo.fork, "fork-marker", "dirty bytes");
        repo.write(repo.fork, "untracked.bin", Buffer.from([0, 255, 13]));
        const before = repo.snapshot();
        let temporaryTags;
        transport.observe = (args, options) => {
          if (args[0] === "ls-remote")
            temporaryTags = actual.spawnSync(
              "git",
              [
                "for-each-ref",
                "--format=%(refname) %(objectname)",
                "refs/tags",
              ],
              { cwd: options.cwd, encoding: "utf8" },
            ).stdout;
        };
        transport.calls = [];
        expect(resolve()).toEqual(expected(release, release));
        expect(temporaryTags).toBe("");
        expect(repo.snapshot()).toEqual(before);
        expect(transport.calls.every((call) => call.command === "git")).toBe(
          true,
        );
        const clones = transport.calls.filter(
          (call) => call.args[0] === "clone",
        );
        expect(clones).toHaveLength(1);
        expect(clones[0].args).toEqual([
          "clone",
          "--bare",
          "--shared",
          "--no-tags",
          repo.fork,
          clones[0].args.at(-1),
        ]);
        const store = clones[0].args.at(-1);
        const fetches = transport.calls.filter(
          (call) => call.args[0] === "fetch",
        );
        expect(fetches).toHaveLength(1);
        expect(fetches[0].cwd).toBe(store);
        expect(fetches[0].args).toEqual([
          "fetch",
          "--no-tags",
          "--no-write-fetch-head",
          sourceUrl,
          "+refs/heads/main:refs/fork-sync/upstream-main",
        ]);
        expect(
          transport.calls.some(
            (call) => call.args[0] === "merge-base" && call.cwd === store,
          ),
        ).toBe(true);
        expect(
          transport.calls.some(
            (call) =>
              call.args[0] === "ls-remote" && call.args.includes(sourceUrl),
          ),
        ).toBe(true);
      },
    );
    it("chooses numerically highest contained stable release over prereleases, malformed tags and newer advertised tags", () => {
      repo.release("1.9.0");
      repo.release("90.0.0-rc.1");
      const release = repo.release("1.10.0");
      repo.git(repo.upstream, "tag", "alternate-v01.90.0");
      repo.integrate();
      repo.release("99.0.0");
      repo.publish();
      expect(resolve()).toEqual(expected(release, release, "1.10.0"));
    });
    it("selects the latest of multiple integrations and honors explicit at", () => {
      const firstRelease = repo.release("1.1.0");
      const first = repo.integrate();
      const secondRelease = repo.release("1.2.0");
      repo.integrate();
      expect(resolve()).toEqual(
        expected(secondRelease, secondRelease, "1.2.0"),
      );
      expect(resolve(first)).toEqual(expected(firstRelease, firstRelease));
    });
    it("excludes a source reachable only through a fork feature merge", () => {
      const release = repo.release("1.1.0");
      repo.integrate();
      repo.git(repo.fork, "checkout", "-b", "side");
      repo.commit(repo.fork, "side", "feature");
      repo.release("1.2.0");
      const side = repo.integrate();
      repo.git(repo.fork, "checkout", "main");
      repo.commit(repo.fork, "main", "feature");
      repo.mergeCommit(repo.fork, [
        repo.git(repo.fork, "rev-parse", "HEAD"),
        side,
      ]);
      expect(resolve()).toEqual(expected(release, release));
    });
    it("ignores inherited upstream-only merges and ordinary fork-only merges", () => {
      repo.git(repo.upstream, "checkout", "-b", "upstream-side");
      repo.commit(repo.upstream, "side", "side");
      repo.git(repo.upstream, "checkout", "main");
      repo.commit(repo.upstream, "main", "main");
      repo.git(
        repo.upstream,
        "merge",
        "--no-ff",
        "-m",
        "test: upstream merge",
        "upstream-side",
      );
      const tip = repo.git(repo.upstream, "rev-parse", "HEAD");
      repo.integrate();
      repo.git(repo.fork, "checkout", "-b", "feature");
      const feature = repo.commit(repo.fork, "feature", "feature");
      repo.git(repo.fork, "checkout", "main");
      repo.commit(repo.fork, "fork-main", "fork");
      repo.git(
        repo.fork,
        "merge",
        "--no-ff",
        "-m",
        "test: fork feature",
        feature,
      );
      expect(resolve()).toEqual(expected(repo.baseline, tip, "1.0.0"));
      expect(() => resolve(tip)).toThrow(/integration/);
    });
    it("rejects a fork with no eligible integration rather than guessing", () => {
      expect(() => resolve()).toThrow(/integration/);
    });
    it("uses fresh upstream main instead of trusting a stale or absent tracking ref", () => {
      const release = repo.release("1.1.0");
      repo.integrate();
      repo.git(
        repo.fork,
        "update-ref",
        "refs/remotes/upstream/main",
        repo.baseline,
      );
      expect(resolve()).toEqual(expected(release, release));
      repo.git(repo.fork, "update-ref", "-d", "refs/remotes/upstream/main");
      expect(resolve()).toEqual(expected(release, release));
    });
    it("refuses rewritten upstream main without cached refs instead of falling back to an older source", () => {
      const first = repo.release("1.1.0");
      repo.integrate();
      repo.release("1.2.0");
      repo.integrate();
      repo.git(repo.bare, "update-ref", "refs/heads/main", first);
      repo.git(repo.fork, "update-ref", "-d", "refs/remotes/upstream/main");
      expect(() => resolve()).toThrow(/ambiguous.*origin/);
    });
    it("refuses an ambiguous feature branch whose only shared ancestry is upstream", () => {
      repo.integrate(repo.release("1.1.0"));
      repo.git(repo.upstream, "checkout", "-b", "ambiguous", repo.baseline);
      const side = repo.commit(repo.upstream, "ambiguous-feature", "feature");
      repo.git(repo.upstream, "push", "local", "ambiguous");
      repo.git(
        repo.fork,
        "fetch",
        "--no-tags",
        repo.bare,
        "refs/heads/ambiguous:refs/remotes/local/ambiguous",
      );
      repo.mergeCommit(repo.fork, [
        repo.git(repo.fork, "rev-parse", "HEAD"),
        side,
      ]);
      expect(() => resolve()).toThrow(/ambiguous.*origin/);
    });
    it("does not let older ambiguous feature history replace a newer proven integration", () => {
      repo.integrate(repo.release("1.1.0"));
      repo.git(repo.upstream, "checkout", "-b", "ambiguous", repo.baseline);
      const side = repo.commit(repo.upstream, "ambiguous-feature", "feature");
      repo.git(repo.upstream, "push", "local", "ambiguous");
      repo.git(
        repo.fork,
        "fetch",
        "--no-tags",
        repo.bare,
        "refs/heads/ambiguous:refs/remotes/local/ambiguous",
      );
      repo.mergeCommit(repo.fork, [
        repo.git(repo.fork, "rev-parse", "HEAD"),
        side,
      ]);
      repo.git(repo.upstream, "checkout", "main");
      const release = repo.release("1.2.0");
      repo.integrate();
      expect(resolve()).toEqual(expected(release, release, "1.2.0"));
    });
    it.each(["wrong-order", "both-upstream", "octopus"])(
      "rejects ambiguous %s upstream-carrying topology",
      (kind) => {
        const tip = repo.release("1.1.0");
        repo.publish();
        repo.fetch();
        const parents =
          kind === "wrong-order"
            ? [tip, repo.forkStart]
            : kind === "both-upstream"
              ? [repo.baseline, tip]
              : [repo.forkStart, tip, repo.baseline];
        repo.mergeCommit(repo.fork, parents);
        expect(() => resolve()).toThrow(/topology|parent|octopus/);
      },
    );
    it.each(["regressive", "incomparable"])(
      "rejects %s integration ordering",
      (kind) => {
        const firstTip = repo.release("1.1.0");
        repo.integrate();
        let tip = repo.baseline;
        if (kind === "incomparable") {
          repo.git(repo.upstream, "checkout", "-b", "other", repo.baseline);
          tip = repo.commit(repo.upstream, "other", "branch");
          repo.git(repo.upstream, "checkout", "main");
          repo.git(
            repo.upstream,
            "merge",
            "--no-ff",
            "-m",
            "test: upstream branches",
            "other",
          );
        }
        repo.publish();
        repo.fetch();
        repo.mergeCommit(repo.fork, [
          repo.git(repo.fork, "rev-parse", "HEAD"),
          tip,
        ]);
        expect(() => resolve()).toThrow(/regressive|incomparable|ordering/);
        expect(firstTip).not.toBe(tip);
      },
    );
  });
  describe("required evidence and acquisition", () => {
    it.each(["name", "version", "malformed", "missing"])(
      "rejects the highest contained tag's %s manifest without older fallback",
      (kind) => {
        if (kind === "missing")
          repo.git(repo.upstream, "rm", "packages/alternate/package.json");
        else
          repo.write(
            repo.upstream,
            "packages/alternate/package.json",
            kind === "malformed"
              ? "{"
              : repo.manifest(
                  kind === "version" ? "1.0.0" : "1.1.0",
                  kind === "name" ? "@wrong/package" : undefined,
                ),
          );
        repo.git(repo.upstream, "add", "-A");
        repo.git(
          repo.upstream,
          "commit",
          "--allow-empty",
          "-m",
          "test: bad manifest",
        );
        repo.git(repo.upstream, "tag", "alternate-v1.1.0");
        repo.integrate();
        expect(() => resolve()).toThrow(/manifest/);
      },
    );
    it("rejects a selected integration without a contained stable tag", () => {
      repo.integrate(repo.release("2.0.0-rc.1"));
      repo.git(repo.upstream, "push", "local", ":refs/tags/alternate-v1.0.0");
      expect(() => resolve()).toThrow(/stable/);
    });
    it("rejects shallow history instead of reconstructing incomplete fork evidence", () => {
      repo.integrate(repo.release("1.1.0"));
      const shallow = path.join(repo.dir, "shallow");
      repo.git(
        repo.dir,
        "clone",
        "--no-tags",
        "--depth=2",
        `file://${repo.fork}`,
        shallow,
      );
      expect(() => resolve("HEAD", shallow)).toThrow(/shallow/);
    });
    it("rejects partial history", () => {
      repo.git(repo.fork, "config", "remote.upstream.promisor", "true");
      expect(() => resolve()).toThrow(/partial/);
    });
    it.each(["clone", "fetch", "ls-remote"])(
      "cleans temporary resources after unavailable %s",
      (command) => {
        repo.integrate(repo.release("1.1.0"));
        const before = repo.snapshot();
        transport.failure = (args) =>
          args[0] === command ? "transport unavailable" : undefined;
        expect(() => resolve()).toThrow(/transport unavailable/);
        expect(repo.snapshot()).toEqual(before);
      },
    );
    it("does not convert ancestry inspection exit 128 into false containment", () => {
      repo.integrate(repo.release("1.1.0"));
      transport.failure = (args) =>
        args[0] === "merge-base" ? "ancestry inspection broken" : undefined;
      expect(() => resolve()).toThrow(/ancestry inspection broken/);
    });
    it("rejects unavailable required history instead of falling back to an older release", () => {
      repo.integrate(repo.release("1.1.0"));
      transport.failure = (args) =>
        args[0] === "rev-list" && args.length === 2
          ? "required history unavailable"
          : undefined;
      expect(() => resolve()).toThrow(/required history unavailable/);
    });
    it("rejects unavailable required manifest objects with subprocess diagnostics", () => {
      repo.integrate(repo.release("1.1.0"));
      transport.failure = (args) =>
        args[0] === "show" ? "object unavailable" : undefined;
      expect(() => resolve()).toThrow(/object unavailable/);
    });
  });
});

describe("new source block inputs", () => {
  const release = "a".repeat(40);
  const tip = "b".repeat(40);
  const source = expected(release, tip, "1.1.0", true);
  beforeEach(() => {
    spawnSync.mockClear();
  });
  afterEach(() => expect(spawnSync).not.toHaveBeenCalled());

  it("renders distinct fixed release and incorporated links with the package tail", () => {
    const text = block(source);
    expect(text).toContain(
      `Stable release source: [fixed upstream release commit](${sourceUrl.slice(0, -4)}/blob/${release}/packages/alternate)`,
    );
    expect(text).toContain(
      `Incorporated source: [fixed incorporated upstream commit](${sourceUrl.slice(0, -4)}/blob/${tip}/packages/alternate)`,
    );
    expect(text).toContain("Includes unreleased changes to this package.");
  });
  it("omits the tail paragraph when absent and emits no original-package block", () => {
    expect(block(expected(release, release))).not.toContain(
      "Includes unreleased changes",
    );
    expect(renderUpstreamSource({ source: null })).toBe("");
    expect(
      validateUpstreamSource({ text: "## original\n- change", upstream: null }),
    ).toBeNull();
    expect(() =>
      validateUpstreamSource({ text: block(source), upstream: null }),
    ).toThrow(/original/);
  });
  it.each(["missing", "duplicate", "name", "legacy"])(
    "rejects %s before reading Git history",
    (kind) => {
      let text = block(source);
      if (kind === "missing") text = "no block";
      if (kind === "duplicate") text += `\n${text}`;
      if (kind === "name")
        text = text.replace("@upstream/alternate", "@wrong/package");
      if (kind === "legacy")
        text =
          "<!-- upstream-correspondence:start -->\n### Upstream correspondence\nUpstream version: `1.1.0`\n<!-- upstream-correspondence:end -->";
      expect(() => validateUpstreamSource({ upstream, text })).toThrow(
        /source|block/,
      );
    },
  );
});

describe("new source block local history", () => {
  let directory;
  let root;
  let release;
  let tip;
  function git(...args) {
    const result = actual.spawnSync("git", args, {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    if (result.error || result.status !== 0)
      throw new Error(`git ${args.join(" ")}: ${result.stderr}`, {
        cause: result.error,
      });
    return result.stdout.trim();
  }
  function commit(file, bytes) {
    const filename = path.join(directory, file);
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, bytes);
    git("add", "--", file);
    git("commit", "-m", "test: local source history");
    return git("rev-parse", "HEAD");
  }
  function validate(text) {
    return validateUpstreamSource({
      repo: directory,
      at: "HEAD",
      upstream,
      text,
    });
  }
  beforeEach(() => {
    spawnSync.mockImplementation(actual.spawnSync);
    directory = mkdtempSync(path.join(tmpdir(), "fork-source-local-"));
    git("init", "-b", "main");
    git("config", "user.name", "Source Test");
    git("config", "user.email", "source@example.invalid");
    root = commit("README.md", "root\n");
    release = commit(
      "packages/alternate/package.json",
      JSON.stringify({ name: upstream.name, version: "1.1.0" }),
    );
    tip = commit("packages/alternate/runtime.mjs", "tail\n");
    // Branch before the claimed evidence: it must arrive through the merge's second parent.
    git("checkout", "-b", "fork", root);
    commit("fork-marker", "fork\n");
    git("merge", "--no-ff", "-m", "test: incorporate upstream", tip);
    spawnSync.mockClear();
  });
  afterEach(() => {
    expect(
      spawnSync.mock.calls.every(
        ([command, args]) =>
          command === "git" &&
          !["fetch", "ls-remote", "clone"].includes(args[0]),
      ),
    ).toBe(true);
    rmSync(directory, { recursive: true, force: true });
  });

  it("verifies a source claim using only local ancestry and manifest objects", () => {
    const source = expected(release, tip, "1.1.0", true);
    expect(validate(`## release\n\n${block(source)}\n\n- change`)).toEqual(
      source,
    );
  });
  it("rejects a stale prior integration claim after a newer upstream integration", () => {
    const previous = block(expected(release, tip, "1.1.0", true));
    git("checkout", "main");
    const next = commit(
      "packages/alternate/package.json",
      JSON.stringify({ name: upstream.name, version: "1.2.0" }),
    );
    git("checkout", "fork");
    git("merge", "--no-ff", "-m", "test: incorporate upstream", next);
    expect(() => validate(previous)).toThrow(/ambiguous|integration/);
  });
  it.each(["version", "release", "tip", "tail"])(
    "rejects conflicting %s claims against local history",
    (kind) => {
      let text = block(expected(release, tip, "1.1.0", true));
      if (kind === "version") text = text.replace("`1.1.0`", "`1.1.1`");
      if (kind === "release") text = text.replace(release, root);
      if (kind === "tip") text = text.replace(tip, release);
      if (kind === "tail")
        text = text.replace(
          "Includes unreleased changes to this package.\n\n",
          "",
        );
      expect(() => validate(text)).toThrow(/source|manifest|integration|tail/);
    },
  );
});
