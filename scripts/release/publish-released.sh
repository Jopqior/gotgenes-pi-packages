#!/usr/bin/env bash
# Publish the complete registered, verified tagged release set at HEAD.
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/release/lib.sh
. scripts/release/lib.sh

pkgs=()
tags=()
for tag in $(git tag --points-at HEAD); do
  pkg=""
  while IFS= read -r candidate; do
    case "$tag" in
      "${candidate}-v"*)
        if [ ${#candidate} -gt ${#pkg} ]; then pkg=$candidate; fi
        ;;
    esac
  done < <(release_packages)
  if [ -z "$pkg" ]; then
    echo "Note: tag '$tag' matches no package; skipping." >&2
    continue
  fi
  pkgs+=("$pkg")
  tags+=("$tag")
done

if [ ${#tags[@]} -eq 0 ]; then
  echo "No released packages to publish."
  exit 0
fi

artifacts=$(mktemp -d)
trap 'rm -rf "$artifacts"' EXIT
# The full tagged set passes the identity, exact-record and CHANGELOG checks
# before the first registry call; no tag namespace refresh is permitted here.
node scripts/release/release-artifacts.mjs published "$PWD" "$artifacts" "${tags[@]}"
i=0
while [ "$i" -lt ${#tags[@]} ]; do
  pkg=${pkgs[$i]}
  name=$(jq -r '.name' "packages/$pkg/package.json")
  echo "::group::Publishing $name ($pkg) from ${tags[$i]}"
  pnpm --filter "$name" publish --access public --no-git-checks --provenance --registry=https://registry.npmjs.org/
  echo "::endgroup::"
  i=$((i + 1))
done
