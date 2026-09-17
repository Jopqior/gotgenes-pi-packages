#!/usr/bin/env node
// Word counts of agent-facing documentation over time, from git history.
//
// Emits one CSV row per weekly snapshot of HEAD, splitting the corpus into the
// four classes that cost context differently: AGENTS.md is loaded in every
// session, skills load on demand, prompt templates expand at invocation, and
// subagent definitions load only in a dispatched child.
//
// Paths are matched repo-wide so the pre-consolidation layout (a per-package
// AGENTS.md and .pi/ directory, before mid-May 2026) is counted too. Snapshots
// that land mid-migration read low for a week; that is history, not a bug.
//
// Usage: node scripts/agent-docs/doc-growth.mjs [--since YYYY-MM-DD] [--every-days N]

import { execFileSync } from "node:child_process";

const DAY_MS = 86_400_000;

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (error) {
    if (allowFailure) return "";
    throw error;
  }
}

function parseArgs(argv) {
  const options = { since: "2026-04-21", everyDays: 7 };
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1];
    if (argv[i] === "--since") options.since = value;
    else if (argv[i] === "--every-days") options.everyDays = Number(value);
    else throw new Error(`unknown option: ${argv[i]}`);
  }
  return options;
}

function classify(path) {
  if (path.includes("node_modules/")) return null;
  if (path === "AGENTS.md" || path.endsWith("/AGENTS.md")) return "agents_md";
  if (/(^|\/)skills\/[^/]+\/SKILL\.md$/.test(path)) return "skills";
  if (/(^|\/)\.pi\/agents\/[^/]+\.md$/.test(path)) return "subagent_defs";
  if (/(^|\/)prompts\/.+\.md$/.test(path)) return "prompts";
  return null;
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function snapshotDates(since, everyDays) {
  const dates = [];
  const end = Date.now();
  for (
    let t = Date.parse(`${since}T00:00:00Z`);
    t <= end;
    t += everyDays * DAY_MS
  ) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

function measure(sha) {
  const totals = { agents_md: 0, skills: 0, prompts: 0, subagent_defs: 0 };
  for (const path of git(["ls-tree", "-r", "--name-only", sha]).split("\n")) {
    const bucket = classify(path);
    if (!bucket) continue;
    totals[bucket] += countWords(
      git(["show", `${sha}:./${path}`], { allowFailure: true }),
    );
  }
  return totals;
}

const { since, everyDays } = parseArgs(process.argv.slice(2));
const columns = ["agents_md", "skills", "prompts", "subagent_defs"];
process.stdout.write(`date,sha,${columns.join(",")},total\n`);

for (const date of snapshotDates(since, everyDays)) {
  const sha = git([
    "rev-list",
    "-1",
    `--before=${date}T23:59:59Z`,
    "HEAD",
  ]).trim();
  if (!sha) continue;
  const totals = measure(sha);
  const total = columns.reduce((sum, key) => sum + totals[key], 0);
  const cells = columns.map((key) => totals[key]).join(",");
  process.stdout.write(`${date},${sha.slice(0, 12)},${cells},${total}\n`);
}
