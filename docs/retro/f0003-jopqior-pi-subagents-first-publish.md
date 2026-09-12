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

[#2]: https://github.com/Jopqior/gotgenes-pi-packages/issues/2
