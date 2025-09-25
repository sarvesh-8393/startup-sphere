import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Dashboard from "@/components/Dashboard";

interface Startup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  stage: string;
  location: string;
  views: number;
  likes: number;
  created_at: string;
}

type Props = { searchParams?: Promise<{ query?: string; tags?: string; stage?: string; location?: string; sort?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const query = sp.query ?? "";
  const tagsFilter = (sp.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const stageFilter = sp.stage || "";
  const locationFilter = sp.location || "";

  const sortParam = (sp.sort || "").toString();

  // Verify session on the server
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const userEmail = session.user.email;

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
      startups = Array.isArray(data) ? data : [];
    } else {
      const text = await res.text();
      console.error('API error:', res.status, text);
    }
  } catch (err) {
    console.error('Error fetching startups:', err);
  }

  return <Dashboard startups={startups} user={session.user} />;
}
