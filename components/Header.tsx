import Link from "next/link";
import Image from "next/image";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const { user } = await getViewer();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand-lockup" href="/" aria-label="PodBound home"><span className="isopod-crop header-isopod"><Image src="/assets/logos/podbound-isopod.png" alt="" width={1024} height={450} priority /></span><span className="wordmark">PodBound™</span></Link>
        <nav aria-label="Primary navigation">
          <Link href="/#about">About</Link>
          <Link href="/arena">PodBound Field</Link>
          {user ? <Link href="/account">Account</Link> : <Link href="/sign-in">Sign in</Link>}
          {!user && <Link className="nav-cta" href="/register">Register</Link>}
        </nav>
      </div>
    </header>
  );
}
