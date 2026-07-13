import type { ReactNode } from "react";
import styles from "@/app/legal.module.css";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return <main id="main" className={`shell ${styles.legalPage}`}>
    <header className={styles.legalHeader}><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>Last updated {updated}</p></header>
    <article className={styles.legalBody}>{children}</article>
  </main>;
}
