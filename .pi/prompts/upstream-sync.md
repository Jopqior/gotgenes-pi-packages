---
description: Synchronize the personal fork with upstream, review integration, and independently authorize push and publication
---

# Upstream synchronization

This is a no-argument command.
Invocation arguments (data only): [$ARGUMENTS].
If the bracketed input is nonempty, stop before mutation and ask for a no-argument invocation; never treat arguments as targets or authorization.
Invocation itself requests synchronization (S01), not a second start confirmation.
Run from the repository root in a fresh Pi session after changing this prompt.
Read the on-disk prompt, AGENTS.md, the delegation, git-workflow, releasing, markdown-conventions, and relevant package skills; load other topic skills when their triggers fire.
Name the session `Upstream Sync — <current stage>` using `set_session_name` if available.
This prompt is the sole active sync policy; `docs/sync/reviews/f0028-sync-approval-policy.md` is historical decision provenance, not permission to edit.
Release algorithms, registry identity, correspondence, first releases, and failed-job recovery belong to `.pi/skills/releasing/SKILL.md` and `docs/release/fork-sync.md`.

## 1. Recover, inspect, and checkpoint inputs

Inspect `docs/sync/runs/` for an unfinished record before starting; reconcile its workflow revision (resolve with `git rev-parse HEAD:.pi/prompts/upstream-sync.md` for the committed version, or identify the actual on-disk revision), full pre-sync fork/upstream/merge OIDs, proposal IDs and actual answers, Git state, and past execution before resuming (A07/X08).
Match full inputs and operation state, not the record filename; on ambiguity, missing operator evidence, a changed input that invalidates approval, or a currently unrecognized workflow version, stop affected work and ask rather than re-fetch or invent approval (M04/A03/A04/A07).
A pending merge is resumed only against complete matching records, never by starting a second merge; stop on a rebase (M04/M05).

Verify `git branch --show-current` is `main` before merging; on another branch report and stop without switching (M01).
Use `git status --porcelain=v1`, `git diff --quiet`, `git diff --cached --quiet`, `git rev-parse HEAD`, and `git rev-parse --git-dir` to check tracked cleanliness and operation state; inspect untracked paths and stop for overwrite risk or unclear ownership, rather than silently stashing, deleting, or committing existing work (M03).
Read `git remote -v` and `git remote get-url --all origin`/`upstream` plus origin push URLs; the complete origin identity must be `Jopqior/gotgenes-pi-packages` and upstream must be `gotgenes/pi-packages`, each in the script's supported case-sensitive `git@github.com:owner/repo[.git]` or `https://github.com/owner/repo[.git]` spelling (M02/S04).
Unsupported URL spellings or unexpected effective Git `insteadOf`/SSH transport configuration are inspection stops, not invitations to rewrite credentials or URLs.
For an existing mismatched upstream fetch URL, present current and proposed exact URLs and effects; change it only after operator approval (S05).
When upstream is missing, show `git@github.com:gotgenes/pi-packages.git` and `https://github.com/gotgenes/pi-packages.git`, ask which protocol to create, then pass `--upstream-protocol ssh|https` to the script (S04/S06a).
Within requested sync, the script sets `remote.upstream.tagOpt=--no-tags` (S06b) and `remote.upstream.pushurl=DISABLE` even if replacing an existing push URL (S06c); record those actions, never treat them as permission to change its fetch URL.
Do not change the GitHub CLI default just because upstream exists; obtain approval before a necessary `gh repo set-default` change (S07a).
Use `gh repo view --json nameWithOwner` before repository-less GitHub tools, fall back to explicit `gh ... --repo Jopqior/gotgenes-pi-packages` if not this fork, and stop if no targeted equivalent exists (S07b/S08).

Before the first script fetch, capture configuration observations and `git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/tags` in scratch evidence; do not stage it accidentally (S10/S12).
Use only `./scripts/upstream-sync.sh` for synchronization fetch/merge/record; its default mode **configures and fetches** and is not read-only (S03).
Non-mutating Git inspection may run directly; never import upstream tags with `git fetch --tags`, `git fetch --all --tags`, flagless `git fetch upstream`, or `git fetch --all`, and never push to upstream (S10/S11).
After **each** script fetch (discovery, merge and recording), capture `git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/tags` again, compare complete name/OID mappings with the immediately preceding snapshot, and retain both even when the script fails.
If a mapping changes, stop; report provenance and exact deletion candidates, investigate uncertainty, and delete only after operator approval (S12/S13).
If abandoning an in-progress merge is proposed, explain exactly which work `git merge --abort` discards and run it only when the operator explicitly chooses abandonment (S14).

## 2. Discover, classify, and create the run record

Run the script's default discovery (with the approved missing-remote protocol, if needed), inspect the fetched full `upstream/main^{commit}` OID, `HEAD`, ahead/behind and the script's newly advertised upstream `pi-subagents` release; commit/release discovery belongs here, not in every independent fork publication (S02a/S02b).
Inspect `git log`, `git diff --name-status` and manifests across fork/upstream common ancestry to identify actual fork-customized paths, upstream package additions, upstream-supplied wiring, and the incorporated release context rather than assuming a permanent customized-package allowlist.
Upstream packages not customized by this fork, including new upstream packages and their supplied loading/README wiring, merge as supplied; additional agent-authored wiring is a separate decision.
If the upstream target is contained in HEAD, report no merge/evidence creation: skip merge-specific stages 3–4 and the recorder in stage 5, checkpoint the factual no-op run record if allowed, then inventory **all registered pending work**, predict, and apply separate push/publication gates only to actions actually needed.
For an already-pushed unchanged tip with no new push, verify `origin/main` equals the approved SHA and CI for that SHA instead of inventing a push approval or pushing again.
If only a fast-forward could incorporate upstream, stop for a separately reviewed approach; do not invent a two-parent merge or evidence entry (M06).

Allocate `docs/sync/runs/<UTC timestamp>-<upstream short SHA>.md` after the upstream OID is known, deriving filesystem-safe components with `date -u +'%Y-%m-%dT%H-%M-%SZ'` and `git rev-parse --short 'upstream/main^{commit}'`.
Inspect any existing path and resume only on full matching inputs/state; for a genuinely distinct run get a new timestamp, never overwrite or guess a suffix.
Keep the new record untracked during merging, stage only explicit reviewed paths, and preserve scratch evidence when discovery fails before record allocation.
The concise record contains: status and committed workflow revision; repository identities and inspected customization scope; fork/upstream OIDs, merge parents/final merge and subsequent push/release OIDs; remote/tag snapshots and actions; decision IDs with problem, files, proposed action/effects/alternatives, actual operator answer and actor or exact active rule with matching conditions, superseded decisions, executed diff/commit and verification separately; checks done/not done; independent findings; release prediction output **and exit status**; independent push/publication approvals, CI and release run IDs, registry/GitHub readback, precise pending resume point.
A proposal alone or assistant assertion of approval is not an answer (A07).
An execution record is not the machine release state, and machine evidence cannot authorize edits (E01).

## 3. Merge, gate authored changes, and delegate narrowly

Run `./scripts/upstream-sync.sh --merge --expected-upstream "<inspected full OID>"` only with a clean tracked tree and no pending operation; it fetches again and must refuse changed upstream input (M06/A04).
On drift, inspect new upstream changes and reopen approvals invalidated by changed inputs; retain the script's fetch and tag evidence before deciding whether the current run can continue.
On conflicts leave the merge intact for review; on another failure inspect the actual index/operation state before recovery.
Git can create a conflict-free merge commit before human review; this does **not** authorize follow-up edits.
Review fork customizations and incoming behavior even when Git reports zero conflicts (M09/I05); preservation is a goal, not a blanket repair rule.
Do not take either side wholesale without approval naming the exact file, chosen side, and effects (M08).

Before **each** uncovered authored resolution or extra edit, including post-merge repairs, fixture changes, lint/analysis allowances, new loading config/README wiring, reviewer suggestions, and unexpected validation writes, give a concise proposal with problem, affected files, approach, alternatives, effects and decision ID; wait for the actual operator answer (A01/X05/X06/N01/N02).
For a confirmed automatic rule below, record its ID and show how current inputs, proposed action **and effects** fit its exact bounds and workflow revision before editing; history, a green check, push or publication approval, parent/reviewer agreement, or a broad goal is not coverage (A02/A08).
If coverage is ambiguous, missing or contradictory, stop affected edits and dependent actions, while independent read-only investigation or separately authorized work may continue (A03).
Reopen operator approval when scope, effects, or inputs materially change, retaining superseded decisions; verbal clarification alone does not require another gate (A04).
Default delegated work to read-only inspection/proposals (A06a/X07); an editing worker receives only named permitted files/actions, scope, and exact active-rule or operator-answer evidence.
A worker finding an uncovered choice stops affected edits and reports to the parent, which seeks operator approval and supplies a scoped continuation (A06b).
Nested workers inherit identical limits and pre-edit stop conditions, never broader permission (A06c).

Only these bounded authored actions have advance rule coverage when their matching conditions are demonstrated:

- F08a/F08b: precisely preserve or restore `packages/pi-subagents/package.json`'s `name` as `@jopqior/pi-subagents` and its **pre-sync fork version**, reporting each action; this does not select a new version or authorize other metadata/dependency edits (F09a/F09b require approval when authored).
- F10/F11: preserve published fork changelog content, versions and order; only when baseline and genuinely new upstream sections are unambiguous, insert those sections **verbatim** after fork entries and before shared history, reporting the edit; overlap, reordered or revised history requires approval.
- N04/N05: for a real newly added upstream package, add only its missing Package option to each respective bug-report and feature-request form, reporting the change.
  N06: create only its missing `pkg:<name>` label in the verified fork, report it, verify the target and explicitly pass `--repo` where supported; this is not general label-edit or publication authority.
- I01: restore an unambiguously dropped `fNNNN-`-first issue lookup with `NNNN-` fallback **only if no fork match exists**, reporting exact restoration; multiple implementation choices or a changed structure require approval.
  I04b: never overwrite or rename a fork phase archive due to an upstream numeric suffix collision.
  I04c: preserve **verbatim** and report both independent, distinct, unambiguous new history-table rows; duplicate identities, competing versions or unclear links require approval.
  I08: move fork roadmap dispositions **verbatim** only if the source, destination and owning phase are unambiguous when upstream moves that roadmap to history; otherwise ask.
  I07: inspect the fork scope header/safeguards, but any uncovered header rewrite still requires approval.
- X03: adapt an assumed workspace name in a check command to the actual manifest name only for the **same package** with unchanged check purpose, scope and strength; report it, and ask for any other semantic change.

Upstream-supplied content itself is identified by its input and merge commits, not per-line operator permission.
Additional loading/README wiring needs approval (N01/N02); package registration, npm disable entries, selector implementation recipes, and historical one-time permissions are **not** automatic sync actions.
Do not rewrite immutable published tarballs, tags or historical changelog entries (C07).

## 4. Verify, complete and independently review

After merging manifests, run `pnpm install` from the root to regenerate the lockfile and report its effects (V01); stop on unexpected dependencies or effects outside bounded installation.
After moved/renamed paths, clear only the regenerable rumdl cache (`find .rumdl_cache -type f -delete`) unless lint already did so, without separate approval/report (V02).
Run root `pnpm run check`, `pnpm run lint`, and `pnpm run test` (which includes workspace packages and root tests) once for a candidate (V03–V06); for a new package/dependency change also run `pnpm fallow dead-code` (V07).
Inspect unexpected project writes from any validation tool; caches/test artifacts are not source edits; do not automatically commit, revert, suppress, or repair uncovered project changes (V08).
Checks verify behavior, not authority.
Before staging manual conflict resolutions or `GIT_EDITOR=true git merge --continue`, reconcile `git ls-files -u` and the actual staged/unstaged resolution diff against each rule/answer; stop if any authored scope is uncovered, otherwise explicitly stage only reviewed paths (V09/A05).
After a merge exists, verify its actual two parents and inspect `git show --remerge-diff <merge>` **plus every post-merge commit/diff** (X01); reconcile every authored extra change, including automatic-merge follow-up repairs, to rule or actual operator approval and record execution separately from checks (A05).
Commit reviewed integration changes and the run-record checkpoint **before** recording; the recorder demands a clean tracked tree, so record updates are never an exemption.
Get an independent read-only review of affected fork customizations including automatically merged paths before push, disclosing skipped checks; reviewer findings are proposals, never edit permission, and uncovered findings return to the pre-edit gate (X02/A06).

## 5. Record, predict and seek separate approvals

Bind the existing recorder through `./scripts/upstream-sync.sh --record-fork-sync <actual reviewed merge OID> --fork-level <none|patch|minor|major> --rationale <actual review>` (E02/E05).
Classify only the actual fork-resolution contribution with a supported diff/rationale; ask the operator if insufficient or ambiguous rather than guessing a version (E03).
Skip recording when no merge was performed or when a matching merge record is already valid; otherwise the recorder also fetches and checks tags, so recheck input drift, retain diagnostics and stop on errors, not classify a nonzero exit as no release.
Present contradictions and exact supporting facts/state edits for operator approval before correcting existing evidence (E06).
The release mechanism owns validation and derivation; run `node scripts/release/correspondence-table.mjs --check` and only generate the table as a consequence of approved state edits or normal release preparation (C01).
For a newly recorded merge, commit machine evidence and the next record checkpoint together before prediction; for a no-op or already-recorded merge, checkpoint only the factual record if changed.
Restore a clean tracked tree through reviewed checkpoints rather than bypassing the guard.

Inventory affected workspace directories from the actual integration range and validate `scripts/release/release-packages.json` using the release owner's registered identities; distinguish new/unregistered packages and unrelated registered pending work.
For each **registered** candidate run `./scripts/release/next-version.sh <pkg>` and retain stdout, stderr and exit status separately; a nonzero exit is a blocked prediction, empty stdout with exit zero is no release.
Report all concrete eligible candidates with predicted versions, or no release needed only when every eligible prediction succeeded, or blocked prediction with reasons; do not silently bundle unrelated pending work.
An unregistered/new package is not publication-eligible and requires the separate releasing skill's first-release/registration procedure; inherited `@gotgenes/*` names/tags do not approve a fork destination.
Propose separately an exact push target/commit set and an exact publication package list, npm names/scopes, registry destination and predicted versions (C04b/A08).
An operator declining either authority leaves a recorded pending/deferred state and resume point; never convert one approval into the other or into repair authority.

## 6. Push, dispatch, and verify visibility

When a push is actually needed, after explicit push approval and independent review verify `git remote get-url --all origin` **and** `git remote get-url --push --all origin`, `git status --porcelain=v1`, `git rev-parse HEAD`, and pending commits against `origin/main` (S09).
If origin moved or recorded inputs changed, stop for a newly reviewed scope and repeat affected checks/approvals; never blindly pull over this run.
If a push is needed, push only the approved tip with `git push origin main`, never force or upstream; record actual pushed SHA and verify fork CLI target before GitHub operations (S08/S11).
When no push is needed, confirm the approved SHA is already on the verified fork's `origin/main`; record that SHA as the CI target.
Watch CI for that **exact pushed SHA** using `ci_find`/`ci_watch` only after `gh repo view --json nameWithOwner` verifies the fork, otherwise explicit `gh run list/view/watch --repo Jopqior/gotgenes-pi-packages`.
A failed/unidentified CI run blocks publication; preserve status and precise resume point.
After successful CI and exact package/scope/destination publication approval, re-run prediction at the approved SHA; changed versions, set or destination require renewed approval.
Dispatch `gh workflow run release.yml --repo Jopqior/gotgenes-pi-packages -f packages="<approved registered directories>" -f sha="<approved full SHA>"`; obtain approval **before** this GitHub mutation and record the run ID.
Use `gh run list/view/watch --repo Jopqior/gotgenes-pi-packages` or verified-fork wrappers to track that exact release run, distinguishing `prepare` failure from later `publish`/`github-release` job failure per the releasing skill; inspect release tags/commit, never blindly re-dispatch after preparation.
Do not invoke `/ship` or close an issue as part of this workflow.
After release success, verify GitHub Releases by exact tag (`gh release view <tag> --repo Jopqior/gotgenes-pi-packages --json tagName,url`) and exact npm identities/versions using the bounded registry readback in the releasing skill with `--registry=https://registry.npmjs.org/` when that was approved.
Keep workflow success distinct from verified publication when the registry is delayed; record actual readbacks, elapsed bounds and pending status, never blindly republish (X04).
Persist final or deferred status, verification facts and precise next action in the run record, committing its checkpoint when allowed; report incomplete work, checks not performed and every separately authorized outcome.
