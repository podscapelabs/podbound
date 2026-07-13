import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArenaSettings, SiteSettings } from "@/lib/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: settings }, { data: siteSettings }, { count: userCount }, { count: reportCount }] = await Promise.all([
    admin.from("arena_settings").select("*").eq("id", 1).single(),
    admin.from("site_settings").select("*").eq("id", 1).single(),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("playtest_reports").select("id", { count: "exact", head: true }),
  ]);
  const arena = settings as ArenaSettings;
  const site = siteSettings as SiteSettings | null;
  const fieldLabel = arena?.access_mode === "closed" ? "Closed" : arena?.access_mode === "invite_only" ? "Playtester access" : "Open to accounts";

  return <main id="main" className="admin-page shell"><div className="dashboard-heading"><p className="eyebrow">Restricted record</p><h1>Field administration</h1><AdminNav active="overview" /></div>
    <section className={styles.overviewGrid} aria-label="Administration overview"><article className={styles.overviewCard}><span>Public website</span><strong>{site?.maintenance_enabled ? "Maintenance" : "Live"}</strong><Link href="/admin/system">Manage system →</Link></article><article className={styles.overviewCard}><span>Field access</span><strong>{fieldLabel}</strong><Link href="/admin/system">Manage access →</Link></article><article className={styles.overviewCard}><span>Registered accounts</span><strong>{userCount || 0}</strong><Link href="/admin/users">Manage users →</Link></article><article className={styles.overviewCard}><span>Playtest reports</span><strong>{reportCount || 0}</strong><Link href="/admin/reports">Review reports →</Link></article></section>
    <section className={`admin-section ${styles.modulePreview}`}><div><p className="eyebrow">Access records</p><h2>Users & playtesters</h2><p>{userCount || 0} registered accounts are available for role and access management.</p></div><Link className="button primary" href="/admin/users">Manage accounts</Link></section>
    <section className={`admin-section ${styles.modulePreview}`}><div><p className="eyebrow">Internal records</p><h2>Playtest reports</h2><p>{reportCount || 0} submitted Field reports are available for review.</p></div><Link className="button primary" href="/admin/reports">Open report inbox</Link></section>
    <section className={`admin-section ${styles.modulePreview}`}><div><p className="eyebrow">Operational controls</p><h2>System & access</h2><p>Maintenance mode, Field entry, configuration readiness, and administrator activity.</p></div><Link className="button primary" href="/admin/system">Open system controls</Link></section>
  </main>;
}
