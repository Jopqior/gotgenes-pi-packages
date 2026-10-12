import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import {
  findReleaseSection,
  readTaggedReleaseSection,
} from "../../scripts/release/release-metadata.mjs";
import { createTaggedReleaseRepository } from "./helpers/git-repository.mjs";

const comparison = (directory, previous, version) =>
  `## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/compare/${directory}-v${previous}...${directory}-v${version}) (2026-09-25)`;
const firstRelease = (directory, version) =>
  `## [${version}](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/${directory}-v${version}) (2026-09-25)`;

describe("exact CHANGELOG section", () => {
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
  it("preserves CRLF bytes and does not trim the terminal section", () => {
    const text = `${comparison(directory, "1.0.0", "1.0.1")}\r\n\r\nbody  \r\n\r\n`;
    expect(scan(text)).toBe(text);
    expect(scan(`${text}## [0.0.9] (older)\r\n`)).toBe(text);
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
  it("finds exact first-tag bytes with CRLF and fences", () => {
    const section = `${heading}\r\n\r\nReviewed first notes.  \r\n\r\n`;
    const text = `# Changelog\r\n\r\n~~~~markdown\r\n${heading}\r\n~~~~\r\n\`\`\`\`markdown\r\n\`\`\`\r\n${heading}\r\n\`\`\`\r\n\`\`\`\`\r\n${section}## [0.0.9] (inherited)\r\n`;
    expect(findReleaseSection(text, tag, directory)).toBe(section);
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

describe("tagged CHANGELOG reader", () => {
  it("reads the selected tag, not HEAD, without trimming CRLF or trailing whitespace", () => {
    const repo = createTaggedReleaseRepository();
    const directory = "demo";
    const tag = "demo-v1.2.3";
    const section = `${firstRelease(directory, "1.2.3")}\r\n\r\nTagged body.  \r\n\r\n`;
    const folder = path.join(repo.dir, "packages", directory);
    const file = path.join(folder, "CHANGELOG.md");
    try {
      mkdirSync(folder, { recursive: true });
      writeFileSync(file, `# Changelog\r\n\r\n${section}`);
      repo.git("add", ".");
      repo.git("commit", "-m", "test: tagged changelog");
      repo.git("tag", tag);
      writeFileSync(file, `${firstRelease(directory, "9.9.9")}\nHEAD body.\n`);
      repo.git("add", ".");
      repo.git("commit", "-m", "test: moving HEAD");
      expect(
        readTaggedReleaseSection({
          repo: repo.dir,
          tag,
          packageDirectory: directory,
        }),
      ).toBe(section);
    } finally {
      repo.dispose();
    }
  });
});
