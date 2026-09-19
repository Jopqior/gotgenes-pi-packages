---
issue: 923
issue_title: "pi-permission-system: a secret inside an inline-shell payload or heredoc body escapes command redaction"
---

# Retro: #923 — a secret inside an inline-shell payload or heredoc body escapes command redaction

## Stage: Planning (2026-09-19T08:03:18Z)

### Session summary

Planned the inline-shell payload half of [#923] and **declined** the heredoc half on a measurement, against the author's 13 MB review log (17 981 records, 8 056 unique command values).
The plan is `docs/plans/0923-inline-shell-payload-secret-redaction.md`: six steps, one of them the Tidy-First assessor's `commandWordNodes` extraction, with the observable `fix:` landing at step 4.
A second defect surfaced from the operator's `xargs` question and was filed as [#951] with a Phase 15 disposition of its own.

### Observations

- **The heredoc decision was settled by measurement, not by argument.**
  Applying the three shipped rules to every heredoc body in the corpus produced 6 matches across 915 non-interpolating (`<<'EOF'`) bodies and 0 across the 3 interpolating ones.
  All 6 were false positives, and 3 of them were `key=lambda` / `key=len` inside embedded Python — the exact class ADR 0010 measured at 10-versus-0 when it chose grammar anchoring over a raw-string scan.
  The cost was also measured: every-heredoc-body is 0.123 ms/command against a 0.050 ms baseline, versus 0.061 ms for payloads alone.
  Declined as an **accepted residual** in ADR 0010 rather than a tracked follow-up: an open issue would imply the decision is provisional when the measurement says it is not.
- **`cat > .env <<'EOF'` is the more realistic leak and it stays open.**
  The issue's own example uses the bare `<<EOF` (interpolating) form, but a literal `.env` is more naturally written with a quoted delimiter.
  Interpolation turned out to be the wrong axis entirely — it separates "the shell expands `$VAR`" from "it does not", and `nested-execution.ts` uses it for an execution question, not a data question.
  That is why the option set offered "every heredoc body" as its own choice rather than folding it into the interpolating one.
- **The payload set being the *shell* set is the load-bearing safety property.**
  `python3`, `node`, and `perl` are absent from `SHELL_WRAPPER_NAMES`, which is the only reason `command-redaction.test.ts:140`'s embedded-Python control stays green under the widening.
  Nothing pins that today, so the plan adds a `bash -c 'python3 -c "…key=lambda…"'` nesting-boundary case and names it as a risk about a mechanism being **absent**.
- **The prototype found a defect the corpus could not.**
  A first prototype run swallowed the closing quote on `bash -c 'curl -H "Authorization: Bearer sk-z" …'`, because it applied a bare placeholder instead of the span's own `replacement`.
  Zero real occurrences, so the 8 056-command differential would never have surfaced it — it is now step 4's killing mutation (e).
  This is the same shape as [#920]'s reviewer finding on `openingQuoteOf`: quote balance is a property that has to be derived adversarially, not measured.
- **The measured verdict on the widening is 0 changed commands.**
  0 of 8 056 unique real commands log differently under a prototype of the design, and the payload rule has 0 true positives in the corpus too.
  The change is a consistency fix plus forward protection, and the plan says so rather than implying a leak was found.
- **The Tidy-First assessor corrected the design's shape.**
  It rejected threading an `offset` parameter through `collectMaskSpans` and its three rule helpers in favor of shifting the returned span batch once at the recursion boundary — same result, no signature change to four currently-correct functions.
  Adopted.
  Its one **Recommended** tidying (extract `commandWordNodes` from `readCommandWords`) is step 2.
  Its line-number estimates were off by 20–35 lines; re-grepped before the plan recorded them.
- **A near-miss on naming.**
  The assessor proposed `commandArgumentNodes`, but `token-collection.ts:255` already has `commandArgumentWords` with a **different** filter, and `architecture.md:1064` records that those two walks differing is a finding rather than an accident.
  Renamed to `commandWordNodes` to pair with `CommandWord` / `readCommandWords`.
- **The operator's aside about `xargs` was a real second defect.**
  `xargs ls` is already exempt under [#803]; what actually prompts is a `/dev/null` redirect anywhere in the statement, because `redirectMayWriteFile` proves a write for any non-descriptor destination and `/dev/null` is a `word`.
  The package already holds the fact (`src/path/safe-system-paths.ts:6`) and `redirect-analysis.ts` never consults it.
  Filed as [#951], dispositioned out of scope for Phase 15, with the [#609] interaction recorded (that step makes a bare creating redirect reach `path_write`, which would newly project `> /dev/null`).

#### Deferred tidyings

- `src/access-intent/bash/{program,sync-commands,unresolved-salvage,command-redaction}.ts` — four sites repeat the same parse-a-fragment-then-`delete()`-the-tree idiom with no abstraction over it; the assessor declined to unify them and step 4 makes it a fifth occurrence inside a recursion.

[#609]: https://github.com/gotgenes/pi-packages/issues/609
[#803]: https://github.com/gotgenes/pi-packages/issues/803
[#920]: https://github.com/gotgenes/pi-packages/issues/920
[#923]: https://github.com/gotgenes/pi-packages/issues/923
[#951]: https://github.com/gotgenes/pi-packages/issues/951
