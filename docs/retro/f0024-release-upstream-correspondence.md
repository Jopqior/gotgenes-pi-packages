---
issue: 24
issue_title: "Include verified upstream correspondence in every fork package release"
---

# Retro: #24 — Include verified upstream correspondence in every fork package release

## Stage: Planning (2026-09-25T11:53:43Z)

### Session summary

Committed the repository-level implementation plan in `aee2258a6`, after a successful fast-forward-only pull, issue/context investigation, operator decisions, real-history checks, and a fresh Tidy First assessment.
The plan covers explicit package classification, verified release artifacts, an automatically written correspondence table, and approval-gated historical Release backfill.
No implementation, release dispatch, remote edit, or publication was performed.

### Observations

- The operator confirmed `fork` / `original` registration using actual package identities, with unregistered packages refused by mutating release entry points.
  `core` and `selector` are role shorthand, not provenance classes; conflating them made the first gate need clarification.
- The operator wants the tool to write the table in `docs/upstream-sync.md` directly, not another instruction to maintain it by hand.
  Historical backfill means adding evidence to existing GitHub Release bodies, previewing exact edits first and obtaining separate approval before application.
- Current state includes fork `4.0.1`, beyond the issue's original inventory, and its live Release also lacks the correspondence block.
  Verified real-object baselines are `21.7.0` for fork `1.0.0`–`1.0.2` and `21.7.3` for recorded later versions; retain the existing state schema and revalidate before adding old rows.
- Fork `1.0.0` is published on npm and has a local tag, but no GitHub Release exists; record its correspondence without creating a missing Release.
  The old `1.0.1` body contains a source-history restoration notice that must survive byte-for-byte, and restored tags must not be described as new attestations of old npm artifacts.
- CHANGELOG version headings collide with inherited upstream entries.
  The disposable scanner checked the real corpus and showed that exact fork comparison URLs distinguish generated sections; manual `1.0.0` and the selector's changelog-less `0.1.0` tag are explicit historical exceptions, not reasons to guess.
- Measured release baseline: `pnpm exec vitest run test/release` passed 9 files / 108 tests.
  Both published-package predictors report nothing pending, and real packing confirmed shipped README and CHANGELOG files.
  Plan Markdown lint passed, as did its commit hooks.
- Accepted Tidy First work extracts published correspondence and tail validation while retaining their separate original call positions and diagnostics.
  Add a failure-order characterization pin; do not call the current-window version decision to answer historical provenance.
- Existing decision fixtures use `@fixture` identities and upstream-version baseline manifests; new artifact tests need internally consistent fork identities/tags rather than a global fixture rewrite.
  The explicit preparation script-copy list must change with new imports/config, and its successful `demo` case must register an original fixture package.
- The existing missing-CHANGELOG branch discards the supplied section, and rendering currently follows manifest writes.
  Both are behavior changes to fix and test with the pipeline integration, not preparatory refactors.
- The next step is `/tdd-plan`; the plan ends with a real backfill preview and a separate remote-approval gate.
  A package README update needs later approved publication to reach npm, while repository tooling can land independently.

#### Deferred tidyings

- `test/release/core-sync.test.mjs` and its scenario helpers: broad fixture/describe restructuring was rejected; the change needs only narrow artifact setup and an error-order pin.
- `test/release/helpers/git-repository.mjs`: automatic copied-script dependency discovery was rejected; explicit transitive copy lists remain sufficient.
- `scripts/release/lib.sh`: restricting workspace enumeration or generic prediction to registered packages was rejected; registration gates belong to mutating release entry points.
- `scripts/release/release-correspondence.mjs` (planned): a generic evidence-adapter/plugin framework was rejected; unsupported future fork evidence must fail closed instead.

## Stage: Implementation — TDD (2026-09-25T14:47:13Z)

### Session summary

Completed the six planned code steps with characterization or Red/Green/mutation checks, the documentation and packing step, and the real read-only historical preview, using a fresh subagent for each step as requested by the operator.
Two corrective code cycles and a documentation correction followed the first independent review; the second pre-completion review returned PASS with all four root gates passing.
Measured full-suite totals increased from 7,584 to 7,673 passing tests (+89), entirely in the root script suite (279 to 368); no push, release dispatch, npm publication, or remote Release edit occurred.

### Observations

- New releases require explicit package registration and verified correspondence before preparation or publication effects; GitHub notes come from the exact tagged CHANGELOG section.
  The generated correspondence table and historical records are verified against real Git objects, and original packages do not receive upstream claims.
- The first attempted all-steps subagent was cancelled before startup.
  The operator required fresh per-step agents; implementation, corrective steps, and the operational preview followed that arrangement.
- Step 1's characterization pin confirmed window-error precedence over a bad baseline tail.
  Step 2's mutation checks exposed two initially weak ancestry probes, which were corrected before committing.
  Parent review of step 3 removed closed-world historical expectations that would reject future additive release records.
- Structural deviations: `release-artifacts.mjs` owns cohesive artifact preflight; `core-sync-scenario.mjs` gained an opt-in artifact mode instead of globally changing existing fixture identities.
  Separate view/table tests, a real historical Release fixture, and comment-only renderer guidance changes supplement the planned files.
  No package runtime, architecture roadmap, package manifest, lockfile, or historical CHANGELOG was changed.
- First pre-completion review: FAIL despite passing deterministic gates.
  It found a canonical-block suffix restriction that broke backfill no-ops, coercive JSON OID validation, and a mismatch between validated tags and the working tree actually published.
  It also found a non-mixed mixed-selection test, trimmed historical comparisons, an unregistered dispatch example, and a reviewer type whitelist narrower than `committed.toml`.
  The operator approved fixes and re-review rather than bypassing the findings.
- Corrective commits reject package checkout drift before publication, compare critical files byte-for-byte, preserve identical correspondence blocks anywhere in the body, enforce strict reviewed types and SemVer, and strengthen the mixed-selection and preservation tests.
  Documentation now uses registered identities without implying publication approval; the reviewer consults the actual commit-message policy, which permits the planned `build:` commit.
  Second pre-completion reviewer: PASS at `9ce186447`, with no outstanding warnings; the only later tracked edit is this stage note.
- Root test runs were kept separate from other heavy gates after concurrent checks caused transient fixture timeouts during step 4.
  Real package packing confirmed shipped README and CHANGELOG, and scratch prepared package notes matched captured GitHub notes byte-for-byte.
  Per-step commands and mutation results remain in `/tmp/f0024-step1-evidence.md` through `/tmp/f0024-step8-evidence.md`, with separate step 5–7 correction evidence files.

### Historical preview and approval status

- The real preview proposes notes-only additions to six existing core Releases: `pi-subagents-v1.0.1`, `pi-subagents-v1.0.2`, `pi-subagents-v2.0.0`, `pi-subagents-v3.0.0`, `pi-subagents-v4.0.0`, and `pi-subagents-v4.0.1`.
  The first two use verified upstream `21.7.0`; the remaining four use `21.7.3`.
  The original bodies, including the source-history restoration disclosure, remain unchanged prefixes; there are six proposed edits and zero no-ops.
- `pi-subagents-v1.0.0` has a tag but no Release and is reported missing, never created.
  Selector Releases, Release metadata, tags, historical packaged files, and npm artifacts are outside the edit scope.
  Remote tag refs were independently peeled and matched local objects; a second read-only preview matched the first snapshot byte-for-byte.
- Exact review artifact: `/tmp/f0024-step8-GaN2Jpp1/review.json`.
  Its SHA-256 is `6f36570735962df5ea7700da3b5539a823ca0a6ac76a9b9e70e40b9fbaf04cdb`.
  Before/after bodies and per-release diffs are in the same directory.
- The operator explicitly deferred approval and requested a human-readable HTML view instead of JSON.
  The resulting offline page is `/tmp/f0024-step8-GaN2Jpp1/review.html`; it shows the complete proposed additions and expandable original bodies, with no apply control.
  Its SHA-256 is `ff89e1112a03abe73d152ba709fe2398001a85e7e8172e754057326e46e94af8`.
  The HTML is a presentation of the unchanged JSON, not an authorization artifact.
- Historical backfill is NOT approved and NOT applied.
  The next workflow step is `/ship 24`; obtain explicit approval of the exact preview before any notes-only apply, and separate approval before any package publication.
  Temporary artifacts may disappear between sessions; regenerate and obtain fresh approval if missing or changed.
  Apply must revalidate the complete snapshot, and another editor can still race its final read; no multi-Release transaction or compare-and-swap guarantee is claimed.

## Stage: Ship (2026-09-25T15:24:59Z)

### Session summary

Shipped through the trunk lane from the root checkout on `main`.
The operator explicitly approved the unchanged historical preview, publication of `@jopqior/pi-subagents` to npmjs.org with GitHub Releases in this fork, and the exact issue-close comment.
Issue #24 is closed, the approved historical notes are applied, and `pi-subagents-v4.0.2` was released successfully.

### Observations

- The preview JSON and HTML remained available and matched the implementation-stage SHA-256 values.
  Applying the reviewed JSON revalidated and read back the selected remote notes; repeating apply also succeeded, exercising the completed-entry no-op path.
  The missing `1.0.0` Release was not created, and historical npm artifacts and tags were not changed.
- Root lint and dead-code checks passed before pushing the 13 implementation/planning commits.
  CI run `36153223363` passed for `910cd46f169ce84497c4a4bf145974a0c9bb6685`.
- The touched-package scan selected only `pi-subagents`; prediction returned `pi-subagents-v4.0.2`.
  Release run `36153868173` passed preparation, npm publication, and GitHub Release creation with the approved package and pinned SHA.
  A fast-forward pull retrieved the release commit and its `pi-subagents-v4.0.2` tag.
- No co-shipped issue, adopted PR, worktree cleanup, or roadmap phase closure applied.
  The breaking change is confined to release-tooling registration and artifact requirements; extension runtime APIs and core version calculation remain unchanged.
- The next workflow step is `/retro 24` at the root on `main`.

## Stage: Final Retrospective (2026-09-25T15:34:23Z)

### Session summary

Reviewed the planning, implementation, and ship transcripts alongside their stage notes and the implementation agents' final reports.
The work delivered verified release correspondence, approved historical notes-only backfill, and the published fork release; this retrospective changes no release artifacts or runtime code.
The main workflow lesson is to reconcile individual review findings across rounds instead of treating a delta-scoped PASS as a complete status ledger.

### Observations

#### What went well

- Independent review found cross-boundary defects despite green deterministic gates: tagged evidence was not bound to the working tree actually published, and newly generated notes did not satisfy the backfill no-op assumptions.
  The resulting commits, `fix(release): block dirty package artifacts before publication (#24)` and `fix(release): keep backfill idempotent and reject mistyped reviews (#24)`, corrected the consumers as well as their tests before any publication.
- Fresh per-step agents plus parent inspection exposed different weaknesses: step 2 mutations revealed weak ancestry probes, while parent inspection caught step 3's closed-world historical expectations before the next step.
  The separate final reviewer still added value rather than merely repeating the step reports.
- The operator deferred remote approval until the same immutable JSON snapshot had a readable HTML presentation.
  Ship later checked the saved hashes, applied the approved snapshot, read it back, and repeated apply to exercise completed-entry no-ops without recreating the missing historical Release.

#### What caused friction (agent side)

- `wrong-abstraction` — Planning introduced package-role shorthand (`core` / `selector`) while asking about provenance classes (`fork` / `original`).
  Impact: the operator needed terminology clarification and a second explanation before confirming the actual unknown-package rejection policy; no code rework resulted.
- `premature-convergence` — Implementation initially dispatched the entire TDD sequence to one agent before the operator specified fresh agents per step.
  Impact: the dispatch was cancelled before startup and replaced; no implementation was discarded.
  This was a newly supplied execution preference, not a violation of an already stated per-step requirement.
- `missing-context` — Step 5 validated tagged artifacts without binding the working tree consumed by publication, and its mixed-selection fixture did not actually select both packages at HEAD.
  Step 6 additionally assumed a suffix-only canonical block and allowed coercive OID validation.
  Impact: independent review required two corrective code cycles and renewed verification after the nominal implementation steps were complete.
- `instruction-violation` — Self-identified through independent review: historical suffix assertions used `trim` despite the plan's explicit byte-preservation requirement, and release guidance retained an unregistered dispatch example despite the planned documentation sweep.
  Impact: tests and documentation required corrections; the reviewer also discovered its own commit-type whitelist disagreed with `committed.toml`, which was repaired rather than rewriting a valid `build:` commit.
- `premature-convergence` — The implementation summary said there were no remaining FAIL or WARN findings without presenting the disposition of each first-round finding.
  The delta review did check the repaired defects, but the operational approval gate was distinct from those defects.
  Impact: the operator asked twice about review status; the parent then fetched the first report and reread the relevant guidance, publication tests, and retro before giving a warning-by-warning answer.
- `wrong-abstraction` — The first approval handoff exposed JSON and diff paths rather than a directly readable review page.
  Impact: approval was deferred and a separate HTML-generation agent was needed; the authorization artifact itself did not change.
- `other` — Concurrent heavy verification in step 4 coincided with upstream-sync fixture timeouts.
  Impact: the root script suite had to be rerun alone; subsequent gates were serialized rather than weakening assertions or increasing timeouts.
  The load explanation is the step agent's diagnosis, supported by a passing isolated rerun, not a controlled performance experiment.

#### What caused friction (user side)

- Stating the fresh-agent-per-step preference and the human-readable approval format at the implementation handoff could avoid the initial dispatch cancellation and late presentation work.
  The agent still owns explaining terminology and supplying usable decision material; the operator should not need to infer either from internal shorthand or file paths.
- The questions about old WARN findings were mechanical oversight the agent could have eliminated with a complete disposition list.
  Approval of exact remote edits and publication destinations, by contrast, remained appropriate operator judgment.

### Diagnostic details

- Model assignments were read from inline assistant labels in the saved transcripts, not agent definitions or current environment variables.
  The planning Tidy First assessor and both independent reviewers reported on `openai-codex/gpt-6-astra`.
  Each of implementation steps 1–7, the resumed step-3 correction, the publication correction, the backfill correction, the documentation correction, the step-8 preview, and the HTML presentation reported on `openai-codex/gpt-6-sol`.
  Parent planning, implementation, and ship turns inspected here used `openai-codex/gpt-6-astra`.
  No clear reasoning-capability mismatch follows from these results; the failed first review exposed integration assumptions, not evidence that a different model alone would prevent them.
  The bounded HTML conversion is a candidate for cheaper execution, but these transcripts do not establish comparative cost or quality.
- Feedback-loop gap: verification did not wait until the end; the baseline, per-step targeted runs, mutation checks, and integration gates are recorded before the final review.
  The missing feedback was at consumer boundaries and review-status handoff, not a general lack of test runs.
  The first-review report and final delta-review report should be reconciled before the next user-facing completion summary.
- No sustained rabbit-hole sequence was identified in the reviewed parent transcripts, so no escalation-delay count or unused Explore/Plan dispatch is claimed.
  The review-status follow-up used the already available `get_subagent_result` tool only after the operator questioned the summary; retrieving and reconciling that report earlier would have avoided the clarification.

### Proposal disposition

The operator chose notes only and declined the proposed workflow edit.
The proposal was a short reconciliation requirement in `.pi/skills/pre-completion/SKILL.md`: account for every earlier FAIL/WARN finding and state the latest review's scope before summarizing a re-review.
Retain this as an observation, not a new rule or a committed follow-up obligation.

Do not add duplicate terminology guidance: `.pi/skills/clarification-gates/SKILL.md` already requires terms and substance before choices.
Do not mandate HTML for every approval, change model defaults, or rewrite the TDD delegation policy from this one session's preferences.
The reviewer-policy mismatch was already repaired during implementation and needs no second retro patch.

### Next work

The issue plan explicitly identifies repository tooling rather than a package roadmap step, and names no successor.
The newest inherited triage, `docs/triage/2026-09-18-backlog.md`, concerns upstream work, not an approved fork queue.
A live `gh issue list --repo Jopqior/gotgenes-pi-packages --state open` returned no issues; there is no fork issue or phase-close command to recommend from this delivery.

### Changes made

1. Appended the cross-session final retrospective, diagnostic findings, proposal disposition, and next-work check to `docs/retro/f0024-release-upstream-correspondence.md`.
2. Honored the operator's notes-only decision: no changes to `AGENTS.md`, prompts, skills, code, tests, or release artifacts.
