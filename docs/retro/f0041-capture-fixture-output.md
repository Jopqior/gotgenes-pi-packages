---
issue: 41
issue_title: "test(repo): capture subprocess output explicitly in test fixtures"
---

# Retro: #41 — test(repo): capture subprocess output explicitly in test fixtures

## Stage: Planning (2026-10-10T23:58:53+08:00)

### Session summary

Committed the repository-scoped plan as `27df01f47c03534324eac40436e4b94311380093` after the required fast-forward-only pull reported the checkout current.
Reproduced fixture stderr leakage through existing tests and actual helper calls, checked retained/replacement call sites against fork issue #40, and completed a fresh-context Tidy First assessment.
No implementation, synchronization integration, push or publication began.

### Observations

- The operator selected existing suites plus disposable focused output verification and explicitly declined new regression tests.
  The plan therefore uses output-check red/green cycles without adding persistent tests or a fixture framework.
- The current target is ten uncaptured `execFileSync` calls across four files: six release-helper calls, one retained Git-path lookup, two tar calls and one provider branch query.
  Existing explicit capture, default-pipe `spawnSync` and generated-wrapper `stdio: "inherit"` remain unchanged.
- The real version suite passed while printing branch-switching and git-cliff messages.
  A disposable outer process imported the real release helper; a child-only builtin-options control suppressed leakage while preserving the complete serialized return/error data byte-for-byte.
  Native Git failure status and streams, existing contextual Bash error messages, and both script runners' forwarded results were inspected; the control is planning evidence, not proof of the future implementation.
- Disposable noisy-success shims delegated to actual tools and produced measured runner-log marker counts of 17 for tar, 1 for `which`, and 1 for the branch query while the existing suites remained green.
  These are synthetic diagnostic injections through real test paths, not naturally occurring tar or `which` warnings.
- Measured baseline suites passed: root scripts had 43 files / 995 tests, and worktrees had 8 files / 74 tests.
  The plan passed `rumdl` and commit hooks; implementation must regenerate focused evidence rather than depend on temporary probe files.
- Fork issue #40 remains a separate planned change, not a prerequisite.
  Follow retained/moved helpers if it lands first, inspect replacement subprocess calls and leave doomed policy fixtures untouched.
  Its plan was not edited.
- No prior fork `f0041-` retro existed.
  The fallback unprefixed `packages/pi-permission-system/docs/retro/0041-extract-permission-gate.md` describes an unrelated inherited upstream issue, so it was read but not reused as fork continuity.
- The package scope check found no published-contract change or roadmap batch for this repository-level test cleanup.
  No concrete follow-up issue was identified.

#### Deferred tidyings

The assessor rejected process wrappers, shared options, fixture migrations, permanent regression scaffolding and cleanup of fixtures fork issue #40 will delete.
Existing option objects already support the change directly; no preparatory commit is warranted.
