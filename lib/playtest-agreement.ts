import { createAdminClient } from "./supabase/admin";

export const PLAYTEST_AGREEMENT = {
  version: "2026-07-11-v1",
  title: "PodBound Playtest Participation Agreement",
  introduction:
    "PodBound is unfinished pre-release material shared only for controlled playtesting. Please review and accept these conditions before entering the Arena.",
  terms: [
    "I will not redistribute the simulator, its source, private links, game data, rules material, or unreleased assets.",
    "I will not publish screenshots, recordings, streams, or detailed playtest information without written permission from Podscape Labs.",
    "I understand that rules, balance, artwork, availability, and saved data may change or be removed during testing.",
    "I will use the Arena respectfully and will not attempt to bypass access controls, impersonate another player, or interfere with other tests.",
    "I consent to Podscape Labs storing my display name, shortened session identifier, game audit, and feedback for internal playtest analysis.",
  ],
} as const;

export async function hasAcceptedPlaytestAgreement(accountId: string | null, guestSessionId: string | null) {
  if (!accountId && !guestSessionId) return false;
  const admin = createAdminClient();
  let query = admin.from("playtest_agreement_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("agreement_version", PLAYTEST_AGREEMENT.version);
  query = accountId ? query.eq("account_id", accountId) : query.eq("guest_session_id", guestSessionId!);
  const { count } = await query;
  return (count || 0) > 0;
}

export async function recordPlaytestAgreement(accountId: string | null, guestSessionId: string | null) {
  if (!accountId && !guestSessionId) throw new Error("A player session is required.");
  if (await hasAcceptedPlaytestAgreement(accountId, guestSessionId)) return;
  const admin = createAdminClient();
  const { error } = await admin.from("playtest_agreement_acceptances").insert({
    account_id: accountId,
    guest_session_id: guestSessionId,
    agreement_version: PLAYTEST_AGREEMENT.version,
  });
  if (error && error.code !== "23505") throw new Error("Agreement acceptance could not be recorded.");
}
