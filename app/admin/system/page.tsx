import { AdminNav } from "@/components/AdminNav";
import { ConfirmForm } from "@/components/ConfirmForm";
import { siteContent } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessMode, ArenaSettings, Profile, SiteSettings } from "@/lib/types";
import { setMaintenanceMode, updateArenaMode } from "../actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: number;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  previous_value: unknown;
  new_value: unknown;
  created_at: string;
};

const accessModes: Array<{ value: AccessMode; label: string; description: string }> = [
  { value: "closed", label: "Closed", description: "Administrators only" },
  { value: "invite_only", label: "Playtester access", description: "Playtesters and administrators" },
  { value: "public_event", label: "Open to accounts", description: "Any signed-in account" },
];

const actionLabels: Record<string, string> = {
  role_changed: "Account role changed",
  arena_mode_changed: "Field access mode changed",
  site_maintenance_enabled: "Website maintenance enabled",
  site_maintenance_disabled: "Website maintenance disabled",
  event_created: "Public event created",
  event_updated: "Public event updated",
  guest_access_disabled: "Guest access disabled",
};

function shortId(value: string | null) { return value ? value.slice(0, 8).toUpperCase() : "—"; }

export default async function AdminSystemPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: settings }, { data: siteSettings }, { data: logs, error: logError }] = await Promise.all([
    admin.from("arena_settings").select("*").eq("id", 1).single(),
    admin.from("site_settings").select("*").eq("id", 1).single(),
    admin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  if (logError) throw new Error("Administrative activity could not be loaded.");
  const arena = settings as ArenaSettings;
  const site = siteSettings as SiteSettings | null;
  const auditLogs = (logs || []) as AuditLog[];
  const profileIds = [...new Set(auditLogs.flatMap((log) => [log.admin_id, log.target_user_id].filter(Boolean) as string[]))];
  const { data: people } = profileIds.length ? await admin.from("profiles").select("id, display_name, email, role").in("id", profileIds) : { data: [] };
  const peopleById = new Map((people as Pick<Profile, "id" | "display_name" | "email" | "role">[] | null || []).map((person) => [person.id, person]));
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const siteUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const supportConfigured = Boolean(siteContent.supportEmail && siteContent.supportEmail.includes("@"));
  const authEmailHourlyLimit = Number.parseInt(process.env.AUTH_EMAIL_HOURLY_LIMIT || "2", 10);
  const fieldMode = accessModes.find((mode) => mode.value === arena?.access_mode);
  const configChecks = [
    { label: "Authentication connection", detail: "Public and server-only Supabase configuration is present.", ready: authConfigured, manual: false },
    { label: "Canonical website URL", detail: "A production site URL is available for authentication callbacks.", ready: siteUrlConfigured, manual: false },
    { label: "Support contact", detail: `Requests currently route to ${siteContent.supportEmail}.`, ready: supportConfigured, manual: false },
    { label: "Authentication email protection", detail: `Application cooldowns and a ${authEmailHourlyLimit}-request hourly sending budget are active. SMTP delivery still requires dashboard review.`, ready: true, manual: false },
    { label: "Authentication email provider", detail: "Review custom SMTP, provider quotas, templates, and recent failures in Supabase. The last documented review found the built-in sender limited to 2 emails per hour.", ready: false, manual: true },
  ];

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading"><div className={styles.headingRow}><div><p className="eyebrow">Restricted controls</p><h1>System & access</h1></div><p>Control website availability, PodBound Field entry, configuration readiness, and administrator activity.</p></div><AdminNav active="system" /></div>

    <section className={styles.statusGrid} aria-label="Current system status">
      <article className={`${styles.status} ${site?.maintenance_enabled ? styles.danger : styles.good}`}><span>Public website</span><strong>{site?.maintenance_enabled ? "Maintenance" : "Live"}</strong></article>
      <article className={`${styles.status} ${arena?.access_mode === "closed" ? styles.review : styles.good}`}><span>Field access</span><strong>{fieldMode?.label || "Unknown"}</strong></article>
      <article className={`${styles.status} ${authConfigured ? styles.good : styles.danger}`}><span>Authentication</span><strong>{authConfigured ? "Configured" : "Attention needed"}</strong></article>
      <article className={`${styles.status} ${styles.review}`}><span>Email delivery</span><strong>{authEmailHourlyLimit}/hour app budget</strong></article>
    </section>

    <section className="admin-section"><h2>Website availability</h2><p><strong>{site?.maintenance_enabled ? "Maintenance mode is active." : "The public website is live."}</strong></p><p className={styles.sectionIntro}>{site?.maintenance_enabled ? "Normal pages and APIs are unavailable. Administrator and sign-in routes remain accessible so you can restore service." : "Use this emergency switch to replace the public site with a maintenance notice."}</p><ConfirmForm action={setMaintenanceMode} message={site?.maintenance_enabled ? "Take the PodBound website live again?" : "Enable maintenance mode and make the PodBound website inaccessible to normal visitors?"}><input type="hidden" name="enabled" value={site?.maintenance_enabled ? "false" : "true"} /><button className={`button ${site?.maintenance_enabled ? "primary" : "secondary"}`}>{site?.maintenance_enabled ? "Take website live" : "Enable maintenance mode"}</button></ConfirmForm></section>

    <section className="admin-section"><h2>PodBound Field access</h2><p className={styles.sectionIntro}>Choose who can enter the simulator. Guest entry remains disabled in every mode.</p><div className={styles.accessGrid}>{accessModes.map((mode) => <ConfirmForm key={mode.value} action={updateArenaMode} message={`Change Field access to ${mode.label}?`}><input type="hidden" name="mode" value={mode.value} /><button className={`${styles.accessOption} ${arena?.access_mode === mode.value ? styles.active : ""}`}><strong>{mode.label}</strong><span>{mode.description}</span>{arena?.access_mode === mode.value && <small>Current setting</small>}</button></ConfirmForm>)}</div></section>

    <section className="admin-section"><h2>Configuration readiness</h2><p className={styles.sectionIntro}>These checks report presence only. Secret values are never rendered or sent to the browser.</p><div className={styles.configList}>{configChecks.map((check) => <article className={styles.configItem} key={check.label}><div><strong>{check.label}</strong><span>{check.detail}</span></div><span className={`${styles.configState} ${check.manual ? styles.review : check.ready ? styles.good : styles.danger}`}>{check.manual ? "Review required" : check.ready ? "Present" : "Missing"}</span></article>)}</div></section>

    <section className="admin-section"><h2>Administrator activity</h2><p className={styles.sectionIntro}>The latest 50 sensitive account, access, event, and maintenance changes.</p><div className={styles.auditList}>{auditLogs.length ? auditLogs.map((log) => {
      const actor = peopleById.get(log.admin_id);
      const target = log.target_user_id ? peopleById.get(log.target_user_id) : null;
      return <article className={styles.audit} key={log.id}><div className={styles.auditHeader}><strong>{actionLabels[log.action] || log.action.replaceAll("_", " ")}</strong><time dateTime={log.created_at}>{new Date(log.created_at).toLocaleString("en-CA")}</time></div><p>By {actor?.display_name || actor?.email || shortId(log.admin_id)}{log.target_user_id ? ` · Account ${target?.display_name || target?.email || shortId(log.target_user_id)}` : ""}</p><details><summary>Change record</summary><pre>{JSON.stringify({ previous: log.previous_value, next: log.new_value }, null, 2)}</pre></details></article>;
    }) : <p>No administrative changes have been recorded.</p>}</div></section>
  </main>;
}
