import Link from "next/link";
import styles from "./page.module.css";

export const metadata = { title: "Field Archives Temporarily Closed | PodBound" };

export default function MaintenancePage() {
  return <main id="main" className={styles.page}>
    <section className={styles.notice}>
      <p className="eyebrow">Temporary field closure</p>
      <span className={styles.record}>PB / MAINTENANCE 001</span>
      <h1>The Field Archives are being updated.</h1>
      <p>PodBound is temporarily unavailable while Podscape Labs prepares the next build. Please check back soon.</p>
      <div className={styles.rule} aria-hidden="true" />
      <small>Accounts and submitted playtest records remain stored securely during the closure.</small>
      <Link href="/sign-in?returnTo=/admin">Administrator sign in →</Link>
    </section>
  </main>;
}
