import type { ArenaSettings, PodboundEvent, Profile } from "./types";
import type { ArenaDecision } from "./access";

export function decideArenaAccess({ settings, event, profile, now = new Date() }: { settings: ArenaSettings | null; event: PodboundEvent | null; profile: Profile | null; now?: Date }): ArenaDecision {
  const mode = settings?.access_mode || "closed";
  if (profile?.role === "admin") return { allowed: true, kind: "account", mode, event };
  if (!settings || mode === "closed") return { allowed: false, reason: "closed", mode: "closed", event: null };
  if (mode === "invite_only") {
    if (!profile) return { allowed: false, reason: "login_required", mode, event: null };
    return profile.role === "playtester" ? { allowed: true, kind: "account", mode, event: null } : { allowed: false, reason: "awaiting_approval", mode, event: null };
  }
  const active = event?.status === "active" && now >= new Date(event.starts_at) && now < new Date(event.ends_at);
  if (!active) {
    if (profile?.role === "playtester") return { allowed: true, kind: "account", mode: "invite_only", event: null };
    return { allowed: false, reason: profile ? "awaiting_approval" : "login_required", mode: "invite_only", event: null };
  }
  if (profile) return { allowed: true, kind: "account", mode, event };
  if (settings.guest_access_enabled && event.guest_access_enabled) return { allowed: true, kind: "guest", mode, event };
  return { allowed: false, reason: "event_inactive", mode, event };
}
