"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "register" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function requestEmail(payload: Record<string, string>) {
    const response = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json() as { ok?: boolean; message?: string; cooldownSeconds?: number; retryAfterSeconds?: number };
    const wait = result.cooldownSeconds || result.retryAfterSeconds || 0;
    if (wait) setCooldown(wait);
    if (!response.ok || !result.ok) throw new Error(result.message || "The request could not be completed.");
    return result;
  }

  async function submit(formData: FormData) {
    setPending(true); setMessage(""); setMessageType("success");
    const supabase = createClient();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const displayName = String(formData.get("displayName") || "").trim();
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(params.get("returnTo") || "/arena"); router.refresh(); return;
      }
      if (mode === "register") {
        const result = await requestEmail({ action: "register", email, password, displayName });
        setRegisteredEmail(email);
        setMessage(result.message || "Check your email to verify your account."); return;
      }
      if (mode === "forgot") {
        const result = await requestEmail({ action: "forgot", email });
        setMessage(result.message || "If that account exists, a reset link has been requested."); return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can continue to the PodBound Field.");
    } catch (error) {
      setMessageType("error");
      if (mode === "sign-in") setMessage("The email or password was not accepted.");
      else if (mode === "reset") setMessage("The password could not be updated. Request a new reset link and try again.");
      else setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
    finally { setPending(false); }
  }

  async function resendConfirmation() {
    if (!registeredEmail || pending || cooldown > 0) return;
    setPending(true); setMessage(""); setMessageType("success");
    try {
      const result = await requestEmail({ action: "resend", email: registeredEmail });
      setMessage(result.message || "A new verification email has been requested.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "The email could not be requested.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" action={submit} aria-busy={pending}>
      {mode === "register" && <label htmlFor="display-name">Display name<input id="display-name" name="displayName" autoComplete="nickname" required minLength={2} maxLength={40} /></label>}
      {mode !== "reset" && <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>}
      {mode !== "forgot" && <label htmlFor="password">{mode === "reset" ? "New password" : "Password"}<input id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={10} aria-describedby={mode === "sign-in" ? undefined : "password-requirements"} />{mode !== "sign-in" && <small id="password-requirements">Minimum 10 characters.</small>}</label>}
      <button className="button primary" disabled={pending}>{pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
      {message && <p className="form-message" role={messageType === "error" ? "alert" : "status"}>{message}</p>}
      {mode === "register" && registeredEmail && <button className="button secondary" type="button" onClick={resendConfirmation} disabled={pending || cooldown > 0}>{cooldown > 0 ? `Request another email in ${cooldown}s` : "Request another verification email"}</button>}
    </form>
  );
}
