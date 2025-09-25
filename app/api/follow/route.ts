import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { slug } = await req.json();
  const email = user.email;

  // Check if follow already exists
  const { data: existingFollow, error: existingErr } = await supabase
    .from("follows")
    .select("id")
    .eq("email", email)
    .eq("slug", slug)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existingFollow) {
    return NextResponse.json(
      { message: "Already following this startup" },
      { status: 409 }
    );
  }

  // Insert new follow
  const { error: insertErr } = await supabase.from("follows").insert([
    {
      email,
      slug,
    },
  ]);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Followed successfully" });
} 