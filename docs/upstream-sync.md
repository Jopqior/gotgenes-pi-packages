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

The upstream remote uses `git@github.com:gotgenes/pi-packages.git` for both fetching commits and querying tags.
An SSH key with GitHub read access is required.
For an existing HTTPS remote, switch it before running the script:

```bash
git remote set-url upstream git@github.com:gotgenes/pi-packages.git
```

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
   To abandon the conflicted merge and restore the pre-merge state, run `git merge --abort`.
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
   pnpm run lint
   pnpm -r run test
   ```

7. If a merge remains in progress, stage the reviewed resolutions with `git add`, then finish with `GIT_EDITOR=true git merge --continue`.
8. Record reviewed fork sync evidence for the completed merge (see the [fork release guide](release/fork-sync.md#recording-a-completed-sync)):

   ```bash
   ./scripts/upstream-sync.sh --record-fork-sync "$(git rev-parse HEAD)" \
       --fork-level <none|patch|minor|major> --rationale "<what the resolution did to the fork package>"
   git add scripts/release/pi-subagents/sync-state.json
   git commit -m "chore: record fork sync evidence"
   ```

   The merge OID binds the review to its committed resolutions, and a fork release stays blocked until the record exists.
9. Record a sync-log row below.
   Release preparation generates the [correspondence view](release/pi-subagents-correspondence.md) from verified state; a sync alone does not add an unreleased fork version.

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
Keep fork-only spawn-selection and `fNNNN-` issue lookup, and keep incoming upstream behavior.
Fork improvement phases have package-scoped `f` identities independent of upstream numeric phases (see `markdown-conventions` → Improvement phase identities).
Keep incoming numeric history files, phase retros, and architecture history table rows unchanged; preserve fork `phase-f1-*.md` records and their full identity in headings, links, and the architecture index.
If upstream adds a numeric phase with the same suffix as a fork phase, retain both archives and retros; reconcile architecture history table conflicts as separate rows, never by renaming one onto the other or using an upstream number to allocate a fork phase.

### Startup selection after [#20]

Use [the fixed-upstream reconciliation trial](../packages/pi-subagents/docs/architecture/selector-startup-maintenance.md) when reviewing incoming lifecycle changes.
`InitialSpawnSelection` owns the attempt, pending pair, cancellation race, startup listeners, and one-shot acknowledgement; `Subagent` composes the original initial-run terminal observer and reports recorded status/error to that owner afterward.
If incoming `failRun()` or `stopQueued()` retains error/stop recording, cleanup, and `onRunFinished` in that order, do not reintroduce a terminal-method selection-settlement line.
The delivered `subagent-state.ts` matches the trial's fixed upstream source: avoid restoring selection activity there.
Still review notification order, queued/active cancellation, late provider registration, resume, manager construction, and the tool's wait-before-return boundary rather than treating an empty method diff as general compatibility.
Keep initialization-time scope inheritance and factory wrapping in `index.ts`, close the scope before shutdown disposal, and retain both `selectionSignal` checks and late-session disposal in `create-subagent-session.ts` before extension binding.
Authenticated catalogue validation and host loader timing remain semantic obligations; the trial is not a guarantee that another upstream body will preserve these hooks.

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
Workspace discovery does not grant publication: register the approved npm identity and provenance in `scripts/release/release-packages.json` before release preparation.

### Auto-merged both-sides paths

Read through after every merge even when git reports zero markers.

Restore any dropped `fNNNN-` short-circuit in `.pi/prompts/ship.md` and `.pi/prompts/plan-issue.md`.
Check `.pi/prompts/plan-improvements.md`, `.pi/prompts/finish-phase.md`, the architecture history table, and phase retros for full `f` identities and independent per-package allocation; an auto-merged numeric maximum, arithmetic predecessor, or fallback from `phase-f1-*.md` to `phase-1-*.md` is a regression.
Restore any dropped spawn-selection sentence in `AGENTS.md` or `packages/pi-subagents/**`.
`pnpm-lock.yaml` is untrusted after an auto-merge; always `pnpm install`.

Pin: `rg 'f\$\{PADDED\}' .pi/prompts/ship.md` still hits both snippets.

### Spawn presentation after [#21]

Use [the synthetic presentation reconciliation trial](../packages/pi-subagents/docs/architecture/selector-presentation-maintenance.md) to check incoming mode-label, tag-order, and model-name changes against both ordinary and selected output.
`spawn-config.ts` owns the single `formatSpawnModelName` rule and `buildSpawnDisplay` ordinary producer; `resolveSpawnConfig` captures resolved context and invocation facts once, and `presentation.detailFor` reruns that producer with pending or selected raw model/thinking facts.
If an incoming inline model-name formula appears in `resolveSpawnConfig`, adapt its display operation into `formatSpawnModelName` **in the same file** rather than retaining a second inline formula or transferring it to `ui/display.ts`.
Review the incoming inputs and semantics before adapting: the fixed-upstream truthiness check omits an empty model ID, whereas the fork's current equality guard formats an empty ID when it differs from the parent; preserve the fork behavior unless deliberately changed and tested.
Initial formatting compares against `modelInfo.parentModel?.id`; selected formatting uses the runner snapshot's parent ID.
Retain explicitly configured max turns in display tags, the captured prompt-mode label, and non-selection `detailBase` identity for resume and failure fallback.
Review a changed mode label or tag order through the shared ordinary builder, without restoring literal `twin` checks or parsing thinking strings in a selector overlay.
Preserve `describeActivity`'s pending-first branch and the foreground/widget pending boolean even when upstream rewrites its ordinary activity formatting; activity wording was already shared before [#21].
The trial is synthetic, so reconcile new upstream fields, record/host timing, and the first pre-record stream frame explicitly rather than assuming conflict-free merging.

### Compatibility integration for fork issue 14

Keep the fork scope header above upstream's compact topic-skill index, and reconcile the skills and lifecycle prompts for fork repository targets, `fNNNN-` lookup, SSH/no-tag synchronization, and npmjs registry flags.
Feature-worktree landing remains linear; upstream integration retains two parents.
Keep both the child project-context loader and the fork selection construction wrapper, and retain the fresh per-run abort controller alongside selection cancellation and awaitable resume handles.
When an upstream roadmap moves into history, move fork dispositions with it rather than dropping them.
Preserve fork changelog sections unchanged and insert only incoming upstream release sections above their shared baseline.

Migration notes for this batch:

- MCP evaluation now uses the last rule matching any candidate; put exceptions after broad rules.
  Prefix-named tools derive the longest configured server prefix, and already-prefixed explicit tools no longer add redundant qualified spellings.
  Review server rules newly applying to those tools.
- Session discovery defaults to at most 10 newest paths.
  Supply a larger explicit `limit` when needed; `count` remains the total and `shown` describes the emitted paths.
- Relocated/full and portable children resolve project context against their own directory; same-directory full inheritance retains its existing block.
- Resumed runs have a fresh abort controller reachable through the normal abort door.
- Autoformat resolves global configuration through Pi's agent directory, honoring `PI_CODING_AGENT_DIR`.
- The project adopts upstream's tracked permission tripwires and removes project loading of `pi-web-access`.
  The operator authorized deletion of the rechecked local yolo-only override without a backup.
  Independent global settings may still enable yolo or load the web extension.

The operator additionally authorized coordinated publication of `@jopqior/pi-subagents` and `@jopqior/pi-subagents-model-selector` to npmjs.org after verification.
A published selector's caret range cannot admit a new core major; its source `workspace:^` dependency acquires the updated range when packed after the core version is assigned.
Dispatch both packages together, inspect the packed dependency, and publish no other package without further approval.

The coordinated dispatch above is the historical requirement of the [#14] release, when the selector still declared a `workspace:^` core dependency.
The selector now declares its core compatibility as a peer dependency that is independent of core releases, so a core release alone no longer requires a selector release; the selector README's release policy ([#15]) is the current guidance.

## Fork release evidence and correspondence

The [fork release guide](release/fork-sync.md) owns release-level decisions, evidence validation, the CLI migration, publication correspondence, and approval-gated historical backfill.
The [generated pi-subagents correspondence view](release/pi-subagents-correspondence.md) is committed with selected fork releases; synchronize and record reviewed merge evidence using the procedure above.

## Sync log

| Date (UTC)           | Upstream SHA                             | Upstream `pi-subagents` tag | Fork merge SHA                           |
| -------------------- | ---------------------------------------- | --------------------------- | ---------------------------------------- |
| 2026-09-12T14:16:33Z | 045213317de608c04a7b6052b2b843e3a0f2176f | pi-subagents-v21.7.0        | 2d8cea699b08afa0f6a2c06eeb1507a52d699636 |
| 2026-09-19T14:03:45Z | edb35ee28535aac4e12431e47e440f6933911834 | pi-subagents-v21.7.3        | 0408aa5ff9d9811d98df17dde436e7fd45a5a3ad |
| 2026-09-26T06:54:31Z | 4dd378ca97a35e380ed946cd5ce0bcb9050ced5a | pi-subagents-v21.7.7        | d4d90b3de6c19be1516ce0a92c1ad611e8543ba5 |

[#14]: https://github.com/Jopqior/gotgenes-pi-packages/issues/14
[#15]: https://github.com/Jopqior/gotgenes-pi-packages/issues/15
[#20]: https://github.com/Jopqior/gotgenes-pi-packages/issues/20
