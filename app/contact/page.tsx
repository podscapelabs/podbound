import { LegalPage } from "@/components/LegalPage";
import { siteContent } from "@/content/site";

export const metadata = { title: "Contact | PodBound" };

export default function ContactPage() {
  return <LegalPage eyebrow="Podscape Labs" title="Contact" updated="July 13, 2026">
    <p>PodBound is a Podscape Labs project based in Ontario, Canada. Use the links below so your request reaches the right record.</p>
    <div className="legal-link-grid">
      <a className="legal-link-card" href={`mailto:${siteContent.supportEmail}?subject=PodBound support request`}><strong>General support</strong><span>Account access, technical issues, and playtest questions.</span></a>
      <a className="legal-link-card" href={`mailto:${siteContent.supportEmail}?subject=PodBound privacy request`}><strong>Privacy request</strong><span>Access, correction, consent, or privacy concerns.</span></a>
      <a className="legal-link-card" href={`mailto:${siteContent.supportEmail}?subject=PodBound account deletion request`}><strong>Account deletion</strong><span>Request deletion of an account and associated personal data.</span></a>
      <a className="legal-link-card" href={siteContent.parent.href}><strong>Podscape Labs</strong><span>Visit the parent studio website.</span></a>
    </div>
    <p>Email: <a href={`mailto:${siteContent.supportEmail}`}>{siteContent.supportEmail}</a></p>
  </LegalPage>;
}
