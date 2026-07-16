import { NextRequest } from "next/server";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import {
  checkPlaytestReportSubmissionLimit,
  findExistingPlaytestReport,
} from "@/lib/playtest-report-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAcceptedPlaytestAgreement } from "@/lib/playtest-agreement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REPORT_BYTES = 450_000;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) throw new Error("origin mismatch");
    } catch {
      return Response.json({ error: "Invalid submission origin." }, { status: 403 });
    }
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REPORT_BYTES) {
    return Response.json({ error: "Report is too large." }, { status: 413 });
  }

  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  if (!decision.allowed) {
    return Response.json({ error: "PodBound Field access is not available." }, { status: user ? 403 : 401 });
  }

  const guest = user ? null : await getGuestSession();
  if (decision.kind === "guest" && !guest) {
    return Response.json({ error: "A valid event guest session is required." }, { status: 401 });
  }
  if (!(await hasAcceptedPlaytestAgreement(user?.id || null, guest?.id || null))) {
    return Response.json({ error: "The current playtest agreement must be accepted." }, { status: 403 });
  }

  const actor = {
    accountId: user?.id || null,
    guestSessionId: guest?.id || null,
  };
  try {
    const submissionLimit = await checkPlaytestReportSubmissionLimit(actor);
    if (!submissionLimit.allowed) {
      return Response.json(
        { error: "Too many reports were submitted. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(submissionLimit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch (error) {
    console.error("Playtest report submission guard failed", error instanceof Error ? error.message : "unknown");
    return Response.json(
      { error: "Report submission is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid report." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid report." }, { status: 400 });
  }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_REPORT_BYTES) {
    return Response.json({ error: "Report is too large." }, { status: 413 });
  }

  const report = body as Record<string, unknown>;
  const game = report.game && typeof report.game === "object" ? report.game as Record<string, unknown> : null;
  const gameId = typeof game?.gameId === "string" ? game.gameId.slice(0, 120) : "unknown-game";
  const appVersion = typeof report.appVersion === "string" ? report.appVersion.slice(0, 80) : "unknown";
  const playerLabel = (profile?.display_name || guest?.display_name || "Playtester").slice(0, 40);

  try {
    const existingReport = await findExistingPlaytestReport(actor, gameId);
    if (existingReport) {
      return Response.json({
        ok: true,
        id: existingReport.id,
        submittedAt: existingReport.submitted_at,
        duplicate: true,
      });
    }
  } catch (error) {
    console.error("Playtest report duplicate guard failed", error instanceof Error ? error.message : "unknown");
    return Response.json(
      { error: "Report submission is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("playtest_reports").insert({
    account_id: user?.id || null,
    guest_session_id: guest?.id || null,
    event_id: decision.event?.id || guest?.event_id || null,
    player_label: playerLabel,
    game_id: gameId,
    build_version: appVersion,
    report,
  }).select("id, submitted_at").single();

  if (error) {
    console.error("Playtest report insert failed", error.code);
    return Response.json({ error: "The report could not be saved." }, { status: 500 });
  }
  return Response.json({ ok: true, id: data.id, submittedAt: data.submitted_at });
}
