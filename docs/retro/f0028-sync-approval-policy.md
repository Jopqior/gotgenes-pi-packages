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

## Stage: Final Retrospective (2026-09-27T14:42:05Z)

### Session summary

Reviewed the issue-28 planning and build transcripts, its three worker/reviewer transcripts, the activation record, and the issue-27 ship transcript and retrospective.
Issue 28 completed through issue 27: `feat!: require approval for uncovered upstream integration changes (#27)` activated the policy, subsequent review corrections tightened it, and the operator approved the exact issue-28 close comment during `/ship 27`.
The earlier blocked stage entries remain historical checkpoints, not current blockers; this retrospective changes no synchronization policy or runtime behavior.

### Observations

#### What went well

- The partial-delivery gate distinguished a useful handoff from completed acceptance: the build reviewer returned overall FAIL for missing activation despite passing deterministic checks and accepted review content.
  The operator explicitly accepted only the handoff; later activation, corrective reviews and closure happened through issue 27 rather than treating the earlier green checks as completion.
- Scoped group removals reduced the obsolete selector, compatibility and release material without silently retaining its authority.
  The operator approved the grouping change, and the decision record retained sources and answer provenance while leaving obsolete recipe bodies in Git.
- When an elaboration response did not return the other selections, the agent recovered those decisions explicitly instead of inventing approvals.
  This exercised the missing-evidence boundary during the policy's own deliberation.

#### What caused friction (agent side)

- `wrong-abstraction`: planning proposed storing continuing approval records in the stage retro.
  The operator challenged the retrieval burden; the revised design separates rule-review history, per-sync execution records, stage summaries and the active workflow.
  Impact: an extra design clarification before writing the plan, with no committed ledger migration.
- `scope-drift`: the build discussion initially favored retaining a feature-worktree reference and considered separate adoption decisions for unmodified upstream packages.
  The operator redirected both: unrelated landing guidance was removed, and upstream-supplied packages/wiring were distinguished from agent-authored extra wiring.
  Impact: additional gates and amendments to the recorded N01/N02 bounds; the operator spent attention removing scope the agent had introduced.
- `wrong-abstraction`: the source-by-source inventory became the default discussion shape even for obsolete recipes and repeated responsibilities.
  After the operator asked about existing prompt conventions, the agent read `sync-worktree.md`, `ship-no-issue.md` and `audit-agent-docs.md`, then moved toward concise deletion dispositions and approved group removals.
  Impact: avoidable detailed deliberation and a later compression pass over `docs/sync/reviews/f0028-sync-approval-policy.md`.
- `missing-context`: the E03 contribution-level gate preceded a sufficiently clear explanation of the distinction between a reviewer-supplied release input and the script-calculated final version.
  An operator question prompted a grep and reads of the then-current `core-sync.mjs` and `record-core-sync.mjs` before the distinction was explained.
  Impact: three follow-up inspection calls and a clarification; no release algorithm or version was changed.
- `other` (redundant start wording): the S01 briefing made invoking `/upstream-sync` sound as though it might require another confirmation to begin.
  The operator questioned it, and the agent clarified that invocation already requests synchronization while uncovered edits still need approval.
  Impact: added clarification and recovery of the other unanswered selections, not an actual extra synchronization gate.
- `other` (exact-edit mismatch): two late build edits failed to match and each was recovered by one read or grep followed by a corrected edit.
  Impact: local tool-call overhead, without a prolonged retry loop or lost approved decisions.

#### What caused friction (user side)

- Stating the broad preference for removing obsolete recipes and accepting non-customized upstream content at the start could have shortened deliberation.
  The agent should first offer that high-level framing with concrete examples rather than require the operator to discover and correct its overly granular default.
- Questions about record ownership and release calculation were useful strategic interventions, not missing operator homework.
  The opportunity is for the agent to explain those responsibility boundaries before presenting choices; mechanically confirming every inherited sentence is not the goal of explicit approval.

### Diagnostic details

- Type-unfiltered transcript labels identify `openai-codex/gpt-6-astra` for issue-28 planning/build orchestration and all three build subagents: read-only rule inventory, decision-record compression/handoff, and independent pre-completion review.
  Inventory classification and compression both required preserving authorization semantics, so neither was merely formatting; no observed result establishes a model-quality mismatch or measured cost advantage for a different model.
- Verification was incremental: build checkpoints repeatedly ran `pnpm run lint` and `git diff --check`, the handoff also ran `pnpm run check`, and the independent reviewer ran the complete deterministic gates.
  The missing feedback was explanatory context before E03 and scope framing before the detailed inventory, not tests deferred until the end.
- No observed build error persisted beyond five consecutive calls on the same failed approach.
  The late exact-edit failures changed strategy immediately; the E03 inspection was a short evidence check, not a rabbit hole.
- The unused-tool opportunity was earlier use of the already-available record and prompt conventions, not another generic exploration dispatch.
  A read-only inventory worker was already used; more inventory alone would not fix an over-granular decision frame.
- Activation-review defects and release readback behavior belong to the detailed issue-27 retrospective in `docs/retro/f0027-unified-upstream-sync.md`; they are not reclassified as new issue-28 implementation failures here.
  The current activation record retains earlier FAIL/pending statements as historical evidence, while the later issue-27 review and approved close comment establish the eventual outcome.

### Proposed disposition

Keep this retrospective as the only new artifact change.
Existing `clarification-gates` already requires substance and mechanism context before questions, `reading-artifacts` already separates historical scope from durable authority, and the active sync workflow already owns the confirmed approval boundary.
Do not add duplicate instructions to `AGENTS.md`, rewrite historical plans as though their blocked checkpoints never occurred, or generalize this issue's deliberate rule inventory into a permanent per-sentence approval requirement.
The later issue-27 retrospective already revised release recovery and publication-completion guidance; this issue's historical decisions do not override that newer active policy.

### Next-work context

This repository-level issue has no package roadmap successor; its integration dependencies 27 and 29 are closed.
The latest triage, `docs/triage/2026-09-18-backlog.md`, ranks inherited `gotgenes/pi-packages` work rather than the fork backlog.
The live fork query shows issues 25 and 26 open, but neither has a rank in that triage, so this retrospective assigns no inherited priority or phase-close obligation to them.

### Changes made

1. Appended the cross-session synthesis, diagnostic findings and eventual activation/closure context to `docs/retro/f0028-sync-approval-policy.md` without replacing earlier stage entries.
2. The operator selected “仅提交复盘”; no `AGENTS.md`, prompt, skill, runtime or historical approval record was changed.
   Validation uses repository lint and `git diff --check`; runtime tests are not rerun for this retrospective-only change.
