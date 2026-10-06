---
issue: 37
issue_title: "Publish @jopqior/pi-subagents-worktrees with fork-core compatibility"
---

# Retro: #37 — Publish @jopqior/pi-subagents-worktrees with fork-core compatibility

## Stage: Planning (2026-10-06T02:51:28Z)

### Session summary

Committed the single-package plan at `packages/pi-subagents-worktrees/docs/plans/f0037-fork-core-compatibility.md` in `cb24814165c0c000e2cf23948e995891243bc005` after an already-up-to-date fast-forward-only pull.
Reproduced the installed-package loading error, checked published core contracts and independent worktrees release evidence, and completed a fresh-context Tidy First assessment.
No implementation, registration, real artifact application, tag, push, publication or GitHub mutation occurred.

### Observations

- The operator selected required peer `@jopqior/pi-subagents >=1.0.0` with an open upper bound, following the selector's maintenance policy rather than capping future majors.
  The plan uses published development range `^5.0.0`, Pi development host `1.0.0`, and unchanged `linkWorkspacePackages: false`/`trustLockfile: true`.
- The actual installation under `/tmp/gotgenes-worktree-test` reproduced `Cannot find module '@gotgenes/pi-subagents'` through explicit offline extension loading; the core-only control passed.
  The current CLI reports `1.0.4`; the issue's original `1.0.3` remains reproduction history, not a dependency floor.
- Published core `1.0.0` already supplies every consumed service/workspace/settings export.
  Disposable copies of the real worktrees source with namespace substitutions passed type-checks, real-service registration, configured opt-in, real clean/dirty Git disposal and shutdown re-registration with core `1.0.0`/host `0.84.4` and core `5.0.0`/host `1.0.0`.
  These are source-projection probes, not completed packed-package acceptance; the maintained verifier must retest real tarballs, absence of the upstream core and negative load-order cases.
- External source type-checking required an installed-package-only `#src/*` mapping because the package uses extensionless imports.
  Keep that mapping confined to verification; do not alter runtime aliases or resolve against workspace source.
- Preserve factory-time registration, config/pruning before service lookup, and inactive-service early return.
  Correct comments/README: a required module that cannot resolve fails during loading; a resolvable core whose service has not initialized registers no provider, command or handlers.
  This is non-breaking first publication of a separate identity, not an automatic rename of upstream installations.
- Package baseline `test`, `check` and `lint` passed; tests measured 8 files and 74 cases.
  Focused root first-release/correspondence tests passed 2 files and 107 cases.
  The plan passed `rumdl check` and commit hooks; no full-root runtime validation is claimed for this planning-only change.
- Production `decideFirstForkRelease` verified merge `877efb38d5ea8723391160e8c3d6d9597c40b1e5`, independent upstream worktrees `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, and tip `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032` without evidence/ref writes.
  Revalidate during implementation; support from fork issue #36 is completed, but the selected first `0.1.0` and artifact review do not authorize publication.
- Accept the assessor's preparatory state-aware correspondence test before artifact application.
  The ordinary worktrees table CLI cannot validate an untagged projected first row without a pending decision; do not require a real tag before the separately approved bootstrap.
- Fix the root candidate-selection fixture's two-entry assumption in the same commit that appends worktrees registration.
  It initializes all registry manifests but edits only the first two package READMEs, so its expected result must exclude the untouched new registration.
- Persistent development-settings tests must allow a correctly disabled fork npm entry after approved publication.
  Verify its absence at the migration checkpoint, then add it only after confirmed first publication; do not make a permanent test prohibit the intended post-publication state.
- Implementation ends after reviewing and committing only the generator's four application files, with its review manifest retained externally and all core/selector evidence unchanged.
  `/ship 37` must use the manual untagged-bootstrap handoff and obtain separate identity/destination/tagging/Release approvals; no ordinary first-release dispatch.

#### Deferred tidyings

- Declined `test/index.test.ts` fixture refactoring, recovery-suite reorganization and a cross-package Git/compatibility framework because they do not prepare the namespace migration.
- Keep core APIs, runtime bridge discovery, Git algorithms and shared service symbols unchanged; these are scope exclusions, not new follow-up issues.

Next action: `/tdd-plan` using the committed plan.
