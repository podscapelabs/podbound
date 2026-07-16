import type { Metadata } from "next";
import Link from "next/link";
import { evaluateArenaAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { hasAcceptedPlaytestAgreement, PLAYTEST_AGREEMENT } from "@/lib/playtest-agreement";
import { getMyLabFoundation } from "@/lib/my-lab";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import { signOut, updateDisplayName } from "./actions";
import styles from "./page.module.css";
import labStyles from "../my-lab/page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Lab | PodBound",
  description: "Your PodBound account, progression, Podlings, and field records.",
};

const notices: Record<string, string> = {
  "display-name-updated": "Your display name has been updated across your PodBound account and future Field sessions.",
  "invalid-display-name": "Display names must contain between 2 and 40 characters.",
};

function roleLabel(role: string | undefined) {
  if (role === "admin") return "Administrator";
  if (role === "playtester") return "Approved playtester";
  return "Registered account";
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function formatDiscount(basisPoints: number) {
  if (!basisPoints) return "None";
  return `${(basisPoints / 100).toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { user, profile } = await requireUser();
  const { notice } = await searchParams;
  const admin = createAdminClient();
  const [decision, agreementAccepted, reportsResult, foundation] = await Promise.all([
    evaluateArenaAccess(profile),
    hasAcceptedPlaytestAgreement(user.id, null),
    admin.from("playtest_reports")
      .select("id, player_label, game_id, build_version, submitted_at, report", { count: "exact" })
      .eq("account_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
    getMyLabFoundation(user.id).catch(() => null),
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
  const progression = foundation?.progression || null;
  const podlings = foundation?.podlings || [];
  const recentExperience = foundation?.recentExperience || [];
  const recentRewards = foundation?.recentRewards || [];
  const activePodling = progression ? podlings.find((podling) => podling.id === progression.active_podling_id) || null : null;
  return <main id="main" className="dashboard shell">
    <header className="dashboard-heading">
      <p className="eyebrow">Private account collection</p>
      <h1>My Lab</h1>
      <div className={styles.headingMeta}><span><i className={styles.statusDot} aria-hidden="true" />Signed in as {profile?.display_name || "Registered playtester"}</span><span>{user.email}</span><span>Reference {shortId}</span></div>
    </header>

    <nav className={styles.accountNav} aria-label="My Lab sections"><a href="#overview">Overview</a><a href="#collection">Collection</a><a href="#activity">Activity</a><a href="#settings">Profile &amp; security</a></nav>

    {notice && notices[notice] && <p className={styles.notice} role="status">{notices[notice]}</p>}

    <section id="overview" className={`${styles.summaryGrid} ${styles.anchorTarget}`} aria-label="Account summary">
      <article className={styles.summaryCard}><span>Account role</span><strong>{roleLabel(profile?.role)}</strong><small>Managed by Podscape Labs</small></article>
      <article className={styles.summaryCard}><span>Field access</span><strong>{fieldAccess}</strong><small>{decision.allowed ? "Access is available now" : "Your account remains active"}</small></article>
      <article className={styles.summaryCard}><span>Games submitted</span><strong>{reportCount}</strong><small>Verified playtest reports</small></article>
      <article className={styles.summaryCard}><span>Latest activity</span><strong>{latestActivity}</strong><small>Member since {memberSince}</small></article>
    </section>

    {progression ? <>
      <section className={labStyles.ledger} aria-label="Progression summary">
        <article><span>Total experience</span><strong>{progression.total_exp.toLocaleString("en-CA")} EXP</strong><small>{progression.last_exp_at ? `Last recorded ${formatDate(progression.last_exp_at)}` : "No experience recorded yet"}</small></article>
        <article><span>Loyalty level</span><strong>{progression.loyalty_level}</strong><small>Shared across your Podscape account</small></article>
        <article><span>Permanent discount</span><strong>{formatDiscount(progression.permanent_discount_bps)}</strong><small>{titleCase(progression.discount_tier)} tier · maximum 10%</small></article>
        <article><span>Podling collection</span><strong>{podlings.length}</strong><small>{activePodling ? `${activePodling.custom_name || activePodling.podling_catalog?.name || "Podling"} is active` : "No active Podling selected"}</small></article>
      </section>

      <section id="collection" className={`${labStyles.collection} ${styles.anchorTarget}`}>
        <div className={labStyles.sectionHeading}><div><p className="eyebrow">Specimen records</p><h2>Your Podlings</h2><p>Podlings belong to your account and share its experience. They do not hold separate EXP.</p></div><span>{podlings.length} catalogued</span></div>
        {podlings.length ? <div className={labStyles.podlingGrid}>{podlings.map((podling, index) => {
          const definition = podling.podling_catalog;
          const name = podling.custom_name || definition?.name || "Unnamed Podling";
          const isActive = podling.id === progression.active_podling_id;
          return <article className={labStyles.podlingCard} key={podling.id}>
            <div className={labStyles.specimenMark} aria-hidden="true">PL–{String(index + 1).padStart(2, "0")}</div>
            <div className={labStyles.podlingPortrait} aria-hidden="true"><span>Specimen record</span></div>
            <div className={labStyles.podlingCopy}><div><span>{definition?.name || titleCase(podling.podling_key)}</span>{isActive && <b>Active</b>}</div><h3>{name}</h3><p>{definition?.description || "Further field notes will be added as this Podling is documented."}</p><small>Unlocked {formatDate(podling.unlocked_at)}</small></div>
          </article>;
        })}</div> : <div className={labStyles.emptyCollection}>
          <div className={labStyles.emptyPlate} aria-hidden="true"><span>PL–01</span><i /></div>
          <div><p className="eyebrow">Collection pending</p><h3>Your first Podling has not been issued yet.</h3><p>Approved Podlings will appear here when they are introduced. Your account progression is already recording safely in the background.</p></div>
        </div>}
      </section>

      <div className={labStyles.archiveGrid}>
        <section className={labStyles.archive}>
          <div className={labStyles.sectionHeading}><div><p className="eyebrow">Account ledger</p><h2>Experience history</h2></div><span>{recentExperience.length} records</span></div>
          {recentExperience.length ? <ol className={labStyles.recordList}>{recentExperience.map((entry) => <li key={entry.id}><div><strong>{entry.amount > 0 ? `+${entry.amount}` : entry.amount} EXP</strong><span>{entry.reason}</span></div><time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time></li>)}</ol> : <p className={labStyles.emptyText}>No EXP entries yet. Server-verified activity will appear here when progression begins.</p>}
        </section>
        <section className={labStyles.archive}>
          <div className={labStyles.sectionHeading}><div><p className="eyebrow">Issued records</p><h2>Rewards</h2></div><span>{recentRewards.length} records</span></div>
          {recentRewards.length ? <ol className={labStyles.recordList}>{recentRewards.map((entry) => <li key={entry.id}><div><strong>{entry.reward_label}</strong><span>{titleCase(entry.action)}</span></div><time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time></li>)}</ol> : <p className={labStyles.emptyText}>No rewards issued yet. Future entitlements and account rewards will be recorded here.</p>}
        </section>
      </div>
    </> : <section id="collection" className={`${styles.labPending} ${styles.anchorTarget}`} role="status"><span aria-hidden="true">PL–00</span><div><p className="eyebrow">Collection pending</p><h2>Your Lab record is being prepared</h2><p>Account settings and Field access remain available while your progression record is initialized.</p></div></section>}

    <section id="activity" className={`${styles.section} ${styles.anchorTarget}`}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Playtest archive</p><h2>Recent submitted games</h2><p>Your five most recent Field reports.</p></div><span>{reportCount} total</span></div>
      {reports.length ? <div className={styles.historyList}>{reports.map((item) => <article className={styles.historyItem} key={item.id}>
        <div><strong>{item.game_id}</strong><span>{new Date(item.submitted_at).toLocaleString("en-CA")}</span></div>
        <div><b>{item.report.game?.scores?.join("–") || "Scores unavailable"}</b><span>{item.report.game?.valid === false ? "Integrity warning" : "Verified game"}</span></div>
        <div><span>{item.report.feedback?.overallFeel || "No overall rating"}</span><span>{item.build_version}</span></div>
      </article>)}</div> : <p className={styles.empty}>No submitted games yet. Enter the PodBound Field when your access is available to begin your record.</p>}
    </section>

    <section id="settings" className={`${styles.section} ${styles.anchorTarget}`}>
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
