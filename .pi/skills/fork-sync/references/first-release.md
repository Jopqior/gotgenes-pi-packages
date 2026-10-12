# First fork release handoff

Ordinary preparation refuses a missing first tag.
An approved original package uses [releasing](../../releasing/SKILL.md#a-packages-first-release), not this fork-specific source handoff.

## 1. Inspect source

Inspect resolver/renderer output without a version decision or candidate bundle:

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

This read-only inspection contacts upstream in a disposable repository; success is not publication authorization.

## 2. Prepare and validate tagged artifacts

The first version is an explicit operator choice; no first-version inference or candidate/application bundle is provided.
Review the registered fork identity, manifest version, package contents and source block.
Use the reviewed block in the manually prepared first tagged section and validate the exact tagged artifacts before publication.

## 3. Approve publication and hand off later releases

Obtain separate operator approval of the npm scope and destination before manual first publication; registration and source inspection are not approval.
With that approval and validated tagged artifacts, publish manually without `--provenance`:

```bash
pnpm --filter <approved-npm-name> publish --access public --no-git-checks --registry=https://registry.npmjs.org/
```

An OTP-required publication needs the operator's interactive terminal.
Trusted Publishing cannot create a nonexistent npm package; configure the npmjs.org Trusted Publisher for this fork's `release.yml` after that approved first publication.
Later releases use ordinary guarded dispatch with separate release approval through [releasing](../../releasing/SKILL.md).
