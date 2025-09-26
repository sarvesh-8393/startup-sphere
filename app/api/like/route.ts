import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const { data: startup, error: fetchErr } = await supabase
      .from("startups")
      .select("id, likes")
      .eq("slug", slug)
      .single();

    if (fetchErr || !startup) {
      return NextResponse.json({ error: fetchErr?.message || "Not found" }, { status: 404 });
    }

    const nextLikes = (startup.likes || 0) + 1;

    const { error: updateErr } = await supabase
      .from("startups")
      .update({ likes: nextLikes })
      .eq("id", startup.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ likes: nextLikes });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
} 