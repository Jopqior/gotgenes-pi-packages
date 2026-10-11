import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const fork = "Jopqior/gotgenes-pi-packages";
const upstream = "gotgenes/pi-packages";

function gh(args) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || result.error?.message || "GitHub query failed",
    );
  }
  return result.stdout.trim();
}

function lookup(target) {
  const pages = JSON.parse(
    gh([
      "api",
      "--paginate",
      "--slurp",
      `repos/${fork}/issues?state=all&per_page=100`,
    ]),
  );
  if (!Array.isArray(pages) || !pages.every(Array.isArray))
    throw new Error("Incomplete issue pages");
  const line = `Upstream target: ${upstream}@${target}`;
  const matches = pages
    .flat()
    .filter(
      (issue) =>
        issue.pull_request == null &&
        (issue.body ?? "")
          .split("\n")
          .map((value) => value.replace(/\r$/, ""))
          .includes(line),
    )
    .map(({ number, state, html_url }) => ({ number, state, html_url }));
  return { target, matches };
}

function printLookup(result) {
  console.log(JSON.stringify(result));
}

function main() {
  const mode = process.env.ENTRY_MODE ?? "lookup";
  if (mode !== "lookup" && mode !== "create")
    throw new Error("Unknown entry mode");
  if (
    gh([
      "repo",
      "view",
      "--json",
      "nameWithOwner",
      "--jq",
      ".nameWithOwner",
    ]) !== fork
  ) {
    throw new Error("Unexpected GitHub repository");
  }
  const target =
    mode === "lookup"
      ? gh(["api", `repos/${upstream}/commits/main`, "--jq", ".sha"])
      : process.env.TARGET;
  if (!/^[0-9a-f]{40}$/.test(target ?? ""))
    throw new Error("Invalid upstream target");
  if (mode === "create") {
    const lines = readFileSync(process.env.ISSUE_BODY_FILE, "utf8")
      .split("\n")
      .map((value) => value.replace(/\r$/, ""));
    if (!lines.includes(`Upstream target: ${upstream}@${target}`))
      throw new Error("Issue body target mismatch");
  }
  const result = lookup(target);
  if (mode === "lookup" || result.matches.length !== 0) {
    printLookup(result);
    return;
  }
  // This final all-state recheck is non-atomic: independent creators can race.
  let created;
  try {
    created = gh([
      "issue",
      "create",
      "--repo",
      fork,
      "--label",
      "scope:repo",
      "--title",
      `Sync ${upstream}@${target}`,
      "--body-file",
      process.env.ISSUE_BODY_FILE,
    ]);
  } catch {
    // An unsuccessful response does not prove that the mutation failed.
  }
  const match =
    /^https:\/\/github\.com\/Jopqior\/gotgenes-pi-packages\/issues\/([1-9][0-9]*)$/.exec(
      created ?? "",
    );
  if (match) {
    console.log(`${created}\n/plan-issue ${match[1]}`);
    return;
  }
  console.error(
    "Ambiguous create result; inspect lookup before any separately approved retry",
  );
  try {
    printLookup(lookup(target));
  } catch {
    throw new Error("Recovery lookup failed; stop");
  }
  process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
