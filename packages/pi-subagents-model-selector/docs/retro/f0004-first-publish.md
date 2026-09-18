---
issue: 4
issue_title: "pi-subagents-model-selector 首次发布（@jopqior 0.1.0）"
---

# Retro: #4 — pi-subagents-model-selector 首次发布（@jopqior 0.1.0）

## Stage: Planning (2026-09-13T05:44:45Z)

### Session summary

Planned fork issue 4 as a package-local `/build-plan`: drop `private`, add `publishConfig.access: public`, change the core specifier to `workspace:^`, rewrite the package README for npm install, then operator-manual first publish of `@jopqior/pi-subagents-model-selector` 0.1.0 plus the post-publish disable entry and root README badge.
[#3] already published the core and retargeted the dependency **name**; Tidy-First was skipped because no `src/` / `test/` files change.

### Observations

- Gate answer: published core range is `^1.0.0` via `workspace:^`.
  `pnpm pack` measured `workspace:*` → exact `"1.0.0"` and `workspace:^` → `"^1.0.0"`; the issue body's "范围" matched the caret form, not the current specifier.
- Issue-body claim that dependencies are still `@gotgenes/pi-subagents: workspace:*` is stale after [#3].
- Default pnpm/npm registry is npmmirror; `npm whoami --registry=https://registry.npmjs.org/` is `jopqior`.
  Every publish/whoami/view in the plan passes that `--registry` flag (same miss [#3] already paid for).
- Do not add `npm:@jopqior/pi-subagents-model-selector` to `.pi/settings.json` until `npm view` returns `0.1.0` (`gotgenes/pi-packages#600`).
- `/ship` must not dispatch `release.yml`; `next-version.sh` refuses until `pi-subagents-model-selector-v0.1.0` exists.
  Manual publish, tag, Trusted Publisher, disable entry, and root README badge run after CI and before `issue_close`.
- No hand-written `CHANGELOG.md` for 0.1.0; `prepare-release.sh` creates one on the first automated release.
- Left `packages/pi-subagents/README.md` "(local companion)" alone: a `docs:` commit there would cut a core patch.
- `RELEASE_PLEASE_TOKEN` already exists from [#3]; this issue does not touch secrets.

[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3

## Stage: Implementation — Build (2026-09-13T06:21:48Z)

### Session summary

Completed TDD Order steps 1–2 of the `/build-plan`.
Dropped `private`, added `publishConfig.access: public`, changed the core specifier to `workspace:^`, rewrote the package README for npm install, and verified the packed manifest, allowlist, `fallow dead-code`, check, lint, and 28 package tests.
Steps 3–4 (manual first publish, tag, Trusted Publisher, disable entry, root README badge) remain for `/ship` after CI.

### Observations

- No deviations from the plan in steps 1–2.
  Packed `jq` showed `private` null, `publishConfig.access` `"public"`, and `dependencies["@jopqior/pi-subagents"]` `"^1.0.0"`; lockfile stayed `link:../pi-subagents`.
- Pre-completion reviewer: PASS.
  Ready for `/ship`; `release.yml` must not be dispatched until tag `pi-subagents-model-selector-v0.1.0` exists.
- Reviewer note (unrelated): untracked `.pi/extensions/pi-permission-system/` is still in the working tree and was not committed.

## Stage: Final Retrospective (2026-09-13T08:24:08Z)

### Session summary

Shipped fork issue 4 on trunk: `@jopqior/pi-subagents-model-selector` 0.1.0 is on npmjs.org, tagged `pi-subagents-model-selector-v0.1.0` at `cdf4d579a382928d1fc5470697a85e6dbd97b637`, with Trusted Publisher on `Jopqior/gotgenes-pi-packages`.
`release.yml` was not dispatched.
Four sessions ran on `xai/grok-4.6` (plan, build, ship, this retro) plus `pre-completion-reviewer` whose agent frontmatter requests `anthropic/claude-sonnet-5`; Tidy-First was skipped (no `src/` / `test/` change).

### Observations

#### What went well

- The [#3] retro's `ship.md` "no dispatch" branch ran for the first time.
  `**Release:** ship independently` plus the plan sentence not to dispatch `release.yml` skipped steps 10–11 and ran the OTP checklist; this ship did not repeat [#3]'s instruction-violation of that mapping.
- Planning pack-measured the workspace rewrite instead of trusting the issue body: `workspace:*` packs to exact `"1.0.0"`, `workspace:^` packs to `"^1.0.0"`.
  The gate chose caret; packed `jq` in build confirmed it, and the lockfile stayed `link:../pi-subagents`.

#### What caused friction (agent side)

- `missing-context` — the issue body still claimed `@gotgenes/pi-subagents: workspace:*` after [#3] retargeted the name.
  Planning measured `pnpm pack` and restored a `workspace:^` spike (lockfile needed `git checkout`).
  Impact: extra pack cycle; no rework of the published range.
  Self-identified.
- `instruction-violation` (self-identified) — `pi-autoformat` joined colon-terminated verify commands in the new plan; planning re-split before the plan commit.
  `AGENTS.md` already records the colon-join rule.
  Impact: one extra edit cycle; no rework after commit.
- `other` — `/ship` hunted `github-voice` across several `find`/`grep` calls (`~/.pi/agent/skills/` 404), the same missing install [#3] already recorded.
  Impact: extra searches; the close comment still posted.
- `wrong-abstraction` — after the operator installed the skill at `~/.agents/skills/github-voice/`, ship attributed the earlier 404s to searching the wrong directory.
  The files had not existed.
  Impact: one extra user correction after close; no rework of the comment.
  User-caught.

#### What caused friction (user side)

- The issue body was not updated after [#3] changed the companion dependency name and left `workspace:*`.
  Opportunity: a one-line body edit would have saved the stale-specifier measurement, not the `workspace:*` versus `workspace:^` pack spike (that measurement was still required).
- `github-voice` was installed after this issue closed.
  Opportunity: saying "not installed, skip" during ship would have stopped the directory hunt; the later path correction would not have been needed.
- Untracked `.pi/extensions/pi-permission-system/` is still in the working tree (build reviewer noted it; this retro still sees it).
- OTP publish and Trusted Publisher remain operator-terminal steps.
  That is the designed split, not mechanical oversight.

### Diagnostic details

- **Model-performance correlation** — Plan, build, ship, and this retro ran on `xai/grok-4.6`.
  Parent transcripts do not inline subagent models; `.pi/agents/pre-completion-reviewer.md` requests `anthropic/claude-sonnet-5`.
  Reviewer PASS; no quality mismatch.
- **Escalation-delay tracking** — the `github-voice` hunt was about five consecutive search calls, at the flag line.
  After the first 404 the session should have drafted without the skill, as [#3] did.
- **Unused-tool detection** — ship loaded the `wizard` skill and did not use it.
  `github-voice` was unavailable until after close.

### Changes made

1. Appended this Final Retrospective stage to `packages/pi-subagents-model-selector/docs/retro/f0004-first-publish.md`.
   No `AGENTS.md` or prompt edits.
