# My Lab v1 Data Foundation

## Platform decision

The existing Supabase Auth user UUID remains the stable Podscape Labs account identity. Podscape and PodBound must use that same identity rather than creating separate account or profile records.

My Lab data is normalized outside `profiles`. This keeps authentication and authorization stable while allowing future modules to share progression without turning the profile table into a monolith.

## Included in migration 0006

- Shared account EXP and account level.
- Loyalty level and permanent discount tier, capped at 10 percent (`1000` basis points).
- Reusable Podling catalogue.
- Multiple unlocked Podlings per account.
- One active Podling constrained to belong to the same account.
- Account-specific Podling names.
- Immutable EXP and reward history.
- Automatic progression records for existing and newly created profiles.
- Read-only self-service RLS policies.
- Service-role-only EXP mutation function with an atomic ledger entry.

## Deliberately deferred

- Public My Lab routes and navigation.
- The first Podling definition, artwork, animation, naming UI, and active-Podling switcher.
- EXP thresholds, level calculation, reward rules, and discount eligibility rules.
- Orders, addresses, and back-in-stock alerts until the commerce provider and ownership model are chosen.
- Public profiles, badges, achievements, collection tracking, and social systems.

## Safety rules

- Browsers can read only the signed-in account's progression, unlocks, EXP history, and reward history.
- Browsers cannot grant EXP, change levels, unlock Podlings, issue rewards, or change discounts.
- Podlings never have separate EXP or levels.
- A discount value above 10 percent is rejected by the database.
- Active Podling ownership is enforced by a composite foreign key.

## Deployment

Apply `supabase/migrations/0006_my_lab_foundation.sql` through the production Supabase migration workflow before any application route imports `getMyLabFoundation`.

The migration backfills a progression row for every existing profile and installs a trigger for future profiles. It does not expose a new page or change current PodBound behavior.
