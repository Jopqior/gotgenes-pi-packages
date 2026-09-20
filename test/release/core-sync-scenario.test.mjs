import { describe, expect, it } from "vitest";

import { createCoreSyncScenario } from "./helpers/core-sync-scenario.mjs";

// The scenario helper's own contract: every default `syncUpstream` record
// carries its own none contribution, so forging one record's `forkCore` in
// place can never leak into a sibling record or into another scenario
// instance. Tests rely on exactly this when they mutate recorded evidence.

describe("core sync scenario", () => {
  it("gives each recorded sync its own none contribution", () => {
    const scenario = createCoreSyncScenario();
    try {
      scenario.syncUpstream({ version: "21.8.0" });
      scenario.syncUpstream({ version: "21.9.0" });
      const [first, second] = scenario.recordedSyncs;
      expect(first.forkCore).not.toBe(second.forkCore);

      first.forkCore.level = "patch";
      first.forkCore.rationale = "forged contribution";
      first.forkCore.paths.push("packages/pi-subagents/src/forged.ts");

      expect(second.forkCore).toEqual({
        level: "none",
        rationale: "upstream-only integration; no fork core resolution",
        paths: [],
      });
    } finally {
      scenario.dispose();
    }
  });

  it("keeps none contributions independent across scenario instances", () => {
    const first = createCoreSyncScenario();
    const second = createCoreSyncScenario();
    try {
      first.syncUpstream({ version: "21.8.0" });
      second.syncUpstream({ version: "21.8.0" });

      first.recordedSyncs[0].forkCore.level = "major";
      first.recordedSyncs[0].forkCore.paths.push(
        "packages/pi-subagents/src/forged.ts",
      );

      expect(second.recordedSyncs[0].forkCore).toEqual({
        level: "none",
        rationale: "upstream-only integration; no fork core resolution",
        paths: [],
      });
    } finally {
      first.dispose();
      second.dispose();
    }
  });
});
