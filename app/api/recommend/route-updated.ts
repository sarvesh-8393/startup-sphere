// app/api/recommend/route.ts
// Updated API endpoint to expose new recommendation features

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRecommendations, getTrendingStartups } from "@/lib/recommendation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Cap at 50
    const excludeStr = searchParams.get("exclude");
    const excludeIds = excludeStr ? excludeStr.split(",") : [];

    const session = await getServerSession(authOptions);

    // Personalized recommendations for logged-in users
    if (session?.user?.id) {
      const recommendations = await getRecommendations(
        session.user.id,
        limit,
        excludeIds
      );

      return NextResponse.json({
        success: true,
        count: recommendations.length,
        recommended: recommendations.map((r) => ({
          // Startup data
          ...r.startup,
          
          // Recommendation metadata
          recommendation_score: Math.round(r.score * 1000) / 1000,
          recommendation_reasons: r.reasons,
        })),
      });
    }

    // Trending recommendations for anonymous users (cold-start)
    const trending = await getTrendingStartups(limit, excludeIds);

    return NextResponse.json({
      success: true,
      count: trending.length,
      recommended: trending.map((r) => ({
        ...r.startup,
        recommendation_score: Math.round(r.score * 1000) / 1000,
        recommendation_reasons: r.reasons,
      })),
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

/**
 * Optional: Endpoint to get analytics about recommendations
 * Usage: GET /api/recommend/analytics?userId=xxx
 */
export async function getRecommendationAnalytics(userId: string) {
  try {
    // This is a helper function you can call from your analytics routes
    const recommendations = await getRecommendations(userId, 50);

    // Calculate metrics
    const totalScore = recommendations.reduce((sum, r) => sum + r.score, 0);
    const avgScore = totalScore / recommendations.length;
    const serendipitousCount = recommendations.filter(
      (r) => r.is_serendipitous
    ).length;
    // clustering not available with current embedding model
    const clusterCounts = new Map<number, number>();

    return {
      total_recommendations: recommendations.length,
      average_score: Math.round(avgScore * 1000) / 1000,
      serendipitous_count: serendipitousCount,
      serendipitous_percentage: Math.round(
        (serendipitousCount / recommendations.length) * 100
      ),
      cluster_distribution: Object.fromEntries(clusterCounts),
      score_distribution: {
        high: recommendations.filter((r) => r.score > 0.7).length,
        medium: recommendations.filter((r) => 0.4 < r.score && r.score <= 0.7)
          .length,
        low: recommendations.filter((r) => r.score <= 0.4).length,
      },
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
}
