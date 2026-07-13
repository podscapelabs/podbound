import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;
type IntegrityFilter = "all" | "valid" | "warning";
type ReportSearch = { q?: string; integrity?: string; from?: string; to?: string; page?: string };

function one(value: string | undefined) { return value || ""; }
function cleanSearch(value: string) { return value.trim().replace(/[^a-zA-Z0-9 .:@-]/g, "").slice(0, 100); }
function cleanDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? String(value) : "—"; }
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : "—"; }
function shortId(value: string | null) { return value ? value.slice(0, 8).toUpperCase() : "—"; }

function pageHref(filters: { q: string; integrity: IntegrityFilter; from: string; to: string }, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.integrity !== "all") params.set("integrity", filters.integrity);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/reports${query ? `?${query}` : ""}`;
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<ReportSearch> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = cleanSearch(one(params.q));
  const integrity: IntegrityFilter = params.integrity === "valid" || params.integrity === "warning" ? params.integrity : "all";
  const from = cleanDate(one(params.from));
  const to = cleanDate(one(params.to));
  const requestedPage = Math.max(1, Math.min(1000, Number.parseInt(one(params.page) || "1", 10) || 1));
  const admin = createAdminClient();

  let reportsQuery = admin.from("playtest_reports")
    .select("id, account_id, guest_session_id, event_id, player_label, game_id, build_version, submitted_at, report", { count: "exact" })
    .order("submitted_at", { ascending: false });
  if (q) reportsQuery = reportsQuery.or(`player_label.ilike.%${q}%,game_id.ilike.%${q}%,build_version.ilike.%${q}%`);
  if (integrity === "valid") reportsQuery = reportsQuery.contains("report", { game: { valid: true } });
  if (integrity === "warning") reportsQuery = reportsQuery.contains("report", { game: { valid: false } });
  if (from) reportsQuery = reportsQuery.gte("submitted_at", `${from}T00:00:00.000Z`);
  if (to) reportsQuery = reportsQuery.lte("submitted_at", `${to}T23:59:59.999Z`);
  reportsQuery = reportsQuery.range((requestedPage - 1) * PAGE_SIZE, requestedPage * PAGE_SIZE - 1);

  const [{ data, count, error }, totalResult, validResult, warningResult] = await Promise.all([
    reportsQuery,
    admin.from("playtest_reports").select("id", { count: "exact", head: true }),
    admin.from("playtest_reports").select("id", { count: "exact", head: true }).contains("report", { game: { valid: true } }),
    admin.from("playtest_reports").select("id", { count: "exact", head: true }).contains("report", { game: { valid: false } }),
  ]);
  if (error) throw new Error("Playtest reports could not be loaded.");
  const reports = (data || []) as PlaytestReport[];
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const filterState = { q, integrity, from, to };

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading"><div className={styles.headingRow}><div><p className="eyebrow">Restricted record</p><h1>Playtest reports</h1></div><p>Review submitted Field games, player feedback, integrity warnings, and complete internal audits.</p></div><AdminNav active="reports" /></div>

    <section className={styles.stats} aria-label="Report totals">
      <article className={styles.stat}><span>All reports</span><strong>{totalResult.count || 0}</strong></article>
      <article className={styles.stat}><span>Integrity passed</span><strong>{validResult.count || 0}</strong></article>
      <article className={styles.stat}><span>Integrity warnings</span><strong>{warningResult.count || 0}</strong></article>
    </section>

    <form className={styles.filters}>
      <label>Search<input type="search" name="q" defaultValue={q} placeholder="Player, game ID, or build" /></label>
      <label>Integrity<select name="integrity" defaultValue={integrity}><option value="all">All reports</option><option value="valid">Passed</option><option value="warning">Warnings</option></select></label>
      <label>From<input type="date" name="from" defaultValue={from} /></label>
      <label>To<input type="date" name="to" defaultValue={to} /></label>
      <div className={styles.filterActions}><button className="button primary">Filter</button><Link className="button secondary" href="/admin/reports">Clear</Link></div>
    </form>

    <div className={styles.resultsMeta}><span>{count || 0} matching reports</span><span>Newest first · {PAGE_SIZE} per page</span></div>
    {reports.length ? <section className={styles.reportList} aria-label="Submitted playtest reports">{reports.map((item) => {
      const game = item.report.game;
      const feedback = item.report.feedback;
      const integrityErrors = game?.integrity?.errors || [];
      const integrityWarnings = game?.integrity?.warnings || game?.suspiciousWarnings || [];
      const humanIndex = typeof game?.humanIndex === "number" ? game.humanIndex : 0;
      const botIndex = typeof game?.botIndex === "number" ? game.botIndex : 1;
      const players = game?.players || [];
      const valid = game?.valid !== false;
      return <details className={styles.report} key={item.id}>
        <summary><div className={styles.primary}><strong>{item.player_label} · {item.game_id}</strong><span><time dateTime={item.submitted_at}>{new Date(item.submitted_at).toLocaleString("en-CA")}</time> · {item.build_version}</span></div><div className={styles.facts}><span className={`${styles.pill} ${valid ? styles.valid : styles.warning}`}>{valid ? "Integrity passed" : "Integrity warning"}</span><span className={styles.pill}>Scores {game?.scores?.join("–") || "—"}</span><span className={styles.pill}>{feedback?.overallFeel || "No rating"}</span></div></summary>
        <div className={styles.details}>
          <div className={styles.summaryGrid}>
            <div><span>Player species</span><strong>{text(players[humanIndex]?.species)}</strong></div>
            <div><span>Bot species</span><strong>{text(players[botIndex]?.species)}</strong></div>
            <div><span>Rounds recorded</span><strong>{game?.roundRecords?.length || 0}</strong></div>
            <div><span>Account reference</span><strong>{shortId(item.account_id || item.guest_session_id)}</strong></div>
          </div>
          <h3>Player feedback</h3>
          <div className={styles.feedbackGrid}>
            <div><span>Overall feel</span><p>{text(feedback?.overallFeel)}</p></div>
            <div><span>Rules clarity</span><p>{text(feedback?.rulesClarity)}</p></div>
            <div><span>Species felt meaningful</span><p>{text(feedback?.speciesMeaningful)}</p></div>
            <div><span>Forecast felt meaningful</span><p>{text(feedback?.forecastMeaningful)}</p></div>
            <div><span>Best moment</span><p>{text(feedback?.highlight)}</p></div>
            <div><span>Needs review</span><p>{text(feedback?.confusion)}</p></div>
            <div><span>General notes</span><p>{text(feedback?.generalNotes)}</p></div>
            <div><span>Final player state</span><p>Population {number(players[humanIndex]?.population)} · Stress {number(players[humanIndex]?.stress)}</p></div>
          </div>
          {(integrityErrors.length > 0 || integrityWarnings.length > 0) && <><h3>Integrity record</h3><ul>{integrityErrors.map((message, index) => <li key={`error-${index}`}>Error: {message}</li>)}{integrityWarnings.map((message, index) => <li key={`warning-${index}`}>Warning: {message}</li>)}</ul></>}
          <p className={styles.auditLink}><Link className="button secondary" href={`/admin/reports/${item.id}`}>Open complete game audit</Link></p>
        </div>
      </details>;
    })}</section> : <div className={styles.empty}><h2>No matching reports</h2><p>Try clearing the filters or wait for the next Field submission.</p></div>}

    {totalPages > 1 && <nav className={styles.pagination} aria-label="Report pages">{currentPage > 1 ? <Link className="button secondary" href={pageHref(filterState, currentPage - 1)}>Previous</Link> : null}<span>Page {currentPage} of {totalPages}</span>{currentPage < totalPages ? <Link className="button secondary" href={pageHref(filterState, currentPage + 1)}>Next</Link> : null}</nav>}
  </main>;
}
