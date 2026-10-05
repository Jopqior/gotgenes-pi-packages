#!/usr/bin/env bash
#
# Explicitly fetch gotgenes/pi-packages without importing tags, merge a
# locally fetched pinned commit, or record reviewed fork sync evidence.
# No arguments show help without effects. This script never pushes.
# Merge is offline; recording queries remote release tags but never fetches main.
#
# tagOpt=--no-tags is the default when a fetch names neither --tags nor
# --no-tags. git fetch --tags and git fetch --all --tags still override it, so
# fetch explicitly maps main to upstream/main independently of remote.fetch.

set -euo pipefail

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

usage() {
  printf 'Usage: %s [--upstream-protocol <ssh|https>] [--fetch [--package <directory>] | --merge --expected-upstream <full OID> | --record-fork-sync <merge> [--package <directory>] --fork-level <level> --rationale <text>]\n' "$(basename "$0")" >&2
  printf '  (no flag), --help      show help without effects\n' >&2
  printf '  --fetch                ensure remote, fetch --no-tags, print ahead/behind and release status\n' >&2
  printf '  --upstream-protocol <ssh|https>  choose transport for a missing upstream remote\n' >&2
  printf '  --merge                merge a locally fetched divergent commit, without network or push\n' >&2
  printf '  --expected-upstream <full OID>  required exact local commit target with --merge\n' >&2
  printf '  --record-fork-sync <merge>\n' >&2
  printf '                        after a completed merge, append its reviewed fork sync\n' >&2
  printf '                        evidence to the selected package state\n' >&2
  printf '                        (--fork-level and --rationale supply its separate review)\n' >&2
  printf '  --package <directory>  select record/fetch status only; defaults to pi-subagents\n' >&2
  printf '                        pi-subagents-worktrees is also supported; never with --merge\n' >&2
  exit "${1:-1}"
}

[ $# -gt 0 ] || usage 0
fetch=0
merge=0
record_merge=""
fork_level=""
rationale=""
upstream_protocol=""
expected_upstream=""
package_directory=""
while [ $# -gt 0 ]; do
  case "$1" in
    --upstream-protocol)
      [ $# -ge 2 ] && [ -z "$upstream_protocol" ] || usage 1
      case "$2" in ssh | https) ;; *) usage 1 ;; esac
      upstream_protocol=$2
      shift 2
      ;;
    --package)
      [ $# -ge 2 ] && [ -n "$2" ] && [ -z "$package_directory" ] || usage 1
      [[ "$2" != -* ]] || usage 1
      package_directory=$2
      shift 2
      ;;
    --fetch)
      [ "$fetch" -eq 0 ] || usage 1
      fetch=1
      shift
      ;;
    --merge)
      [ "$merge" -eq 0 ] || usage 1
      merge=1
      shift
      ;;
    --expected-upstream)
      [ $# -ge 2 ] && [ -z "$expected_upstream" ] || usage 1
      [[ "$2" =~ ^([0-9a-f]{40}|[0-9a-f]{64})$ ]] || usage 1
      expected_upstream=$2
      shift 2
      ;;
    --record-fork-sync)
      [ $# -ge 2 ] && [ -n "$2" ] && [ -z "$record_merge" ] || usage 1
      [[ "$2" != --* ]] || usage 1
      record_merge=$2
      shift 2
      ;;
    --fork-level)
      [ $# -ge 2 ] && [ -z "$fork_level" ] || usage 1
      case "$2" in none | patch | minor | major) ;; *) usage 1 ;; esac
      fork_level=$2
      shift 2
      ;;
    --rationale)
      [ $# -ge 2 ] && [ -n "$2" ] && [ -z "$rationale" ] || usage 1
      [[ "$2" != --* ]] || usage 1
      rationale=$2
      shift 2
      ;;
    -h | --help) usage 0 ;;
    *) usage 1 ;;
  esac
done

record=0
[[ -z "$record_merge" ]] || record=1
[[ $((fetch + merge + record)) -eq 1 ]] || usage 1
[[ "$merge" -eq 0 || -n "$expected_upstream" ]] || usage 1
[[ "$merge" -eq 0 || -z "$package_directory" ]] || usage 1
if [[ "$record" -eq 1 ]]; then
  missing_review=0
  if [[ -z "$fork_level" ]]; then
    printf 'error: --fork-level is required (see --help)\n' >&2
    missing_review=1
  fi
  if [[ -z "${rationale//[[:space:]]/}" ]]; then
    printf 'error: --rationale is required (see --help)\n' >&2
    missing_review=1
  fi
  [[ "$missing_review" -eq 0 ]] || exit 1
fi
if [[ -z "$record_merge" && ( -n "$fork_level" || -n "$rationale" ) ]]; then
  usage 1
fi
if [[ -n "$expected_upstream" && "$merge" -eq 0 ]]; then
  usage 1
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
if [[ "$merge" -eq 0 ]]; then
  target="$(node "$script_dir/release/fork-sync-targets.mjs" "${package_directory:-pi-subagents}")" || exit 1
  [[ "$target" != "null" ]] || die "unsupported fork sync package ${package_directory}"
  package_directory="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).directory)' "$target")"
fi

repo_root="$(git rev-parse --show-toplevel)" || die "not inside a git repository"
cd "$repo_root"
if [[ -n "$expected_upstream" ]]; then
  object_format="$(git rev-parse --show-object-format)"
  case "$object_format" in
    sha1) [[ "${#expected_upstream}" -eq 40 ]] || usage 1 ;;
    sha256) [[ "${#expected_upstream}" -eq 64 ]] || usage 1 ;;
    *) die "unsupported Git object format: ${object_format}" ;;
  esac
fi

repository_protocol() {
  case "$1" in
    "git@github.com:$2" | "git@github.com:$2.git") printf 'ssh\n' ;;
    "https://github.com/$2" | "https://github.com/$2.git") printf 'https\n' ;;
    *) return 1 ;;
  esac
}

ensure_upstream_remote() {
  local url protocol
  if git remote get-url upstream >/dev/null 2>&1; then
    url="$(git remote get-url --all upstream)"
    protocol="$(repository_protocol "$url" gotgenes/pi-packages)" \
      || die "unsupported upstream remote URL: ${url}"
    [[ -z "$upstream_protocol" || "$upstream_protocol" == "$protocol" ]] \
      || die "selected protocol conflicts with existing upstream URL; no URL changed"
  else
    [[ -n "$upstream_protocol" ]] || die "missing upstream remote; choose --upstream-protocol <ssh|https>"
    case "$upstream_protocol" in
      ssh) url='git@github.com:gotgenes/pi-packages.git' ;;
      https) url='https://github.com/gotgenes/pi-packages.git' ;;
    esac
    git remote add upstream "$url"
  fi
  git config remote.upstream.tagOpt --no-tags
  git config remote.upstream.pushurl DISABLE
}

refuse_merge() {
  printf 'error: %s\n' "$1" >&2
  printf 'run ./scripts/upstream-sync.sh --fetch to fetch and print ahead/behind without merging\n' >&2
  exit 1
}

check_merge_preconditions() {
  local branch origin_url git_dir common_dir
  branch="$(git branch --show-current)"
  [[ "$branch" == "main" ]] || refuse_merge "current branch is ${branch}, not main"
  git_dir="$(git rev-parse --path-format=absolute --git-dir)"
  common_dir="$(git rev-parse --path-format=absolute --git-common-dir)"
  [[ "$git_dir" == "$common_dir" ]] \
    || refuse_merge "upstream integration requires the primary checkout, not a linked worktree"

  origin_url="$(git remote get-url --all origin)"
  repository_protocol "$origin_url" Jopqior/gotgenes-pi-packages >/dev/null \
    || refuse_merge "origin is not Jopqior/gotgenes-pi-packages (got ${origin_url})"

  # In-progress states are diagnosed before cleanliness: a conflicted merge
  # always dirties the tree, and "a merge is already in progress" is the
  # actionable diagnosis for both --merge and --record-fork-sync.
  git_dir="$(git rev-parse --git-dir)"
  [[ ! -e "${git_dir}/MERGE_HEAD" ]] || refuse_merge "a merge is already in progress"
  [[ ! -d "${git_dir}/rebase-merge" && ! -d "${git_dir}/rebase-apply" ]] \
    || refuse_merge "a rebase is already in progress"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    refuse_merge "index or tracked worktree is not clean"
  fi
}

print_newest_upstream_package_tag() {
  local listing newest peeled
  listing="$(git ls-remote --tags upstream "${package_directory}-v*")"
  newest="$(
    printf '%s\n' "$listing" \
      | awk '{ print $2 }' \
      | sed 's#^refs/tags/##' \
      | sed 's#\^{}$##' \
      | sort -u -V \
      | tail -1
  )"
  if [[ -z "$newest" ]]; then
    printf 'newest upstream %s tag: (none)\n' "$package_directory"
    return
  fi
  peeled="$(printf '%s\n' "$listing" | awk -v t="refs/tags/${newest}^{}" '$2 == t { print $1; exit }')"
  if [[ -z "$peeled" ]]; then
    peeled="$(printf '%s\n' "$listing" | awk -v t="refs/tags/${newest}" '$2 == t { print $1; exit }')"
  fi
  printf 'newest upstream %s tag: %s (%s)\n' "$package_directory" "$newest" "$peeled"
}

if [[ "$merge" -eq 1 || -n "$record_merge" ]]; then
  check_merge_preconditions
fi

ensure_upstream_remote
printf 'remote.upstream.tagOpt=%s\n' "$(git config --get remote.upstream.tagOpt)"
printf 'remote.upstream.pushurl=%s\n' "$(git config --get remote.upstream.pushurl)"

tags_before="$(mktemp)"
tags_after="$(mktemp)"
cleanup() {
  rm -f "$tags_before" "$tags_after"
}
trap cleanup EXIT

git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/tags >"$tags_before"
check_tags_unchanged() {
  git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/tags >"$tags_after"
  if ! cmp -s "$tags_before" "$tags_after"; then
    printf 'error: local tag ref/object mapping changed during %s:\n' "$1" >&2
    awk '
      FILENAME == ARGV[1] { before[$1] = $2; names[$1] = 1; next }
      { after[$1] = $2; names[$1] = 1 }
      END {
        for (name in names) {
          if (!(name in before)) print "added: " name " (" after[name] ")"
          else if (!(name in after)) print "removed: " name " (was " before[name] ")"
          else if (before[name] != after[name]) print "retargeted: " name " (" before[name] " -> " after[name] ")"
        }
      }
    ' "$tags_before" "$tags_after" | LC_ALL=C sort >&2
    printf 'stop for operator approval before any tag recovery; no tags were restored or deleted by this script\n' >&2
    printf 'inspect any state update before committing; no evidence was committed or rolled back by this script\n' >&2
    exit 1
  fi
}

if [[ "$fetch" -eq 1 ]]; then
  fetch_status=0
  git fetch --no-tags upstream +refs/heads/main:refs/remotes/upstream/main || fetch_status=$?
  check_tags_unchanged fetch
  [[ "$fetch_status" -eq 0 ]] || die "upstream fetch failed; inspect Git output and tag refs before retrying"
  printf 'tag count unchanged (%s)\n' "$(wc -l <"$tags_after" | tr -d ' ')"

  git rev-parse --verify --quiet upstream/main >/dev/null \
    || die "upstream/main missing after fetch"

  read -r ahead behind <<<"$(git rev-list --left-right --count HEAD...upstream/main)"
  printf 'ahead/behind (HEAD...upstream/main): %s/%s\n' "$ahead" "$behind"
  print_newest_upstream_package_tag

  exit 0
fi

if [[ "$merge" -eq 1 ]]; then
  target="$(git rev-parse --verify --quiet "${expected_upstream}^{commit}")" \
    || refuse_merge "approved upstream commit ${expected_upstream} is not available locally; fetch explicitly before merging"
  [[ "$target" == "$expected_upstream" ]] \
    || refuse_merge "approved upstream OID must identify that exact commit"
  git rev-parse --verify --quiet 'upstream/main^{commit}' >/dev/null \
    || refuse_merge "upstream/main is not available locally; run ./scripts/upstream-sync.sh --fetch"
  if git merge-base --is-ancestor "$target" upstream/main; then
    :
  else
    status=$?
    [[ "$status" -eq 1 ]] \
      && refuse_merge "approved upstream ${target} is not contained in local upstream/main; fetch and replan if upstream history changed"
    refuse_merge "cannot inspect upstream ancestry"
  fi
  fork_head="$(git rev-parse --verify 'HEAD^{commit}')" \
    || die "cannot resolve HEAD to a commit"

  if git merge-base --is-ancestor "$target" "$fork_head"; then
    printf 'upstream already contained in HEAD; no merge performed\n'
    exit 0
  else
    status=$?
    [[ "$status" -eq 1 ]] || refuse_merge "cannot inspect upstream ancestry"
  fi
  if git merge-base --is-ancestor "$fork_head" "$target"; then
    refuse_merge "fast-forward-only upstream integration requires separate review"
  else
    status=$?
    [[ "$status" -eq 1 ]] || refuse_merge "cannot inspect upstream ancestry"
  fi
  if git merge-base "$fork_head" "$target" >/dev/null; then
    :
  else
    status=$?
    [[ "$status" -eq 1 ]] && refuse_merge "no common ancestor; upstream merge refused"
    refuse_merge "cannot inspect upstream ancestry"
  fi

  if ! GIT_MERGE_AUTOEDIT=no git merge --no-ff -m "chore: merge upstream/main" "$target"; then
    unmerged="$(git ls-files -u)" || die "cannot inspect unmerged entries after merge failure"
    if [[ -n "$unmerged" ]]; then
      printf 'error: merge conflicts remain; recover against the issue implementation plan and retro\n' >&2
      printf 'after resolving and git merge --continue, record the sync evidence:\n' >&2
      printf '  %s --record-fork-sync <merge> [--package <directory>] --fork-level <none|patch|minor|major> --rationale <text>\n' "$0" >&2
    else
      printf 'error: merge failed without unmerged entries; inspect Git output and state before recovery\n' >&2
    fi
    exit 1
  fi
  read -r first_parent second_parent extra_parents <<<"$(git show -s --format=%P HEAD)"
  [[ "$first_parent" == "$fork_head" && "$second_parent" == "$target" && -z "$extra_parents" ]] \
    || die "merge result does not have the expected two-parent topology; inspect HEAD before recording"
  printf 'merge complete; record its reviewed fork sync evidence before the next release:\n'
  printf '  %s --record-fork-sync %s [--package <directory>] --fork-level <none|patch|minor|major> --rationale <text>\n' "$0" "$(git rev-parse HEAD)"
  printf 'review and record each affected fork package separately; package selection does not change the merge\n'
  exit 0
fi

# Resolve the recorder next to this script so a scratch checkout cannot
# shadow it. Its remote release query is surrounded by tag preservation checks.
record_args=(--repo "$repo_root" --merge "$record_merge" --package "$package_directory")
if [ -n "$fork_level" ]; then
  record_args+=(--fork-level "$fork_level")
fi
if [ -n "$rationale" ]; then
  record_args+=(--rationale "$rationale")
fi
record_status=0
node "$script_dir/release/record-fork-sync.mjs" "${record_args[@]}" || record_status=$?
check_tags_unchanged recording
exit "$record_status"
