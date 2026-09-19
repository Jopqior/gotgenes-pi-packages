---
issue: 14
issue_title: "Sync upstream main with fork compatibility review"
---

# Sync upstream with fork compatibility safeguards

## Release Recommendation

**Release:** ship independently

This is repository-wide integration, not a package roadmap batch.
The operator explicitly authorized publishing a new `@jopqior/pi-subagents` version after integration and green fork CI, superseding the issue body's original no-publication default.
During implementation, the derived core major exceeded the published companion's caret dependency range, and the operator explicitly authorized the companion compatibility update and coordinated publication too.
Dispatch `pi-subagents pi-subagents-model-selector` to the fork's `release.yml`, targeting npmjs.org under `@jopqior/*`; publication of any other package remains unauthorized.
Keep the companion's `workspace:^` dependency: packing after both versions are assigned derives the new core range automatically.
Document coordinated upgrades in the companion README and verify a packed release-version fixture before shipping.
Keep the current fork version during conflict resolution and let the release scripts derive the next version at ship time.
Do not promise a patch or copy the upstream version number.

## Problem Statement

Upstream has accumulated runtime changes, breaking permission and session-listing behavior, project configuration, and a substantial agent-documentation reorganization since the previous real merge.
Accepting only conflict-free files is insufficient: fork selection wiring, package identity, artifact lookup rules, and bounded release derivation can regress in an automatic merge.
An incoming tracked permission config also collides with an untracked local file.

## Goals

- Integrate the reviewed upstream batch through `scripts/upstream-sync.sh --merge`, preserving real two-parent ancestry.
- Accept all incoming upstream behavior, including breaking MCP matching and the bounded session listing, while preserving fork spawn selection and package identity.
- Explicitly classify this integration as behavior-breaking; carry migration information in a `BREAKING CHANGE:` footer and the sync handbook.
- Follow the operator's decision to discard the existing local yolo configuration without a backup and adopt upstream's tracked config.
- Remove project loading of `pi-web-access`, as upstream does.
- Adopt the topic-skill split while keeping fork repository, release, SSH/tag-isolation, and `fNNNN-` requirements authoritative.
- Regenerate the lockfile; verify package, repository-script, public-type, lint, and dead-code gates.
- Record the actual upstream and merge SHAs; subsequently ship and publish `@jopqior/pi-subagents` to npmjs.org from this fork.

## Non-Goals

- Reimplementing upstream fixes as fork patches or cherry-picking only selected upstream features.
- Rewriting history, importing upstream tags, or modifying previously published tags or artifacts.
- Adding a new local-config layer, moving yolo to global settings, or preserving the discarded local preference.
- Renaming `Symbol.for()` identities or changing the spawn-selection contract.
- Publishing `@gotgenes/*` packages or the model-selector companion without additional approval.
- Adopting open upstream PRs outside the reviewed commit graph, or closing upstream issues/PRs.
- A new improvement phase or unrelated preparatory refactors.

## Background

The issue author and authenticated operator are both `Jopqior`.
Its `scope:repo` label matches changes in four packages plus repository tooling; no package-specific issue relabeling is needed.
No prior fork or inherited retro matching issue 14 was found.
The fork's open-issue sweep found only this issue, and its open-PR sweep was empty.
The latest local backlog triage is `docs/triage/2026-09-02-backlog.md`, an upstream artifact with no fork-issue disposition.
Upstream's open PR list was inspected; those proposals are not additional merge inputs.

Prerequisites [#11] and [#13] are closed and implemented: the bounded git-cliff walk survives the restoration of genuine upstream ancestry.
Their closing discussion, not their historical pre-restoration SHAs, governs this plan.
The SSH synchronization fix is already committed locally but remains ahead of `origin/main`; shipping this issue must carry it too.

### Measured planning baseline

| Item                                                      | Measured value                             |
| --------------------------------------------------------- | ------------------------------------------ |
| Fork HEAD                                                 | `971bcdee8fcdb490db961e3bf4f09b927b48bd68` |
| Incoming upstream HEAD                                    | `edb35ee28535aac4e12431e47e440f6933911834` |
| Merge base                                                | `045213317de608c04a7b6052b2b843e3a0f2176f` |
| Fork-only / upstream-only commits                         | 104 / 215                                  |
| Upstream changed files from the base                      | 220                                        |
| Content-conflicted paths in `git merge-tree --write-tree` | 6                                          |
| Local tags                                                | 7, all fork package tags                   |
| Fork subagents manifest                                   | `@jopqior/pi-subagents`, `1.0.2`           |
| Incoming subagents manifest                               | `@gotgenes/pi-subagents`, `21.7.3`         |
| Existing release regression suite                         | 9 tests passed                             |
| Current subagents release derivation                      | Nothing to release at the current tag      |

These are measurements of the planning snapshot, not promised implementation counts.
The merge-tree probe created Git objects only; it did not modify the index or working tree or start a merge.

## Design Overview

### Integrate rather than redesign

Use the existing sync script in the root checkout on `main`, the explicitly documented exception to ordinary feature-branch landing.
Do not squash, replay, or replace the incoming history.
Retain all incoming changes except the documented fork-preservation resolutions below.
If the fetch brings a different upstream tip, review the additional delta and repeat the conflict inventory before accepting that tip.
The script fetches again in merge mode: verify the actual second parent against the reviewed tip before completing a conflicted merge or shipping an automatically completed one.

The Tidy-First assessment recommends no preparatory commits.
Source refactoring before integration would add overlapping hunks rather than make the merge easier.
The assessment incorrectly generalized `loadProjectContext` as optional everywhere: it is optional on the prompt-builder parameter, but required on incoming `AssemblerIO`.
Keep upstream's fixture and composition-root updates in the same merge.
The release test is a Vitest test; run it with pnpm/Vitest, not `node --test`.

### Operator-selected configuration behavior

The existing untracked `.pi/extensions/pi-permission-system/config.json` contains only `$schema` and `yoloMode: true`.
Immediately before merging, re-read it and confirm it still has that shape; remove only that file, with no backup, as explicitly requested.
If its contents changed or other untracked paths collide, stop rather than broadening this deletion authorization.
Leave unrelated untracked files untouched.
Take the incoming config exactly, including its schema URL and bash tripwires.
Do not add `yoloMode` to the tracked file or modify global settings.
Removing the project override does not guarantee yolo is false if the operator independently configured it globally; inspect the effective configuration when smoke-testing.
The upstream `pnpm add*` rule asks, while the `rg -r*` and bare `git commit -F` rules deny with explanatory reasons.

Take the upstream removal of `npm:pi-web-access` from project settings.
Keep fork-local model-selector loading and both `@jopqior/*` disable entries to prevent duplicate extension loading.
Keep upstream's additional worktrees disable entry.
This changes project configuration only; it neither uninstalls a globally loaded web extension nor promises web tools disappear from every session.

### Compatibility changes accepted

| Surface                            | Before                                                        | After / migration                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP candidates                     | First candidate with a non-default match wins                 | Last rule matching any candidate wins; place intended exceptions after broad rules                                                                |
| Prefix-named MCP tool              | Configured `github` does not derive from `github_search_code` | Longest configured prefix derives the bare server; review server rules that now apply                                                             |
| Already-prefixed explicit MCP tool | Redundant re-prefixed candidates exist                        | Tool name leads; redundant qualified spellings disappear                                                                                          |
| Session discovery                  | Omitted limit lists all files                                 | Omitted limit lists at most 10 newest paths; pass an explicit sufficiently large `limit`; `count` remains total and `shown` reports emitted paths |
| Child project context              | Relocated/full and portable children can carry parent context | Resolve context against the child's directory; same-directory full inheritance keeps its existing block                                           |
| Fallback child identity            | Claims a general coding role and tools                        | Neutral instructions without unsupported capability claims                                                                                        |
| Resume cancellation                | A resumed run can escape the exposed abort controller         | Each run owns the current controller; abort reaches the resumed loop                                                                              |
| Autoformat configuration           | Default agent directory ignores the override                  | Resolve global config through Pi's `getAgentDir()`, honoring `PI_CODING_AGENT_DIR`                                                                |

The session-listing default is a measured source constant, not a performance estimate.
Incoming `list_subagent_sessions` is accepted alongside the bounded listing.
Incoming permission prompt preservation, missing-authorizer warning, dropped-command salvage, command-log redaction, and dialog-key configuration are also accepted; this table highlights migration-sensitive behavior rather than excluding the rest.
No package scope expansion is invented: these changes stay within the existing permission, session discovery, formatting, and child-execution responsibilities.

### Fork selection and upstream context wiring

Preserve the composed interaction already visible in the automatic merge:

```typescript
const loadProjectContext = createProjectContextLoader(loadProjectContextFiles, getAgentDir());
const assemblerIO = { buildAgentPrompt, loadProjectContext };
// Pass assemblerIO through the existing session dependencies.
selectionScope.constructChild(() => createSubagentSession(params, sessionDeps));
```

The upstream loader consumes only context-file `path` and `content`, and returns a rendered string rather than mutating caller state.
The SDK discovery dependency stays at the composition root; the child cwd is supplied at assembly.
The model choice still occurs before workspace/session creation, and resume reuses the existing selected pair without reopening the chooser.
Retain both the upstream per-run abort-controller lifecycle and the fork's awaitable resume handle.

Design-review checklist: no new fork dependency bag, output mutation, reset scheme, discriminator family, or cross-extension bridge is introduced.
The incoming loader is a narrow function; the existing assembler relays it to the prompt builder, which owns the decision to perform directory IO.
Do not refactor that upstream relay during integration.
Keep `AssemblerIO` producers and tests together, and verify the real fork selection stack rather than replacing it with mocks of the manager.

### Documentation split

Keep the fork's high-priority scope/operation section at the top of `AGENTS.md`, then adopt upstream's compact principles and skill index instead of restoring the old monolithic body.
Reconcile the incoming topic skills with that section: explicit fork `--repo`, `main`, approved npm scope/destination, npmjs registry flags, SSH-only upstream synchronization, and no upstream tag imports.
Keep `fNNNN-` creation and short-circuit lookup in the markdown skill and all lifecycle prompts.
Distinguish the feature-worktree linear landing rule from the genuine upstream merge required here.
Use the actual local shell/environment rather than copying upstream's assertion that this tool always runs zsh.
Preserve fork module descriptions in the subagents skill and architecture doc while accepting upstream's Phase 22 archive and new project-context module.
Recount current modules if editing a module count; do not add the two branches' counts.
Do not mark fork issue 14 as an upstream roadmap step.

### Release workflow

Accept removal of `RELEASE_PLEASE_TOKEN` from checkout and the incoming pipe-free `latest_tag()`.
Planning-time GitHub API checks found no fork rulesets and `main.protected=false`; the workflow grants its prepare job `contents: write`, despite the repository's read-only default token permission.
Recheck those facts at ship time.
A release commit pushed by `GITHUB_TOKEN` does not trigger ordinary push CI; verify the pre-release SHA's CI and all release jobs instead of waiting indefinitely for a release-commit CI run.
Preserve `bumped_version()` and its explicit lower bound, plus both consumers in next-version and parity scripts.
The simulated merged `lib.sh` contains both mechanisms.

Only resolve existing changelog conflicts: keep fork release sections intact at the top and splice incoming upstream sections below them without duplicating the shared baseline.
Do not generate or hand-author a future fork release section.
Keep fork package name, current version, repository/homepage/bugs URLs, exports, and contract identities.
The release workflow owns the later version/changelog update.
A real new breaking commit is not a false-major bug; inspect the derived release and its input history before dispatch.
The companion's published dependency range must be checked against the eventual core version; if it cannot consume the new version, stop and obtain approval for a companion update/release rather than quietly widening publication scope.

## Module-Level Changes

The complete incoming file set is defined by `git diff --name-status 045213317de608c04a7b6052b2b843e3a0f2176f edb35ee28535aac4e12431e47e440f6933911834`.
Take that set through the merge; do not manually recreate its source/test changes.

### Content conflicts

| Path                                                      | Resolution                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                               | Fork scope header plus upstream topic-skill structure; correct fork targets and environment claims  |
| `.pi/skills/package-pi-subagents/SKILL.md`                | Keep selection seams and fork context; accept upstream offload and updated context/resume behavior  |
| `README.md`                                               | Keep fork identity, package rows and sync instructions; accept upstream skill/documentation updates |
| `packages/pi-subagents/CHANGELOG.md`                      | Preserve fork entries, incorporate only newly arriving upstream sections                            |
| `packages/pi-subagents/docs/architecture/architecture.md` | Preserve fork modules/contracts; accept archive relocation and updated current behavior             |
| `packages/pi-subagents/package.json`                      | Preserve fork name/version/URLs, take non-conflicting upstream metadata/dependencies                |

### Both-sided automatic merges requiring individual review

- `.pi/prompts/build-plan.md`, `plan-improvements.md`, `plan-issue.md`, `pr-review.md`, `retro.md`, `ship.md`, `sync-worktree.md`, and `tdd-plan.md`: retain fork artifact paths and lookup precedence at every occurrence, including output-format sections.
- `.pi/settings.json`: accept web-access removal and worktrees disable entry; retain fork additions.
- `.pi/skills/markdown-conventions/SKILL.md` and `.pi/skills/pre-completion/SKILL.md`: retain fork naming, numeric frontmatter, and short-circuit artifact discovery.
- `packages/pi-subagents/README.md` and `docs/configuration.md`: retain fork selection instructions alongside upstream context/resume changes.
- `packages/pi-subagents/src/index.ts`: keep both `loadProjectContext` assembly and `selectionScope.constructChild` wiring.
- `packages/pi-subagents/src/lifecycle/subagent-manager.ts`: preserve selection admission and upstream resume-abort behavior.
- `packages/pi-subagents/src/lifecycle/subagent.ts`: retain selection cancellation, selected pair, awaitable resume, and incoming controller renewal.
- `packages/pi-subagents/src/service/service.ts`: preserve `SpawnSelection*` APIs and incoming resume contract wording.
- `packages/pi-subagents/test/lifecycle/create-subagent-session.test.ts`, `subagent-manager.test.ts`, and `subagent.test.ts`: preserve fork tests and upstream fixture/assertion updates together.
- `scripts/release/lib.sh` and `scripts/release/next-version.sh`: preserve bounded derivation, accept pipe-free tag lookup and relocated documentation links.

### Other integration touch points

- `.pi/extensions/pi-permission-system/config.json`: replace the explicitly authorized untracked file with incoming tracked rules.
- `.github/workflows/release.yml`: accept default-token checkout; keep explicit dispatch and SHA guard.
- Incoming `.pi/skills/{releasing,git-workflow,worktrees,reading-artifacts,delegation,clarification-gates,edit-tool,reproduction,shell-traps}/SKILL.md`: reconcile operational examples against fork authority; retain their upstream decomposition.
- Incoming `scripts/permission-config/tripwire-rules.mjs` and `test/permission-config/tripwire-rules.test.mjs`: keep the tracked-config validation design unchanged.
- `pnpm-lock.yaml`: regenerate from the resolved manifests with `pnpm install`, even if no textual conflict occurred.
- `docs/upstream-sync.md`: add this batch's conflict recipes, migration notes and actual sync-log row; add published version correspondence only after successful publication.
- Root `docs/retro/f0014-upstream-compatibility-sync.md`: accumulate implementation and shipping evidence.

### Predicted unchanged from fork HEAD

| Path                                      | Basis / verification                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `packages/pi-subagents-model-selector/**` | No upstream counterpart; run its suite and packaged dependency compatibility check anyway     |
| `scripts/upstream-sync.sh`                | Existing SSH/no-tag/no-push merge mechanism is sufficient                                     |
| `scripts/release/verify-cliff-parity.sh`  | Already calls the bounded helper; inspect that call after integration                         |
| `test/release/bumped-version.test.mjs`    | Existing real-merge fixtures cover old versus newly merged breaking history                   |
| `.github/ISSUE_TEMPLATE/*.yml`            | No new package directory; retain selector dropdown option                                     |
| `cliff.toml`, `pnpm-workspace.yaml`       | Keep fork release links, path-based release rules, workspace relationship and `trustLockfile` |

A change to a predicted-unchanged path requires explanation, not automatic rejection of a necessary integration repair.

## Test Impact Analysis

This is a merge of already implemented designs, not a fresh extraction: no new lower-level tests are enabled, no existing tests become redundant, and no test deletion is planned.
Keep fork and upstream suites together.
If integration exposes a missing behavioral pin, add a focused regression before the corrective edit and specify its killing mutation at that point.
Do not manufacture red cycles by replaying upstream implementation work.

Planning verified these read-only commands:

```bash
git rev-list --left-right --count HEAD...upstream/main
# 104 215 at the planning baseline

git merge-tree --write-tree HEAD upstream/main
# exit 1: the six documented content conflicts; no worktree/index mutation

pnpm exec vitest run test/release/bumped-version.test.mjs
# 9 passed

./scripts/release/next-version.sh pi-subagents
# Nothing to release at the current fork tag
```

Incoming tests read during planning include `pi-session-tools/test/list-session-files.test.ts` (real tool registration with filesystem doubles), `pi-permission-system/test/access-intent/mcp-targets.test.ts` (real candidate derivation), and `pi-subagents/test/session/project-context.test.ts` (real rendering and injected discovery).
Their assertions pin default/explicit limits and counts, longest-prefix and explicit-server cases, and context rendering/discovery respectively.
Run the full package suites after merging; these targeted files alone do not prove integration.

## Invariants at risk

| Invariant / constituency                                                                               | Verification                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Descendant selections reach the root provider with the descendant's catalogue; two roots stay isolated | `packages/pi-subagents/test/lifecycle/nested-selection.test.ts`, read during planning; real service/runtime/manager with a stubbed session factory |
| Abort while selecting prevents session creation and releases admission; resume does not ask again      | Same file's queued/active abort and resume blocks; retain incoming lifecycle tests as well                                                         |
| The actual SDK session construction preserves child selection scope and new loader wiring              | Run full subagents suite and its public-type verification; inspect `index.ts` composition explicitly                                               |
| Old merged breaking history stays excluded, new breaking history stays releasable                      | `test/release/bumped-version.test.mjs`, read and run during planning; real scratch Git repositories and real git-cliff                             |
| Session listing remains newest-first and truthfully reports totals                                     | Incoming `test/list-session-files.test.ts`; default output and `count`/`shown` assertions                                                          |
| MCP prefix ownership is longest-match and reporting favors the specific tool                           | Incoming `test/access-intent/mcp-targets.test.ts`; also run manager/rule suites for policy-order decisions                                         |
| Fork-only package identity and published changelog survive                                             | Diff resolved manifest fields and fork changelog sections against saved pre-merge Git ref                                                          |
| Upstream tags never enter the fork namespace                                                           | Compare sorted tag names and object IDs before/after sync; script also compares names                                                              |
| Fork plan/retro lookup takes prefixed files first                                                      | Read every changed lifecycle prompt and markdown/pre-completion skill; exercise lookup against existing fork artifacts                             |

The existing `nested-selection` tests do not exercise the real resource loader; do not claim they prove composition-root wiring.
No new token-budget or cache-performance claim is made by this integration.
Accept upstream's own same-directory versus relocated-context boundary without inventing a quantitative improvement.

## TDD Order

Execute as `/build-plan`: numbered integration/verification checkpoints, not new red-green feature development.
The Tidy-First assessment adds no preparatory source or test commits.

1. **Refresh and establish rollback/verification references.**
   Start in the root checkout on `main`, with clean tracked files and index; record the pre-merge commit and sorted tag names/object IDs outside the tracked tree.
   Read the live issue/plan decisions; use `./scripts/upstream-sync.sh` for the fetch, compare the incoming SHA, and repeat `git merge-tree` if either side advanced.
   Recheck remote fetch/push URLs and exact no-tag configuration.
   Run the existing release regression and subagents/model-selector suites as a baseline.
   No commit and no publication in this step.

2. **Merge the upstream batch with fork-preserving resolutions.**
   Re-read and remove only the authorized local permission file, without backup, immediately before `./scripts/upstream-sync.sh --merge`.
   Leave an expected conflicted merge in progress; load the conflict-resolution skill and resolve the six documented paths without wholesale ours/theirs selection.
   Review every automatic-merge path above and reconcile new topic skills in the same integration.
   Regenerate `pnpm-lock.yaml`; clear rumdl's cache because upstream relocates architecture content.
   Keep upstream source changes, test-fixture updates, and fork behavior together in this commit.
   Validate `git diff --check`, type checks, full lint, package tests and repository-script tests before finishing the conflicted merge.
   Use an explicit merge message file with subject `feat!: sync upstream behavior while preserving fork selection (#14)` and a `BREAKING CHANGE:` footer describing MCP rule order/prefix matching, the default listing cap, directory-resolved child context, the autoformat directory override, and adopted project defaults.
   Finish with `git commit -F <message-file>` while `MERGE_HEAD` exists so both parents are retained.
   If the script already completed a conflict-free merge after upstream moved, inspect its parents and use a separate compatibility-note commit rather than blindly amending an unknown HEAD.

3. **Verify the integrated runtime and release surfaces.**
   Run the complete gates below on the merged tree, including autoformat's separate acceptance suite.
   Run `pnpm --filter @jopqior/pi-subagents run verify:public-types` and inspect a packed tarball for the new context module, fork identity, declarations, and excluded development artifacts.
   Run the selector suite against the workspace core; review the packed selector's dependency range against the derived next core version before recommending publication.
   Start a fresh Pi session for a smoke test: confirm model/thinking selection, cancellation, resumed-run abort, bounded listing, project permission tripwires and intended extension loading.
   The implementation session's old in-process tools are not evidence of the new behavior.
   No new tests are planned, so there is no new-test killing mutation for this checkpoint.
   Any necessary repair gets its own red test and `fix(<package>): <observable repair> (#14)` commit, rather than weakening assertions or broadening this plan silently.

4. **Record integration evidence and complete pre-completion review.**
   Record UTC time from `date`, the actual upstream tip, the actual two-parent merge SHA, and the newest contained upstream subagents release in `docs/upstream-sync.md`.
   Use a later docs commit so the merge SHA is resolvable; do not put the docs commit SHA in the merge column.
   Add concise migration notes and implementation-stage evidence, including the tag-set comparison and complete gate results.
   Run the fresh-context pre-completion reviewer and resolve its blocking findings.
   Commit: `docs: record upstream compatibility sync and migration notes (#14)`.
   Stop implementation here and hand off to `/ship 14`.

5. **Ship and release, in the later shipping session only.**
   Re-verify the fork target, push explicitly to `origin main`, and verify CI for the pushed SHA.
   Run the read-only release derivation/parity checks and review the actual commit window; do not copy upstream version numbers or silently release the companion.
   Recheck token permissions/rulesets and npm Trusted Publishing configuration as needed; dispatch `release.yml` with `--repo Jopqior/gotgenes-pi-packages`, `packages="pi-subagents pi-subagents-model-selector"`, and the expected SHA.
   Watch prepare, publish and GitHub-release jobs, not a nonexistent push-CI run for the token-generated release commit.
   Verify the published `@jopqior/pi-subagents` version and tarball using `pnpm view ... --registry=https://registry.npmjs.org/`.
   Record the now-published fork/upstream version correspondence and ship notes; close the fork issue with the implemented-in SHA and migration/release summary.
   No upstream mutation is authorized.

### Integrated verification commands

```bash
pnpm install
pnpm run check
NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint
pnpm -r run test
pnpm run test:scripts
pnpm --filter @gotgenes/pi-autoformat run test:acceptance
pnpm --filter @jopqior/pi-subagents run verify:public-types
pnpm fallow dead-code
./scripts/release/next-version.sh pi-subagents
./scripts/release/verify-cliff-parity.sh
```

Use unpiped checks or preserve their exit codes; also inspect warning output.
The root release tests require `git-cliff` on PATH and must not be skipped.
The parity report may report never-published sibling packages; that does not authorize publishing them.

## Risks and Mitigations

- **Untracked data loss:** deletion authorization is limited to the known local yolo file; re-read before deleting, and stop on unexpected content.
- **Automatic merge hides a semantic regression:** retain the full both-sided audit list, real fork selection tests, incoming tests, and fresh-session smoke test.
- **Required fixture field dropped:** `AssemblerIO.loadProjectContext` is required; retain incoming fixture updates and run type checks before commit.
- **Agent-document split erases fork governance:** keep the fork header authoritative, inspect topic-skill examples and all artifact lookup occurrences, and read current templates after restart.
- **Wrong release boundary or package identity:** preserve bounded derivation and manifest fields, run real-merge regression fixtures, inspect the generated release window and package tarball.
- **Companion cannot consume a derived major:** inspect its published dependency range; obtain explicit approval for any additional compatibility/publication work.
- **Default-token release stalls on changed repository policy:** recheck actual fork rulesets/protection before dispatch; stop on mismatch rather than restoring a credential speculatively.
- **Upstream changes between planning and merge:** compare fetched/merged tips and review added changes before acceptance; never ship an unreviewed second parent.
- **Release notes contain upstream issue references:** preserve imported history as history; qualify newly authored upstream references and keep fork issue links explicit.

## Open Questions

No unresolved product-direction question: the operator accepted upstream behavior, config replacement without backup, web-access removal, and a fork subagents release.
The exact release version and companion compatibility are ship-time derivations, not guessed plan values.
No concrete standalone follow-up was identified; no speculative issue is filed.

[#11]: https://github.com/Jopqior/gotgenes-pi-packages/issues/11
[#13]: https://github.com/Jopqior/gotgenes-pi-packages/issues/13
