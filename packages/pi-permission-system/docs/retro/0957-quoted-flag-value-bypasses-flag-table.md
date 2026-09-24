---
issue: 957
issue_title: "pi-permission-system: a pattern-first command's quoted `--flag='value'` bypasses the flag table and projects the value"
pr: 972
---

# Retro: #957 — a pattern-first command's quoted `--flag='value'` bypasses the flag table

## Stage: PR Review (2026-09-24T05:40:21Z)

### Session summary

PR #972 (@SamYue1) fixes #957 in `collectPatternCommandTokens` (`src/access-intent/bash/token-collection.ts`).
When a recognized flag's value is quoted (`grep --regexp='/etc/passwd'`, `awk -F':'`, `rg -g'!docs'`), the argument parses as a `concatenation`, which the `child.type === "word"` guard skipped, so the pattern came back as a path candidate.
The operator chose to adopt the PR: push our own simplification commit onto the contributor's branch, then rebase-merge.

### Evaluation

The defect reproduces on `main` at `7e0cc941`.
I ran a scratch test through `extractExternalPathsFromBashCommand`, and it gave `grep --regexp='/etc/passwd' notes.txt` → `["/etc/passwd"]` and `awk -F':' '/api_key:/{print $2}' config.yaml` → `["/api_key:/{print $2}"]`, while each unquoted twin gave `[]`.
It was not already fixed, because `main` still had the test that pinned it as current behavior (`still projects a quoted --flag='script' value (#957)`).
We run this extension ourselves, so we are exposed to it; the harm is a false-positive `external_directory` ask, not a bypass.

I checked out the branch at `ddd49188` in a scratch worktree.
`pnpm run check` and `pnpm run lint` both passed, and the package suite passed 168 files and 4594 tests.
The PR's own CI run `35830300962` also concluded `success`.

What is valuable:

- The PR changes the guard that produces the failure, and it ships tests at both the collector level and the gate level (`token-collection.test.ts`, `bash-path-extractor.test.ts`).
  It also flips the old #957 pin, which now asserts the fix.
- It is right that #957's own proposed narrowing is unsound.
  I swapped in that proposal (`child.type === "word" || directive.kind !== "regular-flag"`), and it turned `sd '-old' '-new' file.txt` into `[]`: `'-new'` is read as `-n` with the glued value `ew`, and `file.txt` is dropped, which is ADR 0009's unrecoverable direction.
  The PR accepts only a `concatenation` whose head is an unquoted `word`, so a token quoted whole (a `raw_string`) still spends a pattern positional, and `sd` stays `["file.txt"]`.

What to change, in the fixup commit:

- `isQuotedGluedFlag` repeats the flag lookup from `classifyPatternCommandFlag` (the `=`-strip and `slice(0, 2)`).
  The `directive.kind !== "regular-flag"` check already carries recognition, so the only extra test needed is the shape one.
  That is, the predicate becomes `child.type === "concatenation" && child.child(0)?.type === "word"`, meaning the leading `-` is unquoted.
  I measured this variant on the branch: all 4594 tests pass, `sd '-old' '-new' file.txt` stays `["file.txt"]`, and it also reads `grep --reg'exp=/etc/passwd' f.txt` and `grep -'e' /etc/passwd f.txt` the way grep does (`["f.txt"]`), where the PR's head-lookup copy over-surfaces `/etc/passwd`.
  It removes about 15 lines, and there is no second copy of the lookup rules to drift from `classifyPatternCommandFlag`.
- Trim the roughly 20-line comment on the flag branch and the `isQuotedGluedFlag` doc comment to what the code does now; the issue history belongs in git.
- Tighten the ADR 0009 amendment: describe the admitted shape as "a `concatenation` whose leading `-` is unquoted", replace "measured on this commit", and keep the residual bullet's whole-quoted spelling (`grep '-e' pattern f.txt`).
- Add the two newly admitted spellings (`--reg'exp=…'`, `-'e'`) to the collector test if the predicate changes.

The change is not breaking.
It only removes over-surfaced tokens: the PR author measured 14 of 4045 commands losing tokens and 0 gaining any, and the hand-written `sd` cases confirm no operand is lost.
This is a `fix(pi-permission-system):`.

The PR's Notes mentioned a second false positive: a backtick in double quotes leaves a parse `ERROR` and floors to `ask`.
The prompt is real, and the operator rules it a false positive.
The gate exists to judge access, and a command bash refuses to run accesses nothing.
I ran a scratch test through `resolveBashAdvisoryCheck`, which uses the gate's `resolveBashCommandCheck`, with a resolver that allows everything.
Only two spellings floor to `ask` with `<unparsed-bash-subtree>`: two backslashes before the backtick inside double quotes (`bash -n` rc=2, unterminated command substitution), and a bare backtick inside double quotes (invalid by bash's grammar; not run).
Every valid spelling is allowed: a single backslash before the backtick, a backtick inside single quotes, a backtick embedded in text, and repeated escaped backticks.
The operator's review log (2026-05-03 to 2026-09-24) holds 1260 bash asks, 16 of them floored as `<unparsed-bash-subtree>`.
Exactly one of the 16 is this kind: a `grep` whose pattern put three backticks inside double quotes, which is invalid bash because the third backtick opens a substitution that never closes.
Nine are the heredoc-plus-`2>&1 |` grammar gap (#840, #875), where the backticks sit only in commit message bodies, and six have no backtick at all.
The floor exists for completeness, not validity: a partial parse of valid bash hides commands that really run, which is the bypass #840 and #875 closed.
The false positive comes from tree-sitter's errors and bash's errors not lining up exactly: when both reject a command, bash runs nothing on that line, yet the gate still asks.
A fix has to separate the two cases without weakening the floor for valid-but-unparsed bash.
One candidate recognizes the specific failure (an unterminated backtick or quote at the end of the command); another asks `bash -n`, at the cost of a process spawn on every failed parse and Git Bash on Windows.
One risk is unverified: bash is believed to run the complete lines before a broken one in a multi-line command, so a command bash rejects may still act before the error.
At this frequency (one instance in 1260 asks), a clearer reason in the prompt may be worth more than a classifier.
This is out of scope for PR #972; the operator has not yet decided whether to file it.

### Decision and attribution

Direction: adopt the PR.
Keep @SamYue1's commit, push a `refactor`/`fix` fixup onto `fix/957-quoted-flag-directive` that collapses `isQuotedGluedFlag` to the shape test and trims the comments and the ADR text, then `gh pr merge 972 --rebase`.
`maintainerCanModify` is `true`.
Scope: only the quoted-flag admission, and nothing more from ADR 0009's other residuals (clusters like `grep -ie`, GNU abbreviations, whole-quoted flags).

Attribution: the contributor's commit keeps its authorship through the rebase-merge.
Our fixup commit carries this trailer in its final paragraph:

```text
Co-authored-by: sam <1441336599@qq.com>
```

The close comment on #957 and the merge comment on #972 thank @SamYue1 by name and link the landed SHAs.
Reference the PR as `Refs #972`, never `Closes`.
