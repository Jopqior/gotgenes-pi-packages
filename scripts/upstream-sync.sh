#!/usr/bin/env bash
#
# Fetch gotgenes/pi-packages without importing tags, and optionally merge or
# record fork sync evidence.
#
# Usage:
#   scripts/upstream-sync.sh                                     # ensure remote, fetch --no-tags, print ahead/behind
#   scripts/upstream-sync.sh --merge [--expected-upstream <full OID>] # merge a freshly fetched, inspected target (no push)
#   scripts/upstream-sync.sh --record-fork-sync <merge> \
#       --fork-level <none|patch|minor|major> --rationale <text> # record reviewed sync evidence
#
# This script never pushes. Every mode configures safeguards and fetches.
# The default discovers upstream without merging; it is not read-only.
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
  printf 'Usage: %s [--upstream-protocol <ssh|https>] [--merge [--expected-upstream <full OID>] | --record-fork-sync <merge> [--fork-level <level>] [--rationale <text>]]\n' "$(basename "$0")" >&2
  printf '  (no flag)              ensure remote, fetch --no-tags, print ahead/behind\n' >&2
  printf '  --upstream-protocol <ssh|https>  choose transport for a missing upstream remote\n' >&2
  printf '  --merge                classify ancestry, then merge a fetched divergent commit (no push)\n' >&2
  printf '  --expected-upstream <full OID>  require this freshly fetched target with --merge\n' >&2
  printf '  --record-fork-sync <merge>\n' >&2
  printf '                        after a completed merge, append its reviewed fork sync\n' >&2
  printf '                        evidence to scripts/release/pi-subagents/sync-state.json\n' >&2
  printf '                        (--fork-level and --rationale supply the review)\n' >&2
  exit "${1:-1}"
}

merge=0
record_merge=""
fork_level=""
rationale=""
upstream_protocol=""
expected_upstream=""
while [ $# -gt 0 ]; do
  case "$1" in
    --upstream-protocol)
      [ $# -ge 2 ] && [ -z "$upstream_protocol" ] || usage 1
      case "$2" in ssh | https) ;; *) usage 1 ;; esac
      upstream_protocol=$2
      shift 2
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
      rationale=$2
      shift 2
      ;;
    -h | --help) usage 0 ;;
    *) usage 1 ;;
  esac
done

if [ "$merge" -eq 1 ] && [ -n "$record_merge" ]; then
  usage 1
fi
if [[ -z "$record_merge" && ( -n "$fork_level" || -n "$rationale" ) ]]; then
  usage 1
fi
if [[ -n "$expected_upstream" && "$merge" -eq 0 ]]; then
  usage 1
fi

repo_root="$(git rev-parse --show-toplevel)" || die "not inside a git repository"
cd "$repo_root"
if [[ -n "$expected_upstream" ]]; then
  local_head="$(git rev-parse --verify --quiet 'HEAD^{commit}')" \
    || die "cannot validate expected upstream OID without a HEAD commit"
  [[ "${#expected_upstream}" -eq "${#local_head}" ]] || usage 1
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
  printf 'run ./scripts/upstream-sync.sh to fetch and print ahead/behind without merging\n' >&2
  exit 1
}

check_merge_preconditions() {
  local branch origin_url git_dir
  branch="$(git branch --show-current)"
  [[ "$branch" == "main" ]] || refuse_merge "current branch is ${branch}, not main"

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

print_newest_upstream_pi_subagents_tag() {
  local listing newest peeled
  listing="$(git ls-remote --tags upstream 'pi-subagents-v*')"
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
fetch_status=0
git fetch --no-tags upstream +refs/heads/main:refs/remotes/upstream/main || fetch_status=$?
git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/tags >"$tags_after"

if ! cmp -s "$tags_before" "$tags_after"; then
  printf 'error: local tag ref/object mapping changed during fetch:\n' >&2
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
  exit 1
fi
[[ "$fetch_status" -eq 0 ]] || die "upstream fetch failed; inspect Git output and tag refs before retrying"
printf 'tag count unchanged (%s)\n' "$(wc -l <"$tags_after" | tr -d ' ')"

git rev-parse --verify --quiet upstream/main >/dev/null \
  || die "upstream/main missing after fetch"

read -r ahead behind <<<"$(git rev-list --left-right --count HEAD...upstream/main)"
printf 'ahead/behind (HEAD...upstream/main): %s/%s\n' "$ahead" "$behind"
print_newest_upstream_pi_subagents_tag

if [[ "$merge" -eq 0 && -z "$record_merge" ]]; then
  exit 0
fi

if [[ "$merge" -eq 1 ]]; then
  target="$(git rev-parse --verify --quiet 'upstream/main^{commit}')" \
    || die "cannot resolve fetched upstream/main to a commit"
  if [[ -n "$expected_upstream" && "$target" != "$expected_upstream" ]]; then
    refuse_merge "expected upstream ${expected_upstream} but fetched ${target}; inspect the new input and reopen affected approvals"
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
      printf 'error: merge conflicts remain; resume /upstream-sync using .pi/prompts/upstream-sync.md\n' >&2
      printf 'after resolving and git merge --continue, record the sync evidence:\n' >&2
      printf '  %s --record-fork-sync <merge> --fork-level <none|patch|minor|major> --rationale <text>\n' "$0" >&2
    else
      printf 'error: merge failed without unmerged entries; inspect Git output and state before recovery\n' >&2
    fi
    exit 1
  fi
  read -r first_parent second_parent extra_parents <<<"$(git show -s --format=%P HEAD)"
  [[ "$first_parent" == "$fork_head" && "$second_parent" == "$target" && -z "$extra_parents" ]] \
    || die "merge result does not have the expected two-parent topology; inspect HEAD before recording"
  printf 'merge complete; record its reviewed fork sync evidence before the next release:\n'
  printf '  %s --record-fork-sync %s --fork-level <none|patch|minor|major> --rationale <text>\n' "$0" "$(git rev-parse HEAD)"
  exit 0
fi

# Recording mode: the same fetch and safeguards ran above; the merge must
# already be completed and reviewed. The recorder is resolved next to this
# script so a scratch checkout cannot shadow the real implementation, while
# the state file lands in this repository.
record_args=(--repo "$repo_root" --merge "$record_merge")
if [ -n "$fork_level" ]; then
  record_args+=(--fork-level "$fork_level")
fi
if [ -n "$rationale" ]; then
  record_args+=(--rationale "$rationale")
fi
script_dir="$(cd "$(dirname "$0")" && pwd)"
exec node "$script_dir/release/record-fork-sync.mjs" "${record_args[@]}"
