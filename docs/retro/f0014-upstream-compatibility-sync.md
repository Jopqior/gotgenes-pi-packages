---
issue: 14
issue_title: "Sync upstream main with fork compatibility review"
---

# Retro: #14 — Sync upstream main with fork compatibility review

## Stage: Planning (2026-09-19T13:09:32Z)

### Session summary

Committed a repository-level integration plan for the reviewed upstream snapshot, including conflict resolutions, automatic-merge audit paths, compatibility migration notes, verification, and later shipping.
No upstream merge, runtime/config edit, push, or publication occurred in this planning session.
The existing local permission file remains untouched.

### Observations

- The operator accepted all incoming upstream changes while preserving fork selection and identity, chose removal of project `pi-web-access`, and explicitly authorized discarding the existing local yolo config without a backup in favor of upstream's tracked configuration.
  This supersedes the issue's earlier preservation wording; deletion remains limited to the rechecked known file.
- The operator explicitly requested a new `@jopqior/pi-subagents` release after integration and CI, superseding the issue body's no-publication default.
  Other packages are not authorized for publication; derive the version rather than copying upstream's number, and check the companion's published dependency range before dispatch.
- `git pull --ff-only` reported up to date, but `main` still contains the unpushed SSH synchronization commit.
  The later push must include it; “up to date” did not mean equality with `origin/main`.
- A read-only `git merge-tree --write-tree` probe found six conflicts, all in documentation or package metadata.
  Both-sided source and test paths auto-merge, but that is not semantic verification.
  The complete audit list is in the plan.
- Fork GitHub API checks found no rulesets and an unprotected `main`; the release job explicitly grants write permission, so upstream's default-token checkout is applicable.
  Its release commit does not trigger ordinary push CI; watch the release workflow and verify the already-tested pre-release SHA.
- The existing real-Git/git-cliff release regression file passed all nine tests; current subagents derivation reports nothing pending before integration.
  No merged-tree runtime suite was run during planning.
- The initial Explore attempt could not resolve `sonnet-5`; the subsequent background attempt failed from provider capacity after operator model selection.
  Relevant release and documentation evidence was read inline instead.
  Tidy-First completed and recommended no preparatory source churn.
- Two assessor statements required correction: incoming `AssemblerIO.loadProjectContext` is required even though the prompt-builder parameter is optional, and `test/release/bumped-version.test.mjs` uses Vitest rather than `node --test`.
  The plan records the correct fixture requirement and runner.

#### Deferred tidyings

- `packages/pi-subagents/src/lifecycle/subagent.ts`: extracting run/construction helpers before the merge would overlap incoming abort-controller lifecycle edits without reducing integration risk.
- `packages/pi-subagents/test/lifecycle/nested-selection.test.ts` and `subagent.test.ts`: migrating selection tests to a speculative shared assembler fixture would add churn; keep existing layer-specific tests.
- `packages/pi-subagents/src/lifecycle/selection-scope.ts`: renaming fork selection vocabulary has no upstream collision to solve.
- `scripts/release/lib.sh`: making bounded derivation depend on tag lookup is unnecessary; preserve the independent bounded walk and incoming pipe-free lookup together.

## Stage: Implementation — Build (2026-09-19T14:36:53Z)

### Session summary

Completed the four build checkpoints: refreshed the baseline, merged the reviewed upstream batch, verified runtime and release surfaces, and recorded integration evidence.
The genuine two-parent merge is `0408aa5ff9d9811d98df17dde436e7fd45a5a3ad`, with upstream second parent `edb35ee28535aac4e12431e47e440f6933911834`; the fork retains package identity, spawn selection, bounded release derivation, and prefixed artifact lookup.
Three implementation commits landed before this stage note; the later shipping checkpoint remains unexecuted, with no push or publication.

### Observations

- Trunk synchronization succeeded and baseline type checks, lint, release regression tests, core tests, and selector tests passed before merging.
  The fetched upstream tip matched planning; the updated fork side contained the plan and planning-stage notes.
- Re-read the untracked permission file immediately before deleting only that authorized yolo-only file, without backup.
  The incoming tracked configuration was accepted unchanged, project web-access loading was removed, and fork extension loading/disable entries were retained.
- Resolved the six anticipated conflicts and reviewed the named automatic-merge paths against both parents.
  The fork issue 10 disposition moved with the upstream Phase 22 archive; this additional history-file edit preserves existing fork history rather than introducing a roadmap step.
  Corrected inherited hard-coded upstream API targets in lifecycle prompts and reconciled bash, local SDK-source lookup, package identities, and the genuine-merge exception in agent guidance.
- `pnpm install` completed with no lockfile delta.
  `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm -r run test`, `pnpm run test:scripts`, autoformat's separate acceptance suite, public-type verification, and `pnpm fallow dead-code` passed.
  The package-suite log contains 7,214 passing tests across 315 files in 10 packages; the script suite passed 160 tests and the separate acceptance suite passed both tests.
  Packed core inspection found the new project-context module, both declaration bundles, and fork identity, with no test, plan, retro, or local agent artifacts.
- Sorted tag names and object IDs were byte-identical before and after integration.
  The contained upstream subagents release is `pi-subagents-v21.7.3`; no upstream tags were imported.
- Release derivation produced `pi-subagents-v2.0.0`, outside the published selector's `^1.0.2` dependency range, so implementation paused for approval as planned.
  The operator explicitly authorized the companion compatibility update and later publication of both `@jopqior/pi-subagents` and `@jopqior/pi-subagents-model-selector` to npmjs.org; no other package is authorized.
  The source dependency already uses `workspace:^`, so no manifest or runtime edit was needed: a real pnpm pack of an isolated workspace with the derived core version produced `^2.0.0`.
  Added the companion's coordinated-upgrade documentation as its own commit and updated the plan's release dispatch scope.
  Subsequent derivation produced `pi-subagents-model-selector-v1.0.3`; both values are observed predictions, not published versions, and must be re-derived at ship time.
- `verify-cliff-parity.sh` exits 1 for eight never-tagged upstream-named sibling packages; both fork packages pass.
  This is a bounded verification exception, not authorization to import upstream tags or publish siblings.
- The operator opened a fresh Pi session and reported all requested smoke checks passing: model/thinking selection and cancellation, resume without another chooser and resumed-run abort, bounded listing with explicit limits, permission tripwires, and intended extension loading.
  This is operator-attested evidence, not observation through this session's stale tool instances.
- Pre-completion reviewer: PASS at `fa5286cd4f6495efd0244980ba76118233937571`.
  The full review independently reran gates; after a session restart cleared tool records, its transcript was recovered and a report-capture review verified unchanged HEAD and a clean tree, returning the required explicit `Overall: PASS`.
  The capture corrected two reporting errors: module counts were updated and recounted, and dual-package authorization was recorded in the plan and sync handbook before this implementation retro entry.
  Non-blocking notes concern inherited npm-scope wording, inherited test assertion style, and the never-tagged sibling parity results; no integration repair was requested.
- Next: `/ship 14` must verify fork targeting, push explicitly to `origin main`, await fork CI, recheck release permissions and the actual release window, and dispatch only `pi-subagents pi-subagents-model-selector`.
  Verify both published artifacts and the selector's packed dependency, then add published version correspondence and close the fork issue.
  Default-token release commits do not trigger ordinary push CI; observe the release workflow jobs instead.
