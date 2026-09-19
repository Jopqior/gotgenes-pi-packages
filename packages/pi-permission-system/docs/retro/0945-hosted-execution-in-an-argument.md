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
- `test/handlers/gates/bash-path-extractor.test.ts` — its `command substitution` and `pattern-first command` describe blocks are unquoted-only; adding quoted siblings is a trivial later addition, not preparatory work.

[#741]: https://github.com/gotgenes/pi-packages/issues/741
[#742]: https://github.com/gotgenes/pi-packages/issues/742
[#859]: https://github.com/gotgenes/pi-packages/issues/859
[#863]: https://github.com/gotgenes/pi-packages/issues/863
