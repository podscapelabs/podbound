import Link from "next/link";
import { siteContent } from "@/content/site";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import { signOut } from "@/app/account/actions";
import { hasAcceptedPlaytestAgreement, PLAYTEST_AGREEMENT } from "@/lib/playtest-agreement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import { acceptPlaytestAgreement, enterAsGuest, leaveEvent } from "./actions";

export const dynamic = "force-dynamic";

const messages = {
  closed: "The PodBound Arena is currently closed.",
  awaiting_approval: "Your account has been created successfully. Your account is currently awaiting playtester approval.",
  event_inactive: "Guest entry is not available for the current event.",
};

export default async function ArenaPage() {
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  const guest = user ? null : await getGuestSession();

  if (!decision.allowed) {
    if (decision.reason === "login_required") return <main id="main" className="access-page shell"><p className="eyebrow">Arena access</p><h1>Sign in required</h1><p>Sign in to continue. New accounts remain pending until approved for invite-only playtesting.</p><div className="actions"><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in</Link><Link className="button secondary" href="/register">Register</Link></div></main>;
    return <main id="main" className="access-page shell"><p className="eyebrow">Arena access</p><h1>Access notice</h1><p>{messages[decision.reason]}</p><Link className="text-link" href="/">Return to the field archive →</Link></main>;
  }

  if (decision.kind === "guest" && !guest) {
    return <main id="main" className="access-page shell"><p className="eyebrow">Public event</p><h1>{decision.event?.title || "Enter the Arena"}</h1><p>{decision.event?.description || "Temporary guest access is available for this official event."}</p><div className="choice-grid"><div><h2>Account access</h2><div className="actions"><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in</Link><Link className="button secondary" href="/register">Register</Link></div></div><form className="auth-form" action={enterAsGuest}><h2>Continue as guest</h2><label>Temporary display name<input name="displayName" required minLength={2} maxLength={40} /></label>{decision.event?.join_code && <label>Public join code<input name="joinCode" required autoComplete="off" /></label>}<button className="button primary">Enter event</button><small>Guest progress and match history are temporary and are not linked to an account.</small></form></div></main>;
  }

  const agreementAccepted = await hasAcceptedPlaytestAgreement(user?.id || null, guest?.id || null);
  if (!agreementAccepted) {
    return <main id="main" className="agreement-gate"><section className="agreement-dialog" role="dialog" aria-modal="true" aria-labelledby="agreement-title"><p className="eyebrow">Required before entry</p><h1 id="agreement-title">{PLAYTEST_AGREEMENT.title}</h1><p>{PLAYTEST_AGREEMENT.introduction}</p><ol>{PLAYTEST_AGREEMENT.terms.map((term) => <li key={term}>{term}</li>)}</ol><form action={acceptPlaytestAgreement}><label className="agreement-check"><input type="checkbox" name="agreementAccepted" value="yes" required /><span>I have read and agree to these playtest conditions.</span></label><button className="button primary">Agree and enter the Arena</button></form>{user ? <form action={signOut}><button className="button secondary">Decline and sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Decline and leave event</button></form>}<small>Agreement version {PLAYTEST_AGREEMENT.version}</small></section></main>;
  }

  const displayName = profile?.display_name || guest?.display_name || user?.email || "Guest researcher";
  const role = profile?.role || "event guest";
  const accessModeLabel = decision.mode === "closed" ? "closed" : decision.mode === "invite_only" ? "playtester access" : "open to accounts";
  const admin = createAdminClient();
  let reportsQuery = admin.from("playtest_reports")
    .select("id, player_label, game_id, build_version, submitted_at, report", { count: "exact" })
    .order("submitted_at", { ascending: false }).limit(5);
  reportsQuery = user ? reportsQuery.eq("account_id", user.id) : reportsQuery.eq("guest_session_id", guest!.id);
  const { data: rawReports, count: reportCount } = await reportsQuery;
  const reports = (rawReports || []) as PlaytestReport[];

  return <main id="main" className="dashboard shell">
    <div className="dashboard-heading"><p className="eyebrow">PodBound Arena</p><h1>Welcome, {displayName}</h1><p>{role.replace("_", " ")} · {accessModeLabel}</p></div>
    <section className="dashboard-launch"><div><p className="eyebrow">Current controlled build</p><h2>{siteContent.testBuild}</h2><p>Play a verified ten-round game, add your observations, and submit the report directly to Podscape Labs.</p></div><Link className="button primary" href="/arena/play">Launch PodBound</Link></section>
    <div className="record-grid arena-records"><article className="record"><span>Arena access</span><strong>{role === "admin" ? "Administrator" : role === "playtester" ? "Approved playtester" : "Event guest"}</strong></article><article className="record"><span>Agreement</span><strong>Current version accepted</strong></article><article className="record"><span>Reports submitted</span><strong>{reportCount || 0}</strong></article><article className="record"><span>Latest activity</span><strong>{reports[0] ? new Date(reports[0].submitted_at).toLocaleDateString("en-CA") : "No submitted games"}</strong></article></div>
    <section className="dashboard-history"><div className="dashboard-section-title"><div><p className="eyebrow">Your records</p><h2>Recent submitted games</h2></div><span>{reportCount || 0} total</span></div>{reports.length ? <div className="game-history-list">{reports.map((item) => <article key={item.id}><div><strong>{item.game_id}</strong><span>{new Date(item.submitted_at).toLocaleString("en-CA")}</span></div><div><b>{item.report.game?.scores?.join("–") || "Scores unavailable"}</b><span>{item.report.game?.valid === false ? "Integrity warning" : "Verified game"}</span></div><div><span>{item.report.feedback?.overallFeel || "No overall rating"}</span><span>{item.build_version}</span></div></article>)}</div> : <p className="dashboard-empty">Complete a game and submit its report to start your playtest history.</p>}</section>
    <div className="actions">{user ? <form action={signOut}><button className="button secondary">Sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Leave event</button></form>}</div>
  </main>;
}
