import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  return <main id="main" className="auth-page shell"><div className="auth-card"><p className="eyebrow">Account recovery</p><h1>Reset your password</h1><p>We will send a secure recovery link if the account exists.</p><Suspense><AuthForm mode="forgot" /></Suspense></div></main>;
}
