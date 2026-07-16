import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { siteContent } from "@/content/site";

export const metadata = { title: "Privacy Policy | PodBound" };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Legal record" title="Privacy Policy" updated="July 13, 2026">
    <p>Podscape Labs operates the PodBound website and controlled PodBound Field playtest. This policy explains what personal information we collect, why we use it, the service providers that process it, and how to request access, correction, or deletion.</p>
    <p><strong>Privacy contact:</strong> <a href={`mailto:${siteContent.supportEmail}?subject=PodBound privacy request`}>{siteContent.supportEmail}</a></p>

    <h2>Information we collect</h2>
    <h3>Account information</h3>
    <ul>
      <li>Email address, display name, internal account identifier, account role, approval status, and account timestamps.</li>
      <li>Authentication and essential session information used to register, verify, sign in, recover an account, and keep a session secure.</li>
      <li>A versioned record showing when the current playtest agreement was accepted.</li>
    </ul>
    <h3>Playtest information</h3>
    <ul>
      <li>Submitted game identifiers, simulator build version, scores, game audit data, integrity state, submission time, and voluntary feedback.</li>
      <li>Your display name and a shortened account reference may appear in the private simulator watermark and internal playtest records.</li>
    </ul>
    <h3>Technical information</h3>
    <p>Our hosting and authentication providers may automatically process IP address, browser or device information, essential cookies, request logs, and security events needed to deliver and protect the service. PodBound does not currently use advertising trackers or sell personal information.</p>

    <h2>Why we use information</h2>
    <ul>
      <li>To create and secure accounts, verify identity, recover access, and enforce account roles.</li>
      <li>To control access to unfinished playtest material and record required agreement acceptance.</li>
      <li>To run the simulator, receive reports, investigate bugs or misuse, and improve the physical PodBound tabletop game.</li>
      <li>To maintain security, prevent abuse, administer the service, and meet legal obligations.</li>
      <li>To respond to support, privacy, access, correction, and deletion requests.</li>
    </ul>
    <p>We limit collection to information reasonably needed for these purposes. We do not ask for payment information, government identification, contact lists, or precise location for registration or Field access.</p>

    <h2>Service providers and transfers</h2>
    <p>We use <strong>Supabase</strong> for authentication and database services and <strong>Vercel</strong> for website hosting and delivery. These providers process information on our behalf under their own security and privacy terms. You can review the <a href="https://supabase.com/privacy">Supabase Privacy Policy</a> and <a href="https://vercel.com/legal/privacy-policy">Vercel Privacy Policy</a>. Information may be processed or stored outside Ontario or Canada and may be accessible to authorities under the laws that apply where it is processed.</p>
    <p>We may also disclose information when required by law, to protect users or the service, or as part of a business reorganization subject to appropriate safeguards. We do not rent or sell account or playtest information.</p>

    <h2>Cookies and browser storage</h2>
    <p>PodBound uses essential authentication and session storage needed to sign users in, protect routes, and maintain temporary playtest sessions. Blocking essential storage may prevent account or Field features from working. We do not currently use behavioural advertising cookies.</p>

    <h2>Retention</h2>
    <p>Account and profile information is retained while the account is active. Agreement records and playtest reports may be retained while they remain useful for security, recordkeeping, and game development. When an account is deleted, retained playtest reports are disconnected from the account and their structured player identity fields are removed. Voluntary notes may require manual review. When information is no longer reasonably needed, we will delete or de-identify it, subject to legal, fraud-prevention, backup, and technical requirements.</p>

    <h2>Security</h2>
    <p>Passwords are handled by Supabase Auth and are not stored as plain text in the PodBound application database. We use server-side authorization checks, restricted administrator routes, row-level database security, private service credentials, and access logging appropriate to the current test. No online service can guarantee absolute security.</p>

    <h2>Your choices and requests</h2>
    <p>You may update your display name and password through the account tools. You may ask what personal information we hold, request a correction, withdraw optional consent, or request account and data deletion by contacting the privacy address above. We may need to verify that you control the account before fulfilling a request.</p>
    <p>Use the <Link href="/account/delete">account deletion request page</Link> for instructions. If a concern is not resolved, you may have the right to contact the privacy regulator that applies to your location.</p>

    <h2>Children</h2>
    <p>PodBound account and Field access are not directed to children who cannot legally provide the required consent in their location. A parent or guardian should contact us before a minor participates if consent is required.</p>

    <h2>Policy changes</h2>
    <p>We may update this policy as the test and platform change. The current version and effective date will remain posted here. Material changes may also be shown near registration or Field access.</p>
  </LegalPage>;
}
