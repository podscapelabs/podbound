import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { evaluateArenaAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { getMyLabFoundation } from "@/lib/my-lab";
import { hasAcceptedPlaytestAgreement, PLAYTEST_AGREEMENT } from "@/lib/playtest-agreement";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import { signOut, updateDisplayName } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Lab | PodBound",
  description: "Your private PodBound account, collection, progression, and field records.",
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
      .limit(8),
    getMyLabFoundation(user.id).catch(() => null),
  ]);

  const reports = (reportsResult.data || []) as PlaytestReport[];
  const reportCount = reportsResult.count || 0;
  const progression = foundation?.progression || null;
  const podlings = foundation?.podlings || [];
  const recentExperience = foundation?.recentExperience || [];
  const recentRewards = foundation?.recentRewards || [];
  const activePodling = progression ? podlings.find((podling) => podling.id === progression.active_podling_id) || null : null;
  const activeDefinition = activePodling?.podling_catalog;
  const activeName = activePodling?.custom_name || activeDefinition?.name || null;
  const displayName = profile?.display_name || "Registered playtester";
  const shortId = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const memberSince = formatDate(profile?.created_at || user.created_at);
  const fieldAccess = decision.allowed
    ? profile?.role === "admin" ? "Administrator access" : decision.mode === "public_event" ? "Open account access" : "Playtester access"
    : decision.reason === "closed" ? "Field currently closed" : decision.reason === "awaiting_approval" ? "Awaiting approval" : "Profile setup required";

  const activityItems = [
    ...reports.map((item) => ({
      id: `game-${item.id}`,
      kind: "Field report",
      title: `Submitted game ${item.game_id}`,
      detail: item.report.game?.scores?.join("–") || item.build_version,
      value: item.report.game?.valid === false ? "Review" : "Verified",
      at: item.submitted_at,
    })),
    ...recentExperience.map((entry) => ({
      id: `exp-${entry.id}`,
      kind: "Experience",
      title: entry.reason,
      detail: "Account progression",
      value: `${entry.amount > 0 ? "+" : ""}${entry.amount} EXP`,
      at: entry.created_at,
    })),
    ...recentRewards.map((entry) => ({
      id: `reward-${entry.id}`,
      kind: "Issued record",
      title: entry.reward_label,
      detail: titleCase(entry.action),
      value: "Recorded",
      at: entry.created_at,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);

  return <main id="main" className={styles.lab}>
    <section className={styles.hero}>
      <div className={`${styles.heroInner} shell`}>
        <div>
          <p className={styles.breadcrumb}><Link href="/">PodBound</Link><span aria-hidden="true">/</span>My Lab</p>
          <p className="eyebrow">Private account collection</p>
          <h1>My Lab</h1>
          <p className={styles.heroCopy}>{displayName}&apos;s field records, progression, and Podling collection.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className="button primary" href="/arena">Enter PodBound Field</Link>
          <a className="button secondary" href="#account-settings">Lab settings</a>
        </div>
      </div>
    </section>

    <div className="shell">
      <nav className={styles.sectionNav} aria-label="My Lab sections">
        <a href="#lab-record">Lab record</a><a href="#activity">Activity</a><a href="#collection">Collection</a><a href="#account-settings">Settings</a>
      </nav>

      {notice && notices[notice] && <p className={styles.notice} role="status">{notices[notice]}</p>}

      <section id="lab-record" className={styles.featureGrid}>
        <article className={styles.activeRecord}>
          <div className={styles.panelLabel}>Active Podling record</div>
          <div className={styles.specimenVisual}>
            <Image src="/assets/logos/podbound-isopod.png" alt="" width={1024} height={450} priority />
            <span aria-hidden="true">PL–ACTIVE</span>
          </div>
          <div className={styles.specimenCopy}>
            <div>
              <span>{activeDefinition?.name || "Active specimen"}</span>
              <h2>{activeName || "No Podling selected"}</h2>
              <p>{activePodling ? activeDefinition?.description || "This Podling is recorded as your active companion." : "Your active Podling will appear here after one has been issued and selected."}</p>
            </div>
            <small>{activePodling ? `Unlocked ${formatDate(activePodling.unlocked_at)}` : "Collection pending"}</small>
          </div>
        </article>

        <aside className={styles.progressCard} aria-label="Account progression">
          <p className="eyebrow">Account progression</p>
          <div className={styles.levelMark}><span>Level</span><strong>{progression ? progression.account_level.toString().padStart(2, "0") : "—"}</strong></div>
          <div className={styles.progressStats}>
            <div><span>Total experience</span><strong>{progression ? `${progression.total_exp.toLocaleString("en-CA")} EXP` : "Preparing record"}</strong></div>
            <div><span>Account benefit</span><strong>{progression ? `${formatDiscount(progression.permanent_discount_bps)} discount` : "Not available"}</strong></div>
          </div>
          <small>{progression?.last_exp_at ? `Last recorded ${formatDate(progression.last_exp_at)}` : "No experience recorded yet"}</small>
        </aside>
      </section>

      <section className={styles.metrics} aria-label="Lab overview">
        <article><span>Account role</span><strong>{roleLabel(profile?.role)}</strong><small>Managed by Podscape Labs</small></article>
        <article><span>Field access</span><strong>{fieldAccess}</strong><small>{decision.allowed ? "Available now" : "Account remains active"}</small></article>
        <article><span>Games submitted</span><strong>{reportCount}</strong><small>Verified playtest records</small></article>
        <article><span>Podlings catalogued</span><strong>{podlings.length}</strong><small>{activeName ? `${activeName} is active` : "No active Podling"}</small></article>
      </section>

      <div className={styles.contentGrid}>
        <section id="activity" className={styles.activityPanel}>
          <div className={styles.sectionHeading}><div><p className="eyebrow">Account ledger</p><h2>Recent Lab activity</h2></div><span>{activityItems.length} recent records</span></div>
          {activityItems.length ? <ol className={styles.activityList}>{activityItems.map((item) => <li key={item.id}>
            <span className={styles.activityKind}>{item.kind}</span>
            <div><strong>{item.title}</strong><small>{item.detail} · {formatDateTime(item.at)}</small></div>
            <b>{item.value}</b>
          </li>)}</ol> : <div className={styles.emptyState}><span aria-hidden="true">PL–LOG</span><h3>Your ledger is ready</h3><p>Verified Field games, experience, and issued rewards will appear here.</p></div>}
        </section>

        <aside className={styles.accountPanel}>
          <div className={styles.sectionHeading}><div><p className="eyebrow">Account overview</p><h2>Lab record</h2></div></div>
          <dl>
            <div><dt>Lab reference</dt><dd>PB–{shortId}</dd></div>
            <div><dt>Member since</dt><dd>{memberSince}</dd></div>
            <div><dt>Display name</dt><dd>{displayName}</dd></div>
            <div><dt>Agreement</dt><dd>{agreementAccepted ? `Accepted · ${PLAYTEST_AGREEMENT.version}` : "Not accepted"}</dd></div>
            <div><dt>Loyalty level</dt><dd>{progression?.loyalty_level ?? "—"}</dd></div>
          </dl>
          <Link className={styles.supportLink} href="/contact">Need help with your account? <span>Contact Podscape Labs →</span></Link>
        </aside>
      </div>

      <section id="collection" className={styles.collectionPanel}>
        <div className={styles.sectionHeading}><div><p className="eyebrow">Specimen records</p><h2>Podling collection</h2><p>Podlings belong to your account and share its experience.</p></div><span>{podlings.length} catalogued</span></div>
        {podlings.length ? <div className={styles.collectionGrid}>{podlings.map((podling, index) => {
          const definition = podling.podling_catalog;
          const name = podling.custom_name || definition?.name || "Unnamed Podling";
          const isActive = podling.id === progression?.active_podling_id;
          return <article key={podling.id}>
            <div className={styles.collectionMark}><span>PL–{String(index + 1).padStart(2, "0")}</span><Image src="/assets/logos/podbound-isopod.png" alt="" width={1024} height={450} /></div>
            <div><span>{definition?.name || titleCase(podling.podling_key)}</span>{isActive && <b>Active</b>}</div>
            <h3>{name}</h3><small>Unlocked {formatDate(podling.unlocked_at)}</small>
          </article>;
        })}</div> : <div className={styles.collectionEmpty}>
          <div aria-hidden="true"><span>PL–01</span><Image src="/assets/logos/podbound-isopod.png" alt="" width={1024} height={450} /></div>
          <div><p className="eyebrow">Collection pending</p><h3>Your first Podling has not been issued yet.</h3><p>Approved Podlings will appear here when they are introduced. Your account record is already prepared.</p></div>
        </div>}
      </section>

      <section id="account-settings" className={styles.settingsPanel}>
        <div className={styles.sectionHeading}><div><p className="eyebrow">Lab settings</p><h2>Profile &amp; security</h2><p>Manage the identity used in Field watermarks and your secure account controls.</p></div></div>
        <div className={styles.settingsGrid}>
          <form className={styles.profileForm} action={updateDisplayName}>
            <label htmlFor="displayName">Display name<input id="displayName" name="displayName" required minLength={2} maxLength={40} defaultValue={profile?.display_name || ""} /></label>
            <small>Use 2–40 characters. Your email address remains private.</small>
            <button className="button primary">Save display name</button>
          </form>
          <div className={styles.accountControls}>
            <Link href="/forgot-password"><strong>Account security</strong><span>Request a password reset →</span></Link>
            <Link href="/account/delete"><strong>Account deletion</strong><span>Review deletion instructions →</span></Link>
            {profile?.role === "admin" && <Link href="/admin"><strong>Administration</strong><span>Open admin controls →</span></Link>}
            <form action={signOut}><button><strong>Sign out</strong><span>End this PodBound session →</span></button></form>
          </div>
        </div>
      </section>

      <aside className={styles.testingBar} aria-label="Testing notice"><div><strong>Temporary public simulator test</strong><p>PodBound and its simulator remain in development. Features and records may change during testing.</p></div><Link href="/testing-disclaimer">Read testing notice →</Link></aside>
    </div>
  </main>;
}
