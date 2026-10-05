import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  renderCorrespondenceTable,
  updateCorrespondenceDocument,
} from "../../scripts/release/correspondence-table.mjs";
import { requireForkSyncTarget } from "../../scripts/release/fork-sync-targets.mjs";
import {
  prepareArtifacts,
  validatePublishedArtifacts,
} from "../../scripts/release/release-artifacts.mjs";
import {
  findReleaseSection,
  readTaggedReleaseSection,
} from "../../scripts/release/release-correspondence.mjs";
import {
  createMultiForkScenario,
  WORKTREES,
} from "./helpers/multi-fork-scenario.mjs";
import { FORK, ORIGINAL } from "./helpers/release-artifacts.mjs";

let fixture;
let out;
beforeEach(() => {
  fixture = createMultiForkScenario();
  out = mkdtempSync(path.join(tmpdir(), "multi-artifacts-"));
});
afterEach(() => {
  fixture.dispose();
  rmSync(out, { recursive: true, force: true });
});
const selectedSets = [
  [FORK.directory],
  [WORKTREES.directory],
  [FORK.directory, WORKTREES.directory],
  [ORIGINAL.directory],
  [FORK.directory, WORKTREES.directory, ORIGINAL.directory],
];

function prepare(packages) {
  return fixture.repo.runReleaseScriptEnv(
    { PACKAGES: packages.join(" "), ALLOW_LOCAL_PUSH: "1" },
    "prepare-release.sh",
  );
}
function snapshot() {
  return {
    head: fixture.repo.gitOut("rev-parse", "HEAD"),
    status: fixture.repo.gitOut(
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ),
    refs: fixture.refs(),
    remote: fixture.remoteRefs(),
    files: fixture.registry.packages.map(({ directory }) =>
      fixture.bytes(directory),
    ),
    config: fixture.repo.gitOut("config", "--local", "--list"),
  };
}

describe("independently selected preparation", () => {
  it.each(selectedSets.map((set) => [set.join(" + "), set]))(
    "commits only %s and validates the exact tagged artifacts",
    (_label, packages) => {
      const { repo } = fixture;
      const before = fixture.registry.packages.map(({ directory }) =>
        fixture.bytes(directory),
      );
      const tagsBefore = repo.gitOut(
        "for-each-ref",
        "--format=%(refname) %(objectname)",
        "refs/tags",
      );
      const result = prepare(packages);
      expect(result.status, result.stderr).toBe(0);
      expect(
        repo.gitOut("status", "--porcelain=v1", "--untracked-files=all"),
      ).toBe("");
      const tags = packages.map(
        (directory) =>
          `${directory}-v${directory === ORIGINAL.directory ? "2.0.1" : fixture.versions[directory].next}`,
      );
      expect(
        repo.gitOut("tag", "--points-at", "HEAD").split("\n").toSorted(),
      ).toEqual(tags.toSorted());
      expect(
        repo
          .gitOut(
            "for-each-ref",
            "--format=%(refname) %(objectname)",
            "refs/tags",
          )
          .split("\n")
          .filter(
            (line) => !tags.some((tag) => line.startsWith(`refs/tags/${tag} `)),
          )
          .join("\n"),
      ).toBe(tagsBefore);
      for (const [index, registration] of fixture.registry.packages.entries()) {
        const directory = registration.directory;
        if (!packages.includes(directory)) {
          expect(fixture.bytes(directory)).toEqual(before[index]);
          for (const file of fixture.files(directory))
            expect(
              execFileSync("git", ["show", `HEAD:${file}`], { cwd: repo.dir }),
            ).toEqual(before[index][file]);
          continue;
        }
        const tag = tags[packages.indexOf(directory)];
        const notes = readTaggedReleaseSection({
          repo: repo.dir,
          tag,
          packageDirectory: directory,
        });
        const manifest = JSON.parse(
          repo.gitOut("show", `HEAD:packages/${directory}/package.json`),
        );
        expect(manifest).toEqual({
          name: registration.name,
          version: tag.slice(`${directory}-v`.length),
        });
        const old =
          before[index][`packages/${directory}/CHANGELOG.md`].toString();
        const changelog = readFileSync(
          path.join(repo.dir, `packages/${directory}/CHANGELOG.md`),
          "utf8",
        );
        expect(
          changelog.endsWith(
            old.slice(
              old.indexOf(
                directory === ORIGINAL.directory ? "Historical" : "## ",
              ),
            ),
          ),
        ).toBe(true);
        if (registration.kind === "original") {
          expect(notes.includes("upstream-correspondence")).toBe(false);
        } else {
          const target = requireForkSyncTarget(directory);
          const state = JSON.parse(
            repo.gitOut("show", `HEAD:${target.statePath}`),
          );
          expect(state).toEqual({
            ...fixture.states[directory],
            releases: [
              ...fixture.states[directory].releases,
              {
                forkTag: tag,
                upstream: {
                  version: fixture.versions[directory].nextUpstream,
                  commit: fixture.upstream[directory],
                },
                upstreamTip: fixture.tip,
              },
            ],
          });
          expect(notes).toContain(
            `Incorporated upstream release: \`${fixture.versions[directory].nextUpstream}\``,
          );
          expect(notes).toContain(
            `/blob/${fixture.upstream[directory]}/packages/${directory}`,
          );
          const document = repo.gitOut(
            "show",
            `HEAD:${target.correspondencePath}`,
          );
          expect(document).toBe(
            updateCorrespondenceDocument(
              before[index][target.correspondencePath].toString(),
              renderCorrespondenceTable({
                repo: repo.dir,
                registry: fixture.registry,
                state,
                directory,
              }),
            ).trim(),
          );
          const prediction = repo.runReleaseScript(
            "next-version.sh",
            directory,
          );
          expect(prediction.status, prediction.stderr).toBe(0);
          expect(prediction.stdout).toBe("");
        }
      }
      validatePublishedArtifacts(repo.dir, out, tags);
      for (const [index, tag] of tags.entries())
        expect(readFileSync(path.join(out, `notes-${index}`), "utf8")).toBe(
          readTaggedReleaseSection({
            repo: repo.dir,
            tag,
            packageDirectory: packages[index],
          }),
        );
    },
  );

  it.each([WORKTREES.directory, ORIGINAL.directory])(
    "does not read unselected fork evidence when releasing %s",
    (directory) => {
      const unrelated = fixture.forks.filter(
        (fork) => fork.directory !== directory,
      );
      for (const fork of unrelated)
        fixture.write(
          requireForkSyncTarget(fork.directory).statePath,
          "not selected evidence\n",
        );
      fixture.repo.git("add", "-A");
      fixture.repo.git(
        "commit",
        "-m",
        "test: unrelated evidence is unavailable",
      );
      const before = unrelated.map((fork) => fixture.bytes(fork.directory));
      const result = prepare([directory]);
      expect(result.status, result.stderr).toBe(0);
      for (const [index, fork] of unrelated.entries())
        expect(fixture.bytes(fork.directory)).toEqual(before[index]);
      const tag = `${directory}-v${directory === ORIGINAL.directory ? "2.0.1" : fixture.versions[directory].next}`;
      validatePublishedArtifacts(fixture.repo.dir, out, [tag]);
      expect(readFileSync(path.join(out, "notes-0"), "utf8")).toBe(
        readTaggedReleaseSection({
          repo: fixture.repo.dir,
          tag,
          packageDirectory: directory,
        }),
      );
    },
  );

  it("preflights a blocked later selected fork before writes, config, commit or push", () => {
    fixture.write(
      requireForkSyncTarget(WORKTREES.directory).statePath,
      `${JSON.stringify({ schemaVersion: 2, releases: [], syncs: [] })}\n`,
    );
    fixture.repo.git("add", "-A");
    fixture.repo.git(
      "commit",
      "-m",
      "test: remove selected worktrees evidence",
    );
    const before = snapshot();
    const result = prepare([
      FORK.directory,
      ORIGINAL.directory,
      WORKTREES.directory,
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "no recorded upstream correspondence for pi-subagents-worktrees-v0.1.0",
    );
    expect(snapshot()).toEqual(before);
  });

  it("retains whole-manifest registration validation even for an unselected package", () => {
    fixture.write(
      `packages/${WORKTREES.directory}/package.json`,
      '{"name":"@gotgenes/pi-subagents-worktrees","version":"0.1.0"}\n',
    );
    fixture.repo.git("add", "-A");
    fixture.repo.git("commit", "-m", "test: contradictory registered identity");
    const before = snapshot();
    const result = prepare([FORK.directory]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("npm name does not match registration");
    expect(snapshot()).toEqual(before);
  });
});

describe("selected artifact output contract", () => {
  it("emits distinct state/view files and a selected-only application list", () => {
    const spec = fixture.forks.map(({ directory }, index) => {
      const tag = `${directory}-v${fixture.versions[directory].next}`;
      const section = path.join(out, `raw-${index}`);
      const text = `## [${fixture.versions[directory].next}](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v${fixture.versions[directory].fork}...${tag}) (2026-09-25)\n\nReviewed notes.\n`;
      writeFileSync(section, text);
      return {
        directory,
        tag,
        section,
        decision: {
          nextTag: tag,
          upstream: {
            version: fixture.versions[directory].nextUpstream,
            commit: fixture.upstream[directory],
          },
          upstreamTip: fixture.tip,
        },
      };
    });
    fixture.write("spec.json", JSON.stringify(spec));
    prepareArtifacts(
      fixture.repo.dir,
      out,
      path.join(fixture.repo.dir, "spec.json"),
    );
    const expected = fixture.forks.map(({ directory }) => ({
      ...requireForkSyncTarget(directory),
      stateFile: `state-${directory}.json`,
      correspondenceFile: `correspondence-${directory}.md`,
    }));
    expect(
      JSON.parse(readFileSync(path.join(out, "fork-artifacts.json"), "utf8")),
    ).toEqual(expected);
    for (const artifact of expected) {
      expect(
        JSON.parse(
          readFileSync(path.join(out, artifact.stateFile), "utf8"),
        ).releases.at(-1).upstream.version,
      ).toBe(fixture.versions[artifact.directory].nextUpstream);
      expect(
        readFileSync(path.join(out, artifact.correspondenceFile), "utf8"),
      ).toContain(
        `/blob/${fixture.upstream[artifact.directory]}/packages/${artifact.directory}`,
      );
    }
  });
});

describe("selected correspondence table", () => {
  it("renders and writes worktrees only, refusing cross-package rows and pending tags", () => {
    const directory = WORKTREES.directory;
    const target = requireForkSyncTarget(directory);
    const coreBefore = fixture.bytes(FORK.directory);
    const input = {
      repo: fixture.repo.dir,
      registry: fixture.registry,
      state: fixture.states[directory],
      directory,
    };
    const table = renderCorrespondenceTable(input);
    expect(table).toContain("Fork `@jopqior/pi-subagents-worktrees`");
    expect(table).toContain("`0.3.3`");
    expect(table).toContain(`/packages/${directory})`);
    expect(table.includes("21.7.0")).toBe(false);
    const cli = path.join(
      fixture.repo.dir,
      "scripts/release/correspondence-table.mjs",
    );
    const run = (...args) =>
      spawnSync(process.execPath, [cli, "--repo", fixture.repo.dir, ...args], {
        encoding: "utf8",
      });
    const current = readFileSync(
      path.join(fixture.repo.dir, target.correspondencePath),
      "utf8",
    );
    expect(run("--package", directory, "--check").status).toBe(1);
    expect(run("--package", directory, "--write").status).toBe(0);
    expect(
      readFileSync(
        path.join(fixture.repo.dir, target.correspondencePath),
        "utf8",
      ),
    ).toBe(updateCorrespondenceDocument(current, table));
    expect(run("--package", directory, "--check").status).toBe(0);
    expect(fixture.bytes(FORK.directory)).toEqual(coreBefore);
    expect(() =>
      renderCorrespondenceTable({
        ...input,
        state: fixture.states[FORK.directory],
      }),
    ).toThrow(/tag|package/);
    expect(() =>
      renderCorrespondenceTable({
        ...input,
        pending: {
          tag: "pi-subagents-v1.1.0",
          decision: {
            nextTag: "pi-subagents-v1.1.0",
            upstream: fixture.states[FORK.directory].releases[0].upstream,
            upstreamTip: fixture.tip,
          },
        },
      }),
    ).toThrow(/tag|package/);
    for (const args of [
      ["--package"],
      ["--package", "--write"],
      ["--package", directory, "--package", directory, "--write"],
      ["--package", "../escape", "--write"],
    ])
      expect(run(...args).status).toBe(1);
    fixture.write(
      "scripts/release/release-packages.json",
      JSON.stringify({ ...fixture.registry, packages: [FORK, ORIGINAL] }),
    );
    expect(run("--package", directory, "--write").stderr).toContain(
      "no release package registration",
    );
  });
});

describe("strict first release heading", () => {
  const directory = WORKTREES.directory;
  const tag = `${directory}-v0.1.0`;
  const heading = `## [0.1.0](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/${tag}) (2026-09-25)`;
  it("reads exact first-tag bytes with CRLF, fences and tagged round trip", () => {
    const section = `${heading}\r\n\r\nReviewed first notes.  \r\n\r\n`;
    const text = `# Changelog\r\n\r\n~~~~markdown\r\n${heading}\r\n~~~~\r\n\`\`\`\`markdown\r\n\`\`\`\r\n${heading}\r\n\`\`\`\r\n\`\`\`\`\r\n${section}## [0.0.9] (inherited)\r\n`;
    expect(findReleaseSection(text, tag, directory)).toBe(section);
    fixture.repo.writeChangelog(directory, text);
    fixture.repo.git("add", "-A");
    fixture.repo.git("commit", "-m", "test: exact first heading bytes");
    fixture.repo.git("tag", "-f", tag);
    expect(
      readTaggedReleaseSection({
        repo: fixture.repo.dir,
        tag,
        packageDirectory: directory,
      }),
    ).toBe(section);
    expect(() =>
      findReleaseSection(`${heading}\n\n\`\`\`text\n`, tag, directory),
    ).toThrow(/unclosed/);
    expect(() =>
      findReleaseSection(`${heading}\nA\n${heading}\nB\n`, tag, directory),
    ).toThrow(/ambiguous/);
    const compare = `## [0.1.0](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v0.0.0...${tag}) (2026-09-25)`;
    expect(() =>
      findReleaseSection(`${heading}\nA\n${compare}\nB\n`, tag, directory),
    ).toThrow(/ambiguous/);
  });
  it.each([
    heading.replace("Jopqior/gotgenes-pi-packages", "gotgenes/pi-packages"),
    heading.replace("Jopqior/gotgenes-pi-packages", "other/repo"),
    heading.replace(tag, "pi-subagents-v0.1.0"),
    heading.replace(tag, `${directory}-v0.1.1`),
    heading.replace("[0.1.0]", "[0.1.1]"),
    "## [0.1.0] (2026-09-25)",
  ])("rejects nonexact heading %s", (invalid) => {
    expect(() =>
      findReleaseSection(`${invalid}\nBody\n`, tag, directory),
    ).toThrow(/missing/);
  });
});
