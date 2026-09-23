---
issue: 962
issue_title: "pi-permission-system: the tool-surface relocation is a no-op on pi ≥0.86, so a session sees Pi's unfiltered tool list alongside the narrowed one"
---

# Retro: #962 — pi-permission-system: the tool-surface relocation is a no-op on pi ≥0.86

## Stage: Planning (2026-09-23T04:30:57Z)

### Session summary

Verified the diagnosis by building a real pi 0.87.1 prompt with its own `buildSystemPrompt` (registry install in `/tmp/spike962`) and running the unmodified `renderToolSurface` over it.
Planned a layout strategy selected once from the cwd layer present: a footer-shaped `HEADER_LAYOUT` (byte-identical to today) and a `<cwd>`-shaped `SECTION_LAYOUT`.
The plan has 7 steps: 2 tidyings, 4 behavior steps, and docs.

### Observations

- The spike found a second defect that the issue and SlanyCukr's patch both miss.
  On 0.86 there is no footer, so the whole prompt counts as head, and plain-header removal in a pi-authored prompt deletes the user's own `Guidelines:` section in AGENTS.md.
  SlanyCukr's patch keeps the whole-head plain removal, so it would not fix this.
- A custom-preamble (child) section prompt is not idempotent today: a second pass collects a second block.
  Only a peer writer triggers it.
- The "section seam" (`event.systemPromptOptions`) was rejected.
  No option removes pi's `<tools>`/`<rules>` except `customPrompt`, and a custom `sections.tools` entry replaces pi's section in place, in the inherited region.
- Operator decisions: render the relocated block as tagged `<tools>`/`<rules>` on the section shape; carry `promptGuidelines` extras, filtered against every registered tool's guidelines.
  Pi 0.87.1 never sets `promptGuidelines` itself; through 0.85 it was the flattened tool guidelines, so the filter leaves nothing.
- Anchor choice: the section anchor is found by shape only (`<cwd>`/line/`</cwd>`, last occurrence), mirroring the footer.
  When both anchors are present, the later one wins.
  Head removal on the section shape is bounded before the first `<docs>`/`<addendum>`/`<project_context>`/`<skills>`/`<cwd>` open.
- Tidy-First assessor: its Recommended tidying (split bullets from header wrapping) became step 1, and its Optional `PromptLayout` pre-shaping became step 2.
  The fixture-builder and fixture-rename optionals were folded into step 3 or dropped.
- PR #908 (OMP prompt arrays) touches the same two `src/` files and is orthogonal; whichever lands second rebases.
- The `pi-anthropic-auth` sibling writer parses sections by name and treats `tools`/`rules`/`docs` as pi-owned.
  A tagged tail block keeps its shaping consistent.
- Follow-up #970 was filed after the plan commit: raise the `pi-coding-agent` peer floor and devDependency pin together, for this package only, as a separate breaking change after #962 (operator decision).
  A spike pinning the devDependency at 0.87.1 was clean: `tsc` passed, and so did 168 test files with 4590 tests.
  The spike was reverted, including pnpm's automatic `pnpm-workspace.yaml` edits.
  Its roadmap disposition is out of scope for Phase 15.

#### Deferred tidyings

- `src/exposure/tool-surface-prompt.ts`: this package's `guidelinesByTool` (from `getAll()`) duplicates pi 0.86's separate `systemPromptOptions.toolGuidelines`; reconciling the two sources is a separate design change.

## Stage: User Note (2026-09-23T04:53:22Z)

I wonder whether a purpose-built test-running tool would help.
The agent keeps assembling compound shell invocations just to run tests.
In this session's TDD cycle, nearly every run was a chain along the lines of `pnpm --filter … exec vitest run <file> >/tmp/t.log 2>&1; grep -E "×|Tests " /tmp/t.log`, often followed by `pnpm run check`, `eslint`, and a `cp` backup or restore for a killing mutation.
