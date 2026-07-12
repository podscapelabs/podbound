import { PodboundBadge, type PodboundBadgeProps } from "@/components/PodboundBadge";
import styles from "./page.module.css";

export const metadata = { title: "Field Badges | PodBound", description: "PodBound Field Archive badges and achievement plaques." };

const badges: PodboundBadgeProps[] = [
  { title: "Founder Tester", subtitle: "Founding cohort", icon: <span>✦</span>, variant: "gold", rarity: "Founder", size: "large", description: "Awarded to the earliest verified PodBound playtesters." },
  { title: "Arena Pioneer", subtitle: "First expedition", icon: <span>↗</span>, variant: "rare-green", rarity: "Rare", description: "Entered the Arena during the first public field test." },
  { title: "First Brood", subtitle: "Colony established", icon: <span>●</span>, variant: "green", rarity: "Field", description: "Completed a first verified ten-round game." },
  { title: "Forecast Survivor", subtitle: "Ten rounds recorded", variant: "bronze", rarity: "Bronze", description: "Guided a colony through a complete visible Forecast." },
  { title: "Early Colony", variant: "parchment", size: "small", description: "Joined PodBound while the Field Archives were still being established." },
  { title: "Locked Badge", subtitle: "Record undiscovered", variant: "locked-grey", locked: true, rarity: "Unknown", description: "This achievement remains locked. Continue field testing to discover its requirements." },
];

export default function BadgesPage() {
  return <main id="main" className={`shell ${styles.page}`}>
    <header className={styles.heading}><p className="eyebrow">Field Archive distinctions</p><h1>Badges of the colony.</h1><p>Recognition marks for early testing, Arena records, difficult Forecasts, and the colonies that endured them.</p></header>
    <section className={styles.featured} aria-labelledby="featured-badge"><div><span>PB / BADGE 001</span><h2 id="featured-badge">Founder record</h2><p>The first distinction reserved for the original testing cohort.</p></div><PodboundBadge {...badges[0]} /></section>
    <section className={styles.archive} aria-labelledby="badge-archive"><div className={styles.sectionTitle}><span>01 / Archive</span><h2 id="badge-archive">Recorded distinctions</h2></div><div className={styles.grid}>{badges.slice(1).map((badge) => <article className={styles.specimen} key={badge.title}><PodboundBadge {...badge} /><span className={styles.specimenLabel}>{badge.locked ? "Locked record" : `${badge.rarity || "Standard"} distinction`}</span></article>)}</div></section>
    <section className={styles.longTitleTest} aria-labelledby="long-title-test"><div><span>02 / Stress test</span><h2 id="long-title-test">Long-title specimen</h2><p>The component constrains long labels inside the plaque rather than stretching the frame.</p></div><PodboundBadge title="Keeper of the Ten-Round Forecast" subtitle="Complete archival record" variant="silver" rarity="Silver" size="large" description="A long-title layout test for responsive badge typography." /></section>
  </main>;
}
