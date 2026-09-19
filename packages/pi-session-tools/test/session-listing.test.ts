import { describe, expect, it } from "vitest";
import { formatListingSummary, formatListingText } from "#src/session-listing";

const DIR = "/Users/chris/.pi/agent/sessions/--Users-chris-peer--";

describe("formatListingText", () => {
  it("reports no session files found for an empty listing", () => {
    expect(formatListingText(DIR, [], 0)).toBe(
      `Session directory: ${DIR}\nNo session files found.`,
    );
  });

  it("uses the singular count line for one file", () => {
    expect(formatListingText(DIR, [`${DIR}/a.jsonl`], 1)).toBe(
      `Session directory: ${DIR}\n1 session file, newest first:\n  ${DIR}/a.jsonl`,
    );
  });

  it("uses the plural count line and indents every path", () => {
    expect(
      formatListingText(DIR, [`${DIR}/b.jsonl`, `${DIR}/a.jsonl`], 2),
    ).toBe(
      `Session directory: ${DIR}\n2 session files, newest first:\n  ${DIR}/b.jsonl\n  ${DIR}/a.jsonl`,
    );
  });
});

describe("formatListingSummary", () => {
  it("uses the singular noun for one file", () => {
    expect(formatListingSummary(DIR, 1)).toBe(`1 session file in ${DIR}`);
  });

  it("uses the plural noun for several files", () => {
    expect(formatListingSummary(DIR, 2)).toBe(`2 session files in ${DIR}`);
  });

  it("reports zero files with the plural noun", () => {
    expect(formatListingSummary(DIR, 0)).toBe(`0 session files in ${DIR}`);
  });
});
