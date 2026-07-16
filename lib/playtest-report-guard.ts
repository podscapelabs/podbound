import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

const ACTION = "playtest_report";
const WINDOW_MS = 10 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 12;

type SubmissionActor = {
  accountId: string | null;
  guestSessionId: string | null;
};

type SubmissionLimit =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type ExistingPlaytestReport = {
  id: string;
  submitted_at: string;
};

function getActorReference(actor: SubmissionActor) {
  if (actor.accountId) return `account:${actor.accountId}`;
  if (actor.guestSessionId) return `guest:${actor.guestSessionId}`;
  throw new Error("A report submission actor is required.");
}

function hashAttemptKey(actor: SubmissionActor) {
  return createHash("sha256")
    .update(`${ACTION}:${getActorReference(actor)}`)
    .digest("hex");
}

export async function checkPlaytestReportSubmissionLimit(
  actor: SubmissionActor,
): Promise<SubmissionLimit> {
  const admin = createAdminClient();
  const now = Date.now();
  const attemptKey = hashAttemptKey(actor);
  const windowStart = new Date(now - WINDOW_MS).toISOString();
  const retentionStart = new Date(now - RETENTION_MS).toISOString();

  const { error: cleanupError } = await admin
    .from("rate_limit_attempts")
    .delete()
    .eq("action", ACTION)
    .lt("created_at", retentionStart);

  if (cleanupError) {
    console.error("Playtest report rate-limit cleanup failed", cleanupError.code);
  }

  const { data: attempts, error: lookupError } = await admin
    .from("rate_limit_attempts")
    .select("created_at")
    .eq("attempt_key", attemptKey)
    .eq("action", ACTION)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true })
    .limit(MAX_SUBMISSIONS_PER_WINDOW);

  if (lookupError) {
    throw new Error(`Playtest report rate-limit lookup failed: ${lookupError.code}`);
  }

  if ((attempts?.length || 0) >= MAX_SUBMISSIONS_PER_WINDOW) {
    const oldestAttempt = Date.parse(attempts?.[0]?.created_at || windowStart);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestAttempt + WINDOW_MS - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  const { error: insertError } = await admin.from("rate_limit_attempts").insert({
    attempt_key: attemptKey,
    action: ACTION,
  });

  if (insertError) {
    throw new Error(`Playtest report rate-limit insert failed: ${insertError.code}`);
  }

  return { allowed: true };
}

export async function findExistingPlaytestReport(
  actor: SubmissionActor,
  gameId: string,
): Promise<ExistingPlaytestReport | null> {
  if (gameId === "unknown-game") return null;

  const admin = createAdminClient();
  let query = admin
    .from("playtest_reports")
    .select("id, submitted_at")
    .eq("game_id", gameId)
    .order("submitted_at", { ascending: true })
    .limit(1);

  if (actor.accountId) {
    query = query.eq("account_id", actor.accountId);
  } else if (actor.guestSessionId) {
    query = query.eq("guest_session_id", actor.guestSessionId);
  } else {
    throw new Error("A report submission actor is required.");
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Playtest report duplicate lookup failed: ${error.code}`);
  }
  return data;
}

