import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaytestReport } from "@/lib/types";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

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

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading"><p className="eyebrow">Restricted record</p><h1>Game audit</h1><AdminNav active="reports" /></div>
    <article className={styles.detailsPage}>
      <p><Link className="text-link" href="/admin/reports">← Return to report inbox</Link></p>
      <h2>{item.player_label} · {item.game_id}</h2>
      <p><time dateTime={item.submitted_at}>{new Date(item.submitted_at).toLocaleString("en-CA")}</time> · {item.build_version} · Report {item.id.slice(0, 8).toUpperCase()}</p>
      <details className={styles.raw} open><summary>Complete submitted report</summary><pre>{JSON.stringify(item.report, null, 2)}</pre></details>
    </article>
  </main>;
}
