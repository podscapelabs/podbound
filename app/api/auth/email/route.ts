import { NextRequest, NextResponse } from "next/server";
import { reserveAuthEmailAttempt } from "@/lib/auth-email";
import { publicAuthError } from "@/lib/auth-email-policy";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EmailAction = "register" | "forgot" | "resend";

function jsonError(message: string, status: number, retryAfterSeconds?: number) {
  return NextResponse.json({ ok: false, message, retryAfterSeconds }, {
    status,
    headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
  });
}

export async function POST(request: NextRequest) {
  let body: { action?: EmailAction; email?: string; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("The request could not be read.", 400);
  }

  const action = body.action;
  const email = String(body.email || "").trim().toLowerCase();
  if (!action || !["register", "forgot", "resend"].includes(action)) return jsonError("Unknown email request.", 400);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return jsonError("Enter a valid email address.", 400);
  if (action === "register") {
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    if (password.length < 10) return jsonError("Password must be at least 10 characters.", 400);
    if (displayName.length < 2 || displayName.length > 40) return jsonError("Display name must be between 2 and 40 characters.", 400);
  }

  let reservation;
  try {
    reservation = await reserveAuthEmailAttempt(request, email);
  } catch {
    return jsonError("Authentication email delivery is temporarily unavailable. Please try again later.", 503, 60);
  }
  if (!reservation.allowed) {
    return jsonError(
      reservation.reason === "cooldown"
        ? "Please wait before requesting another authentication email."
        : "Authentication email delivery is temporarily busy. Please try again later.",
      429,
      reservation.retryAfterSeconds,
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const supabase = await createClient();
  try {
    if (action === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password: String(body.password),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: { display_name: String(body.displayName || "").trim() },
        },
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Check your email to verify your account.", cooldownSeconds: reservation.cooldownSeconds });
    }

    if (action === "resend") {
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "If the account still needs verification, a new email has been requested.", cooldownSeconds: reservation.cooldownSeconds });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "If that account exists, a reset link has been requested.", cooldownSeconds: reservation.cooldownSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return jsonError(publicAuthError(message, "The authentication email could not be requested. Please try again later."), 503, reservation.cooldownSeconds);
  }
}
