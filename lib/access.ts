import { createAdminClient } from "./supabase/admin";
import type { ArenaSettings, PodboundEvent, Profile } from "./types";
import { decideArenaAccess } from "./access-policy";

export type ArenaDecision =
  | { allowed: true; kind: "account" | "guest"; mode: ArenaSettings["access_mode"]; event: PodboundEvent | null }
  | { allowed: false; reason: "closed" | "login_required" | "awaiting_approval" | "event_inactive"; mode: ArenaSettings["access_mode"]; event: PodboundEvent | null };

export async function evaluateArenaAccess(profile: Profile | null): Promise<ArenaDecision> {
  const admin = createAdminClient();
  const { data: rawSettings } = await admin.from("arena_settings").select("*").eq("id", 1).single();
  const settings = rawSettings as ArenaSettings | null;
  return decideArenaAccess({ settings, event: null, profile });
}
