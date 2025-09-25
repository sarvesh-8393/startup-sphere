// app/startup/[slug]/page.tsx

import Navbar from "@/components/Navbar";
import Image from "next/image";
import { LinkedinIcon, Twitter, Globe, Target, Trophy, Users, Lightbulb, Rocket, Award, TrendingUp, Heart, ExternalLink, ArrowRight, Star, Calendar, Eye } from "lucide-react";
import FollowButton from "./StartupPageClient";
import EditButton from "@/components/EditButton";
import Likes from "@/components/Likes";
import ViewTrackerClient from "./ViewTrackerClient";
import { supabase } from "@/lib/supabaseClient";


async function getStartup(slug: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        *,
        profiles (*)
      `)
      .eq('slug', slug)
      .single();
    if (error) {
      console.error('Failed to fetch startup:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch startup:", error);
    return null;
  }
}
async function follow(slug: string) {
  try {
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug: slug }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Follow failed:', errorData.error);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to follow startup:', error);
    return null;
  }
}


export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await params;
  const data = await getStartup(p.slug);
  console.log(data?.likes)

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-pink-100">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-pink-200 to-amber-200 flex items-center justify-center shadow-2xl">
          <Rocket className="w-16 h-16 text-pink-700" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">Startup Not Found</h1>
        <p className="text-gray-600 text-lg">The startup you're looking for doesn't exist.</p>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <ViewTrackerClient slug={p.slug} />
<div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl">
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center space-x-2 text-white">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="font-bold text-sm">{data.likes}</span>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Eye className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-sm">{data.views}</span>
          </div>
        </div>
      </div>
    </div>


      {/* Hero Section - Enhanced Professional Look */}
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={data.image_url}
            alt="Startup Image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
        
        </div>

  
        <div className="relative z-10 min-h-screen px-6 md:px-16 py-20 flex flex-col items-center justify-center text-center text-white">
          <div className="animate-fade-in-up max-w-6xl mx-auto">
            
            {/* Funding Stage Badge */}
     <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-amber-400 to-rose-400 backdrop-blur-sm rounded-full mb-8 border border-white/20">



              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm uppercase tracking-wide">{data.funding_stage} Stage</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black drop-shadow-2xl bg-gradient-to-r from-white via-pink-100 to-amber-100 bg-clip-text text-transparent mb-8 leading-tight">
              {data.name}
            </h1>

            <p className="text-xl md:text-3xl max-w-5xl drop-shadow-lg text-white/95 mb-12 leading-relaxed font-light">
              {data.short_description}
            </p>

           

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href={data.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-10 py-4 bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg"
              >
                Launch Website
                <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>
              {data.account_details && (
                <a
                  href={data.account_details}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-4 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-semibold rounded-full border border-white/30 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                >
                  <Heart className="w-6 h-6" />
                  Invest Now
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Scroll Indicator */}
        
      </div>

      {/* Main Content Container with improved spacing */}
      <div className="max-w-8xl mx-auto px-6 py-20 space-y-24">

        {/* Company Overview Stats Bar */}
        <section className="relative -mt-10 z-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 mx-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent">
                  {data.funding_stage}
                </div>
                <div className="text-gray-600 font-medium">Funding Stage</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent">
                  {(typeof data.tags === 'string' ? data.tags.split(',') : Array.isArray(data.tags) ? data.tags : []).length}+
                </div>
                <div className="text-gray-600 font-medium">Industry Focus Areas</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Active
                </div>
                <div className="text-gray-600 font-medium">Growth Status</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement Section - Enhanced */}
        {data.mission_statement && (
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl transform -rotate-1 shadow-xl"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-blue-100 p-12 md:p-16">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg">
                  <Lightbulb className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">Our Mission</h2>
                <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
              </div>
              <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed text-center max-w-5xl mx-auto font-medium italic">
                {data.mission_statement}
              </blockquote>
            </div>
          </section>
        )}

        {/* Problem & Solution Section - Side by Side Professional Cards */}
        {data.problem_solution && (
          <section className="grid lg:grid-cols-2 gap-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
              <div className="relative bg-white rounded-3xl shadow-xl border border-red-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-red-900">The Challenge</h3>
                    <p className="text-red-700 text-sm">What we're solving</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.problem_solution.split('Our solution:')[0]?.replace('The problem:', '').trim()}
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300"></div>
              <div className="relative bg-white rounded-3xl shadow-xl border border-green-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-900">Our Solution</h3>
                    <p className="text-green-700 text-sm">How we're changing things</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.problem_solution.split('Our solution:')[1]?.trim() || data.problem_solution}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* About & Founder Section - Enhanced Layout */}
        <section className="grid lg:grid-cols-3 gap-10">
          {/* About - Takes 2/3 width */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-amber-100 p-12 h-full">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-amber-900">Our Story</h2>
                    <p className="text-amber-700">The journey so far</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.description}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Founder Card */}
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl transform -rotate-1 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-pink-100 p-8 text-center h-full">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">👑</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-pink-900 mb-8">Leadership</h3>
                
                <div className="mb-8">
                  <div className="mx-auto w-28 h-28 rounded-2xl border-4 border-pink-200 shadow-2xl overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 relative">
                    <img
                      src={data?.profiles?.avatar_url || "/default-avatar.png"}
                      alt={`${data?.profiles?.full_name || "Founder"}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-600/20 to-transparent"></div>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-pink-800 mb-2">
                  {data?.profiles?.full_name || "Visionary Founder"}
                </h4>
                <p className="text-pink-600 text-sm font-medium mb-6">Founder & CEO</p>

                <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                  {data?.profiles?.description || "Passionate about innovation and building solutions that matter."}
                </p>

                <div className="flex justify-center gap-3">
                  <a
                    href={data?.profiles?.linkedin_url || "https://linkedin.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-700 hover:text-pink-800 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <LinkedinIcon className="w-5 h-5" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-700 hover:text-pink-800 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  {data?.profiles?.website_url && (
                    <a
                      href={data.profiles.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-700 hover:text-pink-800 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Story - Full Width Feature */}
        {data.founder_story && (
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl transform rotate-1 shadow-xl"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-purple-100 p-12 md:p-16">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-purple-900 mb-6">Origin Story</h2>
                <div className="w-32 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
              </div>
              <div className="prose prose-xl text-gray-700 leading-relaxed max-w-5xl mx-auto text-center font-medium">
                {data.founder_story}
              </div>
            </div>
          </section>
        )}

        {/* Target Market & Traction - Enhanced Cards */}
        <section className="grid lg:grid-cols-2 gap-12">
          {data.target_market && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-teal-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-teal-900">Target Market</h3>
                    <p className="text-teal-700 text-sm">Who we serve</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.target_market}
                </div>
              </div>
            </div>
          )}

          {data.traction && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-orange-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-orange-900">Growth Metrics</h3>
                    <p className="text-orange-700 text-sm">Our progress</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.traction}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Team & Investment - Professional Layout */}
        <section className="grid lg:grid-cols-2 gap-12">
          {data.team_profiles && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-indigo-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-indigo-900">Our Team</h3>
                    <p className="text-indigo-700 text-sm">The people behind the vision</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.team_profiles}
                </div>
              </div>
            </div>
          )}

          {data.use_of_funds && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-emerald-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-900">Investment Impact</h3>
                    <p className="text-emerald-700 text-sm">Where your money goes</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.use_of_funds}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Milestones & Awards */}
        <section className="grid lg:grid-cols-2 gap-12">
          {data.milestones && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-yellow-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-900">Roadmap</h3>
                    <p className="text-yellow-700 text-sm">Past wins & future goals</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.milestones}
                </div>
              </div>
            </div>
          )}

          {data.awards && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300 shadow-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-violet-100 p-10 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-violet-900">Recognition</h3>
                    <p className="text-violet-700 text-sm">Awards & accolades</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {data.awards}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Enhanced Industry Tags Section */}
        <section className="bg-gradient-to-r from-gray-50 via-pink-50 to-amber-50 rounded-3xl p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">Industry Focus & Innovation Areas</h3>
            <p className="text-gray-600 text-lg">The sectors we're transforming</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {(typeof data.tags === 'string' ? data.tags.split(',') : Array.isArray(data.tags) ? data.tags : []).map((tag: string, index: number) => (
              <span key={index} className="px-6 py-3 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-amber-50 border border-gray-200 hover:border-pink-300 rounded-2xl text-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-lg capitalize">
                {typeof tag === 'string' ? tag.trim() : String(tag)}
              </span>
            ))}
          </div>
        </section>

        {/* Enhanced Call to Action - Premium Design */}
        <section className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20"></div>
          
          {/* Animated background elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          
          <div className="relative p-16 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ready to Join Our <span className="text-yellow-300">Revolution?</span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Be part of something extraordinary. Connect with us and help shape the future of innovation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <a
                href={data.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-12 py-5 bg-white text-purple-700 font-bold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-2xl"
              >
                Explore Platform
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>
              {data.account_details && (
                <a
                  href={data.account_details}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-12 py-5 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-bold rounded-full border-2 border-white/30 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                >
                  <Heart className="w-6 h-6" />
                  Invest & Support
                </a>
              )}
            </div>
            
            {/* Action buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <FollowButton slug={data.slug} />
              <EditButton founderId={data.founder_id} slug={data.slug}/>
            </div>
            
            {/* Social proof or metrics could go here */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-white/70 text-sm">
                Join thousands of innovators and investors who believe in the future
              </p>
            </div>
          </div>
        </section>

        {/* Additional Professional Features */}
        
        {/* Company Metrics Dashboard */}
        <section className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12">
          <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent">
            Company At A Glance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-amber-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Founded</div>
              <div className="text-gray-600">2024</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Team Size</div>
              <div className="text-gray-600">Growing</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Stage</div>
              <div className="text-gray-600">{data.funding_stage}</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Market</div>
              <div className="text-gray-600">Global</div>
            </div>
          </div>
        </section>

        {/* Contact & Connect Section */}
        <section className="grid lg:grid-cols-2 gap-12">
          {/* Connect Card */}
          <div className="bg-gradient-to-br from-pink-500 to-amber-500 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-6">Let's Connect</h3>
              <p className="text-white/90 mb-8 text-lg leading-relaxed">
                Ready to discuss partnerships, investments, or just want to learn more about our journey?
              </p>
              
              <div className="space-y-4">
                <a href={`mailto:contact@${data.name.toLowerCase().replace(/\s+/g, '')}.com`} 
                   className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">📧</span>
                  </div>
                  Get in Touch
                </a>
                
                <a href={data.website_url}
                   target="_blank"
                   rel="noopener noreferrer" 
                   className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  Visit Website
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12">
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Get the latest updates on our progress, milestones, and opportunities to get involved.
            </p>
            
            <div className="space-y-4">
              <input 
                type="email"
                placeholder="Enter your email address"
                className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all text-lg"
              />
              <button className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
                Subscribe to Updates
              </button>
            </div>
            
            <p className="text-gray-500 text-sm mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}