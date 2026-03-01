import { NextResponse } from "next/server";
import { getSimilarStartups } from "@/lib/recommendation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/similar?startupId=xxx&limit=6
 *
 * Returns startups similar to the given startup
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startupId = url.searchParams.get("startupId");
    const limit = parseInt(url.searchParams.get("limit") || "6");

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    let similar = await getSimilarStartups(startupId, limit);

    // if user is logged in, mark which of the similar startups they've liked
    if (session?.user?.email) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.user.email)
        .single();
      if (userData && similar.length > 0) {
        const ids = similar.map((rec) => rec.startup.id);
        const { data: likedRows } = await supabase
          .from('startup_likes')
          .select('startup_id')
          .eq('user_id', userData.id)
          .in('startup_id', ids);
        const likedIds = (likedRows || []).map((r) => r.startup_id);
        similar = similar.map((rec) => ({
          ...rec,
          startup: {
            ...rec.startup,
            isLiked: likedIds.includes(rec.startup.id),
          },
        }));
      }
    }

    return NextResponse.json({
      similar: similar.map((rec) => ({
        ...rec.startup,
        recommendation_score: rec.score,
        recommendation_reasons: rec.reasons,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
