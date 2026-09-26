---
issue: 28
issue_title: "Review sync rules and require approval for uncovered resolutions and extra changes"
---

# Retro: #28 — Review sync rules and require approval for uncovered resolutions and extra changes

## Stage: Planning (2026-09-26T11:56:12Z)

### Session summary

Committed the repository-level implementation plan in `docs/plans/f0028-sync-approval-policy.md` as `6699f7e34`.
Inspected the existing synchronization handbook, script, adjacent instructions, original rule provenance, and the recent integration's parent and worker/reviewer transcripts alongside Git diffs.
The next stage is `/build-plan` for individual rule deliberation, not synchronization or code implementation.

### Observations

- The operator confirmed `scope:repo`, deferred individual retain/change/remove decisions to `/build-plan`, and selected the unified `/upstream-sync` prompt as the sole active policy home.
  The review queue is not a batch approval of existing rules.
- The operator explicitly requested consideration of practices from the just-completed synchronization.
  The plan includes remerge-diff accounting, independent review, manifest-derived workspace identity, and publication visibility rechecks as candidates, not approved standing instructions.
- The operator rejected overloading stage retros with approval records, then agreed to separate rule-review history, per-sync execution/approval records, and stage summaries.
  Record paths and layout remain to be coordinated with [#27]; no new ledger format was imposed during planning.
- Issue [#27] owns workflow activation, cleanup, handbook deletion, and data/consumer migration; [#29] owns release-mechanism naming and organization.
  Review decisions can land first, but this issue's integration criterion remains pending until the actual unified workflow is checked.
- The real script can commit a conflict-free merge automatically and its no-argument mode configures the remote and fetches objects.
  The proposed policy gates authored resolutions and extra adaptations rather than promising a new pre-merge runtime interception mechanism.
- The earlier synchronization section was visible with `read_session_file` using `branches: "all"`, but not in the initial default transcript view.
  The plan records the parent session identifier and durable commit evidence so future review does not rely solely on an assistant's historical summary.
- Tidy-First and the interface/extraction design checklist were inapplicable: this plan authors no `src/` or `test/` changes.
  No runtime tests, upstream merge, push, publication, or GitHub mutation were performed; plan Markdown lint and commit hooks passed.

[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
[#29]: https://github.com/Jopqior/gotgenes-pi-packages/issues/29
