#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ForkSyncError } from "./fork-sync/values.mjs";
import { forkSyncTarget as core } from "./pi-subagents/config.mjs";
import { forkSyncTarget as worktrees } from "./pi-subagents-worktrees/config.mjs";

/**
 * Fixed location support, not release registration or publication permission.
 * @param {string} directory
 * @returns {Readonly<{ directory: string, statePath: string, correspondencePath: string }> | null}
 */
export function resolveForkSyncTarget(directory) {
  return (
    [core, worktrees].find((target) => target.directory === directory) ?? null
  );
}

/** @param {string} directory */
export function requireForkSyncTarget(directory) {
  const target = resolveForkSyncTarget(directory);
  if (!target) {
    throw new ForkSyncError(
      `unsupported fork sync package ${JSON.stringify(directory)}`,
    );
  }
  return target;
}

function main() {
  const args = process.argv.slice(2);
  const usage = "Usage: fork-sync-targets.mjs <package-directory>\n";
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    process.stdout.write(usage);
  } else if (args.length !== 1 || args[0].startsWith("-")) {
    process.stderr.write(usage);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${JSON.stringify(resolveForkSyncTarget(args[0]))}\n`);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
