import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  return <main id="main" className={`${styles.authPage} shell`}><section className={styles.authShell} aria-labelledby="forgot-title"><aside className={styles.contextPanel}><div><p className="eyebrow">Account recovery</p><h2>Recover your Field record.</h2><p>A secure recovery link lets you choose a new password without exposing the existing one.</p></div><dl><div><dt>Request</dt><dd>Verified through email</dd></div><div><dt>Account privacy</dt><dd>Existence is not disclosed</dd></div><div><dt>Next step</dt><dd>Choose a new password</dd></div></dl></aside><div className={styles.formPanel}><header><p className="eyebrow">Secure recovery</p><h1 id="forgot-title">Reset your password</h1><p>We will send a secure recovery link if the account exists.</p></header><Suspense><AuthForm mode="forgot" /></Suspense><nav className={styles.authLinks} aria-label="Recovery help"><Link href="/sign-in">Return to sign in</Link><Link href="/contact">Contact Podscape Labs</Link></nav></div></section></main>;
}
