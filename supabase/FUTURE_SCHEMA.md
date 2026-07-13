# Future schema notes

Migration `0006_my_lab_foundation.sql` now prepares the shared account progression layer:

- `account_progression`: shared EXP, account level, loyalty level, permanent discount tier, and one active Podling reference.
- `podling_catalog`: reusable platform Podling definitions.
- `account_podlings`: unlocked Podlings and account-specific Podling names.
- `account_exp_history`: immutable, server-issued EXP ledger.
- `account_reward_history`: immutable, server-issued reward ledger.

The first public My Lab release remains intentionally unexposed until its progression rules and first approved Podling are ready. Commerce-owned records also remain deferred until a provider is selected:

- orders and order history
- saved addresses
- back-in-stock alerts

Later migrations may add:

- `matches` and `match_participants`: build version, timestamps, completion state, account or ephemeral guest participation.
- `feedback`: match-linked playtest reports with moderation state.
- `rewards` and `founder_progress`: server-issued entitlements and auditable progress.

Never accept EXP, rewards, roles, or match results directly from browser claims. Validate and write them through server-side operations.
