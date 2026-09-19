/**
 * session-listing.ts — Presentation for `list_session_files`.
 *
 * Owns the two strings the tool renders from a directory's session files:
 * the transcript-style text body the model reads, and the one-line phrase
 * the collapsed TUI row shows. Both are pure functions of the path list and
 * the true file total, so neither can disagree with the other.
 */

/** Text body: directory line, count line, one indented path per entry. */
export function formatListingText(
  directory: string,
  paths: string[],
  total: number,
): string {
  const header = `Session directory: ${directory}`;
  if (total === 0) return `${header}\nNo session files found.`;
  const countLine = `${formatFileCount(total)}, newest first:`;
  return [header, countLine, ...paths.map((p) => `  ${p}`)].join("\n");
}

/** Collapsed TUI row phrase, without theme colouring or the expand hint. */
export function formatListingSummary(directory: string, total: number): string {
  return `${formatFileCount(total)} in ${directory}`;
}

function formatFileCount(total: number): string {
  return total === 1 ? "1 session file" : `${total} session files`;
}
