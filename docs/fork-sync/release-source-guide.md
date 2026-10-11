# Release source guide

The [synchronization guide](synchronization-guide.md) owns integration safety and lifecycle exceptions.
This guide owns current release versioning, source display and publication preflight.
Existing published npm artifacts, tagged CHANGELOGs and GitHub Releases remain unchanged.

## Ordinary versioning

Every package uses ordinary path-scoped Conventional Commits and git-cliff through `scripts/release/lib.sh`.
Prediction uses the latest package tag's commit as the explicit lower bound, including when that tag touches only excluded paths.
Source provenance does not choose a release level or override a breaking commit.
A shared breaking commit can bump multiple path-matching packages by the same semantic class.
Package CHANGELOGs and `docs/{plans,retro,architecture,decisions,assets}` are excluded; shipped documentation, tests, code and manifests remain included.

Run these offline, read-only commands from the root:

```bash
./scripts/release/next-version.sh pi-subagents
./scripts/release/next-version.sh pi-subagents-worktrees
./scripts/release/verify-cliff-parity.sh
```

Successful empty prediction means nothing to release; a nonzero status means derivation failed.
An untagged package is refused, never assigned an inferred first version.
The old recorder, contribution arguments, package fetch selector, state/config directories, generated correspondence tables, historical backfill and first-release candidate utilities no longer exist.
There are no compatibility readers or aliases for those tools.

## Source reconstruction

`scripts/release/release-packages.json` schema 3 explicitly registers directory, npm name and `original` or `fork` classification.
Each fork declares its direct upstream manifest identity, repository and package directory; registration never grants publication approval.
Core and worktrees have their own identities and source claims, not claims inferred from a dependency.
An original package has no upstream source block and does not contact upstream during preparation.

`scripts/fork-sync/source.mjs` resolves source independently of version calculation at the explicit preparation HEAD.
It makes a temporary bare shared clone with no tags, fetches registered upstream main into a private temporary ref with `--no-tags --no-write-fetch-head`, and queries stable package tags with `ls-remote --tags`.
It creates no live remote, updates no live fork refs, imports no upstream tag refs and persists no cache or ledger.
Temporary repositories are disposed on success and failure.
Network or missing/shallow/partial evidence failures stop preparation before tracked writes.

The resolver walks first-parent merge history for the latest genuine two-parent upstream integration, excluding inherited upstream merges and ordinary fork feature merges.
Regressive, incomparable or ambiguous upstream-carrying topology is refused rather than attributed by commit message.
It chooses the numerically highest stable release contained in that incorporated second parent, not today's newest advertised tag.
Lightweight and annotated tags are supported; required manifest identity/version and ancestry must agree.
A GitHub Release object is not required or queried.

The managed `upstream-correspondence` block records the contained stable version, its fixed release-commit link and the distinct fixed incorporated-commit link.
It states provenance, not behavioral equivalence or historical npm artifact identity.
`Includes unreleased changes to this package.` is emitted when scoped incorporated commits after the stable release touch that package, including merge-only changes and changes later reverted.
Unrelated packages and excluded internal documentation do not create a package tail.
An unreleased tail is display information, not a release blocker or release-level input.

## Preparation and downstream validation

`prepare-release.sh` derives every selected tag and renders every raw section before the artifact preflight.
The complete selection must pass registration, identity, heading and source checks before any tracked manifest/CHANGELOG write, commit, tag or push.
The section is composed once, including its boundary newline, then inserted byte-for-byte below the existing header.
Every older release section remains byte-identical; a missing CHANGELOG uses the preflighted generated header and decorated section.
No synchronization state or table is written.

Downstream jobs check out the exact release commit, bind each selected tag to HEAD, validate registered manifest name/version and reject package drift.
Critical package.json and CHANGELOG bytes are compared even when Git index flags hide changes from status.
They read the exact tagged section and validate the new block offline against local commit/manifest ancestry, integration-parent claim, fixed paths and the scoped tail label.
They never reselect upstream tags or contact upstream to regenerate claims.
Old tagged source formats are immutable history, not input to a new compatibility parser.

Publication preflights the complete tagged set before its first npm effect, with explicit approved npm identities and npmjs.org registry.
GitHub creation preflights the complete set and all existing managed blocks before its first creation, always targeting `Jopqior/gotgenes-pi-packages` explicitly.
Notes are the exact tagged section bytes, not a second git-cliff render.
Existing Releases, including legacy bodies, are never overwritten; a conflicting managed block stops the whole creation selection.
After a failed run inspect actual commit/tag/remote state before any separately approved retry; preparation failure alone does not prove that no push occurred.

## First fork release handoff

A package's first version is an explicit operator choice; ordinary preparation refuses missing first tags.
Before manual first publication, review its registered identity, manifest version, package contents and source block, and obtain separate approval of the npm scope and destination.
For a fork, source resolution and rendering can be inspected without a version decision or candidate bundle:

```bash
node --input-type=module -e '
  import {execFileSync} from "node:child_process";
  import {readReleasePackages, requireReleasePackage} from "./scripts/release/release-metadata.mjs";
  import {resolveUpstreamSource, renderUpstreamSource} from "./scripts/fork-sync/source.mjs";
  const repo = process.cwd();
  const registry = readReleasePackages("scripts/release/release-packages.json", repo);
  const registration = requireReleasePackage(registry, process.argv[1]);
  if (registration.kind !== "fork") throw new Error("select a registered fork");
  const at = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
  const source = resolveUpstreamSource({repo, at, upstream:registration.upstream});
  console.log(renderUpstreamSource({source, upstream:registration.upstream}));
' pi-subagents
```

This read-only source inspection contacts upstream in a disposable repository; success is not publication authorization.
Use the reviewed new block in the manually prepared first tagged section and validate tagged artifacts before publication.
Publish manually without `--provenance`, using `pnpm --filter <approved-npm-name> publish --access public --no-git-checks --registry=https://registry.npmjs.org/`.
Trusted Publishing cannot create a nonexistent npm package; configure the npmjs.org Trusted Publisher for this fork's `release.yml` after that separately approved first publication.
An OTP-required publication needs the operator's interactive terminal.
Later releases use ordinary guarded dispatch with separate release approval.
