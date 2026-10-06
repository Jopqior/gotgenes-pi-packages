import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findReleaseSection,
  readTaggedReleaseSection,
  renderUpstreamCorrespondence,
} from "../../scripts/release/release-correspondence.mjs";
import {
  createFirstForkScenario,
  FIRST_DIRECTORY as DIRECTORY,
  FIRST_FILES as FILES,
  FIRST_STATE as STATE,
  FIRST_VIEW as VIEW,
} from "./helpers/first-fork-scenario.mjs";

let s;
beforeEach(() => {
  s = createFirstForkScenario();
});
afterEach(() => s.dispose());

function refused(pattern, overrides = {}, env = {}, extra = []) {
  const before = s.snapshot();
  const result = s.run(overrides, env, extra);
  expect(result.status, result.stderr).not.toBe(0);
  expect(result.stderr).toMatch(pattern);
  expect(s.snapshot()).toEqual(before);
  expect(existsSync(s.output)).toBe(false);
}
function candidateFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? candidateFiles(path.join(directory, entry.name)).map(
            (file) => `${entry.name}/${file}`,
          )
        : [entry.name],
    )
    .sort();
}
function prepare() {
  const before = s.snapshot();
  const result = s.run();
  expect(result.status, result.stderr).toBe(0);
  expect(s.snapshot()).toEqual(before);
  return JSON.parse(
    readFileSync(path.join(s.output, "first-fork-release.json"), "utf8"),
  );
}

describe("first fork candidate", () => {
  describe("required bounded inputs", () => {
    it("describes artifact-only review and application interface in real help", () => {
      const result = spawnSync(
        "node",
        [
          path.resolve("scripts/release/prepare-first-fork-release.mjs"),
          "--help",
        ],
        { encoding: "utf8" },
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "All six inputs are required. No default version, apply, publish or dispatch mode.",
      );
      expect(result.stdout).toContain(
        "sourceHead, merge, evidence and applicationFiles",
      );
    });
    it.each(["repo", "package", "version", "merge", "notes", "output"])(
      "requires explicit %s",
      (name) => refused(new RegExp(`--${name} is required`), { [name]: null }),
    );
    it.each([
      "01.0.0",
      "1.0",
      "1.0.0-beta.1",
      "1.0.0+build",
      "9007199254740992.0.0",
    ])("rejects non-strict stable version %s", (version) =>
      refused(/stable version/, { version }),
    );
    it.each(["--apply", "--publish", "--dispatch"])(
      "has no effect flag %s",
      (flag) => refused(/unknown argument/, {}, {}, [flag]),
    );
    it("rejects repeated arguments", () =>
      refused(/cannot be repeated/, {}, {}, ["--version", "0.1.0"]));
    it.each([
      "",
      "# Heading\n",
      "## [0.1.0]\n",
      "### Upstream correspondence\n",
      "<!-- upstream-correspondence:start -->\n",
      "<!-- release-correspondence:start -->\n",
      "```text\nunclosed\n",
      "text\u0000\n",
    ])("rejects malformed or managed notes %j", (notes) => {
      writeFileSync(s.notes, notes);
      refused(/notes/);
    });
    it("rejects missing notes before creating output", () =>
      refused(/ENOENT/, { notes: path.join(s.external, "missing") }));
    it("rejects duplicate view markers before creating output", () => {
      s.write(
        VIEW,
        readFileSync(path.join(s.repo.dir, VIEW), "utf8") +
          "<!-- release-correspondence:start -->\n",
      );
      s.commit("docs: malformed view");
      refused(/exactly one/);
    });
  });
  describe("registered empty fork evidence", () => {
    it("rejects unregistered migrated manifest", () => {
      s.write(
        "scripts/release/release-packages.json",
        '{"schemaVersion":2,"packages":[]}',
      );
      s.commit("build: omit registration");
      refused(/no release package registration/);
    });
    it("rejects hidden critical manifest drift despite assume-unchanged", () => {
      s.repo.git("update-index", "--assume-unchanged", FILES[0]);
      s.write(
        FILES[0],
        JSON.stringify({ ...s.manifest, description: "hidden drift" }),
      );
      expect(s.repo.gitOut("status", "--porcelain")).toBe("");
      refused(/clean committed artifact/);
    });
    it("rejects old upstream manifest", () => {
      s.write(
        FILES[0],
        JSON.stringify({
          ...s.manifest,
          name: "@gotgenes/pi-subagents-worktrees",
        }),
      );
      s.commit("build: old manifest");
      refused(/npm name does not match/);
    });
    it("rejects an original registration on a supported target", () => {
      s.write(
        "scripts/release/release-packages.json",
        JSON.stringify({
          schemaVersion: 2,
          packages: [
            { directory: DIRECTORY, name: s.manifest.name, kind: "original" },
          ],
        }),
      );
      s.commit("build: original registration");
      refused(/registered as a fork/);
    });
    it.each(["releases", "syncs"])("rejects existing %s", (field) => {
      const row =
        field === "releases"
          ? {
              forkTag: `${DIRECTORY}-v0.1.0`,
              upstream: { version: "0.3.3", commit: s.release },
              upstreamTip: s.tip,
            }
          : {
              merge: s.merge,
              upstream: { version: "0.3.3", commit: s.release },
              forkContribution: {
                level: "none",
                rationale: "reviewed",
                paths: [],
              },
            };
      s.write(
        STATE,
        JSON.stringify({
          schemaVersion: 2,
          releases: [],
          syncs: [],
          [field]: [row],
        }),
      );
      s.commit("build: populated state");
      refused(/empty/);
    });
    it("rejects malformed schema state", () => {
      s.write(STATE, '{"schemaVersion":1,"releases":[],"syncs":[]}');
      s.commit("build: invalid state");
      refused(/schema version/);
    });
    it.each(["0.1.0", "0.3.3", "bad"])(
      "rejects existing selected release tag %s",
      (version) => {
        s.repo.git("tag", `${DIRECTORY}-v${version}`);
        refused(/existing.*tags/);
      },
    );
  });
  describe("primary clean completed checkout", () => {
    it.each(["tracked", "staged", "untracked"])(
      "rejects %s checkout drift",
      (kind) => {
        s.write(
          kind === "untracked" ? "new-file" : FILES[0],
          kind === "untracked"
            ? "dirty"
            : JSON.stringify({ ...s.manifest, description: "dirty" }),
        );
        if (kind === "staged") s.repo.git("add", FILES[0]);
        refused(/clean/);
      },
    );
    it("rejects non-main branch", () => {
      s.repo.git("checkout", "-b", "feature");
      refused(/main/);
    });
    it("rejects detached HEAD", () => {
      s.repo.git("checkout", "--detach");
      refused(/main/);
    });
    it("rejects linked worktree even when it owns main", () => {
      s.repo.git("checkout", "-b", "holder");
      const worktree = path.join(s.external, "linked");
      s.repo.git("worktree", "add", worktree, "main");
      refused(/primary checkout/, { repo: worktree });
    });
    it.each([
      "MERGE_HEAD",
      "CHERRY_PICK_HEAD",
      "REVERT_HEAD",
      "rebase-merge",
      "rebase-apply",
      "sequencer",
      "BISECT_LOG",
    ])("rejects pending operation %s", (marker) => {
      const file = path.join(s.repo.dir, ".git", marker);
      if (marker.includes("rebase") || marker === "sequencer") mkdirSync(file);
      else writeFileSync(file, `${s.merge}\n`);
      refused(/pending Git operation/);
    });
  });
  describe("independent incorporated upstream", () => {
    it.each([
      "https://github.com/other/repo.git",
      "git@github.com:Jopqior/gotgenes-pi-packages.git",
      "https://github.com/gotgenes/pi-packages.git\nhttps://github.com/other/repo.git",
    ])("rejects unsupported remote %s before lookup", (url) => {
      s.repo.git("config", "remote.upstream.url", url);
      refused(/unsupported upstream remote/);
      expect(readFileSync(s.queryLog, "utf8")).toBe("");
    });
    it("rejects mismatched upstream repository registration", () => {
      s.registry.packages[0].upstream.repository = "other/repo";
      s.write(
        "scripts/release/release-packages.json",
        JSON.stringify(s.registry),
      );
      s.commit("build: wrong upstream repository");
      refused(/upstream repository/);
      expect(readFileSync(s.queryLog, "utf8")).toBe("");
    });
    it("rejects direct upstream npm identity even with plausible version", () => {
      s.dispose();
      s = createFirstForkScenario({ upstreamName: "@gotgenes/pi-subagents" });
      refused(/upstream release.*npm name does not match/);
    });
    it("rejects package-scoped unreleased upstream tail", () => {
      s.dispose();
      s = createFirstForkScenario({ tail: true });
      refused(/unreleased upstream package changes/);
    });
    it("rejects missing release objects without fetching", () =>
      refused(
        /no stable upstream package release/,
        {},
        { MISSING_OBJECT: "1" },
      ));
    it("rejects contradictory upstream tag and manifest version", () => {
      // Retarget only this fixture's advertised tag to an incorporated tip
      // whose manifest still claims 0.3.3, under a contradictory version.
      s.repo.git("--git-dir", s.bare, "tag", `${DIRECTORY}-v0.3.4`, s.tip);
      refused(/manifest claiming/);
    });
    it("rejects missing merge", () =>
      refused(/cannot resolve merge/, {
        merge: "1111111111111111111111111111111111111111",
      }));
    it("rejects single-parent merge input", () =>
      refused(/two-parent merge/, { merge: s.release }));
    it("rejects uncontained merge", () => {
      s.repo.git("checkout", "-b", "elsewhere", s.merge);
      s.repo.commitOutOfScope("docs: alternate line");
      s.repo.git("merge", "--no-ff", "-m", "chore: alternate merge", "main");
      const other = s.repo.gitOut("rev-parse", "HEAD");
      s.repo.git("checkout", "main");
      refused(/not an ancestor of HEAD/, { merge: other });
    });
    it("rejects upstream-parent containment inconsistency", () => {
      s.repo.git("update-ref", "refs/remotes/upstream/main", `${s.merge}^1`);
      refused(/not contained in upstream\/main/);
    });
    it.each(["success", "failure"])(
      "detects injected complete tag-map drift on query %s without recovery",
      (mode) => {
        s.repo.git("tag", "unrelated-v1.0.0", s.release);
        const before = s.snapshot();
        const result = s.run(
          {},
          {
            DRIFT_TAG: "unrelated-v1.0.0",
            QUERY_FAIL: mode === "failure" ? "1" : "0",
          },
        );
        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(/local tag mappings changed/);
        expect(s.repo.gitOut("rev-parse", "unrelated-v1.0.0")).toBe(
          before.head,
        );
        const after = s.snapshot();
        expect({ ...after, refs: before.refs }).toEqual(before);
        expect(after.refs).not.toBe(before.refs);
        expect(existsSync(s.output)).toBe(false);
      },
    );
    it("preserves all refs and files on query failure without drift", () =>
      refused(/injected query failure/, {}, { QUERY_FAIL: "1" }));
  });
  describe("fresh external output", () => {
    it("refuses existing output without mixing candidates", () => {
      mkdirSync(s.output);
      writeFileSync(path.join(s.output, "sentinel"), "preserve");
      const before = s.snapshot();
      const result = s.run();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/fresh/);
      expect(readFileSync(path.join(s.output, "sentinel"), "utf8")).toBe(
        "preserve",
      );
      expect(s.snapshot()).toEqual(before);
    });
    it("refuses output inside checkout", () =>
      refused(/outside checkout/, {
        output: path.join(s.repo.dir, "candidate"),
      }));
    it("refuses path traversal alias inside checkout", () =>
      refused(/outside checkout/, {
        output: path.join(s.repo.dir, "docs/../candidate"),
      }));
    it("refuses symlink parent alias into checkout", () => {
      const alias = path.join(s.external, "alias");
      symlinkSync(s.repo.dir, alias);
      refused(/outside checkout/, { output: path.join(alias, "candidate") });
    });
    it("refuses existing output symlink including dangling one", () => {
      symlinkSync(path.join(s.external, "missing"), s.output);
      const before = s.snapshot();
      const result = s.run();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/fresh/);
      expect(s.snapshot()).toEqual(before);
    });
  });
  describe("reviewed artifacts and local publication round trip", () => {
    it("stages explicit version, independent row, metadata and exact application set without checkout effects", () => {
      const review = prepare();
      expect(review).toEqual({
        schemaVersion: 1,
        sourceHead: s.repo.gitOut("rev-parse", "HEAD"),
        package: DIRECTORY,
        merge: s.merge,
        tag: `${DIRECTORY}-v0.1.0`,
        version: "0.1.0",
        incorporated: {
          merge: s.merge,
          forkParent: s.repo.gitOut("rev-parse", `${s.merge}^1`),
          upstreamTip: s.tip,
          upstream: { version: "0.3.3", commit: s.release },
        },
        applicationFiles: FILES,
      });
      expect(candidateFiles(s.output)).toEqual(
        [...FILES, "first-fork-release.json"].sort(),
      );
      expect(
        JSON.parse(readFileSync(path.join(s.output, FILES[0]), "utf8")),
      ).toEqual({ ...s.manifest, version: "0.1.0" });
      expect(
        JSON.parse(readFileSync(path.join(s.output, STATE), "utf8")),
      ).toEqual({
        schemaVersion: 2,
        releases: [
          {
            forkTag: `${DIRECTORY}-v0.1.0`,
            upstream: { version: "0.3.3", commit: s.release },
            upstreamTip: s.tip,
          },
        ],
        syncs: [],
      });
      const changelog = readFileSync(path.join(s.output, FILES[1]));
      const seam = s.inherited.indexOf("\n## ") + 1;
      const inheritedSuffix = s.inherited.subarray(seam);
      expect(changelog.subarray(0, seam)).toEqual(
        s.inherited.subarray(0, seam),
      );
      expect(
        changelog.subarray(changelog.length - inheritedSuffix.length),
      ).toEqual(inheritedSuffix);
      expect(changelog.toString()).toMatch(
        /^## \[0\.1\.0\]\(https:\/\/github.com\/Jopqior\/gotgenes-pi-packages\/releases\/tag\/pi-subagents-worktrees-v0\.1\.0\) \(\d{4}-\d{2}-\d{2}\)/m,
      );
      expect(changelog.toString()).toContain(
        `Direct upstream package: \`@gotgenes/pi-subagents-worktrees\``,
      );
      expect(readFileSync(path.join(s.output, VIEW), "utf8")).toContain(
        s.release,
      );
      expect(readFileSync(s.queryLog, "utf8")).toBe(
        `ls-remote --tags upstream ${DIRECTORY}-v*\n`,
      );
    });
    it("keeps inherited preamble out of the bounded first Release notes", () => {
      prepare();
      const text = readFileSync(path.join(s.output, FILES[1]), "utf8");
      const section = findReleaseSection(
        text,
        `${DIRECTORY}-v0.1.0`,
        DIRECTORY,
      );
      const heading = section.slice(0, section.indexOf("\n"));
      const block = renderUpstreamCorrespondence({
        kind: "fork",
        upstreamPackage: "@gotgenes/pi-subagents-worktrees",
        upstreamVersion: "0.3.3",
        sourceUrl: `https://github.com/gotgenes/pi-packages/blob/${s.release}/packages/${DIRECTORY}`,
      });
      expect(section).toBe(
        `${heading}\n\n### Features\n\n- Reviewed migration to fork core.\n\n${block}\n\n`,
      );
    });
    it("keeps generated provenance byte-identical through the ordinary trailing-whitespace hook twice", () => {
      // Other fixture tests preserve deliberately dirty inherited bytes; this
      // hook probe starts with hook-clean history, like the real worktrees file.
      s.write(
        FILES[1],
        s.inherited
          .toString()
          .replace("- inherited bytes \r\n", "- inherited bytes\r\n"),
      );
      s.commit("test: hook-clean inherited history");
      prepare();
      const candidate = readFileSync(path.join(s.output, FILES[1]));
      const sample = path.join(s.repo.dir, FILES[1]);
      copyFileSync(path.join(s.output, FILES[1]), sample);
      for (let pass = 0; pass < 2; pass++) {
        const result = spawnSync(
          "prek",
          [
            "run",
            "trailing-whitespace",
            "--config",
            path.resolve("prek.toml"),
            "--files",
            FILES[1],
          ],
          { cwd: s.repo.dir, encoding: "utf8" },
        );
        expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
        expect(readFileSync(sample)).toEqual(candidate);
      }
      expect(readFileSync(path.join(s.output, FILES[1]))).toEqual(candidate);
    });
    it("applies exact candidate files, validates publication and fake effects, then predicts from first row", () => {
      const review = prepare();
      for (const file of review.applicationFiles)
        copyFileSync(path.join(s.output, file), path.join(s.repo.dir, file));
      s.commit("chore(release): apply reviewed first fork artifacts");
      s.repo.git("tag", "-a", review.tag, "-m", "first fork");
      const calls = path.join(s.external, "effects");
      writeFileSync(calls, "");
      const gh = path.join(s.bin, "gh");
      const pnpm = path.join(s.bin, "pnpm");
      const body = path.join(s.external, "release-body");
      writeFileSync(
        pnpm,
        '#!/usr/bin/env bash\nprintf "pnpm %s\\n" "$*" >> "$EFFECT_CALLS"\n',
      );
      writeFileSync(
        gh,
        '#!/usr/bin/env bash\nprintf "gh %s\\n" "$*" >> "$EFFECT_CALLS"\nif [[ "$2" == view ]]; then echo "release not found" >&2; exit 1; fi\nwhile [[ "$#" -gt 0 ]]; do if [[ "$1" == --notes-file ]]; then cp "$2" "$BODY_FILE"; break; fi; shift; done\n',
      );
      chmodSync(gh, 0o755);
      chmodSync(pnpm, 0o755);
      const env = {
        ...s.env,
        EFFECT_CALLS: calls,
        BODY_FILE: body,
        GH_TOKEN: "fixture",
      };
      for (const script of [
        "publish-released.sh",
        "create-github-releases.sh",
      ]) {
        const result = s.repo.runReleaseScriptEnv(env, script);
        expect(result.status, result.stderr).toBe(0);
      }
      // Shell-owned temporary notes paths vary on each invocation.
      const effectLines = readFileSync(calls, "utf8").trimEnd().split("\n");
      expect(effectLines.slice(0, 2)).toEqual([
        "pnpm --filter @jopqior/pi-subagents-worktrees publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/",
        `gh release view ${review.tag} --repo Jopqior/gotgenes-pi-packages --json body -q .body`,
      ]);
      expect(effectLines.length).toBe(3);
      expect(effectLines[2]).toMatch(
        new RegExp(
          `^gh release create ${review.tag} --repo Jopqior/gotgenes-pi-packages --title ${review.tag} --notes-file /tmp/[^ ]+/notes-0$`,
        ),
      );
      expect(readFileSync(body, "utf8")).toBe(
        readTaggedReleaseSection({
          repo: s.repo.dir,
          tag: review.tag,
          packageDirectory: DIRECTORY,
        }),
      );
      let predicted = s.repo.runReleaseScriptEnv(
        s.env,
        "next-version.sh",
        DIRECTORY,
      );
      expect(predicted.status, predicted.stderr).toBe(0);
      expect(predicted.stdout).toBe("");
      s.repo.commitInScope(
        "fix(pi-subagents-worktrees): later improvement",
        `packages/${DIRECTORY}/fix.txt`,
      );
      predicted = s.repo.runReleaseScriptEnv(
        s.env,
        "next-version.sh",
        DIRECTORY,
      );
      expect(predicted.status, predicted.stderr).toBe(0);
      expect(predicted.stdout).toBe(`${DIRECTORY}-v0.1.1\n`);
    });
  });
});
