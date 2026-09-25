import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readCoreSyncState } from "../../scripts/release/core-sync-state.mjs";
import {
  renderCorrespondenceTable,
  updateCorrespondenceDocument,
} from "../../scripts/release/correspondence-table.mjs";
import { readReleasePackages } from "../../scripts/release/release-correspondence.mjs";
import { createReleaseArtifacts } from "./helpers/release-artifacts.mjs";

const realRepo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const start = "<!-- release-correspondence:start -->";
const end = "<!-- release-correspondence:end -->";
/** @type {ReturnType<typeof createReleaseArtifacts>} */
let fixture;
beforeEach(() => {
  fixture = createReleaseArtifacts();
});
afterEach(() => fixture.dispose());

function expectedRow(fork, version, source) {
  return `| ${fork.padEnd(28)} | ${version.padEnd(23)} | ${source.padEnd(117)} |\n`;
}

function render(state = fixture.state, pending) {
  return renderCorrespondenceTable({
    repo: fixture.repo.dir,
    registry: fixture.registry,
    state,
    pending,
  });
}

describe("verified generated table", () => {
  it("sorts every released row by fork SemVer, not input order, with immutable source links", () => {
    expect(
      render({
        ...fixture.state,
        releases: fixture.state.releases.toReversed(),
      }),
    ).toBe(
      expectedRow(
        "Fork `@jopqior/pi-subagents`",
        "Direct upstream release",
        "Fixed source",
      ) +
        expectedRow("-".repeat(28), "-".repeat(23), "-".repeat(117)) +
        expectedRow(
          "1.0.0",
          "`21.7.0`",
          `[source](https://github.com/gotgenes/pi-packages/blob/${fixture.first.upstream.commit}/packages/pi-subagents)`,
        ) +
        expectedRow(
          "1.0.1",
          "`21.7.1`",
          `[source](https://github.com/gotgenes/pi-packages/blob/${fixture.second.upstream.commit}/packages/pi-subagents)`,
        ),
    );
  });

  it("rejects an unverified row, rather than rendering a plausible label", () => {
    const invalid = structuredClone(fixture.state);
    invalid.releases[0].upstream.version = "21.7.8";
    expect(() => render(invalid)).toThrow(/manifest claiming/);
  });

  it("can append a pending verified decision without requiring a nonexistent tag", () => {
    const pending = {
      tag: "pi-subagents-v1.0.2",
      decision: {
        nextTag: "pi-subagents-v1.0.2",
        upstream: fixture.second.upstream,
        upstreamTip: fixture.second.upstreamTip,
      },
    };
    expect(render(fixture.state, pending)).toBe(
      render() +
        expectedRow(
          "1.0.2",
          "`21.7.1`",
          `[source](https://github.com/gotgenes/pi-packages/blob/${fixture.second.upstream.commit}/packages/pi-subagents)`,
        ),
    );
    const projected = {
      ...fixture.state,
      releases: [
        ...fixture.state.releases,
        {
          forkTag: pending.tag,
          upstream: pending.decision.upstream,
          upstreamTip: pending.decision.upstreamTip,
        },
      ],
    };
    expect(render(projected, pending)).toBe(render(fixture.state, pending));
    expect(() =>
      render(fixture.state, {
        ...pending,
        decision: { ...pending.decision, nextTag: "pi-subagents-v9.0.0" },
      }),
    ).toThrow(/predicted|tag/);
    projected.releases.at(-1).upstream = fixture.first.upstream;
    expect(() => render(projected, pending)).toThrow(/pending|disagree/);
  });
});

describe("strict marked-region ownership", () => {
  const document = `# Handbook\n\nPreserve this preface.\n\n${start}\nold rows\n${end}\n\n## After\n\nPreserve suffix.\n`;
  it("changes only the owned bytes and is idempotent", () => {
    const table = "| New | Row |\n| --- | --- |\n";
    const expected = `# Handbook\n\nPreserve this preface.\n\n${start}\n\n${table}\n${end}\n\n## After\n\nPreserve suffix.\n`;
    expect(updateCorrespondenceDocument(document, table)).toBe(expected);
    expect(updateCorrespondenceDocument(expected, table)).toBe(expected);
  });

  it.each([
    ["missing start", `# Handbook\n${end}\n`],
    ["missing end", `# Handbook\n${start}\n`],
    ["duplicate start", `${start}\n${start}\n${end}\n`],
    ["duplicate end", `${start}\n${end}\n${end}\n`],
    ["second pair", `${start}\n${end}\n${start}\n${end}\n`],
    ["reversed markers", `${end}\n${start}\n`],
    ["inline marker", `prefix ${start}\nrows\n${end}\n`],
  ])("refuses %s", (_label, text) => {
    expect(() => updateCorrespondenceDocument(text, "| x |\n")).toThrow(
      /marker|region/,
    );
  });
});

describe("table CLI", () => {
  it("checks without writing, writes once, and refuses stale or ambiguous regions", () => {
    const repo = fixture.repo.dir;
    const script = path.join(
      realRepo,
      "scripts/release/correspondence-table.mjs",
    );
    const statePath = path.join(repo, "scripts/release/core-sync-state.json");
    const registryPath = path.join(
      repo,
      "scripts/release/release-packages.json",
    );
    const documentPath = path.join(repo, "docs/upstream-sync.md");
    mkdirSync(path.join(repo, "scripts/release"), { recursive: true });
    mkdirSync(path.join(repo, "docs"), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify(fixture.state)}\n`);
    writeFileSync(registryPath, `${JSON.stringify(fixture.registry)}\n`);
    const old = `# Handbook\n\n${start}\n\nStale rows.\n\n${end}\n\n## Preserve\n`;
    writeFileSync(documentPath, old);
    const run = (mode) =>
      execFileSync(process.execPath, [script, mode, "--repo", repo], {
        encoding: "utf8",
      });
    expect(() => run("--check")).toThrow();
    expect(readFileSync(documentPath, "utf8")).toBe(old);
    run("--write");
    const written = readFileSync(documentPath, "utf8");
    expect(written).toBe(updateCorrespondenceDocument(old, render()));
    run("--check");
    run("--write");
    expect(readFileSync(documentPath, "utf8")).toBe(written);
    writeFileSync(documentPath, `${written}\n${start}\n${end}\n`);
    expect(() => run("--write")).toThrow();
    expect(readFileSync(documentPath, "utf8")).toBe(
      `${written}\n${start}\n${end}\n`,
    );
  });
});

describe("committed generated correspondence", () => {
  it("matches the complete real evidence and leaves every byte outside its markers untouched", () => {
    const state = readCoreSyncState(
      path.join(realRepo, "scripts/release/core-sync-state.json"),
    );
    const registry = readReleasePackages(
      path.join(realRepo, "scripts/release/release-packages.json"),
      realRepo,
    );
    const document = readFileSync(
      path.join(realRepo, "docs/upstream-sync.md"),
      "utf8",
    );
    const generated = renderCorrespondenceTable({
      repo: realRepo,
      state,
      registry,
    });
    expect(
      generated
        .split("\n")
        .filter((line) => /^\| \d+\.\d+\.\d+\s+\|/.test(line)),
    ).toHaveLength(state.releases.length);
    expect(updateCorrespondenceDocument(document, generated)).toBe(document);
    expect(
      execFileSync(
        process.execPath,
        [
          path.join(realRepo, "scripts/release/correspondence-table.mjs"),
          "--check",
        ],
        { cwd: realRepo, encoding: "utf8" },
      ),
    ).toBe("");
    // Real tagged objects, not a synthetic mapping: every row was resolved by the renderer.
    const tags = execFileSync("git", ["tag", "--list", "pi-subagents-v*"], {
      cwd: realRepo,
      encoding: "utf8",
    })
      .trim()
      .split("\n");
    expect(state.releases.map((row) => row.forkTag).toSorted()).toEqual(tags);
  });
});
