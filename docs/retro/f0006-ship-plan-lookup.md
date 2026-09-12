---
issue: 6
issue_title: "/ship plan lookup returns multiple plans when a fork issue number matches an inherited plan's frontmatter"
---

# Retro: #6 — /ship plan lookup returns multiple plans when a fork issue number matches an inherited plan's frontmatter

## Stage: Planning (2026-09-12T11:15:32Z)

### Session summary

Planned fork issue 6 as a repo-level `/build-plan` change to `.pi/prompts/ship.md`.
The plan keeps `/ship`'s frontmatter grep, but short-circuits it onto `fNNNN-*` files when any exist, in both the trunk and worktree lanes.
Tidy-First and design-review were skipped (no `src/`/`test/` files, no shared TypeScript wiring).

### Observations

- Measured unrestricted grep collisions: issue 1 hits three plans, issue 5 hits two, issue 6 currently hits only the permission-system archive plan — this plan file itself becomes the second hit until the prompt lands.
- Fallback must stay frontmatter, not a `NNNN-*` filename glob: three inherited plans have filename numbers that do not match `issue:` (`0002` → 1, `0016` → 2, worktrees `0001` → 369).
- Worktree existence cannot use a working-tree glob or an empty `git grep`: the plan is on `$BRANCH` until step 4, and `git grep` with an `f0006-*` pathspec exits 1 both when no file exists and when an `f` file lacks matching frontmatter.
  Existence is `git ls-files --with-tree="$BRANCH"`.
- When `f` files exist, a restricted grep that returns empty must not fall through to unrestricted grep — that reintroduces the inherited hit.
- Accepting a plan path as `/ship`'s `$1` stays out of scope (recorded in issue 5's final retro as a different defect).
- No follow-up issue filed.
