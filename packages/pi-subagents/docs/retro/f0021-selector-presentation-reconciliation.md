---
issue: 21
issue_title: "Reduce selector presentation reconciliation with upstream UI changes"
---

# Retro: #21 — Reduce selector presentation reconciliation with upstream UI changes

## Stage: Planning (2026-09-24T15:46:06Z)

### Session summary

Committed the implementation plan at `packages/pi-subagents/docs/plans/f0021-selector-presentation-reconciliation.md` as `d255fb5a7791f7424c16c1e8ef6696e0b6fa921c` on `main`.
The operator selected a single ordinary presentation producer driven by raw pending/selected facts, preserving behavior rather than retaining a formatted-string overlay.
No production implementation, push, release, or issue mutation occurred; the next entry point is `/tdd-plan`.

### Observations

- The required initial `git pull --ff-only` reported already up to date; no later fetch occurred.
  Fixed upstream remains `edb35ee28535aac4e12431e47e440f6933911834`, inventory snapshot remains `746a4ae812a574d0496cb46c125a32961a608cf1`, and this session's implementation baseline was `fbd15ece7b0ec6091ff2259ef40f149e0131559a`.
  Fork issue 20 is shipped and closed; its initial-selection owner supplies the private facts this plan consumes without lifecycle changes.
- The approved producer stays in `src/tools/spawn-config.ts`, owns the sole model-name formula and ordinary tag/detail construction, and supplies a bound `detailFor` method to the runners.
  Keep the initial `detailBase` for resume/no-provider behavior, and keep the runner snapshot's parent ID for selected-model comparison rather than assuming it equals the initial resolution input.
  The current fork's empty-model-ID formatting differs from the fixed upstream truthiness check; preserve it explicitly.
- The operator declined the narrower tag-only alternative by choosing the unified producer.
  The plan removes tag-string interpretation and cross-file formula transfer, but an incoming inline upstream presentation change still needs adaptation into the local common producer.
  Activity wording is already shared today; consolidating pending precedence must not be sold as a newly shared wording mechanism.
- A disposable synthetic probe called real config resolution and the current overlay, partially mocking only the mode-label producer.
  With `twin`, ordinary and selected output both place the mode first; with `mirror`, ordinary remains mode-first while selected becomes thinking-first.
  Both characterization cases passed in one deterministic run per arm, demonstrating the existing reconciliation obligation rather than a delivered fix.
  The probe was removed, and the working tree was clean before writing the plan.
- Measured baseline checks passed: focused core run, 8 files and 188 tests; full core run, 86 files and 1984 tests; companion run, 9 files and 68 tests.
  Plan Markdown lint and commit hooks passed.
  No refactor, delivered before/after trial, full repository typecheck/lint, or interactive SDK-host acceptance was performed during planning.
- Tidy First recommended a test-only preparation: migrate selection runner cases from mutations of formatted tags to real resolved inputs before changing the producer.
  Real config adds genuine mode/background tags that the generic fixture intentionally omits; retain generic fixture defaults and give it only a no-op detail method, not a copied formatter.
  Delete old exported helpers and migrate all consumers/direct tests atomically when introducing the required method.
- An independent plan review caught a weak killing-mutation description: modifying only a `twin` branch cannot kill a `mirror` test.
  The plan now specifies the old algorithm's non-`twin` fallback as well, so the predicted order difference is real.
- Delivery evidence must include exact synthetic patches, fixture inputs, expected outputs, commands, exit statuses, and test output inside the repository for review.
  The model-formula trial includes a correctly repaired pre-change control and discloses the local-block adaptation that remains.
  Fork issue 19 stays open for overall maintenance assessment; no speculative follow-up was filed.

#### Deferred tidyings

- `src/tools/foreground-runner.ts` and `src/tools/background-spawner.ts`: a shared runner/lifecycle framework would enlarge the timing surface rather than prepare this presentation change.
- `src/ui/display.ts` and `src/tools/spawn-config.ts`: a generic tag parser, presentation discriminator framework, or separate cross-file presentation module would preserve the wrong coupling or add unnecessary abstraction.
- `src/ui/agent-widget.ts`: its existing private pending projection already suffices; timer/observer rewiring is outside this delivery.
- `test/tools/spawn-selection-boundary.test.ts`, `test/service/service-adapter.test.ts`, and `test/tools/agent-tool.test.ts`: broad harness or test-tree cleanup would disturb the integration evidence without making this change easier.

## Stage: Implementation — TDD (2026-09-24T16:34:40Z)

### Session summary

Completed all four planned steps as separate commits, using a fresh implementation subagent for each step at the operator's request: characterization, the bound common presentation producer, centralized pending activity, and reconciliation evidence.
Ordinary, pending, and confirmed details now share raw-input formatting in `spawn-config.ts`, while selection timing, public snapshots, and initial/fallback behavior remain unchanged.
The core suite increased from a measured 1984 to 1988 tests across 86 files, a net increase of four after migrating the old display tests; the parent independently reran the final core suite.

### Observations

- Initial `git pull --ff-only` reported already up to date, and the clean baseline passed root `check`, `lint`, `test`, and `fallow dead-code` before implementation.
  No subsequent fetch, push, release, or issue mutation occurred.
- Each code step exercised the plan's killing mutations and restored production sources before committing.
  The required `detailFor` interface migration initially failed because the method did not exist; separate mutations then exercised raw pending/selected substitution, snapshot-parent comparison, captured mode facts, non-`twin` ordering, each runner emission site, and fixture identity.
- Step 3 also strengthened `test/ui/transcript-content.test.ts`, which the module table predicted would remain unchanged, to pin ordinary activity and the absence of pending text.
  This was a test-only scope deviation; transcript production code and its two-argument formatter call were unchanged.
- Synthetic before/after trials and their literal fixtures, patches, expected/observed outputs, commands, exit statuses, and fixed source refs are preserved in `docs/architecture/selector-presentation-maintenance.md`.
  The initial isolated-tree invocation was blocked by pnpm's external `node_modules` link check before tests ran; invoking the installed Vitest executable completed the trials without changing dependencies.
  The evidence includes the correctly repaired pre-change model helper and explicitly retains the incoming-block adaptation obligation and empty-model-ID semantic difference.
- Final root `check`, `lint`, `test`, and `fallow dead-code` passed, as did recursive package tests, companion tests, and edited-document Markdown checks.
  Lockfiles were unchanged, and both issue-21 architecture completion markers were present.
  The commit subjects are `test:`, `refactor:`, and `docs:`; no feature/fix changelog entry or release claim was introduced.
- Pre-completion reviewer: WARN, with no blocking findings, scoped through `a3fefe83ab420e83ea529a79acf562590ea04460`.
  The fresh reviewer independently ran all four deterministic gates, inspected the synthetic evidence against source, and rendered the architecture diagrams; it did not rerun the diagnostic patches.
  Reviewer warnings: `test/tools/spawn-config.test.ts` resets its module-level `vi.fn()` in `afterEach` rather than the testing skill's required `beforeEach` convention.
  No isolation failure was observed; the non-blocking warning remains for the operator's ship decision.
- Local tests use stub sessions rather than an interactive SDK host, and no live-host acceptance is claimed.
  Issue 19 remains the overall maintenance assessment; the next workflow step on `main` is `/ship 21`.
