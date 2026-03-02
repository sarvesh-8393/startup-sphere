"use client";

import { useEffect, useRef } from "react";

const SYSTEM_TYPE = "recommendation";
const HEARTBEAT_SECONDS = 30;
const RATING_CHECK_INTERVAL_MS = 120000;
const RATING_COOLDOWN_MS = 10 * 60 * 1000;
const RATING_PROMPT_CHANCE = 0.35;
const LAST_RATING_PROMPT_KEY = "ab_last_rating_prompt_at";

async function postEvent(payload: Record<string, unknown>, keepalive = false) {
  try {
    await fetch("/api/testing-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_type: SYSTEM_TYPE, ...payload }),
      keepalive,
    });
  } catch {
    // Intentionally ignore client-side tracking failures
  }
}

export default function ABTestingTracker() {
  const visibleSecondsRef = useRef(0);

  useEffect(() => {
    postEvent({ eventType: "init" });

    const secondTicker = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        visibleSecondsRef.current += 1;
      }
    }, 1000);

    const flushTimeSpent = (keepalive = false) => {
      const delta = visibleSecondsRef.current;
      if (delta <= 0) return;
      visibleSecondsRef.current = 0;
      postEvent({ eventType: "time_spent", timeSpentDelta: delta }, keepalive);
    };

    const heartbeatTimer = window.setInterval(() => {
      flushTimeSpent();
    }, HEARTBEAT_SECONDS * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushTimeSpent(true);
      }
    };

    const maybeAskForRating = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      const lastPromptRaw = localStorage.getItem(LAST_RATING_PROMPT_KEY);
      const lastPromptAt = lastPromptRaw ? Number(lastPromptRaw) : 0;

      if (now - lastPromptAt < RATING_COOLDOWN_MS) return;
      if (Math.random() > RATING_PROMPT_CHANCE) return;

      localStorage.setItem(LAST_RATING_PROMPT_KEY, String(now));
      const answer = window.prompt("Quick rating (1-5): How good are your recommendations right now?");
      if (!answer) return;

      const rating = Number(answer);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

      await postEvent({ eventType: "rating", rating });
    };

    const ratingTimer = window.setInterval(() => {
      void maybeAskForRating();
    }, RATING_CHECK_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", () => flushTimeSpent(true));
    window.addEventListener("beforeunload", () => flushTimeSpent(true));

    return () => {
      window.clearInterval(secondTicker);
      window.clearInterval(heartbeatTimer);
      window.clearInterval(ratingTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushTimeSpent(true);
    };
  }, []);

  return null;
}
