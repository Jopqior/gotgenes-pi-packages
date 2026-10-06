# @jopqior/pi-subagents-worktrees

[![npm version](https://img.shields.io/npm/v/@jopqior/pi-subagents-worktrees?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/package/@jopqior/pi-subagents-worktrees) [![CI](https://img.shields.io/github/actions/workflow/status/Jopqior/gotgenes-pi-packages/ci.yml?style=flat&logo=github&label=CI)](https://github.com/Jopqior/gotgenes-pi-packages/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io/) [![Pi Package](https://img.shields.io/badge/Pi-Package-6366F1?style=flat)](https://pi.mariozechner.at/)

Git worktree isolation for [`@jopqior/pi-subagents`](https://github.com/Jopqior/gotgenes-pi-packages/tree/main/packages/pi-subagents).

This package forks [`@gotgenes/pi-subagents-worktrees` in `gotgenes/pi-packages`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-subagents-worktrees), retaining its author attribution and MIT license.
Report fork issues in [Jopqior/gotgenes-pi-packages](https://github.com/Jopqior/gotgenes-pi-packages/issues).

This extension registers a `WorkspaceProvider` with the subagents core: opted-in agents run in a temporary git worktree (an isolated copy of the repo), and any changes they make are saved to a branch when they finish.
Worktrees are one _workspace strategy_, not core behavior — so the git plumbing lives here, outside the minimal subagents core (see [ADR-0002] in the pi-subagents package).

## Install

The required peer is `@jopqior/pi-subagents >=1.0.0`; install and load the fork core **before** worktrees.
The open upper bound is a maintenance policy, not a guarantee of compatibility with future core majors.
Worktrees retains its Pi host peer `>=0.75.0`; the selected core's independently declared host peers must also be satisfied.
Installing the upstream core does not satisfy the fork-core import.

The npm commands below apply only after the approved first publication; a fork badge or manifest is not evidence that publication has happened.

```bash
pi install npm:@jopqior/pi-subagents
pi install npm:@jopqior/pi-subagents-worktrees
```

These commands use personal settings (`~/.pi/agent/settings.json`); add `--local` to each for project settings (`.pi/settings.json`), subject to project trust.
Use the same scope when removing a source.
Review the configured package order: this extension registers its provider once when its factory runs, so the core must initialize first.

```json
{
  "packages": [
    "npm:@jopqior/pi-subagents",
    "npm:@jopqior/pi-subagents-worktrees"
  ]
}
```

If the required fork-core module cannot resolve, the static import fails and Pi reports a worktrees extension-loading error.
If the core is installed and resolvable but has not initialized, worktrees still loads configuration and prunes orphaned Git administrative entries, but registers no provider, recovery command or lifecycle handlers.
Loading the core later does not trigger a registration retry; correct the order and reload the extensions.

This is a separate npm identity, not an automatic upgrade or replacement of the upstream package.
When switching an existing npm installation, remove the old companion in its configured scope before installing the fork companion:

```bash
pi remove npm:@gotgenes/pi-subagents-worktrees
```

## Uninstall

```bash
pi remove npm:@jopqior/pi-subagents-worktrees
```

Add `--local` if it was installed project-locally.
This removes the package source, not your rescue branches or preserved worktrees; recover those using the sections below.

## Configuration

Worktree isolation is **opt-in per agent type**.
List the agent types that should run in a worktree in a `subagents-worktrees.json` file:

- Global: `~/.pi/agent/subagents-worktrees.json`
- Project: `<cwd>/.pi/subagents-worktrees.json` (overrides global)

```json
{
  "worktreeAgents": ["general-purpose", "refactorer"]
}
```

An agent type not in `worktreeAgents` runs in the parent working directory, exactly as if this extension were not installed.

## Behavior

- A child whose agent type is listed gets a fresh detached worktree at `HEAD` before it runs.
- When the child ends its turn with a question for you, the worktree is kept so the child can be resumed into it; cleanup happens when the resumed child finishes instead.
  A question you never answer keeps the worktree until the subagents core releases the child's session.
- When the child finishes with no changes, the worktree is removed.
- When the child finishes with changes, they are committed to a branch (`pi-agent-<id>`), and the child's result gains a note: `Changes saved to branch \`<branch>\`. Merge with: \`git merge <branch>\``.
- If a commit hook rejects that commit, it is retried once with `--no-verify`, because the commit exists to rescue work the child already did and a rejecting hook would otherwise cost you that work.
  Files a hook rewrote before failing are re-staged, so a formatter's corrections are committed rather than discarded.
  The note then gains a second line reading `Commit hooks were bypassed to save this work — review the commit before merging.`
- If cleanup fails for any other reason, the worktree is **left in place** rather than removed, and the child's result gains a note: `Worktree cleanup failed; the worktree was left in place at \`<path>\` for manual recovery: <error>`.
  Nothing is deleted while its state is uncertain, so the work stays recoverable.
- If worktree creation fails for an opted-in agent (not a git repo, no commits yet, or `git worktree add` fails), the child run **fails** with an explanatory error rather than silently running unisolated.
- At the start of every session with a UI, any rescue worktrees still on disk are named in a warning, so a preserved worktree is not forgotten once the child's result scrolls out of view.
- At that same point, any `pi-agent-` branch whose work is not yet on `HEAD` is named in a second warning.
  A worktree torn down after the child's result already reached you — a question you never answered, or a session that ended — still commits the child's work to a branch, but there is no result left to print the note into.
  The warning is how that branch is found again.

## Recovering rescue branches

A rescue branch is an ordinary git branch holding one commit of whatever the child had changed.
Inspect it with `git log <branch>` or `git diff HEAD..<branch>`, and merge it with `git merge <branch>` when you want the work.

The warning lists a branch only while its work is not on `HEAD`, so merging one is all it takes to stop hearing about it.
A branch you have decided against is deleted with `git branch -D <branch>` — this package never deletes one for you, because an unmerged branch is exactly the content that is not safe to discard on the extension's judgment.

## Recovering preserved worktrees

A preserved worktree is a plain git worktree with the agent's work still in it.
Inspect it with `git -C <path> status`, and recover the work however you normally would — commit it on a branch, or copy the files out.

Run `/subagents-worktrees` at any time to list the preserved worktrees for the current repository.
Selecting one offers to remove it, and removal happens only after you confirm — nothing here is ever deleted automatically, because a failed cleanup is exactly the case where the content is not safe to discard on the extension's judgment.

A worktree is listed when it is registered with the repository, named with this package's `pi-agent-` prefix, still on disk, and not currently in use by a child of this session.
A worktree belonging to a **different** Pi process running against the same repository cannot be told apart from an abandoned one, so it is listed too — check the path before removing anything.

## Migrating from `isolation: "worktree"`

Earlier versions of `@gotgenes/pi-subagents` accepted an `isolation: "worktree"` spawn flag.
That flag was removed from the core; install this package and list the agent types you want isolated in `worktreeAgents` instead.

## Scope and non-goals

**Purpose.**
The subagents core asks a `WorkspaceProvider` where each child session should run.
This package is one answer: opted-in agents get a temporary git worktree, and whatever they produce is rescued to a branch when they finish.

**In scope.**
The git plumbing bracketing a child run, not losing the child's work when cleanup fails, and making a preserved worktree discoverable and removable.

**Non-goals.**

- _Workspaces for anything but subagent child sessions._
  Worktrees for parallel human-driven Pi sessions are a different mechanism, with different lifetimes and naming, and are not served from here.
- _Anything after the rescue branch._
  Merging it, opening a PR from it, or cleaning up old `pi-agent-*` branches is your workflow.
- _Deleting a preserved worktree automatically._
  A failed cleanup is exactly the case where the content is not safe to discard on the extension's judgment.
- _Handing removal to the agent._
  Recovery is a slash command rather than a tool, keeping a destructive `git worktree remove --force` out of the model's reach.
- _Worktree knowledge in the subagents core._ `git` does not appear there; uninstalling this package leaves children running in the parent's directory.

**Where adjacent requests belong.**
Whether a child gets an isolated workspace at all, the seam that asks, and a child's system prompt or working-directory claim → [@jopqior/pi-subagents](https://www.npmjs.com/package/@jopqior/pi-subagents).

## Maintainer: first fork publication

Follow the [first fork release handoff](https://github.com/Jopqior/gotgenes-pi-packages/blob/main/docs/upstream/fork-release-policy.md#first-fork-release-handoff).
The operator explicitly selected `0.1.0` for bootstrap; it is not a guessed next version or the inherited upstream version.
Migration, registration and candidate review do not authorize publication, tags or GitHub Releases.
Ordinary release preparation refuses an untagged fork; do not dispatch `release.yml` for bootstrap.

1. Commit migration and compatibility checks on clean primary `main`, then use `node scripts/release/prepare-first-fork-release.mjs --help` from the repository root for its six required inputs.
   The generator has no apply, publish or dispatch mode; it queries upstream tags without fetching or changing refs and writes only to a fresh external directory whose parent exists.
   Review the external candidate's `sourceHead`, incorporated evidence, complete diff and exact four `applicationFiles` with the operator.
   Obtain artifact-application approval, recheck clean `main`, `sourceHead === HEAD` and unchanged reviewed bytes, then apply and commit exactly those files together; retain `first-fork-release.json` externally.
   If the source or candidate changes, regenerate or stop for review.
2. Obtain separate explicit approvals for the `@jopqior/pi-subagents-worktrees` identity and public npmjs.org destination, the exact tagged artifacts, and tagging/GitHub Release effects.
   Tag the approved artifact commit as `pi-subagents-worktrees-v0.1.0` only after approval and check out that exact commit for publication.
3. Before any npm or GitHub effect, preflight the complete approved tagged set with the artifact validator.
   Its external output directory must already exist:

   ```bash
   node scripts/release/release-artifacts.mjs published "$PWD" <existing-temp-dir> pi-subagents-worktrees-v0.1.0
   ```

   This checks the tag against the checkout and exact tagged package/CHANGELOG bytes and writes the tagged notes externally; it does not publish.
4. After successful preflight and publication approval, the operator runs this manual bootstrap command from the tagged checkout in their terminal:

   ```bash
   pnpm --filter @jopqior/pi-subagents-worktrees publish --access public --no-git-checks --registry=https://registry.npmjs.org/
   ```

   Publish without `--provenance`; this is not the Trusted Publishing `publish-released.sh` route.
   Any OTP interaction belongs in the operator's terminal, not an agent command or stored credential.
5. Any separately approved GitHub Release must use that same exact tag and tagged CHANGELOG section (the preflight's notes), explicitly targeting `--repo Jopqior/gotgenes-pi-packages`.
6. Only after successful first publication, configure the package's npmjs.org [GitHub Actions Trusted Publisher](https://docs.npmjs.com/trusted-publishers/): owner `Jopqior`, repository `gotgenes-pi-packages`, workflow filename `release.yml`, and no environment unless the actual workflow gains one.
   The current publish job uses GitHub-hosted `ubuntu-latest` and `id-token: write`, with no environment; permit direct publishing for this workflow.
   Saving the dashboard configuration does not verify publishing; do not use `whoami` as proof of OIDC permission.
7. Only after confirmed approved publication, add a fully disabled `npm:@jopqior/pi-subagents-worktrees` source object to the repository's `.pi/settings.json` with `extensions`, `skills`, `prompts` and `themes` all set to `[]`.
   Retain the local core-first load order and the upstream worktrees suppression entry.
   Until then, leave the unpublished fork npm source absent.
   Subsequent releases use separately approved ordinary guarded dispatch after Trusted Publisher setup.

If any approval is withheld, stop at an explicit unpublished handoff without tagging, publishing or dispatching.

## License

MIT

[ADR-0002]: https://github.com/gotgenes/pi-packages/blob/main/packages/pi-subagents/docs/decisions/0002-extensions-on-a-minimal-core.md
