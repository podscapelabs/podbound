export type UserRole = "registered" | "playtester" | "admin";
export type AccessMode = "closed" | "invite_only" | "public_event";
export type EventStatus = "draft" | "scheduled" | "active" | "ended" | "cancelled";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

export type ArenaSettings = {
  id: number;
  access_mode: AccessMode;
  guest_access_enabled: boolean;
  progression_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type SiteSettings = {
  id: number;
  maintenance_enabled: boolean;
  maintenance_message: string;
  updated_at: string;
  updated_by: string | null;
};

export type AccountProgression = {
  account_id: string;
  total_exp: number;
  account_level: number;
  loyalty_level: number;
  discount_tier: string;
  permanent_discount_bps: number;
  active_podling_id: string | null;
  last_exp_at: string | null;
  last_reward_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PodlingDefinition = {
  key: string;
  name: string;
  description: string | null;
  asset_path: string | null;
  is_available: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AccountPodling = {
  id: string;
  account_id: string;
  podling_key: string;
  custom_name: string | null;
  unlocked_by: string;
  unlocked_at: string;
  updated_at: string;
  podling_catalog?: PodlingDefinition;
};

export type AccountExpEntry = {
  id: number;
  account_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  source_type: string | null;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type AccountRewardEntry = {
  id: number;
  account_id: string;
  reward_key: string;
  reward_label: string;
  action: "granted" | "revoked" | "redeemed";
  details: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type PodboundEvent = {
  id: string;
  title: string;
  description: string | null;
  join_code: string | null;
  public_token: string | null;
  starts_at: string;
  ends_at: string;
  guest_access_enabled: boolean;
  max_guests: number;
  progression_enabled: boolean;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type PlaytestReport = {
  id: string;
  account_id: string | null;
  guest_session_id: string | null;
  event_id: string | null;
  player_label: string;
  game_id: string;
  build_version: string;
  submitted_at: string;
  report: {
    feedback?: {
      overallFeel?: string;
      speciesMeaningful?: string;
      forecastMeaningful?: string;
      rulesClarity?: string;
      highlight?: string;
      confusion?: string;
      generalNotes?: string;
      roundFeedback?: Array<{ feel?: string; note?: string }>;
    };
    game?: {
      scores?: number[];
      valid?: boolean;
      humanIndex?: number;
      botIndex?: number;
      players?: Array<{ species?: string; population?: number; stress?: number; stash?: unknown[] }>;
      roundRecords?: unknown[];
      suspiciousWarnings?: string[];
      integrity?: { valid?: boolean; errors?: string[]; warnings?: string[] };
    };
    appVersion?: string;
    balanceBaseline?: string;
    rulesEngine?: string;
    createdAt?: string;
  };
};
