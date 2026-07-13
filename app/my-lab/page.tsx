import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyLabFoundation, type MyLabFoundation } from "@/lib/my-lab";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Lab | PodBound",
  description: "Your PodBound account progression, Podlings, and field rewards.",
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDiscount(basisPoints: number) {
  if (!basisPoints) return "None";
  return `${(basisPoints / 100).toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
}

export default async function MyLabPage() {
  const { user, profile } = await requireUser("/my-lab");
  let foundation: MyLabFoundation | null = null;

  try {
    foundation = await getMyLabFoundation(user.id);
  } catch {
    // Keep account access usable if this optional read model is temporarily unavailable.
  }

  if (!foundation?.progression) {
    return <main id="main" className={`${styles.lab} shell`}>
      <header className={styles.heading}>
        <p className="eyebrow">Private account collection</p>
        <h1>My Lab</h1>
        <p>Your Lab record is being prepared. Your PodBound account and Field access remain available.</p>
      </header>
      <section className={styles.unavailable} role="status">
        <span aria-hidden="true">PL–00</span>
        <div><h2>Record temporarily unavailable</h2><p>Return shortly, or continue to your account and the PodBound Field.</p></div>
        <div className="actions"><Link className="button primary" href="/account">Account</Link><Link className="button secondary" href="/arena">PodBound Field</Link></div>
      </section>
    </main>;
  }

  const { progression, podlings, recentExperience, recentRewards } = foundation;
  const activePodling = podlings.find((podling) => podling.id === progression.active_podling_id) || null;
  const displayName = profile?.display_name || "Field researcher";

  return <main id="main" className={`${styles.lab} shell`}>
    <header className={styles.heading}>
      <div>
        <p className="eyebrow">Private account collection</p>
        <h1>My Lab</h1>
        <p>{displayName} · Shared Podscape account progression</p>
      </div>
      <div className={styles.reference} aria-label={`Account level ${progression.account_level}`}>
        <span>Account level</span><strong>{progression.account_level.toString().padStart(2, "0")}</strong>
      </div>
    </header>

    <section className={styles.ledger} aria-label="Progression summary">
      <article><span>Total experience</span><strong>{progression.total_exp.toLocaleString("en-CA")} EXP</strong><small>{progression.last_exp_at ? `Last recorded ${formatDate(progression.last_exp_at)}` : "No experience recorded yet"}</small></article>
      <article><span>Loyalty level</span><strong>{progression.loyalty_level}</strong><small>Shared across your Podscape account</small></article>
      <article><span>Permanent discount</span><strong>{formatDiscount(progression.permanent_discount_bps)}</strong><small>{titleCase(progression.discount_tier)} tier · maximum 10%</small></article>
      <article><span>Podling collection</span><strong>{podlings.length}</strong><small>{activePodling ? `${activePodling.custom_name || activePodling.podling_catalog?.name || "Podling"} is active` : "No active Podling selected"}</small></article>
    </section>

    <section className={styles.collection}>
      <div className={styles.sectionHeading}>
        <div><p className="eyebrow">Specimen records</p><h2>Your Podlings</h2><p>Podlings belong to your account and share its experience. They do not hold separate EXP.</p></div>
        <span>{podlings.length} catalogued</span>
      </div>

      {podlings.length ? <div className={styles.podlingGrid}>{podlings.map((podling, index) => {
        const definition = podling.podling_catalog;
        const name = podling.custom_name || definition?.name || "Unnamed Podling";
        const isActive = podling.id === progression.active_podling_id;
        return <article className={styles.podlingCard} key={podling.id}>
          <div className={styles.specimenMark} aria-hidden="true">PL–{String(index + 1).padStart(2, "0")}</div>
          <div className={styles.podlingPortrait} aria-hidden="true"><span>Specimen record</span></div>
          <div className={styles.podlingCopy}><div><span>{definition?.name || titleCase(podling.podling_key)}</span>{isActive && <b>Active</b>}</div><h3>{name}</h3><p>{definition?.description || "Further field notes will be added as this Podling is documented."}</p><small>Unlocked {formatDate(podling.unlocked_at)}</small></div>
        </article>;
      })}</div> : <div className={styles.emptyCollection}>
        <div className={styles.emptyPlate} aria-hidden="true"><span>PL–01</span><i /></div>
        <div><p className="eyebrow">Collection pending</p><h3>Your first Podling has not been issued yet.</h3><p>Approved Podlings will appear here when they are introduced. Your account progression is already recording safely in the background.</p></div>
      </div>}
    </section>

    <div className={styles.archiveGrid}>
      <section className={styles.archive}>
        <div className={styles.sectionHeading}><div><p className="eyebrow">Account ledger</p><h2>Experience history</h2></div><span>{recentExperience.length} records</span></div>
        {recentExperience.length ? <ol className={styles.recordList}>{recentExperience.map((entry) => <li key={entry.id}><div><strong>{entry.amount > 0 ? `+${entry.amount}` : entry.amount} EXP</strong><span>{entry.reason}</span></div><time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time></li>)}</ol> : <p className={styles.emptyText}>No EXP entries yet. Server-verified activity will appear here when progression begins.</p>}
      </section>

      <section className={styles.archive}>
        <div className={styles.sectionHeading}><div><p className="eyebrow">Issued records</p><h2>Rewards</h2></div><span>{recentRewards.length} records</span></div>
        {recentRewards.length ? <ol className={styles.recordList}>{recentRewards.map((entry) => <li key={entry.id}><div><strong>{entry.reward_label}</strong><span>{titleCase(entry.action)}</span></div><time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time></li>)}</ol> : <p className={styles.emptyText}>No rewards issued yet. Future entitlements and account rewards will be recorded here.</p>}
      </section>
    </div>

    <section className={styles.fieldLink}>
      <div><p className="eyebrow">Continue your records</p><h2>Return to the Field</h2><p>My Lab is your private collection. PodBound Field remains the controlled space for simulator playtests and submitted game reports.</p></div>
      <div className="actions"><Link className="button primary" href="/arena">Check Field access</Link><Link className="button secondary" href="/account">Account settings</Link></div>
    </section>
  </main>;
}
