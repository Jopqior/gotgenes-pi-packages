# Upstream sync

This fork tracks [gotgenes/pi-packages](https://github.com/gotgenes/pi-packages) without importing its tags.

The fork's tag namespace is only its own `pi-subagents-v*` (and later sibling package tags).
Upstream already publishes `pi-subagents-v1.0.0` through current releases; importing those tags would collide with later fork publishes and break `scripts/release/next-version.sh`.

Sync only through `scripts/upstream-sync.sh`.
Do not `git fetch --tags`, `git fetch --all --tags`, or `git fetch upstream` without `--no-tags`.
Those commands override `remote.upstream.tagOpt`.

## When to sync

On demand.
Before a fork publish, check whether upstream `main` has new commits or a new `pi-subagents` release.

## Procedure

1. From the repo root on `main`, with a clean index and tracked worktree:

   ```bash
   ./scripts/upstream-sync.sh
   ```

   This ensures the `upstream` remote, sets `tagOpt=--no-tags` and `pushurl=DISABLE`, fetches with `--no-tags`, refuses if the local tag set changed, and prints ahead/behind plus the newest upstream `pi-subagents-v*` (via `git ls-remote`, which does not import tags).
   The first time that remote is added, pin the GitHub CLI default so `gh repo view` stays on this fork:

   ```bash
   gh repo set-default Jopqior/gotgenes-pi-packages
   ```

2. Review the ahead/behind counts.
   If you want the commits on fork `main`:

   ```bash
   ./scripts/upstream-sync.sh --merge
   ```

   `--merge` refuses unless the current branch is `main`, origin is `Jopqior/gotgenes-pi-packages`, the index and tracked worktree are clean, and no merge or rebase is in progress.
   It never pushes.
3. If the merge conflicts, leave it in progress and follow [Conflict handbook](#conflict-handbook).
   Do not `git checkout --ours` or `git checkout --theirs` wholesale.
4. After resolving, regenerate `pnpm-lock.yaml` with `pnpm install` from the repo root even if git auto-merged it with zero markers.
5. If the merge moved or renamed files, clear the rumdl cache:

   ```bash
   find .rumdl_cache -type f -delete
   ```

   MD057 depends on neighboring filesystem state ([gotgenes/pi-packages#879](https://github.com/gotgenes/pi-packages/issues/879)).
6. Verify:

   ```bash
   git tag | wc -l
   pnpm run check
   NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint
   pnpm -r run test
   ```

7. Record a sync-log row below.
   Do not write an unreleased fork version into the correspondence table.

## Forbidden commands

Never run:

```bash
git fetch --tags upstream
git fetch --all --tags
git fetch upstream
git fetch --all
git push upstream
```

`git fetch upstream` without `--no-tags` follows tags that point at downloaded objects.
`remote.upstream.tagOpt=--no-tags` is only the default when a fetch names neither `--tags` nor `--no-tags`; an explicit `--tags` still overrides it.

`pushurl=DISABLE` makes `git push upstream` fail closed.
The script never pushes.

If a fetch imported tags anyway, delete them before merging:

```bash
git tag -d <name>
```

Then re-run the script.

## Conflict handbook

Do not take ours or theirs wholesale.
Keep fork-only spawn-selection and `fNNNN-` lookup, and keep incoming upstream behavior.

### First merge (before [#3])

The measured content conflicts were spawn-selection versus upstream resume/compact-result, not the issue-body's predicted README / settings / issue-form / lockfile set.
Those four paths were fork-only except `pnpm-lock.yaml`, which auto-merges with zero markers and must still be regenerated.

Keep both sides.

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
HEAD's `isAwaitingSelection` / `launchVerb` stay; incoming annotated `details: AgentDetails` stays; the post-hunk `textResult(..., details)` already references both.

**`subagent-manager.test.ts` imports**:

```typescript
import { makeModel } from "#test/helpers/make-model";
import { makeWorkspace, makeWorkspaceProvider } from "#test/helpers/make-workspace";
```

**`.pi/skills/package-pi-subagents/SKILL.md` and `packages/pi-subagents/docs/architecture/architecture.md`** — union of unique module names and phrases, then recount files rather than adding 69+68.
HEAD has spawn-selection / selection-scope / selection-catalogue and pending-selection UI notes.
Incoming has resume choke-point wording, `bounded-lines.ts`, `get-result-renderer`, and the service resume door.
Keep every unique token.

After conflict resolution the merged `service.ts` body already lists `resume(...)` and `registerSpawnSelectionProvider(...)` on `SubagentsService`.
Do not drop either method.

### After [#3]

Upstream release commits touch `packages/pi-subagents/package.json` and `packages/pi-subagents/CHANGELOG.md`.

- `package.json`: keep the fork `name` (`@jopqior/pi-subagents`) and the fork `version`.
  Take upstream dependency and metadata changes that do not revert those two fields.
- `CHANGELOG.md`: keep fork entries at the top; splice newly arrived upstream sections below them.
  Do not hand-edit fork entries to match upstream version numbers.

If upstream adds a new package directory, wire it per the AGENTS.md four-place list (`.pi/settings.json`, README Packages table, both issue-form Package dropdowns, `pkg:<name>` label) and do not add the npm disable entry until that package's first publish.

### Auto-merged both-sides paths

Read through after every merge even when git reports zero markers.

Restore any dropped `fNNNN-` short-circuit in `.pi/prompts/ship.md` and `.pi/prompts/plan-issue.md`.
Restore any dropped spawn-selection sentence in `AGENTS.md` or `packages/pi-subagents/**`.
`pnpm-lock.yaml` is untrusted after an auto-merge; always `pnpm install`.

Pin: `rg 'f\$\{PADDED\}' .pi/prompts/ship.md` still hits both snippets.

## Version correspondence

Each published `@jopqior/pi-subagents` version maps to the newest upstream `pi-subagents-v*` contained in that release's merge base.
Many-to-one is legal: several fork versions may share one upstream tag.

Do not write an unreleased fork version number here.
The first data row lands in [#3] as `1.0.0 ← 21.7.0`.

| Fork `@jopqior/pi-subagents` | Upstream `pi-subagents` tag |
| ---------------------------- | --------------------------- |

## Sync log

| Date (UTC)           | Upstream SHA                             | Upstream `pi-subagents` tag | Fork merge SHA                           |
| -------------------- | ---------------------------------------- | --------------------------- | ---------------------------------------- |
| 2026-09-12T14:16:33Z | 045213317de608c04a7b6052b2b843e3a0f2176f | pi-subagents-v21.7.0        | 2d8cea699b08afa0f6a2c06eeb1507a52d699636 |

[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
