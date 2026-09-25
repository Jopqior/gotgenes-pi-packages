---
issue: 23
issue_title: "Clarify pi-subagents fork provenance and model-selector purpose in public documentation"
---

# Retro: #23 — Clarify pi-subagents fork provenance and model-selector purpose in public documentation

## Stage: Planning (2026-09-25T10:53:14Z)

### Session summary

Committed a numbered documentation/metadata plan for the package's direct-upstream identity, selection purpose, attribution, and packed publication surfaces.
Inspected the actual locally packed artifact and npm's README publication documentation; no implementation or publication was performed.
The next stage is `/build-plan`.

### Observations

- The operator chose to preserve the gotgenes-versus-tintinweb comparison as explicitly historical, with a short Jopqior fork introduction, rather than research a new three-way matrix.
- The README's existing selection section already distinguishes the core seam from the companion UI; the introduction and npm description should reflect that distinction without duplicating the detailed contract.
- The packed README contains a sibling-relative companion link that leaves the package; the plan replaces it with a public absolute URL.
- Packing ran the declaration build and included the README, license, comparison, configuration, architecture, and decision documents.
  Source-versus-packed README and license comparisons passed, and packing left tracked files unchanged.
- The MIT notice must remain intact; existing author metadata and credits are preserved while support destinations identify the fork.
- The architecture relationship section and package skill carry inherited maintenance claims; the plan aligns them with the canonical gotgenes sync procedure rather than asserting periodic upstream-suite execution.
- Fork issue [#24] already owns release correspondence and backfill; it is neither a prerequisite nor additional work for this plan.
- No runtime or test files change, so Tidy-First assessment and runtime TDD cycles are not applicable.
  The change is non-breaking and independently releasable, subject to explicit publication approval.

[#24]: https://github.com/Jopqior/gotgenes-pi-packages/issues/24

## Publication-surface verification (2026-09-25T11:02:13Z)

- Packed locally with `pnpm -C packages/pi-subagents pack --out /tmp/issue23-build.tgz` and extracted into the fresh `mktemp` directory `/tmp/issue23-build-9tfvOg`.
  The declaration build passed; no publication was performed.
- Source-versus-packed `README.md` and `LICENSE` comparisons passed using `cmp`; the license has no diff against the pre-implementation commit.
  The packed manifest retains author, MIT license, package identity, exports, dependencies, and fork-owned repository/homepage/bugs destinations, with the revised description.
  Pnpm expands catalog dev-dependencies and omits the `prepack` script in the packed manifest.
- Checked the packed README's relative document targets: all referenced files exist in the tarball.
  The selector link is absolute and targets this fork's companion; support targets the fork issue tracker, while gotgenes/tintinweb links identify provenance or external integrations.
- HTTP GET checks with redirects returned 200 for the fork repository/support/companion/sync/history links, gotgenes and tintinweb project links, npm README documentation, and retained screenshot and video URLs.
  The inherited Pi badge destination `https://pi.mariozechner.at/` failed TLS negotiation; it was retained rather than silently replaced.
  Npm package pages returned 403; `pnpm view` against `https://registry.npmjs.org/` confirmed the core and both linked gotgenes companion package identities.
  HTTP checks establish reachability at verification time, not browser rendering or fragment correctness.
- Audited provenance-related wording across packed documentation.
  Superseded ADR 0001, historical phase records, Pi-specific compositor references, and fixed-input selection maintenance trials retain their historical contexts.
  No historical records were rewritten.
- Baseline `pnpm run check` and `pnpm run lint` passed.
  Per-step and final lint, package `lint:md`, root-skill Markdown lint, and manifest Biome checks passed.
  No source or test files changed, so no runtime test cycle was added.
- The architecture's changed package-name label renders with `mmdc` to `/tmp/issue23-core.svg`; GitHub/vivify preview was not available in this session.
- Minor plan detail: corrected the architecture's stale `./service` export prose and gotgenes import example to the actual fork `.` export, replacing its unrelated gotgenes version range with verified-range guidance.
  Runtime service symbols and real companion package names remain unchanged.

## Stage: Implementation — Build (2026-09-25T11:07:08Z)

### Session summary

Completed all three planned documentation/metadata steps in separate commits.
Corrected direct-upstream identity and selector purpose, bounded the retained historical comparison, fixed public navigation and support ownership, and verified the local packed publication surface.
No runtime, dependency, version, license, changelog, or publication changes were made.

### Observations

- The architecture export example correction is the minor deviation recorded above; no design or behavioral scope changed.
- Pre-completion reviewer: WARN, with no blocking findings.
  The reviewer reported passing type, lint, test, and dead-code checks and independently parsed the architecture diagrams with `mmdc`.
- Reviewer warnings: the existing root `README.md` still describes repository-wide identity/install destinations using gotgenes wording; that repository-level surface is outside this package plan.
  The reviewer's repository-only read restriction prevented independent inspection of the supplied `/tmp` tarball, so packed-artifact verification remains the implementing session's direct check, not a second independent check.
  GitHub/vivify preview remains unverified.
- No plan steps remain; the next workflow stage is `/ship 23`.
  Any publication still requires explicit approval of destination and scope.

## Stage: Ship (2026-09-25T11:21:44Z)

### Session summary

Shipped from the root checkout on `main` in the trunk lane.
The operator explicitly approved publication of `@jopqior/pi-subagents` to npmjs.org through `Jopqior/gotgenes-pi-packages`, and approved the issue close comment before posting.
Closed issue #23 and released `pi-subagents-v4.0.1`.

### Observations

- Root lint and dead-code checks passed before pushing the implementation.
  CI run 36128349000 succeeded on the pushed implementation tip.
- The release candidate scan identified only `pi-subagents`; the version script returned a patch release from the existing `pi-subagents-v4.0.0` tag.
  Release run 36128760250 completed prepare, publish, and GitHub release successfully.
  Pulled the release commit and verified its `pi-subagents-v4.0.1` tag.
- No co-shipped issues or adopted PRs required closing.
  Issue [#24] remains separate; this issue is not a roadmap phase step.
- No worktree merge or teardown was needed.
  The next step is `/retro 23` at the root on `main`.
