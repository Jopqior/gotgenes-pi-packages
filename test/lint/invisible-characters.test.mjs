import { describe, expect, it } from "vitest";

import {
  findInvisibleCharacters,
  formatFinding,
  isBinary,
  scanFiles,
} from "../../scripts/lint/invisible-characters.mjs";

// Every fixture builds its invisible characters from escapes. A literal byte
// here would make this file fail the very scan it tests.
const FORM_FEED = String.fromCodePoint(0x0c);
const DEL = String.fromCodePoint(0x7f);
const NUL = String.fromCodePoint(0x00);
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
const ZERO_WIDTH_NON_JOINER = String.fromCodePoint(0x200c);
const ZERO_WIDTH_JOINER = String.fromCodePoint(0x200d);
const WORD_JOINER = String.fromCodePoint(0x2060);
const BYTE_ORDER_MARK = String.fromCodePoint(0xfeff);
const NON_BREAKING_SPACE = String.fromCodePoint(0x00a0);

/** A finding with the fields a caller reads, for `toEqual` comparison. */
function finding(line, column, codePoint, repairable) {
  return { line, column, codePoint, repairable };
}

describe("findInvisibleCharacters", () => {
  describe("characters that are never repairable", () => {
    it("reports a form feed with its position and code point", () => {
      expect(findInvisibleCharacters(`a${FORM_FEED}b`)).toEqual([
        finding(1, 2, 0x0c, false),
      ]);
    });

    it("reports a delete character", () => {
      expect(findInvisibleCharacters(`a${DEL}b`)).toEqual([
        finding(1, 2, 0x7f, false),
      ]);
    });

    it("reports a NUL", () => {
      expect(findInvisibleCharacters(`a${NUL}b`)).toEqual([
        finding(1, 2, 0x00, false),
      ]);
    });

    it("reports a zero-width non-joiner without offering to repair it", () => {
      expect(findInvisibleCharacters(ZERO_WIDTH_NON_JOINER)).toEqual([
        finding(1, 1, 0x200c, false),
      ]);
    });

    it("reports a zero-width joiner without offering to repair it", () => {
      expect(findInvisibleCharacters(ZERO_WIDTH_JOINER)).toEqual([
        finding(1, 1, 0x200d, false),
      ]);
    });

    it("reports a word joiner without offering to repair it", () => {
      expect(findInvisibleCharacters(WORD_JOINER)).toEqual([
        finding(1, 1, 0x2060, false),
      ]);
    });
  });

  describe("characters deletion repairs", () => {
    it("marks a zero-width space repairable", () => {
      expect(findInvisibleCharacters(`a${ZERO_WIDTH_SPACE}b`)).toEqual([
        finding(1, 2, 0x200b, true),
      ]);
    });

    it("marks a byte order mark repairable", () => {
      expect(findInvisibleCharacters(`${BYTE_ORDER_MARK}a`)).toEqual([
        finding(1, 1, 0xfeff, true),
      ]);
    });
  });

  describe("characters that are permitted", () => {
    it("reports nothing for tab, line feed, and carriage return", () => {
      expect(findInvisibleCharacters("a\tb\nc\rd")).toEqual([]);
    });

    it("reports nothing for a non-breaking space", () => {
      expect(findInvisibleCharacters(`e.g.${NON_BREAKING_SPACE}biome`)).toEqual(
        [],
      );
    });

    it("reports nothing for ordinary prose", () => {
      expect(findInvisibleCharacters("A sentence — with an em dash.")).toEqual(
        [],
      );
    });
  });

  describe("positions", () => {
    it("numbers columns from one within each line", () => {
      expect(
        findInvisibleCharacters(`clean\nbad${FORM_FEED}\nalso clean`),
      ).toEqual([finding(2, 4, 0x0c, false)]);
    });

    it("reports every occurrence on a line in column order", () => {
      expect(
        findInvisibleCharacters(`${FORM_FEED}a${ZERO_WIDTH_SPACE}`),
      ).toEqual([finding(1, 1, 0x0c, false), finding(1, 3, 0x200b, true)]);
    });

    it("counts a column in code points, not UTF-16 units", () => {
      // The emoji is one code point but two UTF-16 units, so a UTF-16 index
      // would report column 3 for a character that is second on the line.
      expect(findInvisibleCharacters(`\u{1f389}${FORM_FEED}`)).toEqual([
        finding(1, 2, 0x0c, false),
      ]);
    });
  });
});

describe("isBinary", () => {
  it("is true for a buffer containing a NUL", () => {
    expect(isBinary(Buffer.from([0x89, 0x50, 0x00, 0x0c]))).toBe(true);
  });

  it("is false for UTF-8 text with multi-byte characters", () => {
    expect(isBinary(Buffer.from("a — b\n", "utf8"))).toBe(false);
  });

  it("is false for an empty buffer", () => {
    expect(isBinary(Buffer.alloc(0))).toBe(false);
  });
});

describe("formatFinding", () => {
  it("names the path, line, column, and code point", () => {
    expect(formatFinding("docs/x.md", finding(3, 7, 0x0c, false))).toBe(
      "docs/x.md:3:7: U+000C",
    );
  });

  it("pads a code point to four hexadecimal digits", () => {
    expect(formatFinding("a.ts", finding(1, 1, 0x00, false))).toBe(
      "a.ts:1:1: U+0000",
    );
  });

  it("renders a code point above the C0 range", () => {
    expect(formatFinding("a.ts", finding(1, 2, 0x200b, true))).toBe(
      "a.ts:1:2: U+200B",
    );
  });
});

describe("scanFiles", () => {
  /** A reader over an in-memory tree, standing in for `readFileSync`. */
  function reader(tree) {
    return (path) => tree[path];
  }

  it("attaches the path to every finding", () => {
    const { findings } = scanFiles(
      ["a.md", "b.md"],
      reader({
        "a.md": Buffer.from(`x${FORM_FEED}`, "utf8"),
        "b.md": Buffer.from(`y${ZERO_WIDTH_SPACE}`, "utf8"),
      }),
    );

    expect(findings).toEqual([
      { path: "a.md", ...finding(1, 2, 0x0c, false) },
      { path: "b.md", ...finding(1, 2, 0x200b, true) },
    ]);
  });

  it("skips a binary file", () => {
    const { findings } = scanFiles(
      ["demo.mp4"],
      reader({ "demo.mp4": Buffer.from([0x00, 0x0c, 0x0c]) }),
    );

    expect(findings).toEqual([]);
  });

  it("reports nothing for a clean tree", () => {
    const { findings } = scanFiles(
      ["a.md"],
      reader({ "a.md": Buffer.from("clean prose\n", "utf8") }),
    );

    expect(findings).toEqual([]);
  });
});
