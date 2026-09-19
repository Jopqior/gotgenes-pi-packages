---
issue: 762
issue_title: "pi-autoformat: global config path ignores PI_CODING_AGENT_DIR"
---

# Retro: #762 — pi-autoformat: global config path ignores `PI_CODING_AGENT_DIR`

## Stage: Planning (2026-09-19T04:25:35Z)

### Session summary

Confirmed the defect by spike rather than by reading: a disposable `test/spike-762.test.ts` drove `createAutoformatExtension` with no injected `loadConfig` under a stubbed `PI_CODING_AGENT_DIR` and measured the red (`commandTimeoutMs` `10000` instead of the marker `424242`), then measured green with the fix applied plus `tsc` clean and 307/307 unit tests with zero existing-test edits.
Settled the design as boundary injection mirroring [#732], plus this package's first runtime SDK dependency, and wrote `docs/plans/0762-honor-pi-coding-agent-dir.md`.

### Observations

- The interesting divergence from [#732] is the manifest.
  `pi-autoformat` imports the SDK **type-only** and is the only one of the nine workspace packages with no `@earendil-works/pi-coding-agent` peer entry, so a value import of `getAgentDir` is a genuine new runtime dependency rather than a one-word import change.
  Verified at the real surface instead of assuming: Pi's extension loader aliases that specifier to its own bundled copy (`../../pi/packages/coding-agent/src/core/extensions/loader.ts:66` for binary mode, `:122` for jiti/Node mode), and `~/.pi/agent/npm/node_modules/@earendil-works/` contains only `pi-radius` while three installed siblings value-import `getAgentDir` in production today.
  The peer entry is floor documentation, not a resolution mechanism.
- The false-green shape is the mirror image of [#732]'s.
  There, a real `~/.pi/agent` config made a registration-shaped assertion pass pre-fix.
  Here, `PI_CODING_AGENT_DIR` is unset and `~/.pi/agent/extensions/pi-autoformat/` does not exist, so the pre-fix path yields built-in defaults silently — "a config was loaded" and "`createAutoformatter` was called" both pass before and after.
  Both hazards are closed by the same move: assert on a marker config *value* that only the temp scope can supply.
- `ask_user` settled two calls: mirror [#732] by making `cwd` and `agentDir` required (measured zero test churn, so the tidy is free), and declare the peer dependency at `>=0.79.0` rather than leaving the manifest dependency-free.
- Classified `fix:`, not `fix!:`, consistent with [#732] — the behavior change on upgrade is real but narrow, and the old read was accidental.
- The `pkg:pi-permission-system` label is contextual; `packages/pi-permission-system/docs/architecture/history/phase-14-capability-axis.md:105` already recorded this issue as out of scope for that roadmap, so the plan is single-package and ships independently.
- Documentation is in scope here where it was not in [#732]: `README.md:89`, `docs/configuration.md:9`, and `.pi/skills/package-pi-autoformat/SKILL.md:31` all state the global path without the variable.
  They are correct today and become wrong only once the code honors it, so they land in a separate `docs:` commit after the fix.
- Tidy-First assessor returned **no** Recommended preparatory commits and independently verified the three structural claims the design rests on: `createContext()` already accepts a `cwd` override, `test/config-loader.test.ts` already passes both scopes at every call site, and `test/extension.test.ts` has no existing hooks but does have a nested-`describe`-with-local-scaffolding precedent (line 568).

#### Deferred tidyings

- `packages/pi-autoformat/test/extension.test.ts` and `packages/pi-permission-model-judge/test/extension.test.ts` — the temp-`agentDir` global-config fixture (`mkdtempSync` → `mkdirSync(dirname(getGlobalConfigPath(…)))` → `writeFileSync` → `vi.stubEnv`) will be duplicated across two packages; extracting a shared helper means editing a second package's tests for a defect in this one.
- `packages/pi-autoformat/test/config-loader.test.ts` — seven `mkdtempSync` call sites with no teardown at all, relying on OS temp reaping.

## Stage: Implementation — TDD (2026-09-19T05:24:26Z)

### Session summary

Landed the plan's two steps unchanged: one `fix:` commit (the narrowed `config-loader.ts` signatures, the `getAgentDir()` value import and lazy call at the `extension.ts` boundary, the `peerDependencies` entry, and the regression test) and one `docs:` commit naming `PI_CODING_AGENT_DIR` in `README.md`, `docs/configuration.md`, and the package skill.
`pi-autoformat` unit tests went 306 → 307; `check`, root `lint`, workspace `test`, and `fallow dead-code` are green, the real-CLI acceptance suite passes, and the pre-completion reviewer returned PASS.

### Observations

- Both killing mutations behaved exactly as the plan predicted, which is what made them worth running.
  Replacing `getAgentDir()` with a hardcoded `join(homedir(), ".pi", "agent")` at the boundary killed **1** test — the new one — confirming it pins the wiring and nothing else does.
  Making `getGlobalConfigPath` ignore its parameter killed **5**: the new test plus the four global-config cases in `test/config-loader.test.ts`, confirming the new test asserts through the same path the loader actually uses rather than around it.
- Ran the real-CLI acceptance suite (`pnpm --filter @gotgenes/pi-autoformat run test:acceptance`, 2 tests, ~20 s) even though the plan did not ask for it.
  It is the only gate that exercises the new value import under Pi's own extension loader, which is the one risk the unit suite cannot speak to — the monorepo's `devDependency` would satisfy the import either way.
  Green.
- `pnpm install` produced no `pnpm-lock.yaml` change for the added `peerDependencies` block, and `pnpm install --frozen-lockfile` succeeds, so CI's frozen install is unaffected.
- `docs/configuration.md` got a blockquote note naming both the default and the overridden path rather than the inline `(respects PI_CODING_AGENT_DIR)` parenthetical the plan proposed; `README.md` and the skill use the parenthetical.
  The reviewer flagged the divergence and judged the prose accurate — the config reference is the place worth spelling out where the file actually lands.
- Pre-completion reviewer: **PASS**.
  One WARN under evidence provenance: the plan cited 8 `loadAutoformatConfig(` and 4 `getGlobalConfigPath(` call sites in `test/config-loader.test.ts`; the real counts are 7 and 5.
  The numbers came from the Tidy-First assessor's report and were not re-derived at planning time — the conclusion ("every call site already passes both scopes, so zero churn") held and was confirmed by the untouched file, but the figures were wrong.
  Corrected in `b90ecd11`.

[#732]: https://github.com/gotgenes/pi-packages/issues/732
