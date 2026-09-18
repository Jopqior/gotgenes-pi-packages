---
issue: 928
issue_title: "MCP permission targets: prefix-named tools derive no server; proxy-shaped MCP clients are invisible to the mcp surface"
pr: 929
---

# MCP permission targets: prefix-named tools derive no server

## Stage: PR Review (2026-09-18T16:28:19Z)

### Session summary

PR #929 from @georgeharker makes prefix-named MCP tools (`github_search_code`, the shape the `mcp()` proxy and mcp-combiner both produce) derive a bare-server permission candidate, so an exact-server rule such as `mcp: {"github": "deny"}` can fire without an explicit `server` argument.
The defect is real and reproduces on current `main`; the PR's own gate is green.
The operator chose **adopt the capability with our own simplified design** — and the review surfaced a deeper cause than the PR addresses: `evaluateFirst`'s candidate short-circuit silently overrides the package's last-match-wins rule policy on the `mcp` surface, so the work is planned as two sequenced steps under one `feat!` bump.

### Verify gate

**Reproduced on current `main`.**
A scratch Vitest file against `createMcpPermissionTargets` (`src/access-intent/mcp-targets.ts`), since deleted:

- `createMcpPermissionTargets({ tool: "github_search_code" }, ["github", "todoist"])` → `["github_search_code", "mcp_call"]`.
  No bare `github` candidate, so `mcp: {"github": "deny"}` never fires.
  `addDerivedMcpServerTargets` requires `endsWith("_" + server)` and then explicitly `continue`s on `startsWith(server + "_")`, so a prefix-named tool falls through both guards.
- `createMcpPermissionTargets({ tool: "github_search_code", server: "github" }, [])` → `["github_github_search_code", "github:github_search_code", "github", "github_search_code", "mcp_call"]`.
  The first two candidates match nothing and push the useful ones down an ordered list.

**Not already fixed.**
`git log -S` over `src/` finds no prior guard; the only commit touching this region is `d4318c92` (a directory move, #579).
The `startsWith` skip has been there since the module was extracted.

**Real boundary confirmed.**
`normalizeInput` (`src/access-intent/input-normalizer.ts:175`) is the only caller, reached from `PermissionManager.check` (`src/policy/permission-manager.ts:339`) with `loader.getConfiguredMcpServerNames()`.
The PR touches exactly that path.

**Reachability for us.**
This repo runs no MCP adapter: `~/.pi/agent/mcp.json` is absent, so `getConfiguredMcpServerNames()` returns `[]` and the derivation is a no-op; no `mcp` tool is registered, so `classifyToolKind` never routes to the surface.
We are immune; MCP users of the published package are not.
Worth noting for the plan: the server list is read only from `~/.pi/agent/mcp.json`, which is `pi-mcp-adapter`'s file rather than a Pi core file, so the derivation helps only users of that adapter's config location.

**Checks run in a scratch worktree** (`git worktree add /tmp/pr-929 pr-929`, since torn down):

- `pnpm run check` — clean across all nine packages.
- `pnpm run lint` — Biome 690 files, ESLint 1170 files, `rumdl` — no issues.
- `pnpm --filter @gotgenes/pi-permission-system run test` — 164 files, 4352/4352 passing.

### Evaluation

**Valuable, and worth keeping:** the capability itself, the longest-match-only rule, the prefix-suppresses-suffix disambiguation, the removal of redundant re-prefixed candidates, and the six new test cases, which are well-named and pin the right behaviors.

**What I would change.**

1. **The longest-match invariant is not owned by the module that depends on it.**
   The new code comments that "the configured list is ordered longest-first" and relies on it for correctness, but that ordering is established three modules away, by the sort comparator in `getConfiguredMcpServerNamesFromPaths` (`src/config/policy-loader.ts`).
   The exported signature — `configuredServerNames: readonly string[] = []` — advertises no such contract, and `PolicyLoaderOptions.mcpServerNames` (the test-only override path) does **not** sort.
   Measured on the PR branch: `createMcpPermissionTargets({ tool: "foo_bar_baz" }, ["foo", "foo_bar"])` → `["foo", "foo_bar_baz", "mcp_call"]` — the wrong server, silently.
   `addDerivedMcpServerTargets` should select the longest matching prefix itself; the invariant then lives where it is depended upon.

2. **Candidate order is precedence, and the PR inverts the module's own convention.**
   `evaluateFirst` (`src/policy/rule.ts:231`) returns at the first candidate matching any config-layer rule.
   On current `main` a qualified name or an explicit `server` produces `["github_search_code", "github:search_code", "github", "search_code", "mcp_call"]` — server-qualified forms first, bare server third.
   A prefix-named tool *is* that candidate[0] form, so the PR's `expect(targets[0]).toBe("github")` makes the bare server outrank a server-qualified name for the first time in the module, contradicting both the module docstring ("ordered from most-specific to least-specific") and the PR's own new docs table, which advertises `"myServer_*"` for tool-level policy — a shape unreachable whenever a bare-server rule also exists.
   `PermissionCheckResult.target` is the matched candidate (`permission-manager.ts:380`), so the ask prompt and review log read `target: github` instead of naming the tool actually being called.

3. **Two independent changes in one commit.**
   The re-prefix removal in `pushMcpToolPermissionTargets` touches the explicit-`server` path and is not required by the prefix-derivation fix.
   It is a clear improvement and should land as its own step.

4. **Structure.**
   Two `for` loops over the same list, the first returning out of the enclosing function, with the second being the old body.
   A named `findLongestConfiguredPrefix` helper plus a guard clause reads better and localizes finding (1).

5. **Docs.**
   `short-circutes` → `short-circuits`.
   The derivation is heuristic and the added docs should say so: a configured server `git` attaches to `git_lab_issues` from a different server (measured: `["git", "git_lab_issues", "mcp_call"]`), which is a fail-open when the rule is `allow`.

### The deeper cause

The review found that `evaluateFirst`'s candidate short-circuit silently overrides the package's stated last-match-wins policy on the `mcp` surface.
Two orderings are in play: rule order (last-match-wins, the policy) and candidate order (first candidate with any match, `evaluateFirst`).
The second pre-empts the first — it selects a candidate, then applies last-match-wins within that one candidate.

Measured through `evaluateFirst` and `evaluateAnyValue`, candidates `["github", "github_search_code", "mcp_call", "mcp"]` (server-first) versus `["github_search_code", "github", "mcp_call", "mcp"]` (tool-first):

| Config                                      | `evaluateFirst` server-first | `evaluateFirst` tool-first | `evaluateAnyValue`, either order |
| ------------------------------------------- | ---------------------------- | -------------------------- | -------------------------------- |
| `{github: deny}`                            | deny `github`                | deny `github`              | deny `github`                    |
| `{github: deny, github_search_code: allow}` | deny `github`                | allow `github_search_code` | allow `github_search_code`       |
| `{*: ask, github: deny}`                    | deny `github`                | ask `*`                    | deny `github`                    |
| `{*: deny, github: allow}`                  | allow `github`               | deny `*`                   | allow `github`                   |
| `{github: deny, *: ask}` — catch-all last   | ask `*`                      | ask `*`                    | ask `*`                          |

The last row is the control: `evaluateAnyValue` privileges rule **position**, not specificity, so a catch-all written last still wins.
That is last-match-wins, which makes routing `mcp` through it a faithful application of the existing policy rather than a new one.
Under `evaluateAnyValue` candidate order no longer affects any decision — it survives only as the tie-break for the reported `target` string, at which point tool-name-first wins trivially because it names the tool being called.

**Archaeology.**
`evaluateFirst` was introduced in `55029597` (2026-05-04) as a step of #81, whose plan (`docs/plans/0081-unify-checkpermission-surface-branching.md`) declares "Pure refactor: no change to permission decisions" and lists changing decision output as a Non-Goal.
It is a verbatim lift of the pre-#81 MCP branch's loop (`git show 55029597^:src/permission-manager.ts`, lines 575–578).
It was never a designed matching policy and has no ADR.
`evaluateAnyValue` arrived five weeks later (`2b7d2409`, #393) to fix the same masking, discovered first on path aliases.

**Blast radius is the `mcp` surface alone.**
`buildCheckResult` formally routes every non-`PATH_SURFACES` surface through `evaluateFirst`, but `normalizeInput` gives `skill`, `bash`, `path`, and `extension` a single-element `values` array, where the loop runs once and `evaluateFirst` degenerates to plain `evaluate`.
MCP is the only surface carrying a multi-candidate list.

### Decision and attribution

**Direction: adopt the capability, plan a simplified design.**
PR #929 is reference, not the merge target.
Plan via `/plan-issue #928`; the direction is settled here and should not be re-litigated.

**Scope, as two sequenced steps under one `feat!` bump:**

1. *(Preparatory, tidy-first.)* Route the `mcp` surface through `evaluateAnyValue` in `buildCheckResult` (`src/policy/permission-manager.ts:372`), so rule position decides and a user-written `mcp` catch-all no longer masks a later, more specific rule.
   Pin the session-rule interaction: #81 step 1 appends session rules to `fullRules`, so under `evaluateAnyValue` a session grant always wins where under `evaluateFirst` it could lose to a config rule matching an earlier candidate.
2. Add prefix derivation to `addDerivedMcpServerTargets`, with the longest-match selection owned by that function rather than by the caller's sort order, and candidates ordered tool-name-first for prompt and review-log fidelity.
   Land the explicit-`server` re-prefix removal as its own step.
   Carry the docs, with the heuristic's fail-open limit stated and the typo fixed.

**Release classification: `feat!` (breaking).**
A default changes on upgrade with no user config edit, and one direction is permissive: an existing `mcp: {"github": "allow"}` starts auto-allowing prefix-named tools that previously fell through to the catch-all.
The `evaluateAnyValue` routing compounds this for every MCP call whose config writes a broader rule after a narrower one.
Given the package's least-privilege priority, both warrant a major and a migration note.

**Non-goals for this issue:**

- PR 2 of the series (`registerMcpProxy`, routing arbitrary proxy tool names to the `mcp` surface) — gap 2 of #928, its own issue.
- Removing the literal `mcp` special case from `classifyToolKind`.
- Changing `evaluateFirst` for any surface other than `mcp`.

**Attribution.**
Every implementation and docs commit for this work carries, at the end of the body after a blank line:

```text
Co-authored-by: George Harker <george@georgeharker.com>
```

The PR close comment at ship stage thanks `@georgeharker` by name, links the implementing SHAs, and explains that we took the capability with a simplified derivation plus the underlying `evaluateFirst` fix his report exposed.
Reference the PR as `Refs #929`, never `Closes #929`.

## Stage: Planning (2026-09-18T17:13:46Z)

### Session summary

Wrote `docs/plans/0928-mcp-prefix-named-server-derivation.md` as five TDD steps under one breaking release.
The PR-review stage had already settled the direction, so this session's work was measuring the change rather than deciding it: a spike in a throwaway worktree ran a 12-config × 11-input matrix through the real `PermissionManager` before and after both changes, which shifted the plan's center of gravity from the derivation fix to the matcher underneath it.
The operator widened step 1 from the recorded "route `mcp` through `evaluateAnyValue`" to deleting `evaluateFirst` outright, and asked that #687 be told now rather than at ship.

### Observations

- **The spike changed the framing.**
  37 of 132 matrix rows move, and **0 of 4413 existing tests** move with them — `main` and the patched tree are both 165 files / 4413 passing.
  Nothing in the suite pins the `mcp` matcher, so the plan treats the green suite as evidence of a coverage gap rather than of safety, and every step names a killing mutation.
- **The package's own documented example is broken on `main`.**
  The `docs/configuration.md:510` config silently drops `mcp_list: "allow"` and `dangerousServer: "deny"`, the latter even with an explicit `server` argument that already derives the right candidate.
  That row needs no prefix derivation at all, which is what established the matcher as the primary defect and the derivation as a second, independent gap.
  `README.md:134` has claimed last-match-wins for the `mcp` surface all along.
- **Deleting `evaluateFirst` rather than widening its discriminator.**
  `normalizeInput`'s `switch` is exhaustive over `ToolKind` and gives every non-`mcp` arm a single-element `values`, where the two evaluators provably agree; the `path-values` branch already routes to `evaluateAnyValue`.
  Measured green with an unconditional `evaluateAnyValue`.
  Rejected the narrower `PATH_SURFACES.has(surface) || surface === "mcp"` because it leaves a second evaluator alive with only degenerate callers — an ad-hoc disjunction where removing the decision is available.
- **The path-alias tests are the regression net.**
  Forcing path surfaces onto `evaluateFirst` turns five red across `permission-manager-unified.test.ts` and `external-directory-symlink-acceptance.test.ts`, measured.
  They already prove `evaluateAnyValue` is correct for a multi-candidate surface, which is most of the argument for the deletion.
- **#687 was not referenced by #928 and is materially affected.**
  Its problem 1 is this exact masking, in its own words, and it proposes an operation-scoped `mcp` config schema partly to route around it.
  Commented on #687 with the measurement and asked its reporter whether the schema is still wanted for problem 2 (discoverability of the synthetic `mcp_*` names) alone.
- **Ordering demoted from a security decision to a display decision.**
  Under one evaluator, candidate order no longer affects any outcome — it selects only the reported `target`.
  So tool-name-first was chosen on prompt and review-log fidelity, not on precedence, and it happens to reproduce the candidate table `main` already produces for qualified and explicit-`server` names.
- **Alternative rejected:** `evaluateMostRestrictive` for the `mcp` surface, so a `deny` on any candidate wins regardless of position.
  That is a different policy from last-match-wins and would contradict `README.md:134`; recorded as an Open Question rather than planned.
- **Two attribution changes are preserved-but-visible**, and both are pinned rather than accepted silently: the baseline auto-allow keeps its action but loses `mcp_describe` as its `matchedPattern` once derivation supplies a server candidate, and a session grant matching a late candidate now wins where it previously lost to a config rule on an earlier one.
- **Scope split:** gap 2 of #928 (routing registered proxy tool names to the `mcp` surface, PR #930's `registerMcpProxy`) filed as [#946] so #928 closes on gap 1 alone.
  Roadmap-fit recorded it out of scope for Phase 15 — it edits `classifyToolKind` and adds a cross-extension registry, sharing no mechanism with that phase's bash token-role loss.

#### Deferred tidyings

The Tidy-First assessor recommended no preparatory commits and its three rejections are recorded here rather than lost:

- `src/policy/permission-manager.ts` — `buildCheckResult` carries 7 positional parameters including both `normalizedToolName` and `toolName`, a genuine ISP-flavored bag; declined because this change edits one line inside the body and touches no parameter.
- `src/access-intent/mcp-targets.ts` — both helpers mutate a `McpTargetList` passed as a parameter rather than returning candidates; declined as the file's existing consistent idiom, which the change fits without friction.
- `test/policy/rule.test.ts` — each `describe` block builds its own local `Rule` fixtures; declined as not worth a commit for the handful of cases this plan adds.

The assessor also corrected the design summary: `addDerivedMcpServerTargets` has **no** early exit today, so a suffix match against several configured servers adds three candidates for each of them.
The current defect is unbounded fan-out, not merely a fragile dependence on the caller's longest-first sort.
That correction is folded into the plan's Design Overview.

[#946]: https://github.com/gotgenes/pi-packages/issues/946
