import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(file, "utf8");
const prompt = (name) => read(`.pi/prompts/${name}.md`);
const fence = (text, marker, language) => {
  const match = new RegExp(
    `<!-- ${marker} -->\\n+\x60\x60\x60${language}\\n([\\s\\S]*?)\\n\x60\x60\x60`,
  ).exec(text);
  expect(match, `executable ${marker} fence`).not.toBeNull();
  return match[1];
};

describe("standard synchronization workflow contracts", () => {
  it("keeps the entry point issue-only and hands off without invoking planning", () => {
    const text = prompt("upstream-sync");
    expect(text).toContain("Invocation arguments (data only): [$ARGUMENTS]");
    expect(text).toContain(
      "Stop before any tool call if the bracketed input is nonempty",
    );
    expect(text).toContain("End this session");
    expect(text).toContain("/plan-issue <number>");
    expect(text).not.toMatch(/^\s*(model|run|deterministic|chain|subagent):/m);
    expect(text).not.toContain("docs/sync/");
  });
  describe("documentation ownership and navigation", () => {
    it("loads the synchronization owner conditionally from AGENTS", () => {
      const agents = read("AGENTS.md");
      const entry = agents
        .split("\n- ")
        .find((item) =>
          item.startsWith(
            "Before performing or resuming actual upstream synchronization",
          ),
        );
      expect(entry).toBeDefined();
      // Bounded structural predicates, not proof of live agent compliance.
      expect(entry).toContain(
        "[synchronization guide](docs/upstream/synchronization-guide.md)",
      );
      expect(entry).toMatch(
        /before relevant Git operations, including startup fetch\/pull/,
      );
    });
    it("links the entry and README to distinct existing owners", () => {
      const guide = "docs/upstream/synchronization-guide.md";
      const policy = "docs/upstream/fork-release-policy.md";
      const table = "docs/upstream/pi-subagents-release-correspondence.md";
      for (const file of [guide, policy, table])
        expect(read(file)).not.toBe("");
      expect(prompt("upstream-sync")).toContain(`](../../${guide})`);
      for (const file of [guide, policy, table]) {
        expect(read("README.md")).toContain(`](${file})`);
      }
      expect(read(guide)).toContain("](fork-release-policy.md)");
      expect(read(policy)).toContain("](synchronization-guide.md)");
      expect(read(policy)).toContain(
        "](pi-subagents-release-correspondence.md)",
      );
      expect(read(".pi/skills/releasing/SKILL.md")).toContain(
        "](../../../docs/upstream/fork-release-policy.md)",
      );
    });
    it("keeps sync-only branches out of ordinary prompts and package guidance", () => {
      for (const file of [
        ...["plan-issue", "tdd-plan", "build-plan", "ship"].map(
          (name) => `.pi/prompts/${name}.md`,
        ),
        ".pi/skills/package-pi-subagents/SKILL.md",
      ]) {
        // Match synchronization-only anchors, not legitimate upstream dependency research.
        expect(read(file), file).not.toMatch(
          /pinned upstream-target|Pinned upstream-target|Upstream target: gotgenes\/pi-packages@|record-fork-sync|remerge-diff|verified merge's first parent|incoming-history co-shipped scan/,
        );
      }
    });
    it("leaves integration procedures to the guide and recorder semantics to policy", () => {
      for (const file of [
        "docs/upstream/fork-release-policy.md",
        ".pi/skills/releasing/SKILL.md",
      ]) {
        expect(read(file), file).not.toMatch(
          /--merge --expected-upstream|--upstream-protocol|implementation retro|standard plan\/implementation\/review\/ship\/retro lifecycle/,
        );
      }
      expect(read(".pi/skills/releasing/SKILL.md")).not.toContain(
        "./scripts/upstream-sync.sh --record-fork-sync",
      );
      expect(prompt("plan-issue")).toContain("scope:repo");
      for (const name of ["tdd-plan", "build-plan"]) {
        expect(prompt(name)).toContain("root test commands");
      }
      expect(prompt("ship")).toContain("git push origin main");
      expect(prompt("ship")).toContain("--repo Jopqior/gotgenes-pi-packages");
      expect(prompt("ship")).not.toContain(
        "prepare` failing means nothing was tagged",
      );
    });
  });
  describe("worktrees fork release handoff instructions", () => {
    // Bounded owner/section predicates pin instructions, not agent compliance.
    const policy = () => read("docs/upstream/fork-release-policy.md");
    const first = () =>
      policy().split("## First fork release handoff")[1]?.split("## ")[0];

    it("navigates to the independent worktrees view from each owner", () => {
      const view = "pi-subagents-worktrees-release-correspondence.md";
      expect(read("README.md")).toContain(`](docs/upstream/${view})`);
      for (const owner of [
        "synchronization-guide.md",
        "fork-release-policy.md",
      ])
        expect(read(`docs/upstream/${owner}`)).toContain(`](${view})`);
    });
    it("preserves worktrees identity, fork-core loading and workspace behavior in intersection review", () => {
      const text = read("docs/upstream/synchronization-guide.md")
        .split("## Review scope")[1]
        ?.split("## ")[0];
      for (const instruction of [
        "Preserve the eventual `@jopqior/pi-subagents-worktrees` identity and fork repository metadata",
        "published `@jopqior/pi-subagents` imports and dependency",
        "core-first initialization",
        "shared workspace-provider service contract",
        "`subagents-worktrees.json` and `worktreeAgents`",
        "workspace preparation/disposal, rescue and recovery behavior",
      ])
        expect(text).toContain(instruction);
    });
    it("selects independent recorder review and evidence without package-selecting a merge", () => {
      const recording = policy()
        .split("## Recording a completed sync")[1]
        ?.split("## ")[0];
      expect(recording).toContain("--package pi-subagents-worktrees");
      expect(recording).toContain(
        "classify and record each package independently with its own explicit level and rationale",
      );
      const authority = policy()
        .split("## Evidence authority and validity")[1]
        ?.split("## ")[0];
      expect(authority).toContain(
        "scripts/release/pi-subagents-worktrees/sync-state.json",
      );
      expect(authority).toContain(
        "only that selected package's state and view",
      );
      const guide = read("docs/upstream/synchronization-guide.md")
        .split("## Fixed target and compatibility")[1]
        ?.split("## ")[0];
      expect(guide).toContain(
        "./scripts/upstream-sync.sh --fetch --package pi-subagents-worktrees",
      );
      expect(guide).toContain("Never pass `--package` with `--merge`");
    });
    it("separates bounded generation from freshness-checked application", () => {
      for (const instruction of [
        "node scripts/release/prepare-first-fork-release.mjs",
        "--version 0.1.0",
        "operator-selected first version",
        "bounded UTF-8 summary",
        "direct upstream npm identity/version",
        "empty package-scope upstream tail",
        "first-fork-release.json",
        "`sourceHead` still equals the current HEAD before copying",
        "`applicationFiles`",
        "not a persistent ledger",
      ])
        expect(first()).toContain(instruction);
    });
    it("requires explicit separate first-publication approval and forbids untagged dispatch", () => {
      const text = first();
      expect(text).toContain(
        "Obtain explicit separate operator approval of the npm scope and release destination before first publication",
      );
      expect(text).toContain(
        "Do not dispatch ordinary release preparation for an untagged first release",
      );
      expect(text).toContain("manual first npm publish without `--provenance`");
      expect(text).toContain("release-artifacts.mjs published");
    });
    it("routes the release skill to both supported evidence paths and the guarded first handoff", () => {
      const skill = read(".pi/skills/releasing/SKILL.md");
      expect(
        skill.split("## Fork release levels")[1]?.split("## ")[0],
      ).toContain("`pi-subagents` and `pi-subagents-worktrees`");
      const firstRelease = skill
        .split("## A package's first release")[1]
        ?.split("## ")[0];
      expect(firstRelease).toContain("artifact-only first-release generator");
      expect(firstRelease).toContain("#first-fork-release-handoff");
      expect(firstRelease).toContain(
        "Never dispatch ordinary preparation for an untagged first release",
      );
    });
    it("keeps scaffold prose valid after projection and an empty managed region", () => {
      const view = read(
        "docs/upstream/pi-subagents-worktrees-release-correspondence.md",
      );
      const outside = view.split("<!-- release-correspondence:start -->")[0];
      expect(outside).toContain(
        "Until a verified fork release row is recorded",
      );
      expect(outside).not.toContain("This fork is unreleased.");
      expect(
        view
          .split("<!-- release-correspondence:start -->")[1]
          ?.split("<!-- release-correspondence:end -->")[0]
          .trim(),
      ).toBe("No fork release has been recorded.");
    });
  });
  describe("selector-focused synchronization scope", () => {
    // These bounded text predicates detect missing instructions, not live agent
    // compliance or semantic completeness. Subset matches permit unrelated prose.
    const guide = () => read("docs/upstream/synchronization-guide.md");

    describe("issue drafting ownership", () => {
      const drafting = () =>
        prompt("upstream-sync")
          .split("## 2. Draft and recheck before creating")[1]
          ?.split("<!-- issue-entry -->")[0];

      it("requires the absolute fork guide link in drafting, not only final navigation", () => {
        expect(drafting()).toContain(
          "[synchronization guide](https://github.com/Jopqior/gotgenes-pi-packages/blob/main/docs/upstream/synchronization-guide.md)",
        );
      });
      it("assigns review, validation and finding disposition to the guide in drafting", () => {
        const text = drafting();
        expect(text).toContain(
          "the guide governs synchronization review, validation and finding disposition throughout the ordinary stages",
        );
        expect(text).toContain("Acceptance criteria: follow the guide's scope");
      });
    });

    describe("review responsibilities", () => {
      it("distinguishes complete incoming inventory from targeted deep review", () => {
        const text = guide().split("## Review scope")[1]?.split("## ")[0];
        expect(text).toBeDefined();
        expect(text).toContain(
          "complete common-base-to-pinned-target inventory",
        );
        expect(text).toContain(
          "selected deep-review paths/contracts and reasons",
        );
        expect(text).toContain("not independent audit assignments");
        expect(text).not.toContain("comprehensive incoming audit is required");
        expect(guide()).not.toContain("a full review mandate");
      });
      it("includes automatically merged intersections beyond package paths", () => {
        const text = guide().split("## Review scope")[1]?.split("## ")[0];
        expect(text).toContain(
          "automatically merged fork customizations with no conflict markers",
        );
        expect(text).toContain(
          "core/service, lifecycle, presentation and loading contracts",
        );
        expect(text).toContain("package-path filtering alone is insufficient");
        expect(text).toContain(
          "actual conflict resolutions, the remerge diff, sync-authored adaptations and every post-merge contribution",
        );
      });
      it("keeps normal implementation and independent review without a separate comprehensive audit", () => {
        const text = guide()
          .split("## Completed integration and review handoff")[1]
          ?.split("## ")[0];
        expect(text).toContain("normal local review of adaptations");
        expect(text).toContain(
          "fork-contribution classification needed by the recorder",
        );
        expect(text).toContain(
          "No separate comprehensive pre-review integration/evidence audit is required",
        );
        expect(text).toContain("ordinary independent pre-completion review");
        expect(text).toContain(
          "Normal follow-up review after an in-scope correction remains possible",
        );
        expect(text).not.toContain(
          "A separate comprehensive pre-review integration/evidence audit is required",
        );
      });
      it("requires the independent report to distinguish range, scope, results and disposition", () => {
        const text = guide()
          .split("## Completed integration and review handoff")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "pinned target/common base, changed-file inventory and identified intersections",
        );
        expect(text).toContain(
          "generic deterministic gates and applicable checklist remain intact",
        );
        expect(text).toContain(
          "actual range, inventory versus deep-review scope, relevant results and finding disposition",
        );
        expect(text).toContain("without repeating a comprehensive audit");
      });
    });

    describe("validation and disposition", () => {
      it("retains completed-integration root gates and selector regressions", () => {
        expect(guide()).toContain(
          "Run root `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code` on the completed integration.",
        );
        expect(guide()).toContain(
          "Existing selector regression suites remain part of the root test run",
        );
      });
      it("conditions packed checks on relevant contract changes across the completed synchronization", () => {
        const text = guide()
          .split("## Validation and escalation")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "When changes in the completed synchronization, including incoming changes, sync-authored fork adaptations and post-merge contributions, affect host versions, extension loading, package exports/public types or the core/selector service boundary, run existing packed local-core/selector compatibility and applicable public-consumer checks.",
        );
        expect(text).toContain("Preserve historical compatibility rows");
        expect(text).toContain("actual candidate is tested");
        expect(text).toContain(
          "When those contracts do not change, do not require unrelated packed or cross-extension acceptance work",
        );
      });
      it("does not turn omitted optional human or live checks into waiver gates", () => {
        const text = guide()
          .split("## Validation and escalation")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "Human Pi/TUI interaction, live model/judge calls and temporary cross-extension end-to-end harnesses are not default requirements",
        );
        expect(text).toContain(
          "Their omission is neither a missing check nor a warning requiring ship-time waiver",
        );
        expect(text).not.toContain(
          "Their omission requires a ship-time waiver",
        );
      });
      it("requires a concrete gap and operator agreement before extra verification", () => {
        const text = guide()
          .split("## Validation and escalation")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "installation/check failure, broken selector or worktrees behavior, or a named fork-adaptation uncertainty that existing automated tests cannot answer",
        );
        expect(text).toContain(
          "observable uncertainty, the existing evidence and its limit, and the smallest proposed extra verification",
        );
        expect(text).toContain(
          "obtain operator agreement before adding or executing it",
        );
      });
      it("does not infer unrelated repair authority from a failed gate", () => {
        const text = guide()
          .split("## Validation and escalation")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "A failure stops the affected completion path but never implicitly authorizes unrelated upstream repairs, weaker release evidence or a substituted target",
        );
      });
      it("disposes findings by provenance and fork relevance rather than severity alone", () => {
        const text = guide()
          .split("## Finding disposition")[1]
          ?.split("## ")[0];
        expect(text).toContain(
          "provenance and relevance, not severity labels alone",
        );
        expect(text).toMatch(
          /Regression introduced by conflict resolution or fork adaptation\s*\| Correct in scope/,
        );
        expect(text).toMatch(
          /Inherited upstream behavior breaks selector or worktrees compatibility\s*\| In-scope compatibility decision/,
        );
        expect(text).toMatch(
          /Confirmed inherited defect unrelated to fork preservation, with required checks passing\s*\| Outside sync scope; no automatic repair, reproduction, new issue or unresolved ship warning/,
        );
        expect(text).toMatch(
          /Required install\/check fails, including inherited failure\s*\| Stop and report the failed gate and provenance; operator decides the next action, without implied repair authorization/,
        );
        expect(text).toMatch(
          /Specific adaptation uncertainty remains after existing automated checks\s*\| Request the smallest justified verification before executing it/,
        );
        expect(text).toMatch(
          /Optional human\/live check not run and no concrete gap identified\s*\| Not required; no waiver gate/,
        );
        expect(text).toContain(
          "compare the relevant implementation with the pinned target",
        );
        expect(text).toContain(
          "Unknown provenance is not proof of inheritance",
        );
        expect(text).toContain(
          "apply this guide's agreed scope explicitly rather than automatically requiring repair or waiver",
        );
      });
    });

    describe("retained safety", () => {
      it("uses the actual merge first parent instead of tag or plan defaults", () => {
        expect(guide()).toContain(
          "Resolve the actual merge's first parent as the independent review base and review through HEAD",
        );
        expect(guide()).toContain(
          "explicitly supersede the reviewer's default tag/plan-derived range",
        );
        expect(guide()).toContain(
          "For release candidates and the closing summary use the actual merge's first parent through HEAD",
        );
        expect(guide()).toContain("pass that resolved OID as `RANGE_BASE`");
      });
      it("requires genuine pinned two-parent topology", () => {
        expect(guide()).toContain(
          "Complete a genuine two-parent merge before final validation; its second parent must equal the pinned target.",
        );
        expect(guide()).toContain(
          "Feature-worktree rebase, squash, or fast-forward landing cannot replace this merge.",
        );
      });
      it("requires recorder-owned committed reviewed evidence before independent review", () => {
        expect(guide()).toContain(
          "Commit reviewed integration changes, invoke the policy-owned recorder, then commit reviewed evidence before final independent review.",
        );
        expect(guide()).toContain("Missing or ambiguous facts stop shipping");
      });
      it("leaves evidence validity and publication restrictions to release policy", () => {
        expect(guide()).toContain(
          "The [fork release policy](fork-release-policy.md) owns evidence validity, recorder semantics, version derivation, and publication restrictions",
        );
      });
      it("protects fork history and the tag namespace", () => {
        expect(guide()).toContain(
          "Preserve fork history and immutable changelogs; never import upstream tags into the fork's tag namespace",
        );
      });
      it("separates registration and integration approval from publication", () => {
        expect(guide()).toContain(
          "Push and any separately approved publication remain fork-targeted; registration and integration approval do not authorize publication.",
        );
      });
    });
  });
  describe.each(["tdd-plan", "build-plan"])("%s", (name) => {
    it("guards operation state before startup synchronization", () => {
      const text = prompt(name);
      expect(text.indexOf("<!-- operation-state -->")).toBeLessThan(
        text.indexOf("git pull --ff-only"),
      );
      expect(text).toContain(
        "recover against the issue plan and actual Git state",
      );
      const command = fence(text, "operation-state", "bash");
      const directory = mkdtempSync(path.join(os.tmpdir(), "workflow-state-"));
      try {
        expect(
          spawnSync("git", ["init", directory], { encoding: "utf8" }).status,
        ).toBe(0);
        expect(
          spawnSync("bash", ["-c", command], { cwd: directory }).status,
        ).toBe(0);
        for (const operation of [
          "MERGE_HEAD",
          "rebase-merge",
          "rebase-apply",
        ]) {
          const marker = path.join(directory, ".git", operation);
          if (operation === "MERGE_HEAD") writeFileSync(marker, "a".repeat(40));
          else mkdirSync(marker);
          const result = spawnSync("bash", ["-c", command], {
            cwd: directory,
            encoding: "utf8",
          });
          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain("issue plan and actual Git state");
          rmSync(marker, { recursive: true });
        }
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  });
  it("derives registered candidates once with a read-only executable command", () => {
    const text = prompt("ship");
    expect(text).toContain("Reuse this candidate list");
    expect(text).toContain("not publication-eligible");
    expect(text).toContain(
      "nonzero is an error, empty stdout with exit zero is no release",
    );
    const command = fence(text, "release-candidates", "bash");
    const result = spawnSync("bash", ["-c", command], {
      env: { ...process.env, RANGE_BASE: "HEAD" },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      registered: [],
      unregistered: [],
    });
  });
  it("includes incoming and follow-up registered changes while reporting unregistered packages", () => {
    const command = fence(prompt("ship"), "release-candidates", "bash");
    const registry = JSON.parse(read("scripts/release/release-packages.json"));
    const directory = mkdtempSync(
      path.join(os.tmpdir(), "workflow-candidates-"),
    );
    const git = (...args) =>
      execFileSync(
        "git",
        [
          "-c",
          "user.name=Workflow Test",
          "-c",
          "user.email=workflow@example.invalid",
          "-c",
          "core.hooksPath=/dev/null",
          ...args,
        ],
        { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
    try {
      git("init");
      symlinkSync(
        path.resolve("scripts"),
        path.join(directory, "scripts"),
        "dir",
      );
      for (const entry of registry.packages) {
        const packagePath = path.join(directory, "packages", entry.directory);
        mkdirSync(packagePath, { recursive: true });
        writeFileSync(
          path.join(packagePath, "package.json"),
          JSON.stringify({ name: entry.name }),
        );
      }
      git("add", "packages");
      git("commit", "-m", "test: initial inputs");
      const base = git("rev-parse", "HEAD");
      mkdirSync(path.join(directory, "packages", "incoming-unregistered"));
      writeFileSync(
        path.join(directory, "packages", "incoming-unregistered", "README.md"),
        "incoming\n",
      );
      writeFileSync(
        path.join(
          directory,
          "packages",
          registry.packages[0].directory,
          "README.md",
        ),
        "incoming\n",
      );
      git("add", "packages");
      git("commit", "-m", "test: incoming paths");
      writeFileSync(
        path.join(
          directory,
          "packages",
          registry.packages[1].directory,
          "README.md",
        ),
        "follow-up\n",
      );
      git("add", "packages");
      git("commit", "-m", "test: follow-up paths");
      const result = spawnSync("bash", ["-c", command], {
        cwd: directory,
        env: { ...process.env, RANGE_BASE: base },
        encoding: "utf8",
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        registered: registry.packages,
        unregistered: ["incoming-unregistered"],
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("retires active record loaders while keeping release policy navigation", () => {
    for (const file of [
      "AGENTS.md",
      "README.md",
      ".pi/skills/releasing/SKILL.md",
      ".pi/skills/package-pi-subagents/SKILL.md",
      "docs/upstream/fork-release-policy.md",
      ...["upstream-sync", "plan-issue", "tdd-plan", "build-plan", "ship"].map(
        (name) => `.pi/prompts/${name}.md`,
      ),
    ]) {
      const text = read(file);
      expect(text, file).not.toContain("docs/sync/");
      expect(text, file).not.toContain("sole active sync policy");
    }
    expect(read("docs/upstream/fork-release-policy.md")).toContain(
      "online release lookup",
    );
  });
  it("retains the historical review as a resolved Git-addressed link", () => {
    const text = read("docs/plans/f0028-sync-approval-policy.md");
    expect(text).toMatch(
      /historical rule-review handoff\]\(https:\/\/github.com\/Jopqior\/gotgenes-pi-packages\/blob\/[a-f0-9]{40}\/docs\/sync\/reviews\/f0028-sync-approval-policy.md\)/,
    );
  });
});
