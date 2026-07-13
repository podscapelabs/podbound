import Link from "next/link";
import { evaluateArenaAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { hasAcceptedPlaytestAgreement, PLAYTEST_AGREEMENT } from "@/lib/playtest-agreement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import { signOut, updateDisplayName } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  "display-name-updated": "Your display name has been updated across your PodBound account and future Field sessions.",
  "invalid-display-name": "Display names must contain between 2 and 40 characters.",
};

function roleLabel(role: string | undefined) {
  if (role === "admin") return "Administrator";
  if (role === "playtester") return "Approved playtester";
  return "Registered account";
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { user, profile } = await requireUser();
  const { notice } = await searchParams;
  const admin = createAdminClient();
  const [decision, agreementAccepted, reportsResult] = await Promise.all([
    evaluateArenaAccess(profile),
    hasAcceptedPlaytestAgreement(user.id, null),
    admin.from("playtest_reports")
      .select("id, player_label, game_id, build_version, submitted_at, report", { count: "exact" })
      .eq("account_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  const reports = (reportsResult.data || []) as PlaytestReport[];
  const reportCount = reportsResult.count || 0;
  const fieldAccess = decision.allowed
    ? profile?.role === "admin" ? "Administrator access" : decision.mode === "public_event" ? "Open account access" : "Playtester access"
    : decision.reason === "closed" ? "Field currently closed" : decision.reason === "awaiting_approval" ? "Awaiting approval" : "Profile setup required";
  const memberSince = new Date(profile?.created_at || user.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const latestActivity = reports[0]
    ? new Date(reports[0].submitted_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
    : "No submitted games";
  const shortId = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return <main id="main" className="dashboard shell">
    <header className="dashboard-heading">
      <p className="eyebrow">PodBound account record</p>
      <h1>{profile?.display_name || "Registered playtester"}</h1>
      <div className={styles.headingMeta}><span><i className={styles.statusDot} aria-hidden="true" />Signed in</span><span>{user.email}</span><span>Reference {shortId}</span></div>
    </header>

    {notice && notices[notice] && <p className={styles.notice} role="status">{notices[notice]}</p>}

    <section className={styles.summaryGrid} aria-label="Account summary">
      <article className={styles.summaryCard}><span>Account role</span><strong>{roleLabel(profile?.role)}</strong><small>Managed by Podscape Labs</small></article>
      <article className={styles.summaryCard}><span>Field access</span><strong>{fieldAccess}</strong><small>{decision.allowed ? "Access is available now" : "Your account remains active"}</small></article>
      <article className={styles.summaryCard}><span>Games submitted</span><strong>{reportCount}</strong><small>Verified playtest reports</small></article>
      <article className={styles.summaryCard}><span>Latest activity</span><strong>{latestActivity}</strong><small>Member since {memberSince}</small></article>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Identity</p><h2>Your field record</h2><p>This display name appears in the Field watermark and future submitted reports.</p></div></div>
      <div className={styles.profileGrid}>
        <form className={styles.profileForm} action={updateDisplayName}>
          <label htmlFor="displayName">Display name<input id="displayName" name="displayName" required minLength={2} maxLength={40} defaultValue={profile?.display_name || ""} /></label>
          <small>Use 2–40 characters. Your email address remains private.</small>
          <button className="button primary">Save display name</button>
        </form>
        <dl className={styles.identityRecord}>
          <div><dt>Account email</dt><dd>{user.email}</dd></div>
          <div><dt>Account reference</dt><dd>{shortId}</dd></div>
          <div><dt>Playtest agreement</dt><dd>{agreementAccepted ? `Accepted · ${PLAYTEST_AGREEMENT.version}` : "Not yet accepted"}</dd></div>
        </dl>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Playtest archive</p><h2>Recent submitted games</h2><p>Your five most recent Field reports.</p></div><span>{reportCount} total</span></div>
      {reports.length ? <div className={styles.historyList}>{reports.map((item) => <article className={styles.historyItem} key={item.id}>
        <div><strong>{item.game_id}</strong><span>{new Date(item.submitted_at).toLocaleString("en-CA")}</span></div>
        <div><b>{item.report.game?.scores?.join("–") || "Scores unavailable"}</b><span>{item.report.game?.valid === false ? "Integrity warning" : "Verified game"}</span></div>
        <div><span>{item.report.feedback?.overallFeel || "No overall rating"}</span><span>{item.build_version}</span></div>
      </article>)}</div> : <p className={styles.empty}>No submitted games yet. Enter the PodBound Field when your access is available to begin your record.</p>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Account controls</p><h2>Security and support</h2><p>Password changes remain handled by the secure authentication provider.</p></div></div>
      <div className={styles.securityGrid}>
        <article className={styles.securityCard}><h3>PodBound Field</h3><p>Review your current access state and enter the controlled simulator.</p><Link className="button primary" href="/arena">Check Field access</Link></article>
        <article className={styles.securityCard}><h3>Account security</h3><p>Request a secure recovery link to update your password.</p><Link className="button secondary" href="/forgot-password">Reset password</Link></article>
        <article className={styles.securityCard}><h3>Account deletion</h3><p>Ask Podscape Labs to remove your account and associated personal data.</p><Link className="button secondary" href="/account/delete">Request deletion</Link></article>
      </div>
    </section>

    <div className="actions">{profile?.role === "admin" && <Link className="button secondary" href="/admin">Open administration</Link>}<form action={signOut}><button className="button secondary">Sign out</button></form></div>
  </main>;
}
