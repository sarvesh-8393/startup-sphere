import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabase } from "@/lib/supabaseClient";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

// The secret must match NEXTAUTH_SECRET
const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // 1️⃣ Get NextAuth token (gives us email)
  const token = await getToken({ req, secret });
  if (!token?.email) {
    return NextResponse.next(); // not logged in, skip
  }

  // 2️⃣ Find profile in your DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", token.email)
    .maybeSingle();

  if (!profile) {
    // edge case: profile not created
    return NextResponse.next();
  }

  // 3️⃣ Check if user has preferences
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const pathname = req.nextUrl.pathname;

  // If no prefs → force onboarding
  if (!prefs && pathname !== "/onboarding") {
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // If prefs exist → block onboarding
  if (prefs && pathname === "/onboarding") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run this middleware on these routes
export const config = {
  matcher: ["/", "/onboarding"],
};
