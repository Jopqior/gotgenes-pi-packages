#!/usr/bin/env bash
# Create Releases from the exact tagged CHANGELOG sections, never --latest.
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/release/lib.sh
. scripts/release/lib.sh
: "${GH_TOKEN:?Required: set GH_TOKEN}"

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
  tags+=("$tag")
done
if [ ${#tags[@]} -eq 0 ]; then
  echo "No GitHub Releases to create."
  exit 0
fi

artifacts=$(mktemp -d)
trap 'rm -rf "$artifacts"' EXIT
node scripts/release/release-artifacts.mjs published "$PWD" "$artifacts" "${tags[@]}"

# Preflight the entire remote set: a rerun never overwrites a Release, and a
# conflicting managed block blocks *all* new creations, even if it is last.
i=0
while [ "$i" -lt ${#tags[@]} ]; do
  tag=${tags[$i]}
  if gh release view "$tag" --repo Jopqior/gotgenes-pi-packages --json body -q .body > "$artifacts/body-$i" 2> "$artifacts/error-$i"; then
    node scripts/release/release-artifacts.mjs existing "$artifacts/body-$i" "$artifacts/notes-$i"
    touch "$artifacts/exists-$i"
  elif ! grep -Eiq 'release not found|HTTP 404' "$artifacts/error-$i"; then
    echo "Error: cannot inspect existing Release $tag" >&2
    cat "$artifacts/error-$i" >&2
    exit 1
  fi
  i=$((i + 1))
done

created=0
i=0
while [ "$i" -lt ${#tags[@]} ]; do
  tag=${tags[$i]}
  if [ -f "$artifacts/exists-$i" ]; then
    echo "Release $tag already exists; skipping."
  else
    echo "Creating GitHub Release $tag"
    gh release create "$tag" --repo Jopqior/gotgenes-pi-packages --title "$tag" --notes-file "$artifacts/notes-$i"
    created=$((created + 1))
  fi
  i=$((i + 1))
done
if [ "$created" -eq 0 ]; then echo "No GitHub Releases to create."; fi
