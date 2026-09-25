---
issue: 977
issue_title: "pi-permission-system: an argument after a redirect escapes the command it belongs to, bypassing bash deny rules"
---

# Retro: #977 — pi-permission-system: an argument after a redirect escapes the command it belongs to, bypassing bash deny rules

## Stage: Planning (2026-09-25T19:02:07Z)

### Session summary

Planned #977 as a parser-boundary correction: `getParser()` returns a `TSNode` view in which the words `tree-sitter-bash` 0.25.1 hangs on a statement-level `file_redirect` are handed back to their command, in the shape the grammar already produces for a leading redirect.
The eight-step plan (`docs/plans/0977-redirect-arguments-reattached.md`) also makes the enumerator exclude hosted redirects from unit text and words.
It filed #979 (a heredoc's tail) and dispositioned it into Phase 15 directly after #977.

### Observations

- The operator chose the parser-boundary view over a per-walker helper (about five `redirected_statement` branches).
  The deciding fact was a fourth consumer the issue did not name: the log masker writes `bash 2>/dev/null -c 'TOKEN=…'` unmasked.
- **Planning found a bypass with no misparse.**
  A redirect inside the `command` node (`2>/dev/null git push --force`, `git <<< x push --force`) lands in the unit text and the word list, because `commandWordNodes` skips only `variable_assignment`.
  `>/dev/null bash -c 'rm -rf /tmp/x'` resolves `allow` where the bare form asks (measured through the real `resolveBashCommandCheck`).
  The corrected shape puts redirects inside commands, so this fix is required, not optional.
- Fixing the head word would have *granted* a core-reader exemption to `>/tmp/o xargs grep foo`, so the plan scopes a hosted write through the same predicate `redirectedScope` uses.
- The grammar groups `cd a && git 2>/dev/null push --force` as a `redirected_statement` with a `list` body, so the correction descends a list spine to the rightmost command.
  That narrows the deliberate over-attribution for the list's earlier units; the plan documents this as the one precision gain relative to the uncorrected spelling.
- Erroring statements are never rewritten.
  Without that guard, `cat <> rw.txt`'s destination would become `cat`'s operand with a core read proof, regressing #814.
- **Measured over 8804 intact review-log commands:** 4 statements carry trailing words (all `command` bodies), and 0 hold a hosted or close-operator redirect.
  The step-7 corpus diff predicts exactly those 4 commands change.
- Upstream: tree-sitter/tree-sitter-bash#233 is closed but unfixed; PRs #331 and #333 are both open; 0.25.1 is the latest release.
- **Heredoc tail, filed as #979.**
  `cat <<EOF | rm -rf /tmp/x` enumerates as `cat`, and `cat <<EOF > /tmp/o` projects no path.
  In real traffic, 1 command hides a command and 5 writes go unprojected.
- Tidy-First assessor recommended the roadmap-assigned `COMMAND_PREFIX_TYPES` export (step 1); its count of three re-spellings matched my earlier grep.
  I declined its optional `makeTSNode` extension: the correction's tests use real grammar parses via the new `getGrammarParser` (step 2), which also keeps the raw-shape tests discriminating after step 7 wires the correction in.
- `scripts/roadmap-check.mjs` reports pre-existing errors: #977 and #978 have no Impact/Risk/Priority line, and #945's published priority is wrong.
  I gave #979 its own line and left the others to their steps.

#### Deferred tidyings

- `src/access-intent/bash/command-enumeration.ts`: splitting `commandUnitText` ahead of the change was rejected; the change replaces it wholesale.
- The five target files' long doc comments: a `/plan-improvements` concern, not this change's.

## Stage: Implementation — TDD (2026-09-25T19:46:19Z)

### Session summary

All eight planned steps landed, plus one unplanned `refactor:` step (extracting `parse-health.ts`), as nine commits.
`getParser` now hands out trees with each word the grammar hung on a redirect moved into its command, and the enumerator leaves a redirect hosted anywhere in a command out of the unit.
The `pi-permission-system` suite went from 4648 to 4743 tests (+95), and every named killing mutation turned its predicted tests red.

### Observations

- **Import cycle (unplanned step).**
  Wiring the correction into `parser.ts` made `parser.ts` → `redirect-arguments.ts` → `redirect-analysis.ts` → `parser.ts` a cycle, which `fallow dead-code` rejects.
  The operator chose to extract `parseUnresolvedAt`/`parseUnresolvedWithin` into `parse-health.ts` rather than split `redirect-analysis.ts`.
  The correction now asks `parseUnresolvedWithin` instead of reading `hasError` itself.
  The plan's import graph was never checked against the new edge; a `fallow guard`-style check of "does the module I am wiring in import back into me?"
  would have caught it at planning.
- **Pipeline body (plan gap).**
  The grammar hangs a redirect on a pipeline's last stage off the whole pipeline (`rg -l x | xargs ls -1t 2>&1 ~/x` parses as `redirected_statement(pipeline, file_redirect)`), so the correction also descends `pipeline`.
  The plan's census checked body types only in real traffic (4 `command` bodies), and its own step-7 exemption test surfaced the gap.
- **Predicted change, unlisted test.**
  `cat <<< $(rm x)` was pinned as the unit `cat <<< $(rm x)`; the trailing hosted herestring now leaves the unit (`cat`).
  The plan predicted the behavior but did not grep the tests for it.
- **Plan mutation that did not apply.**
  The [#941] pin's named mutation ("include hosted `heredoc_redirect` text") cannot touch that command, because its heredoc is statement-level.
  I mutated the `redirected_statement` branch to emit the whole statement instead, which killed the pin.
- The step-3 metamorphic describe needed a prefix-anchored resolver: the file's substring resolver finds `git` in `2>/dev/null git push` and proves nothing.
  Its "between the arguments" placements pass before the fix, because a two-word prefix never reads the third word; the `program.test.ts` unit cases carry that discrimination.
- A test identity check (`toBe` on the root) needed `tree.rootNode` read once: web-tree-sitter builds a new wrapper on every access.
- **Corpus re-measurement.**
  Over 8891 intact distinct review-log commands, comparing the pre-change source (retro commit) against `HEAD`, exactly the 4 census commands change, each only by its reattached words.
  One token's effect moved from `write (syntax)` to `read (core)`; this matches the plan's prediction.
- An `oldText` carrying an em-dash failed twice because it arrived as a `\u2014` escape; both were rerouted through line-number or ASCII-anchor scripted edits.
- Pre-completion reviewer: **PASS**.
  Its own spike re-derived byte-identity, #814's unproven attribution, floor-exemption semantics (no exemption newly granted against bash semantics), masked offsets including non-ASCII, and nested cases, and found no gap.
