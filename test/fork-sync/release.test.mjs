import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertExistingRelease,
  validatePublishedArtifacts,
} from "../../scripts/release/release-artifacts.mjs";
import { readTaggedReleaseSection } from "../../scripts/release/release-metadata.mjs";
import { captureOutput } from "../helpers/capture-output.mjs";
import { createTaggedReleaseRepository } from "../release/helpers/git-repository.mjs";
import {
  core,
  createReleaseRepository,
  oldSuffix,
  original,
  worktrees,
} from "./helpers/release-repository.mjs";

// Only preparation and representative shell orchestration need this graph.
describe("all-selected release orchestration", () => {
  let repo;
  beforeEach(() => {
    repo = createReleaseRepository();
  });
  afterEach(() => repo.dispose());
  const section = (directory) =>
    readTaggedReleaseSection({
      repo: repo.fork,
      tag: `${directory}-v1.0.1`,
      packageDirectory: directory,
    });
  function prepared(...directories) {
    const result = repo.prepare(...directories);
    expect(result.status, result.stderr + result.stdout).toBe(0);
  }
  const effects = () =>
    repo
      .calls()
      .split("\n")
      .filter((call) => /^(pnpm |gh release create|git push)/.test(call));

  it("splices the full prepared bytes, preserves the old suffix, and uses each fork's own source", () => {
    prepared(core, worktrees, original);
    for (const [index, directory] of [core, worktrees, original].entries()) {
      expect(section(directory)).toBe(
        readFileSync(path.join(repo.prepared, `section-${index}`), "utf8"),
      );
      expect(
        repo
          .read(`packages/${directory}/CHANGELOG.md`)
          .endsWith(oldSuffix.replaceAll(core, directory)),
      ).toBe(true);
    }
    expect(section(core)).toContain(
      "Contained stable upstream release: `1.1.0`",
    );
    expect(section(core)).toContain(`${repo.stable}/packages/${core}`);
    expect(section(core)).toContain(`${repo.tip}/packages/${core}`);
    expect(section(core)).toContain(
      "Includes unreleased changes to this package.",
    );
    expect(section(worktrees)).toContain(
      `Direct upstream package: \`@gotgenes/${worktrees}\``,
    );
    expect(section(worktrees)).toContain(
      "Contained stable upstream release: `2.0.0`",
    );
    expect(section(worktrees)).not.toContain("Includes unreleased changes");
    expect(section(original)).not.toContain("upstream-correspondence");
    expect(repo.git(repo.fork, "status", "--porcelain")).toBe("");
  });
  it("keeps preflighted source text when the CHANGELOG is absent", () => {
    rmSync(repo.file(`packages/${core}/CHANGELOG.md`));
    repo.commitAll();
    prepared(core);
    expect(section(core)).toBe(
      readFileSync(path.join(repo.prepared, "section-0"), "utf8"),
    );
    expect(repo.read(`packages/${core}/CHANGELOG.md`)).toContain("# Changelog");
  });
  it("does not contact upstream or change an unselected fork for an original release", () => {
    const unselected = () =>
      Object.fromEntries(
        Object.entries(repo.snapshot().files).filter(
          ([file]) =>
            file.startsWith(`packages/${core}/`) ||
            file.startsWith(`packages/${worktrees}/`),
        ),
      );
    const before = unselected();
    prepared(original);
    expect(repo.calls()).not.toMatch(/ls-remote|git fetch/);
    expect(unselected()).toEqual(before);
    expect(section(original)).not.toContain("upstream-correspondence");
  });
  it.each(["source", "heading"])(
    "fails %s preflight before any tracked write, commit, tag or push",
    (failure) => {
      if (failure === "source") {
        repo.registrations.find(
          (entry) => entry.directory === worktrees,
        ).upstream.name = "@gotgenes/wrong";
        repo.write(
          "scripts/release/release-packages.json",
          JSON.stringify({ schemaVersion: 3, packages: repo.registrations }),
        );
      } else {
        repo.write(
          "cliff.toml",
          repo
            .read("cliff.toml")
            .replace(
              'replace = "https://github.com/Jopqior/gotgenes-pi-packages"',
              'replace = "https://github.com/other/repository"',
            ),
        );
      }
      repo.commitAll();
      const before = repo.snapshot();
      const result = repo.prepare(original, core, worktrees);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        failure === "source"
          ? "upstream release manifest name must be @gotgenes/wrong"
          : "missing exact fork section",
      );
      expect(repo.snapshot()).toEqual(before);
      expect(effects()).toEqual([]);
    },
  );
  it("publishes the mixed set with explicit identities and exact tagged notes, without source reselection", () => {
    prepared(core, worktrees, original);
    const releaseHead = repo.git(repo.fork, "rev-parse", "HEAD");
    repo.commit(repo.fork, "later.txt", "unrelated\n", "docs: later tag");
    repo.git(repo.fork, "tag", "unrelated-v99.0.0");
    repo.git(repo.fork, "checkout", "--detach", releaseHead);
    repo.release("1.2.0");
    repo.publish();
    repo.clearCalls();
    for (const script of ["publish-released.sh", "create-github-releases.sh"]) {
      const result = repo.run(script, { OFFLINE: "1" });
      expect(result.status, result.stderr + result.stdout).toBe(0);
    }
    for (const directory of [core, worktrees, original])
      expect(
        readFileSync(path.join(repo.bodies, `${directory}-v1.0.1`), "utf8"),
      ).toBe(section(directory));
    expect(repo.calls()).not.toMatch(/ls-remote|git fetch/);
    expect(effects().filter((line) => line.startsWith("pnpm "))).toEqual([
      "pnpm --filter @fixture/demo publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/",
      `pnpm --filter @jopqior/${core} publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/`,
      `pnpm --filter @jopqior/${worktrees} publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/`,
    ]);
    expect(
      effects()
        .filter((line) => line.startsWith("gh "))
        .every((line) => line.includes("--repo Jopqior/gotgenes-pi-packages")),
    ).toBe(true);
    repo.clearCalls();
    expect(repo.run("create-github-releases.sh", { OFFLINE: "1" }).status).toBe(
      0,
    );
    expect(effects()).toEqual([]);
    const body = path.join(repo.bodies, `${worktrees}-v1.0.1`);
    writeFileSync(body, "Legacy body retained\n");
    expect(repo.run("create-github-releases.sh", { OFFLINE: "1" }).status).toBe(
      0,
    );
    expect(readFileSync(body, "utf8")).toBe("Legacy body retained\n");
    expect(effects()).toEqual([]);
    // A later remote conflict must block creation of the earlier missing Release.
    rmSync(path.join(repo.bodies, `${original}-v1.0.1`));
    writeFileSync(
      body,
      "<!-- upstream-correspondence:start -->\nwrong\n<!-- upstream-correspondence:end -->\n",
    );
    const conflict = repo.run("create-github-releases.sh", { OFFLINE: "1" });
    expect(conflict.status).not.toBe(0);
    expect(conflict.stderr).toContain("conflicting");
    expect(effects()).toEqual([]);
  }, 15_000);
  it("rejects a later dirty package before any selected publication or creation", () => {
    prepared(core, worktrees, original);
    repo.write(`packages/${worktrees}/untracked.txt`, "dirty");
    repo.clearCalls();
    for (const script of ["publish-released.sh", "create-github-releases.sh"]) {
      const result = repo.run(script, { OFFLINE: "1" });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("differs from validated tag");
    }
    expect(effects()).toEqual([]);
  });
});

// Consumers use local tagged inputs, not the production preparation path.
describe("tagged artifact validation", () => {
  let repo;
  const tag = "demo-v1.2.3";
  const text =
    "## [1.2.3](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/demo-v1.2.3) (2026-01-01)\n\n- tagged bytes  \n\n";
  beforeEach(() => {
    repo = createTaggedReleaseRepository();
    mkdirSync(path.join(repo.dir, "packages/demo"), { recursive: true });
    mkdirSync(path.join(repo.dir, "scripts/release"), { recursive: true });
    writeFileSync(
      path.join(repo.dir, "packages/demo/package.json"),
      JSON.stringify({ name: "@fixture/demo", version: "1.2.3" }),
    );
    writeFileSync(
      path.join(repo.dir, "packages/demo/CHANGELOG.md"),
      `# Changelog\n\n${text}`,
    );
    writeFileSync(
      path.join(repo.dir, "scripts/release/release-packages.json"),
      JSON.stringify({
        schemaVersion: 3,
        packages: [
          { directory: "demo", name: "@fixture/demo", kind: "original" },
        ],
      }),
    );
    repo.git("add", ".");
    repo.git("commit", "-m", "test: registration");
    repo.git("tag", tag);
  });
  afterEach(() => repo.dispose());
  function validate() {
    return captureOutput(() =>
      validatePublishedArtifacts(repo.dir, repo.dir, [tag]),
    );
  }
  it("reads exact tagged notes and rejects a tag not bound to checkout HEAD", () => {
    validate();
    expect(readFileSync(path.join(repo.dir, "notes-0"), "utf8")).toBe(text);
    rmSync(path.join(repo.dir, "notes-0"));
    repo.git("commit", "--allow-empty", "-m", "docs: moving HEAD");
    expect(validate).toThrow("not at the checked-out release commit");
  });
  it.each(["package.json", "CHANGELOG.md"])(
    "rejects hidden %s byte drift even when status is clean",
    (file) => {
      const relative = `packages/demo/${file}`;
      repo.git("update-index", "--assume-unchanged", relative);
      writeFileSync(
        path.join(repo.dir, relative),
        file === "package.json"
          ? JSON.stringify({ name: "@fixture/demo", version: "9.9.9" })
          : "hidden changes",
      );
      expect(
        repo.git("status", "--porcelain", "--", "packages/demo").trim(),
      ).toBe("");
      expect(validate).toThrow(
        `working ${relative} differs from validated tag`,
      );
    },
  );
  it("requires a registered fork's source block through the artifact consumer", () => {
    writeFileSync(
      path.join(repo.dir, "scripts/release/release-packages.json"),
      JSON.stringify({
        schemaVersion: 3,
        packages: [
          {
            directory: "demo",
            name: "@fixture/demo",
            kind: "fork",
            upstream: {
              name: "@upstream/alternate",
              repository: "gotgenes/pi-packages",
              directory: "packages/alternate",
            },
          },
        ],
      }),
    );
    repo.git("add", ".");
    repo.git("commit", "-m", "test: fork registration without source block");
    repo.git("tag", "-f", tag);
    expect(validate).toThrow("missing or duplicate new source block");
  });
  it("rejects upstream markers in an original package's tagged section", () => {
    writeFileSync(
      path.join(repo.dir, "packages/demo/CHANGELOG.md"),
      `# Changelog\n\n${text}<!-- upstream-correspondence:start -->\n`,
    );
    repo.git("add", ".");
    repo.git("commit", "-m", "test: invalid original block");
    repo.git("tag", "-f", tag);
    expect(validate).toThrow(
      "original package has upstream correspondence markers",
    );
  });
});

it("refuses first-tag inference without source or git-cliff preparation", () => {
  const repo = createTaggedReleaseRepository();
  try {
    mkdirSync(path.join(repo.dir, "packages/demo"), { recursive: true });
    mkdirSync(path.join(repo.dir, "scripts/release"), { recursive: true });
    writeFileSync(
      path.join(repo.dir, "packages/demo/package.json"),
      JSON.stringify({ name: "@fixture/demo", version: "1.0.0" }),
    );
    for (const name of ["lib.sh", "next-version.sh"])
      copyFileSync(
        path.join(process.cwd(), "scripts/release", name),
        path.join(repo.dir, "scripts/release", name),
      );
    const result = spawnSync(
      "bash",
      [path.join(repo.dir, "scripts/release/next-version.sh"), "demo"],
      {
        cwd: repo.dir,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_CONFIG_GLOBAL: "/dev/null",
          GIT_CONFIG_SYSTEM: "/dev/null",
        },
        stdio: "pipe",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("first version by hand");
  } finally {
    repo.dispose();
  }
});

const block =
  "<!-- upstream-correspondence:start -->\nfixed claim\n<!-- upstream-correspondence:end -->";
describe("existing GitHub Release body", () => {
  it("accepts legacy bodies and an exact managed block without requiring other prose to match", () => {
    expect(() => assertExistingRelease("legacy notes", block)).not.toThrow();
    expect(() =>
      assertExistingRelease(`other notes\n${block}`, `new notes\n${block}`),
    ).not.toThrow();
  });
  it.each([
    block.replace("fixed claim", "wrong claim"),
    `${block}\n${block}`,
    "<!-- upstream-correspondence:start -->",
  ])("rejects conflicting or malformed blocks", (existing) => {
    expect(() => assertExistingRelease(existing, block)).toThrow(
      "conflicting managed upstream correspondence",
    );
  });
});
