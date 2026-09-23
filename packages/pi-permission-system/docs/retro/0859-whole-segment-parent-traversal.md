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

[#822]: https://github.com/gotgenes/pi-packages/issues/822
[#968]: https://github.com/gotgenes/pi-packages/issues/968
