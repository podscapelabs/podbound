import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Testing Disclaimer | PodBound" };

export default function TestingDisclaimerPage() {
  return <LegalPage eyebrow="Public test notice" title="Testing Disclaimer" updated="July 13, 2026">
    <div className="legal-callout"><strong>PodBound Field is a temporary public simulator test.</strong> It supports development of the physical PodBound tabletop game and is not the official PodBound launch.</div>

    <h2>What to expect</h2>
    <ul>
      <li>Bugs, incomplete pages, placeholder elements, balance issues, and unexpected behaviour may be present.</li>
      <li>Rules, artwork, simulator behaviour, account access, records, and stored test information may change or reset.</li>
      <li>The Field may close temporarily or permanently after enough testing data has been collected.</li>
      <li>Availability and preservation of progress or playtest history are not guaranteed.</li>
    </ul>

    <h2>Why reports are collected</h2>
    <p>Submitted game audits and voluntary feedback help Podscape Labs identify bugs, review balance, and refine the physical tabletop game. Reports are for internal development use and do not grant ownership, payment, prizes, or guaranteed future access.</p>

    <h2>Required acknowledgement</h2>
    <p>Authorized players must accept the current playtest participation agreement before entering the simulator. The agreement includes confidentiality, conduct, data-use, and access-control conditions.</p>
    <p>Review the <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link> before registering or entering the Field.</p>
  </LegalPage>;
}
