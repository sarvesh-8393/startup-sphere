import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disable all middleware to avoid Supabase errors
export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

// Run middleware on all routes except static files and API routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
