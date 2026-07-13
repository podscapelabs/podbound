"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "register" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [pending, setPending] = useState(false);

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
        const callback = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback, data: { display_name: displayName } } });
        if (error) throw error;
        setMessage("Check your email to verify your account."); return;
      }
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setMessage("If that account exists, a reset link has been sent."); return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can continue to the PodBound Field.");
    } catch (error) { setMessageType("error"); setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setPending(false); }
  }

  return (
    <form className="auth-form" action={submit} aria-busy={pending}>
      {mode === "register" && <label htmlFor="display-name">Display name<input id="display-name" name="displayName" autoComplete="nickname" required minLength={2} maxLength={40} /></label>}
      {mode !== "reset" && <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>}
      {mode !== "forgot" && <label htmlFor="password">{mode === "reset" ? "New password" : "Password"}<input id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={10} aria-describedby={mode === "sign-in" ? undefined : "password-requirements"} />{mode !== "sign-in" && <small id="password-requirements">Minimum 10 characters.</small>}</label>}
      <button className="button primary" disabled={pending}>{pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
      {message && <p className="form-message" role={messageType === "error" ? "alert" : "status"}>{message}</p>}
    </form>
  );
}
