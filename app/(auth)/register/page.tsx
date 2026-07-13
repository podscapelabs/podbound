import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { PUBLIC_TESTING_NOTICE } from "@/lib/playtest-agreement";

export default function RegisterPage() {
  return <main id="main" className="auth-page shell"><div className="auth-card"><p className="eyebrow">Field registration</p><h1>Create an account</h1><p>Registration does not automatically grant invite-only Field access.</p><div className="testing-notice"><strong>Temporary public test</strong><p>{PUBLIC_TESTING_NOTICE}</p><p>By creating an account, you agree to the <Link href="/terms">Terms of Use</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>. The current playtest agreement must also be accepted before simulator entry.</p></div><Suspense><AuthForm mode="register" /></Suspense><div className="auth-links"><Link href="/sign-in">Already registered? Sign in</Link><Link href="/testing-disclaimer">Read the testing disclaimer</Link></div></div></main>;
}
