'use client';

import { useState } from 'react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, Heart } from "lucide-react";
import EditButton from "@/components/EditButton";

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
        group px-4 py-2 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm
        ${isFollowing
          ? 'bg-green-500 text-white cursor-default'
          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
        }
        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Following...
        </>
      ) : isFollowing ? (
        <>
          <Check className="w-3 h-3" />
          Following
        </>
      ) : (
        <>
          <Bell className="w-3 h-3 group-hover:animate-pulse" />
          Follow
        </>
      )}
    </button>
  );
}

// Like Button Component
function LikeButton({ slug, currentLikes, onLike, onLikeSuccess }: { slug: string; currentLikes: number; onLike: (newLikes: number) => void; onLikeSuccess?: () => void }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Check if user has already liked on mount
  React.useEffect(() => {
    if (session?.user?.email && !hasLoaded) {
      const checkLikeStatus = async () => {
        try {
          const res = await fetch(`/api/like?slug=${slug}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await res.json();
          if (res.ok) {
            setIsLiked(data.isLiked);
          }
        } catch (error) {
          console.error('Error checking like status:', error);
        } finally {
          setHasLoaded(true);
        }
      };

      checkLikeStatus();
    } else {
      setHasLoaded(true);
    }
  }, [session?.user?.email, slug, hasLoaded]);

  const handleLike = async () => {
    if (!session) {
      alert('Please sign in to like startups');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (res.ok) {
        const wasLiked = isLiked;
        setIsLiked(data.isLiked);
        onLike(data.likes);
        
        // Show notification only when liking (not unliking)
        if (!wasLiked && data.isLiked) {
          setShowNotification(true);
          onLikeSuccess?.();
          setTimeout(() => setShowNotification(false), 3000);
        }
      } else {
        alert(data.error || 'Failed to like startup');
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`group px-4 py-2 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm shadow-lg ${
          isLiked
            ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
            : 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isLiked ? 'Unliking...' : 'Liking...'}
          </>
        ) : (
          <>
            <Heart className={`w-4 h-4 transition-all ${
              isLiked ? 'fill-white' : ''
            }`} />
            {isLiked ? 'Liked' : 'Like'} ({currentLikes})
          </>
        )}
      </button>

      {/* Bouncing Notification */}
      {showNotification && (
        <div 
          onClick={() => {
            const element = document.getElementById('similar-startups');
            element?.scrollIntoView({ behavior: 'smooth' });
            setShowNotification(false);
          }}
          className="fixed bottom-8 right-8 z-50 cursor-pointer animate-bounce"
        >
          <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="text-2xl">✨</div>
            <div>
              <div className="font-bold">More startups like this!</div>
              <div className="text-sm opacity-90">Click to explore</div>
            </div>
            <div className="text-xl">→</div>
          </div>
        </div>
      )}
    </>
  );
}

// Hero Buttons Component
function HeroButtons({ slug, founderId, currentUserId, initialLikes }: { slug: string; founderId: string; currentUserId: string | null; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);

  return (
    <>
      <div className="absolute top-4 left-4 z-20">
        <EditButton founderId={founderId} slug={slug} />
      </div>
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <LikeButton 
          slug={slug} 
          currentLikes={likes} 
          onLike={setLikes}
          onLikeSuccess={() => {
            // Called when user likes (not unlike)
          }}
        />
        <FollowButton slug={slug} />
      </div>
    </>
  );
}

export { FollowButton, LikeButton, HeroButtons };
export default FollowButton;
