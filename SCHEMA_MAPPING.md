# Schema Mapping: From Algorithms to Database

Maps each algorithm component to exact Supabase tables/columns.

---

## 1. CONTENT SIMILARITY MODULE → Supabase Schema

### 1.1 Startup Document Construction

| Algorithm | Supabase Table | Column | Notes |
|-----------|---|---|---|
| $D_i$ (text document) | `startups` | `name` | Startup name |
| | `startups` | `tags` | TEXT[] array |
| | `startups` | `short_description` | Brief description |
| | `startups` | `mission_statement` | Mission text |
| | `startups` | `problem_solution` | Problem statement |
| | `startups` | `target_market` | Target market |

**Query:**
```sql
SELECT name, tags, short_description, mission_statement, 
       problem_solution, target_market
FROM startups;
```

### 1.2 User Profile Vector

| Algorithm | Source | Notes |
|-----------|---|---|
| $L_u$ (liked startups) | `startup_likes` table | **MUST CREATE** |
| $L_u$ query | `startup_likes` | Join with `startups` to get vectors |

**Query:**
```sql
SELECT startup_id 
FROM startup_likes 
WHERE user_id = $1;
```

---

## 2. TRUST SCORE MODULE → Supabase Schema

### 2.1 Profile Completeness

| Algorithm Component | Source Table | Columns | SQL Check |
|---|---|---|---|
| full_name | `profiles` | `full_name` | `full_name IS NOT NULL` |
| avatar | `profiles` | `avatar_url` | `avatar_url IS NOT NULL` |
| email | `profiles` | `email` | `email IS NOT NULL` |
| role | `profiles` | `role` | `role IS NOT NULL` |
| location | `profiles` | `location` | `location IS NOT NULL` |
| experience | `profiles` | `experience_years` | `experience_years IS NOT NULL` |
| education | `profiles` | `education` | `education IS NOT NULL` |
| LinkedIn | `profiles` | `linkedin_url` | `linkedin_url IS NOT NULL` |

**Query:**
```sql
SELECT 
  CAST(
    COALESCE(CAST(full_name IS NOT NULL AS INT), 0) +
    COALESCE(CAST(avatar_url IS NOT NULL AS INT), 0) +
    COALESCE(CAST(email IS NOT NULL AS INT), 0) +
    COALESCE(CAST(role IS NOT NULL AS INT), 0) +
    COALESCE(CAST(location IS NOT NULL AS INT), 0) +
    COALESCE(CAST(experience_years IS NOT NULL AS INT), 0) +
    COALESCE(CAST(education IS NOT NULL AS INT), 0) +
    COALESCE(CAST(linkedin_url IS NOT NULL AS INT), 0)
  AS FLOAT) / 8.0 AS profile_completeness
FROM profiles
WHERE id = (SELECT founder_id FROM startups WHERE id = $1);
```

### 2.2 External Links Score

| Algorithm | Source | Columns |
|---|---|---|
| LinksCount | `profiles` | `linkedin_url`, `github_url`, `twitter_url`, `personal_website` |

**Query:**
```sql
SELECT 
  LEAST(
    COALESCE(CAST(linkedin_url IS NOT NULL AS INT), 0) +
    COALESCE(CAST(github_url IS NOT NULL AS INT), 0) +
    COALESCE(CAST(twitter_url IS NOT NULL AS INT), 0) +
    COALESCE(CAST(personal_website IS NOT NULL AS INT), 0),
    2
  )::FLOAT / 2.0 AS external_links_score
FROM profiles
WHERE id = (SELECT founder_id FROM startups WHERE id = $1);
```

### 2.3 Engagement Score

| Algorithm | Source | Columns |
|---|---|---|
| likes | `startups` | `likes` |
| views | `startups` | `views` |

**Query:**
```sql
SELECT 
  LEAST(
    COALESCE(likes, 0)::FLOAT / 100.0 +
    COALESCE(views, 0)::FLOAT / 1000.0,
    1.0
  ) AS engagement_score
FROM startups
WHERE id = $1;
```

### 2.4 Account Age Score

| Algorithm | Source | Column |
|---|---|---|
| age_days | `startups` | `created_at` |

**Query:**
```sql
SELECT 
  1.0 - EXP(-1.0 * EXTRACT(EPOCH FROM (NOW() - created_at)) / (180 * 86400)) 
  AS account_age_score
FROM startups
WHERE id = $1;
```

### 2.5 Composite Trust Score (Complete Query)

```sql
WITH completeness AS (
  SELECT 
    CAST(
      COALESCE(CAST(full_name IS NOT NULL AS INT), 0) +
      COALESCE(CAST(avatar_url IS NOT NULL AS INT), 0) +
      COALESCE(CAST(email IS NOT NULL AS INT), 0) +
      COALESCE(CAST(role IS NOT NULL AS INT), 0) +
      COALESCE(CAST(location IS NOT NULL AS INT), 0) +
      COALESCE(CAST(experience_years IS NOT NULL AS INT), 0) +
      COALESCE(CAST(education IS NOT NULL AS INT), 0) +
      COALESCE(CAST(linkedin_url IS NOT NULL AS INT), 0)
    AS FLOAT) / 8.0 AS value
  FROM profiles
  WHERE id = (SELECT founder_id FROM startups WHERE id = $1)
),
external_links AS (
  SELECT 
    LEAST(
      COALESCE(CAST(linkedin_url IS NOT NULL AS INT), 0) +
      COALESCE(CAST(github_url IS NOT NULL AS INT), 0) +
      COALESCE(CAST(twitter_url IS NOT NULL AS INT), 0) +
      COALESCE(CAST(personal_website IS NOT NULL AS INT), 0),
      2
    )::FLOAT / 2.0 AS value
  FROM profiles
  WHERE id = (SELECT founder_id FROM startups WHERE id = $1)
),
engagement AS (
  SELECT 
    LEAST(
      COALESCE(likes, 0)::FLOAT / 100.0 +
      COALESCE(views, 0)::FLOAT / 1000.0,
      1.0
    ) AS value
  FROM startups
  WHERE id = $1
),
account_age AS (
  SELECT 
    1.0 - EXP(-1.0 * EXTRACT(EPOCH FROM (NOW() - created_at)) / (180 * 86400)) 
    AS value
  FROM startups
  WHERE id = $1
)
SELECT 
  0.25 * c.value +
  0.25 * el.value +
  0.25 * e.value +
  0.25 * aa.value AS trust_score
FROM completeness c, external_links el, engagement e, account_age aa;
```

---

## 3. USER INTENT DETECTION → Supabase Schema

### 3.1 Behavior Signal Tracking

**Currently NOT tracked in schema.** Need event table:

```sql
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view_payment', 'create_startup', 'like_startup', 'follow_startup'
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.2 Intent Signals (Workaround without event table)

Infer from existing data:

| Intent | Signal | SQL |
|---|---|---|
| investor | Views/follows many startups | `COUNT(*) FROM startup_likes WHERE user_id = $1` |
| founder | Created startups | `COUNT(*) FROM startups WHERE founder_id = $1` |
| explorer | Likes without owning | `COUNT(*) FROM startup_likes WHERE user_id = $1 AND NOT EXISTS(SELECT 1 FROM startups WHERE founder_id = $1 AND id = startup_id)` |

**Fallback Query:**
```sql
SELECT 
  COALESCE((SELECT COUNT(*) FROM startup_likes WHERE user_id = $1), 0) AS signal_investor,
  COALESCE((SELECT COUNT(*) FROM startups WHERE founder_id = $1), 0) AS signal_founder,
  COALESCE((SELECT COUNT(*) FROM startup_likes WHERE user_id = $1), 0) AS signal_explorer;
```

---

## 4. TAG PREFERENCE MATCHING → Supabase Schema

| Algorithm | Source | Column |
|---|---|---|
| $T_u$ (user tags) | `user_preferences` | `tags` (TEXT[]) |
| $T_s$ (startup tags) | `startups` | `tags` (TEXT[]) |

**Jaccard Query:**
```sql
SELECT 
  (SELECT COUNT(*) FROM UNNEST(up.tags) AS t WHERE t = ANY(s.tags))::FLOAT /
  (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(array_cat(up.tags, s.tags))) AS u) 
  AS tag_match
FROM user_preferences up
JOIN profiles p ON up.profile_id = p.id
CROSS JOIN startups s
WHERE p.id = $1 AND s.id = $2;
```

---

## 5. INTENT ATTRIBUTE VECTORS → Supabase Schema

| Attribute | Computation | Source Columns |
|---|---|---|
| `has_traction` | `likes > 10 OR views > 100` | `startups.likes`, `startups.views` |
| `is_earlystage` | `funding_stage IN ('Idea', 'Seed', 'Pre-seed')` | `startups.funding_stage` |
| `is_trending` | `AccountAgeScore > 0.7` | `startups.created_at` |

**Query:**
```sql
SELECT 
  CASE WHEN COALESCE(likes, 0) > 10 OR COALESCE(views, 0) > 100 THEN 1 ELSE 0 END AS has_traction,
  CASE WHEN funding_stage IN ('Idea', 'Seed', 'Pre-seed') THEN 1 ELSE 0 END AS is_earlystage,
  CASE WHEN (1.0 - EXP(-1.0 * EXTRACT(EPOCH FROM (NOW() - created_at)) / (180 * 86400))) > 0.7 THEN 1 ELSE 0 END AS is_trending
FROM startups
WHERE id = $1;
```

---

## 6. RECENCY SCORE → Supabase Schema

| Algorithm | Source | Column |
|---|---|---|
| $\text{Recency}(s)$ | `startups` | `created_at` |

**Query:**
```sql
SELECT 
  1.0 - EXP(-1.0 * EXTRACT(EPOCH FROM (NOW() - created_at)) / (365 * 86400)) 
  AS recency_score
FROM startups
WHERE id = $1;
```

---

## 7. COLD START HANDLING → Supabase Schema

| Case | SQL Check | Source |
|---|---|---|
| User has no likes | `COUNT(*) FROM startup_likes WHERE user_id = $1 = 0` | `startup_likes` |
| User has preferences | `user_preferences IS NOT NULL` | `user_preferences` |
| Fallback data | Return trending | Sort by `TrustScore + Recency` |

---

## 8. EXCLUSION RULES → Supabase Schema

**Exclude from recommendations:**

1. Already liked:
```sql
startup_id IN (SELECT startup_id FROM startup_likes WHERE user_id = $1)
```

2. User's own startups:
```sql
founder_id = $1
```

---

## 9. TABLE CREATION STATEMENTS

### 9.1 Create startup_likes (if missing)

```sql
CREATE TABLE IF NOT EXISTS startup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

CREATE INDEX idx_startup_likes_user ON startup_likes(user_id);
CREATE INDEX idx_startup_likes_startup ON startup_likes(startup_id);
```

### 9.2 (Optional) Create user_actions for future intent tracking

```sql
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view_payment', 'create_startup', 'like_startup', 'follow_startup')),
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_actions_user ON user_actions(user_id);
CREATE INDEX idx_user_actions_type ON user_actions(action_type);
```

---

## 10. SUMMARY TABLE

| Algorithm Module | Primary Table | Key Columns |
|---|---|---|
| Content (TF-IDF) | `startups` | name, tags, short_description, mission_statement, problem_solution, target_market |
| User Profile | `startup_likes` | user_id, startup_id |
| Trust Score | `profiles`, `startups` | full_name, avatar_url, role, location, linkedin_url, github_url, twitter_url, personal_website, likes, views, created_at |
| User Intent | `startups`, (future) `user_actions` | founder_id, (action_type) |
| Tag Matching | `user_preferences`, `startups` | tags (both) |
| Recency | `startups` | created_at |

---

## 11. DATA VALIDATION CHECKLIST

Before implementation, verify:

- [ ] `profiles` table has ≥ 1 complete record
- [ ] `startups` table has ≥ 5 records with tags
- [ ] `user_preferences` table is populated
- [ ] `startup_likes` table exists (CREATE if missing)
- [ ] All foreign keys are valid

---

**Version:** 1.0  
**Date:** 2026-01-25  
**Status:** Ready for Implementation
