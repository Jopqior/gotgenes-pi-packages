# AGENTS.md

## Monorepo Structure

This is a pnpm workspace monorepo.
Each package under `packages/` is a Pi extension published to npm under `@gotgenes/`.
Always launch Pi from the repo root — the root `.pi/settings.json` and `.pi/prompts/` are only discovered from CWD.
The working directory is always the repo root, so for a package-scoped script run `pnpm --filter @gotgenes/<pkg> run <script>` (or `pnpm -C packages/<pkg> run <script>`) from the root instead of `cd packages/<pkg> && pnpm run <script>`.
Before working on a specific package, load its `package-<name>` skill for architecture, priorities, and testing context.
Load skills inline — never dispatch a subagent to load skills.

Repo-level work — build, CI, tooling, cross-package docs — is labeled `scope:repo` rather than with every package's label.
That scope is always asserted (the forms' repo-wide option, or `gh issue create --label scope:repo`), never inferred from the absence of a package.

### Admission test

This file is loaded into every session; a skill's body is loaded only when read.
Before adding a passage here, answer three questions in order:

1. Could a current model act correctly without it?
   If yes, it belongs nowhere.
2. Is it needed before the agent could know to load a skill?
   If no, it belongs in that skill's body.
3. Does the rule stand without its incident?
   If yes, keep the rule and drop the story; a `(Refs #N)` stays only when the issue encodes a constraint a reader may need to trace.

A rule whose incident has not recurred in any retro since 2026-07-20 is a delete candidate — guidance, not a verdict, since the rule may be why it has not recurred.
`/audit-agent-docs` applies this test to the whole file and the skills on demand.

### Releasing

Releases are **dispatched, never automatic**.

### Architecture-doc conventions

Every package's `docs/architecture/architecture.md` module-tree entries describe **current behavior** — what each module is now.
Cite an issue in a module-tree entry **only** when the ref encodes an active constraint (a lint-guarded boundary, an ADR string boundary, a structural invariant); all other provenance belongs in git log and `docs/architecture/history/`, never in the tree (the "relocated #559, dissolved #505, renamed #510…" trail).
`/finish-phase`'s bounded doc-hygiene step holds each phase's touched module-tree entries to this standard.

An accepted residual — an ADR bullet, a follow-up issue body — is a claim about the **mechanism**, not the symptom that exposed it.
Enumerate the mechanism's inputs before writing it.

### Workflow

- Keep scope tight.
- Prefer small, reversible changes.
- Preserve intentional behavior unless there is a clear reason to change it.
- Ask before removing functionality or changing defaults.
- For Pi SDK internals (prompt assembly, caching, session lifecycle), read Pi's own source at the `pi` checkout beside this repo's main checkout, rather than the installed `dist/` bundles or their sourcemaps.
  That is `../pi` from the root checkout and `../../pi` from a worktree — the worktree sits one level deeper, so the bare `../pi` misses it.
  Dispatch an `Explore` subagent with `model: "sonnet-5"` for a multi-hop trace there (e.g. "how does `ui.custom` pass keybindings to the factory?") — a targeted read of a known file is fine inline, but a hunt costs 5–10 greps of this session's context, and `Explore`'s haiku default is too weak for the reasoning.
  Keep the trace inline when its output is a universal claim the design will rest on — a subagent returns it as a summary you would have to re-verify anyway.
  The checkout tracks Pi's `main` and runs ahead of the pinned dependency.
  Read it for mechanism, but confirm any API you design around exists in the installed version first — resolve the version from the package's own `devDependencies` pin, then `grep` the types under that exact `node_modules/.pnpm/@earendil-works+pi-coding-agent@<version>_*/` directory.
  The bare `@*/` glob matches every version in the store, and `head -1` can select one below the package's declared peer floor.
  Existence is not enough for a seam you design *around*: a callback's position in the call order, and the data populated by the time it fires, are visible only in the compiled `.js`, never in the `.d.ts`.
  A line number read there is not citable at all: the checkout drifts mid-session.
  Cite the pinned version from the installed package's sourcemap — `dist/*.js.map`, `sourcesContent`.

#### Tool-injected messages

The `pi-autoformat` extension emits a `[pi-autoformat] Formatted N file(s)` message after `Edit`/`Write`.
It is informational — not a turn boundary.
Continue the current step (e.g. Red→Green→Verify→Commit) until it is complete.
It also reflows what you just wrote (line wrapping, quote style), so an `oldText` — or a shell/regex pattern — built from the layout you emitted can fail to match; re-read a region you just edited before matching against it again.
It also joins a line ending in `:` with the sentence after it — to add a sentence there, start a new paragraph, not a new line.
It likewise joins a sentence onto the previous line when the sentence opens with a lowercase token (a package or command name such as `git-cliff`) — lead with a capital instead.
It also reads a numbered section citation (`§ *7. Verify CI*`) as a sentence end and splits it — cite the heading instead (`` the `## 7. Verify CI` section ``).
It also reads a leading `~` as strikethrough and rewrites a `~`-prefixed token (`(~:211)` → `(~~211)`), which `rumdl check` passes — write an approximate line reference as `line ~211`.

#### Stale prompt-template expansion

A slash command's expanded body is a snapshot from when the Pi process loaded it — so after this session edits a `.pi/prompts/*.md` template, a later same-process invocation of that command can run the **pre-edit** copy.
When the pasted prompt body contradicts the on-disk file (e.g. you just changed `/ship` and its steps read stale), treat the **on-disk file as authoritative** and follow it, not the injected text.

#### Stale in-process extension code

Pi loads each package's extension once at session start, so a session that edits `packages/<pkg>/src/` keeps running the **pre-edit** tool for the rest of its life.
When the change targets a tool the workflow itself calls (`ci_find`, `ci_watch`, `issue_close`), restart Pi before the step that uses it — otherwise `/ship` exercises the old behavior and the new code looks broken.
The same applies when a change **removes** a tool `/ship` calls: the running session still has it registered.
A session that renames or deletes a prompt template is subject to the same staleness: it keeps the commands it registered at startup, so the first run of a renamed command needs a fresh session.

The same staleness makes the session's own system prompt a reliable witness for the **published** behavior: a defect in prompt assembly (a tool's `Available tools:` line, a guideline bullet, an injected block) is readable in context at zero tool cost.
Read it before hunting the SDK — but never to verify your own fix, which the running session cannot see.

#### Multi-session issue lifecycle

Larger issues span multiple sessions, each handling one stage.
The standard flow is:

1. `/plan-issue #N` — read the issue, explore the codebase, produce a numbered plan, commit it.
   For a code-touching change, a fresh-context `tidy-first-assessor` runs after the design is settled and before the plan is written; its accepted preparatory refactorings become `refactor:`/`test:` steps in the plan's TDD Order (Kent Beck's Tidy First).
2. `/tdd-plan` or `/build-plan` — execute the plan (TDD for code changes, build for docs/config).
   The preparatory steps are ordinary plan steps here; a fresh-context `pre-completion-reviewer` runs the quality gate at the **end**.
3. Pre-completion review — dispatched automatically at the end of step 2; a fresh-context `pre-completion-reviewer` subagent runs deterministic checks and a judgment checklist before recommending `/ship`.
4. `/ship #N` — land the work, verify CI, close the issue, dispatch the release.
5. `/retro` — review the session(s) for workflow improvements, persist retro notes.

A change that lands outside `/tdd-plan` or `/build-plan` fires no automatic `pre-completion-reviewer` dispatch.
Dispatch one by hand before committing a rewrite of an artifact a prior review rejected.

Each prompt template writes a stage entry to `docs/retro/NNNN-<slug>.md` (or `packages/<PKG>/docs/retro/`) before finishing.
These entries accumulate across sessions and serve as the cross-session context bridge — when a later stage starts, it reads the retro file to pick up decisions, observations, and warnings from prior sessions.

An issue spun off mid-lifecycle — by a step's implementation, a plan's follow-up, or a retrospective — is evaluated for roadmap fit when it is filed, not at phase close, so load the `roadmap-fit` skill at the filing point.
It exits immediately when the package has no open improvement phase; otherwise it records the operator's disposition (fold into a step / new step / defer / out of scope) in the roadmap's `#### Open-issue sweep dispositions` list, and filing-without-scope-creeping remains the correct local move.
`/finish-phase` reconciles the phase window's issues against that list before archiving, so a miss surfaces at phase close instead of vanishing from the history.

##### Parallel peer sessions (git worktrees)

See the `worktrees` skill.

###### Session naming convention

Each prompt template calls `set_session_name` (from `pi-session-tools`) to label the session automatically:

| Stage                    | Session name format            |
| ------------------------ | ------------------------------ |
| PR review                | `#N PR Review — <title>`       |
| Planning                 | `#N Planning — <title>`        |
| TDD implementation       | `#N TDD — <title>`             |
| Build implementation     | `#N Build — <title>`           |
| Shipping (trunk lane)    | `#N Ship — <title>`            |
| Worktree sync (peer)     | `#N Sync (worktree) — <title>` |
| Shipping (worktree lane) | `#N Ship (worktree) — <title>` |
| Retrospective            | `#N Retrospective — <title>`   |
| Agent-doc audit          | `Agent-doc audit — <date>`     |

Both `Shipping` rows come from `/ship`, which picks between them once it has detected its lane.

###### Retro file format

Get each stage timestamp from `date -u +"%Y-%m-%dT%H:%M:%SZ"` — never write one from memory; a model has no clock.

Retro files use YAML frontmatter and accumulate `## Stage:` entries:

````markdown
---
issue: 42
issue_title: "Extract ExtensionPaths value object"
---

# Retro: #42 — Extract ExtensionPaths value object

## Stage: Planning (2026-05-20T14:00:00Z)

### Session summary

...

### Observations

...

## Stage: Implementation — TDD (2026-05-21T10:00:00Z)

### Session summary

...

### Observations

...

## Stage: Final Retrospective (2026-05-22T16:00:00Z)

### Session summary

...

### Diagnostic details

- **Model-performance correlation** — Explore subagent ran on claude-sonnet-4-20250514; appropriate for read-only codebase search.
- **Escalation-delay tracking** — 8 consecutive tool calls on the same lint error in TDD step 3 before switching approach.
- **Feedback-loop gap analysis** — `pnpm run check` ran only after step 6; should have run after step 4 (interface change).
````

The `### Diagnostic details` subsection is optional — include it only when the `/retro` prompt's diagnostic lenses produce actionable findings.
Omit it when all lenses find nothing notable.

Use `/retro-note` to capture quick observations mid-session without interrupting the workflow.
Use `scripts/issue-context.sh <N>` to gather all available context for an issue (plan, retro, commits, branches) when bootstrapping a new session.

##### Code Style

This project uses **pnpm** exclusively — never `npm` or `npx`.
Before implementing, refactoring, or reviewing code, load the `code-design` skill — it covers naming, SOLID and structural design heuristics, TypeScript conventions, pnpm/ES2024 tooling rules, Pi SDK boundaries, and Biome/ESLint conflict workarounds.

##### Shell and search

Use `colgrep` for intent-based codebase exploration and convention discovery; use `grep` for exact symbol matching.
Quote a glob pattern meant for a command rather than the shell — `--include='*.ts'`, `find . -name '*.ts'`.
Unquoted, it expands against the cwd first: bash silently substitutes a matched filename, and zsh aborts with `no matches found`.
In zsh an unquoted parameter is not word-split, so `perl -pi -e '…' $FILES` passes the whole list as a single filename — spell a multi-file list inline.
Do not start a bash word with `=` — zsh's `equals` expansion reads `=word` as a command-path lookup, aborts, and discards the rest of an `A; B; C` chain; use `echo ---`, not `echo ===`.

##### Markdown

Before writing or editing markdown files, load the `markdown-conventions` skill — it covers the formatting rules (one-sentence-per-line, fence languages, list numbering, table style) and the YAML frontmatter schema for plans and retros.

##### Mermaid

Before authoring or reviewing Mermaid diagrams, load the `mermaid` skill.

##### Testing

Before writing or debugging tests, load the `testing` skill for Vitest mock patterns and TDD planning rules.

##### Commits

When a shell loop or script needs a status variable, do not name it `status` — zsh reserves `$status` (an alias for `$?`) as read-only, so the assignment aborts with `read-only variable: status`; use `state`/`rc` instead.
