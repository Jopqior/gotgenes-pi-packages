import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  assertExistingRelease,
  assertReleaseProvenance,
} from "../../scripts/release/release-artifacts.mjs";
import {
  readReleasePackages,
  readTaggedReleaseSection,
  renderUpstreamCorrespondence,
  resolvePublishedCorrespondence,
} from "../../scripts/release/release-correspondence.mjs";

const realRepo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const gitText = (repo, ...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: "pipe" });

describe("canonical upstream correspondence block", () => {
  const provenance = {
    kind: "fork",
    upstreamPackage: "@gotgenes/pi-subagents",
    upstreamVersion: "21.7.0",
    sourceUrl:
      "https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents",
  };

  const canonical =
    "<!-- upstream-correspondence:start -->\n" +
    "### Upstream correspondence\n\n" +
    "Direct upstream package: `@gotgenes/pi-subagents`\n\n" +
    "Incorporated upstream release: `21.7.0`\n\n" +
    "Source: [fixed upstream release commit](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents)\n\n" +
    "This records incorporated source provenance, not behavioral equivalence or the identity of historical npm artifacts.\n" +
    "<!-- upstream-correspondence:end -->";

  it("renders exact blank-line paragraphs, source, and non-equivalence disclaimer", () => {
    expect(renderUpstreamCorrespondence(provenance)).toBe(canonical);
  });

  it("emits no trailing whitespace on any line", () => {
    expect(renderUpstreamCorrespondence(provenance)).not.toMatch(/[\t ]+$/m);
  });

  it("accepts the new canonical block in an exact release section", () => {
    expect(() =>
      assertReleaseProvenance(`Release notes\n\n${canonical}\n\n`, provenance),
    ).not.toThrow();
  });

  it.each([
    ["historical double-space hardbreaks", "  \n"],
    ["single-newline labels", "\n"],
  ])(
    "intentionally rejects %s rather than normalizing old artifacts",
    (_name, separator) => {
      const noncanonical = canonical
        .replace(
          "`@gotgenes/pi-subagents`\n\n",
          `\`@gotgenes/pi-subagents\`${separator}`,
        )
        .replace("`21.7.0`\n\n", `\`21.7.0\`${separator}`);
      expect(() => assertReleaseProvenance(noncanonical, provenance)).toThrow(
        "missing or conflicting managed upstream correspondence",
      );
      expect(() => assertExistingRelease(noncanonical, canonical)).toThrow(
        "conflicting managed upstream correspondence",
      );
    },
  );

  it("renders no block or implied baseline for an original package", () => {
    expect(renderUpstreamCorrespondence({ kind: "original" })).toBe("");
  });
});

describe("actual current and tagged CHANGELOG corpus", () => {
  it("intentionally rejects immutable historical hardbreak provenance under current validation", () => {
    const tag = "pi-subagents-v5.0.0";
    const registry = readReleasePackages(
      path.join(realRepo, "scripts/release/release-packages.json"),
      realRepo,
    );
    const state = JSON.parse(
      gitText(
        realRepo,
        "show",
        `${tag}:scripts/release/pi-subagents/sync-state.json`,
      ),
    );
    const provenance = resolvePublishedCorrespondence({
      repo: realRepo,
      tag,
      registry,
      state,
    });
    const section = readTaggedReleaseSection({
      repo: realRepo,
      tag,
      packageDirectory: "pi-subagents",
    });
    expect(section).toContain(
      "Direct upstream package: `@gotgenes/pi-subagents`  \n",
    );
    expect(() => assertReleaseProvenance(section, provenance)).toThrow(
      "missing or conflicting managed upstream correspondence",
    );
  });

  it("validates published provenance for exact first-tag headings", () => {
    const registry = readReleasePackages(
      path.join(realRepo, "scripts/release/release-packages.json"),
      realRepo,
    );
    for (const entry of registry.packages) {
      const tags = gitText(realRepo, "tag", "--list", `${entry.directory}-v*`)
        .trimEnd()
        .split("\n")
        .filter(Boolean);
      for (const tag of tags) {
        // Scanner failures stay in release-section.test.mjs, not provenance replay.
        if (
          tag === "pi-subagents-v1.0.0" ||
          tag === "pi-subagents-model-selector-v0.1.0"
        )
          continue;
        const section = readTaggedReleaseSection({
          repo: realRepo,
          tag,
          packageDirectory: entry.directory,
        });
        if (!section.split(/\r?\n/, 1)[0].includes("/releases/tag/")) continue;
        expect(entry.kind).toBe("fork");
        const state = JSON.parse(
          gitText(
            realRepo,
            "show",
            `${tag}:scripts/release/${entry.directory}/sync-state.json`,
          ),
        );
        expect(state.releases[0].forkTag).toBe(tag);
        const provenance = resolvePublishedCorrespondence({
          repo: realRepo,
          tag,
          registry,
          state,
        });
        expect(() =>
          assertReleaseProvenance(section, provenance),
        ).not.toThrow();
      }
    }
  });
});
