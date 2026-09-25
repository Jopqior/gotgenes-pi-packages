---
issue: 24
issue_title: "Include verified upstream correspondence in every fork package release"
---

# Retro: #24 — Include verified upstream correspondence in every fork package release

## Stage: Planning (2026-09-25T11:53:43Z)

### Session summary

Committed the repository-level implementation plan in `aee2258a6`, after a successful fast-forward-only pull, issue/context investigation, operator decisions, real-history checks, and a fresh Tidy First assessment.
The plan covers explicit package classification, verified release artifacts, an automatically written correspondence table, and approval-gated historical Release backfill.
No implementation, release dispatch, remote edit, or publication was performed.

### Observations

- The operator confirmed `fork` / `original` registration using actual package identities, with unregistered packages refused by mutating release entry points.
  `core` and `selector` are role shorthand, not provenance classes; conflating them made the first gate need clarification.
- The operator wants the tool to write the table in `docs/upstream-sync.md` directly, not another instruction to maintain it by hand.
  Historical backfill means adding evidence to existing GitHub Release bodies, previewing exact edits first and obtaining separate approval before application.
- Current state includes fork `4.0.1`, beyond the issue's original inventory, and its live Release also lacks the correspondence block.
  Verified real-object baselines are `21.7.0` for fork `1.0.0`–`1.0.2` and `21.7.3` for recorded later versions; retain the existing state schema and revalidate before adding old rows.
- Fork `1.0.0` is published on npm and has a local tag, but no GitHub Release exists; record its correspondence without creating a missing Release.
  The old `1.0.1` body contains a source-history restoration notice that must survive byte-for-byte, and restored tags must not be described as new attestations of old npm artifacts.
- CHANGELOG version headings collide with inherited upstream entries.
  The disposable scanner checked the real corpus and showed that exact fork comparison URLs distinguish generated sections; manual `1.0.0` and the selector's changelog-less `0.1.0` tag are explicit historical exceptions, not reasons to guess.
- Measured release baseline: `pnpm exec vitest run test/release` passed 9 files / 108 tests.
  Both published-package predictors report nothing pending, and real packing confirmed shipped README and CHANGELOG files.
  Plan Markdown lint passed, as did its commit hooks.
- Accepted Tidy First work extracts published correspondence and tail validation while retaining their separate original call positions and diagnostics.
  Add a failure-order characterization pin; do not call the current-window version decision to answer historical provenance.
- Existing decision fixtures use `@fixture` identities and upstream-version baseline manifests; new artifact tests need internally consistent fork identities/tags rather than a global fixture rewrite.
  The explicit preparation script-copy list must change with new imports/config, and its successful `demo` case must register an original fixture package.
- The existing missing-CHANGELOG branch discards the supplied section, and rendering currently follows manifest writes.
  Both are behavior changes to fix and test with the pipeline integration, not preparatory refactors.
- The next step is `/tdd-plan`; the plan ends with a real backfill preview and a separate remote-approval gate.
  A package README update needs later approved publication to reach npm, while repository tooling can land independently.

#### Deferred tidyings

- `test/release/core-sync.test.mjs` and its scenario helpers: broad fixture/describe restructuring was rejected; the change needs only narrow artifact setup and an error-order pin.
- `test/release/helpers/git-repository.mjs`: automatic copied-script dependency discovery was rejected; explicit transitive copy lists remain sufficient.
- `scripts/release/lib.sh`: restricting workspace enumeration or generic prediction to registered packages was rejected; registration gates belong to mutating release entry points.
- `scripts/release/release-correspondence.mjs` (planned): a generic evidence-adapter/plugin framework was rejected; unsupported future fork evidence must fail closed instead.

## Stage: Implementation — TDD (2026-09-25T14:47:13Z)

### Session summary

Completed the six planned code steps with characterization or Red/Green/mutation checks, the documentation and packing step, and the real read-only historical preview, using a fresh subagent for each step as requested by the operator.
Two corrective code cycles and a documentation correction followed the first independent review; the second pre-completion review returned PASS with all four root gates passing.
Measured full-suite totals increased from 7,584 to 7,673 passing tests (+89), entirely in the root script suite (279 to 368); no push, release dispatch, npm publication, or remote Release edit occurred.

### Observations

- New releases require explicit package registration and verified correspondence before preparation or publication effects; GitHub notes come from the exact tagged CHANGELOG section.
  The generated correspondence table and historical records are verified against real Git objects, and original packages do not receive upstream claims.
- The first attempted all-steps subagent was cancelled before startup.
  The operator required fresh per-step agents; implementation, corrective steps, and the operational preview followed that arrangement.
- Step 1's characterization pin confirmed window-error precedence over a bad baseline tail.
  Step 2's mutation checks exposed two initially weak ancestry probes, which were corrected before committing.
  Parent review of step 3 removed closed-world historical expectations that would reject future additive release records.
- Structural deviations: `release-artifacts.mjs` owns cohesive artifact preflight; `core-sync-scenario.mjs` gained an opt-in artifact mode instead of globally changing existing fixture identities.
  Separate view/table tests, a real historical Release fixture, and comment-only renderer guidance changes supplement the planned files.
  No package runtime, architecture roadmap, package manifest, lockfile, or historical CHANGELOG was changed.
- First pre-completion review: FAIL despite passing deterministic gates.
  It found a canonical-block suffix restriction that broke backfill no-ops, coercive JSON OID validation, and a mismatch between validated tags and the working tree actually published.
  It also found a non-mixed mixed-selection test, trimmed historical comparisons, an unregistered dispatch example, and a reviewer type whitelist narrower than `committed.toml`.
  The operator approved fixes and re-review rather than bypassing the findings.
- Corrective commits reject package checkout drift before publication, compare critical files byte-for-byte, preserve identical correspondence blocks anywhere in the body, enforce strict reviewed types and SemVer, and strengthen the mixed-selection and preservation tests.
  Documentation now uses registered identities without implying publication approval; the reviewer consults the actual commit-message policy, which permits the planned `build:` commit.
  Second pre-completion reviewer: PASS at `9ce186447`, with no outstanding warnings; the only later tracked edit is this stage note.
- Root test runs were kept separate from other heavy gates after concurrent checks caused transient fixture timeouts during step 4.
  Real package packing confirmed shipped README and CHANGELOG, and scratch prepared package notes matched captured GitHub notes byte-for-byte.
  Per-step commands and mutation results remain in `/tmp/f0024-step1-evidence.md` through `/tmp/f0024-step8-evidence.md`, with separate step 5–7 correction evidence files.

### Historical preview and approval status

- The real preview proposes notes-only additions to six existing core Releases: `pi-subagents-v1.0.1`, `pi-subagents-v1.0.2`, `pi-subagents-v2.0.0`, `pi-subagents-v3.0.0`, `pi-subagents-v4.0.0`, and `pi-subagents-v4.0.1`.
  The first two use verified upstream `21.7.0`; the remaining four use `21.7.3`.
  The original bodies, including the source-history restoration disclosure, remain unchanged prefixes; there are six proposed edits and zero no-ops.
- `pi-subagents-v1.0.0` has a tag but no Release and is reported missing, never created.
  Selector Releases, Release metadata, tags, historical packaged files, and npm artifacts are outside the edit scope.
  Remote tag refs were independently peeled and matched local objects; a second read-only preview matched the first snapshot byte-for-byte.
- Exact review artifact: `/tmp/f0024-step8-GaN2Jpp1/review.json`.
  Its SHA-256 is `6f36570735962df5ea7700da3b5539a823ca0a6ac76a9b9e70e40b9fbaf04cdb`.
  Before/after bodies and per-release diffs are in the same directory.
- The operator explicitly deferred approval and requested a human-readable HTML view instead of JSON.
  The resulting offline page is `/tmp/f0024-step8-GaN2Jpp1/review.html`; it shows the complete proposed additions and expandable original bodies, with no apply control.
  Its SHA-256 is `ff89e1112a03abe73d152ba709fe2398001a85e7e8172e754057326e46e94af8`.
  The HTML is a presentation of the unchanged JSON, not an authorization artifact.
- Historical backfill is NOT approved and NOT applied.
  The next workflow step is `/ship 24`; obtain explicit approval of the exact preview before any notes-only apply, and separate approval before any package publication.
  Temporary artifacts may disappear between sessions; regenerate and obtain fresh approval if missing or changed.
  Apply must revalidate the complete snapshot, and another editor can still race its final read; no multi-Release transaction or compare-and-swap guarantee is claimed.
