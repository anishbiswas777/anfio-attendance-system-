import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/account-blocked",
  "/api/auth/register",
  "/api/auth/callback",
  "/api/departments",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

  // API routes handle their own auth & return 401/403 JSON responses without proxy overhead
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith("sb-"));

  // Fast path: if no auth cookies exist
  if (!hasAuthCookie) {
    if (isPublicPath(pathname)) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // If auth cookie exists, pass through to Server Components immediately
  // Server components validate the token & profile in parallel with page data
  return supabaseResponse;
}
