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
