---
issue: 6
issue_title: "/ship plan lookup returns multiple plans when a fork issue number matches an inherited plan's frontmatter"
---

# Short-circuit /ship plan lookup on f-prefixed files

## Release Recommendation

**Release:** ship independently

Repo-level prompt change in `.pi/prompts/ship.md`.
No package roadmap step references this issue, and no `packages/` path changes, so `/ship` names no package.

## Problem Statement

`/ship N` locates the plan with a frontmatter grep that does not honor the `fNNNN-` short-circuit [#5] taught every other lookup site.

Measured on current `main`:

| Issue | `grep -rl "^issue: N$"` hits                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `docs/plans/f0001-spawn-model-selection.md`, `packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md`, `packages/pi-permission-system/docs/plans/archive/0001-external-directory-integration-tests.md` |
| 5     | `docs/plans/f0005-fork-plan-retro-prefix.md`, `packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md`                                                                                                       |
| 6     | `packages/pi-permission-system/docs/plans/archive/0006-log-resolved-config-paths.md` (this plan file adds a second hit once committed)                                                                                   |
| 890   | `docs/plans/0890-inherited-region-tool-surface-relocation.md` (single inherited hit; fallback must keep working)                                                                                                         |

`/ship` takes no path argument, so a multi-hit grep can silently feed the inherited plan's `**Release:**` marker into release coordination.
[#5] declared this grep out of scope; its pre-completion reviewer flagged the residual; this issue is that follow-up.

The worktree lane uses the same frontmatter pattern via `git grep` on `$BRANCH`, so both snippets must change.

## Goals

- Teach `/ship` step 2 plan location the same short-circuit as [#5]: glob `fNNNN-*` first in `docs/plans/` and `packages/*/docs/plans/`; if any regular file matches, restrict the frontmatter grep to those matches.
- Fall back to the current unrestricted `^issue: $1$` grep only when no `f` file exists, so inherited unprefixed plans keep working.
- Apply the same source-scoped rule in both lanes: working tree on trunk, `$BRANCH` in the worktree lane.
- When `f` files exist, do not fall back even if the restricted frontmatter grep is empty.

## Non-Goals

- Accepting a plan path as `/ship`'s `$1` (friction recorded in [#5]'s final retro; a different defect).
- Changing `scripts/issue-context.sh`, `/tdd-plan`, `/build-plan`, `/retro`, or other filename-glob lookup sites — they already short-circuit.
- Extracting a shared lookup script from the prompt snippets.
- Excluding `docs/plans/archive/` from the unrestricted fallback.
- Switching the inherited fallback from frontmatter grep to a `NNNN-*` filename glob.
- Editing historical plans that quote the old grep (`docs/plans/0434-plan-driven-release-batching.md`, `docs/plans/0869-merge-ship-prompts.md`, `docs/plans/f0005-fork-plan-retro-prefix.md`).

## Background

[#5] updated create/lookup wording across prompts, skills, `AGENTS.md`, `README.md`, and `scripts/issue-context.sh`.
`.pi/prompts/ship.md` received only the retro glob; the plan-location greps were left frontmatter-keyed on purpose.

Sibling locate sites (`/tdd-plan`, `/build-plan`, `/retro`, `issue-context.sh`) glob the filename and never grep frontmatter.
`/ship` cannot switch to a filename glob for the fallback: three inherited plans have a filename number that does not match frontmatter `issue:` (measured):

| File                                                                             | Filename number | Frontmatter `issue:` |
| -------------------------------------------------------------------------------- | --------------- | -------------------- |
| `packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md`       | 2               | 1                    |
| `packages/pi-autoformat/docs/plans/0016-detailed-formatter-output-on-failure.md` | 16              | 2                    |
| `packages/pi-subagents-worktrees/docs/plans/0001-publish-worktrees-package.md`   | 1               | 369                  |

A `NNNN-*` fallback would miss those on `/ship 1`, `/ship 2`, and `/ship 369`.
Keeping unrestricted frontmatter as the no-`f` path preserves them.

The worktree lane cannot glob the working tree for `fNNNN-*`.
The plan is on `$BRANCH` and is not on `main` until step 4, so an empty working-tree glob would fall through to unrestricted `git grep` on the branch and still return the inherited hit.

`git grep` with an `fNNNN-*` pathspec cannot be the existence check either.
Measured: `git grep -l "^issue: 6$" HEAD -- 'docs/plans/f0006-*' 'packages/*/docs/plans/f0006-*'` exits 1 with empty output, and `git ls-files --with-tree=HEAD` for the same pathspec is also empty — the two commands agree when no `f` file exists, but they would also agree (grep empty, exit 1) if an `f` file existed with the wrong frontmatter.
Existence is `git ls-files --with-tree="$BRANCH"`; the frontmatter grep runs only after that is non-empty.

Tidy-First is skipped: no `src/` or `test/` files.
Design-review checklist is skipped: no shared TypeScript interface or layer wiring.

## Design Overview

Canonical rule for `/ship` plan location (both lanes), matching AGENTS.md's lookup rule:

1. Pad `$1` with `PADDED=$(printf '%04d' "$1")`.
2. List `f${PADDED}-*` plan files from the same source the grep will read (working tree on trunk; `$BRANCH` in the worktree lane).
3. If any such file exists, grep `^issue: $1$` only among those files.
   Do not fall back when that grep is empty — report that the `f` files did not carry matching frontmatter.
4. If no `f` file exists, run today's unrestricted frontmatter grep.

Trunk snippet:

```bash
PADDED=$(printf '%04d' "$1")
files=()
for f in docs/plans/"f${PADDED}"-*.md packages/*/docs/plans/"f${PADDED}"-*.md; do
  [[ -f "$f" ]] && files+=("$f")
done
if [[ ${#files[@]} -gt 0 ]]; then
  grep -l "^issue: $1$" "${files[@]}"
else
  grep -rl "^issue: $1$" docs/plans packages/*/docs/plans
fi
```

The `[[ -f "$f" ]]` guard is the same unmatched-glob pattern `scripts/issue-context.sh` already uses.

Worktree snippet:

```bash
PADDED=$(printf '%04d' "$1")
f_files=$(git ls-files --with-tree="$BRANCH" -- "docs/plans/f${PADDED}-*" "packages/*/docs/plans/f${PADDED}-*")
if [[ -n "$f_files" ]]; then
  git grep -l "^issue: $1$" "$BRANCH" -- "docs/plans/f${PADDED}-*" "packages/*/docs/plans/f${PADDED}-*"
else
  git grep -l "^issue: $1$" "$BRANCH" -- 'docs/plans/*' 'packages/*/docs/plans/*'
fi
```

Worktree output stays `<branch>:<plan-path>` and still feeds `git show`.

Step 2.3's retro glob is already the short-circuit; do not edit it.

## Module-Level Changes

- `.pi/prompts/ship.md` — replace the two plan-location snippets in step 2.1 (trunk `grep -rl`, worktree `git grep`) with the snippets above, plus one sentence that an `f` hit must not fall back when the restricted grep is empty.

### Predicted unchanged

| File                                                                                          | Claim                                                                        |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `.pi/prompts/ship.md` step 2.3 retro glob                                                     | Already short-circuits on `fNNNN-`.                                          |
| `.pi/prompts/ship-no-issue.md`                                                                | No plan/retro filename glob.                                                 |
| `scripts/issue-context.sh`                                                                    | Already short-circuits on `f${PADDED}` by filename.                          |
| `.pi/prompts/tdd-plan.md`, `.pi/prompts/build-plan.md`, `.pi/prompts/retro.md`                | Already filename-glob short-circuit.                                         |
| `.pi/skills/markdown-conventions/SKILL.md`, `.pi/skills/pre-completion/SKILL.md`, `AGENTS.md` | Already state the canonical lookup rule; they do not quote the `/ship` grep. |
| Historical plans that quote `grep -rl "^issue: $1$"`                                          | Records of prior behavior.                                                   |

## Test Impact Analysis

No unit tests.
The testable surface is the commands the new prompt text prescribes.

Dry-run now (before; working tree = `HEAD`):

```bash
# current unrestricted grep (today's /ship)
grep -rl "^issue: 5$" docs/plans packages/*/docs/plans
# docs/plans/f0005-fork-plan-retro-prefix.md
# packages/pi-github-tools/docs/plans/0005-abort-signal-threading.md

grep -rl "^issue: 1$" docs/plans packages/*/docs/plans
# docs/plans/f0001-spawn-model-selection.md
# packages/pi-autoformat/docs/plans/0002-richer-tui-formatter-summaries.md
# packages/pi-permission-system/docs/plans/archive/0001-external-directory-integration-tests.md

grep -rl "^issue: 890$" docs/plans packages/*/docs/plans
# docs/plans/0890-inherited-region-tool-surface-relocation.md

grep -rl "^issue: 6$" docs/plans packages/*/docs/plans
# packages/pi-permission-system/docs/plans/archive/0006-log-resolved-config-paths.md
```

Proposed trunk snippet, measured now:

```text
issue 5 → docs/plans/f0005-fork-plan-retro-prefix.md   (f-files count=1)
issue 1 → docs/plans/f0001-spawn-model-selection.md    (f-files count=1)
issue 890 → fallback → docs/plans/0890-inherited-region-tool-surface-relocation.md  (f-files count=0)
issue 6 → fallback → packages/pi-permission-system/docs/plans/archive/0006-log-resolved-config-paths.md  (f-files count=0)
```

After this plan file exists, the same snippet for issue 6 must return only `docs/plans/f0006-ship-plan-lookup.md` (f-files count=1), not the archive plan.
`/build-plan` re-runs that case as verification.

Worktree existence check, measured now:

```text
git ls-files --with-tree=HEAD -- 'docs/plans/f0005-*' 'packages/*/docs/plans/f0005-*'
# docs/plans/f0005-fork-plan-retro-prefix.md

git ls-files --with-tree=HEAD -- 'docs/plans/f0006-*' 'packages/*/docs/plans/f0006-*'
# empty, exit 0
```

## Invariants at risk

[#5] recorded: inherited `/ship` frontmatter grep must keep working for unprefixed plans (`issue: 890` still finds `0890-*.md`).
This change preserves that via the no-`f` fallback; the 890 dry-run above is the pin.

[#5] already short-circuited the retro glob in the same file.
A later edit that rewrites too much of step 2 could regress it; the predicted-unchanged row is the check.

## TDD Order

No red→green cycles; run as `/build-plan`.

1. **Short-circuit `/ship` plan location** — replace both step 2.1 snippets in `.pi/prompts/ship.md` with the Design Overview commands, and add the no-fallback-on-empty-`f`-grep sentence.
   Verify by running those snippets with `$1` in `{1,5,6,890}`: 1 and 5 and 6 each print exactly one `fNNNN-` path; 890 prints `docs/plans/0890-inherited-region-tool-surface-relocation.md`.
   `pnpm exec rumdl check .pi/prompts/ship.md`.
   Commit: `docs: short-circuit /ship plan lookup on f-prefixed files (#6)`

   Killing mutation: restore either snippet to the unrestricted grep (trunk `grep -rl "^issue: $1$" docs/plans packages/*/docs/plans`, or worktree `git grep` with only `'docs/plans/*' 'packages/*/docs/plans/*'`).
   The issue-5 dry-run then prints two paths again; the issue-6 dry-run prints the archive plan beside `f0006`.

## Risks and Mitigations

| Risk                                                                                                                  | Mitigation                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Implementer writes `restricted \|\| unrestricted`, so a wrong-frontmatter `f` file falls through to the inherited hit | Design Overview uses `if f-files exist / else`; the empty-grep sentence is an explicit non-fallback.                           |
| Worktree lane globs the working tree, misses the branch plan, and falls back to unrestricted `git grep`               | Existence is `git ls-files --with-tree="$BRANCH"`; do not glob `main`.                                                         |
| Same-session `/ship 6` still expands the pre-edit prompt                                                              | On-disk `ship.md` is authoritative (`AGENTS.md` stale-prompt rule); `/ship 6` should run in a fresh session or honor the file. |
| Only the trunk snippet is edited                                                                                      | One step edits both; the killing mutation names either snippet.                                                                |

## Open Questions

None.
The hybrid (restrict frontmatter to `f` matches; keep unrestricted frontmatter as the no-`f` fallback) is the issue's proposed change; a filename-glob fallback would miss the three inherited filename/frontmatter mismatches measured above.

[#5]: https://github.com/Jopqior/gotgenes-pi-packages/issues/5
