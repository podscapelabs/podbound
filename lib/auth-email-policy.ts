export const DEFAULT_AUTH_EMAIL_HOURLY_LIMIT = 2;
export const DEFAULT_AUTH_EMAIL_IP_HOURLY_LIMIT = 10;
export const AUTH_EMAIL_COOLDOWN_SECONDS = 60;

export function readPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isEmailRateLimitError(message: string) {
  return /rate limit|too many requests|email.*exceed/i.test(message);
}

export function publicAuthError(message: string, fallback: string) {
  if (isEmailRateLimitError(message)) {
    return "Authentication email delivery is temporarily busy. Please try again later.";
  }
  return fallback;
}
