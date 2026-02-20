import { NextResponse } from "next/server";
import { getSimilarStartups } from "@/lib/recommendation";

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

    const similar = await getSimilarStartups(startupId, limit);

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
