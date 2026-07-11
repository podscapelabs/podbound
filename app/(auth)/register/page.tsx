import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return <main id="main" className="auth-page shell"><div className="auth-card"><p className="eyebrow">Field registration</p><h1>Create an account</h1><p>Registration does not automatically grant invite-only Arena access.</p><Suspense><AuthForm mode="register" /></Suspense><div className="auth-links"><Link href="/sign-in">Already registered? Sign in</Link></div></div></main>;
}
