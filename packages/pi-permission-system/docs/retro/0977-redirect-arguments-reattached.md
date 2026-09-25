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
