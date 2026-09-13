---
issue: 9
issue_title: "Spawn chooser: match native /model fuzzyFilter"
---

# Match native /model fuzzyFilter

## Release Recommendation

**Release:** ship independently

This companion is not on an inherited improvement-phase roadmap, so there is no batch tag.
The change is a user-visible matcher swap in `@jopqior/pi-subagents-model-selector` only.

## Problem Statement

The 1.0.0 spawn form was meant to match native `/model` except two listed non-goals (set-as-default, background refresh).
`filterModels` instead keeps a row when every query token is a substring of the haystack (`includes`).
Native `/model` uses `fuzzyFilter` from `@earendil-works/pi-tui`: ordered subsequences, then score order.
A query such as `clde` therefore misses `claude`, and remaining hits are not score-ordered.
This is the pre-completion residual from [#8].

## Goals

- Replace the `includes` token loop in `filterModels` with `fuzzyFilter` from `@earendil-works/pi-tui` at the existing `>=0.84.4` peer.
- Keep the copied haystack (`getModelSelectorSearchText` plus the `default` suffix) and the `isDefaultSearch` prepend of default models from the unfiltered active list.
- Pin ordered-subsequence hits and score order in `test/selection-form.test.ts`.
- Non-breaking: no API, config, or default-value change.
  Every current `includes` hit remains a `fuzzyFilter` hit (substring is a consecutive subsequence); new hits appear and ranking among hits can change.
  Use `fix(pi-subagents-model-selector):`, not `fix!:`.

## Non-Goals

- Extracting `filterModels` or `modelHaystack` into a new module.
- Copying `fuzzyFilter` / `fuzzyMatch` into this package.
- Changing `isDefaultSearch` or the default-model prepend (native still does both on top of `fuzzyFilter`).
- Changing `getModelSelectorSearchText` or moving the `default` suffix into that helper.
- Type-to-filter on the thinking tab.
- README / Limitations edits — they already describe a `/model`-style form and do not name the matcher.
- Renaming the shared `haiku` fixture (`id: "claude-haiku"`, `name: "Claude Sonnet"`).
  Neither new pin rests on that name (re-measured).
- The `#8` `canSubmit` / renderer residual.
- Any change in `pi-subagents`.

No follow-up issue is filed.
The items above are boundaries, not promises.

## Background

Author is the operator; the issue body is the working hypothesis.
[#8] is closed and shipped as 1.0.0; this issue was filed from that retro.
No prior `f0009-` retro.
No open PRs.
The only open tracker item is this issue.
Newest inherited triage (`docs/triage/2026-09-02-backlog.md`) has no fork-issue-9 entry.
No package `docs/architecture/architecture.md` and no roadmap `Release:` tag.

`fuzzyFilter` is a named export of `@earendil-works/pi-tui@0.84.4` (`dist/fuzzy.d.ts`, re-exported from `dist/index.d.ts`).
Native `ModelSelectorComponent.filterModels` (pinned `pi-coding-agent@0.84.4` `dist/modes/interactive/components/model-selector.js`) already calls it with the same haystack formula and the same `isDefaultSearch` prepend.
The symbol exists at this package's peer floor; no floor bump.

[#8]'s "no `pi-tui` / `pi-coding-agent` UI imports" rule on `selection-form.ts` targeted components and keymaps.
`fuzzyFilter` is a pure function.
The TUI adapter already imports `@earendil-works/pi-tui`.
Repo `no-restricted-imports` does not cover this package.

Tidy-First: no preparatory `refactor:`/`test:` commits.
`filterModels` is 30 lines and shrinks; the `T[]` vs `readonly T[]` adaptation is one spread inside the behavior commit.

Measured against `dist/fuzzy.js` at 0.84.4, using production `modelHaystack` (no default suffix unless noted):

| Probe                                                          | Today's `includes`      | `fuzzyFilter` (0.84.4)                                            |
| -------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `"clde"` on `[sonnet, haiku, opus]`                            | `[]`                    | `[claude-sonnet, claude-haiku]`                                   |
| `"haiku"` on `[claude-haiku, id:"haiku"]` (either input order) | insertion order         | `[haiku, claude-haiku]`                                           |
| `"haiku"` on the three shared fixtures                         | `[claude-haiku]`        | `[claude-haiku]`                                                  |
| `"def"` with default `opus`                                    | `[gpt-opus, …]` prepend | same prepend; `"def"` is not a subsequence of the other haystacks |

## Design Overview

Keep `filterModels` in `selection-form.ts`.
Swap only the match-and-rank arm:

```typescript
function filterModels(
  models: readonly Model<Api>[],
  query: string,
  input: SelectionFormInput,
): readonly Model<Api>[] {
  if (!query) {
    return models;
  }
  const filtered = fuzzyFilter([...models], query, (model) =>
    modelHaystack(model, input),
  );
  if (!isDefaultSearch(query)) {
    return filtered;
  }
  // unchanged: prepend defaults from the unfiltered active list
}
```

Call-site notes:

1. Spread `[...models]` because `fuzzyFilter<T>(items: T[], …)` wants a mutable `T[]` and `filterModels` takes `readonly Model<Api>[]`.
   Compiled `fuzzy.js` never writes `items`; do not widen our parameter to `Model<Api>[]`.
2. Drop `.toLowerCase()` on the haystack.
   `fuzzyMatch` lowercases query and text internally.
   Dropping it before the swap would make `includes` case-sensitive, so it rides this commit, not a preparatory `refactor:`.
3. Empty query still returns the pre-sorted active list (current, then default, then provider).
   `fuzzyFilter` also returns `items` for a whitespace-only query, matching today's empty-token `every` path.

`visibleModels` remains the sole caller.
`modelHaystack` remains private to this file and the only production caller of `getModelSelectorSearchText`.

No new collaborator, port field, or event.

### Design-review checklist

No shared interface, dependency bag, or layer-wiring change.
The `#8` split (pure reducer / TUI adapter / composition root) is unchanged.

| Smell                              | Location            | Evidence                        | Suggested fix                             |
| ---------------------------------- | ------------------- | ------------------------------- | ----------------------------------------- |
| Peer `T[]` vs our `readonly`       | `fuzzyFilter` call  | `dist/fuzzy.d.ts:15`            | Spread at the call site (adopted)         |
| Wide `modelHaystack(model, input)` | `selection-form.ts` | Reads only `input.defaultModel` | Track and watch; zero effect on this diff |

## Module-Level Changes

### Changed

- `src/selection-form.ts` — import `fuzzyFilter` from `@earendil-works/pi-tui`; replace the token/`includes` loop; drop haystack `.toLowerCase()`; keep `isDefaultSearch` prepend.
- `test/selection-form.test.ts` — two cases under the existing `describe("filter")`.

### Predicted unchanged

- `src/model-search-text.ts` / `test/model-search-text.test.ts` — haystack formula is unchanged; `getModelSelectorSearchText`'s only production caller stays `modelHaystack`.
- `src/selection-form-component.ts` / `test/selection-form-component.test.ts` — already dispatch `filter` events; they do not pin the matcher.
- `src/model-selector.ts`, `src/index.ts`, `src/selection-queue.ts` — no port or wiring change.
- `package.json` / `pnpm-lock.yaml` — `pi-tui` is already a peer and a 0.84.4 devDependency.
- `README.md` — Limitations already name the `/model` experience and the two non-goals; they do not name `includes`.
- `packages/pi-subagents/**` and `.pi/skills/package-pi-subagents/SKILL.md` — seam only, not the matcher.
- No package `docs/architecture/` tree and no roadmap `✅` step.

## Test Impact Analysis

1. **New unit tests this change enables:** ordered-subsequence hit (`clde` → the two Claude fixtures) and score order (exact `id: "haiku"` before `claude-haiku`), both through `reduceSelectionForm` `{ type: "filter" }` so highlight-reset stays pinned (`highlightedIndex === 0`, `pendingModel` is the first ranked row).
2. **Existing tests that stay, not redundant:** `"filters the active list by the search haystack"` (`"haiku"` → `[haiku]` among the three shared fixtures) and `"ranks the default model first for a default search token"` (`"def"` prepends `opus`).
   Both stay green under `fuzzyFilter` (measured).
3. **Must stay as-is:** scope, sort/highlight, thinking keep/clear/`off`, tabs/submit, FIFO/abort on `ModelSelector`, composition-root TUI/RPC pins.
   None of those go through the `includes` loop.

The score-order case cannot use the shared fixtures alone.
Build `makeModel({ id: "haiku", provider: "anthropic" })` inline in that test (default `name: "Test Model"` still ranks first; measured).

Do not mock `fuzzyFilter`.
Pin observable model identity and order, never numeric scores.

## Invariants at risk

| Invariant (from [#8])                                                        | Constituency                       | Pin                                                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Haystack formula (provider-prefixed, name token, no `default` in the helper) | operator typing provider/`default` | existing `test/model-search-text.test.ts`; form `"haiku"` haystack test                         |
| Empty query keeps current-then-default-then-provider sort                    | operator opening the form          | existing `"sorts current, then default, then provider"`                                         |
| `default` search token prepends the default model from the unfiltered list   | operator typing `def`              | existing `"ranks the default model first for a default search token"`                           |
| Non-empty query highlights index 0 (best remaining row)                      | operator                           | existing haystack filter test; both new tests assert `highlightedIndex === 0`                   |
| FIFO, cancel, TUI-only, inherited child, resume skip                         | unchanged surfaces                 | existing `model-selector.test.ts` / `composition-root.test.ts` (this change does not open them) |

Open each named test in this package when implementing.
A mocked `presentForm` does not pin `filterModels`.

## TDD Order

Tidy-First recommended none.
One red→green cycle.

1. **`fix(pi-subagents-model-selector): match native /model fuzzyFilter`** Add the two filter tests (red on today's `includes`), then swap `filterModels` as in Design Overview.

   Red before the swap:

   - `"clde"` → `[]` (measured).
   - `"haiku"` over `[claude-haiku, exact haiku]` → insertion order `[claude-haiku, haiku]` (measured).

   Killing mutations (after green):

   - Restore the `tokens.every((token) => text.includes(token.toLowerCase()))` predicate — kills the subsequence test (`clde` → `[]`) and also the score-order test (insertion order).
   - Keep `fuzzyFilter` for the hit set but return `models.filter((model) => filtered.includes(model))` — kills only the score-order test; `"clde"` stays green.

   Verify: `pnpm --filter @jopqior/pi-subagents-model-selector exec vitest run test/selection-form.test.ts`; `pnpm --filter @jopqior/pi-subagents-model-selector run check`.
   Then the full package suite.

   Commit: `fix(pi-subagents-model-selector): match native /model fuzzyFilter`

## Risks and Mitigations

- **`fuzzyFilter` wants `T[]`** — spread at the call site; do not widen `filterModels`.
- **Score tables in a future `pi-tui` release** — tests pin relative order of two ids, not scores; peer floor stays 0.84.4.
- **Dropping `.toLowerCase()` as its own commit** — would change `includes` to case-sensitive before the swap; it rides the `fix:` commit.
- **Default prepend looking "redundant" with the `default` haystack suffix** — native still prepends from the unfiltered list so a default model matches `def` even when its own haystack would not; leave it.

## Open Questions

None.
The issue body names the matcher, the haystack, and the test file.

[#8]: https://github.com/Jopqior/gotgenes-pi-packages/issues/8
