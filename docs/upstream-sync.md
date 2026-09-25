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
8. Record the reviewed core sync evidence for the completed merge (see [Core sync evidence](#core-sync-evidence)):

   ```bash
   ./scripts/upstream-sync.sh --record-core-sync "$(git rev-parse HEAD)" \
       --fork-level <none|patch|minor|major> --rationale "<what the resolution did to the core package>"
   git add scripts/release/core-sync-state.json
   git commit -m "chore: record core sync evidence"
   ```

   The merge OID binds the review to its committed resolutions, and a core release stays blocked until the record exists.
9. Record a sync-log row below.
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
Keep fork-only spawn-selection and `fNNNN-` issue lookup, and keep incoming upstream behavior.
Fork improvement phases have package-scoped `f` identities independent of upstream numeric phases (see `markdown-conventions` → Improvement phase identities).
Keep incoming numeric history files, phase retros, and table rows unchanged; preserve fork `phase-f1-*.md` records and their full identity in headings, links, and the architecture index.
If upstream adds a numeric phase with the same suffix as a fork phase, retain both archives and retros; reconcile table conflicts as separate rows, never by renaming one onto the other or using an upstream number to allocate a fork phase.

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

## Core sync evidence

`@jopqior/pi-subagents` is the core package: its fork versions advance through merges of `upstream/main`, so the repository-wide Conventional Commit classification of an integration merge cannot decide its release level.
A broad `feat!:` integration message describes upstream's release, not the fork's independent version.
Core release levels therefore derive from verified correspondence evidence instead.

The authoritative record is `scripts/release/core-sync-state.json`, committed to Git.
It stores, for every published fork core release, the upstream release that release incorporated, and for every reviewed sync merge, the selected upstream release plus the reviewed fork-core contribution of the conflict resolution.
The [version correspondence table](#version-correspondence) below stays as historical explanation; where a published row overlaps the JSON record, the two must agree.
Recording (`--record-core-sync`) and release preparation are the only writers; a conflicting record is resolved by hand after review.

### Mapping rule

The upstream contribution is the SemVer distance between the upstream release incorporated at the last fork core release and the one incorporated now, compared once across the whole unreleased window.

| Upstream baseline to incorporated target      | Upstream contribution |
| --------------------------------------------- | --------------------- |
| Equal stable version, no unreleased core work | none                  |
| Higher patch within the same major and minor  | patch                 |
| Higher minor within the same major            | minor                 |
| Higher major                                  | major                 |

Deferred syncs collapse: several incorporated patch releases still mean one fork patch, never a sum.
The fork contribution is what git-cliff derives from the window's commits with verified upstream-owned commits and the sync merges removed, combined with each recorded merge's reviewed fork-core level; the highest level wins.
Sibling-only and root-configuration commits do not contribute.

### Blocking cases

Prediction and release preparation fail closed — nonzero exit with a diagnostic, never the silent no-release path — when the evidence is missing or inconsistent:

- the current fork release tag has no recorded upstream correspondence;
- a core-affecting merge in the unreleased window has no reviewed sync record;
- a recorded sync is not a genuine two-parent merge whose upstream parent contains the recorded upstream release;
- a recorded sync incorporates an upstream version behind the already-incorporated one;
- a baseline or window sync's recorded upstream version contradicts its release manifest, or that manifest is missing;
- a sync's upstream parent does not descend from the previously incorporated upstream tip, starting with the current fork release's recorded tip;
- upstream history between a recorded release and its incorporated tip contains unreleased core changes — source, tests, shipped docs, or metadata (both recording and offline prediction refuse these even when git-cliff would skip the commit type);
- a recorded object is missing locally, as in a shallow or partial clone.

There is deliberately no override flag.
Record the evidence through the sync script, or resolve a conflicting state entry by hand after review; prediction stays blocked until the record is sound.

### Recording a completed sync

Run the recorder only through the sync script, after conflict resolution and `git merge --continue`:

```bash
./scripts/upstream-sync.sh --record-core-sync <merge> \
    --fork-level <none|patch|minor|major> --rationale "<what the resolution did>"
```

It selects the highest stable upstream release whose peeled commit is contained in the merge's upstream parent — not the newest advertised tag — and verifies the release manifest agrees with the tag.
It refuses an unreviewed or unresolved merge, unreleased core changes, and missing objects, and it never pushes or creates local tag refs.
Re-running with the same review is idempotent; a conflicting record is an error.
Commit the state update before the next release prediction.

The `--fork-level` review classifies what the conflict resolution itself did to the core package.

- `none` records that resolutions kept fork identity without changing the core contract.
- `patch`, `minor`, or `major` record the resolution's own effect.
- Retaining fork identity or resolving a mechanical conflict does not imply `major`; a resolution that genuinely breaks the core contract is `major`.
- A non-`none` level must be justified by core files whose merge result differs from both parents; those paths are recorded with the level.

### Release correspondence lifecycle

`scripts/release/prepare-release.sh` resolves and validates the core correspondence in its all-packages preflight, before any write, and the decision must agree with the prediction entry.
When a core release is selected, it appends the release's verified correspondence to the state file in the same commit as the manifest and changelog.
Publishing only a sibling leaves the core state untouched.
After publication, the next window anchors at the recorded fork tag and upstream release, so prediction works offline from committed evidence and local Git objects alone.
Offline prediction revalidates the baseline and every window sync's release manifest, checks their incorporated tips for unreleased core changes, and verifies that successive upstream tips form a continuous ancestry chain.
It also rejects malformed git-cliff context entries or commit IDs rather than silently discarding fork changes.
Recording evidence does not exempt it from these read-time checks.

## Version correspondence

Each published `@jopqior/pi-subagents` version maps to the newest upstream `pi-subagents-v*` contained in that release's merge base.
Many-to-one is legal: several fork versions may share one upstream tag.
Automated derivation reads `scripts/release/core-sync-state.json` (see [Core sync evidence](#core-sync-evidence)); this table is the historical explanation and must agree with the JSON for published rows.
Add a row for each newly published fork core version.

Do not write an unreleased fork version number here.
The first data row lands in [#3] as `1.0.0 ← 21.7.0`.

<!-- release-correspondence:start -->

| Fork `@jopqior/pi-subagents` | Direct upstream release | Fixed source                                                                                                          |
| ---------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1.0.0                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 1.0.1                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 1.0.2                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 2.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 3.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.1                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |

<!-- release-correspondence:end -->

## Sync log

| Date (UTC)           | Upstream SHA                             | Upstream `pi-subagents` tag | Fork merge SHA                           |
| -------------------- | ---------------------------------------- | --------------------------- | ---------------------------------------- |
| 2026-09-12T14:16:33Z | 045213317de608c04a7b6052b2b843e3a0f2176f | pi-subagents-v21.7.0        | 2d8cea699b08afa0f6a2c06eeb1507a52d699636 |
| 2026-09-19T14:03:45Z | edb35ee28535aac4e12431e47e440f6933911834 | pi-subagents-v21.7.3        | 0408aa5ff9d9811d98df17dde436e7fd45a5a3ad |

[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
[#14]: https://github.com/Jopqior/gotgenes-pi-packages/issues/14
[#15]: https://github.com/Jopqior/gotgenes-pi-packages/issues/15
[#20]: https://github.com/Jopqior/gotgenes-pi-packages/issues/20
