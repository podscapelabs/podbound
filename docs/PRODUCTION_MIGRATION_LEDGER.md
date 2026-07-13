# PodBound Production Migration Ledger

This ledger records database objects verified in the production Supabase project. It does not contain credentials or private connection information.

Production project reference: `lqjhiiqezoehwjrlhulf`

Last verified: 2026-07-13

## Current state

Supabase's dashboard migration tracker reports **No migrations**. The schema was created through manually executed SQL, so the dashboard tracker cannot currently be treated as the migration source of truth.

The following committed migrations were verified against live production objects using read-only SQL:

| Migration | Production state | Verification |
| --- | --- | --- |
| `0001_foundation.sql` | Applied | `profiles`, `arena_settings`, and `admin_audit_log` exist |
| `0002_playtest_reports.sql` | Applied | `playtest_reports` exists |
| `0003_playtest_agreements.sql` | Applied | `playtest_agreement_acceptances` exists |
| `0005_maintenance_mode.sql` | Applied | `site_settings` exists with one row; row-level security and anonymous read policy are enabled |

There is no committed `0004` migration in the production repository. The numbering gap must not be filled by renaming an existing migration.

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

- establish a repeatable migration deployment process before adding shared-platform tables;
- verify the production access-mode row and direct-route enforcement for PodBound Field;
- review authentication email limits and resend behavior.
