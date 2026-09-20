---
issue: 15
issue_title: "Let model-selector release independently of core, following upstream worktrees"
---

# Retro: #15 — Let model-selector release independently of core, following upstream worktrees

## Stage: Planning (2026-09-20T13:33:04Z)

### Session summary

Synced `main`, investigated the published core API and upstream worktrees dependency pattern, and committed a numbered implementation plan on `issue-15-selector-independent-release`.
The operator selected required core peer `>=1.0.0` and registry development dependency `^1.0.0`.
No implementation or publication was performed; the next stage is `/tdd-plan`.

### Observations

- The earliest published fork core, `1.0.0`, has the required accessor, registration method, selection types, and shared service key.
  Published versions `1.0.0`, `1.0.1`, `1.0.2`, and `2.0.0` passed installation and real Pi `0.84.4` factory loading with a packed selector copy carrying the proposed metadata; source type checking was also run against `1.0.0`.
- Real baseline packing produced ordinary dependency `^2.0.0`.
  Proposed metadata preserved peer `>=1.0.0` across a copied sibling version change from `2.0.0` to synthetic `99.0.0`; this proves packing independence, not future runtime compatibility.
- Pi disables peer installation and strict peer validation.
  The dependency-kind change is therefore breaking for selector-only installation and needs an explicit migration note, even though README already documents installing core first.
- Fresh-process probes distinguished missing package, absent service, and synthetic incompatible service.
  The first fails at static import with a named missing-module error; the latter cases preserve the configuration diagnostic.
  Existing composition tests use fake services and are not substitutes for packed integration checks.
- Scratch evidence is under `/tmp/issue15-evidence`, not committed and not an implementation dependency.
  Recreate verification fixtures in the permanent script.
  The temporary consumer needed an explicit release-age override; do not weaken repository policy.
  For pnpm removal, `--ignore-scripts` was rejected; `--config.ignore-scripts=true` was accepted.
- No selector package skill, architecture roadmap, prior issue-15 retro, competing fork issue, or open fork PR was found.
  The historical coordinated-publication paragraph in `docs/upstream-sync.md` needs qualification, while old plans and retros should remain historical.
- Tidy-First recommended no preparatory refactoring.
  The chosen direction changes dependency resolution without changing the service interface, lifecycle, or source wiring.

#### Deferred tidyings

- `test/composition-root.test.ts`: do not extract its fake service for reuse by real-package verification; that would weaken the new test boundary.
- `src/index.ts`: do not refactor static imports, capability guards, or lifecycle hooks for this metadata change.
- `src/model-selector.ts`, `src/selection-labels.ts`, and selection fixtures: unrelated cleanup would not reduce the packaging change.

## Stage: Implementation — TDD (2026-09-20T14:56:40Z)

### Session summary

Completed all three planned steps: decoupled the selector's core dependency contract, added reproducible packed compatibility verification, and reconciled current release guidance.
The manifest cycle observed Red before Green; the characterization harness and subsequent isolation/diagnostic fixes were verified with killing mutations.
Selector Vitest tests increased from 61 to 68, and the repository total increased from 7484 to 7491; the final compatibility command reported 14 passing rows.

### Observations

- Required core peer `>=1.0.0` and registry development dependency `^1.0.0` replace the ordinary workspace dependency; the lockfile resolves development core `1.0.2` from the registry.
  The breaking commit documents explicit core installation and loading before the selector.
  Selector runtime source, core source, package versions, and generated changelogs remain unchanged.
- Real packed consumers passed installation, source type checking, and public Pi loader initialization against published cores `1.0.0`, `1.0.1`, `1.0.2`, and `2.0.0`.
  Real and isolated packing retained the peer floor across a synthetic sibling version change; negative rows exercised missing package, missing service, reversed load order, and a synthetic incompatible service.
  The matrix does not certify future core majors or interactive spawning.
- Manifest mutations each killed their intended assertion.
  Harness mutations exercised dependency packing, missing registration capability, removed capability guards, and silent returns; installed-core mutations used copies to avoid modifying pnpm store hardlinks.
  The old workspace-contract packing mutation needed installation of its disposable workspace before pnpm could resolve the workspace protocol.
- Parent inspection found a fixed temporary root contrary to the planned per-run isolation.
  The additional commit `test(pi-subagents-model-selector): isolate verification run roots` uses unique temporary directories and adds regression tests for uniqueness and cleanup, with separate killing mutations.
  Probe directory paths are constructed explicitly because recursive directory creation returns `undefined` when the directory already exists.
- The initial pre-completion review returned WARN: README overstated future compatibility and conflated missing-package loading with initialization errors; the missing-package assertion accepted an overly broad package-name prefix.
  Follow-up commits distinguish those failure modes and maintenance-policy limits, and require the observed missing-module diagnostic, full core package name, and selector error-entry path.
  Additional controls reject actual missing-service results, selector-name-only diagnostics, and wrong-entry diagnostics; mutations of the diagnostic and entry checks were rejected.
- Pre-completion reviewer: PASS on the corrective delta after the initial full-scope WARN review.
  Both reviews independently reran repository check, lint, tests, and dead-code gates; reviewers did not rerun the network matrix.
  Implementation reran the matrix from a clean tree and inspected its final output.
- Root lint exceeded Node's default heap during baseline verification.
  Baseline and final lint passed with command-local `NODE_OPTIONS=--max-old-space-size=8192`; repository memory configuration was not changed.
- No publishing, pushing, tagging, or issue closure was performed.
  All planned steps are complete; the additional isolation and review-fix commits are the implementation-order deviation.
  Next is `/sync-worktree 15`, then root-session `/ship 15`.

## Stage: Sync (worktree) (2026-09-20T15:01:06Z)

### Session summary

Pre-push lint passed with command-local `NODE_OPTIONS=--max-old-space-size=4096` after the default Node heap exhausted during ESLint; `pnpm fallow dead-code` passed without findings.
The plan's release marker is `ship independently` for the selector only; publication still requires operator approval at `/ship 15`.

**Peer session transcript:** `/home/whh/.pi/agent/sessions/--home-whh-projects-gotgenes-pi-packages--/2026-09-20T14-57-48-377Z_01a0bf52-c759-735f-9f1a-05a2e33aa9bf.jsonl` — read with `read_session_file` for message-level verification.

### Observations

- The feature branch is checked out in the root checkout, not a separate linked worktree; synchronization does not switch or modify `main` and does not push.
- The final `/retro 15` is deferred until after root-session `/ship 15`; this entry is only the sync breadcrumb.

## Stage: Ship (2026-09-20T15:12:18Z)

### Session summary

Fast-forwarded the feature branch into root `main`, passed root lint and dead-code gates, pushed, and verified CI run 35518488121.
The operator explicitly approved npmjs.org publication of `@jopqior/pi-subagents-model-selector` and the issue close comment.
Closed issue #15 and published selector `2.0.0` through successful release run 35518763495; core was not released.

### Observations

- The version script reported the expected major bump for the required-peer installation migration.
  The release tag `pi-subagents-model-selector-v2.0.0` was present on the pulled release commit.
- No co-shipped issue, adopted PR, or roadmap phase close was identified.
- Branch-based lane detection selected the worktree lane, but `git worktree list` showed only the root checkout, matching the sync note.
  The teardown script refused the absent peer directory; deleted the fully merged feature branch with `git branch -d` instead.
- The deliberate retrospective remains `/retro 15` at root on `main`.
