---
issue: 859
issue_title: "pi-permission-system: git revision ranges are classified as path candidates, raising false external_directory asks"
---

# Retro: #859 — pi-permission-system: git revision ranges are classified as path candidates, raising false external_directory asks

## Stage: Planning (2026-09-23T03:22:11Z)

### Session summary

Planned the Phase 15 step for this issue: both token classifiers now treat `..` as a path signal only when it is a whole segment, through one private `hasParentTraversal` predicate, adopting `TacoTakumi`'s regex with a `Co-authored-by:` trailer.
I reproduced the issue through the real `BashProgram` and measured the blast radius over an 8360-command review-log corpus.
I also filed the brace-expansion residual as [#968] and recorded its disposition in the roadmap: deferred to a later phase, beside [#822].

### Observations

- **Third-party direction gate:** the operator adopted the predicate for both classifiers, as the roadmap step already specified, rather than the posted patch's strict-only scope.
- **Corpus diff (measured, both classifiers):** `external_directory` loses 28 tokens across 27 commands and `path` loses 92 across 85, with 0 gained on either surface.
  Every lost token is a revision range, a bare `...`, or prose inside a quoted argument.
  An ask disappears entirely in only 2 commands, and both were false positives.
  With the predicate applied, the full suite stayed green (4584 tests), so the Red comes only from new tests.
- **The trigger is wider than the issue says.**
  A *known* base outside the cwd (an absolute `cd /elsewhere && git log a..b`) also flagged the range, because it resolved to `/elsewhere/a..b`.
  In the corpus those asks were already carried by the `cd` target, so only their evidence lists get shorter.
- **Brace expansion is a pre-existing gap.**
  With a known base, `cat {..,y}/z` is not flagged today; with an unknown base it was flagged only because the substring test happened to match it.
  The operator chose the separator-only predicate and a follow-up issue ([#968]) over widening the boundary set to `{ , }`.
- **The rule classifier's `..` branch becomes almost unreachable.**
  Only a POSIX backslash form (`foo\..`) reaches it once `startsWith(".")` and `hasPathSeparator` have run.
  It is kept for a single definition of "parent traversal"; whether to delete it under the #520 posture is recorded as an Open Question.
- **Tidy First:** one `refactor:` step was accepted, which extracts the current `includes("..")` into a shared predicate before the behavior change.
  The assessor confirmed the probe fall-through (`probeBareToken` returns `null` under an unknown base before it touches the filesystem) and found no existing test that asserts an in-segment `..` is accepted.

#### Deferred tidyings

- `test/access-intent/bash/token-classification.test.ts`: the two near-duplicate "shared rejection: rejectNonPathToken" blocks (one per classifier) could share one table-driven test.

## Stage: Implementation — TDD (2026-09-23T03:35:39Z)

### Session summary

Completed all three plan steps: the `refactor:` extraction of `hasParentTraversal`, the `fix:` that makes it a whole-segment `PARENT_TRAVERSAL_SEGMENT_PATTERN` (co-authored with `TacoTakumi`), and the roadmap `docs:` commit with the ✅ marks and a `Landed:` note.
The package suite went from 4584 to 4590 tests (+6: two unit tests in `token-classification.test.ts`, four in `program.test.ts`).

### Observations

- **Red matched the plan exactly.** 4 tests failed at Red (the two in-segment unit tests and the two `program.test.ts` range tests), and the three invariant pins (the `a/../../b` control, the `v1..v2` symlink, and the whole-segment positives) passed as predicted.
- **All five named mutations were killed.**
  In-segment: 4 reds.
  Rule call site only: 2 reds, with the strict tests green.
  Token edge (drop `$`): 2 reds; it also killed the rule classifier's POSIX `foo\..` positive, which is a trailing-edge case too, one more than the plan named.
  Backslash: 2 reds.
  Probe fall-through: 4 reds, including the new symlink test and three pre-existing #645/#694 pins.
- **The scripted `perl` mutation for the token edge matched nothing** (the pattern unchanged, and 367 green).
  I caught it because `grep` showed the pattern unchanged, then re-applied it with `Edit`.
  The regex-escaping layers (shell, `perl`, the JS regex source) make a scripted mutation of a regex literal unreliable, so `Edit` is the tool for it.
- **The corpus re-run matched the plan.**
  It covered 8375 commands (the log grew by 15): `external_directory` 28 tokens lost across 27 commands, `path` 93 lost across 86, 0 gained, 0 lost tokens with a whole `..` segment, and 2 commands losing every external access.
  The one extra `path` loss is this session's own `refactor:` commit message (prose containing ` .. `).
  The pre-change output was captured at the `refactor:` commit, before the `fix:` landed.
- **One slip in the docs step:** the first `Edit` wrote the check-mark as a literal `\u2705` escape in the heading and the Mermaid node, and the retro's first draft repeated the slip for an em-dash.
  The addendum's literal-character rule governs `newText` as much as `oldText`.
  `grep` caught it, and I replaced it with the character before committing.
- **Pre-completion reviewer: WARN.**
  It found no defects: it enumerated about 30 candidate tokens (including `$VAR/..`, `$HOME/..`, `./..`, `.../x`, and quoted forms) and confirmed that each classifies as intended.
  Its single finding is that its read-only mandate kept it from re-running the corpus spike, which it disclosed rather than reporting as verified.

[#822]: https://github.com/gotgenes/pi-packages/issues/822
[#968]: https://github.com/gotgenes/pi-packages/issues/968
