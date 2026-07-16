import Link from "next/link";
import { siteContent } from "@/content/site";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import { signOut } from "@/app/account/actions";
import { hasAcceptedPlaytestAgreement, PLAYTEST_AGREEMENT, PUBLIC_TESTING_NOTICE } from "@/lib/playtest-agreement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import { acceptPlaytestAgreement, enterAsGuest, leaveEvent } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const messages = {
  closed: "The PodBound Field is currently closed.",
  awaiting_approval: "Your account has been created successfully. Your account is currently awaiting playtester approval.",
  event_inactive: "Guest entry is not available for the current event.",
};

export default async function ArenaPage() {
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  const guest = user ? null : await getGuestSession();

  if (!decision.allowed) {
    if (decision.reason === "login_required") return <main id="main" className={`${styles.gatePage} shell`}><section className={styles.gateCard} aria-labelledby="access-title"><div className={styles.gateHeader}><div><p className="eyebrow">PodBound Arena</p><h1 id="access-title">Sign in required</h1></div><span>Access checkpoint</span></div><p className={styles.gateLead}>Sign in to continue. New accounts remain pending until approved for invite-only playtesting.</p><div className={styles.gateNotice}><strong>Temporary public simulator test</strong><p>{PUBLIC_TESTING_NOTICE}</p></div><div className={styles.gateActions}><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in to continue</Link><Link className="button secondary" href="/register">Create account</Link></div><nav className={styles.gateLinks} aria-label="Testing policies"><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></section></main>;
    return <main id="main" className={`${styles.gatePage} shell`}><section className={styles.gateCard} aria-labelledby="access-title"><div className={styles.gateHeader}><div><p className="eyebrow">PodBound Arena</p><h1 id="access-title">Access notice</h1></div><span>Entry unavailable</span></div><p className={styles.gateLead}>{messages[decision.reason]}</p><div className={styles.gateNotice}><strong>Temporary public simulator test</strong><p>{PUBLIC_TESTING_NOTICE}</p></div><div className={styles.gateActions}><Link className="button primary" href="/">Return to PodBound</Link><Link className="button secondary" href="/testing-disclaimer">Read testing notice</Link></div></section></main>;
  }

  if (decision.kind === "guest" && !guest) {
    return <main id="main" className={`${styles.gatePage} shell`}><section className={`${styles.gateCard} ${styles.eventCard}`} aria-labelledby="event-title"><div className={styles.gateHeader}><div><p className="eyebrow">Official public event</p><h1 id="event-title">{decision.event?.title || "Enter the Arena"}</h1></div><span>Temporary access</span></div><p className={styles.gateLead}>{decision.event?.description || "Temporary guest access is available for this official event."}</p><div className={styles.choiceGrid}><article><span>Existing account</span><h2>Keep your Field records</h2><p>Sign in to connect submitted games and activity to your PodBound account.</p><div className={styles.choiceActions}><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in</Link><Link className="button secondary" href="/register">Create account</Link></div></article><form className={styles.guestForm} action={enterAsGuest}><span>Event guest</span><h2>Continue temporarily</h2><p>Guest progress and match history are temporary and are not linked to an account.</p><label>Temporary display name<input name="displayName" required minLength={2} maxLength={40} /></label>{decision.event?.join_code && <label>Public join code<input name="joinCode" required autoComplete="off" /></label>}<button className="button primary">Continue as guest</button></form></div><nav className={styles.gateLinks} aria-label="Testing policies"><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></section></main>;
  }

  const agreementAccepted = await hasAcceptedPlaytestAgreement(user?.id || null, guest?.id || null);
  if (!agreementAccepted) {
    return <main id="main" className={styles.agreementGate}><section className={styles.agreementDialog} role="dialog" aria-modal="true" aria-labelledby="agreement-title"><header><div><p className="eyebrow">Required before entry</p><h1 id="agreement-title">{PLAYTEST_AGREEMENT.title}</h1></div><span>Version {PLAYTEST_AGREEMENT.version}</span></header><div className={styles.agreementNotice}><strong>Temporary public simulator test</strong><p>{PUBLIC_TESTING_NOTICE}</p></div><p className={styles.agreementIntro}>{PLAYTEST_AGREEMENT.introduction}</p><ol className={styles.agreementTerms}>{PLAYTEST_AGREEMENT.terms.map((term) => <li key={term}>{term}</li>)}</ol><nav className={styles.agreementLinks} aria-label="Agreement documents"><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></nav><div className={styles.agreementActions}><form action={acceptPlaytestAgreement}><label className={styles.agreementCheck}><input type="checkbox" name="agreementAccepted" value="yes" required /><span>I have read and agree to these playtest conditions.</span></label><button className="button primary">Agree and enter the Arena</button></form>{user ? <form action={signOut}><button className="button secondary">Decline and sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Decline and leave event</button></form>}</div></section></main>;
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

  return <main id="main" className={`dashboard shell ${styles.arena}`}>
    <div className={styles.heading}><div><p className="eyebrow">PodBound Arena</p><h1>Welcome, {displayName}</h1><p>{role.replace("_", " ")} · {accessModeLabel}</p></div>{user && <Link className="button secondary" href="/account">Return to My Lab</Link>}</div>

    <section className={styles.launch} aria-labelledby="current-build-title">
      <div className={styles.launchCopy}><div className={styles.buildLabel}><span>Current controlled build</span><strong>Field access active</strong></div><h2 id="current-build-title">{siteContent.testBuild}</h2><p>Play a ten-round game, add your observations, and submit the report directly to Podscape Labs.</p><div className={styles.launchActions}><Link className="button primary" href="/arena/play">Enter the Arena</Link><Link href="/testing-disclaimer">Review testing notice</Link></div></div>
      <div className={styles.launchRecord} aria-label="Current access record"><span>Access holder</span><strong>{displayName}</strong><dl><div><dt>Role</dt><dd>{role === "admin" ? "Administrator" : role === "playtester" ? "Playtester" : "Event guest"}</dd></div><div><dt>Agreement</dt><dd>Accepted</dd></div><div><dt>Reports</dt><dd>{reportCount || 0}</dd></div></dl></div>
    </section>

    <aside className={styles.testingNotice}><div><strong>Temporary public simulator test</strong><p>{PUBLIC_TESTING_NOTICE}</p></div><p><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></p></aside>

    <section className={styles.statusStrip} aria-label="Arena account status"><article><span>Field access</span><strong>{role === "admin" ? "Administrator" : role === "playtester" ? "Approved playtester" : "Event guest"}</strong></article><article><span>Agreement</span><strong>Current version accepted</strong></article><article><span>Reports submitted</span><strong>{reportCount || 0}</strong></article><article><span>Latest activity</span><strong>{reports[0] ? new Date(reports[0].submitted_at).toLocaleDateString("en-CA") : "No submitted games"}</strong></article></section>

    <section className={styles.history}><div className={styles.sectionTitle}><div><p className="eyebrow">Your Field records</p><h2>Recent submitted games</h2></div><span>{reportCount || 0} total</span></div>{reports.length ? <div className={styles.historyList}>{reports.map((item) => <article key={item.id}><div><strong>{item.game_id}</strong><span>{new Date(item.submitted_at).toLocaleString("en-CA")}</span></div><div><b>{item.report.game?.scores?.join("–") || "Scores unavailable"}</b><span className={item.report.game?.valid === false ? styles.warning : styles.passed}>{item.report.game?.valid === false ? "Integrity warning" : "Integrity passed"}</span></div><div><span>{item.report.feedback?.overallFeel || "No overall rating"}</span><span>{item.build_version}</span></div></article>)}</div> : <p className={styles.empty}>Complete a game and submit its report to start your playtest history.</p>}</section>

    <div className={styles.sessionAction}>{user ? <form action={signOut}><button className="button secondary">Sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Leave event</button></form>}</div>
  </main>;
}
