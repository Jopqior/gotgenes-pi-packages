---
issue: 944
issue_title: "pi-session-tools: transcript rendering ignores parentId, presenting abandoned branches as history"
---

# Retro: #944 — pi-session-tools: transcript rendering ignores parentId, presenting abandoned branches as history

## Stage: Planning (2026-09-19T20:48:55Z)

### Session summary

Planned branch-aware transcript rendering as a new `src/session-tree.ts` module prepended to the `selectEntries` pipeline, with the live path as the default for all three read tools and a `branches: "live" | "all"` parameter as the escape hatch.
The operator settled both questions at an `ask_user` gate after bouncing the first attempt with a question about how the live path is identified.
The plan is `packages/pi-session-tools/docs/plans/0944-branch-aware-transcript-rendering.md`: seven steps, breaking (`fix(pi-session-tools)!:`, 2.2.0 → a major), shipped independently since this package has no improvement roadmap.

### Observations

- The first gate was premature and the operator answered it with a question — "how do you identify the live path?"
  The substance message had led with corpus numbers and the defect's cost, and never stated the algorithm.
  Answering it took one message (leaf resolution in two halves, the `parentId` walk, where it can be wrong) and the re-asked gate was answered immediately.
  The `clarification-gates` rule about defining terms of art before substance covers this; the miss was treating "live path" as self-evident because I had just read `buildSessionPath`.
- The mechanism was verified in Pi's own source rather than inferred: `SessionManager._buildIndex()` assigns `this.leafId = entry.id` for every entry in order, so the last line of a file is the leaf Pi resumes into.
  That turns "walk back from the last entry" from a heuristic of ours into a reproduction of Pi's rule, which also satisfies the README non-goal about not owning Pi's storage format.
  `getLeafId()` and `getBranch()` were confirmed in the pinned `0.79.1` declaration bundle **and** in the published `0.75.0` tarball, which is the package's `peerDependencies` floor — the floor check is what the design's `read_session` call site rests on.
- Measured, not estimated: 998 session files under `~/.pi/agent/sessions/`, 71 (7.1%) with at least one fork; off-path share min 0.3% / median 11.6% / p90 39.9% / max 95.7%; max 6 fork points in one file; 29 of 71 carry a `branch_summary`, so 42 have no marker of any kind; 6 of 71 have non-contiguous off-path runs.
  The issue's own figure was 6 of the 120 most recent sessions for one cwd; the wider sweep raised it and produced the two facts the design turns on — the 42 marker-less files (why the omission marker is load-bearing) and the non-contiguity (why markers are placed per run rather than per fork point).
- A disposable spike ran the real `selectEntries`/`formatTranscript`/`summarizeEntries` over two real forked session files to price the change: 609 entries / 312,237 chars / 287 messages today versus 278 / 180,312 / 139 on the live path.
  That 148-turn gap in a single file is what the gate's substance led with, in the reader's terms rather than the mechanism's.
- The Tidy-First assessor's two recommendations were both accepted (name the params bag; add `getLeafId` to `read-session.test.ts`'s `makeCtx` before the wiring step), and it correctly found the stub gap the design summary had not mentioned.
  Its universal claim that existing fixtures are "strictly linear `1→2→3→4`, never branching" was **wrong**, and re-deriving it found `test/format-transcript.test.ts` L137, whose entries are `[id 1, id 3 (parent 2), id 2 (parent 1)]` — file order and tree order deliberately disagree.
  Its conclusion survived (that test calls `formatTranscript` directly and bypasses `selectEntries`), but only because branch resolution lives in `entry-selection.ts`.
  That fixture is now recorded in the plan as a predicted-unchanged file and as the concrete reason the new stage cannot live in the formatter.
  The assessor also cited SDK version `0.84.4`, where the package pins `0.79.1` — it read a different `node_modules`; the plan cites the versions I checked.
- The scope collision was raised **at** the gate rather than argued around afterward: the README's "a new capability arrives as a new tool rather than as another parameter" line is what killed an opt-in flag in #943.
  The counter-precedent that settled it is in the 2026-09-18 triage verbatim — "an `offset` bound is not a new capability, so the new-tool rule does not reach #940" — so a branch selector is the same class.
- One behavior change rides along and is called out separately rather than folded into the headline: #546's phantom `model_change` pruning now runs on the branch-resolved array, so a live marker whose only following assistant turn was on an abandoned branch becomes phantom.
  Measured on both spike files the live `modelChanges` count did not move (4→4, 1→1), so the fixture that exercises the flip has to be constructed deliberately.
- A `read_session_branch({ leafId })` tool was offered at the gate and declined in favour of the parameter.
  Declined, not deferred — no follow-up issue filed, matching how #943 handled its transcript footer.

#### Deferred tidyings

- `packages/pi-session-tools/src/index.ts` — the `Type.Object` parameter blocks of `read_parent_session` (L323) and `read_session_file` (L431) are word-for-word identical for `types`/`offset`/`limit`/`elide_user_text`, while `read_session`'s (L249) carries intentionally richer prose; the assessor rated a two-way extraction Optional and a three-way one the wrong-abstraction trap, and I took neither, so adding `branches` touches three sites.
- `packages/pi-session-tools/test/` — `makeCtx` remains duplicated across four suites with differing signatures (carried over from #943's deferral); this change adds `getLeafId` to one copy only, since only `read_session` calls it.

## Stage: Implementation — TDD (2026-09-19T22:52:08Z)

### Session summary

Executed all seven planned steps as separate commits, plus one follow-up `test:` commit closing the pre-completion reviewer's two coverage warnings.
The package went from 12 test files / 183 tests at baseline to 13 / 228.
All four gates (`check`, root `lint`, `test`, `fallow dead-code`) were green at baseline and at HEAD, and the reviewer returned PASS on re-dispatch.

### Observations

- Every killing mutation the plan named behaved as predicted except one, and the exception was a finding rather than a pass.
  The plan claimed *treat an entry with no string `id` as abandoned* would redden "the mixed-array and no-ids tests"; it reddened only the mixed-array test, because the no-ids cases are guarded by a different half of the rule (an unresolvable leaf returns the input unchanged) and short-circuit before `isAbandoned` runs.
  A second mutation — returning `new Set(byId.keys())` from that guard, which is exactly the fail-open direction the plan's risk table names — reddened the two no-ids tests, so the class is pinned; the plan just attributed it to the wrong mutation.
- One planned probe was vacuous and had to be rewritten before it could discriminate.
  The test for "branch resolution runs before `filterByTypes`" used a fixture whose live path did not actually pass *through* a filtered-out entry, so reordering the two stages produced identical output.
  Replacing it with a fixture whose live path runs `1 → 3 → 4` across a `model_change` made the reorder mutation kill it.
  This is the `testing` skill's "name both outcomes and confirm your assertion's value differs between them" rule, caught by counting reds against the plan's prediction rather than by reading the test.
- Two tests in the new `read_session` branch suite passed during Red, for a reason worth recording: `buildTranscriptResult` already called `selectEntries(allEntries, params)`, so the raw `branches` tool parameter flowed straight into `EntrySelection.branches` by name before any wiring was written.
  The plan had predicted exactly this coupling and made removing it part of step 6 ("build the selection object explicitly"), but the consequence for the Red step was not anticipated.
  Both were mutated explicitly afterward and both discriminate.
- The Tidy-First step that added `getLeafId` to `read-session.test.ts`'s `makeCtx` was load-bearing exactly as the assessor predicted: the stub is behind an `as unknown as ExtensionContext` cast, so nothing would have caught its absence until the suite ran.
- `Omit<BranchMarkerEntry, "type">` does not distribute over a discriminated union, so a single `marker(fields)` factory failed `tsc` on `count`; three small typed factories replaced it.
  Relatedly, every test that builds a marker has to go through a factory returning `BranchMarkerEntry` — a fresh object literal passed to `formatTranscript` trips TypeScript's excess-property check against `TranscriptEntry`, which is `{ type: string }`.
- Deviation from the plan's Module-Level Changes: the README's canonical end-to-end sample transcript did **not** gain a marker line as the table claimed.
  That sample is a linear, unforked session, so a marker there would show output it cannot produce; the marker examples went into the new `#### Rewound sessions` subsection instead.
  The reviewer confirmed this reading in the delta round.
- Every other predicted-unchanged claim held, including the interesting one: `test/format-transcript.test.ts`'s `handles parallel tool calls with out-of-order results` fixture (file order `1, 3, 2`, tree order `1 → 2 → 3`) is untouched and green, because that suite calls `formatTranscript` directly and never reaches `resolveBranches`.
  That fixture is the concrete reason branch resolution had to live in `entry-selection.ts`.
- Pre-completion reviewer: WARN on the first round, PASS on the second.
  The two WARNs it raised were real gaps on this issue's own mechanism and were closed rather than accepted: `test/session-tree.test.ts` gained a multi-root array, a `leafId` naming an island node, and an ancestor stranded above a broken parent link; `test/read-session.test.ts` gained the tool-level case combining a `types` filter with a forked session, which is how `/retro`'s model-attribution lens actually calls it.
  All five were authored after Green, so they were mutated explicitly, and the reviewer re-derived both mutations itself rather than accepting the report.
