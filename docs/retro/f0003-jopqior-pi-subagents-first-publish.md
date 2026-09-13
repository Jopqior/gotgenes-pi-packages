---
issue: 3
issue_title: "pi-subagents 迁移到 @jopqior scope 并完成首次发布"
---

# Retro: #3 — pi-subagents 迁移到 @jopqior scope 并完成首次发布

## Stage: Planning (2026-09-12T17:20:25Z)

### Session summary

Planned fork issue 3 as a repo-level `/build-plan`: rename this workspace's core to `@jopqior/pi-subagents` 1.0.0, retarget only the `workspace:*` companion, rewrite the published identity surface, then operator-manual first publish plus `RELEASE_PLEASE_TOKEN`.
`docs/upstream-sync.md` already holds the post-rename conflict recipes from [#2]; this plan only drops the "no-op until rename" sentence and adds the correspondence row after the tag.
Tidy-First reported no preparatory commits.

### Observations

- Gate answers: keep `Symbol.for("@gotgenes/pi-subagents:…")` and leave worktrees on npm `@gotgenes/pi-subagents@^16.4.0`; published identity only (not architecture/history); PAT as `RELEASE_PLEASE_TOKEN` with no `release.yml` edit.
- Media URLs on archived `gotgenes/pi-subagents` still return HTTP 200; kept without a gate question.
- Default pnpm/npm registry is npmmirror; official-registry auth is present (`npm whoami --registry=https://registry.npmjs.org/` → `jopqior`).
  Every publish/whoami/view in the plan passes that `--registry` flag.
- `linkWorkspacePackages: false` makes the model-selector `workspace:*` rename mandatory in the same commit as `package.json` `name`, or the four `@jopqior/pi-subagents` specifiers do not resolve.
- Do not add `npm:@jopqior/pi-subagents` to `.pi/settings.json` until `npm view` returns `1.0.0` (`gotgenes/pi-packages#600`).
- `/ship` must not dispatch `release.yml`; `next-version.sh` refuses until `pi-subagents-v1.0.0` exists.
  Manual publish, tag, Trusted Publisher, disable entry, and correspondence row run after CI and before `issue_close`.
- Tidy-First rejected extracting `MISSING_CORE_MESSAGE` (would make the diagnostic assertion tautological) and a vitest alias that would hide the renamed specifier.

## Stage: Implementation — Build (2026-09-12T17:37:33Z)

### Session summary

Completed TDD Order steps 1–4 of the `/build-plan`.
Renamed the workspace core to `@jopqior/pi-subagents` 1.0.0, retargeted the `workspace:*` companion, rewrote the published identity surface, and inserted a hand-written 1.0.0 changelog above `## [21.7.0]`.
Operator steps 5–7 (PAT secret, first npm publish, tag, Trusted Publisher, disable entry, correspondence row) remain for `/ship`.

### Observations

- No deviations from the plan.
  Step 4 produced no extra commit.
- Pre-completion reviewer: WARN.
  Reviewer warnings: stale `@gotgenes/pi-subagents` names remain in `.pi/skills/package-pi-subagents/SKILL.md`, shipped `packages/pi-subagents/docs/architecture/architecture.md`, and `MIGRATION.md` — all inside the plan's Non-Goals.
- `pnpm --filter @gotgenes/pi-subagents` now matches nothing.
  Model-selector lockfile entry stays `link:../pi-subagents`.
  Contract `Symbol.for` keys and `pi-subagents-worktrees` were not rewritten.
- `/ship` must not dispatch `release.yml`.

## Stage: Final Retrospective (2026-09-13T05:29:10Z)

### Session summary

Shipped fork issue 3 on trunk: workspace core is `@jopqior/pi-subagents` 1.0.0 on npmjs.org, tagged `pi-subagents-v1.0.0` at `2c6dcd38428c467925b6b496cf3585ee32a1bd32`, with `RELEASE_PLEASE_TOKEN` and Trusted Publisher on `Jopqior/gotgenes-pi-packages`.
`release.yml` was not dispatched.
This unblocks [#4].
Four sessions ran on `xai/grok-4.6` (plan, build, ship, this retro) plus `tidy-first-assessor` and `pre-completion-reviewer` whose agent frontmatter requests `anthropic/claude-sonnet-5`.

### Observations

#### What went well

- The plan's instruction not to dispatch `release.yml` overrode `/ship`'s `**Release:** ship independently` → "release now" branch.
  After CI, the ship session ran the plan's operator checklist (PAT, OTP publish, tag, Trusted Publisher, disable entry) instead of steps 10–11.
- Identity versus contract held: `Symbol.for("@gotgenes/pi-subagents:…")` and worktrees on npm `@gotgenes/pi-subagents@^16.4.0` were predicted-unchanged and stayed so.
  Pre-completion WARN named leftover `@gotgenes` strings in architecture/skill/`MIGRATION.md`, all inside Non-Goals.
- Once the plan recorded `--registry=https://registry.npmjs.org/`, every ship `whoami` / `view` / `publish` used it.
  No second registry miss.

#### What caused friction (agent side)

- `missing-context` — planning ran `npm whoami` against the default registry (npmmirror) and reported "not logged in" in the gate substance.
  The operator had to add that auth lives on `registry.npmjs.org`.
  Impact: one extra user turn before the plan; the flag then landed in every publish command.
  User-caught.
- `instruction-violation` (self-identified) — `/ship` step 2 says any `**Release:** ship independently` records "release now" and must not ask.
  The ship session ignored that branch and followed the plan body instead.
  Impact: added friction but no rework; `next-version.sh` would have refused a premature dispatch anyway (no tag, then no package-tree commits after the tag).
- `rabbit-hole` — after tagging `pi-subagents-v1.0.0` and landing the post-publish `chore:` (`.pi/settings.json` + `docs/upstream-sync.md`, both outside `packages/pi-subagents/`), ship ran `./scripts/release/next-version.sh pi-subagents` twice and then `bash -x` on empty output.
  `/ship` step 8 already says files outside the package tree release nothing.
  Impact: three extra tool calls; no dispatch and no rework.
- `other` — `github-voice` skill path missed again (`~/.pi/agent/skills/` 404), same as [#2].
  Impact: extra searches; the close comment still posted.

#### What caused friction (user side)

- The npmmirror-versus-official-registry fact was not in the issue body or `AGENTS.md`.
  Opportunity: one fork-scope line would have made planning measure `npm whoami --registry=https://registry.npmjs.org/` before the gate, instead of correcting it after.
- PAT + first `pnpm publish` and Trusted Publisher had to be operator-terminal steps.
  That is the designed OTP/dashboard split, not mechanical oversight.

### Diagnostic details

- **Model-performance correlation** — Plan, build, ship, and this retro ran on `xai/grok-4.6`.
  Parent transcripts do not inline subagent models; `.pi/agents/tidy-first-assessor.md` and `.pi/agents/pre-completion-reviewer.md` request `anthropic/claude-sonnet-5`.
  Tidy-First rejected extracting `MISSING_CORE_MESSAGE`; reviewer WARN stayed inside Non-Goals.
  No quality mismatch.
- **Unused-tool detection** — before the planning gate, `pnpm config get registry` plus `npm whoami --registry=https://registry.npmjs.org/` would have shown npmmirror as default and `jopqior` as logged in.
  The session ran unflagged `npm whoami` instead.
- **Escalation-delay tracking** — the empty `next-version.sh` probe was three consecutive calls (under the five-call flag).
  The `/ship` empty-output rule was already in the prompt.

### Changes made

1. Appended this Final Retrospective stage to `docs/retro/f0003-jopqior-pi-subagents-first-publish.md`.
2. `AGENTS.md` fork-scope: default registry is npmmirror; `whoami` / `view` / `publish` against npmjs.org must pass `--registry=https://registry.npmjs.org/`.
3. `AGENTS.md` first-publish command: same `--registry` flag on `pnpm publish`.
4. `.pi/prompts/ship.md` step 2: a plan that says not to dispatch `release.yml` records "no dispatch" and skips steps 10–11; steps 8/10/11 honor that decision.

[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
[#4]: https://github.com/Jopqior/gotgenes-pi-packages/issues/4
