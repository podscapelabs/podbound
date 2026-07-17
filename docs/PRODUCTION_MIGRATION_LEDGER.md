# PodBound Production Migration Ledger

This ledger records database objects verified in the production Supabase project. It does not contain credentials or private connection information.

Production project reference: `lqjhiiqezoehwjrlhulf`

Last verified: 2026-07-16

## Current state

Supabase's dashboard migration tracker reports **No migrations**. The schema was created through manually executed SQL, so the dashboard tracker cannot currently be treated as the migration source of truth.

The following committed migrations were verified against live production objects using read-only SQL:

| Migration | Production state | Verification |
| --- | --- | --- |
| `0001_foundation.sql` | Applied | Foundation tables, functions, triggers, policies, and row-level security are present |
| `0002_playtest_reports.sql` | Applied | `playtest_reports` exists with row-level security |
| `0003_playtest_agreements.sql` | Applied | `playtest_agreement_acceptances` exists with row-level security |
| `0005_maintenance_mode.sql` | Applied | `site_settings` exists with its singleton row and public maintenance policy |
| `0006_my_lab_foundation.sql` | Applied | My Lab tables, policies, functions, triggers, and existing-account progression backfill are present |
| `0007_restrict_public_site_settings.sql` | Applied | Public roles can select only `id` and `maintenance_enabled` |
| `0008_deidentify_deleted_accounts.sql` | Applied | Deleted-account report constraint, de-identification function, and profile-deletion trigger are present |

There is no committed `0004` migration in the production repository. The numbering gap must not be filled by renaming an existing migration.

## Full read-only schema reconciliation

Verified on 2026-07-16 against the live production project:

- all 14 expected application tables are present;
- row-level security is enabled on all 14 expected tables;
- all 7 expected client-readable policies are present;
- all 6 expected application functions are present;
- all 8 expected application triggers are enabled;
- anonymous and authenticated users can select only `id` and `maintenance_enabled` from `site_settings`;
- the deleted-account playtest-report identity constraint is present;
- the `site_settings.id = 1` singleton row exists;
- every current profile has an `account_progression` row;
- the Supabase project reports healthy status and no advisor findings.

The audit inspected schema metadata and boolean completeness checks only. It did not inspect account contents, expose credentials, or write to production.

The Supabase dashboard still reports **No migrations** and **No backups**. Those are operational gaps, not evidence that the verified schema objects are missing.

## Maintenance verification

Verified on 2026-07-13:

- `site_settings.id = 1` exists.
- `maintenance_enabled` is currently `false`.
- row-level security is enabled on `site_settings`.
- the anonymous read policy required by the request proxy exists.
- two maintenance actions are present in `admin_audit_log`.
- the latest maintenance action was recorded on 2026-07-12 and includes an administrator identity.

This proves that the admin action has successfully updated and audited the production setting.

### Controlled end-to-end test

Completed on 2026-07-13 using a temporary maintenance state. The original `maintenance_enabled`, `updated_at`, and `updated_by` values were restored exactly after testing.

While maintenance was enabled:

- `/` returned `307` to `/maintenance`;
- `/arena/play` returned `307` to `/maintenance`;
- `/api/playtest-reports` returned `503`;
- `/admin` bypassed maintenance and returned its normal sign-in redirect.

After restoration:

- `/` returned `200`;
- `/arena/play` returned its normal anonymous `401`;
- `/api/playtest-reports` returned its normal `405` for an unsupported GET request;
- `/admin` returned its normal sign-in redirect;
- the production settings row again contained the exact original values.

Maintenance mode is therefore confirmed to be enforced by the production request proxy for public pages, protected direct routes, and API routes while preserving the administrator route.

## Rules for future migrations

1. Never assume a migration is live because its file is committed.
2. Add every new migration to this ledger after production verification.
3. Do not edit or renumber migrations that may already have been run.
4. Prefer idempotent statements where practical.
5. Record required manual deployment steps in the pull request.
6. Verify row-level security, grants, policies, seed rows, and expected indexes after applying a migration.
7. Confirm rollback or recovery steps before high-risk schema changes.

## Recommended follow-up

- before the next database feature, establish a repeatable migration deployment process so the repository and production tracker cannot drift further;
- evaluate backup and restore options before any high-risk schema change;
- verify the production access-mode row and direct-route enforcement for PodBound Field;
- configure and verify a custom SMTP provider before wider registration; application cooldowns, resend behavior, and the current built-in sender limit are documented in `docs/AUTH_EMAIL_RELIABILITY.md`.
