import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseCliffContext } from "../../scripts/release/core-sync-cliff.mjs";
import {
  BASE_TAG,
  createCoreSyncScenario,
} from "./helpers/core-sync-scenario.mjs";

// The git-cliff adapter contract: the JSON context shape the decision
// accepts, and fail-closed behavior when that shape is malformed.
//
// The process cases below tamper with git-cliff's `--context` output through
// a PATH adapter. The tampering is synthetic: the real git-cliff (2.14.1) has
// not been observed emitting these shapes. The residual risk being pinned is
// exactly version drift — a future git-cliff emitting an unexpected shape
// must fail loudly here rather than silently discarding retained fork
// commits.

/** @type {ReturnType<typeof createCoreSyncScenario>} */
let scenario;
/** @type {ReturnType<typeof createCoreSyncScenario>["repo"]} */
let repo;
/** @type {ReturnType<typeof createCoreSyncScenario>["writeCoreSyncState"]} */
let writeCoreSyncState;
/** @type {ReturnType<typeof createCoreSyncScenario>["syncUpstream"]} */
let syncUpstream;

const repoRoot = path.resolve(import.meta.dirname, "../..");
const CORE_ARGS = () => repo.cliffArgs("pi-subagents");

beforeEach(() => {
  scenario = createCoreSyncScenario();
  repo = scenario.repo;
  writeCoreSyncState = scenario.writeCoreSyncState;
  syncUpstream = scenario.syncUpstream;
});

afterEach(() => {
  scenario.dispose();
});

/**
 * @param {string} message
 * @returns {Error}
 */
function errorOf(fn) {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error("expected the call to throw, but it returned");
}

/** A minimal well-formed context for one unreleased window. */
const validContext = () => [
  {
    previous: { version: BASE_TAG },
    commits: [
      { id: "a".repeat(40), message: "feat(pi-subagents)!: fork break" },
    ],
  },
];

describe("parseCliffContext", () => {
  it("accepts a well-formed context anchored at the current tag", () => {
    const entries = parseCliffContext(validContext(), BASE_TAG);
    expect(entries).toHaveLength(1);
    expect(entries[0].commits).toHaveLength(1);
    expect(entries[0].commits[0]).toMatchObject({
      id: "a".repeat(40),
    });
  });

  it("rejects a non-array top-level context", () => {
    const wrapped = /** @type {unknown} */ ({
      releases: validContext(),
    });
    expect(errorOf(() => parseCliffContext(wrapped, BASE_TAG)).message).toMatch(
      /is not an array/,
    );
  });

  it("rejects a non-object context entry", () => {
    const context = [...validContext(), "not-an-object"];
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /git-cliff context entry 1 is not an object/,
    );
  });

  it("rejects a commit that is not an object", () => {
    const context = validContext();
    context[0].commits = ["not-an-object"];
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /commit 0 is not an object/,
    );
  });

  it("rejects a commit id that is not a string", () => {
    const missing = validContext();
    missing[0].commits = [{ message: "no id field" }];
    expect(errorOf(() => parseCliffContext(missing, BASE_TAG)).message).toMatch(
      /non-string id/,
    );

    const numeric = validContext();
    numeric[0].commits = [{ id: 42, message: "numeric id" }];
    expect(errorOf(() => parseCliffContext(numeric, BASE_TAG)).message).toMatch(
      /non-string id/,
    );
  });

  it("rejects a commit id that is not full 40-hex", () => {
    const context = validContext();
    context[0].commits = [{ id: "short", message: "malformed oid" }];
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /not a full 40-hex object ID/,
    );
  });

  it("rejects a context not anchored at a previous release", () => {
    const context = validContext();
    delete context[0].previous;
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /not anchored at a previous release/,
    );
  });

  it("rejects a context anchored at a different tag", () => {
    const context = validContext();
    context[0].previous = { version: "pi-subagents-v2.0.0" };
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /anchored at "pi-subagents-v2\.0\.0" instead of/,
    );
  });

  it("rejects a release boundary inside the window", () => {
    const context = validContext();
    context[0].version = "pi-subagents-v1.1.0";
    expect(errorOf(() => parseCliffContext(context, BASE_TAG)).message).toMatch(
      /unexpected release boundary "pi-subagents-v1\.1\.0" inside/,
    );
  });
});

describe("git-cliff context adapter (synthetic PATH tampering)", () => {
  const realGitCliff = execFileSync("which", ["git-cliff"], {
    encoding: "utf8",
  }).trim();

  /**
   * Build the probe graph: one 21.7.0 → 21.7.1 sync plus a retained fork
   * breaking commit. The clean-PATH truth is a fork major (2.0.0); every
   * tamper that silently drops the breaking commit must fail closed instead.
   */
  function syncAndForkBreak() {
    syncUpstream({ version: "21.7.1" });
    repo.commitInScope(
      "feat(pi-subagents)!: fork break",
      "packages/pi-subagents/break.txt",
    );
    writeCoreSyncState();
  }

  const transformSource = [
    "const chunks = [];",
    "process.stdin.on('data', (chunk) => chunks.push(chunk));",
    "process.stdin.on('end', () => {",
    "  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));",
    "  const mode = process.argv[2];",
    "  let out;",
    "  if (mode === 'wrap') {",
    "    out = { releases: parsed };",
    "  } else if (mode === 'empty') {",
    "    out = [];",
    "  } else {",
    "    for (const entry of parsed) {",
    "      if (!Array.isArray(entry.commits)) continue;",
    "      entry.commits = entry.commits.map((commit) =>",
    "        typeof commit === 'object' &&",
    "        commit !== null &&",
    "        /fork break/.test(String(commit.message))",
    "          ? mode === 'badid'",
    "            ? { ...commit, id: 42 }",
    "            : 'not-an-object'",
    "          : commit,",
    "      );",
    "    }",
    "    out = parsed;",
    "  }",
    "  process.stdout.write(JSON.stringify(out));",
    "});",
    "",
  ].join("\n");

  /**
   * Run the decision CLI with a PATH adapter that rewrites git-cliff's
   * `--context` output according to `mode` and delegates everything else
   * (including `--from-context`) to the real binary.
   *
   * @param {"wrap" | "badid" | "strentry" | "empty"} mode
   * @returns {{ status: number, stdout: string, stderr: string }}
   */
  function runCliTampered(mode) {
    const bin = mkdtempSync(path.join(tmpdir(), "cliff-tamper-"));
    writeFileSync(path.join(bin, "transform.mjs"), transformSource);
    writeFileSync(
      path.join(bin, "git-cliff"),
      [
        "#!/bin/sh",
        `REAL='${realGitCliff}'`,
        'for arg in "$@"; do',
        '  if [ "$arg" = "--context" ]; then',
        '    out=$("$REAL" "$@") || exit 1',
        `    printf '%s' "$out" | node '${path.join(bin, "transform.mjs")}' ${mode}`,
        "    exit",
        "  fi",
        "done",
        'exec "$REAL" "$@"',
        "",
      ].join("\n"),
    );
    chmodSync(path.join(bin, "git-cliff"), 0o755);
    try {
      const result = spawnSync(
        process.execPath,
        [
          path.join(repoRoot, "scripts", "release", "core-sync.mjs"),
          "--repo",
          repo.dir,
          "--current",
          BASE_TAG,
          "--",
          ...CORE_ARGS(),
        ],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${bin}${path.delimiter}${process.env.PATH}`,
          },
        },
      );
      return {
        status: result.status ?? 1,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } finally {
      rmSync(bin, { recursive: true, force: true });
    }
  }

  /**
   * Run the decision CLI against the scenario repository with the real
   * PATH — no adapter between it and the real git-cliff.
   *
   * @returns {{ status: number, stdout: string, stderr: string }}
   */
  function runCli() {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, "scripts", "release", "core-sync.mjs"),
        "--repo",
        repo.dir,
        "--current",
        BASE_TAG,
        "--",
        ...CORE_ARGS(),
      ],
      { encoding: "utf8" },
    );
    return {
      status: result.status ?? 1,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  it("keeps a retained fork breaking commit major", () => {
    syncAndForkBreak();

    const result = runCli();

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("pi-subagents-v2.0.0\n");
  });

  it("fails closed when the context top level is not an array (synthetic PATH tamper)", () => {
    syncAndForkBreak();

    const result = runCliTampered("wrap");

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/error: /);
    expect(result.stderr).toMatch(/is not an array/);
  });

  it("fails closed when a commit id is malformed (synthetic PATH tamper)", () => {
    syncAndForkBreak();

    const result = runCliTampered("badid");

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/error: /);
    expect(result.stderr).toMatch(/non-string id/);
  });

  it("fails closed when a commit entry is not an object (synthetic PATH tamper)", () => {
    syncAndForkBreak();

    const result = runCliTampered("strentry");

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/error: /);
    expect(result.stderr).toMatch(/is not an object/);
  });

  it("accepts an empty context array as an empty window (synthetic PATH tamper)", () => {
    syncAndForkBreak();

    const result = runCliTampered("empty");

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("pi-subagents-v1.0.1\n");
  });
});
