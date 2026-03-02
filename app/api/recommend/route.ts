// app/api/recommend/route.ts
// Now uses embedding-based similarity instead of TF-IDF

import { getServerSession } from "next-auth";
import { getRecommendations, getTrendingStartups } from "@/lib/recommendation";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import {
  AB_SYSTEM_TYPE_RECOMMENDATION,
  getOrCreateTestingSessionId,
  getTestingSessionIdFromCookie,
} from "@/lib/testingSession";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const excludeParam = url.searchParams.get("exclude") || "";
    const excludeIds = excludeParam ? excludeParam.split(",") : [];

    const session = await getServerSession(authOptions);
    const trackingSessionId = getTestingSessionIdFromCookie(request.headers.get("cookie"));
    let trackingUserId: string | null = null;

    let recommendations: Record<string, unknown>[] = [];

    if (session?.user?.email) {
      // Logged-in user → personalized recommendations
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (userError || !userData) {
        // Can't find profile → fall back to trending
        const trending = await getTrendingStartups(limit, excludeIds);
        recommendations = trending.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
        }));
      } else {
        // Has profile → personalized
        trackingUserId = userData.id;
        const recs = await getRecommendations(userData.id, limit, excludeIds);
        recommendations = recs.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
          is_serendipitous: rec.is_serendipitous,
        }));

      }
    } else {
      // Anonymous user → trending
      const trending = await getTrendingStartups(limit, excludeIds);
      recommendations = trending.map((rec) => ({
        ...rec.startup,
        recommendation_score: rec.score,
        recommendation_reasons: rec.reasons,
      }));
    }

    // if the user was logged-in, compute isLiked for every returned startup
    if (session?.user?.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.user.email)
        .single();
      if (profile && recommendations.length > 0) {
        const ids = recommendations.map((r: Record<string, unknown>) => r.id);
        const { data: likedRows } = await supabase
          .from('startup_likes')
          .select('startup_id')
          .eq('user_id', profile.id)
          .in('startup_id', ids);
        const likedIds = (likedRows || []).map((r) => r.startup_id);
        recommendations = recommendations.map((r: Record<string, unknown>) => ({
          ...r,
          isLiked: likedIds.includes(r.id),
        }));
      }
    }

    // ensure missing flag defaults to false
    const payload = recommendations.map((r: Record<string, unknown>) => ({
      ...r,
      isLiked: !!(r as Record<string, unknown>).isLiked,
    }));

    await getOrCreateTestingSessionId({
      systemType: AB_SYSTEM_TYPE_RECOMMENDATION,
      userId: trackingUserId,
      sessionId: trackingSessionId,
    });

    return Response.json(
      {
        success: true,
        count: payload.length,
        recommended: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate recommendations";
    console.error("Recommendation API error:", error);
    return Response.json({ success: false, error: errorMessage }, { status: 500 });
  }
}