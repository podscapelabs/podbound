import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArenaSettings, SiteSettings, UserRole } from "@/lib/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type RecentAccount = {
  id: string;
  display_name: string | null;
  email: string;
  role: UserRole;
  created_at: string;
};

type RecentReport = {
  id: string;
  player_label: string;
  game_id: string;
  submitted_at: string;
  report: { game?: { valid?: boolean } };
};

function fieldAccessLabel(mode: ArenaSettings["access_mode"] | undefined) {
  if (mode === "closed") return "Closed";
  if (mode === "invite_only") return "Playtesters";
  if (mode === "public_event") return "All accounts";
  return "Unknown";
}

function roleLabel(role: UserRole) {
  if (role === "admin") return "Administrator";
  if (role === "playtester") return "Playtester";
  return "Registered";
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [
    { data: settings },
    { data: siteSettings },
    { count: userCount },
    { count: playtesterCount },
    { count: reportCount },
    { data: latestAccounts },
    { data: latestReports },
  ] = await Promise.all([
    admin.from("arena_settings").select("*").eq("id", 1).single(),
    admin.from("site_settings").select("*").eq("id", 1).single(),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "playtester"),
    admin.from("playtest_reports").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id, display_name, email, role, created_at").order("created_at", { ascending: false }).limit(4),
    admin.from("playtest_reports").select("id, player_label, game_id, submitted_at, report").order("submitted_at", { ascending: false }).limit(4),
  ]);

  const arena = settings as ArenaSettings | null;
  const site = siteSettings as SiteSettings | null;
  const accounts = (latestAccounts || []) as RecentAccount[];
  const reports = (latestReports || []) as RecentReport[];
  const fieldLabel = fieldAccessLabel(arena?.access_mode);

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading">
      <div className={styles.headingRow}>
        <div><p className="eyebrow">Restricted workspace</p><h1>Field administration</h1></div>
        <p>Manage PodBound access, account roles, playtest records, and operational safeguards from one focused workspace.</p>
      </div>
      <AdminNav active="overview" />
    </div>

    <section className={styles.statusGrid} aria-label="PodBound operational status">
      <article className={`${styles.statusCard} ${site?.maintenance_enabled ? styles.attention : styles.healthy}`}>
        <span>Public website</span><strong>{site?.maintenance_enabled ? "Maintenance" : "Live"}</strong><small>{site?.maintenance_enabled ? "Normal visitor access is paused" : "Available to visitors"}</small>
      </article>
      <article className={`${styles.statusCard} ${arena?.access_mode === "closed" ? styles.restricted : styles.healthy}`}>
        <span>Arena access</span><strong>{fieldLabel}</strong><small>Guest entry remains disabled</small>
      </article>
      <article className={styles.statusCard}>
        <span>Registered accounts</span><strong>{userCount ?? 0}</strong><small>{playtesterCount ?? 0} approved playtesters</small>
      </article>
      <article className={styles.statusCard}>
        <span>Field reports</span><strong>{reportCount ?? 0}</strong><small>Player-submitted game records</small>
      </article>
    </section>

    <section className={styles.workspaceGrid} aria-label="Administration workspaces">
      <article className={`${styles.panel} ${styles.systemPanel}`}>
        <div className={styles.panelHeading}><div><p className="eyebrow">Operational controls</p><h2>System & access</h2></div><span className={styles.recordMark} aria-hidden="true">01</span></div>
        <div className={styles.controlList}>
          <div><span>Website availability</span><strong>{site?.maintenance_enabled ? "Maintenance mode" : "Public website live"}</strong><small>{site?.maintenance_enabled ? "Administrator and sign-in routes remain available." : "Emergency maintenance controls are standing by."}</small></div>
          <div><span>Arena entry</span><strong>{fieldLabel}</strong><small>{arena?.access_mode === "closed" ? "Only administrators can enter." : arena?.access_mode === "invite_only" ? "Playtesters and administrators can enter." : "Any signed-in account can enter."}</small></div>
        </div>
        <Link className="button primary" href="/admin/system">Open system controls</Link>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeading}><div><p className="eyebrow">Account records</p><h2>Users & playtesters</h2></div><span className={styles.recordMark} aria-hidden="true">02</span></div>
        <div className={styles.summaryPair}><div><span>Total accounts</span><strong>{userCount ?? 0}</strong></div><div><span>Playtesters</span><strong>{playtesterCount ?? 0}</strong></div></div>
        <div className={styles.recordList}>
          {accounts.length ? accounts.map((account) => <div className={styles.record} key={account.id}><div><strong>{account.display_name || "Unnamed account"}</strong><span>{account.email}</span></div><div><span>{roleLabel(account.role)}</span><time dateTime={account.created_at}>{date(account.created_at)}</time></div></div>) : <p className={styles.empty}>No account records yet.</p>}
        </div>
        <Link className="button secondary" href="/admin/users">Manage accounts</Link>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeading}><div><p className="eyebrow">Field archive</p><h2>Latest reports</h2></div><span className={styles.recordMark} aria-hidden="true">03</span></div>
        <div className={styles.recordList}>
          {reports.length ? reports.map((report) => <Link className={styles.reportRecord} href={`/admin/reports/${report.id}`} key={report.id}><div><strong>{report.player_label}</strong><span>{report.game_id}</span></div><div><span className={`${styles.integrity} ${report.report.game?.valid === false ? styles.warning : styles.passed}`}>{report.report.game?.valid === false ? "Review" : "Passed"}</span><time dateTime={report.submitted_at}>{date(report.submitted_at)}</time></div></Link>) : <p className={styles.empty}>No playtest reports yet.</p>}
        </div>
        <Link className="button secondary" href="/admin/reports">Open report inbox</Link>
      </article>

      <aside className={`${styles.panel} ${styles.quickPanel}`} aria-labelledby="quick-actions-title">
        <div className={styles.panelHeading}><div><p className="eyebrow">Direct routes</p><h2 id="quick-actions-title">Quick actions</h2></div><span className={styles.recordMark} aria-hidden="true">04</span></div>
        <nav className={styles.quickLinks} aria-label="Administration quick actions">
          <Link href="/admin/users?role=playtester"><span>Review playtesters</span><small>Account access and roles</small></Link>
          <Link href="/admin/reports?integrity=warning"><span>Review warnings</span><small>Reports needing attention</small></Link>
          <Link href="/admin/system"><span>Check readiness</span><small>Configuration and activity</small></Link>
          <Link href="/account"><span>Return to My Lab</span><small>Player-facing account view</small></Link>
        </nav>
      </aside>
    </section>
  </main>;
}
