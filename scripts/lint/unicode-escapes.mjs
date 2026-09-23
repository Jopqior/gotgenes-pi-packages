#!/usr/bin/env node
// Rejects literal Unicode escapes in the prose of markdown files.
//
// A model's em-dash can reach a file as the six visible characters of its
// escape rather than the character itself -- #859, #960, and #962 each
// committed or nearly committed one. It is valid markdown, so rumdl passes it,
// and it contains no control character, so invisible-characters.mjs passes it
// too.
//
// Code is exempt: the documents that teach this rule quote the escape in
// backticks on purpose, so the scan blanks inline code spans and fenced
// blocks before it looks.

/**
 * `text` with fenced code blocks and inline code spans blanked to spaces.
 *
 * Every masked character becomes a space and every line feed is kept, so an
 * offset into the result is the same offset into `text`.
 *
 * @param {string} text
 * @returns {string}
 */
export function maskCode(text) {
  return maskCodeSpans(maskFencedBlocks(text));
}

/**
 * `text` with every fenced block, its fence lines included, blanked.
 *
 * A fence opens at any indentation -- this repository nests them in list
 * items -- and closes on a run of the same character at least as long. An
 * unclosed fence runs to the end, as in CommonMark.
 *
 * @param {string} text
 * @returns {string}
 */
function maskFencedBlocks(text) {
  let fence = null;
  const lines = text.split("\n").map((line) => {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      return blankOut(line);
    }
    fence = openingFence(line);
    return fence ? blankOut(line) : line;
  });
  return lines.join("\n");
}

/**
 * The fence a line opens, or null when it opens none.
 *
 * A backtick fence's info string cannot contain a backtick, which is what
 * keeps an inline span such as a tripled-backtick word from reading as one.
 *
 * @param {string} line
 * @returns {{character: string, length: number} | null}
 */
function openingFence(line) {
  const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;
  const [, run, infoString] = match;
  if (run[0] === "`" && infoString.includes("`")) return null;
  return { character: run[0], length: run.length };
}

/**
 * @param {string} line
 * @param {{character: string, length: number}} fence
 * @returns {boolean}
 */
function closesFence(line, fence) {
  const match = /^\s*(`+|~+)\s*$/.exec(line);
  if (!match) return false;
  const run = match[1];
  return run[0] === fence.character && run.length >= fence.length;
}

/**
 * `text` with every inline code span blanked.
 *
 * A span opens on a backtick run and closes on the next run of exactly the
 * same length within its paragraph. An unmatched run stays literal, and a
 * backslash before punctuation makes that character literal, so an escaped
 * backtick opens nothing.
 *
 * @param {string} text
 * @returns {string}
 */
function maskCodeSpans(text) {
  let result = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] === "\\" && isAsciiPunctuation(text[index + 1])) {
      result += text.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (text[index] !== "`") {
      result += text[index];
      index += 1;
      continue;
    }
    const openerEnd = backtickRunEnd(text, index);
    const spanEnd = closingRunEnd(text, openerEnd, openerEnd - index);
    const end = spanEnd ?? openerEnd;
    const run = text.slice(index, end);
    result += spanEnd === null ? run : blankOut(run);
    index = end;
  }
  return result;
}

/**
 * The offset just past the run of backticks that starts at `start`.
 *
 * @param {string} text
 * @param {number} start
 * @returns {number}
 */
function backtickRunEnd(text, start) {
  let end = start;
  while (text[end] === "`") end += 1;
  return end;
}

/**
 * The offset just past the run that closes a span, or null when none does.
 *
 * The search stops at a blank line, which ends the paragraph.
 *
 * @param {string} text
 * @param {number} from
 * @param {number} length
 * @returns {number | null}
 */
function closingRunEnd(text, from, length) {
  let index = from;
  while (index < text.length) {
    if (text[index] === "\n" && startsBlankLine(text, index + 1)) return null;
    if (text[index] !== "`") {
      index += 1;
      continue;
    }
    const end = backtickRunEnd(text, index);
    if (end - index === length) return end;
    index = end;
  }
  return null;
}

/**
 * Whether the line starting at `start` holds only spaces and tabs.
 *
 * @param {string} text
 * @param {number} start
 * @returns {boolean}
 */
function startsBlankLine(text, start) {
  const end = text.indexOf("\n", start);
  const line = text.slice(start, end === -1 ? text.length : end);
  return /^[ \t]*$/.test(line);
}

/**
 * @param {string | undefined} character
 * @returns {boolean}
 */
function isAsciiPunctuation(character) {
  return character !== undefined && /^[!-/:-@[-`{-~]$/.test(character);
}

/**
 * `text` with every character except a line feed replaced by a space.
 *
 * @param {string} text
 * @returns {string}
 */
function blankOut(text) {
  return text.replace(/[^\n]/g, " ");
}
