---
issue: 967
issue_title: "Gate the visible forms of em-dash corruption (literal \\u2014, split sentences), not just invisible bytes"
---

# Retro: #967 — Gate the visible forms of em-dash corruption

## Stage: Planning (2026-09-23T22:04:17Z)

### Session summary

Planned a sibling lint script, `scripts/lint/unicode-escapes.mjs`, that masks markdown code spans and fenced blocks and then rejects a literal `\uXXXX`/`\u{…}` escape or a bare `uXXXX` token in prose, decoding the unambiguous escapes under `--fix`.
It is wired like #960's gate (prek hook, `lint`, `lint:fix`, the `pi-autoformat` `.md` chain) and ships with two repairs: the `0301` retro's `\u2192` and a `\u2014` in an `authorizer-chain.ts` comment.
The plan is `docs/plans/0967-gate-literal-unicode-escapes.md`, nine TDD steps, one Tidy-First preparatory `test:` step.

### Observations

- **Code-span masking is the whole design.**
  A naive `git grep` finds 54 lines in 22 markdown files, 15 of them retros; a prototype masker reduces that to 1 hit, which is real corruption.
  So neither `docs/retro/**` nor `CHANGELOG.md` needs an exemption, answering two of the issue's three open questions by measurement.
- **The split-sentence form is not gateable, and the reason is `rumdl`'s reflow.**
  A scratch file run through `rumdl fmt` with the repo config rejoined all three split shapes; the operator asked whether the 0 hits came from that cleanup, and it does.
  What survives is either a grammatical missing dash (undetectable) or a joined bare `u2014` (caught by the bare-token check).
  The looser pre-reflow pattern had 28 false positives in 11 files.
- **Operator chose decode-on-`--fix`, after asking how a doc that means the literal survives.**
  Answer: backticks (already used by every current mention) or CommonMark's `\\u`, which the gate excludes by requiring exactly one preceding backslash.
  Design addition from that exchange: decode only when the result is visible (not `\p{C}`/`\p{Z}`), so decoding never plants a byte #960's gate rejects.
- **Code comments were found corrupt too.**
  `authorizer-chain.ts:47` holds `\u2014` from `6d52c8c6`; `widget-renderer.ts:222` spells escapes in a comment on purpose, so a comment gate needs tokenizing.
  The operator chose to fix the one line in this plan (as `style:`, skipped by `cliff.toml`) rather than file a follow-up; no issues were filed.
- **Frontmatter is the gate's own first test case.**
  This issue's title contains the literal escape; written `\\u2014` inside YAML double quotes, it is YAML-correct and outside the gate.
  The prototype enumerates `git ls-files`, so its first run skipped the still-untracked plan; once tracked, both frontmatters surfaced as hits until the prototype gained the exactly-one-backslash rule, after which the tree reports only the `0301` line.
  `/tdd-plan` should keep both files in the step 3 whole-tree check as the regression case for that rule.
- The issue carries no labels; `scope:repo` would be the correct one.

#### Deferred tidyings

- `scripts/lint/invisible-characters.mjs` and the new `scripts/lint/unicode-escapes.mjs` — `parseArgs` and the tracked-file listing will duplicate about 20 lines; declined at two callers, following the unextracted two-caller precedent `fallow dupes` reports in `packages/pi-permission-system/scripts/`.
  Trigger: a third lint script.
- A generic `runLinter({paths, fix}, io, {scan, repair, format})` over both lint scripts — rejected; the two repairs differ in shape (code-point filter vs. offset splice).
