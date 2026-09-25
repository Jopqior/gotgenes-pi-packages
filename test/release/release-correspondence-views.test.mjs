import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findReleaseSection,
  readReleasePackages,
  readTaggedReleaseSection,
  renderUpstreamCorrespondence,
} from "../../scripts/release/release-correspondence.mjs";
import { createReleaseArtifacts } from "./helpers/release-artifacts.mjs";

const realRepo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const comparison = (directory, previous, version) =>
  `## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v${previous}...${directory}-v${version}) (2026-09-25)`;
const releasePath = (directory) => `packages/${directory}/CHANGELOG.md`;
const gitText = (repo, ...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" });

/** @type {ReturnType<typeof createReleaseArtifacts>} */
let fixture;
beforeEach(() => {
  fixture = createReleaseArtifacts();
});
afterEach(() => fixture.dispose());

function tagChangelog(text, tag = "pi-subagents-v1.0.1") {
  const file = path.join(fixture.repo.dir, releasePath("pi-subagents"));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
  fixture.repo.git("add", ".");
  fixture.repo.git("commit", "-m", "docs: release notes fixture");
  fixture.repo.git("tag", "-f", tag);
  return readTaggedReleaseSection({
    repo: fixture.repo.dir,
    tag,
    packageDirectory: "pi-subagents",
  });
}

describe("canonical upstream correspondence block", () => {
  const provenance = {
    kind: "fork",
    upstreamPackage: "@gotgenes/pi-subagents",
    upstreamVersion: "21.7.0",
    sourceUrl:
      "https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents",
  };

  it("renders the complete bounded claim, source, and non-equivalence disclaimer", () => {
    expect(renderUpstreamCorrespondence(provenance)).toBe(
      "<!-- upstream-correspondence:start -->\n" +
        "### Upstream correspondence\n\n" +
        "Direct upstream package: `@gotgenes/pi-subagents`  \n" +
        "Incorporated upstream release: `21.7.0`  \n" +
        "Source: [fixed upstream release commit](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents)\n\n" +
        "This records incorporated source provenance, not behavioral equivalence or the identity of historical npm artifacts.\n" +
        "<!-- upstream-correspondence:end -->",
    );
  });

  it("renders no block or implied baseline for an original package", () => {
    expect(renderUpstreamCorrespondence({ kind: "original" })).toBe("");
  });
});

describe("exact tagged CHANGELOG section", () => {
  it("selects the fork link, not a matching upstream version or a wrong repository", () => {
    const heading = comparison("pi-subagents", "1.0.0", "1.0.1");
    const section = `${heading}\n\n### Fork notes\n\nFork body.\r\n\r\n`;
    const text =
      `# Changelog\n\n## [1.0.1](https://github.com/gotgenes/pi-packages/compare/pi-subagents-v1.0.0...pi-subagents-v1.0.1) (2026-09-25)\n\nUpstream body.\n\n` +
      `## [1.0.1](https://github.com/other/repo/compare/pi-subagents-v1.0.0...pi-subagents-v1.0.1) (2026-09-25)\n\nOther repo.\n\n` +
      section +
      "## [0.0.9] (older)\n";
    expect(tagChangelog(text)).toBe(section);
  });

  it("preserves CRLF bytes and does not trim the terminal tagged section", () => {
    const text = `${comparison("pi-subagents", "1.0.0", "1.0.1")}\r\n\r\nbody  \r\n\r\n`;
    expect(tagChangelog(text)).toBe(text);
    const followed = `${text}## [0.0.9] (older)\r\n`;
    expect(tagChangelog(followed)).toBe(text);
  });

  it("ignores four-backtick and tilde fences, including nested triple-backtick text", () => {
    const fake = comparison("pi-subagents", "1.0.0", "1.0.1");
    const real = `${fake}\n\nReal body.\n\n`;
    const text =
      `# Changelog\n\n\`\`\`\`markdown\n\`\`\`\n${fake}\n\`\`\`\n\`\`\`\`\n~~~markdown\n${fake}\n~~~\n` +
      real +
      `\`\`\`\`text\n## [0.1.0] (not a boundary)\n\`\`\`\`\nStill in section.\n`;
    expect(tagChangelog(text)).toBe(
      `${real}\`\`\`\`text\n## [0.1.0] (not a boundary)\n\`\`\`\`\nStill in section.\n`,
    );
  });

  it("rejects duplicate matching headings and refuses version-only or malformed headings", () => {
    const heading = comparison("pi-subagents", "1.0.0", "1.0.1");
    expect(() => tagChangelog(`${heading}\nA\n${heading}\nB\n`)).toThrow(
      /ambiguous|multiple/,
    );
    expect(() => tagChangelog("## [1.0.1] (2026-09-25)\nBody\n")).toThrow(
      /missing|section/,
    );
    expect(() =>
      tagChangelog(`${comparison("pi-subagents", "1.0.0", "1.0.10")}\nBody\n`),
    ).toThrow(/missing|section/);
    expect(() =>
      tagChangelog(
        "## [1.0.1](https://github.com/Jopqior/gotgenes-pi-packages/compare/pi-subagents-v1.0.0...pi-subagents-v9.0.0) (2026-09-25)\nBody\n",
      ),
    ).toThrow(/missing|section/);
  });
});

describe("actual current and tagged CHANGELOG corpus", () => {
  it("replays all tracked CHANGELOGs and registered package tags without an unsafe manual fallback", () => {
    const registry = readReleasePackages(
      path.join(realRepo, "scripts/release/release-packages.json"),
      realRepo,
    );
    const files = gitText(realRepo, "ls-files", "packages/*/CHANGELOG.md")
      .trimEnd()
      .split("\n");
    expect(files.length).toBeGreaterThanOrEqual(10);
    const headings = files.flatMap((file) => {
      const text = gitText(realRepo, "show", `HEAD:${file}`);
      expect(text.startsWith("# Changelog")).toBe(true);
      return text.match(/^## .+$/gm) ?? [];
    });
    expect(headings.length).toBeGreaterThanOrEqual(581);
    const forkCompareHeadings = headings.filter((heading) =>
      heading.includes("github.com/Jopqior/gotgenes-pi-packages/compare/"),
    );
    const exceptions = new Set([
      "pi-subagents-v1.0.0", // Manually authored heading, no comparison link.
      "pi-subagents-model-selector-v0.1.0", // Tag has no CHANGELOG.
    ]);
    const observedExceptions = new Set();
    const manualFirst = gitText(
      realRepo,
      "show",
      "pi-subagents-v1.0.0:packages/pi-subagents/CHANGELOG.md",
    );
    expect(manualFirst).toMatch(/^## \[1\.0\.0\] \(\d{4}-\d{2}-\d{2}\)$/m);
    expect(() =>
      readTaggedReleaseSection({
        repo: realRepo,
        tag: "pi-subagents-v1.0.0",
        packageDirectory: "pi-subagents",
      }),
    ).toThrow(/missing/);
    expect(() =>
      gitText(
        realRepo,
        "show",
        "pi-subagents-model-selector-v0.1.0:packages/pi-subagents-model-selector/CHANGELOG.md",
      ),
    ).toThrow();
    let matched = 0;
    for (const entry of registry.packages) {
      const tags = gitText(realRepo, "tag", "--list", `${entry.directory}-v*`)
        .trimEnd()
        .split("\n")
        .filter(Boolean);
      const current = gitText(
        realRepo,
        "show",
        `HEAD:${releasePath(entry.directory)}`,
      );
      for (const tag of tags) {
        if (exceptions.has(tag)) {
          observedExceptions.add(tag);
          continue;
        }
        const raw = gitText(
          realRepo,
          "show",
          `${tag}:${releasePath(entry.directory)}`,
        );
        const section = readTaggedReleaseSection({
          repo: realRepo,
          tag,
          packageDirectory: entry.directory,
        });
        expect(raw.includes(section)).toBe(true);
        const currentSection = findReleaseSection(
          current,
          tag,
          entry.directory,
        );
        expect(current.includes(currentSection)).toBe(true);
        expect(
          currentSection.startsWith(
            `## [${tag.slice(`${entry.directory}-v`.length)}](`,
          ),
        ).toBe(true);
        expect(
          section.startsWith(
            `## [${tag.slice(`${entry.directory}-v`.length)}](`,
          ),
        ).toBe(true);
        expect(section.includes(`/compare/`)).toBe(true);
        matched++;
      }
    }
    expect(observedExceptions).toEqual(exceptions);
    expect(matched).toBeGreaterThanOrEqual(11);
    expect(forkCompareHeadings).toHaveLength(matched);
  });
});
