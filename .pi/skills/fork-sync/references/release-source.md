# Release source

Use this reference to interpret version predictions, source evidence and release-artifact checks.
Keep the [skill entry's shared boundaries](../SKILL.md#shared-boundaries).
Use [releasing](../../releasing/SKILL.md) for ordinary dispatch.

## Predict the version

Run from the repository root:

```bash
./scripts/release/next-version.sh pi-subagents
./scripts/release/next-version.sh pi-subagents-worktrees
./scripts/release/verify-cliff-parity.sh
```

These commands are read-only and offline.
Interpret `next-version.sh` results as follows:

| Result                       | Meaning                               |
| ---------------------------- | ------------------------------------- |
| Success with a predicted tag | A release is pending                  |
| Success with empty output    | Nothing to release                    |
| Nonzero status               | Derivation failed                     |
| Untagged package             | Refused; no first version is inferred |

An untagged fork requires the separately approved first-release handoff.

### Version rules

The policy in `scripts/release/lib.sh` applies to every package:

- Ordinary path-scoped Conventional Commits and git-cliff determine the version.
- The latest package tag's commit is the lower bound, even if it touches only excluded paths.
- A shared breaking commit can bump multiple path-matching packages by the same semantic class.
- Package CHANGELOGs and `docs/{plans,retro,architecture,decisions,assets}` are excluded.
  Shipped documentation, tests, code and manifests remain included.

Source provenance does not choose the release level or override a breaking commit.

## Interpret source evidence

### Registered identity

The schema-3 registry is `scripts/release/release-packages.json`.
Each entry declares a directory, npm name and `original` or `fork` classification.
A fork also declares its direct upstream manifest identity, repository and package directory.
Core and worktrees have separate identities and source claims; neither inherits its claim from a dependency.
An original package has no source block and makes no upstream query during preparation.

### Resolver rules

The resolver uses explicit preparation HEAD and walks first-parent merge history.
It selects the latest genuine two-parent upstream integration, excluding inherited upstream merges and ordinary fork feature merges.
Regressive, incomparable or ambiguous upstream-carrying topology is refused.
Commit messages cannot substitute for ancestry evidence.

Within that integration's second parent, the resolver selects the numerically highest contained stable release.
Today's newest advertised tag does not replace it.
Both lightweight and annotated tags are supported.
Manifest identity, version and ancestry must agree.
A GitHub Release object is neither required nor queried.

### Source block and package tail

The managed `upstream-correspondence` block contains:

- The contained stable version.
- A fixed link to its release commit.
- A separate fixed link to the incorporated commit.

Read it as provenance, not behavioral equivalence or historical npm artifact identity.
The label `Includes unreleased changes to this package.` records scoped incorporated commits after the stable release that touched this package.
Merge-only changes and later-reverted changes count.
Unrelated packages and excluded internal documentation do not create a tail.
The tail affects display only; it neither blocks release nor determines the release level.

## Preparation boundaries

These are script guarantees, not a manual reconstruction procedure.

### Source resolution

Source resolution in `scripts/fork-sync/source.mjs` is independent of version calculation.
Its network work stays in a temporary bare shared clone:

- Start without tags.
- Fetch registered upstream main into a private ref with `--no-tags --no-write-fetch-head`.
- Query stable package tags with `ls-remote --tags`.

The resolver creates no live remote, updates no live fork refs and imports no upstream tag refs.
It persists no cache or ledger.
Temporary repositories are disposed on success and failure.
Network failure or missing, shallow or partial evidence stops preparation before tracked writes.

### Artifact preparation

The script `scripts/release/prepare-release.sh` derives every selected tag and renders every raw section before preflight.
The entire selection must pass registration, identity, heading and source checks before any tracked write, commit, tag or push.

For CHANGELOG writes, the script:

- Composes each section once, including its boundary newline.
- Inserts that section byte-for-byte below the existing header.
- Leaves every older section byte-identical.
- Uses the preflighted generated header and decorated section when the CHANGELOG is missing.

No synchronization state or correspondence table is written.
Git and ordinary lifecycle artifacts carry the handoff.
The retired recorder, contribution arguments, package-fetch selector, state/config directories, generated tables, backfill and first-release candidate utilities have no compatibility readers or aliases.

## Downstream checks

### Tagged artifacts

Downstream jobs use the exact release commit and require:

- Each selected tag bound to HEAD.
- Registered manifest name/version agreement.
- No package drift.
- Critical package.json and CHANGELOG bytes matching the tag, even when Git index flags hide changes from status.

They read the exact tagged section and validate its new source block offline against:

- Local commit/manifest ancestry and the integration-parent claim.
- Fixed paths and the scoped tail label.

They neither reselect upstream tags nor contact upstream to regenerate claims.
Older tagged source formats remain immutable history, not input to a compatibility parser.

### Publication and GitHub Releases

Publication preflights the entire tagged set before its first npm effect.
It uses explicitly approved npm identities and the npmjs.org registry.

GitHub creation preflights the entire set and all existing managed blocks before its first creation.
It explicitly targets `Jopqior/gotgenes-pi-packages`.
Release notes reuse exact tagged-section bytes, without a second git-cliff render.
Existing Releases, including legacy bodies, are never overwritten.
A conflicting managed block stops the entire creation selection.

### Failed runs

Inspect actual commit, tag and remote state before a separately approved retry.
A failed preparation job does not prove that no push occurred.
Follow [releasing](../../releasing/SKILL.md) for run/dependency inspection and retry coordination.
Existing published artifacts remain unchanged.
