import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { ConfirmForm } from "@/components/ConfirmForm";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArenaSettings, SiteSettings } from "@/lib/types";
import { setMaintenanceMode, updateArenaMode } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: settings }, { data: siteSettings }, { data: logs }, { count: userCount }, { count: reportCount }] = await Promise.all([
    admin.from("arena_settings").select("*").eq("id", 1).single(),
    admin.from("site_settings").select("*").eq("id", 1).single(),
    admin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("playtest_reports").select("id", { count: "exact", head: true }),
  ]);
  const arena = settings as ArenaSettings;
  const site = siteSettings as SiteSettings | null;
  const accessModes = [
    { value: "closed", label: "Closed", description: "Administrators only" },
    { value: "invite_only", label: "Playtester access", description: "Playtesters and administrators" },
    { value: "public_event", label: "Open to accounts", description: "Any signed-in account" },
  ] as const;

  return <main id="main" className="admin-page shell"><div className="dashboard-heading"><p className="eyebrow">Restricted record</p><h1>Field administration</h1><AdminNav active="overview" /></div>
    <section className="admin-section"><h2>Website availability</h2><p><strong>{site?.maintenance_enabled ? "Maintenance mode is active." : "The public website is live."}</strong></p><p>{site?.maintenance_enabled ? "Normal pages and APIs are unavailable. Administrator and sign-in routes remain accessible so you can restore service." : "Use this emergency switch to replace the public site with a maintenance notice."}</p><ConfirmForm action={setMaintenanceMode} message={site?.maintenance_enabled ? "Take the PodBound website live again?" : "Enable maintenance mode and make the PodBound website inaccessible to normal visitors?"}><input type="hidden" name="enabled" value={site?.maintenance_enabled ? "false" : "true"} /><button className={`button ${site?.maintenance_enabled ? "primary" : "secondary"}`}>{site?.maintenance_enabled ? "Take website live" : "Enable maintenance mode"}</button></ConfirmForm></section>
    <section className="admin-section"><h2>Field access</h2><p className={styles.sectionIntro}>Choose who can enter the simulator. Guest and public-event entry are disabled in every mode.</p><div className={styles.accessGrid}>{accessModes.map((mode) => <ConfirmForm key={mode.value} action={updateArenaMode} message={`Change Field access to ${mode.label}?`}><input type="hidden" name="mode" value={mode.value} /><button className={`${styles.accessOption} ${arena?.access_mode === mode.value ? styles.active : ""}`}><strong>{mode.label}</strong><span>{mode.description}</span>{arena?.access_mode === mode.value && <small>Current setting</small>}</button></ConfirmForm>)}</div></section>
    <section className={`admin-section ${styles.modulePreview}`}><div><p className="eyebrow">Access records</p><h2>Users & playtesters</h2><p>{userCount || 0} registered accounts are available for role and access management.</p></div><Link className="button primary" href="/admin/users">Manage accounts</Link></section>
    <section className={`admin-section ${styles.modulePreview}`}><div><p className="eyebrow">Internal records</p><h2>Playtest reports</h2><p>{reportCount || 0} submitted Field reports are available for review.</p></div><Link className="button primary" href="/admin/reports">Open report inbox</Link></section>
    <section className="admin-section"><h2>Recent access changes</h2><div className="audit-list">{logs?.map((log) => <p key={log.id}><time>{new Date(log.created_at).toLocaleString("en-CA")}</time> — {log.action}</p>)}</div></section>
  </main>;
}
