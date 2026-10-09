---
issue: 39
issue_title: "docs(upstream-sync): define a minimal information-acquisition contract"
---

# Retro: #39 — docs(upstream-sync): define a minimal information-acquisition contract

## Stage: Planning (2026-10-09T16:24:25Z)

### Session summary

Produced and committed the repository-scoped documentation plan after reading the issue, existing synchronization ownership, and relevant `#38` evidence.
Checked historical Git reading routes and the existing workflow-contract test baseline; no implementation, integration, push, or publication occurred.

### Observations

- The operator rejected changes to generic skills and agent definitions.
  The accepted route is guide → synchronization plan's explicit reviewer-handoff step → execution-time reviewer dispatch; the guide remains the sole contract owner.
- Preserve existing full coordinating/reviewer plan reads, applicable prior-stage retro reads, and complete triggered skills.
  Bound historical/task-specific material and step-worker execution detail instead, retaining all applicable shared decisions and acceptance requirements.
- Keep incoming and actual integration-change inventories separate and regenerable from durable Git inputs/commands.
  Temporary-file survival and dispatcher coverage claims cannot replace the independent reviewer's own inventory checks.
- The `#38` walkthrough found an empty selected remerge diff alongside a changed automatic-merge diff, reinforcing the need for separate reading routes.
  No token-saving measurement or renewed certification of `#38` behavior is claimed.
- `test/upstream-sync/workflow-contract.test.mjs` passed its planning baseline.
  Preserve its existing headings and section-local safety clauses; new prose semantics require walkthrough and independent judgment, not claims of runtime enforcement.
- Only `docs/upstream/synchronization-guide.md` is planned to change during implementation, alongside ordinary lifecycle notes.
  Use `/build-plan`; no Tidy-First assessment or concrete follow-up issue is required.

## Stage: Implementation — Build (2026-10-09T16:44:55Z)

### Session summary

Completed all three plan steps: the acquisition table and reading boundaries in `b4423e056`, followed by plan-mediated reviewer handoff requirements in `8348fea76`, then ordinary validation and independent review.
Only `docs/upstream/synchronization-guide.md` changed as the contract owner; generic definitions, source/tests, release policy and publication behavior remained untouched.

### Observations

- No deviations, new compatibility decisions or concrete follow-up issues.
  Baseline `pnpm run check` and `pnpm run lint` passed; both implementation steps passed markdown lint, the existing workflow-contract suite and root lint.
- Re-ran the real `#38` Git reading routes recorded in this issue's plan, keeping incoming and actual-change inventories separate.
  The selected prompt's empty remerge output contrasted with its nonempty automatic-merge diff; the post-merge inventory exposed public-type verification, lifecycle tests and both release-state contributions.
  These checks establish reading entry points, not measured savings or renewed certification of all `#38` behavior.
- Walked through complete sync dispatch, missing temporary inventory, stale pointer, absent handoff step, cross-step/shared warnings and ordinary non-sync review.
  Regeneration/source lookup does not reduce coverage; new compatibility choices retain operator approval.
- Pre-completion reviewer: PASS for `0f52a5af5dc90b20ab4cf445e8df8a3015e6fb7d..8348fea760630994b53ba3731d8fe00d0a3d7ee3`.
  The reviewer ran the normal deterministic gates, independently regenerated the historical inventories and checked retained safety/ownership and handoff semantics; no WARN findings or required fixes.
- Next action: `/ship 39` on `main`.
  No actual synchronization, push or publication occurred; material-intake and omission observations remain for the next real synchronization's existing stage notes.

## Stage: Ship (2026-10-09T16:49:55Z)

### Session summary

Prepared trunk delivery on root `main` after a successful fast-forward-only pull and root lint/dead-code gates.
This checkpoint precedes the push, CI verification and issue closure; their results remain in the corresponding GitHub run and issue history.

### Observations

- The implementation range starts at the plan commit's parent, `0f52a5af5dc90b20ab4cf445e8df8a3015e6fb7d`.
  The title's contract change is in `b4423e0567d823cec3aa24314731ac2b1375d896`; `8348fea760630994b53ba3731d8fe00d0a3d7ee3` adds the plan-mediated reviewer handoff.
- The plan recommends independent delivery, but all changed paths are root documentation: no package publication or release dispatch is applicable.
  No additional issue/PR close targets or skipped-verification decision were found in the plan or prior stage notes.
- `pnpm run lint` and `pnpm fallow dead-code` passed on the implementation tree.
  Both origin fetch/push URLs target this fork, with no configured URL rewrites.
- Real-sync material-intake observations remain a next-sync requirement, not a claim of measured savings or a waived ship-time check.
  The next workflow action after successful delivery is `/retro 39` at the root on `main`.
