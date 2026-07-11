import { siteContent } from "@/content/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div><strong>PodBound™</strong><p>A Podscape Labs™ project</p></div>
        <div><p>Ontario, Canada</p><p>© 2026 Podscape Labs™</p></div>
        <a href={siteContent.parent.href}>Visit Podscape Labs ↗</a>
      </div>
    </footer>
  );
}
