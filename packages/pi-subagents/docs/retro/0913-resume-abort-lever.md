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

[#949]: https://github.com/gotgenes/pi-packages/issues/949
