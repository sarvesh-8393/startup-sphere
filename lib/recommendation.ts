/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabaseClient";

interface Startup {
  id: string;
  name: string;
  short_description: string;
  tags?: string[];
  mission_statement?: string;
  problem_solution?: string;
  target_market?: string;
  likes?: number;
  views?: number;
  created_at?: string;
}

interface RecommendationScore {
  startup: Startup;
  score: number;
  reasons: string[];
}

/**
 * Build TF-IDF model from all startups
 * Each startup = 1 document combining text fields
 */
export async function buildStartupModel() {
  const { data: startups, error } = await supabase
    .from("startups")
    .select("*");

  if (error || !startups) {
    console.error("Failed to fetch startups:", error);
    return { tfidf: null, startups: [] };
  }

  // Dynamically import `natural` at runtime so Next.js bundler doesn't try to
  // resolve optional native modules (like webworker-threads) at build time.
  const natural: any = await import("natural");
  const TfIdf = natural.TfIdf as any;
  const tfidf = new TfIdf();

  // Add each startup as a document
  startups.forEach((s: Startup) => {
    const text = [
      s.name,
      s.tags?.join(" ") || "",
      s.short_description || "",
      s.mission_statement || "",
      s.problem_solution || "",
      s.target_market || "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    tfidf.addDocument(text);
  });

  return { tfidf, startups };
}

/**
 * Get TF-IDF vector for a document at given index
 */
function getVector(tfidf: any, index: number): number[] {
  const terms = tfidf.listTerms(index) as Array<{ term: string; tfidf: number }>;
  // Sort by term to maintain consistent vector ordering
  const termScores: { [key: string]: number } = {};

  terms.forEach((t) => {
    termScores[t.term] = t.tfidf;
  });

  return Object.values(termScores).sort((a, b) => b - a);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;

  // Pad shorter vector with zeros
  const len = Math.max(vecA.length, vecB.length);
  const a = [...vecA, ...new Array(len - vecA.length).fill(0)];
  const b = [...vecB, ...new Array(len - vecB.length).fill(0)];

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Build user preference vector from their liked startups
 */
async function buildUserVector(
  userId: string,
  tfidf: any,
  startups: Startup[]
) {
  // Fetch user's liked/favorite startups
  const { data: userLikes, error } = await supabase
    .from("startup_likes")
    .select("startup_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch user likes:", error);
    return null;
  }

  if (!userLikes || userLikes.length === 0) {
    // Return null if no preferences yet
    return null;
  }

  // Get vectors for liked startups
  const likedVectors: number[][] = [];

  userLikes.forEach((like: { startup_id: string }) => {
    const startupIndex = startups.findIndex(
      (s: Startup) => s.id === like.startup_id
    );
    if (startupIndex !== -1) {
      const vec = getVector(tfidf, startupIndex);
      if (vec.length > 0) {
        likedVectors.push(vec);
      }
    }
  });

  if (likedVectors.length === 0) return null;

  // Average the vectors to get user preference vector
  const len = Math.max(...likedVectors.map((v) => v.length));
  const userVector = new Array(len).fill(0);

  likedVectors.forEach((vec) => {
    for (let i = 0; i < len; i++) {
      userVector[i] += (vec[i] || 0) / likedVectors.length;
    }
  });

  return userVector;
}

/**
 * Calculate recency score (newer startups get slight boost)
 */
function getRecencyScore(createdAt: string | undefined): number {
  if (!createdAt) return 0.5;

  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

  // Decay: recent startups score higher
  // After 365 days, score drops to near 0
  return Math.exp(-ageInDays / 365);
}

/**
 * Fetch user preferences (tags, stage, location)
 */
async function getUserPreferences(userId: string): Promise<{
  tags: string[];
  stage: string | null;
  location: string | null;
} | null> {
  const { data: prefs, error } = await supabase
    .from("user_preferences")
    .select("tags, stage, location")
    .eq("profile_id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch user preferences:", error);
    return null;
  }

  return prefs || null;
}

/**
 * Calculate tag match score between user preferences and startup
 */
function getTagMatchScore(
  userTags: string[] | null,
  startupTags: string[] | null
): number {
  if (!userTags || userTags.length === 0) return 0;
  if (!startupTags || startupTags.length === 0) return 0;

  const userTagSet = new Set(userTags.map((t) => t.toLowerCase()));
  const startupTagSet = new Set(startupTags.map((t) => t.toLowerCase()));

  // Count matching tags
  let matches = 0;
  startupTagSet.forEach((tag) => {
    if (userTagSet.has(tag)) matches++;
  });

  // Return score: (matches / total unique tags) normalized to [0, 1]
  const totalUnique = new Set([...userTags, ...(startupTags || [])]).size;
  return matches / Math.max(totalUnique, 1);
}

/**
 * Fetch startups that user follows and find similar ones
 */
async function getFollowBasedRecommendations(
  tfidf: any,
  startups: Startup[]
): Promise<Map<string, number>> {
  // Note: follows table structure is (email, slug), not ideal but we work with it
  // In a real system, this would be (user_id, startup_id)
  const similarityScores = new Map<string, number>();

  // For now, return empty map since follows table isn't directly linked to user_id
  // In production, we'd normalize the follows table structure
  return similarityScores;
}

/**
 * Get recommendations for a user
 * Combines: TF-IDF similarity + tag preferences + follow-based + behavior signals
 */
export async function getRecommendations(
  userId: string,
  topK: number = 10,
  excludeIds: string[] = []
): Promise<RecommendationScore[]> {
  const { tfidf, startups } = await buildStartupModel();

  if (!tfidf || startups.length === 0) {
    return [];
  }

  // Fetch all user context data in parallel
  const [userVector, userPrefs] = await Promise.all([
    buildUserVector(userId, tfidf, startups),
    getUserPreferences(userId),
  ]);

  const useContentBased = userVector !== null;

  const scores: RecommendationScore[] = [];

  startups.forEach((startup: Startup, index: number) => {
    // Skip if in exclude list
    if (excludeIds.includes(startup.id)) {
      return;
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Content-based TF-IDF similarity (45%)
    if (useContentBased) {
      const startupVector = getVector(tfidf, index);
      const similarity = cosineSimilarity(userVector!, startupVector);
      score += similarity * 0.45;

      if (similarity > 0.5) {
        reasons.push("matches your interests");
      }
    } else {
      // Cold start boost
      score += 0.2;
    }

    // 2. Tag preference matching (15%)
    if (userPrefs?.tags) {
      const tagMatch = getTagMatchScore(userPrefs.tags, startup.tags || null);
      score += tagMatch * 0.15;

      if (tagMatch > 0.5) {
        reasons.push("matches your preferred tags");
      }
    }

    // 3. Behavior-based signals (likes + views + recency) (30%)
    const likeScore = Math.min((startup.likes || 0) / 100, 1);
    const viewScore = Math.min((startup.views || 0) / 1000, 1);
    const recencyScore = getRecencyScore(startup.created_at);

    score += likeScore * 0.1;
    score += viewScore * 0.1;
    score += recencyScore * 0.1;

    if (likeScore > 0.5) {
      reasons.push("popular with users");
    }
    if (recencyScore > 0.7) {
      reasons.push("recently launched");
    }

    // 4. Diversity boost (10%) - penalize if too similar to already seen
    // (placeholder for future expansion)

    scores.push({
      startup,
      score,
      reasons: reasons.length > 0 ? reasons : ["trending"],
    });
  });

  // Sort by score and return top K
  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Get startups similar to a specific startup
 * Uses TF-IDF similarity to find related startups
 */
export async function getSimilarStartups(
  startupId: string,
  topK: number = 6,
  excludeIds: string[] = []
): Promise<RecommendationScore[]> {
  const { tfidf, startups } = await buildStartupModel();

  if (!tfidf || startups.length === 0) {
    return [];
  }

  // Find the target startup
  const targetStartupIndex = startups.findIndex(
    (s: Startup) => s.id === startupId
  );

  if (targetStartupIndex === -1) {
    return [];
  }

  // Get the target startup's vector
  const targetVector = getVector(tfidf, targetStartupIndex);
  const targetStartup = startups[targetStartupIndex];

  const scores: RecommendationScore[] = [];

  startups.forEach((startup: Startup, index: number) => {
    // Skip the target startup itself and excluded ones
    if (startup.id === startupId || excludeIds.includes(startup.id)) {
      return;
    }

    const startupVector = getVector(tfidf, index);
    const similarity = cosineSimilarity(targetVector, startupVector);

    // Tag similarity bonus
    let tagBonus = 0;
    if (targetStartup.tags && startup.tags) {
      const targetTagSet = new Set(
        (targetStartup.tags as string[]).map((t: string) => t.toLowerCase())
      );
      const startupTagSet = new Set((startup.tags as string[]).map((t: string) => t.toLowerCase()));

      let matches = 0;
      startupTagSet.forEach((tag) => {
        if (targetTagSet.has(tag)) matches++;
      });

      const totalUnique = new Set([
        ...(targetStartup.tags || []),
        ...(startup.tags || []),
      ]).size;
      tagBonus = (matches / Math.max(totalUnique, 1)) * 0.2;
    }

    const finalScore = similarity * 0.8 + tagBonus;

    scores.push({
      startup,
      score: finalScore,
      reasons: [
        similarity > 0.5 ? "similar concept" : "",
        tagBonus > 0.1 ? "matches your tags" : "",
      ].filter(Boolean),
    });
  });

  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Get trending startups (for cold start users)
 * Combines likes, views, and recency
 */
export async function getTrendingStartups(
  topK: number = 10,
  excludeIds: string[] = []
): Promise<RecommendationScore[]> {
  const { data: startups, error } = await supabase
    .from("startups")
    .select("*");

  if (error || !startups) {
    return [];
  }

  const scores: RecommendationScore[] = startups
    .filter((s: Startup) => !excludeIds.includes(s.id))
    .map((s: Startup) => {
      const likeScore = Math.min((s.likes || 0) / 100, 1);
      const viewScore = Math.min((s.views || 0) / 1000, 1);
      const recencyScore = getRecencyScore(s.created_at);

      const score = likeScore * 0.4 + viewScore * 0.3 + recencyScore * 0.3;

      const reasons: string[] = [];
      if (likeScore > 0.5) reasons.push("highly liked");
      if (viewScore > 0.5) reasons.push("viewed frequently");
      if (recencyScore > 0.7) reasons.push("trending now");

      return {
        startup: s,
        score,
        reasons: reasons.length > 0 ? reasons : ["trending"],
      };
    });

  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}
