import Link from "next/link";
import { siteContent } from "@/content/site";
import { evaluateArenaAccess } from "@/lib/access";
import { getViewer } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import { signOut } from "@/app/account/actions";
import { enterAsGuest, leaveEvent } from "./actions";

export const dynamic = "force-dynamic";

const messages = {
  closed: "The PodBound Arena is currently closed.",
  awaiting_approval: "Your account has been created successfully. Your account is currently awaiting playtester approval.",
  event_inactive: "Guest entry is not available for the current event.",
};

export default async function ArenaPage() {
  const { user, profile } = await getViewer();
  const decision = await evaluateArenaAccess(profile);
  const guest = user ? null : await getGuestSession();

  if (!decision.allowed) {
    if (decision.reason === "login_required") return <main id="main" className="access-page shell"><p className="eyebrow">Arena access</p><h1>Sign in required</h1><p>Sign in to continue. New accounts remain pending until approved for invite-only playtesting.</p><div className="actions"><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in</Link><Link className="button secondary" href="/register">Register</Link></div></main>;
    return <main id="main" className="access-page shell"><p className="eyebrow">Arena access</p><h1>Access notice</h1><p>{messages[decision.reason]}</p><Link className="text-link" href="/">Return to the field archive →</Link></main>;
  }

  if (decision.kind === "guest" && !guest) {
    return <main id="main" className="access-page shell"><p className="eyebrow">Public event</p><h1>{decision.event?.title || "Enter the Arena"}</h1><p>{decision.event?.description || "Temporary guest access is available for this official event."}</p><div className="choice-grid"><div><h2>Account access</h2><div className="actions"><Link className="button primary" href="/sign-in?returnTo=/arena">Sign in</Link><Link className="button secondary" href="/register">Register</Link></div></div><form className="auth-form" action={enterAsGuest}><h2>Continue as guest</h2><label>Temporary display name<input name="displayName" required minLength={2} maxLength={40} /></label>{decision.event?.join_code && <label>Public join code<input name="joinCode" required autoComplete="off" /></label>}<button className="button primary">Enter event</button><small>Guest progress and match history are temporary and are not linked to an account.</small></form></div></main>;
  }

  const displayName = profile?.display_name || guest?.display_name || user?.email || "Guest researcher";
  const role = profile?.role || "event guest";
  return <main id="main" className="dashboard shell"><div className="dashboard-heading"><p className="eyebrow">PodBound Arena</p><h1>Welcome, {displayName}</h1><p>{role} · {decision.mode.replace("_", " ")}</p></div><div className="record-grid arena-records"><article className="record"><span>Current test build</span><strong>{siteContent.testBuild}</strong></article><article className="record"><span>Research EXP</span><strong>Not yet enabled</strong></article><article className="record"><span>Podling</span><strong>Coming later</strong></article><article className="record"><span>Recent activity</span><strong>No recorded matches</strong></article></div><button className="button primary" disabled>Launch PodBound — coming soon</button>{user ? <form action={signOut}><button className="button secondary">Sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Leave event</button></form>}</main>;
}
