---
issue: 34
issue_title: "Sync gotgenes/pi-packages@9087a8dfa6edbfa1808fe3deab46ac3e17a7c032"
---

# Retro: #34 — Sync gotgenes/pi-packages@9087a8dfa6edbfa1808fe3deab46ac3e17a7c032

## Stage: Planning (2026-10-03T07:06:33Z)

### Session summary

Inspected the fixed incoming range, fork changes, open issue/PR overlap, synchronization constraints, and release-evidence feasibility; committed the implementation plan in `docs/plans/f0034-pinned-upstream-sync.md`.
The operator accepted the Pi 1.0/TypeBox/permission upgrade, provider/id model presentation with pending suppression, and explicit background resume returning immediately.
No implementation, real merge, release evidence write, push, issue closure, or publication occurred.

### Observations

- Startup `git pull --ff-only` reported already up to date before the opaque issue number revealed synchronization scope.
  The guide then loaded before further Git operations; primary checkout/main, clean tracked state, no unmerged entries, and no pending operations were verified.
- Fixed target: `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032`; common base: `4dd378ca97a35e380ed946cd5ce0bcb9050ced5a`; inspected fork HEAD: `999d2784a8c8c9093f0d085a1454faf5274a84b5`.
  Safe fetch kept the tag namespace unchanged.
- The real evidence helpers verified upstream core release `22.0.0` at `84111ba0e8eebddd3c4bb4ae04298b1a78f96f86`, continuous ancestry and no policy-relevant unreleased core commits before the target.
  Upstream contribution is major relative to recorded `21.7.7`; actual resolution level and fork version must be reviewed/derived after integration.
- A read-only merge-tree preview exposed textual conflicts and silent semantic intersections.
  Incoming record getters omit the confirmed pair before session creation; widget/get-result/foreground model labels can defeat pending suppression; background resume initially renders the new call's proposal rather than the existing session.
  Keep `InitialSpawnSelection` ownership and the shared `detailFor` producer rather than rebuilding either layer.
- Root auto-merge carries a new hard-coded upstream issue-events API query and contradictory dashed-edge expectations in fork phase tests.
  Preserve fork targets, `fN` identities, registered publication guards, and guide-owned first-parent review/ship ranges.
- Preserve the full fork core CHANGELOG byte-for-byte and the current manifest version until release preparation.
  Other incoming package versions remain upstream provenance, not permission to publish them.
- Selector's existing compatibility matrix tests historical registry cores with old host pins, not this candidate.
  Add packed-local-core/Pi 1.0 verification while retaining the old rows and independent selector peer floor; do not implement #25/#26.
  Fork #32 and PR #33 overlap the accepted upstream TypeBox migration and remain explicit ship-time verification/disposition targets.
- Planning checks passed: root upstream/release suite, measured 22 files and 383 tests; focused core selection/presentation/construction suite, measured 4 files and 62 tests; plan Markdown lint and commit hooks.
  No merged-candidate, full-root, packed-new-host, or manual interactive result is claimed.
- Existing merge script auto-commits a clean merge; the current preview conflicts, but the plan explicitly handles a changed clean-merge outcome without inventing a pending checkpoint.
  A pending merge on a later session's startup requires operator-directed recovery, not an automatic pull/rebase.
- Fresh-context Tidy First assessment recommended no preparatory commits.
  The optional same-file packed-consumer type-check helper extraction is not a separate prerequisite; reuse it only if needed by the candidate verification step.
- A requested `sonnet` exploration model was unavailable in this environment; the read-only investigations used an available model instead.
  Package skills absent locally for incoming sibling packages were read from the pinned target; no selector-specific skill currently exists.

#### Deferred tidyings

- `packages/pi-subagents/src/lifecycle/{subagent,subagent-state,subagent-manager}.ts`: broad class splitting or test regrouping does not simplify this integration.
- `packages/pi-subagents/src/lifecycle/initial-spawn-selection.ts`: a generic spawn/resume gate would conflate one-shot selection and per-run lifecycle ownership.
- `packages/pi-subagents/src/tools/{spawn-config,background-spawner}.ts`: a replacement presentation framework or preparatory launch-renderer extraction duplicates existing/incoming seams.
- `packages/pi-subagents/test/helpers/`: wholesale passive/runnable fixture unification and mock typing cleanup exceed the compatibility changes needed here.

Next action: execute the committed plan with `/tdd-plan`, then complete `/ship 34` and `/retro` as separate stages.
The synchronization guide's actual-merge-first-parent review mandate and separately approved publication restriction remain mandatory.
