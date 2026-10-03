# pi-subagents release correspondence

Each published `@jopqior/pi-subagents` version records its own verified direct upstream baseline; several fork releases may share one upstream release.
The fixed source link identifies the upstream release commit and package path, not today's upstream `main` or a claim of behavioral equivalence.
This generated region derives from `scripts/release/pi-subagents/sync-state.json`; the verified pending fork row is included only during release preparation, in the resulting release commit.
Never add or repair rows by hand, including after a sync or historical backfill.
To verify committed evidence against the table, run:

```bash
node scripts/release/correspondence-table.mjs --check
```

After reviewing a corrected state file, use `node scripts/release/correspondence-table.mjs --write` to regenerate only the marked region, then run `--check` again.
The first data row was released under [#3] with fork `1.0.0` incorporating upstream `21.7.0`.
Old npm artifacts remain immutable: historical state rows and any later GitHub Release notes cannot change what an already-published tarball contained.
See the [fork release guide](fork-release-policy.md) for evidence validation, release decisions, and the separately approved backfill procedure.

<!-- release-correspondence:start -->

| Fork `@jopqior/pi-subagents` | Direct upstream release | Fixed source                                                                                                          |
| ---------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1.0.0                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 1.0.1                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 1.0.2                        | `21.7.0`                | [source](https://github.com/gotgenes/pi-packages/blob/b3b6159399f541fd0623f65818557dd3e707a34f/packages/pi-subagents) |
| 2.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 3.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.0                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.1                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.2                        | `21.7.3`                | [source](https://github.com/gotgenes/pi-packages/blob/f918568bbb643a6145898c76c5cc225c63b5b793/packages/pi-subagents) |
| 4.0.3                        | `21.7.7`                | [source](https://github.com/gotgenes/pi-packages/blob/1c8c78e888e3b6b404bafeb9221420c204b6e1fe/packages/pi-subagents) |
| 4.0.4                        | `21.7.7`                | [source](https://github.com/gotgenes/pi-packages/blob/1c8c78e888e3b6b404bafeb9221420c204b6e1fe/packages/pi-subagents) |
| 4.0.5                        | `21.7.7`                | [source](https://github.com/gotgenes/pi-packages/blob/1c8c78e888e3b6b404bafeb9221420c204b6e1fe/packages/pi-subagents) |
| 4.0.6                        | `21.7.7`                | [source](https://github.com/gotgenes/pi-packages/blob/1c8c78e888e3b6b404bafeb9221420c204b6e1fe/packages/pi-subagents) |
| 4.0.7                        | `21.7.7`                | [source](https://github.com/gotgenes/pi-packages/blob/1c8c78e888e3b6b404bafeb9221420c204b6e1fe/packages/pi-subagents) |

<!-- release-correspondence:end -->

[#3]: https://github.com/Jopqior/gotgenes-pi-packages/issues/3
