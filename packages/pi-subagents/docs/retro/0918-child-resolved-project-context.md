---
issue: 918
issue_title: "pi-subagents-worktrees: `<project_context>`'s inherited `path=\"...\"` attribute defeats worktree isolation, the same way #640's footer did"
---

# Retro: #918 — `<project_context>`'s inherited `path="..."` attribute defeats worktree isolation

## Stage: Planning (2026-09-15T04:34:14Z)

### Session summary

Verified the third-party report's mechanism against Pi's source and the pinned SDK 0.84.4, measured the prefix cost of every byte-changing treatment, and ran a four-round clarification gate that settled the direction.
The plan at `packages/pi-subagents/docs/plans/0918-child-resolved-project-context.md` cuts the inherited `<project_context>` when a `WorkspaceProvider` relocated the child, renders the child's own block in its place inside the override, covers the [ADR 0009] `portable` strategy, and ships as `fix:` with the one lossy case recorded as an accepted residual.

### Observations

- **The cost question collapsed early and reshaped the gate.**
  Every treatment that edits bytes inside the block — stripping the `path=` attribute, remapping it, cutting the block — diverges the child at the same offset (2,151 of 58,529 in this repo, measured by running the pinned SDK's `buildSystemPrompt`).
  So the option set is not "which edit is cheapest" but "annotate the false claim or remove it", and the measurement is what made that visible.
  Estimating instead of measuring would have produced an option list comparing costs that are identical.
- **An elegant-looking generalization was strictly worse.**
  Making the relocation unconditional (every child re-renders its own block, so the rule has no `if`) buys a relocated child nothing — its block cannot match its parent's whatever we do — while making every *non*-relocated child's prefix depend on our byte-replica of Pi's renderer.
  `buildSystemPrompt` is not exported from `@earendil-works/pi-coding-agent`, so no test could pin that replica against the real thing.
  Conditioning on divergence removes the replica risk entirely.
- **Re-adding a cwd condition [ADR 0006] withdrew.**
  ADR 0006 dropped [#640]'s equal-cwd exception because the footer sits *after* the catalogue cut, so the exception preserved nothing.
  `<project_context>` sits *before* the cut, so the same reasoning does not reach it — checked before planning the re-introduction rather than relying on the remembered rule.
- **Both `ask_user` bounces were substantive, not formatting.**
  The first asked which package the fix belongs in (answer: core — the `Workspace` seam is `{ cwd, dispose() }` with no prompt-side field, which also produced a fifth option nobody had named).
  The second asked what `prompt_mode: replace` is, which surfaced that the cheap variant (`noContextFiles: false`, letting Pi rebuild) moves a relocated `Explore`/`Plan` child's body off the end — and that produced the adopted `cut-inline` variant.
- **The operator flagged the lossy case as a possible breaking change.**
  Classified explicitly rather than left implicit: the two direct precedents (`449078d0` for [#640], `610a4e9a` for [#801]) both removed an inherited layer from every child under plain `fix:`, and [ADR 0006] already records this exact trade as an accepted residual.
  Blast radius narrowed by reading `loadProjectContextFiles`: it also returns the global `~/.pi/agent/AGENTS.md` and walks every ancestor, and `git worktree add` checks out tracked files, so `pi-subagents-worktrees` itself is unaffected.
  A debug note and a `docs/configuration.md` contract for provider authors were added instead of a fallback; an opt-in escape hatch was offered and declined.
- **Tidy-First assessor returned three accepted preparatory commits** (extract `renderProjectContext` to `src/session/project-context.ts`, unit-test it directly, add a project-context layer to the `parentPrompt()` fixture) and one useful rejection: do **not** reshape `buildAgentPrompt`'s parameter list ahead of the change — an optional trailing parameter costs zero call-site edits across ~30 sites, and a parameter-object shape is the design decision itself, not separable prep.
  It also caught a real tension in my design summary: `renderProjectContext`'s "two callers" are both new, because `buildPortablePrompt` loses its `contextFiles` input entirely.
- **Sharpest test hazard identified:** the expensive failure is the cut firing on an *equal-cwd* child, which silently ends the shared prefix for every child on prefix-reusing hosts and is invisible to `tsc` and to a green suite.
  The existing `shared prefix with the parent` tests cannot see it, because their fixture has no `<project_context>` layer — hence preparatory step 3.

#### Deferred tidyings

None.
The assessor's only rejection was `buildAgentPrompt`'s parameter shape, which it declined as a design decision rather than deferring it as debt.

[#640]: https://github.com/gotgenes/pi-packages/issues/640
[#801]: https://github.com/gotgenes/pi-packages/issues/801
[ADR 0006]: ../decisions/0006-inherited-prompt-is-identity-only.md
[ADR 0009]: ../decisions/0009-portable-inheritance-is-provider-scoped.md
