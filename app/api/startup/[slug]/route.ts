// app/api/startup/[slug]/route.ts
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }
  console.log(slug);

  try {
  const { data, error } = await supabase
  .from('startups')
   .select(`
      *,
      profiles (*)
    `)
  .eq("slug", slug)
     .single(); 



    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
