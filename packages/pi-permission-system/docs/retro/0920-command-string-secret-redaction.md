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

[Radu0120]: https://github.com/Radu0120
[#923]: https://github.com/gotgenes/pi-packages/issues/923
