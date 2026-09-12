---
issue: 2
issue_title: "建立上游同步机制并首次合并上游 main（tags 导入 + 版本对应表）"
---

# Guarded upstream sync and first merge of upstream main

## Release Recommendation

**Release:** ship independently

Repo-level remote, script, and docs, plus one merge of `upstream/main` into this fork's `main`.
No package roadmap step references this fork issue, and `/ship` names no package: the fork still has zero tags, so `scripts/release/next-version.sh` refuses every package.

Do not dispatch `release.yml` after this lands.
Issue [#3] is the first publish of `@jopqior/pi-subagents`.

## Problem Statement

This fork has no `upstream` remote, is 30 commits ahead of `gotgenes/pi-packages` `main` and 102 behind (measured), and must not import upstream tags.
Upstream `@gotgenes/pi-subagents` is at 21.7.0; the fork's `package.json` is still 21.5.0.
A default `git fetch upstream` follows tags that point at downloaded objects, which would copy `pi-subagents-v*` (and every other package tag) into this repo's single tag namespace and collide with later fork releases.

The first merge has to land before [#3] so `@jopqior/pi-subagents` 1.0.0 starts from the current upstream baseline rather than jumping after a first publish.

## Goals

- Add `upstream` pointing at `https://github.com/gotgenes/pi-packages` with durable no-tag and no-push guards.
- Land `scripts/upstream-sync.sh` that always fetches with `--no-tags`, refuses to push, and optionally merges.
- Land `docs/upstream-sync.md` with the repeatable procedure, conflict handbook, and version-correspondence table.
- Merge `upstream/main` into fork `main` (102 commits), resolve the measured content conflicts by keeping fork spawn-selection and upstream resume/compact-result behavior, and regenerate `pnpm-lock.yaml`.
- Verify with `pnpm run check`, `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`, and `pnpm -r run test`.
- Leave local tag count at 0.

## Non-Goals

- [#3] npm scope rename, Trusted Publisher, or the 1.0.0 first publish.
- [#4] `@jopqior/pi-subagents-model-selector` first publish.
- Importing, rewriting, or mirroring upstream tags.
- Any edit to `scripts/release/next-version.sh`, `prepare-release.sh`, `publish-released.sh`, `lib.sh`, or `cliff.toml`.
- Changing `Symbol.for("@gotgenes/pi-subagents:…")` contract strings (open decision on [#3]).
- Renaming remaining `@gotgenes/*` packages or rebranding root README install URLs.
- A test harness for bash scripts (same deferral as [#5] for `scripts/issue-context.sh`).
- Fast-forwarding or rebasing fork `main` onto upstream (30 fork-only commits are already on `origin/main`).

## Background

Author is the operator; the issue body is the working hypothesis.
[#5] and [#6] already landed the `fNNNN-` create/lookup rule, so this plan is `f0002-`.
[#1] added spawn-selection in `pi-subagents` plus the unpublished `@jopqior/pi-subagents-model-selector` package; that is the fork-only code the merge must keep.

Tidy-First is skipped: this change does not author new `src/` or `test/` files.
Conflict resolution edits those paths only to union two already-landed designs.
Design-review is skipped: no new shared TypeScript interface or layer wiring.

AGENTS.md constraints that apply:

- Split a pushing script from its read-only half and refuse the pushing half outside CI — this script must never push.
- Before pushing (later, at `/ship`), verify `origin` is `Jopqior/gotgenes-pi-packages`.
- After a merge that moves files, clear `.rumdl_cache` (`gotgenes/pi-packages#879`).
- Root `pnpm run lint` needs `NODE_OPTIONS=--max-old-space-size=8192`.

### Measured divergence (planning session, `git fetch --no-tags` via URL, no remote added)

| Fact                                                         | Value                                               |
| ------------------------------------------------------------ | --------------------------------------------------- |
| `HEAD`                                                       | `4bb2d3f97348ab26ffeb0e7fd11d7c7ccab45881`          |
| Upstream `main` (`FETCH_HEAD`)                               | `045213317de608c04a7b6052b2b843e3a0f2176f`          |
| Merge-base                                                   | `af980a236fd3ff043e3d432336b0f3de540fdd1b`          |
| Ahead / behind                                               | 30 / 102                                            |
| Local tags after that fetch                                  | 0                                                   |
| Latest upstream `pi-subagents` tag contained in `FETCH_HEAD` | 21.7.0 (`b3b6159399f541fd0623f65818557dd3e707a34f`) |
| New upstream packages since merge-base                       | none                                                |

`git ls-remote --tags` (does not import tags) shows `pi-subagents-v21.7.0` peels to `b3b61593`, which is `chore(release): pi-subagents 21.7.0` on upstream `main`.
Two docs commits sit on top of that release; the correspondence baseline is still 21.7.0.

The issue's predicted first-merge conflicts (`README.md` package table, `.pi/settings.json`, issue-form Package dropdowns, `pnpm-lock.yaml`) are **not** content conflicts today.
Those four paths are fork-only except `pnpm-lock.yaml`, which auto-merges with zero markers and must still be regenerated.

### Actual content conflicts (`git merge-tree --write-tree`, exit 1)

| Path                                                            | Hunks | Resolution                                                                              |
| --------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| `.pi/skills/package-pi-subagents/SKILL.md`                      | 2     | Union module lists and contract wording; recount files.                                 |
| `packages/pi-subagents/docs/architecture/architecture.md`       | 3     | Union spawn-selection notes with upstream resume / bounded-lines / update-ledger notes. |
| `packages/pi-subagents/src/lifecycle/subagent-manager.ts`       | 1     | Keep both imports.                                                                      |
| `packages/pi-subagents/src/service/service-adapter.ts`          | 1     | Keep both imports.                                                                      |
| `packages/pi-subagents/src/service/service.ts`                  | 1     | Keep both imports.                                                                      |
| `packages/pi-subagents/src/tools/background-spawner.ts`         | 1     | Keep both the awaiting-selection verb and the `AgentDetails` object.                    |
| `packages/pi-subagents/test/lifecycle/subagent-manager.test.ts` | 1     | Keep both imports.                                                                      |

Both-sides paths that auto-merge (zero markers) and still need a read-through:

`.pi/prompts/plan-issue.md`, `.pi/prompts/ship.md`, `.pi/prompts/sync-worktree.md`, `AGENTS.md`, `packages/pi-subagents/README.md`, `packages/pi-subagents/docs/configuration.md`, `packages/pi-subagents/src/lifecycle/subagent-state.ts`, `packages/pi-subagents/src/lifecycle/subagent.ts`, `packages/pi-subagents/src/tools/agent-tool.ts`, `packages/pi-subagents/src/ui/agent-widget.ts`, and the five matching test files plus `pnpm-lock.yaml`.

Auto-merge of `AGENTS.md` keeps the fork scope section at the top and inserts upstream paragraphs later (sampled).
Auto-merge of `.pi/prompts/ship.md` and `plan-issue.md` keeps the `fNNNN-` short-circuit from [#5]/[#6] (sampled).

## Design Overview

### Remote

`scripts/upstream-sync.sh` ensures the remote exists and then applies two configs every run (idempotent):

```bash
git remote add upstream https://github.com/gotgenes/pi-packages.git   # only if missing
git config remote.upstream.tagOpt --no-tags
git config remote.upstream.pushurl DISABLE
```

If `upstream` already exists, refuse unless `git remote get-url upstream` is exactly `https://github.com/gotgenes/pi-packages.git` or `https://github.com/gotgenes/pi-packages` (optional `.git` suffix).
`tagOpt=--no-tags` is the default when a fetch names neither `--tags` nor `--no-tags`.
`git fetch --tags upstream` and `git fetch --all --tags` still override it, so the script always passes `--no-tags` and the doc forbids those commands.
`pushurl=DISABLE` makes `git push upstream` fail closed; this script never pushes anyway.

### Script CLI

Read-only default, mutating opt-in — the same split as `next-version.sh` / `prepare-release.sh`, except the mutation here is a local merge, not a push.

```text
scripts/upstream-sync.sh          # ensure remote, fetch --no-tags, print ahead/behind, refuse if tags appeared
scripts/upstream-sync.sh --merge  # the same, then git merge upstream/main (no push)
```

Rules:

1. `set -euo pipefail`; `cd` to `git rev-parse --show-toplevel`.
2. Fetch line is literally `git fetch --no-tags upstream main`.
3. Snapshot `git tag` (sorted) before and after fetch; if the sets differ, print the new names, tell the operator to `git tag -d` them, and exit 1 without merging.
4. Print `git rev-list --left-right --count HEAD...upstream/main` and the newest `pi-subagents-v*` on upstream **without importing tags** (`git ls-remote --tags https://github.com/gotgenes/pi-packages.git 'pi-subagents-v*'`).
5. `--merge` refuses unless `git branch --show-current` is `main`, the index and tracked worktree are clean (`git diff --quiet && git diff --cached --quiet`), and no merge/rebase is in progress (`test ! -e "$(git rev-parse --git-dir)/MERGE_HEAD"` and no `rebase-merge`/`rebase-apply` under `$(git rev-parse --git-dir)` — use `--git-dir`, not a bare `.git/`, so a worktree is detected).
6. `--merge` also refuses unless `git remote get-url origin` contains `Jopqior/gotgenes-pi-packages`.
7. `--merge` runs `git merge upstream/main`.
   On conflicts it leaves the in-progress merge, prints a pointer at `docs/upstream-sync.md`, and exits 1.
   It does not `--no-commit`, `--ff-only`, or push.
8. No `CI` guard: fetch and local merge are operator tools, unlike `prepare-release.sh`.

Modeled on `scripts/worktree-new.sh` (`die`, usage, `set -euo pipefail`) and `scripts/label-issues.sh` (mutating half names the read-only default in the refusal).

### First-merge conflict recipes (keep both)

Do not take ours or theirs wholesale.

**`subagent-manager.ts` imports** — both lines:

```typescript
import type { SelectionScopeHandle } from "#src/lifecycle/selection-scope";
import { type ResumeRefusal, Subagent, type SubagentLifecycleObserver } from "#src/lifecycle/subagent";
```

**`service.ts` imports** — union.
`SpawnSelection.model` is `Model<Api>` and `thinkingLevel` is `SubagentThinkingLevel`; the auto-merged export block already re-exports `ResumeRefusal` and `ResumeRefusalReason`:

```typescript
import type { Api, Model } from "@earendil-works/pi-ai";
import type { SubagentThinkingLevel } from "#src/config/thinking-level";
import type { ResumeRefusal, SubagentStatus } from "#src/lifecycle/subagent";
import type { ResumeRefusalReason } from "#src/lifecycle/subagent-manager";
```

**`service-adapter.ts` imports** — both type names:

```typescript
import type {
  ResumeOptions,
  ResumeResult,
  SpawnOptions,
  SpawnSelectionProvider,
  SpawnSelectionRegistration,
  SubagentRecord,
  SubagentsService,
} from "#src/service/service";
```

**`background-spawner.ts`** — concatenate.
HEAD's `isAwaitingSelection` / `launchVerb` stay; FETCH_HEAD's annotated `details: AgentDetails` stays; the post-hunk `textResult(..., details)` already references both.

**`subagent-manager.test.ts` imports**:

```typescript
import { makeModel } from "#test/helpers/make-model";
import { makeWorkspace, makeWorkspaceProvider } from "#test/helpers/make-workspace";
```

**SKILL.md and `architecture.md`** — union of unique module names and phrases, then recount files rather than adding 69+68.
HEAD has spawn-selection / selection-scope / selection-catalogue and pending-selection UI notes.
FETCH_HEAD has resume choke-point wording, `bounded-lines.ts`, `get-result-renderer`, and the service resume door.
Keep every unique token.

After conflict resolution the merged `service.ts` body already lists `resume(...)` and `registerSpawnSelectionProvider(...)` on `SubagentsService` (sampled from the merge-tree blob).
Do not drop either method.

### `pnpm-lock.yaml`

Treat git's auto-merge as untrusted even with zero markers.
After the merge is resolved, run `pnpm install` from the repo root and commit the lockfile git writes.

### Version correspondence

`docs/upstream-sync.md` holds two tables.

1. **Version correspondence** (the issue's table): each published `@jopqior/pi-subagents` version → the newest upstream `pi-subagents-v*` contained in that release's merge base.
   Many-to-one is legal.
   This issue's first merge has no fork version yet; leave a footnote that the first data row lands in [#3] as `1.0.0 ← 21.7.0`.
2. **Sync log**: date, upstream SHA, upstream `pi-subagents` tag, fork merge SHA.
   Step 3 fills the first row after the merge commit exists.

Do not write an unreleased fork version number into the correspondence table.

### Docs-only wiring

A short pointer in the AGENTS.md fork-scope list (agents read it) and a short pointer under README Development next to the other `scripts/` entries (humans read it).
Root `docs/upstream-sync.md` is not inside a package `files` allowlist and does not trigger a release.

## Module-Level Changes

| Path                                          | Change                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/upstream-sync.sh`                    | **Add** (mode `0755`). Ensure remote, `tagOpt`, `pushurl`, fetch `--no-tags`, tag-set guard, `--merge`.                                                     |
| `docs/upstream-sync.md`                       | **Add**. Procedure, forbidden commands, conflict handbook (first merge + post-[#3] `package.json`/`CHANGELOG.md`), tables.                                  |
| `AGENTS.md`                                   | **Change**. Two fork-scope bullets: never import upstream tags; sync only through the script.                                                               |
| `README.md`                                   | **Change**. One Development paragraph pointing at the script and `docs/upstream-sync.md`.                                                                   |
| Seven conflicted paths above                  | **Change** during the merge, using the recipes.                                                                                                             |
| Auto-merged both-sides paths                  | **Review** during the merge; expect no extra edits if the sampled keep-both holds.                                                                          |
| `pnpm-lock.yaml`                              | **Regenerate** with `pnpm install` after the merge.                                                                                                         |
| Everything else incoming from `upstream/main` | **Take** via the merge commit, including `packages/pi-subagents/package.json` version `21.5.0` → `21.7.0` (name stays `@gotgenes/pi-subagents` until [#3]). |

No new upstream package directories, so do not add AGENTS.md four-place wiring, issue-form dropdown rows, or `pkg:*` labels.

### Predicted unchanged

| Path                                                   | Claim                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `scripts/release/next-version.sh`                      | Issue requires zero release-script edits; newest-tag derivation stays.                                             |
| `scripts/release/prepare-release.sh`                   | Same.                                                                                                              |
| `scripts/release/publish-released.sh`                  | Same.                                                                                                              |
| `scripts/release/lib.sh`                               | Same.                                                                                                              |
| `.github/ISSUE_TEMPLATE/*.yml`                         | Fork-only since merge-base; merge keeps the `pi-subagents-model-selector` option.                                  |
| `.pi/settings.json`                                    | Fork-only since merge-base; merge keeps the model-selector load path.                                              |
| Root `README.md` Packages table row for model-selector | Fork-only; the Development pointer is the only README edit this plan authors (the merge does not touch this file). |
| `packages/pi-subagents-model-selector/**`              | Fork-only; merge does not rewrite it.                                                                              |

If a predicted-unchanged file shows up in `git diff --name-only MERGE_HEAD` after the merge, stop and treat it as a design miss.

## Test Impact Analysis

No new Vitest files.
The testable surface is the script's side effects and the post-merge suite.

Dry-runs recorded at planning time (re-run at `/build-plan`):

```bash
git tag | wc -l
# 0

git fetch --no-tags https://github.com/gotgenes/pi-packages.git main
git tag | wc -l
# still 0

git ls-remote --tags https://github.com/gotgenes/pi-packages.git 'pi-subagents-v21.7.0'
# 453ca90e119496fa84aca8ea321c626b02234b1b    refs/tags/pi-subagents-v21.7.0
# b3b6159399f541fd0623f65818557dd3e707a34f    refs/tags/pi-subagents-v21.7.0^{}

git merge-tree --write-tree --name-only --no-messages HEAD FETCH_HEAD
# exit 1; seven paths listed in Design Overview
```

After step 1, expected output of `./scripts/upstream-sync.sh`:

```text
remote.upstream.tagOpt=--no-tags
remote.upstream.pushurl=DISABLE
tag count unchanged
ahead/behind printed (30/102 as of planning; re-measure)
```

After step 2, `git tag | wc -l` is still 0, and `pnpm --filter @gotgenes/pi-subagents exec vitest run test/lifecycle/nested-selection.test.ts` plus `pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run` pass.

## Invariants at risk

| Invariant                                           | Constituency          | Pin                                                                                                                                      |
| --------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Spawn-selection lease still gates child creation    | [#1] / model-selector | `packages/pi-subagents/test/lifecycle/nested-selection.test.ts` (real adapter, runtime, and manager — not a mocked manager)              |
| `fNNNN-` short-circuit in `/ship` and `/plan-issue` | [#5] [#6]             | Read-through of auto-merged `.pi/prompts/ship.md` and `plan-issue.md`; `rg 'f\$\{PADDED\}' .pi/prompts/ship.md` still hits both snippets |
| Fork tag namespace empty until [#3]                 | this issue            | `git tag \| wc -l` → 0 after fetch and after merge                                                                                       |
| Release scripts still derive from local tags        | AGENTS.md             | Predicted-unchanged list; `git diff -- scripts/release/` empty in the merge                                                              |

`nested-selection.test.ts` is the pin for spawn-selection: it wires `SubagentsServiceAdapter`, `createSubagentRuntime`, and `SubagentManager` with a real `SpawnSelectionScope`.
A merge that drops `registerSpawnSelectionProvider` fails that file, not only a mock.

## TDD Order

No red→green cycles; run as `/build-plan`.

1. **Guarded sync script and handbook** — add `scripts/upstream-sync.sh` (executable) with the CLI above, `docs/upstream-sync.md` with empty correspondence table + conflict handbook copied from this plan, and the AGENTS.md / README pointers.
   Verify: `git config --get remote.upstream.tagOpt` is `--no-tags` after one fetch run; `git config --get remote.upstream.pushurl` is `DISABLE`; `rg -n 'fetch --no-tags' scripts/upstream-sync.sh` hits; `git tag | wc -l` is 0; `pnpm exec rumdl check docs/upstream-sync.md README.md AGENTS.md`.
   Commit: `feat: add guarded upstream sync without importing tags (#2)`

   Killing mutation: delete the `git config remote.upstream.tagOpt --no-tags` line — `git config --get remote.upstream.tagOpt` is empty.
   Second class: remove `--no-tags` from the fetch invocation — `rg 'fetch --no-tags' scripts/upstream-sync.sh` is empty.
   Third class: drop the pre/post tag-set comparison — a later unguarded fetch could import tags with no script failure.

2. **First merge** — `./scripts/upstream-sync.sh --merge` on `main`.
   Resolve the seven files with the recipes (do not `git checkout --ours` / `--theirs`).
   Read the auto-merged both-sides list; restore any dropped `fNNNN-` or spawn-selection sentence.
   `pnpm install` to rewrite `pnpm-lock.yaml`.
   If the merge moved or renamed files, `find .rumdl_cache -type f -delete`.
   Verify: `git tag | wc -l` is 0; `pnpm run check`; `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`; `pnpm -r run test`.
   Finish the merge commit (git's default merge message is fine; body may say `Refs #2`).
   If check/lint/test fail after a completed merge commit, follow-up commits are `fix:` on `main`, not a merge rewrite.

   Killing mutation (conflict recipes): drop `SelectionScopeHandle` from the resolved `subagent-manager.ts` import — `nested-selection.test.ts` fails to typecheck or boot the lease.
   Second class: drop the `isAwaitingSelection` / `launchVerb` side of `background-spawner.ts` — `test/tools/background-spawner.test.ts` loses the pending-selection wording.

3. **Record the baseline** — fill the sync-log row with `date -u +"%Y-%m-%dT%H:%M:%SZ"`, `git rev-parse HEAD`, `git rev-parse upstream/main`, and upstream tag 21.7.0.
   Correspondence table stays footnote-only until [#3].
   Commit: `docs: record first upstream sync baseline 21.7.0 (#2)`

## Risks and Mitigations

| Risk                                                                                                    | Mitigation                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git fetch --all --tags` or `git fetch --tags upstream` overrides `tagOpt` and imports hundreds of tags | Script never passes `--tags`; docs forbid those commands; tag-set guard aborts before merge; planning fetch already proved `--no-tags` imports 0 |
| Auto-merged `pnpm-lock.yaml` is a silent invalid lock                                                   | Always `pnpm install` after resolving; CI `--frozen-lockfile` is the backstop                                                                    |
| Auto-merged prompt/AGENTS text drops `fNNNN-` or the fork-scope section                                 | Read-through list; `rg` pins in step 2                                                                                                           |
| Spawn-selection vs resume overlap beyond the seven marked hunks                                         | Full `pnpm -r run test`; `nested-selection.test.ts` is the real-stack pin                                                                        |
| Upstream `main` moves between plan and implement                                                        | Re-run `merge-tree` before `--merge`; recipes above are for `04521331`                                                                           |
| Merge commit includes upstream `chore(release)` version bumps and someone dispatches `release.yml`      | `next-version.sh` refuses untagged packages; Release Recommendation says do not dispatch                                                         |
| Untracked `.pi/extensions/pi-permission-system/` gets staged                                            | Do not `git add -A`; pathspec the merge and lockfile                                                                                             |
| `rumdl` MD057 stale after a rename in the 102 commits                                                   | Delete `.rumdl_cache` if `git diff --diff-filter=R --name-only MERGE_HEAD` is non-empty                                                          |

## Open Questions

None.
Version scheme, no-tag policy, and independent 1.0.0 line are settled in the issue.
Conflict strategy is keep-both because [#1] already shipped spawn-selection and [#3] depends on this merge containing it.

[#1]: https://github.com/Jopqior/gotgenes-pi-packages/issues/1
[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
[#4]: https://github.com/Jopqior/gotgenes-pi-packages/issues/4
[#5]: https://github.com/Jopqior/gotgenes-pi-packages/issues/5
[#6]: https://github.com/Jopqior/gotgenes-pi-packages/issues/6
