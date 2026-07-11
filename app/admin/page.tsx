import { ConfirmForm } from "@/components/ConfirmForm";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArenaSettings, PlaytestReport, PodboundEvent, Profile } from "@/lib/types";
import { changeRole, disableGuestAccess, saveEvent, updateArenaMode } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const admin = createAdminClient();
  let usersQuery = admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (q.trim()) usersQuery = usersQuery.or(`email.ilike.%${q.replace(/[%_,()]/g, "")}%,display_name.ilike.%${q.replace(/[%_,()]/g, "")}%`);
  const [{ data: users }, { data: settings }, { data: event }, { data: logs }, { data: reports }] = await Promise.all([
    usersQuery,
    admin.from("arena_settings").select("*").eq("id", 1).single(),
    admin.from("events").select("*").order("starts_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("playtest_reports").select("id, player_label, game_id, build_version, submitted_at, report").order("submitted_at", { ascending: false }).limit(50),
  ]);
  const arena = settings as ArenaSettings;
  const currentEvent = event as PodboundEvent | null;

  return <main id="main" className="admin-page shell"><div className="dashboard-heading"><p className="eyebrow">Restricted record</p><h1>Arena administration</h1></div>
    <section className="admin-section"><h2>Access mode</h2><div className="mode-grid">{(["closed", "invite_only", "public_event"] as const).map((mode) => <ConfirmForm key={mode} action={updateArenaMode} message={`Change Arena access to ${mode.replace("_", " ")}?`}><input type="hidden" name="mode" value={mode} /><button className={`mode-button ${arena?.access_mode === mode ? "active" : ""}`}>{mode.replace("_", " ")}</button></ConfirmForm>)}</div><ConfirmForm action={disableGuestAccess} message="Disable all guest access now?"><button className="button secondary">Disable guest access</button></ConfirmForm></section>
    <section className="admin-section"><h2>Public event</h2><form className="admin-form" action={saveEvent}>{currentEvent && <input type="hidden" name="id" value={currentEvent.id} />}<label>Title<input name="title" defaultValue={currentEvent?.title || ""} required /></label><label>Description<textarea name="description" defaultValue={currentEvent?.description || ""} /></label><div className="form-grid"><label>Starts<input name="startsAt" type="datetime-local" required defaultValue={currentEvent?.starts_at?.slice(0,16)} /></label><label>Ends<input name="endsAt" type="datetime-local" required defaultValue={currentEvent?.ends_at?.slice(0,16)} /></label><label>Join code<input name="joinCode" defaultValue={currentEvent?.join_code || ""} /></label><label>Unguessable URL token<input name="publicToken" defaultValue={currentEvent?.public_token || ""} /></label><label>Maximum guests<input name="maxGuests" type="number" min="1" max="1000" defaultValue={currentEvent?.max_guests || 100} /></label><label>Status<select name="status" defaultValue={currentEvent?.status || "draft"}><option>draft</option><option>scheduled</option><option>active</option><option>ended</option><option>cancelled</option></select></label></div><label className="check"><input name="guestAccess" type="checkbox" defaultChecked={currentEvent?.guest_access_enabled} /> Guest access enabled</label><label className="check"><input name="progression" type="checkbox" defaultChecked={currentEvent?.progression_enabled} /> Signed-in progression enabled</label><button className="button primary">Save event</button></form></section>
    <section className="admin-section"><div className="admin-title-row"><h2>Registered users</h2><form><label className="sr-only" htmlFor="q">Search users</label><input id="q" name="q" placeholder="Search email or display name" defaultValue={q} /><button className="button secondary">Search</button></form></div><div className="user-list">{(users as Profile[] | null)?.map((user) => <article className="user-row" key={user.id}><div><strong>{user.display_name || "Unnamed account"}</strong><span>{user.email}</span></div><span>{user.role}</span><ConfirmForm action={changeRole} message={`Change ${user.email} to playtester?`}><input type="hidden" name="targetId" value={user.id} /><input type="hidden" name="role" value="playtester" /><button>Approve</button></ConfirmForm><ConfirmForm action={changeRole} message={`Revoke playtester access for ${user.email}?`}><input type="hidden" name="targetId" value={user.id} /><input type="hidden" name="role" value="registered" /><button>Revoke</button></ConfirmForm><ConfirmForm action={changeRole} message={`Grant administrator access to ${user.email}?`}><input type="hidden" name="targetId" value={user.id} /><input type="hidden" name="role" value="admin" /><button>Make admin</button></ConfirmForm></article>)}</div></section>
    <section className="admin-section"><h2>Submitted playtest reports</h2><div className="audit-list">{(reports as PlaytestReport[] | null)?.length ? (reports as PlaytestReport[]).map((item) => <article className="record" key={item.id}><span><time>{new Date(item.submitted_at).toLocaleString("en-CA")}</time> · {item.build_version}</span><strong>{item.player_label} · {item.game_id}</strong><p>Scores: {item.report.game?.scores?.join("–") || "Not recorded"} · {item.report.game?.valid === false ? "Integrity warning" : "Valid"}</p>{item.report.feedback?.overallFeel && <p>Overall: {item.report.feedback.overallFeel}</p>}{item.report.feedback?.highlight && <p>Best moment: {item.report.feedback.highlight}</p>}{item.report.feedback?.confusion && <p>Needs review: {item.report.feedback.confusion}</p>}</article>) : <p>No reports submitted yet.</p>}</div></section>
    <section className="admin-section"><h2>Recent access changes</h2><div className="audit-list">{logs?.map((log) => <p key={log.id}><time>{new Date(log.created_at).toLocaleString("en-CA")}</time> — {log.action}</p>)}</div></section>
  </main>;
}
