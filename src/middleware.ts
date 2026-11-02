import { NextResponse, type NextRequest } from "next/server";
import { auth0, isAuthConfigured } from "@/lib/auth0";

// Mounts /auth/login, /auth/logout, /auth/callback and keeps the session cookie rolling
export async function middleware(request: NextRequest) {
  if (!isAuthConfigured()) {
    if (request.nextUrl.pathname.startsWith("/auth/")) {
      return new NextResponse("ยังไม่ได้ตั้งค่า Auth0 (ดู AUTH0_* ใน .env.example)", { status: 503 });
    }
    return NextResponse.next();
  }
  return auth0.middleware(request);
}

export const config = {
  // The Coolify healthcheck must not depend on Auth0
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
