'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import StartupCard, { Startup } from './StartupCard';

interface SimilarStartup extends Startup {
  recommendation_score?: number;
  recommendation_reasons?: string[];
  isLiked?: boolean;
}

export default function SimilarStartups({ startupId, startupName }: { startupId: string; startupName: string }) {
  const [similar, setSimilar] = useState<SimilarStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilarStartups() {
      try {
        setLoading(true);
        const res = await fetch(`/api/similar?startupId=${startupId}&limit=6`);

        if (!res.ok) {
          throw new Error('Failed to fetch similar startups');
        }

        const data = await res.json() as { similar: SimilarStartup[] };
        setSimilar(data.similar || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching similar startups:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarStartups();
  }, [startupId]);

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || similar.length === 0) {
    return null;
  }

  return (
    <section id="similar-startups" className="w-full py-12 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ Similar to {startupName}
          </h2>
          <p className="text-gray-600">
            You might also like these startups
          </p>
        </div>

        <StartupCard startups={similar} showMatchScore={true} />
      </div>
    </section>
  );
}
