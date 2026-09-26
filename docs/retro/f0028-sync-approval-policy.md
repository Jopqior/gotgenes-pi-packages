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

## Stage: Implementation — Build (2026-09-26T15:25:52Z)

### Session summary

Completed plan steps 1–3 through operator deliberation and committed the inventory, dispositions, and handoff in `docs/sync/reviews/f0028-sync-approval-policy.md`.
The implementation produced 12 commits before this stage note, ending with `022ef0376`; the plan now links the decisions, approved review adjustments, manual acceptance walkthrough, and blocked activation criterion.
Step 4 remains pending [#27], whose workflow was absent at the final inspection; no synchronization, push, publication, or issue closure occurred.

### Observations

- The operator favored concise dispositions over preserving obsolete recipes and explicitly approved grouped removal of selector implementation details, historical compatibility material, and duplicated release responsibilities.
  These approved changes to review granularity are documented in the review record rather than treated as blanket inheritance.
- Non-customized upstream packages and their supplied wiring merge as supplied; extra agent-authored loading/README wiring remains gated, while the specifically approved form/label additions have narrow coverage.
  The review record owns exact bounds and answer provenance, not this retro.
- Calling `/upstream-sync` itself requests synchronization; the first gate's wording incorrectly suggested a redundant start confirmation and was clarified.
  An elaboration response omitted other selections, which were recovered explicitly rather than inferred.
- The operator requested SSH and HTTPS support, but the current script is SSH-only.
  Issue [#27] must coordinate transport support, complete repository-identity checks, tag-name/object comparison, and topology handling; this documentation stage changed no script, runtime, test, or active-policy files.
- Routine installation remains permitted within bounds; exact rumdl cache cleanup after moves requires no separate report.
  Release contribution classification is a reviewed input, while final version calculation remains script-owned; that distinction was verified against the actual recorder and decision code after an operator question.
- Fresh-context review ran `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm fallow dead-code`; all passed.
  The reviewer found no blocking defect in steps 1–3, but returned **Overall: FAIL** because the whole issue's workflow-integration acceptance criterion is unmet.
  It did not independently verify local operator transcript quotations or execute a real synchronization.
- The operator explicitly accepted this partial handoff despite the overall FAIL and authorized recording the incomplete integration status.
  This is not an override of the missing criterion: do not close the issue or run an ordinary closing `/ship 28`; after [#27] and naming coordination with [#29], inspect the actual workflow, repeat acceptance scenarios, verify migration/deletion, and obtain a fresh final review.
