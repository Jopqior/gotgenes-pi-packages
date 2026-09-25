---
issue: 961
issue_title: "pi-subagents: renderProjectContext still emits pi ≤0.85's block shape, so a relocated child's own project context no longer matches Pi's"
---

# Retro: #961 — pi-subagents: renderProjectContext still emits pi ≤0.85's block shape

## Stage: Planning (2026-09-25T06:06:43Z)

### Session summary

Checked the issue's claim against pi 0.86.1's real `buildSystemPrompt` (scratch install), the 0.87.1 tarball, and Pi's `main` checkout: all three write the section-shaped block.
The operator chose to emit the ≥0.86 shape unconditionally, with no shape dispatch, and to fold in a sibling gap: `buildPortablePrompt` omits 0.86's `<addendum>` wrapper.
The plan has three steps: decouple the fixture (`test:`), then a `fix:` for each function.

### Observations

- The planning measurement that shaped the TDD order: the ≤0.85 fixture `parentPrompt()` in `test/session/prompts.test.ts` builds its block by calling `renderProjectContext`.
  Today, deleting `projectContextStart`'s `openAt + 2` lead-in arm turns 6 tests red; with the replica switched to 0.86 shape, the same deletion leaves all 74 green.
  Step 1 hand-builds the 0.85 block so those 6 pins survive, and steps 1 and 2 re-run that mutation.
- Rejected the dispatch-on-parent-shape option, which would reuse #958's cwd-layer rule.
  It would change the `ProjectContextLoader` signature and add an arm that dies once the floor passes 0.85, all for a two-blank-line difference nothing reads.
- Other readers were checked in source, and none parses a child's own block or its portable identity:
  - pi-permission-system's `LATER_PI_SECTION_OPENS`: on a portable child, `<addendum>` now protects a `<tools>` section quoted in the appended text, which is a mild improvement.
  - pi-anthropic-auth passes a portable child through untouched, since it has no Pi-owned sections.
  - pi-claude-bridge keys a child's capture on the child's exact prompt.
  - Aside: the bridge's own `formatProjectContext` still writes the ≤0.85 shape, which is the bridge's concern.
- The tidy-first assessor recommended only the fixture decoupling (step 1).
  Its report misstated the direction of the 6-red measurement: the 6 go red today, and all 74 stay green without the prep.
  The plan records the measured version.
- ADRs 0009/0010 are left unedited as historical records.
  Only the `project-context.ts` module-tree entry in `architecture.md` changes.

## Stage: Implementation — TDD (2026-09-25T08:29:53Z)

### Session summary

All three planned steps landed as separate commits.
First the `test:` step decoupled `parentPrompt()` from `renderProjectContext`.
Then came the two `fix:` steps: the child's own block now uses pi 0.86's shape, and a portable child's appended prompt is wrapped in `<addendum>`.
The `pi-subagents` suite went from 1830 to 1831 tests, the one addition being the append-only portable case.

### Observations

- Every killing mutation the plan named turned its tests red.
  Deleting the `openAt + 2` lead-in arm turned the same 6 tests red after both step 1 and step 2, so the ≤0.85 arm is still pinned.
- In step 3, mutation (b) (wrap the append unconditionally) turned 4 tests red instead of the plan's 2.
  The plan named "omits a section whose input is absent" and the whitespace-only test.
  Two more absence tests also caught it: "is undefined when the captured options carry no operator-authored parts" and "carries no project context…".
  That is a superset of the prediction, not a gap.
- Emitting `≥` in `Edit` bodies failed twice: once it came out as a tab plus stray text in a doc comment, once as a tab in a test comment.
  Both were caught by scanning with `rg -n '\t'` and reworded ("pi 0.86 and later").
  Where the character did survive (the test name, the architecture entry), it was written by `perl` or emitted correctly.
- In `renderProjectContext`, the outer variable was renamed from `content` to `body` so it does not shadow the destructured `content`.
- Pre-completion reviewer: PASS.
  It re-derived both shapes on its own: the 0.86.1 tarball for the new shape, and the pinned 0.84.4 dist for the fixture's byte-identity.

## Stage: Sync (worktree) (2026-09-25T18:56:30Z)

### Session summary

Pre-push checks are clean: `pnpm run lint` and `pnpm fallow dead-code` both pass with no findings.
The plan's `**Release:** ship independently` marker stands — no roadmap step names this issue, nothing to defer.

**Peer session transcript:** `/Users/chris/.pi/agent/sessions/--Users-chris-development-pi-pi-packages-worktrees-issue-961--/2026-09-25T05-32-23-190Z_01a0d70c-eb15-76fa-9d8e-b4a7d1241a7f.jsonl` — read with `read_session_file({ path: "<path>" })` for message-level verification at land/retro time.

### Observations

Nothing further to flag; the branch is ready for the root's `/ship 961` once this rebase lands.
