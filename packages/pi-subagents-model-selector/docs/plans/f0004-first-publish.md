---
issue: 4
issue_title: "pi-subagents-model-selector 首次发布（@jopqior 0.1.0）"
---

# Publish @jopqior/pi-subagents-model-selector 0.1.0

## Release Recommendation

**Release:** ship independently

This issue **is** the first publish of `@jopqior/pi-subagents-model-selector`.
Do not dispatch `release.yml`.
`scripts/release/next-version.sh pi-subagents-model-selector` still refuses until tag `pi-subagents-model-selector-v0.1.0` exists, and npm Trusted Publishing cannot create a package that does not exist.
After `/ship` pushes the packaging commits to `main` and CI is green, complete the manual first-publish checklist in TDD Order steps 3–4 **before** `issue_close`.
Later releases use `release.yml` as usual.

## Problem Statement

[#1] shipped `@jopqior/pi-subagents-model-selector` as a private local companion.
[#3] published the core as `@jopqior/pi-subagents` 1.0.0 and retargeted this package's `workspace:*` dependency, but left `private: true` and no `publishConfig` so the companion cannot go to npm yet.
This issue removes those publish blocks, publishes 0.1.0 by hand, tags it, and wires the post-publish disable entry.

## Goals

- Drop `private` from `packages/pi-subagents-model-selector/package.json` and add `"publishConfig": { "access": "public" }`.
- Change the core specifier from `workspace:*` to `workspace:^` so the published tarball depends on `@jopqior/pi-subagents` `^1.0.0` (operator decision; measured pack rewrite).
- Rewrite the package README so the tarball describes npm install and load-after-core, not "unpublished / do not add an npm: entry".
- Operator: first-publish 0.1.0 to npmjs.org (not the npmmirror default), tag `pi-subagents-model-selector-v0.1.0`, configure Trusted Publisher.
- After `npm view` returns `0.1.0`: add the `.pi/settings.json` disable entry and replace the root README "unpublished (local)" cell with the npm downloads badge.
- Verify with pack listing, `pnpm fallow dead-code`, and package check / lint / test.

## Non-Goals

- Any `src/` or `test/` behavior change.
- Hand-writing `CHANGELOG.md` for 0.1.0.
  `scripts/release/prepare-release.sh` creates one on the first automated release when the file is missing.
- Dispatching `release.yml` for 0.1.0.
- Editing `packages/pi-subagents/README.md` ("local companion").
  That is a visible `docs:` commit on an already-tagged package and would cut a core patch.
- Adding a `docs` (or `docs/*.md`) `files` allowlist entry.
  Internal `docs/plans` / `docs/retro` must not ship.
- Adding a `package-pi-subagents-model-selector` skill, issue-template rows, or a `pkg:` label ([#1] already wired those).
- Changing `files`, `version`, repository URLs, or peer dependency floors.

## Background

Author is the operator; the issue body is the working hypothesis except where measurement corrected it.
[#3] already flipped the dependency **name** to `@jopqior/pi-subagents`.
The remaining issue-body claim that it is still `@gotgenes/pi-subagents: workspace:*` is stale.
Newest inherited triage has no fork-issue-4 entry.
No open PRs.
No prior `f0004-` retro.
No `package-pi-subagents-model-selector` skill.

Operator decision in the planning gate: published core range is `^1.0.0` via `workspace:^`, not the exact `1.0.0` that `workspace:*` pack-rewrites to.

Measured at planning time:

| Fact                                                            | Value                                                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Local package name / version                                    | `@jopqior/pi-subagents-model-selector` `0.1.0`                                                        |
| `private`                                                       | `true`                                                                                                |
| `publishConfig`                                                 | absent                                                                                                |
| Core specifier in git                                           | `@jopqior/pi-subagents: workspace:*`                                                                  |
| Lockfile                                                        | `specifier: workspace:*` / `version: link:../pi-subagents`                                            |
| `pnpm pack` of current tree                                     | `dependencies["@jopqior/pi-subagents"]` = `"1.0.0"` (exact); tarball still contains `"private": true` |
| `pnpm pack` after a restored `workspace:^` spike                | `"^1.0.0"`                                                                                            |
| Pack listing                                                    | `LICENSE`, `package.json`, `README.md`, `src/*.ts`; no `test/`, `tsconfig.json`, `vitest.config.ts`   |
| npm `@jopqior/pi-subagents-model-selector`                      | 404                                                                                                   |
| npm `@jopqior/pi-subagents`                                     | 1.0.0                                                                                                 |
| `npm whoami --registry=https://registry.npmjs.org/`             | `jopqior`                                                                                             |
| Default `pnpm config get registry`                              | `https://registry.npmmirror.com/`                                                                     |
| `./scripts/release/next-version.sh pi-subagents-model-selector` | refuses (no `pi-subagents-model-selector-v*` tag)                                                     |
| Local tags for this package                                     | none                                                                                                  |
| `RELEASE_PLEASE_TOKEN`                                          | already present from [#3]                                                                             |
| `.pi/settings.json`                                             | local path present; no `npm:@jopqior/pi-subagents-model-selector` disable entry                       |

Tidy-First: skipped (applicability gate — no `src/` / `test/` files change).
Design-review: skipped — no new shared interface field and no new layer wiring.

AGENTS.md constraints that apply:

- Do not add `npm:@jopqior/pi-subagents-model-selector` to `.pi/settings.json` until after the first npm publish ([gotgenes/pi-packages#600](https://github.com/gotgenes/pi-packages/issues/600)).
- First publish is manual, no `--provenance`; OTP is operator-interactive.
- Do not dispatch a release for a package `next-version.sh` prints nothing for.
- Default registry is npmmirror; every `whoami` / `view` / `publish` against npmjs.org must pass `--registry=https://registry.npmjs.org/`.
- Before pushing, verify `origin` is `Jopqior/gotgenes-pi-packages`.
- Never `git fetch --tags`.
- Do not edit `CHANGELOG.md` by hand.

## Design Overview

### What already moved in [#3]

```text
npm package name     @jopqior/pi-subagents-model-selector   (already)
version              0.1.0                                  (already; first version is operator-chosen)
workspace directory  packages/pi-subagents-model-selector   (unchanged)
tag pattern          pi-subagents-model-selector-v*         (unchanged; none yet)
core runtime dep     @jopqior/pi-subagents                  (name already; specifier changes here)
```

This is not a breaking change of any published package (the companion has never been on npm).
Use `chore:` / `docs:` on the packaging commits, not `feat!:`.

### Published dependency range

Keep the workspace protocol so `linkWorkspacePackages: false` still yields `link:../pi-subagents`.
Change only the alias:

```json
"dependencies": {
  "@jopqior/pi-subagents": "workspace:^"
}
```

`pnpm pack` (measured) rewrites that to `"^1.0.0"` in the tarball.
`workspace:*` rewrites to exact `"1.0.0"`, which would pin every 0.1.0 install to core 1.0.0 and force a companion republish on every core patch.
Do not switch to a registry specifier (`"^1.0.0"` without `workspace:`): that would resolve from npm instead of the local core.

`pnpm install` after the specifier change updates only the lockfile `specifier:` line.

### README that ships in the tarball

npm auto-includes `README*`.
Update it in the same commit as `private` / `publishConfig`, **before** pack / publish.

Required delta:

- After the H1, add the badge row used by `@jopqior/pi-subagents` (npm version, CI against `Jopqior/gotgenes-pi-packages`, license, TypeScript, pnpm, Pi Package).
- Replace "This is a private, locally loaded companion."
  Keep "Installing or upgrading the core alone does not change selection."
- Install section: `pi install npm:@jopqior/pi-subagents` then `pi install npm:@jopqior/pi-subagents-model-selector`, plus a settings example listing those two `npm:` sources in that order.
  Keep a second example with the relative checkout paths.
  Keep the load-after-core sentence (registration is at load time).
- Delete "Do not add an unpublished `npm:@jopqior/pi-subagents-model-selector` entry."

### Post-publish surface (not in the packaging commit)

| Path                            | When                                                                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.pi/settings.json`             | After npm 0.1.0 exists: add `{ "source": "npm:@jopqior/pi-subagents-model-selector", "extensions": [], "skills": [] }`. Keep the local `"../packages/pi-subagents-model-selector"` load path. |
| Root `README.md` Packages table | After npm 0.1.0 exists: replace `unpublished (local)` with the npm downloads badge, matching the `@jopqior/pi-subagents` row.                                                                 |

### Operator registry

```bash
npm whoami --registry=https://registry.npmjs.org/
pnpm --filter @jopqior/pi-subagents-model-selector publish --access public --no-git-checks --registry=https://registry.npmjs.org/
npm view @jopqior/pi-subagents-model-selector version --registry=https://registry.npmjs.org/
```

No `--provenance` on the first publish.
If npm prompts for OTP, the operator runs this in an interactive terminal, not the agent.

`RELEASE_PLEASE_TOKEN` is already set; this issue does not touch secrets.

## Module-Level Changes

### Added

None in `src/`.
This plan file and its retro live under `packages/pi-subagents-model-selector/docs/{plans,retro}/`, which `scripts/release/lib.sh` excludes from git-cliff.

### Changed

- `packages/pi-subagents-model-selector/package.json` — drop `private`, add `publishConfig.access: public`, `dependencies["@jopqior/pi-subagents"]` = `workspace:^`.
- `pnpm-lock.yaml` — `specifier: workspace:^`; `version` stays `link:../pi-subagents`.
- `packages/pi-subagents-model-selector/README.md` — published install docs and badges, as in Design Overview.
- `.pi/settings.json` — disable entry (post-publish commit only).
- Root `README.md` — Packages-table downloads cell (post-publish commit only).

### Predicted unchanged

| Path                                                                 | Claim                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `packages/pi-subagents-model-selector/src/**`                        | No behavior change.                                  |
| `packages/pi-subagents-model-selector/test/**`                       | No fixture or assertion change.                      |
| `package.json` `files`                                               | Stays `["src"]`.                                     |
| `package.json` `version`                                             | Stays `0.1.0`.                                       |
| `packages/pi-subagents-model-selector/CHANGELOG.md`                  | Still absent at 0.1.0.                               |
| `packages/pi-subagents/README.md`                                    | "(local companion)" left as Non-Goal.                |
| `.pi/settings.json` local path entry                                 | Stays `"../packages/pi-subagents-model-selector"`.   |
| `.github/ISSUE_TEMPLATE/*.yml` and `pkg:pi-subagents-model-selector` | Already present.                                     |
| `scripts/release/*`, `.github/workflows/release.yml`                 | Directory-name tags; `name` is read at publish time. |

If a predicted-unchanged `src/` or `test/` path appears in the packaging diff, stop and treat it as a design miss.

## Test Impact Analysis

No new Vitest files.
The testable surface is the packed manifest and the existing composition-root suite (workspace link still resolves).

Dry-runs at planning time (re-run at `/build-plan`):

```bash
npm view @jopqior/pi-subagents-model-selector version --registry=https://registry.npmjs.org/
# 404

npm whoami --registry=https://registry.npmjs.org/
# jopqior

./scripts/release/next-version.sh pi-subagents-model-selector
# Error: 'pi-subagents-model-selector' has no pi-subagents-model-selector-v* tag
```

After step 1, a new `pnpm pack` must show `private` absent, `publishConfig.access` = `public`, and `dependencies["@jopqior/pi-subagents"]` = `"^1.0.0"`.

## Invariants at risk

| Invariant                                                      | Constituency                       | Pin                                                                                                                                                                                              |
| -------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workspace link still resolves the core after `workspace:^`     | this package                       | `packages/pi-subagents-model-selector/test/composition-root.test.ts` — imports `publishSubagentsService` / `getSubagentsService` from `@jopqior/pi-subagents` (real module, fake service object) |
| Disable entry is not added before the npm package exists       | this repo's Pi / subagent launcher | Sequencing: settings.json commit is after `npm view` returns `0.1.0` ([gotgenes/pi-packages#600](https://github.com/gotgenes/pi-packages/issues/600))                                            |
| Fork tag for this package absent until the operator tags 0.1.0 | this issue                         | `git tag --list 'pi-subagents-model-selector-v*'` is empty until step 3                                                                                                                          |
| Pack allowlist still excludes dev files                        | npm consumers                      | `tar tzf` listing from step 2                                                                                                                                                                    |

## TDD Order

No red→green of new behavior; run as `/build-plan`.
Tidy-First added no leading steps.

1. **Make the package public** — drop `private`, add `publishConfig`, change the core specifier to `workspace:^`, run `pnpm install` for the lockfile specifier, rewrite the package README as in Design Overview.
   Verify: `pnpm --filter @jopqior/pi-subagents-model-selector run check`; `pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run`; packed manifest (below); `rg -n 'unpublished|Do not add an unpublished' packages/pi-subagents-model-selector/README.md` is empty; lockfile `specifier` is `workspace:^` and `version` is `link:../pi-subagents`.
   Pack probe:

   ```bash
   pnpm --filter @jopqior/pi-subagents-model-selector exec pnpm pack --pack-destination /tmp
   tar xzf /tmp/jopqior-pi-subagents-model-selector-0.1.0.tgz -O package/package.json \
     | jq '{private,publishConfig,dependencies}'
   ```

   Expect `private` null, `publishConfig.access` = `"public"`, `dependencies["@jopqior/pi-subagents"]` = `"^1.0.0"`.
   Commit: `chore(pi-subagents-model-selector): make the package public for 0.1.0`

   Killing mutation: leave `private: true` — packed `jq .private` is `true`, and `pnpm publish` refuses.
   Second class: leave `workspace:*` — packed dependencies value is `"1.0.0"`, not `"^1.0.0"`.
   Third class: leave the README "Do not add an unpublished" sentence — the `rg` pin in this step is non-empty.

2. **Pre-publish verify** — no extra commit unless something failed.

   ```bash
   pnpm --filter @jopqior/pi-subagents-model-selector exec pnpm pack --pack-destination /tmp
   tar tzf /tmp/jopqior-pi-subagents-model-selector-0.1.0.tgz
   ```

   Listing must contain `src/*.ts`, `README.md`, `LICENSE`, `package.json`.
   Listing must exclude `test/`, `tsconfig.json`, `vitest.config.ts`, `docs/`.
   Packed README contains `pi install npm:@jopqior/pi-subagents-model-selector` and does not contain `unpublished`.

   ```bash
   pnpm fallow dead-code
   pnpm run check
   NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint
   pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run
   ```

   Confirm the lockfile did not resolve `@jopqior/pi-subagents` from the registry (must remain `link:../pi-subagents`).

3. **Land on `main`, then operator first publish** — `/ship` pushes the commits, watches CI with `--repo Jopqior/gotgenes-pi-packages`, and **does not** dispatch `release.yml`.
   After CI is green, from that SHA:

   ```bash
   git remote get-url origin   # must contain Jopqior/gotgenes-pi-packages
   npm whoami --registry=https://registry.npmjs.org/
   pnpm --filter @jopqior/pi-subagents-model-selector publish --access public --no-git-checks --registry=https://registry.npmjs.org/
   npm view @jopqior/pi-subagents-model-selector version --registry=https://registry.npmjs.org/
   # expect 0.1.0
   git tag pi-subagents-model-selector-v0.1.0
   git push origin pi-subagents-model-selector-v0.1.0
   ```

   Then on npmjs.org: Trusted Publisher for `@jopqior/pi-subagents-model-selector`, repo `Jopqior/gotgenes-pi-packages`, workflow `release.yml`.

   Killing mutation (tag): skip the tag — `./scripts/release/next-version.sh pi-subagents-model-selector` still refuses, and the next automated release cannot start.

4. **Post-publish commits** — add the `.pi/settings.json` disable entry for `npm:@jopqior/pi-subagents-model-selector` (keep the local path).
   Replace the root README Packages-table `unpublished (local)` cell with the npm downloads badge for `@jopqior/pi-subagents-model-selector`.
   Verify: JSON of `.pi/settings.json` still parses; the new disable `source` is `npm:@jopqior/pi-subagents-model-selector`; `rg -n 'unpublished \(local\)' README.md` is empty.
   Commit: `chore: disable npm:@jopqior/pi-subagents-model-selector after first publish`

   Both files sit outside `packages/pi-subagents-model-selector/`, so `./scripts/release/next-version.sh pi-subagents-model-selector` still prints nothing after this commit — do not dispatch.
   Then `issue_close`.

   Killing mutation: add the disable entry in step 1 before the package exists — a later `pi update --extensions` / subagent launcher `npm install` of `npm:@jopqior/pi-subagents-model-selector` 404s ([gotgenes/pi-packages#600](https://github.com/gotgenes/pi-packages/issues/600)).

`/build-plan` runs pre-completion before its own finish; operator steps 3–4 happen in the ship session after that review.

## Risks and Mitigations

| Risk                                               | Mitigation                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm publish` hits npmmirror                      | Every publish/whoami/view passes `--registry=https://registry.npmjs.org/`    |
| Disable entry before the package exists            | Sequenced after `npm view` returns `0.1.0`                                   |
| `/ship` dispatches `release.yml` anyway            | Release Recommendation plus `next-version.sh` refusal until the tag exists   |
| `workspace:*` left in place                        | Step 1 packed-jq pin for `"^1.0.0"`                                          |
| Packed `private: true`                             | Step 1 packed-jq pin; publish would refuse                                   |
| Workspace link silently becomes a registry install | Step 2 lockfile pin: stays `link:../pi-subagents`                            |
| Tarball README still says unpublished              | Step 1 `rg` pin and step 2 packed-README probe                               |
| First automated release has no changelog to splice | `prepare-release.sh` already creates `CHANGELOG.md` when the file is missing |
| Sibling core README still says "local companion"   | Accepted Non-Goal; do not "fix" it here and cut a `pi-subagents` docs patch  |

## Open Questions

None.
Published range, first-publish destination, and version 0.1.0 were settled in the issue body plus the planning gate.

[#1]: https://github.com/Jopqior/gotgenes-pi-packages/issues/1
[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
