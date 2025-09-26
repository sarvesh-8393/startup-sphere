// app/api/home/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/home?email=user@example.com[&query=searchText]
 *
 * Returns startups filtered by user's preferences and sorted by the
 * number of matching tags (highest matches first). Also applies optional
 * stage & location filters from preferences. If user has no preferences,
 * returns all startups (recent first).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");
    const textQuery = searchParams.get("query") ?? "";

    if (!userEmail) {
      return NextResponse.json(
        { error: "Missing required query param: email" },
        { status: 400 }
      );
    }

    // 1) Resolve profile id from email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .single();

    let prefs: { tags: string[] | null, stage: string | null, location: string | null } | null = null;
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

    // If no preferences, return all startups (optionally filtered by query)
    if (prefsError || !prefs) {
      let base = supabase
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
          profiles ( full_name, avatar_url )
        `);

      // request-level filters
      const stageFilter = searchParams.get("stage");
      const locationFilter = searchParams.get("location");
      const tagsFilter = (searchParams.get("tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (stageFilter) base = base.eq("funding_stage", stageFilter);
      if (locationFilter) base = base.eq("location", locationFilter);
      if (tagsFilter.length > 0) base = base.overlaps("tags", tagsFilter);

      // search
      if (textQuery) {
        const tokens = textQuery.split(/\s+/).map((t) => t.trim()).filter(Boolean);
        if (tokens.length > 0) base = base.ilike("name", `%${textQuery}%`).overlaps("tags", tokens);
        else base = base.ilike("name", `%${textQuery}%`);
      }

      // apply sort param
      const sortParam = (searchParams.get("sort") || "").toString();
      if (sortParam === "date_asc") {
        base = base.order("created_at", { ascending: true });
      } else if (sortParam === "date_desc") {
        base = base.order("created_at", { ascending: false });
      } else if (sortParam === "likes_asc") {
        base = base.order("likes", { ascending: true });
      } else if (sortParam === "likes_desc") {
        base = base.order("likes", { ascending: false });
      } else if (sortParam === "views_asc") {
        base = base.order("views", { ascending: true });
      } else if (sortParam === "views_desc") {
        base = base.order("views", { ascending: false });
      } else {
        // default ordering recent
        base = base.order("created_at", { ascending: false });
      }

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
      const { data: allStartups, error: allErr } = await supabase
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
          profiles ( full_name, avatar_url )
        `)
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
        `id, name, short_description, description, tags, website_url, created_at, founder_id, image_url, slug, likes, views, profiles ( full_name, avatar_url )`
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

    const tagsFilter = (searchParams.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

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
      console.error("Error fetching matched startups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute match_count in JS and sort if needed
    const startupsWithMatch = startups.map((startup: Record<string, unknown>) => {
      const matchCount = (startup.tags as string[]) ? (startup.tags as string[]).filter((tag: string) => userTags.includes(tag)).length : 0;
      return { ...startup, match_count: matchCount };
    });

    let sortedStartups = startupsWithMatch;

    if (orderByMatch) {
      sortedStartups = [...startupsWithMatch].sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.match_count as number) - (a.match_count as number));
    }

    // If no startups match preferences, return all startups with applied sorting
    if (startupsWithMatch.length === 0) {
      let allQuery = supabase
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
          profiles ( full_name, avatar_url )
        `);

      // apply sort param to fallback
      const sortParam = (searchParams.get("sort") || "").toString();
      if (sortParam === "date_asc") {
        allQuery = allQuery.order("created_at", { ascending: true });
      } else if (sortParam === "date_desc") {
        allQuery = allQuery.order("created_at", { ascending: false });
      } else if (sortParam === "likes_asc") {
        allQuery = allQuery.order("likes", { ascending: true });
      } else if (sortParam === "likes_desc") {
        allQuery = allQuery.order("likes", { ascending: false });
      } else if (sortParam === "views_asc") {
        allQuery = allQuery.order("views", { ascending: true });
      } else if (sortParam === "views_desc") {
        allQuery = allQuery.order("views", { ascending: false });
      } else {
        // default ordering recent
        allQuery = allQuery.order("created_at", { ascending: false });
      }

      const { data: allStartups, error: allErr } = await allQuery;

      if (allErr) {
        console.error("Error fetching all startups:", allErr);
        return NextResponse.json({ error: allErr.message }, { status: 500 });
      }
      return NextResponse.json(allStartups, { status: 200 });
    }

    return NextResponse.json(sortedStartups, { status: 200 });
  } catch (err: unknown) {
    console.error("Server error in /api/home:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
