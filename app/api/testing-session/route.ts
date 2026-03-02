import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import {
  AB_SYSTEM_TYPE_BASELINE,
  getTestingSessionIdFromCookie,
  getOrCreateTestingSessionId,
  updateTestingSessionMetrics,
} from "@/lib/testingSession";

type EventType = "init" | "time_spent" | "rating";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      eventType?: EventType;
      timeSpentDelta?: number;
      rating?: number;
      system_type?: "baseline" | "recommendation";
    };

    const eventType: EventType = body.eventType || "init";
    const systemType = body.system_type || AB_SYSTEM_TYPE_BASELINE;
    const session = await getServerSession(authOptions);

    let userId: string | null = null;
    if (session?.user?.email) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();
      userId = userData?.id || null;
    }

    const cookieSessionId = getTestingSessionIdFromCookie(req.headers.get("cookie"));
    const effectiveSessionId = cookieSessionId || crypto.randomUUID();

    if (eventType === "time_spent") {
      const delta = Math.max(0, Math.floor(Number(body.timeSpentDelta || 0)));
      if (delta > 0) {
        await updateTestingSessionMetrics({
          systemType,
          userId,
          sessionId: effectiveSessionId,
          timeSpentDelta: delta,
        });
      }
    } else if (eventType === "rating") {
      const rating = Number(body.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
      }

      await updateTestingSessionMetrics({
        systemType,
        userId,
        sessionId: effectiveSessionId,
        rating: Math.round(rating),
      });
    } else {
      await getOrCreateTestingSessionId({
        systemType,
        userId,
        sessionId: effectiveSessionId,
      });
    }

    const res = NextResponse.json({ success: true });
    if (!cookieSessionId) {
      res.cookies.set("ab_testing_session_id", effectiveSessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
