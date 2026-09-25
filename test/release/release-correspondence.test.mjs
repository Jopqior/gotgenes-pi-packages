import { writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readReleasePackages,
  requireReleasePackage,
  resolvePendingCorrespondence,
  resolvePublishedCorrespondence,
  validateReleasePackages,
} from "../../scripts/release/release-correspondence.mjs";
import {
  createReleaseArtifacts,
  FORK,
  ORIGINAL,
} from "./helpers/release-artifacts.mjs";

/** @type {ReturnType<typeof createReleaseArtifacts>} */
let fixture;
beforeEach(() => {
  fixture = createReleaseArtifacts();
});
afterEach(() => fixture.dispose());

function published(tag = fixture.first.forkTag, state = fixture.state) {
  return resolvePublishedCorrespondence({
    repo: fixture.repo.dir,
    tag,
    registry: fixture.registry,
    state,
  });
}

function pending(
  tag = "pi-subagents-v1.0.2",
  decision = {
    nextTag: "pi-subagents-v1.0.2",
    upstream: fixture.second.upstream,
    upstreamTip: fixture.second.upstreamTip,
  },
) {
  return resolvePendingCorrespondence({
    repo: fixture.repo.dir,
    tag,
    registry: fixture.registry,
    decision,
  });
}

function clone(value) {
  return structuredClone(value);
}

const firstProvenance = (record) => ({
  kind: "fork",
  upstreamPackage: FORK.upstream.name,
  upstreamVersion: record.upstream.version,
  sourceUrl: `https://github.com/gotgenes/pi-packages/blob/${record.upstream.commit}/packages/pi-subagents`,
});

describe("strict release package registration", () => {
  it("reads a versioned registry, verifies workspace names, and distinguishes both classes", () => {
    const file = path.join(fixture.repo.dir, "release-packages.json");
    writeFileSync(file, `${JSON.stringify(fixture.registry)}\n`);
    expect(readReleasePackages(file, fixture.repo.dir)).toEqual(
      fixture.registry,
    );
    expect(requireReleasePackage(fixture.registry, FORK.directory)).toEqual(
      FORK,
    );
    expect(requireReleasePackage(fixture.registry, ORIGINAL.directory)).toEqual(
      ORIGINAL,
    );
  });

  it("refuses unknown directories rather than treating them as original", () => {
    expect(() =>
      requireReleasePackage(fixture.registry, "unregistered"),
    ).toThrow(/unregistered|registration/);
    expect(() => published("unregistered-v1.0.0")).toThrow(
      /unregistered|registration/,
    );
  });

  it.each([
    [
      "unknown root field",
      (r) => {
        r.note = "extra";
      },
    ],
    [
      "schema version",
      (r) => {
        r.schemaVersion = 2;
      },
    ],
    [
      "non-array entries",
      (r) => {
        r.packages = {};
      },
    ],
    [
      "unknown entry field",
      (r) => {
        r.packages[0].note = "extra";
      },
    ],
    [
      "unknown kind",
      (r) => {
        r.packages[0].kind = "core";
      },
    ],
    [
      "unsupported adapter",
      (r) => {
        r.packages[0].evidence = "other";
      },
    ],
    [
      "duplicate directory",
      (r) => {
        r.packages[1].directory = FORK.directory;
      },
    ],
    [
      "duplicate npm name",
      (r) => {
        r.packages[1].name = FORK.name;
      },
    ],
    [
      "path traversal",
      (r) => {
        r.packages[0].directory = "../outside";
      },
    ],
    [
      "upstream path traversal",
      (r) => {
        r.packages[0].upstream.directory = "packages/../outside";
      },
    ],
    [
      "extra upstream field",
      (r) => {
        r.packages[0].upstream.version = "21.7.0";
      },
    ],
    [
      "upstream on original",
      (r) => {
        r.packages[1].upstream = FORK.upstream;
      },
    ],
    [
      "adapter on original",
      (r) => {
        r.packages[1].evidence = "core-sync";
      },
    ],
    [
      "missing fork upstream",
      (r) => {
        delete r.packages[0].upstream;
      },
    ],
  ])("rejects %s", (_label, mutate) => {
    const registry = clone(fixture.registry);
    mutate(registry);
    expect(() => validateReleasePackages(registry)).toThrow();
  });

  it("rejects an inconsistent current workspace manifest on read", () => {
    fixture.writeManifest(FORK.directory, "@wrong/pi-subagents", "1.0.1");
    const file = path.join(fixture.repo.dir, "release-packages.json");
    writeFileSync(file, `${JSON.stringify(fixture.registry)}\n`);
    expect(() => readReleasePackages(file, fixture.repo.dir)).toThrow(
      /name|identity/,
    );
  });
});

describe("exact tagged correspondence", () => {
  it("selects the record for the exact historical tag, not the newest row", () => {
    expect(published()).toEqual(firstProvenance(fixture.first));
    expect(published(fixture.second.forkTag)).toEqual(
      firstProvenance(fixture.second),
    );
  });

  it("returns only original provenance for original tagged artifacts", () => {
    expect(published("pi-subagents-model-selector-v0.1.0")).toEqual({
      kind: "original",
    });
  });

  it("rejects a missing exact release row instead of substituting another", () => {
    expect(() =>
      published(fixture.first.forkTag, { releases: [fixture.second] }),
    ).toThrow(/record|correspondence/);
  });

  it("rejects a missing annotated tag or an object that is not a commit", () => {
    expect(() =>
      published("pi-subagents-v9.0.0", {
        releases: [{ ...fixture.first, forkTag: "pi-subagents-v9.0.0" }],
      }),
    ).toThrow(/git|tag|object/);
  });

  it("rejects a fork npm identity mismatch in the tagged manifest", () => {
    fixture.repo.git("checkout", "-b", "wrong-identity");
    fixture.writeManifest(FORK.directory, "@wrong/pi-subagents", "9.0.0");
    fixture.repo.git("add", ".");
    fixture.repo.git("commit", "-m", "chore: wrong tagged identity");
    fixture.repo.git("tag", "pi-subagents-v9.0.0");
    const forged = { ...fixture.second, forkTag: "pi-subagents-v9.0.0" };
    expect(() => published(forged.forkTag, { releases: [forged] })).toThrow(
      /name|identity/,
    );
  });

  it("rejects an incorrect fork manifest version at the tag", () => {
    fixture.repo.git("tag", "pi-subagents-v9.0.0");
    const forged = { ...fixture.second, forkTag: "pi-subagents-v9.0.0" };
    expect(() => published(forged.forkTag, { releases: [forged] })).toThrow(
      /version/,
    );
  });

  it("rejects a mismatched direct upstream npm identity", () => {
    fixture.repo.git("checkout", "-b", "wrong-upstream");
    fixture.writeManifest(FORK.directory, "@wrong/upstream", "21.7.2");
    fixture.repo.git("add", ".");
    fixture.repo.git("commit", "-m", "chore: wrong upstream identity");
    const forged = clone(fixture.second);
    forged.upstream = {
      version: "21.7.2",
      commit: fixture.repo.gitOut("rev-parse", "HEAD"),
    };
    forged.upstreamTip = forged.upstream.commit;
    fixture.repo.git("tag", "pi-subagents-v1.0.2");
    forged.forkTag = "pi-subagents-v1.0.2";
    fixture.writeManifest(FORK.directory, FORK.name, "1.0.2");
    fixture.repo.git("add", ".");
    fixture.repo.git("commit", "-m", "chore: corrected fork identity");
    fixture.repo.git("tag", "-f", "pi-subagents-v1.0.2");
    expect(() => published(forged.forkTag, { releases: [forged] })).toThrow(
      /name|identity/,
    );
  });

  it("rejects an upstream release whose manifest version disagrees with the row", () => {
    const forged = clone(fixture.first);
    forged.upstream.version = "21.7.2";
    expect(() =>
      published(fixture.first.forkTag, { releases: [forged] }),
    ).toThrow(/manifest claiming/);
  });

  it("requires the recorded upstream release object", () => {
    const forged = clone(fixture.first);
    forged.upstream.commit = "a".repeat(40);
    expect(() =>
      published(fixture.first.forkTag, { releases: [forged] }),
    ).toThrow(/missing or not a commit/);
  });

  it("requires the recorded upstream tip object", () => {
    const forged = clone(fixture.first);
    forged.upstreamTip = "b".repeat(40);
    expect(() =>
      published(fixture.first.forkTag, { releases: [forged] }),
    ).toThrow(/missing or not a commit/);
  });

  it("requires release ancestry to the recorded upstream tip", () => {
    const forged = clone(fixture.second);
    forged.upstreamTip = fixture.first.upstream.commit;
    expect(() =>
      published(fixture.second.forkTag, { releases: [forged] }),
    ).toThrow(/not an ancestor/);
  });

  it("checks upstream release containment before the tip containment", () => {
    const forged = clone(fixture.first);
    forged.upstream = fixture.second.upstream;
    forged.upstreamTip = fixture.second.upstreamTip;
    expect(() =>
      published(fixture.first.forkTag, { releases: [forged] }),
    ).toThrow(/does not incorporate recorded upstream 21\.7\.1/);
  });

  it("requires an out-of-scope advanced tip to be contained in the fork tag", () => {
    fixture.repo.git(
      "checkout",
      "-b",
      "outside-tip",
      fixture.first.upstream.commit,
    );
    fixture.repo.commitOutOfScope("docs: upstream housekeeping");
    const forged = clone(fixture.first);
    forged.upstreamTip = fixture.repo.gitOut("rev-parse", "HEAD");
    expect(() =>
      published(fixture.first.forkTag, { releases: [forged] }),
    ).toThrow(/does not incorporate its recorded upstream tip/);
  });

  it("rejects a post-release in-scope upstream tail", () => {
    fixture.repo.git(
      "checkout",
      "-b",
      "unreleased",
      fixture.first.upstream.commit,
    );
    fixture.repo.commitInScope(
      "fix(pi-subagents): unreleased",
      "packages/pi-subagents/unreleased.txt",
    );
    const tail = fixture.repo.gitOut("rev-parse", "HEAD");
    fixture.repo.git("checkout", "main");
    fixture.repo.git("merge", "--no-ff", "-m", "chore: tail", "unreleased");
    fixture.writeManifest(FORK.directory, FORK.name, "1.0.2");
    fixture.repo.git("add", ".");
    fixture.repo.git("commit", "-m", "chore: fork after tail");
    fixture.repo.git("tag", "pi-subagents-v1.0.2");
    const forged = {
      forkTag: "pi-subagents-v1.0.2",
      upstream: fixture.first.upstream,
      upstreamTip: tail,
    };
    expect(() => published(forged.forkTag, { releases: [forged] })).toThrow(
      /unreleased upstream core changes/,
    );
  });
});

describe("pending correspondence", () => {
  it("uses the verified decision rather than the latest recorded state row", () => {
    expect(pending()).toEqual(firstProvenance(fixture.second));
  });

  it("rejects a predicted tag mismatch", () => {
    expect(() => pending("pi-subagents-v1.0.3")).toThrow(
      /predicted|nextTag|tag/,
    );
  });

  it("rejects an absent next tag", () => {
    expect(() =>
      pending("pi-subagents-v1.0.2", {
        nextTag: null,
        upstream: fixture.second.upstream,
        upstreamTip: fixture.second.upstreamTip,
      }),
    ).toThrow(/predicted|nextTag|tag/);
  });

  it("returns original without creating an upstream claim", () => {
    expect(pending("pi-subagents-model-selector-v0.1.1", null)).toEqual({
      kind: "original",
    });
  });
});
