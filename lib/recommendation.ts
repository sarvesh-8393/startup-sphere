// lib/recommendation.ts
// Embedding-based recommendation engine with K-Means Multi-Interest Clustering
// Replaces single averaged vector with multiple cluster centroids

import { supabase } from "@/lib/supabaseClient";
import { averageVectors, cosineSimilarity } from "@/lib/embedding";

// ============================================================
// TYPES
// ============================================================

export interface Startup {
  id: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  image_url?: string | null;
  tags?: string[];
  funding_stage?: string;
  likes?: number;
  views?: number;
  created_at?: string;
  embedding?: number[];
  [key: string]: unknown;
}

export interface RecommendationResult {
  startup: Startup;
  score: number;
  reasons: string[];
  is_serendipitous?: boolean;
  matched_cluster?: number; // which interest cluster this came from (0-indexed)
}

// ============================================================
// K-MEANS CLUSTERING
// ============================================================

/**
 * Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * K-Means clustering on a set of embedding vectors.
 * Returns an array of cluster centroid vectors.
 *
 * Example:
 *   Input:  [ai_vec1, ai_vec2, ai_vec3, fintech_vec1, fintech_vec2]
 *   k = 2
 *   Output: [ai_centroid, fintech_centroid]
 */
function kMeansClusters(vectors: number[][], k: number, maxIterations = 20): number[][] {
  if (vectors.length === 0) return [];

  // Not enough vectors to form k clusters — return each vector as its own cluster
  if (vectors.length <= k) return vectors.map((v) => [...v]);

  const dim = vectors[0].length;

  // Initialize: pick k random vectors as starting centroids
  const shuffled = [...vectors].sort(() => Math.random() - 0.5);
  let centroids: number[][] = shuffled.slice(0, k).map((v) => [...v]);
  let assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assignment step: assign each vector to nearest centroid
    const newAssignments = vectors.map((vec) => {
      let bestCluster = 0;
      let bestDist = Infinity;
      centroids.forEach((centroid, ci) => {
        const dist = euclideanDistance(vec, centroid);
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = ci;
        }
      });
      return bestCluster;
    });

    // Check convergence: stop if nothing changed
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    if (!changed) break;

    // Update step: recompute each centroid as mean of assigned vectors
    const sums: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);

    vectors.forEach((vec, i) => {
      const cluster = assignments[i];
      vec.forEach((val, d) => (sums[cluster][d] += val));
      counts[cluster]++;
    });

    centroids = sums.map((sum, ci) =>
      counts[ci] > 0 ? sum.map((v) => v / counts[ci]) : centroids[ci]
    );
  }

  return centroids;
}

/**
 * Decides how many clusters (k) to create.
 *
 * Formula: k = min(ceil(sqrt(n)), 4)
 *
 * n liked  → k clusters
 * 1        → 1  (no clustering, just one vector)
 * 4        → 2
 * 9        → 3
 * 16+      → 4  (capped at 4 max)
 */
function decideK(n: number): number {
  return Math.min(Math.ceil(Math.sqrt(n)), 4);
}

/**
 * MAIN CLUSTERING FUNCTION
 * Builds interest cluster centroids + weights from liked startup embeddings.
 *
 * Returns:
 *   centroids: one vector per cluster (the "center" of that interest area)
 *   weights:   how much the user cares about each cluster (based on liked count)
 *
 * Example:
 *   User likes 3 AI + 2 Fintech startups → k=2
 *   centroids = [AI centroid, Fintech centroid]
 *   weights   = [0.60, 0.40]   ← user likes AI more
 */
function buildInterestClusters(likedEmbeddings: number[][]): {
  centroids: number[][];
  weights: number[];
} {
  if (likedEmbeddings.length === 0) return { centroids: [], weights: [] };

  const k = decideK(likedEmbeddings.length);

  if (k === 1) {
    return {
      centroids: [averageVectors(likedEmbeddings)],
      weights: [1.0],
    };
  }

  const centroids = kMeansClusters(likedEmbeddings, k);

  // Count how many liked startups belong to each cluster
  const counts = new Array(centroids.length).fill(0);
  likedEmbeddings.forEach((vec) => {
    let bestCluster = 0;
    let bestDist = Infinity;
    centroids.forEach((centroid, ci) => {
      const dist = euclideanDistance(vec, centroid);
      if (dist < bestDist) {
        bestDist = dist;
        bestCluster = ci;
      }
    });
    counts[bestCluster]++;
  });

  // Weight = proportion of liked startups in this cluster
  // Example: counts=[3,2], total=5 → weights=[0.60, 0.40]
  const total = likedEmbeddings.length;
  const weights = counts.map((c) => c / total);

  return { centroids, weights };
}

/**
 * Computes a WEIGHTED similarity score across all clusters.
 *
 * Instead of just taking the best cluster match, we weight each cluster
 * by how many startups the user liked in it.
 *
 * Example:
 *   User liked 3 AI + 2 Fintech startups
 *   AI cluster weight     = 3/5 = 0.60
 *   Fintech cluster weight = 2/5 = 0.40
 *
 *   New AI startup:
 *     sim vs AI      = 0.80 × 0.60 = 0.48
 *     sim vs Fintech = 0.20 × 0.40 = 0.08
 *     weighted score = 0.56  ← ranks higher
 *
 *   New Fintech startup:
 *     sim vs AI      = 0.20 × 0.60 = 0.12
 *     sim vs Fintech = 0.71 × 0.40 = 0.28
 *     weighted score = 0.40  ← ranks lower, user prefers AI
 *
 * This naturally surfaces more AI recommendations since user likes AI more.
 */
function bestClusterMatch(
  embedding: number[],
  clusters: number[][],
  clusterWeights: number[]  // weight per cluster based on liked count
): { score: number; clusterIndex: number } {
  let weightedScore = 0;
  let bestCluster = 0;
  let bestRawSim = 0;

  clusters.forEach((centroid, idx) => {
    const sim = cosineSimilarity(embedding, centroid);
    const weight = clusterWeights[idx] || (1 / clusters.length);
    weightedScore += sim * weight;

    // track which cluster had the highest raw similarity (for logging)
    if (sim > bestRawSim) {
      bestRawSim = sim;
      bestCluster = idx;
    }
  });

  return { score: weightedScore, clusterIndex: bestCluster };
}

// ============================================================
// SCORING HELPERS
// ============================================================

function tagMatchScore(startupTags: string[], userTags: string[]): number {
  if (!startupTags?.length || !userTags?.length) return 0;
  const a = new Set(startupTags.map((t) => t.toLowerCase()));
  const b = new Set(userTags.map((t) => t.toLowerCase()));
  const intersection = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

function likesScore(likes: number): number {
  return Math.min((likes || 0) / 100, 1);
}

function viewsScore(views: number): number {
  return Math.min((views || 0) / 1000, 1);
}

function recencyScore(createdAt?: string): number {
  if (!createdAt) return 0.5;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-days / 365);
}

/**
 * Serendipity score: relevant to user but different from what they already liked.
 *
 * Formula: bestClusterSimilarity × (1 - maxSimilarityToHistory)
 *
 * High serendipity = matches user's interests BUT is very different from liked startups
 * This surfaces "happy surprises" — things user would enjoy but never thought to search for
 */
function serendipityScore(
  startupEmbedding: number[],
  centroids: number[][],
  weights: number[],
  historyEmbeddings: number[][]
): number {
  // How relevant is this to the user's interests (weighted by cluster preference)
  const relevance = bestClusterMatch(startupEmbedding, centroids, weights).score;
  if (relevance < 0.05) return 0;

  // How similar is this to startups user already liked
  const maxHistorySim =
    historyEmbeddings.length > 0
      ? Math.max(...historyEmbeddings.map((h) => cosineSimilarity(startupEmbedding, h)))
      : 0;

  return Math.max(0, Math.min(1, relevance * (1 - maxHistorySim)));
}

// ============================================================
// EMBEDDING NORMALIZATION
// ============================================================

/**
 * Supabase pgvector sometimes returns the vector column as a string "[0.1,0.2,...]"
 * This normalizes it to a proper number array regardless.
 */
function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.length > 0) return raw as number[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as number[];
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================
// MAIN: PERSONALIZED RECOMMENDATIONS
// ============================================================

/**
 * Full recommendation pipeline:
 *
 * 1. Fetch user's liked startups + embeddings
 * 2. Run K-Means → multiple interest cluster centroids
 * 3. For each candidate: find best matching cluster
 * 4. Score: 0.35×ClusterSim + 0.15×Tags + 0.10×Likes + 0.10×Views + 0.10×Recency + 0.20×Serendipity
 * 5. Return top K with reasons
 */
export async function getRecommendations(
  userId: string,
  limit = 10,
  excludeIds: string[] = [],
  filterLiked = true
): Promise<RecommendationResult[]> {

  // --- Fetch liked startup IDs ---
  const { data: likedRows } = await supabase
    .from("startup_likes")
    .select("startup_id")
    .eq("user_id", userId);

  const likedIds: string[] = (likedRows || []).map((r) => r.startup_id);

  if (likedIds.length === 0) {
    return getTrendingStartups(limit, excludeIds);
  }

  // --- Fetch embeddings + tags for liked startups ---
  const { data: likedStartups } = await supabase
    .from("startups")
    .select("id, embedding, tags")
    .in("id", likedIds);

  if (!likedStartups || likedStartups.length === 0) {
    return getTrendingStartups(limit, excludeIds);
  }

  // Extract valid embeddings
  const likedEmbeddings: number[][] = likedStartups
    .map((s) => parseEmbedding(s.embedding))
    .filter((e): e is number[] => e !== null);

  if (likedEmbeddings.length === 0) {
    return getTrendingStartups(limit, excludeIds);
  }

  // Collect user tags from liked startups
  const userTags = Array.from(new Set(likedStartups.flatMap((s) => s.tags || [])));

  // --- Build K-Means interest clusters with weights ---
  // KEY INNOVATION: Instead of one blurry average, we get k distinct interest centroids
  // User likes 3 AI + 2 Fintech → centroids=[AI, Fintech], weights=[0.60, 0.40]
  // AI startup scores higher because user historically prefers AI
  const { centroids: interestClusters, weights: clusterWeights } = buildInterestClusters(likedEmbeddings);

  console.log(
    `K-Means clustering: ${likedEmbeddings.length} liked startups → ${interestClusters.length} cluster(s), weights: [${clusterWeights.map(w => w.toFixed(2)).join(', ')}]`
  );

  // --- IDs to exclude ---
  const allExcludeIds = filterLiked
    ? [...new Set([...likedIds, ...excludeIds])]
    : [...new Set([...excludeIds])];

  // --- Fetch candidate startups ---
  const { data: candidates } = await supabase
    .from("startups")
    .select("id, name, slug, short_description, description, image_url, tags, funding_stage, likes, views, created_at, embedding, founder_id, profiles(full_name, avatar_url)")
    .not("id", "in", `(${allExcludeIds.join(",")})`)
    .not("embedding", "is", null)
    .limit(limit * 3);

  if (!candidates || candidates.length === 0) {
    return getTrendingStartups(limit, excludeIds);
  }

  // --- Score each candidate ---
  const scored: RecommendationResult[] = candidates
    .map((startup) => {
      const embedding = parseEmbedding(startup.embedding);
      if (!embedding) return null;

      // Weighted cluster similarity
      // A Fintech startup scores high against Fintech cluster
      // but is weighted down if user likes AI more (clusterWeights)
      const { score: clusterSim, clusterIndex } = bestClusterMatch(embedding, interestClusters, clusterWeights);

      const tagScore = tagMatchScore(startup.tags || [], userTags);
      const lScore = likesScore(startup.likes || 0);
      const vScore = viewsScore(startup.views || 0);
      const recency = recencyScore(startup.created_at);
      const sScore = serendipityScore(embedding, interestClusters, clusterWeights, likedEmbeddings);

      const score =
        0.35 * clusterSim +
        0.15 * tagScore +
        0.10 * lScore +
        0.10 * vScore +
        0.10 * recency +
        0.20 * sScore;

      const reasons: string[] = [];
      if (clusterSim > 0.6) reasons.push("matches your interests");
      if (tagScore > 0.3) reasons.push("matches your tags");
      if (lScore > 0.5) reasons.push("popular with users");
      if (recency > 0.7) reasons.push("trending now");
      if (sScore > 0.4 && clusterSim < 0.5) reasons.push("discovery pick for you");
      if (reasons.length === 0) reasons.push("recommended for you");

      return {
        startup: startup as Startup,
        score: Math.round(score * 1000) / 1000,
        reasons,
        is_serendipitous: sScore > 0.4 && clusterSim < 0.5,
        matched_cluster: clusterIndex,
      } as RecommendationResult;
    })
    .filter((r): r is RecommendationResult => r !== null);

  let sorted = scored.sort((a, b) => b.score - a.score);

  // Pad with trending if not enough results
  if (sorted.length < limit) {
    const needed = limit - sorted.length;
    const already = sorted.map((r) => r.startup.id);
    const trending = await getTrendingStartups(needed, [...allExcludeIds, ...already]);
    sorted = sorted.concat(trending);
  }

  return sorted.slice(0, limit);
}

// ============================================================
// TRENDING (anonymous / cold-start users)
// ============================================================

export async function getTrendingStartups(
  limit = 10,
  excludeIds: string[] = []
): Promise<RecommendationResult[]> {
  let query = supabase
    .from("startups")
    .select("id, name, slug, short_description, description, image_url, tags, funding_stage, likes, views, created_at, founder_id, profiles(full_name, avatar_url)")
    .limit(limit * 2);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: startups } = await query;
  if (!startups) return [];

  return startups
    .map((startup) => ({
      startup: startup as Startup,
      score: Math.round(
        (0.40 * likesScore(startup.likes || 0) +
          0.30 * viewsScore(startup.views || 0) +
          0.30 * recencyScore(startup.created_at)) * 1000
      ) / 1000,
      reasons: ["trending now"],
      is_serendipitous: false,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============================================================
// SIMILAR STARTUPS (startup detail pages)
// ============================================================

export async function getSimilarStartups(
  targetStartupId: string,
  limit = 6
): Promise<RecommendationResult[]> {
  const { data: target } = await supabase
    .from("startups")
    .select("id, embedding, tags")
    .eq("id", targetStartupId)
    .single();

  if (!target) return [];

  const targetEmbedding = parseEmbedding(target.embedding);
  if (!targetEmbedding) return [];

  const targetTags = target.tags || [];

  const { data: others } = await supabase
    .from("startups")
    .select("id, name, slug, short_description, description, tags, funding_stage, likes, views, created_at, embedding, image_url, founder_id, profiles(full_name, avatar_url)")
    .neq("id", targetStartupId)
    .not("embedding", "is", null)
    .limit(50);

  if (!others) return [];

  return others
    .map((startup) => {
      const embedding = parseEmbedding(startup.embedding);
      if (!embedding) return null;

      const contentSim = cosineSimilarity(embedding, targetEmbedding);
      const tagScore = tagMatchScore(startup.tags || [], targetTags);
      const score = 0.6 * contentSim + 0.4 * tagScore;

      return {
        startup: startup as Startup,
        score: Math.round(score * 1000) / 1000,
        reasons: ["similar to this startup"],
        is_serendipitous: false,
      } as RecommendationResult;
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}