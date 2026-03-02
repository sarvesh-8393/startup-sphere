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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Get user ID from email
    const { data: userData, error: userErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userErr || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData.id;

    // Get startup
    const { data: startup, error: fetchErr } = await supabase
      .from("startups")
      .select("id, likes")
      .eq("slug", slug)
      .single();

    if (fetchErr || !startup) {
      return NextResponse.json({ error: fetchErr?.message || "Not found" }, { status: 404 });
    }

    // Check if user already liked this startup
    const { data: existingLike, error: checkErr } = await supabase
      .from("startup_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("startup_id", startup.id)
      .single();

    let nextLikes = startup.likes || 0;
    let isLiked = false;

    if (!checkErr && existingLike) {
      // User already liked - so unlike
      const { error: deleteErr } = await supabase
        .from("startup_likes")
        .delete()
        .eq("user_id", userId)
        .eq("startup_id", startup.id);

      if (deleteErr) {
        return NextResponse.json({ error: deleteErr.message }, { status: 500 });
      }

      nextLikes = Math.max(0, (startup.likes || 1) - 1);
      isLiked = false;
    } else {
      // User hasn't liked - so like
      const { error: insertErr } = await supabase
        .from("startup_likes")
        .insert([
          {
            user_id: userId,
            startup_id: startup.id,
          },
        ]);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      nextLikes = (startup.likes || 0) + 1;
      isLiked = true;
    }

    // Update startup likes count
    const { error: updateErr } = await supabase
      .from("startups")
      .update({ likes: nextLikes })
      .eq("id", startup.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (isLiked) {
      const trackingSessionId = getTestingSessionIdFromCookie(req.headers.get("cookie"));
      await updateTestingSessionMetrics({
        systemType: AB_SYSTEM_TYPE_RECOMMENDATION,
        userId,
        sessionId: trackingSessionId,
        likesDelta: 1,
      });
    }

    return NextResponse.json({ likes: nextLikes, isLiked });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Get user ID from email
    const { data: userData, error: userErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userErr || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData.id;

    // Get startup
    const { data: startup, error: fetchErr } = await supabase
      .from("startups")
      .select("id, likes")
      .eq("slug", slug)
      .single();

    if (fetchErr || !startup) {
      return NextResponse.json({ error: fetchErr?.message || "Not found" }, { status: 404 });
    }

    // Check if user liked this startup
    const { data: existingLike } = await supabase
      .from("startup_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("startup_id", startup.id)
      .single();

    return NextResponse.json({
      likes: startup.likes || 0,
      isLiked: !!existingLike,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
} 