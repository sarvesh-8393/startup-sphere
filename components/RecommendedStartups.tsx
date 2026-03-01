"use client";

import React, { useEffect, useState } from "react";
import StartupCard, { Startup } from "./StartupCard";
import { Loader2 } from "lucide-react";

interface RecommendedStartup extends Startup {
  recommendation_score?: number;
  recommendation_reasons?: string[];
  isLiked?: boolean;
}

export default function RecommendedStartups() {
  const [recommendations, setRecommendations] = useState<
    RecommendedStartup[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        // include liked startups in the returned list so the user can still
        // see items they recently liked on refresh
        const res = await fetch("/api/recommend?limit=6&filter_liked=false");

        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await res.json() as { recommended: RecommendedStartup[] };
        setRecommendations(data.recommended || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error fetching recommendations:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show section if error or no recommendations
  }

  return (
    <section className="w-full py-12 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 Recommended For You
          </h2>
          <p className="text-gray-600">
            AI-powered recommendations based on your interests
          </p>
        </div>

        <StartupCard startups={recommendations} showMatchScore={true} />
      </div>
    </section>
  );
}
