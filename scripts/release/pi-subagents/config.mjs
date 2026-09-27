// The sole registered fork synchronization target. Publication identities remain
// authoritative in release-packages.json, not in this location value.
export const forkSyncTarget = Object.freeze({
  directory: "pi-subagents",
  statePath: "scripts/release/pi-subagents/sync-state.json",
  correspondencePath: "docs/release/pi-subagents-correspondence.md",
});
