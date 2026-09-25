---
name: markdown-conventions
description: |
  Load before writing or editing any markdown, an architecture-doc module tree, or a plan/retro:
  one-sentence-per-line, tables, issue links, frontmatter, retro stage format, `pi-autoformat` reflow quirks.
---

# Markdown Conventions

Load this skill when writing or editing markdown files.

## Formatting rules

The enforcer is `rumdl` (runs as part of `pnpm run lint`; also the pre-commit `rumdl fmt` hook), not `markdownlint-cli2` — there is no markdownlint binary in this repo.
Rules below are named by their markdownlint `MDxxx` IDs because `rumdl` implements the same rule family; use the IDs for reference, not the tool.
Checking a file outside the repository (a scratch sample in `/tmp`) needs `--config .rumdl.toml` — `rumdl` does not discover repo config for it, so MD013 fires against the default 80-character limit.

### Lines and sentences

- Use one sentence per line (unbroken) for better diffs.
  Each sentence occupies exactly one line; never wrap a sentence across lines or place two sentences on the same line.
  This applies to all prose, including list-item continuations.
- `rumdl`'s `MD057` can report an existing relative link as missing when its sentence runs long; split the sentence per the rule above rather than hunting the path.
- Author and append markdown with the `Write`/`Edit` tools, not shell heredocs (`cat <<EOF`) — heredocs don't interpolate `\uXXXX` escapes and make one-sentence-per-line slips easy, both of which trip markdownlint.

### `pi-autoformat` reflow

The `pi-autoformat` extension reformats every file an `Edit`/`Write` touches, and its markdown pass rewrites prose in ways `rumdl` then accepts:

- It also joins a line ending in `:` with the sentence after it — to add a sentence there, start a new paragraph, not a new line.
- It likewise joins a sentence onto the previous line when the sentence opens with a lowercase token (a package or command name such as `git-cliff`) — lead with a capital instead.
- It also reads a numbered section citation (`§ *7. Verify CI*`) as a sentence end and splits it — cite the heading instead (`` the `## 7. Verify CI` section ``).
- It also reads a leading `~` as strikethrough and rewrites a `~`-prefixed token (`(~:211)` → `(~~211)`), which `rumdl check` passes — write an approximate line reference as `line ~211`.

### Code fences

- Always specify a language on fenced code blocks (e.g., ` ```typescript `, ` ```bash `, ` ```jsonc `, ` ```text `); use `text` for plain output.
- When embedding markdown that itself contains fenced code blocks, use a 4-backtick outer fence (` ````markdown `).

### Lists, headings, and emphasis

- Use sequential numbering (`1.` `2.` `3.`) in ordered lists, restarting at `1.` under each new heading — markdownlint's MD029 rejects continued numbering across section boundaries.
- Do not use bold text (`**...**`) as a substitute for headings — use proper heading syntax; markdownlint's MD036 rejects emphasis used as headings.

### Inserting a new section

Before inserting a new `##`/`###` section into an existing document, read the parent section end to end.
An insertion point that reads correctly at the seam can reparent what follows it — a shared example block, a trailing summary sentence — under the new heading.

### Tables and blockquotes

- Use compact table style with no cell padding — markdownlint's MD060 enforces consistent column style and is not auto-fixable.
  Example: `| Header | Header |` / `| --- | --- |` / `| cell | cell |` — spaces inside pipes, no padding variation.
- Separate adjacent blockquotes with an HTML comment (`<!-- -->`) to satisfy markdownlint's MD028.

### Issue references

- When an issue number would begin a line outside a fenced code block, prefix it with `Issue` (e.g. `Issue #42`) to prevent `#N` from being misread as a Markdown heading.
- In long-lived docs (`docs/architecture/`, `docs/plans/`), reference GitHub issues with reference-style links — `[#42]` in the body, `[#42]: https://github.com/gotgenes/pi-packages/issues/42` at the end of the file.
  Bare `#42` auto-links on GitHub but not in other renderers.
  Every `[#N]:` definition must have a matching `[#N]` reference in the body (markdownlint MD053 rejects unused definitions).
  A `[#N]` wrapped in backticks is a code span, not a link reference — it does not count toward the matching-reference requirement, so the `[#N]:` definition still trips MD053.
  Likewise, a `[#N]` inside a fenced code block (e.g. the `architecture.md` module-layout tree) is not a live reference — cite issues there as bare `#N` with no `[#N]:` definition (matching the block's existing entries), or MD053 rejects the orphaned definition.
  Write `[#N]` as plain text, including inside other formatting (`**[#N] label:**`).
  Do not add a definition for the doc's own issue number — it lives in frontmatter, not as a body link.
  Link reference definitions are file-scoped: when appending a stage entry to a retro that already defines `[#N]:`, reference it without re-adding the definition — a duplicate trips MD053.
- ADR numbering is per-package, but `[ADR-NNNN]` reference-link definitions are file-scoped and may already point to another package's ADR (e.g. pi-subagents' `[ADR-0002]`).
  When citing this package's own ADR in such a doc, reference it by path (`docs/decisions/NNNN-<slug>.md`), not a bare `ADR-NNNN` token.

## Documentation frontmatter

Docs under `docs/plans/` and `docs/retro/` use YAML frontmatter for structured metadata.
Single-package work lives in `packages/<PKG>/docs/{plans,retro}/`; cross-package work lives in the top-level `docs/{plans,retro}/`.
GitHub renders it as a table at the top of the file.

Filename numbering distinguishes fork files from inherited upstream ones.
Create a fork issue `N`'s file as `f` + four-digit zero-padded `N` + `-` + slug + `.md` (e.g. `f0001-spawn-model-selection.md`) — never the next free `NNNN` among inherited files.
Look up by issue number by globbing `fNNNN-*` first in both `docs/{plans,retro}/` and `packages/*/docs/{plans,retro}/`; if any regular file matches, use only those matches, otherwise fall back to the unprefixed `NNNN-*` (inherited upstream files) — short-circuit, not union.
Inherited `NNNN-` files keep their original names.
The frontmatter `issue: N` stays the numeric fork issue either way.

Schema (both fields are strings/numbers — quote any title containing backticks or colons):

```yaml
---
issue: 14 # optional: omit for plans that predate issue tracking
issue_title: "Short descriptive title" # required
---
```

- `issue` stores the number only, never a URL.
- Do not duplicate frontmatter fields as inline metadata in the body (e.g., `Issue #N` in the H1 is fine; a separate `**Issue:** #N` line is not).
- Other doc types (`README.md`) do not use frontmatter.

### Improvement phase identities

A phase identity is the complete token: inherited upstream phases use numeric identities such as `22`, while fork phases use lowercase `f` plus a positive, unpadded decimal suffix such as `f1`.
Fork phase allocation is independent **per package**: after checking that no detailed roadmap is active, inventory that package's committed fork identities in history files, phase retros, and architecture phase records; select one more than the greatest suffix **numerically**, or `f1` when none exists.
Count a history/retro pair once; a retained planning retro reserves its identity even without an archive.
An active roadmap in either namespace must be finished before planning another phase.
Read predecessor findings from the latest completed fork archive linked in the history table, or from the latest incorporated upstream archive if no fork archive is complete; upstream numeric identities never influence fork allocation.
Stop and reconcile duplicate or inconsistent records instead of choosing a file by sort order.

Carry the complete identity through roadmap headings, session names, commit subjects, history rows, and matching `history/phase-PHASE-<slug>.md` and `retro/phase-PHASE-<slug>.md` paths.
Look up `phase-f1-*.md` only for `f1` and `phase-1-*.md` only for `1`; neither namespace falls back to the other.
Fork phase retros use a quoted string field (`phase: "f1"`); inherited numeric retros retain numeric fields (`phase: 22`).
These phase-scoped names are separate from the fork GitHub **issue** convention `fNNNN-<slug>.md`, whose `issue: N` stays numeric.

### Retro file format

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

## Architecture docs

Every package's `docs/architecture/architecture.md` module-tree entries describe **current behavior** — what each module is now.
Cite an issue in a module-tree entry **only** when the ref encodes an active constraint (a lint-guarded boundary, an ADR string boundary, a structural invariant); all other provenance belongs in git log and `docs/architecture/history/`, never in the tree (the "relocated #559, dissolved #505, renamed #510…" trail).
`/finish-phase`'s bounded doc-hygiene step holds each phase's touched module-tree entries to this standard.

An accepted residual — an ADR bullet, a follow-up issue body — is a claim about the **mechanism**, not the symptom that exposed it.
Enumerate the mechanism's inputs before writing it.
