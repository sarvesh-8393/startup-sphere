/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabaseClient";

interface Startup {
  id: string;
  name: string;
  short_description?: string;
  slug?: string;
  description?: string;
  tags?: string[];
  mission_statement?: string;
  problem_solution?: string;
  target_market?: string;
  likes_count?: number;
  likes?: number;
  views_count?: number;
  views?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface RecommendationScore {
  startup: Startup;
  score: number;
  reasons: string[];
  cluster_source?: number;
  is_serendipitous?: boolean;
}

interface UserPreferences {
  tags?: string[];
  stage?: string;
  location?: string;
}

// ============================================================
// STEP 1: TEXT PROCESSING & HELPERS
// ============================================================

/**
 * Builds a single text string from a startup's fields for TF-IDF vectorization
 */
function buildStartupText(startup: Startup): string {
  return [
    startup.name || "",
    startup.short_description || "",
    startup.description || "",
    startup.mission_statement || "",
    startup.problem_solution || "",
    startup.target_market || "",
    (startup.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .trim();
}

/**
 * Cosine similarity between two sparse term-frequency maps
 */
function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  if (vecA.size === 0 || vecB.size === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  vecA.forEach((val, key) => {
    dot += val * (vecB.get(key) || 0);
    magA += val * val;
  });

  vecB.forEach((val) => {
    magB += val * val;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Euclidean distance between two dense vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

/**
 * TF-IDF Vectorization: builds sparse vectors for all startups
 * Returns: Map of startup_id → sparse term-frequency map
 */
async function buildTfIdfVectors(
  startups: Startup[]
): Promise<Map<string, Map<string, number>>> {
  const natural: any = await import("natural");
  const TfIdf = natural.TfIdf as any;
  const tfidf = new TfIdf();

  // Add each startup's text as a document
  startups.forEach((s) => tfidf.addDocument(buildStartupText(s)));

  const vectors = new Map<string, Map<string, number>>();

  startups.forEach((startup, idx) => {
    const termMap = new Map<string, number>();
    tfidf.listTerms(idx).forEach((item: any) => {
      termMap.set(item.term, item.tfidf);
    });
    vectors.set(startup.id, termMap);
  });

  return vectors;
}

// ============================================================
// STEP 2: MULTI-INTEREST CLUSTERING (K-Means)
// ============================================================

/**
 * Collects all unique terms across a set of vectors (for vocabulary building)
 */
function getVocabulary(vectors: Map<string, number>[]): string[] {
  const vocab = new Set<string>();
  vectors.forEach((v) => v.forEach((_, term) => vocab.add(term)));
  return Array.from(vocab);
}

/**
 * Converts sparse term map to dense numeric array using shared vocabulary
 */
function toDenseVector(
  termMap: Map<string, number>,
  vocab: string[]
): number[] {
  return vocab.map((term) => termMap.get(term) || 0);
}

/**
 * K-Means clustering implementation
 * Returns: cluster assignment for each vector (array index → cluster index)
 */
function kMeans(
  vectors: number[][],
  k: number,
  maxIterations = 20
): number[] {
  if (vectors.length === 0) return [];

  // Cap k to number of vectors
  k = Math.min(k, vectors.length);

  const dim = vectors[0].length;

  // Initialize centroids: randomly pick k vectors as starting centroids
  const centroidIndices = new Set<number>();
  while (centroidIndices.size < k) {
    centroidIndices.add(Math.floor(Math.random() * vectors.length));
  }
  let centroids: number[][] = Array.from(centroidIndices).map(
    (i) => [...vectors[i]]
  );

  let assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assignment step: assign each vector to nearest centroid
    const newAssignments = vectors.map((vec) => {
      let minDist = Infinity;
      let bestCluster = 0;
      centroids.forEach((centroid, ci) => {
        const dist = euclideanDistance(vec, centroid);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = ci;
        }
      });
      return bestCluster;
    });

    // Check for convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;

    if (!changed) break;

    // Update step: recompute centroids as mean of assigned vectors
    const newCentroids: number[][] = Array.from({ length: k }, () =>
      new Array(dim).fill(0)
    );
    const counts = new Array(k).fill(0);

    vectors.forEach((vec, i) => {
      const cluster = assignments[i];
      vec.forEach((val, d) => (newCentroids[cluster][d] += val));
      counts[cluster]++;
    });

    centroids = newCentroids.map((centroid, ci) =>
      counts[ci] > 0 ? centroid.map((v) => v / counts[ci]) : centroid
    );
  }

  return assignments;
}

/**
 * Converts a dense vector back to sparse term map
 */
function denseToTermMap(
  denseVec: number[],
  vocab: string[]
): Map<string, number> {
  const map = new Map<string, number>();
  denseVec.forEach((val, i) => {
    if (val > 0.001) map.set(vocab[i], val); // threshold to avoid tiny values
  });
  return map;
}

/**
 * MAIN: Builds multiple interest clusters from user's liked startups.
 *
 * Instead of averaging all liked startups into one blurry vector,
 * we cluster them to identify distinct interest areas.
 *
 * Example: User liked 5 startups → detects 2 clusters:
 *   Cluster 1: AI startups (3 items) → AI vector
 *   Cluster 2: Fintech startups (2 items) → Fintech vector
 *
 * Returns: Array of cluster centroid vectors (as sparse term maps)
 */
export function buildUserInterestClusters(
  likedStartups: Startup[],
  tfidfVectors: Map<string, Map<string, number>>
): Map<string, number>[] {
  if (likedStartups.length === 0) return [];

  // Gather vectors for liked startups only
  const likedVectors: Map<string, number>[] = likedStartups
    .map((s) => tfidfVectors.get(s.id))
    .filter((v): v is Map<string, number> => v !== undefined);

  if (likedVectors.length === 0) return [];

  // If very few liked startups, just average them (no need to cluster)
  if (likedVectors.length <= 2) {
    return [averageVectors(likedVectors)];
  }

  // Determine k: sqrt heuristic, capped at 4 interest clusters max
  const k = Math.min(Math.ceil(Math.sqrt(likedVectors.length)), 4);

  // Build shared vocabulary & convert to dense vectors for K-Means
  const vocab = getVocabulary(likedVectors);
  const denseVectors = likedVectors.map((v) => toDenseVector(v, vocab));

  // Run K-Means clustering
  const assignments = kMeans(denseVectors, k);

  // Compute one centroid (mean vector) per cluster
  const clusterSums: number[][] = Array.from({ length: k }, () =>
    new Array(vocab.length).fill(0)
  );
  const clusterCounts = new Array(k).fill(0);

  denseVectors.forEach((vec, i) => {
    const cluster = assignments[i];
    vec.forEach((val, d) => (clusterSums[cluster][d] += val));
    clusterCounts[cluster]++;
  });

  // Convert cluster centroids back to sparse maps
  const clusterCentroids: Map<string, number>[] = clusterSums
    .map((sum, ci) =>
      clusterCounts[ci] > 0
        ? denseToTermMap(
            sum.map((v) => v / clusterCounts[ci]),
            vocab
          )
        : null
    )
    .filter((c): c is Map<string, number> => c !== null && c.size > 0);

  return clusterCentroids;
}

/**
 * Average multiple sparse vectors into one
 */
function averageVectors(vectors: Map<string, number>[]): Map<string, number> {
  const result = new Map<string, number>();
  const n = vectors.length;
  vectors.forEach((v) => {
    v.forEach((val, term) => {
      result.set(term, (result.get(term) || 0) + val / n);
    });
  });
  return result;
}

// ============================================================
// STEP 3: SERENDIPITY ENGINE
// ============================================================

/**
 * Computes a serendipity score for a startup relative to user's history.
 *
 * High serendipity = startup is relevant but DIFFERENT from what user usually sees.
 *
 * Formula:
 *   serendipity = relevanceToCluster × (1 - similarityToHistory)
 *
 * This ensures we don't recommend completely random startups —
 * only ones that are "surprisingly relevant" (novelty + relevance).
 */
export function computeSerendipityScore(
  startupVector: Map<string, number>,
  interestClusters: Map<string, number>[],
  userHistoryVectors: Map<string, number>[]
): number {
  if (interestClusters.length === 0) return 0;

  // Step 1: Find max relevance to any interest cluster
  const maxClusterSimilarity = Math.max(
    ...interestClusters.map((cluster) =>
      cosineSimilarity(startupVector, cluster)
    )
  );

  // No relevance at all? Skip (don't score this as serendipitous)
  if (maxClusterSimilarity < 0.05) return 0;

  // Step 2: Find max similarity to already-seen/liked startups
  const maxHistorySimilarity =
    userHistoryVectors.length > 0
      ? Math.max(
          ...userHistoryVectors.map((hv) =>
            cosineSimilarity(startupVector, hv)
          )
        )
      : 0;

  // Step 3: Serendipity = relevant but novel
  // A startup that is 70% relevant to a cluster but only 20% similar to history
  // scores: 0.7 × (1 - 0.2) = 0.56
  const serendipityScore = maxClusterSimilarity * (1 - maxHistorySimilarity);

  return Math.max(0, Math.min(1, serendipityScore));
}

// ============================================================
// STEP 4: SCORING HELPERS
// ============================================================

/**
 * Jaccard similarity between user tags and startup tags
 */
function tagMatchScore(startupTags: string[], userTags: string[]): number {
  if (!startupTags?.length || !userTags?.length) return 0;
  const a = new Set(startupTags.map((t) => t.toLowerCase()));
  const b = new Set(userTags.map((t) => t.toLowerCase()));
  const intersection = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Normalizes engagement metrics (likes and views)
 */
function engagementScore(
  likes: number,
  views: number
): { likes: number; views: number } {
  return {
    likes: Math.min((likes || 0) / 100, 1),
    views: Math.min((views || 0) / 1000, 1),
  };
}

/**
 * Recency score: newer startups score higher (exponential decay)
 */
function recencyScore(createdAt?: string): number {
  if (!createdAt) return 0.5;
  const days =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-days / 365);
}

/**
 * Fetch user's liked startups from database
 */
async function getLikedStartups(userId: string): Promise<Startup[]> {
  const { data: likes, error } = await supabase
    .from("startup_likes")
    .select("startup_id")
    .eq("user_id", userId);

  if (error || !likes) {
    console.error("Failed to fetch user likes:", error);
    return [];
  }

  // Fetch full startup data for liked IDs
  const startupIds = likes.map((l: any) => l.startup_id);
  if (startupIds.length === 0) return [];

  const { data: startups, error: startupsError } = await supabase
    .from("startups")
    .select("*")
    .in("id", startupIds);

  if (startupsError) {
    console.error("Failed to fetch startup details:", startupsError);
    return [];
  }

  return startups || [];
}

/**
 * Fetch user preferences (tags, stage, location)
 */
async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
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

// ============================================================
// STEP 5: MAIN RECOMMENDATION FUNCTION (WITH CLUSTERING & SERENDIPITY)
// ============================================================

/**
 * Gets personalized recommendations for a logged-in user.
 *
 * NEW: Uses K-Means clustering to model multiple distinct user interests,
 * then balances relevance with serendipity to prevent filter bubbles.
 *
 * Scoring formula:
 *   Score = 0.35×BestClusterSim + 0.15×TagMatch + 0.10×Likes
 *          + 0.10×Views + 0.10×Recency + 0.20×Serendipity
 *
 * The 0.20 weight on serendipity means ~20% of ranking is driven by discovery value,
 * which naturally surfaces ~2 out of 10 recommendations as "happy surprises".
 */
export async function getRecommendations(
  userId: string,
  topK: number = 10,
  excludeIds: string[] = []
): Promise<RecommendationScore[]> {
  // Fetch all startups and user's liked startups
  const { data: allStartups, error: startupsError } = await supabase
    .from("startups")
    .select("*");

  if (startupsError || !allStartups || allStartups.length === 0) {
    console.error("Failed to fetch startups:", startupsError);
    return [];
  }

  const likedStartups = await getLikedStartups(userId);
  const userPreferences = await getUserPreferences(userId);

  // Build TF-IDF vectors for all startups
  const tfidfVectors = await buildTfIdfVectors(allStartups);

  // Build multi-interest clusters from liked startups
  const interestClusters = buildUserInterestClusters(
    likedStartups,
    tfidfVectors
  );

  // Get history vectors (for serendipity calculation)
  const historyVectors: Map<string, number>[] = likedStartups
    .map((s) => tfidfVectors.get(s.id))
    .filter((v): v is Map<string, number> => v !== undefined);

  const likedIds = new Set(likedStartups.map((s) => s.id));
  const userTags = userPreferences?.tags || [];

  // Score every startup
  const scored: RecommendationScore[] = allStartups
    .filter((s) => s.id !== userId && !likedIds.has(s.id)) // exclude already-liked
    .filter((s) => !excludeIds.includes(s.id))
    .map((startup) => {
      const startupVec = tfidfVectors.get(startup.id) || new Map();

      // 1. Best content similarity across all interest clusters
      let bestClusterSim = 0;
      let bestClusterIdx = -1;
      if (interestClusters.length > 0) {
        interestClusters.forEach((cluster, idx) => {
          const sim = cosineSimilarity(startupVec, cluster);
          if (sim > bestClusterSim) {
            bestClusterSim = sim;
            bestClusterIdx = idx;
          }
        });
      }

      // 2. Tag match
      const tagScore = tagMatchScore(startup.tags || [], userTags);

      // 3. Engagement signals (use normalized field names)
      const engagement = engagementScore(
        startup.likes_count || startup.likes || 0,
        startup.views_count || startup.views || 0
      );

      // 4. Recency
      const recency = recencyScore(startup.created_at);

      // 5. Serendipity
      const serendipity = computeSerendipityScore(
        startupVec,
        interestClusters,
        historyVectors
      );

      // Hybrid score: Content(0.35) + Tags(0.15) + Likes(0.10) + Views(0.10) + Recency(0.10) + Serendipity(0.20)
      const score =
        0.35 * bestClusterSim +
        0.15 * tagScore +
        0.1 * engagement.likes +
        0.1 * engagement.views +
        0.1 * recency +
        0.2 * serendipity;

      // Generate human-readable reasons
      const reasons: string[] = [];
      if (bestClusterSim > 0.4) reasons.push("matches your interests");
      if (tagScore > 0.3) reasons.push("matches your tags");
      if (engagement.likes > 0.5) reasons.push("popular with users");
      if (recency > 0.7) reasons.push("trending now");
      if (serendipity > 0.4 && bestClusterSim < 0.4)
        reasons.push("discovery pick for you");
      if (reasons.length === 0) reasons.push("recommended for you");

      return {
        startup,
        score,
        reasons,
        cluster_source: bestClusterIdx,
        is_serendipitous: serendipity > 0.4 && bestClusterSim < 0.4,
      };
    });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Builds TF-IDF model from all startups (legacy function for compatibility)
 */


/**
 * Get startups similar to a specific startup.
 * Uses TF-IDF similarity + tag overlap for recommendation.
 * Used on individual startup detail pages.
 */
export async function getSimilarStartups(
  startupId: string,
  topK: number = 6,
  excludeIds: string[] = []
): Promise<RecommendationScore[]> {
  const { data: allStartups, error } = await supabase
    .from("startups")
    .select("*");

  if (error || !allStartups || allStartups.length === 0) {
    return [];
  }

  // Find the target startup
  const targetStartup = allStartups.find((s) => s.id === startupId);
  if (!targetStartup) {
    return [];
  }

  // Build TF-IDF vectors
  const tfidfVectors = await buildTfIdfVectors(allStartups);
  const targetVec = tfidfVectors.get(startupId) || new Map();

  // Score and rank similar startups
  const scores: RecommendationScore[] = allStartups
    .filter((s) => s.id !== startupId && !excludeIds.includes(s.id))
    .map((startup) => {
      const startupVec = tfidfVectors.get(startup.id) || new Map();
      const contentSim = cosineSimilarity(startupVec, targetVec);
      const tagScore = tagMatchScore(
        startup.tags || [],
        targetStartup.tags || []
      );
      const score = 0.6 * contentSim + 0.4 * tagScore;

      return {
        startup,
        score,
        reasons: ["similar to this startup"],
        is_serendipitous: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scores;
}

/**
 * Get trending startups (for cold-start / anonymous users).
 * Uses engagement signals (likes, views) + recency.
 * No clustering needed — just popularity ranking.
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
      const engagement = engagementScore(
        s.likes_count || s.likes || 0,
        s.views_count || s.views || 0
      );
      const recency = recencyScore(s.created_at);

      const score = 0.4 * engagement.likes + 0.3 * engagement.views + 0.3 * recency;

      const reasons: string[] = [];
      if (engagement.likes > 0.5) reasons.push("highly liked");
      if (engagement.views > 0.5) reasons.push("viewed frequently");
      if (recency > 0.7) reasons.push("trending now");

      return {
        startup: s,
        score,
        reasons: reasons.length > 0 ? reasons : ["trending"],
        is_serendipitous: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scores;
}
