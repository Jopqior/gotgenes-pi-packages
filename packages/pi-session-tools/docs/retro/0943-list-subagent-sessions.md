---
issue: 943
issue_title: "pi-session-tools: no way to discover or reach a session's subagent transcripts"
---

# Retro: #943 — pi-session-tools: no way to discover or reach a session's subagent transcripts

## Stage: Planning (2026-09-19T06:32:08Z)

### Session summary

Planned the downward navigation gap as a single new tool, `list_subagent_sessions({ path, limit? })`, rather than the two surfaces the issue proposed.
The operator settled the direction at two `ask_user` gates: new tool only (no transcript footer, no recursion or flag on `list_session_files`), bounded at 10 with the count line disclosing the true total, `path` required, the name taken from the producing package's vocabulary, and `.pi/prompts/retro.md` wired to use the capability.
The plan is `packages/pi-session-tools/docs/plans/0943-list-subagent-sessions.md`: four steps, non-breaking, `2.0.0` → `2.1.0`.

### Observations

- The README's in-scope line ("A new capability arrives as a new tool rather than as another parameter on an existing one") was the live constraint at the gate, and it is what ruled out the issue's own suggestion of an opt-in flag on `list_session_files`.
  The 2026-09-18 triage row had already banded #943 as aligned under "reaching a session the existing tools cannot reach".
- The transcript footer (the issue author's own "probably the higher-value one") was declined, not deferred — no follow-up issue was filed for it.
  A cheap substitute exists either way: `read_session_file({ path, limit: 1 })` would have rendered one entry plus a footer, which is roughly what the new tool returns directly.
- [#916]'s presentation extraction pays off immediately: `boundListingPaths`, `DEFAULT_LIST_LIMIT`, `formatListingText`, `formatListingSummary`, and `buildListingResult` are reused verbatim, so the whole change is a derivation function, an existence predicate, and a registration block.
  The consequence recorded in the plan's Invariants section is that `session-listing.ts` now has two constituencies, so the new suite asserts the body and both `details` numbers independently rather than trusting the shared helper's own tests.
- Measured rather than assumed: 611 top-level sessions in this repo's session directory, 340 with a `tasks/` directory, 559 subagent transcripts, mean 1.64 and max 11 per parent, uniform 210-character paths.
  Of the newest 10 paths under a *recursive* mtime sort, 4 are subagent transcripts — which is the concrete argument against recursing inside `list_session_files` under [#916]'s bound.
- Depth was checked at the mechanism, not only the corpus: `packages/pi-subagents/src/lifecycle/create-subagent-session.ts` denylists `subagent`, `get_subagent_result`, and `steer_subagent` in every child, so a subagent cannot spawn one, and zero `tasks/*/tasks/` paths exist under the sessions root.
  Reachable in principle via the subagents service API, so the design navigates one level per call instead of assuming a flat tree.
- The capability has a named downstream reader: `/retro`'s model-performance lens, which today cannot see subagent turns at all.
  [#916]'s own retro attributed both subagent dispatches from their agent definitions — the configured model, not the one that ran.
- Breaking classification: not breaking, on this package's precedent that transcript-rendering changes shipped as `feat:` minor (#411) and `fix:` patch (#546).
  Stated in the gate's substance message with the counter-reading, since #916 took the package to `2.0.0` a week ago for a default change.

#### Deferred tidyings

- `packages/pi-session-tools/src/parent-session.ts` — the module owns the `tasks/` convention in both directions after this change but its name and header still say "parent"; a rename was rejected as import-path churn for a naming preference on a 27-line file.
- `packages/pi-session-tools/src/index.ts` — 494 lines with six `registerTool` blocks, becoming seven; a per-tool file split was rejected as a separate concern for an improvement round, since the new block is homogeneous with the existing six.
- `packages/pi-session-tools/test/` — `makeCtx` is duplicated across four suites with three different signatures, so unifying it is a design call rather than a lift-and-shift; the new suite needs no `ctx` at all, so the change does not hit that friction.
- `packages/pi-session-tools/test/list-session-files.test.ts` — the `existsSync`/`readdirSync`/`statSync` mock trio and its `mockSessionFiles(n)` fixture will have a second consumer after this change but not a third; `vi.hoisted()` stubs are conventionally file-local in this package, so the new suite copies rather than shares.

## Stage: Implementation — TDD (2026-09-19T06:47:41Z)

### Session summary

Executed all four planned steps as separate commits: lifting `captureTools` into `test/helpers/capture-tools.ts`, adding `deriveSubagentSessionsDir` and `sessionFileExists`, registering `list_subagent_sessions` with its README section, and pointing `/retro`'s model lens at subagent transcripts.
The package's suite went from 9 files / 130 tests to 10 / 144.
All four gates (`check`, root `lint`, `test`, `fallow dead-code`) were green at baseline and at HEAD.

### Observations

- Every killing mutation the plan named behaved exactly as predicted, including the per-class counts: the `captureTools` stub-out reddened 31 tests in the four migrated suites and left the other five green; dropping `"tasks"` from the derivation reddened 4 tests while `basename(f)` without the `.jsonl` suffix reddened 3 and left the suffix-less case green; removing the existence guard reddened exactly the 2 missing-file tests; passing `params.path` instead of the derived directory reddened the 5 body-asserting tests and left the two status tests and the `count`/`shown` test green.
- The registration-deletion mutation was applied with a small Python slice rather than an `Edit`, since the block to remove is ~60 lines; the file was verified changed (`grep -c` fell from 2 to 1, the survivor being the module header comment) before the suite was read, per the rule that a substitution matching nothing reads like a mutation that killed nothing.
- One deviation from the plan: lifting `captureTools` left `vi` unused in `test/read-session.test.ts`, which Biome reports at **warning** level, so `pnpm run lint` still exited 0.
  It surfaced only from the `grep -c 'lint/'` count the `git-workflow` skill prescribes.
  Fixed as `style(pi-session-tools): drop the now-unused vi import from read-session tests`, a fifth commit — the most recent commit at that point was a `docs:` one, which must not carry a lint fixup.
- The plan's three "predicted unchanged" claims held: `src/session-listing.ts`, `test/session-listing.test.ts`, and `.pi/prompts/sync-worktree.md` all show a zero diff, and `src/index.ts` still imports no `node:fs` symbol.
- The new suite needed one path-aware `existsSync` implementation — for the "session exists, spawned no subagents" case — which is also the assertion that discriminates checking the raw `path` from checking the derived directory.
  The Tidy-First assessor predicted exactly this and it was the only fixture wrinkle.
- Pre-completion reviewer: PASS.
  It independently re-derived the non-breaking claim, the `node:fs` boundary, the predicted-unchanged files, and the doc surfaces, and enumerated its own four mutations, agreeing each is killed by a specific existing assertion.
  No warnings.

## Stage: Sync (worktree) (2026-09-19T06:51:51Z)

### Session summary

Pre-push checks are clean (`pnpm run lint`, `pnpm fallow dead-code`), the branch has no `main`-divergence conflicts to resolve yet, and the plan's `**Release:** ship independently` marker carries no deferred-batch handoff for the root to reconcile.

**Peer session transcript:** `/Users/chris/.pi/agent/sessions/--Users-chris-development-pi-pi-packages-worktrees-issue-943--/2026-09-19T06-03-14-419Z_01a0b843-0273-7654-910b-f972bbabdcc6.jsonl` — read with `read_session_file({ path: "/Users/chris/.pi/agent/sessions/--Users-chris-development-pi-pi-packages-worktrees-issue-943--/2026-09-19T06-03-14-419Z_01a0b843-0273-7654-910b-f972bbabdcc6.jsonl" })` for message-level verification at land/retro time.

### Observations

No deferred work for the root beyond what the TDD stage note already recorded (the Tidy-First-rejected `parent-session.ts` rename and `index.ts` split, and the `makeCtx`/fs-mock-trio consolidation left for a third consumer).
Pre-completion reviewer returned PASS with no warnings, so nothing outstanding to flag at ship time.

[#916]: https://github.com/gotgenes/pi-packages/issues/916
