---
issue: 5
issue_title: "fork 文档编号改用 f 前缀，规避与上游 plans/retros 编号冲突"
---

# Fork plan/retro filenames use an f prefix

## Release Recommendation

**Release:** ship independently

Repo-level convention for this fork's `docs/plans/` and `docs/retro/` filenames, plus prompt/skill/script lookup.
No package roadmap step references this issue, and no package `src/` changes, so `/ship` names no package.

## Problem Statement

This fork inherited upstream plan/retro files numbered `NNNN-<slug>.md` (root `0101`–`0894`, `packages/pi-subagents` through `0898`).
Fork issues start at 1, so fork issue 48 would collide with `packages/pi-subagents/docs/plans/0048-implement-subagents-api.md`, and a directory listing cannot tell fork numbers from upstream numbers.
Only two fork files exist today (`docs/plans/0001-spawn-model-selection.md` and `docs/retro/0001-spawn-model-selection.md`), so the rename is cheapest now.

## Goals

- Name every new fork-issue plan/retro `f%04d-<slug>.md` (example: `f0001-spawn-model-selection.md`).
- Rename the two existing fork `0001-` files to `f0001-`; leave frontmatter `issue: 1` unchanged.
- Teach every create and lookup site the same rule: create as `fNNNN-`; look up `fNNNN-` first and use `NNNN-` only when no `f` match exists (inherited files).
- Clear the rumdl cache after the rename (MD057 depends on neighboring filesystem state; `gotgenes/pi-packages#879`).

## Non-Goals

- Renaming inherited `NNNN-` plan/retro files, including package-local `0001-` artifacts (`pi-autoformat`, `pi-subagents-worktrees`, `pi-nocd`, `pi-permission-system`).
- Changing ADR filenames (`docs/decisions/NNNN-<slug>.md`) or the `[ADR-NNNN]` citation rule.
- Changing `/ship` plan location (`grep -rl "^issue: $1$"`); that path is already frontmatter-keyed.
- Rewriting historical path strings inside existing retro bodies (the `#1` planning note that cites `docs/plans/0001-spawn-model-selection.md` remains a record of what was committed).
- Changing `markdown-conventions` issue-URL host from `gotgenes/pi-packages` to this fork.
- Implementing [#2] (upstream sync); this issue should land first so `#2`'s `/plan-issue` does not emit `0002-`.
- Adding a test harness for `scripts/issue-context.sh`.

## Background

Measured lookup of integer `1` today (unprefixed glob) returns a mix of fork and inherited files:

| Kind             | Paths                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork plan        | `docs/plans/0001-spawn-model-selection.md`                                                                                                                                                                                              |
| Inherited plans  | `packages/pi-autoformat/docs/plans/0001-initial-implementation-plan.md`, `packages/pi-subagents-worktrees/docs/plans/0001-publish-worktrees-package.md`                                                                                 |
| Fork retro       | `docs/retro/0001-spawn-model-selection.md`                                                                                                                                                                                              |
| Inherited retros | `packages/pi-nocd/docs/retro/0001-create-pi-nocd-extension.md`, `packages/pi-permission-system/docs/retro/0001-external-directory-integration-tests.md`, `packages/pi-subagents-worktrees/docs/retro/0001-publish-worktrees-package.md` |

Measured lookup of integer `5` today returns only `packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md`.
`/build-plan 5` and `/tdd-plan 5` would therefore open an inherited plan, not this one, until lookup prefers `f0005-`.

`/ship` locates plans with `^issue: $1$`.
That grep already matches multiple files for `1` (fork `0001` plus inherited `packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md`, whose frontmatter is `issue: 1`).
This issue does not fix that collision.

Tidy-First is skipped: no `src/` or `test/` files.
Design-review checklist is skipped: no shared TypeScript interface or layer wiring.

## Design Overview

Canonical rule (copy into prompts, skills, `AGENTS.md`, and `README.md`; do not paraphrase into conflicting variants):

1. **Create** (fork issue `N`): filename is always `f` + four-digit zero-padded `N` + `-` + slug + `.md`.
   Do not pick "the next free `NNNN`" among inherited files.
2. **Look up** by issue number: glob `fNNNN-*` first in both `docs/{plans,retro}/` and `packages/*/docs/{plans,retro}/`.
   If any regular file matches, use only those matches.
   If none match, glob unprefixed `NNNN-*` (inherited upstream files).
   Short-circuit, not union — otherwise `/build-plan 5` would still see the github-tools `0005` beside `f0005`.
3. **Extract** the issue number from frontmatter `issue:` first.
   Filename patterns are `fNNNN-` or `NNNN-`.
4. **Frontmatter** `issue: N` stays the numeric fork issue.
   `/ship` plan grep is unchanged.

`scripts/issue-context.sh` is the only executable lookup.
Today it unions `packages/*/docs/{plans,retro}/"${PADDED}"-*.md` and `docs/{plans,retro}/"${PADDED}"-*.md`.
After this change it must short-circuit as above (add `f${PADDED}-*` loops, run them first, fall back only when empty).
Unmatched globs stay safe: the script already guards with `[[ -f "$f" ]]`.

This plan file is already `docs/plans/f0005-fork-plan-retro-prefix.md` so implementation does not rename it.
Until step 1 lands, `/build-plan 5` still resolves to the github-tools `0005`; invoke `/build-plan` with this path.

Rejected alternatives (issue body): five-digit names starting at `10001` (glob-compatible, but far from the issue number); a `fork/` subdirectory (every `plans/NNNN-*.md` glob is single-level and would silently miss).

## Module-Level Changes

### Rename

| From                                       | To                                          |
| ------------------------------------------ | ------------------------------------------- |
| `docs/plans/0001-spawn-model-selection.md` | `docs/plans/f0001-spawn-model-selection.md` |
| `docs/retro/0001-spawn-model-selection.md` | `docs/retro/f0001-spawn-model-selection.md` |

Use `git mv`.
Do not edit frontmatter.
After the rename, `find .rumdl_cache -type f -delete`.

### Lookup and create wording

Replace "pick the next free `NNNN`" / "find `NNNN-*.md` matching that integer" with the canonical rule in:

- `.pi/prompts/plan-issue.md` — opening path sentence, gather-context numbering, retro search, write-plan path, stage-note path.
- `.pi/prompts/tdd-plan.md` and `.pi/prompts/build-plan.md` — locate-by-number, filename issue extraction, retro search, "same `NNNN-<slug>` as the plan file".
- `.pi/prompts/retro.md` — find plan, retro path, append path.
- `.pi/prompts/retro-note.md` — retro search glob.
- `.pi/prompts/pr-review.md` — retro path; keep "issue the PR addresses, not the PR number".
- `.pi/prompts/sync-worktree.md` — "same slug as the plan file" (stem may be `fNNNN-` or `NNNN-`).
- `.pi/prompts/ship.md` — retro glob only (`docs/retro/NNNN-*.md` matching the plan's stem); leave the `^issue: $1$` plan grep.
- `.pi/prompts/plan-improvements.md` — the sentence that contrasts phase retros with issue-keyed `NNNN-<slug>.md`.
- `.pi/skills/markdown-conventions/SKILL.md` — add the filename rule under Documentation frontmatter; do not touch ADR `NNNN` bullets.
- `.pi/skills/pre-completion/SKILL.md` — issue-from-filename pattern and plan-path glob.
- `AGENTS.md` — fork-scope section (canonical, takes precedence) and the inherited "writes `docs/retro/NNNN-<slug>.md`" line.
- `README.md` — the stage-bridge sentence that names `docs/retro/NNNN-<slug>.md`.

### Script

- `scripts/issue-context.sh` — short-circuit `f${PADDED}` then `${PADDED}` for both plan and retro loops.

### Predicted unchanged

| File                                                  | Claim                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `.pi/prompts/finish-phase.md`                         | No issue-keyed `NNNN-` glob.                                    |
| `.pi/prompts/ship-no-issue.md`                        | No plan/retro filename glob.                                    |
| `.pi/prompts/triage-backlog.md`                       | Directory mention only, not `NNNN-` lookup.                     |
| ADR bullets in `markdown-conventions`                 | Different numbering space.                                      |
| Inherited `NNNN-` plan/retro files                    | Must keep original names so upstream merges stay conflict-free. |
| `scripts/worktree-*.sh`, `.pi/extensions/worktree.ts` | No plan/retro glob.                                             |

## Test Impact Analysis

No unit tests.
The testable surface is the lookup commands the new prose prescribes.

Dry-run now (before):

```bash
PADDED=$(printf '%04d' 1)
ls docs/plans/"${PADDED}"-*.md
# docs/plans/0001-spawn-model-selection.md

PADDED=$(printf '%04d' 5)
ls packages/*/docs/plans/"${PADDED}"-*.md
# packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md
```

Expected after rename + script change:

```bash
./scripts/issue-context.sh 1
# Plan Files includes docs/plans/f0001-spawn-model-selection.md
# does not list packages/pi-autoformat/docs/plans/0001-initial-implementation-plan.md
# (f match short-circuits)

./scripts/issue-context.sh 5
# Plan Files includes docs/plans/f0005-fork-plan-retro-prefix.md
# does not list packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md

PADDED=$(printf '%04d' 890)
ls docs/plans/"${PADDED}"-*.md
# still docs/plans/0890-inherited-region-tool-surface-relocation.md (fallback)
```

`./scripts/issue-context.sh 1` today already cats inherited `0001` files beside the fork plan; short-circuit after rename is a deliberate narrowing.

## Invariants at risk

None from a prior fork phase.
Inherited `/ship` frontmatter grep must keep working for unprefixed plans (`issue: 890` still finds `0890-*.md`).

## TDD Order

No red→green cycles; run as `/build-plan`.

1. **Lookup and create convention** — apply the canonical rule to every file in "Lookup and create wording" plus `scripts/issue-context.sh`.
   Verify: `rg -n 'Pick the next free \`NNNN\`' .pi/prompts/plan-issue.md` is empty; `rg -n 'f\$\{PADDED\}' scripts/issue-context.sh` hits both loops.
   Before the rename, `./scripts/issue-context.sh 1` still finds `docs/plans/0001-spawn-model-selection.md` via fallback.
   Commit: `docs: look up fork plans and retros with an f prefix (#5)`

   Killing mutation: drop the `f${PADDED}` loops from `issue-context.sh` — after step 2, `./scripts/issue-context.sh 1` no longer prints `docs/plans/f0001-spawn-model-selection.md`.

2. **Rename fork `0001` files** — `git mv` the two paths in the rename table, then `find .rumdl_cache -type f -delete`.
   Verify the dry-run block in Test Impact Analysis.
   `pnpm exec rumdl check docs/plans/f0001-spawn-model-selection.md docs/retro/f0001-spawn-model-selection.md`.
   Commit: `docs: rename fork issue 1 plan and retro to f0001 (#5)`

## Risks and Mitigations

| Risk                                                                                        | Mitigation                                                                                                                   |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/build-plan 5` opens github-tools `0005` because this session's prompts still glob `NNNN-` | Invoke `/build-plan docs/plans/f0005-fork-plan-retro-prefix.md` (path form).                                                 |
| Union glob would keep returning inherited `0005` beside `f0005`                             | Short-circuit is mandatory; pin it with `issue-context.sh 5`.                                                                |
| Missed create-path sentence still emits `0002-` for [#2]                                    | Step 1 grep for `next free \`NNNN\``; land this issue before planning `#2`.                                                  |
| Stale in-process prompts after step 1                                                       | On-disk file is authoritative; locate-the-plan already ran at `/build-plan` start, so path invocation avoids the stale glob. |
| MD057 false-clean after rename                                                              | Delete `.rumdl_cache` in the same commit as `git mv`.                                                                        |

## Open Questions

None.
The scheme is settled in the issue; five-digit names and a `fork/` subdirectory stay rejected.

[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
