import assert from "node:assert/strict";
import {
  DEFAULT_AUTH_EMAIL_HOURLY_LIMIT,
  isEmailRateLimitError,
  publicAuthError,
  readPositiveInteger,
} from "../lib/auth-email-policy.ts";

assert.equal(readPositiveInteger(undefined, DEFAULT_AUTH_EMAIL_HOURLY_LIMIT), 2);
assert.equal(readPositiveInteger("12", 2), 12);
assert.equal(readPositiveInteger("0", 2), 2);
assert.equal(readPositiveInteger("not-a-number", 2), 2);
assert.equal(isEmailRateLimitError("email rate limit exceeded"), true);
assert.equal(isEmailRateLimitError("Too many requests"), true);
assert.equal(isEmailRateLimitError("invalid login credentials"), false);
assert.equal(
  publicAuthError("email rate limit exceeded", "fallback"),
  "Authentication email delivery is temporarily busy. Please try again later.",
);
assert.equal(publicAuthError("internal error", "fallback"), "fallback");

console.log("Authentication email policy checks passed.");
