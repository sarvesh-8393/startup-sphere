# Startup Discovery Platform: AI-Powered Recommendation System

**Implementation Research Documentation**  
**Version:** 1.0  
**Last Updated:** March 2026  
**Research Focus:** Multi-Interest Clustering, Hybrid Scoring, and A/B Testing Framework

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Implementation Features](#core-implementation-features)
4. [Recommendation Engine: Technical Details](#recommendation-engine-technical-details)
5. [A/B Testing Framework](#ab-testing-framework)
6. [Database Schema & Design](#database-schema--design)
7. [API Architecture](#api-architecture)
8. [Algorithms & Strategies](#algorithms--strategies)
9. [Technology Stack](#technology-stack)
10. [Setup & Installation](#setup--installation)

---

## Executive Summary

This platform implements an **AI-powered startup discovery and recommendation system** that addresses the fundamental problem of helping users find relevant startups from a large and diverse catalog. The system employs a novel **K-Means Multi-Interest Clustering** approach combined with **TF-IDF vectorization** to provide personalized recommendations.

### Key Innovation

Traditional recommendation systems average user preferences, creating "blurry" recommendations. Our implementation uses **K-Means clustering** to identify and maintain distinct interest groups, enabling accurate recommendations for users with multiple, diverse interests.

**Example:**
- User likes: 6 AI startups + 4 Fintech startups
- Traditional approach: Averages all interests → recommends "AI-Fintech hybrid" startups
- Our approach: Maintains two clusters (60% AI, 40% Fintech) → correctly prioritizes pure AI startups

### Research Components

1. **Hybrid Recommendation Engine** - Combines content-based filtering with collaborative signals
2. **Multi-Interest Modeling** - K-Means clustering for diverse user preferences
3. **A/B Testing Framework** - Comparative analysis of baseline vs. personalized recommendations
4. **Cold-Start Solution** - Engagement-based trending algorithm for new users
5. **Serendipity Injection** - Prevents filter bubbles through controlled exploration

### Primary Evaluation Metrics

- **Click-Through Rate (CTR)**
- **Like/Engagement Rate**
- **Time Spent on Platform**
- **User-Provided Ratings (1-5 scale)**
- **Diversity Score** (across recommendation clusters)

---

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────┐
│  Frontend Layer (Next.js 16 + React 19)             │
│  ├─ RecommendedStartups Component                   │
│  ├─ SimilarStartups Component                       │
│  ├─ ABTestingTracker Component                      │
│  └─ StartupCard Display Component                   │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  API Routes Layer (Next.js API Routes)              │
│  ├─ /api/recommend (Personalized Recommendations)   │
│  ├─ /api/similar (Content-Based Similarity)         │
│  ├─ /api/like (User Interaction Tracking)           │
│  ├─ /api/testing-session (A/B Test Metrics)         │
│  └─ /api/create (Startup Submission)                │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Business Logic Layer                               │
│  ├─ recommendation.ts (Core Algorithm)              │
│  │   ├─ getRecommendations() - K-Means + Hybrid    │
│  │   ├─ getTrendingStartups() - Cold-Start         │
│  │   └─ getSimilarStartups() - Content Similarity  │
│  ├─ embedding.ts (Vector Operations)                │
│  │   ├─ cosineSimilarity() - Similarity Scoring    │
│  │   └─ buildStartupText() - Feature Engineering   │
│  └─ testingSession.ts (A/B Test Management)         │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Data Layer (Supabase PostgreSQL)                   │
│  ├─ startups (metadata + engagement metrics)        │
│  ├─ startup_likes (user interaction history)        │
│  ├─ profiles (user accounts + preferences)          │
│  ├─ testing_sessions (A/B test metrics)             │
│  └─ startup_views (engagement tracking)             │
└─────────────────────────────────────────────────────┘
```

### Data Flow: User Interaction to Recommendation

```
1. USER ACTION
   └─ User likes/views startup
      ↓
2. DATA CAPTURE
   └─ POST /api/like → startup_likes table
   └─ A/B tracker → testing_sessions table
      ↓
3. RECOMMENDATION REQUEST
   └─ GET /api/recommend
      ↓
4. ALGORITHM EXECUTION
   ├─ Fetch user's liked startups
   ├─ Build TF-IDF vectors
   ├─ Run K-Means clustering (k=1-4)
   ├─ Calculate cluster weights
   ├─ Score all candidate startups
   └─ Apply hybrid scoring formula
      ↓
5. RESPONSE
   └─ Return top N recommendations with scores
      ↓
6. METRICS COLLECTION
   └─ Track clicks, time, ratings → A/B analysis
```

---

## Core Implementation Features

### 1. **Personalized Recommendations**
- **Algorithm:** K-Means Multi-Interest Clustering
- **Vectorization:** TF-IDF (Term Frequency-Inverse Document Frequency)
- **Scoring:** Hybrid model combining 4 factors
- **Cold-Start:** Trending algorithm for users with <3 likes

### 2. **A/B Testing Framework**
- **Baseline System:** Simple TF-IDF averaging
- **Experimental System:** K-Means + TF-IDF + Hybrid scoring
- **Metrics Collection:** Automated tracking via client-side component
- **Sample Size:** 20+ users per variant (40 total planned)

### 3. **Content-Based Similarity**
- **Technology:** Cosine similarity on TF-IDF vectors
- **Library:** `natural` (Node.js NLP library)
- **Use Cases:** "Similar startups" feature, content discovery

### 4. **Engagement Tracking**
- **Metrics:** Views, likes, clicks, time-on-page
- **Purpose:** Cold-start recommendations, trending calculations
- **Privacy:** Anonymous session IDs for non-authenticated users

### 5. **Serendipity Injection**
- **Purpose:** Prevent filter bubbles, increase discovery
- **Implementation:** 20-30% of recommendations from low-similarity pool
- **Scoring Boost:** Serendipitous items get normalized scores

---

## Recommendation Engine: Technical Details

### Problem Statement

**Challenge:** Users have multiple distinct interests (e.g., AI startups AND fintech startups), but simple averaging creates recommendations that match neither interest strongly.

**Solution:** K-Means clustering discovers natural interest groups and scores candidates across all clusters with weighted aggregation.

### Visual Example: The K-Means Advantage

```
WITHOUT K-Means (Simple Averaging):
┌────────────────────────────────────┐
│ User likes: 3 AI + 2 Fintech       │
│ Average vector = blurry mix        │
│ Recommendations: Mediocre matches  │
└────────────────────────────────────┘

WITH K-Means Clustering:
┌────────────────────────────────────┐
│ Cluster 1 (AI):        60% weight  │
│ Cluster 2 (Fintech):   40% weight  │
│                                    │
│ New AI startup scores:             │
│   0.60 × 0.85 + 0.40 × 0.20 = 0.59│
│                                    │
│ New Fintech startup scores:        │
│   0.60 × 0.20 + 0.40 × 0.75 = 0.42│
│                                    │
│ ✓ Correctly prioritizes AI!        │
└────────────────────────────────────┘
```

### Algorithm Pipeline

#### Step 1: Fetch User History

```typescript
// Get all startups the user has liked
const { data: userLikes } = await supabase
  .from('startup_likes')
  .select('startups(*)')
  .eq('user_id', userId);

// Cold-start: If user has < 3 likes, use trending
if (userLikes.length < 3) {
  return getTrendingStartups(limit);
}
```

#### Step 2: TF-IDF Vectorization

**Process:**
1. Extract text from startups (name, description, tags, mission, etc.)
2. Tokenize and build vocabulary across all documents
3. Calculate TF-IDF scores for each term

**Implementation:**
```typescript
import { TfIdf } from 'natural';

function buildTfIdfVectors(startups: Startup[]): Map<string, Map<string, number>> {
  const tfidf = new TfIdf();
  
  // Add each startup as a document
  startups.forEach(s => {
    const text = buildStartupText(s);
    tfidf.addDocument(text);
  });
  
  // Extract sparse vectors
  const vectors = new Map();
  startups.forEach((startup, idx) => {
    const termMap = new Map();
    tfidf.listTerms(idx).forEach(item => {
      termMap.set(item.term, item.tfidf);
    });
    vectors.set(startup.id, termMap);
  });
  
  return vectors;
}
```

**Text Features Used:**
- Startup name
- Short description
- Full description
- Mission statement
- Problem/solution description
- Target market
- Tags (categorical)

#### Step 3: K-Means Clustering

**Purpose:** Discover natural groupings in user's liked startups

**Algorithm:**
```
INPUT: N TF-IDF vectors (liked startups)
OUTPUT: K clusters with centroids and assignments

PROCESS:
1. Determine k = min(4, N) clusters
2. Initialize k random centroids
3. For each iteration (max 20):
   a. Assign each vector to nearest centroid (Euclidean distance)
   b. Recompute centroids as mean of assigned vectors
   c. If no assignments changed, converge early
4. Return cluster assignments and centroids
```

**Key Parameters:**
- `maxClusters: 4` - Maximum distinct interest groups
- `minLikes: 3` - Minimum likes required for personalization
- `maxIterations: 20` - K-Means convergence limit
- Distance metric: Euclidean distance (for dense vectors)

**Implementation:**
```typescript
function kMeans(vectors: number[][], k: number, maxIterations = 20): number[] {
  // 1. Random initialization
  let centroids = initializeRandomCentroids(vectors, k);
  let assignments = new Array(vectors.length).fill(0);
  
  // 2. Iterative refinement
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    
    // Assignment step
    vectors.forEach((v, i) => {
      const nearestCluster = argMin(centroids, c => 
        euclideanDistance(v, c)
      );
      if (assignments[i] !== nearestCluster) {
        assignments[i] = nearestCluster;
        changed = true;
      }
    });
    
    // Update step
    for (let j = 0; j < k; j++) {
      const clusterVectors = vectors.filter((_, i) => assignments[i] === j);
      if (clusterVectors.length > 0) {
        centroids[j] = meanVector(clusterVectors);
      }
    }
    
    // Convergence check
    if (!changed) break;
  }
  
  return assignments;
}
```

**Complexity:** O(N × k × d × iterations)
- N = number of liked startups
- k = number of clusters
- d = vector dimensionality (vocabulary size)
- iterations ≈ 10-20

#### Step 4: Cluster Weight Calculation

**Formula:**
```
For each cluster C:
  weight(C) = count(startups in C) / total_likes
```

**Example:**
```
User likes: 6 AI startups, 4 fintech startups
After clustering:
  Cluster 0 (AI): 6 startups → weight = 6/10 = 0.60
  Cluster 1 (Fintech): 4 startups → weight = 4/10 = 0.40
```

**Purpose:** Weights reflect user's relative interest in each topic

#### Step 5: Candidate Scoring - Hybrid Formula

**Complete Scoring Function:**

```
FINAL_SCORE = 
  0.35 × cluster_similarity_score +
  0.15 × tag_overlap_score +
  0.30 × engagement_score +
  0.20 × serendipity_bonus
```

**Component Definitions:**

1. **Cluster Similarity Score (35%)**
   ```
   cluster_similarity_score = Σ(weight(C) × cosine_sim(candidate, centroid(C)))
   ```
   - Measures content relevance across all user interest clusters
   - Weighted by user's preference distribution

2. **Tag Overlap Score (15%)**
   ```
   tag_overlap_score = |candidate.tags ∩ user_liked_tags| / |user_liked_tags|
   ```
   - Explicit categorical matching
   - Ensures some familiar categories appear

3. **Engagement Score (30%)**
   ```
   engagement_score = normalize(
     log(views + 1) × 0.3 + 
     log(likes + 1) × 0.7
   )
   ```
   - Social proof / popularity signal
   - Log scale prevents popular items from dominating
   - Likes weighted higher than views

4. **Serendipity Bonus (20%)**
   ```
   serendipity_bonus = 1.0 if randomly selected from low-similarity pool
                     = 0.0 otherwise
   ```
   - Discovery mechanism
   - Prevents filter bubbles

**Rationale for Weight Distribution:**

| Component | Weight | Purpose | Research Justification |
|-----------|--------|---------|------------------------|
| Cluster Similarity | 35% | Primary relevance | Content-based filtering foundation |
| Tag Overlap | 15% | Explicit categorization | User mental model alignment |
| Engagement | 30% | Social proof | Collaborative filtering signal |
| Serendipity | 20% | Discovery | Diversity & exploration |

#### Step 6: Serendipity Injection

**Purpose:** Introduce unexpected but potentially relevant recommendations

**Process:**
```
1. Calculate similarity scores for all candidates
2. Partition into pools:
   - HIGH similarity (top 70%)
   - LOW similarity (bottom 30%)
3. Select 20-30% of final recommendations from LOW pool
4. Normalize their scores to be competitive
5. Mark as is_serendipitous for analysis
```

**Implementation:**
```typescript
function injectSerendipity(
  scores: RecommendationScore[],
  serendipityRate = 0.25
): RecommendationScore[] {
  // Sort by similarity score
  scores.sort((a, b) => b.score - a.score);
  
  const splitPoint = Math.floor(scores.length * 0.7);
  const highSimilarity = scores.slice(0, splitPoint);
  const lowSimilarity = scores.slice(splitPoint);
  
  // Calculate how many serendipitous items to include
  const serendipitousCount = Math.floor(limit * serendipityRate);
  const regularCount = limit - serendipitousCount;
  
  // Random sample from low similarity pool
  const serendipitous = randomSample(lowSimilarity, serendipitousCount)
    .map(s => ({ ...s, is_serendipitous: true }));
  
  // Combine and re-sort
  return [...highSimilarity.slice(0, regularCount), ...serendipitous]
    .sort((a, b) => b.score - a.score);
}
```

**Research Questions:**
- Does serendipity improve long-term engagement?
- What is the optimal serendipity rate?
- Do users prefer surprising recommendations?

### Cold-Start Strategy: Trending Algorithm

**Problem:** New users have no interaction history

**Solution:** Show trending startups based on engagement metrics

**Algorithm:**
```typescript
async function getTrendingStartups(limit: number): Promise<RecommendationScore[]> {
  // Fetch startups created in last 30 days
  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .gte('created_at', thirtyDaysAgo)
    .order('likes', { ascending: false })
    .order('views', { ascending: false })
    .limit(limit * 2);
  
  // Score by engagement + recency
  const scored = startups.map(startup => {
    const likesScore = Math.log(startup.likes + 1) * 0.7;
    const viewsScore = Math.log(startup.views + 1) * 0.3;
    const recencyScore = calculateRecencyBoost(startup.created_at);
    
    const score = (likesScore + viewsScore) * recencyScore;
    
    return {
      startup,
      score,
      reasons: ['Trending in community', 'Recently launched']
    };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
```

**Recency Boost:**
```
recency_boost = 1.0 + (0.5 × (30 - days_old) / 30)

Examples:
  0 days old: 1.5× boost (brand new)
  15 days old: 1.25× boost
  30 days old: 1.0× boost (no boost)
```

---

## A/B Testing Framework

### Experimental Design

**Hypothesis:** K-Means multi-interest recommendations will outperform baseline TF-IDF recommendations in terms of user engagement and satisfaction.

**Research Question:** How much does clustering improve recommendation quality compared to simple averaging?

#### Variants

**Control (Baseline):**
- Simple TF-IDF vectorization
- Average user profile vector
- Single cosine similarity calculation
- No serendipity injection
- No engagement signals

**Treatment (Experimental):**
- TF-IDF vectorization
- K-Means clustering (k=1-4)
- Weighted multi-cluster scoring
- Hybrid scoring with 4 components
- Serendipity injection (20-30%)

#### Assignment Strategy

**Method:** Cookie-based random assignment
- First visit: Random assignment to variant
- Cookie stored: `ab_testing_session_id`
- Persistent: Same variant across sessions
- Anonymous: Works without login

**Distribution:** 50/50 split between variants

#### Sample Size Calculation

**Target:** 20 users per variant (40 total)

**Assumptions:**
- Expected effect size: Cohen's d = 0.5 (medium)
- Significance level: α = 0.05
- Statistical power: 1 - β = 0.80
- Test type: Two-tailed t-test

**Justification:** Pilot study for larger future experiments

### Metrics Collected

#### Primary Metrics

**1. Click-Through Rate (CTR)**
```
CTR = clicks_on_recommendations / recommendations_shown
```
- **Definition:** Percentage of recommendations that users click
- **Interpretation:** Higher CTR = better relevance
- **Tracking:** Client-side event on startup card click

**2. Like/Engagement Rate**
```
Engagement_Rate = likes_given / recommendations_clicked
```
- **Definition:** Percentage of clicked startups that user likes
- **Interpretation:** Higher rate = strong interest match
- **Tracking:** Server-side via /api/like endpoint

**3. Time Spent on Platform**
```
Time_Spent = Σ(visible_seconds per session)
```
- **Definition:** Total active time using the platform
- **Interpretation:** More time = more engaging recommendations
- **Tracking:** Client-side heartbeat (30s intervals)
- **Accuracy:** Only counts visible time (handles tab switching)

**4. User-Provided Ratings**
```
Rating = 1-5 scale ("How good are your recommendations?")
```
- **Definition:** Direct user satisfaction feedback
- **Interpretation:** Higher rating = better perceived quality
- **Tracking:** Random prompts (35% chance every 2 minutes)
- **Cooldown:** 10 minutes between prompts

#### Secondary Metrics

**5. Diversity Score**
```
Diversity = 1 - (largest_cluster_percentage)
```
- **Definition:** How varied are recommended startups
- **Interpretation:** Higher diversity = broader exploration
- **Example:** If 70% of recs from one cluster: diversity = 0.30

**6. Serendipity Acceptance Rate**
```
Serendipity_CTR = clicks_on_serendipitous / total_serendipitous_shown
```
- **Definition:** Do users engage with surprising recommendations?
- **Interpretation:** Validates serendipity strategy

**7. Coverage**
```
Coverage = unique_startups_recommended / total_startups_in_catalog
```
- **Definition:** How much of catalog is being shown
- **Interpretation:** Higher coverage = better exploration

### Implementation Details

#### Client-Side Tracker

**Component:** `ABTestingTracker.tsx`

**Features:**
- Automatic initialization on page load
- Invisible (no UI rendered)
- Time tracking with visibility detection
- Periodic heartbeat (30 seconds)
- Random rating prompts with cooldown
- Graceful error handling (silent failures)

**Code Structure:**
```typescript
export default function ABTestingTracker() {
  // State
  const visibleSecondsRef = useRef(0);
  
  useEffect(() => {
    // Initialize session
    postEvent({ eventType: 'init' });
    
    // Time tracking
    const secondTicker = setInterval(() => {
      if (document.visibilityState === 'visible') {
        visibleSecondsRef.current += 1;
      }
    }, 1000);
    
    // Periodic flush
    const heartbeat = setInterval(() => {
      flushTimeSpent();
    }, 30000);
    
    // Rating prompts
    const ratingTimer = setInterval(() => {
      maybeAskForRating();
    }, 120000); // Every 2 minutes
    
    // Cleanup handlers
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => flushTimeSpent(true));
    
    return () => {
      // Cleanup
      clearInterval(secondTicker);
      clearInterval(heartbeat);
      clearInterval(ratingTimer);
      flushTimeSpent(true);
    };
  }, []);
  
  return null;
}
```

**Event Types:**
- `init` - Session start
- `time_spent` - Periodic heartbeat (with delta)
- `click` - Recommendation clicked
- `like` - Startup liked
- `rating` - User rating submitted

#### Server-Side Storage

**Module:** `testingSession.ts`

**Functions:**

1. **getOrCreateTestingSessionId()**
   - Finds existing session or creates new one
   - Identifiers: user_id (authenticated) or session_id (anonymous)
   - Returns: session UUID

2. **updateTestingSessionMetrics()**
   - Incremental updates to metrics
   - Atomic operations (no race conditions)
   - Handles: clicks, likes, time_spent, rating

**Database Schema:**
```sql
CREATE TABLE testing_sessions (
  id UUID PRIMARY KEY,
  system_type TEXT CHECK (system_type IN ('baseline', 'recommendation')),
  user_id UUID REFERENCES profiles(id) NULL,
  session_id UUID NULL,
  
  -- Metrics
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT session_identifier CHECK (
    (user_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);
```

### Statistical Analysis Plan

#### Hypothesis Tests

**1. CTR Comparison**
- **Test:** Independent samples t-test
- **Null hypothesis:** μ_baseline = μ_treatment
- **Alternative:** μ_baseline ≠ μ_treatment
- **Significance level:** α = 0.05

**2. Engagement Rate Comparison**
- **Test:** Independent samples t-test
- **Assumptions:** Normal distribution, equal variances

**3. Time Spent Comparison**
- **Test:** Independent samples t-test
- **Log transform if skewed**

**4. Rating Comparison**
- **Test:** Mann-Whitney U test (ordinal data)
- **Non-parametric alternative to t-test**

**5. Diversity Score Comparison**
- **Test:** Independent samples t-test

#### Effect Size Calculations

**Cohen's d:**
```
d = (mean_treatment - mean_baseline) / pooled_standard_deviation
```

**Interpretation:**
- d = 0.2: Small effect
- d = 0.5: Medium effect
- d = 0.8: Large effect

**Expected:** d > 0.5 for primary metrics

#### Visualization Plan

**1. Metric Comparison Charts:**
- Bar charts with error bars (95% CI)
- Side-by-side for each metric
- Statistical significance markers

**2. Distribution Plots:**
- Histograms of ratings
- Box plots of time spent
- Violin plots for engagement rate

**3. Time Series:**
- Metric trends over test duration
- Cumulative engagement

**4. Cluster Analysis:**
- Treatment group only
- Number of clusters discovered per user
- Cluster weight distributions

---

## Database Schema & Design

### Entity-Relationship Diagram

```
┌─────────────┐          ┌──────────────┐
│  profiles   │──────────│   startups   │
│             │ founder  │              │
│  - id       │          │  - id        │
│  - email    │          │  - name      │
│  - name     │          │  - tags[]    │
└──────┬──────┘          │  - views     │
       │                 │  - likes     │
       │                 └───────┬──────┘
       │                         │
       │  ┌──────────────────────┘
       │  │
       ▼  ▼
┌────────────────┐      ┌─────────────────────┐
│ startup_likes  │      │ testing_sessions    │
│                │      │                     │
│ - user_id      │      │ - system_type       │
│ - startup_id   │      │ - clicks            │
│ - created_at   │      │ - likes             │
└────────────────┘      │ - time_spent        │
                        │ - rating            │
                        └─────────────────────┘
```

### Core Tables

#### `startups` Table

**Purpose:** Store all startup information and engagement metrics

**Schema:**
```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  
  -- Detailed Content
  mission_statement TEXT,
  problem_solution TEXT,
  founder_story TEXT,
  target_market TEXT,
  unique_value_proposition TEXT,
  
  -- Categorization
  tags TEXT[] DEFAULT '{}',
  funding_stage TEXT,
  
  -- Engagement Metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- Relationships
  founder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  account_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_startups_slug ON startups(slug);
CREATE INDEX idx_startups_founder_id ON startups(founder_id);
CREATE INDEX idx_startups_engagement ON startups(likes DESC, views DESC, created_at DESC);
CREATE INDEX idx_startups_tags ON startups USING GIN(tags);
CREATE INDEX idx_startups_created_at ON startups(created_at DESC);
```

**Index Rationale:**
- `slug`: Unique lookups for detail pages
- `founder_id`: List startups by founder
- `engagement`: Trending algorithm performance
- `tags`: Tag-based filtering performance
- `created_at`: Recent startups queries

#### `startup_likes` Table

**Purpose:** Track user interactions for recommendation engine

**Schema:**
```sql
CREATE TABLE startup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, startup_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_likes_user_id ON startup_likes(user_id);
CREATE INDEX idx_likes_startup_id ON startup_likes(startup_id);
CREATE INDEX idx_likes_created_at ON startup_likes(created_at DESC);
```

**Design Notes:**
- UNIQUE constraint prevents duplicate likes
- CASCADE deletes maintain referential integrity
- Indexes optimize recommendation queries

#### `testing_sessions` Table

**Purpose:** Store A/B test metrics

**Schema:**
```sql
CREATE TABLE testing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Variant assignment
  system_type TEXT NOT NULL CHECK (system_type IN ('baseline', 'recommendation')),
  
  -- Session identification
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NULL,
  session_id UUID NULL, -- For anonymous users
  
  -- Metrics
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure at least one identifier exists
  CONSTRAINT session_identifier CHECK (
    (user_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);
```

**Indexes:**
```sql
CREATE INDEX idx_testing_system_type ON testing_sessions(system_type);
CREATE INDEX idx_testing_user_id ON testing_sessions(user_id);
CREATE INDEX idx_testing_session_id ON testing_sessions(session_id);
CREATE INDEX idx_testing_created_at ON testing_sessions(created_at);
```

**Design Notes:**
- Supports both authenticated and anonymous users
- CHECK constraints ensure data validity
- NULL rating allows for users who never rate

#### `profiles` Table

**Purpose:** User accounts and founder profiles

**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core Information
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT,
  location TEXT,
  
  -- Founder Details
  experience_years INTEGER,
  previous_startups INTEGER,
  education TEXT,
  specialties TEXT[],
  funding_raised TEXT,
  
  -- Biography
  origin_story TEXT,
  career_path TEXT,
  vision TEXT,
  
  -- Social Links
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  medium_url TEXT,
  personal_website TEXT,
  contact_email TEXT,
  
  -- Tags/Keywords
  industry_tags TEXT[],
  stage_tags TEXT[],
  interest_tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Data Integrity Constraints

**1. Referential Integrity:**
- Foreign keys with CASCADE delete where appropriate
- ON DELETE SET NULL for optional relationships

**2. Data Validation:**
- CHECK constraints for enum-like fields
- CHECK constraints for numeric ranges
- NOT NULL for required fields

**3. Uniqueness:**
- UNIQUE constraints on natural keys (email, slug)
- Composite UNIQUE on relational tables (user_id, startup_id)

---

## API Architecture

### RESTful Endpoints

#### Recommendation Endpoints

##### `GET /api/recommend`

**Purpose:** Get personalized recommendations (or trending for cold-start)

**Authentication:** Optional (uses trending if not authenticated)

**Query Parameters:**
```
limit: integer (default: 10, max: 50)
  - Number of recommendations to return
  
exclude: comma-separated UUIDs (optional)
  - Startup IDs to exclude from results
  - Example: exclude=uuid1,uuid2,uuid3
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "recommended": [
    {
      "id": "uuid",
      "name": "Example Startup",
      "short_description": "AI-powered solution...",
      "description": "Full description...",
      "tags": ["AI", "SaaS", "B2B"],
      "likes": 42,
      "views": 156,
      "image_url": "https://...",
      "website_url": "https://...",
      "funding_stage": "Seed",
      "created_at": "2026-02-15T...",
      
      // Recommendation metadata
      "recommendation_score": 0.856,
      "recommendation_reasons": [
        "Similar to AI startups you liked",
        "High engagement from community",
        "Matches your interest in SaaS"
      ],
      "cluster_source": 0,
      "is_serendipitous": false,
      "isLiked": false
    }
  ]
}
```

**Algorithm Flow:**
```
1. Check authentication
2. If authenticated:
   a. Fetch user's likes
   b. If likes < 3: use trending
   c. Else: run K-Means recommendation
3. If not authenticated: use trending
4. Compute isLiked for authenticated users
5. Return results
```

**Performance:**
- Typical response time: 200-500ms
- Caching: User-specific (5-minute TTL recommended)

##### `GET /api/similar?slug={startup-slug}`

**Purpose:** Find startups similar to a specific startup

**Authentication:** Not required

**Query Parameters:**
```
slug: string (required)
  - URL slug of reference startup
  
limit: integer (default: 6)
  - Number of similar startups to return
```

**Response:** Same structure as `/api/recommend`

**Algorithm:**
- Pure content-based cosine similarity
- No personalization or engagement signals
- Used on startup detail pages

#### Interaction Endpoints

##### `POST /api/like`

**Purpose:** Toggle like status for a startup

**Authentication:** Required

**Request Body:**
```json
{
  "startupId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "liked": true,  // Current like status after toggle
  "likes": 43     // New total like count
}
```

**Side Effects:**
1. Insert/delete record in `startup_likes` table
2. Increment/decrement `startups.likes` counter
3. Invalidate recommendation cache for user
4. (Optional) Update A/B test metrics

##### `POST /api/view`

**Purpose:** Track startup view

**Authentication:** Optional

**Request Body:**
```json
{
  "startupId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Side Effects:**
1. Increment `startups.views` counter
2. (Optional) Store detailed view event

##### `POST /api/testing-session`

**Purpose:** Record A/B test metrics

**Authentication:** Not required (uses cookie for session ID)

**Request Body:**
```json
{
  "system_type": "recommendation",
  "eventType": "time_spent",
  "timeSpentDelta": 30,
  "clicksDelta": 1,
  "likesDelta": 0,
  "rating": 4
}
```

**Response:**
```json
{
  "success": true
}
```

**Event Types:**
- `init`: Session initialization
- `time_spent`: Periodic heartbeat update
- `click`: Recommendation clicked
- `like`: Startup liked
- `rating`: User rating submitted

**Implementation Notes:**
- Idempotent: Safe to call multiple times
- Uses `getOrCreateTestingSessionId()` for session management
- Atomic metric updates (no race conditions)

---

## Algorithms & Strategies

### 1. K-Means Clustering

**Category:** Unsupervised learning

**Purpose:** Discover natural interest groups in user's liked startups

**Input:** N TF-IDF vectors (liked startups)

**Output:** Cluster assignments and centroids

**Pseudocode:**
```
function kMeans(vectors, k, maxIterations):
  // Initialization
  centroids = randomSample(vectors, k)
  assignments = array of zeros
  
  // Iteration
  for iteration in 1 to maxIterations:
    changed = false
    
    // Assignment step
    for each vector v at index i:
      nearest = argmin(centroids, c => distance(v, c))
      if assignments[i] != nearest:
        assignments[i] = nearest
        changed = true
    
    // Update step
    for each cluster j:
      cluster_vectors = vectors where assignments == j
      if cluster_vectors is not empty:
        centroids[j] = mean(cluster_vectors)
    
    // Convergence check
    if not changed:
      break
  
  return assignments, centroids
```

**Key Decisions:**

1. **Number of Clusters:**
   ```
   k = min(4, number_of_likes)
   ```
   - Maximum 4 clusters (practical limit for diverse interests)
   - Adapts to user's interaction history

2. **Initialization:**
   - Random selection from data points (k-means++)
   - Ensures centroids start in data space

3. **Distance Metric:**
   - Euclidean distance for dense TF-IDF vectors
   - Formula: √(Σ(a_i - b_i)²)

4. **Convergence:**
   - Stop when no assignments change
   - Or after 20 iterations (max)

**Complexity:**
- Time: O(N × k × d × iterations)
- Space: O(N + k × d)

Where:
- N = number of liked startups (typically 3-100)
- k = number of clusters (1-4)
- d = vector dimensionality (vocabulary size, typically 100-1000)
- iterations ≈ 10-20

### 2. TF-IDF Vectorization

**Category:** Natural language processing

**Purpose:** Convert text to numerical vectors for similarity computation

**Formula:**

```
TF(term, document) = count(term in document) / total_terms_in_document

IDF(term, corpus) = log(total_documents / documents_containing_term)

TF-IDF(term, document) = TF(term, document) × IDF(term, corpus)
```

**Process:**

1. **Tokenization:**
   ```
   Input: "AI-powered SaaS platform for B2B customers"
   Output: ["ai", "powered", "saas", "platform", "b2b", "customers"]
   ```

2. **Term Frequency Calculation:**
   ```
   Document 1: "ai saas platform"
   TF(ai, doc1) = 1/3 = 0.333
   TF(saas, doc1) = 1/3 = 0.333
   TF(platform, doc1) = 1/3 = 0.333
   ```

3. **IDF Calculation:**
   ```
   Corpus: 100 documents, "ai" appears in 20
   IDF(ai) = log(100/20) = 0.699
   ```

4. **TF-IDF Scoring:**
   ```
   TF-IDF(ai, doc1) = 0.333 × 0.699 = 0.233
   ```

**Implementation:**
```typescript
import { TfIdf } from 'natural';

function buildTfIdfVectors(startups: Startup[]): Map<string, Map<string, number>> {
  const tfidf = new TfIdf();
  
  // Add documents
  startups.forEach(s => {
    const text = buildStartupText(s);
    tfidf.addDocument(text);
  });
  
  // Extract vectors
  const vectors = new Map();
  startups.forEach((startup, idx) => {
    const termMap = new Map();
    tfidf.listTerms(idx).forEach(item => {
      // Only keep terms with significant scores
      if (item.tfidf > 0.01) {
        termMap.set(item.term, item.tfidf);
      }
    });
    vectors.set(startup.id, termMap);
  });
  
  return vectors;
}
```

**Advantages:**
- Downweights common words (the, is, and)
- Highlights distinctive terms
- Sparse representation (memory efficient)

**Limitations:**
- Ignores word order
- No semantic understanding
- Vocabulary dependent

### 3. Cosine Similarity

**Category:** Vector similarity metric

**Purpose:** Measure similarity between two TF-IDF vectors

**Formula:**
```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)

Where:
  A · B = dot product = Σ(A_i × B_i)
  ||A|| = magnitude = √(Σ(A_i²))
```

**Properties:**
- Range: [-1, 1] (we use [0, 1] for TF-IDF)
- 1.0 = identical vectors
- 0.0 = orthogonal (no similarity)
- -1.0 = opposite (rare with TF-IDF)

**Implementation:**
```typescript
function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  if (vecA.size === 0 || vecB.size === 0) return 0;
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  // Calculate dot product and magnitude A
  vecA.forEach((value, term) => {
    dotProduct += value * (vecB.get(term) || 0);
    magnitudeA += value * value;
  });
  
  // Calculate magnitude B
  vecB.forEach((value) => {
    magnitudeB += value * value;
  });
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
```

**Optimization:**
- Early exit for empty vectors
- Sparse vector support (skip zero terms)
- Single pass through data

**Use Cases:**
1. Cluster similarity scoring
2. Similar startup matching
3. Baseline recommendation algorithm

### 4. Hybrid Scoring Strategy

**Category:** Multi-signal ranking

**Purpose:** Combine multiple relevance signals into final score

**Components:**

1. **Content Similarity (50% total):**
   - Cluster similarity: 35%
   - Tag overlap: 15%

2. **Collaborative Signals (30%):**
   - Engagement score (views + likes)

3. **Exploration (20%):**
   - Serendipity bonus

**Formula:**
```typescript
function calculateHybridScore(
  candidate: Startup,
  clusters: Cluster[],
  userTags: string[],
  isSerendipitous: boolean
): number {
  // 1. Cluster similarity (35%)
  const clusterScore = clusters.reduce((sum, cluster) => {
    const similarity = cosineSimilarity(candidate.vector, cluster.centroid);
    return sum + (cluster.weight * similarity);
  }, 0);
  
  // 2. Tag overlap (15%)
  const commonTags = intersection(candidate.tags, userTags);
  const tagScore = commonTags.length / Math.max(userTags.length, 1);
  
  // 3. Engagement (30%)
  const likesScore = Math.log(candidate.likes + 1);
  const viewsScore = Math.log(candidate.views + 1);
  const engagementScore = normalize(likesScore * 0.7 + viewsScore * 0.3);
  
  // 4. Serendipity (20%)
  const serendipityScore = isSerendipitous ? 1.0 : 0.0;
  
  // Weighted combination
  return (
    clusterScore * 0.35 +
    tagScore * 0.15 +
    engagementScore * 0.30 +
    serendipityScore * 0.20
  );
}
```

**Normalization:**
- Engagement scores normalized to [0, 1] range
- Log transform prevents popular items from dominating
- Each component weighted appropriately

**Tunability:**
- Weights can be adjusted based on A/B test results
- Future: Machine learning to optimize weights

### 5. Trending Algorithm

**Category:** Engagement-based ranking

**Purpose:** Cold-start recommendations for new users

**Formula:**
```
trending_score = (engagement_score × recency_boost)

Where:
  engagement_score = log(likes + 1) × 0.7 + log(views + 1) × 0.3
  recency_boost = 1.0 + (0.5 × (30 - days_old) / 30)
```

**Implementation:**
```typescript
async function getTrendingStartups(limit: number): Promise<RecommendationScore[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Fetch recent startups
  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(limit * 5); // Overfetch for scoring
  
  // Score each startup
  const scored = startups.map(startup => {
    const daysOld = daysSince(startup.created_at);
    const recencyBoost = 1.0 + (0.5 * Math.max(0, 30 - daysOld) / 30);
    
    const likesScore = Math.log(startup.likes + 1) * 0.7;
    const viewsScore = Math.log(startup.views + 1) * 0.3;
    const engagementScore = likesScore + viewsScore;
    
    const score = engagementScore * recencyBoost;
    
    return {
      startup,
      score,
      reasons: ['Trending in community', 'Recently launched']
    };
  });
  
  // Sort and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

**Design Rationale:**
- **Recency bias:** Newer startups get visibility boost
- **Engagement weighting:** Likes valued higher than views
- **Log scale:** Prevents viral items from dominating
- **Time window:** Only consider last 30 days

---

## Technology Stack

### Frontend

**Framework:** Next.js 16.1.6
- Server-side rendering (SSR)
- API routes (serverless functions)
- File-based routing
- React Server Components

**UI Library:** React 19.1.0
- Hooks for state management
- Component-based architecture
- Concurrent features

**Styling:** Tailwind CSS 4.0
- Utility-first CSS
- Responsive design
- Custom components

**Animations:** Framer Motion 12.23.22
- Smooth transitions
- Gesture handling

**Icons:** 
- Lucide React 0.544.0
- Heroicons 2.2.0

### Backend

**Runtime:** Node.js 20+

**Framework:** Next.js API Routes
- Serverless architecture
- Easy deployment
- Integrated with frontend

**Database:** Supabase (PostgreSQL)
- Open-source Firebase alternative
- Row-level security
- Real-time subscriptions
- Built-in authentication

**ORM/Client:** @supabase/supabase-js 2.56.0
- Type-safe queries
- Automatic connection pooling

**NLP Library:** Natural 8.1.0
- TF-IDF vectorization
- Tokenization
- Text processing utilities

### Authentication

**Library:** NextAuth.js 4.24.11
- Multiple providers support
- Session management
- CSRF protection

### Infrastructure

**Hosting:** Vercel (recommended)
- Automatic deployments
- Edge network
- Serverless functions at edge

**Database Hosting:** Supabase Cloud
- Managed PostgreSQL
- Automatic backups
- Connection pooling

**File Storage:** Supabase Storage
- S3-compatible
- CDN distribution

### Development Tools

**Language:** TypeScript 5.x
- Type safety
- Better IDE support
- Catch errors at compile time

**Linting:** ESLint 9.x
- Code quality enforcement
- Consistent style

**Package Manager:** npm/pnpm
- Dependency management

---

## Setup & Installation

### Prerequisites

- Node.js 20+ and npm/pnpm
- Supabase account
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd my-startup
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Variables

Create `.env.local` file:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Generate secret: openssl rand -base64 32

# Optional: Email provider (for notifications)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email
EMAIL_SERVER_PASSWORD=your_password
EMAIL_FROM=noreply@example.com
```

### 4. Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Navigate to Supabase dashboard → SQL Editor
# Copy contents of schema/schema.sql
# Execute the SQL
```

**Required Tables:**
- profiles
- startups
- startup_likes
- testing_sessions
- startup_views (optional)

**Indexes:**
All indexes defined in schema.sql for optimal performance

### 5. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 6. Build for Production

```bash
npm run build
npm run start
```

### 7. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

---

## Running A/B Tests

### Test Setup

**1. Configure Variants:**
- Baseline: Already implemented in codebase
- Treatment: K-Means recommendation (default)

**2. User Assignment:**
- Automatic via cookie
- 50/50 split
- Persistent across sessions

**3. Metrics Collection:**
- Automatic via ABTestingTracker component
- No manual intervention required

### Data Collection

**Track for minimum:**
- 2 weeks of active testing
- 20 users per variant
- 100+ interactions per variant

### Analysis

**Query A/B Test Results:**

```sql
-- Compare metrics between variants
SELECT 
  system_type,
  COUNT(*) as sessions,
  AVG(clicks) as avg_clicks,
  AVG(likes) as avg_likes,
  AVG(time_spent_seconds) as avg_time_spent,
  AVG(rating) as avg_rating
FROM testing_sessions
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY system_type;
```

**Statistical Tests:**
- Use R, Python (scipy), or statistical software
- Compare means with t-tests
- Calculate effect sizes (Cohen's d)
- Visualize with plots

---

## Key Files Reference

### Recommendation Engine
- `lib/recommendation.ts` - Core algorithm implementation
- `lib/embedding.ts` - Vector operations and similarity
- `lib/testingSession.ts` - A/B test session management

### API Routes
- `app/api/recommend/route.ts` - Personalized recommendations
- `app/api/similar/route.ts` - Similar startup matching
- `app/api/like/route.ts` - Like interaction tracking
- `app/api/testing-session/route.ts` - A/B test metrics

### Components
- `components/RecommendedStartups.tsx` - Display recommendations
- `components/ABTestingTracker.tsx` - Metrics collection
- `components/StartupCard.tsx` - Startup display card
- `components/SimilarStartups.tsx` - Similar startups widget

### Database
- `schema/schema.sql` - Complete database schema

---

## Research Paper Sections Mapping

This codebase supports the following research paper sections:

### 1. Introduction & Problem Statement
- See: [Executive Summary](#executive-summary)
- Focus: Cold-start problem, multi-interest challenge

### 2. Related Work
- TF-IDF: Classic information retrieval
- K-Means: Unsupervised clustering
- Hybrid recommenders: Combining multiple signals

### 3. Methodology
- See: [Recommendation Engine: Technical Details](#recommendation-engine-technical-details)
- See: [Algorithms & Strategies](#algorithms--strategies)

### 4. System Architecture
- See: [System Architecture](#system-architecture)
- See: [Database Schema & Design](#database-schema--design)

### 5. Implementation
- See: [Technology Stack](#technology-stack)
- See: [API Architecture](#api-architecture)

### 6. Experimental Design
- See: [A/B Testing Framework](#ab-testing-framework)

### 7. Results
- Run A/B tests and analyze metrics
- Compare baseline vs. treatment
- Statistical significance tests

### 8. Discussion & Limitations
- Filter bubble concerns (addressed via serendipity)
- Scalability (TF-IDF computation cost)
- Cold-start limitations (trending algorithm quality)

### 9. Future Work
- Embedding-based approach (replace TF-IDF)
- Deep learning for hybrid weight optimization
- Real-time updates and streaming recommendations
- Multi-modal recommendations (images, videos)

---

## Contact & Support

For questions about the implementation:
- Review code comments in key files
- Check API documentation above
- Analyze database schema
- Review A/B testing metrics

**Key Concepts to Focus On:**
1. K-Means multi-interest clustering
2. Hybrid scoring formula
3. TF-IDF vectorization
4. A/B testing methodology
5. Cold-start strategy (trending)
6. Serendipity injection

---

## License

This implementation is for research and educational purposes.

---

**Last Updated:** March 6, 2026
