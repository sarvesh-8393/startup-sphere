import Navbar from "@/components/Navbar";
import Image from "next/image";
import { User, MapPin, Calendar, ExternalLink, Building2, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  description?: string;
  linkedin_url?: string;
  website_url?: string;
  location?: string;
  created_at: string;
}

interface Startup {
  id: string;
  slug: string;
  name: string;
  image_url: string;
  short_description: string;
  funding_stage: string;
  tags?: string | string[];
  likes: number;
  views: number;
  created_at: string;
}

async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}

async function getUserStartups(userId: string): Promise<Startup[]> {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('id, slug, name, image_url, short_description, funding_stage, tags, likes, views, created_at')
      .eq('founder_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch startups:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Failed to fetch startups:", error);
    return [];
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const p = await params;
  const profile = await getUserProfile(p.userId);
  const startups = await getUserStartups(p.userId);

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-pink-100">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-pink-200 to-amber-200 flex items-center justify-center shadow-2xl">
          <User className="w-16 h-16 text-pink-700" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">Profile Not Found</h1>
        <p className="text-gray-600 text-lg">The user profile you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen pt-20">

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-3xl border-4 border-pink-200 shadow-2xl overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 relative">
                <Image
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt={`Profile picture of ${profile.full_name || "User"}`}
                  width={128}
                  height={128}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-600/20 to-transparent"></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">
                {profile.full_name || "Visionary Founder"}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{startups.length} Startup{startups.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {profile.description && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6 max-w-2xl">
                  {profile.description}
                </p>
              )}

              {/* Social Links */}
              <div className="flex justify-center md:justify-start gap-3">
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 hover:text-blue-800 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-700 hover:text-pink-800 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Startups Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">
              {profile.full_name ? `${profile.full_name}'s` : 'Their'} Startups
            </h2>
            <p className="text-gray-600 text-lg">Innovative ventures building the future</p>
          </div>

          {startups.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Startups Yet</h3>
              <p className="text-gray-500">This founder hasn&apos;t launched any startups yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {startups.map((startup) => (
                <div key={startup.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={startup.image_url}
                      alt={startup.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                        {startup.funding_stage}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
                      {startup.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {startup.short_description}
                    </p>

                    {/* Tags */}
                    {startup.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(typeof startup.tags === 'string' ? startup.tags.split(',') : Array.isArray(startup.tags) ? startup.tags : []).slice(0, 2).map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-semibold rounded-lg capitalize">
                            {typeof tag === 'string' ? tag.trim() : String(tag)}
                          </span>
                        ))}
                        {(typeof startup.tags === 'string' ? startup.tags.split(',') : Array.isArray(startup.tags) ? startup.tags : []).length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                            +{(typeof startup.tags === 'string' ? startup.tags.split(',') : Array.isArray(startup.tags) ? startup.tags : []).length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{startup.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{startup.views} views</span>
                      </div>
                    </div>

                    <a
                      href={`/startup/${startup.slug}`}
                      className="w-full bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                    >
                      View Startup
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
