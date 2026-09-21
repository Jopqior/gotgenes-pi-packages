---
issue: 960
issue_title: "Reject stray control characters in tracked files before they reach a commit"
---

# Retro: #960 — Reject stray control characters in tracked files before they reach a commit

## Stage: Planning (2026-09-20T22:29:19Z)

### Session summary

Planned a repo-level gate that rejects stray invisible characters in tracked text files, wired into `prek`, `pnpm run lint` (hence CI), `lint:fix`, and the `pi-autoformat` chain.
Both decisions the issue flagged as open dissolved under measurement, and a corpus sweep of all 1764 session transcripts corrected the issue's central attribution: the corruption is model-side, not an `Edit` tool defect.
The plan landed as `docs/plans/0960-reject-stray-invisible-characters.md` with no preparatory refactoring, per the Tidy-First assessor.

### Observations

- **Both of the issue's stated decisions were non-decisions.**
  Exit-status inversion needs no wrapper (a Node script's `process.exitCode` is natural, and prek even ships a builtin `deny-pattern` hook that handles it); `grep -P` portability is moot once the check is Node.
  The issue's third suggestion — configure Biome's `noIrregularWhitespace` for comments — is measurably impossible: `NoIrregularWhitespaceOptions` in the Biome 2.5.11 schema is `{"type": "object", "additionalProperties": false}`, zero options.
- **Biome's blind spot is wider than [#863] recorded.**
  A probe run confirmed a form feed is clean inside a `/** */` comment *and* inside a string literal, not just in comments.
- **prek's builtin `deny-pattern` was the cheapest option and lost anyway.**
  It works (verified in a scratch repo, hex-escape character class and all) and would have been ~4 lines of config, honoring the "mechanism is forever; docs are reversible" principle.
  It was rejected because it only runs at the pre-commit stage — CI does not run prek, and this repo has 15 open third-party PRs whose commits never see a local hook.
  Wiring prek into CI was offered as a third option and declined.
- **The corpus sweep overturned an argument I had already given the operator.**
  I claimed the `erence2`→em-dash signature's only evidence was retro prose, since the corrupt blob was fixup-rebased out of git.
  That was wrong: 122 decoded U+000C occurrences survive in session transcripts, and the mapping is mechanically verifiable by diffing a transcript context against the repaired file.
  Disclosed and re-asked rather than left standing.
- **The field-path breakdown is the plan's most load-bearing measurement.**
  62 of the 122 occurrences sit in `message.content[].text` — plain assistant prose, no tool involved — and the same corrupted string appears in `text` and `arguments.edits[].newText` in one turn.
  So the em-dash is never encoded and then damaged; `Edit` is a faithful courier.
  The retro's "the `Edit` tool mangling an em-dash" framing is wrong, and step 7 corrects it in two skills.
- **A signature-based check would have missed 42%.**
  Residues: `erence2` 65, `erence6` 4, and 51 with no signature (43 bare, 8 followed by an ordinary word).
  That is why the design matches the character, not the visible text — and it retroactively justifies the retro's warning that grepping the residue passes on a corrupt file.
- **Three repair classes, not two.**
  U+200C/U+200D/U+2060 are detected but deliberately *not* repairable: ZWJ is load-bearing in emoji sequences and ZWNJ is semantically required in Persian and Indic scripts, so deletion is not universally correct.
  Only U+200B and U+FEFF are deleted by `--fix`.
  This came from checking U+200D's tree-wide count before writing the repair set, not from the original design.
- **The classifier is a code-point `Set`, not a regex literal.**
  Biome's `noControlCharactersInRegex` is in the `recommended` preset and rejects `/[\x00-\x08…]/` with one error per escape — measured.
  Building the set programmatically avoids both a lint suppression and any literal control character in the source.
- **Scope decisions.**
  U+00A0 stays legal (2 sites in `packages/pi-autoformat/docs/configuration.md:312`, both after `e.g.`, reading as deliberate typography).
  CR is excluded — `mixed-line-ending` is a separate prek builtin, not enabled here.
  Auto-restoration of `\x0cerence2`→`—` was offered three ways and settled on print-the-suggestion-but-never-apply.
- **The plan file failed its own gate on the first draft.**
  It carried two U+200B, copied verbatim from the corrupted files while quoting them as examples.
  Caught by running the candidate scan over the draft before committing.
  A document introducing this gate cannot quote the defect literally; the plan now says so, and the same constraint governs the test fixtures (escapes only).
- **Measured baselines recorded for `/tdd-plan`:** 2003 tracked files scanned in 0.43 s (exit 0); `pnpm run lint` 29.0 s, predicted ~29.4 s; root suite 8 files / 130 tests; 5 tracked binary files, of which `packages/pi-subagents/media/demo.mp4` contains `0x0c` and is the case `isBinary` exists to exclude.

#### Deferred tidyings

- `scripts/permission-config/tripwire-rules.mjs`, `scripts/agent-docs/always-loaded.mjs`, `scripts/agent-docs/doc-growth.mjs`, `scripts/agent-docs/model-usage.mjs` — four identical `parseArgs(argv)` pairwise-loop definitions.
  The new script's grammar (a boolean `--fix` plus positional paths) cannot reuse the `--name value` shape, so extracting now would build an abstraction for one caller.
  Trigger for extraction is a fifth script needing the pairwise shape.
- `test/roadmap/roadmap-check.test.mjs`, `test/agent-docs/model-usage.test.mjs` — duplicated `mkdtempSync`/`rmSync` `beforeEach`/`afterEach` workspace fixtures.
  Would have become a third copy; the design sidesteps it by injecting `readFile` into `scanFiles` instead, following `measure(sha, run)`.

## Stage: Implementation — TDD (2026-09-21T02:59:49Z)

### Session summary

All seven TDD steps landed in seven commits, adding `scripts/lint/invisible-characters.mjs` and its test, wiring the gate into `prek.toml`, `pnpm run lint`, `lint:fix`, and the `pi-autoformat` chain, repairing the two live U+200B sites, and refreshing four docs.
The root suite went from 8 files / 130 tests to 9 files / 178 tests (+48).
The pre-completion reviewer returned PASS.

### Observations

- **Three deviations from the plan, all disclosed in commit bodies.**
  Step 3 was planned as `repairInvisibleCharacters` plus "the CLI's `--fix` branch", but the step's own killing mutation (`--fix` exiting 0 whenever it repaired something) needed a test, and root `test/` has no CLI-spawn harness by convention.
  Extracted `run()` and `repairFiles()` so the composition and exit semantics are testable, leaving the CLI body a four-line shell; the reviewer judged the decomposition sound on ISP grounds.
  Step 4 was retyped from the plan's `fix:` to `docs:` — the files are internal plan and retro documents, so nothing user-observable changes and `fix:` would have put "remove stray zero-width spaces" in a package changelog.
  Step 2 required updating step 1's `toEqual` expectations to carry the new `suggestion` field, which the plan had anticipated as a consequence of adding a field to a produced object.
- **Two mutations killed far more tests than the plan predicted, for a structural reason.**
  Making the form feed repairable reddened 10 tests against a predicted 1, and returning a suggestion unconditionally reddened 15 against a predicted 1.
  Both because `REPAIRABLE` and the suggestion's null path are shared with the classifier rather than local to the repair.
  Treated as a pass, since the rule is that *fewer* reds than predicted is the finding.
  The plan would have been more accurate had it noted which sets the classifier and the repair share.
- **Step 5's verification was the most valuable one in the plan.**
  Planting a form feed in a staged file showed the hook rejecting it, `pnpm run lint` exiting 1, and `git commit` blocked; removing the hook entry let the same byte reach a commit, reproducing #863's failure exactly.
  That is a falsifying test of the gate rather than a happy path, and it also turned up a fact the plan did not have: `types = ["text"]` covers `.mjs` and `.toml`, which the existing `biome` hook's `types_or` does not, so `.mjs` files were previously outside the pre-commit formatter entirely.
- **Step 6's mutation could not be run as written and was simulated instead.**
  The plan already warned that the running Pi loaded `pi-autoformat`'s config at session start, so a live turn cannot exercise the chain change.
  Ran the `.md` chain's commands in order instead, with and without the entry: `rumdl fmt` alone leaves a planted U+200B intact, and the entry prepended removes it.
  That measures the claim without needing a restart.
- **A three-way class split replaced the plan's two-way one during planning and paid off under review.**
  U+200C/U+200D/U+2060 are detected but never repaired.
  The reviewer verified this against a real family emoji ZWJ sequence: both joiners are reported, `--fix` leaves the byte sequence unchanged, and the command still exits 1.
- **The `pi-subagents` release probe reports a pending `v21.7.3`, and it is not this issue's doing.**
  `next-version.sh` compares `git-cliff`'s bumped version against the globally highest tag, and this worktree is 9 commits behind `origin/main`, which already carries `v21.7.4`.
  Confirmed by running the probe in a scratch worktree at the plan commit, before any implementation step: it printed the same `pi-subagents-v21.7.3`.
  `/sync-worktree` resolves it; the plan's "no package release is triggered" claim holds for this change.
- **Filed [#964]** — the gate inspects file contents and never the path string, so an invisible character in a *filename* is undetected.
  Surfaced by the reviewer, which probed start-of-file, end-of-file without a trailing newline, CRLF, a single-character file, an empty file, and a symlink, all of which are caught.
  Not #960's symptom, which is corrupt content, so it was filed rather than folded in.
  Measured 0 of 2007 tracked paths carry a non-ASCII or control character today, and `prek` ships a builtin `deny-filename-pattern` that may cover the pre-commit half as pure config.
  `roadmap-fit` exited at its first step: `scope:repo` with no resolvable package, so there is no open phase to disposition against.
- **Reviewer warnings:** one WARN, on evidence provenance.
  The suggestion table's corpus counts (122 form feeds across 1764 transcripts; 65 `erence2`, 4 `erence6`, 51 with no residue) could not be independently re-derived cheaply, and the reviewer named both reasons precisely: a JSON transcript stores a raw form feed as the two-character escape `\f` rather than `\u000c`, so a naive scan under-counts, and the sessions written while working #960 discuss the literal strings `erence2`/`erence6` in prose, which over-counts in the other direction.
  Both effects are real — the first is a bug I hit and fixed mid-sweep during planning.
  The counts stand as reported from one organic sweep, not as verified, and the table only ever prints a suggestion.
- **Re-derived numbers.**
  The reviewer confirmed the suite delta (8/130 → 9/178) by running the baseline in a scratch worktree, and the 3-bytes-per-file doc repair by `wc -c`.
  Its lint wall-clock differed in absolute terms (32.9 s → 34.4 s against my 27.0 s → 28.2 s) but the delta matched at ~1.2–1.5 s, so the machine differs and the scan cost does not.

[#964]: https://github.com/gotgenes/pi-packages/issues/964

## Stage: Sync (worktree) (2026-09-21T15:45:09Z)

### Session summary

Pre-push checks pass clean (`pnpm run lint`, `pnpm fallow dead-code`), so the branch is ready to hand off to the root.
The plan's marker is `**Release:** ship independently`, but no `packages/*/src/` file changed in this issue, so no package release is actually triggered (confirm this at land time rather than dispatching one reflexively).

**Peer session transcript:** `/Users/chris/.pi/agent/sessions/--Users-chris-development-pi-pi-packages-worktrees-issue-960--/2026-09-20T20-59-12-591Z_01a0c09d-a74e-7657-a7e6-b1c9a33d93ee.jsonl` (read with `read_session_file({ path: "<path>" })` for message-level verification at land/retro time).

### Observations

- The TDD stage note already flagged that `next-version.sh pi-subagents` reports a pending `v21.7.3` purely because this worktree sat 9 commits behind `origin/main` (which carries `v21.7.4`), verified as pre-existing and not caused by this issue.
  Step 4's `git fetch` + `git rebase main` below should resolve that gap; recheck the probe once rebased if it matters at ship time.
- Filed [#964] during TDD (the gate does not inspect filenames) with no open package phase to disposition against, and nothing further needed at land time beyond what `/ship`'s normal close-comment flow does.
- No conflicts anticipated: every file this branch touches is new or a small targeted edit (two doc repairs of 3 bytes each, four doc/skill sections, `prek.toml`, `package.json`, one new script pair), none of it in a hot path another peer is likely to be touching concurrently.
