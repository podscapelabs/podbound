# PodBound

Production foundation for the official PodBound™ website, controlled PodBound Field playtesting, and future migration of the existing HTML/CSS/JavaScript game.

## Architecture

- Next.js App Router, TypeScript, and server components
- Supabase Auth for verified email/password accounts and secure cookie sessions
- Supabase Postgres for profiles, roles, Field access settings, public events, guest sessions, audit records, and server-backed rate limits
- Server-side access evaluation for every PodBound Field and administration request
- Vercel deployment at `podbound.net`

The browser never receives the Supabase service-role key. Role changes, access-mode changes, event administration, guest capacity, and event timing are enforced on the server.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public PodBound landing page |
| `/register` | Verified email/password registration |
| `/sign-in` | Account login with PodBound Field return path |
| `/forgot-password` | Password recovery request |
| `/reset-password` | Secure password update after recovery |
| `/account` | Verified account and approval status |
| `/account/delete` | Account and personal-data deletion request instructions |
| `/arena` | Server-controlled PodBound Field entry and simulator launch |
| `/arena/play` | Protected V42.2 ten-round simulator (never served as a public asset) |
| `/api/playtest-reports` | Server-authenticated internal playtest report intake |
| `/admin` | Admin-only users, roles, access mode, events, and audit history |
| `/admin/reports` | Admin-only playtest report inbox, filters, feedback, and game audits |
| `/admin/reports/[id]` | Admin-only complete submitted game-audit record |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Use |
| `/testing-disclaimer` | Temporary public-test notice |
| `/contact` | Support, privacy, and deletion contact routes |

## Local installation

Requirements: Node.js 20.9 or newer and pnpm 10 or newer.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

No real secret belongs in Git. `.env.local` is ignored.

## Supabase setup

1. Create a new Supabase project for PodBound.
2. Open **SQL Editor** and run `supabase/migrations/0001_foundation.sql` once.
3. Under Authentication, enable email/password sign-in and require email confirmation.
4. Set the Site URL to `http://localhost:3000` for local work, then to `https://podbound.net` for production.
5. Add callback URLs for `/auth/callback` on local, preview, and production domains.
6. Copy the project URL, anon key, and service-role key into `.env.local` and later Vercel environment variables.

Required values:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`, print it, commit it, or pass it to a client component.

Supabase Auth applies its own login, registration, and password-reset limits. Guest-event entry adds a server-side attempt limit and the database function atomically enforces event timing, join code, and capacity.

## Create the first administrator

1. Register normally and verify the email address.
2. In Supabase SQL Editor, run the following with the actual account email:

```sql
update public.profiles
set role = 'admin', approved_at = now(), approved_by = id
where lower(email) = lower('owner@example.com');
```

3. Sign out and back in, then open `/admin`.

The application prevents the final remaining administrator from being demoted.

## Approve playtesters

Open `/admin`, search by email or display name, and choose **Approve**. Revoking access returns the account to `registered`. Every role change is recorded in `admin_audit_log`.

## PodBound Field access modes

- `closed`: only admins enter. Everyone else receives the closure notice.
- `invite_only`: verified playtesters and admins enter; registered accounts remain pending.
- `public_event`: an active, in-window event permits signed-in accounts and, when enabled, temporary guests.

Change mode in `/admin`; no deployment is required. If a public event expires, server-side access evaluation falls back to invite-only behavior even when nobody changes the switch.

## Public events

In `/admin`, configure the title, description, start/end times, guest access, join code, optional unguessable token, capacity, progression flag, and status. Set the event to `active` and the Field access mode to `public_event`.

Guest sessions expire at the event end. Guests do not receive permanent EXP, rewards, founder progress, Podling progress, or account-linked history.

## Playtest reports and watermarks

Run `supabase/migrations/0002_playtest_reports.sql` before enabling report submission. Completed games send their verified audit and voluntary feedback to the server-only `playtest_reports` table. Player-facing JSON downloads and copy controls are intentionally omitted. Each simulator session is watermarked with the display name and a shortened account or guest-session identifier; full internal IDs and email addresses are not rendered.

## Required playtest agreement

Run `supabase/migrations/0003_playtest_agreements.sql` before deploying the agreement gate. Every account and temporary guest session must accept the current version in `lib/playtest-agreement.ts` before the Field dashboard, simulator route, or report endpoint will allow access. Acceptance is timestamped server-side; changing the agreement version requires acceptance again.

## Legal and safety foundation

The public footer links to the Privacy Policy, Terms of Use, Testing Disclaimer, contact page, and account deletion instructions. Registration and Field entry also display the short testing notice. Keep these pages aligned with actual data practices whenever registration fields, providers, analytics, report contents, retention, or account controls change.

Internal review records:

- `docs/ACCOUNT_DATA_SAFETY_REVIEW.md`
- `docs/ASSET_AND_LICENSE_REGISTER.md`

These records are implementation evidence, not a substitute for qualified legal advice. Before broader promotion, verify the published support inbox and obtain a legal review appropriate to Podscape Labs' users and operating locations.

## Row Level Security

The migration enables RLS on every application table. Authenticated users may read only their own profile. No client policy permits role or approval updates. Settings, events, guests, rate-limit records, and audit logs are accessed only by reviewed server code using the service role.

## Official assets

Stable locations:

```text
public/assets/
├── logos/
│   ├── podbound-logo.png          # supplied official transparent logo
│   └── podscape-labs-wordmark.png # add when supplied
├── photos/
│   ├── landing-hero.jpg           # add official landing artwork
│   └── arena-background.jpg       # legacy filename for official Field artwork
├── cards/                         # official card faces
├── species/                       # official species artwork
├── environments/                  # official environment artwork
└── icons/                         # approved interface icons
```

Missing imagery is represented by labelled interface placeholders. No AI-generated artwork is included.

## Deploy to Vercel and connect `podbound.net`

1. Import `podscapelabs/podbound` as a new Vercel project.
2. Keep the detected Next.js build settings.
3. Add the four environment variables for Production and Preview.
4. Deploy and verify registration, email confirmation, and protected routes.
5. Open **Project Settings → Domains**, add `podbound.net` and `www.podbound.net`, and follow the displayed DNS instructions.
6. Redirect one hostname to the other to avoid duplicate production URLs.
7. Update Supabase Site URL and allowed callback URLs to the final domain.

## Migrating the existing game

Move the game's modules and assets into a Field-owned feature directory and render them inside the compatibility route `/arena` after the existing server-side access decision succeeds. Keep game APIs behind authenticated server routes. Do not iframe the old site. The first migration step should inventory global scripts, browser storage, asset paths, and DOM assumptions before converting the game to modules.

## Future data

See `supabase/FUTURE_SCHEMA.md`. EXP, Podlings, matches, feedback, rewards, and Founder progress are intentionally not implemented in this release.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```
