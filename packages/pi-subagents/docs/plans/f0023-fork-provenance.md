---
issue: 23
issue_title: "Clarify pi-subagents fork provenance and model-selector purpose in public documentation"
---

# Clarify fork provenance and selection purpose

## Release Recommendation

**Release:** ship independently

This issue is not a member of an active architecture release batch.
A new publication is needed for npm to display the revised README, but neither this plan nor its implementation authorizes publication.
Obtain explicit approval of the fork destination and package scope at ship time; do not overwrite an existing published version or choose a future version manually.

## Problem Statement

The introduction and package description present the inherited gotgenes-to-tintinweb relationship as this package's direct ancestry.
The public architecture text also inherits maintenance claims that do not describe this fork's gotgenes synchronization workflow.
Users need a short explanation of why `@jopqior/pi-subagents` exists, which project it follows, and why interactive selection requires a companion.

## Goals

- Identify `@gotgenes/pi-subagents` in `gotgenes/pi-packages` as the direct upstream and preserve tintinweb's earlier authorship and project lineage.
- Explain that the core supports per-spawn model/thinking selection and `@jopqior/pi-subagents-model-selector` supplies the selector UI.
- Correct ambiguous current-facing provenance, maintenance, and support wording without replacing useful installation, configuration, or API documentation.
- Verify the actual packed documentation, metadata, public links, and license notices.
- Keep this non-breaking: no runtime, API, default, dependency, package-name, or configuration changes.

## Non-Goals

- Release-by-release correspondence, release-note generation, and historical release backfill belong to [#24], which is open and is not a prerequisite.
- Do not publish, dispatch a release, synchronize upstream, change tags, bump versions, or edit generated `CHANGELOG.md`.
- Do not refresh the historical comparison into a newly researched three-project feature matrix.
- Do not rewrite historical plans, retros, architecture phase archives, or superseded ADR decisions as though their authors were describing this fork.
- Do not change license terms, remove attribution, rename the runtime's `@gotgenes/*` service symbols, or rename real companion dependencies.

## Background

The issue author matches the authenticated operator, and the operator selected preservation of the historical comparison with an added explanation of this fork.
The working tree was clean after `git pull --ff-only` reported it was current.
No prior fork or inherited issue-23 plan/retro was found.
The open-issue sweep found [#24]; the open-PR sweep returned none, and the latest triage file, `docs/triage/2026-09-18-backlog.md`, has no entry for this fork issue.

Current surfaces inspected:

- `README.md` names tintinweb in its opening attribution, relationship section, and license summary; its detailed selection section already distinguishes core support from companion UI.
- `package.json` describes a friendly fork of tintinweb, but `repository`, `homepage`, and `bugs` already target `Jopqior/gotgenes-pi-packages`.
- `docs/comparison-with-upstream.md` explicitly compares historical gotgenes and tintinweb versions, while calling the comparison current and using ambiguous “this fork” language.
- `docs/architecture/architecture.md` ends with inherited gotgenes maintenance claims, including cherry-picking and periodic upstream-suite execution.
- `docs/upstream-sync.md` establishes this fork's actual gotgenes synchronization mechanism; link to it rather than reproducing its version table.
- `src/service/service.ts` declares `SpawnSelectionProvider` and `registerSpawnSelectionProvider`; `src/lifecycle/spawn-selection.ts` owns the optional provider lease, not a selector UI.
- `LICENSE` contains tintinweb's MIT copyright notice and requires the copyright and permission notices to accompany copies or substantial portions.

The root instructions require English committed artifacts, fork-qualified issue links, pnpm tooling, and explicit approval before publication.
The package's minimal-core charter is preserved, not reopened.

## Design Overview

### Identity and attribution

Use a compact introduction along these lines:

> A fork of `@gotgenes/pi-subagents` from `gotgenes/pi-packages`, adding support for per-spawn model and thinking selection through `@jopqior/pi-subagents-model-selector`.
> The core exposes selection support; the companion provides the interactive selector.
> The project traces its earlier lineage to tintinweb's `pi-subagents`.

Link each named project/package to its actual public destination.
Keep detailed precedence, cancellation, resume, and background-admission behavior in the existing selection/API sections instead of repeating it in the introduction.
Without a registered provider, ordinary resolution remains unchanged.

Change the npm description to identify the gotgenes fork and selection support without promising built-in interactive UI.
Preserve `author`, the license field, and existing author credits; support ownership is expressed through repository/support links, not by replacing historical authorship.
Keep `LICENSE` byte-identical.

### Historical comparison and maintenance claims

Preserve `docs/comparison-with-upstream.md` at its existing path.
Add an explicit scope note: the retained matrix is a historical gotgenes-versus-tintinweb comparison, not a current three-way benchmark or this fork's incorporated-version record.
Keep its existing version labels as historical labels, not newly verified release facts.
Use named subjects for table introductions, recommendations, and contribution history so “upstream” cannot silently switch between gotgenes and tintinweb.
Remove claims of currentness and do not repeat the inherited test count as a current health metric.
Prepend a short explanation of the Jopqior fork and link to its selection documentation.

In current architecture and README prose, name gotgenes as direct upstream and tintinweb as the earlier project.
Replace inherited maintenance promises with a link to this repository's actual sync procedure.
Treat historical PR references as contribution provenance, not promises about their present status.
Do not assert that this fork periodically runs an upstream test suite without evidence.
Historical ADRs remain historical; qualify contextual “upstream” in active user-facing prose where needed rather than globally substituting package names.

### Published links and npm refresh

The companion README link currently leaves the package through `../pi-subagents-model-selector/README.md`.
Use an absolute public fork-repository URL for this cross-package link so the packed README does not depend on an absent sibling directory.
Keep package-internal relative documentation links where the tarball actually contains their targets.
Add a clear fork-support link, and label upstream project links as provenance or external integrations rather than fork support destinations.
Inspect existing media URLs separately: retain useful upstream media with attribution when reachable; do not invent fork-owned copies or silently remove media.

Add a short publication note to the README: changing GitHub documentation alone does not refresh npm's README; npm requires a new package publication.
Link to npm's official README documentation and leave release execution to the approved repository workflow.

## Module-Level Changes

All package paths below are relative to `packages/pi-subagents/`.

| File                                                                     | Planned change                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                              | Correct opening, relationship, license-summary roles, scope wording, documentation-table comparison label, companion link, support destination, and npm-refresh note; preserve usage/API sections. |
| `package.json`                                                           | Update only the misleading description; audit existing repository/homepage/bugs and media metadata without changing package identity or executable configuration.                                  |
| `docs/comparison-with-upstream.md`                                       | Add fork context, frame the existing matrix as historical, qualify subjects and contribution history, and remove misleading present-day claims.                                                    |
| `docs/architecture/architecture.md`                                      | Qualify package identity and tintinweb-specific references; replace the closing inherited maintenance narrative with this fork's gotgenes relationship and canonical sync link.                    |
| `docs/configuration.md`                                                  | Replace the ambiguous “upstream” attribution of `PI_CODING_AGENT_DIR` with Pi by name; preserve configuration semantics.                                                                           |
| `.pi/skills/package-pi-subagents/SKILL.md` (repo root)                   | Align the opening lineage and maintenance guidance with the fork; retain technical boundaries and historical attribution so future edits do not restore the mistaken relationship.                 |
| `LICENSE`                                                                | Predicted unchanged; preserve and compare the complete MIT notice in the source tree and tarball.                                                                                                  |
| `src/`, `test/`, exports, dependency fields, lockfile, `files` allowlist | Predicted unchanged because the change only corrects prose and descriptive metadata.                                                                                                               |
| Historical ADRs and architecture history                                 | Predicted unchanged as dated decision/history records; verify their context does not present them as this fork's current maintenance policy.                                                       |

The internal skill update does not turn this into a multi-package change.
No architecture roadmap completion marker is required because this issue is not a roadmap step.

## Test Impact Analysis

No extraction or new unit-test seam is involved; no existing tests become redundant.
Tidy-First assessment is skipped because no `src/` or `test/` file changes.
Use documentation review, lint, and real tarball inspection rather than adding runtime tests for prose.

Planning verification completed with the installed pnpm CLI:

```bash
pnpm pack --help
pnpm -C packages/pi-subagents pack --out /tmp/issue23-pi-subagents.tgz
mkdir -p /tmp/issue23-packed
tar -xzf /tmp/issue23-pi-subagents.tgz -C /tmp/issue23-packed
cmp packages/pi-subagents/README.md /tmp/issue23-packed/package/README.md
cmp packages/pi-subagents/LICENSE /tmp/issue23-packed/package/LICENSE
```

Observed: packing invokes `prepack`, builds the declaration bundles, and includes `README.md`, `LICENSE`, `package.json`, the comparison, configuration, architecture, and decision documents.
Both comparisons exited successfully with no output.
The packed description still contains the incorrect tintinweb direct-fork claim, and the README still has the sibling-relative companion link; these are baseline failures for implementation review.
No tracked files changed during packing.
Use a fresh temporary extraction directory for the implementation check so stale extracted files cannot make missing files appear present.

Review the packed manifest itself: pnpm transforms it during packing, so a source-only review is insufficient.
Check link ownership and target existence in the packed README, not just HTTP success, because a working upstream URL can still be the wrong support destination.
Npm's [README documentation] explicitly says the package page updates only when a new version is published.

## Invariants at risk

- Existing users keep installation, configuration, command, and API guidance; review the diff for accidental deletion or behavioral rewrites.
- Core-only users are not promised a chooser; companion users are directed to the actual selector package.
- Original authors retain their attribution, and recipients receive the complete MIT notice; compare `LICENSE` with the pre-change version and the packed copy.
- Extension authors keep the existing runtime symbols, exports, and dependencies; inspect the manifest diff and require no `src/` or `test/` changes.
- Historical readers can still distinguish gotgenes-versus-tintinweb history from current fork claims; preserve comparison version labels and historical record context.

These are documentation and artifact invariants, not new behavioral guarantees requiring runtime-test changes.

## TDD Order

This is a documentation/metadata build plan; execute with `/build-plan`, not runtime red–green cycles.

1. **Correct current identity and attribution.**
   Update the README, package description, architecture relationship, configuration wording, and package skill together.
   Load `writing-for-agents` before editing the skill.
   Verify that the introduction names gotgenes and the companion, the core is not described as shipping the chooser, all existing author credits remain, and `LICENSE` is unchanged.
   Run `pnpm exec rumdl check` on the changed Markdown paths and `pnpm exec biome check packages/pi-subagents/package.json`.
   Suggested commit: `docs(pi-subagents): clarify fork lineage and selector purpose (#23)`.
2. **Bound the historical comparison and public navigation.**
   Reframe the retained comparison, update its README label, fix cross-package/public support links, and add the npm-refresh note.
   Audit the full shipped documentation tree for ambiguous current-facing upstream claims; preserve clearly historical records and explicitly Pi-specific uses.
   Check the diff against the table above, preserving useful documentation and historical attribution.
   Suggested commit: `docs(pi-subagents): distinguish historical comparisons and fork support (#23)`.
3. **Verify the packed publication surface and record results.**
   Repeat packing and fresh-directory extraction, inspect the packed manifest and documentation, compare README/LICENSE, and verify public destinations.
   Run `pnpm -C packages/pi-subagents run lint:md` and lint the changed root skill separately.
   Record results and any link-check limitations in the implementation retro; do not publish or overwrite an existing npm version.
   Dispatch the `/build-plan` pre-completion reviewer after verification.
   Suggested commit: `docs(retro): record provenance publication checks for issue #23`.

No automated tests are added, so killing mutations are not applicable.
A documentation review must reject reintroducing the tintinweb direct-upstream claim, presenting the historical matrix as current, or claiming that core-only installation supplies the selector UI.

## Risks and Mitigations

- **Historical claims mistaken for current facts:** explicit comparison scope and named projects replace ambiguous “this fork” and “upstream” language.
- **Attribution removed while correcting ownership:** leave the license file and author metadata intact and review both source and packed copies.
- **Repository links work but packed links do not:** inspect the actual tarball and use absolute URLs for cross-package and repository-only destinations.
- **Scope expands into release tooling:** keep [#24] independent and link canonical sync documentation without duplicating release correspondence data.
- **Internal guidance restores old wording:** update the package skill in the same identity pass.
- **Unintended publication:** packing is local verification only; approval remains required for release dispatch and npm publication.

## Open Questions

None blocking.
If a public media destination is unavailable, report the specific broken asset and obtain direction before removing or replacing it.
No new follow-up issue is needed; the concrete adjacent release-policy work already has [#24].

[#24]: https://github.com/Jopqior/gotgenes-pi-packages/issues/24
[README documentation]: https://docs.npmjs.com/about-package-readme-files#updating-an-existing-package-readmemd-file
