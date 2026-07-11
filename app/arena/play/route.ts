import { readFile } from "node:fs/promises";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const simulatorDocument = new URL("./simulator.html", import.meta.url);

export async function GET() {
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);

  if (!decision.allowed) {
    return new Response("PodBound Arena access is not available.", {
      status: user ? 403 : 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (decision.kind === "guest" && !(await getGuestSession())) {
    return new Response("A valid event guest session is required.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const html = await readFile(simulatorDocument, "utf8");
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
