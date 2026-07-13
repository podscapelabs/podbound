import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AccountPage() {
  const { user, profile } = await requireUser();
  return <main id="main" className="dashboard shell"><div className="dashboard-heading"><p className="eyebrow">Account record</p><h1>{profile?.display_name || "Registered playtester"}</h1><p>{user.email}</p></div><div className="record-grid"><article className="record"><span>Role</span><strong>{profile?.role || "registered"}</strong></article><article className="record"><span>Field access</span><strong>{profile?.role === "registered" ? "Awaiting approval" : "Approved"}</strong></article></div><div className="actions"><Link className="button primary" href="/arena">Check Field access</Link>{profile?.role === "admin" && <Link className="button secondary" href="/admin">Open administration</Link>}<form action={signOut}><button className="button secondary">Sign out</button></form></div></main>;
}
