import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  findReleaseSection,
  readTaggedReleaseSection,
} from "../../scripts/release/release-correspondence.mjs";
import { captureOutput } from "../helpers/capture-output.mjs";
import { createScratchReleaseRepository } from "./helpers/git-repository.mjs";

const realRepo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const comparison = (directory, previous, version) =>
  `## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v${previous}...${directory}-v${version}) (2026-09-25)`;
const firstRelease = (directory, version) =>
  `## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/${directory}-v${version}) (2026-09-25)`;
const releasePath = (directory) => `packages/${directory}/CHANGELOG.md`;
const gitText = (...args) =>
  execFileSync("git", args, {
    cwd: realRepo,
    encoding: "utf8",
    stdio: "pipe",
  });

function taggedRoundTrip(directory, tag, text) {
  const repo = createScratchReleaseRepository();
  try {
    repo.writeChangelog(directory, text);
    repo.git("add", ".");
    repo.git("commit", "-m", "test: exact heading bytes");
    repo.git("tag", tag);
    return readTaggedReleaseSection({
      repo: repo.dir,
      tag,
      packageDirectory: directory,
    });
  } finally {
    repo.dispose();
  }
}

function errorOf(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw new Error("Expected command to fail");
}

describe("exact tagged CHANGELOG section", () => {
  const directory = "pi-subagents";
  const tag = `${directory}-v1.0.1`;
  const scan = (text) => findReleaseSection(text, tag, directory);

  describe("first-release tag headings", () => {
    // Exact identity, rather than a conventional first-version number.
    const heading = firstRelease(directory, "1.0.1");
    it("selects the exact fork tag heading over same-version inherited notes", () => {
      const section = `${heading}\n\nFirst fork body.\n\n`;
      const text =
        `${firstRelease(directory, "9.0.0")}\nLater notes.\n\n` +
        section +
        `${heading.replace("Jopqior/gotgenes-pi-packages", "gotgenes/pi-packages")}\nInherited body.\n`;
      expect(scan(text)).toBe(section);
      expect(taggedRoundTrip(directory, tag, text)).toBe(section);
    });
    it.each([
      ["wrong repository", "Jopqior/gotgenes-pi-packages", "other/repo"],
      ["wrong URL package", "tag/pi-subagents-", "tag/pi-subagents-worktrees-"],
      ["wrong URL version", "-v1.0.1)", "-v1.0.10)"],
      ["wrong heading version", "[1.0.1]", "[1.0.10]"],
      ["malformed tag", "-v1.0.1)", "-v01.0.1)"],
      ["noncanonical URL", "https://", "http://"],
      ["extra URL suffix", "-v1.0.1)", "-v1.0.1/extra)"],
    ])(
      "rejects a %s first heading even with a compare link in its body",
      (_name, from, to) => {
        expect(() =>
          scan(
            `${heading.replace(from, to)}\n\n${comparison(directory, "1.0.0", "1.0.1").slice(3)}\n`,
          ),
        ).toThrow(/missing.*exact fork section/);
      },
    );
    it("rejects duplicate first headings and mixed first/compare matches", () => {
      for (const duplicate of [
        heading,
        comparison(directory, "1.0.0", "1.0.1"),
      ]) {
        expect(() => scan(`${heading}\nA\n${duplicate}\nB\n`)).toThrow(
          /ambiguous/,
        );
      }
    });
  });

  it("selects the fork link, not a matching upstream version or a wrong repository", () => {
    const heading = comparison(directory, "1.0.0", "1.0.1");
    const section = `${heading}\n\n### Fork notes\n\nFork body.\r\n\r\n`;
    const text =
      `# Changelog\n\n## [1.0.1](https://github.com/gotgenes/pi-packages/compare/pi-subagents-v1.0.0...pi-subagents-v1.0.1) (2026-09-25)\n\nUpstream body.\n\n` +
      `## [1.0.1](https://github.com/other/repo/compare/pi-subagents-v1.0.0...pi-subagents-v1.0.1) (2026-09-25)\n\nOther repo.\n\n` +
      section +
      "## [0.0.9] (older)\n";
    expect(scan(text)).toBe(section);
  });
  it("preserves CRLF bytes and does not trim the terminal tagged section", () => {
    const text = `${comparison(directory, "1.0.0", "1.0.1")}\r\n\r\nbody  \r\n\r\n`;
    expect(scan(text)).toBe(text);
    expect(scan(`${text}## [0.0.9] (older)\r\n`)).toBe(text);
    expect(taggedRoundTrip(directory, tag, text)).toBe(text);
  });
  it("ignores four-backtick and tilde fences, including nested triple-backtick text", () => {
    const fake = comparison(directory, "1.0.0", "1.0.1");
    const real = `${fake}\n\nReal body.\n\n`;
    const text =
      `# Changelog\n\n\`\`\`\`markdown\n\`\`\`\n${fake}\n\`\`\`\n\`\`\`\`\n~~~markdown\n${fake}\n~~~\n` +
      real +
      `\`\`\`\`text\n## [0.1.0] (not a boundary)\n\`\`\`\`\nStill in section.\n`;
    expect(scan(text)).toBe(
      `${real}\`\`\`\`text\n## [0.1.0] (not a boundary)\n\`\`\`\`\nStill in section.\n`,
    );
  });
  it("rejects duplicate matching headings and refuses version-only or malformed headings", () => {
    const heading = comparison(directory, "1.0.0", "1.0.1");
    expect(() => scan(`${heading}\nA\n${heading}\nB\n`)).toThrow(
      /ambiguous|multiple/,
    );
    expect(() => scan("## [1.0.1] (2026-09-25)\nBody\n")).toThrow(
      /missing|section/,
    );
    expect(() =>
      scan(`${comparison(directory, "1.0.0", "1.0.10")}\nBody\n`),
    ).toThrow(/missing|section/);
    expect(() =>
      scan(
        "## [1.0.1](https://github.com/Jopqior/gotgenes-pi-packages/compare/pi-subagents-v1.0.0...pi-subagents-v9.0.0) (2026-09-25)\nBody\n",
      ),
    ).toThrow(/missing|section/);
  });
});

describe("strict first release heading", () => {
  const directory = "pi-subagents-worktrees";
  const tag = `${directory}-v0.1.0`;
  const heading = firstRelease(directory, "0.1.0");
  it("reads exact first-tag bytes with CRLF, fences and tagged round trip", () => {
    const section = `${heading}\r\n\r\nReviewed first notes.  \r\n\r\n`;
    const text = `# Changelog\r\n\r\n~~~~markdown\r\n${heading}\r\n~~~~\r\n\`\`\`\`markdown\r\n\`\`\`\r\n${heading}\r\n\`\`\`\r\n\`\`\`\`\r\n${section}## [0.0.9] (inherited)\r\n`;
    expect(findReleaseSection(text, tag, directory)).toBe(section);
    expect(taggedRoundTrip(directory, tag, text)).toBe(section);
    expect(() =>
      findReleaseSection(`${heading}\n\n\`\`\`text\n`, tag, directory),
    ).toThrow(/unclosed/);
    expect(() =>
      findReleaseSection(`${heading}\nA\n${heading}\nB\n`, tag, directory),
    ).toThrow(/ambiguous/);
    const compare = comparison(directory, "0.0.0", "0.1.0");
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

describe("actual current and tagged CHANGELOG corpus", () => {
  it("replays all tracked CHANGELOGs and registered package tags without an unsafe manual fallback", () => {
    const { packages } = JSON.parse(
      readFileSync(
        path.join(realRepo, "scripts/release/release-packages.json"),
        "utf8",
      ),
    );
    const files = gitText("ls-files", "packages/*/CHANGELOG.md")
      .trimEnd()
      .split("\n");
    expect(files.length).toBeGreaterThanOrEqual(10);
    const headings = files.flatMap((file) => {
      const text = gitText("show", `HEAD:${file}`);
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
    const missingChangelog = errorOf(() =>
      gitText(
        "show",
        "pi-subagents-model-selector-v0.1.0:packages/pi-subagents-model-selector/CHANGELOG.md",
      ),
    );
    expect(missingChangelog.status).toBe(128);
    expect(missingChangelog.stdout).toBe("");
    expect(missingChangelog.stderr).toContain("fatal:");
    expect(missingChangelog.stderr).toContain(
      "packages/pi-subagents-model-selector/CHANGELOG.md",
    );
    // This direct production failure inherits Git stderr; capture it at the test boundary.
    const missingRead = captureOutput(() =>
      errorOf(() =>
        readTaggedReleaseSection({
          repo: realRepo,
          tag: "pi-subagents-model-selector-v0.1.0",
          packageDirectory: "pi-subagents-model-selector",
        }),
      ),
    );
    expect(missingRead.value.message).toContain("cannot read tagged CHANGELOG");
    expect(missingRead.stdout).toBe("");
    expect(missingRead.stderr).toContain("fatal:");
    let matched = 0;
    let matchedFirst = 0;
    const comparedHeadings = [];
    for (const entry of packages) {
      const tags = gitText("tag", "--list", `${entry.directory}-v*`)
        .trimEnd()
        .split("\n")
        .filter(Boolean);
      const current = gitText("show", `HEAD:${releasePath(entry.directory)}`);
      for (const tag of tags) {
        if (exceptions.has(tag)) {
          observedExceptions.add(tag);
          continue;
        }
        const raw = gitText("show", `${tag}:${releasePath(entry.directory)}`);
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
        const prefix = `## [${tag.slice(`${entry.directory}-v`.length)}](`;
        expect(currentSection.startsWith(prefix)).toBe(true);
        expect(section.startsWith(prefix)).toBe(true);
        const heading = section.split(/\r?\n/, 1)[0];
        expect(currentSection.split(/\r?\n/, 1)[0]).toBe(heading);
        if (heading.includes("/releases/tag/")) {
          matchedFirst++;
        } else {
          expect(heading.includes("/compare/")).toBe(true);
          comparedHeadings.push(heading);
        }
        matched++;
      }
    }
    expect(observedExceptions).toEqual(exceptions);
    expect(matched).toBeGreaterThanOrEqual(11);
    expect(forkCompareHeadings).toHaveLength(matched - matchedFirst);
    expect(forkCompareHeadings.toSorted()).toEqual(comparedHeadings.toSorted());
  });
});
