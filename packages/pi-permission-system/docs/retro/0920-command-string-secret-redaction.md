---
issue: 920
issue_title: "Secret in a command string still reaches the review log; ADR 0010's reopen condition is met"
---

# Retro: #920 — Secret in a command string still reaches the review log; ADR 0010's reopen condition is met

## Stage: Planning (2026-09-15T04:20:53Z)

### Session summary

Verified the third-party report ([Radu0120]) against the shipped `src/logging/log-redaction.ts` and against a real 12 MB review log (16 524 records, 7 146 unique command strings), then planned a grammar-anchored masker that runs at `writeLine` ahead of the width cap.
The operator confirmed the direction, chose three binding forms (shell `variable_assignment`, `word`-shaped `env NAME=value`, and any argument of the form `<sensitive-name>: <value>`), and chose a best-effort failure posture over blanking the field on an unparseable command.
The plan is `packages/pi-permission-system/docs/plans/0920-command-string-secret-redaction.md`; follow-up [#923] was filed and dispositioned `out of scope for the roadmap` against Phase 15.

### Observations

- **The measurement that decided the design was regex-versus-node, not coverage.**
  A raw-string scan for a sensitively-named assignment matched 10 unique commands in the corpus and every one was a false positive — `key=lambda x: x[1]` and `keys=list(d.keys())` inside embedded Python, plus a `sed` pattern that was itself a redaction.
  The same rule anchored to a `variable_assignment` node matched 0.
  That single number is the whole argument for grammar anchoring, and it is also the reason inline-shell payloads and heredoc bodies are deferred: blanket recursion into string nodes re-admits exactly that class.
- **The report's suffix list is mostly already covered.**
  `token`, `secret`, `password`, and `credential` are already **substring** alternatives in the shipped pattern and so already wider than a suffix match.
  The only genuine widening is `key` with a name boundary.
  The plan keeps the shipped `api[-_]?key` / `private[-_]?key` alternatives anyway so the union is provably never narrower — a sweep over every `{prefix}{alternative}{suffix}` combination found 0 regressions, and `apikey` is the name that would have been lost otherwise.
- **A `/i` flag on the camel alternative would have silently masked `monkey`.**
  `[a-z0-9]Keys?` under `/i` matches `nkey`.
  The predicate is therefore split into a case-insensitive part and a case-sensitive camel part.
  My first corpus probe had this bug, so its false-positive counts are an upper bound rather than the final figure; the numbers in the plan are from a re-run with the corrected predicate.
- **A measured refinement arrived after the clarification gate and did not need a second one.**
  The operator chose the broad header rule (no `-H` anchor) on the stated premise that over-masking a log is safe.
  Measuring it afterwards found 5 hits, of which 2 were `grep "legalDirectionalKeys: readonly"`.
  An HTTP field name is hyphenated and never camelCase, so a one-clause guard drops those 2 and keeps all 3 genuine `Authorization:` hits — a refinement inside the chosen option, not a new decision.
- **Three independent producers write a `command` field**, which is what settles the placement at `writeLine`: `ToolPreviewFormatter.getPermissionLogContext`, `renderReviewLogFacts`'s `executedUnit`, and `recordGateError` on the fail-closed path, which borrows no gate context at all.
- **Stage ordering is a security property here.**
  Masking must run before `capLogFieldWidths`, or a 1000-character truncation cuts a secret in half and can make the tail unparseable; and unlike the cap it must apply to the debug stream too.
- **Disagreement with the Tidy-First assessor, recorded rather than resolved silently.**
  It rejected a recursive command-key walk as speculative generality, since all three producers write `command`/`executedUnit` at the top level.
  The plan takes recursion anyway: the writer's other two passes are both recursive, and an asymmetric third stage is what a later nested producer escapes unnoticed.
  Both of its **Recommended** tidyings were accepted as steps 1 and 2 — the `isSensitiveLogKey` → `isSensitiveName` rename, and extracting `writeLine`'s transform couplet into a named `prepareLogDetails`.
- **The boundary sentence lives in six places and one of them is deliberately left alone.**
  ADR 0010, `docs/configuration.md`, `docs/troubleshooting.md`, `README.md`'s non-goal, and the package SKILL all move together; `docs/migration/0746-review-log-fields.md` does not, because its sentence is a true statement about the release it documents.
- **ADR 0010 predicted its own reopen and the prediction held.**
  The alternative section names the exact condition ("should a report show a secret reaching the log through a command string"), which made triage a one-step verdict rather than a re-argument.
  It is worth noting that the ADR's *nominated remedy* was still wrong in a way only a real corpus exposed — the reporter's correction is the design contribution, and the plan's step 6 carries `Co-authored-by`.
- **The Windows half of the report answers itself.**
  Redaction does not depend on file modes, so after this lands Windows has one active remedy where the report correctly observed it had none.
  No new Windows mechanism is planned, and ADR 0010's reasoning against a per-session warning is unchanged.

#### Deferred tidyings

- `src/access-intent/bash/*.ts` — five modules hand-roll their own `for (i < childCount) child(i)` walk with different skip/collect rules; the assessor declined to unify them and the new masker's span-collecting walk is a sixth shape again.

## Stage: Implementation — TDD (2026-09-15T16:03:55Z)

### Session summary

Nine commits over the plan's seven steps plus two review fixes: two Tidy-First preparations, the predicate widening, the `TSNode.endIndex` addition, the masker module, the writer wiring, the doc sweep, a stale-doc correction, and a quote-balance correction.
The package suite went from 4191 to 4245 tests (+54).
The pre-completion reviewer returned WARN on the first pass with two non-blocking findings, both fixed, and PASS on the scoped delta re-review.

### Observations

- **The plan's mutation predictions held for seven of eight and the eighth was a real finding.**
  Every named killing mutation reddened exactly the equivalence class the plan said it would — the assignment class (8 tests), the `word` class (1), the camel guard (1), the span direction (1), the `maskCommandFields` call (4), the ordering (1), the review-only gate (1).
  The exception was the cold-parser mutation: the plan said to make `getWarmBashParser()` returning `null` throw, and nothing reddened, because the function's outer `catch` returns the input too.
  The mutation preserved the observable behavior by design, so it was never a killing mutation for the stated claim.
  Replacing it with a **value** mutation (`return ""` instead of `return command`) reddened the cold-parser test, which is the pin that matters.
  This is the `AGENTS.md` rule about preferring a changed literal over restructured control flow, arriving from the other direction: restructuring can also produce *too few* reds.
- **The `catch` itself is unpinned, and that is a deliberate call.**
  No input makes the warmed parser throw — the reviewer independently tried lone surrogates, NUL bytes, 20 000-deep nesting, and a 6 MB command and could not reach it.
  It is defense in depth against a WASM-binding failure on a fail-closed path, where a raised mask costs the whole log line.
  The reviewer agreed.
- **`command-redaction.test.ts` was written and then implemented without an intervening Red run**, so its 27 cases all passed on their first execution.
  That is precisely the case the template calls out as mandatory for mutation testing, and the mutations are what supplied the missing evidence.
  Worth doing in the other order next time: the file's import would have failed loudly and cost nothing.
- **The reviewer found a real defect the whole corpus could not.**
  `openingQuoteOf` read the closing quote off the argument node's first character, which is wrong when the field name straddles a quote boundary (`-H Auth"orization: "$TOKEN`) — it left a dangling `"` in the logged line.
  Zero occurrences in 7146 real commands, so measurement was never going to surface it; deriving adversarial inputs from the stated invariant was.
  The fix reads the quote state at the colon instead, and gates backslash escaping to double-quoted regions, because bash does not honor `\` inside `'…'`.
- **`isPlainRecord` moved to `value-guards.ts` against the Tidy-First assessor's advice.**
  It rejected a recursive command-key walk as speculative generality; the walk went in anyway, because the writer's other two stages are both recursive and an asymmetric third one is what a later nested producer escapes.
  Sharing the predicate is the consequence: two stages of one pipeline disagreeing about which records to descend into would be a silent hole.
- **A pre-existing flake surfaced and was proven pre-existing rather than assumed.**
  `composition-root.test.ts`'s forwarding-liveness test times out at Vitest's default 5 s under the root parallel run — it waits out the ~2 s serving grace window on real timers.
  Checking out the pre-implementation commit and re-running the same root command reproduced it, which is what made it safe to file ([#925]) rather than chase.
  The first baseline run of the session had passed, which is exactly how a flake hides.
- **Two commits correct code that never shipped**, and both are typed by what a user observes once the batch lands: the quote fix is `refactor:` because the masker it corrects is introduced three commits earlier in the same unpushed batch.
  Only the two `fix:` subjects reach the changelog, and both name an outcome rather than a seam.

Pre-completion reviewer: WARN on the first pass (stale `permissionReviewLog` knob row; the quote-balance defect), then PASS on the delta re-review after both were fixed.

[Radu0120]: https://github.com/Radu0120
[#923]: https://github.com/gotgenes/pi-packages/issues/923
[#925]: https://github.com/gotgenes/pi-packages/issues/925
