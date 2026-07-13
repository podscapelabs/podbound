import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return <main id="main" className="auth-page shell"><div className="auth-card"><p className="eyebrow">Field access</p><h1>Sign in</h1><p>Return to your verified PodBound account.</p><Suspense><AuthForm mode="sign-in" /></Suspense><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create an account</Link></div></div></main>;
}
