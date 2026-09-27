# Fork release tooling handoff to [#27]

Issue [#27] can remove `docs/upstream-sync.md` after migrating its sync procedure, conflict handbook, and sync log; the release material has moved and must remain independent of that file.

## Final release paths

- Shared decision, recorder, evidence, state, values, and git-cliff algorithms: `scripts/release/fork-sync/`.
- Root decision and recorder CLIs: `scripts/release/fork-sync.mjs` and `scripts/release/record-fork-sync.mjs`; the sync command uses `--record-fork-sync`.
- Sole registered fork target and committed evidence: `scripts/release/pi-subagents/config.mjs` and `scripts/release/pi-subagents/sync-state.json` (schema version 2, `forkContribution`); the package registry at `scripts/release/release-packages.json` uses schema version 2 and the `fork-sync` evidence route.
- Current release guide and generated correspondence: `docs/release/fork-sync.md` and `docs/release/pi-subagents-correspondence.md`.
  `scripts/release/correspondence-table.mjs --check` validates the latter without reading the handbook; preparation writes it under the same path.
- Historical preview files use backfill review schema version 2 and require a new preview and approval, not translation of an earlier approval.

## Remaining handbook deletion consumers

- Update `AGENTS.md`, `README.md`, `docs/release/fork-sync.md`, `.pi/skills/package-pi-subagents/SKILL.md`, `packages/pi-subagents/README.md`, and `packages/pi-subagents/docs/architecture/architecture.md` where they direct readers to `docs/upstream-sync.md`.
  The package README's release-table link already points at `docs/release/pi-subagents-correspondence.md`; retain its separate sync-procedure link until [#27] supplies a replacement.
- Replace the conflict diagnostic link in `scripts/upstream-sync.sh` together with its exact assertion in `test/upstream-sync/merge.test.mjs`.
  `test/release/fork-sync-values.test.mjs` uses the old handbook path only as an out-of-package scope control; choose another root path if its name becomes misleading.
- Preserve the handbook-absent success assertions in `test/release/fork-sync-preparation.test.mjs` and `test/release/release-publication.test.mjs`; they prove release preparation does not recreate the removed file.
- Move the sync log and relevant conflict guidance before deleting the handbook; release correspondence is already generated at its new location and needs no second copy.

The `packages/pi-subagents/README.md` link update in the issue-29 documentation commit is in package release scope; the read-only predictor reported a pending fork patch with only that documentation commit in the git-cliff preview.
No package publication, sync, push, historical backfill, or tag change was authorized or performed here.

[#27]: https://github.com/Jopqior/gotgenes-pi-packages/issues/27
