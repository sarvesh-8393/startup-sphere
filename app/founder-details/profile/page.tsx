'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Award,
  Globe,
  ExternalLink,
  Edit,
  User,
  Trophy,
  Users,
  Lightbulb,
  Target,
  Wallet,
  ChevronLeft,
  Mail,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type ProfileData = {
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  location: string;
  experience_years: number;
  previous_startups: number;
  education: string;
  specialties: string[];
  funding_raised: string;
  origin_story: string;
  career_path: string;
  vision: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  medium_url: string;
  personal_website: string;
  contact_email: string;
  awards: string[];
  press_links: string[];
  featured_projects: string[];
  industry_tags: string[];
  stage_tags: string[];
  interest_tags: string[];
};

export default function FounderProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const email = searchParams.get('email');
  const id = searchParams.get('id');

  const fetchProfile = useCallback(async () => {
    if (!email && !id) {
      setError('No email or ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (id) params.append('id', id);

      const response = await fetch(`/api/founder-details?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      if (data.profile) {
        setProfile(data.profile);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [email, id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEdit = () => {
    router.push('/founder-details');
  };

  const handleBack = () => {
    router.back();
  };

  const isOwnProfile = session?.user?.email === email;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto'></div>
          <p className='mt-4 text-pink-900 font-medium'>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto px-4'>
          <div className='bg-white p-8 rounded-xl shadow-sm border border-pink-100'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Profile Not Found</h2>
            <p className='text-gray-600 mb-6'>{error}</p>
            <button
              onClick={handleBack}
              className='inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-pink-600 to-yellow-500 text-white rounded-lg hover:from-pink-700 hover:to-yellow-600 transition-all font-medium shadow-md hover:shadow-lg'
            >
              <ChevronLeft className='w-4 h-4 mr-2' />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-50'>
      {/* Navigation Bar */}
      <nav className='bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50'>
        <div className='max-w-6xl mx-auto px-6 py-4 flex items-center justify-between'>
          <button
            onClick={handleBack}
            className='inline-flex items-center text-gray-600 hover:text-pink-600 transition-colors font-medium'
          >
            <ArrowLeft className='w-5 h-5 mr-2' />
            Back
          </button>
          {isOwnProfile && (
            <button
              onClick={handleEdit}
              className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-yellow-500 text-white rounded-lg hover:from-pink-700 hover:to-yellow-600 transition-all font-medium shadow-md hover:shadow-lg'
            >
              <Edit className='w-4 h-4 mr-2' />
              Edit Profile
            </button>
          )}
        </div>
      </nav>

      <main className='max-w-6xl mx-auto px-6 py-12'>
        {/* Hero Section */}
        <div className='bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mb-8'>
          <div className='h-32 bg-gradient-to-r from-pink-500 via-yellow-400 to-pink-500'></div>
          <div className='px-8 pb-8'>
            <div className='flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6'>
              <div className='flex flex-col md:flex-row md:items-end gap-6'>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`${profile.full_name}'s avatar`}
                    className='w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg'
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className='w-32 h-32 bg-gradient-to-br from-pink-100 to-yellow-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg'>
                    <User className='w-16 h-16 text-pink-400' />
                  </div>
                )}
                <div className='mb-2'>
                  <h1 className='text-4xl font-bold text-gray-900 mb-1'>
                    {profile.full_name}
                  </h1>
                  <p className='text-xl text-gray-600 mb-2'>{profile.role}</p>
                  <p className='text-gray-500 flex items-center'>
                    <MapPin className='w-4 h-4 mr-1.5' />
                    {profile.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-6 pt-6 border-t border-pink-100'>
              <div className='text-center md:text-left'>
                <div className='text-3xl font-bold bg-gradient-to-r from-pink-600 to-yellow-500 bg-clip-text text-transparent mb-1'>
                  {profile.experience_years || 0}
                </div>
                <p className='text-sm text-gray-500 font-medium'>Years Experience</p>
              </div>
              <div className='text-center md:text-left'>
                <div className='text-3xl font-bold bg-gradient-to-r from-pink-600 to-yellow-500 bg-clip-text text-transparent mb-1'>
                  {profile.previous_startups || 0}
                </div>
                <p className='text-sm text-gray-500 font-medium'>Startups Founded</p>
              </div>
              {profile.funding_raised && (
                <div className='text-center md:text-left'>
                  <div className='text-2xl font-bold bg-gradient-to-r from-pink-600 to-yellow-500 bg-clip-text text-transparent mb-1'>
                    {profile.funding_raised}
                  </div>
                  <p className='text-sm text-gray-500 font-medium'>Funding Raised</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column */}
          <div className='lg:col-span-2 space-y-8'>
            {/* About Section */}
            {(profile.origin_story || profile.career_path || profile.vision) && (
              <div className='bg-white rounded-xl shadow-sm border border-pink-100 p-8'>
                <h2 className='text-2xl font-semibold text-gray-900 mb-6 flex items-center'>
                  <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center mr-3'>
                    <Sparkles className='w-5 h-5 text-pink-600' />
                  </div>
                  About
                </h2>
                <div className='space-y-6'>
                  {profile.origin_story && (
                    <div>
                      <h3 className='text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3'>Origin Story</h3>
                      <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>{profile.origin_story}</p>
                    </div>
                  )}
                  {profile.career_path && (
                    <div>
                      <h3 className='text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3'>Career Path</h3>
                      <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>{profile.career_path}</p>
                    </div>
                  )}
                  {profile.vision && (
                    <div>
                      <h3 className='text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3'>Vision</h3>
                      <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>{profile.vision}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Achievements */}
            {((profile.awards && profile.awards.length > 0) || 
              (profile.featured_projects && profile.featured_projects.length > 0) || 
              (profile.press_links && profile.press_links.length > 0)) && (
              <div className='bg-white rounded-xl shadow-sm border border-pink-100 p-8'>
                <h2 className='text-2xl font-semibold text-gray-900 mb-6 flex items-center'>
                  <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center mr-3'>
                    <Trophy className='w-5 h-5 text-yellow-600' />
                  </div>
                  Achievements
                </h2>
                <div className='space-y-6'>
                  {profile.awards && profile.awards.length > 0 && (
                    <div>
                      <h3 className='text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3'>Awards</h3>
                      <div className='space-y-2'>
                        {profile.awards.map((award, index) => (
                          <div key={index} className='flex items-start'>
                            <Award className='w-4 h-4 mr-3 mt-0.5 text-pink-400 flex-shrink-0' />
                            <span className='text-gray-700'>{award}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.featured_projects && profile.featured_projects.length > 0 && (
                    <div>
                      <h3 className='text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3'>Featured Projects</h3>
                      <div className='space-y-2'>
                        {profile.featured_projects.map((project, index) => (
                          <div key={index} className='flex items-start'>
                            <Target className='w-4 h-4 mr-3 mt-0.5 text-yellow-400 flex-shrink-0' />
                            <span className='text-gray-700'>{project}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.press_links && profile.press_links.length > 0 && (
                    <div>
                      <h3 className='text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3'>Press Coverage</h3>
                      <div className='space-y-2'>
                        {profile.press_links.map((link, index) => (
                          <a key={index} href={link} target='_blank' rel='noopener noreferrer'
                            className='flex items-center text-gray-600 hover:text-pink-600 transition-colors group'>
                            <Globe className='w-4 h-4 mr-3 text-pink-400 group-hover:text-pink-600' />
                            <span className='truncate'>{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className='space-y-8'>
            {/* Contact & Links */}
            <div className='bg-white rounded-xl shadow-sm border border-pink-100 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center mr-2'>
                  <Globe className='w-4 h-4 text-pink-600' />
                </div>
                Connect
              </h2>
              <div className='space-y-3'>
                {profile.email && (
                  <a href={`mailto:${profile.email}`}
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <Mail className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>Email</span>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target='_blank' rel='noopener noreferrer'
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <Globe className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>LinkedIn</span>
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target='_blank' rel='noopener noreferrer'
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <Globe className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>Twitter</span>
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target='_blank' rel='noopener noreferrer'
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <Globe className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>GitHub</span>
                  </a>
                )}
                {profile.medium_url && (
                  <a href={profile.medium_url} target='_blank' rel='noopener noreferrer'
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <Globe className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>Medium</span>
                  </a>
                )}
                {profile.personal_website && (
                  <a href={profile.personal_website} target='_blank' rel='noopener noreferrer'
                    className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 transition-colors'>
                    <ExternalLink className='w-4 h-4 mr-3 text-pink-400' />
                    <span className='text-sm font-medium'>Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Education & Specialties */}
            <div className='bg-white rounded-xl shadow-sm border border-pink-100 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center mr-2'>
                  <Lightbulb className='w-4 h-4 text-yellow-600' />
                </div>
                Expertise
              </h2>
              {profile.education && (
                <div className='mb-4'>
                  <p className='text-xs font-semibold text-pink-600 uppercase tracking-wider mb-2'>Education</p>
                  <p className='text-gray-700'>{profile.education}</p>
                </div>
              )}
              {profile.specialties && profile.specialties.length > 0 && (
                <div>
                  <p className='text-xs font-semibold text-pink-600 uppercase tracking-wider mb-3'>Specialties</p>
                  <div className='flex flex-wrap gap-2'>
                    {profile.specialties.map((specialty, index) => (
                      <span key={index} className='bg-gradient-to-r from-pink-100 to-yellow-100 text-pink-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-pink-200'>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {((profile.industry_tags && profile.industry_tags.length > 0) ||
              (profile.stage_tags && profile.stage_tags.length > 0) ||
              (profile.interest_tags && profile.interest_tags.length > 0)) && (
              <div className='bg-white rounded-xl shadow-sm border border-pink-100 p-6'>
                <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center mr-2'>
                    <Target className='w-4 h-4 text-pink-600' />
                  </div>
                  Interests
                </h2>
                <div className='space-y-4'>
                  {profile.industry_tags && profile.industry_tags.length > 0 && (
                    <div>
                      <p className='text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2'>Industries</p>
                      <div className='flex flex-wrap gap-2'>
                        {profile.industry_tags.map((tag, index) => (
                          <span key={index} className='bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full border border-yellow-200'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.stage_tags && profile.stage_tags.length > 0 && (
                    <div>
                      <p className='text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2'>Stages</p>
                      <div className='flex flex-wrap gap-2'>
                        {profile.stage_tags.map((tag, index) => (
                          <span key={index} className='bg-pink-50 text-pink-700 text-xs font-medium px-3 py-1 rounded-full border border-pink-200'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.interest_tags && profile.interest_tags.length > 0 && (
                    <div>
                      <p className='text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2'>Focus Areas</p>
                      <div className='flex flex-wrap gap-2'>
                        {profile.interest_tags.map((tag, index) => (
                          <span key={index} className='bg-gradient-to-r from-pink-50 to-yellow-50 text-pink-700 text-xs font-medium px-3 py-1 rounded-full border border-pink-200'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}