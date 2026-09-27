#!/usr/bin/env node
// Recording is composed at the sole supported fork boundary; shared record
// logic receives its selected directory and committed evidence location.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordForkSync } from "./fork-sync/record.mjs";
import { ForkSyncError, isReleaseLevel } from "./fork-sync/values.mjs";
import { forkSyncTarget } from "./pi-subagents/config.mjs";

function main() {
  const args = process.argv.slice(2);
  /** @type {Record<string, string>} */
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (["--repo", "--merge", "--fork-level", "--rationale"].includes(arg)) {
      const value = args[i + 1];
      if (value === undefined) {
        process.stderr.write(`error: ${arg} requires a value\n`);
        process.exit(1);
      }
      options[arg.slice(2)] = value;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: record-fork-sync.mjs --repo <path> --merge <oid>",
          "       --fork-level <none|patch|minor|major> --rationale <text>",
          "",
          `Appends a reviewed sync record to ${forkSyncTarget.statePath}.`,
          "Run through scripts/upstream-sync.sh --record-fork-sync, which supplies",
          "the upstream identity and no-tag safeguards. Never pushes.",
          "",
        ].join("\n"),
      );
      return;
    } else {
      process.stderr.write(`error: unknown argument '${arg}'\n`);
      process.exit(1);
    }
  }
  const missing = ["repo", "merge", "fork-level", "rationale"].filter(
    (name) => !options[name],
  );
  if (missing.length > 0) {
    for (const name of missing) {
      process.stderr.write(`error: --${name} is required (see --help)\n`);
    }
    process.exit(1);
  }
  if (!isReleaseLevel(options["fork-level"])) {
    process.stderr.write(
      "error: --fork-level must be one of none, patch, minor, major\n",
    );
    process.exit(1);
  }

  try {
    recordForkSync(
      options.repo,
      path.join(options.repo, forkSyncTarget.statePath),
      forkSyncTarget.directory,
      {
        merge: options.merge,
        forkLevel: /** @type {"none" | "patch" | "minor" | "major"} */ (
          options["fork-level"]
        ),
        rationale: options.rationale,
      },
    );
  } catch (error) {
    const message =
      error instanceof ForkSyncError ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
