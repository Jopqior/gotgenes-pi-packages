import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyReview,
  previewReview,
  readReview,
} from "../../scripts/release/backfill-release-notes.mjs";
import { createReleaseArtifacts } from "./helpers/release-artifacts.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const realRelease = JSON.parse(
  readFileSync(
    path.join(root, "test/release/fixtures/pi-subagents-v1.0.1-release.json"),
    "utf8",
  ),
);
let fixture;
afterEach(() => fixture?.dispose());

function setup() {
  fixture = createReleaseArtifacts();
  const { repo, registry, state } = fixture;
  mkdirSync(path.join(repo.dir, "scripts/release"), { recursive: true });
  writeFileSync(
    path.join(repo.dir, "scripts/release/release-packages.json"),
    JSON.stringify(registry),
  );
  writeFileSync(
    path.join(repo.dir, "scripts/release/core-sync-state.json"),
    JSON.stringify(state),
  );
  repo.git(
    "add",
    "scripts/release/core-sync-state.json",
    "scripts/release/release-packages.json",
  );
  repo.git("commit", "-m", "build: record release evidence");
  return fixture;
}
function release(tag, body = realRelease.body) {
  return {
    ...realRelease,
    tagName: tag,
    name: tag,
    url: `https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/${tag}`,
    body,
  };
}
function preview(
  tags = ["pi-subagents-v1.0.0", "pi-subagents-v1.0.1"],
  releases = {},
) {
  const { repo } = setup();
  const reads = [];
  const readRelease = (tag) => {
    reads.push(tag);
    return Object.hasOwn(releases, tag) ? releases[tag] : release(tag);
  };
  const artifact = previewReview({ repo: repo.dir, tags, readRelease });
  return { artifact, reads, repo, readRelease };
}

describe("historical backfill preview", () => {
  it("uses the selected tag's own verified evidence and preserves actual source-history disclosure byte-for-byte", () => {
    const { artifact, reads, repo } = preview();
    expect(reads).toEqual(["pi-subagents-v1.0.0", "pi-subagents-v1.0.1"]);
    expect(
      artifact.releases.map((entry) => entry.evidence.upstream.version),
    ).toEqual(["21.7.0", "21.7.1"]);
    expect(artifact.releases[1].release.body).toBe(realRelease.body);
    expect(
      artifact.releases[1].proposedBody.slice(0, realRelease.body.length),
    ).toBe(realRelease.body);
    expect(
      artifact.releases[1].proposedBody.slice(realRelease.body.length),
    ).toContain("Incorporated upstream release: `21.7.1`");
    expect(repo.gitOut("status", "--porcelain")).toBe("");
  });
  it("excludes originals and reports absent Releases without creating them", () => {
    const { artifact, reads } = preview(
      ["pi-subagents-model-selector-v0.1.0", "pi-subagents-v1.0.0"],
      { "pi-subagents-v1.0.0": null },
    );
    expect(reads).toEqual(["pi-subagents-v1.0.0"]);
    expect(artifact.releases).toEqual([]);
    expect(artifact.missing.map(({ tag }) => tag)).toEqual([
      "pi-subagents-v1.0.0",
    ]);
  });
  it("rejects uncommitted local evidence rather than reviewing an unrecorded baseline", () => {
    const { repo } = setup();
    const file = path.join(repo.dir, "scripts/release/core-sync-state.json");
    writeFileSync(file, `${readFileSync(file, "utf8")}\n`);
    expect(() =>
      previewReview({
        repo: repo.dir,
        tags: ["pi-subagents-v1.0.1"],
        readRelease: (tag) => release(tag),
      }),
    ).toThrow(/uncommitted release evidence/);
  });
  it("rejects duplicate, malformed, and conflicting blocks, and makes identical blocks a no-op", () => {
    const first = preview(["pi-subagents-v1.0.1"]);
    const body = first.artifact.releases[0].proposedBody;
    expect(
      previewReview({
        repo: first.repo.dir,
        tags: ["pi-subagents-v1.0.1"],
        readRelease: () => release("pi-subagents-v1.0.1", body),
      }).releases[0].proposedBody,
    ).toBe(body);
    for (const bad of [
      body + body.slice(body.indexOf("<!-- upstream-correspondence:start -->")),
      body.replace("21.7.1", "99.0.0"),
      body.replace("<!-- upstream-correspondence:end -->", ""),
    ]) {
      expect(() =>
        previewReview({
          repo: first.repo.dir,
          tags: ["pi-subagents-v1.0.1"],
          readRelease: () => release("pi-subagents-v1.0.1", bad),
        }),
      ).toThrow();
    }
  });
});

describe("reviewed apply", () => {
  it("round-trips every field through a strict reader and refuses missing/extra/tampered fields", () => {
    const { artifact } = preview();
    expect(readReview(JSON.stringify(artifact))).toEqual(artifact);
    for (const change of [
      (a) => {
        a.repository = "gotgenes/pi-packages";
      },
      (a) => {
        a.releases[0].release.body = "stale";
      },
      (a) => {
        a.releases[0].proposedBody = "injected";
      },
      (a) => {
        a.releases[0].release.extra = "ignored?";
      },
      (a) => {
        delete a.releases[0].release.id;
      },
      (a) => {
        a.missing = [{}];
      },
    ]) {
      const tampered = structuredClone(artifact);
      change(tampered);
      if (
        tampered.repository !== artifact.repository ||
        tampered.releases[0]?.release?.extra ||
        !tampered.releases[0]?.release?.id ||
        tampered.missing.length
      )
        expect(() => readReview(JSON.stringify(tampered))).toThrow();
    }
  });
  it("preflights the complete batch before any edit on stale body, tag, evidence, identity, or edited proposal", () => {
    const { artifact, repo } = preview();
    const unchanged = (tag) => release(tag);
    const stateFile = path.join(
      repo.dir,
      "scripts/release/core-sync-state.json",
    );
    const registryFile = path.join(
      repo.dir,
      "scripts/release/release-packages.json",
    );
    const state = readFileSync(stateFile, "utf8");
    const registry = readFileSync(registryFile, "utf8");
    const tagObject = repo.gitOut("rev-parse", "pi-subagents-v1.0.1");
    const cases = [
      {
        label: "stale body",
        change: () => ({
          readRelease: (tag) =>
            release(tag, tag.endsWith("1.0.1") ? "changed" : realRelease.body),
        }),
        error: /stale Release/,
      },
      {
        label: "stale remote metadata",
        change: () => ({
          readRelease: (tag) => ({
            ...release(tag),
            name: tag.endsWith("1.0.1") ? "changed" : tag,
          }),
        }),
        error: /stale Release/,
      },
      {
        label: "stale tag",
        change: () => {
          repo.git("tag", "-f", "pi-subagents-v1.0.1", "HEAD");
          return {};
        },
        error: /tag, identity, or evidence changed/,
      },
      {
        label: "stale evidence",
        change: () => {
          const value = JSON.parse(state);
          value.releases[1].upstream.version = "99.0.0";
          writeFileSync(stateFile, JSON.stringify(value));
          repo.git("add", stateFile);
          repo.git("commit", "-m", "build: alter recorded evidence");
          return {};
        },
        error: /manifest claiming/,
      },
      {
        label: "stale identity",
        change: () => {
          const value = JSON.parse(registry);
          value.packages[0].name = "@jopqior/changed";
          writeFileSync(registryFile, JSON.stringify(value));
          repo.git("add", registryFile);
          repo.git("commit", "-m", "build: alter registered identity");
          return {};
        },
        error: /npm name/,
      },
      {
        label: "tampered proposal",
        change: (review) => {
          review.releases[1].proposedBody = "tampered";
          return {};
        },
        error: /edited proposed body/,
      },
      {
        label: "tampered metadata",
        change: (review) => {
          review.releases[1].release.name = "tampered";
          return {};
        },
        error: /stale Release/,
      },
      {
        label: "newly available missing release",
        change: (review) => {
          review.missing.push(review.releases.pop());
          delete review.missing[0].release;
          delete review.missing[0].proposedBody;
          return {};
        },
        error: /availability changed/,
      },
    ];
    for (const scenario of cases) {
      const review = structuredClone(artifact);
      const { readRelease = unchanged } = scenario.change(review);
      const edits = [];
      expect(
        () =>
          applyReview({
            repo: repo.dir,
            review,
            readRelease,
            editRelease: (...args) => edits.push(args),
          }),
        scenario.label,
      ).toThrow(scenario.error);
      expect(edits, scenario.label).toEqual([]);
      writeFileSync(stateFile, state);
      writeFileSync(registryFile, registry);
      if (
        scenario.label === "stale evidence" ||
        scenario.label === "stale identity"
      ) {
        repo.git("add", stateFile, registryFile);
        repo.git("commit", "-m", "build: restore release evidence");
      }
      repo.git("update-ref", "refs/tags/pi-subagents-v1.0.1", tagObject);
    }
  });
  it("edits only changed notes, checks readback, resumes partial failure without repeating completed edits", () => {
    const { artifact, repo } = preview();
    const remote = new Map(
      artifact.releases.map(({ tag, release: item }) => [tag, item]),
    );
    const calls = [];
    let fail = true;
    const readRelease = (tag) => remote.get(tag) ?? null;
    const editRelease = (tag, body) => {
      calls.push(tag);
      if (tag.endsWith("1.0.1") && fail) throw new Error("remote outage");
      remote.set(tag, { ...remote.get(tag), body });
    };
    expect(() =>
      applyReview({
        repo: repo.dir,
        review: artifact,
        readRelease,
        editRelease,
      }),
    ).toThrow("remote outage");
    expect(calls).toEqual(["pi-subagents-v1.0.0", "pi-subagents-v1.0.1"]);
    fail = false;
    applyReview({ repo: repo.dir, review: artifact, readRelease, editRelease });
    expect(calls).toEqual([
      "pi-subagents-v1.0.0",
      "pi-subagents-v1.0.1",
      "pi-subagents-v1.0.1",
    ]);
    applyReview({ repo: repo.dir, review: artifact, readRelease, editRelease });
    expect(calls).toEqual([
      "pi-subagents-v1.0.0",
      "pi-subagents-v1.0.1",
      "pi-subagents-v1.0.1",
    ]);
    expect(remote.get("pi-subagents-v1.0.1")).toEqual({
      ...release("pi-subagents-v1.0.1"),
      body: artifact.releases[1].proposedBody,
    });
  });
});

describe("CLI effect boundary", () => {
  it("previews without mutation and applies only --notes-file with an explicit fork target", () => {
    const { repo } = setup();
    const bin = mkdtempSync(path.join(tmpdir(), "backfill-gh-"));
    try {
      const gh = path.join(bin, "gh");
      const remote = path.join(bin, "remote.json");
      const calls = path.join(bin, "calls.txt");
      writeFileSync(remote, JSON.stringify(release("pi-subagents-v1.0.1")));
      writeFileSync(calls, "");
      writeFileSync(
        gh,
        `#!/usr/bin/env node\nconst fs=require('fs'); const a=process.argv.slice(2); fs.appendFileSync(process.env.CALLS,JSON.stringify(a)+'\\n'); if(a[1]==='view'){const r=JSON.parse(fs.readFileSync(process.env.REMOTE)); if(r.tagName!==a[2]){console.error('release not found');process.exit(1);}process.stdout.write(JSON.stringify(r));}else if(a[1]==='edit'){const r=JSON.parse(fs.readFileSync(process.env.REMOTE));r.body=fs.readFileSync(a[a.indexOf('--notes-file')+1],'utf8');fs.writeFileSync(process.env.REMOTE,JSON.stringify(r));}else process.exit(2);\n`,
      );
      chmodSync(gh, 0o755);
      const env = {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        REMOTE: remote,
        CALLS: calls,
      };
      const reviewFile = path.join(bin, "review.json");
      const cli = path.join(root, "scripts/release/backfill-release-notes.mjs");
      const run = (...args) =>
        spawnSync("node", [cli, ...args], {
          cwd: repo.dir,
          env,
          encoding: "utf8",
        });
      expect(run("--help").status).toBe(0);
      expect(run("--output", reviewFile, "pi-subagents-v1.0.1").status).toBe(0);
      expect(JSON.parse(readFileSync(remote, "utf8"))).toEqual(
        release("pi-subagents-v1.0.1"),
      );
      const missingFile = path.join(bin, "missing-review.json");
      expect(run("--output", missingFile, "pi-subagents-v1.0.0").status).toBe(
        0,
      );
      expect(
        JSON.parse(readFileSync(missingFile, "utf8")).missing.map(
          ({ tag }) => tag,
        ),
      ).toEqual(["pi-subagents-v1.0.0"]);
      expect(run("--apply", missingFile).status).toBe(0);
      expect(run("--apply", reviewFile).status).toBe(0);
      expect(run("--apply", reviewFile).status).toBe(0);
      const invocations = readFileSync(calls, "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      expect(invocations.filter((call) => call[1] === "create")).toEqual([]);
      expect(invocations.filter((call) => call[1] === "edit")).toEqual([
        [
          "release",
          "edit",
          "pi-subagents-v1.0.1",
          "--repo",
          "Jopqior/gotgenes-pi-packages",
          "--notes-file",
          expect.any(String),
        ],
      ]);
      expect(
        invocations.every(
          (call) =>
            call.includes("--repo") &&
            call.includes("Jopqior/gotgenes-pi-packages"),
        ),
      ).toBe(true);
      expect(JSON.parse(readFileSync(remote, "utf8")).body).toBe(
        JSON.parse(readFileSync(reviewFile, "utf8")).releases[0].proposedBody,
      );
    } finally {
      rmSync(bin, { recursive: true, force: true });
    }
  });
});
