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
      .select("id, views")
      .eq("slug", slug)
      .single();

    if (fetchErr || !startup) {
      return NextResponse.json({ error: fetchErr?.message || "Not found" }, { status: 404 });
    }

    const nextViews = (startup.views || 0) + 1;

    const { error: updateErr } = await supabase
      .from("startups")
      .update({ views: nextViews })
      .eq("id", startup.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ views: nextViews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
} 