#!/usr/bin/env node
// Offline release prediction for the sole supported fork package. Shared
// decision logic receives explicit package identity and state location.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decideForkRelease } from "./fork-sync/decision.mjs";
import { ForkSyncError } from "./fork-sync/values.mjs";
import { forkSyncTarget } from "./pi-subagents/config.mjs";

function main() {
  const args = process.argv.slice(2);
  /** @type {string | null} */
  let repo = null;
  /** @type {string | null} */
  let current = null;
  /** @type {string | undefined} */
  let statePath;
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
      if (statePath === undefined) {
        process.stderr.write("error: --state requires a path\n");
        process.exit(1);
      }
      i++;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--") {
      cliffArgs.push(...args.slice(i + 1));
      break;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        [
          "Usage: fork-sync.mjs --repo <path> --current <tag> [--state <path>] [--json] -- <git-cliff args>",
          "",
          "Prints the next pi-subagents-v<version> tag, or nothing when no fork",
          "release is pending. Arguments after -- are git-cliff scoping flags",
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
    const decision = decideForkRelease({
      repo,
      currentTag: current,
      cliffArgs,
      statePath: statePath ?? path.join(repo, forkSyncTarget.statePath),
      packageDirectory: forkSyncTarget.directory,
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
