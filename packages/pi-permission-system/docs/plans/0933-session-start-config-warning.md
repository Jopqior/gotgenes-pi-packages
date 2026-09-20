---
issue: 933
issue_title: "pi-permission-system: a config warning present at session start is never shown"
---

# A config warning present at session start reaches the operator

## Release Recommendation

**Release:** ship independently

`docs/architecture/architecture.md`'s open-issue sweep records [#933] as "filed by [#927]'s implementation; out of scope for the roadmap" — it belongs to no numbered step and no `Release: batch`.
It is a `config/` notification-lifecycle defect, so it cuts its own `fix:` release.

## Problem Statement

Every config issue `loadAndMergeConfigs` produces — the permissive-bash-fallback warning, the deprecated-preview-cap notice, and a refused `permissionDialogKeys` binding — reaches the debug log and nothing else.

The cause is a dedupe against a notification nobody received.
`src/index.ts:241` primes the store with `configStore.refresh(undefined, false)` so it holds a config before the first handler runs.
`ConfigStore.refresh` joins `mergeResult.issues` into one `warning` string, records `this.lastConfigWarning = warning`, and then calls `ctx?.ui.notify(warning, "warning")` — a no-op, because the priming call has no ctx.
`SessionLifecycleHandler.handleSessionStart` then calls `refreshConfig(ctx, projectTrusted)` with a real ctx, produces the identical string, and the dedupe swallows it.

**What the operator sees** (reproduced through the real composition root; the spike is not retained): a global config of `{"permission": {"*": "allow"}}` — the exact shape `detectPermissiveBashFallback` exists to flag — then `session_start` and `before_agent_start` with a `hasUI: true` ctx whose `ui.notify` is captured.
Measured: **`ui.notify` called 0 times.**
The warning appears only in `logs/pi-permission-system-debug.jsonl` under `config.loaded`, and only when `debugLog` is enabled.

The swallowed class is precisely the issues that are identical under global-only and full merge: every global-scope issue, plus the three cross-cutting detectors whenever no project config contributes.
A warning caused by project config *does* differ from the priming string and is shown today — which is why the defect reads as intermittent.

## Goals

- A config issue present before the session starts is warned once, to the session that has a UI to show it in.
- A config issue that first appears mid-session is warned on the next turn, because the config is re-read on every `before_agent_start`.
- The dedupe's real job survives: an unchanged issue is not re-announced on every turn.
- `ConfigStore` stops owning a notification lifecycle.
  It answers what is wrong with the config; something else decides whether the operator has been told.

Not breaking.
No config key, schema field, default, or output shape changes; the only observable delta is that a warning the operator was supposed to see now arrives.

## Non-Goals

- **Headless delivery.**
  When `ExtensionRunner.hasUI()` is false, `ctx.ui` is pi's `noOpUIContext` (`../../pi/packages/coding-agent/src/core/extensions/runner.ts:530`), so a non-interactive session has no notify channel at all and the debug log stays its only record.
  The issue's Expected scopes this out: "shown once, to the session that has a UI to show it in."
- **Unifying the two accumulations.**
  `SessionLifecycleHandler` already warns `resolver.getConfigIssues(agentName)` — `FilePolicyLoader`'s per-file schema issues — in its own loop at `lifecycle.ts:60-64`.
  Folding that into the same reporter would newly re-warn policy issues mid-session (policy is re-read from file mtimes on any turn) and pull agent-name resolution into turn prep.
  Left alone; see Open Questions.
- **A review-log record for config issues.**
  `AuthorizerChainAudit` writes both a durable review entry and a latched warning; this change adds only the warning, leaving `config.loaded`'s debug entry as the record it is today.
  See Open Questions.
- **No change to detector logic** or to which issues `loadAndMergeConfigs` produces.
- **No change to `ConfigStore.save`'s modal path**, including its own `ctx.ui.notify` error report on a failed write.
- **The priming call itself stays.**
  `index.ts:236-240` documents why it must run after `session` is assigned (a debug-write IO failure routes through `session.notify`) and why it withholds the project scope (no trust decision exists yet).
  Both reasons survive; the fix removes the notification decision from the load, not the load.

## Background

### The modules

| Module                              | Role in this change                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/config/config-loader.ts`       | `loadAndMergeConfigs` returns `{ merged, issues }`; three pure detectors append to `issues`               |
| `src/config/config-store.ts`        | `ConfigStore` owns `config` + `lastConfigWarning`, notifies, syncs status, writes the `config.loaded` log |
| `src/index.ts`                      | Composition root; primes the store at line 241 and builds both driving handlers at 308/315                |
| `src/handlers/lifecycle.ts`         | `SessionLifecycleHandler.handleSessionStart` — refresh, reset, log paths, warn policy issues, activate    |
| `src/handlers/session-turn-prep.ts` | `SessionTurnPrep.prepare` — warm parser, activate, refresh config, announce ready; runs **every turn**    |
| `src/logging/session-logger.ts`     | `SessionLogger.warn(message)` → injected notify sink → `PermissionSession.notify`                         |
| `src/session/permission-session.ts` | `notify(message)` writes to `this.context?.ui.notify`; `context` is set by `activate`                     |

### Who owns an operator-facing warning today

`grep -rn "ui\.notify" packages/pi-permission-system/src` returns 10 hits (measured).
Eight are a *command* ctx (`config-modal.ts`, `ConfigStore.save`) or the gate ctx (`permission-gate-handler.ts:94`) — correctly scoped to a call the operator just made.
One is `PermissionSession.notify` (`permission-session.ts:98`), the package's session-lifecycle notify sink: `SessionLogger.warn(msg)` → the injected sink → `this.context?.ui.notify`.
Every other session-lifecycle warning routes through it — `UNTRUSTED_PROJECT_MESSAGE`, the `resolver.getConfigIssues()` loop, `AuthorizerChainAudit`, `ChildNodeAudit`, and log-IO failures.

`ConfigStore.refresh:122` is the **only** session-lifecycle warning that reaches `ctx.ui.notify` directly.
That reach is the defect's enabling condition: it made a ctx *parameter* the delivery channel, so a call without one silently consumed the message.

In both existing audits the latch sits with the thing that knows what "the same alarm" means (per configured name; per absent child) and delivery goes through `logger.warn`.
A latch in `ConfigStore` is therefore not per se misplaced — bypassing `logger.warn` is.

### The ordering constraint

`handleSessionStart` (`lifecycle.ts:52-56`) calls `refreshConfig(ctx, …)` **before** `resetForNewSession(ctx, …)`, and `resetForNewSession` (`permission-session.ts:111-118`) is what calls `activate(ctx)`, which sets `this.context`.
So at the `refreshConfig` call, `session.notify` is *also* a no-op on a fresh session.
Any delivery that goes through `logger.warn` must therefore run **after** `resetForNewSession`.
The existing policy-issues loop works precisely because it does (lines 60-64).

### `before_agent_start` fires on submit, not at startup

`AgentSession` emits `before_agent_start` after pushing the user message (`../../pi/packages/coding-agent/src/core/agent-session.ts:1390-1406`), so it runs once per agent run — not when the session opens.
Driving the report from turn prep alone would delay a startup warning until the operator's first prompt.
Both moments are needed.

### AGENTS.md constraints that apply

- **Keep scope tight** — this is a bug fix; the two Non-Goal unifications are deliberately left out.
- **Prefer config patterns over new runtime mechanisms** — no new config key; the new collaborator replaces a field, it does not add a knob.
- Directory vocabulary (`.pi/skills/package-pi-permission-system/SKILL.md`): the new module's subject is config issues, so it goes in `config/`, and its name must be added to the architecture doc's `config/` tree listing when it is written.
- Within the package, `./` names a same-directory module and `#src/` a cross-directory one; both are lint-enforced with auto-fix.

## Design Overview

`ConfigStore` stops notifying and starts **answering**.
A new session-scoped collaborator owns the latch and delivers through `logger.warn`, driven at the two moments the operator is reachable.

```ts
// src/config/config-issue-reporter.ts

/** The config seam the reporter reads (ISP): current issues, nothing else. */
export interface ConfigIssueSource {
  getConfigIssues(): readonly string[];
}

/** The log seam the reporter writes (ISP): one operator-facing warning. */
export interface ConfigIssueWarner {
  warn(message: string): void;
}

/** The seam the two handlers drive. */
export interface ConfigIssueReporting {
  report(): void;
}

export class ConfigIssueReporter implements ConfigIssueReporting {
  private reported: ReadonlySet<string> = new Set();

  constructor(
    private readonly source: ConfigIssueSource,
    private readonly log: ConfigIssueWarner,
  ) {}

  report(): void {
    const current = this.source.getConfigIssues();
    for (const issue of current) {
      if (!this.reported.has(issue)) this.log.warn(issue);
    }
    this.reported = new Set(current);
  }
}
```

### Latch semantics: latch while present

| Sequence of reports        | Warned                                       |
| -------------------------- | -------------------------------------------- |
| `[A]`                      | `A`                                          |
| `[A]`, `[A]`               | `A` once                                     |
| `[A]`, `[A, B]`            | `A`, then `B` only                           |
| `[A]`, `[]`, `[A]`         | `A`, then `A` again (the set dropped it)     |
| `[]`                       | nothing                                      |

Replacing the set rather than accumulating into it is what makes the third and fourth rows differ.
It preserves today's clearing behavior (`lastConfigWarning = null` when the issues vanish) at per-issue granularity instead of per-blob.

### Call sites

```ts
// src/index.ts — after configStore (126) and logger (120) exist
const configIssueReporter = new ConfigIssueReporter(configStore, logger);
// …passed to new SessionLifecycleHandler(…) at 308 and new SessionTurnPrep(…) at 315
```

```ts
// src/handlers/lifecycle.ts — handleSessionStart, AFTER resetForNewSession
this.session.resetForNewSession(ctx, projectTrusted);
// …
this.configIssues.report();   // delivery needs session.context, which activate() set above
```

```ts
// src/handlers/session-turn-prep.ts — prepare, after the refresh, before the announce
this.session.refreshConfig(ctx, ctx.isProjectTrusted());
this.configIssues.report();   // the config was just re-read; report what is new
this.readyAnnouncer.announceReady(ctx);
```

Both consumers use 100% of the seam they receive, and neither reaches through the other (`report()` takes no arguments — the reporter asks its own source).

### Why the reporter is not wired through `PermissionSession`

`PermissionSession` already relays three config operations to the store (`refreshConfig`, `logResolvedConfigPaths`, `config`).
Adding a fourth pure relay to a seven-dependency aggregate, to spare a thin handler a sixth collaborator, trades a real ownership boundary for an arity count.
The reporter's only inputs are `configStore` and `logger`, both in hand at `index.ts:126`, so it is wired directly to its drivers.

### Why the store does not drive the reporter itself

An injected reporter called from the end of `refresh()` needs no handler changes at all — and reintroduces the defect.
`refresh` runs at factory time (no context) and again at `handleSessionStart` *before* `resetForNewSession` (still no context), so delivery through `logger.warn` would be swallowed at both and first arrive at the operator's first prompt.
Coupling load-time to notify-time is the cause, not an implementation detail of it.

### One issue per notification

Today a multi-issue config produces one `\n`-joined notification.
The reporter warns per issue, matching the adjacent `resolver.getConfigIssues()` loop, and its latch is per issue so a later report announces only what is new.
Measured ceiling from the three cross-cutting detectors on a single global config (`{"permission": {"*": "allow"}, "toolInputPreviewMaxLength": 500, "toolTextSummaryMaxLength": 500, "permissionDialogKeys": {"deny": "j"}}`): **3 issues** — one per detector, with the two deprecated caps folded into a single message.
Legacy-file notices and zod field violations add to that only when those files or fields exist.

### Naming overlap to hold

`ConfigStore.getConfigIssues()` (no arguments; extension-config load and merge) and `PermissionResolver.getConfigIssues(agentName?)` (agent-scoped policy-file issues) will share a name in one package.
They never appear in the same expression — `handleSessionStart` calls the resolver's directly and reaches the store's only through the reporter — so the collision is conceptual.
Each method's doc comment names its accumulation; the resolver rename is an Open Question, not this change.

## Module-Level Changes

### Added

- **`src/config/config-issue-reporter.ts`** — `ConfigIssueReporter` plus the three seams above.
  Doc comment states the latch-while-present rule, why delivery goes through `logger.warn` rather than a ctx parameter, and the `resetForNewSession`-ordering constraint its session-start driver must honor.
- **`test/config/config-issue-reporter.test.ts`** — latch semantics.

### Changed

- **`src/config/config-store.ts`**
  - Line 76 doc comment: "privately own `config` and `lastConfigWarning`" → names the issue list.
  - Line 83: `private lastConfigWarning: string | null = null` → `private configIssues: readonly string[] = []`.
  - `refresh` (102-134): keep the `warning` join at 117 for the `config.loaded` entry; keep the `ctx?.hasUI` status sync at 113-115; **delete lines 120-125** (the if/else and the `ctx?.ui.notify` call); assign `this.configIssues = mergeResult.issues`.
  - Add `getConfigIssues(): readonly string[]`.
  - `save`: delete `this.lastConfigWarning = null;` (line 180).
    `git log -S'this.lastConfigWarning = null'` traces the line to one commit, `5941733a feat: add ConfigStore owning extension config state` — it arrived with the extraction and carries no separate rationale.
    `save` writes only `debugLog` / `permissionReviewLog` / `yoloMode`, none of which any detector reads, so it cannot change the issue set and has nothing to re-announce.
  - Add `ConfigIssueSource` to the `implements` list (type-only `./config-issue-reporter` import; no runtime cycle).
- **`src/handlers/lifecycle.ts`** — `SessionLifecycleHandler` gains a sixth constructor dep (`ConfigIssueReporting`); `handleSessionStart` drives `report()` after `resetForNewSession`; "Constructor deps" doc comment updated.
- **`src/handlers/session-turn-prep.ts`** — `SessionTurnPrep` gains a fourth constructor dep; `prepare` drives `report()` between `refreshConfig` and `announceReady`; doc comment updated.
- **`src/index.ts`** — construct the reporter; pass it at lines 308 and 315.
- **`src/config/config-loader.ts`** — `detectUnusableDialogKeys`'s doc comment (lines 463-477) describes this defect in present tense and cites `(#933)`; rewrite for the fixed behavior.
  Verified as the only `#933` mention anywhere in `src/` or `test/`.
- **`test/config/config-store.test.ts`** — four tests assert the removed behavior and are replaced: "sets warning when issues are present" (217), "notifies UI when a new warning appears and hasUI is true" (240), "does not re-notify the same warning on subsequent calls" (252), "clears warning when no issues on next refresh" (265).
  New: `getConfigIssues()` is empty before any refresh and returns the loader's issues after one; `refresh` never calls `ctx.ui.notify`; the `config.loaded` entry still carries the joined `warning`.
- **`test/handlers/lifecycle.test.ts`** — `makeSetup()` (line 42) takes the reporter stub; new tests for the drive and its ordering.
- **`test/handlers/session-turn-prep.test.ts`** — `makeTurnPrep()` (line 14) takes the stub; new test for the drive and its position before `announceReady`.
- **`test/handlers/before-agent-start.test.ts`** — line 74 constructs `SessionTurnPrep` with three args; add the fourth.
- **`test/composition-root.test.ts`** — new end-to-end pin (below); the #927 test at line 2225 retargeted from the debug log to `ui.notify`, keeping its policy-untouched assertions.
- **`test/helpers/handler-fixtures.ts`** — add a `makeConfigIssueReporter()` stub (`{ report: vi.fn() }`) so the three construction sites do not improvise it three times.
- **`docs/architecture/architecture.md`**
  - Line 865 — the `config-store.ts` entry says "owns `config` + `lastConfigWarning`"; restate as the issue list and the answer-not-notify boundary.
  - New `config/` tree entry for `config-issue-reporter.ts`.
  - Line 934 — the `lifecycle.ts` entry lists "(session: `PermissionSession` + resolver + serviceLifecycle + audit)".
    It already omits `logger`, the existing fourth dep, independent of this issue; correct that and add the reporter in the same edit.
  - Line 936 — the `session-turn-prep.ts` entry lists its three deps and its step order; add the reporter and the report step.

### Predicted unchanged, with the claim each rests on

| File                                                                                           | Claim                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/session/permission-session.ts`                                                            | The reporter is wired in `index.ts`, not through the session, so neither `refreshConfig` nor `SessionConfigStore` is touched                                 |
| `test/helpers/session-fixtures.ts` (`makeConfigStore`)                                         | `SessionConfigStore` does not gain `getConfigIssues`; the seam the reporter reads is its own                                                                 |
| `src/config/config-schema.ts`, `schemas/permissions.schema.json`, `config/config.example.json` | No config surface changes, so no `pnpm run gen:schema` and no parity-test drift                                                                              |
| `packages/pi-permission-system/README.md`, `docs/configuration.md`                             | No command, config key, or user-facing feature is added, removed, or renamed                                                                                 |
| `.pi/skills/package-pi-permission-system/SKILL.md`                                             | Measured: 0 hits for `lastConfigWarning`, `getConfigIssues`, or `933`; its only `ConfigStore` mention is `makeConfigStore`, unchanged                        |
| `docs/architecture/architecture.md` Mermaid blocks                                             | Measured: `grep -n "ConfigStore\|config-store"` matches line 865 only — no diagram node models this flow                                                     |
| `docs/architecture/architecture.md:1201-1203`                                                  | The [#933] open-issue sweep entry is a filing-time disposition record; sibling entries for shipped issues (e.g. [#907]) keep their present-tense description |
| `src/index.ts:236-240` (the priming comment)                                                   | The priming call does not move and both its stated reasons survive                                                                                           |

## Test Impact Analysis

**New tests the change enables.**
The latch was a private field inside `ConfigStore.refresh`, reachable only through a mocked `loadAndMergeConfigs` plus a hand-built ctx double — which is why the four existing tests read as they do.
As its own collaborator it is directly testable: five cases over a two-method fake, no filesystem and no ctx.

**Tests that become redundant.**
The four notify/dedupe tests in `config-store.test.ts`.
Their concern splits cleanly: latch semantics move down to `config-issue-reporter.test.ts`, and end-to-end delivery moves up to the composition-root pin.
What stays at the store's level is only what the store still owns — that it captures the loader's issues and answers them.

**Tests that must stay as-is.**

- `config-store.test.ts`'s project-scope gating tests (#644) — they assert the `loadAndMergeConfigs` arguments, which this change does not touch.
- `config-store.test.ts`'s "writes config.loaded debug log" — the `warning` field it covers is the fixed behavior's durable record.
- `lifecycle.test.ts`'s "withholds the project scope from refreshConfig and resetForNewSession" and `session-turn-prep.test.ts`'s "withholds the project scope when the project is untrusted" — both open and read; they assert on the real `configStore.refresh` call, not a mocked-away layer.
- The #927 test's policy assertions (`*: allow` still allows; the refused binding keeps `n`).
  Only its warning assertion is retargeted.

**The end-to-end pin** (`composition-root.test.ts`), written against the reproduction this plan measured: a global config of `{"permission": {"*": "allow"}}`, the real factory, then `session_start` + **two** `before_agent_start` fires with a `hasUI: true` ctx whose `ui.notify` is captured.
The permissive-bash-fallback text must arrive exactly **once**.
Baseline measured on the current code: **0**.
A three-line spike of the minimal delivery-gated variant produced exactly **1** across `session_start` + one `before_agent_start`, with the full package suite green and **zero** test edits (166 files / 4523 tests, measured) — so no existing test pins the swallow, and the count in this pin is reachable.

## Invariants at risk

| Invariant                                                                                                     | Pinned by                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#644** — an untrusted project's scope is withheld from every config read, on both refresh paths             | `lifecycle.test.ts` "withholds the project scope from refreshConfig and resetForNewSession"; `session-turn-prep.test.ts` "withholds the project scope when the project is untrusted"; `config-store.test.ts` "withholds the project scope when the project is untrusted" — all three assert the real call arguments |
| **#927** — a refused `permissionDialogKeys` binding keeps its default letter and does not floor the policy    | `composition-root.test.ts:2225`; its two policy assertions are preserved verbatim when the warning assertion is retargeted                                                                                                                                                                                          |
| **ADR 0012 decision 3** — `permissions:ready` is announced **last** in turn prep, once the node is up to date | `session-turn-prep.test.ts` "announces the node as ready, on the same ctx", plus a new ordering assertion that `report()` precedes `announceReady`                                                                                                                                                                  |
| The dedupe's real job — an unchanged issue is not re-announced on every turn                                  | The end-to-end pin's "exactly once across two `before_agent_start` fires"; quantitative, with the baseline and target measured above                                                                                                                                                                                |
| `config.loaded`'s `warning` field stays the durable record                                                    | `config-store.test.ts` "writes config.loaded debug log", extended to assert the joined string                                                                                                                                                                                                                       |
| The store holds a config before the first handler runs                                                        | `config-store.test.ts` "returns DEFAULT_EXTENSION_CONFIG before any refresh"; the priming call is not moved                                                                                                                                                                                                         |

**Constituencies.**
The warning's reader is the operator, who is reachable only through `ctx.ui` and only when `hasUI()` is true.
The debug log's reader is whoever is diagnosing after the fact, and that record is unchanged by this plan — the `config.loaded` entry keeps its joined `warning` field even though the notification is now per issue.
Both constituencies are served after the change; today only the second is.

## TDD Order

1. **`refactor:` the latch, as its own collaborator.**
   Red: `test/config/config-issue-reporter.test.ts` — warns each current issue once; silent on an unchanged repeat; warns only the newly appeared issue when the set grows; re-warns an issue that disappeared and returned; nothing when empty.
   Green: `src/config/config-issue-reporter.ts`.
   No consumer references it yet, so this is `refactor:` and `cliff.toml` skips it.
   **Killing mutations:** (a) delete the `if (!this.reported.has(issue))` guard so every current issue warns on every report — must redden "silent on an unchanged repeat" and "warns only the newly appeared issue"; (b) replace `this.reported = new Set(current)` with `for (const i of current) this.reported.add(i)` — must redden "re-warns an issue that disappeared and returned" and leave the other four green; (c) delete the `this.reported = …` line entirely — must redden "silent on an unchanged repeat".
   Commit: `refactor: add a config-issue reporter that warns each issue once while present`

2. **`refactor:` the store answers its issues (additive).**
   Red: `config-store.test.ts` — `getConfigIssues()` is empty before any refresh, and returns the loader's `issues` after one.
   Green: add the `configIssues` field, assign it in `refresh`, add the getter, add `implements ConfigIssueSource`.
   The notify and the `lastConfigWarning` dedupe stay untouched in this step — lift-and-shift, so no commit exists in which a config warning has no delivery path at all.
   **Killing mutation:** make `getConfigIssues()` return `[]` unconditionally — must redden the post-refresh test and leave the pre-refresh one green.
   Commit: `refactor: let ConfigStore answer its config issues`

3. **`fix:` the warning reaches the operator.**
   This is the step a user can observe, and the one that ships to the changelog.
   Red: the end-to-end pin in `composition-root.test.ts` (exactly one notify of the permissive-bash-fallback text across `session_start` + two `before_agent_start` fires); the #927 test retargeted to `ui.notify`; `lifecycle.test.ts` and `session-turn-prep.test.ts` drive-and-ordering tests.
   Green: `makeConfigIssueReporter()` in `test/helpers/handler-fixtures.ts`; the sixth dep on `SessionLifecycleHandler` and the `report()` call after `resetForNewSession`; the fourth dep on `SessionTurnPrep` and the `report()` call between `refreshConfig` and `announceReady`; the construction and two wirings in `index.ts`; the third arity fix in `before-agent-start.test.ts`.
   Both handler-class doc comments updated here, with their `architecture.md` entries (lines 934/936, including the pre-existing `logger` omission on 934).
   **Killing mutations:** (a) delete the `report()` call in `handleSessionStart` — must redden the end-to-end pin and the #927 retarget, since turn prep would still deliver but only on the first prompt; (b) delete the `report()` call in `prepare` — must redden the mid-session case in `session-turn-prep.test.ts`; (c) **move** the `handleSessionStart` call to before `resetForNewSession` — must redden the end-to-end pin, because `session.context` is still null there and `logger.warn` has nowhere to go.
   Mutation (c) is the one that pins the ordering constraint; a relocated call is as unpinned at its new site as at its old one.
   Commit: `fix(pi-permission-system): show a config warning present at session start`

4. **`refactor:` remove the swallowing push.**
   Red: `config-store.test.ts` — `refresh` never calls `ctx.ui.notify`, on a ctx with issues present and with a repeated identical call; delete the four tests that asserted the old dedupe.
   Green: delete `lastConfigWarning`, the `if/else` at 120-125, the `ctx?.ui.notify` call, and `save`'s reset; update the class doc comment at line 76 and the `architecture.md` entry at line 865; add the `config-issue-reporter.ts` tree entry.
   **Killing mutations:** (a) restore `ctx?.ui.notify(warning, "warning")` in `refresh` — must redden the new never-notifies test; (b) drop the `warning` join so `config.loaded` records `null` — must redden "writes config.loaded debug log".
   Commit: `refactor: remove ConfigStore's direct notify and warning dedupe`

5. **`docs:` correct the prose the fix invalidates.**
   Rewrite `detectUnusableDialogKeys`'s doc comment (`config-loader.ts:463-477`), whose present tense and `(#933)` citation describe the defect as live.
   Mark nothing in the roadmap — [#933] is an open-issue sweep disposition, not a numbered step, so there is no `✅` or `Landed:` note to add.
   Verify: `grep -rn "933" packages/pi-permission-system/src packages/pi-permission-system/test` returns nothing.
   Commit: `docs(pi-permission-system): describe the dialog-key warning's delivery`

Steps 1, 2, 4 and 5 are `refactor:`/`docs:` by the rule that a step's type follows what a user can observe once it lands; step 3 is where the behavior arrives, so the changelog reads once.

## Risks and Mitigations

| Risk                                                                                                                                                     | Mitigation                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Absent latch:** a reporter with no `reported` set re-warns every issue on every turn — the annoyance `lastConfigWarning` was introduced to prevent     | This is the risk asserting what happens when the mechanism is *absent*, so it is named as step 1's killing mutation (a) and step 3's end-to-end pin counts notifications across two turns rather than one. Testing the latch present would only verify the happy path |
| **The `resetForNewSession` ordering is invisible at the call site** — a later edit reorders `handleSessionStart` and the warning silently vanishes again | A comment at the call site naming what `activate` provides, plus step 3's killing mutation (c), which relocates the call and must go red                                                                                                                              |
| **Three notifications instead of one** on a maximally misconfigured global config                                                                        | Measured ceiling is 3 (one per cross-cutting detector), matching the adjacent per-issue `resolver.getConfigIssues()` loop; the per-issue latch means a later report announces only the new one, where the old blob re-announced all three                             |
| **A save no longer re-announces** a persisting issue, because the store-level reset is gone                                                              | `save` writes only `debugLog` / `permissionReviewLog` / `yoloMode`; no detector reads any of them, so the issue set cannot change across a save and the reporter's latch is correct to hold                                                                           |
| **`SessionLifecycleHandler` reaches six constructor deps**                                                                                               | All six are distinct collaborators, each used by a distinct responsibility, and every `src/handlers/` class uses positional construction. The Tidy-First assessor declined a deps-object as the wrong-abstraction move for this directory. Track and watch            |
| **A mid-session warning arrives between turns**, when the operator may not be looking at the notification area                                           | Unchanged from today's intent — the dedupe existed to deliver exactly this case. `config.loaded` remains the durable record for anyone reading after the fact                                                                                                         |

## Open Questions

- Should `ConfigIssueReporter` also carry the `resolver.getConfigIssues(agentName)` accumulation, so the two kinds of config issue are reported by one mechanism with one latch?
  It would newly re-warn policy issues mid-session (policy is re-read from file mtimes on any turn, #873) and pull agent-name resolution into turn prep.
  Deferred until a policy issue is observed appearing mid-session without being reported.
- Should the reporter write a durable review-log record alongside the warning, as `AuthorizerChainAudit` does?
  `config.loaded`'s debug entry covers it only when `debugLog` is enabled.
  Deferred — it is new behavior the issue did not ask for.
- `PermissionResolver.getConfigIssues(agentName?)` would read more clearly as `getPolicyIssues`, now that a second `getConfigIssues` exists on the store.
  A rename touches the resolver, the manager, `lifecycle.ts`, and their tests, for a readability gain; not this change.

[#907]: https://github.com/gotgenes/pi-packages/issues/907
[#927]: https://github.com/gotgenes/pi-packages/issues/927
[#933]: https://github.com/gotgenes/pi-packages/issues/933
