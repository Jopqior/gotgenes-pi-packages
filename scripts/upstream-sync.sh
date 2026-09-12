#!/usr/bin/env bash
#
# Fetch gotgenes/pi-packages without importing tags, and optionally squash-sync.
#
# Usage:
#   scripts/upstream-sync.sh                         # ensure remote, fetch --no-tags, print sync status
#   scripts/upstream-sync.sh --sync                  # squash-sync upstream/main onto main (no push)
#   scripts/upstream-sync.sh --continue              # finish a conflicted squash-sync
#   scripts/upstream-sync.sh --derive-type <old> <new>  # print the sync commit type
#
# This script never pushes. The mutating half is a single-parent squash-sync
# on main. Run ./scripts/upstream-sync.sh (no flag) for the read-only default.
#
# tagOpt=--no-tags is the default when a fetch names neither --tags nor
# --no-tags. git fetch --tags and git fetch --all --tags still override it, so
# the fetch line is always `git fetch --no-tags upstream main`.

set -euo pipefail

UPSTREAM_URL='https://github.com/gotgenes/pi-packages.git'
UPSTREAM_URL_ALT='https://github.com/gotgenes/pi-packages'
SYNC_DOC='docs/upstream-sync.md'
SYNC_BRANCH='sync/in-progress'
PACKAGE_JSON='packages/pi-subagents/package.json'
CHANGELOG='packages/pi-subagents/CHANGELOG.md'

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

usage() {
  printf 'Usage: %s [--sync | --continue | --derive-type <old> <new>]\n' "$(basename "$0")" >&2
  printf '  (no flag)         ensure remote, fetch --no-tags, print sync status\n' >&2
  printf '  --sync            squash-sync upstream/main onto main (no push)\n' >&2
  printf '  --continue        finish a conflicted squash-sync (must be on %s)\n' "$SYNC_BRANCH" >&2
  printf '  --derive-type     print the Conventional Commits type for old..new\n' >&2
  exit "${1:-1}"
}

mode='status'
derive_old=''
derive_new=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --merge)
      printf 'use --sync; squash-sync replaced merge\n' >&2
      exit 2
      ;;
    --sync)
      mode='sync'
      shift
      ;;
    --continue)
      mode='continue'
      shift
      ;;
    --derive-type)
      mode='derive-type'
      if [[ $# -lt 3 ]]; then
        usage 1
      fi
      derive_old="$2"
      derive_new="$3"
      shift 3
      ;;
    -h | --help)
      usage 0
      ;;
    *)
      usage 1
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)" || die "not inside a git repository"
cd "$repo_root"

git_dir="$(git rev-parse --git-dir)"
state_file="${git_dir}/upstream-sync-state"

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

refuse_sync() {
  printf 'error: %s\n' "$1" >&2
  printf 'run ./scripts/upstream-sync.sh to fetch and print sync status without syncing\n' >&2
  exit 1
}

check_sync_preconditions() {
  local branch origin_url
  branch="$(git branch --show-current)"
  [[ "$branch" == "main" ]] || refuse_sync "current branch is ${branch}, not main"

  origin_url="$(git remote get-url origin)"
  [[ "$origin_url" == *Jopqior/gotgenes-pi-packages* ]] \
    || refuse_sync "origin is not Jopqior/gotgenes-pi-packages (got ${origin_url})"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    refuse_sync "index or tracked worktree is not clean"
  fi

  [[ ! -e "${git_dir}/MERGE_HEAD" ]] || refuse_sync "a merge is already in progress"
  [[ ! -d "${git_dir}/rebase-merge" && ! -d "${git_dir}/rebase-apply" ]] \
    || refuse_sync "a rebase is already in progress"

  if git show-ref --verify --quiet "refs/heads/${SYNC_BRANCH}"; then
    refuse_sync "branch ${SYNC_BRANCH} already exists; finish with --continue or delete it"
  fi
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

newest_upstream_pi_subagents_tag_name() {
  local listing newest
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
    printf '(none)\n'
  else
    printf '%s\n' "$newest"
  fi
}

derive_type() {
  local old="$1" new="$2"
  local subjects bodies
  local breaking=0 feat=0 fix=0
  local breaking_re feat_re fix_re body_re
  breaking_re='^[a-z]+(\([^)]+\))?!:'
  feat_re='^feat(\(|:|!)'
  fix_re='^fix(\(|:|!)'
  body_re='^BREAKING CHANGE:'
  subjects="$(git log --format='%s' "${old}..${new}")"
  bodies="$(git log --format='%b' "${old}..${new}")"
  while IFS= read -r s || [[ -n "$s" ]]; do
    [[ -z "$s" ]] && continue
    if [[ "$s" =~ $breaking_re ]]; then
      breaking=1
    elif [[ "$s" =~ $feat_re ]]; then
      feat=1
    elif [[ "$s" =~ $fix_re ]]; then
      fix=1
    fi
  done <<<"$subjects"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ $body_re ]]; then
      breaking=1
    fi
  done <<<"$bodies"
  if [[ "$breaking" -eq 1 ]]; then
    printf 'feat!:\n'
  elif [[ "$feat" -eq 1 ]]; then
    printf 'feat:\n'
  elif [[ "$fix" -eq 1 ]]; then
    printf 'fix:\n'
  else
    printf 'chore:\n'
  fi
}

table_upstream_sha() {
  awk -F '|' '
    $0 ~ /^[[:space:]]*\|[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}T/ {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $3)
      sha=$3
    }
    END { print sha }
  ' "$SYNC_DOC"
}

require_sync_pointer() {
  local ref_sha table_sha
  if ! git rev-parse --verify --quiet refs/sync/upstream-main >/dev/null; then
    die "refs/sync/upstream-main is missing; recreate it from the last Sync log row:
git update-ref refs/sync/upstream-main <Upstream SHA from the last Sync log row>"
  fi
  ref_sha="$(git rev-parse refs/sync/upstream-main)"
  table_sha="$(table_upstream_sha)"
  if [[ ! "$table_sha" =~ ^[0-9a-fA-F]{40}$ ]]; then
    die "could not parse a 40-hex Upstream SHA from ${SYNC_DOC} Sync log"
  fi
  if [[ "$ref_sha" != "$table_sha" ]]; then
    die "refs/sync/upstream-main (${ref_sha}) != Sync log Upstream SHA (${table_sha})"
  fi
}

write_state() {
  local u_old="$1" u_new="$2"
  printf 'U_OLD=%s\nU_NEW=%s\n' "$u_old" "$u_new" >"$state_file"
}

read_state() {
  [[ -f "$state_file" ]] || die "${state_file} is missing; cannot --continue"
  # shellcheck disable=SC1090
  source "$state_file"
  [[ -n "${U_OLD:-}" && -n "${U_NEW:-}" ]] || die "${state_file} is incomplete"
}

unmerged_paths() {
  git diff --name-only --diff-filter=U
}

path_is_unmerged() {
  git diff --name-only --diff-filter=U -- "$1" | grep -Fxq "$1"
}

recipe_package_json() {
  path_is_unmerged "$PACKAGE_JSON" || return 0
  local ours theirs name version
  ours="$(git show ":2:${PACKAGE_JSON}")"
  theirs="$(git show ":3:${PACKAGE_JSON}")"
  name="$(printf '%s' "$ours" | jq -r .name)"
  version="$(printf '%s' "$ours" | jq -r .version)"
  printf '%s' "$theirs" \
    | jq --arg name "$name" --arg version "$version" '.name = $name | .version = $version' \
    >"$PACKAGE_JSON"
  git add "$PACKAGE_JSON"
}

recipe_changelog() {
  path_is_unmerged "$CHANGELOG" || return 0
  python3 - "$CHANGELOG" <<'PY'
import subprocess
import sys

path = sys.argv[1]


def show(stage: str) -> str:
    result = subprocess.run(
        ["git", "show", f":{stage}:{path}"],
        check=True,
        capture_output=True,
    )
    return result.stdout.decode()


def split_sections(text: str) -> tuple[str, list[tuple[str, str]]]:
    lines = text.splitlines(keepends=True)
    first = next((i for i, line in enumerate(lines) if line.startswith("##")), None)
    if first is None:
        return "".join(lines), []
    header = "".join(lines[:first])
    sections: list[tuple[str, str]] = []
    start = first
    for i in range(first + 1, len(lines)):
        if lines[i].startswith("##"):
            sections.append((lines[start], "".join(lines[start:i])))
            start = i
    sections.append((lines[start], "".join(lines[start:])))
    return header, sections


ours = show("2")
theirs = show("3")
theirs_header, theirs_sections = split_sections(theirs)
_, ours_sections = split_sections(ours)
theirs_headings = {heading.rstrip("\n") for heading, _ in theirs_sections}
fork_only = [block for heading, block in ours_sections if heading.rstrip("\n") not in theirs_headings]
theirs_from_h2 = "".join(block for _, block in theirs_sections)
result = theirs_header + "".join(fork_only) + theirs_from_h2
if result and not result.endswith("\n"):
    result += "\n"
with open(path, "w", encoding="utf-8") as handle:
    handle.write(result)
PY
  git add "$CHANGELOG"
}

run_recipes() {
  recipe_package_json
  recipe_changelog
}

append_sync_log_row() {
  local date="$1" u_new="$2" tag="$3" fork_sha="$4"
  python3 - "$SYNC_DOC" "$date" "$u_new" "$tag" "$fork_sha" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
date, u_new, tag, fork_sha = sys.argv[2:]
text = path.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)
pat = re.compile(r"^\s*\|\s*\d{4}-\d{2}-\d{2}T")
last = None
for i, line in enumerate(lines):
    if pat.match(line):
        last = i
if last is None:
    raise SystemExit(f"no Sync log data row in {path}")
row = f"| {date} | {u_new} | {tag} | {fork_sha} |\n"
lines.insert(last + 1, row)
path.write_text("".join(lines), encoding="utf-8")
PY
}

clear_rumdl_cache_if_renames() {
  local u_old="$1" u_new="$2"
  if git diff --name-status "$u_old" "$u_new" | grep -q '^R'; then
    find .rumdl_cache -type f -delete 2>/dev/null || true
  fi
}

transplant_onto_main() {
  local u_old="$1" u_new="$2"
  local tree type old_short new_short tag sync_sha

  pnpm install
  git add pnpm-lock.yaml
  clear_rumdl_cache_if_renames "$u_old" "$u_new"
  tree="$(git write-tree)"

  git switch --force main
  git read-tree -u --reset "$tree"

  type="$(derive_type "$u_old" "$u_new")"
  type="${type%$'\n'}"
  old_short="$(git rev-parse --short=8 "$u_old")"
  new_short="$(git rev-parse --short=8 "$u_new")"
  tag="$(newest_upstream_pi_subagents_tag_name)"
  tag="${tag%$'\n'}"

  git commit -m "$(
    printf '%s sync gotgenes/pi-packages %s..%s\n\nUpstream: https://github.com/gotgenes/pi-packages\nRange: %s..%s\nBaseline: %s\n' \
      "$type" "$old_short" "$new_short" "$u_old" "$u_new" "$tag"
  )"

  sync_sha="$(git rev-parse HEAD)"
  git update-ref refs/sync/upstream-main "$u_new"
  git branch -D "$SYNC_BRANCH" >/dev/null
  rm -f "$state_file"

  append_sync_log_row "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$u_new" "$tag" "$sync_sha"
  git add "$SYNC_DOC"
  git commit -m "docs: record upstream squash-sync ${tag}" -- "$SYNC_DOC"
}

fetch_upstream() {
  local tags_before tags_after
  ensure_upstream_remote
  printf 'remote.upstream.tagOpt=%s\n' "$(git config --get remote.upstream.tagOpt)"
  printf 'remote.upstream.pushurl=%s\n' "$(git config --get remote.upstream.pushurl)"

  tags_before="$(mktemp)"
  tags_after="$(mktemp)"
  git tag | LC_ALL=C sort >"$tags_before"
  git fetch --no-tags upstream main
  git tag | LC_ALL=C sort >"$tags_after"

  if ! cmp -s "$tags_before" "$tags_after"; then
    printf 'error: tag set changed during fetch; delete imported tags before syncing:\n' >&2
    comm -13 "$tags_before" "$tags_after" >&2
    printf 'git tag -d <name> for each, then re-run\n' >&2
    rm -f "$tags_before" "$tags_after"
    exit 1
  fi
  printf 'tag count unchanged (%s)\n' "$(git tag | wc -l | tr -d ' ')"
  rm -f "$tags_before" "$tags_after"

  git rev-parse --verify --quiet upstream/main >/dev/null \
    || die "upstream/main missing after fetch"
}

print_sync_status() {
  local u_old u_new count pending
  require_sync_pointer
  u_old="$(git rev-parse refs/sync/upstream-main)"
  u_new="$(git rev-parse upstream/main)"
  count="$(git rev-list --count "${u_old}..${u_new}")"
  if [[ "$count" -eq 0 ]]; then
    pending='(none)'
  else
    pending="$(derive_type "$u_old" "$u_new")"
    pending="${pending%$'\n'}"
  fi
  printf 'sync base: %s\n' "$u_old"
  printf 'upstream commits since last sync: %s\n' "$count"
  printf 'pending sync type: %s\n' "$pending"
  print_newest_upstream_pi_subagents_tag
}

run_sync() {
  local u_old u_new count syn remaining
  check_sync_preconditions
  require_sync_pointer
  u_old="$(git rev-parse refs/sync/upstream-main)"
  u_new="$(git rev-parse upstream/main)"
  if ! git merge-base --is-ancestor "$u_old" "$u_new"; then
    refuse_sync "refs/sync/upstream-main (${u_old}) is not an ancestor of upstream/main (${u_new})"
  fi
  count="$(git rev-list --count "${u_old}..${u_new}")"
  if [[ "$count" -eq 0 ]]; then
    refuse_sync "already up to date with upstream/main"
  fi

  syn="$(git commit-tree "$(git rev-parse 'HEAD^{tree}')" -p "$u_old" -m "temp: synthetic squash-sync ancestor")"
  git switch -c "$SYNC_BRANCH" "$syn"
  write_state "$u_old" "$u_new"

  if ! GIT_MERGE_AUTOEDIT=no git merge "$u_new"; then
    run_recipes
    remaining="$(unmerged_paths || true)"
    if [[ -n "$remaining" ]]; then
      printf 'error: squash-sync conflicts remain on %s; see docs/upstream-sync.md\n' "$SYNC_BRANCH" >&2
      printf 'resolve remaining paths, git add them, then run ./scripts/upstream-sync.sh --continue\n' >&2
      printf '%s\n' "$remaining" >&2
      exit 1
    fi
  fi
  transplant_onto_main "$u_old" "$u_new"
}

run_continue() {
  local branch remaining
  branch="$(git branch --show-current)"
  [[ "$branch" == "$SYNC_BRANCH" ]] || die "current branch is ${branch}, not ${SYNC_BRANCH}"
  remaining="$(unmerged_paths || true)"
  if [[ -n "$remaining" ]]; then
    die "unmerged paths remain:
${remaining}"
  fi
  read_state
  transplant_onto_main "$U_OLD" "$U_NEW"
}

if [[ "$mode" == 'derive-type' ]]; then
  git rev-parse --verify --quiet "${derive_old}^{commit}" >/dev/null \
    || die "not a commit: ${derive_old}"
  git rev-parse --verify --quiet "${derive_new}^{commit}" >/dev/null \
    || die "not a commit: ${derive_new}"
  derive_type "$derive_old" "$derive_new"
  exit 0
fi

if [[ "$mode" == 'continue' ]]; then
  run_continue
  exit 0
fi

fetch_upstream
print_sync_status

if [[ "$mode" == 'status' ]]; then
  exit 0
fi

run_sync
