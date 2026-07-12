import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const maintenanceBypass = pathname === "/maintenance" || pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/sign-in" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname.startsWith("/auth/");
  if (!maintenanceBypass) {
    const { data, error } = await supabase.from("site_settings").select("maintenance_enabled").eq("id", 1).maybeSingle();
    if (!error && data?.maintenance_enabled) {
      if (pathname.startsWith("/api/")) {
        return Response.json({ error: "PodBound is temporarily unavailable for maintenance." }, { status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
      }
      const maintenanceUrl = request.nextUrl.clone();
      maintenanceUrl.pathname = "/maintenance";
      maintenanceUrl.search = "";
      const maintenanceResponse = NextResponse.redirect(maintenanceUrl, 307);
      maintenanceResponse.headers.set("Cache-Control", "no-store");
      maintenanceResponse.headers.set("Retry-After", "300");
      return maintenanceResponse;
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
