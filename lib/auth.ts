import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export async function getViewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile: data as Profile | null };
}

export async function requireUser(returnTo = "/account") {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  return viewer as { user: NonNullable<typeof viewer.user>; profile: Profile | null };
}

export async function requireAdmin() {
  const viewer = await requireUser("/admin");
  if (viewer.profile?.role !== "admin") redirect("/arena?notice=admin-required");
  return viewer as { user: NonNullable<typeof viewer.user>; profile: Profile };
}
