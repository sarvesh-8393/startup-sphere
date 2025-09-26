import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if profile exists
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (profile) {
    return NextResponse.json({ message: "Profile already exists" }, { status: 200 });
  }

  // If not, insert user into profiles table
  const { error: insertErr } = await supabase.from("profiles").insert([
    {
      email: user.email,
      name: user.name || "", // if you store name
      image: user.image || "", // if you store profile pic
    },
  ]);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: "User synced to DB" });
}
