---
issue: 904
issue_title: "pi-subagents: the genericBase fallback tells a read-only child it can edit files and run commands"
---

# Retro: #904 — pi-subagents: the genericBase fallback tells a read-only child it can edit files and run commands

## Stage: Planning (2026-09-18T20:55:01Z)

### Session summary

Planned Phase 22 Step 20: reducing `genericBase` in `src/session/prompts.ts` from a four-line role-plus-capability blurb to two lines (`# Instructions` / "Do what has been asked; nothing more, nothing less.").
The plan is three TDD steps — a preparatory test tidy that pins the fallback text in one constant, the `fix:` behavior change with a read-only fallback test, and a `docs:` step amending `docs/decisions/0009-portable-inheritance-is-provider-scoped.md` and marking the roadmap step landed.
Plan committed at `packages/pi-subagents/docs/plans/0904-fallback-base-asserts-no-capability.md`.

### Observations

- **The issue's reachability guess was inverted by the code.**
  The issue asks whether the no-parent-prompt path is cold; it is not merely cold but **dead in production** — `assembleSessionConfig` (`src/session/session-config.ts:189`) always passes an `InheritedPrompt`.
  The live arm is `adoptedIdentity`'s portable fallback (`prompts.ts:140`), and for the `portable` population it is the *default* identity, since it fires whenever the parent runs without `--system-prompt` and `--append-system-prompt`.
  [ADR 0009] had already recorded this as an accepted residual tracking this issue.
- **The gate widened the fix past what the issue proposed.**
  The issue proposed deleting the capability sentence and rewording "general-purpose" to "focused".
  The operator's bounce — "But what even makes it a 'coding agent'?"
  — generalized correctly: every clause in that sentence ("coding", "general-purpose", "for complex, multi-step tasks") is an unverified claim about a child whose type, domain, and task shape the constant cannot know.
  The chosen outcome keeps only the imperative, which was never a claim, and renames the heading to `# Instructions`.
- **A gate was bounced for over-long option text.**
  The first `preview` gate carried full briefings in the option descriptions even though the substance was already in the preceding message; the re-ask with bare labels plus previews was answered immediately.
- **Rendering the fallback from parts was rejected twice, for different reasons.**
  Enumerating the tool surface there would reimport node-local prose into the one identity that exists to stay harness-neutral ([ADR 0014], [ADR 0009]); making it agent-aware would require widening `AgentPromptConfig` (`name`/`promptMode`/`systemPrompt` today) to carry `description`, an ISP regression.
- **Removing `genericBase` entirely was offered and declined.**
  It would leave a `general-purpose` child in append mode with an empty `systemPrompt` holding tag + env + project context and no instructions at all.
- **Verified rather than assumed:** that Pi writes no `Available tools:` or `Guidelines:` under `customPrompt` (pinned `@earendil-works/pi-coding-agent@0.84.4`, `dist/core/system-prompt.js`), and that `@gotgenes/pi-anthropic-auth`'s `PI_DEFAULT_PROMPT_PREFIX` and `PARAGRAPH_REMOVAL_ANCHORS` match neither the old nor the new text.
- **Doc slip found while deriving the release recommendation:** the roadmap's `Release batches` "Independently releasable" enumeration omits Step 20 even though the step carries `Release: independent`.
  The plan's docs step corrects it.
- **The reproduction was run through the real code path**, as a disposable vitest probe calling `buildAgentPrompt` with the real `Explore` config and a `portable` strategy; the measured output is quoted in the plan's Problem Statement and the probe was deleted.

#### Deferred tidyings

- `packages/pi-subagents/test/session/prompts.test.ts` — an `identityRegion(prompt, agentName)` helper for slicing a prompt at the `<active_agent>` tag; the assessor declined it as having one call site (the new test), and the six existing `indexOf('<active_agent …')` uses are ordering comparisons rather than region scoping.

## Stage: Implementation — TDD (2026-09-18T21:17:44Z)

### Session summary

Executed all three planned steps: the preparatory `test:` tidy naming the fallback text in one `GENERIC_BASE` constant, the `fix:` reducing `genericBase` to `# Instructions` plus the unchanged imperative, and the `docs:` step amending [ADR 0009] and marking roadmap Step 20 landed.
Test count in `packages/pi-subagents/test/session/prompts.test.ts` went 66 → 67; the package suite is 1792 green.
No deviations from the plan.

### Observations

- **Every predicted mutation outcome matched exactly**, including the counts.
  Mutating one character inside `GENERIC_BASE` killed exactly the 7 repointed assertions; re-adding the capability sentence to `genericBase` killed 8 (those 7 plus the new test); re-adding only the role sentence killed 7 and left the new test green.
  That last split is the one worth keeping: it demonstrates the new test pins the *capability claim* while the constant pins the *exact text*, and neither covers the other.
- **The third mutation was a test-side one** — widening the new test's slice from `prompt.slice(0, prompt.indexOf("<active_agent"))` to the whole prompt turned `/\bwrite\b/i` red against `Explore`'s own "heredocs to write to files".
  The region scoping is load-bearing, not decorative, and that is now demonstrated rather than asserted.
- **The Tidy-First step paid off exactly as the assessor predicted.**
  The `fix:` commit's edit to the existing suite was a single constant value; without it the same commit would have improvised replacement wording at seven sites.
- **`[ADR-0014]` is a dangling reference in `architecture.md`** — used at line 1332 (pre-existing) and now also in the `Landed:` note, with no `[ADR-0014]:` definition in that file.
  `rumdl` does not flag it.
  Left as found rather than fixed in a `fix:`-scoped session.
- Pre-completion reviewer: **PASS**, no warnings.
  It independently re-derived the reachability claim, confirmed `renderToolSurface` anchors on `Current working directory:` / `Available tools:` / `Guidelines:` (none touched), and rendered all six Mermaid charts through `mmdc`.

[ADR 0009]: https://github.com/gotgenes/pi-packages/blob/main/packages/pi-subagents/docs/decisions/0009-portable-inheritance-is-provider-scoped.md
[ADR 0014]: https://github.com/gotgenes/pi-packages/blob/main/packages/pi-permission-system/docs/decisions/0014-tool-surface-is-node-local-prose.md
