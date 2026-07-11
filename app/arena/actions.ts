"use server";

import { redirect } from "next/navigation";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { clearGuestSession, createGuestSession, getGuestSession } from "@/lib/guest";
import { recordPlaytestAgreement } from "@/lib/playtest-agreement";

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

export async function acceptPlaytestAgreement(formData: FormData) {
  if (formData.get("agreementAccepted") !== "yes") redirect("/arena?error=agreement-required");
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  if (!decision.allowed) redirect("/arena");
  const guest = user ? null : await getGuestSession();
  if (decision.kind === "guest" && !guest) redirect("/arena");
  await recordPlaytestAgreement(user?.id || null, guest?.id || null);
  redirect("/arena");
}
