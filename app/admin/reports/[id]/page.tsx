import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "Not recorded";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

function shortId(value: string | null) {
  return value ? value.slice(0, 8).toUpperCase() : "—";
}

export default async function AdminReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const admin = createAdminClient();
  const { data, error } = await admin.from("playtest_reports")
    .select("id, account_id, guest_session_id, event_id, player_label, game_id, build_version, submitted_at, report")
    .eq("id", id)
    .single();
  if (error || !data) notFound();
  const item = data as PlaytestReport;
  const game = item.report.game;
  const feedback = item.report.feedback;
  const players = game?.players || [];
  const humanIndex = typeof game?.humanIndex === "number" ? game.humanIndex : 0;
  const botIndex = typeof game?.botIndex === "number" ? game.botIndex : 1;
  const integrityErrors = game?.integrity?.errors || [];
  const integrityWarnings = game?.integrity?.warnings || game?.suspiciousWarnings || [];
  const valid = game?.valid !== false;
  const accountReference = shortId(item.account_id || item.guest_session_id);
  const facts = [
    { label: "Submitted", value: new Date(item.submitted_at).toLocaleString("en-CA") },
    { label: "Build", value: item.build_version },
    { label: "Account reference", value: accountReference },
    { label: "Rounds recorded", value: String(game?.roundRecords?.length || 0) },
    { label: "App version", value: text(item.report.appVersion) },
    { label: "Rules engine", value: text(item.report.rulesEngine) },
    { label: "Balance baseline", value: text(item.report.balanceBaseline) },
    { label: "Event reference", value: shortId(item.event_id) },
  ];
  const feedbackFields = [
    { label: "Overall feel", value: feedback?.overallFeel },
    { label: "Rules clarity", value: feedback?.rulesClarity },
    { label: "Species felt meaningful", value: feedback?.speciesMeaningful },
    { label: "Forecast felt meaningful", value: feedback?.forecastMeaningful },
    { label: "Best moment", value: feedback?.highlight },
    { label: "Needs review", value: feedback?.confusion },
    { label: "General notes", value: feedback?.generalNotes },
  ];

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading"><p className="eyebrow">Restricted record</p><h1>Game audit</h1><AdminNav active="reports" /></div>
    <p className={styles.backLink}><Link className="text-link" href="/admin/reports">← Return to report inbox</Link></p>

    <header className={styles.auditHero}>
      <div><p className="eyebrow">Field report · {item.id.slice(0, 8).toUpperCase()}</p><h2>{item.player_label}</h2><span>{item.game_id}</span></div>
      <span className={`${styles.auditStatus} ${valid ? styles.valid : styles.warning}`}>{valid ? "Integrity passed" : "Review required"}</span>
    </header>

    <section className={styles.auditFacts} aria-label="Report metadata">{facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</section>

    <div className={styles.auditWorkspace}>
      <section className={styles.auditSection} aria-labelledby="participants-title">
        <div className={styles.auditSectionHeading}><p className="eyebrow">Final state</p><h2 id="participants-title">Participants</h2></div>
        <div className={styles.playerGrid}>{players.length ? players.map((player, index) => <article className={styles.playerCard} key={`${index}-${player.species || "unknown"}`}><div><span>{index === humanIndex ? "Player" : index === botIndex ? "Bot" : `Participant ${index + 1}`}</span><strong>{text(player.species)}</strong></div><dl><div><dt>Population</dt><dd>{number(player.population)}</dd></div><div><dt>Stress</dt><dd>{number(player.stress)}</dd></div><div><dt>Stash</dt><dd>{Array.isArray(player.stash) ? player.stash.length : "—"}</dd></div><div><dt>Score</dt><dd>{number(game?.scores?.[index])}</dd></div></dl></article>) : <p className={styles.auditEmpty}>Participant data was not recorded by this build.</p>}</div>
      </section>

      <section className={`${styles.auditSection} ${valid ? styles.integrityPassed : styles.integrityReview}`} aria-labelledby="integrity-title">
        <div className={styles.auditSectionHeading}><p className="eyebrow">Validation record</p><h2 id="integrity-title">Integrity</h2></div>
        <p className={styles.integritySummary}>{valid ? "The submitted game did not report an integrity failure." : "The submitted game was marked invalid and requires administrator review."}</p>
        {integrityErrors.length > 0 && <div className={styles.findings}><strong>Errors</strong><ul>{integrityErrors.map((message, index) => <li key={`error-${index}`}>{message}</li>)}</ul></div>}
        {integrityWarnings.length > 0 && <div className={styles.findings}><strong>Warnings</strong><ul>{integrityWarnings.map((message, index) => <li key={`warning-${index}`}>{message}</li>)}</ul></div>}
        {!integrityErrors.length && !integrityWarnings.length && <p className={styles.auditEmpty}>No integrity findings were recorded.</p>}
      </section>
    </div>

    <section className={styles.auditSection} aria-labelledby="feedback-title">
      <div className={styles.auditSectionHeading}><p className="eyebrow">Player notes</p><h2 id="feedback-title">Feedback</h2></div>
      <div className={styles.auditFeedback}>{feedbackFields.map((field) => <div key={field.label}><span>{field.label}</span><p>{text(field.value)}</p></div>)}</div>
    </section>

    <details className={`${styles.raw} ${styles.rawAudit}`}><summary>Complete submitted report · JSON</summary><pre>{JSON.stringify(item.report, null, 2)}</pre></details>
  </main>;
}
