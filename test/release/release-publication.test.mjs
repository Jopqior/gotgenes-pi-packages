import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readTaggedReleaseSection } from "../../scripts/release/release-correspondence.mjs";
import { createCoreSyncScenario } from "./helpers/core-sync-scenario.mjs";

let scenario;
let repo;
const scripts = [
  "lib.sh",
  "next-version.sh",
  "prepare-release.sh",
  "publish-released.sh",
  "create-github-releases.sh",
  "core-sync.mjs",
  "core-sync-values.mjs",
  "core-sync-state.mjs",
  "core-sync-evidence.mjs",
  "core-sync-cliff.mjs",
  "release-correspondence.mjs",
  "correspondence-table.mjs",
  "release-artifacts.mjs",
];
const handbook =
  "Before\n<!-- release-correspondence:start -->\n\nold\n\n<!-- release-correspondence:end -->\nAfter\n";

beforeEach(() => {
  scenario = createCoreSyncScenario({ releaseArtifacts: true });
  repo = scenario.repo;
});
afterEach(() => scenario.dispose());

function scaffold({ original = false, changelog = true } = {}) {
  scenario.writeCoreSyncState();
  repo.copyReleaseScripts(...scripts);
  repo.copyReleaseScripts("release-packages.json");
  const entries = [
    {
      directory: "pi-subagents",
      name: "@jopqior/pi-subagents",
      kind: "fork",
      upstream: {
        name: "@gotgenes/pi-subagents",
        repository: "gotgenes/pi-packages",
        directory: "packages/pi-subagents",
      },
      evidence: "core-sync",
    },
  ];
  if (original)
    entries.push({
      directory: "demo",
      name: "@fixture/demo",
      kind: "original",
    });
  writeFileSync(
    path.join(repo.dir, "scripts/release/release-packages.json"),
    `${JSON.stringify({ schemaVersion: 1, packages: entries })}\n`,
  );
  const docs = path.join(repo.dir, "docs");
  mkdirSync(docs, { recursive: true });
  writeFileSync(path.join(docs, "upstream-sync.md"), handbook);
  if (changelog)
    repo.writeChangelog(
      "pi-subagents",
      "# Changelog\n\n## [1.0.0](https://github.com/Jopqior/gotgenes-pi-packages/compare/pi-subagents-v0.9.0...pi-subagents-v1.0.0) (2026-09-01)\n\n- historical bytes\n",
    );
  repo.addLocalOrigin();
  repo.git("add", "-A");
  repo.git("commit", "-m", "chore(release): fixture scaffolding");
}
function prepare(...packages) {
  return repo.runReleaseScriptEnv(
    { PACKAGES: packages.join(" "), ALLOW_LOCAL_PUSH: "1" },
    "prepare-release.sh",
  );
}
function installEffects() {
  const bin = path.join(repo.dir, "fake-bin");
  const calls = path.join(repo.dir, "effect-calls.txt");
  const bodyDir = path.join(repo.dir, "fake-releases");
  mkdirSync(bin);
  mkdirSync(bodyDir);
  writeFileSync(calls, "");
  const gh = path.join(bin, "gh");
  writeFileSync(
    gh,
    '#!/usr/bin/env bash\nprintf "gh %s\\n" "$*" >> "$EFFECT_CALLS"\ntag="$3"\nif [ "$2" = view ]; then\n  if [ -f "$BODY_DIR/$tag" ]; then cat "$BODY_DIR/$tag"; else echo "release not found" >&2; exit 1; fi\nelif [ "$2" = create ]; then\n  while [ "$#" -gt 0 ]; do\n    if [ "$1" = --notes-file ]; then cp "$2" "$BODY_DIR/$tag"; break; fi\n    shift\n  done\nfi\n',
  );
  const pnpm = path.join(bin, "pnpm");
  writeFileSync(
    pnpm,
    '#!/usr/bin/env bash\nprintf "pnpm %s\\n" "$*" >> "$EFFECT_CALLS"\n',
  );
  chmodSync(gh, 0o755);
  chmodSync(pnpm, 0o755);
  const env = {
    PATH: `${bin}:${process.env.PATH}`,
    EFFECT_CALLS: calls,
    BODY_DIR: bodyDir,
    GH_TOKEN: "fixture",
  };
  return {
    calls,
    bodyDir,
    env,
    run: (name) => repo.runReleaseScriptEnv(env, name),
  };
}
function snapshot() {
  return {
    head: repo.gitOut("rev-parse", "HEAD"),
    tags: repo.gitOut("tag"),
    status: repo.gitOut("status", "--porcelain"),
    state: readFileSync(
      path.join(repo.dir, "scripts/release/core-sync-state.json"),
      "utf8",
    ),
    table: readFileSync(path.join(repo.dir, "docs/upstream-sync.md"), "utf8"),
  };
}

describe("all-selected preparation", () => {
  it("prepares a fork's decorated tagged section and matching state/table, preserving history", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    scaffold();
    const oldText = readFileSync(
      path.join(repo.dir, "packages/pi-subagents/CHANGELOG.md"),
      "utf8",
    );
    const result = prepare("pi-subagents");
    expect(result.status, result.stderr).toBe(0);
    const text = repo.gitOut("show", "HEAD:packages/pi-subagents/CHANGELOG.md");
    expect(text.slice(text.indexOf("## [1.0.0]"))).toBe(
      oldText.slice(oldText.indexOf("## [1.0.0]")).trimEnd(),
    );
    expect(text).toContain("<!-- upstream-correspondence:start -->");
    const row = JSON.parse(
      repo.gitOut("show", "HEAD:scripts/release/core-sync-state.json"),
    ).releases.at(-1);
    expect(row.forkTag).toBe("pi-subagents-v1.0.1");
    expect(text).toContain(row.upstream.commit);
    expect(repo.gitOut("show", "HEAD:docs/upstream-sync.md")).toContain(
      row.upstream.commit,
    );
    expect(repo.gitOut("status", "--porcelain")).toBe("");
  });
  it("retains the supplied decorated section for a missing CHANGELOG", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    scaffold({ changelog: false });
    const result = prepare("pi-subagents");
    expect(result.status, result.stderr).toBe(0);
    expect(
      repo.gitOut("show", "HEAD:packages/pi-subagents/CHANGELOG.md"),
    ).toContain("<!-- upstream-correspondence:start -->");
  });
  it("releases an original without a fabricated upstream block or a core state/table write", () => {
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold({ original: true });
    const before = snapshot();
    expect(prepare("demo").status).toBe(0);
    expect(
      repo.gitOut("show", "HEAD:scripts/release/core-sync-state.json"),
    ).toBe(before.state.trim());
    expect(repo.gitOut("show", "HEAD:docs/upstream-sync.md")).toBe(
      before.table.trim(),
    );
    expect(
      repo.gitOut("show", "HEAD:packages/demo/CHANGELOG.md"),
    ).not.toContain("upstream-correspondence:start");
  });
  it("publishes and creates from a mixed prepared artifact set with exact tagged notes and explicit targets", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold({ original: true });
    const prepared = prepare("demo", "pi-subagents");
    expect(prepared.status, prepared.stderr).toBe(0);
    const tags = repo.gitOut("tag", "--points-at", "HEAD").split("\n");
    expect(tags).toEqual(["demo-v1.0.1", "pi-subagents-v1.0.1"]);
    // A later unrelated tag is visible but does not alter the selected
    // release commit or the notes' exact source.
    repo.commitOutOfScope("docs: newer unrelated tag");
    repo.git("tag", "unrelated-v99.0.0");
    repo.git("checkout", "--detach", "HEAD~1");
    const effects = installEffects();
    const publication = effects.run("publish-released.sh");
    expect(
      publication.status,
      `${publication.stderr}\n${publication.stdout}`,
    ).toBe(0);
    const creation = effects.run("create-github-releases.sh");
    expect(creation.status, creation.stderr).toBe(0);
    expect(
      readFileSync(path.join(effects.bodyDir, "demo-v1.0.1"), "utf8"),
    ).toBe(
      readTaggedReleaseSection({
        repo: repo.dir,
        tag: "demo-v1.0.1",
        packageDirectory: "demo",
      }),
    );
    expect(
      readFileSync(path.join(effects.bodyDir, "demo-v1.0.1"), "utf8"),
    ).not.toContain("upstream-correspondence:start");
    expect(
      readFileSync(path.join(effects.bodyDir, "pi-subagents-v1.0.1"), "utf8"),
    ).toBe(
      readTaggedReleaseSection({
        repo: repo.dir,
        tag: "pi-subagents-v1.0.1",
        packageDirectory: "pi-subagents",
      }),
    );
    const calls = readFileSync(effects.calls, "utf8");
    expect(calls).toContain("--registry=https://registry.npmjs.org/");
    expect(
      calls
        .split("\n")
        .filter((line) => line.startsWith("gh "))
        .every((line) => line.includes("--repo Jopqior/gotgenes-pi-packages")),
    ).toBe(true);
    expect(calls).not.toContain("unrelated-v99.0.0");
    expect(effects.run("create-github-releases.sh").status).toBe(0);
    expect(
      readFileSync(effects.calls, "utf8").match(/gh release create/g)?.length,
    ).toBe(2);
    writeFileSync(
      path.join(effects.bodyDir, "pi-subagents-v1.0.1"),
      "Legacy body retained verbatim\n",
    );
    expect(effects.run("create-github-releases.sh").status).toBe(0);
    expect(
      readFileSync(path.join(effects.bodyDir, "pi-subagents-v1.0.1"), "utf8"),
    ).toBe("Legacy body retained verbatim\n");
    writeFileSync(
      path.join(effects.bodyDir, "pi-subagents-v1.0.1"),
      "<!-- upstream-correspondence:start -->\nwrong\n<!-- upstream-correspondence:end -->\n",
    );
    const before = readFileSync(effects.calls, "utf8").match(
      /gh release create/g,
    )?.length;
    expect(effects.run("create-github-releases.sh").status).not.toBe(0);
    expect(
      readFileSync(effects.calls, "utf8").match(/gh release create/g)?.length,
    ).toBe(before);
  });
  it("refuses invalid later tagged fork evidence before any npm or GitHub side effect", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold({ original: true });
    expect(prepare("demo", "pi-subagents").status).toBe(0);
    const effects = installEffects();
    const changelog = path.join(repo.dir, "packages/pi-subagents/CHANGELOG.md");
    writeFileSync(
      changelog,
      readFileSync(changelog, "utf8").replace(
        "<!-- upstream-correspondence:start -->",
        "<!-- upstream-correspondence:broken -->",
      ),
    );
    repo.git("add", "packages/pi-subagents/CHANGELOG.md");
    repo.git("commit", "-m", "test: corrupt tagged provenance");
    repo.git("tag", "-f", "pi-subagents-v1.0.1");
    expect(effects.run("publish-released.sh").status).not.toBe(0);
    expect(effects.run("create-github-releases.sh").status).not.toBe(0);
    expect(readFileSync(effects.calls, "utf8")).toBe("");
  });
  it("rejects an unregistered later package before any tracked write", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold();
    const before = snapshot();
    expect(prepare("pi-subagents", "demo").status).not.toBe(0);
    expect(snapshot()).toEqual(before);
  });
  it("refuses a rendered section for another repository before writing an earlier selected package", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold({ original: true });
    const configFile = path.join(repo.dir, "cliff.toml");
    writeFileSync(
      configFile,
      readFileSync(configFile, "utf8").replace(
        'replace = "https://github.com/Jopqior/gotgenes-pi-packages"',
        'replace = "https://github.com/other/repository"',
      ),
    );
    repo.git("add", "cliff.toml");
    repo.git("commit", "-m", "test: wrong release comparison URL");
    const before = snapshot();
    const result = prepare("demo", "pi-subagents");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("missing exact fork section");
    expect(snapshot()).toEqual(before);
  });
  it("refuses malformed correspondence markers before touching even the earlier original", () => {
    scenario.syncUpstream({ version: "21.7.1" });
    repo.commitInScope("feat(demo)!: baseline", "packages/demo/a.txt");
    repo.git("tag", "demo-v1.0.0");
    repo.commitInScope("fix(demo): next", "packages/demo/a.txt");
    repo.writeManifest("demo", "1.0.0");
    scaffold({ original: true });
    writeFileSync(
      path.join(repo.dir, "docs/upstream-sync.md"),
      "Missing markers\n",
    );
    repo.git("add", "-A");
    repo.git("commit", "-m", "docs: corrupt fixture markers");
    const before = snapshot();
    expect(prepare("demo", "pi-subagents").status).not.toBe(0);
    expect(snapshot()).toEqual(before);
  });
});
