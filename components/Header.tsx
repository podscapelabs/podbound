import Link from "next/link";
import Image from "next/image";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const { user } = await getViewer();
  const accountLink = user ? "/account" : "/sign-in";
  const accountLabel = user ? "Account" : "Sign in";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand-lockup" href="/" aria-label="PodBound home"><span className="isopod-crop header-isopod"><Image src="/assets/logos/podbound-isopod.png" alt="" width={1024} height={450} priority /></span><span className="wordmark">PodBound™</span></Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/#about">About</Link>
          <Link href="/arena">PodBound Field</Link>
          {user && <Link href="/my-lab">My Lab</Link>}
          <Link href={accountLink}>{accountLabel}</Link>
          {!user && <Link className="nav-cta" href="/register">Register</Link>}
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Open primary navigation">Menu</summary>
          <nav aria-label="Mobile primary navigation">
            <Link href="/#about">About</Link>
            <Link href="/arena">PodBound Field</Link>
            {user && <Link href="/my-lab">My Lab</Link>}
            <Link href={accountLink}>{accountLabel}</Link>
            {!user && <Link className="nav-cta" href="/register">Register</Link>}
          </nav>
        </details>
      </div>
    </header>
  );
}
