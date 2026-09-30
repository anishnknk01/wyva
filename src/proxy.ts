import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Never gate the OAuth/email callback route through this session check.
  // It needs to run before a session exists yet (that's the whole point of
  // the callback — it's what *creates* the session), and this middleware
  // runs on every request including this one. If auth.getUser() below ever
  // throws (timeout, transient network error) while handling the callback,
  // an uncaught error here kills the response before the route handler
  // gets a chance to run, which presents to the browser as a broken/reset
  // connection rather than a normal error page.
  if (pathname === "/auth/callback") {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) =>
          fetch(url, { ...options, signal: AbortSignal.timeout(5000) }),
      },
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session cookie on every request. Wrapped in try/catch — a
  // transient failure here (Supabase timeout/network blip) should degrade
  // to "treat as logged out for this request" rather than throwing
  // uncaught through the middleware and killing the connection outright.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("proxy: auth.getUser() failed", error);
  }

  // ── 1. Gate protected routes — redirect to login if unauthenticated ────
  const protectedPaths = [
    "/dashboard", "/worker",
    "/tasks", "/create-task", "/my-tasks", "/wysa-tasks",
    "/pay-task", "/task-posted", "/become-a-wysa",
    "/messages", "/saved", "/payments", "/profile",
    "/settings", "/select-role",
    "/mobile", "/mobile/create-task", "/mobile/find-tasks",
    "/mobile/my-tasks", "/mobile/profile", "/mobile/pay-task",
    "/mobile/task-posted", "/mobile/messages",
  ];

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── 2. Authenticated — only redirect from login/signup pages ──────────
  // Do NOT do role-based redirects in the middleware — let the client pages
  // handle that. Middleware role-lookups were causing redirect loops because
  // every navigation triggered a DB query that fed back into another redirect.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    // Just send to dashboard — the client will handle role routing from there
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
