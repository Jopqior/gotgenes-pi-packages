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
