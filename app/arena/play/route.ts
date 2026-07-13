import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import { hasAcceptedPlaytestAgreement } from "@/lib/playtest-agreement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const simulatorDocument = new URL("./simulator.html", import.meta.url);

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function GET(request: NextRequest) {
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);

  if (!decision.allowed) {
    return new Response("PodBound Field access is not available.", {
      status: user ? 403 : 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const guest = user ? null : await getGuestSession();
  if (decision.kind === "guest" && !guest) {
    return new Response("A valid event guest session is required.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (!(await hasAcceptedPlaytestAgreement(user?.id || null, guest?.id || null))) {
    return Response.redirect(new URL("/arena?notice=agreement-required", request.url), 303);
  }

  const playerId = user?.id || guest?.id || "unknown";
  const identity = {
    displayName: profile?.display_name || guest?.display_name || "Playtester",
    shortId: playerId.replace(/-/g, "").slice(0, 8).toUpperCase(),
  };
  const html = (await readFile(simulatorDocument, "utf8"))
    .replace("__PODBOUND_PLAYER_IDENTITY__", safeJson(identity));
  return new Response(html, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
    },
  });
}
