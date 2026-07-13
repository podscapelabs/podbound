import { LegalPage } from "@/components/LegalPage";
import { siteContent } from "@/content/site";

export const metadata = { title: "Terms of Use | PodBound" };

export default function TermsPage() {
  return <LegalPage eyebrow="Legal record" title="Terms of Use" updated="July 13, 2026">
    <p>These Terms govern access to the PodBound website, accounts, and PodBound Field simulator operated by Podscape Labs. By creating an account or using the service, you agree to these Terms and the <a href="/privacy">Privacy Policy</a>. If you do not agree, do not create an account or enter the Field.</p>

    <h2>Development and testing status</h2>
    <p>PodBound and its simulator are unfinished, pre-release materials used to support development of the physical tabletop game. This is not the official PodBound launch. Features, rules, balance, artwork, accounts, access, progress, records, and stored information may change, reset, become unavailable, or be removed during testing.</p>
    <p>Podscape Labs may change, restrict, suspend, or end access at any time, including after sufficient testing data has been collected.</p>

    <h2>Accounts</h2>
    <ul>
      <li>Provide accurate registration information and keep account credentials confidential.</li>
      <li>Do not share an account, impersonate another person, or attempt to obtain a role you were not granted.</li>
      <li>You are responsible for activity conducted through your account unless you promptly report unauthorized access.</li>
      <li>Registration does not guarantee Field or playtester access.</li>
    </ul>

    <h2>Acceptable use</h2>
    <p>You may not:</p>
    <ul>
      <li>Copy, scrape, redistribute, publish, sell, sublicense, or make unreleased simulator or game material available to others.</li>
      <li>Reverse engineer, decompile, extract, automate against, or attempt to discover protected source code, game data, private APIs, access controls, or security mechanisms except where applicable law expressly permits it.</li>
      <li>Cheat, exploit bugs, falsify reports, evade watermarks, bypass access restrictions, interfere with testing, or disrupt the website or simulator.</li>
      <li>Upload malicious code, probe for vulnerabilities without written authorization, or use the service in a way that harms Podscape Labs or another person.</li>
      <li>Harass, threaten, discriminate against, or impersonate another participant.</li>
    </ul>

    <h2>Suspension and removal</h2>
    <p>Accounts or access may be suspended, restricted, or removed for abuse, cheating, harassment, security concerns, breach of these Terms or the playtest agreement, or misuse of PodBound materials. Podscape Labs may preserve relevant records when reasonably necessary to investigate misuse or comply with law.</p>

    <h2>Ownership</h2>
    <p>PodBound and Podscape Labs names, logos, artwork, game rules and content, simulator design and code, characters, worldbuilding, documentation, and other original materials are owned by Podscape Labs or used with permission. These Terms grant only a limited, revocable, non-transferable right to use the website and simulator for authorized personal playtesting.</p>

    <h2>Feedback</h2>
    <p>You retain ownership of original feedback you submit. You give Podscape Labs a worldwide, royalty-free, transferable, sublicensable, perpetual licence to use, reproduce, adapt, analyze, and incorporate that feedback for developing, testing, documenting, marketing, and commercializing PodBound and related Podscape Labs products. Do not submit confidential information or material you do not have permission to share.</p>

    <h2>No purchase or reward promise</h2>
    <p>Test participation, account status, reports, badges, progress, or access do not create employment, partnership, ownership, payment, prize, product entitlement, or guaranteed future access unless Podscape Labs separately agrees in writing.</p>

    <h2>Disclaimers and liability</h2>
    <p>The service is provided on an “as available” and “as is” basis for testing. Bugs, interruptions, data loss, unfinished pages, placeholder elements, balance issues, and unexpected behaviour may occur. To the maximum extent permitted by applicable law, Podscape Labs disclaims implied warranties and is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of or inability to use the service. Nothing in these Terms limits rights or liability that cannot legally be excluded.</p>

    <h2>Governing law</h2>
    <p>These Terms are governed by the laws applicable in Ontario, Canada, without limiting mandatory consumer or privacy protections that apply in your location.</p>

    <h2>Changes and contact</h2>
    <p>We may update these Terms as the test changes. Continued use after an updated version is posted means you accept the revised Terms where permitted by law. Questions may be sent to <a href={`mailto:${siteContent.supportEmail}?subject=PodBound terms question`}>{siteContent.supportEmail}</a>.</p>
  </LegalPage>;
}
