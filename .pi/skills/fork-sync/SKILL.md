---
name: fork-sync
description: |
  Fork sync: load before planning, performing, resuming, reviewing or shipping a pinned upstream integration,
  or inspecting or preparing fork release-source evidence, including a first fork release.
---

# Fork sync

This skill owns upstream integration constraints and fork release-source evidence.
Use the [standard issue lifecycle](../../../AGENTS.md#working-an-issue); synchronization adds exceptions, not a second workflow.
Ordinary release dispatch, retry coordination, packaging and original-package first publication remain in [releasing](../releasing/SKILL.md).
Run commands from the repository root.

## Load the task branch

Read each applicable reference in full before its affected work.
A synchronization can reach both integration and source-evidence branches; loading one does not satisfy the other.

| Task                                                                                    | Required reference and timing                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Find or create a pinned-target issue                                                    | Use the no-argument [fork-sync prompt](../../prompts/fork-sync.md), link this skill in the issue and stop; do not start integration                                      |
| Plan, perform, resume, review or ship actual synchronization                            | Read [synchronization](references/synchronization.md) before relevant Git operations, including startup fetch/pull; its prerequisites override template startup ordering |
| Inspect integration source feasibility or prepare/validate fork release-source evidence | Read [release source](references/release-source.md) before evidence work                                                                                                 |
| Prepare a fork package's first publication                                              | Read [release source](references/release-source.md) and [first release](references/first-release.md) before preparing or publishing the first tagged artifacts           |

Editing synchronization tooling or documentation is not integration work; ordinary non-sync tasks keep their normal startup, review range and workflow.
When actual synchronization context becomes available, load its reference before subsequent relevant Git operations.
The prompt `/fork-sync` opens an issue; `/skill:fork-sync` loads instructions and does not execute synchronization or publication.

## Shared boundaries

- Keep fork operations targeted to `Jopqior/gotgenes-pi-packages`; upstream is `gotgenes/pi-packages`, not the fork issue tracker or publication destination.
- Preserve fork history and existing published npm artifacts, tagged CHANGELOGs and GitHub Releases.
  Fetch upstream without importing its tags into the fork tag namespace.
- Registration, integration approval and successful source checks are not publication authorization.
  Obtain separate operator approval of the fork's release destination and npm scope before dispatch or publication.
- Version calculation and source provenance are independent.
  Source display neither chooses the release level nor substitutes a different integration target.
