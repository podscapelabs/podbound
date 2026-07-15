import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServiceRoleKey } from "@/lib/supabase/env";
import {
  AUTH_EMAIL_COOLDOWN_SECONDS,
  DEFAULT_AUTH_EMAIL_HOURLY_LIMIT,
  DEFAULT_AUTH_EMAIL_IP_HOURLY_LIMIT,
  readPositiveInteger,
} from "@/lib/auth-email-policy";

const ACTION = "auth_email";

function protectedKey(value: string) {
  return createHmac("sha256", getServiceRoleKey()).update(value).digest("hex");
}

function requestAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

async function recentCount(attemptKey: string, since: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("rate_limit_attempts")
    .select("id", { count: "exact", head: true })
    .eq("attempt_key", attemptKey)
    .eq("action", ACTION)
    .gte("created_at", since);
  if (error) throw new Error("Authentication email protection is unavailable.");
  return count || 0;
}

export type AuthEmailLimitResult =
  | { allowed: true; cooldownSeconds: number }
  | { allowed: false; retryAfterSeconds: number; reason: "cooldown" | "hourly" | "address" };

export async function reserveAuthEmailAttempt(request: NextRequest, email: string): Promise<AuthEmailLimitResult> {
  const now = Date.now();
  const hourSince = new Date(now - 60 * 60 * 1000).toISOString();
  const cooldownSince = new Date(now - AUTH_EMAIL_COOLDOWN_SECONDS * 1000).toISOString();
  const globalLimit = readPositiveInteger(process.env.AUTH_EMAIL_HOURLY_LIMIT, DEFAULT_AUTH_EMAIL_HOURLY_LIMIT);
  const addressLimit = readPositiveInteger(process.env.AUTH_EMAIL_IP_HOURLY_LIMIT, DEFAULT_AUTH_EMAIL_IP_HOURLY_LIMIT);
  const normalizedEmail = email.trim().toLowerCase();
  const globalKey = protectedKey("auth-email:global");
  const emailKey = protectedKey(`auth-email:email:${normalizedEmail}`);
  const addressKey = protectedKey(`auth-email:address:${requestAddress(request)}`);

  const [globalCount, emailCooldownCount, addressCount] = await Promise.all([
    recentCount(globalKey, hourSince),
    recentCount(emailKey, cooldownSince),
    recentCount(addressKey, hourSince),
  ]);

  if (globalCount >= globalLimit) return { allowed: false, retryAfterSeconds: 60 * 60, reason: "hourly" };
  if (emailCooldownCount >= 1) return { allowed: false, retryAfterSeconds: AUTH_EMAIL_COOLDOWN_SECONDS, reason: "cooldown" };
  if (addressCount >= addressLimit) return { allowed: false, retryAfterSeconds: 60 * 60, reason: "address" };

  const admin = createAdminClient();
  const { error } = await admin.from("rate_limit_attempts").insert([
    { attempt_key: globalKey, action: ACTION },
    { attempt_key: emailKey, action: ACTION },
    { attempt_key: addressKey, action: ACTION },
  ]);
  if (error) throw new Error("Authentication email protection is unavailable.");
  return { allowed: true, cooldownSeconds: AUTH_EMAIL_COOLDOWN_SECONDS };
}
