---
issue: 938
issue_title: "Turn the three recurring shell tripwires into pi-permission-system deny rules with reasons"
---

# Retro: #938 — Turn the three recurring shell tripwires into pi-permission-system deny rules with reasons

## Stage: Planning (2026-09-17T22:15:10Z)

### Session summary

Measured every candidate deny pattern against the real command corpus — 7,578 unique bash commands from the local permission review log — using the package's own `BashProgram.parse` and `compileWildcardPattern` rather than reasoning about the wildcard grammar.
The measurement reshaped the change: only one of the issue's three named tripwires is expressible, a fourth rule the issue used as a throwaway illustration measures perfectly clean, and three of the issue's four proposed pattern spellings match nothing at all.
Wrote `docs/plans/0938-shell-tripwire-deny-rules.md` for two deny rules plus a repo-root validator, filed [#941] for the enumeration fact the second rule rests on, and recorded its Phase 15 disposition.

### Observations

**The spike was the whole planning session.**
Three of the issue's four proposed patterns are wrong as written, and none of that is visible from the schema or the docs.
`git rev-parse * | wc -c` matches 0 commands because a bash rule matches one command *unit* and a pipeline enumerates into several.
`git commit -F -*` matches 0 because a heredoc absorbs the `-` operand, so the unit text is exactly `git commit -F` — which, spelled that way, is a perfect discriminator: 14 true positives, 0 false positives against 85 corpus uses of the legitimate `git commit -F <file>` form.
Reading `bash-command.ts` gave the first fact; only running the parser gave the second.

**A three-part admission test fell out of the measurement** and is written into the plan's Design Overview: expressible (single command unit), clean (near-zero measured false positives), escapable (the reason names a correct spelling the pattern does not match).
`wc -c*` fails two of the three — 14 legitimate byte counts against 4 tripwire hits, and no escape on the `bash` surface.
The unquoted-glob rule fails the first outright: the matcher compiles to an anchored regex with no negation, so `--include=*.ts` and `--include='*.ts'` are indistinguishable.

**A deny-then-`allow` carve-out was considered and rejected as a bypass**, not as inelegant.
`*--include=*` deny followed by `*--include='*` allow is expressible, but `sudo grep --include='*.ts' …` is one unit matching both `sudo *` (ask) and the carve-out (allow), and last-match-wins hands it `allow`.
Worth remembering the shape: under last-match-wins, an `allow` written to carve an exception out of a lint-style deny is a hole in every *other* rule that matches the same unit.

**Operator decisions:** admit only the two clean rules; compress the `AGENTS.md` prose to a one-line pointer rather than deleting it (the deny only fires in a trusted project with the extension loaded, so the prose is the copy that survives); record the negative result in the plan and the close comment rather than annotating the dated audit snapshot.

**The measured word saving is −38 of 8,083 (−0.47%)** and the plan says so plainly.
The parent issue [#934] was about size, so it would be easy to oversell this; the value is enforcement, not words.

**Two `AGENTS.md`-adjacent facts worth carrying forward.**
`reasonClause` appends its own full stop, so a config `reason` ending in a period renders `..` — the operator's existing `find / *` reason already gets this right.
And config is re-read every turn from the policy files' mtimes, so the rules go live for the session that writes them, mid-session.

**Tidy-First:** the assessor returned *no preparatory refactoring warranted* (both new files are greenfield, the `AGENTS.md` edit is a flat prose trim), but it caught a real design error — every existing root test imports a pure function from `scripts/` and performs zero filesystem reads, and the design as summarized would have been the first to break that.
The plan now specifies a `scripts/permission-config/` + `test/permission-config/` pair.
That is the second time this assessor has paid for itself through a contradiction rather than a recommendation.

**Follow-up filed:** [#941] — a heredoc absorbs the command's `-` operand, an enumeration fact nothing asserts and the `git commit -F` rule now depends on.
Recorded as out of scope for pi-permission-system Phase 15 (operator decision): it is a test-only pin over `command-enumeration.ts`'s output, not the phase's token-role cause.

#### Deferred tidyings

None — the Tidy-First assessor rejected only two candidates as scope creep, and both were "do not restructure `AGENTS.md` beyond the two named passages" and "do not build schema-driven validation instead of hand-asserting the limits", neither of which is latent debt in a file.

## Stage: Implementation — TDD (2026-09-17T22:52:49Z)

### Session summary

Four TDD cycles: the pure validator and its fixtures, the config file plus the integration case over the real file, the `AGENTS.md` compression, and a fourth cycle added after the pre-completion review closed a gap where the validator was looser than the schema it backstops.
Root test suite went 107 → 130 tests; nothing under `packages/` changed, so no package version is cut.
Every predicted killing mutation landed its predicted red count (8/3/2/4 in cycle 1, 1/1/1 in cycle 2, 1/1/2/1 in cycle 4).

### Observations

**The plan's measurements reproduced exactly.**
Re-running the corpus spike against the committed patterns gave `rg -r*` → 9, `git commit -F` → 14, `git commit -F *` → 85, `git rev-parse * | wc -c` → 0 over the same 7,578 commands.
The live check was the better evidence though: `rg -rn 'x' /dev/null` came back denied, naming `rule 'rg -r*'`, carrying the full reason, with exactly one terminating full stop — and `rg --replace 'GAMMA' 'alpha' /tmp/rg938.txt` ran normally, so the escape hatch the reason names really is unmatched.
Config is re-read every turn, so the rule was live on the turn after the commit without a restart.

**The reviewer found a real hole, and it was in the guardrail rather than the feature.**
`findConfigProblems` reported no problems for `permission.bash: "alow"` — the realistic typo — and for `[]`, `null`, and a deny object with an unknown key, all four of which `unifiedConfigSchema` rejects.
A validator whose entire job is catching a typo before it floors the repo's policy `allow`→`ask` was looser than the schema on the most likely typo of all.
Cycle 4 closed it and the parity was then verified by parsing all six shapes through the real schema rather than reasoning about it.

**Two residual disagreements are known and accepted**, both pre-dating cycle 4 and both outside the properties the validator claims: an empty-string pattern key (`{"": "allow"}`) and `permission` itself typed as a non-object both pass the validator and fail the schema.
Neither is reachable from a plausible hand-edit of a two-rule file, and the Tidy-First disposition already recorded "do not build schema-driven validation" as rejected scope creep.
Also noted: `{"bash": undefined}` is flagged by the validator and accepted by the schema, which JSON cannot express, so `loadProjectPermissionConfig` can never produce it.

**One file outside the plan's table was touched**, under the plan's own step-3 instruction to grep the prompts and skills.
`.pi/prompts/audit-agent-docs.md` used the `rg -r` passage as a worked `delete` example with the rationale "no retro since 07-20", while the real 2026-09-17 inventory records that exact passage as `keep`, "recurred in 0914 with the rule loaded".
The example contradicted the audit it illustrates and the fact this issue opens with, so it was swapped for a real `delete` row from that audit.
The first review round flagged the missing rationale, which is now in the commit body.

**The package skill already documents the heredoc-absorption fact in prose** (`package-pi-permission-system` SKILL.md, the `floorUnparsedUnit` passage cites `git add`/`git commit -F` as the enumeration of a heredoc command).
That does not weaken [#941] — nothing *asserts* it — but it is worth knowing the fact was written down and still had no test.

**Pre-completion reviewer: WARN, then PASS on re-review.**
Round 1's two findings (the schema-looseness gap, and the missing commit-body rationale for the `audit-agent-docs.md` swap) were both fixed before round 2, which returned PASS with the two residuals above recorded as informational.

[#934]: https://github.com/gotgenes/pi-packages/issues/934
[#941]: https://github.com/gotgenes/pi-packages/issues/941
