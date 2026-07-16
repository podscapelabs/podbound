import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { ConfirmForm } from "@/components/ConfirmForm";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/lib/types";
import { changeRole } from "../actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
type RoleFilter = "all" | UserRole;
type UserSearch = { q?: string; role?: string; page?: string };

function cleanSearch(value: string) { return value.trim().replace(/[^a-zA-Z0-9 .:@'_-]/g, "").slice(0, 100); }
function roleLabel(role: UserRole) { return role === "admin" ? "Administrator" : role === "playtester" ? "Playtester" : "Registered"; }
function date(value: string | null) { return value ? new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "Not yet"; }

function pageHref(filters: { q: string; role: RoleFilter }, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role !== "all") params.set("role", filters.role);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/users${query ? `?${query}` : ""}`;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<UserSearch> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = cleanSearch(params.q || "");
  const role: RoleFilter = params.role === "registered" || params.role === "playtester" || params.role === "admin" ? params.role : "all";
  const requestedPage = Math.max(1, Math.min(1000, Number.parseInt(params.page || "1", 10) || 1));
  const admin = createAdminClient();
  let usersQuery = admin.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (q) usersQuery = usersQuery.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (role !== "all") usersQuery = usersQuery.eq("role", role);
  usersQuery = usersQuery.range((requestedPage - 1) * PAGE_SIZE, requestedPage * PAGE_SIZE - 1);

  const [{ data, count, error }, totalResult, registeredResult, playtesterResult, adminResult] = await Promise.all([
    usersQuery,
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "registered"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "playtester"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
  ]);
  if (error) throw new Error("Registered users could not be loaded.");
  const users = (data || []) as Profile[];
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const filterState = { q, role };
  if ((count || 0) > 0 && requestedPage > totalPages) redirect(pageHref(filterState, totalPages));
  const currentPage = Math.min(requestedPage, totalPages);

  return <main id="main" className="admin-page shell">
    <div className="dashboard-heading"><div className={styles.headingRow}><div><p className="eyebrow">Restricted record</p><h1>Users & playtesters</h1></div><p>Review registered accounts and control who receives PodBound Field playtester or administrator access.</p></div><AdminNav active="users" /></div>

    <section className={styles.stats} aria-label="Account totals">
      <Link className={`${styles.stat} ${role === "all" ? styles.activeStat : ""}`} href="/admin/users"><span>All accounts</span><strong>{totalResult.count || 0}</strong><small>Complete registry</small></Link>
      <Link className={`${styles.stat} ${role === "registered" ? styles.activeStat : ""}`} href="/admin/users?role=registered"><span>Registered</span><strong>{registeredResult.count || 0}</strong><small>Standard accounts</small></Link>
      <Link className={`${styles.stat} ${role === "playtester" ? styles.activeStat : ""}`} href="/admin/users?role=playtester"><span>Playtesters</span><strong>{playtesterResult.count || 0}</strong><small>Arena-approved accounts</small></Link>
      <Link className={`${styles.stat} ${role === "admin" ? styles.activeStat : ""}`} href="/admin/users?role=admin"><span>Administrators</span><strong>{adminResult.count || 0}</strong><small>Restricted access</small></Link>
    </section>

    <section className={styles.registry} aria-labelledby="account-registry-title">
    <div className={styles.registryHeading}><div><p className="eyebrow">Account registry</p><h2 id="account-registry-title">Find an account</h2></div><p>Search by display name or email, then open a record to review details or change its access role.</p></div>
    <form className={styles.filters}>
      <label>Search<input type="search" name="q" defaultValue={q} placeholder="Display name or email" /></label>
      <label>Account role<select name="role" defaultValue={role}><option value="all">All roles</option><option value="registered">Registered</option><option value="playtester">Playtester</option><option value="admin">Administrator</option></select></label>
      <div className={styles.filterActions}><button className="button primary">Filter</button><Link className="button secondary" href="/admin/users">Clear</Link></div>
    </form>

    <div className={styles.resultsMeta}><span>{count || 0} matching accounts</span><span>Newest first · {PAGE_SIZE} per page</span></div>
    {users.length ? <div className={styles.userList} aria-label="Registered users">{users.map((user) => <details className={styles.user} key={user.id}>
      <summary><div className={styles.identity}><strong>{user.display_name || "Unnamed account"}</strong><span>{user.email}</span></div><span className={`${styles.roleBadge} ${styles[user.role]}`}>{roleLabel(user.role)}</span><div className={styles.summaryFact}><span>Created</span><strong>{date(user.created_at)}</strong></div><div className={styles.summaryFact}><span>Account ref</span><strong>{user.id.slice(0, 8).toUpperCase()}</strong></div><span className={styles.disclosure} aria-hidden="true">+</span></summary>
      <div className={styles.userDetails}><div className={styles.metadata}><div><span>Created</span><strong>{date(user.created_at)}</strong></div><div><span>Access granted</span><strong>{date(user.approved_at)}</strong></div><div><span>Updated</span><strong>{date(user.updated_at)}</strong></div><div><span>Account reference</span><strong>{user.id.slice(0, 8).toUpperCase()}</strong></div></div>
      <div className={styles.roleControl}><div><span>Access control</span><p>Role changes take effect immediately and are recorded in administrator activity.</p></div><ConfirmForm action={changeRole} message={`Change ${user.email} from ${roleLabel(user.role)} to the selected role?`}><div className={styles.roleForm}><input type="hidden" name="targetId" value={user.id} /><label>Change role<select name="role" defaultValue={user.role}><option value="registered">Registered</option><option value="playtester">Playtester</option><option value="admin">Administrator</option></select></label><button className="button secondary">Save role</button></div></ConfirmForm></div></div>
    </details>)}</div> : <div className={styles.empty}><h2>No matching accounts</h2><p>Try clearing the filters or searching a different name or email.</p></div>}

    {totalPages > 1 && <nav className={styles.pagination} aria-label="User pages">{currentPage > 1 ? <Link className="button secondary" href={pageHref(filterState, currentPage - 1)}>Previous</Link> : null}<span>Page {currentPage} of {totalPages}</span>{currentPage < totalPages ? <Link className="button secondary" href={pageHref(filterState, currentPage + 1)}>Next</Link> : null}</nav>}
    </section>
  </main>;
}
