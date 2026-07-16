import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  return <main id="main" className={`${styles.authPage} shell`}><section className={styles.authShell} aria-labelledby="reset-title"><aside className={styles.contextPanel}><div><p className="eyebrow">Account recovery</p><h2>Secure the next entry.</h2><p>Choose a new password for the PodBound account connected to this recovery session.</p></div><dl><div><dt>Minimum length</dt><dd>10 characters</dd></div><div><dt>Storage</dt><dd>Handled by authentication provider</dd></div><div><dt>After update</dt><dd>Continue to PodBound</dd></div></dl></aside><div className={styles.formPanel}><header><p className="eyebrow">Final recovery step</p><h1 id="reset-title">Choose a new password</h1><p>Your new password replaces the previous account credential.</p></header><Suspense><AuthForm mode="reset" /></Suspense><nav className={styles.authLinks} aria-label="Password help"><Link href="/forgot-password">Request a new recovery link</Link><Link href="/contact">Contact support</Link></nav></div></section></main>;
}
