---
issue: 44
issue_title: "Sync gotgenes/pi-packages@23c08264aa180222e8953a835337ada28534f1b7"
---

# Retro: #44 — Sync gotgenes/pi-packages@23c08264aa180222e8953a835337ada28534f1b7

## Stage: Planning (2026-10-17T13:58:16Z)

### Session summary

Committed the repository-scoped synchronization plan in `c952b78d6230a789a2bc416d3ce328c32307fa50`, pinning `23c08264aa180222e8953a835337ada28534f1b7` and selecting fork lifecycle, presentation, loading, workflow and source contracts for deep review.
At the operator's explicit request, also completed the narrow selector Pi dependency upgrade in `aad16ee8b82c824dd3a3375bf8a9f2d472fef533`; no selector source or actual integration was changed.
The next stage is `/tdd-plan`; no upstream merge, review acceptance, push or publication has occurred.

### Observations

- Startup ordering deviation: the expanded template's fast-forward-only pull ran before the issue revealed its synchronization scope and before loading the synchronization references.
  It reported already up to date; subsequent checks verified the primary checkout, `main`, clean tracked state and no pending merge/rebase before further relevant operations.
- Operator correction: verify upstream breaking metadata before proposing a duplicate merge marker.
  Upstream `7dafb7c2e44340b7deb3d4fca65e400611da0423` already carries the current-run `isBackground` breaking subject/footer, retained by a genuine merge.
  The workspace-retention change is an ordinary upstream fix in the same core integration; record both behavior changes, without inventing another merge bump.
- Material intake: the incoming common-base-to-target inventory contains 172 paths, with 32 path intersections at the inspected fork checkpoint.
  Read-only merge previews exposed runtime/documentation conflicts and a lockfile inconsistency hidden by automatic merging.
  The lock preview retained selector references to Pi `0.84.4` after deleting their dependency entries.
- The initial preservation proposal would have restored that old dependency graph.
  The operator instead requested aligning selector Pi peers to `>=1.0.0` and development pins to exact `1.0.0`, with no source changes if compatible.
  Waited for the isolated verification agent to complete before applying the upgrade after the operator called out premature continuation.
- The isolated dependency probe passed installation, selector check, all 123 tests and frozen reinstall; exact Pi `1.0.0` compiled UI/context/catalogue mechanisms were also checked without live model requests.
  Main-checkout verification reproduced selector check, all 123 tests and frozen install after changing only the six manifest values and the lockfile peer context.
  Installs used `--ignore-scripts`; ordinary installation remains a final integration gate.
- Keep selector registry core `^1.0.0` and worktrees registry core `^5.0.0` unchanged.
  The probe does not establish complete old-core spawn/schema integration or compatibility with arbitrary future Pi versions.
  Its temporary logs/patch are under `/tmp/f0044-selector-pi1-*`; the durable evidence is the committed narrow diff, commands and limitations in the plan.
- Planning baselines: core/selector/worktrees checks passed, core packaged public-type verification passed, and the core suite passed 95 files / 2323 tests.
  These are not final-integration gate results.
- Separate source checks at pre-integration HEAD succeeded for both registered forks against the previous target.
  Remote stable-tag/manifest inspection found contained core `24.0.0` and worktrees `0.3.3` in the new target; the production resolver must still run independently for each fork on the completed genuine merge.
- The reviewer must regenerate both inventories and use the actual merge's first parent through reviewed HEAD, not a tag or plan-parent range.
  The already-completed selector contribution precedes that base and therefore needs explicit handoff/closing-summary attribution alongside, not a widened replacement integration range.
- The inherited fallback `0044-auto-allow-dev-null.md` retro belongs to a different upstream issue; this fork's continuity stays in root `f0044-` files.
  No new follow-up issue was identified; existing fork #26 remains out of scope.

#### Deferred tidyings

- No structural preparation was recommended.
  Accepted the optional initial-selection terminal-order/initial-only characterization test as the leading implementation step.
- Do not pre-extract lifecycle finalizers, progress streaming or selection/manager collaborators: upstream already supplies the target structures, and parallel restructuring would increase merge friction.
  Reconcile the fork behavior directly at those seams instead.
