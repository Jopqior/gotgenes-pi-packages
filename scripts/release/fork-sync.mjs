#!/usr/bin/env node
// Offline release prediction for a selected supported fork package. Shared
// decision logic receives explicit package identity and state location.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decideForkRelease } from "./fork-sync/decision.mjs";
import { ForkSyncError, parseStrictSemVer } from "./fork-sync/values.mjs";
import { requireForkSyncTarget } from "./fork-sync-targets.mjs";

function main() {
  const args = process.argv.slice(2);
  /** @type {string | null} */
  let repo = null;
  /** @type {string | null} */
  let current = null;
  /** @type {string | undefined} */
  let statePath;
  let packageDirectory = "pi-subagents";
  let packageSelected = false;
  let json = false;
  /** @type {string[]} */
  const cliffArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--repo") {
      repo = args[++i] ?? null;
    } else if (arg === "--current") {
      current = args[++i] ?? null;
    } else if (arg === "--state") {
      statePath = args[i + 1];
      if (!statePath || statePath.startsWith("--")) {
        process.stderr.write("error: --state requires a path\n");
        process.exit(1);
      }
      i++;
    } else if (arg === "--package") {
      const directory = args[++i];
      if (packageSelected || !directory || directory.startsWith("-")) {
        process.stderr.write(
          "error: --package requires one directory and cannot be repeated\n",
        );
        process.exit(1);
      }
      packageSelected = true;
      packageDirectory = directory;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--") {
      cliffArgs.push(...args.slice(i + 1));
      break;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: fork-sync.mjs --repo <path> --current <tag> [--package <directory>] [--state <path>] [--json] -- <git-cliff args>",
          "",
          "Prints the selected package's next tag, or nothing when no fork",
          "release is pending. --package defaults to pi-subagents; --state",
          "overrides its evidence path. Arguments after -- are git-cliff scoping flags",
          "forwarded verbatim. Exits nonzero on evidence failure.",
          "",
        ].join("\n"),
      );
      return;
    } else {
      process.stderr.write(`error: unknown argument '${arg}'\n`);
      process.exit(1);
    }
  }
  if (!repo || !current) {
    process.stderr.write(
      "error: --repo and --current are required (see --help)\n",
    );
    process.exit(1);
  }

  try {
    const target = requireForkSyncTarget(packageDirectory);
    const prefix = `${target.directory}-v`;
    if (
      !current.startsWith(prefix) ||
      !parseStrictSemVer(current.slice(prefix.length))
    ) {
      throw new ForkSyncError(`invalid package release tag ${current}`);
    }
    const decision = decideForkRelease({
      repo,
      currentTag: current,
      cliffArgs,
      statePath: statePath ?? path.join(repo, target.statePath),
      packageDirectory: target.directory,
    });
    if (json) {
      process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
    } else if (decision.nextTag) {
      process.stdout.write(`${decision.nextTag}\n`);
    }
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
