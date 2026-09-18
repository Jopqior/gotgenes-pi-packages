---
issue: 3
issue_title: "pi-subagents 迁移到 @jopqior scope 并完成首次发布"
---

# Publish @jopqior/pi-subagents 1.0.0

## Release Recommendation

**Release:** ship independently

This issue **is** the first publish of `@jopqior/pi-subagents`.
Do not dispatch `release.yml`.
`scripts/release/next-version.sh pi-subagents` still refuses until tag `pi-subagents-v1.0.0` exists, and npm Trusted Publishing cannot create a package that does not exist.
After `/ship` pushes the rename to `main` and CI is green, complete the manual first-publish checklist in TDD Order steps 5–7 **before** `issue_close`.
Later releases use `release.yml` as usual.

## Problem Statement

[#1] added spawn-selection to this fork's `pi-subagents`, and `@jopqior/pi-subagents-model-selector` depends on that local core via `workspace:*`.
The fork cannot publish the companion until it publishes the core under its own npm scope.
[#2] already synced upstream `main` (baseline `pi-subagents-v21.7.0`) and recorded the conflict recipes; this issue performs the rename, the 1.0.0 first publish, and the release-token setup.

## Goals

- Rename this workspace's core package to `@jopqior/pi-subagents` at `version` `1.0.0`, with `repository` / `homepage` / `bugs` pointing at `Jopqior/gotgenes-pi-packages`.
- Retarget only the `workspace:*` consumer (`pi-subagents-model-selector`) and the published identity surface listed in Design Overview.
- Keep every runtime contract string (`Symbol.for("@gotgenes/pi-subagents:…")` and the cancellation marker) unchanged.
- Leave `@gotgenes/pi-subagents-worktrees` on npm `@gotgenes/pi-subagents@^16.4.0`.
- Hand-write a `CHANGELOG.md` 1.0.0 section that names upstream baseline 21.7.0; keep the inherited 21.x sections below it.
- Operator: store a `contents:write` PAT as Actions secret `RELEASE_PLEASE_TOKEN` (no `release.yml` edit).
- Operator: first-publish to npmjs.org (not the npmmirror default), tag `pi-subagents-v1.0.0`, configure Trusted Publisher, then land the disable entry and the correspondence row.
- Verify with pack listing, `pnpm fallow dead-code`, and `pnpm -r run test`.

## Non-Goals

- [#4] `@jopqior/pi-subagents-model-selector` first publish (`private`, `publishConfig`, its disable entry).
- Renaming any other `@gotgenes/*` package, including worktrees.
- Changing contract strings or retargeting worktrees imports / peer / devDependencies.
- Rewriting `docs/architecture/`, `docs/decisions/`, `docs/plans/`, `docs/retro/`, comparison-with-upstream.md, permission-system comments, or `.pi/skills/package-pi-subagents/SKILL.md`.
- Editing `release.yml`, `scripts/release/*`, or `cliff.toml` bump/parser rules (only the `<REPO>` postprocessor changes).
- Importing upstream tags, changing the `pi-subagents-v*` tag prefix, or dispatching `release.yml` for 1.0.0.
- Rewriting baked `https://github.com/gotgenes/pi-packages` URLs inside historical `CHANGELOG.md` 21.x sections.

## Background

Author is the operator; the issue body is the working hypothesis.
[#2] is closed: `docs/upstream-sync.md` already has the post-rename `package.json` and `CHANGELOG.md` splice recipes.
Its manual conflict guidance preserves the fork's `name` and `version` while accepting upstream dependency changes.
Newest inherited triage (`docs/triage/2026-09-02-backlog.md`) has no fork-issue-3 entry.
No open PRs.
No prior `f0003-` retro.

Operator decisions in the planning gate:

1. Keep contract strings; leave worktrees on npm `@gotgenes/pi-subagents`.
2. Rewrite only the published identity surface, not architecture/history.
3. Configure `RELEASE_PLEASE_TOKEN` as a PAT; do not switch the workflow to `GITHUB_TOKEN`.

Measured at planning time:

| Fact                                                 | Value                                                  |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Local package name / version                         | `@gotgenes/pi-subagents` `21.7.0`                      |
| npm `@jopqior/pi-subagents`                          | 404                                                    |
| npm `@gotgenes/pi-subagents`                         | 21.7.0                                                 |
| `npm whoami --registry=https://registry.npmjs.org/`  | `jopqior`                                              |
| Default `pnpm config get registry`                   | `https://registry.npmmirror.com/`                      |
| `gh secret list`                                     | empty                                                  |
| Local tags                                           | 0                                                      |
| Media URLs in `package.json` `pi.video` / `pi.image` | HTTP 200 from archived `gotgenes/pi-subagents`         |
| model-selector import sites of the package name      | 4 (`src/index.ts`, `src/model-selector.ts`, two tests) |
| `MISSING_CORE_MESSAGE`                               | 1 production string, 1 verbatim assertion              |
| worktrees lockfile specifier                         | `@gotgenes/pi-subagents@^16.4.0` from the registry     |

`linkWorkspacePackages: false` means model-selector's link exists only because of the explicit `workspace:*` entry.
That entry must flip in the same commit as the four specifiers, or they do not resolve.

Tidy-First: no preparatory commits (assessor: every target file is a literal substitution; extracting `MISSING_CORE_MESSAGE` would make the diagnostic assertion tautological).
Design-review: skipped — no new shared interface field and no new layer wiring.

AGENTS.md constraints that apply:

- Do not add `npm:@jopqior/pi-subagents` to `.pi/settings.json` until after the first npm publish ([gotgenes/pi-packages#600](https://github.com/gotgenes/pi-packages/issues/600)).
- Keep the existing `npm:@gotgenes/pi-subagents` disable entry (`.pi/npm/` still holds the upstream tarball).
- First publish is manual, no `--provenance`; OTP is operator-interactive.
- Do not dispatch a release for a package `next-version.sh` prints nothing for.
- Full-workspace tests: mock producers spell the package as an object key, so a call-site grep is not enough ([gotgenes/pi-packages#807](https://github.com/gotgenes/pi-packages/issues/807)).
- Before pushing, verify `origin` is `Jopqior/gotgenes-pi-packages`.
- Never `git fetch --tags`.

Default npm/pnpm registry on this machine is npmmirror, while the auth token is scoped to `registry.npmjs.org`.
Every `whoami` / `publish` / `view` in this issue must pass `--registry=https://registry.npmjs.org/`.

## Design Overview

### Identity vs contract

```text
npm package name     @jopqior/pi-subagents          (changes)
workspace directory  packages/pi-subagents          (unchanged)
tag pattern          pi-subagents-v*                (unchanged)
Symbol.for keys      @gotgenes/pi-subagents:…       (unchanged)
```

`publish-released.sh` reads `package.json` `name` at publish time and tags from the directory name, so later `release.yml` runs need no script edit.
Keeping the keys means local worktrees (which import `getSubagentsService` from npm `16.4.0`) still attach to this fork's loaded core, and so does npm `@gotgenes/pi-subagents-worktrees`.

This is not a breaking change of the npm `@gotgenes/pi-subagents` package (different package, different repo).
It **is** a workspace identity break for anything that imported `@gotgenes/pi-subagents` via `workspace:*`.
Use `feat(pi-subagents)!:` with a `BREAKING CHANGE:` footer on the rename commit.

### Published identity surface (rewrite)

Replace `@gotgenes/pi-subagents` with `@jopqior/pi-subagents` only where it names **this** package.
Do not replace `@gotgenes/pi-subagents-worktrees` or the family prose `@gotgenes/pi-*`.
Use a negative lookahead / replace worktrees first, then the bare name.

| Path                                                                 | What changes                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/package.json`                                 | `name`, `version` `1.0.0`, `repository` / `homepage` / `bugs` → `Jopqior/gotgenes-pi-packages`. Keep `description` (including the tintinweb clause), `author`, `pi.video`, `pi.image`, `files`, `exports`.                                                                                                                                            |
| `packages/pi-subagents-model-selector/package.json`                  | `dependencies["@jopqior/pi-subagents"] = "workspace:*"`. Do not drop `private` (that is [#4]).                                                                                                                                                                                                                                                        |
| `packages/pi-subagents-model-selector/src/index.ts`                  | Import specifier and `MISSING_CORE_MESSAGE`.                                                                                                                                                                                                                                                                                                          |
| `packages/pi-subagents-model-selector/src/model-selector.ts`         | Type-import specifier.                                                                                                                                                                                                                                                                                                                                |
| `packages/pi-subagents-model-selector/test/composition-root.test.ts` | Import specifier and the verbatim `MISSING_CORE_MESSAGE` assertion.                                                                                                                                                                                                                                                                                   |
| `packages/pi-subagents-model-selector/test/model-selector.test.ts`   | Type-import specifier.                                                                                                                                                                                                                                                                                                                                |
| `packages/pi-subagents-model-selector/README.md`                     | Prose that names the core package (`Ask for…`, `Load **after**`). Load paths stay `../packages/pi-subagents`.                                                                                                                                                                                                                                         |
| `packages/pi-subagents/scripts/verify-public-types.sh`               | `probe.ts` / `probe-settings.ts` imports and the final echo.                                                                                                                                                                                                                                                                                          |
| `.github/workflows/ci.yml`                                           | `pnpm --filter @jopqior/pi-subagents run verify:public-types`.                                                                                                                                                                                                                                                                                        |
| `packages/pi-subagents/README.md`                                    | H1, npm/CI badges (CI → `Jopqior/gotgenes-pi-packages`), install command, service / settings headings and import examples. Keep the two worktrees sentences.                                                                                                                                                                                          |
| `packages/pi-subagents/docs/configuration.md`                        | Opening package-name sentence.                                                                                                                                                                                                                                                                                                                        |
| `packages/pi-subagents/src/service/service.ts`                       | JSDoc `import("@gotgenes/pi-subagents")` example only. `SERVICE_KEY` stays.                                                                                                                                                                                                                                                                           |
| `packages/pi-subagents/src/index.ts`                                 | Comment import example only.                                                                                                                                                                                                                                                                                                                          |
| `packages/pi-subagents/src/layered-settings.ts`                      | JSDoc `from "@gotgenes/pi-subagents/settings"` example only. Keep `@gotgenes/pi-*` in the family sentence.                                                                                                                                                                                                                                            |
| `cliff.toml`                                                         | `<REPO>` postprocessor → `https://github.com/Jopqior/gotgenes-pi-packages`. Historical 21.x changelog URLs stay baked. Post-1.0.0 git-cliff sections then link fork issues; real merges preserve upstream commit subjects. Release boundaries exclude previously released ancestors; review newly merged upstream issue references before publishing. |
| Root `README.md`                                                     | Packages-table `pi-subagents` row only (name, npm badge, npm link). Intro still says the monorepo publishes other packages under `@gotgenes/`.                                                                                                                                                                                                        |
| `pnpm-lock.yaml`                                                     | Regenerated by `pnpm install` in the rename commit.                                                                                                                                                                                                                                                                                                   |
| `packages/pi-subagents/CHANGELOG.md`                                 | New `## [1.0.0]` section under the header, above `## [21.7.0]`.                                                                                                                                                                                                                                                                                       |

`dist/*.d.ts` JSDoc is regenerated by `prepack` / `build:types` and is gitignored.

### Post-publish surface (not in the rename commit)

| Path                                         | When                                                                                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.pi/settings.json`                          | After npm 1.0.0 exists: add `{ "source": "npm:@jopqior/pi-subagents", "extensions": [], "skills": [] }`. Keep the `@gotgenes` disable entry. |
| `docs/upstream-sync.md` correspondence table | After the tag exists: `1.0.0 ← 21.7.0`.                                                                                                      |

### Handbook (with the rename)

The `docs/upstream-sync.md` manual conflict checklist already preserves the fork's package name and version.
Continue accepting upstream dependency and metadata changes without reverting those fields.

### First-publish changelog shape

Hand-written, not git-cliff (no tag yet).
Date from `date -u +"%Y-%m-%d"` at implementation time.

```markdown
## [1.0.0] (YYYY-MM-DD)

First `@jopqior/pi-subagents` release.
Independent version line; upstream baseline `@gotgenes/pi-subagents` 21.7.0.

### Features

* **pi-subagents:** publish this fork as `@jopqior/pi-subagents`, with spawn-selection from the fork's issue 1.
  Runtime `Symbol.for` keys remain `@gotgenes/pi-subagents:*`.
```

Do not invent a compare URL (no previous fork tag).
Do not rewrite 21.x sections.

### Operator registry

```bash
npm whoami --registry=https://registry.npmjs.org/
pnpm --filter @jopqior/pi-subagents publish --access public --no-git-checks --registry=https://registry.npmjs.org/
npm view @jopqior/pi-subagents version --registry=https://registry.npmjs.org/
```

No `--provenance` on the first publish.
If npm prompts for OTP, the operator runs this in an interactive terminal, not the agent.

### `RELEASE_PLEASE_TOKEN`

`release.yml` prepare job checkouts with `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}` and pushes the release commit.
An empty secret makes that job fail.
The operator creates a PAT with `contents:write` on `Jopqior/gotgenes-pi-packages` and stores it as that Actions secret.
No workflow edit.
Verify with `gh secret list --repo Jopqior/gotgenes-pi-packages` showing `RELEASE_PLEASE_TOKEN` (value is never printed).
This secret is not required for the manual 1.0.0 publish; it is required for the next `release.yml` run.

## Module-Level Changes

### Added

None in `src/`.

### Changed

- `packages/pi-subagents/package.json` — identity fields listed above.
- `packages/pi-subagents-model-selector/package.json` — workspace dependency name.
- `packages/pi-subagents-model-selector/src/index.ts`, `src/model-selector.ts`, `test/composition-root.test.ts`, `test/model-selector.test.ts` — specifier / diagnostic literals.
- `packages/pi-subagents-model-selector/README.md` — core package name in prose.
- `packages/pi-subagents/scripts/verify-public-types.sh` — consumer probes.
- `.github/workflows/ci.yml` — filter name.
- `packages/pi-subagents/README.md`, `docs/configuration.md` — identity / install / import examples.
- `packages/pi-subagents/src/service/service.ts`, `src/index.ts`, `src/layered-settings.ts` — JSDoc/comment examples only.
- `cliff.toml` — `<REPO>` replace string.
- Root `README.md` — Packages-table row.
- `pnpm-lock.yaml` — `pnpm install` after the dependency rename.
- `packages/pi-subagents/CHANGELOG.md` — 1.0.0 section inserted below the header.
- `docs/upstream-sync.md` — add the correspondence row (post-tag commit).
- `.pi/settings.json` — add the `@jopqior` disable entry (post-publish commit only).

### Predicted unchanged

| Path                                                           | Claim                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/pi-subagents/src/service/service.ts` `SERVICE_KEY`   | Stays `Symbol.for("@gotgenes/pi-subagents:service")`.                                             |
| `packages/pi-subagents/src/lifecycle/spawn-selection.ts`       | Cancellation marker stays.                                                                        |
| `packages/pi-subagents/src/lifecycle/selection-scope.ts`       | Carrier key stays.                                                                                |
| `packages/pi-subagents/test/service/service.test.ts`           | Still asserts the `@gotgenes` `SERVICE_KEY`.                                                      |
| `packages/pi-subagents-worktrees/**`                           | Registry `@gotgenes/pi-subagents@^16.4.0`; no `@jopqior` specifier.                               |
| `.fallowrc.json` `ignoreDependencies`                          | Still lists `@gotgenes/pi-subagents` for worktrees.                                               |
| `scripts/release/*`                                            | Directory-name tags; `name` is read at publish time.                                              |
| `.github/workflows/release.yml`                                | Still uses `RELEASE_PLEASE_TOKEN`.                                                                |
| `packages/pi-subagents/docs/architecture/**`                   | Published-surface decision excludes it.                                                           |
| `packages/pi-subagents/docs/decisions/**`                      | Same.                                                                                             |
| `packages/pi-subagents/docs/comparison-with-upstream.md`       | Historical `@gotgenes` vs tintinweb comparison; rewriting it would falsify the versions it names. |
| `.pi/settings.json` `npm:@gotgenes/pi-subagents` disable entry | Stays.                                                                                            |
| `packages/pi-subagents-model-selector/package.json` `private`  | [#4].                                                                                             |

If a predicted-unchanged path appears in the rename diff, stop and treat it as a design miss.

## Test Impact Analysis

No new Vitest files.
The testable surface is specifier resolution and the existing model-selector / core suites.

Dry-runs at planning time (re-run at `/build-plan`):

```bash
npm view @jopqior/pi-subagents version --registry=https://registry.npmjs.org/
# 404

npm whoami --registry=https://registry.npmjs.org/
# jopqior

./scripts/release/next-version.sh pi-subagents
# Error: 'pi-subagents' has no pi-subagents-v* tag
```

After the rename commit, `pnpm --filter @gotgenes/pi-subagents` must fail to select the package, and `pnpm --filter @jopqior/pi-subagents run check` must pass.

## Invariants at risk

| Invariant                                               | Constituency                    | Pin                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Spawn-selection still registers on the loaded core      | [#1] / model-selector           | `packages/pi-subagents-model-selector/test/composition-root.test.ts` (real `getSubagentsService` after workspace link)              |
| Service slot key stays `@gotgenes/pi-subagents:service` | npm worktrees + local worktrees | `packages/pi-subagents/test/service/service.test.ts` — open it; it publishes into that `Symbol.for` key, not a mock of the accessor |
| Worktrees still typechecks against registry 16.4.0      | worktrees package               | `pnpm --filter @gotgenes/pi-subagents-worktrees run test` with no import rewrite                                                    |
| Fork tag namespace empty until the operator tags 1.0.0  | this issue                      | `git tag \| wc -l` is 0 until step 6                                                                                                |

## TDD Order

No red→green of new behavior; run as `/build-plan`.
Tidy-First added no leading steps.

1. **Rename the workspace identity** — in one commit, because `tsc` and CI cannot split them: both `package.json` names, model-selector four import sites + `MISSING_CORE_MESSAGE` + its verbatim test assertion + README prose, `verify-public-types.sh` probes, `ci.yml` filter, then `pnpm install` for `pnpm-lock.yaml`.
   Verify: `pnpm --filter @jopqior/pi-subagents run check`; `pnpm --filter @jopqior/pi-subagents-model-selector run check`; `pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run`; `pnpm --filter @gotgenes/pi-subagents-worktrees exec vitest run`; `pnpm --filter @jopqior/pi-subagents exec vitest run test/service/service.test.ts`; `rg -n '@gotgenes/pi-subagents' packages/pi-subagents-model-selector` is empty except any historical changelog (none); `rg -n '@jopqior/pi-subagents' packages/pi-subagents-worktrees` is empty; `git diff -- packages/pi-subagents/src/lifecycle/spawn-selection.ts packages/pi-subagents/src/lifecycle/selection-scope.ts` is empty.
   Commit: `feat(pi-subagents)!: publish as @jopqior/pi-subagents`

   ```text
   BREAKING CHANGE: In this repository the core package name is @jopqior/pi-subagents
   starting at 1.0.0. Runtime Symbol.for keys remain @gotgenes/pi-subagents:*.
   npm @gotgenes/pi-subagents is unchanged (upstream).
   ```

   Killing mutation: leave `packages/pi-subagents-model-selector/src/index.ts` importing `@gotgenes/pi-subagents` after the package.json rename — `pnpm --filter @jopqior/pi-subagents-model-selector run check` fails to resolve the specifier.
   Second class: leave `.github/workflows/ci.yml` filtering `@gotgenes/pi-subagents` — `pnpm --filter @gotgenes/pi-subagents run verify:public-types` selects nothing.
   Third class (invariant): change `SERVICE_KEY` to `@jopqior/…` — `test/service/service.test.ts` fails.

2. **Published identity docs and cliff `<REPO>`** — package README (H1, badges, install, service/settings examples), `docs/configuration.md` opening sentence, the three JSDoc/comment examples, `cliff.toml` postprocessor, and the root README Packages-table row.
   Verify: `rg -n 'pi install npm:@gotgenes/pi-subagents$' packages/pi-subagents/README.md` is empty; `rg -n 'gotgenes/pi-packages' cliff.toml` is empty; `rg 'pi-subagents-worktrees' packages/pi-subagents/README.md` still hits both worktrees sentences; `pnpm exec rumdl check` on the touched markdown.
   Commit: `docs: point pi-subagents published identity at @jopqior`

   Killing mutation: leave the README install command on `@gotgenes/pi-subagents` — the `rg …$` pin in this step is non-empty.
   Second class: replace `@gotgenes/pi-subagents-worktrees` while editing README — the worktrees `rg` pin goes empty.

3. **Hand-written 1.0.0 changelog** — insert the section from Design Overview under the header, above `## [21.7.0]`.
   Date from `date -u +"%Y-%m-%d"`.
   Verify: `rg -n '^## \[1\.0\.0\]' packages/pi-subagents/CHANGELOG.md` is line-adjacent above `## [21.7.0]`; 21.7.0 body still present.
   Commit: `docs(pi-subagents): add 1.0.0 changelog for first @jopqior release`

   Killing mutation: splice below 21.7.0 instead of above — the adjacency pin fails.

4. **Pre-publish verify** — no extra commit unless something failed.
   `pnpm --filter @jopqior/pi-subagents run build:types`
   `pnpm --filter @jopqior/pi-subagents run verify:public-types`
   `pnpm --filter @jopqior/pi-subagents exec pnpm pack --pack-destination /tmp`
   `tar tzf` that tarball: contains `src/`, `dist/`, `docs/*.md`, `docs/architecture`, `docs/decisions`, `README*`, `LICENSE*`, `CHANGELOG.md`; excludes `test/`, `tsconfig.json`, `vitest.config.ts`, `docs/plans`, `docs/retro`.
   `pnpm fallow dead-code`
   `pnpm run check`
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`
   `pnpm -r run test`
   Confirm the lockfile did not resolve `@jopqior/pi-subagents` from the registry (it must remain `link:../pi-subagents` for model-selector).

5. **Operator — `RELEASE_PLEASE_TOKEN`** — create a PAT with `contents:write` on `Jopqior/gotgenes-pi-packages`, add it as repo Actions secret `RELEASE_PLEASE_TOKEN`.
   Verify: `gh secret list --repo Jopqior/gotgenes-pi-packages` lists `RELEASE_PLEASE_TOKEN`.
   No commit.

6. **Land on `main`, then operator first publish** — `/ship` pushes the commits, watches CI with `--repo Jopqior/gotgenes-pi-packages`, and **does not** dispatch `release.yml`.
   After CI is green, from that SHA:

   ```bash
   git remote get-url origin   # must contain Jopqior/gotgenes-pi-packages
   npm whoami --registry=https://registry.npmjs.org/
   pnpm --filter @jopqior/pi-subagents publish --access public --no-git-checks --registry=https://registry.npmjs.org/
   npm view @jopqior/pi-subagents version --registry=https://registry.npmjs.org/
   # expect 1.0.0
   git tag pi-subagents-v1.0.0
   git push origin pi-subagents-v1.0.0
   ```

   Then on npmjs.org: Trusted Publisher for `@jopqior/pi-subagents`, repo `Jopqior/gotgenes-pi-packages`, workflow `release.yml`.

   Killing mutation (tag): skip the tag — `./scripts/release/next-version.sh pi-subagents` still refuses, and the next automated release cannot start.

7. **Post-publish commits** — add the `.pi/settings.json` disable entry for `npm:@jopqior/pi-subagents` (keep the `@gotgenes` entry).
   Add correspondence row `1.0.0 | 21.7.0` to `docs/upstream-sync.md`.
   Verify: `pnpm exec rumdl check docs/upstream-sync.md`; JSON of `.pi/settings.json` still parses; the new disable `source` is `npm:@jopqior/pi-subagents`.
   Commit: `chore: disable npm:@jopqior/pi-subagents after first publish` (settings disable is user-visible double-load prevention, so `chore:` is correct and will cut a patch on the *next* `release.yml` run — accept that, or fold the correspondence-only docs into the same commit so one patch covers both.) Then `issue_close`.

   Killing mutation: add the disable entry in step 1 before the package exists — a later `pi update --extensions` / subagent launcher `npm install` of `npm:@jopqior/pi-subagents` 404s ([gotgenes/pi-packages#600](https://github.com/gotgenes/pi-packages/issues/600)).

`/build-plan` runs pre-completion before its own finish; operator steps 5–7 happen in the ship session after that review.

## Risks and Mitigations

| Risk                                                                                | Mitigation                                                                                                                                                                               |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accidental replace of `@gotgenes/pi-subagents-worktrees`                            | Negative lookahead; step 2 `rg` pin that worktrees sentences remain                                                                                                                      |
| `pnpm publish` hits npmmirror                                                       | Every publish/whoami/view passes `--registry=https://registry.npmjs.org/`                                                                                                                |
| Disable entry before the package exists                                             | Sequenced after `npm view` returns `1.0.0`                                                                                                                                               |
| `/ship` dispatches `release.yml` anyway                                             | Release Recommendation plus `next-version.sh` refusal until the tag exists; if someone tags then re-dispatches without new commits, `next-version.sh` prints nothing and prepare refuses |
| PAT never stored                                                                    | Step 5 is in-issue; next `release.yml` would fail closed on checkout rather than push with `GITHUB_TOKEN`                                                                                |
| Workspace link silently becomes a registry install of a 404 or of the wrong package | Step 4 lockfile pin: model-selector stays `link:../pi-subagents`                                                                                                                         |
| Changing `SERVICE_KEY` "to match the new name"                                      | Predicted-unchanged + killing mutation in step 1; `service.test.ts` pins the old key                                                                                                     |
| First `CHANGELOG` 1.0.0 re-enters the next git-cliff section                        | `lib.sh` already excludes `CHANGELOG.md` from cliff path filters                                                                                                                         |

## Open Questions

None.
Scope, keys, docs surface, and token mechanism were settled in the planning gate.
[#4] remains the companion's first publish.

[#1]: https://github.com/Jopqior/gotgenes-pi-packages/issues/1
[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
[#4]: https://github.com/Jopqior/gotgenes-pi-packages/issues/4
