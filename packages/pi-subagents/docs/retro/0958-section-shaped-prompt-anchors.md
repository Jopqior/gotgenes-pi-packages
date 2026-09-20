---
issue: 958
issue_title: "pi-subagents: the relocated-child project-context cut (#918) never fires on pi ≥0.86 section prompts — relocated children inherit the parent's absolute-path context block"
pr: 959
---

# Retro: #958 — the relocated-child project-context cut never fires on pi ≥0.86 section prompts

## Stage: PR Review (2026-09-20T20:59:00Z)

### Session summary

PR [#959] from @georgeharker teaches `session/prompts.ts`'s session-resolved-tail anchors to recognize pi ≥0.86's section-shaped system prompt, so [#918]'s relocated-child `<project_context>` cut fires again.
The defect was confirmed against real 0.86.1 prompt bytes on current `main`, not against the PR's narrative: a relocated child inherits the parent's `<project_context>` block naming the parent's files by absolute path, and every 0.86 child — relocated or not — inherits a dangling, unclosed `<skills>` open tag.
The operator chose **adopt mostly as-is**: merge the PR, then land follow-up commits on top for the two naming and comment nits.

### Evaluation

#### The defect is real, live, and reachable

I generated a parent prompt from the actual 0.86.1 dist rather than a hand fixture — a scratch `pnpm install @earendil-works/pi-coding-agent@0.86.1`, calling `buildSystemPrompt` directly — and confirmed all three deltas the PR claims. pi 0.86 renders the cwd as a `<cwd>` section (no `Current working directory:` footer), wraps the catalogue in a `<skills>` section, and drops the blank line below `<project_context>`'s opening tag so the lead-in sits at `openAt+1`.
Cross-checked against pi's own source at `../pi`: `buildSystemPromptSections` wraps each section as `<name>\n…\n</name>` and `getSystemMessageText` joins them with `"\n\n"`.

Fed through current `main`'s `buildAgentPrompt` with a relocated child, the child prompt came back carrying the parent's full `<project_context>` block naming `/parent/AGENTS.md`, plus an unclosed `<skills>` tag — the latter on *every* 0.86 child, because the cut lands on the heading inside the wrapper rather than on the wrapper.

Reachability is not hypothetical: `pi --version` reports 0.86.1, and `.pi/settings.json` loads `pi-subagents-worktrees`, the `WorkspaceProvider` that creates relocated children.
The peer range is `>=0.81.0`, unbounded above.
Not already fixed — `main`'s `prompts.ts` has no `<cwd>` handling at all.

#### Checks, run in a scratch worktree rather than trusted

`pnpm run check` passes for all 9 packages; `pnpm run lint` is clean across Biome (713 files), ESLint (1220 files), and `rumdl`; the `pi-subagents` suite is 1803/1803 across 79 files.
The 4 `test/config/custom-agents.test.ts` failures the contributor reported did not occur here, confirming his read that they are an ambient `PI_CODING_AGENT_DIR` leak rather than a code defect.

Killing mutation verified independently: replaying `main`'s `prompts.ts` under the PR's test file fails exactly 5 of the 7 new tests, matching the contributor's claim.
The PR branch also handles the **real** 0.86.1 prompt bytes for both the relocated and same-cwd cases, not merely its own fixtures.

#### Approach

Sound and idiomatic, which is why it clears the usual third-party bar.
Dispatch is on *which cwd layer is present*, never a version check, and it lives at one point (`tailStart`) — OCP's decide-once.
`cwdSectionStart` applies the same whole-line content discipline the 0.85 footer anchor uses, and `skillsSectionWrapperStart` validates the wrapper by pi's own heading before cutting at the opening tag.
No speculative generality, no over-wide threading, no new parameters on a shared interface; the four new constants match the existing `SKILLS_CATALOGUE_CLOSE` / `PROJECT_CONTEXT_OPEN` convention.

Two nits, both for follow-up commits rather than a request-changes round:

1. `tailStart(lines, parentCwd)` is declared directly below `sessionResolvedTailStart(lines, parentCwd, cutProjectContext)` — two names that do not distinguish two functions.
   Rename (`cutAnchor`, `layerAnchor`) or fold it back in.
2. `projectContextStart` now accepts the lead-in at `openAt+1` **or** `openAt+2`.
   Correct, but the `+2` arm becomes dead the moment the peer floor moves past 0.85; it needs a note so it is removed rather than inherited.

The hand-built 0.86 fixtures are the right call, not a shortcut: `buildSystemPromptSections` is absent from 0.86.1's public exports (checked `dist/index.d.ts`), so no test can route through pi's real section renderer.
The skills layer still goes through the exported `formatSkillsForPrompt`.

Not breaking — the ≤0.85 path is byte-identical and behavior changes only on 0.86, where it is broken today.
`fix:` is the correct type.

#### Two adjacent defects, both filed out

Same root cause, different code paths, both verified live and both deliberately kept out of [#959]'s diff:

- [#961] — `session/project-context.ts`'s `renderProjectContext` still emits the ≤0.85 block shape (a blank line below the opening tag and above the closing tag, neither of which 0.86 writes), while its doc comment claims byte-identity with pi's block.
  Its consumers are exactly the relocated and `portable` children this issue is about.
  `pi-subagents` has no open improvement phase, so `roadmap-fit` recorded nothing.
- [#962] — `@gotgenes/pi-permission-system`'s `exposure/tool-surface-prompt.ts` anchors on `Current working directory: `, `Available tools:`, and `Guidelines:`, none of which 0.86 writes (it writes `<cwd>`, `<tools>`, `<rules>`).
  The relocation is therefore a no-op and a session sees pi's unfiltered tool list above the narrowed block — the live witness being this session's own system prompt.
  Dispositioned **out of scope** for pi-permission-system Phase 15 on [#890]'s precedent for the same `exposure/` module, recorded in that roadmap's sweep list.

`packages/pi-nocd/src/working-directory-prompt.ts` mentions the footer only in a doc comment; its code is heading-anchored and unaffected.

### Decision and attribution

**Direction: adopt mostly as-is.**
Merge [#959] as the implementation of [#958], then land follow-up commits on top for the two nits above (the `tailStart` naming collision and the dead-arm note on `projectContextStart`).
This departs from the usual adopt-with-simplified-design default because the diff already is the simplified design: it is minimal, convention-fitting, independently verified against real 0.86.1 bytes, and carries a test suite with a confirmed killing mutation.

**Landing plan.**
The PR has `maintainerCanModify: true` and is a single commit on `georgeharker:pi-subagents-086-section-anchors`, so the follow-ups are pushed **to that branch** rather than to `main` after the fact.
The PR then rebase-merges (`gh pr merge --rebase`), which keeps `main` linear, preserves per-commit authorship, and never puts the nits on `main` at all.
A fork PR's workflow runs sit at `action_required`, so each push needs a maintainer approval before CI reports.
The first real push is also what confirms the write actually lands: `maintainerCanModify` is the evidence, and a `git push --dry-run` that reports `Everything up-to-date` is not.
A PR comment should say what we pushed and why, so the branch edit is not a surprise.

Execution is handed to a fresh session rather than done here; this session's scope ends at the recorded decision.

**Non-goals**, each tracked elsewhere: the `renderProjectContext` block-shape drift ([#961]), the pi-permission-system tool-surface anchors ([#962]), and the `pi-nocd` doc-comment staleness (not filed; doc-only).
The companion `pi-claude-bridge` change the PR describes is external and moves on its own schedule.

**Attribution.**
Every follow-up commit on top of the merge carries, after a blank line at the end of the body:

```text
Co-authored-by: George Harker <george@george-graphics.co.uk>
```

The close comment on [#959] thanks @georgeharker by name and links the merged and follow-up SHAs.
Never `Closes #959` in a commit message — reference it as `Refs #959` / `(#959)` so the curated close comment is not pre-empted.

[#890]: https://github.com/gotgenes/pi-packages/issues/890
[#918]: https://github.com/gotgenes/pi-packages/issues/918
[#959]: https://github.com/gotgenes/pi-packages/pull/959
[#961]: https://github.com/gotgenes/pi-packages/issues/961
[#962]: https://github.com/gotgenes/pi-packages/issues/962
