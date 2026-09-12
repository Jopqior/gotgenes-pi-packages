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

## Stage: Implementation — Build (2026-09-12T11:29:38Z)

### Session summary

Implemented the `/ship` plan-location short-circuit in `.pi/prompts/ship.md` as a single step.
Both the trunk `grep` and worktree `git grep` snippets now glob `fNNNN-*` first and restrict frontmatter matching to those files, falling back to unrestricted frontmatter grep only when no `f` file exists.
A no-fallback sentence was added so an empty restricted grep does not reintroduce an inherited plan.

### Observations

- No deviations from the plan.
- Dry-run of the prescribed snippets with `$1` in `{1,5,6,890}` matched the plan: issues 1, 5, and 6 each printed exactly one `fNNNN-` path; issue 890 fell back to `docs/plans/0890-inherited-region-tool-surface-relocation.md`.
- Worktree lane via `git ls-files --with-tree=HEAD` agreed with the trunk glob on all four cases.
- Pre-completion reviewer: PASS — ready for `/ship`.

## Stage: Final Retrospective (2026-09-12T12:02:02Z)

### Session summary

Landed the `/ship` plan-location short-circuit on trunk (`379ee1ac`), closed issue 6, and released no package (range touched no `packages/` path).
Four sessions: plan and build on `xai/grok-4.6`, ship on `deepseek/deepseek-flash`, retro on `xai/grok-4.6`, plus a `pre-completion-reviewer` whose agent frontmatter requests `anthropic/claude-sonnet-5`.
The `#5` residual (unrestricted frontmatter grep colliding with inherited plans) is the change that shipped.

### Observations

#### What went well

- The `#5` pre-completion WARN became issue 6, then a measured plan, a dry-run `/build-plan`, and a ship-time re-measure before the close comment — residual-to-issue closed in one cycle.
- `/ship 6` ran in a fresh session, so it expanded the post-edit `.pi/prompts/ship.md` rather than the stale in-process copy the plan named as a risk.
- Ship verified `issue_close` resolves the repo from CWD (`gh repo view` → `Jopqior/gotgenes-pi-packages`) before mutating GitHub, matching the fork-scope `--repo` rule.

#### What caused friction (agent side)

- `instruction-violation` (user-caught) — the ship session replied in English until the operator sent `你没看到 AGENTS.md 里的话吗，用中文回答我。` `AGENTS.md` already records the Chinese-reply rule from the `#5` retro; `deepseek/deepseek-flash` still missed it inside a long English `/ship` template.
  Impact: operator interrupt mid-ship; no git or CI rework.
- `wrong-abstraction` — this retro located `f0006-*` with the find tool (whole-path fuzzy), which returned nothing, then recovered via `gh issue view`, `git log`, and `grep`.
  The retro prompt already says to glob `docs/plans/fNNNN-*`; a shell glob would have hit in one call.
  Same miss as the `#5` retro.
  Self-identified.
  Impact: extra tool calls and a delayed locate; no rework.
- `other` — ship tried `set_session_name` via bash (`set_session_name 2>/dev/null || true`) before the tool.
  Impact: one wasted call; no rework.

#### What caused friction (user side)

- `/ship` ran on `deepseek/deepseek-flash` (prompt frontmatter lists `opencode-go/deepseek-v4-flash` as an allowed model).
  Opportunity: a flash model on a long English template is the case that still needs the Chinese-reply rule in the prompt body, not only in `AGENTS.md`.
- The operator had to request Chinese again one issue after `#5` added the `AGENTS.md` rule — the same interrupt, not a new preference.

### Diagnostic details

- **Model-performance correlation** — Planning and build (`xai/grok-4.6`) measured collisions, wrote the snippets, and dry-ran `{1,5,6,890}`; grok honored the Chinese-reply rule without a prompt-local copy.
  Ship (`deepseek/deepseek-flash`) executed the mechanical workflow correctly (lint, fallow, push, CI, close) and missed the fork-scope language rule.
  The parent build transcript does not inline the reviewer's model; `.pi/agents/pre-completion-reviewer.md` requests `anthropic/claude-sonnet-5` and returned PASS.
  Retro (`xai/grok-4.6`).
- **Unused-tool detection** — the retro locate used find instead of a shell glob (`ls docs/plans/f0006-* docs/retro/f0006-*`).
  No subagent would have helped; the right tool was `bash`.

### Changes made

1. Appended this Final Retrospective stage to `docs/retro/f0006-ship-plan-lookup.md`.
2. `.pi/prompts/retro.md` Step 1: locate `fNNNN-*` with a shell glob, not the find tool.
