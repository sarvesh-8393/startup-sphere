# Recommendation System - Complete Implementation Guide

**Last Updated:** March 1, 2026  
**Architecture:** K-Means Multi-Interest Clustering with Hybrid Scoring

This document provides a comprehensive overview of the AI-powered recommendation engine that powers the startup discovery platform. The system uses **K-Means clustering to discover multiple interest areas** combined with embedding-based similarity matching.

---

## Quick Start: Understanding the System

### The Problem It Solves
- Simple averaging of user interests creates a "blurry" recommendation (halfway between interests)
- Users have **multiple distinct interests**, not one averaged preference
- K-Means discovers these natural interest clusters automatically

### The Solution
1. **Cluster** user's liked startups into 1-4 natural interest groups
2. **Weight** each cluster by how many likes are in it
3. **Score** candidates across all clusters, weighted by user preference
4. **Rank** by hybrid score (35% cluster similarity + 15% tags + 30% engagement + 20% serendipity)

### Visual Example
```
User likes: 3 AI startups + 2 Fintech startups

WITHOUT K-Means (Simple Averaging):
User interest vector = avg([ai_1, ai_2, ai_3, fin_1, fin_2])
                     ↓
                  (blurry/confused)
                     ↓
Would recommend "AI-Fintech hybrid" startups equally

WITH K-Means Clustering:
Cluster 1 (AI):         centroid_ai, weight=0.60 (60%)
Cluster 2 (Fintech):    centroid_fintech, weight=0.40 (40%)
                     ↓
New AI startup: scores high (0.60 × 0.85 + 0.40 × 0.20 = 0.59)
New Fintech startup: scores lower (0.60 × 0.20 + 0.40 × 0.75 = 0.42)
                     ↓
Correctly prioritizes AI recommendations!
```

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────┐
│  Frontend (Components)                   │
│  - StartupCard (display card)           │
│  - RecommendedStartups (fetch & show)   │
│  - SimilarStartups (on detail page)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  API Routes                             │
│  - /api/recommend (personalized)        │
│  - /api/similar (detail page recs)      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Recommendation Engine                  │
│  lib/recommendation.ts                  │
│  ├─ getRecommendations()     (K-Means) │
│  ├─ getTrendingStartups()    (fallback)│
│  ├─ getSimilarStartups()     (detail)  │
│  └─ K-Means clustering logic            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Embedding & Similarity                 │
│  lib/embedding.ts                       │
│  ├─ getEmbedding()     (Google API)    │
│  ├─ cosineSimilarity() (scoring)       │
│  └─ averageVectors()   (cluster init)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)        │
│  - startups table (embedding vector)    │
│  - startup_likes table (user activity)  │
│  - profiles table (user info)           │
│  - pgvector extension (similarity ops)  │
└─────────────────────────────────────────┘
```

### Data Flow: Step by Step

```
1. USER INTERACTION (Frontend)
   └─ User clicks "Like" on a startup
      └─ POST /api/like → Saves to startup_likes table

2. FETCH RECOMMENDATIONS (When homepage loads)
   └─ GET /api/recommend?limit=6
      │
      ├─ Query: Get all user's liked startup IDs
      ├─ Query: Get embeddings for liked startups
      ├─ Process: Run K-Means clustering
      │   ├─ Decide k = min(sqrt(n_likes), 4)
      │   ├─ Initialize: random centroids
      │   ├─ Iterate: assign → update → converge
      │   ├─ Calculate: cluster weights
      │   └─ Output: centroids[], weights[]
      ├─ Query: Get candidate startups (limit*3)
      ├─ Process: Score each candidate
      │   ├─ Weighted cluster similarity (35%)
      │   ├─ Tag match score (15%)
      │   ├─ Likes score (10%)
      │   ├─ Views score (10%)
      │   ├─ Recency score (10%)
      │   ├─ Serendipity score (20%)
      │   └─ Total = weighted sum
      ├─ Sort: by score descending
      ├─ Query: Get isLiked flags for all results
      └─ Return: JSON with top K startups

3. DISPLAY (Frontend)
   └─ Render StartupCard component
      ├─ Show match score badge (top-right)
      ├─ Show heart icon if isLiked (top-left)
      ├─ Show founder name + avatar
      ├─ Show two most relevant tags
      └─ Show "matches your interests" reason
```

---

## Core Algorithms

### 1. K-Means Clustering

**Goal:** Discover natural groupings in user's liked startups

**Algorithm:**
```
Input: embeddings = [vec1, vec2, vec3, vec4, vec5]  // 5 liked startups
       k = 2                                         // Want 2 clusters
       
Step 1: INITIALIZE
  Pick 2 random vectors as starting centroids
  centroid_1 = vec1
  centroid_2 = vec3

Step 2: ASSIGN (Iteration 1)
  For each embedding, find closest centroid:
  vec1 → closest to centroid_1 → assign to cluster 1
  vec2 → closest to centroid_2 → assign to cluster 2
  vec3 → closest to centroid_1 → assign to cluster 1
  vec4 → closest to centroid_2 → assign to cluster 2
  vec5 → closest to centroid_1 → assign to cluster 1
  
  clusters = [[vec1, vec3, vec5], [vec2, vec4]]

Step 3: UPDATE (Iteration 1)
  Recompute centroid as mean of assigned vectors:
  centroid_1 = mean([vec1, vec3, vec5])
  centroid_2 = mean([vec2, vec4])

Step 4: REPEAT
  Go to Step 2, repeat until assignments don't change
  (or max 20 iterations)

Output: centroids = [centroid_1, centroid_2]
        assignments = [1, 2, 1, 2, 1]
```

**Code (lib/recommendation.ts):**
```typescript
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function kMeansClusters(vectors: number[][], k: number, maxIterations = 20): number[][] {
  if (vectors.length === 0) return [];
  if (vectors.length <= k) return vectors.map((v) => [...v]);

  const dim = vectors[0].length;

  // Initialize: pick k random vectors as centroids
  const shuffled = [...vectors].sort(() => Math.random() - 0.5);
  let centroids: number[][] = shuffled.slice(0, k).map((v) => [...v]);
  let assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // ASSIGN step: each vector → nearest centroid
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

    // Check convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    if (!changed) break;

    // UPDATE step: recompute centroids
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
```

### 2. Cluster Weight Calculation

**Goal:** Understand which interests user cares about most

**Formula:**
```
weight[i] = (# startups in cluster i) / (total # liked startups)

Example:
Cluster 0 (AI):       3 startups → weight = 3/5 = 0.60 (60%)
Cluster 1 (Fintech):  2 startups → weight = 2/5 = 0.40 (40%)
```

**Code (lib/recommendation.ts):**
```typescript
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

  // Count startups per cluster
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

  // Calculate weights
  const total = likedEmbeddings.length;
  const weights = counts.map((c) => c / total);

  return { centroids, weights };
}
```

### 3. Weighted Cluster Similarity Scoring

**Goal:** Score how well a candidate matches user's weighted interests

**Formula:**
```
weighted_score = Σ(cosineSimilarity(candidate, centroid[i]) × weight[i])

Example:
User has: [AI_centroid (weight=0.60), Fintech_centroid (weight=0.40)]

New AI Startup:
  sim_to_AI = 0.85      → 0.85 × 0.60 = 0.51
  sim_to_Fintech = 0.20 → 0.20 × 0.40 = 0.08
  total = 0.59 ← Good match!

New Fintech Startup:
  sim_to_AI = 0.20      → 0.20 × 0.60 = 0.12
  sim_to_Fintech = 0.75 → 0.75 × 0.40 = 0.30
  total = 0.42 ← OK match (user prefers AI)
```

**Code (lib/recommendation.ts):**
```typescript
function bestClusterMatch(
  embedding: number[],
  clusters: number[][],
  clusterWeights: number[]
): { score: number; clusterIndex: number } {
  let weightedScore = 0;
  let bestCluster = 0;
  let bestRawSim = 0;

  clusters.forEach((centroid, idx) => {
    const sim = cosineSimilarity(embedding, centroid);
    const weight = clusterWeights[idx] || (1 / clusters.length);
    weightedScore += sim * weight;

    if (sim > bestRawSim) {
      bestRawSim = sim;
      bestCluster = idx;
    }
  });

  return { score: weightedScore, clusterIndex: bestCluster };
}
```

### 4. Hybrid Scoring Formula

**Goal:** Combine multiple signals into one final recommendation score

**Formula:**
```
final_score = 
  0.35 × weighted_cluster_similarity +
  0.15 × tag_match +
  0.10 × likes_score +
  0.10 × views_score +
  0.10 × recency_score +
  0.20 × serendipity_score

Total: 100% (all factors weighted to sum to 1.0)
```

**Component Explanations:**

| Factor | Weight | Calculation | Purpose |
|--------|--------|-------------|---------|
| Cluster Similarity | 35% | weighted avg similarity across clusters | Main signal: semantic relevance to user |
| Tag Match | 15% | Jaccard similarity of tags | Categorical alignment |
| Likes | 10% | min(likes / 100, 1) | Social proof |
| Views | 10% | min(views / 1000, 1) | User engagement traction |
| Recency | 10% | exp(-days_old / 365) | Freshness/newness |
| Serendipity | 20% | relevance × (1 - history_similarity) | Discovery novelty |

**Example Calculation:**
```
Startup: "AI Cancer Detection Platform"

weighted_cluster_sim = 0.82 (very close to AI centroid, weighted)
tag_score = 0.70         (user likes Healthcare & AI tags)
likes = 85               → min(85/100, 1) = 0.85
views = 800              → min(800/1000, 1) = 0.80
recency = 0.92           (created 14 days ago)
serendipity = 0.35       (relevant but somewhat known)

final_score = 
  0.35 × 0.82 +    // 0.287
  0.15 × 0.70 +    // 0.105
  0.10 × 0.85 +    // 0.085
  0.10 × 0.80 +    // 0.080
  0.10 × 0.92 +    // 0.092
  0.20 × 0.35      // 0.070
  = 0.719 (71.9% match)
```

---

## Implementation Files

### lib/recommendation.ts (522 lines)

**Key Functions:**

1. **`getRecommendations(userId, limit, excludeIds, filterLiked)`**
   - Main personalized recommendations function
   - Uses K-Means clustering
   - Returns top K scored startups

2. **`getTrendingStartups(limit, excludeIds)`**
   - Fallback for cold-start users (no likes yet)
   - Scores by: 40% likes + 30% views + 30% recency
   - No personalization needed

3. **`getSimilarStartups(targetStartupId, limit)`**
   - Finds similar startups on detail pages
   - Uses: 60% embedding similarity + 40% tag match
   - No clustering (single startup, not user history)

**Helper Functions:**

- `kMeansClusters()` - Core K-Means algorithm
- `buildInterestClusters()` - Apply K-Means to user likes
- `bestClusterMatch()` - Weighted cluster scoring
- `tagMatchScore()` - Jaccard similarity on tags
- `likesScore()` - Normalize likes (0-1)
- `viewsScore()` - Normalize views (0-1)
- `recencyScore()` - Exponential decay over time
- `serendipityScore()` - Relevance × novelty bonus
- `parseEmbedding()` - Handle string/array embeddings from DB
- `decideK()` - Choose cluster count: min(√n, 4)

### lib/embedding.ts (110 lines)

**Key Functions:**

1. **`getEmbedding(text: string)`**
   - Calls Google Text Embedding API
   - Returns 768-dimensional vector
   - Rate limited: ~1500/day free tier

2. **`cosineSimilarity(a, b)`**
   - Measures angle between two vectors
   - Range: [0, 1] (1 = identical direction)

3. **`averageVectors(vectors)`**
   - Computes mean of multiple vectors
   - Used in K-Means initialization

4. **`buildStartupText(startup)`**
   - Combines all startup fields into one string
   - Fed to embedding API

### app/api/recommend/route.ts

**Endpoint:** `GET /api/recommend`

**Parameters:**
- `limit` (default 10): Number of recommendations
- `filter_liked` (default true): Exclude already-liked startups
- `exclude` (default ""): Comma-separated IDs to skip

**Implementation:**
1. Get session user
2. Call `getRecommendations()`
3. Batch query `startup_likes` to get isLiked flags
4. Annotate each startup with isLiked boolean
5. Return JSON payload

**Response:**
```json
{
  "success": true,
  "count": 6,
  "recommended": [
    {
      "id": "...",
      "name": "TechVenture AI",
      "recommendation_score": 0.87,
      "recommendation_reasons": ["matches your interests"],
      "isLiked": false,
      ...
    }
  ]
}
```

### app/api/similar/route.ts

**Endpoint:** `GET /api/similar?startupId=...`

**Implementation:**
1. Get target startup + embedding
2. Call `getSimilarStartups()`
3. Batch query isLiked flags
4. Annotate results
5. Return similar startups

---

## Frontend Components

### components/StartupCard.tsx

**Purpose:** Display a single startup in card format

**Features:**
- Match score badge (top-right): "87% match" or "<1% match"
- Heart icon (top-left): Shows if user liked it
- Founder avatar + name
- Two most relevant tags (from `.slice(0, 2)`)
- Hover effects, responsive grid

**Props:**
```typescript
interface Startup {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  image_url: string | null;
  tags: string[];
  recommendation_score?: number;  // 0-1 (decimals)
  isLiked?: boolean;              // Shown as heart icon
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}
```

**Match Score Formatting:**
```typescript
function formatMatchScore(score?: number): string {
  if (!score) return "—";
  const percentage = Math.round(score * 100);
  if (percentage === 0) return "<1%";
  return `${percentage}%`;
}
```

### components/RecommendedStartups.tsx

**Purpose:** Fetch and display recommendations on homepage

**Flow:**
1. Component mounts
2. Fetch `GET /api/recommend?limit=6&filter_liked=false`
3. Set state with recommendations
4. Render StartupCard grid
5. Show loading spinner while fetching

### components/SimilarStartups.tsx

**Purpose:** Display similar startups on detail pages

**Props:**
```typescript
interface Props {
  startupId: string;  // Target startup ID
  limit?: number;     // Default: 6
}
```

---

## Database Schema

### startups Table

```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Embedding vector (REQUIRED for recommendations)
  embedding vector(768),
  
  -- Engagement metrics
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],  -- Array: ['AI', 'Healthcare', ...]
  funding_stage TEXT,
  
  -- Relations
  founder_id UUID NOT NULL REFERENCES profiles(id),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Crucial for fast similarity search
CREATE INDEX idx_startups_embedding ON startups
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### startup_likes Table

```sql
CREATE TABLE startup_likes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  startup_id UUID NOT NULL REFERENCES startups(id),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, startup_id)  -- Prevent duplicate likes
);

CREATE INDEX idx_startup_likes_user ON startup_likes(user_id);
```

---

## Configuration

### Environment Variables Required

```bash
# Google Embedding API (REQUIRED for recommendations)
GOOGLE_EMBEDDING_API_KEY=<your-key>

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NextAuth (existing)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Creating Google Embedding API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy key to `.env.local`
4. Free tier: 1500 requests/day

### Enabling pgvector in Supabase

1. Run in Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Add embedding column:
   ```sql
   ALTER TABLE startups ADD COLUMN embedding vector(768);
   ```

3. Create index:
   ```sql
   CREATE INDEX idx_startups_embedding ON startups
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```

---

## Troubleshooting

### Problem: No Recommendations (Falls Back to Trending)

**Causes:**
1. User has no likes yet (cold-start)
2. Liked startups missing embeddings
3. Google API key not set

**Check:**
```typescript
// Verify embeddings exist
const { data } = await supabase
  .from('startups')
  .select('embedding')
  .not('embedding', 'is', null)
  .limit(1);

if (data?.length) {
  console.log('✓ Embeddings exist');
} else {
  console.log('✗ No embeddings found!');
}
```

### Problem: Match Scores Show 0%

**Cause:** Embedding parsing issue (returned as string instead of array)

**Fix:** Code already handles this via `parseEmbedding()`:
```typescript
function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}
```

### Problem: All Users Get Same Recommendations

**Check:**
1. User likes are being saved: `SELECT * FROM startup_likes WHERE user_id = ?`
2. Embeddings exist: `SELECT embedding FROM startups WHERE id = ?`
3. K-Means is computing different clusters per user

---

## Performance

### API Response Times
- `/api/recommend`: Fast (with 10+ likes)
- `/api/recommend`: Slower (cold-start, falls back to trending)
- `/api/similar`: Fast

(Actual times depend on database size and network latency)

### Database Queries Per Request
- Personalized: 4-5 queries
- Trending: 1-2 queries
- Similar: 2-3 queries

### Costs
- Google Embedding API: Free (1500/day)
- Supabase: Free tier available (used in this project)
- Network: Minimal (~100KB per request)

---

## Future Enhancements

1. **Redis Caching** - Cache trending results hourly
2. **A/B Testing** - Test different scoring weights
3. **User Feedback** - Learn from click patterns
4. **Analytics** - Track recommendation quality
5. **Implicit Clustering** - Auto-discover categories from embeddings
6. **Warm-Up** - Better cold-start for new users

