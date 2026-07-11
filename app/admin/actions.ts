"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessMode, UserRole } from "@/lib/types";

async function audit(adminId: string, action: string, targetUserId: string | null, previousValue: unknown, newValue: unknown) {
  const admin = createAdminClient();
  await admin.from("admin_audit_log").insert({ admin_id: adminId, action, target_user_id: targetUserId, previous_value: previousValue, new_value: newValue });
}

export async function changeRole(formData: FormData) {
  const { profile: actor } = await requireAdmin();
  const targetId = String(formData.get("targetId") || "");
  const role = String(formData.get("role") || "") as UserRole;
  if (!targetId || !["registered", "playtester", "admin"].includes(role)) return;
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", targetId).single();
  if (!target) return;
  if (target.role === "admin" && role !== "admin") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count || 0) <= 1) throw new Error("The final administrator cannot be demoted.");
  }
  await admin.from("profiles").update({ role, approved_at: role === "registered" ? null : new Date().toISOString(), approved_by: role === "registered" ? null : actor.id }).eq("id", targetId);
  await audit(actor.id, "role_changed", targetId, { role: target.role }, { role });
  revalidatePath("/admin");
}

export async function updateArenaMode(formData: FormData) {
  const { profile: actor } = await requireAdmin();
  const mode = String(formData.get("mode") || "") as AccessMode;
  if (!["closed", "invite_only", "public_event"].includes(mode)) return;
  const admin = createAdminClient();
  const { data: previous } = await admin.from("arena_settings").select("*").eq("id", 1).single();
  await admin.from("arena_settings").update({ access_mode: mode, updated_by: actor.id, updated_at: new Date().toISOString() }).eq("id", 1);
  await audit(actor.id, "arena_mode_changed", null, previous, { access_mode: mode });
  revalidatePath("/admin"); revalidatePath("/arena");
}

export async function saveEvent(formData: FormData) {
  const { profile: actor } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const startsAt = new Date(String(formData.get("startsAt") || ""));
  const endsAt = new Date(String(formData.get("endsAt") || ""));
  if (!Number.isFinite(startsAt.valueOf()) || !Number.isFinite(endsAt.valueOf()) || endsAt <= startsAt) throw new Error("Event end must be after its start.");
  const payload = {
    title: String(formData.get("title") || "PodBound public event").slice(0, 120),
    description: String(formData.get("description") || "").slice(0, 600) || null,
    join_code: String(formData.get("joinCode") || "").trim().slice(0, 40) || null,
    public_token: String(formData.get("publicToken") || "").trim().slice(0, 120) || null,
    starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
    guest_access_enabled: formData.get("guestAccess") === "on",
    progression_enabled: formData.get("progression") === "on",
    max_guests: Math.max(1, Math.min(1000, Number(formData.get("maxGuests") || 100))),
    status: String(formData.get("status") || "draft"), updated_at: new Date().toISOString(),
  };
  const admin = createAdminClient();
  const { data: previous } = id ? await admin.from("events").select("*").eq("id", id).maybeSingle() : { data: null };
  if (id) await admin.from("events").update(payload).eq("id", id); else await admin.from("events").insert(payload);
  await audit(actor.id, id ? "event_updated" : "event_created", null, previous, payload);
  revalidatePath("/admin"); revalidatePath("/arena");
}

export async function disableGuestAccess() {
  const { profile: actor } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("arena_settings").update({ guest_access_enabled: false, updated_by: actor.id, updated_at: new Date().toISOString() }).eq("id", 1);
  await audit(actor.id, "guest_access_disabled", null, null, { guest_access_enabled: false });
  revalidatePath("/admin"); revalidatePath("/arena");
}
