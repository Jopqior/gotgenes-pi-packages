---
issue: 39
issue_title: "docs(upstream-sync): define a minimal information-acquisition contract"
---

# Retro: #39 — docs(upstream-sync): define a minimal information-acquisition contract

## Stage: Planning (2026-10-09T16:24:25Z)

### Session summary

Produced and committed the repository-scoped documentation plan after reading the issue, existing synchronization ownership, and relevant `#38` evidence.
Checked historical Git reading routes and the existing workflow-contract test baseline; no implementation, integration, push, or publication occurred.

### Observations

- The operator rejected changes to generic skills and agent definitions.
  The accepted route is guide → synchronization plan's explicit reviewer-handoff step → execution-time reviewer dispatch; the guide remains the sole contract owner.
- Preserve existing full coordinating/reviewer plan reads, applicable prior-stage retro reads, and complete triggered skills.
  Bound historical/task-specific material and step-worker execution detail instead, retaining all applicable shared decisions and acceptance requirements.
- Keep incoming and actual integration-change inventories separate and regenerable from durable Git inputs/commands.
  Temporary-file survival and dispatcher coverage claims cannot replace the independent reviewer's own inventory checks.
- The `#38` walkthrough found an empty selected remerge diff alongside a changed automatic-merge diff, reinforcing the need for separate reading routes.
  No token-saving measurement or renewed certification of `#38` behavior is claimed.
- `test/upstream-sync/workflow-contract.test.mjs` passed its planning baseline.
  Preserve its existing headings and section-local safety clauses; new prose semantics require walkthrough and independent judgment, not claims of runtime enforcement.
- Only `docs/upstream/synchronization-guide.md` is planned to change during implementation, alongside ordinary lifecycle notes.
  Use `/build-plan`; no Tidy-First assessment or concrete follow-up issue is required.
