import { describe, expect, it } from "vitest";

import { maskCode } from "../../scripts/lint/unicode-escapes.mjs";

/** `count` spaces, for spelling a masked region without miscounting it. */
function blank(count) {
  return " ".repeat(count);
}

describe("maskCode", () => {
  // A backtick fence's content includes a blank line in each case below: an
  // inline span cannot cross one, so only the fence logic can blank it.
  describe("fenced blocks", () => {
    it("blanks a backtick fence and everything inside it", () => {
      const text = "a\n```js\nx \\u2014\n\ny\n```\nb";

      expect(maskCode(text)).toBe(
        `a\n${blank(5)}\n${blank(8)}\n\n${blank(1)}\n${blank(3)}\nb`,
      );
    });

    it("blanks a tilde fence", () => {
      const text = "~~~\nx\n~~~\nb";

      expect(maskCode(text)).toBe(`${blank(3)}\n${blank(1)}\n${blank(3)}\nb`);
    });

    it("stays open past a closing run shorter than the opener", () => {
      const text = "````markdown\n```\nx\n\ny\n````\nb";

      expect(maskCode(text)).toBe(
        `${blank(12)}\n${blank(3)}\n${blank(1)}\n\n${blank(1)}\n${blank(4)}\nb`,
      );
    });

    it("recognizes a fence indented inside a list item", () => {
      const text = "1. a\n\n   ```bash\n   x\n\n   y\n   ```\nb";

      expect(maskCode(text)).toBe(
        `1. a\n\n${blank(10)}\n${blank(4)}\n\n${blank(4)}\n${blank(6)}\nb`,
      );
    });

    it("runs an unclosed fence to the end of the text", () => {
      const text = "a\n```\nx\n\ny";

      expect(maskCode(text)).toBe(`a\n${blank(3)}\n${blank(1)}\n\n${blank(1)}`);
    });

    it("does not read a backtick line with a backtick in its info string as a fence", () => {
      const text = "```a```\nb";

      expect(maskCode(text)).toBe(`${blank(7)}\nb`);
    });
  });

  describe("inline code spans", () => {
    it("blanks a single-backtick span", () => {
      expect(maskCode("a `x` b")).toBe(`a ${blank(3)} b`);
    });

    it("closes a span only on a run of the opener's exact length", () => {
      expect(maskCode("a ``x ` y`` b")).toBe(`a ${blank(9)} b`);
    });

    it("skips a longer run inside a span rather than closing on it", () => {
      expect(maskCode("a `x `` y` b")).toBe(`a ${blank(8)} b`);
    });

    it("leaves an unmatched backtick as literal text", () => {
      expect(maskCode("a ` b")).toBe("a ` b");
    });

    it("continues a span over a single line break", () => {
      expect(maskCode("a `x\ny` b")).toBe(`a ${blank(2)}\n${blank(2)} b`);
    });

    it("does not continue a span across a blank line", () => {
      expect(maskCode("a `x\n\ny` b")).toBe("a `x\n\ny` b");
    });

    it("reads a backslash-escaped backtick as a literal, not an opener", () => {
      expect(maskCode("\\`x` y`z`")).toBe(`\\\`x${blank(4)}z\``);
    });
  });

  it("preserves the text's length and every line break", () => {
    const text = "p `q`\n```\nr\n```\ns ``t``\n";
    const masked = maskCode(text);

    expect(masked.length).toBe(text.length);
    expect(lineBreaks(masked)).toEqual(lineBreaks(text));
  });
});

/** The offset of every line feed in `text`. */
function lineBreaks(text) {
  return [...text.matchAll(/\n/g)].map((match) => match.index);
}
