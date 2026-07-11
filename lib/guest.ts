import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "./supabase/admin";

const COOKIE = "podbound_guest";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createGuestSession(eventId: string, displayName: string, joinCode: string | null) {
  const token = randomUUID() + randomUUID();
  const admin = createAdminClient();
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const attemptKey = hash(`guest-entry:${address}`);
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await admin.from("rate_limit_attempts").select("id", { count: "exact", head: true }).eq("attempt_key", attemptKey).gte("created_at", since);
  if ((count || 0) >= 10) throw new Error("Too many guest-entry attempts. Try again later.");
  await admin.from("rate_limit_attempts").insert({ attempt_key: attemptKey, action: "guest_entry" });
  const { data, error } = await admin.rpc("admit_event_guest", {
    requested_event_id: eventId,
    requested_display_name: displayName,
    requested_token_hash: hash(token),
    requested_join_code: joinCode || null,
  });
  if (error) throw new Error(error.message);
  const expiresAt = String((data as { expires_at: string }).expires_at);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(expiresAt) });
}

export async function getGuestSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("guest_sessions").select("id, display_name, event_id, expires_at")
    .eq("token_hash", hash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data;
}

export async function clearGuestSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
