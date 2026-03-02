import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  AB_SYSTEM_TYPE_RECOMMENDATION,
  getTestingSessionIdFromCookie,
  updateTestingSessionMetrics,
} from "@/lib/testingSession";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    let userId: string | null = null;
    if (session?.user?.email) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();
      userId = userData?.id || null;
    }

    const trackingSessionId = getTestingSessionIdFromCookie(req.headers.get("cookie"));
    await updateTestingSessionMetrics({
      systemType: AB_SYSTEM_TYPE_RECOMMENDATION,
      userId,
      sessionId: trackingSessionId,
      clicksDelta: 1,
    });

    return NextResponse.json({ views: nextViews });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
} 