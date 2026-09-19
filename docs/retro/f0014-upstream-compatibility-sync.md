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
