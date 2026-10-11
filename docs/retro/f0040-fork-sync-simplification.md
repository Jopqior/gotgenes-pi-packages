---
issue: 40
issue_title: "refactor(repo): simplify fork-sync scripts, release integration, and tests"
---

# Retro: #40 — refactor(repo): simplify fork-sync scripts, release integration, and tests

## Stage: Planning (2026-10-10T15:15:27Z)

### Session summary

Committed the repository-scoped implementation plan in `f05e395efa052e5758dc2cd26ed70766d0a03ea6` after the required fast-forward-only pull reported the checkout current.
Inventoried live script/prompt/CI consumers and scenario-level test dispositions, then verified source reconstruction and ordinary git-cliff behavior against real fork/upstream objects.
The plan sequences new source and metadata modules alongside the old consumers, one accepted preparatory test commit, a coordinated policy removal, namespace cutover and separate packaged-documentation refresh; no implementation, integration or publication began.

### Observations

- The operator approved automatic source preflight in a temporary bare repository during release preparation.
  Normal execution is in CI; an explicitly allowed local preparation follows the same route, while local version prediction remains offline.
  Acquisition must use no-tag fetch into temporary refs, leave the fork's refs/config/tag namespace untouched, fail before tracked release writes and clean temporary resources on both outcomes.
- The operator asked whether preserving the existing latest-tag range contradicted the issue.
  It does not: the issue explicitly asks to retain justified local range-safety fixes, and the real first-release history measured `1.0.1` with the bound versus the false `2.0.0` without it.
  Removing the fork-specific version policy must not remove `bumped_version`'s ordinary range safety.
- Real current core source resolves to stable `23.2.0` at `6879774308ba8056859fa42284da71763fe1fe78`, incorporated through `8d373ceab20c5236b08d8d6c032fd515b9fa8dc4`.
  Worktrees independently resolves to `0.3.3` at `62924b0a8389eed41c4da93b0bf0ea89e0b5c794`; newer remote tags do not become incorporated source.
  Real positive-tail range probes used actual upstream commits, but those tips were not integrated into this fork; the plan labels that distinction.
- The first historical git-cliff probe accidentally left later fork tags visible and produced misleading historical predictions.
  Those results were discarded; disposable checkouts at the real preparation commits, with future tags removed only there, produced the measured ordinary `5.0.0` and `6.0.0` predictions.
  Current core/worktrees predictions both return successful empty stdout.
- Tidy First exposed an invalid reuse premise: the old single-fork fixtures create “upstream” branches from fork HEAD.
  New source fixtures must have independent upstream ancestry, real stable tags and local bare transport, not merely omit ledger fields.
  Accepted preparation is limited to isolating exact section/CRLF/fence contracts from ledger fixtures in the plan's step 3.
- The exact section corpus has existing first-tag gaps for core and selector; preserving scanner failures is not authorization for historical repair.
  The old insertion helper also normalizes boundary bytes, so prepared/tagged section equality needs a new executable pin rather than an assumption.
- `.pi/prompts/ship.md`'s executable registry import and `test/worktrees/package-contract.test.mjs`'s exact registration assertion are coordinated migration points outside an ordinary release-script import sweep.
  The packaged README changes have their own `docs:` commit, separate from the breaking root-tooling commits, to avoid assigning package major bumps for maintainer guidance alone.
- Planning checks passed: the full root script suite measured 43 files / 995 tests, and the explicit focused version suite measured 12 tests.
  `pnpm run test:scripts -- <file>` ran the whole suite in this environment; use `pnpm exec vitest run <file>` for a focused run.
  The plan passed `rumdl` and commit hooks.
- No concrete follow-up issue was identified; the open fork selector issue #26 is unrelated.
  Temporary probe files are disposable evidence, not implementation artifacts; the committed plan records the real Git inputs and measured results for regeneration.

#### Deferred tidyings

The assessor rejected rebuilding old ledger fixtures, extracting obsolete decision/recorder/table helpers, compatibility wrappers, a larger script-copy framework, mechanical line-count splitting and generic tag-selection-loop cleanup.
None is an implementation task or an approved follow-up issue; the plan removes obsolete responsibilities instead.

## Stage: Implementation — TDD (2026-10-11T11:12:13Z)

### Session summary

Completed the implementation sequence: six code/characterization cycles, the separate packaged-documentation verification step, and the independent quality gate.
Fork releases now use ordinary bounded path-scoped version prediction, temporary-repository source preflight, exact tagged source notes and the simplified `fork-sync` entry points; obsolete policy, ledgers, recorder, tables, backfill and candidate tooling are removed.
The final full suite passed 9,625 tests versus the 10,001-test implementation baseline, with root scripts changing from 44 files / 1,006 tests to 26 files / 630 tests; the reduction follows removal and consolidation of obsolete scenarios.

### Observations

- Startup found no unresolved Git operation or tracked changes, and the required fast-forward-only pull reported the checkout current.
  The final `pnpm run test`, `pnpm run check`, root `pnpm run lint` and root `pnpm fallow dead-code` passed.
  No package runtime source, manifest, lockfile, settings or `CHANGELOG.md` changed.
- The operator chose direct refusal when a newer merge's origin cannot be proved from fresh upstream history or fork-side ancestry.
  The source resolver does not use cached `upstream/main` as auxiliary evidence or fallback.
  Normal provable fork features remain excluded from source selection; ambiguity is a stop rather than a stale-source guess.
- An early source-worker implementation was discarded after bounded re-reading exposed a mismatch with the approved interface and tail semantics.
  Its green and mutation logs are invalid evidence and were not committed.
  The corrected narrow interface, temporary bare/shared/no-tag acquisition, positive package-tail display and offline validation were re-tested before committing.
  Read this plan in bounded chunks: a single full-file tool read truncates before its end.
- Killing mutations were restored from saved green copies and re-run before commits.
  A deleted-CLI/missing-module mutation was rejected as a semantic version-policy pin; output-only source-version overrides instead demonstrated wrong predictions separately for each fork.
  The operator briefly mistook these temporary literal overrides for final dependencies, so announce transient mutation intent before changing production files.
  The final `lib.sh` contains neither override.
- Real-history source round trips used existing fork/upstream objects with controlled local bare tag catalogs, not a fresh remote-tag census.
  Ordinary git-cliff samples were replayed at the plan's actual historical preparation commits, removing future tags only in disposable clones.
  The explicit latest-tag lower bound remains load-bearing; no live integration or tag import occurred.
- New-section composition removes git-cliff's leading prefix and owns its boundary bytes once.
  Process tests compare the complete prepared section with its tagged reuse and preserve the old CRLF suffix exactly, including the missing-CHANGELOG route.
  One process-heavy multi-job publication test required a local 15-second timeout under concurrent package/root execution; no global timeout or runtime default changed.
- Cold Markdown validation after moving the guide exposed one historical relative link in `f0038-pinned-upstream-sync.md`.
  It now points to that plan's original planning-commit guide without changing the historical constraint text or adding an alias.
  A current core architecture paragraph still named the old prompt; it received a separate `docs:` commit after the two-README commit, without changing module structure or roadmap status.
- The module table's `create-github-releases.sh` required no direct edit: its existing shared artifact-validator call and whole-set remote preflight now consume the new validation route.
  The packaged README changes remain separate from both breaking root-tooling commits.
- Pre-completion reviewer: PASS, with no required fixes or WARN findings.
  The fresh-context reviewer reran deterministic gates, derived its own safety inputs, exercised independent scratch and real-object probes, and checked source lifecycle, own-package tails, section-byte reuse, selected-set failure boundaries, imports and current documentation.
  It also observed the unchanged whole-workspace parity utility refusing inherited untagged packages; the documented no-first-tag refusal remains intentional, and registered-fork predictions were exercised separately.
- All implementation steps are complete; no concrete out-of-scope follow-up was filed.
  Local commits are unpushed, and no GitHub mutation, release dispatch or publication occurred.
  Next is `/ship 40` on `main`; use a fresh Pi session before the first actual `/fork-sync` invocation because prompt registration is stale in this process.

## Stage: Ship (2026-10-11T11:47:30Z)

### Session summary

Shipped through the trunk lane after a fast-forward-only pull and passing root lint/dead-code gates.
Implementation CI passed in run `38135532263`; the operator approved the exact close comment and publication of both registered fork packages to npmjs.org, and issue #40 was closed.
Release run `38135949915` prepared `cc3eb353256a7f4bf2d9fac85cf8cca71cd463bd`, with parent `3cb2baf286c68378c139f6795a59495a29390710`, and ultimately completed successfully on attempt 2.
Both package tags and GitHub Releases were verified: `@jopqior/pi-subagents` at `6.0.1` and `@jopqior/pi-subagents-worktrees` at `0.1.1`.
The local checkout fast-forwarded to the release commit; no worktree existed to remove.

### Observations

- The first publish attempt successfully published core, then worktrees failed its OIDC token exchange and registry PUT with HTTP 404.
  Both Git tags already existed, while both GitHub Releases were absent; the initial immediate npm query missed core, but a later registry query confirmed `6.0.1`.
  The operator found worktrees' Trusted Publisher marked Expired and deleted/recreated that configuration.
- No full workflow re-dispatch or prepare retry occurred.
  Recovery was separately approved after inspecting GitHub CLI `2.100.0`'s rerun endpoint, GitHub's selected-job/dependent-job contract, the pinned pnpm `11.25.0` implementation, and the original publish checkout at the exact tagged release commit.
  The filtered pnpm publish route skips registry-existing versions without `--force`; the production script supplies no such flag.
- Rerunning only publish job `114459796220` retained the successful prepare result and ran publish plus downstream github-release.
  Attempt 2's logs show core skipped as already published, worktrees `0.1.1` published, and both GitHub Releases created from the original release commit.
  The earlier blanket warning against failed-job retry was too broad; the actual job scope, pinned publish semantics and tagged checkout determine whether recovery is safe.
- The plan-anchor range also contained issues #41 and #42, but each already had its own completed ship and curated close summary.
  No additional issue or PR close target was identified, and this repository-scoped issue completes no package roadmap phase.
- The next step is `/retro 40` at the root on `main`; no new implementation or workflow-policy change was folded into release recovery.
