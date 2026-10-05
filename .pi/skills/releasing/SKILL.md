---
name: releasing
description: |
  Load before dispatching a release, a package's first publish, adding a new package,
  editing a `files` allowlist, or when a same-day sibling bump fails `minimumReleaseAge`.
---

# Releasing and packaging

Load this skill before touching anything that decides what ships: a release dispatch, a package's manifest, or the workspace's package list.

## Dispatching a release

`.github/workflows/release.yml` triggers only on `workflow_dispatch` and takes an explicit package list plus an optional expected-SHA guard:

```bash
gh workflow run release.yml --repo Jopqior/gotgenes-pi-packages -f packages="pi-subagents" -f sha="$(git rev-parse HEAD)"
```

The example names a registered fork package, but registration is not publication approval: obtain explicit operator approval of this fork's npm scope and release destination before dispatching.
Only approved, registered package identities may be named; several can be releasable at once, and only the named ones go.
Deferring a release is therefore an omission with no state to clean up — just do not name the package.
A `release` concurrency group serializes runs.
Pass `--repo Jopqior/gotgenes-pi-packages` explicitly on this fork — it is a mutation, and the fork-header rule is to name the repo rather than rely on resolution.

To see what would release, without releasing anything:

```bash
./scripts/release/next-version.sh <pkg>   # prints <pkg>-v<version>, or nothing
./scripts/release/verify-cliff-parity.sh  # all packages: tags, package.json, and what is pending
```

Both are read-only and offline.
Use the first-release handoff below for an untagged package, never ordinary dispatch.
Never name a package that `next-version.sh` prints nothing for — `prepare-release.sh` validates every named package **before** writing anything, so one such package refuses the whole run and nothing is tagged.

The run's three jobs are `prepare` → `publish` → `github-release`.
After any failed release run, inspect the exact run and live main/tag refs before retrying; a failed `prepare` does not prove that no remote writes occurred.
Re-dispatch only after verifying that no completed or partial release exists and obtaining explicit retry approval.
For a later-job retry, verify its actual job/dependency scope excludes `prepare`; `gh run rerun --job` and `--failed` include dependencies.
If partial writes exist or retry scope is uncertain, stop for an explicit recovery decision.
Before rerunning publication, ensure its checked-out package paths match the tags: `pnpm publish --no-git-checks` packs the working checkout, so the preflight rejects Git-visible tracked or untracked package drift and compares each package's `package.json` and `CHANGELOG.md` against its tag byte-for-byte.

### Release completion

After the approved release run succeeds, resolve each actually released package's registered identity and version from the release commit and tags; verify them against the approved SHA and package set.
For each exact tag, read `gh release view <tag> --repo Jopqior/gotgenes-pi-packages --json tagName,url`, checking the returned tag against the expected one.
Successful workflow execution plus verified release commit, tags and GitHub Releases completes the release; missing or mismatched evidence requires investigation, not automatic republication.
Query npm only to investigate a publication failure or when the operator requests it; successful releases require no registry polling or pending-visibility handoff.

Versions and changelogs come from [git-cliff](https://git-cliff.org) reading local git, with no network in the derivation.
The maintained core and worktrees fork release levels additionally use each package's verified correspondence (below).
Preparation commits a decorated CHANGELOG section; the GitHub Release body comes from that exact tagged section, not a second render.
Each selected fork's generated table is committed with its own release evidence and checked against its own state by `node scripts/release/correspondence-table.mjs --check --package <directory>` (core remains the default).
See `docs/decisions/0002-git-cliff-release-automation.md` for why, and for the accepted residual (there is no release-PR review gate).

## What cuts a release

Release batching is plan-driven: `/plan-improvements` annotates each roadmap step with a grep-able `Release:` tag (and a `Release batches` subsection), `/plan-issue` derives a `Release Recommendation` from those annotations, and `/ship` reads the plan's `**Release:**` marker early — asking only when it is `mid-batch — defer`, otherwise releasing now.
A `refactor:`/`style:`/`test:`/`build:`/`ci:` commit is a skipped changelog type and does not cut a release on its own; such work lands on `main` and auto-batches into the next releasing commit.
`chore:` is **not** skipped — it is a visible "Miscellaneous Chores" section and cuts a patch on its own.
So a refactor-only plan's `Release Recommendation` rationale must not claim it will cut a release.
Do not reason about this from commit types when you can ask: `./scripts/release/next-version.sh <pkg>` applies the real rules offline and prints the tag that would be cut, or nothing.

Release is independent of any issue's open/closed state: holding an issue open does not defer its merged `fix:`/`feat:` commits, and closing one does not release them.
The only lever is which packages a release dispatch names, which makes deferral per-package by construction and leaves no state behind — there is no open pull request to remember.
A cross-package change names every package it bumps in one dispatch.

A package's internal docs directories — `docs/plans`, `docs/retro`, `docs/architecture`, `docs/decisions`, `docs/assets` — are excluded from its release scope by convention, in `scripts/release/lib.sh`.
Adding one of those subdirectories needs no configuration edit; adding a differently named one does.
So does adding a file *directly* under `packages/<pkg>/docs/`: the exclusions match `docs/<sub>/**`, so `docs/fallow-snapshot.json` cuts a release even though the `files` allowlist keeps it out of the tarball (Refs #966).
Tarball scope and release scope are different lists — check the one you mean.
Commits that only touch excluded paths do not trigger releases, and neither do files outside the package tree.
A package's own `CHANGELOG.md` is excluded too, so a release commit never re-enters the next changelog.

## Fork release levels

`pi-subagents` and `pi-subagents-worktrees` use independent verified upstream correspondence, not the integration merge's Conventional Commit type, to derive their next tags.
Each uses `scripts/release/<directory>/sync-state.json`: the SemVer distance between its own incorporated upstream releases, combined with git-cliff's view of fork-owned commits and each recorded merge's separately reviewed fork contribution.
The common `next-version.sh <directory>` contract remains offline and prints `<pkg>-v<version>` or nothing after a verified first release; supported routing does not waive registration or the first-tag gate.

Evidence failures are strict errors, not "nothing to release": a nonzero exit means record the missing sync or fix the state, never that the package is quiet.
There is no override flag.
Reviewed release evidence must be committed before dispatching a fork release.
Publication approval remains separate and names the registered package identities and destination.

A blocked fork in a multi-package dispatch fails the whole run before any write.
`prepare-release.sh` appends each selected fork's correspondence to its own state, decorates its CHANGELOG section with a fixed upstream source link and a provenance-not-equivalence statement, and regenerates only its marked table in `docs/upstream/<directory>-release-correspondence.md`.
Selecting both forks is supported after bootstrap; publishing only siblings leaves unselected fork state, view and package artifacts untouched.
Ordinary tagged-window changelogs still list upstream entries in full; the policy filters commits only to compute the level.
A first fork release instead uses the reviewed bounded summary and preserves inherited sections under the handoff below.
Existing npm tarballs and historical CHANGELOG entries are immutable; core-only historical GitHub Release backfill follows the separate preview/approval procedure in `docs/upstream/fork-release-policy.md`.
Read the [fork release policy](../../../docs/upstream/fork-release-policy.md) for the mapping rule, blocking cases, and recording procedure; explicit dispatch itself is unchanged.

## A package's first release

A brand-new package's **first** release is a manual, operator-chosen step.
Register its real directory and npm name in `scripts/release/release-packages.json` with the reviewed `original` or `fork` provenance; a fork additionally needs a supported verified evidence route.
Before first publication, obtain explicit separate operator approval of its npm scope/destination.
Registration is a required release gate, not publication authorization.
The generic `next-version.sh` refuses an untagged package rather than inventing its first version, and npm Trusted Publishing cannot create a package that does not yet exist.
For an approved original package, the operator publishes the first version manually with `pnpm --filter <approved-npm-name> publish --access public --no-git-checks --registry=https://registry.npmjs.org/` (without `--provenance`), tags it `<pkg>-v<version>`, then configures the npmjs.org Trusted Publisher for this fork's `release.yml` workflow.
For a supported new fork, use the artifact-only first-release generator under the [first fork release handoff](../../../docs/upstream/fork-release-policy.md#first-fork-release-handoff); read that owner before generation, application, tagging or first publication.
For worktrees, issue #37 owns migration/registration and compatibility checks; its selected `0.1.0` is an operator choice, not a predicted bump.
Review the bounded summary, verified direct upstream source, external candidate's `sourceHead` freshness and exact `applicationFiles` before separately applying and committing them.
Never dispatch ordinary preparation for an untagged first release.
First npm publication is manual without `--provenance`, after exact tagged-artifact preflight and explicit separate npm scope/destination approval; generator success and registration never grant that approval.
Configure Trusted Publishing only after that approved first publication, then use ordinary guarded dispatch for later releases.
An OTP-required publish (`ERR_PNPM_OTP_NON_INTERACTIVE`) needs the operator's interactive terminal.

## Same-day sibling bumps

A cross-package change bumping a dependent package to a **same-day-published** sibling hits pnpm's 24h `minimumReleaseAge` supply-chain gate — CI's `--frozen-lockfile` install and local `pnpm exec` hooks fail `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`.
`minimumReleaseAgeExclude` does not fix it (honored at resolution, ignored by pnpm's lockfile verification pass); the repo sets `trustLockfile: true` in `pnpm-workspace.yaml` to trust the reviewed lockfile and skip that re-verification.
Do not remove it, and do not reach for `minimumReleaseAge: 0` (which also disables the delay for a fresh `pnpm add`).

## Adding a new package

When adding a new package, wire it into all of:

1. `.pi/settings.json` — add the `../packages/<pkg>` load path.
   Add the `{ "source": "npm:<approved-npm-name>", "extensions": [], "skills": [] }` disable entry (prevents double-load) **only after the package's approved first npm publish**, using the registered manifest identity rather than assuming an inherited `@gotgenes/*` scope — before that, the `npm:` reference makes Pi and the subagent launcher `npm install` a nonexistent package and fail.
2. `README.md` — add the package to the Packages table, and to the no-dedicated-skill note unless it ships a `package-<pkg>` skill.
3. `.github/ISSUE_TEMPLATE/bug_report.yml` and `.github/ISSUE_TEMPLATE/feature_request.yml` — add the package to the `Package` dropdown in **both** forms.
   The dropdown is `required: true` and `blank_issues_enabled: false`, so a package missing here cannot be reported at all.
   These are static YAML that GitHub reads from the default branch, so they cannot derive the list at run time the way the labeler does.
4. `gh label create pkg:<pkg> --description "Issues related to <pkg>" --color 0075ca` — the label must exist before an issue selects the package, or `scripts/label-issues.sh` fails on `gh issue edit`.

Generic release prediction and the issue auto-labeler derive their package list from the workspace: `scripts/release/lib.sh` and `scripts/issue-package-labels.sh` enumerate `packages/*/package.json`.
A new package needs no edit to those discovery scripts, but the automated preparation and publication entry points reject it until its actual directory and npm identity are explicitly registered in `scripts/release/release-packages.json` as `fork` or `original`.
Only the fixed `fork-sync` routes for `pi-subagents` and `pi-subagents-worktrees` are supported; any other fork needs its own verified route before registration can make it releasable.
Worktrees support is not actual migration or registration: while its manifest still names `@gotgenes/pi-subagents-worktrees`, it must not be registered or published as the eventual fork identity.
Registration never approves a new npm scope or publication destination.

## Docs-in-distribution convention

The published npm tarball ships runtime code, user-facing docs, and nothing else — no dev files (`test/`, `tsconfig.json`, `vitest.config.ts`, `AGENTS.md`, `.pi/`, `.prettierignore`) and no internal working docs.
Every package uses a `files` allowlist in `package.json`; no package uses `.npmignore`.
A bare directory entry (e.g. `"src"`) is recursive, so runtime code ships without allowlist edits as it grows; npm always auto-includes `package.json`, `README*`, and `LICENSE*` regardless of the allowlist.
List only the additional top-level ship targets explicitly: `dist` (built type bundles), `schemas`, `config/*.example.json`, and user-doc paths.
Ship the docs the README links to (`docs/*.md` plus referenced subdirectories such as `guides`/`migration`/`assets`/`architecture`/`decisions`), never a bare `"docs"` entry — that would also ship `docs/plans` and `docs/retro`.
A package with no user-facing docs omits any `docs` entry from its allowlist entirely.
A link from a shipped doc into a non-shipped path (`docs/decisions/`, `docs/architecture/`) resolves to nothing in the tarball — use an absolute GitHub URL, or add the target to `files`.
Verify the allowlist with `pnpm --filter <pkg> exec pnpm pack --pack-destination /tmp` and inspect `tar tzf` for the expected file set — confirm it contains runtime code and user docs, and excludes `test/`, dev config, and internal docs.
Run `pnpm fallow dead-code` locally before pushing a new or dependency-changed package — CI gates on it, and `devDependencies` copied from a sibling package often include unused entries.

## Workflow scripts

A multi-line `run:` block in `.github/workflows/` belongs in `scripts/`, with the workflow keeping a one-line invocation.
Split a script that pushes from the read-only derivation it calls, and refuse the pushing half outside CI — `scripts/release/prepare-release.sh` guards on `CI`, `scripts/release/next-version.sh` only prints.
