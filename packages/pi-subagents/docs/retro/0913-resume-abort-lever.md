---
issue: 913
issue_title: "pi-subagents: abort(id) does not cancel an in-flight resume"
---

# Retro: #913 — pi-subagents: abort(id) does not cancel an in-flight resume

## Stage: Planning (2026-09-18T22:07:53Z)

### Session summary

Planned Phase 22's Step 22: give a resumed run an abort lever the record can pull.
The plan is `packages/pi-subagents/docs/plans/0913-resume-abort-lever.md` — three steps (a preparatory getter conversion, the behavioral `fix:`, and a docs step), shipping independently.
A disposable Vitest spike against the real `Subagent` measured all three of the issue's claims before the design was settled, and one follow-up ([#949]) was filed and given a Phase 22 disposition.

### Observations

- The gate settled two things: the record mints a **fresh `AbortController` per run** (`run()` and `runResume()`), and a caller-supplied `signal` routes **through** `abort()` rather than composing with it.
  The `AbortSignal.any` alternative — two independent levers, preserving today's `completed` reading after a caller-signal cancel — was offered and declined: it keeps the same class of untruthful outcome Steps 17, 19, and 21 removed.
- The measured repro is worth carrying forward: with no caller signal, `abort()` returns `true`, the record reads `stopped` immediately, `resumeTurnLoop` receives `undefined`, and the late answer still lands in `result` — `markCompleted`'s status guard blocks the status write but always sets `result`.
  So the record reads `stopped` while carrying the text of a run that ran to completion.
- The Tidy-First assessor corrected the file list: a **third** test asserts the removed forwarding — `test/lifecycle/subagent-manager.test.ts` `"forwards the caller's signal to the resumed turn loop"` — which neither the issue nor my design summary named.
  It must be rewritten in the same commit as the two in `subagent.test.ts`.
- It also corrected the framing: the constructor's `new AbortController()` must **stay** (three existing tests read `abortController` or call `abort()` on a record that never ran), so "fresh per run" is a supplement, not a replacement.
- The roadmap's `Target:` line for Step 22 names `src/lifecycle/subagent-session.ts`; the settled design leaves it unchanged — only the argument handed to `resumeTurnLoop` moves.
  Recorded in the plan's Non-Goals and predicted-unchanged list.
- Filed [#949]: `RunListeners.wireSignal` and `forwardAbortSignal` both register with `addEventListener`, which never fires for an already-aborted signal (measured with a one-line `node -e`).
  Scoped out of this plan because the fix also changes `run()`'s spawn-path behavior.
  Operator disposition: deferred to a later phase, recorded in the roadmap's `#### Open-issue sweep dispositions`.

#### Deferred tidyings

- `packages/pi-subagents/src/lifecycle/subagent.ts` — a shared `beginRun(signal)` helper for the "mint controller + wire signal" sequence was considered and **rejected** by the assessor as procedure-splitting: `resetForResume()` sits between the mint and the wire in `runResume()`, so the sequence does not line up with `run()`'s and a helper would fit only one of the two call sites.

## Stage: Implementation — TDD (2026-09-18T22:25:19Z)

### Session summary

Executed all three plan steps as three commits: the preparatory getter conversion (`16f067fd`), the behavioral fix (`acd83b00`), and the README/roadmap docs (`5b942e94`).
The `pi-subagents` suite went 1792 → 1796 tests (four added: three `Subagent.resume()` cancellation classes plus one manager-door abort-by-id test; three existing assertions of the removed forwarding were rewritten rather than added).
Pre-completion reviewer: PASS.

### Observations

- No deviations from the plan.
  Every file it listed was touched, and every file in its predicted-unchanged list stayed unchanged — including `subagent-session.ts`, which the roadmap's `Target:` line named but the design did not need.
- All three killing mutations behaved as predicted, with one bonus: mutation 1 (forward the caller's `signal` to `resumeTurnLoop` instead of the record's) killed class (c) as well as class (a), because (c) asserts the loop's signal was not already spent on arrival and a `undefined` signal fails that too.
  Mutations 2 and 3 each killed exactly their own class.
- The Red step's evidence was strong on its own: two of the parked-loop tests failed by 5 s timeout (the loop is never signalled pre-fix) while the caller-signal test failed in 1 ms on the status assertion — two different failure shapes for two different claims.
- Worth remembering for a future reader: `markCompleted` blocks the status write against `stopped` but always sets `result`, so an aborted resume's record carries the text of the run it stopped.
  That is pre-existing and unchanged here.
- The reviewer independently confirmed the prose sweep (`SKILL.md`, `docs/`, `README.md`) carries no surviving claim that a resume bypasses the record's controller, and that `mmdc` parses all six Mermaid charts after the `S22` ✅ mark.

[#949]: https://github.com/gotgenes/pi-packages/issues/949
