import { describe, expect, it } from "vitest";

import { createForkSyncScenario } from "./helpers/fork-sync-scenario.mjs";

// The scenario helper's own contract: every default `syncUpstream` record
// carries its own none contribution, so forging one record's `forkContribution` in
// place can never leak into a sibling record or into another scenario
// instance. Tests rely on exactly this when they mutate recorded evidence.

describe("fork sync scenario", () => {
  it("gives each recorded sync its own none contribution", () => {
    const scenario = createForkSyncScenario();
    try {
      scenario.syncUpstream({ version: "21.8.0" });
      scenario.syncUpstream({ version: "21.9.0" });
      const [first, second] = scenario.recordedSyncs;
      expect(first.forkContribution).not.toBe(second.forkContribution);

      first.forkContribution.level = "patch";
      first.forkContribution.rationale = "forged contribution";
      first.forkContribution.paths.push("packages/pi-subagents/src/forged.ts");

      expect(second.forkContribution).toEqual({
        level: "none",
        rationale: "upstream-only integration; no fork contribution resolution",
        paths: [],
      });
    } finally {
      scenario.dispose();
    }
  });

  it("keeps none contributions independent across scenario instances", () => {
    const first = createForkSyncScenario();
    const second = createForkSyncScenario();
    try {
      first.syncUpstream({ version: "21.8.0" });
      second.syncUpstream({ version: "21.8.0" });

      first.recordedSyncs[0].forkContribution.level = "major";
      first.recordedSyncs[0].forkContribution.paths.push(
        "packages/pi-subagents/src/forged.ts",
      );

      expect(second.recordedSyncs[0].forkContribution).toEqual({
        level: "none",
        rationale: "upstream-only integration; no fork contribution resolution",
        paths: [],
      });
    } finally {
      first.dispose();
      second.dispose();
    }
  });
});
