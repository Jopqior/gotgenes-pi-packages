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

## Stage: Implementation - TDD (2026-10-06T05:58:17Z)

### Session summary

Committed the fork-core migration, real packed compatibility acceptance and reviewed first-release artifacts through five planned steps plus two operator-approved corrective prerequisites.
The implementation comprises seven commits after the planning retro, with no remaining implementation steps.
Final tests measured 9571 passing cases, a net increase of 106 root tests over the 9465-case baseline; pre-completion review passed at the artifact commit before this notes-only append.

### Observations

- The operator required a new subagent for each plan step; the parent coordinated and performed read-only checks rather than implementing code.
  Identity, static imports and current documentation now target `@jopqior/pi-subagents-worktrees` with required `@jopqior/pi-subagents >=1.0.0` and published development range `^5.0.0`.
  The open upper bound is maintenance policy, not a future-major compatibility guarantee; configuration, opt-in, workspace/recovery behavior and the existing service key remain unchanged.
- The real packed matrix passed published floor core `1.0.0`/host `0.84.4`, published core `5.0.0`/host `1.0.0`, actual packed local core `5.0.0`/host `1.0.0`, missing core, inactive core and reversed initialization order.
  Positive rows exercised actual registration, configured opt-in/project override, detached workspaces, clean disposal, dirty saved bytes and shutdown unregister/re-registration against installed declarations and real services.
  This did not exercise LLM calls, live children or interactive TUI behavior.
  Core public-type checks and root gates passed; mutations pinned manifest/import/dependency/registry/settings contracts, production provider behavior in disposable packed copies, discriminating validators/asynchronous cleanup, bootstrap state/view agreement and exact canonical new-only output.
- Full-root testing exposed another permanent real-state empty assertion in `test/release/fork-sync-targets.test.mjs`, beyond the planned state-aware view prerequisite.
  The operator approved the extra test-only commit `test(repo): allow worktrees target artifacts after bootstrap (#37)`; the four applied artifact files were saved and restored byte-for-byte before that prerequisite.
  Advancing `HEAD` required fresh generation and renewed artifact approval rather than silent candidate reuse.
- An ordinary trailing-whitespace hook changed the generator's two hardbreak lines and rejected the artifact commit.
  The operator rejected hook configuration changes, skipping and `--no-verify`, required a new agent to fix the generator/tests and current-main core provenance spacing, and selected `blank_line_paragraphs` with explicit `new_format_only` acceptance after discussing historical-tag recovery effects.
  The corrective commit `fix(release): generate provenance without trailing whitespace (#37)` added exact format/provenance tests and passed the ordinary hook fixture twice, with `prek` installed before CI tests.
  Only whitespace in seven managed current-main core `CHANGELOG.md` blocks changed; headings, dates, values and disclosure text were preserved, and inherited worktrees history needed no correction.
- Published tags, npm artifacts and GitHub Releases were not rewritten.
  Current tooling deliberately rejects historical hardbreak provenance when reading old tagged artifacts or managed Release bodies; historical workflow reruns use their original scripts, while a normal next release does not require rescanning an old body.
  The dead-code gate passed; optional full `fallow` baseline findings remained non-gating and prompted no unrelated fixes.
- Attempts to focus tests through `pnpm run test:scripts --` unexpectedly selected the full root suite, including an initial timeout; direct `pnpm exec vitest run` supplied the intended focused command.
  Final applicable gates were actually green, without raising fixture timeout limits or attributing a proven flakiness cause.
  Raw baseline and final logs measured ten package suites with 8585 tests unchanged, including worktrees 74 and core 2165; root tests rose from 880 to 986.
- The original step-five agent session expired during operator clarifications; a replacement new agent freshly generated and applied the candidate rather than blindly resuming.
  The final reviewed source is `/tmp/worktrees-first-release-37-replacement-8RLeoN/candidate`, with `sourceHead` `08e919262d6131794a992148e3f1d95dfd6059ac`.
  Earlier external candidates were retained as stale evidence, not used as the final application source.
- The operator explicitly reapproved `approve_canonical_four` for the candidate's exact `applicationFiles`: `packages/pi-subagents-worktrees/package.json`, `packages/pi-subagents-worktrees/CHANGELOG.md`, `scripts/release/pi-subagents-worktrees/sync-state.json` and `docs/upstream/pi-subagents-worktrees-release-correspondence.md`.
  Artifact commit `bec7ce63e09658c948d0da951c80834cbf885d8d` is `docs(release): prepare reviewed worktrees first-release artifacts (#37)`.
  Freshness was checked immediately before copying, and after-commit validation confirmed exact candidate bytes, preserved inherited worktrees prefix/suffix bytes (13/6953), pending evidence/table agreement and unchanged unselected current-baseline bytes, including the authorized core cleanup.
  The review manifest `first-fork-release.json` remains external, not a tracked ledger; final raw logs, `part-b-results.json` and `after-commit-checks.json` reside in `/tmp/worktrees-first-release-37-replacement-8RLeoN`.
- The first version `0.1.0` is the operator's selection, not a predicted bump.
  Candidate evidence records direct upstream worktrees `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`, incorporated tip `9087a8dfa6edbfa1808fe3deab46ac3e17a7c032` and merge `877efb38d5ea8723391160e8c3d6d9597c40b1e5`.
- Pre-completion reviewer: PASS.
  Independent reviewer `0108ebd1-2a29-473` reviewed `10f308d7c47dc57f71c31446b19730d2367d3482..bec7ce63e09658c948d0da951c80834cbf885d8d`, independently ran root check/lint/full tests/dead-code, checked actual fork acceptance criteria and artifact/history/pending-state validation, and parsed the root Mermaid diagrams.
  The reviewer read the final raw packed logs rather than rerunning the network command, verified exact new-only format/backfill and historical-format rejection, and reported no warnings or unresolved decisions.
  No code commit followed that PASS; this append records the completed stage without changing the approved implementation or artifacts.
- Handoff to `/ship 37` is the manual untagged-bootstrap exception, not ordinary worktrees dispatch or correspondence CLI `--check` against the projected untagged row.
  Artifact-application approval does not approve tags, public npmjs.org destination/identity or GitHub Release effects; those still require separate operator approval.
  Any approved tag must identify artifact commit `bec7ce63e09658c948d0da951c80834cbf885d8d`, not blindly the later retro `HEAD`, and publication must use that exact tagged checkout after published preflight into an existing external output directory.
  No tag, push, npm publication, GitHub Release, release dispatch or issue closure occurred; the fork npm settings source remains absent until confirmed first publication, and Trusted Publisher/dashboard setup remains a later operator gate.

## Stage: Ship (2026-10-06T08:03:28Z)

### Session summary

Shipped on primary `main` in the trunk lane after fast-forward-only synchronization, root lint and dead-code checks.
The initial push carried ten commits through `606836fc18ac545f674798fe8d6761fb70c1de79`; [CI run 37432044463](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/37432044463) succeeded.
Closed issue #37 with the operator-approved comment anchored on behavior commit `1b55307a853eaefcdfbfbd8a24a0d09f31429a58`, then completed the separately approved manual first publication and GitHub Release.

### Observations

- The operator separately approved the exact close-comment text and the sole package `@jopqior/pi-subagents-worktrees`, public npmjs.org destination, selected first version `0.1.0`, artifact tag and GitHub Release effects.
  Candidate, artifact-commit and current application-file bytes matched before tagging.
- Tag `pi-subagents-worktrees-v0.1.0` points at approved artifact commit `bec7ce63e09658c948d0da951c80834cbf885d8d`, not the later retro tip.
  A temporary detached tagged checkout passed `release-artifacts.mjs published`, the tagged correspondence-table check and packing before the approved tag push.
- The operator ran `/tmp/worktrees-publish-37-U4S1Ik/wizard.sh` in an interactive terminal and confirmed completion.
  The script recorded successful manual npm publication and confirmation of Trusted Publisher fields: owner `Jopqior`, repository `gotgenes-pi-packages`, workflow `release.yml`, empty environment and direct publishing enabled.
  Credentials were not captured; dashboard configuration is not proof of exercised OIDC permission, and no verification release was dispatched.
- Created [the GitHub Release](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/pi-subagents-worktrees-v0.1.0) for that exact tag after re-running tagged preflight.
  Readback matched the tagged CHANGELOG section apart from GitHub's terminal newlines.
  No historical tag, npm artifact or Release body was rewritten, and successful publication required no registry polling.
- Added the fork npm suppression object to `.pi/settings.json` only after confirmed publication, with `extensions`, `skills`, `prompts` and `themes` all empty.
  Local core-first order and the upstream suppression entry remain unchanged.
  The existing package-contract suite passed all 14 tests; root lint and dead-code gates passed for this post-publication configuration.
- The changed-directory registry scan found only registered core and worktrees packages, with no unregistered directories or co-shipped close targets.
  Core's predictor exited successfully with empty stdout; its CHANGELOG whitespace correction cuts no release.
  Worktrees used the planned untagged-bootstrap exception, so ordinary prediction and `release.yml` dispatch were skipped rather than attempting to infer a first version.
- No peer branch or feature worktree existed to merge or tear down.
  Removed the clean temporary publication checkout; retained external candidate, tagged notes, packed tarball and completion markers for the handoff.
  Worktrees has no roadmap phase to finish; the deliberate next step is `/retro 37` at the root on `main`.

## Stage: Ship recovery (2026-10-06T08:31:31Z)

### Session summary

Reproduced the post-publication failure from [CI run 37433765386](https://github.com/Jopqior/gotgenes-pi-packages/actions/runs/37433765386) with the real first worktrees tag present on primary `main`.
Corrected only the release-correspondence corpus test and added discriminating first-heading controls; parent review, push and CI verification remain pending.

### Observations

- The first unpiped `pnpm exec vitest run test/release/release-correspondence-views.test.mjs` exited 1 with 1 failed and 11 passed tests at the original line 278.
  The corpus assumed every readable tagged section contained `/compare/`, then equated all matched tags with compare-heading count.
  The first-release generator deliberately emits a fork-owned `/releases/tag/` heading, and the production reader already validates its exact repository, package, version and tag.
  Actual tagged worktrees notes use that permitted first-release format; no fake previous tag or new manual exception is appropriate.
- The corpus now compares current and tagged headings exactly and distinguishes first headings from ordinary comparisons.
  First headings must belong to a registered fork, identify the first release row in that tag's state, resolve published correspondence and pass canonical provenance validation.
  Compare-heading census retains its count check and adds exact heading-array correspondence; historical manual exceptions and hardbreak rejection remain unchanged.
- New controls exercise a non-special first version, inherited same-version notes, wrong repository/package/URL version/heading version, malformed tags, noncanonical or suffixed URLs, duplicate first headings and mixed first/compare matches.
  Invalid headings remain rejected even when a valid compare link appears in their body.
  A temporary test-helper mutation that returned first-link text without invoking the strict reader caused all 9 new controls to fail while the other 12 tests passed; the mutation was removed before verification.
  Production files were not mutated, including during this test-seam probe.
- Targeted verification passed all 21 tests after restoring the helper.
  Red, green and mutation runs used Vitest's default plus JSON reporters without piping output; reports are retained at `/tmp/issue-37-release-views-red.json`, `/tmp/issue-37-release-views-green.json` and `/tmp/issue-37-release-views-mutation.json`.
  The applicable `pnpm exec vitest run test/release` suite passed 24 files and 403 tests.
- Root `pnpm run check`, `pnpm run lint`, `pnpm run test` and `pnpm fallow dead-code` exited successfully without changed timeout limits or new lint warnings.
  The root test script runs `pnpm -r run test` before the root suite; its root portion passed 43 files and 995 tests.
  No separate redundant workspace run was needed.
- Only the test file and this recovery entry changed.
  Published tag `pi-subagents-worktrees-v0.1.0` still resolves to artifact commit `bec7ce63e09658c948d0da951c80834cbf885d8d`.
  Package sources, manifests, CHANGELOGs, release production code, registry, evidence states, correspondence views and historical format policy remain untouched.
  No GitHub mutation, push, release dispatch, publication, tag change, upstream fetch, integration or history rewriting occurred; this recovery does not claim remote CI success.
- Fresh-context pre-completion reviewer: PASS for recovery commit `50cae000bfc6b71d67aa9f3eaa993ca484166a22` against `cb88e30170e9962789af869747c3b53ba216350a`, with no warnings or blocking findings.
  The reviewer independently ran root check, lint, full tests and dead-code gates, verified the tag census and exercised additional malformed heading, evidence and provenance controls.
  This notes-only append records that review; the parent still owns pushing and verifying remote CI.
