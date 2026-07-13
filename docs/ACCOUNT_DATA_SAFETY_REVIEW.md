# Account and Data Safety Review

Last reviewed: July 13, 2026

This record describes the current PodBound implementation. It must be updated when authentication, registration, providers, analytics, account roles, or playtest reporting change.

## Current controls

| Area | Current implementation | Evidence |
| --- | --- | --- |
| Authentication | Supabase Auth manages email/password accounts, verification, recovery, and sessions. The application database does not store plain-text passwords. | `lib/supabase/client.ts`, `lib/supabase/server.ts`, auth routes |
| Registration minimization | Registration asks only for display name, email address, and password. | `components/AuthForm.tsx` |
| Session handling | Supabase SSR uses secure authentication cookies and server-side session checks. | `proxy.ts`, `lib/supabase/server.ts` |
| Private credentials | The service-role key is read only by server code and is never prefixed with `NEXT_PUBLIC_`. | `lib/supabase/admin.ts`, `lib/supabase/env.ts` |
| Authorization | Roles and Field access are evaluated on the server. Admin routes and actions perform admin checks. | `lib/access-policy.ts`, `lib/auth.ts`, `app/admin` |
| Database access | Row Level Security protects application tables; privileged operations use reviewed server code. | `supabase/migrations`, `docs/PRODUCTION_MIGRATION_LEDGER.md` |
| User controls | Signed-in users can change display name, request a password reset, sign out, and find deletion-request instructions. | `app/account/page.tsx`, `app/account/delete/page.tsx` |
| Agreement record | The current playtest agreement version and acceptance time are recorded server-side before Field entry. | `lib/playtest-agreement.ts`, migration `0003` |
| Playtest data | Reports are accepted by an authenticated server route; player-facing JSON copy/download controls are not exposed. | `app/api/playtest-reports`, simulator integration |
| Watermarking | Field sessions display a player display name and shortened account/session reference rather than email or full internal identifier. | Field simulator integration |
| Auditability | Administrative role and access changes are recorded in the admin audit log. | admin actions and `admin_audit_log` migration |

## Data currently handled

- Email address, display name, internal account identifier, role, approval state, and account timestamps.
- Essential authentication and session information managed by Supabase.
- Playtest-agreement version and acceptance timestamp.
- Submitted game identifiers, build version, score, game audit, integrity state, voluntary feedback, player label, and submission timestamp.
- Technical request, device, IP, security, and hosting logs that may be processed by Supabase or Vercel.

No payment information, government identification, contact lists, precise registration location, advertising profile, or behavioural advertising data is intentionally collected by the application.

## Administrative boundaries

- Normal users must not receive the Supabase service-role key, another user's profile, complete internal identifiers, admin audit history, or admin controls.
- New server routes that read account or report data require an explicit session and role check.
- New browser-visible environment variables must be reviewed before they receive a `NEXT_PUBLIC_` prefix.
- Production database changes must preserve Row Level Security and be recorded in the migration ledger.

## Operational actions still required

- [x] Route support, privacy, and deletion requests to the monitored temporary address `podscapelabs@gmail.com`.
- [ ] Replace the temporary address with `support@podbound.net` after that inbox is active and monitored.
- [ ] Assign a named privacy owner within Podscape Labs and document the internal request-handling process.
- [ ] Set and document concrete retention periods for inactive accounts, agreement records, playtest reports, audit logs, and provider logs.
- [ ] Define a deletion procedure that covers Supabase Auth, profile data, linked playtest records, and backups or documented exceptions.
- [ ] Maintain an incident-response and breach-escalation process with provider contact details.
- [ ] Review administrator access and production secrets periodically and after any team change.
- [ ] Test access, correction, and deletion requests end to end before broad promotion.
- [ ] Obtain qualified legal review of the public legal pages for the intended user locations and age groups.

## Review trigger

Repeat this review before adding social login, analytics, payments, public profiles, leaderboards, marketing email, file uploads, additional account fields, or a shared Podscape identity system.
