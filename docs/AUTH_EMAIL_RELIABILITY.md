# Authentication email reliability

## Confirmed production state

Reviewed in the Supabase production dashboard on July 15, 2026:

- Custom SMTP is disabled.
- Supabase's built-in sender is limited to 2 authentication emails per hour.
- The limit cannot be increased while the built-in sender is active.

This is the cause of the earlier `email rate limit exceeded` failures. The built-in sender is suitable only for very small internal tests, not wider public registration.

## Application protections

PodBound routes registration, password-reset, and verification-resend email requests through `/api/auth/email`. The route:

- never stores raw email addresses in the rate-limit table;
- uses keyed hashes for global, email, and network-address limits;
- defaults to the provider's current 2-email hourly budget;
- enforces a 60-second per-address cooldown;
- limits repeated requests from one network address;
- returns non-enumerating password-reset responses;
- replaces provider errors with clear public messages;
- supplies a `Retry-After` header when requests are throttled.

The registration screen also prevents repeated clicks and offers a cooldown-aware verification resend action.

## Before wider registration

Choose and configure a transactional SMTP provider in Supabase, then set `AUTH_EMAIL_HOURLY_LIMIT` in Vercel to a value at or below the provider's verified allowance. Keep `AUTH_EMAIL_IP_HOURLY_LIMIT` conservative. Test registration, verification, resend, password reset, and failure handling in production before announcing access.

Changing SMTP providers is an operational decision and is intentionally not performed automatically by the application.
