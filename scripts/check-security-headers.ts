import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

for (const header of [
  "Content-Security-Policy",
  "Permissions-Policy",
  "Referrer-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
]) {
  assert.match(config, new RegExp(`key: "${header}"`), `${header} must remain enabled globally.`);
}

for (const directive of [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
]) {
  assert.ok(config.includes(`"${directive}"`), `CSP must retain ${directive}.`);
}

assert.match(config, /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/, "Browser authentication must retain its approved Supabase connection destinations.");
assert.match(config, /source: "\/\(\.\*\)"/, "Security headers must apply to every route.");
assert.match(config, /poweredByHeader: false/, "Framework identification must not be exposed in responses.");
assert.doesNotMatch(config, /script-src[^\n]*https:/, "Scripts must not load from third-party origins.");
assert.doesNotMatch(config, /default-src[^\n]*\*/, "The default source policy must not contain a wildcard.");

console.log("Global security header checks passed.");
