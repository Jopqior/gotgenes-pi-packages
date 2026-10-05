#!/usr/bin/env node
// Recording is composed at a fixed supported fork boundary; shared record
// logic receives its selected directory and committed evidence location.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordForkSync } from "./fork-sync/record.mjs";
import { ForkSyncError, isReleaseLevel } from "./fork-sync/values.mjs";
import { requireForkSyncTarget } from "./fork-sync-targets.mjs";

function main() {
  const args = process.argv.slice(2);
  /** @type {Record<string, string>} */
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (
      [
        "--repo",
        "--merge",
        "--fork-level",
        "--rationale",
        "--package",
      ].includes(arg)
    ) {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        process.stderr.write(`error: ${arg} requires a value\n`);
        process.exit(1);
      }
      if (arg === "--package" && options.package !== undefined) {
        process.stderr.write("error: --package cannot be repeated\n");
        process.exit(1);
      }
      options[arg.slice(2)] = value;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: record-fork-sync.mjs --repo <path> --merge <oid> [--package <directory>]",
          "       --fork-level <none|patch|minor|major> --rationale <text>",
          "",
          "Appends a reviewed sync record to the selected package's state.",
          "--package defaults to pi-subagents; pi-subagents-worktrees is also supported.",
          "Each package requires its own explicit review level and rationale.",
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
    (name) => !options[name]?.trim(),
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
    const target = requireForkSyncTarget(options.package ?? "pi-subagents");
    recordForkSync(
      options.repo,
      path.join(options.repo, target.statePath),
      target.directory,
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
