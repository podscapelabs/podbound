import "server-only";
import { createClient } from "./supabase/server";
import type { AccountExpEntry, AccountPodling, AccountProgression, AccountRewardEntry } from "./types";

export type MyLabFoundation = {
  progression: AccountProgression | null;
  podlings: AccountPodling[];
  recentExperience: AccountExpEntry[];
  recentRewards: AccountRewardEntry[];
};

export async function getMyLabFoundation(accountId: string): Promise<MyLabFoundation> {
  const supabase = await createClient();
  const [progressionResult, podlingsResult, experienceResult, rewardsResult] = await Promise.all([
    supabase.from("account_progression").select("*").eq("account_id", accountId).maybeSingle(),
    supabase.from("account_podlings").select("*, podling_catalog(*)").eq("account_id", accountId).order("unlocked_at"),
    supabase.from("account_exp_history").select("*").eq("account_id", accountId).order("created_at", { ascending: false }).limit(20),
    supabase.from("account_reward_history").select("*").eq("account_id", accountId).order("created_at", { ascending: false }).limit(20),
  ]);

  const error = progressionResult.error || podlingsResult.error || experienceResult.error || rewardsResult.error;
  if (error) throw new Error("My Lab account data could not be loaded.");

  return {
    progression: progressionResult.data as AccountProgression | null,
    podlings: (podlingsResult.data || []) as AccountPodling[],
    recentExperience: (experienceResult.data || []) as AccountExpEntry[],
    recentRewards: (rewardsResult.data || []) as AccountRewardEntry[],
  };
}
