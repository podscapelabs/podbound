import assert from "node:assert/strict";
import { decideArenaAccess } from "../lib/access-policy.ts";
import type { ArenaSettings, Profile } from "../lib/types.ts";

const now = new Date("2026-07-10T20:00:00Z");
const settings = (access_mode: ArenaSettings["access_mode"], guest = false): ArenaSettings => ({ id: 1, access_mode, guest_access_enabled: guest, progression_enabled: false, updated_at: now.toISOString(), updated_by: null });
const profile = (role: Profile["role"]): Profile => ({ id: role, email: `${role}@example.com`, display_name: role, role, created_at: now.toISOString(), updated_at: now.toISOString(), approved_at: null, approved_by: null });

assert.equal(decideArenaAccess({ settings: settings("closed"), event: null, profile: profile("admin"), now }).allowed, true);
assert.deepEqual(decideArenaAccess({ settings: settings("closed"), event: null, profile: profile("playtester"), now }), { allowed: false, reason: "closed", mode: "closed", event: null });
assert.equal(decideArenaAccess({ settings: settings("invite_only"), event: null, profile: profile("playtester"), now }).allowed, true);
assert.equal(decideArenaAccess({ settings: settings("invite_only"), event: null, profile: profile("registered"), now }).allowed, false);
assert.equal(decideArenaAccess({ settings: settings("public_event"), event: null, profile: profile("registered"), now }).allowed, true);
assert.equal(decideArenaAccess({ settings: settings("public_event"), event: null, profile: profile("playtester"), now }).allowed, true);
assert.deepEqual(decideArenaAccess({ settings: settings("public_event"), event: null, profile: null, now }), { allowed: false, reason: "login_required", mode: "public_event", event: null });
console.log("Arena access policy checks passed.");
