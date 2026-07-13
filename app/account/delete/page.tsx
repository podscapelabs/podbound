import { LegalPage } from "@/components/LegalPage";
import { siteContent } from "@/content/site";

export const metadata = { title: "Account Deletion Request | PodBound" };

export default function AccountDeletionPage() {
  const subject = encodeURIComponent("PodBound account deletion request");
  const body = encodeURIComponent("Please delete my PodBound account and associated personal data. I am contacting you from the email address connected to the account.");
  return <LegalPage eyebrow="Account controls" title="Request account deletion" updated="July 13, 2026">
    <p>You may ask Podscape Labs to delete your PodBound account and associated personal information.</p>
    <h2>How to submit a request</h2>
    <ol>
      <li>Email <a href={`mailto:${siteContent.supportEmail}?subject=${subject}&body=${body}`}>{siteContent.supportEmail}</a>, preferably from the address registered to the account.</li>
      <li>Use the subject “PodBound account deletion request.”</li>
      <li>Include your shortened account reference from the account dashboard if available. Do not send your password.</li>
      <li>Complete any reasonable verification needed to confirm that you control the account.</li>
    </ol>
    <h2>What happens next</h2>
    <p>After verification, we will delete the account and remove or de-identify associated personal information where reasonably possible. Some records may be retained when required for legal compliance, security, fraud prevention, dispute handling, or limited backup restoration. We will respond in accordance with applicable law.</p>
    <p><a className="button primary" href={`mailto:${siteContent.supportEmail}?subject=${subject}&body=${body}`}>Email deletion request</a></p>
  </LegalPage>;
}
