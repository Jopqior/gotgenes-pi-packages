---
issue: 13
issue_title: "Fully undo #7 and restore merge-based upstream history"
---

# Retro: #13 — Fully undo #7 and restore merge-based upstream history

## Stage: Planning (2026-09-18T14:25:31Z)

### Session summary

Committed `docs/plans/f0013-restore-merge-history.md` as `3412da1e19b3cd50bc849bfc583e84ea3bf4406a`, covering complete-diff audit, original-history recovery, mapped release tags, real-merge integration tests, release-boundary verification, and an explicitly gated remote migration.
Verified recovery objects and published references without changing history or remote services; disposable git-cliff probes exercised merged ancestry and killing mutations.
The operator chose repository and GitHub Release repair followed by fresh npm releases of both `@jopqior` packages, accepting that old npm artifacts cannot be overwritten.

### Observations

- `git pull --ff-only` reported already up to date; planning began at `a76152015e4d6946e37ece9717888dcc1b008aa1` and was committed on `issue-13-restore-merge-history`.
  The pre-existing untracked `.pi/extensions/pi-permission-system/` directory was left untouched.
- Original merge `2d8cea699b08afa0f6a2c06eeb1507a52d699636` is available through the local recovery ref.
  All 39 paired first-parent trees match; the restoration base precedes the two dedicated abandoned planning commits, and 52 later commits existed before this planning session.
- Measured remote inventory: one branch, five tags, three mutable GitHub Releases with no attached assets, no advertised pull refs, and five npm versions.
  All five tags must migrate, not just `main`; exact replacement SHAs and remote updates remain unapproved until isolated rehearsal and fresh review.
- The operator asked whether retaining tag names constrains restoration and whether old commit links may break.
  The plan separates tag names from targets, preserves historical package trees at mapped tags, repairs editable current references in later documentation commits, and records immutable npm/provenance limitations.
  After reading npm's official unpublish policy, the operator selected new publication rather than trying to reuse old versions.
- The independent release fix from fork issue 11 stays.
  With git-cliff `2.14.1`, a merged old upstream breaking commit below the release tag stays excluded; a new fork fix bumps patch, and a newly merged upstream breaking commit bumps major.
  Dropping the bounded range reproduces a false major; the live baseline has two healthy published-package rows and eight expected untagged-package parity failures.
- Complete-diff audit found dependent material outside the sync script: prompt-template additions, the first-publish plan, display JSDoc, and the issue 10/11 plans and retros.
  Reject the audit agent's suggestion to retain the dedicated abandoned plan/retro: the issue explicitly requires their removal.
  Also reject the assessor's statement that the first-publish plan needs no correction; its current changelog sentence explicitly depends on aggregation.
- The initial `sonnet-5` dispatch failed because that model is unavailable; the audit was relaunched with a supported model request.
  The first Tidy-First agent was accidentally stopped before tool execution and was respawned at the operator's request.
  Extend `test/release/bumped-version.test.mjs` in place, so the assessor's conditional fixture extraction is unnecessary.
- A direct probe contradicted the assessor's claim about transport rewrites: `git remote get-url` expands `insteadOf` mappings.
  The plan therefore limits offline transport redirection to `fetch` and `ls-remote`, keeping real Git ancestry and conflict behavior under test.
- No implementation, history rewrite, remote mutation, or npm publication ran.
  The next stage is `/tdd-plan`, with isolated reconstruction and explicit pre-publication approval rather than ordinary `/ship` convergence.

#### Deferred tidyings

- `scripts/upstream-sync.sh` — do not refactor procedures that restoration deletes; no separate cleanup is warranted.
- `test/release/bumped-version.test.mjs` and `test/upstream-sync/merge.test.mjs` — avoid a generic cross-domain Git fixture; their transport and release-boundary arrangements differ.
- `packages/pi-subagents/src/ui/display.ts` — preserve formatter signature, body, consumers, and sole-implementation constraint; only obsolete mechanism-specific commentary is in scope.
