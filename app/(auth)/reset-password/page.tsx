import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function ResetPasswordPage() {
  return <main id="main" className="auth-page shell"><div className="auth-card"><p className="eyebrow">Account recovery</p><h1>Choose a new password</h1><Suspense><AuthForm mode="reset" /></Suspense></div></main>;
}
