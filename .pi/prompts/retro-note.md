---
description: Persist a quick retro observation to the issue's docs/retro/ file
---

# Persist retro observation

The user wants to record a retrospective note durably.

Argument: `$1` is either an issue number or the observation text.
If `$1` is a bare integer, the remaining arguments (`${@:2}`) are the note.
Otherwise, all arguments (`$@`) are the note — infer the issue number from recent commits (`git log --oneline -10` and look for `(#N)` patterns).

## Step 1 — Resolve the issue

1. Determine the issue number `N` from arguments or recent commits.
2. If no issue number can be determined, stop and explain that `/retro-note` requires either an explicit issue number or recent commits referencing one.
3. Fetch the issue title: `gh issue view N --json title -q .title`.

## Step 2 — Locate or create the retro file

1. Search for an existing retro file: glob `packages/*/docs/retro/fNNNN-*.md` and `docs/retro/fNNNN-*.md` first; if any regular file matches, use only those.
   If none match, fall back to the inherited unprefixed `NNNN-*.md` — short-circuit, not union.
2. If found, use it.
3. If not found, determine the target directory from the issue's `pkg:*` label or the most recent plan file.
   Create the file as `f` + four-digit zero-padded issue number + `-` + slug (never the next free `NNNN` among inherited files), with YAML frontmatter:

   ```yaml
   ---
   issue: N
   issue_title: "<issue title>"
   ---
   ```

   Followed by `# Retro: #N — <issue title>`.

## Step 3 — Append the note

Append a `## Stage: User Note (<ISO 8601 timestamp>)` section to the retro file with the user's observation.
Wrap code identifiers, filenames, and text containing underscores in backticks.
Append with the `Edit` tool (or `Write` for a new file), not a shell heredoc.

## Step 4 — Commit

```bash
git add <retro-file>
git commit -m "docs(retro): add retro note for issue #N"
```

If the branch tracks an upstream and was in sync before this note, `git push` — otherwise the commit strands behind a workflow that already pushed (Refs #662).

Briefly confirm what was recorded (file path and timestamp).
Then immediately resume the prior workflow — look at the conversation history to determine what was happening before this interruption and continue that work directly.
Do not recommend a command or await further user input.
