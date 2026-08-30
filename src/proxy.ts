import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Runs on every request (except static assets) to refresh the Supabase auth
// session cookie. Named "proxy" per Next.js 16's renamed convention
// (formerly "middleware.ts" / "middleware()").
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - image/font/svg assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
