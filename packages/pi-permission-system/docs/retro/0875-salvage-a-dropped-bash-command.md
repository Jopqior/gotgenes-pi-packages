---
issue: 875
issue_title: "pi-permission-system: a partial bash parse can drop a command unit, so an explicit deny never fires"
---

# Retro: #875 — pi-permission-system: a partial bash parse can drop a command unit, so an explicit deny never fires

## Stage: Planning (2026-09-15T18:50:21Z)

### Session summary

Traced the defect against the real `tree-sitter-bash` parse and the real `BashProgram` / `resolveBashCommandCheck` pipeline, measured it over 6911 intact bash commands from the local review log, and found a **fourth** remedy neither the issue nor ADR 0013's 2026-09-04 amendment lists: re-parse the smallest unresolved node's own text standalone and accept the result only when that re-parse is clean.
The operator chose it at the clarification gate, with scope covering both the command units and the path slices.
Committed the plan at `packages/pi-permission-system/docs/plans/0875-salvage-a-dropped-bash-command.md`.

### Observations

- **The issue understates the defect, and so does the triage.**
  The dropped region's *path operands* reach neither `path` nor `external_directory` either — measured: `cat <<'MSG' 2>&1 | cat /etc/shadow` yields `externalAccesses() === []` and `pathRuleCandidates() === []`.
  That is a violation of `docs/decisions/0009-bash-path-projection-completeness-contract.md`, whose "What the projection deliberately omits" list covers no such case, so ADR 0009 needs an amendment alongside ADR 0013's.
- **The three candidate directions the issue and ADR 0013 both enumerate were each refuted or discounted on measured facts.**
  The heredoc pre-pass in particular: eliding only the heredoc *body* does not help, because `<<TAG` + `2>&1` + `|` is what defeats the grammar — `<<'MSG' | rm -rf /tmp/x` parses clean and `<<'MSG' 2>&1 | rm -rf /tmp/x` does not.
  A record's enumeration of remedies is a snapshot of what its author considered, not a closed set.
- **The clean-re-parse guard is measurable in the absent direction**, which is what the Risks section needed.
  Dropping it makes `cat <> rw.txt` emit a command unit whose text is `">"`, and `cat $(( > out.txt` emit a duplicate `cat` plus `"$(("`.
  Probed by running both variants over the corpus and every malformed shape rather than arguing the guard's value.
- **Rejected: resolving a salvaged region against a known effective base.**
  For `cd /outside && cat <<'M' 2>&1 | cat rel.txt` the candidate is the `file_redirect`, and the `cd` state in force there is not recoverable from the fragment.
  A known base would resolve `rel.txt` to the wrong file and could match an `allow` rule for it — a fail-open.
  Salvaged roots walk under `UNKNOWN_BASE`, matching [#393]'s conservatism; the residual (a relative token in a salvaged region stays unprojected) is recorded in ADR 0009 rather than filed.
- **`src/handlers/gates/bash-command.ts` needs no change**, which is the shape of the fix worth remembering: [#840] built the floor to read one field on `BashCommand`, so restoring enumeration is entirely upstream of the verdict fold.
- **`#875` was deferred twice by the roadmap sweep** (Phase 14 and Phase 15) as "an enumeration residual with no verdict-fold lever".
  That rationale was correct about the verdict fold and wrong about the absence of a lever — the lever is in enumeration, one layer up.
  The plan's doc list amends the Phase 15 disposition the way [#899]'s was amended when it was pulled forward.
- No follow-up issues filed: every deferral is either an operator decision from the gate or an accepted residual written into ADR 0009.
  The `roadmap-fit` skill was therefore not exercised.

#### Deferred tidyings

- `packages/pi-permission-system/test/access-intent/bash/program.test.ts` — 2093 lines, third-largest test file in the package; the Tidy-First assessor declined a split as scope creep, since the salvage cases fit the file's existing per-issue `describe` convention.

[#393]: https://github.com/gotgenes/pi-packages/issues/393
[#840]: https://github.com/gotgenes/pi-packages/issues/840
[#899]: https://github.com/gotgenes/pi-packages/issues/899
