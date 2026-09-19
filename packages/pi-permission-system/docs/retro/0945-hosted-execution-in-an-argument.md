---
issue: 945
issue_title: "pi-permission-system: a command hosted in a consumed flag argument has its operands dropped (ADR 0009 positional invariance)"
---

# Retro: #945 — A command hosted in a consumed flag argument has its operands dropped

## Stage: Planning (2026-09-19T20:31:33Z)

### Session summary

Planned the fix for a dropped-operand defect in `token-collection.ts`'s path projection.
A disposable spike against the real `tree-sitter-bash` parser showed the issue's single branch is one of **four** argument positions sharing one cause — an argument node is read for its text but never searched for hosted executions — so the operator widened the scope at the clarification gate.
The plan lands as five TDD steps (one Tidy-First `test:` prep, two `fix:` steps split by walker, an end-to-end pin, and the roadmap doc update) in `docs/plans/0945-hosted-execution-in-an-argument.md`.

### Observations

- **The issue under-reported its own defect.**
  The body, the roadmap step, and [#863]'s committed plan item 2 all describe the `discharge.consumed` branch of `collectPatternCommandTokens`.
  Measurement found the same loss in the pattern positional, the pattern-first ordinary operand, and `collectGenericCommandTokens` — `echo "$(cat /etc/shadow)"` drops `/etc/shadow` today.
  The unquoted spellings work only because a bare `$(…)` parses as `command_substitution`, outside `ARG_NODE_TYPES`; quoting wraps it in a `string` the walkers intercept and never descend.
- **The first gate was mispriced, and the operator caught it by asking rather than choosing.**
  The initial `ask_user` offered narrow-plus-follow-up as recommended, priced on "13 corpus commands newly flagged".
  Two follow-up measurements changed the answer: the full 4511-test suite is green under the widened spike, and **all 13 affected commands already carried an `external_directory` candidate**, so the widened fix creates zero new prompts in the corpus — only longer evidence lists.
  The lesson is the `clarification-gates` one in a new shape: "newly flagged" was a measured number that did not measure the thing the operator cares about (does a user see a new prompt?).
  Measure the consequence, not the intermediate.
- **Corpus bounds frequency, not reachability.**
  Recorded in the plan's risk table rather than argued away: zero new prompts across 7653 commands of one author's log under one policy does not prove no user can hit one.
  The change stays `fix:` on the [#741] / [#742] precedent for new projections.
- **Token order is presentational.**
  Confirmed by reading `bash-path-resolver.ts` — `projectRuleCandidates` and `recordExternal` dedup by resolved path and merge attributions via `mergeTokenEffects`.
  That is what makes a single insertion point per walker safe even though it emits hosted operands ahead of the argument's own text, and it is why the plan does not touch four separate exits.
- **Effect attribution is the discriminating assertion.**
  Measured: in `sed -e "$(cat /etc/shadow)" f.txt` the new `/etc/shadow` carries `read`/`core` (`cat`'s proof) while `f.txt` stays `unproven` (`sed` is not in the pure-reader core).
  A token that wrongly inherited the enclosing command's attribution would read `unproven`, so the plan names a second killing mutation for that class alone.
- **The single-quoted control is the test that keeps the change honest.**
  `grep -e '$(cat /etc/shadow)' f.txt` must **not** gain a token, because `tree-sitter-bash` emits no substitution under a `raw_string`.
  A fix that searched argument text rather than argument executions would light it up.
- **Scope interaction with [#859], accepted knowingly.**
  4 of the 15 newly-projected strict tokens are git revision ranges — [#859]'s false-positive class, the next Track A step.
  They ride asks that were already opening, so the cost is evidence lines, not prompts.
- **Tidy-First: one recommendation accepted.**
  The assessor confirmed the production file needs no preparation (both insertion points already exist as single dominating sites) and found the test files already organized by the right seams.
  Its one recommendation — a `tokensOf` shorthand in the generic-commands block, which the sibling pattern-first block already has — is TDD step 1.

#### Deferred tidyings

- `test/access-intent/bash/token-collection.test.ts` — migrating the four existing generic-commands tests and the `(#742)` nested-describe tests onto the new `tokensOf` helper; declined as optional consistency work beyond this change's reach.
  Reversed during implementation — see the TDD stage entry below.
- `test/handlers/gates/bash-path-extractor.test.ts` — its `command substitution` and `pattern-first command` describe blocks are unquoted-only; adding quoted siblings is a trivial later addition, not preparatory work.

## Stage: Implementation — TDD (2026-09-19T22:17:09Z)

### Session summary

Executed all five TDD steps from the plan: the `tokensOf` Tidy-First prep, the pattern-first walker fix, the generic walker fix, the end-to-end `externalAccesses` pin, and the roadmap/module-entry doc update.
Test count went 4511 → 4523 (+12) in `pi-permission-system`; all deterministic gates green from the repo root (`check`, `lint` with 0 `lint/` findings, `test`, `fallow dead-code`).
The post-implementation corpus re-measurement reproduced the plan's predicted figures exactly: 13 commands gain an `external_directory` candidate, 14 gain a `path` candidate, 15 and 20 tokens respectively, 0 lost on either surface.

### Observations

- **The Tidy-First step could not land as planned, for a lint reason the plan did not foresee.**
  Step 1 was specified as "add the helper, change no existing test bodies".
  Biome's `noUnusedVariables` warns on a function with no call site, and this repo treats a new `lint/` warning as a regression even though it exits 0.
  So the step also migrated the block's **seven** pre-existing tests onto the helper — the assessor's *Optional* item, promoted to Recommended by the gate.
  Generalizable: a pure-addition tidying of a *private* helper is not actually pure addition under an unused-symbol lint; its first consumer has to land in the same commit.
- **Both killing mutations behaved exactly as the plan predicted, including the counts.**
  Deleting the pattern-first call reddened 7 tests (6 token-list cases + the attribution case) and left the single-quoted control green; re-stamping the hosted tokens with the enclosing `effect` reddened exactly 1 (the attribution case) and left the 6 token-list cases green.
  Deleting the generic call reddened exactly 2, with step 2's cases still green — which is the evidence that splitting the two walkers into separate commits was worth it.
- **The single-quoted control is a pin with no one-line killing mutation.**
  `grep -e '$(cat /etc/shadow)' f.txt` stayed green through Red and through both mutations, because it pins a `tree-sitter-bash` property (no substitution node under a `raw_string`) rather than a branch of the new code.
  Only a different *implementation strategy* — searching the argument's text instead of its executions — would light it up.
  Verified it is not vacuous by falsifying its own expectation (adding `/etc/shadow` to the expected array) and confirming it reddens, then reverting.
- **The end-to-end pins map one-to-one onto the walkers.**
  Rather than accept "revert either call" from the plan, each call site was mutated separately: the `sed -e` case reddens only for the pattern-first call and the `echo` case only for the generic one.
- **A count in a commit body was authored rather than counted, and the reviewer caught it.**
  The step 1 commit body said "eight existing tests"; the real number is seven (3 top-level + 4 in the `(#742)` nested describe).
  Reworded via a scripted `git rebase` before ship, with the tree verified byte-identical against a backup tag.
  This is AGENTS.md's "a number a command can produce is never authored" firing inside a commit message, which is a place the rule is easy to forget.
- **Pre-completion reviewer: WARN** — one non-blocking finding, that this retro still described the `tokensOf` migration as declined while the implementation had reversed it.
  Addressed by this entry and the cross-reference added to the Deferred tidyings list.
  The reviewer independently re-derived the walkers' control flow for every `ARG_NODE_TYPES` branch (no drop, no double-count), opened the tests behind each claimed invariant rather than trusting the plan's table, and verified the "order is presentational" claim at `bash-path-resolver.ts`.

[#741]: https://github.com/gotgenes/pi-packages/issues/741
[#742]: https://github.com/gotgenes/pi-packages/issues/742
[#859]: https://github.com/gotgenes/pi-packages/issues/859
[#863]: https://github.com/gotgenes/pi-packages/issues/863
