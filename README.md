# Implementation Details for Recommendation Migration

This document collects the code and schema you'll need to replace the TF‑IDF engine
with an embedding‑based system.  All information is current as of March 1 2026.

---

## 1. `/api/create` route

This is the POST handler that creates a startup.  You will add your embedding call
immediately after the database insert (or before, if you prefer) so the vector
gets stored in the new column.  The existing version looks like this:

```typescript
// app/api/create/route.ts
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (profileError || !profile) {
    return new Response('Profile not found', { status: 404 });
  }

  const founder_id = profile.id;
  const formData = await req.formData();

  const getField = (key: string) => formData.get(key)?.toString().trim() || '';

  const name = getField('name');
  const short_description = getField('short_description');
  const description = getField('description');
  const website_url = getField('website_url');
  const funding_stage = getField('funding_stage');
  const account_details = getField('account_details');
  const image_url_direct = getField('image_url');
  const tags = getField('tags').split(',').map(tag => tag.trim()).filter(Boolean);

  // ...more fields omitted for brevity...

  const slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}`;
  let image_url = image_url_direct;
  // (storage upload logic omitted)

  const { error: dbError } = await supabase.from('startups').insert([
    {
      name,
      slug,
      short_description,
      description,
      website_url,
      funding_stage,
      account_details,
      image_url,
      tags,
      founder_id,
      // other properties...
    },
  ]);

  if (dbError) {
    console.error('Supabase insert error:', dbError.message);
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
  }

  // ← add embedding generation here, e.g.:
  // const embedding = await getEmbedding(`${name} ${description}`);
  // await supabase.from('startups').update({ vector: embedding }).eq('id', newlyCreatedId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

Note where the comment shows the appropriate insertion point.

---

## 2. `/api/recommend` route

This GET handler fetches liked startups and either runs the hybrid engine or
returns trending results.  Replace the internal `getRecommendations` call with a
vector‑based lookup later.

```typescript
// app/api/recommend/route.ts
import { getServerSession } from "next-auth";
import { getRecommendations, getTrendingStartups } from "@/lib/recommendation";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
  id: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const excludeParam = url.searchParams.get("exclude") || "";
    const excludeIds = excludeParam ? excludeParam.split(",") : [];

    const session = await getServerSession(authOptions);
    let recommendations: unknown[] = [];

    if (session?.user?.email) {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (userError || !userData) {
        const trending = await getTrendingStartups(limit, excludeIds);
        recommendations = trending.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
        }));
      } else {
        const typedUserData = userData as UserData;
        const recs = await getRecommendations(typedUserData.id, limit, excludeIds);
        recommendations = recs.map((rec) => ({
          ...rec.startup,
          recommendation_score: rec.score,
          recommendation_reasons: rec.reasons,
        }));
      }
    } else {
      const trending = await getTrendingStartups(limit, excludeIds);
      recommendations = trending.map((rec) => ({
        ...rec.startup,
        recommendation_score: rec.score,
        recommendation_reasons: rec.reasons,
      }));
    }

    return Response.json(
      {
        success: true,
        count: recommendations.length,
        recommended: recommendations,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendations";
    console.error("Recommendation API error:", error);
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

---

## 3. `lib/recommendation.ts`

The current file implements TF-IDF vectorization, k‑means clustering, and
scoring.  To migrate you will replace `buildTfIdfVectors`, clustering, and
content similarity with a nearest‑neighbor search over embedding vectors.  For
reference the complete current source is available in the repository.

---

## 4. `lib/supabaseClient.ts`

Supabase is initialized once; reuse the same client for any vector updates.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
});
```

---

## 5. Environment variable names

The project uses the following environment variables (values not included):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GMAIL_APP_PASSWORD=
```

You can add your Google API key variable alongside these, e.g.
`GOOGLE_EMBEDDING_API_KEY=`.

---

## 6. `startups` table schema

Here is the SQL that defines the table in `schema/schema.sql`.  To add the
vector column you would run something like:

```sql
ALTER TABLE startups
  ADD COLUMN vector float8[];      -- or `vector` type if using pgvector
```

Full existing startup columns:

- id (UUID, primary key)
- name TEXT not null
- short_description TEXT not null
- description TEXT not null
- website_url TEXT
- tags TEXT[]
- funding_stage TEXT
- account_details JSONB
- founder_id UUID references profiles(id)
- created_at TIMESTAMP
- slug TEXT
- image_url TEXT
- views INTEGER
- likes INTEGER
- mission_statement TEXT
- problem_solution TEXT
- founder_story TEXT
- target_market TEXT
- traction TEXT
- use_of_funds TEXT
- milestones TEXT
- team_profiles TEXT
- awards TEXT
- location TEXT

Adding `vector` (or `embedding`) will allow you to store the OpenAI vector
for each startup and then query with a nearest‑neighbor search.

---

With the above in hand you can implement the migration: compute an embedding
when a startup is created/updated, store it in the new column, and modify the
recommendation service to query the vector space instead of running TF‑IDF.


---
### 🔧 Troubleshooting: Empty embeddings and identical recommendations

If your personalized recommendations always fall back to trending, the logs
will typically show something like:

```
extracted liked embeddings count 0
no embeddings present on liked startups, falling back to trending
```

That means the `embedding` column for the startups the user has liked is
null.  This often happens because:

1. Those startups were created **before** the embedding generation code was
   added, so they were never backfilled.
2. The database schema might have the wrong type (see section 6 above) causing
   inserts to silently fail.

**To resolve:**

- Run a backfill script that iterates all startups lacking an embedding and
  computes/stores one (sample code in comments earlier).
- Ensure the `embedding` column has an appropriate type (`real[]` or `vector`).
- Verify future insertions succeed by checking the server log on creation.

Once vectors are present the `getRecommendations` path will compute real
`embeddingSim` values and the recommendations become unique to each user.

Good luck with the rewrite!  Let me know if you need help with the embedding
queries or schema migration commands.
