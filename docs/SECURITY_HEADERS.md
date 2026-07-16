# Browser Security Headers

Last reviewed: July 16, 2026

PodBound applies its browser security headers centrally through `next.config.ts` so public pages, authenticated pages, server routes, and the Field share the same baseline.

## Current baseline

- Content Security Policy limits content to first-party resources, approved Supabase browser connections, and the minimum schemes needed by current assets.
- Framing is blocked by both `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- Plugins and embedded third-party frames are disabled.
- Forms may submit only to the same origin.
- HTTPS is enforced for one year across the domain and its subdomains.
- MIME sniffing is disabled.
- Referrer detail is limited on cross-origin navigation.
- Camera, microphone, geolocation, payment, USB, and browsing-topics access are disabled.
- The default framework-identification response header is disabled.

## Inline-content exception

The current Next.js application and standalone Field simulator contain first-party inline scripts and styles. The policy therefore permits inline script and style execution while still preventing scripts from loading from third-party origins. Removing these exceptions requires a nonce-based Next.js response policy and extracting or hashing the simulator's inline content; that should be handled as a separate tested change.

## Change rules

1. Do not add wildcard sources.
2. Add an external origin only when a reviewed feature requires it.
3. Re-run authentication and Field entry tests after changing `connect-src`, `script-src`, `style-src`, or `form-action`.
4. Review this policy before adding analytics, embedded media, social login, payments, uploads, or third-party widgets.
5. Keep `scripts/check-security-headers.ts` in the release validation suite.
