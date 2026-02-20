import { getServerSession } from "next-auth";
import { getRecommendations, getTrendingStartups } from "@/lib/recommendation";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
  id: string;
}

/**
 * GET /api/recommend?limit=10&exclude=id1,id2
 *
 * Returns personalized startup recommendations
 * - If user is logged in: content-based + behavior-aware recommendations
 * - If user is not logged in: trending startups
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const excludeParam = url.searchParams.get("exclude") || "";
    const excludeIds = excludeParam ? excludeParam.split(",") : [];

    // Get session
    const session = await getServerSession(authOptions);

    let recommendations: unknown[] = [];

    if (session?.user?.email) {
      // Get user ID from email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (userError || !userData) {
        // If user not found, return trending
        const trending = await getTrendingStartups(limit, excludeIds);
        recommendations = trending.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
        }));
      } else {
        const typedUserData = userData as UserData;
        // Get personalized recommendations
        const recs = await getRecommendations(typedUserData.id, limit, excludeIds);
        recommendations = recs.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
        }));
      }
    } else {
      // Not logged in: return trending startups
      const trending = await getTrendingStartups(limit, excludeIds);
      recommendations = trending.map((rec) => ({
        ...rec.startup,
        recommendation_score: rec.score,
        recommendation_reasons: rec.reasons,
      }));
    }

    return Response.json(
      {
        success: true,
        count: recommendations.length,
        recommended: recommendations,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendations";
    console.error("Recommendation API error:", error);
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
