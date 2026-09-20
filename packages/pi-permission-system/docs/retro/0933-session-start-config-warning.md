---
issue: 933
issue_title: "pi-permission-system: a config warning present at session start is never shown"
---

# Retro: #933 — pi-permission-system: a config warning present at session start is never shown

## Stage: Planning (2026-09-20T04:45:02Z)

### Session summary

Reproduced the swallowed config warning through the real composition root before designing: a global config of `{"permission": {"*": "allow"}}` with a `hasUI: true` ctx produced **0** `ui.notify` calls across `session_start` + `before_agent_start`.
The operator's first gate answer was a question about ownership rather than a selection, which redirected the design from a three-line dedupe patch to a seam move: `ConfigStore` answers its issues, a new `ConfigIssueReporter` owns the latch and delivers through `logger.warn`, driven at both `session_start` and every `before_agent_start`.
Plan committed as `packages/pi-permission-system/docs/plans/0933-session-start-config-warning.md` — five TDD steps, lift-and-shift ordered so no commit leaves a config warning without a delivery path.

### Observations

- **The first gate was premature.**
  It offered three fix shapes without establishing who owns operator-facing warnings in this package.
  Answering the ownership question produced the finding the option set lacked: `ConfigStore.refresh:122` is the *only* session-lifecycle warning that reaches `ctx.ui.notify` directly — measured against 10 `ui.notify` hits in `src/`, the other nine being a command ctx, a gate ctx, or `PermissionSession.notify` itself.
  That direct reach made a ctx *parameter* the delivery channel, which is the defect's enabling condition, not an implementation detail.
- **Rejected: the minimal delivery-gated dedupe.**
  Spiked and measured — exactly 1 notify, full suite green with zero test edits (166 files / 4523 tests).
  It works, and it leaves the notification lifecycle inside a config holder.
  Rejected on ownership, not correctness.
- **Rejected: driving the reporter from `ConfigStore.refresh` itself.**
  Needs no handler changes and reintroduces the bug: `refresh` runs at factory time and again at `handleSessionStart` *before* `resetForNewSession`, so `session.context` is null at both and `logger.warn` has nowhere to go.
  Verified `resetForNewSession` → `activate` → `this.context` is what makes the adjacent policy-issue loop work.
- **Rejected: driving from turn prep alone.** `before_agent_start` fires after the user message is pushed (`../../pi/packages/coding-agent/src/core/agent-session.ts:1390-1406`), so a startup warning would wait for the operator's first prompt.
- **Rejected: wiring the reporter through `PermissionSession`.**
  It would spare the handlers a new dep at the cost of a fourth pure config relay on a seven-dep aggregate.
- **Mid-session re-warn is load-bearing per the operator:** "given that we refresh mid-session, we must therefore keep the user informed if they create an issue with the config mid-session."
  That fixed the latch's home (a collaborator both drivers share) rather than letting it dissolve into a once-per-session report.
- **Latch semantics chosen: latch while present.**
  Replacing `reported` with the current set each report — not accumulating into it — preserves today's clearing behavior at per-issue granularity, so an issue that disappears and returns warns again.
- Measured the notification ceiling at **3** (one per cross-cutting detector) so the per-issue split replacing the `\n`-joined blob could be priced rather than asserted.
- No existing test pins the swallow — the minimal-fix spike went green with zero edits.
  Every candidate design therefore needs a new end-to-end pin; the plan's counts notifications across two `before_agent_start` fires so the latch's absence is caught too.

#### Deferred tidyings

The Tidy-First assessor recommended no preparatory commits and declined four candidates:

- `src/handlers/lifecycle.ts`, `src/handlers/session-turn-prep.ts` — converting positional constructors to a deps-object; positional is the `src/handlers/` convention across all four classes, and the design-review five-field trigger is about a shared dependency interface, not per-class arity.
- `test/handlers/lifecycle.test.ts`, `test/handlers/session-turn-prep.test.ts` — reshaping `makeSetup` / `makeTurnPrep` into options-bags; one call site each, so no repeated-edit pain to prepare for.
- `src/config/config-store.ts` — decomposing `refresh`'s five jobs (load, normalize, status sync, issue capture, debug log); at 33 lines with a surgical edit ahead of it, and no caller needs the steps split.
- `src/config/config-issue-reporter.ts` vs `src/authority/authorizer-chain-audit.ts` — merging the two warn-once latches into a shared base; same shape, different semantics (the audit never re-arms, the reporter re-warns after an issue returns).

Two corrections it returned that the plan absorbed: `docs/architecture/architecture.md:934`'s `lifecycle.ts` entry already omits `logger`, the existing fourth dep, independent of this issue (folded into step 3); and `ConfigStore.getConfigIssues()` will share a name with `PermissionResolver.getConfigIssues(agentName?)`, recorded as an Open Question rather than a rename in scope.

## Stage: Planning — amendment (2026-09-20T15:36:25Z)

### Session summary

After the plan was committed, the operator asked what disagreements I had with my own design and whether it complected the system.
Answering that honestly surfaced five smells the first pass left behind; running them through Tidy First's four bins turned two into preparatory `refactor:` steps, one into a filed follow-up ([#953]), one into a delivery-shape correction, and one into a deliberate "tidy never".
The plan was rewritten from five steps to seven and recommitted; the roadmap disposition for [#953] was recorded against Phase 15 as out of scope.

### Observations

- **The Tidy-First assessor answers the question it is asked.**
  Its "no preparatory tidying" verdict was correct for the question — friction in the edit — and the edit was already easy.
  The smells that mattered were *design residue* the fix would leave behind, which only became visible once I was asked to disagree with the settled design.
  Asking the assessor a second question ("what does the change leave half-done?") may be worth adding to its prompt.
- **Tidying 1 — activate before refresh.**
  `handleSessionStart`'s `refreshConfig` → `resetForNewSession` order was pinned by a characterization test with no recorded rationale (traced through #331, #341, #644 — the last says only "preserved").
  Spiked the swap: 4522 green, one red (the pin).
  Every side effect of `resetForNewSession` was read before adopting; `configureForCwd` reads no extension config and the authorizer chain is read per ask.
  Adopted; the pin is inverted with its reason.
  This removed the ordering constraint and killing mutation the first plan carried, and left both drivers with the same `refresh → report` shape.
- **Tidying 2 — status sync leaves the load.**
  `ctx` on `ConfigStore.refresh` gated two UI side-effects, not one; the first plan removed the notify and left the status sync, keeping the smell's shape.
  Moved to `PermissionSession.refreshConfig`, the point both drivers already call, rather than duplicated into two handlers (#746's rule).
  Sequenced so `ctx` stays on `refresh` until the removal step — deleting it earlier would take the old notify with it and open a delivery gap.
- **The Non-Goal I wrote was inconsistent with the operator's own principle.**
  "Don't unify the policy-issue loop" was justified by "it would newly re-warn policy issues mid-session" — which is exactly what the operator had just said must happen for config issues.
  Tidy First's answer: it changes behavior, so it is not a tidying and cannot ride the fix; file it.
  Filed as [#953] with the agent-name question and the `getPolicyIssues` rename attached.
- **Per-issue notification was a UX change hiding in a `fix:`.**
  Corrected to latch per issue, deliver one joined message per report — today's one-notification UX with a finer latch.
  Pure structure.
- **Tidy never:** a `warnOnce` primitive on `SessionLogger`.
  Fourth hand-rolled latch, but the logger is untouched by this change, so tidying it makes nothing easier.
  The fifth instance pays for it.
- **Ownership question at the first gate.**
  The operator answered the fix-shape gate with "who really wants to own this behavior?"
  — a question, not a selection, which the `clarification-gates` skill reads as a premature gate.
  It was: the option set assumed the store owned notification.
  The grep that answered it (10 `ui.notify` sites; one session-lifecycle outlier) should have preceded the gate.

#### Deferred tidyings

- `src/logging/session-logger.ts` — no tell-once affordance on `SessionLogger.warn`; four consumers hand-roll a latch (`PermissionSessionLogger.reported`, `AuthorizerChainAudit`, `ChildNodeAudit`, `ConfigIssueReporter`).
  Not touched by this change; revisit at the fifth.

## Stage: Implementation — TDD (2026-09-20T16:22:25Z)

### Session summary

Executed all seven steps of the amended plan as eight commits (the last step split a doc fix from a skill fix).
The two Tidy First preparations landed first: `handleSessionStart` now activates before refreshing, and the status-bar sync moved from `ConfigStore.refresh` to `PermissionSession.refreshConfig`.
`ConfigStore` now loads and answers `getConfigIssues()`; `ConfigIssueReporter` owns the latch and delivers through `logger.warn`, driven at `session_start` and every `before_agent_start`.
Test count 4523 to 4540 (+17); `refresh`'s first parameter is now a `cwd` string, so the swallowing notify is unrepresentable in that method.

### Observations

- **The tidyings paid off exactly as predicted.**
  Tidying 1 deleted a constraint the first plan had to pin with a comment and a killing mutation: once activation precedes the refresh, there is no ordering for `report()` to get wrong.
  Tidying 2 left `ctx` with a single reader in `refresh`, so step 6's parameter removal was mechanical and `tsc` found every site.
- **The parameter removal is the real guard.**
  Verified by mutation: adding `ctx?.ui.notify("reintroduced", "warning")` back inside `refresh` now fails with `TS2304: Cannot find name 'ctx'`.
  The defect is structurally unrepresentable rather than merely absent.
- **A predicted mutation did not fire.**
  The plan said deleting the `session_start` drive would redden the end-to-end pin; it did not, because that pin fires both moments and turn prep alone satisfies it.
  Only the #927 retarget caught it, incidentally.
  Added a `session_start`-only pin so the drive is covered directly.
  This is the "count the reds against the prediction" rule earning its place — the coverage existed, but not where the plan claimed.
- **Two tests stayed green during their Red step** (the `hasUI: false` status case and the mid-session notification).
  Both were mutated explicitly rather than assumed sound; mutation A on the `hasUI` guard and the store-side restore each killed the right one.
- **The mid-session exactly-once pin had to move a step later.**
  Between steps 5 and 6 both the reporter and the store's surviving notify deliver, so the count is two — the transient duplication the lift-and-shift sequencing accepted.
  The plan placed the pin in step 5, where it cannot hold.
  Sequencing was right; the pin's placement was not.
- **Deviation the plan under-listed:** the #644 trust-gating assertions in `lifecycle.test.ts`, `session-turn-prep.test.ts`, and `permission-session.test.ts` assert `refresh`'s arguments, so all six moved from `ctx` to `ctx.cwd`.
  The plan listed only the `session-fixtures` stub for that cascade.
  Each still pins the trust flag, and mutating the cwd away reddens all six.
- **Deviation:** step 7's verify criterion (`grep "933"` in `src`/`test` returns nothing) was over-broad.
  It targeted the stale defect description, which is gone; the surviving `(#933)` citations are provenance for live constraints (the ordering, the ctx-free load, the latch), which the convention keeps.
- **The plan's predicted-unchanged table was wrong about the package skill.**
  It enumerates `handler-fixtures`' exports, so adding `makeConfigIssueReporter` left it incomplete — caught in the post-step cross-check, not by any gate.
- Two Biome **warnings** (exit 0) appeared from orphans the change created: `composition-root`'s `readDebugLog` lost its last caller when the #927 test was retargeted, and `session-fixtures` lost its `ExtensionContext` import.
  Counting `lint/` occurrences rather than trusting the exit code is what surfaced them.
- Health score unchanged at 78 B; no clone group under `config/`, so the new module added none.

### Reviewer verdict

Pre-completion reviewer: **PASS** — ready for `/ship`.
It independently re-derived all four mandated invariants, confirmed `save()` and `handleResourcesDiscover` never delivered these issues (so nothing lost a notification), and confirmed the reporter is factory-scoped so its latch cannot leak across same-cwd session switches.
No warnings.

[#953]: https://github.com/gotgenes/pi-packages/issues/953

## Stage: Sync (worktree) (2026-09-20T16:29:16Z)

### Session summary

Pre-push checks (`pnpm run lint`, `pnpm fallow dead-code`) both passed clean with no changes needed.
The plan's `**Release:** ship independently` marker holds — not part of any batch, no dependency on a sibling package.
A follow-up ([#953], the sibling policy-file-issue accumulation) is filed and dispositioned against Phase 15 as out of scope; nothing else was deferred.

**Peer session transcript:** `/Users/chris/.pi/agent/sessions/--Users-chris-development-pi-pi-packages-worktrees-issue-933--/2026-09-20T01-16-10-377Z_01a0bc62-8d09-7608-8a3e-0a7e57cf11bd.jsonl` — read with `read_session_file({ path: "..." })` for message-level verification at land/retro time.

### Observations

Rebase onto local `main` is the next step; no conflicts anticipated — this branch's commits touch only `packages/pi-permission-system/` and `.pi/skills/package-pi-permission-system/SKILL.md`.
