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
  player_label: string;
  game_id: string;
  build_version: string;
  submitted_at: string;
  report: {
    feedback?: {
      overallFeel?: string;
      highlight?: string;
      confusion?: string;
    };
    game?: {
      scores?: number[];
      valid?: boolean;
    };
  };
};
