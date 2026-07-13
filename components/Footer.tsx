import Link from "next/link";
import { siteContent } from "@/content/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div><strong>PodBound™</strong><p>A Podscape Labs™ project</p><a href={siteContent.parent.href}>Visit Podscape Labs ↗</a></div>
        <div><p>Ontario, Canada</p><p>© 2026 Podscape Labs™</p></div>
        <nav className="footer-links" aria-label="Legal and support"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/contact">Contact</Link><Link href="/account/delete">Account deletion</Link></nav>
      </div>
    </footer>
  );
}
