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
