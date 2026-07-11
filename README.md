# PodBound

Production foundation for the official PodBound™ website, controlled playtesting Arena, and future migration of the existing HTML/CSS/JavaScript game.

## Architecture

- Next.js App Router, TypeScript, and server components
- Supabase Auth for verified email/password accounts and secure cookie sessions
- Supabase Postgres for profiles, roles, Arena settings, public events, guest sessions, audit records, and server-backed rate limits
- Server-side access evaluation for every Arena and administration request
- Vercel deployment at `podbound.net`

The browser never receives the Supabase service-role key. Role changes, access-mode changes, event administration, guest capacity, and event timing are enforced on the server.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public PodBound landing page |
| `/register` | Verified email/password registration |
| `/sign-in` | Account login with Arena return path |
| `/forgot-password` | Password recovery request |
| `/reset-password` | Secure password update after recovery |
| `/account` | Verified account and approval status |
| `/arena` | Server-controlled Arena entry and future game host |
| `/admin` | Admin-only users, roles, access mode, events, and audit history |

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

## Arena access modes

- `closed`: only admins enter. Everyone else receives the closure notice.
- `invite_only`: verified playtesters and admins enter; registered accounts remain pending.
- `public_event`: an active, in-window event permits signed-in accounts and, when enabled, temporary guests.

Change mode in `/admin`; no deployment is required. If a public event expires, server-side access evaluation falls back to invite-only behavior even when nobody changes the switch.

## Public events

In `/admin`, configure the title, description, start/end times, guest access, join code, optional unguessable token, capacity, progression flag, and status. Set the event to `active` and the Arena mode to `public_event`.

Guest sessions expire at the event end. Guests do not receive permanent EXP, rewards, founder progress, Podling progress, or account-linked history.

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
│   └── arena-background.jpg       # add official Arena artwork
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

Move the game's modules and assets into an Arena-owned feature directory and render them inside `/arena` after the existing server-side access decision succeeds. Keep game APIs behind authenticated server routes. Do not iframe the old site. The first migration step should inventory global scripts, browser storage, asset paths, and DOM assumptions before converting the game to modules.

## Future data

See `supabase/FUTURE_SCHEMA.md`. EXP, Podlings, matches, feedback, rewards, and Founder progress are intentionally not implemented in this release.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```
