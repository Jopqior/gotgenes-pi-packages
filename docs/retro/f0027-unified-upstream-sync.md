---
issue: 27
issue_title: "Add a unified upstream-sync workflow and remove redundant artifacts"
---

# Retro: #27 — Add a unified upstream-sync workflow and remove redundant artifacts

## Stage: Planning (2026-09-27T11:12:04Z)

### Session summary

Committed the numbered implementation plan at `docs/plans/f0027-unified-upstream-sync.md` as `a3dbdf2544f305adecb3859b1b93da83b931833c` after the required fast-forward-only pull reported the checkout current.
Read the completed issue-28 rule-review handoff, issue-29 release-tooling handoff, actual sync/release scripts and tests, active consumers, and Pi prompt-template documentation.
The next stage is `/tdd-plan`; no implementation, upstream fetch/merge, remote change, push, publication, or GitHub mutation occurred.

### Observations

- The operator selected `invocation=no_args`, `script_scope=harden_here`, and `baseline_test=include`.
  The workflow will recover from matching execution records, stop on fast-forward-only topology, and include the newly observed migration-test failure as its first preparatory step.
- Issue 28 has finished deliberation but remains open for activation acceptance; its historical review is not an active policy source.
  Issue 29 is closed, and release correspondence/guidance already have release-owned homes, so this plan does not repeat that migration or change release algorithms.
- Measured baseline: the release/upstream-sync suite returned 244 passing tests and one failure; the isolated migration test reproduced the same failure because the live state legitimately gained the published `pi-subagents-v4.0.4` record.
  The plan preserves exact historical entries and permits append-only growth rather than editing evidence or hiding the failure.
- The current HEAD's CI run reports failure, but its logs were not inspected and no CI root cause is claimed.
  The correspondence check passed; both registered package predictors reported no pending release at the planning baseline; read-only registry and GitHub queries confirmed the existing fork publication.
- The Tidy-First assessor recommended the migration-test correction and explicit canonical remotes in the scratch-network fixture.
  The parent read the real fixture: it currently leaves upstream absent and retains a local filesystem origin, which the new complete-identity guard must reject.
- Default script execution is mutating discovery, and recording also fetches; the plan preserves those facts rather than describing either as offline.
  Script protections remain separate from human authorization, with an expected-upstream OID guard preventing a second fetch from silently changing the inspected merge target.
- Cleanup removes obsolete recipes rather than re-archiving them, retains technical selector trials as bounded package evidence, migrates factual sync rows without invented approvals, and deletes the consumed issue-29 handoff.
  A pointer-only handbook stub exists for one intermediate implementation checkpoint, then is deleted with the final package navigation changes.
- Package README changes remain in a separate documentation commit from repository-workflow breaking commits so the latter do not imply package API breakage.
  Publication remains independently approved; this planning session authorizes none.
- A read-only command initially treated `readReleasePackages()` as an array; the corrected command uses its `.packages` field and was rerun successfully before the plan recorded it.
  Markdown lint and plan commit hooks passed.

#### Deferred tidyings

- `test/upstream-sync/helpers/upstream-network.mjs` and release fixtures: cross-fixture consolidation would mix different test lifecycles and is not needed for the targeted guards.
- `scripts/upstream-sync.sh`: a generic URL-validator abstraction would obscure the distinct fixed repository roles; use narrow local checks instead.
