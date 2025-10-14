// app/(somepath)/page.tsx  (server component)
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";


import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AllStartup from "@/components/AllStartup";
import StartupCard, { type Startup } from "@/components/StartupCard";

type Props = { searchParams?: Promise<{ query?: string; tags?: string; stage?: string; location?: string; sort?: string }> };

export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const query = sp.query ?? "";
  const tagsFilter = (sp.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const stageFilter = sp.stage || "";
  const locationFilter = sp.location || "";

  const sortParam = (sp.sort || "").toString();

  // 1) verify session on the server
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const userEmail = session.user.email;

  // 2) Check if user has preferences
  const { supabase } = await import("@/lib/supabaseClient");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (profile) {
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (!preferences) {
      // No preferences, redirect to onboarding
      redirect("/onboarding");
    }
  } else {
    // No profile, redirect to onboarding
    redirect("/onboarding");
  }

  const params = new URLSearchParams();
  params.set('email', userEmail);
  if (query) params.set('query', query);
  if (stageFilter) params.set('stage', stageFilter);
  if (locationFilter) params.set('location', locationFilter);
  if (tagsFilter.length > 0) params.set('tags', tagsFilter.join(','));
  if (sortParam) params.set('sort', sortParam);

  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  let startups: Startup[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/startup?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      startups = Array.isArray(data) ? data as Startup[] : [];
    } else {
      const text = await res.text();
      console.error('API error:', res.status, text);
    }
  } catch (err) {
    console.error('Error fetching startups:', err);
  }

  // 6) render page
  return (
    <div className="w-full min-h-full">
      <HeroSection />
      <AllStartup query={query} />
      <StartupCard startups={startups ?? []} />
    </div>
  );
}
