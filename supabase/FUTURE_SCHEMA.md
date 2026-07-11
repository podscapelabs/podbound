# Future schema notes

The first release intentionally omits progression. Later migrations may add:

- `account_experience`: immutable EXP ledger linked to verified profiles.
- `podlings`: account-owned progression records with explicit lifecycle states.
- `matches` and `match_participants`: build version, timestamps, completion state, account or ephemeral guest participation.
- `feedback`: match-linked playtest reports with moderation state.
- `rewards` and `founder_progress`: server-issued entitlements and auditable progress.

Never accept EXP, rewards, roles, or match results directly from browser claims. Validate and write them through server-side operations.
