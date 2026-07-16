import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import styles from "../auth.module.css";

export default function SignInPage() {
  return <main id="main" className={`${styles.authPage} shell`}><section className={styles.authShell} aria-labelledby="sign-in-title"><aside className={styles.contextPanel}><div><p className="eyebrow">PodBound Field Archives</p><h2>Return to your Lab.</h2><p>Your account connects Arena access, submitted Field reports, progression, and Podling records.</p></div><dl><div><dt>Account</dt><dd>PodBound access record</dd></div><div><dt>Destination</dt><dd>Arena or My Lab</dd></div><div><dt>Provider</dt><dd>Secure email authentication</dd></div></dl></aside><div className={styles.formPanel}><header><p className="eyebrow">Field access</p><h1 id="sign-in-title">Sign in</h1><p>Return to your verified PodBound account.</p></header><Suspense><AuthForm mode="sign-in" /></Suspense><nav className={styles.authLinks} aria-label="Sign-in help"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create an account</Link></nav></div></section></main>;
}
