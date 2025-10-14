// app/api/startup/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// TypeScript interfaces
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Startup {
  id: string;
  name: string;
  short_description: string;
  description: string;
  tags: string[] | null;
  website_url: string | null;
  created_at: string;
  founder_id: string | null;
  image_url: string | null;
  slug: string | null;
  likes: number | null;
  views: number | null;
  funding_stage: string | null;
  location: string | null;
}

interface StartupWithProfile extends Startup {
  profiles: Profile[] | null;
}

interface StartupWithScore extends StartupWithProfile {
  score: number;
}

interface UserPreferences {
  tags: string[] | null;
  stage: string | null;
  location: string | null;
}

// Helper function to build base startup query
function buildBaseStartupQuery() {
  return supabase
    .from("startups")
    .select(`
      id,
      name,
      short_description,
      description,
      tags,
      website_url,
      created_at,
      founder_id,
      image_url,
      slug,
      likes,
      views,
      funding_stage,
      location,
      profiles ( full_name, avatar_url )
    `);
}

// Helper function to apply filters to query
function applyFilters(
  query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  stageFilter?: string | null,
  locationFilter?: string | null,
  tagsFilter?: string[]
) {
  let q = query;
  if (stageFilter) q = q.eq("funding_stage", stageFilter);
  if (locationFilter) q = q.eq("location", locationFilter);
  if (tagsFilter && tagsFilter.length > 0) q = q.overlaps("tags", tagsFilter);
  return q;
}

// Helper function to apply search to query
function applySearch(query: any, textQuery: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!textQuery) return query;
  const tokens = textQuery.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length > 0) {
    const curly = `{${tokens.map((t) => t.replace(/'/g, "''")).join(",")}}`;
    return query.or(`name.ilike.%${textQuery}%,tags.ov.${curly}`);
  } else {
    return query.ilike("name", `%${textQuery}%`);
  }
}

// Helper function to apply sorting to query
function applySorting(query: any, sortParam?: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (sortParam) {
    case "date_asc":
      return query.order("created_at", { ascending: true });
    case "date_desc":
      return query.order("created_at", { ascending: false });
    case "likes_asc":
      return query.order("likes", { ascending: true });
    case "likes_desc":
      return query.order("likes", { ascending: false });
    case "views_asc":
      return query.order("views", { ascending: true });
    case "views_desc":
      return query.order("views", { ascending: false });
    case "size_asc":
      return query.order("size", { ascending: true });
    case "size_desc":
      return query.order("size", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

/**
 * GET /api/home?email=user@example.com[&query=searchText]
 *
 * Returns startups filtered by user's preferences and sorted by a
 * composite score (tag matches, popularity, recency). Also applies optional
 * stage & location filters from preferences. If user has no preferences,
 * returns all startups (recent first).
 */
export async function GET(request: Request): Promise<NextResponse<StartupWithProfile[] | StartupWithScore[] | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const founderId = searchParams.get("founder_id");
    const userEmail = searchParams.get("email");
    const textQuery = searchParams.get("query") ?? "";
    const tagsFilter = (searchParams.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!founderId && !userEmail) {
      return NextResponse.json(
        { error: "Missing required query param: founder_id or email" },
        { status: 400 }
      );
    }

    // If founder_id is provided, filter by founder's startups
    if (founderId) {
      let base = buildBaseStartupQuery().eq("founder_id", founderId);

      // request-level filters
      const stageFilter = searchParams.get("stage");
      const locationFilter = searchParams.get("location");

      base = applyFilters(base, stageFilter, locationFilter, tagsFilter);

      // search
      base = applySearch(base, textQuery);

      // apply sort param
      const sortParam = searchParams.get("sort");
      base = applySorting(base, sortParam ?? undefined);

      const { data: founderStartups, error: founderErr } = await base;

      if (founderErr) {
        return NextResponse.json({ error: founderErr.message }, { status: 500 });
      }
      return NextResponse.json(founderStartups);
    }

    // If query or tags filter is provided, ignore preferences and search all startups
    if (textQuery || tagsFilter.length > 0) {
      let base = buildBaseStartupQuery();

      // request-level filters
      const stageFilter = searchParams.get("stage");
      const locationFilter = searchParams.get("location");

      base = applyFilters(base, stageFilter, locationFilter, tagsFilter);

      // search
      base = applySearch(base, textQuery);

      // apply sort param
      const sortParam = searchParams.get("sort");
      base = applySorting(base, sortParam ?? undefined);

      const { data: allStartups, error: allErr } = await base;

      if (allErr) {
        return NextResponse.json({ error: allErr.message }, { status: 500 });
      }
      return NextResponse.json(allStartups);
    }

    // 1) Resolve profile id from email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .single();

    let prefs: UserPreferences | null = null;
    let prefsError: unknown = null;
    if (profile) {
      // 2) Get user preferences
      const { data: prefsData, error: prefsErr } = await supabase
        .from("user_preferences")
        .select("tags, stage, location")
        .eq("profile_id", profile.id)
        .single();
      prefs = prefsData;
      prefsError = prefsErr;
    }

    // If no preferences, return all startups
    if (prefsError || !prefs) {
      let base = buildBaseStartupQuery();

      // request-level filters
      const stageFilter = searchParams.get("stage");
      const locationFilter = searchParams.get("location");

      base = applyFilters(base, stageFilter, locationFilter, tagsFilter);

      // search
      base = applySearch(base, textQuery);

      // apply sort param
      const sortParam = searchParams.get("sort");
      base = applySorting(base, sortParam ?? undefined);

      const { data: allStartups, error: allErr } = await base;

      if (allErr) {
        return NextResponse.json({ error: allErr.message }, { status: 500 });
      }
      return NextResponse.json(allStartups);
    }

    // 3) We have preferences: build tag array literal safely for SQL
    const userTags: string[] = prefs.tags ?? [];
    // If user has no tags, fallback to all startups (or handle differently)
    if (!userTags || userTags.length === 0) {
      // same as above: return all startups
      const { data: allStartups, error: allErr } = await buildBaseStartupQuery()
        .order("created_at", { ascending: false });

      if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });
      return NextResponse.json(allStartups);
    }

    // 4) Build query:
    //
    // - Filter to only startups that overlap on tags first (tags && userTags)
    // - Optionally filter by prefs.stage and prefs.location
    // - If textQuery is present, also filter by ilike(name, %query%)
    // - Compute match_count in JS for sorting

    // start with base select and require overlapping tags with prefs
    let dbQuery = supabase
      .from("startups")
      .select(
        `id, name, short_description, description, tags, website_url, created_at, founder_id, image_url, slug, likes, views, funding_stage, location, profiles ( full_name, avatar_url )`
      )
      .overlaps("tags", userTags);

    // apply optional stage/location filters from prefs
    if (prefs.stage) {
      dbQuery = dbQuery.eq("funding_stage", prefs.stage);
    }
    if (prefs.location) {
      dbQuery = dbQuery.eq("location", prefs.location);
    }

    // apply request-level filters (overrides/augments prefs)
    const stageFilter = searchParams.get("stage");
    const locationFilter = searchParams.get("location");

    if (stageFilter) dbQuery = dbQuery.eq("funding_stage", stageFilter);
    if (locationFilter) dbQuery = dbQuery.eq("location", locationFilter);
    if (tagsFilter.length > 0) {
      const safe = tagsFilter.map((t) => t.replace(/'/g, "''"));
      dbQuery = dbQuery.overlaps("tags", safe);
    }

    // apply search query on name or tags if provided (OR)
    if (textQuery) {
      const tokens = textQuery.split(/\s+/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length > 0) {
        const curly = `{${tokens.map((t) => t.replace(/'/g, "''")).join(",")}}`;
        dbQuery = dbQuery.or(`name.ilike.%${textQuery}%,tags.ov.${curly}`);
      } else {
        dbQuery = dbQuery.ilike("name", `%${textQuery}%`);
      }
    }

    // apply sort param
    const sortParam = (searchParams.get("sort") || "").toString();
    let orderByMatch = false;
    if (sortParam === "date_asc") {
      dbQuery = dbQuery.order("created_at", { ascending: true });
    } else if (sortParam === "date_desc") {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    } else if (sortParam === "likes_asc") {
      dbQuery = dbQuery.order("likes", { ascending: true });
    } else if (sortParam === "likes_desc") {
      dbQuery = dbQuery.order("likes", { ascending: false });
    } else if (sortParam === "views_asc") {
      dbQuery = dbQuery.order("views", { ascending: true });
    } else if (sortParam === "views_desc") {
      dbQuery = dbQuery.order("views", { ascending: false });
    } else if (sortParam === "size_asc") {
      dbQuery = dbQuery.order("size", { ascending: true });
    } else if (sortParam === "size_desc") {
      dbQuery = dbQuery.order("size", { ascending: false });
    } else {
      // Recommended default: we'll sort by match_count in JS
      orderByMatch = true;
      dbQuery = dbQuery
        .order("likes", { ascending: false })
        .order("views", { ascending: false })
        .order("created_at", { ascending: false });
    }

    const { data: startups, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute composite score in JS and sort if needed
    // Weights for composite score
    const w_tag = 0.5;
    const w_likes = 0.2;
    const w_views = 0.1;
    const w_recency = 0.2;

    // Find max likes and views for normalization
    const maxLikes = Math.max(...startups.map((s) => s.likes ?? 0));
    const maxViews = Math.max(...startups.map((s) => s.views ?? 0));

    const startupsWithScore: StartupWithScore[] = startups.map((startup) => {
      const matchCount = (startup.tags ?? []).filter((tag: string) => userTags.includes(tag)).length;
      const normalizedLikes = maxLikes > 0 ? (startup.likes ?? 0) / maxLikes : 0;
      const normalizedViews = maxViews > 0 ? (startup.views ?? 0) / maxViews : 0;
      const daysSinceCreated = (new Date().getTime() - new Date(startup.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = 1 / (daysSinceCreated + 1);
      const score = w_tag * matchCount + w_likes * normalizedLikes + w_views * normalizedViews + w_recency * recencyScore;
      return { ...startup, score };
    });

    let sortedStartups = startupsWithScore;

    if (orderByMatch) {
      sortedStartups = [...startupsWithScore].sort((a, b) => b.score - a.score);
    }

    // If no startups match preferences, score all startups instead
    if (startupsWithScore.length === 0) {
      let allQuery = buildBaseStartupQuery();

      // apply request-level filters
      allQuery = applyFilters(allQuery, stageFilter, locationFilter, tagsFilter);

      // apply search
      allQuery = applySearch(allQuery, textQuery);

      const { data: allStartups, error: allErr } = await allQuery;

      if (allErr) {
        return NextResponse.json({ error: allErr.message }, { status: 500 });
      }

      // Compute scores for all startups
      const maxLikesAll = Math.max(...allStartups.map((s) => s.likes ?? 0));
      const maxViewsAll = Math.max(...allStartups.map((s) => s.views ?? 0));

      const allWithScore: StartupWithScore[] = allStartups.map((startup) => {
        const startupTags = startup.tags ?? [];
        const matchCount = startupTags.filter((tag: string) => userTags.some((userTag: string) => userTag.toLowerCase() === tag.toLowerCase())).length;
        const normalizedLikes = maxLikesAll > 0 ? (startup.likes ?? 0) / maxLikesAll : 0;
        const normalizedViews = maxViewsAll > 0 ? (startup.views ?? 0) / maxViewsAll : 0;
        const daysSinceCreated = (new Date().getTime() - new Date(startup.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = 1 / (daysSinceCreated + 1);
        const score = w_tag * matchCount + w_likes * normalizedLikes + w_views * normalizedViews + w_recency * recencyScore;
        return { ...startup, score };
      });

      const sortedAll = [...allWithScore].sort((a, b) => b.score - a.score);
      return NextResponse.json(sortedAll, { status: 200 });
    }

    return NextResponse.json(sortedStartups, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
