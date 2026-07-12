import type { ArenaSettings, PodboundEvent, Profile } from "./types";
import type { ArenaDecision } from "./access";

export function decideArenaAccess({ settings, event, profile, now = new Date() }: { settings: ArenaSettings | null; event: PodboundEvent | null; profile: Profile | null; now?: Date }): ArenaDecision {
  void now;
  const mode = settings?.access_mode || "closed";
  if (profile?.role === "admin") return { allowed: true, kind: "account", mode, event };
  if (!settings || mode === "closed") return { allowed: false, reason: "closed", mode: "closed", event: null };
  if (mode === "invite_only") {
    if (!profile) return { allowed: false, reason: "login_required", mode, event: null };
    return profile.role === "playtester" ? { allowed: true, kind: "account", mode, event: null } : { allowed: false, reason: "awaiting_approval", mode, event: null };
  }
  // The legacy public_event database value now means "open to signed-in accounts".
  // Event and guest access are deliberately ignored.
  if (profile) return { allowed: true, kind: "account", mode, event: null };
  return { allowed: false, reason: "login_required", mode, event: null };
}
