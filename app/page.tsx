import Image from "next/image";
import Link from "next/link";
import { siteContent } from "@/content/site";

export default function Home() {
  return (
    <main id="main">
      <section className="hero shell">
        <div className="archive-label"><span>PB / FIELD ARCHIVE 001</span><span>{siteContent.brand.status}</span></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Official field archive</p>
            <div className="logo-panel"><Image className="official-logo" src="/assets/logos/podbound-logo.png" alt="PodBound Field Archives" width={1800} height={791} priority /></div>
            <h1 className="sr-only">PodBound™</h1>
            <p className="hero-description">{siteContent.brand.description}</p>
            <div className="actions"><Link className="button primary" href="/arena">Enter the Arena</Link><Link className="button secondary" href="#about">Learn about PodBound</Link></div>
          </div>
          <div className="hero-art isopod-hero">
            <div className="isopod-crop hero-isopod"><Image src="/assets/logos/podbound-isopod.png" alt="Illustrated isopod, the PodBound emblem" width={1024} height={450} priority /></div>
            <small>Official PodBound isopod mark</small>
          </div>
        </div>
      </section>

      <section className="about shell" id="about">
        <div className="section-number">01 / About</div>
        <div className="about-grid"><h2>Read the forecast.<br />Guide the colony.</h2><p>{siteContent.about}</p></div>
      </section>

      <section className="playtest-section">
        <div className="shell playtest-grid"><div><p className="eyebrow">Controlled access</p><h2>The PodBound Arena</h2></div><div><p>{siteContent.playtesting}</p><Link className="text-link" href="/arena">Check Arena access →</Link></div></div>
      </section>

      <section className="parent-link shell"><span>PB / PL</span><p>PodBound is the first major project from Podscape Labs.</p><Link href={siteContent.parent.href}>{siteContent.parent.label} ↗</Link></section>
    </main>
  );
}
