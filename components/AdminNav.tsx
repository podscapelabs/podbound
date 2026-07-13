import Link from "next/link";
import styles from "./AdminNav.module.css";

export function AdminNav({ active }: { active: "overview" | "users" | "reports" }) {
  return <nav className={styles.nav} aria-label="Administration sections">
    <Link href="/admin" aria-current={active === "overview" ? "page" : undefined}>Overview</Link>
    <Link href="/admin/users" aria-current={active === "users" ? "page" : undefined}>Users & playtesters</Link>
    <Link href="/admin/reports" aria-current={active === "reports" ? "page" : undefined}>Playtest reports</Link>
  </nav>;
}
