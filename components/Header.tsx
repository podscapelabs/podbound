import Link from "next/link";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const { user } = await getViewer();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/">PodBound™</Link>
        <nav aria-label="Primary navigation">
          <Link href="/#about">About</Link>
          <Link href="/arena">Arena</Link>
          {user ? <Link href="/account">Account</Link> : <Link href="/sign-in">Sign in</Link>}
          {!user && <Link className="nav-cta" href="/register">Register</Link>}
        </nav>
      </div>
    </header>
  );
}
