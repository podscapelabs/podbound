"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const { user } = await requireUser("/account");
  const displayName = String(formData.get("displayName") || "").trim();
  if (displayName.length < 2 || displayName.length > 40) {
    redirect("/account?notice=invalid-display-name");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ display_name: displayName }).eq("id", user.id);
  if (error) throw new Error("The display name could not be updated.");

  revalidatePath("/account");
  revalidatePath("/arena");
  redirect("/account?notice=display-name-updated");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
