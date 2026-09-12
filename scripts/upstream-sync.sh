#!/usr/bin/env bash
#
# Fetch gotgenes/pi-packages without importing tags, and optionally merge.
#
# Usage:
#   scripts/upstream-sync.sh          # ensure remote, fetch --no-tags, print ahead/behind
#   scripts/upstream-sync.sh --merge  # the same, then git merge upstream/main (no push)
#
# This script never pushes. The mutating half is a local merge on main.
# Run ./scripts/upstream-sync.sh (no flag) for the read-only default.
#
# tagOpt=--no-tags is the default when a fetch names neither --tags nor
# --no-tags. git fetch --tags and git fetch --all --tags still override it, so
# the fetch line is always `git fetch --no-tags upstream main`.

set -euo pipefail

UPSTREAM_URL='https://github.com/gotgenes/pi-packages.git'
UPSTREAM_URL_ALT='https://github.com/gotgenes/pi-packages'

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

usage() {
  printf 'Usage: %s [--merge]\n' "$(basename "$0")" >&2
  printf '  (no flag)  ensure remote, fetch --no-tags, print ahead/behind\n' >&2
  printf '  --merge    the same, then git merge upstream/main (no push)\n' >&2
  exit "${1:-1}"
}

merge=0
for arg in "$@"; do
  case "$arg" in
    --merge) merge=1 ;;
    -h | --help) usage 0 ;;
    *) usage 1 ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)" || die "not inside a git repository"
cd "$repo_root"

ensure_upstream_remote() {
  if git remote get-url upstream >/dev/null 2>&1; then
    url="$(git remote get-url upstream)"
    if [[ "$url" != "$UPSTREAM_URL" && "$url" != "$UPSTREAM_URL_ALT" ]]; then
      die "upstream remote URL is ${url}; expected ${UPSTREAM_URL}"
    fi
  else
    git remote add upstream "$UPSTREAM_URL"
  fi
  git config remote.upstream.tagOpt --no-tags
  git config remote.upstream.pushurl DISABLE
}

refuse_merge() {
  printf 'error: %s\n' "$1" >&2
  printf 'run ./scripts/upstream-sync.sh to fetch and print ahead/behind without merging\n' >&2
  exit 1
}

check_merge_preconditions() {
  local branch origin_url git_dir
  branch="$(git branch --show-current)"
  [[ "$branch" == "main" ]] || refuse_merge "current branch is ${branch}, not main"

  origin_url="$(git remote get-url origin)"
  [[ "$origin_url" == *Jopqior/gotgenes-pi-packages* ]] \
    || refuse_merge "origin is not Jopqior/gotgenes-pi-packages (got ${origin_url})"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    refuse_merge "index or tracked worktree is not clean"
  fi

  git_dir="$(git rev-parse --git-dir)"
  [[ ! -e "${git_dir}/MERGE_HEAD" ]] || refuse_merge "a merge is already in progress"
  [[ ! -d "${git_dir}/rebase-merge" && ! -d "${git_dir}/rebase-apply" ]] \
    || refuse_merge "a rebase is already in progress"
}

print_newest_upstream_pi_subagents_tag() {
  local listing newest peeled
  listing="$(git ls-remote --tags https://github.com/gotgenes/pi-packages.git 'pi-subagents-v*')"
  newest="$(
    printf '%s\n' "$listing" \
      | awk '{ print $2 }' \
      | sed 's#^refs/tags/##' \
      | sed 's#\^{}$##' \
      | sort -u -V \
      | tail -1
  )"
  if [[ -z "$newest" ]]; then
    printf 'newest upstream pi-subagents tag: (none)\n'
    return
  fi
  peeled="$(printf '%s\n' "$listing" | awk -v t="refs/tags/${newest}^{}" '$2 == t { print $1; exit }')"
  if [[ -z "$peeled" ]]; then
    peeled="$(printf '%s\n' "$listing" | awk -v t="refs/tags/${newest}" '$2 == t { print $1; exit }')"
  fi
  printf 'newest upstream pi-subagents tag: %s (%s)\n' "$newest" "$peeled"
}

ensure_upstream_remote
printf 'remote.upstream.tagOpt=%s\n' "$(git config --get remote.upstream.tagOpt)"
printf 'remote.upstream.pushurl=%s\n' "$(git config --get remote.upstream.pushurl)"

tags_before="$(mktemp)"
tags_after="$(mktemp)"
cleanup() {
  rm -f "$tags_before" "$tags_after"
}
trap cleanup EXIT

git tag | LC_ALL=C sort >"$tags_before"
git fetch --no-tags upstream main
git tag | LC_ALL=C sort >"$tags_after"

if ! cmp -s "$tags_before" "$tags_after"; then
  printf 'error: tag set changed during fetch; delete imported tags before merging:\n' >&2
  comm -13 "$tags_before" "$tags_after" >&2
  printf 'git tag -d <name> for each, then re-run\n' >&2
  exit 1
fi
printf 'tag count unchanged (%s)\n' "$(git tag | wc -l | tr -d ' ')"

git rev-parse --verify --quiet upstream/main >/dev/null \
  || die "upstream/main missing after fetch"

read -r ahead behind <<<"$(git rev-list --left-right --count HEAD...upstream/main)"
printf 'ahead/behind (HEAD...upstream/main): %s/%s\n' "$ahead" "$behind"
print_newest_upstream_pi_subagents_tag

if [[ "$merge" -eq 0 ]]; then
  exit 0
fi

check_merge_preconditions

if ! GIT_MERGE_AUTOEDIT=no git merge upstream/main; then
  printf 'error: merge conflicts remain; see docs/upstream-sync.md\n' >&2
  exit 1
fi
