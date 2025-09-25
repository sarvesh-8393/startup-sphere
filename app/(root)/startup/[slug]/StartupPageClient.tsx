// app/startup/[slug]/StartupPageClient.tsx

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from "@/components/Navbar";
import { LinkedinIcon, Twitter, Globe, Target, Trophy, Users, Lightbulb, Rocket, Award, TrendingUp, Heart, ExternalLink, ArrowRight, Star, Calendar, Bell, Check } from "lucide-react";

interface StartupData {
  name: string;
  slug: string;
  short_description: string;
  image_url: string;
  website_url: string;
  account_details?: string;
  mission_statement?: string;
  problem_solution?: string;
  description: string;
  founder_story?: string;
  target_market?: string;
  traction?: string;
  team_profiles?: string;
  use_of_funds?: string;
  milestones?: string;
  awards?: string;
  funding_stage: string;
  tags: string | string[];
  profiles?: {
    avatar_url?: string;
    full_name?: string;
    description?: string;
    linkedin_url?: string;
    website_url?: string;
  };
}

// Follow Button Component
function FollowButton({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      alert('Please sign in to follow startups');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsFollowing(true);
        alert('Successfully following! You\'ll receive regular updates.');
      } else if (res.status === 409) {
        setIsFollowing(true);
        alert('You\'re already following this startup!');
      } else {
        alert(data.error || 'Failed to follow startup');
      }
    } catch (error) {
      console.error('Follow error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading || isFollowing}
      className={`
        group px-6 py-3 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2
        ${isFollowing 
          ? 'bg-green-500 text-white cursor-default' 
          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
        }
        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Following...
        </>
      ) : isFollowing ? (
        <>
          <Check className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 group-hover:animate-pulse" />
          Follow Us for Regular Updates
        </>
      )}
    </button>
  );
}
export default FollowButton