import { supabase } from "@/lib/supabaseClient";

export const AB_SYSTEM_TYPE_BASELINE = "baseline";
export const AB_SYSTEM_TYPE_RECOMMENDATION = "recommendation";

type SessionLookupInput = {
  systemType: "baseline" | "recommendation";
  userId?: string | null;
  sessionId?: string | null;
};

type SessionUpdateInput = SessionLookupInput & {
  clicksDelta?: number;
  likesDelta?: number;
  timeSpentDelta?: number;
  rating?: number | null;
};

function parseCookie(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((segment) => segment.trim());
  const match = parts.find((segment) => segment.startsWith(`${key}=`));
  if (!match) return null;
  const value = match.slice(key.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function getTestingSessionIdFromCookie(cookieHeader: string | null): string | null {
  return parseCookie(cookieHeader, "ab_testing_session_id");
}

export async function getOrCreateTestingSessionId({
  systemType,
  userId,
  sessionId,
}: SessionLookupInput): Promise<string | null> {
  if (!userId && !sessionId) return null;

  let query = supabase
    .from("testing_sessions")
    .select("id")
    .eq("system_type", systemType)
    .limit(1);

  query = userId ? query.eq("user_id", userId) : query.eq("session_id", sessionId as string);

  const { data: existingRows } = await query;
  const existing = existingRows?.[0];
  if (existing?.id) return existing.id as string;

  const { data: insertedRows, error: insertError } = await supabase
    .from("testing_sessions")
    .insert([
      {
        system_type: systemType,
        user_id: userId ?? null,
        session_id: sessionId ?? null,
        clicks: 0,
        likes: 0,
        time_spent_seconds: 0,
        rating: null,
      },
    ])
    .select("id")
    .limit(1);

  if (insertError) {
    console.error("Failed to create testing session:", insertError.message);
    return null;
  }

  return insertedRows?.[0]?.id ?? null;
}

export async function updateTestingSessionMetrics({
  systemType,
  userId,
  sessionId,
  clicksDelta = 0,
  likesDelta = 0,
  timeSpentDelta = 0,
  rating,
}: SessionUpdateInput): Promise<void> {
  const rowId = await getOrCreateTestingSessionId({ systemType, userId, sessionId });
  if (!rowId) return;

  const { data: currentRows } = await supabase
    .from("testing_sessions")
    .select("clicks, likes, time_spent_seconds")
    .eq("id", rowId)
    .limit(1);

  const current = currentRows?.[0];
  if (!current) return;

  const nextClicks = Math.max(0, (current.clicks ?? 0) + clicksDelta);
  const nextLikes = Math.max(0, (current.likes ?? 0) + likesDelta);
  const nextTimeSpent = Math.max(0, (current.time_spent_seconds ?? 0) + timeSpentDelta);

  const updatePayload: {
    clicks: number;
    likes: number;
    time_spent_seconds: number;
    updated_at: string;
    rating?: number | null;
  } = {
    clicks: nextClicks,
    likes: nextLikes,
    time_spent_seconds: nextTimeSpent,
    updated_at: new Date().toISOString(),
  };

  if (typeof rating === "number") {
    updatePayload.rating = rating;
  }

  const { error: updateError } = await supabase
    .from("testing_sessions")
    .update(updatePayload)
    .eq("id", rowId);

  if (updateError) {
    console.error("Failed to update testing session metrics:", updateError.message);
  }
}
