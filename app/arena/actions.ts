"use server";

import { redirect } from "next/navigation";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { clearGuestSession, createGuestSession } from "@/lib/guest";

export async function enterAsGuest(formData: FormData) {
  const displayName = String(formData.get("displayName") || "").trim();
  const joinCode = String(formData.get("joinCode") || "").trim();
  if (displayName.length < 2 || displayName.length > 40) redirect("/arena?error=display-name");
  const { profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  if (!decision.allowed || decision.kind !== "guest" || !decision.event) redirect("/arena?error=event-closed");
  try { await createGuestSession(decision.event.id, displayName, joinCode || null); }
  catch { redirect("/arena?error=guest-entry"); }
  redirect("/arena");
}

export async function leaveEvent() { await clearGuestSession(); redirect("/"); }
